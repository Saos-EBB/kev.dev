// Depth source for the cloth grid.
//
// CONTRACT (this is the swap point):
//   A depth source is anything with `sample(u, v) -> number`, u/v in 0..1
//   (origin top-left), returning 0..1 where 1 = pushes furthest out.
//   It should already be smooth — the grid is only ~40×24, so sharp
//   features would alias.
//
// TODAY: procedural Gaussian bumps (see `proceduralDepth`).
//
// BAKED: `imageDepth(url)` loads a greyscale PNG made by bake-depth.mjs
//   (mesh -> z-buffer render -> blur). Expected PNG format:
//     - greyscale, white = comes out, black = flat
//     - heavily pre-blurred
//     - same aspect ratio as the grid area (5:3 for 40×24)
//   Pass the result as the third argument of `mountClothGrid`.

import type { Bump } from "./config";

export interface DepthSource {
  sample(u: number, v: number): number;
}

export function proceduralDepth(bumps: Bump[]): DepthSource {
  return {
    sample(u, v) {
      let h = 0;
      for (const b of bumps) {
        const dx = (u - b.cx) / b.sx;
        const dy = (v - b.cy) / b.sy;
        h += b.amp * Math.exp(-(dx * dx + dy * dy) / 2);
      }
      return h;
    },
  };
}

/** Loads a baked greyscale PNG (see above) as a depth source, sampled bilinearly. */
export async function imageDepth(url: string): Promise<DepthSource> {
  const img = new Image();
  img.src = url;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = (x: number, y: number) => data[(y * width + x) * 4] / 255; // red channel

  return {
    sample(u, v) {
      const x = Math.min(width - 1, Math.max(0, u * (width - 1)));
      const y = Math.min(height - 1, Math.max(0, v * (height - 1)));
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(width - 1, x0 + 1);
      const y1 = Math.min(height - 1, y0 + 1);
      const fx = x - x0;
      const fy = y - y0;
      const top = px(x0, y0) * (1 - fx) + px(x1, y0) * fx;
      const bottom = px(x0, y1) * (1 - fx) + px(x1, y1) * fx;
      return top * (1 - fy) + bottom * fy;
    },
  };
}

/**
 * Samples the source once per grid point (row-major, cols*rows), blurs it
 * and renormalises to max 1, so `maxPush` always means "px at the highest point".
 */
export function sampleDepthGrid(
  source: DepthSource,
  cols: number,
  rows: number,
  blurPasses: number,
): Float32Array {
  let field: Float32Array = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      field[r * cols + c] = source.sample(c / (cols - 1), r / (rows - 1));
    }
  }
  for (let i = 0; i < blurPasses; i++) field = boxBlur(field, cols, rows);

  let max = 0;
  for (const v of field) max = Math.max(max, v);
  if (max > 0) for (let i = 0; i < field.length; i++) field[i] /= max;
  return field;
}

function boxBlur(src: Float32Array, cols: number, rows: number): Float32Array {
  const out = new Float32Array(src.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          sum += src[rr * cols + cc];
          count++;
        }
      }
      out[r * cols + c] = sum / count;
    }
  }
  return out;
}
