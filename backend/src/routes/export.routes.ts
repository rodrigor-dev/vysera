import { Router, Request, Response } from 'express';
import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import { createExport, cancelExport, getExportProgress, cleanupOldExports } from '../services/video/export.service';
import { renderGuardService } from '../services/security/render-guard.service';
import { getPlatformConfig, getAllPlatforms, RESOLUTION_CONFIGS, FORMAT_CONFIGS, FPS_OPTIONS } from '../services/video/platform-optimizer.service';
import { renderQueueService } from '../services/video/render-queue.service';
import logger from '../config/logger';

const router = Router();
const exportLimiter = createRateLimiter(60 * 1000, 10, 'Too many export requests');

router.use(authenticate);

router.post('/create', exportLimiter, async (req: Request, res: Response) => {
  try {
    const { projectId, format, resolution, fps, quality, platform } = req.body;

    if (!projectId || !format || !resolution) {
      res.status(400).json({ error: 'projectId, format, and resolution are required' });
      return;
    }

    if (!FORMAT_CONFIGS[format]) {
      res.status(400).json({ error: `Invalid format. Supported: ${Object.keys(FORMAT_CONFIGS).join(', ')}` });
      return;
    }

    if (!RESOLUTION_CONFIGS[resolution]) {
      res.status(400).json({ error: `Invalid resolution. Supported: ${Object.keys(RESOLUTION_CONFIGS).join(', ')}` });
      return;
    }

    if (fps && !FPS_OPTIONS.includes(fps)) {
      res.status(400).json({ error: `Invalid FPS. Supported: ${FPS_OPTIONS.join(', ')}` });
      return;
    }

    if (platform && !getPlatformConfig(platform)) {
      res.status(400).json({ error: `Invalid platform. Supported: ${getAllPlatforms().join(', ')}` });
      return;
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.userId },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const exportsCount = await prisma.export.count({
      where: { userId: req.user!.userId, status: { in: ['pending', 'queued', 'rendering'] } },
    });

    const role = (req.user as any).role || 'user';
    const guard = renderGuardService.canRender(req.user!.userId, role, 60);
    if (!guard.allowed) {
      res.status(429).json({ error: guard.reason });
      return;
    }

    const result = await createExport({
      projectId,
      userId: req.user!.userId,
      format,
      resolution,
      fps: fps || 30,
      quality: quality || 'standard',
      platform,
      inputPath: (project as any).videoUrl || '',
      projectName: project.title,
    });

    renderGuardService.startRender(req.user!.userId, 60);
    renderGuardService.registerActive(req.user!.userId, `export-${result.export.id}`);

    res.status(201).json(result);
  } catch (error) {
    logger.error('Create export error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create export' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;

    const [exports, total] = await Promise.all([
      prisma.export.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: { select: { id: true, title: true } },
        },
      }),
      prisma.export.count({ where }),
    ]);

    res.json({
      data: exports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('List exports error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to list exports' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const role = (req.user as any).role || 'user';
    const usage = renderGuardService.getUsageStats(req.user!.userId, role);
    const queue = renderQueueService.getUserQueue(req.user!.userId);

    res.json({
      usage,
      queue,
      supportedFormats: Object.keys(FORMAT_CONFIGS),
      supportedResolutions: Object.keys(RESOLUTION_CONFIGS),
      supportedFps: FPS_OPTIONS,
      supportedPlatforms: getAllPlatforms().map((p) => ({
        id: p,
        config: getPlatformConfig(p),
      })),
    });
  } catch (error) {
    logger.error('Export stats error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get export stats' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const exportRecord = await prisma.export.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        project: { select: { id: true, title: true } },
      },
    });

    if (!exportRecord) {
      res.status(404).json({ error: 'Export not found' });
      return;
    }

    const progress = await getExportProgress(exportRecord.id);

    res.json({ export: exportRecord, progress });
  } catch (error) {
    logger.error('Get export error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get export' });
  }
});

router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const exportRecord = await prisma.export.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: { id: true },
    });

    if (!exportRecord) {
      res.status(404).json({ error: 'Export not found' });
      return;
    }

    const progress = await getExportProgress(exportRecord.id);
    if (!progress) {
      res.status(404).json({ error: 'Export not found' });
      return;
    }

    const queueStatus = renderQueueService.getStatus(`export-${exportRecord.id}`);

    res.json({ progress, queue: queueStatus });
  } catch (error) {
    logger.error('Export progress error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get export progress' });
  }
});

router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const exportRecord = await prisma.export.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!exportRecord) {
      res.status(404).json({ error: 'Export not found' });
      return;
    }

    if (['completed', 'failed', 'cancelled'].includes(exportRecord.status)) {
      res.status(400).json({ error: `Export is already ${exportRecord.status}` });
      return;
    }

    const cancelled = await cancelExport(exportRecord.id, req.user!.userId);
    renderGuardService.unregisterActive(req.user!.userId, `export-${exportRecord.id}`);

    res.json({ message: cancelled ? 'Export cancelled' : 'Export could not be cancelled' });
  } catch (error) {
    logger.error('Cancel export error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to cancel export' });
  }
});

router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const exportRecord = await prisma.export.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!exportRecord) {
      res.status(404).json({ error: 'Export not found' });
      return;
    }

    if (exportRecord.status !== 'completed') {
      res.status(400).json({ error: 'Export is not yet completed' });
      return;
    }

    if (!exportRecord.fileUrl) {
      res.status(404).json({ error: 'Export file not found' });
      return;
    }

    const relativePath = exportRecord.fileUrl.replace('/uploads/', '');
    const resolvedPath = path.resolve(process.cwd(), 'uploads', relativePath);
    const basePath = path.resolve(process.cwd(), 'uploads');
    if (!resolvedPath.startsWith(basePath)) {
      res.status(403).json({ error: 'Invalid file path' });
      return;
    }

    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: 'Export file not found on disk' });
      return;
    }

    const filename = path.basename(resolvedPath);
    res.download(resolvedPath, filename);
  } catch (error) {
    logger.error('Download export error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to download export' });
  }
});

router.post('/cleanup', createRateLimiter(60 * 1000, 3, 'Too many cleanup requests'), async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.body.days as string, 10) || 7;
    const cleaned = await cleanupOldExports(days);
    res.json({ message: `Cleaned up ${cleaned} old exports` });
  } catch (error) {
    logger.error('Cleanup exports error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to cleanup exports' });
  }
});

export default router;
