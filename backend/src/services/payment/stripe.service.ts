import StripeConstructor from 'stripe';
import { PrismaClient } from '@prisma/client';
import logger from '@/config/logger';
import { config } from '@/config';
import { createSubscription, updateSubscription, createInvoice, syncUserRole } from './subscription.service';

const prisma = new PrismaClient();

let stripe: any = null;

function getStripe(): any {
  if (!stripe) {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripe = new StripeConstructor(config.stripe.secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripe;
}

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  billingType: 'monthly' | 'annual' = 'monthly',
): Promise<{ url: string | null; sessionId: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email || undefined,
      name: user.name || undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, billingType },
    subscription_data: {
      metadata: { userId, billingType },
    },
    allow_promotion_codes: true,
  });

  return { url: session.url, sessionId: session.id };
}

export async function createPortalSession(
  userId: string,
  returnUrl: string,
): Promise<{ url: string | null }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (!user.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

export async function handleWebhook(
  body: string,
  signature: string,
): Promise<{ received: boolean }> {
  if (!config.stripe.webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  let event: any;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, config.stripe.webhookSecret);
  } catch (err) {
    const errMsg = (err as Error).message;
    logger.error('Stripe webhook signature verification failed', { error: errMsg });
    throw new Error(`Webhook signature verification failed: ${errMsg}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice: any = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice: any = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription: any = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription: any = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        logger.debug('Unhandled Stripe event', { type: event.type });
    }
  } catch (error) {
    logger.error('Stripe webhook handler error', {
      type: event.type,
      error: (error as Error).message,
    });
  }

  return { received: true };
}

async function handleCheckoutCompleted(session: any): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    logger.warn('Checkout session missing userId metadata', { sessionId: session.id });
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  await createSubscription(
    userId,
    'stripe',
    subscriptionId,
    session.customer as string,
    'pro',
    subscription.status === 'active' ? 'active' : 'trialing',
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
      role: 'pro',
      proExpiresAt: new Date(subscription.current_period_end * 1000),
    },
  });

  logger.info('Stripe checkout completed', { userId, subscriptionId });
}

async function handleInvoicePaid(invoice: any): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = await prisma.subscription.findFirst({
    where: { provider: 'stripe', providerSubscriptionId: subscriptionId },
  });

  if (!sub) return;

  await createInvoice({
    userId: sub.userId,
    subscriptionId: sub.id,
    provider: 'stripe',
    providerInvoiceId: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
    description: `Invoice ${invoice.number || invoice.id}`,
    paymentMethod: invoice.collection_method,
    paidAt: new Date(invoice.status_transitions?.paid_at || Date.now()),
  });

  if (invoice.period_start && invoice.period_end) {
    await updateSubscription(sub.id, {
      status: 'active',
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000),
    });
  }

  if (invoice.subscription_details?.metadata?.userId) {
    const s = await getStripe().subscriptions.retrieve(subscriptionId);
    await prisma.user.update({
      where: { id: sub.userId },
      data: {
        role: 'pro',
        proExpiresAt: new Date(s.current_period_end * 1000),
      },
    });
  }

  logger.info('Stripe invoice paid', { invoiceId: invoice.id, subscriptionId });
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = await prisma.subscription.findFirst({
    where: { provider: 'stripe', providerSubscriptionId: subscriptionId },
  });

  if (!sub) return;

  await updateSubscription(sub.id, { status: 'past_due' });

  logger.warn('Stripe invoice payment failed', { invoiceId: invoice.id, subscriptionId });
}

async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  const sub = await prisma.subscription.findFirst({
    where: { provider: 'stripe', providerSubscriptionId: subscription.id },
  });

  if (!sub) return;

  const statusMap: Record<string, 'active' | 'past_due' | 'canceled' | 'trialing'> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
  };

  const newStatus = statusMap[subscription.status] || 'canceled';
  const planTier = subscription.items.data[0]?.price?.metadata?.plan || 'pro';

  await updateSubscription(sub.id, {
    status: newStatus,
    plan: planTier,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
  });

  await syncUserRole(sub.userId);

  logger.info('Stripe subscription updated', {
    subscriptionId: subscription.id,
    status: newStatus,
  });
}

async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  const sub = await prisma.subscription.findFirst({
    where: { provider: 'stripe', providerSubscriptionId: subscription.id },
  });

  if (!sub) return;

  await updateSubscription(sub.id, {
    status: 'canceled',
    canceledAt: new Date(),
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: {
      role: 'user',
      proExpiresAt: null,
      stripeSubscriptionId: null,
    },
  });

  logger.info('Stripe subscription deleted', { subscriptionId: subscription.id });
}
