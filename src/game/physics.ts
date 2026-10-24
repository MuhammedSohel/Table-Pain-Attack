import { PenEntity, Vector2D } from '../types';

export interface DeskBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  bevel: number;
}

// Distance between two line segments in 2D
export function closestPointsBetweenSegments(
  p1: Vector2D, p2: Vector2D,
  p3: Vector2D, p4: Vector2D
): { ptA: Vector2D; ptB: Vector2D; distanceSq: number } {
  const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const d2 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const r = { x: p1.x - p3.x, y: p1.y - p3.y };

  const a = d1.x * d1.x + d1.y * d1.y;
  const e = d2.x * d2.x + d2.y * d2.y;
  const f = d2.x * r.x + d2.y * r.y;

  let s = 0;
  let t = 0;

  if (a <= 0.0001 && e <= 0.0001) {
    return {
      ptA: { x: p1.x, y: p1.y },
      ptB: { x: p3.x, y: p3.y },
      distanceSq: (p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2
    };
  }

  if (a <= 0.0001) {
    s = 0;
    t = Math.max(0, Math.min(1, f / e));
  } else {
    const c = d1.x * r.x + d1.y * r.y;
    if (e <= 0.0001) {
      t = 0;
      s = Math.max(0, Math.min(1, -c / a));
    } else {
      const b = d1.x * d2.x + d1.y * d2.y;
      const denom = a * e - b * b;

      if (denom !== 0) {
        s = Math.max(0, Math.min(1, (b * f - c * e) / denom));
      } else {
        s = 0;
      }

      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.max(0, Math.min(1, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.max(0, Math.min(1, (b - c) / a));
      }
    }
  }

  const ptA = { x: p1.x + d1.x * s, y: p1.y + d1.y * s };
  const ptB = { x: p3.x + d2.x * t, y: p3.y + d2.y * t };
  const distSq = (ptA.x - ptB.x) ** 2 + (ptA.y - ptB.y) ** 2;

  return { ptA, ptB, distanceSq: distSq };
}

// Compute the two endpoints of a pen
export function getPenEndpoints(pen: PenEntity): { tip: Vector2D; cap: Vector2D } {
  const halfLen = pen.length / 2;
  const cos = Math.cos(pen.angle);
  const sin = Math.sin(pen.angle);

  return {
    tip: { x: pen.x + cos * halfLen, y: pen.y + sin * halfLen },
    cap: { x: pen.x - cos * halfLen, y: pen.y - sin * halfLen }
  };
}

// Check collision between two pens
export function checkPenCollision(
  penA: PenEntity,
  penB: PenEntity
): { hit: boolean; normal: Vector2D; depth: number; ptA: Vector2D; ptB: Vector2D } | null {
  if (!penA.isAlive || !penB.isAlive || penA.fallProgress > 0 || penB.fallProgress > 0) {
    return null;
  }

  const segA = getPenEndpoints(penA);
  const segB = getPenEndpoints(penB);

  const { ptA, ptB, distanceSq } = closestPointsBetweenSegments(segA.tip, segA.cap, segB.tip, segB.cap);
  const minDistance = penA.radius + penB.radius;

  if (distanceSq < minDistance * minDistance) {
    const dist = Math.sqrt(distanceSq);
    let nx = 0;
    let ny = -1;
    if (dist > 0.0001) {
      nx = (ptA.x - ptB.x) / dist;
      ny = (ptA.y - ptB.y) / dist;
    } else {
      nx = Math.cos(penA.angle + Math.PI / 2);
      ny = Math.sin(penA.angle + Math.PI / 2);
    }

    return {
      hit: true,
      normal: { x: nx, y: ny },
      depth: minDistance - dist,
      ptA,
      ptB
    };
  }

  return null;
}

// Resolve impulse collision with angular spin transfer
export function resolvePenCollision(
  penA: PenEntity,
  penB: PenEntity,
  col: { normal: Vector2D; depth: number; ptA: Vector2D; ptB: Vector2D }
): number {
  const nx = col.normal.x;
  const ny = col.normal.y;

  // Separate positions
  const totalMass = penA.mass + penB.mass;
  const m1 = penB.mass / totalMass;
  const m2 = penA.mass / totalMass;

  penA.x += nx * col.depth * m1;
  penA.y += ny * col.depth * m1;
  penB.x -= nx * col.depth * m2;
  penB.y -= ny * col.depth * m2;

  // Lever arms from center of mass to collision point
  const rAx = col.ptA.x - penA.x;
  const rAy = col.ptA.y - penA.y;
  const rBx = col.ptB.x - penB.x;
  const rBy = col.ptB.y - penB.y;

  // Velocities at contact point
  const vAx = penA.vx - penA.vAngle * rAy;
  const vAy = penA.vy + penA.vAngle * rAx;
  const vBx = penB.vx - penB.vAngle * rBy;
  const vBy = penB.vy + penB.vAngle * rBx;

  const relVx = vAx - vBx;
  const relVy = vAy - vBy;

  const velAlongNormal = relVx * nx + relVy * ny;

  // Moving apart already
  if (velAlongNormal > 0) return 0;

  const restitution = Math.min(penA.restitution, penB.restitution);

  // Moments of inertia for thin rod rotating about center: I = (1/12) * M * L^2
  const IA = (1 / 12) * penA.mass * (penA.length * penA.length);
  const IB = (1 / 12) * penB.mass * (penB.length * penB.length);

  const rA_cross_N = rAx * ny - rAy * nx;
  const rB_cross_N = rBx * ny - rBy * nx;

  const invMassSum = (1 / penA.mass) + (1 / penB.mass) +
    (rA_cross_N * rA_cross_N) / IA +
    (rB_cross_N * rB_cross_N) / IB;

  const impulseMag = (-(1 + restitution) * velAlongNormal) / invMassSum;

  const impX = impulseMag * nx;
  const impY = impulseMag * ny;

  // Apply linear changes
  penA.vx += impX / penA.mass;
  penA.vy += impY / penA.mass;
  penB.vx -= impX / penB.mass;
  penB.vy -= impY / penB.mass;

  // Apply angular changes (torque = r x F)
  penA.vAngle += (rAx * impY - rAy * impX) / IA;
  penB.vAngle -= (rBx * impY - rBy * impX) / IB;

  return Math.abs(impulseMag);
}

// Check desk bounds and edge-falling physics
export function updatePenDeskStatus(
  pen: PenEntity,
  desk: DeskBounds,
  deltaTime: number
): { fellOffJustNow: boolean } {
  if (!pen.isAlive) return { fellOffJustNow: false };

  // If already falling
  if (pen.fallProgress > 0) {
    pen.fallProgress += deltaTime * 2.2;
    pen.fallRotation += pen.vAngle * deltaTime * 2;
    pen.vx *= 0.95;
    pen.vy *= 0.95;
    pen.x += pen.vx * deltaTime * 60;
    pen.y += pen.vy * deltaTime * 60;

    if (pen.fallProgress >= 1.0) {
      pen.isAlive = false;
    }
    return { fellOffJustNow: false };
  }

  const seg = getPenEndpoints(pen);

  // Check how many points are off table
  const tipOff = seg.tip.x < desk.x || seg.tip.x > desk.x + desk.width ||
                 seg.tip.y < desk.y || seg.tip.y > desk.y + desk.height;

  const capOff = seg.cap.x < desk.x || seg.cap.x > desk.x + desk.width ||
                 seg.cap.y < desk.y || seg.cap.y > desk.y + desk.height;

  const centerOff = pen.x < desk.x || pen.x > desk.x + desk.width ||
                    pen.y < desk.y || pen.y > desk.y + desk.height;

  // If center is off table, or both ends are off, pen falls off the desk!
  if (centerOff || (tipOff && capOff)) {
    pen.fallProgress = 0.05;
    // impart outward drift velocity
    const centerX = desk.x + desk.width / 2;
    const centerY = desk.y + desk.height / 2;
    const dirX = pen.x - centerX;
    const dirY = pen.y - centerY;
    const len = Math.hypot(dirX, dirY) || 1;
    pen.vx += (dirX / len) * 2.5;
    pen.vy += (dirY / len) * 2.5;
    pen.vAngle += (Math.random() - 0.5) * 0.4;
    return { fellOffJustNow: true };
  }

  return { fellOffJustNow: false };
}
