import { UserRole } from '@prisma/client';

export interface PlanFeatures {
  maxProjects: number;
  maxExportsPerDay: number;
  maxUploadsPerMonth: number;
  maxDurationSeconds: number;
  allowedResolutions: string[];
  allowedFormats: string[];
  allowedFps: number[];
  maxConcurrentRenders: number;
  watermark: boolean;
  aiVoiceover: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  priorityQueue: boolean;
  advancedEffects: boolean;
  allTemplates: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  maxTeamMembers: number;
}

export interface PlanConfig {
  id: string;
  name: string;
  role: UserRole;
  price: { monthly: number; annual: number };
  stripePriceId?: string;
  mpPlanId?: string;
  features: PlanFeatures;
  description: string;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    role: 'user',
    price: { monthly: 0, annual: 0 },
    features: {
      maxProjects: 3,
      maxExportsPerDay: 3,
      maxUploadsPerMonth: 5,
      maxDurationSeconds: 300,
      allowedResolutions: ['p720'],
      allowedFormats: ['mp4'],
      allowedFps: [30],
      maxConcurrentRenders: 1,
      watermark: true,
      aiVoiceover: false,
      customBranding: false,
      prioritySupport: false,
      priorityQueue: false,
      advancedEffects: false,
      allTemplates: false,
      teamCollaboration: false,
      apiAccess: false,
      whiteLabel: false,
      maxTeamMembers: 1,
    },
    description: 'Get started with basic features',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    role: 'pro',
    price: { monthly: 1500, annual: 13490 },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: {
      maxProjects: 999,
      maxExportsPerDay: 50,
      maxUploadsPerMonth: 999,
      maxDurationSeconds: 7200,
      allowedResolutions: ['p720', 'p1080', 'k2', 'k4'],
      allowedFormats: ['mp4', 'mov', 'webm'],
      allowedFps: [24, 30, 60],
      maxConcurrentRenders: 5,
      watermark: false,
      aiVoiceover: true,
      customBranding: true,
      prioritySupport: true,
      priorityQueue: true,
      advancedEffects: true,
      allTemplates: true,
      teamCollaboration: true,
      apiAccess: false,
      whiteLabel: false,
      maxTeamMembers: 5,
    },
    description: 'For professional content creators',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Ultra',
    role: 'admin',
    price: { monthly: 2900, annual: 25990 },
    features: {
      maxProjects: 9999,
      maxExportsPerDay: 999,
      maxUploadsPerMonth: 9999,
      maxDurationSeconds: 999999,
      allowedResolutions: ['p720', 'p1080', 'k2', 'k4'],
      allowedFormats: ['mp4', 'mov', 'webm'],
      allowedFps: [24, 30, 60],
      maxConcurrentRenders: 50,
      watermark: false,
      aiVoiceover: true,
      customBranding: true,
      prioritySupport: true,
      priorityQueue: true,
      advancedEffects: true,
      allTemplates: true,
      teamCollaboration: true,
      apiAccess: true,
      whiteLabel: true,
      maxTeamMembers: 999,
    },
    description: 'For teams and organizations',
  },
};

export function getPlan(planId: string): PlanConfig | undefined {
  return PLANS[planId];
}

export function getUserPlan(user: { role: string; proExpiresAt?: Date | null }): PlanConfig {
  if (user.role === 'admin') return PLANS.enterprise!;
  if (user.role === 'pro') {
    if (user.proExpiresAt && user.proExpiresAt > new Date()) return PLANS.pro!;
    if (user.proExpiresAt && user.proExpiresAt <= new Date()) return PLANS.free!;
    return PLANS.pro!;
  }
  return PLANS.free!;
}

export function checkFeature<T extends keyof PlanFeatures>(
  user: { role: string; proExpiresAt?: Date | null },
  feature: T,
): PlanFeatures[T] {
  const plan = getUserPlan(user);
  return plan.features[feature];
}

export function checkResolutionAllowed(
  user: { role: string; proExpiresAt?: Date | null },
  resolution: string,
): boolean {
  const plan = getUserPlan(user);
  return plan.features.allowedResolutions.includes(resolution);
}

export function checkExportLimit(
  user: { role: string; proExpiresAt?: Date | null },
  dailyCount: number,
): { allowed: boolean; limit: number } {
  const plan = getUserPlan(user);
  return {
    allowed: dailyCount < plan.features.maxExportsPerDay,
    limit: plan.features.maxExportsPerDay,
  };
}

export function checkUploadLimit(
  user: { role: string; proExpiresAt?: Date | null },
  monthlyCount: number,
): { allowed: boolean; limit: number } {
  const plan = getUserPlan(user);
  return {
    allowed: monthlyCount < plan.features.maxUploadsPerMonth,
    limit: plan.features.maxUploadsPerMonth,
  };
}

export function checkDurationAllowed(
  user: { role: string; proExpiresAt?: Date | null },
  durationSeconds: number,
): { allowed: boolean; limit: number } {
  const plan = getUserPlan(user);
  return {
    allowed: durationSeconds <= plan.features.maxDurationSeconds,
    limit: plan.features.maxDurationSeconds,
  };
}

export function shouldApplyWatermark(user: { role: string; proExpiresAt?: Date | null }): boolean {
  return checkFeature(user, 'watermark');
}

export function getPlanPricing(planId: string): { monthly: number; annual: number } | undefined {
  return PLANS[planId]?.price;
}

export function getPlanUpgradeOptions(currentPlanId: string): PlanConfig[] {
  return Object.values(PLANS).filter(
    (p) => p.id !== currentPlanId && p.price.monthly > (PLANS[currentPlanId]?.price.monthly || 0),
  );
}
