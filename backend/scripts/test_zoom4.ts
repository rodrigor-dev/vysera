import { execFile, spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const testDir = path.join(__dirname, 'test_output');
  const inputPath = path.join(testDir, 'input_test.mp4');
  const output1 = path.join(testDir, 'test_zoompan_1.mp4');
  const output2 = path.join(testDir, 'test_zoompan_2.mp4');

  // Generate test input
  console.log('Generating test input...');
  await new Promise<void>((resolve, reject) => {
    const p = spawn(ffmpegStatic!, [
      '-f', 'lavfi', '-i', 'testsrc=duration=5:size=640x360:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
      '-c:a', 'aac',
      inputPath, '-y'
    ]);
    p.stderr.on('data', () => {});
    p.on('close', (code) => { console.log('Input generated, code:', code); resolve(); });
    p.on('error', reject);
  });

  // Test 1: single zoompan with '1' style quotes
  console.log('\nTest 1: zoompan with quotes...');
  await new Promise<void>((resolve) => {
    const p = spawn(ffmpegStatic!, [
      '-i', inputPath,
      '-vf', "zoompan=z='1':x='0':y='0':d=150:s=640x360:fps=30",
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'copy',
      output1, '-y'
    ], { timeout: 15000 });
    let stderr = '';
    p.stderr.on('data', d => { stderr += d; });
    p.on('close', (code) => {
      console.log('Exit code:', code);
      const lines = stderr.split('\n').filter(l => l.includes('time=') || l.includes('Error')).slice(-3);
      console.log(lines.join('\n'));
      resolve();
    });
    p.on('error', (e) => { console.log('Error:', e.message); resolve(); });
  });

  // Test 2: chain of zoompan filters (like the app uses)
  console.log('\nTest 2: chained zoompans (like app)...');
  const filter = "zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30," +
    "zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30," +
    "zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30," +
    "zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30," +
    "zoompan=z=1:x=0:y=0:d=30:s=640x360:fps=30," +
    "zoompan=z=1:x=0:y=0:d=60:s=640x360:fps=30";

  await new Promise<void>((resolve) => {
    const p = spawn(ffmpegStatic!, [
      '-i', inputPath,
      '-vf', filter,
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'copy',
      output2, '-y'
    ], { timeout: 15000 });
    let stderr = '';
    p.stderr.on('data', d => { stderr += d; });
    p.on('close', (code) => {
      console.log('Exit code:', code);
      const lines = stderr.split('\n').filter(l => l.includes('time=') || l.includes('Error')).slice(-3);
      console.log(lines.join('\n'));
      resolve();
    });
    p.on('error', (e) => { console.log('Error:', e.message); resolve(); });
  });

  console.log('\nDone');
}

main();
