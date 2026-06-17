import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import { createCheckoutSession, createPortalSession, handleWebhook } from '../services/payment/stripe.service';
import { createPreference, handleWebhook as handleMPWebhook, verifyWebhookSignature } from '../services/payment/mercadopago.service';
import { PLANS } from '../services/payment/plan.service';
import logger from '../config/logger';

const router = Router();
const paymentLimiter = createRateLimiter(60 * 1000, 20, 'Too many payment requests');

// Stripe checkout
router.post('/create-checkout', authenticate, paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { priceId, billingType } = req.body;

    if (!priceId) {
      res.status(400).json({ error: 'priceId is required' });
      return;
    }

    const successUrl = `${req.headers.origin}/dashboard/settings?tab=billing&checkout=success`;
    const cancelUrl = `${req.headers.origin}/dashboard/upgrade?canceled=true`;

    const result = await createCheckoutSession(
      req.user!.userId,
      priceId,
      successUrl,
      cancelUrl,
      billingType || 'monthly',
    );

    res.json(result);
  } catch (error) {
    logger.error('Create checkout error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe portal
router.post('/portal', authenticate, paymentLimiter, async (req: Request, res: Response) => {
  try {
    const returnUrl = `${req.headers.origin}/dashboard/settings?tab=billing`;

    const result = await createPortalSession(req.user!.userId, returnUrl);
    res.json(result);
  } catch (error) {
    logger.error('Create portal error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Mercado Pago preference
router.post('/mp-preference', authenticate, paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { plan, billingType } = req.body;

    if (!plan || !PLANS[plan]) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const successUrl = `${req.headers.origin}/dashboard/settings?tab=billing&checkout=success`;
    const cancelUrl = `${req.headers.origin}/dashboard/upgrade?canceled=true`;

    const result = await createPreference(
      req.user!.userId,
      req.user!.email || '',
      plan,
      billingType || 'monthly',
      successUrl,
      cancelUrl,
    );

    res.json(result);
  } catch (error) {
    logger.error('Create MP preference error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

// Stripe webhook (raw body is captured before JSON parsing in app.ts)
router.post('/webhook', createRateLimiter(60 * 1000, 60, 'Too many webhook requests'), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ error: 'Missing raw body' });
      return;
    }

    const result = await handleWebhook(rawBody, signature);
    res.json(result);
  } catch (error) {
    logger.error('Stripe webhook error', { error: (error as Error).message });
    res.status(400).json({ error: (error as Error).message });
  }
});

// Mercado Pago webhook
router.post('/mp-webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const requestId = req.headers['x-request-id'] as string;
    const rawBody = JSON.stringify(req.body);

    if (signature) {
      const valid = await verifyWebhookSignature(rawBody, signature, requestId);
      if (!valid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    await handleMPWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    logger.error('Mercado Pago webhook error', { error: (error as Error).message });
    res.status(200).json({ received: true });
  }
});

export default router;
