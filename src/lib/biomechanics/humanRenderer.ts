import { PoseLandmarks, POSE_LANDMARKS, WorkoutState } from "./exercises";

// ─── Palette ──────────────────────────────────────────────────────────────────
const SKIN_LIGHT = "#E8B48A";
const SKIN_MID = "#D49B74";
const SKIN_SHADOW = "#A96D4C";

const CLOTH_TOP_DARK = "#1A2535";
const CLOTH_TOP_MID = "#243347";
const CLOTH_ACCENT = "#4FC3B8";

const SHORTS_DARK = "#0D1520";
const SHORTS_MID = "#1A2535";

const SHOE_BODY = "#F0F4F8";
const SHOE_SOLE = "#4FC3B8";
const SHOE_LACE = "#1A2535";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Linear gradient between two colours along a limb segment */
function limbGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colLight: string,
  colDark: string
): CanvasGradient {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, colLight);
  g.addColorStop(1, colDark);
  return g;
}

/** Tapered, gradient-filled limb (thigh / calf / upper-arm / forearm) with highlight stripe */
function drawLimb(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  wStart: number, wEnd: number,
  colBase: string, colShadow: string
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const perp = angle + Math.PI / 2;

  const dx1 = (Math.cos(perp) * wStart) / 2;
  const dy1 = (Math.sin(perp) * wStart) / 2;
  const dx2 = (Math.cos(perp) * wEnd) / 2;
  const dy2 = (Math.sin(perp) * wEnd) / 2;

  // Cross-section gradient (light on left, shadow on right)
  const perpX = Math.cos(perp);
  const perpY = Math.sin(perp);
  const mg = ctx.createLinearGradient(
    (x1 + x2) / 2 + perpX * wStart,
    (y1 + y2) / 2 + perpY * wStart,
    (x1 + x2) / 2 - perpX * wStart,
    (y1 + y2) / 2 - perpY * wStart
  );
  mg.addColorStop(0, colBase);
  mg.addColorStop(0.45, colBase);
  mg.addColorStop(1, colShadow);

  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(x1 + dx1, y1 + dy1);
  ctx.lineTo(x2 + dx2, y2 + dy2);
  ctx.arc(x2, y2, wEnd / 2, perp, perp + Math.PI);
  ctx.lineTo(x1 - dx1, y1 - dy1);
  ctx.arc(x1, y1, wStart / 2, perp + Math.PI, perp + Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  // Highlight stripe along centre
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = Math.max(1.5, wStart * 0.18);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Realistic head: gradient sphere + ear + hair cap */
function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number
) {
  // Ear (left from viewer = right when mirrored)
  ctx.fillStyle = SKIN_SHADOW;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.92, cy + r * 0.1, r * 0.18, r * 0.28, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Ear (right)
  ctx.fillStyle = SKIN_SHADOW;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.92, cy + r * 0.1, r * 0.18, r * 0.28, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head sphere with radial gradient
  const hg = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
  hg.addColorStop(0, SKIN_LIGHT);
  hg.addColorStop(0.6, SKIN_MID);
  hg.addColorStop(1, SKIN_SHADOW);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle chin shadow
  const chinG = ctx.createRadialGradient(cx, cy + r * 0.55, 0, cx, cy + r * 0.55, r * 0.55);
  chinG.addColorStop(0, "rgba(90,50,20,0.25)");
  chinG.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = chinG;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Hair cap (dark, rounded arc from forehead over top)
  const hairGrad = ctx.createRadialGradient(cx, cy - r * 0.4, 0, cx, cy, r);
  hairGrad.addColorStop(0, "#2C1810");
  hairGrad.addColorStop(1, "#1A0F0A");
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 1.1, Math.PI * 1.9, false); // bottom arc connects
  ctx.arc(cx, cy - r * 0.12, r * 1.02, Math.PI * 1.9 - Math.PI, Math.PI * 1.1 - Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Athletic headband
  ctx.fillStyle = CLOTH_ACCENT;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1, Math.PI * 1.18, Math.PI * 1.82, false);
  ctx.arc(cx, cy, r - 4, Math.PI * 1.82, Math.PI * 1.18, true);
  ctx.closePath();
  ctx.fill();
}

/** Tapered neck with gradient */
function drawNeck(
  ctx: CanvasRenderingContext2D,
  cx: number, shoulderY: number, headBottomY: number
) {
  const ng = ctx.createLinearGradient(cx - 7, shoulderY, cx + 7, shoulderY);
  ng.addColorStop(0, SKIN_LIGHT);
  ng.addColorStop(0.5, SKIN_MID);
  ng.addColorStop(1, SKIN_SHADOW);
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.moveTo(cx - 7, shoulderY);
  ctx.lineTo(cx + 7, shoulderY);
  ctx.lineTo(cx + 5, headBottomY);
  ctx.lineTo(cx - 5, headBottomY);
  ctx.closePath();
  ctx.fill();
}

/** Rounded athletic torso using bezier curves */
function drawTorso(
  ctx: CanvasRenderingContext2D,
  lsx: number, lsy: number,
  rsx: number, rsy: number,
  lhx: number, lhy: number,
  rhx: number, rhy: number
) {
  const midShX = (lsx + rsx) / 2;
  const midShY = (lsy + rsy) / 2;
  const midHpX = (lhx + rhx) / 2;
  const midHpY = (lhy + rhy) / 2;

  // Gradient: dark top, slightly lighter centre, dark waist
  const tg = ctx.createLinearGradient(lsx, midShY, rsx, midShY);
  tg.addColorStop(0, CLOTH_TOP_DARK);
  tg.addColorStop(0.15, CLOTH_TOP_MID);
  tg.addColorStop(0.5, CLOTH_TOP_MID);
  tg.addColorStop(0.85, CLOTH_TOP_MID);
  tg.addColorStop(1, CLOTH_TOP_DARK);

  ctx.fillStyle = tg;
  ctx.beginPath();
  // Left shoulder → left hip (slight waist curve inward)
  ctx.moveTo(lsx, lsy);
  ctx.bezierCurveTo(lsx - 6, (lsy + lhy) / 2, lhx - 4, (lsy + lhy) / 2, lhx, lhy);
  // Across hips
  ctx.lineTo(rhx, rhy);
  // Right hip → right shoulder
  ctx.bezierCurveTo(rhx + 4, (rsy + rhy) / 2, rsx + 6, (lsy + rsy) / 2, rsx, rsy);
  // Across shoulders (slight curve for chest)
  ctx.bezierCurveTo(
    rsx - (rsx - lsx) * 0.2, midShY - 6,
    lsx + (rsx - lsx) * 0.2, midShY - 6,
    lsx, lsy
  );
  ctx.closePath();
  ctx.fill();

  // Pectoral highlight (subtle lighter sweep)
  const pg = ctx.createLinearGradient(midShX, midShY, midShX, midHpY);
  pg.addColorStop(0, "rgba(255,255,255,0.09)");
  pg.addColorStop(0.5, "rgba(255,255,255,0.04)");
  pg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.moveTo(lsx, lsy);
  ctx.bezierCurveTo(lsx - 6, (lsy + lhy) / 2, lhx - 4, (lsy + lhy) / 2, lhx, lhy);
  ctx.lineTo(rhx, rhy);
  ctx.bezierCurveTo(rhx + 4, (rsy + rhy) / 2, rsx + 6, (lsy + rsy) / 2, rsx, rsy);
  ctx.bezierCurveTo(
    rsx - (rsx - lsx) * 0.2, midShY - 6,
    lsx + (rsx - lsx) * 0.2, midShY - 6,
    lsx, lsy
  );
  ctx.closePath();
  ctx.fill();

  // Accent centre stripe
  ctx.save();
  ctx.strokeStyle = CLOTH_ACCENT;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(midShX, midShY + 4);
  ctx.lineTo(midHpX, midHpY - 2);
  ctx.stroke();
  ctx.restore();
}

/** Athletic shorts (pelvis + upper quads) */
function drawShorts(
  ctx: CanvasRenderingContext2D,
  lhx: number, lhy: number,
  rhx: number, rhy: number
) {
  const sg = ctx.createLinearGradient(lhx, lhy, rhx, rhy);
  sg.addColorStop(0, SHORTS_DARK);
  sg.addColorStop(0.5, SHORTS_MID);
  sg.addColorStop(1, SHORTS_DARK);

  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(lhx - 12, lhy - 4);
  ctx.lineTo(rhx + 12, rhy - 4);
  ctx.bezierCurveTo(rhx + 16, rhy + 10, rhx + 14, rhy + 28, rhx + 10, rhy + 30);
  ctx.lineTo(lhx - 10, lhy + 30);
  ctx.bezierCurveTo(lhx - 14, lhy + 28, lhx - 16, lhy + 10, lhx - 12, lhy - 4);
  ctx.closePath();
  ctx.fill();

  // Side accent stripe
  ctx.save();
  ctx.strokeStyle = CLOTH_ACCENT;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(lhx - 12, lhy);
  ctx.lineTo(lhx - 11, lhy + 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rhx + 12, rhy);
  ctx.lineTo(rhx + 11, rhy + 28);
  ctx.stroke();
  ctx.restore();
}

/** Realistic athletic sneaker */
function drawShoe(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  dir: number // -1 = left foot, 1 = right foot
) {
  ctx.save();
  ctx.translate(ax, ay);

  // Shadow under shoe
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(dir * 4, 14, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sole
  ctx.fillStyle = SHOE_SOLE;
  ctx.beginPath();
  ctx.roundRect(-10 * dir, 6, 26 * dir, 7, [0, 0, 3, 3]);
  ctx.fill();

  // Midsole lighter stripe
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-10 * dir, 6, 26 * dir, 2);

  // Upper body gradient
  const ug = ctx.createLinearGradient(-10 * dir, -6, 14 * dir, -6);
  ug.addColorStop(0, "#FFFFFF");
  ug.addColorStop(0.5, SHOE_BODY);
  ug.addColorStop(1, "#C8D8E0");
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.roundRect(-10 * dir, -6, 26 * dir, 13, [6, 6, 2, 2]);
  ctx.fill();

  // Lace detail
  ctx.strokeStyle = SHOE_LACE;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const lx = (-5 + i * 5) * dir;
    ctx.beginPath();
    ctx.moveTo(lx, -5);
    ctx.lineTo(lx, 2);
    ctx.stroke();
  }

  // Accent stripe on side
  ctx.fillStyle = SHOE_SOLE;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.roundRect(-8 * dir, 0, 22 * dir, 3, 2);
  ctx.fill();

  ctx.restore();
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Renders a lifelike human athlete on the HTML5 Canvas.
 * Uses gradient-shaded tapered limbs, a bezier torso, a realistic head with
 * hair, proper ears, athletic sneakers, and a gym-floor drop shadow.
 */
export function drawHumanAthlete(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  w: number,
  h: number,
  exercise: string,
  feedbackType: "success" | "warning" | "error" | "info"
) {
  const ls = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rs = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lh = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rh = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const lk = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rk = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const la = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const ra = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const le = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const re = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lw = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rw = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

  if (!ls || !rs || !lh || !rh) return;

  ctx.save();

  // ── 1. Drop shadow below feet ──────────────────────────────────────────────
  if (la && ra) {
    const floorY = Math.max(la.y * h, ra.y * h) + 20;
    const midX = ((la.x + ra.x) / 2) * w;
    const shadowG = ctx.createRadialGradient(midX, floorY, 2, midX, floorY, w * 0.18);
    shadowG.addColorStop(0, "rgba(0,0,0,0.45)");
    shadowG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(midX, floorY, w * 0.18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 2. Legs (drawn behind torso) ───────────────────────────────────────────
  if (rh && rk) {
    drawLimb(ctx, rh.x * w, rh.y * h, rk.x * w, rk.y * h, 22, 17, SKIN_SHADOW, "#7A4A30");
  }
  if (rk && ra) {
    drawLimb(ctx, rk.x * w, rk.y * h, ra.x * w, ra.y * h, 17, 12, SKIN_SHADOW, "#7A4A30");
    drawShoe(ctx, ra.x * w, ra.y * h, 1);
  }
  if (lh && lk) {
    drawLimb(ctx, lh.x * w, lh.y * h, lk.x * w, lk.y * h, 22, 17, SKIN_MID, SKIN_SHADOW);
  }
  if (lk && la) {
    drawLimb(ctx, lk.x * w, lk.y * h, la.x * w, la.y * h, 17, 12, SKIN_MID, SKIN_SHADOW);
    drawShoe(ctx, la.x * w, la.y * h, -1);
  }

  // ── 3. Shorts ──────────────────────────────────────────────────────────────
  drawShorts(ctx, lh.x * w, lh.y * h, rh.x * w, rh.y * h);

  // ── 4. Torso ───────────────────────────────────────────────────────────────
  drawTorso(
    ctx,
    ls.x * w, ls.y * h,
    rs.x * w, rs.y * h,
    lh.x * w, lh.y * h,
    rh.x * w, rh.y * h
  );

  // ── 5. Arms ────────────────────────────────────────────────────────────────
  // Right arm (slightly shadowed — back arm)
  if (rs && re) {
    drawLimb(ctx, rs.x * w, rs.y * h, re.x * w, re.y * h, 14, 11, SKIN_SHADOW, "#7A4A30");
  }
  if (re && rw) {
    drawLimb(ctx, re.x * w, re.y * h, rw.x * w, rw.y * h, 11, 8, SKIN_SHADOW, "#7A4A30");
    // Fist
    const fg = ctx.createRadialGradient(rw.x * w, rw.y * h + 2, 1, rw.x * w, rw.y * h + 2, 7);
    fg.addColorStop(0, SKIN_MID);
    fg.addColorStop(1, SKIN_SHADOW);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(rw.x * w, rw.y * h + 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Left arm (front, lighter)
  if (ls && le) {
    drawLimb(ctx, ls.x * w, ls.y * h, le.x * w, le.y * h, 14, 11, SKIN_LIGHT, SKIN_MID);
  }
  if (le && lw) {
    drawLimb(ctx, le.x * w, le.y * h, lw.x * w, lw.y * h, 11, 8, SKIN_LIGHT, SKIN_MID);
    // Fist
    const fg = ctx.createRadialGradient(lw.x * w, lw.y * h + 2, 1, lw.x * w, lw.y * h + 2, 7);
    fg.addColorStop(0, SKIN_LIGHT);
    fg.addColorStop(1, SKIN_MID);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(lw.x * w, lw.y * h + 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 6. Neck & Head ─────────────────────────────────────────────────────────
  const midShX = (ls.x * w + rs.x * w) / 2;
  const midShY = (ls.y * h + rs.y * h) / 2;
  const headR = Math.max(16, w * 0.042);
  const headCY = midShY - headR - 10;

  drawNeck(ctx, midShX, midShY, headCY + headR * 0.85);
  drawHead(ctx, midShX, headCY, headR);

  ctx.restore();
}

// ─── Pose Skeleton (AI Vision Overlay) ────────────────────────────────────────

/**
 * Draws the AI computer-vision skeleton, glowing joint nodes, and joint-angle badge.
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  w: number,
  h: number,
  state: WorkoutState
) {
  let strokeColor = "#2ECC71";
  let glowColor = "rgba(46, 204, 113, 0.4)";

  if (state.activeFeedback.type === "error") {
    strokeColor = "#E5484D";
    glowColor = "rgba(229, 72, 77, 0.5)";
  } else if (state.activeFeedback.type === "warning") {
    strokeColor = "#F5A623";
    glowColor = "rgba(245, 166, 35, 0.45)";
  }

  const connections: Array<[number, number]> = [
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
    [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
    [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
    [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
    [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
    [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
    [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
    [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  ];

  ctx.save();

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = strokeColor;

  connections.forEach(([p1, p2]) => {
    const pt1 = landmarks[p1];
    const pt2 = landmarks[p2];
    if (pt1 && pt2) {
      ctx.beginPath();
      ctx.moveTo(pt1.x * w, pt1.y * h);
      ctx.lineTo(pt2.x * w, pt2.y * h);
      ctx.stroke();
    }
  });

  // Joint nodes
  Object.values(landmarks).forEach((pt) => {
    if (pt) {
      const x = pt.x * w;
      const y = pt.y * h;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = strokeColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#0B0F14";
      ctx.fill();
    }
  });

  // Joint-angle HUD badge
  const primaryJoint =
    state.exercise === "squat"
      ? landmarks[POSE_LANDMARKS.LEFT_KNEE]
      : state.exercise === "pushup"
      ? landmarks[POSE_LANDMARKS.LEFT_ELBOW]
      : landmarks[POSE_LANDMARKS.LEFT_HIP];

  if (primaryJoint) {
    const kx = primaryJoint.x * w + 14;
    const ky = primaryJoint.y * h;

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(11, 15, 20, 0.9)";
    ctx.beginPath();
    ctx.roundRect(kx - 6, ky - 16, 80, 24, 6);
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 12px monospace";
    ctx.fillStyle = strokeColor;
    ctx.fillText(`${state.currentAngle}°`, kx + 4, ky + 1);
  }

  ctx.restore();
}
