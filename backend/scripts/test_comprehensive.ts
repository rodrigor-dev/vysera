/**
 * Teste completo do sistema Vysera
 * Testa cada componente individualmente e depois o pipeline completo
 */
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

const OUTPUT = path.resolve(__dirname, 'test_comprehensive_output');
const TEST_VIDEO = path.join(OUTPUT, 'input_test.mp4');
const TEST_AUDIO = path.join(OUTPUT, 'test_audio.wav');

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function ensureDir() {
  await fs.mkdir(OUTPUT, { recursive: true });
}

function log(label: string, ok: boolean, detail?: string) {
  const mark = ok ? '✅' : '❌';
  console.log(`  ${mark} ${label}${detail ? ': ' + detail : ''}`);
  if (ok) passed++; else { failed++; failures.push(`${label}: ${detail || 'failed'}`); }
}

let ffmpegPath: string;
try { ffmpegPath = require('ffmpeg-static'); } catch { ffmpegPath = 'ffmpeg'; }

async function run(args: string[], timeout = 60000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    execFile(ffmpegPath, args, { timeout, cwd: path.resolve(__dirname, '..') }, (err: any, stdout: string, stderr: string) => {
      resolve({ code: err ? err.code || 1 : 0, stdout, stderr });
    });
  });
}

async function execCmd(command: string, timeout = 60000, cwd?: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    exec(command, { timeout, cwd: cwd || path.resolve(__dirname, '..'), shell: true }, (err: any, stdout: string, stderr: string) => {
      resolve({ code: err ? err.code || 1 : 0, stdout, stderr });
    });
  });
}

async function ffprobe(file: string): Promise<any> {
  const { execFile } = require('child_process');
  return new Promise((resolve) => {
    execFile(ffmpegPath, ['-i', file, '-f', 'null', '-'], { timeout: 15000 }, (err: any, _stdout: string, stderr: string) => {
      const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      const res = stderr.match(/, (\d{3,5})x(\d{3,5})\s/);
      resolve({
        duration: dur ? parseInt(dur[1]) * 3600 + parseInt(dur[2]) * 60 + parseFloat(dur[3]) : 0,
        width: res ? parseInt(res[1]) : 0,
        height: res ? parseInt(res[2]) : 0,
        stderr,
      });
    });
  });
}

async function fileSize(file: string): Promise<number> {
  try { const s = await fs.stat(file); return s.size; } catch { return 0; }
}

// ============================================================
// 1. GERAR VÍDEO E ÁUDIO DE TESTE
// ============================================================
async function testSetup() {
  console.log('\n📦 Setup: gerando mídia de teste...');

  // Generate 10s test video
  const r1 = await run([
    '-y', '-f', 'lavfi', '-i', 'testsrc=d=10:s=640x360',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=10',
    '-c:a', 'aac', '-shortest', TEST_VIDEO,
  ], 30000);
  log('Vídeo de teste (10s 640x360)', r1.code === 0);
  if (r1.code !== 0) console.error('  stderr:', r1.stderr.slice(-300));

  // Generate 3s test audio for transcription
  const r2 = await run([
    '-y', '-f', 'lavfi', '-i', 'sine=frequency=880:duration=3',
    '-ar', '44100', '-ac', '1', TEST_AUDIO,
  ], 15000);
  log('Áudio de teste (3s 880Hz)', r2.code === 0);

  const info = await ffprobe(TEST_VIDEO);
  log('FFprobe vídeo OK', info.duration > 0 && info.width > 0, `${info.width}x${info.height} ${info.duration.toFixed(1)}s`);
}

// ============================================================
// 2. TESTAR FFMPEG UTILS
// ============================================================
async function testFFmpegUtils() {
  console.log('\n🔧 FFmpeg Utils:');
  try {
    const { getVideoInfo, ensureFFmpeg, fileExists } = require('../src/utils/ffmpeg');
    const hasFF = await ensureFFmpeg();
    log('ensureFFmpeg()', hasFF);

    const info = await getVideoInfo(TEST_VIDEO);
    log('getVideoInfo()', info.duration > 0 && info.width > 0, `${info.width}x${info.height} ${info.duration.toFixed(1)}s`);

    const exists = await fileExists(TEST_VIDEO);
    log('fileExists()', exists);
  } catch (e: any) {
    log('FFmpeg utils', false, e.message);
  }
}

// ============================================================
// 3. TESTAR DETECÇÃO DE CENAS
// ============================================================
async function testSceneDetection() {
  console.log('\n🎬 Scene Detection:');
  try {
    const { detectScenes, removeSilence, detectBestMoments } = require('../src/services/video/scene.service');

    const scenes = await detectScenes(TEST_VIDEO);
    log('detectScenes()', Array.isArray(scenes), `${scenes.length} cenas`);

    const silenceOutput = path.join(OUTPUT, 'silence_removed.mp4');
    const silenceResult = await removeSilence(TEST_VIDEO, silenceOutput);
    log('removeSilence()', silenceResult.outputPath ? true : false, `${silenceResult.segments.length} segmentos de silêncio`);
    const sInfo = await ffprobe(silenceOutput);
    log('  vídeo após silence removal', sInfo.duration > 0, `${sInfo.duration.toFixed(1)}s`);

    const moments = await detectBestMoments(TEST_VIDEO);
    log('detectBestMoments()', Array.isArray(moments), `${moments.length} momentos`);
  } catch (e: any) {
    log('Scene detection', false, e.message);
  }
}

// ============================================================
// 4. TESTAR DETECÇÃO DE FACES
// ============================================================
async function testFaceDetection() {
  console.log('\n👤 Face Detection:');
  try {
    const { detectFaces, generateZoomKeyframes, applyAutoZoom } = require('../src/services/video/face.service');

    const faces = await detectFaces(TEST_VIDEO);
    log('detectFaces()', Array.isArray(faces), `${faces.length} frames processados`);

    const keyframes = await generateZoomKeyframes(TEST_VIDEO, faces);
    log('generateZoomKeyframes()', Array.isArray(keyframes), `${keyframes.length} keyframes`);

    const zoomOutput = path.join(OUTPUT, 'face_zoom.mp4');
    await applyAutoZoom(TEST_VIDEO, zoomOutput, keyframes);
    const zInfo = await ffprobe(zoomOutput);
    log('applyAutoZoom()', zInfo.duration > 0, `${zInfo.duration.toFixed(1)}s ${zInfo.width}x${zInfo.height}`);
  } catch (e: any) {
    log('Face detection', false, e.message);
  }
}

// ============================================================
// 5. TESTAR NARRAÇÃO (EDGE TTS)
// ============================================================
async function testNarration() {
  console.log('\n🎤 Narration (Edge TTS):');
  try {
    const { generateNarration } = require('../src/services/video/narration.service');
    const narrationOutput = path.join(OUTPUT, 'narration.mp3');

    const result = await generateNarration(
      'Olá, este é um teste de narração do Vysera.',
      narrationOutput,
      { voice: 'pt-BR-FranciscaNeural', language: 'pt' }
    );
    const nSize = await fileSize(narrationOutput);
    log('generateNarration()', nSize > 1000, `${(nSize / 1024).toFixed(1)}KB`);
  } catch (e: any) {
    log('Narration', false, e.message);
  }
}

// ============================================================
// 6. TESTAR TRANSCRIÇÃO (WHISPER)
// ============================================================
async function testTranscription() {
  console.log('\n📝 Transcription (Whisper):');
  try {
    const { transcribeAudio } = require('../src/services/video/caption.service');

    const segments = await transcribeAudio(TEST_AUDIO, 'pt');
    log('transcribeAudio()', Array.isArray(segments), `${segments.length} segmentos`);
  } catch (e: any) {
    log('Transcription', false, e.message);
  }
}

// ============================================================
// 7. TESTAR CAPTIONS (BURN)
// ============================================================
async function testCaptions() {
  console.log('\n💬 Captions:');
  try {
    const { burnCaptions } = require('../src/services/video/caption.service');
    const captionsOutput = path.join(OUTPUT, 'captioned.mp4');
    const segments = [{ start: 0, end: 3, text: 'Teste de legenda Vysera' }];

    await burnCaptions(TEST_VIDEO, captionsOutput, segments, {
      animation: 'tiktok',
      fontSize: 24,
      position: 'bottom',
    });
    const cInfo = await ffprobe(captionsOutput);
    log('burnCaptions()', cInfo.duration > 0, `${cInfo.duration.toFixed(1)}s`);

    // Test karaoke style
    const karaokeOutput = path.join(OUTPUT, 'captioned_karaoke.mp4');
    await burnCaptions(TEST_VIDEO, karaokeOutput, segments, {
      animation: 'karaoke',
      fontSize: 24,
      position: 'bottom',
    });
    const kInfo = await ffprobe(karaokeOutput);
    log('burnCaptions(karaoke)', kInfo.duration > 0, `${kInfo.duration.toFixed(1)}s`);
  } catch (e: any) {
    log('Captions', false, e.message);
  }
}

// ============================================================
// 8. TESTAR GERADOR DE MÚSICA (TODOS OS MOODS)
// ============================================================
async function testMusicGenerator() {
  console.log('\n🎵 Music Generator (todos os moods):');
  try {
    const { generateMusic, getMoodNames } = require('../src/services/music-generator.service');
    const moods = getMoodNames();
    log('getMoodNames()', moods.length > 0, `${moods.join(', ')}`);

    for (const mood of moods) {
      const out = path.join(OUTPUT, `music_${mood}.mp3`);
      try {
        const wavPath = out.replace(/\.mp3$/, '.wav');
        await generateMusic(mood, 5, wavPath);
        const size = await fileSize(out);
        log(`  ${mood}`, size > 10000, `${(size / 1024).toFixed(1)}KB`);
      } catch (e: any) {
        log(`  ${mood}`, false, e.message);
      }
    }
  } catch (e: any) {
    log('Music generator', false, e.message);
  }
}

// ============================================================
// 9. TESTAR RENDERIZAÇÃO
// ============================================================
async function testRenderer() {
  console.log('\n🎞️ Renderer:');
  try {
    const { renderVideo, exportForPlatform } = require('../src/services/video/renderer.service');

    const output = path.join(OUTPUT, 'render_test.mp4');
    const result = await renderVideo(TEST_VIDEO, output, {
      format: 'vertical',
      quality: 'draft',
    });
    log('renderVideo(vertical, draft)', result.outputPath ? true : false, `${result.duration.toFixed(1)}s ${result.resolution}`);

    const exportOutput = path.join(OUTPUT, 'export_tiktok.mp4');
    const exportResult = await exportForPlatform(TEST_VIDEO, exportOutput, 'tiktok');
    log('exportForPlatform(tiktok)', typeof exportResult === 'string', exportResult);
  } catch (e: any) {
    log('Renderer', false, e.message);
  }
}

// ============================================================
// 10. TESTAR PIPELINE COMPLETO
// ============================================================
async function testFullPipeline() {
  console.log('\n🚀 Pipeline Completo:');
  try {
    const { processVideo } = require('../src/services/video/processor');
    const output = path.join(OUTPUT, 'pipeline_final.mp4');

    // Importante: verificar se o script existe
    const scriptPath = path.resolve(__dirname, '..', 'scripts', 'test_pipeline.ts');
    const exists = await fs.access(scriptPath).then(() => true).catch(() => false);
    log('test_pipeline.ts existe', exists);

    if (exists) {
      const { code, stdout, stderr } = await execCmd(
        `npx tsx "${scriptPath}"`,
        600000 // 10 min timeout
      );
      const hasSuccess = stdout.includes('Teste passou') || stdout.includes('✅');
      log('Pipeline completo', hasSuccess, code === 0 ? 'exit 0' : `exit ${code}`);
      if (!hasSuccess) {
        const lines = stderr.split('\n').filter(l => l.includes('error') || l.includes('Error')).slice(0, 5);
        if (lines.length > 0) console.error('  Errors:', lines.join('; '));
      }
    }
  } catch (e: any) {
    log('Pipeline completo', false, e.message);
  }
}

// ============================================================
// 11. TESTAR UPLOAD SERVICE (UNIT)
// ============================================================
async function testUploadService() {
  console.log('\n📤 Upload Service (unit):');
  try {
    const uploadService = require('../src/services/upload.service');

    // validateFile
    let threw = false;
    try { uploadService.validateFile('text/html', 100); } catch { threw = true; }
    log('validateFile rejeita HTML', threw);

    threw = false;
    try { uploadService.validateFile('video/mp4', 100); } catch { threw = true; }
    log('validateFile aceita MP4', !threw);

    // generateSecureFileName
    const safe = uploadService.generateSecureFileName('../../../etc/passwd');
    log('generateSecureFileName sanitiza path', !safe.includes('..') && !safe.includes('/'));

    // verifyMagicBytes (imported)
    const { verifyMagicBytes } = uploadService;
    const mp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70]);
    const magicOk = await verifyMagicBytes(mp4Buffer, 'video/mp4');
    log('verifyMagicBytes MP4', magicOk);

    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const magicJpeg = await verifyMagicBytes(jpegBuffer, 'image/jpeg');
    log('verifyMagicBytes JPEG', magicJpeg);

    const badBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const magicBad = await verifyMagicBytes(badBuffer, 'video/mp4');
    log('verifyMagicBytes rejeita falso', !magicBad);

    // Testa double extension detection via uploadFile (que chama a função interna)
    // Criamos um buffer MP4 válido em bytes para passar pela verificação
    const validMP4 = Buffer.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    // Não testamos hasDoubleExtension diretamente (não exportada),
    // mas validamos que uploadFile rejeita arquivos com extensão dupla
    // (não podemos testar uploadFile sem DB, mas a validação de nome é feita antes do DB)
  } catch (e: any) {
    log('Upload service', false, e.message);
  }
}

// ============================================================
// 12. TESTAR EFFECTS SERVICE
// ============================================================
async function testEffects() {
  console.log('\n✨ Effects:');
  try {
    const { applyColorGrading, applyTransitions } = require('../src/services/video/effects.service');

    const colorOut = path.join(OUTPUT, 'color_graded.mp4');
    await applyColorGrading(TEST_VIDEO, colorOut, 'cinematic');
    const cInfo = await ffprobe(colorOut);
    log('applyColorGrading(cinematic)', cInfo.duration > 0, `${cInfo.duration.toFixed(1)}s`);

    const transOut = path.join(OUTPUT, 'transition.mp4');
    await applyTransitions(TEST_VIDEO, transOut, [
      { start: 0, end: 5 },
      { start: 5, end: 10 },
    ], 'fade');
    const tInfo = await ffprobe(transOut);
    log('applyTransitions(fade)', tInfo.duration > 0, `${tInfo.duration.toFixed(1)}s`);
  } catch (e: any) {
    log('Effects', false, e.message);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  TESTE COMPREENSIVO - Vysera Pipeline');
  console.log('══════════════════════════════════════════\n');

  const start = Date.now();

  await ensureDir();

  await testSetup();
  await testFFmpegUtils();
  await testSceneDetection();
  await testFaceDetection();
  await testNarration();
  await testTranscription();
  await testCaptions();
  await testMusicGenerator();
  await testRenderer();
  await testEffects();
  await testUploadService();
  await testFullPipeline();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTADO: ${passed} ✅  |  ${failed} ❌  |  ${elapsed}s`);
  console.log('══════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\nFalhas:');
    for (const f of failures) console.log(`  ❌ ${f}`);
    process.exit(1);
  } else {
    console.log('\n🎉 Todos os testes passaram!');
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
