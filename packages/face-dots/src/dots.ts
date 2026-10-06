// Image -> particles. Any image with transparency (e.g. from photoToFace)
// is sampled on a grid; every non-transparent sample becomes a dot (or an
// ASCII character) sized by its brightness. Each particle sits on a spring
// at its home spot: the pointer pushes them away, they fly back. Nothing
// runs once everything has settled.

export type DotsMode = "dots" | "ascii";

export interface DotsOptions {
  mode?: DotsMode;
  /** Who may push the particles: "all" (mouse + touch), "mouse", or "none". */
  interactive?: "all" | "mouse" | "none";
  /** Share of the canvas the image may fill, 0..1. */
  fit?: number;
  /** Grid columns across the image (dots mode); ASCII uses ~2/3 of it. */
  columns?: number;
  /** Characters dark to bright for ASCII mode. */
  ascii?: string;
  /** Push radius in css px. */
  pushRadius?: number;
}

export interface FaceDots {
  setImage(image: HTMLCanvasElement, opts?: { scatter?: boolean }): void;
  setMode(mode: DotsMode): void;
  /** Throws all particles off-screen; they fly back in. */
  scatter(): void;
  destroy(): void;
}

const SPRING = 0.06;
const DAMPING = 0.84;
const PUSH_FORCE = 9;
const BUCKETS = 16; // colors are quantized so a frame is ~16 fill calls

export function createFaceDots(canvas: HTMLCanvasElement, options: DotsOptions = {}): FaceDots {
  const ctx = canvas.getContext("2d")!;
  const fit = options.fit ?? 0.9;
  const columns = options.columns ?? 100;
  const ascii = options.ascii ?? " .:-=+*#%@";
  const pushRadius = options.pushRadius ?? 80;
  const interactive = options.interactive ?? "all";
  let mode: DotsMode = options.mode ?? "dots";
  let image: HTMLCanvasElement | null = null;

  let count = 0;
  let hx = new Float32Array(0), hy = new Float32Array(0);
  let x = new Float32Array(0), y = new Float32Array(0);
  let vx = new Float32Array(0), vy = new Float32Array(0);
  let size = new Float32Array(0);
  let bucket = new Uint8Array(0);
  let palette: string[] = [];
  let step = 6;
  let width = 0, height = 0;
  let pointer: { x: number; y: number } | null = null;
  let running = false;
  let destroyed = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (image) build(false);
  }

  function scatterAll() {
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.max(width, height) * (0.5 + Math.random() * 0.6);
      x[k] = width / 2 + Math.cos(a) * d;
      y[k] = height / 2 + Math.sin(a) * d;
      vx[k] = vy[k] = 0;
    }
    wake();
  }

  function build(scatter: boolean) {
    if (!image || !width || !height) return;
    const aspect = image.width / image.height;
    const boxW = Math.min(width * fit, height * fit * aspect);
    const boxH = boxW / aspect;
    const left = (width - boxW) / 2;
    const top = (height - boxH) / 2;
    step = boxW / (mode === "ascii" ? Math.round(columns * 0.68) : columns);

    const cols = Math.max(1, Math.floor(boxW / step));
    const rows = Math.max(1, Math.floor(boxH / step));
    const sample = document.createElement("canvas");
    sample.width = cols;
    sample.height = rows;
    const sctx = sample.getContext("2d", { willReadFrequently: true })!;
    sctx.drawImage(image, 0, 0, cols, rows);
    const px = sctx.getImageData(0, 0, cols, rows).data;

    const keep: number[] = [];
    for (let i = 0; i < cols * rows; i++) if (px[i * 4 + 3] > 40) keep.push(i);
    const old = { x, y };
    count = keep.length;
    hx = new Float32Array(count); hy = new Float32Array(count);
    x = new Float32Array(count); y = new Float32Array(count);
    vx = new Float32Array(count); vy = new Float32Array(count);
    size = new Float32Array(count);
    bucket = new Uint8Array(count);

    const sums = Array.from({ length: BUCKETS }, () => [0, 0, 0, 0]);
    keep.forEach((cell, k) => {
      hx[k] = left + ((cell % cols) + 0.5) * step;
      hy[k] = top + (((cell / cols) | 0) + 0.5) * step;
      const r = px[cell * 4], g = px[cell * 4 + 1], b = px[cell * 4 + 2];
      const l = ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * (px[cell * 4 + 3] / 255);
      size[k] = l;
      const bk = Math.min(BUCKETS - 1, Math.floor(l * BUCKETS));
      bucket[k] = bk;
      sums[bk][0] += r; sums[bk][1] += g; sums[bk][2] += b; sums[bk][3]++;
      // Switching image or mode: start from wherever the old particles were.
      if (k < old.x.length) { x[k] = old.x[k]; y[k] = old.y[k]; }
      else { x[k] = hx[k]; y[k] = hy[k]; }
    });
    palette = sums.map(([r, g, b, n]) => (n ? `rgb(${(r / n) | 0}, ${(g / n) | 0}, ${(b / n) | 0})` : "#000"));
    if (scatter) scatterAll();
    else wake();
  }

  function frame() {
    if (destroyed) return;
    let moving = false;
    const r2 = pushRadius * pushRadius;
    for (let i = 0; i < count; i++) {
      let ax = (hx[i] - x[i]) * SPRING;
      let ay = (hy[i] - y[i]) * SPRING;
      if (pointer) {
        const dx = x[i] - pointer.x, dy = y[i] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / pushRadius) * PUSH_FORCE;
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
          const ch = ascii[Math.min(ascii.length - 1, Math.round(size[i] * (ascii.length - 1)))];
          if (ch !== " ") ctx.fillText(ch, x[i], y[i]);
        }
      }
    }

    if (moving || pointer) requestAnimationFrame(frame);
    else running = false;
  }

  function wake() {
    if (running || destroyed) return;
    running = true;
    requestAnimationFrame(frame);
  }

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const allowed = (e: PointerEvent) =>
    interactive === "all" || (interactive === "mouse" && e.pointerType === "mouse");
  const onMove = (e: PointerEvent) => {
    if (!allowed(e) || (e.pointerType !== "mouse" && e.buttons === 0)) return;
    pointer = local(e);
    wake();
  };
  const onDown = (e: PointerEvent) => {
    if (!allowed(e)) return;
    pointer = local(e);
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") pointer = null;
  };
  const onLeave = () => (pointer = null);
  if (interactive !== "none") {
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("pointerleave", onLeave);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  return {
    setImage(img, opts) {
      image = img;
      build(opts?.scatter ?? false);
    },
    setMode(m) {
      mode = m;
      build(false);
    },
    scatter: scatterAll,
    destroy() {
      destroyed = true;
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerleave", onLeave);
    },
  };
}
