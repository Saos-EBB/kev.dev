// Cloth grid: a canvas-2D line grid that a relief pushes through from behind.
// Pure function of (canvas, config) — no globals, no scroll listeners. The
// host feeds Lenis progress in via `setProgress`, and calls `destroy` to clean up.
//
// Draws only while something is moving (band active / spring settling),
// idle otherwise.

import type { ClothConfig } from "./config";
import { proceduralDepth, sampleDepthGrid, type DepthSource } from "./depth-map";
import { computeSlopes } from "./lighting";
import { createPushSpring } from "./push-strength";

export interface ClothGrid {
  /** Scroll progress 0..1 (Lenis). `snap` skips the spring (debug / first paint). */
  setProgress(progress: number, snap?: boolean): void;
  destroy(): void;
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ANTIQUEWHITE: RGB = hexToRgb("#faebd7");
const MEDIUMPURPLE: RGB = hexToRgb("#9370db");

/** `depthSource` defaults to the procedural bumps from config. */
export function mountClothGrid(
  canvas: HTMLCanvasElement,
  config: ClothConfig,
  depthSource: DepthSource = proceduralDepth(config.depth.bumps),
): ClothGrid {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cloth-grid: 2d context unavailable");

  const { cols, rows, lines, light } = config;
  const n = cols * rows;

  // --- static per-point data (computed once) -------------------------------
  const depth = sampleDepthGrid(depthSource, cols, rows, config.depth.blurPasses);
  const slopes = computeSlopes(depth, cols, rows, light);
  const spring = createPushSpring(config);

  const baseRgb = hexToRgb(lines.color);
  const tintRgb: RGB = [
    lerp(ANTIQUEWHITE[0], MEDIUMPURPLE[0], light.tintMix),
    lerp(ANTIQUEWHITE[1], MEDIUMPURPLE[1], light.tintMix),
    lerp(ANTIQUEWHITE[2], MEDIUMPURPLE[2], light.tintMix),
  ];
  const liftLen = Math.hypot(config.lift.x, config.lift.y) || 1;
  const liftX = config.lift.x / liftLen;
  const liftY = config.lift.y / liftLen;

  // --- layout (rest positions, CSS px) --------------------------------------
  const restX = new Float32Array(n);
  const restY = new Float32Array(n);
  const posX = new Float32Array(n);
  const posY = new Float32Array(n);

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mx = w * config.margin;
    const my = h * config.margin;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        restX[r * cols + c] = mx + ((w - 2 * mx) * c) / (cols - 1);
        restY[r * cols + c] = my + ((h - 2 * my) * r) / (rows - 1);
      }
    }
  }

  // --- drawing ---------------------------------------------------------------
  // Thousands of segments, so they are not stroked one by one: each gets a
  // bucket from its (highlight, edge) pair and every bucket is one path.
  const T_LEVELS = 16;
  const E_LEVELS = 6;
  const segCount = (cols - 1) * rows + cols * (rows - 1);
  const segA = new Int32Array(segCount);
  const segB = new Int32Array(segCount);
  const segBucket = new Uint8Array(segCount);
  {
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (c < cols - 1) { segA[k] = i; segB[k++] = i + 1; }
        if (r < rows - 1) { segA[k] = i; segB[k++] = i + cols; }
      }
    }
  }

  function assignBuckets(s: number) {
    for (let k = 0; k < segCount; k++) {
      const i = segA[k];
      const j = segB[k];
      // Light term flips sign with s, so a brief dip lights the opposite flanks.
      const t = Math.min(light.highlightCap, Math.max(0, ((slopes.lit[i] + slopes.lit[j]) / 2) * s));
      const edge = Math.min(1, ((slopes.edge[i] + slopes.edge[j]) / 2) * Math.abs(s));
      const ti = Math.round((t / light.highlightCap) * (T_LEVELS - 1));
      const ei = Math.round(edge * (E_LEVELS - 1));
      segBucket[k] = ti * E_LEVELS + ei;
    }
  }

  function strokeBucket(bucket: number) {
    const t = ((bucket / E_LEVELS) | 0) / (T_LEVELS - 1) * light.highlightCap;
    const edge = (bucket % E_LEVELS) / (E_LEVELS - 1);
    const red = lerp(baseRgb[0], tintRgb[0], t);
    const green = lerp(baseRgb[1], tintRgb[1], t);
    const blue = lerp(baseRgb[2], tintRgb[2], t);
    const alpha = Math.min(1, lerp(lines.baseAlpha, lines.peakAlpha, t) + lines.edgeAlpha * edge);

    ctx!.lineWidth = lines.width * (1 + lines.edgeWidth * edge);
    ctx!.strokeStyle = `rgba(${red | 0},${green | 0},${blue | 0},${alpha.toFixed(3)})`;
    ctx!.beginPath();
    let any = false;
    for (let k = 0; k < segCount; k++) {
      if (segBucket[k] !== bucket) continue;
      ctx!.moveTo(posX[segA[k]], posY[segA[k]]);
      ctx!.lineTo(posX[segB[k]], posY[segB[k]]);
      any = true;
    }
    if (any) ctx!.stroke();
  }

  function draw() {
    const s = spring.value;
    ctx!.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Displace: lift along `lift` by depth, plus a bulge — slide away from
    // the bump centre (= against the uphill gradient), steepest at the flanks.
    for (let i = 0; i < n; i++) {
      const push = depth[i] * s * config.maxPush;
      const bulge = config.radialPush * s;
      posX[i] = restX[i] + liftX * push - slopes.gx[i] * bulge;
      posY[i] = restY[i] + liftY * push - slopes.gy[i] * bulge;
    }

    assignBuckets(s);
    ctx!.lineCap = "round";
    for (let bucket = 0; bucket < T_LEVELS * E_LEVELS; bucket++) strokeBucket(bucket);
  }

  // --- loop: runs only until the spring has settled --------------------------
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
  resizeObserver.observe(canvas);
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
