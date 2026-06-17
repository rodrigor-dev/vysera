import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { config } from '../config';
import { createAuditLog, logSecurityEvent } from './audit.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: user.id,
  });

  return user;
}

export async function login(email: string, password: string, ip: string, userAgent?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    await logLoginAttempt(null, email, ip, userAgent, false, 'Invalid credentials');
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (!user.isActive) {
    await logLoginAttempt(user.id, email, ip, userAgent, false, 'Account deactivated');
    await logSecurityEvent('ACCOUNT_DEACTIVATED', 'medium', `Deactivated account login attempt: ${email}`, undefined, ip, user.id);
    throw Object.assign(new Error('Account has been deactivated'), { statusCode: 403 });
  }

  const lockoutCheck = await checkBruteForce(email, ip);
  if (lockoutCheck.isLocked) {
    await logLoginAttempt(user.id, email, ip, userAgent, false, 'Account locked');
    throw Object.assign(
      new Error(`Too many login attempts. Please try again in ${lockoutCheck.minutesRemaining} minutes`),
      { statusCode: 429 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await logLoginAttempt(user.id, email, ip, userAgent, false, 'Invalid password');
    await logSecurityEvent('FAILED_LOGIN', 'low', `Failed login for ${email}`, undefined, ip, user.id);
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user.id);

  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + config.security.sessionExpiryHours);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: jti,
      userAgent: userAgent || null,
      ip,
      expiresAt: sessionExpiry,
    },
  });

  await logLoginAttempt(user.id, email, ip, userAgent, true, null);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
    expiresAt: sessionExpiry.toISOString(),
  };
}

export async function refreshToken(token: string, ip: string, userAgent?: string) {
  let payload: { userId: string; jti: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const session = await prisma.session.findFirst({
    where: {
      refreshToken: payload.jti,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) {
    await logSecurityEvent('INVALID_REFRESH_TOKEN', 'medium', 'Refresh token reuse detected', undefined, ip);
    await prisma.session.deleteMany({ where: { userId: payload.userId } });
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }

  if (!session.user.isActive) {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    throw Object.assign(new Error('Account has been deactivated'), { statusCode: 403 });
  }

  await prisma.session.delete({ where: { id: session.id } });

  const accessToken = generateAccessToken(session.user);
  const { token: newRefreshToken, jti } = generateRefreshToken(session.user.id);

  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + config.security.sessionExpiryHours);

  await prisma.session.create({
    data: {
      userId: session.user.id,
      refreshToken: jti,
      userAgent: userAgent || null,
      ip,
      expiresAt: sessionExpiry,
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt: sessionExpiry.toISOString(),
  };
}

export async function logout(refreshToken: string): Promise<void> {
  let payload: { userId: string; jti: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  await prisma.session.deleteMany({
    where: { refreshToken: payload.jti },
  });
}

export async function createSession(userId: string, refreshToken: string, ip: string, userAgent?: string) {
  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + config.security.sessionExpiryHours);

  return prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent: userAgent || null,
      ip,
      expiresAt: sessionExpiry,
    },
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } });
}

export async function verifySession(refreshToken: string) {
  const session = await prisma.session.findFirst({
    where: {
      refreshToken,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) return null;
  if (!session.user.isActive) return null;

  return session;
}

export async function forgotPassword(email: string, ip: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  const resetToken = uuidv4();
  const resetExpiry = new Date();
  resetExpiry.setHours(resetExpiry.getHours() + 1);

  await prisma.appConfig.upsert({
    where: { key: `reset_token_${user.id}` },
    update: { value: JSON.stringify({ token: resetToken, expiresAt: resetExpiry.toISOString() }) },
    create: {
      key: `reset_token_${user.id}`,
      value: JSON.stringify({ token: resetToken, expiresAt: resetExpiry.toISOString() }),
      type: 'reset_token',
    },
  });

  logger.info('Password reset requested', { userId: user.id, ip });

  await createAuditLog({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'user',
    entityId: user.id,
    ip,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const configs = await prisma.appConfig.findMany({
    where: {
      key: { startsWith: 'reset_token_' },
    },
  });

  let userId: string | null = null;
  const now = new Date();

  for (const cfg of configs) {
    const data = JSON.parse(cfg.value as string) as { token: string; expiresAt: string };
    if (data.token === token && new Date(data.expiresAt) > now) {
      userId = cfg.key.replace('reset_token_', '');
      break;
    }
  }

  if (!userId) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.appConfig.deleteMany({
    where: { key: `reset_token_${userId}` },
  });

  await prisma.session.deleteMany({ where: { userId } });

  await logSecurityEvent('PASSWORD_RESET', 'medium', `Password reset completed for user ${userId}`, undefined, undefined, userId);
}

export async function oauthLogin(
  provider: string,
  providerAccountId: string,
  email: string,
  name: string | undefined,
  ip: string,
  userAgent?: string
) {
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
    include: { user: true },
  });

  if (existingAccount) {
    if (!existingAccount.user.isActive) {
      throw Object.assign(new Error('Account has been deactivated'), { statusCode: 403 });
    }

    const accessToken = generateAccessToken(existingAccount.user);
    const { token: refreshToken, jti } = generateRefreshToken(existingAccount.user.id);

    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + config.security.sessionExpiryHours);

    await prisma.session.create({
      data: {
        userId: existingAccount.user.id,
        refreshToken: jti,
        userAgent: userAgent || null,
        ip,
        expiresAt: sessionExpiry,
      },
    });

    await prisma.user.update({
      where: { id: existingAccount.user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: existingAccount.user.id,
        email: existingAccount.user.email,
        name: existingAccount.user.name,
        role: existingAccount.user.role,
      },
      accessToken,
      refreshToken,
      expiresAt: sessionExpiry.toISOString(),
    };
  }

  let user = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0] || 'User',
        emailVerified: true,
      },
    });
  }

  await prisma.account.create({
    data: {
      userId: user.id,
      provider,
      providerAccountId,
    },
  });

  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user.id);

  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + config.security.sessionExpiryHours);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: jti,
      userAgent: userAgent || null,
      ip,
      expiresAt: sessionExpiry,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
    expiresAt: sessionExpiry.toISOString(),
  };
}

async function logLoginAttempt(userId: string | null, email: string, ip: string, userAgent: string | undefined, success: boolean, reason: string | null) {
  try {
    await prisma.loginAttempt.create({
      data: {
        userId,
        email,
        ip,
        userAgent: userAgent || null,
        success,
        reason,
      },
    });
  } catch (error) {
    logger.error('Failed to log login attempt', { error: (error as Error).message });
  }
}

async function checkBruteForce(email: string, ip: string): Promise<{ isLocked: boolean; minutesRemaining: number }> {
  const lockoutMinutes = config.security.loginLockoutMinutes;
  const maxAttempts = config.security.maxLoginAttempts;
  const since = new Date(Date.now() - lockoutMinutes * 60 * 1000);

  const recentAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: since },
    },
  });

  if (recentAttempts >= maxAttempts) {
    return { isLocked: true, minutesRemaining: lockoutMinutes };
  }

  const ipAttempts = await prisma.loginAttempt.count({
    where: {
      ip,
      success: false,
      createdAt: { gte: since },
    },
  });

  if (ipAttempts >= maxAttempts * 2) {
    return { isLocked: true, minutesRemaining: lockoutMinutes };
  }

  return { isLocked: false, minutesRemaining: 0 };
}
