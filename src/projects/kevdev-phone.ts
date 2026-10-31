// kev.dev's app on the shared phone (scroll-phone.ts): this page in
// skeletons, one screen per section (hero cloth, elevator, the bench, falling letters,
// the legal overlay, the languages, the phone version). Scrolling it picks the matching tab of
// the parts table beside it, a tab scrolls it there; left alone it scrolls
// itself. The skeletons take the project note colors in a wave that moves
// with time and scroll, a ring of light runs down at each section change.

import { phoneApp, reduced, type Phone } from "./scroll-phone";
import "./kevdev-phone.css";

const sk = (cls = "", style = "") => `<i class="sp-sk${cls ? ` ${cls}` : ""}" data-w${style ? ` style="${style}"` : ""}></i>`;
const rep = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join("");

const THREADS = 13;
const SCREENS = [
  // hero: the cloth, name, subtitle, the buttons
  `<svg class="kp-cloth" viewBox="0 0 240 300" preserveAspectRatio="none">${rep(THREADS, () => `<path data-w />`)}</svg>
   ${sk("kp-name")}${sk("kp-sub")}
   <span class="kp-pills">${rep(3, () => sk("sp-r"))}</span>`,
  // about: the shaft with floors falling past, the life line under it
  `<span class="kp-shaft">${[92, 70, 50, 32].map((s) => `<i class="sp-ol" data-w style="width:${s}%;height:${s}%"></i>`).join("")}
     <span class="kp-floors">${rep(7, () => sk())}</span></span>
   <span class="kp-life">${[70, 52, 84, 40].map((w) => sk("kp-dot") + sk("", `width:${w}%`)).join("")}</span>`,
  // projects: one big card, then small ones
  `<span class="kp-bench">
     <span class="sp-ol kp-pc kp-big" data-w>${sk("kp-sq")}<span>${sk("", "width:70%")}${sk("", "width:45%")}</span></span>
     ${rep(6, (i) => `<span class="sp-ol kp-pc" data-w>${sk("kp-sq")}${sk("", `width:${60 + ((i * 17) % 35)}%`)}${sk("", `width:${35 + ((i * 23) % 30)}%`)}</span>`)}
   </span>`,
  // contact: the letters fall in, the raygun button
  `<span class="kp-letters">${[84, 60, 96, 70, 88].map((h, i) => sk("", `height:${h}px;transition-delay:${i * 0.07}s`)).join("")}</span>
   ${sk("sp-r kp-ray")}`,
  // legal: the page dims, the sheet comes up over it
  `<span class="kp-behind">${rep(4, () => sk())}</span>
   <span class="kp-sheet">${sk("sp-r kp-grab")}${sk("kp-h", "width:46%")}${[92, 80, 88, 60].map((w) => sk("", `width:${w}%`)).join("")}${sk("sp-r kp-note")}</span>`,
  // languages: four of them, the text lines change length with each
  `<span class="kp-langs">${["de", "en", "ru", "ja"].map((l) => `<b>${l}</b>`).join("")}</span>
   <span class="kp-lines">${rep(6, () => sk())}</span>`,
  // mobile: the lite list, a frame graph under it
  `<span class="kp-list">${rep(4, (i) => `<span class="sp-ol kp-row" data-w>${sk("kp-sq")}<span>${sk("", `width:${55 + ((i * 19) % 35)}%`)}${sk("", `width:${30 + ((i * 13) % 25)}%`)}</span></span>`)}</span>
   <span class="kp-frames">${rep(18, () => sk())}</span>`,
];

// The app, one screen per section name (the parts' names).
export function kevApp(id: string, names: string[]): string {
  return phoneApp(
    id,
    `<div class="kp-scroll">
      ${names
        .map(
          (name, i) => `
      <section class="kp-sec">
        <p class="kp-tag"><em>${String(i + 1).padStart(2, "0")}</em> ${name}</p>
        ${SCREENS[i] ?? ""}
      </section>`,
        )
        .join("")}
    </div>`,
  );
}

const IDLE_MS = 3500; // untouched this long, the phone scrolls itself

export function initKevApp(card: HTMLElement, phone: Phone) {
  const id = card.dataset.card!;
  let lastTop = 0;
  let lastPoke = -1e9;
  const poke = () => (lastPoke = performance.now());

  // The note colors, the same loop as the project notes.
  const app = phone.add(id, {
    palette: () => {
      const css = getComputedStyle(document.documentElement);
      return [1, 2, 3, 4, 5, 9, 6].map((n) => css.getPropertyValue(`--note-${n}`).trim());
    },
    bar: "kev.dev",
    shift: () => scroller.scrollTop * 0.00045,
    shown: poke,
    frame: (now, t) => {
      const h = scroller.clientHeight;
      const max = scroller.scrollHeight - h;

      if (!reduced() && now - lastPoke > IDLE_MS) {
        if (scroller.scrollTop >= max - 1) {
          poke();
          scroller.scrollTo({ top: 0, behavior: "smooth" });
        } else scroller.scrollTop += 0.7;
      }

      const top = scroller.scrollTop;
      phone.kick(Math.max(-12, Math.min(12, top - lastTop)));
      lastTop = top;
      phone.rail(top / max, secs.length);
      const at = Math.min(secs.length - 1, Math.round(top / h));
      if (jumping < 0 || at === jumping) {
        jumping = -1;
        show(at);
      }

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
      // mobile: frame times, low and even, running left
      bars.forEach((b, k) => (b.style.height = `${30 + 18 * Math.sin(k * 1.7 - t * 4) * Math.sin(k * 0.6 + t)}%`));
    },
  });

  const scroller = app.querySelector<HTMLElement>(".kp-scroll")!;
  const secs = [...scroller.querySelectorAll<HTMLElement>(".kp-sec")];
  const tabs = [...card.querySelectorAll<HTMLElement>(".parts-tabbar [data-tab]")];
  const threads = [...app.querySelectorAll<SVGPathElement>(".kp-cloth path")];
  const floors = [...app.querySelectorAll<HTMLElement>(".kp-floors .sp-sk")];
  const lines = [...app.querySelectorAll<HTMLElement>(".kp-lines .sp-sk")];
  const langs = [...app.querySelectorAll<HTMLElement>(".kp-langs b")];
  const bars = [...app.querySelectorAll<HTMLElement>(".kp-frames .sp-sk")];
  let active = -1;
  let jumping = -1; // a tab's scroll on its way: don't pick tabs on the way past

  const show = (i: number) => {
    if (i === active) return;
    active = i;
    secs.forEach((s, k) => s.classList.toggle("is-in", k === i));
    phone.ripple();
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
}
