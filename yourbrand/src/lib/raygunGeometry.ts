// Pure geometry for the raygun contact button — no DOM reads, no refs, just
// numbers in and numbers out. Split from lib/RaygunButton.tsx so the
// trigonometry behind the nozzle/beam fixes can be tested without mounting a
// canvas.

export interface Point { x: number; y: number }

/** Evenly spaces `count` points along a quarter-circle arc, top-left to top-right of `center`. */
export function socialCirclePositions(
  count: number,
  center: Point,
  viewport: { width: number; height: number },
): { left: number; top: number }[] {
  const radius = Math.min(viewport.width, viewport.height) * 0.25
  const startAngle = -Math.PI / 2
  const endAngle   = 0
  const positions: { left: number; top: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / (count - 1)) * (endAngle - startAngle)
    positions.push({
      left: center.x + radius * Math.cos(angle) - 28,
      top:  center.y + radius * Math.sin(angle) - 28,
    })
  }
  return positions
}

/** Where the nozzle ends up once the gun rotates to face (targetX, targetY). */
export function nozzlePoint(center: Point, targetX: number, targetY: number, nozzleDist: number): Point {
  const angle = Math.atan2(targetY - center.y, targetX - center.x)
  return { x: center.x + Math.cos(angle) * nozzleDist, y: center.y + Math.sin(angle) * nozzleDist }
}

export function barrelTip(btnCX: number, btnCY: number, targetX: number, targetY: number, nozzleDist: number) {
  const nozzle = nozzlePoint({ x: btnCX, y: btnCY }, targetX, targetY, nozzleDist)
  return { originX: btnCX, originY: btnCY, tipX: nozzle.x, tipY: nozzle.y }
}

/** Degrees to rotate the gun artwork so its (off-centre) nozzle faces the target. */
export function rotationAngleDeg(center: Point, targetX: number, targetY: number, nozzleAngleDeg: number): number {
  const angleToTarget = Math.atan2(targetY - center.y, targetX - center.x) * (180 / Math.PI)
  return angleToTarget - nozzleAngleDeg
}
