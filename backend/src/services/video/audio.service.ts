import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import logger from '@/config/logger';

export interface AudioEnergyPoint {
  time: number;
  energy: number;
}

export interface BeatInfo {
  time: number;
  strength: number;
}

export type NoiseIntensity = 'low' | 'medium' | 'aggressive';

export async function extractAudio(
  videoPath: string,
  outputPath: string,
  format: 'mp3' | 'wav' | 'aac' | 'flac' = 'mp3'
): Promise<string> {
  logger.info(`Extracting audio: ${videoPath} -> ${outputPath} format=${format}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const codecMap: Record<string, string> = {
    mp3: 'libmp3lame',
    wav: 'pcm_s16le',
    aac: 'aac',
    flac: 'flac',
  };

  const audioCodec = codecMap[format] || 'libmp3lame';

  return new Promise<string>((resolve, reject) => {
    const command = ffmpeg(videoPath)
      .audioCodec(audioCodec)
      .audioBitrate((format === 'wav' ? undefined : '192k') as string | number)
      .audioChannels(2)
      .audioFrequency(44100)
      .output(outputPath);

    if (format === 'wav') {
      command.audioChannels(1).audioFrequency(16000);
    }

    command
      .on('end', () => {
        logger.info(`Audio extracted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Audio extraction failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function improveAudio(
  inputPath: string,
  outputPath: string
): Promise<string> {
  logger.info(`Improving audio: ${inputPath} -> ${outputPath}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters([
        {
          filter: 'loudnorm',
          options: {
            I: -16,
            LRA: 11,
            TP: -1.5,
          },
        },
        {
          filter: 'compand',
          options: {
            attacks: 0.01,
            points: '-90/-90|-45/-36|-30/-24|-15/-12|0/-6|20/-6',
            gain: 3,
            volume: '0.5',
          },
        },
        {
          filter: 'equalizer',
          options: {
            frequency: 300,
            width_type: 'h',
            width: 200,
            gain: 3,
          },
        },
        {
          filter: 'equalizer',
          options: {
            frequency: 3000,
            width_type: 'h',
            width: 1000,
            gain: 4,
          },
        },
        {
          filter: 'equalizer',
          options: {
            frequency: 12000,
            width_type: 'h',
            width: 4000,
            gain: 2,
          },
        },
      ])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .output(outputPath)
      .on('end', () => {
        logger.info(`Audio improved: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Audio improvement failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function removeNoise(
  inputPath: string,
  outputPath: string,
  intensity: NoiseIntensity = 'medium'
): Promise<string> {
  logger.info(`Removing noise: ${inputPath} intensity=${intensity}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const noiseProfiles: Record<NoiseIntensity, string> = {
    low: '-30',
    medium: '-50',
    aggressive: '-70',
  };

  const nrLevel = noiseProfiles[intensity] || '-50';

  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters([
        {
          filter: 'afftdn',
          options: {
            nr: nrLevel,
            nf: nrLevel,
          },
        },
        {
          filter: 'anlmdn',
          options: {
            s: intensity === 'aggressive' ? 15 : intensity === 'medium' ? 10 : 5,
            p: intensity === 'aggressive' ? 0.6 : 0.4,
          },
        },
        {
          filter: 'highpass',
          options: {
            frequency: 80,
          },
        },
        {
          filter: 'lowpass',
          options: {
            frequency: 15000,
          },
        },
      ])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .output(outputPath)
      .on('end', () => {
        logger.info(`Noise removed: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Noise removal failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function adjustVolume(
  inputPath: string,
  outputPath: string,
  volume: number
): Promise<string> {
  logger.info(`Adjusting volume: ${inputPath} volume=${volume}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const volumeExpr = volume <= 1
    ? `${Math.round(volume * 100)}%`
    : `${volume.toFixed(2)}`;

  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters([
        {
          filter: 'volume',
          options: volumeExpr,
        },
      ])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .output(outputPath)
      .on('end', () => {
        logger.info(`Volume adjusted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Volume adjustment failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function mixAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  videoVolume: number = 0.7,
  musicVolume: number = 0.3
): Promise<string> {
  logger.info(`Mixing audio: ${videoPath} + ${audioPath}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const extractedAudioPath = path.join(tempDir, `video_audio_${uuid()}.wav`);

  await extractAudio(videoPath, extractedAudioPath, 'wav');

  return new Promise<string>((resolve, reject) => {
    ffmpeg()
      .input(extractedAudioPath)
      .input(audioPath)
      .complexFilter([
        {
          filter: 'amix',
          options: {
            inputs: 2,
            duration: 'first',
            dropout_transition: 2,
          },
          inputs: ['0:a', '1:a'],
          outputs: ['a'],
        },
        {
          filter: 'volume',
          options: {
            volume: videoVolume,
          },
          inputs: 'a',
          outputs: ['mixed'],
        },
      ])
      .outputOptions([
        '-map 0:v:0',
        '-map [mixed]',
        '-c:v copy',
        '-c:a aac',
        '-b:a 192k',
        '-shortest',
      ])
      .output(outputPath)
      .on('end', () => {
        try { fs.unlinkSync(extractedAudioPath); } catch { }
        logger.info(`Audio mixed: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        try { fs.unlinkSync(extractedAudioPath); } catch { }
        logger.error(`Audio mixing failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function mixAudioWithDucking(
  videoPath: string,
  musicPath: string,
  outputPath: string,
  speechVolume: number = 1.0,
  musicVolume: number = 0.25,
  duckThreshold: number = 0.03,
  duckDuration: number = 0.2,
  speechSegments?: Array<{ start: number; end: number }>
): Promise<string> {
  logger.info(`Mixing audio with ducking: ${videoPath}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const extractedAudioPath = path.join(tempDir, `duck_video_${uuid()}.wav`);
  await extractAudio(videoPath, extractedAudioPath, 'wav');

  if (speechSegments && speechSegments.length > 0) {
    const volumeExpr = speechSegments.map(seg =>
      `between(t,${seg.start},${seg.end})*${musicVolume * 0.3}+`
    ).join('') + musicVolume.toString();

    return new Promise<string>((resolve, reject) => {
      ffmpeg()
        .input(extractedAudioPath)
        .input(musicPath)
        .complexFilter([
          {
            filter: 'volume',
            options: `'${volumeExpr}'`,
            inputs: '1:a',
            outputs: ['music_ducked'],
          },
          {
            filter: 'amix',
            options: {
              inputs: 2,
              duration: 'first',
              dropout_transition: 2,
            },
            inputs: ['0:a', 'music_ducked'],
            outputs: ['mixed'],
          },
          {
            filter: 'volume',
            options: speechVolume.toString(),
            inputs: 'mixed',
            outputs: ['out'],
          },
        ])
        .outputOptions([
          '-map 0:v:0',
          '-map [out]',
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-shortest',
        ])
        .output(outputPath)
        .on('end', () => {
          try { fs.unlinkSync(extractedAudioPath); } catch { }
          logger.info(`Audio with ducking mixed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          try { fs.unlinkSync(extractedAudioPath); } catch { }
          logger.error(`Audio ducking failed: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  return mixAudio(videoPath, musicPath, outputPath, speechVolume, musicVolume);
}

export async function detectAudioEnergy(audioPath: string): Promise<AudioEnergyPoint[]> {
  logger.info(`Detecting audio energy: ${audioPath}`);

  const energyPoints: AudioEnergyPoint[] = [];

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const wavPath = path.join(tempDir, `energy_${uuid()}.wav`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(audioPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(22050)
      .audioChannels(1)
      .output(wavPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });

  try {
    const stat = fs.statSync(wavPath);
    const fileSize = stat.size;
    if (fileSize <= 44) {
      return [];
    }

    const sampleRate = 22050;
    const windowSize = Math.floor(sampleRate * 0.05);
    const hopSize = Math.floor(sampleRate * 0.01);
    const dataSize = fileSize - 44;
    const totalSamples = Math.floor(dataSize / 2);

    const fd = fs.openSync(wavPath, 'r');
    const buffer = Buffer.alloc(dataSize);
    fs.readSync(fd, buffer, 0, dataSize, 44);
    fs.closeSync(fd);

    const maxEnergy = 32768;

    for (let pos = 0; pos < totalSamples - windowSize; pos += hopSize) {
      let sumSquares = 0;
      let count = 0;

      for (let j = 0; j < windowSize && (pos + j) * 2 + 1 < buffer.length; j++) {
        const sample = buffer.readInt16LE((pos + j) * 2);
        sumSquares += sample * sample;
        count++;
      }

      const rms = count > 0 ? Math.sqrt(sumSquares / count) / maxEnergy : 0;
      const time = pos / sampleRate;

      energyPoints.push({ time, energy: Math.min(1, rms * 3) });
    }
  } finally {
    try { fs.unlinkSync(wavPath); } catch { }
  }

  return energyPoints;
}

export async function detectBeats(audioPath: string): Promise<BeatInfo[]> {
  logger.info(`Detecting beats: ${audioPath}`);

  const energyPoints = await detectAudioEnergy(audioPath);
  const beats: BeatInfo[] = [];

  if (energyPoints.length < 3) {
    return beats;
  }

  const energies = energyPoints.map(e => e.energy);
  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const variance = energies.reduce((a, b) => a + (b - mean) ** 2, 0) / energies.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return beats;
  }

  const threshold = mean + stdDev * 0.8;
  const minBeatInterval = 0.2;
  let lastBeatTime = -minBeatInterval;

  for (let i = 1; i < energyPoints.length - 1; i++) {
    const point = energyPoints[i]!;
    const prevEnergy = energyPoints[i - 1]!.energy;
    const nextEnergy = energyPoints[i + 1]!.energy;

    if (
      point.energy > threshold &&
      point.energy > prevEnergy &&
      point.energy >= nextEnergy &&
      (point.time - lastBeatTime) >= minBeatInterval
    ) {
      const strength = (point.energy - mean) / (stdDev * 3);
      beats.push({
        time: point.time,
        strength: Math.min(1, Math.max(0, strength)),
      });
      lastBeatTime = point.time;
    }
  }

  return beats;
}

export async function syncToBeat(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<string> {
  logger.info(`Syncing video to beat: ${videoPath} + ${audioPath}`);

  const beats = await detectBeats(audioPath);
  if (beats.length < 2) {
    logger.warn('Not enough beats detected, copying without sync');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    return new Promise<string>((resolve, reject) => {
      ffmpeg(videoPath)
        .input(audioPath)
        .outputOptions(['-c:v copy', '-c:a aac', '-b:a 192k', '-shortest'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const segments: string[] = [];
  const halfBeatInterval = beats.length > 1
    ? (beats[1]!.time - beats[0]!.time) / 2
    : 0.5;

  for (let i = 0; i < beats.length - 1; i++) {
    const start = beats[i]!.time;
    const end = beats[i + 1]!.time;
    const segmentPath = path.join(tempDir, `beat_seg_${i}_${uuid()}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(start)
        .duration(end - start + halfBeatInterval)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset ultrafast'])
        .output(segmentPath)
        .on('end', () => {
          segments.push(segmentPath);
          resolve();
        })
        .on('error', reject)
        .run();
    });
  }

  if (segments.length === 0) {
    return outputPath;
  }

  const concatList = path.join(tempDir, `concat_${uuid()}.txt`);
  const listContent = segments.map(s => `file '${s.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(concatList, listContent, 'utf-8');

  return new Promise<string>((resolve, reject) => {
    ffmpeg()
      .input(concatList)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-b:a 192k',
        '-shortest',
        '-pix_fmt yuv420p',
      ])
      .output(outputPath)
      .on('end', () => {
        segments.forEach(s => {
          try { fs.unlinkSync(s); } catch { }
        });
        try { fs.unlinkSync(concatList); } catch { }
        logger.info(`Beat-synced video created: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        segments.forEach(s => {
          try { fs.unlinkSync(s); } catch { }
        });
        try { fs.unlinkSync(concatList); } catch { }
        logger.error(`Beat sync failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function crossfadeAudio(
  inputA: string,
  inputB: string,
  outputPath: string,
  fadeDuration: number = 2
): Promise<string> {
  logger.info(`Crossfading audio: ${inputA} + ${inputB} duration=${fadeDuration}s`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise<string>((resolve, reject) => {
    ffmpeg()
      .input(inputA)
      .input(inputB)
      .complexFilter([
        {
          filter: 'acrossfade',
          options: {
            d: fadeDuration,
            c1: 'tri',
            c2: 'tri',
          },
        },
      ])
      .audioCodec('aac')
      .audioBitrate('192k')
      .output(outputPath)
      .on('end', () => {
        logger.info(`Crossfade complete: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`Crossfade failed: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

export async function getAudioDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}
