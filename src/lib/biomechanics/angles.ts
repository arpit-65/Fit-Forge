/**
 * Biomechanics Angle & Trigonometry Engine
 * Calculates 2D/3D joint angles for real-time exercise form analysis.
 */

export interface Point2D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * Calculates the angle (in degrees, 0–180) formed at vertex B by points A, B, and C.
 * If 3D coordinates (z) are present on points, calculates true 3D joint angle.
 * Formula: θ = arccos((BA · BC) / (|BA| * |BC|))
 */
export function calculateAngle(a: Point2D, b: Point2D, c: Point2D): number {
  if (a.z !== undefined && b.z !== undefined && c.z !== undefined) {
    return calculateAngle3D(a, b, c);
  }

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle * 10) / 10;
}

/**
 * Calculates 3D angle at vertex B from points A, B, C using 3D Euclidean dot product.
 * Returns angle in degrees [0, 180]. If z is omitted on any point, falls back gracefully to 2D.
 */
export function calculateAngle3D(
  a: Point2D | Point3D,
  b: Point2D | Point3D,
  c: Point2D | Point3D
): number {
  const az = a.z ?? 0;
  const bz = b.z ?? 0;
  const cz = c.z ?? 0;

  // If none have meaningful 3D depth, use standard 2D calculateAngle
  if (a.z === undefined && b.z === undefined && c.z === undefined) {
    return calculateAngle(a, b, c);
  }

  const v1 = { x: a.x - b.x, y: a.y - b.y, z: az - bz };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: cz - bz };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosine = Math.min(1.0, Math.max(-1.0, dot / (mag1 * mag2)));
  const angleDeg = (Math.acos(cosine) * 180.0) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Euclidean distance between two 2D points.
 */
export function calculateDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the vertical inclination angle of a vector (e.g. Torso angle relative to vertical).
 * 0 degrees = perfectly upright vertical, 90 degrees = horizontal.
 */
export function calculateVerticalAngle(top: Point2D, bottom: Point2D): number {
  const dy = Math.abs(bottom.y - top.y);
  const dx = Math.abs(bottom.x - top.x);
  const angleRad = Math.atan2(dx, dy);
  return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
}

/**
 * Exponential Moving Average (EMA) smoother for real-time joint angle series.
 * Eliminates webcam high-frequency jitter while preserving quick motion response.
 */
export class AngleSmoother {
  private alpha: number;
  private current: number | null = null;

  constructor(alpha: number = 0.55) {
    this.alpha = alpha;
  }

  update(rawAngle: number): number {
    if (this.current === null) {
      this.current = rawAngle;
      return rawAngle;
    }
    this.current = this.alpha * rawAngle + (1 - this.alpha) * this.current;
    return Math.round(this.current * 10) / 10;
  }

  reset() {
    this.current = null;
  }
}

/**
 * 1€ (One Euro) Filter for real-time human pose jitter reduction without lag.
 * Adapts cutoff frequency dynamically based on signal velocity.
 * Ref: Casiez, Roussel, Vogel (CHI 2012)
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private smoothingFactor(tDiff: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / tDiff);
  }

  filter(x: number, timestamp: number = (typeof performance !== "undefined" ? performance.now() : Date.now())): number {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x;
      this.tPrev = timestamp;
      this.dxPrev = 0;
      return x;
    }

    const tDiff = Math.max((timestamp - this.tPrev) / 1000, 0.001);
    this.tPrev = timestamp;

    // Filter derivative (velocity)
    const dx = (x - this.xPrev) / tDiff;
    const alphaD = this.smoothingFactor(tDiff, this.dCutoff);
    const dxHat = alphaD * dx + (1 - alphaD) * this.dxPrev;
    this.dxPrev = dxHat;

    // Adapt cutoff frequency based on velocity
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const alpha = this.smoothingFactor(tDiff, cutoff);
    const xHat = alpha * x + (1 - alpha) * this.xPrev;
    this.xPrev = xHat;

    return xHat;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

/**
 * Multi-dimensional One Euro Filter for 2D/3D points.
 */
export class PointOneEuroFilter {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterZ: OneEuroFilter;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  filter(point: Point2D, timestamp?: number): Point2D {
    const x = this.filterX.filter(point.x, timestamp);
    const y = this.filterY.filter(point.y, timestamp);
    const z = point.z !== undefined ? this.filterZ.filter(point.z, timestamp) : undefined;

    return {
      x,
      y,
      ...(z !== undefined ? { z } : {}),
      visibility: point.visibility,
    };
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}
