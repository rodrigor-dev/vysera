import { getVideoInfo } from '@/utils/ffmpeg';
import logger from '@/config/logger';

export interface PlatformConfig {
  label: string;
  resolution: { width: number; height: number };
  fps: number;
  codec: string;
  videoBitrate: string;
  audioBitrate: string;
  crf: number;
  preset: string;
  pixelFormat: string;
  extraFilters: string[];
  extraOutputOptions: string[];
  description: string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  tiktok: {
    label: 'TikTok',
    resolution: { width: 1080, height: 1920 },
    fps: 60,
    codec: 'h264',
    videoBitrate: '8M',
    audioBitrate: '192k',
    crf: 22,
    preset: 'medium',
    pixelFormat: 'yuv420p',
    extraFilters: ['eq=contrast=1.1:brightness=0.05:saturation=1.2'],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Vertical 9:16, 60fps, high contrast, vibrant',
  },
  'tiktok-draft': {
    label: 'TikTok (Draft)',
    resolution: { width: 720, height: 1280 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '3M',
    audioBitrate: '96k',
    crf: 28,
    preset: 'veryfast',
    pixelFormat: 'yuv420p',
    extraFilters: ['eq=contrast=1.05:brightness=0.03:saturation=1.1'],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Lower quality for quick previews',
  },
  instagram: {
    label: 'Instagram',
    resolution: { width: 1080, height: 1080 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '6M',
    audioBitrate: '192k',
    crf: 23,
    preset: 'medium',
    pixelFormat: 'yuv420p',
    extraFilters: ['eq=saturation=1.15:brightness=0.03'],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Square 1:1, 30fps, vibrant colors',
  },
  'instagram-story': {
    label: 'Instagram Story',
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '6M',
    audioBitrate: '192k',
    crf: 23,
    preset: 'medium',
    pixelFormat: 'yuv420p',
    extraFilters: ['eq=saturation=1.1:brightness=0.05'],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Vertical 9:16 for Stories/Reels',
  },
  'instagram-reel': {
    label: 'Instagram Reel',
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '8M',
    audioBitrate: '256k',
    crf: 21,
    preset: 'medium',
    pixelFormat: 'yuv420p',
    extraFilters: ['eq=saturation=1.2:contrast=1.05'],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Vertical 9:16, optimized for Reels',
  },
  youtube: {
    label: 'YouTube',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '16M',
    audioBitrate: '320k',
    crf: 18,
    preset: 'slow',
    pixelFormat: 'yuv420p',
    extraFilters: [],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Full HD 16:9, high quality',
  },
  'youtube-4k': {
    label: 'YouTube 4K',
    resolution: { width: 3840, height: 2160 },
    fps: 60,
    codec: 'h264',
    videoBitrate: '45M',
    audioBitrate: '384k',
    crf: 16,
    preset: 'slow',
    pixelFormat: 'yuv420p10le',
    extraFilters: [],
    extraOutputOptions: ['-movflags', '+faststart', '-profile:v', 'high10'],
    description: '4K UHD, 60fps, maximum quality',
  },
  youtube_shorts: {
    label: 'YouTube Shorts',
    resolution: { width: 1080, height: 1920 },
    fps: 60,
    codec: 'h264',
    videoBitrate: '10M',
    audioBitrate: '256k',
    crf: 21,
    preset: 'medium',
    pixelFormat: 'yuv420p',
    extraFilters: [],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Vertical 9:16 for Shorts',
  },
  twitter: {
    label: 'Twitter/X',
    resolution: { width: 1280, height: 720 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '5M',
    audioBitrate: '128k',
    crf: 24,
    preset: 'fast',
    pixelFormat: 'yuv420p',
    extraFilters: [],
    extraOutputOptions: ['-movflags', '+faststart', '-profile:v', 'main'],
    description: 'Optimized for Twitter upload',
  },
  linkedin: {
    label: 'LinkedIn',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '8M',
    audioBitrate: '192k',
    crf: 23,
    preset: 'fast',
    pixelFormat: 'yuv420p',
    extraFilters: [],
    extraOutputOptions: ['-movflags', '+faststart'],
    description: 'Professional 16:9 format',
  },
  whatsapp: {
    label: 'WhatsApp',
    resolution: { width: 854, height: 480 },
    fps: 30,
    codec: 'h264',
    videoBitrate: '1.5M',
    audioBitrate: '64k',
    crf: 28,
    preset: 'veryfast',
    pixelFormat: 'yuv420p',
    extraFilters: [],
    extraOutputOptions: ['-movflags', '+faststart', '-profile:v', 'baseline', '-level', '3.0'],
    description: 'Compressed for messaging',
  },
};

export const RESOLUTION_CONFIGS: Record<string, { width: number; height: number; label: string }> = {
  p720: { width: 1280, height: 720, label: '720p HD' },
  p1080: { width: 1920, height: 1080, label: '1080p Full HD' },
  k2: { width: 2560, height: 1440, label: '2K QHD' },
  k4: { width: 3840, height: 2160, label: '4K UHD' },
};

export const FORMAT_CONFIGS: Record<string, { container: string; codec: string; audioCodec: string; mime: string }> = {
  mp4: { container: 'mp4', codec: 'h264', audioCodec: 'aac', mime: 'video/mp4' },
  mov: { container: 'mov', codec: 'prores', audioCodec: 'pcm_s16le', mime: 'video/quicktime' },
  webm: { container: 'webm', codec: 'libvpx-vp9', audioCodec: 'libopus', mime: 'video/webm' },
};

export const FPS_OPTIONS = [24, 30, 60] as const;

export function getPlatformConfig(platform: string): PlatformConfig | undefined {
  return PLATFORM_CONFIGS[platform];
}

export function getAllPlatforms(): string[] {
  return Object.keys(PLATFORM_CONFIGS);
}

export function getResolutionConfig(resolution: string): { width: number; height: number; label: string } | undefined {
  return RESOLUTION_CONFIGS[resolution];
}

export function getFormatConfig(format: string): { container: string; codec: string; audioCodec: string; mime: string } | undefined {
  return FORMAT_CONFIGS[format];
}

export async function calculateOptimalBitrate(
  inputPath: string,
  resolutionKey: string,
  fps: number,
): Promise<{ videoBitrate: string; audioBitrate: string; crf: number }> {
  try {
    const info = await getVideoInfo(inputPath);
    const resolution = RESOLUTION_CONFIGS[resolutionKey] || RESOLUTION_CONFIGS.p1080!;
    const pixels = resolution.width * resolution.height;
    const megapixels = pixels / (1920 * 1080);

    let baseBitrate: string;
    let crf: number;

    if (megapixels <= 0.5) {
      baseBitrate = '1.5M';
      crf = 26;
    } else if (megapixels <= 1) {
      baseBitrate = '4M';
      crf = 23;
    } else if (megapixels <= 2) {
      baseBitrate = '10M';
      crf = 21;
    } else {
      baseBitrate = '20M';
      crf = 18;
    }

    const fpsMultiplier = fps >= 60 ? 1.5 : fps >= 30 ? 1 : 0.8;
    const bitrateNum = parseInt(baseBitrate) * fpsMultiplier;
    const videoBitrate = `${Math.round(bitrateNum)}M`;

    const durationMinutes = (info.duration || 60) / 60;
    const audioBitrate = durationMinutes > 10 ? '128k' : durationMinutes > 3 ? '192k' : '256k';

    return { videoBitrate, audioBitrate, crf };
  } catch {
    return { videoBitrate: '4M', audioBitrate: '192k', crf: 23 };
  }
}

export function generateOutputFilename(
  projectName: string,
  format: string,
  resolution: string,
  platform?: string,
): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const resolutionLabel = RESOLUTION_CONFIGS[resolution]?.label.replace(/\s+/g, '-') || resolution;
  const platformTag = platform ? `-${platform}` : '';
  const timestamp = Date.now();
  return `${slug}-${resolutionLabel}${platformTag}-${timestamp}.${format}`;
}

export function estimateRenderTime(
  duration: number,
  resolutionKey: string,
  fps: number,
  hardwareAccel: boolean,
): number {
  const resolution = RESOLUTION_CONFIGS[resolutionKey] || RESOLUTION_CONFIGS.p1080!;
  const pixelCount = resolution.width * resolution.height;
  const basePixels = 1920 * 1080;
  const pixelRatio = pixelCount / basePixels;

  const fpsRatio = fps / 30;
  const accelMultiplier = hardwareAccel ? 0.4 : 1;
  const complexity = pixelRatio * fpsRatio * accelMultiplier;

  return Math.round(duration * complexity * 1.5);
}
