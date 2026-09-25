/**
 * Pure Biomechanics Geometry Engine
 * Computes 2D/3D joint angles, inclinations, Euclidean distances, and vector projections.
 * Fully guarded against NaN, undefined, zero-length vectors, and floating-point errors.
 */

export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Validates whether a point is defined with finite numerical coordinates.
 */
export function isValidPoint(p?: Point | null): p is Point {
  if (!p) return false;
  if (typeof p.x !== "number" || isNaN(p.x) || !isFinite(p.x)) return false;
  if (typeof p.y !== "number" || isNaN(p.y) || !isFinite(p.y)) return false;
  if (p.z !== undefined && (typeof p.z !== "number" || isNaN(p.z) || !isFinite(p.z))) return false;
  return true;
}

/**
 * Calculates the interior angle (in degrees, 0–180) formed at vertex B by points A, B, and C.
 * Uses 3D Euclidean dot product when z is present on all three points, otherwise 2D.
 * Returns 0 if any point is invalid or if either vector has zero length.
 */
export function angle(a?: Point | null, b?: Point | null, c?: Point | null): number {
  if (!isValidPoint(a) || !isValidPoint(b) || !isValidPoint(c)) {
    return 0;
  }

  const has3D = a.z !== undefined && b.z !== undefined && c.z !== undefined;
  const az = has3D ? a.z! : 0;
  const bz = has3D ? b.z! : 0;
  const cz = has3D ? c.z! : 0;

  // Vector BA
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v1z = az - bz;

  // Vector BC
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const v2z = cz - bz;

  const mag1Sq = v1x * v1x + v1y * v1y + v1z * v1z;
  const mag2Sq = v2x * v2x + v2y * v2y + v2z * v2z;

  // Prevent division by zero if vertices are coincident or zero length
  if (mag1Sq <= 1e-10 || mag2Sq <= 1e-10) {
    return 0;
  }

  const mag1 = Math.sqrt(mag1Sq);
  const mag2 = Math.sqrt(mag2Sq);

  const dot = v1x * v2x + v1y * v2y + v1z * v2z;

  // Clamp cosine to [-1, 1] to prevent NaN from floating point precision
  const cosine = Math.min(1.0, Math.max(-1.0, dot / (mag1 * mag2)));
  const angleDeg = (Math.acos(cosine) * 180.0) / Math.PI;

  if (isNaN(angleDeg) || !isFinite(angleDeg)) {
    return 0;
  }

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates Euclidean distance between two points (2D or 3D).
 * Returns 0 if any point is invalid.
 */
export function distance(a?: Point | null, b?: Point | null): number {
  if (!isValidPoint(a) || !isValidPoint(b)) {
    return 0;
  }

  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z !== undefined && b.z !== undefined ? a.z - b.z : 0;

  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return isNaN(dist) ? 0 : Math.round(dist * 1000) / 1000;
}

/**
 * Calculates the inclination angle (in degrees, 0–90) of the vector (top -> bottom) relative to vertical.
 * 0° = perfectly upright/vertical, 90° = horizontal.
 */
export function verticalAngle(top?: Point | null, bottom?: Point | null): number {
  if (!isValidPoint(top) || !isValidPoint(bottom)) {
    return 0;
  }

  const dx = Math.abs(bottom.x - top.x);
  const dy = Math.abs(bottom.y - top.y);

  if (dx === 0 && dy === 0) {
    return 0;
  }

  const angleRad = Math.atan2(dx, dy);
  const deg = (angleRad * 180.0) / Math.PI;

  return isNaN(deg) ? 0 : Math.round(deg * 10) / 10;
}

/**
 * Calculates the inclination angle (in degrees, 0–90) relative to horizontal.
 * 0° = horizontal, 90° = vertical.
 */
export function horizontalAngle(left?: Point | null, right?: Point | null): number {
  if (!isValidPoint(left) || !isValidPoint(right)) {
    return 0;
  }

  const dx = Math.abs(right.x - left.x);
  const dy = Math.abs(right.y - left.y);

  if (dx === 0 && dy === 0) {
    return 0;
  }

  const angleRad = Math.atan2(dy, dx);
  const deg = (angleRad * 180.0) / Math.PI;

  return isNaN(deg) ? 0 : Math.round(deg * 10) / 10;
}

/**
 * Calculates the signed perpendicular distance of a point relative to a line segment (lineStart -> lineEnd).
 * In 2D normalized screen coords (where y points downward):
 * - signedOffset > 0 indicates point is BELOW the line (sagging in push-up/plank).
 * - signedOffset < 0 indicates point is ABOVE the line (piking in push-up/plank).
 */
export function pointToLineOffset(
  point?: Point | null,
  lineStart?: Point | null,
  lineEnd?: Point | null
): { distance: number; signedOffset: number } {
  if (!isValidPoint(point) || !isValidPoint(lineStart) || !isValidPoint(lineEnd)) {
    return { distance: 0, signedOffset: 0 };
  }

  const lineDx = lineEnd.x - lineStart.x;
  const lineDy = lineEnd.y - lineStart.y;
  const lineLenSq = lineDx * lineDx + lineDy * lineDy;

  if (lineLenSq <= 1e-10) {
    const d = distance(point, lineStart);
    return { distance: d, signedOffset: 0 };
  }

  const lineLen = Math.sqrt(lineLenSq);

  // 2D cross product: (x2 - x1)*(y0 - y1) - (y2 - y1)*(x0 - x1)
  // When line is roughly horizontal from left to right (lineDx > 0):
  // If point.y > line y (lower on screen), cross product is positive.
  const cross = lineDx * (point.y - lineStart.y) - lineDy * (point.x - lineStart.x);
  const signedOffset = cross / lineLen;

  return {
    distance: Math.abs(signedOffset),
    signedOffset: Math.round(signedOffset * 1000) / 1000,
  };
}
