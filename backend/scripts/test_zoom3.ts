import { execFile } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'test_output');
const inputPath = path.join(testDir, 'input_test.mp4');
const outputPath = path.join(testDir, 'zoom_single.mp4');

if (!fs.existsSync(inputPath)) {
  console.error('Input not found:', inputPath);
  process.exit(1);
}

console.log('Input exists:', inputPath);

// Test 1: single zoompan without quotes
const p = execFile(ffmpegStatic!, [
  '-i', inputPath,
  '-vf', "zoompan=z=1:x=0:y=0:d=150:s=640x360:fps=30",
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
  '-c:a', 'copy',
  outputPath,
  '-y'
], { timeout: 30000 });

let stderr = '';
p.stderr!.on('data', d => { stderr += d; });
p.on('close', (code) => {
  console.log('\nTest 1 - Single zoompan: Exit code', code);
  const lines = stderr.split('\n').filter(l => l.includes('time=') || l.includes('Error') || l.includes('frame=')).slice(-5);
  console.log(lines.join('\n'));
});
p.on('error', (err) => console.error('Error:', err.message));
