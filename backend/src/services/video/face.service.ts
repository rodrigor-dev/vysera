import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '@/config/logger';
import { getVideoInfo, ensureTempDir } from '@/utils/ffmpeg';

export interface FaceData {
  timestamp: number;
  faces: Array<{ x: number; y: number; width: number; height: number; confidence: number }>;
}

export interface ZoomKeyframe {
  time: number;
  zoom: number;
  x: number;
  y: number;
  ease: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

const FPS = 30;

export async function detectFaces(videoPath: string): Promise<FaceData[]> {
  const sampleInterval = 1;
  const info = await getVideoInfo(videoPath);
  const tempDir = path.join(path.dirname(videoPath), `faces_${uuidv4()}`);
  await ensureTempDir(tempDir);

  const faceData: FaceData[] = [];
  const totalFrames = Math.ceil(info.duration / sampleInterval);

  try {
    for (let i = 0; i < totalFrames && i < 300; i++) {
      const timestamp = i * sampleInterval;
      if (timestamp > info.duration) break;

      const framePath = path.join(tempDir, `frame_${i.toString().padStart(5, '0')}.jpg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(timestamp)
          .frames(1)
          .outputOptions('-q:v', '2')
          .save(framePath)
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .run();
      });

      const faces = await analyzeFrameForFaces(framePath);
      faceData.push({ timestamp, faces });

      await fs.unlink(framePath).catch(() => {});
    }
  } catch (err) {
    logger.warn('Face detection interrupted', { error: (err as Error).message });
  }

  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

  return faceData;
}

async function analyzeFrameForFaces(
  framePath: string
): Promise<Array<{ x: number; y: number; width: number; height: number; confidence: number }>> {
  try {
    const metadata = await sharp(framePath).metadata();
    const width = metadata.width || 1920;
    const height = metadata.height || 1080;

    const stats = await sharp(framePath).stats();
    const { channels } = stats;
    const hasSkinTone = detectSkinToneRegion(stats);

    if (!hasSkinTone) {
      return [];
    }

    const r = channels[0]?.mean || 0;
    const g = channels[1]?.mean || 0;
    const b = channels[2]?.mean || 0;
    const avgBrightness = (r + g + b) / 3;

    const centerX = width * 0.5;
    const centerY = height * 0.35;
    const regionWidth = width * 0.3;
    const regionHeight = height * 0.4;

    const confidence = Math.min(1,
      (avgBrightness > 40 && avgBrightness < 220 ? 0.6 : 0.3) * (hasSkinTone ? 1.5 : 0.5)
    );

    return [{
      x: Math.max(0, centerX - regionWidth / 2),
      y: Math.max(0, centerY - regionHeight / 2),
      width: regionWidth,
      height: regionHeight,
      confidence,
    }];
  } catch {
    return [];
  }
}

function detectSkinToneRegion(stats: sharp.Stats): boolean {
  const { channels } = stats;
  const r = channels[0]?.mean || 0;
  const g = channels[1]?.mean || 0;
  const b = channels[2]?.mean || 0;

  const skinRatio = r / Math.max(1, g);
  const redDominance = (r - g) / Math.max(1, r);

  return skinRatio > 0.8 && skinRatio < 1.4 && redDominance > -0.1 && redDominance < 0.2 && r > 30 && g > 20;
}

export async function generateZoomKeyframes(
  videoPath: string,
  faceData?: FaceData[]
): Promise<ZoomKeyframe[]> {
  const info = await getVideoInfo(videoPath);

  if (!faceData || faceData.length === 0) {
    try {
      faceData = await detectFaces(videoPath);
    } catch {
      faceData = [];
    }
  }

  const keyframes: ZoomKeyframe[] = [];

  if (faceData.length === 0) {
    keyframes.push({ time: 0, zoom: 1, x: 0, y: 0, ease: 'linear' });
    keyframes.push({ time: info.duration, zoom: 1, x: 0, y: 0, ease: 'linear' });
    return keyframes;
  }

  for (let i = 0; i < faceData.length; i++) {
    const data = faceData[i]!;
    const timestamp = data.timestamp;

    if (data.faces.length > 0) {
      const face = data.faces[0]!;
      const centerX = face.x + face.width / 2;
      const centerY = face.y + face.height / 2;

      const faceSize = face.width * face.height;
      const frameSize = info.width * info.height;
      const faceRatio = faceSize / frameSize;

      let zoom = 1.0;
      if (faceRatio < 0.05) {
        zoom = 1.6;
      } else if (faceRatio < 0.1) {
        zoom = 1.3;
      }

      const zoomedFrameW = info.width / zoom;
      const zoomedFrameH = info.height / zoom;

      let xOffset = centerX - zoomedFrameW / 2;
      let yOffset = centerY - zoomedFrameH / 2;

      xOffset = Math.max(0, Math.min(info.width - zoomedFrameW, xOffset));
      yOffset = Math.max(0, Math.min(info.height - zoomedFrameH, yOffset));

      const ease: ZoomKeyframe['ease'] = i === 0 ? 'ease-out' : 'ease-in-out';

      keyframes.push({
        time: timestamp,
        zoom,
        x: xOffset,
        y: yOffset,
        ease,
      });
    } else {
      const prev = keyframes[keyframes.length - 1];
      if (prev) {
        keyframes.push({ time: timestamp, zoom: 1.0, x: 0, y: 0, ease: 'linear' });
      } else {
        keyframes.push({ time: timestamp, zoom: 1.0, x: 0, y: 0, ease: 'linear' });
      }
    }
  }

  const last = keyframes[keyframes.length - 1]!;
  if (last.time < info.duration) {
    keyframes.push({ time: info.duration, zoom: last.zoom, x: last.x, y: last.y, ease: 'linear' });
  }

  return keyframes;
}

function buildZoompanFilter(keyframes: ZoomKeyframe[], info: { width: number; height: number }): string {
  if (keyframes.length === 0) return 'null';

  const [w, h] = [info.width, info.height];

  const parts: string[] = [];
  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i]!;
    const next = keyframes[i + 1];
    const start = kf.time;
    const end = next ? next.time : start + 2;
    const dur = end - start;
    const durFrames = Math.max(1, Math.round(dur * FPS));
    const frameNum = Math.round(start * FPS);

    if (i > 0) {
      parts.push(`zoompan=z='${kf.zoom}':x='${kf.x}':y='${kf.y}':d=${durFrames}:s=${w}x${h}:fps=${FPS}`);
    } else {
      parts.push(`zoompan=z='${kf.zoom}':x='${kf.x}':y='${kf.y}':d=${durFrames}:s=${w}x${h}:fps=${FPS}`);
    }
  }

  return parts.join(',');
}

export async function applyAutoZoom(
  inputPath: string,
  outputPath: string,
  keyframes: ZoomKeyframe[],
  onProgress?: (p: number) => void
): Promise<string> {
  const info = await getVideoInfo(inputPath);
  const filterChain = buildZoompanFilter(keyframes, info);

  return new Promise((resolve, reject) => {
    let lastProgress = 0;

    const cmd = ffmpeg(inputPath)
      .videoFilter(filterChain)
      .outputOptions('-c:v', 'libx264', '-preset', 'fast', '-crf', '22')
      .outputOptions('-c:a', 'copy')
      .save(outputPath);

    cmd.on('error', (err) => {
      logger.error('Auto zoom apply error', { error: err.message });
      reject(new Error(`Auto zoom failed: ${err.message}`));
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
