import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { investigationsRouter } from './routes/investigations';
import { analyzeRouter } from './routes/analyze';
import { chatRouter } from './routes/chat';
import { uploadRouter } from './routes/upload';
import { seedRouter } from './routes/seed';
import { store } from './services/store';
import { logger } from './services/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/investigations', investigationsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/seed', seedRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Initialize store and start server
async function start() {
  try {
    await store.init();
    logger.info('Database initialized successfully');

    app.listen(PORT, () => {
      logger.info(`EchoTrace AI server running on http://localhost:${PORT}`);
      console.log(`\n🔍 EchoTrace AI server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Python auth: http://localhost:8000/signin\n`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
