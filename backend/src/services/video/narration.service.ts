import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import logger from '@/config/logger';
import { config } from '../../config';

export interface NarrationOptions {
  voice: string;
  language: string;
  speed?: number;
  pitch?: number;
}

export async function generateNarration(
  text: string,
  outputPath: string,
  options: NarrationOptions
): Promise<string> {
  logger.info(`Generating narration: voice=${options.voice} lang=${options.language} text="${text.slice(0, 60)}..."`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const narrationProvider = config.narration?.provider || 'default';

  switch (narrationProvider) {
    case 'openai':
      return generateOpenAITTSUnderlay(text, outputPath, options);
    case 'elevenlabs':
      return generateElevenLabsTTS(text, outputPath, options);
    default:
      return generatePlaceholderNarration(text, outputPath, options);
  }
}

async function generateOpenAITTSUnderlay(
  text: string,
  outputPath: string,
  options: NarrationOptions
): Promise<string> {
  const apiKey = config.narration?.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn('OpenAI API key not configured, falling back to placeholder narration');
    return generatePlaceholderNarration(text, outputPath, options);
  }

  const voiceMap: Record<string, string> = {
    'pt-BR-Female': 'nova',
    'pt-BR-Male': 'onyx',
    'en-US-Female': 'shimmer',
    'en-US-Male': 'echo',
  };

  const voice = voiceMap[options.voice] || 'shimmer';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed: options.speed || 1.0,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  logger.info(`OpenAI narration generated: ${outputPath}`);
  return outputPath;
}

async function generateElevenLabsTTS(
  text: string,
  outputPath: string,
  options: NarrationOptions
): Promise<string> {
  const apiKey = config.narration?.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    logger.warn('ElevenLabs API key not configured, falling back to placeholder narration');
    return generatePlaceholderNarration(text, outputPath, options);
  }

  const voiceMap: Record<string, string> = {
    'pt-BR-Female': '21m00Tcm4TlvDq8ikWAM',
    'pt-BR-Male': 'yoZ06aMxZJJ28mfd3POQ',
    'en-US-Female': 'EXAVITQu4vrVxn15KCSN',
    'en-US-Male': 'IKne3meq5aSn9XLyUdCD',
  };

  const voiceId = voiceMap[options.voice] || 'EXAVITQu4vrVxn15KCSN';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        speed: options.speed || 1.0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  logger.info(`ElevenLabs narration generated: ${outputPath}`);
  return outputPath;
}

async function generatePlaceholderNarration(
  text: string,
  outputPath: string,
  options: NarrationOptions
): Promise<string> {
  logger.warn('No TTS provider configured, generating silent placeholder narration');
  const sampleRate = 22050;
  const duration = Math.max(1, Math.ceil(text.length / 15));
  const numSamples = sampleRate * duration;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 220 + (Math.sin(t * 0.5) * 100);
    const amplitude = 8000 * (1 - Math.min(1, t / 0.05));
    const sample = Math.round(amplitude * Math.sin(2 * Math.PI * freq * t));
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), 44 + i * 2);
  }

  const wavPath = outputPath.replace(/\.mp3$/, '.wav');
  fs.writeFileSync(wavPath, buffer);

  const ffmpeg = require('fluent-ffmpeg');
  return new Promise((resolve, reject) => {
    ffmpeg(wavPath)
      .audioCodec('libmp3lame')
      .audioBitrate('64k')
      .output(outputPath)
      .on('end', () => {
        try { fs.unlinkSync(wavPath); } catch { }
        logger.info(`Placeholder narration generated: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        try { fs.unlinkSync(wavPath); } catch { }
        reject(err);
      })
      .run();
  });
}
