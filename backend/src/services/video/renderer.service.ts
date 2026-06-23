import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import logger from '@/config/logger';
import { getVideoInfo, getHardwareAcceleration } from '@/utils/ffmpeg';
import { buildScaleFilter } from '@/utils/ffmpeg-commands';

export interface RenderOptions {
  format: 'vertical' | 'horizontal' | 'square';
  quality: 'draft' | 'standard' | 'premium';
  fps?: number;
  crf?: number;
  bitrate?: string;
  audioBitrate?: string;
  codec?: string;
}

const FORMAT_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  horizontal: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

const QUALITY_PRESETS: Record<string, { crf: number; preset: string; videoBitrate: string; audioBitrate: string }> = {
  draft: { crf: 28, preset: 'veryfast', videoBitrate: '2M', audioBitrate: '96k' },
  standard: { crf: 23, preset: 'medium', videoBitrate: '8M', audioBitrate: '192k' },
  premium: { crf: 18, preset: 'slow', videoBitrate: '20M', audioBitrate: '320k' },
};

export function getFormatResolution(format: string): { width: number; height: number } {
  return FORMAT_RESOLUTIONS[format] || FORMAT_RESOLUTIONS.horizontal!;
}

export async function renderVideo(
  inputPath: string,
  outputPath: string,
  options: RenderOptions,
  onProgress?: (p: number) => void
): Promise<{ outputPath: string; duration: number; fileSize: number }> {
  const info = await getVideoInfo(inputPath);
  const quality = QUALITY_PRESETS[options.quality] || QUALITY_PRESETS.standard!;
  const hwAccel = getHardwareAcceleration();
  const codec = options.codec || 'libx264';

  const targetRes = FORMAT_RESOLUTIONS[options.format] || FORMAT_RESOLUTIONS.horizontal!;
  const scaleFilter = buildScaleFilter(targetRes.width, targetRes.height);

  return new Promise((resolve, reject) => {
    let lastProgress = 0;
    const cmd = ffmpeg(inputPath)
      .videoFilter(scaleFilter)
      .videoCodec(codec)
      .audioCodec('aac')
      .outputOptions([
        `-preset ${quality.preset}`,
        `-crf ${options.crf ?? quality.crf}`,
        '-pix_fmt', 'yuv420p',
        `-b:v ${options.bitrate || quality.videoBitrate}`,
        `-b:a ${options.audioBitrate || quality.audioBitrate}`,
        ...(options.fps ? [`-r ${options.fps}`] : []),
        '-movflags', '+faststart',
      ])
      .save(outputPath);

    let stderrLog = '';
    cmd.on('error', (err) => {
      logger.error('Render error', { error: err.message, stderr: stderrLog.slice(-1000) });
      reject(new Error(`Render failed: ${err.message}`));
    });

    cmd.on('end', async () => {
      onProgress?.(100);
      const stat = await fs.stat(outputPath).catch(() => ({ size: 0 }));
      resolve({
        outputPath,
        duration: info.duration,
        fileSize: stat.size,
      });
    });

    cmd.on('stderr', (line) => {
      stderrLog += line + '\n';
      const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseInt(match[1]!, 10);
        const minutes = parseInt(match[2]!, 10);
        const seconds = parseFloat(match[3]!);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min(99, Math.round((currentTime / info.duration) * 100));
        if (progress > lastProgress) {
          lastProgress = progress;
          onProgress?.(progress);
        }
      }
    });
  });
}

export async function renderPreview(
  inputPath: string,
  outputPath: string,
  duration?: number,
  onProgress?: (p: number) => void
): Promise<string> {
  const info = await getVideoInfo(inputPath);
  const previewDuration = Math.min(duration || 15, info.duration);

  return new Promise((resolve, reject) => {
    let lastProgress = 0;

    const cmd = ffmpeg(inputPath)
      .seekInput(0)
      .duration(previewDuration)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset', 'ultrafast',
        '-crf', '35',
        '-pix_fmt', 'yuv420p',
        '-b:v', '1M',
        '-b:a', '96k',
        '-r', '30',
        '-vf', `scale=${Math.round(info.width / 2)}:${Math.round(info.height / 2)}`,
      ])
      .save(outputPath);

    cmd.on('error', (err) => {
      logger.error('Preview render error', { error: err.message });
      reject(new Error(`Preview render failed: ${err.message}`));
    });

    cmd.on('end', () => {
      onProgress?.(100);
      resolve(outputPath);
    });

    cmd.on('stderr', (line) => {
      const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseInt(match[1]!, 10);
        const minutes = parseInt(match[2]!, 10);
        const seconds = parseFloat(match[3]!);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min(99, Math.round((currentTime / previewDuration) * 100));
        if (progress > lastProgress) {
          lastProgress = progress;
          onProgress?.(progress);
        }
      }
    });
  });
}

const PLATFORM_CONFIGS: Record<string, { format: string; resolution: string; codec: string; fps: number; bitrate: string; audioBitrate: string }> = {
  tiktok: { format: 'vertical', resolution: '1080x1920', codec: 'h264', fps: 60, bitrate: '8M', audioBitrate: '192k' },
  youtube: { format: 'horizontal', resolution: '1920x1080', codec: 'h264', fps: 30, bitrate: '16M', audioBitrate: '320k' },
  instagram: { format: 'square', resolution: '1080x1080', codec: 'h264', fps: 30, bitrate: '6M', audioBitrate: '192k' },
  shorts: { format: 'vertical', resolution: '1080x1920', codec: 'h264', fps: 60, bitrate: '10M', audioBitrate: '256k' },
  reels: { format: 'vertical', resolution: '1080x1920', codec: 'h264', fps: 30, bitrate: '8M', audioBitrate: '192k' },
};

export async function exportForPlatform(
  inputPath: string,
  outputPath: string,
  platform: string,
  onProgress?: (p: number) => void
): Promise<string> {
  const cfg = PLATFORM_CONFIGS[platform];
  if (!cfg) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const info = await getVideoInfo(inputPath);
  const hwAccel = getHardwareAcceleration();
  const videoCodec = 'libx264';

  const formatKey = cfg.format as 'vertical' | 'horizontal' | 'square';
  const targetRes = FORMAT_RESOLUTIONS[formatKey] || FORMAT_RESOLUTIONS.horizontal!;
  const scaleFilter = buildScaleFilter(targetRes.width, targetRes.height);

  return new Promise((resolve, reject) => {
    let lastProgress = 0;

    const cmd = ffmpeg(inputPath)
      .videoFilter(scaleFilter)
      .videoCodec(videoCodec)
      .audioCodec('aac')
      .outputOptions([
        '-preset', 'medium',
        '-crf', '22',
        '-pix_fmt', 'yuv420p',
        `-b:v ${cfg.bitrate}`,
        `-b:a ${cfg.audioBitrate}`,
        `-r ${cfg.fps}`,
        '-movflags', '+faststart',
      ])
      .save(outputPath);

    cmd.on('error', (err) => {
      logger.error('Platform export error', { platform, error: err.message });
      reject(new Error(`Export for ${platform} failed: ${err.message}`));
    });

    cmd.on('end', () => {
      onProgress?.(100);
      resolve(outputPath);
    });

    cmd.on('stderr', (line) => {
      const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseInt(match[1]!, 10);
        const minutes = parseInt(match[2]!, 10);
        const seconds = parseFloat(match[3]!);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min(99, Math.round((currentTime / info.duration) * 100));
        if (progress > lastProgress) {
          lastProgress = progress;
          onProgress?.(progress);
        }
      }
    });
  });
}
