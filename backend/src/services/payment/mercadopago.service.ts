import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '@/config/logger';
import { createSubscription, updateSubscription, createInvoice, syncUserRole } from './subscription.service';

const prisma = new PrismaClient();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

interface MPPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface MPSubscriptionResponse {
  id: string;
  status: string;
  date_created: string;
  last_modified: string;
  next_payment_date?: string;
}

export async function createPreference(
  userId: string,
  email: string,
  plan: 'pro' | 'enterprise',
  billingType: 'monthly' | 'annual',
  successUrl: string,
  cancelUrl: string,
): Promise<{ initPoint: string; preferenceId: string }> {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('Mercado Pago access token not configured');
  }

  const { PLANS } = await import('./plan.service');
  const planConfig = PLANS[plan];
  if (!planConfig) throw new Error('Invalid plan');

  const amount = billingType === 'annual' ? planConfig.price.annual : planConfig.price.monthly;

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: `Vysera ${planConfig.name} - ${billingType === 'annual' ? 'Annual' : 'Monthly'}`,
          description: planConfig.description,
          quantity: 1,
          currency_id: 'USD',
          unit_price: amount / 100,
        },
      ],
      payer: { email },
      back_urls: {
        success: successUrl,
        failure: cancelUrl,
        pending: cancelUrl,
      },
      auto_return: 'approved',
      notification_url: `${process.env.API_URL || 'http://localhost:4000'}/api/payments/mp-webhook`,
      metadata: { userId, plan, billingType },
      purpose: 'subscription',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error('Mercado Pago preference creation failed', { error: err });
    throw new Error('Failed to create Mercado Pago preference');
  }

  const data = (await response.json()) as MPPreferenceResponse;

  return {
    initPoint: data.init_point,
    preferenceId: data.id,
  };
}

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  requestId: string,
): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET) {
    const token = process.env.MP_WEBHOOK_TOKEN;
    if (token) {
      const parts = signature.split('|');
      if (parts.length < 2) return false;
      const ts = parts[0];
      const hash = parts[1];
      const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
      const expected = crypto.createHmac('sha256', token).update(manifest).digest('hex');
      return hash === expected;
    }
    return true;
  }

  const expected = crypto
    .createHmac('sha256', MP_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function handleWebhook(body: Record<string, unknown>): Promise<void> {
  try {
    const action = body.action as string;
    const data = body.data as Record<string, unknown> | undefined;
    const type = body.type as string;

    logger.info('Mercado Pago webhook received', { action, type, dataId: data?.id });

    switch (type) {
      case 'payment':
        await handlePaymentNotification(data as Record<string, unknown>);
        break;
      case 'subscription_preapproval':
        await handleSubscriptionNotification(data as Record<string, unknown>);
        break;
      case 'subscription_authorized_payment':
        await handleAuthorizedPayment(data as Record<string, unknown>);
        break;
      default:
        logger.debug('Unhandled Mercado Pago event', { type, action });
    }
  } catch (error) {
    logger.error('Mercado Pago webhook handler error', { error: (error as Error).message });
  }
}

async function handlePaymentNotification(data: Record<string, unknown> | undefined): Promise<void> {
  if (!data?.id) return;

  const paymentId = data.id as string;
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });

  if (!response.ok) return;

  const payment = await response.json();
  const userId = payment.metadata?.userId as string | undefined;
  if (!userId) return;

  if (payment.status === 'approved') {
    const amount = Math.round((payment.transaction_amount || 0) * 100);
    const plan = (payment.metadata?.plan as string) || 'pro';

    await createInvoice({
      userId,
      provider: 'mercadopago',
      providerInvoiceId: paymentId,
      amount,
      currency: payment.currency_id?.toLowerCase() || 'usd',
      status: 'paid',
      description: `Mercado Pago payment ${paymentId}`,
      paymentMethod: payment.payment_type_id,
      paidAt: new Date(payment.date_approved || Date.now()),
    });

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await createSubscription(
      userId,
      'mercadopago',
      `mp-sub-${userId}`,
      payment.payer?.id?.toString() || '',
      plan,
      'active',
      new Date(),
      periodEnd,
    );
  }
}

async function handleSubscriptionNotification(
  data: Record<string, unknown> | undefined,
): Promise<void> {
  if (!data?.id) return;

  const preapprovalId = data.id as string;
  const response = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } },
  );

  if (!response.ok) return;

  const preapproval = await response.json();
  const userId = preapproval.metadata?.userId as string | undefined;
  if (!userId) return;

  const statusMap: Record<string, 'active' | 'canceled' | 'past_due'> = {
    authorized: 'active',
    paused: 'past_due',
    cancelled: 'canceled',
    pending: 'past_due',
  };

  const status = statusMap[preapproval.status] || 'past_due';
  const plan = (preapproval.metadata?.plan as string) || 'pro';

  await createSubscription(
    userId,
    'mercadopago',
    preapprovalId,
    preapproval.payer_id?.toString() || '',
    plan,
    status,
    preapproval.next_payment_date ? new Date(preapproval.next_payment_date) : undefined,
    undefined,
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      mpSubscriptionId: preapprovalId,
      mpCustomerId: preapproval.payer_id?.toString(),
      role: status === 'active' ? 'pro' : 'user',
      ...(status === 'active' && {
        proExpiresAt: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : undefined,
      }),
    },
  });

  logger.info('Mercado Pago subscription synced', { preapprovalId, userId, status });
}

async function handleAuthorizedPayment(
  data: Record<string, unknown> | undefined,
): Promise<void> {
  if (!data?.id) return;

  const authorizedPaymentId = data.id as string;
  const response = await fetch(
    `https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`,
    { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } },
  );

  if (!response.ok) return;

  const payment = await response.json();
  const sub = await prisma.subscription.findFirst({
    where: { provider: 'mercadopago', providerSubscriptionId: payment.preapproval_id?.toString() },
  });

  if (!sub) return;

  await createInvoice({
    userId: sub.userId,
    subscriptionId: sub.id,
    provider: 'mercadopago',
    providerInvoiceId: authorizedPaymentId,
    amount: Math.round((payment.transaction_amount || 0) * 100),
    currency: payment.currency_id?.toLowerCase() || 'usd',
    status: payment.status === 'approved' ? 'paid' : 'failed',
    description: `Recurring payment ${authorizedPaymentId}`,
    paidAt: payment.status === 'approved' ? new Date() : undefined,
  });
}
