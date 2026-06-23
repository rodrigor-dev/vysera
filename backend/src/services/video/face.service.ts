import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/config/logger';
import { getVideoInfo, ensureTempDir } from '@/utils/ffmpeg';

const execFileAsync = promisify(execFile);

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
  const maxFrames = Math.min(totalFrames, 300);

  const extractFrame = (i: number, timestamp: number): Promise<string> => {
    const framePath = path.join(tempDir, `frame_${i.toString().padStart(5, '0')}.jpg`);
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Frame extraction timed out')), 30000);
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        .outputOptions('-q:v', '2')
        .output(framePath)
        .on('error', (err) => { clearTimeout(timeout); reject(err); })
        .on('end', () => { clearTimeout(timeout); resolve(framePath); })
        .run();
    });
  };

  try {
    const extractPromises: Promise<string>[] = [];
    for (let i = 0; i < maxFrames; i++) {
      const timestamp = i * sampleInterval;
      if (timestamp > info.duration) break;
      extractPromises.push(extractFrame(i, timestamp));
    }

    const framePaths = await Promise.all(extractPromises);

    const results = await analyzeFramesBatch(tempDir, framePaths.length);

    for (let i = 0; i < results.length && i < maxFrames; i++) {
      const timestamp = i * sampleInterval;
      faceData.push({ timestamp, faces: results[i]! });
    }
  } catch (err) {
    logger.warn('Face detection interrupted', { error: (err as Error).message });
  }

  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

  return faceData;
}

async function analyzeFramesBatch(
  framesDir: string,
  expectedCount: number
): Promise<Array<Array<{ x: number; y: number; width: number; height: number; confidence: number }>>> {
  try {
    const { stdout } = await execFileAsync('python', [
      'scripts/detect_faces_batch.py',
      framesDir,
    ], { timeout: 60000 });

    const parsed = JSON.parse(stdout);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((frameFaces: any) => {
      if (!Array.isArray(frameFaces)) return [];
      return frameFaces.map((f: { x: number; y: number; width: number; height: number; confidence?: number }) => ({
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        confidence: f.confidence ?? 1,
      }));
    });
  } catch (err) {
    logger.warn('Batch face detection failed', { error: (err as Error).message, framesDir });
    return Array.from({ length: expectedCount }, () => []);
  }
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

function buildZoompanFilter(keyframes: ZoomKeyframe[], info: { width: number; height: number; duration: number }): string {
  if (keyframes.length === 0) return 'null';

  const allIdentity = keyframes.every(k => k.zoom === 1 && k.x === 0 && k.y === 0);
  if (allIdentity) return 'null';

  const totalFrames = Math.max(1, Math.round(info.duration * FPS));
  const [w, h] = [info.width, info.height];

  function buildExpr(
    keys: ZoomKeyframe[],
    getVal: (k: ZoomKeyframe) => number,
    lastVal: number
  ): string {
    let expr = `${lastVal}`;
    for (let i = keys.length - 1; i >= 0; i--) {
      const kf = keys[i]!;
      const nextKf = keys[i + 1];
      const frameEnd = nextKf ? Math.round(nextKf.time * FPS) - 1 : totalFrames - 1;
      if (frameEnd < 0) continue;
      expr = `if(lte(n,${frameEnd}),${getVal(kf)},${expr})`;
    }
    return expr;
  }

  const lastKf = keyframes[keyframes.length - 1]!;
  const zoomExpr = buildExpr(keyframes, k => k.zoom, lastKf.zoom);
  const xExpr = buildExpr(keyframes, k => k.x, lastKf.x);
  const yExpr = buildExpr(keyframes, k => k.y, lastKf.y);

  return `zoompan=z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=1:s=${w}x${h}:fps=${FPS}`;
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

    if (filterChain === 'null') {
      fs.copyFile(inputPath, outputPath).then(() => {
        onProgress?.(100);
        resolve(outputPath);
      }).catch(reject);
      return;
    }

    const cmd = ffmpeg(inputPath)
      .videoFilter(filterChain)
      .outputOptions('-c:v', 'libx264', '-preset', 'fast', '-crf', '22')
      .outputOptions('-c:a', 'copy')
      .on('error', (err) => {
        logger.error('Auto zoom apply error', { error: err.message });
        reject(new Error(`Auto zoom failed: ${err.message}`));
      })
      .on('end', () => {
        onProgress?.(100);
        resolve(outputPath);
      })
      .on('stderr', (line) => {
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
      })
      .save(outputPath);
  });
}
