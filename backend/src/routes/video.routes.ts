import { Router, Request, Response } from 'express';
import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import { checkFeature } from '../services/payment/plan.service';
import { pipelineService } from '../services/video/pipeline.service';
import { progressService } from '../services/video/progress.service';
import { getAllTemplates, getTemplate, getTemplatesByCategory, applyTemplateToOptions, getTemplateConfig } from '../services/video/template.service';
import { renderPreview } from '../services/video/renderer.service';
import { getVideoInfo } from '../utils/ffmpeg';
import { VideoWorker } from '../workers/video-worker';
import logger from '../config/logger';

const router = Router();
const videoWorker = new VideoWorker(2);
videoWorker.start();

const videoLimiter = createRateLimiter(60 * 1000, 30, 'Too many video API requests');

router.use(authenticate);
router.use(videoLimiter);

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { projectId, uploadIds, format, template, options } = req.body;

    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.userId },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const mergedOptions = template
      ? applyTemplateToOptions(template, { format, ...options })
      : { format, ...options };

    const wantsProAi =
      Boolean(mergedOptions?.voiceover || mergedOptions?.aiVoiceover || mergedOptions?.advancedEffects) ||
      ['cinematic', 'viral', 'podcast-pro'].includes(String(template || ''));

    if (wantsProAi) {
      const allowed = checkFeature(
        { role: (req.user as any).role || 'user', proExpiresAt: (req.user as any).proExpiresAt || null },
        'aiVoiceover',
      );

      if (!allowed) {
        res.status(403).json({
          error: 'Advanced AI video tools are available on the Pro plan.',
          upgradeRequired: true,
          requiredPlan: 'pro',
        });
        return;
      }
    }

    const job = await pipelineService.createJob(
      projectId,
      req.user!.userId,
      mergedOptions
    );

    videoWorker.addToQueue(job);

    res.status(201).json({ message: 'Processing job created', job });
  } catch (error) {
    logger.error('Create job error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create processing job' });
  }
});

router.get('/job/:jobId', (req: Request, res: Response) => {
  try {
    const job = pipelineService.getJob(req.params.jobId!);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized to view this job' });
      return;
    }

    const progress = progressService.getProgress(req.params.jobId!);

    res.json({ job, progress: progress || null });
  } catch (error) {
    logger.error('Get job error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

router.get('/jobs', (req: Request, res: Response) => {
  try {
    const jobs = pipelineService.getUserJobs(req.user!.userId);
    res.json({ jobs });
  } catch (error) {
    logger.error('List jobs error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

router.post('/cancel/:jobId', (req: Request, res: Response) => {
  try {
    const cancelled = pipelineService.cancelJob(req.params.jobId!, req.user!.userId);
    if (!cancelled) {
      res.status(404).json({ error: 'Job not found or cannot be cancelled' });
      return;
    }
    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    logger.error('Cancel job error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

router.get('/templates', (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    if (category) {
      const templates = getTemplatesByCategory(category);
      res.json({ templates });
      return;
    }

    const templates = getAllTemplates();
    res.json({ templates });
  } catch (error) {
    logger.error('Get templates error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

router.get('/templates/:templateId', (req: Request, res: Response) => {
  try {
    const template = getTemplate(req.params.templateId!);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const config = getTemplateConfig(req.params.templateId!);
    res.json({ template, config });
  } catch (error) {
    logger.error('Get template error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get template' });
  }
});

router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { inputPath, duration } = req.body;

    if (!inputPath) {
      res.status(400).json({ error: 'inputPath is required' });
      return;
    }

    const resolvedInput = path.resolve(inputPath);
    const uploadsPath = path.resolve(process.cwd(), 'uploads');
    if (!resolvedInput.startsWith(uploadsPath)) {
      res.status(403).json({ error: 'Invalid input path' });
      return;
    }

    if (!fs.existsSync(resolvedInput)) {
      res.status(404).json({ error: 'Input file not found' });
      return;
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'previews');
    fs.mkdirSync(outputDir, { recursive: true });

    const { v4: uuidv4 } = require('uuid');
    const outputPath = path.join(outputDir, `preview_${uuidv4()}.mp4`);

    await renderPreview(resolvedInput, outputPath, duration || 15);

    res.json({
      message: 'Preview generated',
      previewUrl: `/uploads/previews/${path.basename(outputPath)}`,
      outputPath,
    });
  } catch (error) {
    logger.error('Preview generation error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

router.get('/exports', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const [exports, total] = await Promise.all([
      prisma.export.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: { select: { id: true, title: true } },
        },
      }),
      prisma.export.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({
      exports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List exports error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to list exports' });
  }
});

router.get('/export/:exportId', async (req: Request, res: Response) => {
  try {
    const exportRecord = await prisma.export.findFirst({
      where: {
        id: req.params.exportId,
        userId: req.user!.userId,
      },
      include: {
        project: { select: { id: true, title: true } },
      },
    });

    if (!exportRecord) {
      res.status(404).json({ error: 'Export not found' });
      return;
    }

    if (exportRecord.fileUrl) {
      const relativePath = exportRecord.fileUrl.replace('/uploads/', '');
      const resolvedPath = path.resolve(process.cwd(), 'uploads', relativePath);
      const basePath = path.resolve(process.cwd(), 'uploads');
      if (!resolvedPath.startsWith(basePath)) {
        res.status(403).json({ error: 'Invalid file path' });
        return;
      }
      if (fs.existsSync(resolvedPath)) {
        res.download(resolvedPath, `${exportRecord.project?.title || 'export'}.${exportRecord.format}`);
        return;
      }
    }

    res.json({ export: exportRecord });
  } catch (error) {
    logger.error('Get export error', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get export' });
  }
});

export default router;
