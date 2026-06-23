import { execFileSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const input = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output\\input_test.mp4';
const output = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output\\_test_out.mp4';

try {
  const out = execFileSync(ffmpegPath, [
    '-i', input,
    '-vf', "select='gt(scene,0.4)',showinfo",
    '-an',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '51',
    '-y',
    output
  ], { timeout: 15000, encoding: 'utf8' });
  console.log('OK');
} catch(e) {
  console.error('Error:', e.stderr?.slice(0, 1000) || e.message);
}
