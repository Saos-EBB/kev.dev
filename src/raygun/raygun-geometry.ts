// Pure geometry for the raygun button — no DOM reads, just numbers in and
// numbers out. Ported from the sibling b2b-cv project's lib/raygunGeometry.ts.

export interface Point {
  x: number;
  y: number;
}

/** Evenly spaces `count` points along a quarter-circle arc, top-left to top-right of `center`. */
export function socialCirclePositions(
  count: number,
  center: Point,
  viewport: { width: number; height: number },
): Point[] {
  const radius = Math.min(viewport.width, viewport.height) * 0.25;
  const startAngle = -Math.PI / 2;
  const endAngle = 0;
  const positions: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle =
      count === 1 ? startAngle : startAngle + (i / (count - 1)) * (endAngle - startAngle);
    positions.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return positions;
}

/** Where the nozzle ends up once the gun rotates to face (targetX, targetY). */
export function nozzlePoint(
  center: Point,
  targetX: number,
  targetY: number,
  nozzleDist: number,
): Point {
  const angle = Math.atan2(targetY - center.y, targetX - center.x);
  return {
    x: center.x + Math.cos(angle) * nozzleDist,
    y: center.y + Math.sin(angle) * nozzleDist,
  };
}

export function barrelTip(
  btnCX: number,
  btnCY: number,
  targetX: number,
  targetY: number,
  nozzleDist: number,
) {
  const nozzle = nozzlePoint({ x: btnCX, y: btnCY }, targetX, targetY, nozzleDist);
  return { originX: btnCX, originY: btnCY, tipX: nozzle.x, tipY: nozzle.y };
}

/** Degrees to rotate the gun artwork so its (off-centre) nozzle faces the target. */
export function rotationAngleDeg(
  center: Point,
  targetX: number,
  targetY: number,
  nozzleAngleDeg: number,
): number {
  const angleToTarget =
    Math.atan2(targetY - center.y, targetX - center.x) * (180 / Math.PI);
  return angleToTarget - nozzleAngleDeg;
}
