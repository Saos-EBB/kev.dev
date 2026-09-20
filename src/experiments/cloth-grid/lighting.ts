// Fake lighting: brightness follows the SLOPE of the depth field, not its
// height. The gradient acts as a fake surface normal; flanks that lean
// toward the light glow, flanks leaning away stay dark, the flat top and
// the flat cloth get nothing.

import type { ClothConfig } from "./config";

export interface Slopes {
  /** Gradient, scaled so the steepest point has length 1. Points uphill. */
  gx: Float32Array;
  gy: Float32Array;
  /** Signed light term per point: > 0 = faces the light. Multiply by pushStrength. */
  lit: Float32Array;
  /** Slope steepness 0..1 — high along the bump edge. */
  edge: Float32Array;
}

export function computeSlopes(
  depth: Float32Array,
  cols: number,
  rows: number,
  light: ClothConfig["light"],
): Slopes {
  const n = cols * rows;
  const gx = new Float32Array(n);
  const gy = new Float32Array(n);
  const at = (c: number, r: number) =>
    depth[Math.min(rows - 1, Math.max(0, r)) * cols + Math.min(cols - 1, Math.max(0, c))];

  // Central difference (depth[x+1] - depth[x-1]) / 2 — the backward
  // difference depth[x] - depth[x-1] would just shift the result by half a cell.
  let maxMag = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      gx[i] = (at(c + 1, r) - at(c - 1, r)) / 2;
      gy[i] = (at(c, r + 1) - at(c, r - 1)) / 2;
      maxMag = Math.max(maxMag, Math.hypot(gx[i], gy[i]));
    }
  }

  const len = Math.hypot(light.dir.x, light.dir.y) || 1;
  const lx = light.dir.x / len;
  const ly = light.dir.y / len;
  const lit = new Float32Array(n);
  const edge = new Float32Array(n);
  const inv = maxMag > 0 ? 1 / maxMag : 0;
  for (let i = 0; i < n; i++) {
    gx[i] *= inv;
    gy[i] *= inv;
    edge[i] = Math.hypot(gx[i], gy[i]);
    // Normal ≈ -gradient, so a point lit from `dir` has -(g · dir) > 0.
    lit[i] = -(gx[i] * lx + gy[i] * ly) * light.gain;
  }
  return { gx, gy, lit, edge };
}
