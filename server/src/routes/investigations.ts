import { Router, type Request, type Response } from 'express';
import { store } from '../services/store';
import { z } from 'zod';

export const investigationsRouter = Router();

// List all investigations
investigationsRouter.get('/', (_req: Request, res: Response) => {
  const investigations = store.listInvestigations();
  res.json({ success: true, data: investigations });
});

// Create investigation
investigationsRouter.post('/', (req: Request, res: Response) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.message });
  }

  const investigation = store.createInvestigation(result.data.title, result.data.description);
  res.status(201).json({ success: true, data: investigation });
});

// Get investigation detail
investigationsRouter.get('/:id', (req: Request, res: Response) => {
  const detail = store.getInvestigationDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }
  res.json({ success: true, data: detail });
});

// Delete all investigations
investigationsRouter.delete('/', (_req: Request, res: Response) => {
  store.clearAll();
  res.json({ success: true, data: { cleared: true } });
});

// Delete investigation by ID
investigationsRouter.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteInvestigation(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }
  res.json({ success: true, data: { deleted: true } });
});

// Update investigation
investigationsRouter.patch('/:id', (req: Request, res: Response) => {
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
