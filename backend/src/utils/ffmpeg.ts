import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import logger from '../config/logger';

let FFMPEG_STATIC_PATH: string | null = null;

try {
  FFMPEG_STATIC_PATH = require('ffmpeg-static');
  if (FFMPEG_STATIC_PATH) {
    ffmpeg.setFfmpegPath(FFMPEG_STATIC_PATH);
    ffmpeg.setFfprobePath(FFMPEG_STATIC_PATH);
  }
} catch { /* ffmpeg-static not available, rely on system PATH */ }

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
    const ffmpegPath = FFMPEG_STATIC_PATH || 'ffmpeg';
    const proc = execFile(ffmpegPath, [
      '-i', filePath,
      '-f', 'null',
      '-',
    ], { timeout: 30000 }, (err, _stdout, stderr) => {
      // ffmpeg always exits with code 1 when using -i without -y, that's expected
      const output = stderr || '';

      const streams: ffmpeg.FfprobeStream[] = [];
      const format = {
        filename: filePath,
        nb_streams: 0,
        format_name: 'unknown',
        format_long_name: 'unknown',
        start_time: 0,
        duration: 0,
        size: 0,
        bit_rate: 0,
        probe_score: 0,
      } as ffmpeg.FfprobeFormat;

      const durMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (durMatch) {
        const h = parseInt(durMatch[1]!, 10);
        const m = parseInt(durMatch[2]!, 10);
        const s = parseFloat(durMatch[3]!);
        format.duration = h * 3600 + m * 60 + s;
      }

      const brMatch = output.match(/bitrate:\s*(\d+)\s*kb\/s/);
      if (brMatch) {
        format.bit_rate = parseInt(brMatch[1]!, 10) * 1000;
      }

      // Parse streams
      const streamBlocks = output.split(/Stream #0:/g).slice(1);
      for (const block of streamBlocks) {
        const isVideo = block.includes(': Video:');
        const isAudio = block.includes(': Audio:');
        if (isVideo) {
          const wMatch = block.match(/, (\d{3,5})x(\d{3,5})\s/);
          const fpsMatch = block.match(/([\d.]+)\s*(?:fps|tbr)/);
          const codecMatch = block.match(/Video:\s*(\S+)/);
          streams.push({
            index: streams.length,
            codec_type: 'video',
            codec_name: codecMatch?.[1] || 'unknown',
            width: wMatch ? parseInt(wMatch[1]!, 10) : undefined,
            height: wMatch ? parseInt(wMatch[2]!, 10) : undefined,
            r_frame_rate: fpsMatch ? `${fpsMatch[1]}/1` : undefined,
            codec_tag: '0x0000',
            codec_tag_string: 'unknown',
            id: '0x0',
            start_time: '0',
            duration: format.duration,
          } as any);
        } else if (isAudio) {
          const codecMatch = block.match(/Audio:\s*(\S+)/);
          const srMatch = block.match(/(\d+)\s*Hz/);
          const chMatch = block.match(/(\d+)\s*channels?/);
          streams.push({
            index: streams.length,
            codec_type: 'audio',
            codec_name: codecMatch?.[1] || 'unknown',
            sample_rate: srMatch ? parseInt(srMatch[1]!, 10) : undefined,
            channels: chMatch ? parseInt(chMatch[1]!, 10) : undefined,
            codec_tag: '0x0000',
            codec_tag_string: 'unknown',
            id: '0x0',
            start_time: '0',
            duration: format.duration,
          } as any);
        }
      }

      format.nb_streams = streams.length;
      resolve({ streams, format });
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to probe file: ${err.message}`));
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
      execFile(FFMPEG_STATIC_PATH || 'ffmpeg', ['-version'], { timeout: 10000 }, (err) => {
        if (err) reject(err); else resolve();
      });
    });
    return true;
  } catch {
    logger.error('FFmpeg not found');
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
    const output = execFileSync(FFMPEG_STATIC_PATH || 'ffmpeg', ['-encoders'], { timeout: 10000, encoding: 'utf8' });
    if (output.includes('h264_nvenc')) return 'h264_nvenc';
    if (output.includes('h264_amf')) return 'h264_amf';
    if (output.includes('h264_videotoolbox')) return 'h264_videotoolbox';
    if (output.includes('h264_qsv')) return 'h264_qsv';
  } catch {
    // ignore
  }
  return null;
}
