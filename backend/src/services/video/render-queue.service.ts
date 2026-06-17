import { EventEmitter } from 'events';
import logger from '@/config/logger';

interface QueueItem {
  id: string;
  userId: string;
  exportId: string;
  priority: number;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  renderFn: () => Promise<void>;
}

class RenderQueueService extends EventEmitter {
  private queue: QueueItem[] = [];
  private active: Map<string, QueueItem> = new Map();
  private maxConcurrent: number = 2;
  private processing: boolean = false;

  constructor() {
    super();
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_RENDERS || '2', 10);
  }

  enqueue(
    id: string,
    userId: string,
    exportId: string,
    renderFn: () => Promise<void>,
    priority: number = 0,
    maxAttempts: number = 3,
  ): void {
    const existing = this.queue.find((q) => q.id === id) || this.active.get(id);
    if (existing) {
      logger.warn('Render job already in queue', { id });
      return;
    }

    const item: QueueItem = {
      id,
      userId,
      exportId,
      priority,
      status: 'queued',
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
      renderFn,
    };

    this.queue.push(item);
    this.sortQueue();
    this.emit('enqueued', { id, exportId, userId });
    logger.info('Render job enqueued', { id, exportId, priority });

    if (!this.processing) {
      this.processNext();
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      item.status = 'rendering';
      item.startedAt = new Date();
      this.active.set(item.id, item);
      this.emit('started', { id: item.id, exportId: item.exportId });

      this.executeRender(item).finally(() => {
        this.active.delete(item.id);
        if (this.queue.length > 0 || this.active.size > 0) {
          this.processNext();
        } else {
          this.processing = false;
          this.emit('drained');
        }
      });
    }

    if (this.active.size === 0) {
      this.processing = false;
    }
  }

  private async executeRender(item: QueueItem): Promise<void> {
    try {
      await item.renderFn();
      item.status = 'completed';
      this.emit('completed', { id: item.id, exportId: item.exportId });
    } catch (error) {
      item.attempts++;
      const errMsg = (error as Error).message;

      if (item.attempts < item.maxAttempts) {
        logger.warn('Render failed, retrying', {
          id: item.id,
          attempt: item.attempts,
          maxAttempts: item.maxAttempts,
          error: errMsg,
        });
        item.status = 'queued';
        this.queue.push(item);
        this.sortQueue();
        this.emit('retrying', { id: item.id, exportId: item.exportId, attempt: item.attempts });
      } else {
        item.status = 'failed';
        this.emit('failed', { id: item.id, exportId: item.exportId, error: errMsg });
        logger.error('Render failed permanently', { id: item.id, exportId: item.exportId, error: errMsg });
      }
    }
  }

  cancel(id: string, userId: string): boolean {
    const idx = this.queue.findIndex((q) => q.id === id && q.userId === userId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      this.emit('cancelled', { id });
      return true;
    }

    const active = this.active.get(id);
    if (active && active.userId === userId) {
      this.active.delete(id);
      this.emit('cancelled', { id });
      return true;
    }

    return false;
  }

  getStatus(id: string): { status: string; position?: number } | null {
    const active = this.active.get(id);
    if (active) return { status: 'rendering' };

    const idx = this.queue.findIndex((q) => q.id === id);
    if (idx !== -1) return { status: 'queued', position: idx + 1 };

    return null;
  }

  getUserQueue(userId: string): { queued: number; active: number } {
    return {
      queued: this.queue.filter((q) => q.userId === userId).length,
      active: Array.from(this.active.values()).filter((a) => a.userId === userId).length,
    };
  }

  getStats(): { queued: number; active: number; totalProcessed: number } {
    return {
      queued: this.queue.length,
      active: this.active.size,
      totalProcessed: 0,
    };
  }
}

export const renderQueueService = new RenderQueueService();
