// Test page (/testDots): Kevin's face as particles. The same duotoned
// face images as /testCloth are sampled on a grid; every sample becomes a
// dot (or an ASCII character) whose size follows the brightness. Each one
// sits on a spring at its home spot: a finger or the mouse pushes them
// away, they fly back. On load they fly in from scattered positions.
// Nothing runs once everything has settled.

import "./face-cloth.css";
import "./face-dots.css";

const canvas = document.querySelector<HTMLCanvasElement>(".dots-canvas")!;
const ctx = canvas.getContext("2d")!;
const hint = document.querySelector<HTMLElement>(".face-hint")!;
const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
const drop = document.querySelector<HTMLElement>(".face-drop")!;
const faceButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-face]")];
const modeButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-mode]")];

const SPRING = 0.06;
const DAMPING = 0.84;
const PUSH_RADIUS = 80; // css px
const PUSH_FORCE = 9;
const ASCII = " .:-=+*#%@";
const BUCKETS = 16; // colors are quantized so each frame is ~16 fill calls

type Mode = "dots" | "ascii";
let mode: Mode = "dots";
let texture: HTMLCanvasElement | null = null;

// Particle state, struct-of-arrays.
let count = 0;
let hx = new Float32Array(0), hy = new Float32Array(0);
let x = new Float32Array(0), y = new Float32Array(0);
let vx = new Float32Array(0), vy = new Float32Array(0);
let size = new Float32Array(0);
let bucket = new Uint8Array(0);
let palette: string[] = [];
let step = 6;

let dpr = 1;
let width = 0, height = 0;
let pointer: { x: number; y: number } | null = null;
let running = false;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (texture) build(false);
}

// Samples the texture into particles, fitted into the middle of the screen.
function build(scatter: boolean) {
  const tex = texture!;
  const boxW = Math.min(width * 0.9, height * 0.62 * (tex.width / tex.height));
  const boxH = boxW * (tex.height / tex.width);
  const left = (width - boxW) / 2;
  const top = (height - boxH) / 2 + height * 0.04;
  step = mode === "ascii" ? Math.max(5, boxW / 68) : Math.max(3.2, boxW / 100);

  const cols = Math.floor(boxW / step);
  const rows = Math.floor(boxH / step);
  const sample = document.createElement("canvas");
  sample.width = cols;
  sample.height = rows;
  const sctx = sample.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(tex, 0, 0, cols, rows);
  const px = sctx.getImageData(0, 0, cols, rows).data;

  const keep: number[] = [];
  for (let i = 0; i < cols * rows; i++) if (px[i * 4 + 3] > 40) keep.push(i);
  count = keep.length;
  const old = { x, y, n: x.length };
  hx = new Float32Array(count); hy = new Float32Array(count);
  x = new Float32Array(count); y = new Float32Array(count);
  vx = new Float32Array(count); vy = new Float32Array(count);
  size = new Float32Array(count);
  bucket = new Uint8Array(count);

  // Palette from the image's own colors, ordered dark to bright.
  const lum = (i: number) => (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
  const sums = Array.from({ length: BUCKETS }, () => [0, 0, 0, 0]);
  keep.forEach((cell, k) => {
    const c = cell % cols, r = (cell / cols) | 0;
    hx[k] = left + (c + 0.5) * step;
    hy[k] = top + (r + 0.5) * step;
    const l = lum(cell) * (px[cell * 4 + 3] / 255);
    size[k] = l;
    const b = Math.min(BUCKETS - 1, Math.floor(l * BUCKETS));
    bucket[k] = b;
    sums[b][0] += px[cell * 4]; sums[b][1] += px[cell * 4 + 1]; sums[b][2] += px[cell * 4 + 2]; sums[b][3]++;
    if (scatter) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.max(width, height) * (0.4 + Math.random() * 0.6);
      x[k] = width / 2 + Math.cos(a) * d;
      y[k] = height / 2 + Math.sin(a) * d;
    } else if (k < old.n) {
      // Switching photo/mode: start from wherever the old dots were.
      x[k] = old.x[k]; y[k] = old.y[k];
    } else {
      x[k] = hx[k]; y[k] = hy[k];
    }
  });
  palette = sums.map(([r, g, b, n]) => (n ? `rgb(${(r / n) | 0}, ${(g / n) | 0}, ${(b / n) | 0})` : "#000"));
  wake();
}

function frame() {
  let moving = false;
  const r2 = PUSH_RADIUS * PUSH_RADIUS;
  for (let i = 0; i < count; i++) {
    let ax = (hx[i] - x[i]) * SPRING;
    let ay = (hy[i] - y[i]) * SPRING;
    if (pointer) {
      const dx = x[i] - pointer.x, dy = y[i] - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < r2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (1 - d / PUSH_RADIUS) * PUSH_FORCE;
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
    }
    vx[i] = (vx[i] + ax) * DAMPING;
    vy[i] = (vy[i] + ay) * DAMPING;
    x[i] += vx[i];
    y[i] += vy[i];
    if (!moving && (Math.abs(vx[i]) > 0.02 || Math.abs(vy[i]) > 0.02 || Math.abs(hx[i] - x[i]) > 0.1)) moving = true;
  }

  ctx.clearRect(0, 0, width, height);
  if (mode === "dots") {
    for (let b = 0; b < BUCKETS; b++) {
      ctx.fillStyle = palette[b];
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        if (bucket[i] !== b) continue;
        const r = Math.max(0.45, size[i] * step * 0.6);
        ctx.moveTo(x[i] + r, y[i]);
        ctx.arc(x[i], y[i], r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  } else {
    ctx.font = `${Math.round(step * 1.25)}px ui-monospace, "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let b = 0; b < BUCKETS; b++) {
      ctx.fillStyle = palette[b];
      for (let i = 0; i < count; i++) {
        if (bucket[i] !== b) continue;
        const ch = ASCII[Math.min(ASCII.length - 1, Math.round(size[i] * (ASCII.length - 1)))];
        if (ch !== " ") ctx.fillText(ch, x[i], y[i]);
      }
    }
  }

  if (moving || pointer) requestAnimationFrame(frame);
  else running = false;
}

function wake() {
  if (running) return;
  running = true;
  requestAnimationFrame(frame);
}

async function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const tex = document.createElement("canvas");
  tex.width = img.naturalWidth;
  tex.height = img.naturalHeight;
  tex.getContext("2d")!.drawImage(img, 0, 0);
  return tex;
}

async function showPreset(name: string, scatter = false) {
  faceButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.face === name)));
  texture = await loadImage(`/test-cloth/face-${name}.webp`);
  build(scatter);
}

async function useFile(file: File | undefined) {
  if (!file || !file.type.startsWith("image/")) return;
  hint.textContent = "Wird freigestellt … (beim ersten Mal lädt das Modell, ~16 MB)";
  try {
    const { photoToFaceTexture } = await import("./face-process");
    texture = await photoToFaceTexture(file);
    faceButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    build(true);
    hint.textContent = "Fertig · wisch durchs Gesicht";
  } catch (err) {
    hint.textContent = `Hat nicht geklappt: ${err instanceof Error ? err.message : err}`;
  }
}

// Pointer: mouse pushes on hover, a finger while it's down.
const toLocal = (e: PointerEvent) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch" && e.buttons === 0) return;
  pointer = toLocal(e);
  wake();
});
canvas.addEventListener("pointerdown", (e) => {
  pointer = toLocal(e);
  wake();
});
const release = () => (pointer = null);
canvas.addEventListener("pointerup", (e) => e.pointerType === "touch" && release());
canvas.addEventListener("pointercancel", release);
canvas.addEventListener("pointerleave", release);

faceButtons.forEach((b) => b.addEventListener("click", () => showPreset(b.dataset.face!)));
modeButtons.forEach((b) =>
  b.addEventListener("click", () => {
    mode = b.dataset.mode as Mode;
    modeButtons.forEach((m) => m.setAttribute("aria-pressed", String(m === b)));
    if (texture) build(false);
  }),
);
input.addEventListener("change", () => useFile(input.files?.[0]));

let dragDepth = 0;
window.addEventListener("dragenter", (e) => { e.preventDefault(); dragDepth++; drop.hidden = false; });
window.addEventListener("dragleave", () => { if (--dragDepth <= 0) drop.hidden = true; });
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  drop.hidden = true;
  useFile(e.dataTransfer?.files[0]);
});

new ResizeObserver(resize).observe(canvas);
resize();
showPreset("front", true);
