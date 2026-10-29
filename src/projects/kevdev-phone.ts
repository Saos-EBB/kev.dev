// kev.dev's card: a phone in the middle with this page in skeletons, one
// screen per section (hero cloth, elevator, the bench, falling letters,
// the legal overlay, the languages). Scrolling it picks the matching tab of
// the parts table beside it, a tab scrolls it there; left alone it scrolls
// itself. The skeletons take the project note colors in a wave that moves
// with time and scroll, a ring of light runs down at each section change.
// Desktop only — the big cards (big-cards.ts) don't exist under LITE.

import "./kevdev-phone.css";

const sk = (cls = "", style = "") => `<i class="kp-sk${cls ? ` ${cls}` : ""}" data-w${style ? ` style="${style}"` : ""}></i>`;
const rep = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join("");

const THREADS = 13;
const SCREENS = [
  // hero: the cloth, name, subtitle, the buttons
  `<svg class="kp-cloth" viewBox="0 0 240 300" preserveAspectRatio="none">${rep(THREADS, () => `<path data-w />`)}</svg>
   ${sk("kp-name")}${sk("kp-sub")}
   <span class="kp-pills">${rep(3, () => sk("kp-r"))}</span>`,
  // about: the shaft with floors falling past, the life line under it
  `<span class="kp-shaft">${[92, 70, 50, 32].map((s) => `<i class="kp-ol" data-w style="width:${s}%;height:${s}%"></i>`).join("")}
     <span class="kp-floors">${rep(7, () => sk())}</span></span>
   <span class="kp-life">${[70, 52, 84, 40].map((w) => sk("kp-dot") + sk("", `width:${w}%`)).join("")}</span>`,
  // projects: one big card, then small ones
  `<span class="kp-bench">
     <span class="kp-ol kp-pc kp-big" data-w>${sk("kp-sq")}<span>${sk("", "width:70%")}${sk("", "width:45%")}</span></span>
     ${rep(6, (i) => `<span class="kp-ol kp-pc" data-w>${sk("kp-sq")}${sk("", `width:${60 + ((i * 17) % 35)}%`)}${sk("", `width:${35 + ((i * 23) % 30)}%`)}</span>`)}
   </span>`,
  // contact: the letters fall in, the raygun button
  `<span class="kp-letters">${[84, 60, 96, 70, 88].map((h, i) => sk("", `height:${h}px;transition-delay:${i * 0.07}s`)).join("")}</span>
   ${sk("kp-r kp-ray")}`,
  // legal: the page dims, the sheet comes up over it
  `<span class="kp-behind">${rep(4, () => sk())}</span>
   <span class="kp-sheet">${sk("kp-r kp-grab")}${sk("kp-h", "width:46%")}${[92, 80, 88, 60].map((w) => sk("", `width:${w}%`)).join("")}${sk("kp-r kp-note")}</span>`,
  // languages: four of them, the text lines change length with each
  `<span class="kp-langs">${["de", "en", "ru", "ja"].map((l) => `<b>${l}</b>`).join("")}</span>
   <span class="kp-lines">${rep(6, () => sk())}</span>`,
];

// The phone's markup, one screen per section name (the parts' names).
export function phone(names: string[]): string {
  return `
    <div class="kp-stage" aria-hidden="true">
      <span class="kp-sun"></span>
      <span class="kp-floor"></span>
      <div class="kp-rig">
        ${[16, 12, 8, 4].map((z) => `<span class="kp-slab" style="transform: translateZ(-${z}px)"></span>`).join("")}
        <span class="kp-btn" style="top: 22%; height: 8%"></span>
        <span class="kp-btn" style="top: 33%; height: 12%"></span>
        <div class="kp-phone">
          <div class="kp-screen">
            <span class="kp-island"></span>
            <span class="kp-bar"><span>9:41</span><span>kev.dev</span></span>
            <div class="kp-scroll">
              ${names
                .map(
                  (name, i) => `
              <section class="kp-sec">
                <p class="kp-tag"><em>${String(i + 1).padStart(2, "0")}</em> ${name}</p>
                ${SCREENS[i] ?? ""}
              </section>`,
                )
                .join("")}
            </div>
            <span class="kp-glass"></span>
            <span class="kp-rail"><b></b></span>
          </div>
        </div>
      </div>
    </div>`;
}

const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !document.documentElement.classList.contains("force-motion");

const IDLE_MS = 3500; // untouched this long, the phone scrolls itself
const RIPPLE_MS = 650; // the ring's way from the top of the screen to the bottom

export function initPhones(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".kp-stage").forEach(initPhone);
}

function initPhone(stage: HTMLElement) {
  const card = stage.closest<HTMLElement>(".pcard")!;
  const rig = stage.querySelector<HTMLElement>(".kp-rig")!;
  const screen = stage.querySelector<HTMLElement>(".kp-screen")!;
  const scroller = stage.querySelector<HTMLElement>(".kp-scroll")!;
  const thumb = stage.querySelector<HTMLElement>(".kp-rail b")!;
  const secs = [...scroller.querySelectorAll<HTMLElement>(".kp-sec")];
  const tabs = [...card.querySelectorAll<HTMLElement>(".parts-tabbar [data-tab]")];
  const threads = [...stage.querySelectorAll<SVGPathElement>(".kp-cloth path")];
  const floors = [...stage.querySelectorAll<HTMLElement>(".kp-floors .kp-sk")];
  const lines = [...stage.querySelectorAll<HTMLElement>(".kp-lines .kp-sk")];
  const langs = [...stage.querySelectorAll<HTMLElement>(".kp-langs b")];
  const waved = secs.map((s) => [...s.querySelectorAll<HTMLElement | SVGElement>("[data-w]")]);

  // The note colors as one loop, so the wave never jumps.
  const css = getComputedStyle(document.documentElement);
  const notes = [1, 2, 3, 4, 5, 9, 6].map((n) => css.getPropertyValue(`--note-${n}`).trim());
  const pal = [...notes, notes[0]].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const color = (t: number) => {
    t = (((t % 1) + 1) % 1) * (pal.length - 1);
    const i = Math.floor(t), f = t - i, a = pal[i], b = pal[i + 1];
    return a.map((v, k) => Math.round(v + (b[k] - v) * f));
  };
  const rgb = (c: number[]) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

  let active = -1;
  let rippleAt = -1e9;
  let jumping = -1; // a tab's scroll on its way: don't pick tabs on the way past
  let lastPoke = -1e9;
  const poke = () => (lastPoke = performance.now());

  const show = (i: number) => {
    if (i === active) return;
    active = i;
    secs.forEach((s, k) => s.classList.toggle("is-in", k === i));
    rippleAt = performance.now();
    // The tab box's own click handler (initBigCards) switches the panel.
    if (tabs[i]?.getAttribute("aria-selected") !== "true") tabs[i]?.click();
  };

  card.querySelector(".parts-tabbar")?.addEventListener("click", (e) => {
    const i = tabs.indexOf((e.target as Element).closest<HTMLElement>("[data-tab]")!);
    if (i < 0 || i === active) return;
    poke();
    jumping = i;
    scroller.scrollTo({ top: secs[i].offsetTop, behavior: reduced() ? "auto" : "smooth" });
  });

  // The wheel scrolls the phone while it can; at either end it goes on to
  // the page (Lenis listens on window, so it never sees the rest).
  scroller.addEventListener(
    "wheel",
    (e) => {
      poke();
      jumping = -1;
      const top = scroller.scrollTop;
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (e.deltaY > 0 ? top < max - 1 : top > 0) e.stopPropagation();
    },
    { passive: true },
  );
  scroller.addEventListener("pointerdown", poke, { passive: true });

  // Tilt toward the pointer, kick with the scroll speed.
  let mx = 0, my = 0, tx = 0, ty = 0, kick = 0, lastTop = 0;
  card.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width - 0.5));
    my = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height - 0.5));
  });
  card.addEventListener("pointerleave", () => (mx = my = 0));

  let raf = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const still = reduced();
    const t = still ? 0 : now / 1000;
    const h = scroller.clientHeight;
    const max = scroller.scrollHeight - h;

    if (!still && now - lastPoke > IDLE_MS) {
      if (scroller.scrollTop >= max - 1) {
        poke();
        scroller.scrollTo({ top: 0, behavior: "smooth" });
      } else scroller.scrollTop += 0.7;
    }

    const top = scroller.scrollTop;
    kick += (Math.max(-12, Math.min(12, top - lastTop)) - kick) * 0.12;
    lastTop = top;
    thumb.style.top = `${(top / max) * (100 - 100 / secs.length)}%`;
    const at = Math.min(secs.length - 1, Math.round(top / h));
    if (jumping < 0 || at === jumping) {
      jumping = -1;
      show(at);
    }

    tx += (mx - tx) * 0.07;
    ty += (my - ty) * 0.07;
    rig.style.transform = `rotateX(${10 - ty * 12 + kick * 0.6}deg) rotateY(${-22 + tx * 22}deg) rotateZ(3deg)`;

    // hero: the threads wave
    threads.forEach((path, k) => {
      let d = "";
      for (let x = 0; x <= 240; x += 12) {
        const y = 14 + k * 21 + Math.sin(x * 0.035 + t * 2.1 + k * 0.5) * (6 + k * 0.5) + Math.sin(x * 0.011 - t * 1.3) * 5;
        d += `${x ? "L" : "M"}${x} ${y.toFixed(1)}`;
      }
      path.setAttribute("d", d);
    });
    // about: floors fall past, bigger as they come closer
    floors.forEach((f, k) => {
      const y = (k / floors.length + top / 900 + t * 0.03) % 1;
      f.style.cssText = `top:${y * 100}%;width:${20 + y * 60}%;left:${40 - y * 30}%`;
    });
    // languages: one lit at a time, the lines take its length
    const lang = Math.floor(t / 1.6) % langs.length;
    langs.forEach((b, k) => b.classList.toggle("is-on", k === lang));
    lines.forEach((l, k) => (l.style.width = `${40 + ((k * 29 + lang * 37) % 55)}%`));

    // The wave: color by place on the screen, time and scroll; the ring
    // brightens what it passes. Only the screens in view.
    const sr = screen.getBoundingClientRect();
    const ring = (now - rippleAt) / RIPPLE_MS;
    let glow: number[] | null = null;
    secs.forEach((sec, s) => {
      if (Math.abs(sec.offsetTop - top) >= h) return;
      for (const el of waved[s]) {
        const r = el.getBoundingClientRect();
        const y = (r.top + r.height / 2 - sr.top) / sr.height;
        const x = (r.left + r.width / 2 - sr.left) / sr.width;
        const c = color(y * 0.55 + x * 0.18 - t * 0.09 + top * 0.00045);
        const lit = ring < 1.6 ? Math.exp(-((y - ring + 0.2) ** 2) / 0.012) : 0;
        const a = Math.min(100, 26 + 22 * (0.5 + 0.5 * Math.sin(y * 9 - t * 3 + x * 2)) + lit * 52);
        el.style.setProperty("--c", rgb(lit > 0.2 ? c.map((v) => v + (255 - v) * lit * 0.5) : c));
        el.style.setProperty("--a", `${a.toFixed(0)}%`);
        if (!glow && y > 0.4) glow = c;
      }
    });
    if (glow) stage.style.setProperty("--wave", rgb(glow));
  };

  // Runs only while the card is on screen.
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry.isIntersecting) {
      poke();
      raf = requestAnimationFrame(frame);
    }
  }).observe(stage);
}
