import { Router, type Response } from 'express';
import { store } from '../services/store';
import { analyzeEvidence } from '../services/gemini';
import { mockAnalyze } from '../services/mockAnalysis';
import { authRequired, type AuthRequest } from '../middleware/pythonAuth';
import { logger } from '../services/logger';

export const analyzeRouter = Router();

// Analyze evidence in an investigation (auth required)
analyzeRouter.post('/:investigationId', authRequired, async (req: AuthRequest, res: Response) => {
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
  let geminiRetries = 0;
  let geminiRateLimited = false;
  let geminiErrorLabel: string | undefined;

  try {
    // Gemini is the primary path — try it first with retries
    logger.info(`Starting Gemini analysis for ${req.params.investigationId} (${evidence.length} files)`);
    result = await analyzeEvidence(evidence);
    geminiRetries = result.retryCount;
    geminiRateLimited = result.rateLimited;
    logger.info(
      `Gemini analysis completed in ${result.processingTimeMs}ms` +
      (result.retryCount > 0 ? ` (${result.retryCount} retries)` : '')
    );
  } catch (geminiError: any) {
    // Extract metadata from enriched error
    geminiRetries = (geminiError as any).retryCount || 0;
    geminiRateLimited = (geminiError as any).wasRateLimited || false;
    geminiErrorLabel = (geminiError as any).classification || 'unknown';

    // Fall back to mock analysis
    logger.warn(
      `Gemini analysis failed after ${geminiRetries} retries, using mock fallback. ` +
      `Error: ${geminiError.message?.substring(0, 150)}`
    );
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
      geminiRetryCount: geminiRetries,
      geminiRateLimited,
      geminiError: geminiErrorLabel,
    },
  });
});

// Get analysis results (auth required)
analyzeRouter.get('/:investigationId', authRequired, (req: AuthRequest, res: Response) => {
  const data = store.getExtractedData(req.params.investigationId);
  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'No analysis results found. Run analysis first.',
    });
  }
  res.json({ success: true, data });
});
