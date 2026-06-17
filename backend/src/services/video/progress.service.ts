export interface ProgressData {
  progress: number;
  stage: string;
  jobId: string;
  userId: string;
  startedAt: Date;
  updatedAt: Date;
}

class ProgressStore {
  private store: Map<string, { progress: number; stage: string; status: string }> = new Map();

  update(jobId: string, progress: number, stage: string, status: string): void {
    this.store.set(jobId, {
      progress: Math.min(100, Math.max(0, progress)),
      stage,
      status,
    });
  }

  get(jobId: string): { progress: number; stage: string; status: string } | null {
    return this.store.get(jobId) || null;
  }

  getAll(): Array<{ jobId: string; progress: number; stage: string; status: string }> {
    return Array.from(this.store.entries()).map(([jobId, data]) => ({
      jobId,
      ...data,
    }));
  }

  delete(jobId: string): void {
    this.store.delete(jobId);
  }

  cleanup(): void {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    for (const [id] of this.store.entries()) {
      this.store.delete(id);
    }
  }
}

export const progressStore = new ProgressStore();

class ProgressService {
  private store: Map<string, ProgressData> = new Map();

  updateProgress(jobId: string, progress: number, stage: string, userId?: string): void {
    const existing = this.store.get(jobId);
    this.store.set(jobId, {
      jobId,
      progress: Math.min(100, Math.max(0, progress)),
      stage,
      userId: userId || existing?.userId || 'unknown',
      startedAt: existing?.startedAt || new Date(),
      updatedAt: new Date(),
    });
    progressStore.update(jobId, progress, stage, progress >= 100 ? 'completed' : 'processing');
  }

  getProgress(jobId: string): ProgressData | undefined {
    return this.store.get(jobId);
  }

  getAllProgress(): ProgressData[] {
    return Array.from(this.store.values());
  }

  clearProgress(jobId: string): void {
    this.store.delete(jobId);
    progressStore.delete(jobId);
  }

  getActiveJobs(): ProgressData[] {
    return this.getAllProgress().filter((p) => p.progress < 100);
  }
}

export const progressService = new ProgressService();
