import { Router, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../services/store';
import type { EvidenceType } from '../../../shared/types';
import { authRequired, type AuthRequest } from '../middleware/pythonAuth';

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
      'application/pdf',
      'text/plain',
      'application/json',
      'video/mp4',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export const uploadRouter = Router();

// Upload single evidence file (auth required)
uploadRouter.post('/:investigationId', authRequired, upload.single('file'), (req: AuthRequest, res: Response) => {
  const inv = store.getInvestigation(req.params.investigationId);
  if (!inv) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }

  const file = req.file;
  const evidence = {
    id: uuidv4(),
    investigationId: req.params.investigationId,
    type: (req.body.type || inferType(file.mimetype)) as EvidenceType,
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

// Upload multiple files (auth required)
uploadRouter.post('/:investigationId/batch', authRequired, upload.array('files', 10), (req: AuthRequest, res: Response) => {
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
    type: inferType(file.mimetype) as EvidenceType,
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
  if (mimeType.startsWith('video/')) return 'video_frame';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'text';
  return 'screenshot';
}
