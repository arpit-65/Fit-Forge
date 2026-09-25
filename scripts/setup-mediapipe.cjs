const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.resolve(__dirname, '..');
const wasmSrcDir = path.join(rootDir, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const publicMediaPipeDir = path.join(rootDir, 'public', 'mediapipe');
const publicWasmDir = path.join(publicMediaPipeDir, 'wasm');
const publicModelsDir = path.join(publicMediaPipeDir, 'models');
const modelDestPath = path.join(publicModelsDir, 'pose_landmarker_lite.task');

// Ensure directories exist
fs.mkdirSync(publicWasmDir, { recursive: true });
fs.mkdirSync(publicModelsDir, { recursive: true });

// 1. Copy wasm files
console.log('Copying wasm binaries from @mediapipe/tasks-vision...');
if (fs.existsSync(wasmSrcDir)) {
  const files = fs.readdirSync(wasmSrcDir);
  for (const file of files) {
    const srcFile = path.join(wasmSrcDir, file);
    const destFile = path.join(publicWasmDir, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} to public/mediapipe/wasm/`);
  }
} else {
  console.error(`Source wasm directory not found: ${wasmSrcDir}`);
}

// 2. Download pose_landmarker_lite.task if not present
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

function downloadModel(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
    console.log(`Model already exists at ${dest} (${fs.statSync(dest).size} bytes). Skipping download.`);
    return Promise.resolve();
  }

  console.log(`Downloading pose_landmarker_lite.task from ${url}...`);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadModel(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download model: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Model saved to ${dest} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

downloadModel(MODEL_URL, modelDestPath)
  .then(() => {
    console.log('MediaPipe assets successfully setup in /public/mediapipe!');
  })
  .catch((err) => {
    console.error('Error setting up MediaPipe model:', err);
    process.exit(1);
  });
