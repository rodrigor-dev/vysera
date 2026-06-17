import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { createAuditLog } from './audit.service';

const prisma = new PrismaClient();

const userSelect = {
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
} as const;

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: userSelect,
  });
}

export async function updateUser(id: string, data: { name?: string; avatarUrl?: string | null }) {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

export async function updateRole(userId: string, role: UserRole, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: userSelect,
  });

  await createAuditLog({
    userId: adminId,
    action: 'USER_ROLE_UPDATED',
    entityType: 'user',
    entityId: userId,
    metadata: { oldRole: user.role, newRole: role },
  });

  return updated;
}

export async function deleteUser(id: string, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  await prisma.user.delete({ where: { id } });

  await createAuditLog({
    userId: adminId,
    action: 'USER_DELETED',
    entityType: 'user',
    entityId: id,
    metadata: { email: user.email },
  });
}

export async function getAllUsers(filters: {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (filters.role) where.role = filters.role;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  const sortField = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  (orderBy as Record<string, string>)[sortField] = sortOrder;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDashboardStats(userId: string) {
  const [projects, exports, templates, uploads] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.project.count({ where: { userId, status: 'completed' } }),
    prisma.template.count({ where: { userId } }),
    prisma.upload.count({ where: { userId } }),
  ]);

  const recentProjects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      thumbnail: true,
    },
  });

  const recentExports = await prisma.export.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      format: true,
      status: true,
      createdAt: true,
      project: { select: { title: true } },
    },
  });

  return {
    stats: {
      totalProjects: projects,
      completedProjects: exports,
      totalTemplates: templates,
      totalUploads: uploads,
    },
    recentProjects,
    recentExports,
  };
}

export async function getAdminStats() {
  const [
    totalUsers,
    activeUsers,
    proUsers,
    totalProjects,
    totalExports,
    totalUploads,
    recentRegistrations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'pro' } }),
    prisma.project.count(),
    prisma.export.count(),
    prisma.upload.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    proUsers,
    totalProjects,
    totalExports,
    totalUploads,
    recentRegistrations,
  };
}
