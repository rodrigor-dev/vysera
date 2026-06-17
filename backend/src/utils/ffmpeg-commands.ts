export function buildColorGradingFilter(style: string): string {
  switch (style) {
    case 'cinematic':
      return 'eq=contrast=1.2:brightness=0.1:saturation=0.8,colorbalance=rs=0.1:gs=-0.05:bs=-0.1';
    case 'vibrant':
      return 'eq=saturation=1.5:contrast=1.1';
    case 'vintage':
      return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=contrast=0.9';
    case 'dark':
      return 'eq=contrast=1.4:brightness=-0.1:saturation=0.6';
    case 'clean':
      return 'eq=contrast=1.05:saturation=1.1:brightness=0.05';
    case 'futuristic':
      return 'colorbalance=rs=-0.2:gs=-0.1:bs=0.3,eq=contrast=1.3';
    case 'gold':
      return 'colorbalance=rs=0.2:gs=0.1:bs=-0.2,eq=saturation=1.2';
    case 'moody':
      return 'eq=contrast=1.3:brightness=-0.05:saturation=0.7';
    default:
      return '';
  }
}

export interface ZoomPoint {
  time: number;
  zoom: number;
  x: number;
  y: number;
}

export function buildZoomFilter(
  zoomData: ZoomPoint[],
  resolution: { width: number; height: number }
): string {
  if (!zoomData.length) return 'null';

  const fps = 30;
  const [w, h] = [resolution.width, resolution.height];

  const parts = zoomData.map((point, i) => {
    const next = zoomData[i + 1];
    const dur = next ? next.time - point.time : 2;
    const durFrames = Math.round(dur * fps);
    const frameNum = Math.round(point.time * fps);
    return `zoompan=z='${point.zoom}':x='${point.x}':y='${point.y}':d=${durFrames}:s=${w}x${h}:fps=${fps}`;
  });

  return parts.join(',');
}

export function buildTransitionFilter(style: string, duration: number): string {
  const dur = Math.max(0.1, duration);
  switch (style) {
    case 'fade':
      return `xfade=transition=fade:duration=${dur}`;
    case 'slide':
      return `xfade=transition=slideright:duration=${dur}`;
    case 'zoom':
      return `xfade=transition=zoomin:duration=${dur}`;
    case 'wipe':
      return `xfade=transition=wiperight:duration=${dur}`;
    case 'glitch':
      return `xfade=transition=random:duration=${dur}`;
    case 'smooth':
      return `xfade=transition=fadeblack:duration=${dur}`;
    default:
      return `xfade=transition=fade:duration=${dur}`;
  }
}

export interface TextOptions {
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
}

export function buildTextFilter(text: string, options: TextOptions): string {
  const escaped = text
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, '\\:');
  return `drawtext=text='${escaped}':fontfile='${options.font}':fontsize=${options.size}:fontcolor=${options.color}:x=${options.x}:y=${options.y}`;
}

export interface AudioFilterOptions {
  volume?: number;
  noiseReduce?: boolean;
  normalize?: boolean;
}

export function buildAudioFilter(options: AudioFilterOptions): string {
  const filters: string[] = [];
  if (options.volume !== undefined && options.volume !== 1) {
    filters.push(`volume=${options.volume}`);
  }
  if (options.noiseReduce) {
    filters.push('afftdn=nf=-25');
  }
  if (options.normalize) {
    filters.push('loudnorm=I=-16:LRA=11:TP=-1.5');
  }
  return filters.join(',');
}

export function buildScaleFilter(width: number, height: number): string {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
}

export function buildConcatFilter(segmentCount: number): string {
  if (segmentCount === 1) return '[0:v][0:a]concat=n=1:v=1:a=1[outv][outa]';
  const inputs = Array.from({ length: segmentCount }, (_, i) => `[${i}:v][${i}:a]`).join('');
  return `${inputs}concat=n=${segmentCount}:v=1:a=1[outv][outa]`;
}

export function buildSilenceRemoveFilter(silenceThreshold: string, silenceDuration: string): string {
  return `silenceremove=start_periods=1:start_duration=${silenceDuration}:start_threshold=${silenceThreshold}:stop_periods=1:stop_duration=${silenceDuration}:stop_threshold=${silenceThreshold}`;
}

export function buildSubtitlesFilter(assPath: string): string {
  const escaped = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  return `subtitles='${escaped}'`;
}
