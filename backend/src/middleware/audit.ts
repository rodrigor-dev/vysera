import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { createAuditLog } from '../services/audit.service';

export function auditLog(action: string, entityType?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    const startTime = Date.now();

    res.json = function (body: unknown) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      if (statusCode >= 400) {
        logger.warn('Request failed', {
          action,
          method: req.method,
          path: req.path,
          statusCode,
          duration,
          ip: req.ip,
          userId: req.user?.userId,
        });
      }

      if (req.user && statusCode < 400) {
        createAuditLog({
          userId: req.user.userId,
          action,
          entityType,
          entityId: req.params.id,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode,
            duration,
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch((err) => {
          logger.error('Failed to create audit log', { error: (err as Error).message });
        });
      }

      if (statusCode >= 500) {
        logger.error('Server error', {
          action,
          method: req.method,
          path: req.path,
          statusCode,
          duration,
          ip: req.ip,
          userId: req.user?.userId,
        });
      }

      return originalJson(body);
    };

    next();
  };
}

export function securityAudit(
  type: string,
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    logger.warn('Security event', {
      type,
      severity,
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
      userAgent: req.headers['user-agent'],
    });
    next();
  };
}
