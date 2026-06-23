import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import logger from '../config/logger';

let FFMPEG_STATIC_PATH: string | null = null;
try {
  FFMPEG_STATIC_PATH = require('ffmpeg-static');
} catch { /* use system */ }

const SAMPLE_RATE = 44100;

function freq(semitoneOffset: number, baseFreq: number = 440): number {
  return baseFreq * Math.pow(2, semitoneOffset / 12);
}

function noteFreq(note: string): number {
  const names: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
    'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
  };
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) return 440;
  const n = names[m[1]!] ?? 0;
  const oct = parseInt(m[2]!, 10);
  return 440 * Math.pow(2, (oct - 4) + (n - 9) / 12);
}

function chordFreqs(rootNote: string, intervals: number[]): number[] {
  const root = noteFreq(rootNote);
  return intervals.map(interval => root * Math.pow(2, interval / 12));
}

function adsEnvelope(i: number, total: number, sr: number, attack = 0.05, decay = 0.1, sustain = 0.7, release = 0.15): number {
  const attackSamples = Math.round(attack * sr);
  const decaySamples = Math.round(decay * sr);
  const releaseSamples = Math.round(release * sr);
  const sustainEnd = total - releaseSamples;

  if (i < attackSamples) return i / attackSamples;
  if (i < attackSamples + decaySamples) {
    const t = (i - attackSamples) / decaySamples;
    return 1 - (1 - sustain) * t;
  }
  if (i >= sustainEnd) {
    const t = (i - sustainEnd) / releaseSamples;
    return sustain * (1 - t);
  }
  return sustain;
}

interface MoodDef {
  bpm: number;
  chords: Array<{
    root: string;
    intervals: number[];
    beats: number;
  }>;
  drumPattern: readonly ('kick' | 'snare' | 'hat' | 'none')[];
  drumBeats: number;
  energy: number;
}

const MOODS: Record<string, MoodDef> = {
  epic: {
    bpm: 100,
    chords: [
      { root: 'C3', intervals: [0, 4, 7, 11, 14], beats: 4 },
      { root: 'G3', intervals: [0, 4, 7, 11, 14], beats: 4 },
      { root: 'A3', intervals: [0, 3, 7, 10, 14], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7, 11, 14], beats: 4 },
    ],
    drumPattern: ['kick', 'none', 'kick', 'none', 'snare', 'none', 'kick', 'none'],
    drumBeats: 8,
    energy: 0.85,
  },
  upbeat: {
    bpm: 128,
    chords: [
      { root: 'C3', intervals: [0, 4, 7, 12], beats: 4 },
      { root: 'G3', intervals: [0, 4, 7, 12], beats: 4 },
      { root: 'A3', intervals: [0, 3, 7, 12], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7, 12], beats: 4 },
    ],
    drumPattern: ['kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'hat'],
    drumBeats: 8,
    energy: 0.8,
  },
  calm: {
    bpm: 80,
    chords: [
      { root: 'A3', intervals: [0, 3, 7], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7], beats: 4 },
      { root: 'C3', intervals: [0, 3, 7], beats: 4 },
      { root: 'G3', intervals: [0, 4, 7], beats: 4 },
    ],
    drumPattern: ['hat', 'none', 'hat', 'none', 'hat', 'none', 'hat', 'none'],
    drumBeats: 8,
    energy: 0.3,
  },
  energetic: {
    bpm: 140,
    chords: [
      { root: 'C3', intervals: [0, 4, 7, 12], beats: 4 },
      { root: 'C3', intervals: [0, 4, 7, 12], beats: 4 },
      { root: 'A3', intervals: [0, 3, 7, 12], beats: 4 },
      { root: 'A3', intervals: [0, 3, 7, 12], beats: 4 },
    ],
    drumPattern: ['kick', 'none', 'kick', 'none', 'snare', 'none', 'kick', 'none'],
    drumBeats: 8,
    energy: 0.9,
  },
  happy: {
    bpm: 110,
    chords: [
      { root: 'C3', intervals: [0, 4, 7], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7], beats: 4 },
      { root: 'G3', intervals: [0, 4, 7], beats: 4 },
      { root: 'C4', intervals: [0, 4, 7], beats: 4 },
    ],
    drumPattern: ['kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat'],
    drumBeats: 8,
    energy: 0.7,
  },
  sad: {
    bpm: 60,
    chords: [
      { root: 'A3', intervals: [0, 3, 7], beats: 4 },
      { root: 'E3', intervals: [0, 3, 7], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7], beats: 4 },
      { root: 'E3', intervals: [0, 3, 7], beats: 4 },
    ],
    drumPattern: ['none'],
    drumBeats: 1,
    energy: 0.2,
  },
  cinematic: {
    bpm: 90,
    chords: [
      { root: 'A3', intervals: [0, 3, 7, 11], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7, 10], beats: 4 },
      { root: 'C3', intervals: [0, 3, 7, 10], beats: 4 },
      { root: 'G3', intervals: [0, 4, 7, 11], beats: 4 },
    ],
    drumPattern: ['none'],
    drumBeats: 1,
    energy: 0.5,
  },
  dark: {
    bpm: 70,
    chords: [
      { root: 'D3', intervals: [0, 3, 7, 10], beats: 4 },
      { root: 'G3', intervals: [0, 3, 7, 10], beats: 4 },
      { root: 'C3', intervals: [0, 3, 7, 10], beats: 4 },
      { root: 'D3', intervals: [0, 3, 7, 10], beats: 4 },
    ],
    drumPattern: ['kick', 'none', 'snare', 'none'],
    drumBeats: 4,
    energy: 0.6,
  },
  focus: {
    bpm: 85,
    chords: [
      { root: 'C3', intervals: [0, 4, 7], beats: 4 },
      { root: 'G3', intervals: [0, 4, 7], beats: 4 },
      { root: 'A3', intervals: [0, 3, 7], beats: 4 },
      { root: 'F3', intervals: [0, 4, 7], beats: 4 },
    ],
    drumPattern: ['hat', 'none', 'hat', 'none'],
    drumBeats: 4,
    energy: 0.3,
  },
  mysterious: {
    bpm: 75,
    chords: [
      { root: 'G#3', intervals: [0, 3, 7, 10], beats: 4 },
      { root: 'E3', intervals: [0, 3, 7], beats: 4 },
      { root: 'F#3', intervals: [0, 3, 7], beats: 4 },
      { root: 'G#3', intervals: [0, 3, 7, 10], beats: 4 },
    ],
    drumPattern: ['hat', 'none', 'hat', 'none'],
    drumBeats: 4,
    energy: 0.4,
  },
};

function generateChordPad(
  freqs: number[],
  numSamples: number,
  sampleRate: number,
  energy: number
): Float32Array {
  const buf = new Float32Array(numSamples);
  const numVoices = freqs.length;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = adsEnvelope(i, numSamples, sampleRate, 0.1, 0.2, 0.8, 0.3);
    let s = 0;
    for (let v = 0; v < numVoices; v++) {
      const spread = (v - (numVoices - 1) / 2) * 0.3;
      s += Math.sin(2 * Math.PI * freqs[v]! * t + spread);
    }
    buf[i] = (s / numVoices) * env * 0.25 * energy;
  }
  return buf;
}

function generateBass(rootFreq: number, numSamples: number, sampleRate: number, energy: number): Float32Array {
  const buf = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = adsEnvelope(i, numSamples, sampleRate, 0.01, 0.1, 0.9, 0.2);
    const s = Math.sin(2 * Math.PI * rootFreq * 0.5 * t);
    buf[i] = s * env * 0.3 * energy;
  }
  return buf;
}

function generateKick(sampleRate: number, numSamples: number, energy: number): Float32Array {
  const buf = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 150 * Math.exp(-t * 40);
    const env = Math.exp(-t * 20);
    const s = Math.sin(2 * Math.PI * freq * t);
    buf[i] = s * env * 0.4 * energy;
  }
  return buf;
}

function generateSnare(sampleRate: number, numSamples: number, energy: number): Float32Array {
  const buf = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const tone = Math.sin(2 * Math.PI * 200 * t);
    const noise = Math.random() * 2 - 1;
    const env = Math.exp(-t * 30);
    buf[i] = (tone * 0.3 + noise * 0.7) * env * 0.35 * energy;
  }
  return buf;
}

function generateHiHat(sampleRate: number, numSamples: number, energy: number): Float32Array {
  const buf = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noise = Math.random() * 2 - 1;
    const env = Math.exp(-t * 80);
    buf[i] = noise * env * 0.15 * energy;
  }
  return buf;
}

function mixBuffers(dest: Float32Array, src: Float32Array, offset: number = 0): void {
  for (let i = 0; i < src.length && offset + i < dest.length; i++) {
    dest[offset + i]! += src[i]!;
  }
}

function normalize(buf: Float32Array, targetPeak = 0.9): Float32Array {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const abs = Math.abs(buf[i]!);
    if (abs > peak) peak = abs;
  }
  if (peak > 0) {
    const gain = targetPeak / peak;
    for (let i = 0; i < buf.length; i++) {
      buf[i]! *= gain;
    }
  }
  return buf;
}

function floatToWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]!));
    const intVal = val < 0 ? val * 0x8000 : val * 0x7FFF;
    buffer.writeInt16LE(Math.round(intVal), 44 + i * 2);
  }

  return buffer;
}

export function getMoodNames(): string[] {
  return Object.keys(MOODS);
}

export async function generateMusic(
  mood: string,
  durationSec: number,
  outputPath: string
): Promise<void> {
  const def: MoodDef = MOODS[mood] || MOODS.calm!;
  const sr = SAMPLE_RATE;
  const beatsPerSec = def.bpm / 60;
  const totalSamples = Math.round(sr * durationSec);
  const master = new Float32Array(totalSamples);

  let totalChordBeats = 0;
  for (const c of def.chords) totalChordBeats += c.beats;
  const chordCycles = Math.max(1, Math.ceil((durationSec * beatsPerSec) / totalChordBeats));
  const effectiveDuration = (totalChordBeats * chordCycles) / beatsPerSec;
  const effectiveSamples = Math.round(sr * effectiveDuration);
  const pad = new Float32Array(effectiveSamples);

  let beatPos = 0;
  for (let cycle = 0; cycle < chordCycles; cycle++) {
    for (const chord of def.chords) {
      const freqs = chordFreqs(chord.root, chord.intervals);
      const chordSamples = Math.round((chord.beats / beatsPerSec) * sr);
      const off = Math.round((beatPos / beatsPerSec) * sr);

      const chordBuf = generateChordPad(freqs, chordSamples, sr, def.energy);
      mixBuffers(pad, chordBuf, off);

      const bassBuf = generateBass(freqs[0]!, chordSamples, sr, def.energy);
      mixBuffers(pad, bassBuf, off);

      beatPos += chord.beats;
    }
  }

  mixBuffers(master, pad);

  if (def.drumPattern.length > 0 && def.drumPattern[0]! !== 'none') {
    const drumDuration = 0.15;
    const drumSamples = Math.round(drumDuration * sr);
    const patternBeats = def.drumBeats;
    const patternDuration = patternBeats / beatsPerSec;

    for (let beatIdx = 0; beatIdx * sr / beatsPerSec < effectiveSamples; beatIdx++) {
      const patIdx = beatIdx % patternBeats;
      const hit = def.drumPattern[patIdx];
      if (!hit || hit === 'none') continue;

      const off = Math.round((beatIdx / beatsPerSec) * sr);
      let drumBuf: Float32Array;
      switch (hit) {
        case 'kick': drumBuf = generateKick(sr, drumSamples, def.energy); break;
        case 'snare': drumBuf = generateSnare(sr, drumSamples, def.energy); break;
        case 'hat': drumBuf = generateHiHat(sr, Math.round(drumSamples * 0.5), def.energy); break;
        default: continue;
      }
      mixBuffers(master, drumBuf, off);
    }
  }

  normalize(master);

  if (effectiveSamples > totalSamples) {
    master.subarray(0, totalSamples).set(master);
  }

  const wavBuffer = floatToWav(master.subarray(0, Math.min(master.length, totalSamples)), sr);

  await fs.writeFile(outputPath, wavBuffer);

  logger.info(`Generated music: mood=${mood} duration=${durationSec}s -> ${outputPath}`);

  const ffmpegPath = FFMPEG_STATIC_PATH || 'ffmpeg';
  const mp3Path = outputPath.replace(/\.wav$/, '.mp3');
  await new Promise<void>((resolve, reject) => {
    execFile(ffmpegPath, [
      '-y', '-i', outputPath,
      '-c:a', 'libmp3lame', '-b:a', '192k',
      mp3Path,
    ], { timeout: 30000 }, (err) => {
      if (err) reject(new Error(`MP3 conversion failed: ${err.message}`));
      else resolve();
    });
  });

  await fs.unlink(outputPath).catch(() => {});
}
