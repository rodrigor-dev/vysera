import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/config/logger';
import { getVideoInfo, ensureTempDir } from '@/utils/ffmpeg';

export interface Scene {
  index: number;
  start: number;
  end: number;
  duration: number;
  confidence: number;
}

export interface MomentRanking {
  start: number;
  end: number;
  score: number;
  reason: string;
}

export async function detectScenes(videoPath: string): Promise<Scene[]> {
  const info = await getVideoInfo(videoPath);
  const scenes: Scene[] = [];
  let lastTimestamp = 0;
  let sceneIndex = 0;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilter("select='gt(scene\\\\,0.4)',showinfo")
      .outputOptions('-f', 'null')
      .on('error', (err) => {
        logger.error('Scene detection error', { error: err.message });
        reject(new Error(`Scene detection failed: ${err.message}`));
      })
      .on('end', () => {
        scenes.push({
          index: sceneIndex++,
          start: lastTimestamp,
          end: info.duration,
          duration: info.duration - lastTimestamp,
          confidence: 0.5,
        });
        resolve(scenes);
      })
      .on('stderr', (stderrLine) => {
        const ptsMatch = stderrLine.match(/pts_time:([\d.]+)/);
        if (ptsMatch && ptsMatch[1]) {
          const timestamp = parseFloat(ptsMatch[1]);
          if (timestamp > lastTimestamp) {
            scenes.push({
              index: sceneIndex++,
              start: lastTimestamp,
              end: timestamp,
              duration: timestamp - lastTimestamp,
              confidence: Math.min(1, (timestamp - lastTimestamp) / 10),
            });
            lastTimestamp = timestamp;
          }
        }
      })
      .output('/dev/null')
      .run();
  });
}

export async function removeSilence(
  inputPath: string,
  outputPath: string,
  options: { threshold?: number; minDuration?: number } = {}
): Promise<{ segments: Array<{ start: number; end: number }>; newDuration: number; outputPath: string }> {
  const threshold = options.threshold ?? -30;
  const minDuration = options.minDuration ?? 0.5;
  const info = await getVideoInfo(inputPath);

  const noiseDb = `${threshold}dB`;
  const durSec = minDuration.toFixed(2);

  const segments: Array<{ start: number; end: number }> = [];

  await new Promise<void>((resolve, reject) => {
    const tempAudio = path.join(path.dirname(outputPath), `temp_audio_${uuidv4()}.wav`);

    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .outputOptions('-vn')
      .save(tempAudio)
      .on('error', (err) => reject(err))
      .on('end', () => {
        let currentSilence: { start: number; end: number } | null = null;

        ffmpeg(tempAudio)
          .audioFilter(`silencedetect=noise=${noiseDb}:d=${durSec}`)
          .outputOptions('-f', 'null')
          .on('stderr', (line) => {
            const silenceStart = line.match(/silence_start: ([\d.]+)/);
            const silenceEnd = line.match(/silence_end: ([\d.]+)/);

            if (silenceStart && silenceStart[1]) {
              currentSilence = { start: parseFloat(silenceStart[1]), end: 0 };
            }
            if (silenceEnd && silenceEnd[1] && currentSilence) {
              currentSilence.end = parseFloat(silenceEnd[1]);
              segments.push({
                start: currentSilence.start,
                end: currentSilence.end,
              });
              currentSilence = null;
            }
          })
          .on('error', (err) => reject(err))
          .on('end', async () => {
            try {
              await fs.unlink(tempAudio).catch(() => {});
            } catch {
              // ignore cleanup errors
            }

            if (segments.length === 0) {
              await fs.copyFile(inputPath, outputPath);
              resolve();
              return;
            }

            await concatNonSilentSegments(inputPath, outputPath, segments);
            resolve();
          })
          .output('/dev/null')
          .run();
      })
      .run();
  });

  const totalSilenceRemoved = segments.reduce((sum, s) => sum + (s.end - s.start), 0);
  const newDuration = Math.max(0, info.duration - totalSilenceRemoved);

  return { segments, newDuration, outputPath };
}

async function concatNonSilentSegments(
  inputPath: string,
  outputPath: string,
  segments: Array<{ start: number; end: number }>
): Promise<void> {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const cutPoints: number[] = [];
  for (const seg of sorted) {
    cutPoints.push(seg.start, seg.end);
  }

  const filterParts: string[] = [];
  let lastEnd = 0;

  for (let i = 0; i < cutPoints.length; i += 2) {
    const segStart = cutPoints[i]!;
    const segEnd = cutPoints[i + 1]!;
    if (segStart > lastEnd) {
      filterParts.push(`between(t,${lastEnd},${segStart})`);
    }
    lastEnd = segEnd;
  }

  if (lastEnd < 1e6) {
    filterParts.push(`between(t,${lastEnd},999999)`);
  }

  const selectFilter = `select='${filterParts.join('+')}',setpts=N/FRAME_RATE/TB`;
  const audioFilter = `aselect='${filterParts.join('+')}',asetpts=N/SR/TB`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(selectFilter)
      .audioFilter(audioFilter)
      .outputOptions('-c:v', 'libx264', '-preset', 'fast', '-crf', '22')
      .outputOptions('-c:a', 'aac', '-b:a', '128k')
      .save(outputPath)
      .on('error', (err) => reject(new Error(`Silence removal concat failed: ${err.message}`)))
      .on('end', () => resolve())
      .run();
  });
}

export async function detectBestMoments(videoPath: string): Promise<MomentRanking[]> {
  const info = await getVideoInfo(videoPath);
  const scenes = await detectScenes(videoPath);
  const moments: MomentRanking[] = [];

  for (const scene of scenes) {
    if (scene.confidence > 0.4) {
      moments.push({
        start: scene.start,
        end: scene.end,
        score: scene.confidence,
        reason: 'scene_change',
      });
    }
  }

  const windowSize = 2;
  for (let t = 0; t < info.duration - windowSize; t += windowSize) {
    const inWindow = moments.filter(m => m.start >= t && m.end <= t + windowSize);
    const avgScore = inWindow.length > 0
      ? inWindow.reduce((sum, m) => sum + m.score, 0) / inWindow.length
      : 0;

    if (avgScore > 0.6) {
      moments.push({
        start: t,
        end: t + windowSize,
        score: avgScore,
        reason: 'high_activity_zone',
      });
    }
  }

  return moments
    .sort((a, b) => b.score - a.score)
    .filter((m, i, arr) => {
      const overlap = arr.some((other, j) =>
        j !== i && other.start < m.end && other.end > m.start
      );
      return !overlap;
    })
    .slice(0, 10);
}

export async function splitAtMoments(
  inputPath: string,
  moments: MomentRanking[],
  outputDir: string
): Promise<string[]> {
  await ensureTempDir(outputDir);
  const outputFiles: string[] = [];

  for (let i = 0; i < moments.length; i++) {
    const moment = moments[i]!;
    const outputPath = path.join(outputDir, `moment_${i + 1}_${uuidv4().slice(0, 8)}.mp4`);
    const duration = moment.end - moment.start;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(moment.start)
        .duration(duration)
        .outputOptions('-c:v', 'libx264', '-preset', 'fast', '-crf', '23')
        .outputOptions('-c:a', 'aac', '-b:a', '128k')
        .save(outputPath)
        .on('error', (err) => reject(new Error(`Split failed at moment ${i}: ${err.message}`)))
        .on('end', () => {
          outputFiles.push(outputPath);
          resolve();
        })
        .run();
    });
  }

  return outputFiles;
}
