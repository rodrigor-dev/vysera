import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import logger from '../config/logger';

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audioCodec: string | null;
  audioBitrate: number | null;
  hasAudio: boolean;
  aspectRatio: number;
}

export interface AudioInfo {
  duration: number;
  codec: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export interface FFProbeData {
  streams: ffmpeg.FfprobeStream[];
  format: ffmpeg.FfprobeFormat;
}

function parseFps(fpsStr?: string | number): number {
  if (!fpsStr) return 0;
  if (typeof fpsStr === 'number') return fpsStr;
  const match = fpsStr.match(/(\d+)\/?\d*/);
  return match ? parseInt(match[1]!, 10) : 0;
}

export function probeFile(filePath: string): Promise<FFProbeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        logger.error('FFprobe error', { filePath, error: err.message });
        reject(new Error(`Failed to probe file: ${err.message}`));
        return;
      }
      resolve({
        streams: data.streams,
        format: data.format,
      });
    });
  });
}

export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  const probeData = await probeFile(filePath);
  const videoStream = probeData.streams.find(s => s.codec_type === 'video');
  const audioStream = probeData.streams.find(s => s.codec_type === 'audio');

  if (!videoStream) {
    throw new Error('No video stream found in file');
  }

  const w = videoStream.width || 0;
  const h = videoStream.height || 0;

  const info: VideoInfo = {
    duration: parseFloat(probeData.format.duration?.toString() || '0'),
    width: w,
    height: h,
    fps: parseFps(videoStream.r_frame_rate),
    codec: videoStream.codec_name || 'unknown',
    bitrate: parseInt(probeData.format.bit_rate?.toString() || '0', 10),
    audioCodec: null,
    audioBitrate: null,
    hasAudio: !!audioStream,
    aspectRatio: w > 0 && h > 0 ? parseFloat((w / h).toFixed(4)) : 1,
  };

  if (audioStream) {
    info.audioCodec = audioStream.codec_name || null;
    info.audioBitrate = audioStream.bit_rate ? parseInt(audioStream.bit_rate.toString(), 10) : null;
  }

  return info;
}

export async function getAudioInfo(filePath: string): Promise<AudioInfo> {
  const probeData = await probeFile(filePath);
  const audioStream = probeData.streams.find(s => s.codec_type === 'audio');

  if (!audioStream) {
    throw new Error('No audio stream found in file');
  }

  return {
    duration: parseFloat(probeData.format.duration?.toString() || '0'),
    codec: audioStream.codec_name || 'unknown',
    bitrate: parseInt(audioStream.bit_rate?.toString() || '0', 10),
    sampleRate: audioStream.sample_rate || 0,
    channels: audioStream.channels || 0,
  };
}

export async function getVideoDimensions(filePath: string): Promise<{ width: number; height: number }> {
  const info = await getVideoInfo(filePath);
  return { width: info.width, height: info.height };
}

export async function getVideoDuration(filePath: string): Promise<number> {
  const info = await getVideoInfo(filePath);
  return info.duration;
}

export async function ensureFFmpeg(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      execFile('ffmpeg', ['-version'], { timeout: 10000 }, (err) => {
        if (err) reject(err); else resolve();
      });
    });
    await new Promise<void>((resolve, reject) => {
      execFile('ffprobe', ['-version'], { timeout: 10000 }, (err) => {
        if (err) reject(err); else resolve();
      });
    });
    return true;
  } catch {
    logger.error('FFmpeg or ffprobe not found in PATH');
    return false;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureTempDir(dirPath: string): Promise<string> {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

export function getHardwareAcceleration(): string | null {
  try {
    const { execFileSync } = require('child_process');
    const output = execFileSync('ffmpeg', ['-encoders'], { timeout: 10000, encoding: 'utf8' });
    if (output.includes('h264_nvenc')) return 'h264_nvenc';
    if (output.includes('h264_amf')) return 'h264_amf';
    if (output.includes('h264_videotoolbox')) return 'h264_videotoolbox';
    if (output.includes('h264_qsv')) return 'h264_qsv';
  } catch {
    // ignore
  }
  return null;
}
