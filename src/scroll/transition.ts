// Elevator → projects: ride → halt → zoom into the monitor.
//
// The ride itself is plain scrolling (see about/elevator.ts). Once the
// floor's near edge reaches the bottom of the viewport #about pins (the
// elevator has stopped) and ONE scrubbed timeline plays: a short halt on
// the office (.office, style.css), then a zoom into the monitor's screen
// (.office-screen) until it covers the viewport.
//
// The zoom is a single 2D transform on .about-zoom, which lives OUTSIDE
// the perspective context (.elevator): it scales the already-projected
// image, no translateZ. Scale is exponential — scale = maxScale ** t — so
// the zoom reads as constant speed. GSAP tweens linearly, so the
// exponential is a custom ease over 1 → maxScale: 1 + (S - 1) * e(t) =
// S ** t with e(t) = (S ** t - 1) / (S - 1). With transform-origin 0 0 the
// translate needed to keep the screen's centre going to the viewport
// centre is linear in the same e(t), so x, y and scale share the ease.
//
// Handover: the screen carries the same grid tile as `.projects-bg-grid`,
// sized (cell = --grid-cell / maxScale) and phased so that at full zoom its
// lines ARE the projects grid's lines. When the pin releases the zoomed
// screen scrolls off exactly as #projects scrolls in below it, so there is
// nothing to switch and nothing to jump. The project cards live in
// #projects, outside the zoom, so they are never scaled and only appear
// with the carousel; the fixed .projects-headline fades in at the end of
// the zoom.
//
// Scrub-coupled: scroll position sets the timeline position directly, so
// scrolling back rewinds. Nothing is triggered and played. Driven off the
// same shared scroll (ScrollTrigger + Lenis) as the carousel.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";
import { viewportHeight } from "../viewport";
import { BENTO_MIN_WIDTH_PX } from "../projects/carousel";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT_PX = 640;
const COVER_MARGIN = 1.002;

export function initBoxToGridTransition(aboutSection: HTMLElement) {
  const zoom = aboutSection.querySelector<HTMLElement>(".about-zoom");
  const screen = aboutSection.querySelector<HTMLElement>(".office-screen");
  const headline = document.querySelector<HTMLElement>(".projects-headline");
  if (!zoom || !screen || !headline) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: no ride, no zoom, no pin — the elevator just scrolls
  // off and the projects section follows (.office is hidden in CSS).
  if (reducedMotion) return;

  const { scrollPerUnit, mobileScrollScale, scrub, haltVh, zoomVh, fadeVh, endHoldUnits } =
    TIMINGS.aboutToProjects;
  const scrollScale = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
  ).matches
    ? mobileScrollScale
    : 1;
  const vhToUnits = (vh: number) =>
    (viewportHeight() * (vh / 100)) / (scrollPerUnit * scrollScale);

  // Zoom geometry, recomputed on resize only (ScrollTrigger's refresh),
  // never per frame. Measured in the wrapper's own coordinates with its
  // transform switched off, so it's the untransformed layout.
  let maxScale = 1;
  let endX = 0;
  let endY = 0;
  const measure = () => {
    const previous = zoom.style.transform;
    zoom.style.transform = "none";
    // Place the live screen over the SVG's #screen rect (layout only, so
    // this is the untransformed box). Its top-left corner on a whole
    // pixel: the browser paints a box's background from its pixel-snapped
    // edge, so a fractional corner would come back ~30x larger at full
    // zoom as an offset between the screen's grid and the projects grid.
    // The far edges stay where the SVG has them, so it still fits the bezel.
    const office = screen.parentElement!;
    const box = office.querySelector("#screen")!.getBoundingClientRect();
    const o = office.getBoundingClientRect();
    const zr = zoom.getBoundingClientRect();
    const x0 = Math.round(box.left - zr.left) - (o.left - zr.left);
    const y0 = Math.round(box.top - zr.top) - (o.top - zr.top);
    screen.style.left = `${x0}px`;
    screen.style.top = `${y0}px`;
    screen.style.width = `${box.right - o.left - x0}px`;
    screen.style.height = `${box.bottom - o.top - y0}px`;
    const z = zoom.getBoundingClientRect();
    const s = screen.getBoundingClientRect();
    zoom.style.transform = previous;

    const vw = z.width;
    const vh = viewportHeight();
    const root = getComputedStyle(document.documentElement);
    const cell = parseFloat(root.getPropertyValue("--grid-cell"));
    const line = parseFloat(root.getPropertyValue("--grid-line"));

    // Covers the viewport: the screen fills one dimension and overflows the
    // other. The hair of margin keeps sub-pixel layout rounding from
    // letting a sliver of the monitor's frame show at the edge.
    // The screen's tile is --grid-cell / maxScale, and the browser lays
    // backgrounds out in 1/64 px steps — a tile that isn't one of those
    // steps gets rounded, and at ~30x zoom that rounding adds up to several
    // pixels across the viewport (the grid visibly jumped at the handover).
    // So the tile is snapped down to a 1/64 step first and the scale
    // derived from it: tile x maxScale is then exactly --grid-cell, and
    // snapping down only ever zooms a hair further (still covering).
    const snap = (v: number) => Math.floor(v * 64) / 64;
    const coverScale = Math.max(vw / s.width, vh / s.height) * COVER_MARGIN;
    const screenCell = snap(cell / coverScale);
    maxScale = cell / screenCell;

    // Screen centre → viewport centre, where the viewport centre sits in
    // the wrapper once #about is pinned (its bottom on the viewport's).
    const sx = s.left - z.left;
    const sy = s.top - z.top;
    endX = vw / 2 - maxScale * (sx + s.width / 2);
    endY = z.height - vh / 2 - maxScale * (sy + s.height / 2);

    // Grid on the screen, phased so that at full zoom its lines ARE the
    // projects grid's lines. Those sit, in the viewport at the moment the
    // pin releases, on vh (the section's top, right below #about) and on
    // vw / 2 at the desktop bento breakpoint, where .projects-bg-grid runs
    // a line through the centre (style.css: `calc(50% + cell / 2)` against
    // a cell-wide tile resolves to exactly half the width), else on 0.
    // Matched by the shared breakpoint, not read off the element:
    // getComputedStyle() hands back the unresolved calc() string.
    // The offset is snapped like the tile; what the snap leaves over
    // (under maxScale / 64 px on screen) is taken up by the end translate.
    const isBento = window.matchMedia(`(min-width: ${BENTO_MIN_WIDTH_PX}px)`).matches;
    const targetX = isBento ? vw / 2 : 0;
    const targetY = vh;
    const phase = (v: number) => ((v % cell) + cell) % cell;
    const signed = (v: number) => {
      const p = phase(v);
      return p > cell / 2 ? p - cell : p;
    };
    // Screen's top-left on screen at full zoom (wrapper top = vh - z.height).
    const left = endX + maxScale * sx;
    const top = vh - z.height + endY + maxScale * sy;
    const ox = snap(phase(targetX - left) / maxScale);
    const oy = snap(phase(targetY - top) / maxScale);
    endX += signed(targetX - (left + maxScale * ox));
    endY += signed(targetY - (top + maxScale * oy));
    screen.style.setProperty("--screen-cell", `${screenCell}px`);
    screen.style.setProperty("--screen-line", `${line / maxScale}px`);
    screen.style.setProperty("--screen-ox", `${ox}px`);
    screen.style.setProperty("--screen-oy", `${oy}px`);
  };
  measure();

  const expEase = (t: number) =>
    maxScale === 1 ? t : (maxScale ** t - 1) / (maxScale - 1);

  const tl = gsap.timeline({ paused: true });
  tl.to({}, { duration: vhToUnits(haltVh) });
  const zoomTween = gsap.to(zoom, {
    x: () => endX,
    y: () => endY,
    scale: () => maxScale,
    duration: vhToUnits(zoomVh),
    ease: expEase,
    // At full zoom the screen covers the viewport, so the shaft behind it
    // (blown up ~30x) is out of sight — stop compositing it for the rest
    // of the pin and the scroll-off into #projects.
    onUpdate: () => {
      zoom.classList.toggle("is-covered", zoomTween.progress() === 1);
    },
  });
  tl.add(zoomTween);
  // After a resize: re-measure, and have the tween re-read its end values —
  // from the untransformed start, hence the trip through progress 0.
  ScrollTrigger.addEventListener("refresh", () => {
    measure();
    const progress = tl.progress();
    tl.progress(0);
    zoomTween.invalidate();
    tl.progress(progress);
  });
  tl.fromTo(
    headline,
    { "--handover": 0 },
    { "--handover": 1, duration: vhToUnits(fadeVh), ease: "none" },
  ); // opacity = --handover * --fade, see .projects-headline
  tl.to({}, { duration: endHoldUnits });

  ScrollTrigger.create({
    trigger: aboutSection,
    start: "bottom bottom",
    end: `+=${tl.duration() * scrollPerUnit * scrollScale}`,
    pin: true,
    scrub,
    animation: tl,
    invalidateOnRefresh: true,
  });
}
