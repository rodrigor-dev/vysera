import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/config/logger';
import { getVideoInfo, ensureFFmpeg, ensureTempDir, fileExists, getHardwareAcceleration } from '@/utils/ffmpeg';
import { buildAudioFilter } from '@/utils/ffmpeg-commands';
import { detectScenes, removeSilence, detectBestMoments } from './scene.service';
import { detectFaces, generateZoomKeyframes, applyAutoZoom } from './face.service';
import { applyColorGrading, applyTransitions, addTextOverlay } from './effects.service';
import { renderVideo, getFormatResolution } from './renderer.service';
import { generateNarration } from './narration.service';

export interface ProcessingOptions {
  inputPaths: string[];
  outputPath: string;
  format: 'vertical' | 'horizontal' | 'square';
  template: string;
  addCaptions: boolean;
  captionStyle: 'tiktok' | 'shorts' | 'karaoke';
  backgroundMusic?: string;
  musicVolume: number;
  removeSilence: boolean;
  autoZoom: boolean;
  autoColor: boolean;
  improveAudio: boolean;
  removeNoise: boolean;
  transitionStyle: string;
  quality: 'draft' | 'standard' | 'premium';
  narration?: { enabled: boolean; voice: string; language: string; text?: string };
}

export interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration?: number;
}

export interface ProcessingResult {
  outputPath: string;
  duration: number;
  resolution: string;
  fileSize: number;
  stages: ProcessingStage[];
  outputUrl: string;
}

const PIPELINE_STAGES = [
  'analyze',
  'preprocess',
  'effects',
  'captions',
  'audio',
  'render',
  'cleanup',
] as const;

const STAGE_LABELS: Record<string, string> = {
  analyze: 'Analyze Video',
  preprocess: 'Pre-process',
  effects: 'Apply Effects',
  captions: 'Add Captions',
  audio: 'Mix Audio',
  render: 'Render Output',
  cleanup: 'Cleanup',
};

const STAGE_WEIGHTS: Record<string, number> = {
  analyze: 10,
  preprocess: 15,
  effects: 15,
  captions: 10,
  audio: 10,
  render: 35,
  cleanup: 5,
};

function createStages(): ProcessingStage[] {
  return PIPELINE_STAGES.map(name => ({
    name: STAGE_LABELS[name] || name,
    status: 'pending' as const,
    progress: 0,
  }));
}

export async function processVideo(
  options: ProcessingOptions & { onProgress?: (p: number, stage: string) => void }
): Promise<ProcessingResult> {
  const stages = createStages();
  const startTime = Date.now();
  const tempDir = path.join(path.dirname(options.outputPath), `temp_${uuidv4()}`);

  const reportProgress = (stageName: string, stageProgress: number) => {
    const stage = stages.find(s => s.name === stageName);
    if (stage) {
      stage.progress = Math.min(100, Math.max(0, stageProgress));
    }

    let total = 0;
    let totalWeight = 0;
    for (const s of stages) {
      const weight = STAGE_WEIGHTS[PIPELINE_STAGES.find(k => STAGE_LABELS[k] === s.name) || 'render'] || 10;
      totalWeight += weight;
      if (s.status === 'completed') {
        total += weight;
      } else if (s.status === 'processing') {
        total += weight * (s.progress / 100);
      }
    }
    const overall = Math.round((total / totalWeight) * 100);
    options.onProgress?.(overall, stageName);
  };

  const setStageStatus = (name: string, status: ProcessingStage['status']) => {
    const stage = stages.find(s => s.name === name);
    if (stage) {
      stage.status = status;
      if (status === 'completed') {
        stage.progress = 100;
      }
      if (status === 'processing') {
        const elapsed = (Date.now() - startTime) / 1000;
        stage.duration = Math.round(elapsed);
      }
    }
  };

  try {
    const hasFFmpeg = await ensureFFmpeg();
    if (!hasFFmpeg) {
      throw new Error('FFmpeg is not installed or not found in PATH');
    }

    await ensureTempDir(tempDir);

    const inputPaths = options.inputPaths;
    if (inputPaths.length === 0) {
      throw new Error('No input files provided');
    }

    setStageStatus('Analyze Video', 'processing');
    reportProgress('Analyze Video', 0);

    const firstInfo = await getVideoInfo(inputPaths[0]!);
    const scenes = await detectScenes(inputPaths[0]!);
    const moments = await detectBestMoments(inputPaths[0]!);

    logger.info('Video analysis complete', {
      duration: firstInfo.duration,
      resolution: `${firstInfo.width}x${firstInfo.height}`,
      scenes: scenes.length,
      moments: moments.length,
    });

    setStageStatus('Analyze Video', 'completed');
    reportProgress('Analyze Video', 100);

    setStageStatus('Pre-process', 'processing');
    reportProgress('Pre-process', 0);

    let currentInput = inputPaths[0]!;

    if (inputPaths.length > 1) {
      const concatOutput = path.join(tempDir, 'concat_input.mp4');
      await concatInputs(inputPaths, concatOutput);
      currentInput = concatOutput;
      logger.info('Inputs concatenated', { count: inputPaths.length });
    }

    if (options.removeSilence) {
      reportProgress('Pre-process', 30);
      const silenceOutput = path.join(tempDir, 'preprocessed_silence.mp4');
      const silenceResult = await removeSilence(currentInput, silenceOutput);
      currentInput = silenceResult.outputPath;
      logger.info('Silence removed', { segments: silenceResult.segments.length });
      reportProgress('Pre-process', 60);
    }

    if (options.removeNoise) {
      reportProgress('Pre-process', 60);
      const denoiseOutput = path.join(tempDir, 'preprocessed_denoise.mp4');
      const audioFilter = buildAudioFilter({ noiseReduce: true });

      await new Promise<void>((resolve, reject) => {
        ffmpeg(currentInput)
          .audioFilter(audioFilter)
          .videoFilter('hqdn3d=4:3:6:4')
          .outputOptions('-c:v', 'libx264', '-preset', 'fast', '-crf', '22')
          .outputOptions('-c:a', 'aac', '-b:a', '128k')
          .save(denoiseOutput)
          .on('error', (err) => reject(new Error(`Denoise failed: ${err.message}`)))
          .on('end', () => resolve())
          .run();
      });
      currentInput = denoiseOutput;
      logger.info('Noise reduction complete');
      reportProgress('Pre-process', 100);
    }

    setStageStatus('Pre-process', 'completed');

    setStageStatus('Apply Effects', 'processing');
    reportProgress('Apply Effects', 0);

    let effectsInput = currentInput;

    if (options.autoColor) {
      reportProgress('Apply Effects', 25);
      const colorOutput = path.join(tempDir, 'effects_color.mp4');
      await applyColorGrading(effectsInput, colorOutput, 'cinematic');
      effectsInput = colorOutput;
      reportProgress('Apply Effects', 50);
    }

    if (options.autoZoom) {
      reportProgress('Apply Effects', 50);
      const faceData = await detectFaces(effectsInput);
      const keyframes = await generateZoomKeyframes(effectsInput, faceData);
      if (keyframes.length > 1) {
        const zoomOutput = path.join(tempDir, 'effects_zoom.mp4');
        await applyAutoZoom(effectsInput, zoomOutput, keyframes);
        effectsInput = zoomOutput;
      }
      reportProgress('Apply Effects', 75);
    }

    if (options.transitionStyle && options.transitionStyle !== 'none') {
      reportProgress('Apply Effects', 75);
      const sceneData = await detectScenes(effectsInput);
      if (sceneData.length > 1) {
        const transitionOutput = path.join(tempDir, 'effects_transition.mp4');
        const segments = sceneData.map(s => ({ start: s.start, end: s.end }));
        await applyTransitions(effectsInput, transitionOutput, segments, options.transitionStyle);
        effectsInput = transitionOutput;
      }
      reportProgress('Apply Effects', 100);
    }

    setStageStatus('Apply Effects', 'completed');

    setStageStatus('Add Captions', 'processing');
    reportProgress('Add Captions', 0);

    let captionInput = effectsInput;
    if (options.addCaptions) {
      const captionsOutput = path.join(tempDir, 'captioned.mp4');
      const captionText = getCaptionText(options.captionStyle);
      const fontSize = Math.round(firstInfo.height / 25);

      await addTextOverlay(captionInput, captionsOutput, captionText, {
        fontSize,
        position: 'bottom-center',
        color: 'white',
        backgroundColor: 'black@0.5',
        animation: options.captionStyle === 'tiktok' ? 'fade-in' : options.captionStyle === 'shorts' ? 'slide-up' : 'none',
      });
      captionInput = captionsOutput;
      reportProgress('Add Captions', 100);
    }

    setStageStatus('Add Captions', 'completed');

    setStageStatus('Mix Audio', 'processing');
    reportProgress('Mix Audio', 0);

    let audioInput = captionInput;
    if (options.backgroundMusic) {
      const musicExists = await fileExists(options.backgroundMusic);
      if (musicExists) {
        const audioOutput = path.join(tempDir, 'mixed_audio.mp4');
        const musicVol = options.musicVolume ?? 0.3;

        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(audioInput)
            .input(options.backgroundMusic!)
            .complexFilter([
              `[1:a]volume=${musicVol}[music]`,
              `[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[outa]`,
            ], ['outa'])
            .outputOptions('-c:v', 'copy')
            .outputOptions('-c:a', 'aac', '-b:a', '192k')
            .outputOptions('-map', '0:v')
            .outputOptions('-map', '[outa]')
            .save(audioOutput)
            .on('error', (err) => {
              logger.warn('Audio mixing failed, using original', { error: err.message });
              resolve();
            })
            .on('end', () => {
              audioInput = audioOutput;
              resolve();
            })
            .run();
        });
        reportProgress('Mix Audio', 50);
      }
    }

    if (options.narration?.enabled && options.narration.text) {
      reportProgress('Mix Audio', 60);
      try {
        const narrationAudioPath = path.join(tempDir, `narration_${uuidv4()}.mp3`);
        await generateNarration(
          options.narration.text,
          narrationAudioPath,
          { voice: options.narration.voice, language: options.narration.language }
        );

        const narratedOutput = path.join(tempDir, 'narrated_audio.mp4');
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(audioInput)
            .input(narrationAudioPath)
            .complexFilter([
              `[1:a]volume=1.0[narration]`,
              `[0:a][narration]amix=inputs=2:duration=first:dropout_transition=2[outa]`,
            ], ['outa'])
            .outputOptions('-c:v', 'copy')
            .outputOptions('-c:a', 'aac', '-b:a', '192k')
            .outputOptions('-map', '0:v')
            .outputOptions('-map', '[outa]')
            .save(narratedOutput)
            .on('error', (err) => {
              logger.warn('Narration mixing failed, using original audio', { error: err.message });
              resolve();
            })
            .on('end', () => {
              audioInput = narratedOutput;
              resolve();
            })
            .run();
        });
      } catch (err) {
        logger.warn('Narration generation failed, continuing without narration', { error: (err as Error).message });
      }
      reportProgress('Mix Audio', 80);
    }

    if (options.improveAudio) {
      const improveOutput = path.join(tempDir, 'improved_audio.mp4');
      const audioFilters = buildAudioFilter({ normalize: true, noiseReduce: true });

      await new Promise<void>((resolve, reject) => {
        ffmpeg(audioInput)
          .audioFilter(audioFilters)
          .outputOptions('-c:v', 'copy')
          .outputOptions('-c:a', 'aac', '-b:a', '192k')
          .save(improveOutput)
          .on('error', (err) => {
            logger.warn('Audio improvement failed, using original', { error: err.message });
            resolve();
          })
          .on('end', () => {
            audioInput = improveOutput;
            resolve();
          })
          .run();
      });
      reportProgress('Mix Audio', 100);
    }

    setStageStatus('Mix Audio', 'completed');

    setStageStatus('Render Output', 'processing');
    reportProgress('Render Output', 0);

    const result = await renderVideo(
      audioInput,
      options.outputPath,
      {
        format: options.format,
        quality: options.quality,
      },
      (progress) => {
        reportProgress('Render Output', progress);
      }
    );

    setStageStatus('Render Output', 'completed');

    setStageStatus('Cleanup', 'processing');
    reportProgress('Cleanup', 0);

    await fs.rm(tempDir, { recursive: true, force: true }).catch((err) => {
      logger.warn('Temp dir cleanup failed', { error: (err as Error).message });
    });

    setStageStatus('Cleanup', 'completed');

    const res = getFormatResolution(options.format);

    return {
      outputPath: result.outputPath,
      duration: result.duration,
      resolution: `${res.width}x${res.height}`,
      fileSize: result.fileSize,
      stages: stages.map(s => ({
        ...s,
        status: s.status === 'processing' ? 'completed' as const : s.status,
      })),
      outputUrl: `/uploads/exports/${path.basename(result.outputPath)}`,
    };
  } catch (err) {
    const errorMessage = (err as Error).message;
    logger.error('Video processing failed', { error: errorMessage });

    const runningStage = stages.find(s => s.status === 'processing');
    if (runningStage) {
      const stage = stages.find(s => s.name === runningStage.name);
      if (stage) {
        stage.status = 'failed';
      }
    }

    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    throw new Error(`Video processing failed at stage "${runningStage?.name || 'unknown'}": ${errorMessage}`);
  }
}

async function concatInputs(inputPaths: string[], outputPath: string): Promise<void> {
  const tempDir = path.dirname(outputPath);
  const listPath = path.join(tempDir, `concat_${uuidv4()}.txt`);
  const listContent = inputPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  await fs.writeFile(listPath, listContent, 'utf-8');

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions('-c', 'copy')
      .save(outputPath)
      .on('error', (err) => {
        reject(new Error(`Concat failed: ${err.message}`));
      })
      .on('end', async () => {
        await fs.unlink(listPath).catch(() => {});
        resolve();
      })
      .run();
  });
}

function getCaptionText(style: string): string {
  switch (style) {
    case 'tiktok':
      return 'Captions coming soon...';
    case 'shorts':
      return 'Vysera AI';
    case 'karaoke':
      return '♪ Vysera ♪';
    default:
      return 'Vysera';
  }
}
