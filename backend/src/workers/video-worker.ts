import { pipelineService, PipelineJob, PipelineJobStatus } from '../services/video/pipeline.service';
import logger from '../config/logger';

export class VideoWorker {
  private queue: PipelineJob[] = [];
  private active: Map<string, PipelineJob> = new Map();
  private concurrency: number;
  private processing: boolean = false;
  private shutdownRequested: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(concurrency: number = 2) {
    this.concurrency = concurrency;
  }

  start(): void {
    this.processing = true;
    this.shutdownRequested = false;

    this.pollInterval = setInterval(() => {
      this.processNext();
    }, 1000);

    logger.info('Video worker started', { concurrency: this.concurrency });
  }

  stop(): void {
    this.shutdownRequested = true;
    this.processing = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    logger.info('Video worker stopped', {
      remainingQueue: this.queue.length,
      activeJobs: this.active.size,
    });
  }

  addToQueue(job: PipelineJob): void {
    this.queue.push(job);
    logger.debug('Job added to worker queue', {
      jobId: job.id,
      queueLength: this.queue.length,
    });
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.shutdownRequested) return;
    if (this.active.size >= this.concurrency) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    this.active.set(job.id, job);

    logger.info('Worker picked up job', {
      jobId: job.id,
      projectId: job.projectId,
      activeCount: this.active.size,
    });

    this.processWithRetry(job).finally(() => {
      this.active.delete(job.id);
      if (!this.shutdownRequested) {
        this.processNext();
      }
    });
  }

  private async processWithRetry(job: PipelineJob, attempt: number = 1): Promise<void> {
    const maxRetries = 3;

    try {
      await pipelineService.processJob(job.id);
    } catch (error) {
      if (attempt < maxRetries && !this.shutdownRequested) {
        const backoffDelay = Math.pow(2, attempt) * 1000;
        logger.warn('Job failed, retrying', {
          jobId: job.id,
          attempt,
          maxRetries,
          backoffDelay,
          error: (error as Error).message,
        });

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return this.processWithRetry(job, attempt + 1);
      }

      logger.error('Job failed after all retries', {
        jobId: job.id,
        attempts: attempt,
        error: (error as Error).message,
      });
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveJobs(): PipelineJob[] {
    return Array.from(this.active.values());
  }

  isProcessing(): boolean {
    return this.processing;
  }
}
