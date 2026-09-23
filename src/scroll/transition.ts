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
// "PROJEKTE" (.elevator-floor-title) is a plain child of the floor: it lies
// flat on it and stands up with it, so it needs no tween or fade of its own
// — perspective alone makes it unreadable while flat and legible once
// frontal. Its CSS `top` puts it where the wall's visible top ends up. At
// that moment it hands over to the fixed .projects-headline, which
// then stays at the top of the screen while the projects scroll in below.
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
  const relief = aboutSection.querySelector<HTMLElement>(
    ".elevator-floor-relief",
  );
  const vignettes = aboutSection.querySelectorAll<HTMLElement>(
    ".elevator-vignette",
  );
  const floorTitle = aboutSection.querySelector<HTMLElement>(
    ".elevator-floor-title",
  );
  const headline = document.querySelector<HTMLElement>(".projects-headline");
  if (!shaft || !glow || !relief || !floorTitle || !headline) return;

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

  const {
    scrollPerUnit,
    mobileScrollScale,
    scrub,
    holdUnits,
    endHoldUnits,
    rotate,
  } =
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

  // Rest at the end: the scrub lags the scroll by ~`scrub` seconds, so
  // without this the pin would release while the wall is still finishing
  // its last degrees.
  tl.to({}, { duration: endHoldUnits });

  // The floor's own relief: a brief flash, not a sustained reveal — rises
  // and falls quickly around the ~40% mark of the pinned tip-over
  // (partway through the rotation), gone long before the rotation itself
  // finishes at (holdUnits+rotate.duration)/totalDuration. Same
  // start/end/rise/fall the old per-frame canvas version used (see
  // src/about/floor-relief.ts, now dormant) — there it drove a spring-
  // damped push strength every frame; here the relief is two pre-baked
  // images, so a plain scrubbed opacity tween on the same tl gets the
  // same "rises then immediately falls, no plateau" shape for free.
  const FLASH_BAND = { start: 0.32, end: 0.48, rise: 0.06, fall: 0.08 };
  const totalDuration = holdUnits + rotate.duration + endHoldUnits;
  gsap.set(relief, { opacity: 0 });
  tl.to(
    relief,
    { opacity: 1, duration: FLASH_BAND.rise * totalDuration, ease: "power1.in" },
    FLASH_BAND.start * totalDuration,
  );
  tl.to(
    relief,
    { opacity: 0, duration: FLASH_BAND.fall * totalDuration, ease: "power1.out" },
    (FLASH_BAND.end - FLASH_BAND.fall) * totalDuration,
  );

  const pin = ScrollTrigger.create({
    trigger: aboutSection,
    start: "bottom bottom",
    end: `+=${tl.duration() * scrollPerUnit * scrollScale}`,
    pin: true,
    scrub,
    animation: tl,
  });

  // The wall is frontal: hand "PROJEKTE" over from the floor's copy to the
  // fixed headline, which sits on the very same pixels (see
  // .projects-headline) and stays put once the wall scrolls off. Done in
  // the middle of the end rest — while the section is pinned and nothing
  // moves — so the swap can't coincide with the pin releasing (a frame
  // where the pin and a fixed element disagree would show as a jump).
  // Keyed to the scroll position, NOT to the scrubbed timeline: the
  // timeline lags the scroll and would fire late. Stateless, so it works
  // both ways. Only enter/leave-back matter: the headline's fade-out at
  // the end of the projects is carousel.ts's timeline, and it must not be
  // undone by this trigger "ending" (maxScroll is not final at this point
  // of init — the projects/contact pins don't exist yet).
  const setHandOver = (on: boolean) => {
    gsap.set(floorTitle, { opacity: on ? 0 : 1 });
    headline.style.setProperty("--handover", on ? "1" : "0"); // opacity = --handover * --fade, see .projects-headline
  };
  ScrollTrigger.create({
    start: () =>
      pin.start +
      (holdUnits + rotate.duration + endHoldUnits / 2) *
        scrollPerUnit *
        scrollScale,
    end: () => ScrollTrigger.maxScroll(window),
    onEnter: () => setHandOver(true),
    onLeaveBack: () => setHandOver(false),
  });
}
