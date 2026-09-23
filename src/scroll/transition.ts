// Elevator → projects: the ride ends at the shaft's floor.
//
// The ride itself is plain scrolling (see about/elevator.ts). Once the
// floor's near edge reaches the bottom of the viewport #about pins (the
// elevator has stopped) for a short hold, then releases and the projects
// section scrolls in below it. The office (.office, style.css) has risen
// into view with the last stretch of the ride and stands still meanwhile.
//
// Scrub-coupled: scroll position sets the timeline position directly, so
// scrolling back rewinds. Nothing is triggered and played. Driven off the
// same shared scroll (ScrollTrigger + Lenis) as the carousel.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT_PX = 640;

export function initBoxToGridTransition(aboutSection: HTMLElement) {
  const headline = document.querySelector<HTMLElement>(".projects-headline");
  if (!headline) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: no pin. The elevator just scrolls off and the projects
  // section follows: a plain cut.
  if (reducedMotion) return;

  const { scrollPerUnit, mobileScrollScale, scrub, holdUnits } =
    TIMINGS.aboutToProjects;
  const scrollScale = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
  ).matches
    ? mobileScrollScale
    : 1;

  const tl = gsap.timeline({ paused: true });
  tl.to({}, { duration: holdUnits });

  const pin = ScrollTrigger.create({
    trigger: aboutSection,
    start: "bottom bottom",
    end: `+=${tl.duration() * scrollPerUnit * scrollScale}`,
    pin: true,
    scrub,
    animation: tl,
  });

  // The fixed .projects-headline takes over as the pin releases. Keyed to
  // the scroll position; stateless, so it works both ways. Only
  // enter/leave-back matter: the headline's fade-out at the end of the
  // projects is carousel.ts's timeline (maxScroll is not final at this
  // point of init — the projects/contact pins don't exist yet).
  ScrollTrigger.create({
    start: () => pin.end,
    end: () => ScrollTrigger.maxScroll(window),
    onEnter: () => headline.style.setProperty("--handover", "1"),
    onLeaveBack: () => headline.style.setProperty("--handover", "0"),
  });
}
