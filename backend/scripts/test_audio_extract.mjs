import ffmpeg from 'fluent-ffmpeg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const p = require('ffmpeg-static');
ffmpeg.setFfmpegPath(p);

const input = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output\\input_test.mp4';
const output = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output\\test_audio.wav';

ffmpeg(input)
  .audioCodec('pcm_s16le')
  .outputOptions('-vn')
  .save(output)
  .on('start', cmd => console.log('CMD:', cmd))
  .on('error', e => { console.error('ERR:', e.message); process.exit(1); })
  .on('end', () => { console.log('OK, size:', require('fs').statSync(output).size); process.exit(0); })
  .run();
