import { v4 as uuidv4 } from 'uuid';

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultFormat: string;
  colorGrading: string;
  transitions: string;
  captionStyle: string;
  backgroundMusic: string;
  duration: { min: number; max: number; default: number };
  effects: any[];
  aiSettings: Record<string, any>;
  config: Record<string, any>;
}

const TEMPLATES: VideoTemplate[] = [
  {
    id: 'cinema',
    name: 'Cinema',
    description: 'Letterbox (2.35:1) widescreen format with cinematic color grading, crossfade transitions, and elegant subtitles. Perfect for cinematic storytelling.',
    category: 'professional',
    icon: 'film',
    defaultFormat: 'horizontal',
    colorGrading: 'cinematic',
    transitions: 'crossfade',
    captionStyle: 'elegant',
    backgroundMusic: 'orchestral',
    duration: { min: 15, max: 600, default: 60 },
    effects: [
      { type: 'letterbox', ratio: '2.35:1', color: '#000000' },
      { type: 'vignette', strength: 0.4, feather: 0.6 },
      { type: 'grain', amount: 0.03, size: 1.5 },
      { type: 'color_grade', preset: 'cinematic' },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: false,
      removeSilence: true,
      improveAudio: true,
      captionStyle: 'bottom',
      musicVolume: 0.2,
    },
    config: {
      outputCodec: 'libx264',
      crf: 18,
      preset: 'slow',
      audioBitrate: '320k',
      resolution: '1920x1080',
      fps: 24,
    },
  },
  {
    id: 'vlog',
    name: 'Vlog',
    description: 'Bright and clean aesthetic with face zoom tracking, smooth transitions, and casual captions. Ideal for daily vlogs and lifestyle content.',
    category: 'social',
    icon: 'camera',
    defaultFormat: 'horizontal',
    colorGrading: 'clean',
    transitions: 'smooth',
    captionStyle: 'casual',
    backgroundMusic: 'upbeat',
    duration: { min: 30, max: 900, default: 180 },
    effects: [
      { type: 'face_zoom', strength: 1.2, smoothness: 0.7 },
      { type: 'brightness', amount: 0.08 },
      { type: 'saturation', amount: 1.15 },
      { type: 'sharpness', amount: 0.3 },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: true,
      removeSilence: true,
      improveAudio: true,
      captionStyle: 'bottom',
      musicVolume: 0.25,
    },
    config: {
      outputCodec: 'libx264',
      crf: 20,
      preset: 'medium',
      audioBitrate: '256k',
      resolution: '1920x1080',
      fps: 30,
    },
  },
  {
    id: 'viral',
    name: 'Viral',
    description: 'High-energy fast-cut editing with kinetic typography, bold visual effects, and trending transitions. Designed for maximum engagement.',
    category: 'trending',
    icon: 'zap',
    defaultFormat: 'vertical',
    colorGrading: 'vibrant',
    transitions: 'glitch',
    captionStyle: 'kinetic',
    backgroundMusic: 'trending',
    duration: { min: 5, max: 120, default: 30 },
    effects: [
      { type: 'fast_cuts', interval: 1.5, minDuration: 0.5 },
      { type: 'glitch_transition', intensity: 0.6 },
      { type: 'text_animation', style: 'kinetic' },
      { type: 'speed_ramp', maxSpeed: 2.0 },
      { type: 'shake', intensity: 0.3, frequency: 0.5 },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: true,
      removeSilence: true,
      improveAudio: false,
      captionStyle: 'tiktok',
      musicVolume: 0.35,
    },
    config: {
      outputCodec: 'libx264',
      crf: 20,
      preset: 'fast',
      audioBitrate: '192k',
      resolution: '1080x1920',
      fps: 30,
    },
  },
  {
    id: 'shorts',
    name: 'Shorts',
    description: 'Vertical-first format optimized for YouTube Shorts with large bold captions, quick cuts, and popular background music.',
    category: 'platform',
    icon: 'smartphone',
    defaultFormat: 'vertical',
    colorGrading: 'vibrant',
    transitions: 'fade',
    captionStyle: 'shorts',
    backgroundMusic: 'trending',
    duration: { min: 5, max: 60, default: 30 },
    effects: [
      { type: 'center_captions', size: 'large', bold: true },
      { type: 'quick_cuts', maxSegment: 3 },
      { type: 'zoom_in', start: 1.0, end: 1.1 },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: true,
      removeSilence: true,
      improveAudio: false,
      captionStyle: 'shorts',
      musicVolume: 0.3,
    },
    config: {
      outputCodec: 'libx264',
      crf: 20,
      preset: 'fast',
      audioBitrate: '192k',
      resolution: '1080x1920',
      fps: 30,
    },
  },
  {
    id: 'reels',
    name: 'Reels',
    description: 'Instagram Reels optimized with aesthetic filters, smooth transitions, and popular audio integration for social media appeal.',
    category: 'platform',
    icon: 'instagram',
    defaultFormat: 'vertical',
    colorGrading: 'vintage',
    transitions: 'smooth',
    captionStyle: 'minimal',
    backgroundMusic: 'trending',
    duration: { min: 5, max: 90, default: 30 },
    effects: [
      { type: 'aesthetic_filter', preset: 'warm' },
      { type: 'film_dust', amount: 0.1 },
      { type: 'soft_glow', radius: 3, brightness: 0.1 },
      { type: 'color_grading', preset: 'vintage' },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: true,
      removeSilence: true,
      improveAudio: false,
      captionStyle: 'shorts',
      musicVolume: 0.35,
    },
    config: {
      outputCodec: 'libx264',
      crf: 18,
      preset: 'medium',
      audioBitrate: '256k',
      resolution: '1080x1920',
      fps: 30,
    },
  },
  {
    id: 'motivacional',
    name: 'Motivacional',
    description: 'Inspirational video format with quote overlays, dramatic pacing, and uplifting orchestral background music.',
    category: 'content',
    icon: 'quote',
    defaultFormat: 'vertical',
    colorGrading: 'cinematic',
    transitions: 'crossfade',
    captionStyle: 'typewriter',
    backgroundMusic: 'inspirational',
    duration: { min: 15, max: 300, default: 60 },
    effects: [
      { type: 'quote_overlay', font: 'serif', animation: 'typewriter' },
      { type: 'slow_motion', factor: 0.7 },
      { type: 'dramatic_fade', duration: 1.5 },
      { type: 'vignette', strength: 0.5 },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: false,
      removeSilence: true,
      improveAudio: true,
      captionStyle: 'typewriter',
      musicVolume: 0.2,
    },
    config: {
      outputCodec: 'libx264',
      crf: 18,
      preset: 'slow',
      audioBitrate: '320k',
      resolution: '1080x1920',
      fps: 24,
    },
  },
  {
    id: 'podcast',
    name: 'Podcast',
    description: 'Clean podcast format with chapter markers, clear audio enhancement, and simple visual presentation for interview and talk content.',
    category: 'professional',
    icon: 'mic',
    defaultFormat: 'horizontal',
    colorGrading: 'clean',
    transitions: 'fade',
    captionStyle: 'minimal',
    backgroundMusic: 'ambient',
    duration: { min: 60, max: 7200, default: 1800 },
    effects: [
      { type: 'chapter_markers', style: 'minimal' },
      { type: 'audio_enhancement', loudness: -16, dynamics: true },
      { type: 'waveform_visualizer', position: 'bottom' },
    ],
    aiSettings: {
      autoColor: false,
      autoZoom: false,
      removeSilence: true,
      improveAudio: true,
      captionStyle: 'bottom',
      musicVolume: 0.1,
    },
    config: {
      outputCodec: 'libx264',
      crf: 22,
      preset: 'medium',
      audioBitrate: '256k',
      resolution: '1920x1080',
      fps: 30,
    },
  },
  {
    id: 'clipe',
    name: 'Clipe',
    description: 'Beat-synced music video style with visual effects timed to audio rhythm, artistic transitions, and creative color grading.',
    category: 'creative',
    icon: 'music',
    defaultFormat: 'horizontal',
    colorGrading: 'futuristic',
    transitions: 'glitch',
    captionStyle: 'karaoke',
    backgroundMusic: 'electronic',
    duration: { min: 15, max: 300, default: 60 },
    effects: [
      { type: 'beat_sync', sensitivity: 0.7 },
      { type: 'glitch_effect', style: 'digital' },
      { type: 'color_pulse', sync: 'beat' },
      { type: 'speed_ramp', sync: 'beat' },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: true,
      removeSilence: false,
      improveAudio: false,
      captionStyle: 'karaoke',
      musicVolume: 0.5,
    },
    config: {
      outputCodec: 'libx264',
      crf: 17,
      preset: 'medium',
      audioBitrate: '320k',
      resolution: '1920x1080',
      fps: 30,
    },
  },
  {
    id: 'game',
    name: 'Game',
    description: 'Gaming content optimized with vibrant colors, high-energy transitions, overlay support, and webcam picture-in-picture.',
    category: 'gaming',
    icon: 'gamepad',
    defaultFormat: 'horizontal',
    colorGrading: 'vibrant',
    transitions: 'glitch',
    captionStyle: 'bold',
    backgroundMusic: 'epic',
    duration: { min: 15, max: 600, default: 120 },
    effects: [
      { type: 'overlay_webcam', position: 'bottom-right', size: 0.25 },
      { type: 'game_ui', style: 'modern' },
      { type: 'kill_feed', animation: 'slide' },
      { type: 'color_boost', saturation: 1.4, contrast: 1.2 },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: false,
      removeSilence: true,
      improveAudio: false,
      captionStyle: 'bottom',
      musicVolume: 0.2,
    },
    config: {
      outputCodec: 'libx264',
      crf: 19,
      preset: 'fast',
      audioBitrate: '256k',
      resolution: '1920x1080',
      fps: 60,
    },
  },
  {
    id: 'futurista',
    name: 'Futurista',
    description: 'Cyberpunk aesthetic with neon glow effects, tech overlays, synthetic color palette, and futuristic transitions.',
    category: 'creative',
    icon: 'cpu',
    defaultFormat: 'horizontal',
    colorGrading: 'futuristic',
    transitions: 'glitch',
    captionStyle: 'neon',
    backgroundMusic: 'electronic',
    duration: { min: 10, max: 300, default: 45 },
    effects: [
      { type: 'neon_glow', color: '#00FFFF', intensity: 0.7 },
      { type: 'scan_lines', opacity: 0.08 },
      { type: 'hologram', distortion: 0.1 },
      { type: 'tech_overlay', style: 'cyberpunk' },
      { type: 'color_grade', preset: 'futuristic' },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: true,
      removeSilence: false,
      improveAudio: false,
      captionStyle: 'tiktok',
      musicVolume: 0.3,
    },
    config: {
      outputCodec: 'libx264',
      crf: 17,
      preset: 'slow',
      audioBitrate: '320k',
      resolution: '1920x1080',
      fps: 30,
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Moody atmospheric aesthetic with desaturated colors, high contrast, deep shadows, and dramatic undertones.',
    category: 'creative',
    icon: 'moon',
    defaultFormat: 'horizontal',
    colorGrading: 'dark',
    transitions: 'fade',
    captionStyle: 'minimal',
    backgroundMusic: 'ambient',
    duration: { min: 10, max: 600, default: 60 },
    effects: [
      { type: 'desaturate', amount: 0.4 },
      { type: 'contrast_boost', amount: 1.4 },
      { type: 'shadow_deep', strength: 0.6 },
      { type: 'color_grade', preset: 'dark' },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: false,
      removeSilence: true,
      improveAudio: true,
      captionStyle: 'bottom',
      musicVolume: 0.2,
    },
    config: {
      outputCodec: 'libx264',
      crf: 19,
      preset: 'medium',
      audioBitrate: '256k',
      resolution: '1920x1080',
      fps: 24,
    },
  },
  {
    id: 'luxo',
    name: 'Luxo',
    description: 'Premium luxury aesthetic with gold accent overlays, elegant transitions, refined color palette, and sophisticated styling.',
    category: 'professional',
    icon: 'diamond',
    defaultFormat: 'horizontal',
    colorGrading: 'cinematic',
    transitions: 'crossfade',
    captionStyle: 'elegant',
    backgroundMusic: 'orchestral',
    duration: { min: 15, max: 300, default: 60 },
    effects: [
      { type: 'gold_overlay', opacity: 0.15, style: 'elegant' },
      { type: 'light_leak', color: '#FFD700', intensity: 0.1 },
      { type: 'soft_bloom', radius: 2, threshold: 0.8 },
      { type: 'color_grade', preset: 'cinematic' },
    ],
    aiSettings: {
      autoColor: true,
      autoZoom: false,
      removeSilence: true,
      improveAudio: true,
      captionStyle: 'bottom',
      musicVolume: 0.15,
    },
    config: {
      outputCodec: 'libx264',
      crf: 16,
      preset: 'slow',
      audioBitrate: '320k',
      resolution: '1920x1080',
      fps: 24,
    },
  },
];

export function getTemplate(templateId: string): VideoTemplate | undefined {
  return TEMPLATES.find(t => t.id === templateId);
}

export function getAllTemplates(): VideoTemplate[] {
  return [...TEMPLATES];
}

export function getTemplatesByCategory(category: string): VideoTemplate[] {
  return TEMPLATES.filter(t => t.category === category);
}

export function applyTemplateToOptions(templateId: string, userOptions: Record<string, any>): Record<string, any> {
  const template = getTemplate(templateId);
  if (!template) return userOptions;

  return {
    ...userOptions,
    format: userOptions.format || template.defaultFormat,
    template: templateId,
    colorGrading: userOptions.colorGrading || template.colorGrading,
    transitions: userOptions.transitions || template.transitions,
    captionStyle: userOptions.captionStyle || template.captionStyle,
    backgroundMusic: userOptions.backgroundMusic || template.backgroundMusic,
    duration: userOptions.duration || template.duration.default,
    ...template.aiSettings,
  };
}

export function getTemplateConfig(templateId: string): Record<string, any> | undefined {
  const template = getTemplate(templateId);
  return template?.config;
}

export function searchTemplates(query: string): VideoTemplate[] {
  const q = query.toLowerCase();
  return TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
}
