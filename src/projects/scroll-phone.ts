// The phone the three big cards share (kev.dev, YourBrand, TschoBBo): a
// phone in 3D over a moving floor grid that leans toward the pointer, with
// skeletons on its screen colored by a wave that runs with time, and a ring
// of light down the screen at every change. What the screen shows, and how
// scrolling moves it, is each card's own (kevdev-phone.ts, yourbrand-card.ts,
// tschobbo-card.ts). Desktop only — the big cards don't exist under LITE.

import "./scroll-phone.css";

export const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !document.documentElement.classList.contains("force-motion");

// The phone's markup around a screen. `bar` is the right side of the status
// bar, `note` an optional line under the phone.
export function phoneStage(screen: string, bar: string, note = ""): string {
  return `
    <div class="sp-stage">
      <span class="sp-sun" aria-hidden="true"></span>
      <span class="sp-floor" aria-hidden="true"></span>
      <div class="sp-rig" aria-hidden="true">
        ${[16, 12, 8, 4].map((z) => `<span class="sp-slab" style="transform: translateZ(-${z}px)"></span>`).join("")}
        <span class="sp-btn" style="top: 22%; height: 8%"></span>
        <span class="sp-btn" style="top: 33%; height: 12%"></span>
        <div class="sp-phone">
          <div class="sp-screen">
            <span class="sp-island"></span>
            <span class="sp-bar"><span>9:41</span><span>${bar}</span></span>
            ${screen}
            <span class="sp-glass"></span>
            <span class="sp-rail"><b></b></span>
          </div>
        </div>
      </div>
      ${note ? `<p class="sp-note">${note}</p>` : ""}
    </div>`;
}

const RIPPLE_MS = 650; // the ring's way from the top of the screen to the bottom

export interface Phone {
  // The ring of light, from the top down.
  ripple(): void;
  // Tip the phone, in degrees; it settles back by itself.
  kick(deg: number): void;
  // The rail on the screen's edge: `at` 0…1 along it, one of `n` parts long.
  rail(at: number, n: number): void;
}

interface PhoneOptions {
  // The wave's colors, as #rrggbb.
  palette: string[];
  // Moves the wave along with the content (scroll position, step).
  shift?: () => number;
  // Every frame while the phone is on screen; t in seconds, 0 under
  // reduced motion.
  frame?: (now: number, t: number) => void;
  // Each time the phone comes back on screen.
  shown?: () => void;
}

export function runPhone(stage: HTMLElement, opts: PhoneOptions): Phone {
  const card = stage.closest<HTMLElement>(".pcard")!;
  const rig = stage.querySelector<HTMLElement>(".sp-rig")!;
  const screen = stage.querySelector<HTMLElement>(".sp-screen")!;
  const thumb = stage.querySelector<HTMLElement>(".sp-rail b")!;
  const waved = [...screen.querySelectorAll<HTMLElement | SVGElement>("[data-w]")];

  // The palette as one loop, so the wave never jumps.
  const pal = [...opts.palette, opts.palette[0]].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const color = (t: number) => {
    t = (((t % 1) + 1) % 1) * (pal.length - 1);
    const i = Math.floor(t), f = t - i, a = pal[i], b = pal[i + 1];
    return a.map((v, k) => Math.round(v + (b[k] - v) * f));
  };
  const rgb = (c: number[]) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

  let rippleAt = -1e9;
  let push = 0, kick = 0;
  let mx = 0, my = 0, tx = 0, ty = 0;
  card.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width - 0.5));
    my = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height - 0.5));
  });
  card.addEventListener("pointerleave", () => (mx = my = 0));

  let raf = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const t = reduced() ? 0 : now / 1000;
    opts.frame?.(now, t);

    kick += (push - kick) * 0.12;
    push *= 0.85;
    tx += (mx - tx) * 0.07;
    ty += (my - ty) * 0.07;
    rig.style.transform = `rotateX(${10 - ty * 12 + kick * 0.6}deg) rotateY(${-22 + tx * 22}deg) rotateZ(3deg)`;

    // The wave: color by place on the screen, time and content; the ring
    // brightens what it passes. Only what's visible on the screen.
    const sr = screen.getBoundingClientRect();
    const ring = (now - rippleAt) / RIPPLE_MS;
    const shift = opts.shift?.() ?? 0;
    let glow: number[] | null = null;
    for (const el of waved) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < sr.top || r.top > sr.bottom) continue;
      const y = (r.top + r.height / 2 - sr.top) / sr.height;
      const x = (r.left + r.width / 2 - sr.left) / sr.width;
      const c = color(y * 0.55 + x * 0.18 - t * 0.09 + shift);
      const lit = ring < 1.6 ? Math.exp(-((y - ring + 0.2) ** 2) / 0.012) : 0;
      const a = Math.min(100, 26 + 22 * (0.5 + 0.5 * Math.sin(y * 9 - t * 3 + x * 2)) + lit * 52);
      el.style.setProperty("--c", rgb(lit > 0.2 ? c.map((v) => v + (255 - v) * lit * 0.5) : c));
      el.style.setProperty("--a", `${a.toFixed(0)}%`);
      if (!glow && y > 0.4) glow = c;
    }
    if (glow) stage.style.setProperty("--wave", rgb(glow));
  };

  // Runs only while the card is on screen.
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry.isIntersecting) {
      opts.shown?.();
      raf = requestAnimationFrame(frame);
    }
  }).observe(stage);

  return {
    ripple: () => (rippleAt = performance.now()),
    kick: (deg) => (push = deg),
    rail: (at, n) => {
      thumb.style.height = `${100 / n}%`;
      thumb.style.top = `${at * (100 - 100 / n)}%`;
    },
  };
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

const NOTCH = 80; // wheel delta per step

// The wheel over `areas` walks the steps while there are any left that way;
// past either end it belongs to the page again (Lenis listens on window, so
// it never sees the wheel events used here).
export function wheelSteps(areas: Element[], at: () => [number, number], step: (dir: number) => void) {
  let acc = 0;
  areas.forEach((el) =>
    el.addEventListener(
      "wheel",
      (e) => {
        const ev = e as WheelEvent;
        const [cur, n] = at();
        const dir = Math.sign(ev.deltaY);
        if (!dir || (dir > 0 && cur >= n - 1) || (dir < 0 && cur <= 0)) {
          acc = 0;
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        acc += ev.deltaY;
        if (Math.abs(acc) >= NOTCH) {
          step(Math.sign(acc));
          acc = 0;
        }
      },
      { passive: false },
    ),
  );
}
