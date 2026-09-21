// A relief drawn as a mesh of flat quads on the wall's own grid corners. Only the raised quads
// are drawn — everything flat is the wall's CSS grid underneath, untouched, so there is no patch,
// no background and no seam: at the foot of the relief the quads coincide with the wall's cells.
// Quads are opaque (filled with the wall colour, edges in one solid line colour) and painted
// lowest first, so a raised part covers what it stands in front of instead of lines crossing.
//
// Pure function of (canvas, options) like the cloth grid: the host feeds Lenis progress in via
// `setProgress`; it only draws while the spring is moving.

import type { ClothConfig } from "../cloth-grid/config";
import { sampleDepthGrid, type DepthSource } from "../cloth-grid/depth-map";
import { computeSlopes } from "../cloth-grid/lighting";
import { createPushSpring } from "../cloth-grid/push-strength";

type RGB = [number, number, number];

export interface MeshPatchOptions {
  canvas: HTMLCanvasElement;
  /** Patch size in wall cells; vertices sit on the cell corners. */
  cols: number;
  rows: number;
  cell: number;
  /** Wall line width in px; the canvas is this much larger and vertices sit half of it in. */
  linePx: number;
  /** Height 0..1 over the patch (u, v), and how far full height stands out, px. */
  field: DepthSource;
  maxPush: number;
  /** Offset of a canvas-local point pushed `delta` px out of the wall. */
  displace(lx: number, ly: number, delta: number): { x: number; y: number };
  /** Spring, scroll band, light: the shared cloth settings. */
  cloth: ClothConfig;
  wallColor: RGB;
  lineColor: RGB;
  /** How much of the way from the wall colour to the line colour the edges get (solid, no alpha). */
  lineStrength: number;
  /** Same for the faces' fill, at rest and at full light. */
  faceStrength: { base: number; lit: number };
}

export interface MeshPatch {
  setProgress(progress: number, snap?: boolean): void;
  destroy(): void;
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

export function mountMeshPatch(o: MeshPatchOptions): MeshPatch {
  const ctx = o.canvas.getContext("2d");
  if (!ctx) throw new Error("mesh-patch: 2d context unavailable");
  const { cols, rows, cell, linePx, cloth } = o;
  const vc = cols + 1;
  const vr = rows + 1;
  const n = vc * vr;

  const depth = sampleDepthGrid(o.field, vc, vr, 0);
  const slopes = computeSlopes(depth, vc, vr, cloth.light);
  const spring = createPushSpring(cloth);

  // Raised quads only, lowest first (painter's order).
  const quads: number[] = [];
  const height = (q: number) => {
    const r = (q / cols) | 0;
    const c = q % cols;
    const i = r * vc + c;
    return Math.max(depth[i], depth[i + 1], depth[i + vc], depth[i + vc + 1]);
  };
  for (let q = 0; q < cols * rows; q++) if (height(q) > 0.01) quads.push(q);
  quads.sort((a, b) => height(a) - height(b));

  const restX = new Float32Array(n);
  const restY = new Float32Array(n);
  const posX = new Float32Array(n);
  const posY = new Float32Array(n);
  for (let r = 0; r < vr; r++) {
    for (let c = 0; c < vc; c++) {
      restX[r * vc + c] = linePx / 2 + c * cell;
      restY[r * vc + c] = linePx / 2 + r * cell;
    }
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    o.canvas.width = Math.round(o.canvas.clientWidth * dpr);
    o.canvas.height = Math.round(o.canvas.clientHeight * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const s = spring.value;
    ctx!.clearRect(0, 0, o.canvas.clientWidth, o.canvas.clientHeight);
    if (Math.abs(s) < 1e-3) return;

    for (let i = 0; i < n; i++) {
      const delta = depth[i] * s * o.maxPush;
      if (delta === 0) {
        posX[i] = restX[i];
        posY[i] = restY[i];
        continue;
      }
      const off = o.displace(restX[i], restY[i], delta);
      posX[i] = restX[i] + off.x;
      posY[i] = restY[i] + off.y;
    }

    ctx!.lineWidth = linePx * 1.2;
    ctx!.lineJoin = "round";
    for (const q of quads) {
      const i = ((q / cols) | 0) * vc + (q % cols);
      const j = i + 1;
      const k = i + vc + 1;
      const l = i + vc;
      // Light term flips sign with s; faces leaning toward the light get brighter, capped.
      const lit = Math.min(cloth.light.highlightCap, Math.max(0, ((slopes.lit[i] + slopes.lit[j] + slopes.lit[k] + slopes.lit[l]) / 4) * s));
      const t = lit / cloth.light.highlightCap;
      ctx!.fillStyle = css(mix(o.wallColor, o.lineColor, o.faceStrength.base + o.faceStrength.lit * t));
      ctx!.strokeStyle = css(mix(o.wallColor, o.lineColor, Math.min(1, o.lineStrength + 0.35 * t)));
      ctx!.beginPath();
      ctx!.moveTo(posX[i], posY[i]);
      ctx!.lineTo(posX[j], posY[j]);
      ctx!.lineTo(posX[k], posY[k]);
      ctx!.lineTo(posX[l], posY[l]);
      ctx!.closePath();
      ctx!.fill();
      ctx!.stroke();
    }
  }

  let raf = 0;
  let last = 0;
  function frame(now: number) {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    spring.step(dt);
    draw();
    raf = spring.settled ? 0 : requestAnimationFrame(frame);
  }
  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const resizeObserver = new ResizeObserver(() => {
    layout();
    draw();
  });
  resizeObserver.observe(o.canvas);
  layout();
  draw();

  return {
    setProgress(progress, snap = false) {
      spring.setProgress(progress, snap);
      if (snap) draw();
      else if (!spring.settled) wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    },
  };
}
