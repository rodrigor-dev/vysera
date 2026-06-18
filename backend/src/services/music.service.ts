import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import logger from '@/config/logger';
import { config } from '@/config';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  mood: string;
  tempo: number;
  source: 'pixabay' | 'mixkit' | 'fma';
  url: string;
  previewUrl: string;
  cached: boolean;
}

export interface MusicSearchParams {
  query?: string;
  genre?: string;
  mood?: string;
  tempo?: { min?: number; max?: number };
  duration?: { min?: number; max?: number };
  source?: 'pixabay' | 'mixkit' | 'fma';
  page?: number;
  limit?: number;
}

interface PixabayHit {
  id: number;
  url: string;
  preview_url: string;
  title?: string;
  duration: number;
  tags: string;
}

interface MixkitItem {
  id: number;
  title: string;
  url: string;
  preview_url?: string;
  duration: number;
  music_genres?: { id: number; name: string }[];
}

interface FMARecord {
  track_id: string;
  title: string;
  artist_name?: string;
  duration?: number;
  genre?: string;
  url?: string;
}

const MUSIC_CACHE_DIR = path.join(config.upload.dir, 'music');
const API_DELAY_MS = 600;
const MAX_RETRIES = 2;

const MOCK_TRACKS: MusicTrack[] = [
  { id: 'mock-cinematic-1', title: 'Epic Cinematic Rise', artist: 'Vysera Studio', duration: 180, genre: 'cinematic', mood: 'epic', tempo: 120, source: 'pixabay', url: '', previewUrl: '', cached: false },
  { id: 'mock-calm-1', title: 'Gentle Ambient Waves', artist: 'Vysera Studio', duration: 240, genre: 'ambient', mood: 'calm', tempo: 70, source: 'pixabay', url: '', previewUrl: '', cached: false },
  { id: 'mock-energetic-1', title: 'High Energy Pop Beat', artist: 'Vysera Studio', duration: 210, genre: 'pop', mood: 'energetic', tempo: 128, source: 'mixkit', url: '', previewUrl: '', cached: false },
  { id: 'mock-energetic-2', title: 'Upbeat Electronic Groove', artist: 'Vysera Studio', duration: 195, genre: 'electronic', mood: 'energetic', tempo: 126, source: 'mixkit', url: '', previewUrl: '', cached: false },
  { id: 'mock-calm-2', title: 'Soft Piano Reflections', artist: 'Vysera Studio', duration: 300, genre: 'classical', mood: 'calm', tempo: 60, source: 'fma', url: '', previewUrl: '', cached: false },
  { id: 'mock-cinematic-2', title: 'Dark Orchestral Theme', artist: 'Vysera Studio', duration: 270, genre: 'cinematic', mood: 'dark', tempo: 90, source: 'fma', url: '', previewUrl: '', cached: false },
  { id: 'mock-happy-1', title: 'Happy Ukulele Day', artist: 'Vysera Studio', duration: 150, genre: 'folk', mood: 'happy', tempo: 110, source: 'pixabay', url: '', previewUrl: '', cached: false },
  { id: 'mock-energetic-3', title: 'Driving Rock Anthem', artist: 'Vysera Studio', duration: 225, genre: 'rock', mood: 'energetic', tempo: 140, source: 'mixkit', url: '', previewUrl: '', cached: false },
  { id: 'mock-cinematic-3', title: 'Mystical Ambient Journey', artist: 'Vysera Studio', duration: 360, genre: 'ambient', mood: 'mysterious', tempo: 80, source: 'fma', url: '', previewUrl: '', cached: false },
  { id: 'mock-happy-2', title: 'Bright Summer Vibes', artist: 'Vysera Studio', duration: 180, genre: 'pop', mood: 'happy', tempo: 118, source: 'pixabay', url: '', previewUrl: '', cached: false },
  { id: 'mock-focus-1', title: 'Deep Focus Lo-Fi', artist: 'Vysera Studio', duration: 420, genre: 'lofi', mood: 'focus', tempo: 85, source: 'mixkit', url: '', previewUrl: '', cached: false },
  { id: 'mock-dark-1', title: 'Dark Synthwave Chase', artist: 'Vysera Studio', duration: 240, genre: 'synthwave', mood: 'dark', tempo: 130, source: 'fma', url: '', previewUrl: '', cached: false },
];

const API_KEYS: Record<string, string | undefined> = {
  pixabay: process.env.PIXABAY_API_KEY,
  mixkit: process.env.MIXKIT_API_KEY,
  fma: process.env.FMA_API_KEY,
};

function ensureCacheDir(): void {
  if (!fs.existsSync(MUSIC_CACHE_DIR)) {
    fs.mkdirSync(MUSIC_CACHE_DIR, { recursive: true });
  }
}

function trackMatchesMood(track: MusicTrack, mood: string): boolean {
  const moodLower = mood.toLowerCase();
  return track.mood.toLowerCase() === moodLower
    || (moodLower === 'energetic' && track.tempo >= 120)
    || (moodLower === 'calm' && track.tempo < 100)
    || (moodLower === 'happy' && track.mood === 'happy')
    || (moodLower === 'sad' && (track.mood === 'calm' || track.mood === 'dark'))
    || (moodLower === 'dark' && track.mood === 'dark')
    || (moodLower === 'focus' && track.tempo >= 70 && track.tempo <= 100)
    || (moodLower === 'epic' && track.mood === 'epic')
    || (moodLower === 'mysterious' && track.mood === 'mysterious');
}

function applyFilters(tracks: MusicTrack[], params: MusicSearchParams): MusicTrack[] {
  let filtered = [...tracks];

  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  }

  if (params.genre) {
    const g = params.genre.toLowerCase();
    filtered = filtered.filter(t => t.genre.toLowerCase() === g);
  }

  if (params.mood) {
    filtered = filtered.filter(t => trackMatchesMood(t, params.mood!));
  }

  if (params.tempo?.min !== undefined) {
    filtered = filtered.filter(t => t.tempo >= params.tempo!.min!);
  }
  if (params.tempo?.max !== undefined) {
    filtered = filtered.filter(t => t.tempo <= params.tempo!.max!);
  }

  if (params.duration?.min !== undefined) {
    filtered = filtered.filter(t => t.duration >= params.duration!.min!);
  }
  if (params.duration?.max !== undefined) {
    filtered = filtered.filter(t => t.duration <= params.duration!.max!);
  }

  if (params.source) {
    filtered = filtered.filter(t => t.source === params.source);
  }

  return filtered;
}

async function fetchWithRetry(url: string, retries: number = MAX_RETRIES): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return response;
      }
    } catch (err) {
      logger.warn(`API fetch attempt ${attempt + 1}/${retries + 1} failed: ${(err as Error).message}`);
    }
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, API_DELAY_MS));
    }
  }
  return null;
}

export async function searchPixabay(query: string, page: number = 1, perPage: number = 20): Promise<MusicTrack[]> {
  const apiKey = API_KEYS.pixabay;
  if (!apiKey) {
    logger.warn('Pixabay API key not configured, returning mock data');
    return MOCK_TRACKS.filter(t => t.source === 'pixabay' && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
  }

  try {
    const url = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    const response = await fetchWithRetry(url);

    if (!response || !response.ok) {
      logger.warn('Pixabay API unavailable, falling back to mock data');
      return MOCK_TRACKS.filter(t => t.source === 'pixabay' && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
    }

    const data: any = await response.json();
    const hits: PixabayHit[] = data.hits || [];

    return hits.map((hit: PixabayHit) => ({
      id: `pixabay-${hit.id}`,
      title: hit.title || `Track ${hit.id}`,
      artist: 'Pixabay Artist',
      duration: hit.duration || 30,
      genre: extractGenreFromTags(hit.tags),
      mood: inferMoodFromTags(hit.tags),
      tempo: 120,
      source: 'pixabay' as const,
      url: hit.url || '',
      previewUrl: hit.preview_url || '',
      cached: false,
    }));
  } catch (error) {
    logger.error(`Pixabay search error: ${(error as Error).message}`);
    return MOCK_TRACKS.filter(t => t.source === 'pixabay');
  }
}

export async function searchMixkit(query: string, page: number = 1, perPage: number = 20): Promise<MusicTrack[]> {
  const apiKey = API_KEYS.mixkit;
  if (!apiKey) {
    logger.warn('Mixkit API key not configured, returning mock data');
    return MOCK_TRACKS.filter(t => t.source === 'mixkit' && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
  }

  try {
    const url = `https://api.mixkit.co/music?q=${encodeURIComponent(query)}&page=${page}&limit=${perPage}`;
    const response = await fetchWithRetry(url);

    if (!response || !response.ok) {
      logger.warn('Mixkit API unavailable, falling back to mock data');
      return MOCK_TRACKS.filter(t => t.source === 'mixkit' && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
    }

    const data: any = await response.json();
    const items: MixkitItem[] = data.data || [];

    return items.map((item: MixkitItem) => ({
      id: `mixkit-${item.id}`,
      title: item.title || `Track ${item.id}`,
      artist: 'Mixkit Artist',
      duration: item.duration || 30,
      genre: item.music_genres?.[0]?.name?.toLowerCase() || 'electronic',
      mood: 'energetic',
      tempo: 120,
      source: 'mixkit' as const,
      url: item.url || '',
      previewUrl: item.preview_url || '',
      cached: false,
    }));
  } catch (error) {
    logger.error(`Mixkit search error: ${(error as Error).message}`);
    return MOCK_TRACKS.filter(t => t.source === 'mixkit');
  }
}

export async function searchFMA(query: string, page: number = 1, limit: number = 20): Promise<MusicTrack[]> {
  const apiKey = API_KEYS.fma;
  if (!apiKey) {
    logger.warn('FMA API key not configured, returning mock data');
    return MOCK_TRACKS.filter(t => t.source === 'fma' && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
  }

  try {
    const url = `https://freemusicarchive.org/api/v1/tracks?api_key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    const response = await fetchWithRetry(url);

    if (!response || !response.ok) {
      logger.warn('FMA API unavailable, falling back to mock data');
      return MOCK_TRACKS.filter(t => t.source === 'fma' && (!query || t.title.toLowerCase().includes(query.toLowerCase())));
    }

    const data: any = await response.json();
    const records: FMARecord[] = data.data || [];

    return records.map((record: FMARecord) => ({
      id: `fma-${record.track_id}`,
      title: record.title || 'Unknown Track',
      artist: record.artist_name || 'FMA Artist',
      duration: record.duration || 30,
      genre: record.genre?.toLowerCase() || 'unknown',
      mood: 'calm',
      tempo: 100,
      source: 'fma' as const,
      url: record.url || '',
      previewUrl: '',
      cached: false,
    }));
  } catch (error) {
    logger.error(`FMA search error: ${(error as Error).message}`);
    return MOCK_TRACKS.filter(t => t.source === 'fma');
  }
}

function extractGenreFromTags(tags: string): string {
  const tagList = tags.split(',').map(t => t.trim().toLowerCase());
  const genreKeywords: Record<string, string[]> = {
    cinematic: ['cinematic', 'epic', 'orchestral', 'movie'],
    ambient: ['ambient', 'atmospheric', 'drone', 'space'],
    electronic: ['electronic', 'edm', 'techno', 'house', 'dubstep'],
    pop: ['pop', 'vocal', 'song'],
    rock: ['rock', 'guitar', 'band'],
    classical: ['classical', 'piano', 'violin', 'strings'],
    jazz: ['jazz', 'blues', 'swing'],
    hiphop: ['hip hop', 'rap', 'beat'],
    folk: ['folk', 'acoustic', 'ukulele'],
    lofi: ['lo-fi', 'lofi', 'chill', 'study'],
  };

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(k => tagList.includes(k))) {
      return genre;
    }
  }

  return 'electronic';
}

function inferMoodFromTags(tags: string): string {
  const tagList = tags.split(',').map(t => t.trim().toLowerCase());
  const moodKeywords: Record<string, string[]> = {
    energetic: ['energetic', 'upbeat', 'happy', 'exciting', 'fast', 'powerful'],
    calm: ['calm', 'relaxing', 'peaceful', 'soft', 'gentle', 'slow'],
    dark: ['dark', 'mysterious', 'tense', 'suspense', 'ominous', 'brooding'],
    happy: ['happy', 'cheerful', 'fun', 'joyful', 'bright', 'playful'],
    sad: ['sad', 'emotional', 'melancholic', 'somber', 'touching'],
    epic: ['epic', 'majestic', 'grand', 'heroic', 'triumphant'],
    focus: ['focus', 'study', 'concentration', 'ambient'],
    romantic: ['romantic', 'love', 'tender', 'sweet'],
  };

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(k => tagList.includes(k))) {
      return mood;
    }
  }

  return 'calm';
}

export async function searchMusic(params: MusicSearchParams): Promise<MusicTrack[]> {
  logger.info(`Searching music: query=${params.query || 'all'} genre=${params.genre || 'any'} mood=${params.mood || 'any'}`);

  const sources = params.source ? [params.source] : ['pixabay', 'mixkit', 'fma'] as Array<'pixabay' | 'mixkit' | 'fma'>;
  const allTracks: MusicTrack[] = [];

  const searchPromises = sources.map(async (source) => {
    try {
      let tracks: MusicTrack[];
      const query = params.query || '';
      switch (source) {
        case 'pixabay':
          tracks = await searchPixabay(query, params.page, params.limit || 20);
          break;
        case 'mixkit':
          tracks = await searchMixkit(query, params.page, params.limit || 20);
          break;
        case 'fma':
          tracks = await searchFMA(query, params.page, params.limit || 20);
          break;
      }
      return tracks;
    } catch (error) {
      logger.error(`Search ${source} failed: ${(error as Error).message}`);
      return MOCK_TRACKS.filter(t => t.source === source);
    }
  });

  const results = await Promise.all(searchPromises);
  results.forEach(tracks => allTracks.push(...tracks));

  let filtered = applyFilters(allTracks, params);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const start = (page - 1) * limit;
  filtered = filtered.slice(start, start + limit);

  return filtered;
}

export async function getTrendingMusic(limit: number = 10): Promise<MusicTrack[]> {
  logger.info('Getting trending music');

  const all = await searchMusic({ limit: 50 });
  const trending = all.sort((a, b) => b.tempo - a.tempo).slice(0, limit);

  return trending;
}

export async function getMusicByMood(mood: string, limit: number = 20): Promise<MusicTrack[]> {
  logger.info(`Getting music by mood: ${mood}`);

  const all = await searchMusic({ mood, limit: 50 });
  return all.slice(0, limit);
}

export async function getMusicByGenre(genre: string, limit: number = 20): Promise<MusicTrack[]> {
  logger.info(`Getting music by genre: ${genre}`);

  const all = await searchMusic({ genre, limit: 50 });
  return all.slice(0, limit);
}

export async function downloadMusic(trackId: string): Promise<MusicTrack | null> {
  logger.info(`Downloading music: ${trackId}`);

  ensureCacheDir();

  const mockTrack = MOCK_TRACKS.find(t => t.id === trackId);
  if (mockTrack) {
    const cachedPath = path.join(MUSIC_CACHE_DIR, `${mockTrack.id}.mp3`);

    if (fs.existsSync(cachedPath)) {
      return { ...mockTrack, cached: true };
    }

    const silentAudioPath = path.join(MUSIC_CACHE_DIR, `${mockTrack.id}.mp3`);
    const ffmpeg = require('fluent-ffmpeg');

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input('anullsrc')
        .inputOptions(['-f lavfi'])
        .duration(mockTrack.duration)
        .audioCodec('libmp3lame')
        .output(silentAudioPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });

    return { ...mockTrack, cached: true };
  }

  const [pixabay, mixkit, fma] = await Promise.all([
    searchPixabay('', 1, 50),
    searchMixkit('', 1, 50),
    searchFMA('', 1, 50),
  ]);

  const allTracks = [...pixabay, ...mixkit, ...fma];
  const track = allTracks.find(t => t.id === trackId);

  if (!track) {
    logger.warn(`Track not found: ${trackId}`);
    return null;
  }

  if (!track.url) {
    logger.warn(`Track ${trackId} has no download URL`);
    return track;
  }

  try {
    const response = await fetch(track.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(MUSIC_CACHE_DIR, `${trackId}.mp3`);
    fs.writeFileSync(filePath, buffer);

    return { ...track, cached: true };
  } catch (error) {
    logger.error(`Download failed for ${trackId}: ${(error as Error).message}`);
    return track;
  }
}

export function getLocalMusicLibrary(): MusicTrack[] {
  ensureCacheDir();

  const cached: MusicTrack[] = [];

  try {
    const files = fs.readdirSync(MUSIC_CACHE_DIR);
    for (const file of files) {
      if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.aac')) {
        const id = path.basename(file, path.extname(file));
        const filePath = path.join(MUSIC_CACHE_DIR, file);
        const stat = fs.statSync(filePath);

        const mockMatch = MOCK_TRACKS.find(t => t.id === id);
        if (mockMatch) {
          cached.push({ ...mockMatch, cached: true });
        } else {
          cached.push({
            id,
            title: id,
            artist: 'Unknown',
            duration: Math.round(stat.size / 16000),
            genre: 'unknown',
            mood: 'calm',
            tempo: 100,
            source: 'pixabay',
            url: '',
            previewUrl: '',
            cached: true,
          });
        }
      }
    }
  } catch (error) {
    logger.error(`Error reading music library: ${(error as Error).message}`);
  }

  return cached;
}

export function getMusicCacheDir(): string {
  return MUSIC_CACHE_DIR;
}
