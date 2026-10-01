// About section: a CSS-3D corridor (one-point perspective) that simply
// scrolls past with the rest of the page — no pin, no faked motion
// (grid streaming, drift, etc). The four side walls are flat panels
// sized to the shaft depth and rotated 90deg around the edge they share
// with the front (viewport) plane, so their far edge lands exactly on
// the back wall. No per-vertex math for the convergence — once the
// geometry lines up, the browser's own perspective projection draws the
// taper toward the vanishing point.

import type Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { viewportHeight } from "../viewport";
import { ABOUT } from "./about-content";

// The CV facts — sourced from b2b-cv's lib/portfolio/career.ts (CAREER,
// EDUCATION, SKILLS, LANGUAGES), in every language in about-content.ts.
// Rendered as labeled sections after the blocks A1–A4 (about-blocks.ts),
// on the same backwall overlay.
export type { CvSection } from "./about-content";
export const cvSections = ABOUT.cv;

// The one thing that isn't static: the vanishing point has to track the
// *viewport's* current center as you scroll, not sit fixed at the
// middle of the whole (very tall) corridor. A real corridor works the
// same way — the point you're looking toward is always at your own eye
// level. Without this, the ceiling/floor would be rendered as if seen
// from one fixed spot, so they'd look wrong (over- or under-angled) for
// most of the scroll instead of leveling out to a sliver exactly when
// you're looking straight at them and opening up as you pass.
//
// Driven off lenis's own "scroll" event (same cheap pattern as
// scroll/progress.ts's initScrollProgress) instead of an own
// requestAnimationFrame loop: recomputing this needs the section's
// current top, which used to come from a fresh getBoundingClientRect()
// every single frame — forced layout, run forever from page load,
// whether or not the page was even scrolling. section top/height barely
// change (only on resize/layout), so they're cached here and only that
// arithmetic runs per scroll tick.
export function trackElevatorPerspective(section: HTMLElement, lenis: Lenis) {
  const elevator = section.querySelector<HTMLElement>(".elevator");
  if (!elevator) return;

  // sectionTop: document-flow offset (rect.top + scrollY), not tied to
  // scroll position. sectionHeight: unaffected by transition.ts's pin —
  // GSAP pins via position, never resizes the trigger element.
  let sectionTop = 0;
  let sectionHeight = 1;
  // The scroll position at which transition.ts's `start: "bottom bottom"`
  // ScrollTrigger pins #about — from there on the section's rect.top is
  // frozen (pinned), not "sectionTop - scroll" anymore.
  let pinStartScroll = 0;

  function measure() {
    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    sectionHeight = rect.height || 1;
    pinStartScroll = sectionTop + sectionHeight - viewportHeight();
  }
  measure();
  ScrollTrigger.addEventListener("refresh", measure);

  // Same value transition.ts's pin freezes rect.top to once pinned
  // ("bottom bottom": section bottom flush with viewport bottom).
  const pinnedTop = () => viewportHeight() - sectionHeight;

  function update() {
    const top =
      lenis.scroll < pinStartScroll ? sectionTop - lenis.scroll : pinnedTop();
    const originY = ((viewportHeight() / 2 - top) / sectionHeight) * 100;
    elevator!.style.perspectiveOrigin = `50% ${originY}%`;
  }
  lenis.on("scroll", update);
  update();
}
