import { Router, Request, Response } from 'express';
import prisma from '@/lib/prisma';
import { authenticate, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { updateRoleSchema, paginationSchema } from '../utils/validation';
import { getAllUsers, updateRole, deleteUser, getAdminStats } from '../services/user.service';
import { getAuditLogs } from '../services/audit.service';
import logger from '../config/logger';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/users', validate({ query: paginationSchema }), auditLog('ADMIN_LIST_USERS', 'user'), async (req: Request, res: Response) => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query as unknown as {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
    };

    const result = await getAllUsers({ page, limit, sortBy, sortOrder, search });
    res.json(result);
  } catch (error) {
    logger.error('Admin list users error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', auditLog('ADMIN_GET_USER', 'user'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            exports: true,
            templates: true,
            uploads: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Admin get user error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/users/:id/role', validate({ body: updateRoleSchema }), auditLog('ADMIN_UPDATE_ROLE', 'user'), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const user = await updateRole(req.params.id!, role, req.user!.userId);
    res.json({ message: 'User role updated', user });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
});

router.delete('/users/:id', auditLog('ADMIN_DELETE_USER', 'user'), async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id!, req.user!.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
});

router.get('/stats', auditLog('ADMIN_VIEW_STATS'), async (_req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    logger.error('Admin stats error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/payments', validate({ query: paginationSchema }), auditLog('ADMIN_VIEW_PAYMENTS'), async (req: Request, res: Response) => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query as unknown as {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
    };

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (search) {
      where.user = { email: { contains: search, mode: 'insensitive' } };
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [payments, total] = await Promise.all([
      prisma.paymentHistory.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: orderBy as any,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.paymentHistory.count({ where: where as any }),
    ]);

    res.json({
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Admin payments error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/logs', validate({ query: paginationSchema }), auditLog('ADMIN_VIEW_LOGS'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.loginAttempt.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.loginAttempt.count(),
    ]);

    res.json({
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Admin logs error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/analytics', auditLog('ADMIN_VIEW_ANALYTICS'), async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      newUsers7d,
      totalProjects,
      projects30d,
      totalExports,
      exports30d,
      proUsers,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.project.count(),
      prisma.project.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.export.count(),
      prisma.export.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: 'pro' } }),
      prisma.user.count({ where: { isActive: true, lastLoginAt: { gte: thirtyDaysAgo } } }),
    ]);

    res.json({
      users: { total: totalUsers, new30d: newUsers30d, new7d: newUsers7d, pro: proUsers, active30d: activeUsers },
      projects: { total: totalProjects, created30d: projects30d },
      exports: { total: totalExports, created30d: exports30d },
    });
  } catch (error) {
    logger.error('Admin analytics error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/errors', validate({ query: paginationSchema }), auditLog('ADMIN_VIEW_ERRORS'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where: { severity: { in: ['high', 'critical'] } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.securityEvent.count({ where: { severity: { in: ['high', 'critical'] } } }),
    ]);

    res.json({
      data: events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Admin errors error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

router.get('/audit-logs', validate({ query: paginationSchema }), auditLog('ADMIN_VIEW_AUDIT'), async (req: Request, res: Response) => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query as unknown as {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
    };

    const result = await getAuditLogs({ page, limit, sortBy, sortOrder, action: search });
    res.json(result);
  } catch (error) {
    logger.error('Admin audit logs error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/financial', auditLog('ADMIN_VIEW_FINANCIAL'), async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      totalPayments,
      successfulPayments,
      paymentMethods,
    ] = await Promise.all([
      prisma.paymentHistory.aggregate({
        _sum: { amount: true },
        where: { status: 'succeeded' },
      }),
      prisma.paymentHistory.aggregate({
        _sum: { amount: true },
        where: { status: 'succeeded', createdAt: { gte: thisMonth } },
      }),
      prisma.paymentHistory.aggregate({
        _sum: { amount: true },
        where: { status: 'succeeded', createdAt: { gte: lastMonth, lt: thisMonth } },
      }),
      prisma.paymentHistory.count(),
      prisma.paymentHistory.count({ where: { status: 'succeeded' } }),
      prisma.paymentHistory.groupBy({
        by: ['plan'],
        _count: true,
        where: { status: 'succeeded' },
      }),
    ]);

    res.json({
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: thisMonthRevenue._sum.amount || 0,
        lastMonth: lastMonthRevenue._sum.amount || 0,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        byPlan: paymentMethods.map((p) => ({ plan: p.plan, count: p._count })),
      },
    });
  } catch (error) {
    logger.error('Admin financial error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

router.get('/subscriptions', auditLog('ADMIN_VIEW_SUBSCRIPTIONS'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: where as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.subscription.count({ where: where as any }),
    ]);

    res.json({
      data: subscriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Admin subscriptions error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.post('/subscriptions/grant-pro', auditLog('ADMIN_GRANT_PRO', 'user'), async (req: Request, res: Response) => {
  try {
    const { userId, durationDays } = req.body;

    if (!userId || !durationDays) {
      res.status(400).json({ error: 'userId and durationDays are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'pro', proExpiresAt: expiresAt },
    });

    await prisma.subscription.create({
      data: {
        userId,
        provider: 'stripe',
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: expiresAt,
        metadata: { grantedBy: req.user!.userId, method: 'manual' },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_GRANT_PRO',
        entityType: 'user',
        entityId: userId,
        metadata: { durationDays, expiresAt: expiresAt.toISOString() },
      },
    });

    res.json({ message: 'Pro access granted', expiresAt });
    logger.info('Admin granted Pro', { userId, adminId: req.user!.userId, durationDays });
  } catch (error) {
    logger.error('Admin grant pro error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to grant Pro access' });
  }
});

router.post('/subscriptions/cancel', auditLog('ADMIN_CANCEL_PLAN', 'user'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'user', proExpiresAt: null, stripeSubscriptionId: null, mpSubscriptionId: null },
    });

    await prisma.subscription.updateMany({
      where: { userId, status: { in: ['active', 'trialing'] } },
      data: { status: 'canceled', canceledAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_CANCEL_PLAN',
        entityType: 'user',
        entityId: userId,
        metadata: { previousRole: user.role },
      },
    });

    res.json({ message: 'Plan cancelled' });
    logger.info('Admin cancelled plan', { userId, adminId: req.user!.userId });
  } catch (error) {
    logger.error('Admin cancel plan error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to cancel plan' });
  }
});

router.post('/subscriptions/change-plan', auditLog('ADMIN_CHANGE_PLAN', 'user'), async (req: Request, res: Response) => {
  try {
    const { userId, newPlan } = req.body;
    if (!userId || !newPlan) {
      res.status(400).json({ error: 'userId and newPlan are required' });
      return;
    }

    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      res.status(400).json({ error: 'Invalid plan. Must be: free, pro, or enterprise' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const roleMap: Record<string, string> = { free: 'user', pro: 'pro', enterprise: 'admin' };

    await prisma.user.update({
      where: { id: userId },
      data: { role: roleMap[newPlan] as any },
    });

    await prisma.subscription.create({
      data: {
        userId,
        provider: 'stripe',
        plan: newPlan,
        status: 'active',
        metadata: { changedBy: req.user!.userId, method: 'manual', previousPlan: user.role },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADMIN_CHANGE_PLAN',
        entityType: 'user',
        entityId: userId,
        metadata: { newPlan, previousRole: user.role },
      },
    });

    res.json({ message: `Plan changed to ${newPlan}` });
    logger.info('Admin changed plan', { userId, adminId: req.user!.userId, newPlan });
  } catch (error) {
    logger.error('Admin change plan error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

export default router;
