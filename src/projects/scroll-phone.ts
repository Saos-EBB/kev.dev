// The one phone the three big cards share (kev.dev, YourBrand, TschoBBo).
// It stands still in the pinned project carousel while the cards slide past
// it: each card leaves a slot in its middle (.sp-slot) and the phone sits
// in the current card's slot, showing that card's app. It leans toward the
// pointer, its skeletons take a wave of color that runs with time, and a
// ring of light runs down the screen at every change. What an app shows,
// and how scrolling moves it, is each card's own (kevdev-phone.ts,
// yourbrand-card.ts, tschobbo-card.ts); the carousel brings the phone in
// and out and says which card is current (carousel.ts). Desktop only —
// the big cards don't exist under LITE.

import { hexToRgb } from "../colors";
import "./scroll-phone.css";

export const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !document.documentElement.classList.contains("force-motion");

// The phone around its apps (`<div class="sp-app" data-app="…">`).
export function phoneStage(apps: string): string {
  return `
    <div class="sp-stage">
      <span class="sp-sun" aria-hidden="true"></span>
      <div class="sp-rig" aria-hidden="true">
        ${[16, 12, 8, 4].map((z) => `<span class="sp-slab" style="transform: translateZ(-${z}px)"></span>`).join("")}
        <span class="sp-btn" style="top: 22%; height: 8%"></span>
        <span class="sp-btn" style="top: 33%; height: 12%"></span>
        <div class="sp-phone">
          <div class="sp-screen">
            <span class="sp-island"></span>
            <span class="sp-bar"><span>9:41</span><span class="sp-bar-r"></span></span>
            ${apps}
            <span class="sp-glass"></span>
            <span class="sp-rail"><b></b></span>
          </div>
        </div>
      </div>
      <p class="sp-note"></p>
    </div>`;
}

export const phoneApp = (id: string, inner: string) => `<div class="sp-app" data-app="${id}">${inner}</div>`;

const RIPPLE_MS = 650; // the ring's way from the top of the screen to the bottom
const WAVE_SLICES = 3;

export interface App {
  // The wave's colors, as #rrggbb.
  palette: () => string[];
  // Right side of the status bar, and a line under the phone.
  bar: string;
  note?: string;
  // Moves the wave along with the content (scroll position, step).
  shift?: () => number;
  // Every frame while this app is on the phone; t in seconds, 0 under
  // reduced motion.
  frame?: (now: number, t: number) => void;
  // Each time the app comes onto the phone.
  shown?: () => void;
}

export interface Phone {
  add(id: string, app: App): HTMLElement;
  // Put this app on the phone.
  use(id: string): void;
  current(): string;
  // The ring of light, from the top down.
  ripple(): void;
  // Tip the phone, in degrees; it settles back by itself.
  kick(deg: number): void;
  // The rail on the screen's edge: `at` 0…1 along it, one of `n` parts long.
  rail(at: number, n: number): void;
}

export function runPhone(stage: HTMLElement): Phone {
  const rig = stage.querySelector<HTMLElement>(".sp-rig")!;
  const screen = stage.querySelector<HTMLElement>(".sp-screen")!;
  const thumb = stage.querySelector<HTMLElement>(".sp-rail b")!;
  const bar = stage.querySelector<HTMLElement>(".sp-bar-r")!;
  const note = stage.querySelector<HTMLElement>(".sp-note")!;
  const apps = new Map<string, { app: App; el: HTMLElement; waved: (HTMLElement | SVGElement)[]; color: (t: number) => number[] }>();
  let cur = "";
  let want = ""; // asked for before its app was added (its data still loading)

  const rgb = (c: number[]) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
  let rippleAt = -1e9;
  let push = 0, kick = 0;
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    mx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width - 0.5));
    my = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height - 0.5));
  });

  // Most values round to what's already there; an unchanged one costs no style work.
  const written = new WeakMap<Element, Record<string, string>>();
  const setVar = (el: HTMLElement | SVGElement, name: string, value: string) => {
    let vars = written.get(el);
    if (!vars) written.set(el, (vars = {}));
    if (vars[name] === value) return;
    vars[name] = value;
    el.style.setProperty(name, value);
  };

  let raf = 0, waveFrame = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const a = apps.get(cur);
    if (!a) return;
    const t = reduced() ? 0 : now / 1000;
    // All reads before any write of this frame: a read after a write makes the
    // browser recalculate styles, and in the wave that was once per element.
    // The wave is slow enough that each element only needs every third frame,
    // except while the ring passes.
    const sr = screen.getBoundingClientRect();
    const ring = (now - rippleAt) / RIPPLE_MS;
    const slice = ring < 1.6 ? -1 : waveFrame % WAVE_SLICES;
    waveFrame++;
    const rects = a.waved.map((el, i) => (slice < 0 || i % WAVE_SLICES === slice ? el.getBoundingClientRect() : null));
    a.app.frame?.(now, t);

    kick += (push - kick) * 0.12;
    push *= 0.85;
    tx += (mx * 0.6 - tx) * 0.07;
    ty += (my * 0.6 - ty) * 0.07;
    rig.style.transform = `rotateX(${10 - ty * 12 + kick * 0.6}deg) rotateY(${-22 + tx * 22}deg) rotateZ(3deg)`;

    // The wave: color by place on the screen, time and content; the ring
    // brightens what it passes. Only what's visible on the screen.
    const shift = a.app.shift?.() ?? 0;
    for (let i = 0; i < rects.length; i++) {
      const el = a.waved[i], r = rects[i];
      if (!r || !r.width || r.bottom < sr.top || r.top > sr.bottom) continue;
      const y = (r.top + r.height / 2 - sr.top) / sr.height;
      const x = (r.left + r.width / 2 - sr.left) / sr.width;
      const c = a.color(y * 0.55 + x * 0.18 - t * 0.09 + shift);
      const lit = ring < 1.6 ? Math.exp(-((y - ring + 0.2) ** 2) / 0.012) : 0;
      const al = Math.min(100, 26 + 22 * (0.5 + 0.5 * Math.sin(y * 9 - t * 3 + x * 2)) + lit * 52);
      setVar(el, "--c", rgb(lit > 0.2 ? c.map((v) => v + (255 - v) * lit * 0.5) : c));
      setVar(el, "--a", `${al.toFixed(0)}%`);
    }
    // Inherited by everything in the phone, so every write restyles all of it:
    // coarse steps, a few times a second. Too slow a change to see.
    if (waveFrame % 12 === 0) {
      setVar(stage, "--wave", rgb(a.color(0.365 - t * 0.09 + shift).map((v) => Math.round(v / 4) * 4)));
    }
  };

  // Runs only while the phone is on screen.
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry.isIntersecting) raf = requestAnimationFrame(frame);
  }).observe(stage);

  const phone: Phone = {
    add(id, app) {
      const el = stage.querySelector<HTMLElement>(`.sp-app[data-app="${id}"]`)!;
      // The palette as one loop, so the wave never jumps.
      // A function because the light theme has its own colors; read again after a toggle.
      let pal: number[][] = [], palTheme: string | null = "";
      const color = (t: number) => {
        const theme = document.documentElement.getAttribute("data-theme");
        if (theme !== palTheme) {
          palTheme = theme;
          const list = app.palette();
          pal = [...list, list[0]].map((h) => hexToRgb(h));
        }
        t = (((t % 1) + 1) % 1) * (pal.length - 1);
        const i = Math.floor(t), f = t - i, a = pal[i], b = pal[i + 1];
        return a.map((v, k) => Math.round(v + (b[k] - v) * f));
      };
      apps.set(id, { app, el, waved: [...el.querySelectorAll<HTMLElement | SVGElement>("[data-w]")], color });
      if (!cur || id === want) phone.use(id);
      return el;
    },
    use(id) {
      want = id;
      const a = apps.get(id);
      if (!a || id === cur) return;
      cur = id;
      apps.forEach((x, k) => x.el.classList.toggle("is-show", k === id));
      bar.textContent = a.app.bar;
      note.textContent = a.app.note ?? "";
      a.app.shown?.();
      phone.ripple();
      phone.kick(10);
    },
    current: () => cur,
    ripple: () => (rippleAt = performance.now()),
    kick: (deg) => (push = deg),
    rail: (at, n) => {
      thumb.style.height = `${100 / n}%`;
      thumb.style.top = `${at * (100 - 100 / n)}%`;
    },
  };
  return phone;
}

// A screen's state for step k: [data-from]/[data-to] switch .on, the
// elements whose [data-at] names k are lit.
export function paintStates(root: ParentNode, k: number) {
  root.querySelectorAll<HTMLElement>("[data-from]").forEach((el) => {
    const to = el.dataset.to;
    el.classList.toggle("on", k >= Number(el.dataset.from) && (to == null || k <= Number(to)));
  });
  root.querySelectorAll<HTMLElement>("[data-at]").forEach((el) => {
    el.classList.toggle("sp-hl", el.dataset.at!.split(" ").includes(String(k)));
  });
}
