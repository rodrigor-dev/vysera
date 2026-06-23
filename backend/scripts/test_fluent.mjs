import ffmpeg from 'fluent-ffmpeg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const p = require('ffmpeg-static');
ffmpeg.setFfmpegPath(p);

const input = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output\\input_test.mp4';
const output = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output\\_test_ff.mp4';

ffmpeg(input)
  .videoFilter("select='gt(scene,0.4)',showinfo")
  .outputOptions(['-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '51'])
  .output(output)
  .on('start', cmd => console.log('CMD:', cmd))
  .on('error', e => console.error('ERR:', e.message))
  .on('end', () => console.log('OK'))
  .run();
