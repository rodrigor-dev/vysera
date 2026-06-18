import { Router, Request, Response } from 'express';
import { authenticate, adminOnly } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import { renderQueueService } from '../services/video/render-queue.service';
import { renderGuardService } from '../services/security/render-guard.service';
import logger from '../config/logger';

const router = Router();
const renderLimiter = createRateLimiter(60 * 1000, 30, 'Too many render requests');

router.use(authenticate);
router.use(renderLimiter);

router.get('/status', (_req: Request, res: Response) => {
  try {
    const stats = renderQueueService.getStats();
    res.json({ queue: stats });
  } catch (error) {
    logger.error('Render queue status error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

router.get('/job/:jobId', (req: Request, res: Response) => {
  try {
    const status = renderQueueService.getStatus(req.params.jobId!);
    if (!status) {
      res.status(404).json({ error: 'Job not found in queue' });
      return;
    }
    res.json({ job: { id: req.params.jobId, ...status } });
  } catch (error) {
    logger.error('Get render job error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

router.post('/cancel/:jobId', (req: Request, res: Response) => {
  try {
    const cancelled = renderQueueService.cancel(req.params.jobId!, req.user!.userId);
    res.json({ message: cancelled ? 'Job cancelled' : 'Job not found or not yours' });
  } catch (error) {
    logger.error('Cancel render job error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

router.use('/admin', adminOnly);

router.get('/admin/queue', (_req: Request, res: Response) => {
  try {
    const stats = renderQueueService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Admin queue error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

router.post('/admin/requeue/:jobId', (req: Request, res: Response) => {
  try {
    const status = renderQueueService.getStatus(req.params.jobId!);
    if (!status) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ message: 'Requeue not supported for completed/failed jobs via API' });
  } catch (error) {
    logger.error('Admin requeue error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to requeue job' });
  }
});

router.get('/admin/usage/:userId', (req: Request, res: Response) => {
  try {
    const stats = renderGuardService.getUsageStats(req.params.userId!, 'admin');
    res.json(stats);
  } catch (error) {
    logger.error('Admin usage error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

export default router;
