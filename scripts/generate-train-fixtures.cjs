const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(__dirname, '..', 'src', 'lib', 'train', '__tests__', 'fixtures');
fs.mkdirSync(fixturesDir, { recursive: true });

// 1. Clean Deep Squat Fixture (~35 frames, 1200ms)
function generateCleanSquat() {
  const frames = [];
  const totalFrames = 36;
  const fps = 30;

  for (let i = 0; i < totalFrames; i++) {
    const timestampMs = Math.round((i / fps) * 1000);
    // Phase progression 0 -> 1 -> 0
    let progress = 0;
    if (i < 15) {
      progress = i / 15; // descending
    } else if (i < 20) {
      progress = 1.0; // bottom hold (5 frames)
    } else {
      progress = Math.max(0, 1.0 - (i - 19) / 15); // ascending
    }

    // Knee angle: 180° standing -> 90° deep squat
    // Hip moves back and down
    const hipX = 0.5 - progress * 0.16;
    const hipY = 0.4 + progress * 0.32;
    const kneeX = 0.5;
    const kneeY = 0.72;
    const ankleX = 0.5;
    const ankleY = 1.0;

    // Upright torso: shoulder stays above hip with modest ~25° lean
    const shoulderX = hipX + 0.05;
    const shoulderY = hipY - 0.35;

    // Front view knees/ankles separation (ratio ~ 1.0, no cave)
    const leftKnee = { x: kneeX - 0.1, y: kneeY, z: 0, visibility: 0.95 };
    const rightKnee = { x: kneeX + 0.1, y: kneeY, z: 0, visibility: 0.95 };
    const leftAnkle = { x: ankleX - 0.1, y: ankleY, z: 0, visibility: 0.95 };
    const rightAnkle = { x: ankleX + 0.1, y: ankleY, z: 0, visibility: 0.95 };

    frames.push({
      frameIndex: i,
      timestampMs,
      landmarks: {
        11: { x: shoulderX, y: shoulderY, z: 0, visibility: 0.95 },
        12: { x: shoulderX + 0.1, y: shoulderY, z: 0, visibility: 0.95 },
        23: { x: hipX, y: hipY, z: 0, visibility: 0.95 },
        24: { x: hipX + 0.1, y: hipY, z: 0, visibility: 0.95 },
        25: leftKnee,
        26: rightKnee,
        27: leftAnkle,
        28: rightAnkle,
      },
    });
  }
  return frames;
}

// 2. Shallow Squat Fixture (inflection stops at ~115°)
function generateShallowSquat() {
  const frames = [];
  const totalFrames = 30;
  const fps = 30;

  for (let i = 0; i < totalFrames; i++) {
    const timestampMs = Math.round((i / fps) * 1000);
    let progress = 0;
    if (i < 12) {
      progress = (i / 12) * 0.55; // only halfway down
    } else if (i < 16) {
      progress = 0.55; // shallow bottom
    } else {
      progress = Math.max(0, 0.55 - ((i - 15) / 12) * 0.55);
    }

    const hipX = 0.5 - progress * 0.16;
    const hipY = 0.4 + progress * 0.32;

    frames.push({
      frameIndex: i,
      timestampMs,
      landmarks: {
        11: { x: hipX + 0.05, y: hipY - 0.35, z: 0, visibility: 0.95 },
        23: { x: hipX, y: hipY, z: 0, visibility: 0.95 },
        25: { x: 0.5, y: 0.72, z: 0, visibility: 0.95 },
        27: { x: 0.5, y: 1.0, z: 0, visibility: 0.95 },
      },
    });
  }
  return frames;
}

// 3. Sagging Push-up Fixture
function generateSaggingPushup() {
  const frames = [];
  const totalFrames = 36;
  const fps = 30;

  for (let i = 0; i < totalFrames; i++) {
    const timestampMs = Math.round((i / fps) * 1000);
    let progress = 0;
    if (i < 15) {
      progress = i / 15;
    } else if (i < 20) {
      progress = 1.0; // bottom hold
    } else {
      progress = Math.max(0, 1.0 - (i - 19) / 15);
    }

    // Chest / shoulder lowers
    const shoulderY = 0.35 + progress * 0.25; // 0.35 -> 0.60
    const elbowY = shoulderY - 0.05;
    const elbowX = 0.30;
    const wristX = 0.22;
    const wristY = 0.68;
    const ankleX = 0.85;
    const ankleY = 0.68;

    // Hip sags downward excessively (hipY > line connecting shoulder & ankle)
    // When progress is high, hip sags down to 0.70 instead of staying near 0.64
    const straightHipY = (shoulderY + ankleY) / 2;
    const hipY = straightHipY + progress * 0.12; // sagging offset

    frames.push({
      frameIndex: i,
      timestampMs,
      landmarks: {
        11: { x: 0.22, y: shoulderY, z: 0, visibility: 0.95 },
        13: { x: elbowX, y: elbowY, z: 0, visibility: 0.95 },
        15: { x: wristX, y: wristY, z: 0, visibility: 0.95 },
        23: { x: 0.55, y: hipY, z: 0, visibility: 0.95 },
        27: { x: ankleX, y: ankleY, z: 0, visibility: 0.95 },
      },
    });
  }
  return frames;
}

// 4. Jitter and Missing Landmarks Fixture
function generateJitterMissing() {
  const frames = [];
  const totalFrames = 30;

  for (let i = 0; i < totalFrames; i++) {
    const timestampMs = i * 33;
    // Add jitter
    const jitter = (Math.random() - 0.5) * 0.05;
    const isMissing = i % 5 === 0;

    frames.push({
      frameIndex: i,
      timestampMs,
      landmarks: {
        11: isMissing ? { x: 0.5, y: 0.2, visibility: 0.2 } : { x: 0.5 + jitter, y: 0.2 + jitter, visibility: 0.9 },
        23: { x: 0.5, y: 0.5, visibility: 0.95 },
        25: { x: 0.5, y: 0.75, visibility: 0.95 },
        27: isMissing ? { x: 0.5, y: 1.0, visibility: 0.1 } : { x: 0.5 + jitter, y: 1.0, visibility: 0.95 },
      },
    });
  }
  return frames;
}

fs.writeFileSync(path.join(fixturesDir, 'clean-squat.json'), JSON.stringify(generateCleanSquat(), null, 2));
fs.writeFileSync(path.join(fixturesDir, 'shallow-squat.json'), JSON.stringify(generateShallowSquat(), null, 2));
fs.writeFileSync(path.join(fixturesDir, 'sagging-pushup.json'), JSON.stringify(generateSaggingPushup(), null, 2));
fs.writeFileSync(path.join(fixturesDir, 'jitter-missing.json'), JSON.stringify(generateJitterMissing(), null, 2));

console.log('Successfully generated test fixtures in src/lib/train/__tests__/fixtures/');
