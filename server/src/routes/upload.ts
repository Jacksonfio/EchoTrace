import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../services/store';
import type { EvidenceType } from '../../../shared/types';
import { z } from 'zod';

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'application/pdf',
      'text/plain',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export const uploadRouter = Router();

// Upload evidence file
uploadRouter.post('/:investigationId', upload.single('file'), (req: Request, res: Response) => {
  const inv = store.getInvestigation(req.params.investigationId);
  if (!inv) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }

  const file = req.file;
  const evidenceType = (req.body.type || inferType(file.mimetype));

  const evidence = {
    id: uuidv4(),
    investigationId: req.params.investigationId,
    type: evidenceType,
    name: req.body.name || file.originalname,
    description: req.body.description || undefined,
    fileUrl: `/uploads/${file.filename}`,
    filePath: file.path,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };

  store.addEvidence(req.params.investigationId, evidence);

  res.status(201).json({ success: true, data: evidence });
});

// Upload multiple files
uploadRouter.post('/:investigationId/batch', upload.array('files', 10), (req: Request, res: Response) => {
  const inv = store.getInvestigation(req.params.investigationId);
  if (!inv) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files provided' });
  }

  const evidenceItems = files.map(file => ({
    id: uuidv4(),
    investigationId: req.params.investigationId,
    type: inferType(file.mimetype),
    name: file.originalname,
    fileUrl: `/uploads/${file.filename}`,
    filePath: file.path,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  }));

  for (const ev of evidenceItems) {
    store.addEvidence(req.params.investigationId, ev);
  }

  res.status(201).json({ success: true, data: evidenceItems });
});

function inferType(mimeType: string): EvidenceType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'text';
  return 'screenshot';
}
