import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        metadata: (params.metadata as Prisma.JsonObject) || undefined,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error: (error as Error).message });
  }
}

export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
  const sortField = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  (orderBy as Record<string, string>)[sortField] = sortOrder;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function logSecurityEvent(
  type: string,
  severity: string,
  message: string,
  metadata?: Record<string, unknown>,
  ip?: string,
  userId?: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        type,
        severity,
        message,
        metadata: (metadata as Prisma.JsonObject) || undefined,
        ip,
        userId,
      },
    });
  } catch (error) {
    logger.error('Failed to log security event', { error: (error as Error).message });
  }
}
