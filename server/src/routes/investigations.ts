import { Router, type Response } from 'express';
import { store } from '../services/store';
import { z } from 'zod';
import { authRequired, authOptional, type AuthRequest } from '../middleware/pythonAuth';

export const investigationsRouter = Router();

// List all investigations (optional auth: filter by user if logged in)
investigationsRouter.get('/', authOptional, (req: AuthRequest, res: Response) => {
  const investigations = store.listInvestigations(req.user?.id);
  res.json({ success: true, data: investigations });
});

// Create investigation (auth required)
investigationsRouter.post('/', authRequired, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.message });
  }

  const investigation = store.createInvestigation(
    result.data.title,
    result.data.description,
    req.user?.id,
  );
  res.status(201).json({ success: true, data: investigation });
});

// Get investigation detail (auth optional)
investigationsRouter.get('/:id', authOptional, (req: AuthRequest, res: Response) => {
  const detail = store.getInvestigationDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }
  res.json({ success: true, data: detail });
});

// Delete all investigations (auth required)
investigationsRouter.delete('/', authRequired, (_req: AuthRequest, res: Response) => {
  store.clearAll();
  res.json({ success: true, data: { cleared: true } });
});

// Delete investigation by ID (auth required)
investigationsRouter.delete('/:id', authRequired, (req: AuthRequest, res: Response) => {
  const deleted = store.deleteInvestigation(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }
  res.json({ success: true, data: { deleted: true } });
});

// Update investigation (auth required)
investigationsRouter.patch('/:id', authRequired, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['draft', 'active', 'analyzing', 'complete', 'archived']).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.message });
  }

  const inv = store.getInvestigation(req.params.id);
  if (!inv) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }

  if (result.data.title) inv.title = result.data.title;
  if (result.data.description !== undefined) inv.description = result.data.description;
  if (result.data.status) inv.status = result.data.status;
  inv.updatedAt = new Date().toISOString();

  res.json({ success: true, data: inv });
});
