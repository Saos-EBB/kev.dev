// One skull relief on a side wall, standing straight out of the wall.
//
// The skull's picture lies in the wall plane (natural size there — the perspective then squashes
// it, as it does everything on that wall). "Out of the wall" is a displacement along the wall
// normal: a point pushed δ px out is seen exactly where the view ray through it meets the wall
// again — further away along the shaft and further from the horizon. With t = halfW / (halfW − δ)
// that point is (t−1)·(P+d) further along the depth axis and (t−1)·(y−eye) further from the
// horizon (`displace`). Seen from the corridor the relief therefore leans toward the vanishing
// point, like a bust mounted on a wall.

import type { DepthSource } from "../cloth-grid/depth-map";

export interface Camera {
  /** Viewport width / height, px. */
  vw: number;
  vh: number;
  /** CSS perspective distance, px. */
  perspective: number;
  /** Section-space y of the perspective origin (= viewport centre at the peak). */
  eyeY: number;
  /** Shaft depth, px. */
  depthPx: number;
}

export interface SkullPlacement {
  side: "left" | "right";
  /** Centre of the skull along the shaft: px behind the viewport plane. */
  d: number;
  /** Centre height on screen at the peak, px. */
  sy: number;
  /** Skull height in the wall plane, px. */
  height: number;
  /**
   * Stretch of the skull along the shaft in the wall plane (1 = natural). The perspective squashes
   * that axis to a third or less, so 1.5–2 reads like a slightly oblique view instead of a very oblique one.
   */
  stretch: number;
  /** How far it stands out of the wall, px. */
  push: number;
}

/** The part of skull.png that holds the skull (of 640×384), as 0..1 — the rest is black. */
const CROP = { x0: 0.25, x1: 0.75, y0: 0.05, y1: 0.97 };
const CROP_ASPECT = ((CROP.x1 - CROP.x0) * 640) / ((CROP.y1 - CROP.y0) * 384); // width / height

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface WallSkull {
  /** Patch bounds in wall px (x along the wall's own axis, y in section space), whole cells. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Height 0..1 over the patch (u, v across it). Crisp silhouette, relief inside. */
  field: DepthSource;
  /** Where a canvas-local point ends up when pushed `delta` px out of the wall, as an offset. */
  displace(lx: number, ly: number, delta: number): { x: number; y: number };
}

/**
 * The patch is the skull's box, grown on the far side by how far the relief leans, and rounded
 * out to whole wall `cell`s so its corners sit on the wall's grid corners.
 */
export function wallSkull(source: DepthSource, cam: Camera, p: SkullPlacement, cell: number): WallSkull {
  const { vw, vh, perspective: P, eyeY, depthPx } = cam;
  const halfW = vw / 2;
  const lean = (delta: number) => halfW / (halfW - delta) - 1; // t − 1

  const dc = p.d;
  const yc = eyeY + (p.sy - vh / 2) / (P / (P + dc));
  const wh = p.height;
  const ww = wh * CROP_ASPECT * p.stretch;

  const dLo = dc - ww / 2;
  const dHi = dc + ww / 2;
  const yLo = yc - wh / 2;
  const yHi = yc + wh / 2;
  const leanD = lean(p.push) * (P + dHi);
  const leanY = lean(p.push) * Math.max(Math.abs(yLo - eyeY), Math.abs(yHi - eyeY));
  const dMin = Math.max(0, dLo);
  const dMax = Math.min(depthPx, dHi + leanD);
  const [wx0, wx1] = p.side === "left" ? [dMin, dMax] : [depthPx - dMax, depthPx - dMin];
  const x0 = Math.floor(wx0 / cell) * cell - cell;
  const x1 = Math.ceil(wx1 / cell) * cell + cell;
  const y0 = Math.floor((yLo - leanY) / cell) * cell - cell;
  const y1 = Math.ceil((yHi + leanY) / cell) * cell + cell;

  const depthAt = (x: number) => (p.side === "left" ? x : depthPx - x);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const field: DepthSource = {
    sample(u, v) {
      const d = depthAt(lerp(x0, x1, u));
      const y = lerp(y0, y1, v);
      const uu = (d - dc) / ww + 0.5;
      const vv = (y - yc) / wh + 0.5;
      if (uu < 0 || uu > 1 || vv < 0 || vv > 1) return 0;
      const h = source.sample(CROP.x0 + uu * (CROP.x1 - CROP.x0), CROP.y0 + vv * (CROP.y1 - CROP.y0));
      // The picture is a soft blur. Cut a crisp silhouette out of it and keep the picture as the
      // relief inside, so the skull stands out with defined edges instead of melting into the wall.
      return smoothstep(0.1, 0.16, h) * (0.3 + 0.7 * h);
    },
  };

  return {
    x0,
    x1,
    y0,
    y1,
    field,
    displace(lx, ly, delta) {
      const d = depthAt(x0 + lx);
      const t1 = lean(delta);
      // Canvas x runs with depth on the left wall, against it on the right wall.
      return { x: t1 * (P + d) * (p.side === "left" ? 1 : -1), y: t1 * (y0 + ly - eyeY) };
    },
  };
}
