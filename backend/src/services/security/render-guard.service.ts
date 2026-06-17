import logger from '@/config/logger';

interface UsageQuota {
  dailyRenders: number;
  dailyDuration: number;
  concurrentRenders: number;
}

interface UserUsage {
  dailyRenderCount: number;
  dailyDurationSeconds: number;
  lastResetDate: string;
  activeRenderIds: Set<string>;
}

const PLANS: Record<string, UsageQuota> = {
  user: { dailyRenders: 5, dailyDuration: 600, concurrentRenders: 1 },
  pro: { dailyRenders: 50, dailyDuration: 7200, concurrentRenders: 5 },
  admin: { dailyRenders: 9999, dailyDuration: 999999, concurrentRenders: 50 },
};

class RenderGuardService {
  private usage: Map<string, UserUsage> = new Map();

  private getUsage(userId: string): UserUsage {
    let usage = this.usage.get(userId);
    const today = new Date().toISOString().slice(0, 10);

    if (!usage || usage.lastResetDate !== today) {
      usage = {
        dailyRenderCount: 0,
        dailyDurationSeconds: 0,
        lastResetDate: today,
        activeRenderIds: new Set(),
      };
      this.usage.set(userId, usage);
    }

    return usage;
  }

  canRender(
    userId: string,
    role: string = 'user',
    durationSeconds: number,
  ): { allowed: boolean; reason?: string } {
    const plan = PLANS[role] || PLANS.user!;
    const usage = this.getUsage(userId);

    if (usage.activeRenderIds.size >= plan.concurrentRenders) {
      return {
        allowed: false,
        reason: `Maximum ${plan.concurrentRenders} concurrent renders. Please wait for current renders to finish.`,
      };
    }

    if (usage.dailyRenderCount >= plan.dailyRenders) {
      return {
        allowed: false,
        reason: `Daily render limit reached (${plan.dailyRenders}). Upgrade to Pro for more.`,
      };
    }

    const newDailyDuration = usage.dailyDurationSeconds + durationSeconds;
    if (newDailyDuration > plan.dailyDuration) {
      return {
        allowed: false,
        reason: `Daily duration limit would be exceeded (${Math.round(newDailyDuration / 60)}/${Math.round(plan.dailyDuration / 60)} min).`,
      };
    }

    return { allowed: true };
  }

  startRender(userId: string, durationSeconds: number): void {
    const usage = this.getUsage(userId);
    usage.dailyRenderCount++;
    usage.dailyDurationSeconds += durationSeconds;
  }

  registerActive(userId: string, jobId: string): void {
    const usage = this.getUsage(userId);
    usage.activeRenderIds.add(jobId);
  }

  unregisterActive(userId: string, jobId: string): void {
    const usage = this.usage.get(userId);
    if (usage) {
      usage.activeRenderIds.delete(jobId);
    }
  }

  getUsageStats(userId: string, role: string = 'user'): {
    dailyRenderCount: number;
    dailyRenderLimit: number;
    dailyDurationMinutes: number;
    dailyDurationLimitMinutes: number;
    concurrentActive: number;
    concurrentLimit: number;
    resetDate: string;
  } {
    const plan = PLANS[role] || PLANS.user!;
    const usage = this.getUsage(userId);

    return {
      dailyRenderCount: usage.dailyRenderCount,
      dailyRenderLimit: plan.dailyRenders,
      dailyDurationMinutes: Math.round(usage.dailyDurationSeconds / 60),
      dailyDurationLimitMinutes: Math.round(plan.dailyDuration / 60),
      concurrentActive: usage.activeRenderIds.size,
      concurrentLimit: plan.concurrentRenders,
      resetDate: usage.lastResetDate,
    };
  }

  checkRateLimit(
    userId: string,
    maxRequests: number = 10,
    windowMs: number = 60000,
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = `ratelimit:${userId}`;
    const timestamps = this.rateLimitMap.get(key) || [];

    const recent = timestamps.filter((t) => now - t < windowMs);
    recent.push(now);

    if (recent.length > maxRequests) {
      const oldest = recent[0]!;
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    this.rateLimitMap.set(key, recent.slice(-maxRequests));
    return { allowed: true };
  }

  private rateLimitMap: Map<string, number[]> = new Map();

  cleanup(): void {
    const today = new Date().toISOString().slice(0, 10);
    for (const [userId, usage] of this.usage.entries()) {
      if (usage.lastResetDate !== today) {
        this.usage.delete(userId);
      }
    }

    const now = Date.now();
    for (const [key, timestamps] of this.rateLimitMap.entries()) {
      const recent = timestamps.filter((t) => now - t < 60000);
      if (recent.length === 0) {
        this.rateLimitMap.delete(key);
      } else {
        this.rateLimitMap.set(key, recent);
      }
    }
  }
}

export const renderGuardService = new RenderGuardService();

setInterval(() => renderGuardService.cleanup(), 300000);
