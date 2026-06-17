import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema, paginationSchema } from '../utils/validation';
import { updateUser, getDashboardStats } from '../services/user.service';
import { hashPassword, verifyPassword } from '../utils/password';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    logger.error('Get profile error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', validate({ body: updateProfileSchema }), async (req: Request, res: Response) => {
  try {
    const user = await updateUser(req.user!.userId, req.body);
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    logger.error('Update profile error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/password', validate({ body: changePasswordSchema }), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      res.status(400).json({ error: 'Cannot change password for OAuth-only accounts' });
      return;
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash },
    });

    await prisma.session.deleteMany({ where: { userId: req.user!.userId } });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.delete('/account', async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth' });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats(req.user!.userId);
    res.json(stats);
  } catch (error) {
    logger.error('Get dashboard error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/projects', validate({ query: paginationSchema }), async (req: Request, res: Response) => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query as unknown as {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
    };

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: req.user!.userId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: where as any,
        skip,
        take: limit,
        orderBy: orderBy as any,
        select: {
          id: true,
          title: true,
          status: true,
          thumbnail: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.project.count({ where: where as any }),
    ]);

    res.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get projects error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/exports', validate({ query: paginationSchema }), async (req: Request, res: Response) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query as unknown as {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    };

    const skip = (page - 1) * limit;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [exports, total] = await Promise.all([
      prisma.export.findMany({
        where: { userId: req.user!.userId },
        skip,
        take: limit,
        orderBy: orderBy as any,
        select: {
          id: true,
          format: true,
          status: true,
          fileUrl: true,
          fileSize: true,
          createdAt: true,
          completedAt: true,
          project: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.export.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({
      data: exports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get exports error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

export default router;
