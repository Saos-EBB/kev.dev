// Test page (/testModel): Kevin's face as a 3D wireframe. The mesh comes
// from scripts/head-mesh.py — MediaPipe's 478 face landmarks per photo,
// several photos aligned onto the frontal one and averaged — and is drawn
// with the same math as the renderer project (src/projects/widgets/
// renderer.ts): perspective divide, rotation, 16-step depth shading on a
// plain 2D canvas, no graphics library.

import "./head-model.css";

interface Model {
  vs: { x: number; y: number; z: number }[];
  fs: number[][];
}

const loaders: Record<string, () => Promise<{ default: Model }>> = {
  fused: () => import("./models/head-fused.json"),
  front: () => import("./models/head-front.json"),
};

const CAMERA_DISTANCE = 2.6;
const DRAG_SPEED = 0.01; // radians per pixel
const SPIN_SPEED = 0.5; // radians per second while idle
// Near (bright) to far (dark): the renderer's blues (--shade-0..15).
const SHADES = Array.from({ length: 16 }, (_, i) => {
  const t = i / 15;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(0x89, 0x06)}, ${mix(0xbf, 0x26)}, ${mix(0xf5, 0x47)})`;
});

const canvas = document.querySelector<HTMLCanvasElement>(".head-canvas")!;
const ctx = canvas.getContext("2d")!;
const stats = document.querySelector<HTMLElement>("[data-stats]")!;
const modelButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-model]")];
const spinButton = document.querySelector<HTMLButtonElement>("[data-spin]")!;

let base = new Float32Array(0); // model vertices, untouched
let edges = new Uint32Array(0);
let yaw = 0;
let pitch = 0;
let spinning = true;

async function load(id: string) {
  modelButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.model === id)));
  const model = (await loaders[id]()).default;
  base = new Float32Array(model.vs.flatMap((v) => [v.x, v.y, v.z]));
  const seen = new Set<number>();
  const pairs: number[] = [];
  const n = model.vs.length;
  for (const f of model.fs) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      const key = a < b ? a * n + b : b * n + a;
      if (a === b || seen.has(key)) continue;
      seen.add(key);
      pairs.push(a, b);
    }
  }
  edges = Uint32Array.from(pairs);
  stats.textContent = `${n} Punkte · ${pairs.length / 2} Kanten`;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const n = base.length / 3;
  if (!n) return;

  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const proj = new Float32Array(n * 3);
  const scale = Math.min(w, h) * 1.05;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) {
    let x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    // yaw (around y), then pitch (around x)
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y1 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    x = x1; y = y1; z = z2 + CAMERA_DISTANCE;
    proj[i * 3] = w / 2 + (x / z) * scale;
    proj[i * 3 + 1] = h / 2 - (y / z) * scale;
    proj[i * 3 + 2] = z;
    if (z < lo) lo = z;
    if (z > hi) hi = z;
  }

  const buckets: number[][] = SHADES.map(() => []);
  for (let e = 0; e < edges.length; e += 2) {
    const t = ((proj[edges[e] * 3 + 2] + proj[edges[e + 1] * 3 + 2]) / 2 - lo) / (hi - lo || 1);
    buckets[Math.min(15, Math.floor(t * 16))].push(e);
  }
  ctx.lineWidth = Math.max(1, (window.devicePixelRatio || 1) * 0.8);
  for (let s = 15; s >= 0; s--) {
    ctx.strokeStyle = SHADES[s];
    ctx.beginPath();
    for (const e of buckets[s]) {
      const a = edges[e] * 3, b = edges[e + 1] * 3;
      ctx.moveTo(proj[a], proj[a + 1]);
      ctx.lineTo(proj[b], proj[b + 1]);
    }
    ctx.stroke();
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}
new ResizeObserver(resize).observe(canvas);

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (spinning && !dragging) yaw += SPIN_SPEED * dt;
  draw();
  requestAnimationFrame(frame);
}

let dragging = false;
let px = 0, py = 0;
canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  px = e.clientX;
  py = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  yaw += (e.clientX - px) * DRAG_SPEED;
  pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - py) * DRAG_SPEED));
  px = e.clientX;
  py = e.clientY;
});
const stop = () => (dragging = false);
canvas.addEventListener("pointerup", stop);
canvas.addEventListener("pointercancel", stop);

modelButtons.forEach((b) => b.addEventListener("click", () => load(b.dataset.model!)));
spinButton.addEventListener("click", () => {
  spinning = !spinning;
  spinButton.setAttribute("aria-pressed", String(spinning));
});

load("fused").then(() => requestAnimationFrame(frame));
