import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import logger from '@/config/logger';
import { getHardwareAcceleration, getVideoInfo } from '@/utils/ffmpeg';
import { renderQueueService } from './render-queue.service';
import {
  PlatformConfig,
  getPlatformConfig,
  getResolutionConfig,
  getFormatConfig,
  RESOLUTION_CONFIGS,
  calculateOptimalBitrate,
  generateOutputFilename,
} from './platform-optimizer.service';

const prisma = new PrismaClient();

interface ExportOptions {
  projectId: string;
  userId: string;
  format: string;
  resolution: string;
  fps: number;
  codec?: string;
  quality?: string;
  platform?: string;
  inputPath: string;
  projectName?: string;
}

export async function createExport(options: ExportOptions): Promise<{
  export: Record<string, unknown>;
  job: Record<string, unknown>;
}> {
  const {
    projectId,
    userId,
    format,
    resolution,
    fps,
    quality = 'standard',
    platform,
    inputPath,
    projectName,
  } = options;

  const resolutionConfig = getResolutionConfig(resolution);
  if (!resolutionConfig) throw new Error(`Invalid resolution: ${resolution}`);

  const formatConfig = getFormatConfig(format);
  if (!formatConfig) throw new Error(`Invalid format: ${format}`);

  const exportRecord = await prisma.export.create({
    data: {
      projectId,
      userId,
      format: format as any,
      resolution: resolution as any,
      fps,
      codec: formatConfig.codec,
      quality,
      platform,
      status: 'pending' as any,
      metadata: {
        projectName: projectName || 'Untitled',
        resolution: `${resolutionConfig.width}x${resolutionConfig.height}`,
        container: formatConfig.container,
        inputPath,
      },
    },
  });

  const jobId = `export-${exportRecord.id}`;

  const renderFn = async () => {
    await runExport(exportRecord.id, options);
  };

  renderQueueService.enqueue(jobId, userId, exportRecord.id, renderFn);

  await prisma.export.update({
    where: { id: exportRecord.id },
    data: { status: 'queued' as any },
  });

  return {
    export: {
      id: exportRecord.id,
      status: 'queued',
      format,
      resolution,
      fps,
      platform,
    },
    job: {
      id: jobId,
      status: 'queued',
    },
  };
}

export async function runExport(
  exportId: string,
  options: ExportOptions,
): Promise<void> {
  const {
    projectId,
    userId,
    format,
    resolution,
    fps,
    platform,
    inputPath,
  } = options;

  const outputDir = path.join(process.cwd(), 'uploads', 'exports', userId);
  await fs.mkdir(outputDir, { recursive: true });

  const resolutionConfig = getResolutionConfig(resolution);
  if (!resolutionConfig) throw new Error(`Invalid resolution: ${resolution}`);

  const formatConfig = getFormatConfig(format);
  if (!formatConfig) throw new Error(`Invalid format: ${format}`);

  const platformConfig = platform ? getPlatformConfig(platform) : undefined;

  const outputFilename = generateOutputFilename(
    options.projectName || 'export',
    formatConfig.container,
    resolution,
    platform,
  );
  const outputPath = path.join(outputDir, outputFilename);
  const hwAccel = getHardwareAcceleration();

  const bitrateConfig = await calculateOptimalBitrate(inputPath, resolution, fps);

  const targetWidth = resolutionConfig.width;
  const targetHeight = resolutionConfig.height;
  const scaleFilter = `scale=w=${targetWidth}:h=${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

  const allFilters = [scaleFilter];
  if (platformConfig?.extraFilters) {
    allFilters.push(...platformConfig.extraFilters);
  }

  await prisma.export.update({
    where: { id: exportId },
    data: {
      status: 'rendering' as any,
      progress: 0,
      stage: 'Rendering video...',
      startedAt: new Date(),
      fileUrl: `/uploads/exports/${userId}/${outputFilename}`,
    },
  });

  return new Promise((resolve, reject) => {
    let lastProgress = 0;
    let ffmpegCmd: ffmpeg.FfmpegCommand | null = null;

    const cmd = ffmpeg(inputPath)
      .videoCodec(platformConfig?.codec || formatConfig.codec)
      .audioCodec(formatConfig.audioCodec)
      .outputOptions([
        '-preset', platformConfig?.preset || 'medium',
        '-crf', `${platformConfig?.crf || bitrateConfig.crf}`,
        '-pix_fmt', platformConfig?.pixelFormat || 'yuv420p',
        `-b:v`, platformConfig?.videoBitrate || bitrateConfig.videoBitrate,
        `-b:a`, platformConfig?.audioBitrate || bitrateConfig.audioBitrate,
        `-r`, `${fps}`,
        ...(hwAccel ? ['-hwaccel', 'auto', '-threads', '2'] : ['-threads', '2']),
        ...(platformConfig?.extraOutputOptions || ['-movflags', '+faststart']),
      ]);

    if (allFilters.length > 0) {
      cmd.videoFilter(allFilters);
    }

    if (formatConfig.container === 'mp4' || formatConfig.container === 'mov') {
      cmd.outputOptions('-movflags', '+faststart');
    }

    if (format === 'webm') {
      cmd.outputOptions('-deadline', 'good', '-cpu-used', '2', '-row-mt', '1');
    }

    cmd.save(outputPath);
    ffmpegCmd = cmd;

    const progressTimeout = setTimeout(async () => {
      try {
        await prisma.export.update({
          where: { id: exportId },
          data: { stage: 'Still rendering...' },
        });
      } catch { }
    }, 30000);

    cmd.on('progress', async (info) => {
      if (info.percent) {
        const progress = Math.min(99, Math.round(info.percent));
        if (progress > lastProgress) {
          lastProgress = progress;
          try {
            await prisma.export.update({
              where: { id: exportId },
              data: { progress, stage: `Rendering ${progress}%` },
            });
          } catch { }
        }
      }
    });

    cmd.on('end', async () => {
      clearTimeout(progressTimeout);
      try {
        const stat = await fs.stat(outputPath).catch(() => ({ size: 0 }));

        let videoDuration: number;
        try {
          const info = await getVideoInfo(outputPath);
          videoDuration = info.duration;
        } catch {
          videoDuration = 0;
        }

        await prisma.export.update({
          where: { id: exportId },
          data: {
            status: 'completed' as any,
            progress: 100,
            stage: 'Completed',
            fileSize: stat.size,
            duration: Math.round(videoDuration),
            completedAt: new Date(),
          },
        });

        logger.info('Export completed', { exportId, outputPath, fileSize: stat.size });
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    cmd.on('error', async (err) => {
      clearTimeout(progressTimeout);
      const errMsg = err.message;

      try {
        await prisma.export.update({
          where: { id: exportId },
          data: {
            status: 'failed' as any,
            error: errMsg,
            stage: 'Failed',
          },
        });
      } catch { }

      logger.error('Export failed', { exportId, error: errMsg });
      reject(new Error(errMsg));
    });
  });
}

export async function cancelExport(exportId: string, userId: string): Promise<boolean> {
  const exportRecord = await prisma.export.findFirst({
    where: { id: exportId, userId },
  });

  if (!exportRecord) return false;

  const cancelled = renderQueueService.cancel(`export-${exportId}`, userId);

  await prisma.export.update({
    where: { id: exportId },
    data: { status: 'cancelled' as any },
  });

  return cancelled;
}

export async function getExportProgress(exportId: string): Promise<{
  status: string;
  progress: number;
  stage?: string;
  error?: string | null;
} | null> {
  const exportRecord = await prisma.export.findUnique({
    where: { id: exportId },
    select: { status: true, progress: true, stage: true, error: true },
  });

  if (!exportRecord) return null;

  return {
    status: exportRecord.status,
    progress: exportRecord.progress,
    stage: exportRecord.stage || undefined,
    error: exportRecord.error,
  };
}

export async function cleanupOldExports(maxAgeDays: number = 7): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const oldExports = await prisma.export.findMany({
    where: {
      completedAt: { lt: cutoff },
      fileUrl: { not: null },
    },
    select: { id: true, fileUrl: true, userId: true },
  });

  let cleaned = 0;
  for (const exp of oldExports) {
    if (exp.fileUrl) {
      const filePath = path.join(process.cwd(), 'uploads', exp.fileUrl.replace('/uploads/', ''));
      try {
        await fs.unlink(filePath);
        cleaned++;
      } catch { }
    }
  }

  await prisma.export.deleteMany({
    where: { id: { in: oldExports.map((e) => e.id) } },
  });

  return cleaned;
}
