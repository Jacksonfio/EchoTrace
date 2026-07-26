import { Router, type Request, type Response } from 'express';
import { store } from '../services/store';
import { analyzeEvidence } from '../services/gemini';
import { mockAnalyze } from '../services/mockAnalysis';

export const analyzeRouter = Router();

// Analyze evidence in an investigation
analyzeRouter.post('/:investigationId', async (req: Request, res: Response) => {
  const inv = store.getInvestigation(req.params.investigationId);
  if (!inv) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }

  const evidence = store.getInvestigationEvidence(req.params.investigationId);
  if (evidence.length === 0) {
    return res.status(400).json({ success: false, error: 'No evidence to analyze' });
  }

  // Update status
  store.updateInvestigationStatus(req.params.investigationId, 'analyzing');

  let result;
  let usedMock = false;

  try {
    // Try Gemini first
    result = await analyzeEvidence(evidence);
  } catch (geminiError: any) {
    // If Gemini fails (rate limit, quota, etc.), fall back to mock analysis
    console.warn('Gemini analysis failed, using mock fallback:', geminiError.message?.substring(0, 100));
    const startTime = Date.now();
    result = {
      data: mockAnalyze(evidence),
      processingTimeMs: Date.now() - startTime,
    };
    usedMock = true;
  }

  // Store extracted data
  store.setExtractedData(req.params.investigationId, result.data);

  res.json({
    success: true,
    data: {
      investigationId: req.params.investigationId,
      extractedData: result.data,
      processingTimeMs: result.processingTimeMs,
      usedMockAnalysis: usedMock,
    },
  });
});

// Get analysis results
analyzeRouter.get('/:investigationId', (req: Request, res: Response) => {
  const data = store.getExtractedData(req.params.investigationId);
  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'No analysis results found. Run analysis first.',
    });
  }
  res.json({ success: true, data });
});
