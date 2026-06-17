import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import {
  getUserActiveSubscription,
  getUserSubscriptions,
  getUserInvoices,
} from '../services/payment/subscription.service';
import { getUserPlan, PLANS } from '../services/payment/plan.service';
import logger from '../config/logger';

const prisma = new PrismaClient();
const router = Router();
const subscriptionLimiter = createRateLimiter(60 * 1000, 30, 'Too many subscription requests');

router.use(authenticate);
router.use(subscriptionLimiter);

router.get('/', async (req: Request, res: Response) => {
  try {
    const subscriptions = await getUserSubscriptions(req.user!.userId);
    res.json({ subscriptions });
  } catch (error) {
    logger.error('List subscriptions error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

router.get('/active', async (req: Request, res: Response) => {
  try {
    const subscription = await getUserActiveSubscription(req.user!.userId);

    const plan = getUserPlan({
      role: (req.user as any).role || 'user',
      proExpiresAt: (req.user as any).proExpiresAt || null,
    });

    res.json({
      subscription,
      plan: {
        id: plan.id,
        name: plan.name,
        features: plan.features,
        price: plan.price,
      },
    });
  } catch (error) {
    logger.error('Get active subscription error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get active subscription' });
  }
});

router.get('/plans', (_req: Request, res: Response) => {
  const plans = Object.values(PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    features: p.features,
    stripePriceId: p.stripePriceId || null,
  }));
  res.json({ plans });
});

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const invoices = await getUserInvoices(req.user!.userId, limit);
    res.json({ invoices });
  } catch (error) {
    logger.error('List invoices error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to list invoices' });
  }
});

export default router;
