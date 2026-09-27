import gsap from "gsap";
import "./saos-intro.css";

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

// The still: background, faint grid, wordmark and a hint, drawn on a canvas
// so we can grab it as one image.
function drawStill(width: number, height: number): string {
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
  ctx.globalAlpha = 0.12;
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
  ctx.fillStyle = accent;
  const size = Math.min(width * 0.32, height * 0.4);
  ctx.font = `${size}px ${display}`;
  ctx.fillText("SAOS", width / 2, (height * IMPACT.y) / 100);

  ctx.fillStyle = muted;
  ctx.font = `${Math.max(12, Math.min(width * 0.018, 16))}px ${display}`;
  ctx.fillText("KLICKEN", width / 2, height * 0.86);

  return canvas.toDataURL();
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
  overlayEl.setAttribute("aria-label", "Intro überspringen und Seite öffnen");

  const still = document.createElement("div");
  still.className = "saos-intro-still";
  overlayEl.appendChild(still);

  // The wordmark uses the display font — draw the still only once it's in.
  document.fonts.load("100px 'Koeeya Trial'").finally(() => {
    if (destroyed) return;
    still.style.backgroundImage = `url(${drawStill(window.innerWidth, window.innerHeight)})`;
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
