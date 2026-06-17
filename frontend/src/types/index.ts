export type UserRole = 'user' | 'pro' | 'admin';

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export type ExportFormat = 'mp4' | 'mov' | 'webm' | 'gif';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  proExpiresAt: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  thumbnail: string | null;
  duration: number | null;
  resolution: string | null;
  fps: number | null;
  metadata: Record<string, unknown> | null;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  config: Record<string, unknown>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Export {
  id: string;
  projectId: string;
  userId: string;
  format: ExportFormat;
  resolution: string | null;
  quality: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  duration: number | null;
  status: string;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Upload {
  id: string;
  projectId: string | null;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  stripePaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  plan: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LoginAttempt {
  id: string;
  userId: string | null;
  email: string;
  ip: string;
  userAgent: string | null;
  success: boolean;
  reason: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalExports: number;
  storageUsed: number;
  recentProjects: Project[];
  recentExports: Export[];
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalExports: number;
  totalRevenue: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
  errorCount: number;
  recentLogs: AuditLog[];
  userGrowth: { date: string; count: number }[];
  revenueData: { date: string; amount: number }[];
}
