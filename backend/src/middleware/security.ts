import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { sanitizeObject } from '../utils/sanitize';
import logger from '../config/logger';

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  if (req.query) {
    const sanitizedQuery: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        sanitizedQuery[key] = value.replace(/[<>"'&]/g, '');
      } else {
        sanitizedQuery[key] = value;
      }
    }
    (req.query as Record<string, unknown>) = sanitizedQuery;
  }
  next();
}

export function sqlInjectionPrevention(req: Request, res: Response, next: NextFunction): void {
  const sqlPatterns = /(\b(select|insert|update|delete|drop|alter|create|truncate|exec|union|--|;)\b)/gi;

  function checkValue(value: unknown): boolean {
    if (typeof value === 'string') {
      return sqlPatterns.test(value);
    }
    if (value !== null && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some(checkValue);
    }
    return false;
  }

  if (req.body && checkValue(req.body)) {
    logger.warn('SQL injection attempt blocked', {
      ip: req.ip,
      path: req.path,
    });
    res.status(400).json({ error: 'Invalid input detected' });
    return;
  }

  next();
}

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export function createRateLimiter(windowMs: number, max: number, message?: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message || 'Too many requests, please try again later' },
  });
}

export const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many login attempts, please try again later');

export const apiLimiter = createRateLimiter(60 * 1000, 60, 'Too many API requests');

export function bruteForceProtection(maxAttempts: number, windowMs: number) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of attempts.entries()) {
      if (value.resetAt <= now) {
        attempts.delete(key);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const record = attempts.get(key);

    if (record && record.resetAt > now) {
      if (record.count >= maxAttempts) {
        logger.warn('Brute force attack detected', { ip: req.ip, path: req.path });
        res.status(429).json({ error: 'Too many attempts, please try again later' });
        return;
      }
      record.count++;
    } else {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
    }

    next();
  };
}

export function requestSizeLimit(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBytes) {
      res.status(413).json({ error: 'Request entity too large' });
      return;
    }
    next();
  };
}
