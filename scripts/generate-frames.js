const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DESKTOP_DIR = path.join(__dirname, '..', 'public', 'frames', 'desktop');
const MOBILE_DIR = path.join(__dirname, '..', 'public', 'frames', 'mobile');
const ROOT_FRAMES_DIR = path.join(__dirname, '..', 'public', 'frames');

[DESKTOP_DIR, MOBILE_DIR, ROOT_FRAMES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function createFrameSvg(progress, width, height, frameIndex, totalFrames) {
  const cx = width / 2;
  const cy = height / 2;
  const isMobile = width < 1000;

  // Color transitions across 4 phases:
  // Phase 1 (0.0 - 0.25): Teal / Cyan (#4F9C8F, #22d3ee)
  // Phase 2 (0.25 - 0.50): Amber / Coral (#F5A623, #EF4444)
  // Phase 3 (0.50 - 0.75): Emerald / Mint (#2ECC71, #4ade80)
  // Phase 4 (0.75 - 1.00): Radiant Gold & Teal (#FFD166, #4F9C8F)
  let primaryColor, secondaryColor, phaseBadge, telemetryStatus, riskScore;

  if (progress < 0.25) {
    const p = progress / 0.25;
    primaryColor = '#4F9C8F';
    secondaryColor = '#38bdf8';
    phaseBadge = '01 // MOMENTUM ENGINE';
    telemetryStatus = 'ACTIVE TRACKING: HIGH CADENCE';
    riskScore = Math.round(12 + p * 8);
  } else if (progress < 0.5) {
    const p = (progress - 0.25) / 0.25;
    primaryColor = p < 0.5 ? '#F5A623' : '#E5484D';
    secondaryColor = '#fbbf24';
    phaseBadge = '02 // ANOMALY DETECTED';
    telemetryStatus = 'PREDICTIVE RISK: MISSED 3 DAYS';
    riskScore = Math.round(20 + p * 58);
  } else if (progress < 0.75) {
    const p = (progress - 0.5) / 0.25;
    primaryColor = '#2ECC71';
    secondaryColor = '#4F9C8F';
    phaseBadge = '03 // ADAPTIVE DOWNGRADE';
    telemetryStatus = 'GOAL FRICTION DECREASED 60%';
    riskScore = Math.round(78 - p * 46);
  } else {
    const p = (progress - 0.75) / 0.25;
    primaryColor = '#FFD166';
    secondaryColor = '#4F9C8F';
    phaseBadge = '04 // SQUAD SYNCHRONY';
    telemetryStatus = 'STREAK RE-ESTABLISHED';
    riskScore = Math.round(32 - p * 24);
  }

  // Visual geometric elements:
  const baseRadius = Math.min(width, height) * (isMobile ? 0.32 : 0.24);
  const rotation1 = (progress * 360 * 1.5).toFixed(1);
  const rotation2 = (-progress * 360 * 2.2).toFixed(1);
  const rotation3 = (progress * 360 * 0.8).toFixed(1);

  // Biometric ECG waveform
  let wavePoints = [];
  const waveWidth = isMobile ? width * 0.8 : width * 0.5;
  const waveXStart = cx - waveWidth / 2;
  const waveY = cy + (isMobile ? baseRadius * 1.25 : baseRadius * 1.1);
  const waveSteps = 40;

  for (let s = 0; s <= waveSteps; s++) {
    const wx = waveXStart + (s / waveSteps) * waveWidth;
    let wy = waveY;
    const normS = s / waveSteps;
    // ECG peak at center
    if (normS > 0.4 && normS < 0.6) {
      const peakProg = (normS - 0.4) / 0.2;
      const spike = Math.sin(peakProg * Math.PI * 2) * (30 + Math.sin(progress * Math.PI * 4) * 10);
      wy += spike;
    } else {
      wy += Math.sin(normS * Math.PI * 6 + progress * Math.PI * 4) * 4;
    }
    wavePoints.push(`${wx.toFixed(1)},${wy.toFixed(1)}`);
  }
  const wavePath = wavePoints.join(' ');

  // Dynamic particle constellations
  let particlesSvg = '';
  const numParticles = isMobile ? 18 : 32;
  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2 + progress * Math.PI;
    const distance = baseRadius * (0.85 + Math.sin(i * 1.7 + progress * 8) * 0.35);
    const px = cx + Math.cos(angle) * distance;
    const py = cy + Math.sin(angle) * distance;
    const r = (1.5 + (i % 3) * 1.2).toFixed(1);
    const op = (0.2 + (Math.sin(i + progress * 6) + 1) * 0.35).toFixed(2);
    particlesSvg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${primaryColor}" opacity="${op}"/>`;
  }

  // Outer dashed rings & ticks
  const ticks = [];
  const numTicks = 36;
  for (let t = 0; t < numTicks; t++) {
    const tAngle = (t / numTicks) * Math.PI * 2 + (progress * Math.PI * 0.5);
    const tLen = t % 3 === 0 ? 12 : 6;
    const innerR = baseRadius * 1.18;
    const outerR = innerR + tLen;
    const x1 = cx + Math.cos(tAngle) * innerR;
    const y1 = cy + Math.sin(tAngle) * innerR;
    const x2 = cx + Math.cos(tAngle) * outerR;
    const y2 = cy + Math.sin(tAngle) * outerR;
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${primaryColor}" stroke-width="${t % 3 === 0 ? 2 : 1}" opacity="${t % 3 === 0 ? 0.6 : 0.25}"/>`);
  }

  // Central icon / shield transformation:
  const shieldScale = (1 + Math.sin(progress * Math.PI * 2) * 0.05).toFixed(3);
  const coreGlowOpacity = (0.15 + Math.sin(progress * Math.PI * 4) * 0.08).toFixed(2);

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080C11"/>
        <stop offset="50%" stop-color="#0D1520"/>
        <stop offset="100%" stop-color="#070A0E"/>
      </linearGradient>

      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="${coreGlowOpacity}"/>
        <stop offset="60%" stop-color="${secondaryColor}" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.9"/>
        <stop offset="50%" stop-color="${secondaryColor}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.1"/>
      </linearGradient>

      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

    <!-- Subtle cyber grid lines -->
    <g opacity="0.08" stroke="#8CA0AD" stroke-width="1">
      <line x1="0" y1="${cy}" x2="${width}" y2="${cy}"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="${height}"/>
      <circle cx="${cx}" cy="${cy}" r="${baseRadius * 1.6}" fill="none"/>
      <circle cx="${cx}" cy="${cy}" r="${baseRadius * 2.2}" fill="none"/>
    </g>

    <!-- Ambient Core Glow -->
    <circle cx="${cx}" cy="${cy}" r="${baseRadius * 1.5}" fill="url(#centerGlow)"/>

    <!-- Particle Constellations -->
    ${particlesSvg}

    <!-- Rotating Tech Ring 1 -->
    <g transform="rotate(${rotation1}, ${cx}, ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${baseRadius * 0.9}" fill="none" stroke="url(#ringGrad)" stroke-width="2.5" stroke-dasharray="14 10 4 10"/>
      <circle cx="${cx + baseRadius * 0.9}" cy="${cy}" r="4" fill="${secondaryColor}" opacity="0.8"/>
    </g>

    <!-- Rotating Tech Ring 2 (Counter) -->
    <g transform="rotate(${rotation2}, ${cx}, ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${baseRadius * 0.72}" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-dasharray="40 18 10 18" opacity="0.6"/>
      <circle cx="${cx - baseRadius * 0.72}" cy="${cy}" r="3" fill="${primaryColor}"/>
    </g>

    <!-- Outer Ticks Ring -->
    <g>
      ${ticks.join('')}
    </g>

    <!-- Pulsing Inner Geometric Core / Diamond Shield -->
    <g transform="translate(${cx}, ${cy}) scale(${shieldScale}) rotate(${rotation3})">
      <polygon points="0,-${baseRadius * 0.45} ${baseRadius * 0.45},0 0,${baseRadius * 0.45} -${baseRadius * 0.45},0"
        fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.85"/>
      <polygon points="0,-${baseRadius * 0.3} ${baseRadius * 0.3},0 0,${baseRadius * 0.3} -${baseRadius * 0.3},0"
        fill="${primaryColor}" fill-opacity="0.12" stroke="${secondaryColor}" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="${baseRadius * 0.12}" fill="${primaryColor}" opacity="0.9"/>
    </g>

    <!-- Central Biometric Progress Arc -->
    <g transform="rotate(-90, ${cx}, ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${baseRadius * 0.58}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
      <circle cx="${cx}" cy="${cy}" r="${baseRadius * 0.58}" fill="none" stroke="${primaryColor}" stroke-width="6"
        stroke-dasharray="${(baseRadius * 0.58 * Math.PI * 2).toFixed(1)}"
        stroke-dashoffset="${((1 - progress) * baseRadius * 0.58 * Math.PI * 2).toFixed(1)}"
        stroke-linecap="round"/>
    </g>

    <!-- Biometric ECG Waveform -->
    <polyline points="${wavePath}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5"/>

    <!-- Dynamic HUD Telemetry Display -->
    <g font-family="monospace, 'Courier New', sans-serif" text-anchor="middle" font-size="${isMobile ? 10 : 12}">
      <!-- Chapter badge -->
      <text x="${cx}" y="${cy - baseRadius * (isMobile ? 1.35 : 1.25)}" fill="${primaryColor}" font-weight="700" letter-spacing="2">
        ${phaseBadge}
      </text>

      <!-- Risk score indicator -->
      <text x="${cx}" y="${cy + baseRadius * (isMobile ? 1.48 : 1.38)}" fill="#8CA0AD" font-size="${isMobile ? 9 : 11}" letter-spacing="1">
        ${telemetryStatus} // RISK INDEX: <tspan fill="${primaryColor}" font-weight="bold">${riskScore}%</tspan>
      </text>

      <!-- Frame & Progress stamp -->
      <text x="${cx}" y="${height - 24}" fill="#4B5563" font-size="10" letter-spacing="1">
        FITFORGE SEQUENCE [FRAME ${String(frameIndex + 1).padStart(3, '0')}/${totalFrames}]
      </text>
    </g>
  </svg>
  `.trim();
}

async function generateAllFrames() {
  console.log('--- Generating FitForge Scrollytelling Hero Frames ---');

  // 1. Desktop Frames: 100 frames, 1280 px wide, 720 px high, webp quality 65
  const DESKTOP_FRAMES = 100;
  const DESKTOP_WIDTH = 1280;
  const DESKTOP_HEIGHT = 720;
  console.log(`Generating ${DESKTOP_FRAMES} Desktop frames (${DESKTOP_WIDTH}x${DESKTOP_HEIGHT} @ WebP q=65)...`);

  let desktopTotalBytes = 0;
  for (let i = 0; i < DESKTOP_FRAMES; i++) {
    const progress = i / (DESKTOP_FRAMES - 1);
    const svgStr = createFrameSvg(progress, DESKTOP_WIDTH, DESKTOP_HEIGHT, i, DESKTOP_FRAMES);
    const svgBuf = Buffer.from(svgStr);

    const webpBuf = await sharp(svgBuf)
      .webp({ quality: 65, effort: 4 })
      .toBuffer();

    const desktopFile = path.join(DESKTOP_DIR, `frame_${i}.webp`);
    const rootFile = path.join(ROOT_FRAMES_DIR, `frame_${i}.webp`);

    fs.writeFileSync(desktopFile, webpBuf);
    fs.writeFileSync(rootFile, webpBuf); // Also save to /public/frames/ for backward compatibility
    desktopTotalBytes += webpBuf.length;
  }

  const desktopMB = (desktopTotalBytes / (1024 * 1024)).toFixed(2);
  console.log(`✓ Desktop frames complete! Total size: ${desktopMB} MB (Target: under 6.0 MB)`);

  // 2. Mobile Frames: 60 frames, 800 px wide, 1000 px high, webp quality 65
  const MOBILE_FRAMES = 60;
  const MOBILE_WIDTH = 800;
  const MOBILE_HEIGHT = 1000;
  console.log(`Generating ${MOBILE_FRAMES} Mobile frames (${MOBILE_WIDTH}x${MOBILE_HEIGHT} @ WebP q=65)...`);

  let mobileTotalBytes = 0;
  for (let i = 0; i < MOBILE_FRAMES; i++) {
    const progress = i / (MOBILE_FRAMES - 1);
    const svgStr = createFrameSvg(progress, MOBILE_WIDTH, MOBILE_HEIGHT, i, MOBILE_FRAMES);
    const svgBuf = Buffer.from(svgStr);

    const webpBuf = await sharp(svgBuf)
      .webp({ quality: 65, effort: 4 })
      .toBuffer();

    const mobileFile = path.join(MOBILE_DIR, `frame_${i}.webp`);
    fs.writeFileSync(mobileFile, webpBuf);
    mobileTotalBytes += webpBuf.length;
  }

  const mobileMB = (mobileTotalBytes / (1024 * 1024)).toFixed(2);
  console.log(`✓ Mobile frames complete! Total size: ${mobileMB} MB`);

  console.log('--- All Hero Frames Successfully Generated ---');
}

generateAllFrames().catch(err => {
  console.error('Frame generation failed:', err);
  process.exit(1);
});
