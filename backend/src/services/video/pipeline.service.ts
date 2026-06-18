import { PrismaClient, ExportFormat, ExportResolution } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../../config';
import logger from '../../config/logger';
import { progressService } from './progress.service';
import { getVideoInfo, getAudioInfo } from '../../utils/ffmpeg';

const prisma = new PrismaClient();

export interface ProcessingOptions {
  format: string;
  template?: string;
  resolution?: string;
  fps?: number;
  quality?: string;
  trim?: { start: number; end: number };
  crop?: { x: number; y: number; width: number; height: number };
  audio?: { volume?: number; mute?: boolean };
  watermark?: { image: string; position: string };
}

export interface ProcessingResult {
  outputPath: string;
  outputUrl: string;
  duration: number;
  fileSize: number;
  width: number;
  height: number;
}

export type PipelineJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PipelineJob {
  id: string;
  userId: string;
  projectId: string;
  status: PipelineJobStatus;
  progress: number;
  stage: string;
  options: ProcessingOptions;
  result?: ProcessingResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class PipelineService {
  private jobs: Map<string, PipelineJob> = new Map();

  async createJob(
    projectId: string,
    userId: string,
    options: ProcessingOptions
  ): Promise<PipelineJob> {
    const job: PipelineJob = {
      id: uuidv4(),
      userId,
      projectId,
      status: 'queued',
      progress: 0,
      stage: 'queued',
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(job.id, job);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'processing' },
    });

    logger.info('Pipeline job created', { jobId: job.id, projectId, userId });
    return job;
  }

  async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'cancelled') return;

    try {
      job.status = 'processing';
      job.stage = 'initializing';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);
      progressService.updateProgress(jobId, 0, 'initializing', job.userId);

      const project = await prisma.project.findUnique({
        where: { id: job.projectId },
        include: { uploads: true },
      });

      if (!project) {
        throw new Error(`Project ${job.projectId} not found`);
      }

      const outputDir = path.resolve(config.upload.dir, 'exports');
      await fs.mkdir(outputDir, { recursive: true });

      const outputFileName = `export_${jobId}_${uuidv4().slice(0, 8)}.${job.options.format || 'mp4'}`;
      const outputPath = path.join(outputDir, outputFileName);
      const outputUrl = `/uploads/exports/${outputFileName}`;

      if (project.uploads.length === 0) {
        throw new Error('No uploads to process');
      }

      job.stage = 'processing_video';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);

      const firstUpload = project.uploads[0]!;
      const inputPath = path.resolve(config.upload.dir, firstUpload.url.replace('/uploads/', ''));

      await this.runFFmpegProcessing(inputPath, outputPath, job);

      const outputStats = await fs.stat(outputPath).catch(() => ({ size: 0 }));
      let duration = 0;
      let width = 0;
      let height = 0;

      try {
        if (job.options.format === 'mp4' || job.options.format === 'webm' || job.options.format === 'mov') {
          const info = await getVideoInfo(outputPath);
          duration = info.duration;
          width = info.width;
          height = info.height;
        }
      } catch {
        logger.warn('Failed to probe output file', { outputPath });
      }

      const exportRecord = await prisma.export.create({
        data: {
          projectId: job.projectId,
          userId: job.userId,
          format: (job.options.format as ExportFormat) || 'mp4',
          resolution: (job.options.resolution as ExportResolution) || undefined,
          quality: job.options.quality || null,
          fileUrl: outputUrl,
          fileSize: outputStats.size,
          duration: duration || null,
          status: 'completed',
          completedAt: new Date(),
          metadata: job.options as any,
        },
      });

      await prisma.project.update({
        where: { id: job.projectId },
        data: {
          status: 'completed',
          duration: duration || undefined,
          resolution: job.options.resolution || undefined,
        },
      });

      job.status = 'completed';
      job.progress = 100;
      job.stage = 'completed';
      job.result = {
        outputPath,
        outputUrl,
        duration,
        fileSize: outputStats.size,
        width,
        height,
      };
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);
      progressService.updateProgress(jobId, 100, 'completed', job.userId);

      logger.info('Pipeline job completed', {
        jobId,
        projectId: job.projectId,
        exportId: exportRecord.id,
        duration,
        fileSize: outputStats.size,
      });
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error('Pipeline job failed', { jobId, error: errMsg });

      job.status = 'failed';
      job.error = errMsg;
      job.stage = 'failed';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);
      progressService.updateProgress(jobId, 0, `failed: ${errMsg}`, job.userId);

      await prisma.project
        .update({
          where: { id: job.projectId },
          data: { status: 'failed' },
        })
        .catch((e) => logger.error('Failed to update project status', { error: (e as Error).message }));

      await prisma.export
        .create({
          data: {
            projectId: job.projectId,
            userId: job.userId,
            format: (job.options.format as ExportFormat) || 'mp4',
            status: 'failed',
            error: errMsg,
          },
        })
        .catch((e) => logger.error('Failed to create failed export record', { error: (e as Error).message }));
    }
  }

  private runFFmpegProcessing(
    inputPath: string,
    outputPath: string,
    job: PipelineJob
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(inputPath);

      const format = job.options.format || 'mp4';

      if (job.options.trim) {
        cmd = cmd.seekInput(job.options.trim.start);
        cmd = cmd.duration(job.options.trim.end - job.options.trim.start);
      }

      if (job.options.crop) {
        const { x, y, width, height } = job.options.crop;
        cmd = cmd.videoFilter(`crop=${width}:${height}:${x}:${y}`);
      }

      if (job.options.resolution) {
        cmd = cmd.size(job.options.resolution);
      }

      if (job.options.fps) {
        cmd = cmd.fps(job.options.fps);
      }

      if (job.options.audio?.mute) {
        cmd = cmd.noAudio();
      } else if (job.options.audio?.volume !== undefined) {
        cmd = cmd.audioFilter(`volume=${job.options.audio.volume}`);
      }

      const codecMap: Record<string, { video: string; audio: string }> = {
        mp4: { video: 'libx264', audio: 'aac' },
        webm: { video: 'libvpx', audio: 'libvorbis' },
        mov: { video: 'libx264', audio: 'aac' },
        gif: { video: 'gif', audio: '' },
      };

      const codecs = codecMap[format] || { video: 'libx264', audio: 'aac' };
      cmd = cmd.videoCodec(codecs.video);
      if (codecs.audio && !job.options.audio?.mute) {
        cmd = cmd.audioCodec(codecs.audio);
      }

      const preset = job.options.quality === 'high' ? 'slow' : job.options.quality === 'low' ? 'veryfast' : 'fast';
      if (format !== 'gif') {
        cmd = cmd.outputOptions('-preset', preset);
        if (codecs.video === 'libx264') {
          cmd = cmd.outputOptions('-crf', job.options.quality === 'high' ? '18' : job.options.quality === 'low' ? '28' : '23');
        }
      }

      let lastProgress = 0;

      cmd
        .on('start', (commandLine) => {
          logger.debug('FFmpeg processing started', { jobId: job.id, commandLine });
          progressService.updateProgress(job.id, 0, 'encoding', job.userId);
        })
        .on('progress', (info) => {
          const pct = info.percent !== undefined ? Math.round(info.percent) : 0;
          if (pct > lastProgress) {
            lastProgress = pct;
            job.progress = Math.min(99, pct);
            job.stage = 'encoding';
            this.jobs.set(job.id, job);
            progressService.updateProgress(job.id, job.progress, 'encoding', job.userId);
          }
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        })
        .on('end', () => {
          resolve();
        })
        .save(outputPath);
    });
  }

  getJob(jobId: string): PipelineJob | undefined {
    return this.jobs.get(jobId);
  }

  getUserJobs(userId: string): PipelineJob[] {
    return Array.from(this.jobs.values()).filter((j) => j.userId === userId);
  }

  cancelJob(jobId: string, userId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId) return false;
    if (job.status === 'completed' || job.status === 'failed') return false;

    job.status = 'cancelled';
    job.stage = 'cancelled';
    job.updatedAt = new Date();
    this.jobs.set(jobId, job);
    progressService.updateProgress(jobId, 0, 'cancelled', userId);

    prisma.project
      .update({
        where: { id: job.projectId },
        data: { status: 'draft' },
      })
      .catch((e) => logger.error('Failed to update project status on cancel', { error: (e as Error).message }));

    logger.info('Pipeline job cancelled', { jobId, userId });
    return true;
  }

  getJobProgress(jobId: string): { progress: number; stage: string; status: string } | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return { progress: job.progress, stage: job.stage, status: job.status };
  }

  async cleanupOldJobs(): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    for (const [id, job] of this.jobs.entries()) {
      if (job.updatedAt < thirtyMinutesAgo && (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')) {
        if (job.result) {
          await fs.unlink(job.result.outputPath).catch(() => {});
        }
        this.jobs.delete(id);
        progressService.clearProgress(id);
      }
    }
  }
}

export const pipelineService = new PipelineService();
