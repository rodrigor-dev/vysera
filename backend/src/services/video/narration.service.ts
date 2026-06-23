import fs from 'fs';
import path from 'path';
import { EdgeTTS } from 'node-edge-tts';
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
    case 'edge':
      return generateEdgeTTS(text, outputPath, options);
    default:
      return generateEdgeTTS(text, outputPath, options);
  }
}

async function generateOpenAITTSUnderlay(
  text: string,
  outputPath: string,
  options: NarrationOptions
): Promise<string> {
  const apiKey = config.narration?.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI TTS requires OPENAI_API_KEY environment variable');
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
    throw new Error('ElevenLabs TTS requires ELEVENLABS_API_KEY environment variable');
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

async function generateEdgeTTS(
  text: string,
  outputPath: string,
  options: NarrationOptions
): Promise<string> {
  const voiceMap: Record<string, string> = {
    'pt-BR-Female': 'pt-BR-FranciscaNeural',
    'pt-BR-Male': 'pt-BR-AntonioNeural',
    'en-US-Female': 'en-US-AriaNeural',
    'en-US-Male': 'en-US-GuyNeural',
  };

  const edgeVoice = voiceMap[options.voice] || 'en-US-AriaNeural';
  const lang = options.language || 'en-US';
  const rate = options.speed ? `${Math.round((options.speed - 1) * 100)}%` : '0%';

  const tts = new EdgeTTS({
    voice: edgeVoice,
    lang,
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    rate,
    pitch: options.pitch ? `${options.pitch}Hz` : '0Hz',
  });

  await tts.ttsPromise(text, outputPath);
  logger.info(`Edge TTS narration generated: ${outputPath}`);
  return outputPath;
}
