import { execFile } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'test_output');
const inputPath = path.join(testDir, 'input_test.mp4');
const outputPath = path.join(testDir, 'zoom_test2.mp4');

console.log('FFmpeg:', ffmpegStatic);
console.log('Input:', inputPath);

const filter = "zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30,zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30,zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30,zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30,zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30,zoompan=z=1:x=0:y=0:d=60:s=640x360:fps=30";

const args = [
  '-i', inputPath,
  '-vf', filter,
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
  outputPath,
  '-y'
];
console.log('Args:', args.join(' '));

const p = execFile(ffmpegStatic!, args, { timeout: 30000 });

let stderr = '';
p.stderr!.on('data', d => { stderr += d; });
p.on('close', (code) => {
  console.log('Exit code:', code);
  const lines = stderr.split('\n').slice(-20);
  console.log('Last stderr:', lines.join('\n'));
});
p.on('error', (err) => console.error('Error:', err.message));
