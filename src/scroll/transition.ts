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
    const z = zoom.getBoundingClientRect();
    const s = screen.getBoundingClientRect();
    zoom.style.transform = previous;

    const vw = z.width;
    const vh = viewportHeight();
    // Covers the viewport: the screen fills one dimension and overflows the
    // other. The hair of margin keeps sub-pixel layout rounding from
    // letting a sliver of the monitor's frame show at the edge.
    maxScale = Math.max(vw / s.width, vh / s.height) * COVER_MARGIN;
    // Screen centre → viewport centre, where the viewport centre sits in
    // the wrapper once #about is pinned (its bottom on the viewport's).
    const cx = s.left - z.left + s.width / 2;
    const cy = s.top - z.top + s.height / 2;
    endX = vw / 2 - maxScale * cx;
    endY = z.height - vh / 2 - maxScale * cy;

    // Grid on the screen: cell/line shrunk by maxScale, phase shifted so
    // that at full zoom the lines sit on multiples of --grid-cell from the
    // projects section's top-left — which, once the pin ends, is the
    // viewport's left edge and its bottom edge (the section follows #about).
    const root = getComputedStyle(document.documentElement);
    const cell = parseFloat(root.getPropertyValue("--grid-cell"));
    const line = parseFloat(root.getPropertyValue("--grid-line"));
    const left = vw / 2 - (s.width * maxScale) / 2;
    const top = vh / 2 - (s.height * maxScale) / 2;
    const phase = (v: number) => ((v % cell) + cell) % cell;
    screen.style.setProperty("--screen-cell", `${cell / maxScale}px`);
    screen.style.setProperty("--screen-line", `${line / maxScale}px`);
    screen.style.setProperty("--screen-ox", `${phase(-left) / maxScale}px`);
    screen.style.setProperty("--screen-oy", `${phase(vh - top) / maxScale}px`);
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
