import { Request, Response, NextFunction } from 'express';
import { getUserPlan, checkResolutionAllowed, checkExportLimit } from '../services/payment/plan.service';
import prisma from '@/lib/prisma';

declare global {
  namespace Express {
    interface Request {
      userPlan?: {
        planId: string;
        watermark: boolean;
        features: Record<string, unknown>;
      };
    }
  }
}

export function attachPlan(req: Request, _res: Response, next: NextFunction): void {
  if (req.user) {
    const plan = getUserPlan({
      role: (req.user as any).role || 'user',
      proExpiresAt: (req.user as any).proExpiresAt || null,
    });
    req.userPlan = {
      planId: plan.id,
      watermark: plan.features.watermark,
      features: plan.features as unknown as Record<string, unknown>,
    };
  }
  next();
}

export function requireResolution(resolution: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const allowed = checkResolutionAllowed(
      { role: (req.user as any).role, proExpiresAt: (req.user as any).proExpiresAt },
      resolution,
    );

    if (!allowed) {
      res.status(403).json({
        error: 'Upgrade to Pro to export at this resolution',
        upgradeRequired: true,
        requiredPlan: 'pro',
      });
      return;
    }

    next();
  };
}

export async function requireExportLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dailyCount = await prisma.export.count({
    where: {
      userId: req.user!.userId,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const { allowed, limit } = checkExportLimit(
    { role: (req.user as any).role, proExpiresAt: (req.user as any).proExpiresAt },
    dailyCount,
  );

  if (!allowed) {
    res.status(429).json({
      error: `Daily export limit reached (${limit}). Upgrade to Pro for more.`,
      upgradeRequired: true,
      requiredPlan: 'pro',
      limit,
      used: dailyCount,
    });
    return;
  }

  next();
}

export async function requireProjectLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) return next();

  const role = (req.user as any).role || 'user';
  if (role === 'pro' || role === 'admin') {
    next();
    return;
  }

  const projectCount = await prisma.project.count({
    where: { userId: req.user!.userId },
  });

  if (projectCount >= 3) {
    res.status(403).json({
      error: 'Free plan limited to 3 projects. Upgrade to Pro for unlimited projects.',
      upgradeRequired: true,
      requiredPlan: 'pro',
    });
    return;
  }

  next();
}
