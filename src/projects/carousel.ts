// Scroll-driven project reveal, three phases per project:
//
//  1. IN: the whole card GROUP (.carousel-project) slides in from the
//     right to its fixed center position — one unit, only its x animates.
//  2. BUILD-UP: the group now sits still. Scrolling further reveals its
//     3-5 cards one at a time (cover first, matching DOM/data order) —
//     each just a small slide-in-from-the-right + fade, landing on its
//     own fixed "papers on a desk" spot within the group. Only x and
//     opacity animate; each card's rotation/scale/position are set once
//     and never touched again (see the PRESETS below).
//  3. OUT: once the full set has built up and held for a beat, the whole
//     group slides out to the left, same as it came in.
//
// This makes a project's own span of the pinned scroll longer than
// before (in + N card reveals + out) — intentional, not a bug to budget
// against.
//
// ARRANGEMENT is data, not CSS or randomness: PRESETS below holds a
// handful of hand-picked "papers on a desk" layouts (per card count),
// and each project is assigned one by index — consecutive projects look
// different from each other, but every layout is still one a human
// picked to overlap cleanly, never Math.random(). Kept in TS (not CSS)
// because the build-up phase needs these same numbers to animate each
// card *to* its spot, not just render it there.
//
// One GSAP timeline drives the whole sequence, same pinned-and-scrubbed
// shape as contact.ts's own timeline. Lenis is wired to ScrollTrigger in
// main.ts so there's one shared scroll instead of two competing systems.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";
import { viewportHeight } from "../viewport";

gsap.registerPlugin(ScrollTrigger);

// One card's fixed spot within its group. x/y are percentages of the
// card's *own* size (plain CSS translate() semantics — same reasoning as
// the old static rules this replaces: the spread scales with the
// viewport-relative card width instead of drifting apart from it).
interface SlotLayout {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  zIndex: number;
}

// Three hand-picked "papers on a desk" layouts, one keyed set per
// possible card count (3 isn't currently produced by getProjectCards,
// but kept here so a future trimmed project — or Kevin's own tweak —
// doesn't need new layout code, just new numbers). Card 1 (the cover) is
// always the main/biggest/topmost; later cards sit further out, smaller,
// lower in the stack. Each preset centers its main card somewhere
// different (left/right/high) and fans the rest out around it, so
// consecutive projects don't all clump around dead-center.
const PRESET_LEFT: Record<number, SlotLayout[]> = {
  1: [{ x: 0, y: 0, rotate: -1, scale: 1, zIndex: 1 }],
  3: [
    { x: -6, y: -4, rotate: -2, scale: 1.15, zIndex: 3 },
    { x: 58, y: -14, rotate: 4, scale: 1.0, zIndex: 2 },
    { x: -52, y: 22, rotate: -4, scale: 0.9, zIndex: 1 },
  ],
  4: [
    { x: -8, y: -6, rotate: -2, scale: 1.15, zIndex: 4 },
    { x: 62, y: -16, rotate: 4, scale: 1.0, zIndex: 3 },
    { x: -64, y: 16, rotate: -5, scale: 0.92, zIndex: 2 },
    { x: 34, y: 30, rotate: 3, scale: 0.85, zIndex: 1 },
  ],
  5: [
    { x: -8, y: -6, rotate: -2, scale: 1.15, zIndex: 5 },
    { x: 62, y: -20, rotate: 4, scale: 1.0, zIndex: 4 },
    { x: -64, y: 18, rotate: -5, scale: 0.95, zIndex: 3 },
    { x: 40, y: 34, rotate: 3, scale: 0.88, zIndex: 2 },
    { x: -38, y: -32, rotate: -3, scale: 0.82, zIndex: 1 },
  ],
};

const PRESET_RIGHT: Record<number, SlotLayout[]> = {
  1: [{ x: 0, y: 0, rotate: 1, scale: 1, zIndex: 1 }],
  3: [
    { x: 8, y: -6, rotate: 2, scale: 1.15, zIndex: 3 },
    { x: -54, y: -12, rotate: -4, scale: 1.0, zIndex: 2 },
    { x: 56, y: 20, rotate: 4, scale: 0.9, zIndex: 1 },
  ],
  4: [
    { x: 10, y: -8, rotate: 2, scale: 1.15, zIndex: 4 },
    { x: -58, y: -18, rotate: -4, scale: 1.0, zIndex: 3 },
    { x: 60, y: 18, rotate: 5, scale: 0.9, zIndex: 2 },
    { x: -32, y: 30, rotate: -3, scale: 0.85, zIndex: 1 },
  ],
  5: [
    { x: 10, y: -10, rotate: 2, scale: 1.15, zIndex: 5 },
    { x: -58, y: -24, rotate: -4, scale: 1.0, zIndex: 4 },
    { x: 66, y: 14, rotate: 5, scale: 0.95, zIndex: 3 },
    { x: -36, y: 32, rotate: -3, scale: 0.88, zIndex: 2 },
    { x: 30, y: -34, rotate: 3, scale: 0.82, zIndex: 1 },
  ],
};

const PRESET_HIGH: Record<number, SlotLayout[]> = {
  1: [{ x: 0, y: 0, rotate: 0, scale: 1, zIndex: 1 }],
  3: [
    { x: 0, y: -14, rotate: 1, scale: 1.15, zIndex: 3 },
    { x: 50, y: 10, rotate: -3, scale: 0.95, zIndex: 2 },
    { x: -48, y: 12, rotate: 3, scale: 0.9, zIndex: 1 },
  ],
  4: [
    { x: 0, y: -16, rotate: 1, scale: 1.15, zIndex: 4 },
    { x: 52, y: 6, rotate: -3, scale: 1.0, zIndex: 3 },
    { x: -52, y: 8, rotate: 4, scale: 0.9, zIndex: 2 },
    { x: 0, y: 36, rotate: -2, scale: 0.85, zIndex: 1 },
  ],
  5: [
    { x: 0, y: -18, rotate: 1, scale: 1.15, zIndex: 5 },
    { x: 56, y: 8, rotate: -3, scale: 1.0, zIndex: 4 },
    { x: -56, y: 6, rotate: 4, scale: 0.95, zIndex: 3 },
    { x: 26, y: 34, rotate: -4, scale: 0.86, zIndex: 2 },
    { x: -26, y: 32, rotate: 3, scale: 0.82, zIndex: 1 },
  ],
};

// Assigned to projects by index (see initCarousel) — project 0 gets
// PRESET_LEFT, project 1 gets PRESET_RIGHT, project 2 gets PRESET_HIGH,
// project 3 wraps back to PRESET_LEFT, and so on.
const PRESETS = [PRESET_LEFT, PRESET_RIGHT, PRESET_HIGH];

// The big projects' cards fill the space under the headline (big-cards.css),
// so they sit dead centre instead of on a desk preset.
const CENTERED: SlotLayout = { x: 0, y: 0, rotate: 0, scale: 1, zIndex: 1 };

// On a narrow viewport the full-size offsets above push cards mostly
// off-screen instead of just "spread out" — scale them down instead of
// hand-authoring a second set of presets.
const MOBILE_BREAKPOINT_PX = 640;
const MOBILE_SPREAD_SCALE = 0.55;

// From here the card is the flat desktop bento (project-cards.css, same
// number — 26 * --grid-cell). Its edges sit on the background grid's
// lines, so the preset's rotation must not tilt it. Exported: transition.ts
// needs the same breakpoint to phase the elevator-zoom grid's handover to
// .projects-bg-grid, which shifts at this same width (see style.css).
export const BENTO_MIN_WIDTH_PX = 1248;

// How far off-screen a group starts (entering) / ends up (clearing) — vw
// units so it scales with viewport width, comfortably more than 100 so
// it's off-screen regardless of how wide the group's own spread gets.
const SLIDE_VW = 130;

// "Round track" illusion — no ring, no radius, no sin/cos. The group's x
// stays the only real travel; everything below is derived from it as
// t = -x / SLIDE_VW: -1 (far right) … 0 (center) … +1 (far left).
//   translateY = ARC * t²          parabola: center vs. edges
//   rotateY    = TILT * t          right edge tips in, left edge tips away
//   scale      = 1 - DEPTH * |t|   center slightly larger
// ARC > 0: edges sit lower (group crests a hill in the middle);
// ARC < 0: edges sit higher (group dips through a valley). TILT flips the
// same way — negate it to mirror the lean.
const ARC = 80; // px
const TILT = 22; // deg
const DEPTH = 0.12;
const PERSPECTIVE = 1200; // px, on the stage so rotateY reads as depth
// Compact on narrow viewports so the tilted group stays inside it.
const MOBILE_ARC_SCALE = 0.5;
const MOBILE_TILT_SCALE = 0.6;

// A card's own small slide-in during the build-up phase — deliberately
// modest (unlike the group's full off-screen SLIDE_VW): the group has
// already arrived, this just sells "landing" one at a time.
const CARD_ENTRY_VW = 6;

export function initCarousel(section: HTMLElement) {
  const projectGroups = Array.from(
    section.querySelectorAll<HTMLElement>(".carousel-project"),
  );
  if (projectGroups.length === 0) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: the CSS fallback (see style.css, scoped to
  // :not(.force-motion)) lays each project out as a plain static block
  // with its cards in a small readable row — nothing here needs to run.
  if (reducedMotion) return;

  const { holdUnits, reveal, cardReveal, clear, scrollPerCard, scrub } =
    TIMINGS.projects;
  const isMobile = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
  ).matches;
  const isBento = window.matchMedia(
    `(min-width: ${BENTO_MIN_WIDTH_PX}px)`,
  ).matches;
  const spreadScale = isMobile ? MOBILE_SPREAD_SCALE : 1;
  const arc = ARC * (isMobile ? MOBILE_ARC_SCALE : 1);
  const tilt = TILT * (isMobile ? MOBILE_TILT_SCALE : 1);

  // Derives y/rotateY/scale from the group's current x. Called from the
  // group's slide tweens' onUpdate, so it runs exactly as often as x
  // changes and only ever writes transform.
  const applyTrack = (group: HTMLElement) => {
    // Unitless read: GSAP keeps x in the unit it was set in, and the group's
    // x is only ever set in vw.
    const t = -(gsap.getProperty(group, "x") as number) / SLIDE_VW;
    gsap.set(group, {
      y: arc * t * t,
      rotationY: tilt * t,
      scale: 1 - DEPTH * Math.abs(t),
    });
  };

  // Groups start off-screen right; the group itself is the only thing
  // whose x ever represents "on/off screen" — a card's x only ever
  // represents its own small build-up slide, set up below.
  gsap.set(projectGroups, { xPercent: -50, yPercent: -50, x: `${SLIDE_VW}vw` });
  projectGroups.forEach((group) => {
    if (group.parentElement) {
      gsap.set(group.parentElement, { perspective: PERSPECTIVE });
    }
    applyTrack(group);
  });

  const tl = gsap.timeline({ paused: true });
  // Timeline span of each project category ("big", "tools", "along"):
  // from its first project's slide-in to its last one's slide-out.
  const spans = new Map<string, { start: number; end: number }>();

  projectGroups.forEach((group, i) => {
    const cards = Array.from(
      group.querySelectorAll<HTMLElement>(".pcard"),
    );
    if (cards.length === 0) return;

    const preset = PRESETS[i % PRESETS.length][cards.length];
    if (!preset) return; // no hand-picked layout for this card count — skip rather than guess one

    // Each card's slot (position/rotation/scale) is set once via
    // xPercent/yPercent (percentage-of-its-own-size, same as the slot
    // data) and never touched again; only x — a plain vw offset, kept
    // separate from xPercent on purpose since GSAP can't mix two units
    // in one value the way CSS calc() can — and opacity animate for the
    // small entry slide.
    const big = group.dataset.group === "big";
    cards.forEach((card, ci) => {
      const slot = big ? CENTERED : preset[ci];
      gsap.set(card, {
        xPercent: -50 + slot.x * spreadScale,
        yPercent: -50 + slot.y * spreadScale,
        rotate: isBento ? 0 : slot.rotate,
        scale: slot.scale,
        zIndex: slot.zIndex,
        opacity: 0,
        x: `${CARD_ENTRY_VW}vw`,
      });
    });

    const onSlide = () => applyTrack(group);
    const start = tl.duration();

    tl.to(group, {
      x: "0vw",
      duration: reveal.duration,
      ease: reveal.ease,
      onUpdate: onSlide,
    })
      .to(cards, {
        x: "0vw",
        opacity: 1,
        duration: cardReveal.duration,
        ease: cardReveal.ease,
        stagger: cardReveal.staggerEach,
      })
      .to({}, { duration: holdUnits })
      .to(group, {
        x: `${-SLIDE_VW}vw`,
        duration: clear.duration,
        ease: clear.ease,
        onUpdate: onSlide,
      });
    const key = group.dataset.group ?? "";
    spans.set(key, { start: spans.get(key)?.start ?? start, end: tl.duration() });
  });

  // The category's word pops in on its fixed spot around the headline
  // while its projects are on screen (CSS: .projects-groups--spots).
  // Placed into the same timeline, so it scrubs and reverses with it.
  document.querySelectorAll<HTMLElement>(".projects-groups--spots .projects-group").forEach((label) => {
    const span = spans.get(label.dataset.group ?? "");
    if (!span) return;
    gsap.set(label, { opacity: 0, scale: 0.6 });
    tl.to(label, { opacity: 1, scale: 1, duration: reveal.duration * 0.5, ease: "back.out(2)" }, span.start);
    tl.to(label, { opacity: 0, scale: 0.8, duration: clear.duration * 0.5, ease: "power1.in" }, span.end - clear.duration * 0.5);
  });

  // The fixed "PROJEKTE" headline (see .projects-headline) stays until the
  // last project scrolls out, and fades out together with that last
  // "clear" (the timeline's final tween). In the timeline, not a trigger of
  // its own, so it shares the scrub and reverses with it. It drives the
  // CSS variable --fade, not `opacity` itself: opacity is also switched by
  // transition.ts's hand-over (--handover), and two GSAP writers on one
  // property lose track of each other when scrubbing back or jumping.
  const headline = document.querySelector<HTMLElement>(".projects-headline");
  if (headline) {
    const fade = { v: 1 };
    tl.to(
      fade,
      {
        v: 0,
        duration: clear.duration,
        ease: "none",
        onUpdate: () => headline.style.setProperty("--fade", String(fade.v)),
      },
      tl.duration() - clear.duration,
    );
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: `+=${tl.duration() * scrollPerCard + viewportHeight()}`,
    pin: true,
    scrub,
    animation: tl,
  });
}
