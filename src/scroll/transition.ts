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
// "SAOS" (.elevator-floor-relief) lives above .elevator-floor-title inside
// a shared wrapper, .elevator-floor-heading — style.css moves PROJEKTE
// --saos-offset lower than its old position to make room for SAOS above
// it. Two phases once the pin starts:
//   Phase A (the hold + rotation above): SAOS fades in and stays up.
//   Phase B (added below, after the wall is frontal): the whole wrapper
//     slides back up by --saos-offset while SAOS fades out, landing
//     PROJEKTE exactly at its original position — the same pixels
//     .projects-headline takes over at, unchanged from before SAOS
//     existed. SAOS drives off the top edge as it goes, so it never
//     needs a handover of its own.
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

// SAOS wordmark fade-in, in the same tl "duration units" as
// holdUnits/rotate.duration/endHoldUnits above — hand-tune here. The
// fade-out has no duration of its own: it spans the whole of Phase B
// (TIMINGS.aboutToProjects.phaseB), simultaneous with the slide-up.
const SAOS_FADE_IN_DURATION = 0.2;

export function initBoxToGridTransition(aboutSection: HTMLElement) {
  const shaft = aboutSection.querySelector<HTMLElement>(".elevator-shaft");
  const glow = aboutSection.querySelector<HTMLElement>(".elevator-floor-glow");
  const heading = aboutSection.querySelector<HTMLElement>(
    ".elevator-floor-heading",
  );
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
  if (!shaft || !glow || !heading || !relief || !floorTitle || !headline) {
    return;
  }

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
    phaseB,
  } =
    TIMINGS.aboutToProjects;
  const scrollScale = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
  ).matches
    ? mobileScrollScale
    : 1;

  // Phase A: hold (elevator has halted, view still) → rotation. The glow
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

  // Rest once frontal: the scrub lags the scroll by ~`scrub` seconds, so
  // without this the rotation would still be finishing its last degrees
  // when Phase B starts sliding things up. Phase A ends here, settled.
  tl.to({}, { duration: endHoldUnits });
  const phaseAEnd = holdUnits + rotate.duration + endHoldUnits;

  // SAOS fades in from the moment the pin starts (progress 0 — "the
  // elevator has stopped, the view holds still") and stays fully visible
  // through the rest of Phase A. Its fade-out lives in Phase B below,
  // not here.
  gsap.set(relief, { opacity: 0 });
  tl.to(relief, { opacity: 1, duration: SAOS_FADE_IN_DURATION, ease: "none" }, 0);

  // Phase B: PROJEKTE currently sits --saos-offset lower than its actual
  // handover position (style.css made room there for SAOS above it) — so
  // once the wall is settled and frontal, slide .elevator-floor-heading
  // (SAOS + PROJEKTE together) back up by exactly that offset, landing
  // PROJEKTE at its real position. SAOS fades out over the same span, so
  // it visibly drives off the top edge as it goes rather than just
  // vanishing. offsetPx comes from the two elements' own resolved `top`
  // (both already derived from --saos-offset in style.css) rather than
  // recomputing the clamp()/gap math here — one source, read twice, not
  // maintained twice. phaseBDuration is a scroll LENGTH (vh) converted to
  // this tl's "duration units" via the same scrollPerUnit/scrollScale
  // conversion the pin's own `end` uses below, so TIMINGS can specify it
  // as a real screen distance instead of an arbitrary relative weight.
  const offsetPx = floorTitle.offsetTop - relief.offsetTop;
  const phaseBScrollPx = window.innerHeight * (phaseB.scrollVh / 100);
  const phaseBDuration = phaseBScrollPx / (scrollPerUnit * scrollScale);
  tl.to(
    heading,
    { y: -offsetPx, duration: phaseBDuration, ease: "power1.inOut" },
    phaseAEnd,
  );
  tl.to(
    relief,
    { opacity: 0, duration: phaseBDuration, ease: "none" },
    phaseAEnd,
  );

  // Settle rest after Phase B too, same reasoning as the one after the
  // rotation above: gives the scrub lag time to catch up before the
  // handover below fires, so the swap never coincides with content still
  // visibly sliding.
  tl.to({}, { duration: endHoldUnits });
  const phaseBEnd = phaseAEnd + phaseBDuration;

  const pin = ScrollTrigger.create({
    trigger: aboutSection,
    start: "bottom bottom",
    end: `+=${tl.duration() * scrollPerUnit * scrollScale}`,
    pin: true,
    scrub,
    animation: tl,
  });

  // Phase B has landed PROJEKTE back at its real position: hand it over
  // from the floor's copy to the fixed headline, which sits on the very
  // same pixels (see .projects-headline) and stays put once the wall
  // scrolls off. Done in the middle of the settle rest above — while the
  // section is pinned and nothing moves — so the swap can't coincide with
  // the pin releasing (a frame where the pin and a fixed element disagree
  // would show as a jump). Keyed to the scroll position, NOT to the
  // scrubbed timeline: the timeline lags the scroll and would fire late.
  // Stateless, so it works both ways. Only enter/leave-back matter: the
  // headline's fade-out at the end of the projects is carousel.ts's
  // timeline, and it must not be undone by this trigger "ending"
  // (maxScroll is not final at this point of init — the projects/contact
  // pins don't exist yet).
  const setHandOver = (on: boolean) => {
    gsap.set(floorTitle, { opacity: on ? 0 : 1 });
    headline.style.setProperty("--handover", on ? "1" : "0"); // opacity = --handover * --fade, see .projects-headline
  };
  ScrollTrigger.create({
    start: () =>
      pin.start +
      (phaseBEnd + endHoldUnits / 2) * scrollPerUnit * scrollScale,
    end: () => ScrollTrigger.maxScroll(window),
    onEnter: () => setHandOver(true),
    onLeaveBack: () => setHandOver(false),
  });
}
