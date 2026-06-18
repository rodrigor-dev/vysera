import { PrismaClient, SubscriptionProvider, SubscriptionStatus } from '@prisma/client';
import { PLANS, getUserPlan } from './plan.service';
import logger from '@/config/logger';

const prisma = new PrismaClient();

export async function createSubscription(
  userId: string,
  provider: SubscriptionProvider,
  providerSubscriptionId: string,
  providerCustomerId: string,
  plan: string,
  status: SubscriptionStatus,
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date,
): Promise<{ id: string }> {
  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      provider,
      providerSubscriptionId,
    },
  });

  if (existing) {
    return updateSubscription(existing.id, { status, currentPeriodStart, currentPeriodEnd });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      provider,
      providerSubscriptionId,
      providerCustomerId,
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
    },
  });

  await syncUserRole(userId);

  return { id: subscription.id };
}

export async function updateSubscription(
  subscriptionId: string,
  data: {
    status?: SubscriptionStatus;
    plan?: string;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    canceledAt?: Date | null;
    metadata?: Record<string, unknown>;
  },
): Promise<{ id: string }> {
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.plan && { plan: data.plan }),
      ...(data.currentPeriodStart !== undefined && { currentPeriodStart: data.currentPeriodStart }),
      ...(data.currentPeriodEnd !== undefined && { currentPeriodEnd: data.currentPeriodEnd }),
      ...(data.canceledAt !== undefined && { canceledAt: data.canceledAt }),
      ...(data.metadata && { metadata: data.metadata as any }),
    },
  });

  await syncUserRole(subscription.userId);

  return { id: subscription.id };
}

export async function cancelSubscription(subscriptionId: string): Promise<{ id: string }> {
  const result = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'canceled' as SubscriptionStatus,
      canceledAt: new Date(),
    },
  });

  await syncUserRole(result.userId);

  return { id: result.id };
}

export async function getUserActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['active' as SubscriptionStatus, 'trialing' as SubscriptionStatus] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllSubscriptions(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) {
  const { page, limit, status, search } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.subscription.count({ where: where as any }),
  ]);

  return {
    data: subscriptions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function syncUserRole(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: { in: ['active', 'trialing'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) return;

  const activeSub = user.subscriptions[0];
  let newRole = user.role;

  if (activeSub) {
    const planConfig = PLANS[activeSub.plan];
    if (planConfig) {
      newRole = planConfig.role;
    }

    if (activeSub.plan === 'pro' || activeSub.plan === 'enterprise') {
      await prisma.user.update({
        where: { id: userId },
        data: { proExpiresAt: activeSub.currentPeriodEnd },
      });
    }
  }

  if (newRole !== user.role) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    logger.info('User role synced via subscription', { userId, oldRole: user.role, newRole });
  }
}

export async function adminSetPro(
  userId: string,
  adminId: string,
  durationDays: number,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'pro',
      proExpiresAt: expiresAt,
    },
  });

  await prisma.subscription.create({
    data: {
      userId,
      provider: 'stripe',
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: expiresAt,
      metadata: { grantedBy: adminId, method: 'manual' },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'ADMIN_GRANT_PRO',
      entityType: 'user',
      entityId: userId,
      metadata: { durationDays, expiresAt: expiresAt.toISOString() },
    },
  });

  logger.info('Admin granted Pro access', { userId, adminId, durationDays });
}

export async function adminCancelPlan(userId: string, adminId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'user',
      proExpiresAt: null,
      stripeSubscriptionId: null,
      mpSubscriptionId: null,
    },
  });

  await prisma.subscription.updateMany({
    where: { userId, status: { in: ['active', 'trialing'] } },
    data: { status: 'canceled', canceledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'ADMIN_CANCEL_PLAN',
      entityType: 'user',
      entityId: userId,
      metadata: { previousRole: user.role },
    },
  });

  logger.info('Admin canceled plan', { userId, adminId });
}

export async function adminChangePlan(
  userId: string,
  newPlan: string,
  adminId: string,
): Promise<void> {
  const planConfig = PLANS[newPlan];
  if (!planConfig) throw Object.assign(new Error('Invalid plan'), { statusCode: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  await prisma.user.update({
    where: { id: userId },
    data: { role: planConfig.role },
  });

  await prisma.subscription.create({
    data: {
      userId,
      provider: 'stripe',
      plan: newPlan,
      status: 'active',
      metadata: { changedBy: adminId, method: 'manual', previousPlan: user.role },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'ADMIN_CHANGE_PLAN',
      entityType: 'user',
      entityId: userId,
      metadata: { newPlan, previousRole: user.role },
    },
  });

  logger.info('Admin changed plan', { userId, adminId, newPlan });
}

export async function getUserInvoices(userId: string, limit = 20) {
  return prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function createInvoice(data: {
  userId: string;
  subscriptionId?: string;
  provider: SubscriptionProvider;
  providerInvoiceId?: string;
  amount: number;
  currency?: string;
  status?: string;
  description?: string;
  paymentMethod?: string;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}) {
  return prisma.invoice.create({
    data: {
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      provider: data.provider,
      providerInvoiceId: data.providerInvoiceId,
      amount: data.amount,
      currency: data.currency || 'usd',
      status: data.status || 'paid',
      description: data.description,
      paymentMethod: data.paymentMethod,
      paidAt: data.paidAt || new Date(),
      metadata: data.metadata as any,
    },
  });
}
