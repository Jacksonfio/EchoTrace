import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../services/logger';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'echotrace-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string };
}

/** Require a valid JWT token. Calls Python auth service, falls back to local JWT in dev. */
export async function authRequired(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const token = authHeader.split(' ')[1];

  // Try Python auth service first
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        req.user = result.data;
        next();
        return;
      }
    }
  } catch {
    logger.warn('Python auth service unreachable, using local JWT validation');
  }

  // Fallback: local JWT validation (works in dev, shares same secret)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/** Optionally attach user if a valid token is present. */
export async function authOptional(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { next(); return; }
  const token = authHeader.split(' ')[1];

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success) req.user = result.data;
    }
  } catch {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
      req.user = decoded;
    } catch { /* no auth */ }
  }
  next();
}
