import { Router, type Response } from 'express';
import { store } from '../services/store';
import { chatWithContext } from '../services/gemini';
import { authRequired, type AuthRequest } from '../middleware/pythonAuth';
import { logger } from '../services/logger';

export const chatRouter = Router();

chatRouter.post('/:investigationId', authRequired, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const detail = store.getInvestigationDetail(req.params.investigationId);
  if (!detail) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }

  try {
    const context = {
      timeline: detail.timeline,
      entities: detail.entities,
      contradictions: detail.contradictions,
      evidence: detail.evidence,
    };

    const response = await chatWithContext(message, context);

    res.json({
      success: true,
      data: {
        message: response.message,
        relatedEntities: detail.entities,
        relatedEvents: detail.timeline,
        suggestedQuestions: response.suggestedQuestions,
      },
    });
  } catch (error: any) {
    logger.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Chat failed',
    });
  }
});
