// Elevator → projects: the camera tips over the floor's near edge.
//
// The elevator's floor lies flat at the bottom of #about, its near edge on
// the section's bottom edge. Once that edge reaches the bottom of the
// viewport #about pins (the elevator stops), and ONE scrubbed timeline
// rotates the whole shaft about that edge (rotateX, pivot set in
// style.css: transform-origin 50% 100%) until the floor stands frontal to
// the camera — a wall carrying the same grid tile as `.projects-bg-grid`.
// The pin then releases and the wall scrolls off exactly as the projects
// section scrolls in below it, its grid continuing line for line.
//
// No morphing and no per-wall unfolding: one rotation, and the floor
// becomes the wall because that is what a rotated floor is. Side
// walls/ceiling/back wall ride along and end up edge-on or out of frame.
//
// Scrub-coupled: scroll position sets the angle directly, so scrolling
// back tips the view back down. Nothing is triggered and played.
//
// What makes the last frame match the projects grid:
//  - floor tile = projects tile (cell, line width, alpha, phase — see the
//    floor rules in style.css; --elevator-depth is a whole number of
//    cells, so the floor's lines land on cell boundaries at the seam);
//  - the floor's extra brightness is a child layer (.elevator-floor-glow)
//    whose opacity is faded to 0 here — no repainting;
//  - the top/bottom vignettes, which the projects grid doesn't have, are
//    faded out here too.
// Driven off the same shared scroll (ScrollTrigger + Lenis) as the
// carousel, not a separate listener.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";

gsap.registerPlugin(ScrollTrigger);

// The floor's resting angle is rotateX(90deg) (style.css); tipping the
// shaft by -90 about the floor's near edge makes the net angle 0 — frontal.
const SHAFT_TIP_DEG = -90;
const MOBILE_BREAKPOINT_PX = 640;

export function initBoxToGridTransition(aboutSection: HTMLElement) {
  const shaft = aboutSection.querySelector<HTMLElement>(".elevator-shaft");
  const glow = aboutSection.querySelector<HTMLElement>(".elevator-floor-glow");
  const vignettes = aboutSection.querySelectorAll<HTMLElement>(
    ".elevator-vignette",
  );
  if (!shaft || !glow) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: no pin, no rotation. The elevator just scrolls off and
  // the projects section's own grid — the same grid — follows: a plain cut
  // from elevator end to frontal grid wall.
  if (reducedMotion) return;

  const { scrollPerUnit, mobileScrollScale, scrub, holdUnits, rotate } =
    TIMINGS.aboutToProjects;
  const scrollScale = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
  ).matches
    ? mobileScrollScale
    : 1;

  // Timeline: hold (elevator has halted, view still) → rotation. The glow
  // and vignettes fade over the same span, linearly against the tween, so
  // they're gone exactly when the wall is frontal.
  const tl = gsap.timeline({ paused: true });
  tl.to({}, { duration: holdUnits }).addLabel("tip");
  tl.to(
    shaft,
    { rotationX: SHAFT_TIP_DEG, duration: rotate.duration, ease: rotate.ease },
    "tip",
  );
  tl.to(
    [glow, ...vignettes],
    { opacity: 0, duration: rotate.duration, ease: "none" },
    "tip",
  );

  ScrollTrigger.create({
    trigger: aboutSection,
    start: "bottom bottom",
    end: `+=${tl.duration() * scrollPerUnit * scrollScale}`,
    pin: true,
    scrub,
    animation: tl,
  });
}
