import { execFile } from 'child_process';
import { createRequire } from 'module';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const p = require('ffmpeg-static');
ffmpeg.setFfmpegPath(p);

const testDir = 'C:\\Users\\rodri\\OneDrive\\Documentos\\Vysera open code\\vysera\\backend\\scripts\\test_output';
const framePath = path.join(testDir, 'test_frame.jpg');
const videoPath = path.join(testDir, 'input_test.mp4');

// Extract a single frame
await new Promise((resolve, reject) => {
  ffmpeg(videoPath)
    .seekInput(0)
    .frames(1)
    .outputOptions('-q:v', '2')
    .save(framePath)
    .on('end', resolve)
    .on('error', reject)
    .run();
});

console.log('Frame extracted:', fs.statSync(framePath).size, 'bytes');

// Run face detection
const start = Date.now();
execFile('python', ['scripts/detect_faces.py', framePath], { timeout: 30000 }, (err, stdout) => {
  const elapsed = Date.now() - start;
  if (err) {
    console.error('Face detection error after', elapsed, 'ms:', err.message);
    return;
  }
  console.log('Face detection result after', elapsed, 'ms:', stdout);
});
