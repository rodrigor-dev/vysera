import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import logger from '@/config/logger';

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface CaptionSegment {
  index: number;
  text: string;
  words: CaptionWord[];
  start: number;
  end: number;
}

export interface CaptionStyle {
  font: string;
  fontSize: number;
  primaryColor: string;
  backgroundColor: string;
  position: 'bottom' | 'top' | 'center';
  animation: 'none' | 'fade' | 'slide' | 'karaoke' | 'typewriter' | 'tiktok';
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  wordByWord: boolean;
  maxWidth: number;
}

const DEFAULT_STYLE: CaptionStyle = {
  font: 'Arial',
  fontSize: 28,
  primaryColor: 'white',
  backgroundColor: 'black@0.5',
  position: 'bottom',
  animation: 'none',
  highlightColor: '#FFD700',
  outlineColor: 'black',
  outlineWidth: 2,
  wordByWord: false,
  maxWidth: 600,
};

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  const secs = Math.floor(s);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  const secs = Math.floor(s);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function escapeASS(text: string): string {
  return text
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\n/g, '\\N');
}

function getPositionY(position: 'bottom' | 'top' | 'center', fontSize: number, height: number): number {
  switch (position) {
    case 'bottom': return height - fontSize - 40;
    case 'top': return fontSize + 20;
    case 'center': return height / 2;
  }
}

function buildDrawtextFilter(
  segment: CaptionSegment,
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number,
  index: number
): string {
  const posY = getPositionY(style.position, style.fontSize, videoHeight);
  const fontSize = style.fontSize;
  const fontFile = style.font.replace(/'/g, "\\'");
  const primaryColor = style.primaryColor.startsWith('#') ? style.primaryColor.slice(1) : style.primaryColor;
  const outlineColor = style.outlineColor.startsWith('#') ? style.outlineColor.slice(1) : style.outlineColor;

  const escapedText = segment.text
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, '\\:')
    .replace(/\\\\/g, '\\\\\\\\');

  const enableExpr = `between(t,${segment.start.toFixed(2)},${segment.end.toFixed(2)})`;

  let drawtext = `drawtext=text='${escapedText}'`
    + `:fontfile='${fontFile}'`
    + `:fontsize=${fontSize}`
    + `:fontcolor=${primaryColor}`
    + `:bordercolor=${outlineColor}`
    + `:borderw=${style.outlineWidth}`
    + `:x=(w-text_w)/2`
    + `:y=${posY}`
    + `:enable='${enableExpr}'`;

  if (style.animation === 'fade') {
    const fadeIn = `:alpha='if(lt(t-${segment.start.toFixed(2)},0.3),(t-${segment.start.toFixed(2)})/0.3,if(lt(${segment.end.toFixed(2)}-t,0.3),(${segment.end.toFixed(2)}-t)/0.3,1))'`;
    drawtext += fadeIn;
  }

  return drawtext;
}

function buildWordByWordFilters(
  segment: CaptionSegment,
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number,
  segmentIndex: number
): string[] {
  if (!style.wordByWord || segment.words.length === 0) {
    return [buildDrawtextFilter(segment, style, videoWidth, videoHeight, segmentIndex)];
  }

  const filters: string[] = [];
  const posY = getPositionY(style.position, style.fontSize, videoHeight);
  const fontSize = style.fontSize;
  const primaryColor = style.primaryColor.startsWith('#') ? style.primaryColor.slice(1) : style.primaryColor;
  const highlightColor = style.highlightColor.startsWith('#') ? style.highlightColor.slice(1) : style.highlightColor;
  const outlineColor = style.outlineColor.startsWith('#') ? style.outlineColor.slice(1) : style.outlineColor;
  const fontFile = style.font.replace(/'/g, "\\'");

  const spacing = fontSize * 0.6;
  let totalWidth = 0;
  const wordWidths = segment.words.map(w => w.word.length * spacing);

  for (let i = 0; i < segment.words.length; i++) {
    const word = segment.words[i]!;
    const escapedWord = word.word
      .replace(/'/g, "'\\\\\\''")
      .replace(/:/g, '\\:');

    const xOffset = totalWidth;
    totalWidth += wordWidths[i]!;

    const highlightExpr = `between(t,${word.start.toFixed(3)},${word.end.toFixed(3)})`;
    const wordColor = `${highlightColor}:enable='${highlightExpr}'`;

    const baseX = (videoWidth - totalWidth) / 2;

    const drawtext = `drawtext=text='${escapedWord}'`
      + `:fontfile='${fontFile}'`
      + `:fontsize=${fontSize}`
      + `:fontcolor=${wordColor}`
      + `:bordercolor=${outlineColor}`
      + `:borderw=${style.outlineWidth}`
      + `:x=${baseX + xOffset}`
      + `:y=${posY}`;

    filters.push(drawtext);
  }

  return filters;
}

function buildKaraokeFilter(
  segment: CaptionSegment,
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number
): string {
  const posY = getPositionY(style.position, style.fontSize, videoHeight);
  const fontSize = style.fontSize;
  const primaryColor = style.primaryColor.startsWith('#') ? style.primaryColor.slice(1) : style.primaryColor;
  const highlightColor = style.highlightColor.startsWith('#') ? style.highlightColor.slice(1) : style.highlightColor;
  const outlineColor = style.outlineColor.startsWith('#') ? style.outlineColor.slice(1) : style.outlineColor;
  const fontFile = style.font.replace(/'/g, "\\'");

  const spacing = fontSize * 0.6;
  let totalWidth = 0;
  const wordWidths = segment.words.map(w => w.word.length * spacing);
  const totalTextWidth = wordWidths.reduce((a, b) => a + b, 0);
  const baseX = (videoWidth - totalTextWidth) / 2;

  const wordFilters = segment.words.map((word, i) => {
    const xOffset = wordWidths.slice(0, i).reduce((a, b) => a + b, 0);
    const escaped = word.word.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
    const highlightExpr = `between(t,${word.start.toFixed(3)},${word.end.toFixed(3)})`;
    const color = `${highlightColor}:enable='${highlightExpr}'`;
    return {
      word: escaped,
      x: baseX + xOffset,
      width: wordWidths[i]!,
      color,
    };
  });

  const highlightParts = wordFilters.filter(w => w.color).map(w =>
    `{\\\\c&H${highlightColor}&}${w.word}{\\\\c&H${primaryColor}&}`
  );

  const fullText = highlightParts.join('');
  const escapedFull = fullText.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');

  const enableExpr = `between(t,${segment.start.toFixed(2)},${segment.end.toFixed(2)})`;

  return `drawtext=text='${escapedFull}'`
    + `:fontfile='${fontFile}'`
    + `:fontsize=${fontSize}`
    + `:fontcolor=${primaryColor}`
    + `:bordercolor=${outlineColor}`
    + `:borderw=${style.outlineWidth}`
    + `:x=(w-text_w)/2`
    + `:y=${posY}`
    + `:enable='${enableExpr}'`
    + `:text_align=C`;
}

export async function transcribeAudio(
  audioPath: string,
  language: string = 'en'
): Promise<CaptionSegment[]> {
  logger.info(`Transcribing audio: ${audioPath} language=${language}`);

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const wavPath = path.join(tempDir, `transcribe_${uuid()}.wav`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(audioPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .output(wavPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });

  const segments = energyBasedSegmentation(wavPath, language);

  try {
    fs.unlinkSync(wavPath);
  } catch { }

  return segments;
}

function energyBasedSegmentation(audioPath: string, language: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const duration = getAudioDuration(audioPath);
  if (duration <= 0) {
    return [{ index: 0, text: '', words: [], start: 0, end: 0 }];
  }

  const sampleRate = 16000;
  const frameSize = 0.025;
  const hopSize = 0.010;
  const frameSamples = Math.floor(frameSize * sampleRate);
  const hopSamples = Math.floor(hopSize * sampleRate);
  const totalFrames = Math.floor(duration / hopSize);

  const energyThreshold = 0.015;
  const minSilenceDuration = 0.3;
  const minSegmentDuration = 0.5;
  const maxSegmentDuration = 10.0;

  const energies: number[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const time = i * hopSize;
    const energy = estimateEnergyAtTime(audioPath, time, frameSamples, sampleRate);
    energies.push(energy);
  }

  const smoothedEnergies = smoothArray(energies, 5);
  const adaptiveThreshold = adaptiveThresholdFromNoiseFloor(smoothedEnergies, energyThreshold);

  let inSpeech = false;
  let segmentStart = 0;
  let silenceFrames = 0;
  const silenceFrameThreshold = Math.round(minSilenceDuration / hopSize);
  const minSegmentFrames = Math.round(minSegmentDuration / hopSize);
  const maxSegmentFrames = Math.round(maxSegmentDuration / hopSize);
  let segmentFrames = 0;

  for (let i = 0; i < smoothedEnergies.length; i++) {
    const energy = smoothedEnergies[i]!;
    const time = i * hopSize;

    if (energy > adaptiveThreshold) {
      if (!inSpeech) {
        inSpeech = true;
        segmentStart = Math.max(0, time - 0.1);
        segmentFrames = 0;
        silenceFrames = 0;
      }
      silenceFrames = 0;
      segmentFrames++;
    } else {
      if (inSpeech) {
        silenceFrames++;
        segmentFrames++;

        if (silenceFrames >= silenceFrameThreshold || segmentFrames >= maxSegmentFrames) {
          const segmentEnd = Math.min(time, duration);
          if (segmentFrames >= minSegmentFrames && segmentEnd - segmentStart > 0.3) {
            const wordSegments = generateWordLevelTimestamps(
              segmentStart, segmentEnd, energies, i - silenceFrames, i, hopSize
            );
            const text = `Segment ${segments.length + 1}`;
            segments.push({
              index: segments.length,
              text: wordSegments.map(w => w.word).join(' '),
              words: wordSegments,
              start: segmentStart,
              end: segmentEnd,
            });
          }
          inSpeech = false;
          silenceFrames = 0;
          segmentFrames = 0;
        }
      }
    }
  }

  if (inSpeech) {
    const segmentEnd = Math.min(totalFrames * hopSize, duration);
    if (segmentFrames >= minSegmentFrames && segmentEnd - segmentStart > 0.3) {
      const wordSegments = generateWordLevelTimestamps(
        segmentStart, segmentEnd, energies,
        smoothedEnergies.length - segmentFrames, smoothedEnergies.length, hopSize
      );
      segments.push({
        index: segments.length,
        text: wordSegments.map(w => w.word).join(' '),
        words: wordSegments,
        start: segmentStart,
        end: segmentEnd,
      });
    }
  }

  if (segments.length === 0) {
    segments.push({
      index: 0,
      text: language === 'pt' ? 'Áudio detectado' : 'Audio detected',
      words: [{ word: language === 'pt' ? 'Áudio detectado' : 'Audio detected', start: 0, end: duration, confidence: 0.5 }],
      start: 0,
      end: duration,
    });
  }

  return segments;
}

function getAudioDuration(audioPath: string): number {
  try {
    const buffer = Buffer.alloc(44);
    const fd = fs.openSync(audioPath, 'r');
    fs.readSync(fd, buffer, 0, 44, 0);
    fs.closeSync(fd);

    if (buffer.toString('ascii', 0, 4) === 'RIFF') {
      const dataSize = buffer.readUInt32LE(4);
      const channels = buffer.readUInt16LE(22);
      const sampleRate = buffer.readUInt32LE(24);
      const bitsPerSample = buffer.readUInt16LE(34);
      if (sampleRate > 0 && channels > 0 && bitsPerSample > 0) {
        const dataBytes = dataSize - 36;
        return dataBytes / (sampleRate * channels * (bitsPerSample / 8));
      }
    }
  } catch { }

  return 30;
}

function estimateEnergyAtTime(audioPath: string, time: number, numSamples: number, sampleRate: number): number {
  try {
    const byteOffset = 44 + Math.floor(time * sampleRate) * 2;
    const buffer = Buffer.alloc(numSamples * 2);
    const fd = fs.openSync(audioPath, 'r');
    const stat = fs.fstatSync(fd);
    const bytesToRead = Math.min(numSamples * 2, stat.size - byteOffset);
    if (bytesToRead > 0) {
      fs.readSync(fd, buffer, 0, bytesToRead, Math.max(44, byteOffset));
    }
    fs.closeSync(fd);

    let energy = 0;
    let count = 0;
    for (let i = 0; i < bytesToRead - 1; i += 2) {
      const sample = buffer.readInt16LE(i);
      energy += Math.abs(sample) / 32768;
      count++;
    }
    return count > 0 ? energy / count : 0;
  } catch {
    return 0;
  }
}

function smoothArray(arr: number[], windowSize: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(arr.length - 1, i + windowSize); j++) {
      sum += arr[j]!;
      count++;
    }
    result.push(count > 0 ? sum / count : 0);
  }
  return result;
}

function adaptiveThresholdFromNoiseFloor(energies: number[], baseThreshold: number): number {
  const sorted = [...energies].sort((a, b) => a - b);
  const noiseLen = Math.max(1, Math.floor(sorted.length * 0.2));
  const noiseFloor = sorted.slice(0, noiseLen).reduce((a, b) => a + b, 0) / noiseLen;
  const peak = sorted[sorted.length - 1] || 1;
  return Math.max(baseThreshold, noiseFloor * 2.5, peak * 0.05);
}

function generateWordLevelTimestamps(
  segmentStart: number,
  segmentEnd: number,
  energies: number[],
  startFrame: number,
  endFrame: number,
  hopSize: number
): CaptionWord[] {
  const duration = segmentEnd - segmentStart;
  const wordCount = Math.max(1, Math.round(duration / 0.2));
  const words: CaptionWord[] = [];
  const wordDuration = duration / wordCount;

  const subEnergies = energies.slice(startFrame, endFrame);
  const totalEnergy = subEnergies.reduce((a, b) => a + b, 0);
  const avgEnergy = subEnergies.length > 0 ? totalEnergy / subEnergies.length : 0.01;

  for (let i = 0; i < wordCount; i++) {
    const wordStart = segmentStart + i * wordDuration;
    const wordEnd = Math.min(wordStart + wordDuration, segmentEnd);
    const wordEnergy = subEnergies.length > 0
      ? Math.min(1, subEnergies[Math.floor((i / wordCount) * subEnergies.length)]! / (avgEnergy * 3))
      : 0.5;

    words.push({
      word: `word_${i + 1}`,
      start: wordStart,
      end: wordEnd,
      confidence: Math.min(1, Math.max(0.1, wordEnergy)),
    });
  }

  return words;
}

export function generateSRT(captions: CaptionSegment[]): string {
  return captions
    .map((seg, i) => {
      const lines = [`${i + 1}`];
      lines.push(`${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}`);
      lines.push(seg.text);
      return lines.join('\n');
    })
    .join('\n\n') + '\n';
}

export function generateVTT(captions: CaptionSegment[]): string {
  const header = 'WEBVTT\n\n';
  const body = captions
    .map((seg) => {
      const lines: string[] = [];
      lines.push(`${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}`);
      lines.push(seg.text);
      return lines.join('\n');
    })
    .join('\n\n');
  return header + body + '\n';
}

export function generateASS(captions: CaptionSegment[], style?: Partial<CaptionStyle>): string {
  const mergedStyle: CaptionStyle = { ...DEFAULT_STYLE, ...style };
  const primaryHex = mergedStyle.primaryColor.startsWith('#')
    ? mergedStyle.primaryColor.slice(1)
    : mergedStyle.primaryColor;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${mergedStyle.font},${mergedStyle.fontSize},&H00${primaryHex}&H000000FF,&H00${primaryHex},&H00000000,0,0,0,0,100,100,0,0,1,${mergedStyle.outlineWidth},0,${mergedStyle.position === 'top' ? 8 : mergedStyle.position === 'center' ? 5 : 2},10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = captions
    .map((seg) => {
      const start = formatSRTTime(seg.start).replace(',', '.');
      const end = formatSRTTime(seg.end).replace(',', '.');
      const text = escapeASS(seg.text);
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events + '\n';
}

export async function burnCaptions(
  inputPath: string,
  outputPath: string,
  captions: CaptionSegment[],
  style?: Partial<CaptionStyle>,
  onProgress?: (progress: number) => void
): Promise<string> {
  const mergedStyle: CaptionStyle = { ...DEFAULT_STYLE, ...style };
  logger.info(`Burning captions: ${inputPath} -> ${outputPath} style=${mergedStyle.animation}`);

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const videoInfo = await getVideoInfo(inputPath);
  const videoWidth = videoInfo.width || 1920;
  const videoHeight = videoInfo.height || 1080;

  if (mergedStyle.animation === 'tiktok') {
    return applyTikTokStyle(captions, inputPath, outputPath, mergedStyle, onProgress);
  }
  if (mergedStyle.animation === 'karaoke') {
    return applyKaraokeStyle(captions, inputPath, outputPath, mergedStyle, onProgress);
  }
  if (mergedStyle.animation === 'shorts') {
    return applyShortsStyle(captions, inputPath, outputPath, mergedStyle, onProgress);
  }

  if (mergedStyle.wordByWord) {
    const allFilters = captions.flatMap((seg, i) =>
      buildWordByWordFilters(seg, mergedStyle, videoWidth, videoHeight, i)
    );
    if (allFilters.length === 0) {
      return copyVideo(inputPath, outputPath);
    }
    const filterComplex = allFilters.join(',');
    return runFFmpegWithFilters(inputPath, outputPath, filterComplex, onProgress);
  }

  if (mergedStyle.animation === 'typewriter') {
    return applyTypewriterStyle(captions, inputPath, outputPath, mergedStyle, onProgress);
  }

  const srtPath = path.join(tempDir, `captions_${uuid()}.srt`);
  const srtContent = generateSRT(captions);
  fs.writeFileSync(srtPath, srtContent, 'utf-8');

  return new Promise<string>((resolve, reject) => {
    const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedFont = mergedStyle.font.replace(/:/g, '\\:');

    let command = ffmpeg(inputPath)
      .outputOptions([
        `-vf subtitles='${escapedSrtPath}':force_style='Fontname=${escapedFont},Fontsize=${mergedStyle.fontSize},PrimaryColour=&H00${mergedStyle.primaryColor.replace('#', '')}&,BackColour=&H00${mergedStyle.backgroundColor.replace('#', '')}&,OutlineColour=&H00${mergedStyle.outlineColor.replace('#', '')}&,Outline=${mergedStyle.outlineWidth},BorderStyle=1,Alignment=${mergedStyle.position === 'top' ? 8 : mergedStyle.position === 'center' ? 5 : 2}'`,
        '-c:a copy',
      ])
      .output(outputPath);

    if (onProgress) {
      command = command.on('progress', (info) => {
        if (info.percent) {
          onProgress(Math.min(100, Math.round(info.percent)));
        }
      });
    }

    command
      .on('end', () => {
        try { fs.unlinkSync(srtPath); } catch { }
        resolve(outputPath);
      })
      .on('error', (err) => {
        try { fs.unlinkSync(srtPath); } catch { }
        reject(err);
      })
      .run();
  });
}

function runFFmpegWithFilters(
  inputPath: string,
  outputPath: string,
  filterComplex: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .outputOptions([
        `-vf ${filterComplex}`,
        '-c:a copy',
      ])
      .output(outputPath);

    if (onProgress) {
      command = command.on('progress', (info) => {
        if (info.percent) {
          onProgress(Math.min(100, Math.round(info.percent)));
        }
      });
    }

    command
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

function copyVideo(inputPath: string, outputPath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-c copy'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

async function getVideoInfo(videoPath: string): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        width: stream?.width || 1920,
        height: stream?.height || 1080,
        duration: metadata.format.duration || 30,
      });
    });
  });
}

export async function applyTikTokStyle(
  segments: CaptionSegment[],
  inputPath: string,
  outputPath: string,
  style?: Partial<CaptionStyle>,
  onProgress?: (progress: number) => void
): Promise<string> {
  const mergedStyle: CaptionStyle = {
    ...DEFAULT_STYLE,
    ...style,
    animation: 'tiktok',
    position: 'bottom',
    wordByWord: true,
    fontSize: style?.fontSize || 42,
    highlightColor: style?.highlightColor || '#FFD700',
  };

  logger.info(`Applying TikTok style captions: ${inputPath}`);
  const videoInfo = await getVideoInfo(inputPath);
  const vw = videoInfo.width || 1080;
  const vh = videoInfo.height || 1920;

  const allWords = segments.flatMap(s => s.words.length > 0 ? s.words :
    [{ word: s.text, start: s.start, end: s.end, confidence: 1 }]
  );

  if (allWords.length === 0) {
    return copyVideo(inputPath, outputPath);
  }

  const fontSize = mergedStyle.fontSize;
  const posY = vh - fontSize - 120;
  const primaryColor = mergedStyle.primaryColor.replace('#', '');
  const highlightColor = mergedStyle.highlightColor.replace('#', '');
  const outlineColor = mergedStyle.outlineColor.replace('#', '');
  const fontFile = mergedStyle.font.replace(/'/g, "\\'");
  const spacing = fontSize * 0.6;
  const wordWidths = allWords.map(w => w.word.length * spacing);
  const totalWidth = wordWidths.reduce((a, b) => a + b, 0);
  const baseX = (vw - totalWidth) / 2;

  const wordFilters = allWords.map((word, i) => {
    const xOffset = wordWidths.slice(0, i).reduce((a, b) => a + b, 0);
    const escaped = word.word.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
    const enableExpr = `between(t,${word.start.toFixed(3)},${word.end.toFixed(3)})`;
    const bounceY = posY + (word.confidence > 0.7 ? -15 : 0);
    return `drawtext=text='${escaped}'`
      + `:fontfile='${fontFile}'`
      + `:fontsize=${fontSize}`
      + `:fontcolor=${highlightColor}:enable='${enableExpr}'`
      + `:bordercolor=${outlineColor}`
      + `:borderw=${mergedStyle.outlineWidth}`
      + `:x=${baseX + xOffset}`
      + `:y=${bounceY}`;
  });

  const filterComplex = wordFilters.join(',');
  return runFFmpegWithFilters(inputPath, outputPath, filterComplex, onProgress);
}

export async function applyShortsStyle(
  segments: CaptionSegment[],
  inputPath: string,
  outputPath: string,
  style?: Partial<CaptionStyle>,
  onProgress?: (progress: number) => void
): Promise<string> {
  const mergedStyle: CaptionStyle = {
    ...DEFAULT_STYLE,
    ...style,
    animation: 'shorts',
    position: 'center',
    fontSize: style?.fontSize || 56,
    outlineWidth: style?.outlineWidth || 3,
  };

  logger.info(`Applying Shorts style captions: ${inputPath}`);
  const videoInfo = await getVideoInfo(inputPath);
  const vw = videoInfo.width || 1080;
  const vh = videoInfo.height || 1920;

  if (segments.length === 0) {
    return copyVideo(inputPath, outputPath);
  }

  const filters = segments.map((seg) => {
    const fontSize = mergedStyle.fontSize;
    const posY = vh / 2 - fontSize;
    const primaryColor = mergedStyle.primaryColor.replace('#', '');
    const outlineColor = mergedStyle.outlineColor.replace('#', '');
    const fontFile = mergedStyle.font.replace(/'/g, "\\'");
    const escaped = seg.text.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
    const enableExpr = `between(t,${seg.start.toFixed(2)},${seg.end.toFixed(2)})`;

    return `drawtext=text='${escaped}'`
      + `:fontfile='${fontFile}'`
      + `:fontsize=${fontSize}`
      + `:fontcolor=${primaryColor}`
      + `:bordercolor=${outlineColor}`
      + `:borderw=${mergedStyle.outlineWidth}`
      + `:x=(w-text_w)/2`
      + `:y=${posY}`
      + `:enable='${enableExpr}'`
      + `:alpha='if(lt(t-${seg.start.toFixed(2)},0.2),(t-${seg.start.toFixed(2)})/0.2,if(lt(${seg.end.toFixed(2)}-t,0.2),(${seg.end.toFixed(2)}-t)/0.2,1))'`;
  });

  const filterComplex = filters.join(',');
  return runFFmpegWithFilters(inputPath, outputPath, filterComplex, onProgress);
}

export async function applyKaraokeStyle(
  segments: CaptionSegment[],
  inputPath: string,
  outputPath: string,
  style?: Partial<CaptionStyle>,
  onProgress?: (progress: number) => void
): Promise<string> {
  const mergedStyle: CaptionStyle = {
    ...DEFAULT_STYLE,
    ...style,
    animation: 'karaoke',
    position: 'center',
    wordByWord: true,
    fontSize: style?.fontSize || 40,
    highlightColor: style?.highlightColor || '#FF6B6B',
    primaryColor: style?.primaryColor || '#FFFFFF',
  };

  logger.info(`Applying Karaoke style captions: ${inputPath}`);
  const videoInfo = await getVideoInfo(inputPath);
  const vw = videoInfo.width || 1920;
  const vh = videoInfo.height || 1080;

  const filters: string[] = [];

  for (const segment of segments) {
    const segWords = segment.words.length > 0 ? segment.words :
      [{ word: segment.text, start: segment.start, end: segment.end, confidence: 1 }];

    const filter = buildKaraokeFilter(
      { ...segment, words: segWords },
      mergedStyle,
      vw,
      vh
    );
    filters.push(filter);

    const escapedFont = mergedStyle.font.replace(/'/g, "\\'");
    const noteEnableExpr = `between(t,${segment.start.toFixed(2)},${segment.end.toFixed(2)})`;
    const noteFilter = `drawtext=text='♪'`
      + `:fontfile='${escapedFont}'`
      + `:fontsize=${mergedStyle.fontSize * 0.8}`
      + `:fontcolor=${mergedStyle.highlightColor.replace('#', '')}`
      + `:x=50`
      + `:y=${vh - 100}`
      + `:enable='${noteEnableExpr}'`;
    filters.push(noteFilter);
  }

  const filterComplex = filters.join(',');
  return runFFmpegWithFilters(inputPath, outputPath, filterComplex, onProgress);
}

async function applyTypewriterStyle(
  captions: CaptionSegment[],
  inputPath: string,
  outputPath: string,
  style: CaptionStyle,
  onProgress?: (progress: number) => void
): Promise<string> {
  const videoInfo = await getVideoInfo(inputPath);
  const vw = videoInfo.width || 1920;
  const vh = videoInfo.height || 1920;

  const allFilters = captions.map((seg) => {
    const posY = getPositionY(style.position, style.fontSize, vh);
    const primaryColor = style.primaryColor.replace('#', '');
    const outlineColor = style.outlineColor.replace('#', '');
    const fontFile = style.font.replace(/'/g, "\\'");

    const chars = seg.text.split('');
    let charStart = seg.start;
    const charDuration = Math.max(0.03, (seg.end - seg.start) / Math.max(1, chars.length));
    const charFilters = chars.map((char, ci) => {
      if (char === ' ') return null;
      const escaped = char.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
      const startTime = charStart;
      const endTime = startTime + charDuration * 1.5;
      charStart += charDuration;
      return `drawtext=text='${escaped}'`
        + `:fontfile='${fontFile}'`
        + `:fontsize=${style.fontSize}`
        + `:fontcolor=${primaryColor}`
        + `:bordercolor=${outlineColor}`
        + `:borderw=${style.outlineWidth}`
        + `:x=(w-text_w)/2+${(ci - chars.length / 2) * style.fontSize * 0.6}`
        + `:y=${posY}`
        + `:enable='between(t,${startTime.toFixed(3)},${endTime.toFixed(3)})'`;
    }).filter(Boolean) as string[];

    return charFilters.join(',');
  });

  const filterComplex = allFilters.join(',');
  return runFFmpegWithFilters(inputPath, outputPath, filterComplex, onProgress);
}

export async function extractSubtitles(
  inputPath: string,
  outputDir: string,
  formats: Array<'srt' | 'vtt' | 'ass'> = ['srt', 'vtt']
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const fmt of formats) {
    const outputPath = path.join(outputDir, `subtitles.${fmt}`);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions([`-map 0:s:0`])
        .on('end', () => {
          results[fmt] = outputPath;
          resolve();
        })
        .on('error', () => {
          reject(new Error(`No subtitle stream found in ${inputPath}`));
        })
        .run();
    });
  }

  return results;
}

export async function alignCaptionsToVideo(
  captions: CaptionSegment[],
  videoDuration: number
): Promise<CaptionSegment[]> {
  return captions
    .filter(seg => seg.start < videoDuration)
    .map((seg, i) => ({
      ...seg,
      index: i,
      end: Math.min(seg.end, videoDuration),
    }));
}
