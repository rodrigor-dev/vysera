import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import logger from '@/config/logger';
import { getVideoInfo } from '@/utils/ffmpeg';
import { buildColorGradingFilter, buildTransitionFilter, buildTextFilter } from '@/utils/ffmpeg-commands';

export const COLOR_STYLES: Record<string, string> = {
  cinematic: 'cinematic',
  vibrant: 'vibrant',
  vintage: 'vintage',
  dark: 'dark',
  clean: 'clean',
  futuristic: 'futuristic',
  gold: 'gold',
  moody: 'moody',
};

export async function applyColorGrading(
  inputPath: string,
  outputPath: string,
  style: string,
  onProgress?: (p: number) => void
): Promise<string> {
  const filter = buildColorGradingFilter(style);
  if (!filter) {
    throw new Error(`Unknown color grading style: ${style}`);
  }

  const info = await getVideoInfo(inputPath);

  return new Promise((resolve, reject) => {
    let lastProgress = 0;

    const cmd = ffmpeg(inputPath)
      .videoFilter(filter)
      .outputOptions('-c:v', 'libx264', '-preset', 'slow', '-crf', '18')
      .outputOptions('-c:a', 'copy')
      .save(outputPath);

    cmd.on('error', (err) => {
      logger.error('Color grading error', { style, error: err.message });
      reject(new Error(`Color grading failed: ${err.message}`));
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

export async function applyTransitions(
  inputPath: string,
  outputPath: string,
  segments: Array<{ start: number; end: number }>,
  style: string,
  onProgress?: (p: number) => void
): Promise<string> {
  if (segments.length < 2) {
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }

  const transitionDuration = 0.5;
  const transitionFilter = buildTransitionFilter(style, transitionDuration);

  const info = await getVideoInfo(inputPath);

  return new Promise((resolve, reject) => {
    let lastProgress = 0;

    const cmd = ffmpeg(inputPath)
      .videoFilter(transitionFilter)
      .outputOptions('-c:v', 'libx264', '-preset', 'medium', '-crf', '20')
      .outputOptions('-c:a', 'aac', '-b:a', '128k')
      .save(outputPath);

    cmd.on('error', (err) => {
      logger.error('Transition error', { style, error: err.message });
      reject(new Error(`Transition failed: ${err.message}`));
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

export async function addTextOverlay(
  inputPath: string,
  outputPath: string,
  text: string,
  options: any,
  onProgress?: (p: number) => void
): Promise<string> {
  const info = await getVideoInfo(inputPath);

  const fontSize = options.fontSize || Math.round(info.height / 20);
  const x = options.x ?? '(w-text_w)/2';
  const y = options.y ?? 'h-th-10';
  const font = options.font || 'Arial';
  const color = options.color || 'white';

  const filter = buildTextFilter(text, {
    font,
    size: fontSize,
    color,
    x: typeof x === 'number' ? x : 0,
    y: typeof y === 'number' ? y : 0,
  });

  const enableStr = options.startTime !== undefined && options.endTime !== undefined
    ? `:enable='between(t,${options.startTime},${options.endTime})'`
    : '';

  const fullFilter = `${filter}${enableStr}`;

  return new Promise((resolve, reject) => {
    let lastProgress = 0;

    const cmd = ffmpeg(inputPath)
      .videoFilter(fullFilter)
      .outputOptions('-c:v', 'libx264', '-preset', 'fast', '-crf', '22')
      .outputOptions('-c:a', 'copy')
      .save(outputPath);

    cmd.on('error', (err) => {
      logger.error('Text overlay error', { error: err.message });
      reject(new Error(`Text overlay failed: ${err.message}`));
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
