import { execFile } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';

const testDir = path.resolve(import.meta.dirname, 'test_output');
const inputPath = path.join(testDir, 'input_test.mp4');
const outputPath = path.join(testDir, 'zoom_test.mp4');

console.log('Testing zoompan on existing video:', inputPath);

const p = execFile(ffmpegStatic!, [
  '-i', inputPath,
  '-vf', "zoompan=z='1':x='0':y='0':d=150:s=640x360:fps=30",
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
  '-c:a', 'copy',
  outputPath,
  '-y'
], { timeout: 30000 });

let stderr = '';
p.stderr!.on('data', d => stderr += d);
p.on('close', (code) => {
  console.log('Exit code:', code);
  const lines = stderr.split('\n').slice(-10);
  console.log('Last stderr lines:', lines.join('\n'));
});
p.on('error', (err) => console.error('Error:', err.message));
