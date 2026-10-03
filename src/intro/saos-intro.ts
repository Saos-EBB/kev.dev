import gsap from "gsap";
import "./saos-intro.css";
import { UI } from "../i18n/ui";

// Intro overlay: a "SAOS" still that shatters like glass (or slides away)
// and reveals the hero underneath. Faked physics — the shard pattern is
// baked once below, GSAP only tweens 21 divs. No runtime simulation.

export type IntroMode = "shatter" | "slide";

// Baked once (seeded radial crack pattern around the impact point, 7 rays
// x 3 rings), in percent of the screen. Together they cover the full
// 100x100 area without gaps. Not generated per run on purpose.
const SHARDS: [number, number][][] = [
  [[50, 46], [61.7, 44.9], [53.2, 57.3]],
  [[61.7, 44.9], [76.4, 43.5], [58.2, 75.4], [53.2, 57.3]],
  [[76.4, 43.5], [100, 41.2], [100, 100], [65.1, 100], [58.2, 75.4]],
  [[50, 46], [53.2, 57.3], [47, 56.3]],
  [[53.2, 57.3], [58.2, 75.4], [41.4, 75.1], [47, 56.3]],
  [[58.2, 75.4], [65.1, 100], [34.2, 100], [41.4, 75.1]],
  [[50, 46], [47, 56.3], [39.6, 50.8]],
  [[47, 56.3], [41.4, 75.1], [29.4, 55.4], [39.6, 50.8]],
  [[41.4, 75.1], [34.2, 100], [0, 100], [0, 68.9], [29.4, 55.4]],
  [[50, 46], [39.6, 50.8], [41.8, 38.4]],
  [[39.6, 50.8], [29.4, 55.4], [27.8, 25.5], [41.8, 38.4]],
  [[29.4, 55.4], [0, 68.9], [0, 0], [0.3, 0], [27.8, 25.5]],
  [[50, 46], [41.8, 38.4], [49.6, 33.9]],
  [[41.8, 38.4], [27.8, 25.5], [49.1, 18.4], [49.6, 33.9]],
  [[27.8, 25.5], [0.3, 0], [48.5, 0], [49.1, 18.4]],
  [[50, 46], [49.6, 33.9], [56.3, 39.3]],
  [[49.6, 33.9], [49.1, 18.4], [72.7, 21.9], [56.3, 39.3]],
  [[49.1, 18.4], [48.5, 0], [93.4, 0], [72.7, 21.9]],
  [[50, 46], [56.3, 39.3], [61.7, 44.9]],
  [[56.3, 39.3], [72.7, 21.9], [76.4, 43.5], [61.7, 44.9]],
  [[72.7, 21.9], [93.4, 0], [100, 0], [100, 41.2], [76.4, 43.5]],
];

const IMPACT = { x: 50, y: 46 }; // percent, matches the pattern's center

// Deliberately lighter than --color-bg (the hero underneath): the shards
// carry this fill in their snapshot, so without the contrast the break is
// invisible against the hero. Keep in sync with .saos-intro-still's
// background-color in saos-intro.css (the fallback shown before the
// snapshot image loads).
const INTRO_BG = "#161616";

// Same stable "random" per shard on every run — deterministic, no Math.random.
function shardNoise(i: number, salt: number): number {
  const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v); // 0..1
}

interface StillOptions {
  /** Draw the wordmark in muted grey instead of accent (loader: not-yet-ready state). */
  gray?: boolean;
  /** Hint text below the wordmark. Default: "KLICKEN". */
  hint?: string;
}

// The still: background, faint grid, wordmark and a hint, drawn on a canvas
// so we can grab it as one image. gray=true is used by the loader to draw
// the "not yet loaded" version; the colored version is the same call without
// the flag (same data-URL reused for both the classic intro and the fill layer).
function drawStill(width: number, height: number, opts: StillOptions = {}): string {
  return drawStillCanvas(width, height, opts).toDataURL();
}

function drawStillCanvas(width: number, height: number, opts: StillOptions = {}): HTMLCanvasElement {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue("--color-accent").trim() || "#cd57a6";
  const muted = css.getPropertyValue("--color-text-muted").trim() || "#8a8a93";
  const cell = parseFloat(css.getPropertyValue("--grid-cell")) || 48;
  const display = css.getPropertyValue("--font-display").trim() || "sans-serif";

  ctx.fillStyle = INTRO_BG;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = accent;
  ctx.globalAlpha = opts.gray ? 0.05 : 0.12;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += cell) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += cell) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Gray mode: very dim wordmark so the colored fill layer reads clearly on top.
  ctx.fillStyle = opts.gray ? "#2e2c36" : accent;
  const size = Math.min(width * 0.32, height * 0.4);
  ctx.font = `${size}px ${display}`;
  ctx.fillText("SAOS", width / 2, (height * IMPACT.y) / 100);

  ctx.fillStyle = opts.gray ? "#1e1c24" : muted;
  ctx.font = `${Math.max(12, Math.min(width * 0.018, 16))}px ${display}`;
  ctx.fillText(opts.hint ?? UI.introClick, width / 2, height * 0.86);

  return canvas;
}

export function mountSaosIntro(
  overlayEl: HTMLElement,
  onComplete: () => void,
  mode: IntroMode = "shatter",
): () => void {
  let destroyed = false;
  let triggered = false;
  let tween: gsap.core.Animation | null = null;

  overlayEl.classList.add("saos-intro");
  overlayEl.classList.add("is-active");
  overlayEl.setAttribute("role", "button");
  overlayEl.setAttribute("tabindex", "0");
  overlayEl.setAttribute("aria-label", UI.introSkip);

  const still = document.createElement("div");
  still.className = "saos-intro-still";
  overlayEl.appendChild(still);

  // The wordmark uses the display font — draw the still only once it's in.
  document.fonts.load("100px 'Koeeya Trial'").finally(() => {
    if (destroyed) return;
    still.style.backgroundImage = `url(${drawStill(window.innerWidth, window.innerHeight, {})})`;
  });

  function finish() {
    if (!destroyed) onComplete();
  }

  function slideAway() {
    tween = gsap.to(overlayEl, {
      yPercent: -100,
      duration: 0.9,
      ease: "power3.inOut",
      onComplete: finish,
    });
  }

  function shatter() {
    const image = still.style.backgroundImage;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const shards = SHARDS.map((poly, i) => {
      const cx = poly.reduce((sum, p) => sum + p[0], 0) / poly.length;
      const cy = poly.reduce((sum, p) => sum + p[1], 0) / poly.length;
      const el = document.createElement("div");
      el.className = "saos-intro-shard";
      el.style.backgroundImage = image;
      el.style.clipPath = `polygon(${poly.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
      el.style.transformOrigin = `${cx}% ${cy}%`;
      overlayEl.appendChild(el);
      return { el, i, cx, cy };
    });
    still.remove();

    const tl = gsap.timeline({ onComplete: finish });
    tween = tl;

    for (const { el, i, cx, cy } of shards) {
      // Direction away from the impact point, in px.
      const dx = ((cx - IMPACT.x) / 100) * w;
      const dy = ((cy - IMPACT.y) / 100) * h;
      const dist = Math.hypot(cx - IMPACT.x, cy - IMPACT.y);

      // Stagger = resistance: shards near the impact let go first.
      const start = dist * 0.006 + shardNoise(i, 1) * 0.08;
      const duration = 1.1 + shardNoise(i, 2) * 0.5;
      const spin = (shardNoise(i, 3) - 0.5) * 2; // -1..1

      // Gravity: y eases IN, so shards hang for a beat and then drop.
      tl.to(el, { y: h * (0.9 + shardNoise(i, 4) * 0.5) + dy * 0.3, duration, ease: "power2.in" }, start);
      tl.to(el, { x: dx * 0.5 + spin * 60, duration, ease: "power1.out" }, start);
      tl.to(el, { rotation: spin * 70, scale: 0.85, duration, ease: "power1.in" }, start);
      tl.to(el, { opacity: 0, duration: duration * 0.5, ease: "power1.in" }, start + duration * 0.5);
    }
  }

  function trigger() {
    // Ignore clicks until the still exists — the shards copy its image.
    if (triggered || destroyed || !still.style.backgroundImage) return;
    triggered = true;
    // The hero underneath is usable right away; only the pieces are in the way.
    overlayEl.classList.remove("is-active");
    overlayEl.removeAttribute("tabindex");
    overlayEl.removeAttribute("role");
    if (mode === "slide") slideAway();
    else shatter();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trigger();
    }
  }

  overlayEl.addEventListener("click", trigger);
  overlayEl.addEventListener("keydown", onKeyDown);
  overlayEl.focus({ preventScroll: true });

  return function destroy() {
    destroyed = true;
    overlayEl.removeEventListener("click", trigger);
    overlayEl.removeEventListener("keydown", onKeyDown);
    tween?.kill();
    gsap.killTweensOf(overlayEl);
    overlayEl.replaceChildren();
    overlayEl.classList.remove("saos-intro", "is-active");
    overlayEl.removeAttribute("role");
    overlayEl.removeAttribute("tabindex");
    overlayEl.removeAttribute("aria-label");
    overlayEl.style.transform = "";
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loader mode: the intro stays until the page is genuinely ready, auto-shatters
// once full instead of waiting for a click. Shows loading progress as colour
// poured into the gray wordmark: a liquid in the site's gradient rises inside
// the letters with a wavy surface that calms down as it fills.
//
// The level follows the real progress but never rises faster than MIN_MS
// end to end — a fast load still gets the full pour (at least 2 s).
//
// Usage:
//   const { setProgress } = mountSaosLoader(overlayEl, onShatterDone);
//   setProgress(0.35); // fonts ready
//   setProgress(1.0);  // the pour finishes, then the shatter fires
// ─────────────────────────────────────────────────────────────────────────────
const MIN_MS = 2000;
const SETTLE_MS = 220; // brief beat at full before the shatter

export function mountSaosLoader(
  overlayEl: HTMLElement,
  onShatterDone: () => void,
): { setProgress: (p: number) => void } {
  let destroyed = false;
  let shatterFired = false;
  let currentProgress = 0;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  let raf = 0;

  overlayEl.classList.add("saos-intro");
  // Not .is-active — loader is not interactive (no click to dismiss).

  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // One canvas paints everything (gray still + liquid) every frame, so the
  // shatter can simply snapshot it.
  const canvas = document.createElement("canvas");
  canvas.className = "saos-intro-still saos-intro-pour";
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  overlayEl.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  // The liquid layer: letters in black, then the liquid composited into them.
  const liquid = document.createElement("canvas");
  liquid.width = canvas.width;
  liquid.height = canvas.height;
  const lctx = liquid.getContext("2d")!;

  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue("--color-accent").trim() || "#cd57a6";
  const line = css.getPropertyValue("--color-line").trim() || "#cd57ff";
  const blue = css.getPropertyValue("--note-3").trim() || "#57b9ff";
  const display = css.getPropertyValue("--font-display").trim() || "sans-serif";
  const size = Math.min(w * 0.32, h * 0.4);
  const textY = (h * IMPACT.y) / 100;

  // Gray still and letter bounds. NOT gated on font loading (on mobile the
  // font can arrive after window.load) — drawn now with whatever font is
  // there, redrawn once fonts settle.
  let base: HTMLCanvasElement;
  let top = 0, bottom = 0, left = 0, right = 0;
  function prepare() {
    base = drawStillCanvas(w, h, { gray: true, hint: UI.introLoading });
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.font = `${size}px ${display}`;
    lctx.textAlign = "center";
    lctx.textBaseline = "middle";
    const m = lctx.measureText("SAOS");
    top = textY - m.actualBoundingBoxAscent;
    bottom = textY + m.actualBoundingBoxDescent;
    left = w / 2 - m.width / 2;
    right = w / 2 + m.width / 2;
  }
  prepare();
  document.fonts.ready.then(() => { if (!destroyed && !shatterFired) prepare(); });

  // Surface height at x: the level line plus two travelling sines, calmer
  // the fuller it gets. level 0 sits just below the letters, 1 just above.
  const wave = (2 * Math.PI) / (size * 1.4);
  function surface(level: number, t: number) {
    const amp = size * (0.03 * (1 - level ** 3) + 0.006);
    const y0 = bottom + 8 - (bottom - top + 28) * level;
    return (x: number) =>
      y0 + Math.sin(x * wave + t * 3.1) * amp + Math.sin(x * wave * 2.3 - t * 4.7) * amp * 0.45;
  }

  function render(level: number, t: number) {
    lctx.globalCompositeOperation = "source-over";
    lctx.clearRect(0, 0, w, h);
    lctx.fillStyle = "#000";
    lctx.fillText("SAOS", w / 2, textY);

    const surf = surface(level, t);
    lctx.globalCompositeOperation = "source-in";
    const grad = lctx.createLinearGradient(left, 0, right, 0);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.5, line);
    grad.addColorStop(1, blue);
    lctx.fillStyle = grad;
    lctx.beginPath();
    lctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) lctx.lineTo(x, surf(x));
    lctx.lineTo(w, h);
    lctx.closePath();
    lctx.fill();

    // Bright meniscus along the surface — atop, so it stays inside the
    // letters without wiping the liquid (source-in would).
    lctx.globalCompositeOperation = "source-atop";
    lctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    lctx.lineWidth = 2;
    lctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      if (x === 0) lctx.moveTo(x, surf(x));
      else lctx.lineTo(x, surf(x));
    }
    lctx.stroke();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.shadowColor = "rgba(205, 87, 255, 0.45)";
    ctx.shadowBlur = 18 * dpr;
    ctx.drawImage(liquid, 0, 0);
    ctx.restore();
  }

  // Level: real progress, capped at elapsed / MIN_MS, smoothed (frame-rate
  // independent) so milestone jumps pour in instead of snapping.
  const start = performance.now();
  let last = start;
  let shown = 0;
  function frame() {
    if (destroyed || shatterFired) return;
    // performance.now(), not the rAF timestamp: the first callback can carry
    // a frame time from before the loader mounted (negative dt).
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const target = Math.min(currentProgress, (now - start) / MIN_MS, 1);
    shown += (target - shown) * (1 - Math.exp(-dt * 8));
    if (target >= 1 && shown > 0.97) shown = 1;
    render(shown, (now - start) / 1000);
    if (shown >= 1) settleTimer ??= setTimeout(triggerShatter, SETTLE_MS);
    else raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // Escape / Space = emergency skip in case loading hangs.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" || e.key === " ") {
      e.preventDefault();
      triggerShatter();
    }
  }
  document.addEventListener("keydown", onKeyDown);

  function triggerShatter() {
    if (shatterFired || destroyed) return;
    shatterFired = true;
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", onKeyDown);

    // The shards carry the pour canvas as it stands (full, normally).
    const image = `url(${canvas.toDataURL()})`;
    const shards = SHARDS.map((poly, i) => {
      const cx = poly.reduce((sum, p) => sum + p[0], 0) / poly.length;
      const cy = poly.reduce((sum, p) => sum + p[1], 0) / poly.length;
      const el = document.createElement("div");
      el.className = "saos-intro-shard";
      el.style.backgroundImage = image;
      el.style.clipPath = `polygon(${poly.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
      el.style.transformOrigin = `${cx}% ${cy}%`;
      overlayEl.appendChild(el);
      return { el, i, cx, cy };
    });
    canvas.remove();

    const tl = gsap.timeline({ onComplete: () => { if (!destroyed) onShatterDone(); } });

    for (const { el, i, cx, cy } of shards) {
      const dx = ((cx - IMPACT.x) / 100) * w;
      const dy = ((cy - IMPACT.y) / 100) * h;
      const dist = Math.hypot(cx - IMPACT.x, cy - IMPACT.y);
      const start = dist * 0.006 + shardNoise(i, 1) * 0.08;
      const duration = 1.1 + shardNoise(i, 2) * 0.5;
      const spin = (shardNoise(i, 3) - 0.5) * 2;
      tl.to(el, { y: h * (0.9 + shardNoise(i, 4) * 0.5) + dy * 0.3, duration, ease: "power2.in" }, start);
      tl.to(el, { x: dx * 0.5 + spin * 60, duration, ease: "power1.out" }, start);
      tl.to(el, { rotation: spin * 70, scale: 0.85, duration, ease: "power1.in" }, start);
      tl.to(el, { opacity: 0, duration: duration * 0.5, ease: "power1.in" }, start + duration * 0.5);
    }
  }

  function setProgress(p: number) {
    // Monotone: progress only ever goes forward. The frame loop pours it in.
    if (destroyed || shatterFired || p <= currentProgress) return;
    currentProgress = p;
  }

  return { setProgress };
}
