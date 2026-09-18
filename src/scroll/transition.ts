// Box → grid handoff between About and Projects. `.projects-bg-grid` is
// just always visible (plain CSS opacity: 1, nothing here touches it) —
// #projects only ever enters the viewport from the bottom during this
// same scroll (About's shrinking remainder sits above it, Projects'
// growing remainder below), so there both never is and never needs to be
// a moment where the entering section's grid isn't already there. All
// this module animates is the About side:
//  - the floor panel unfolds (rotateX 90deg -> 0deg, its resting CSS
//    transform is the 90deg tunnel-floor look) while also dropping down
//    the screen (translateY) — rotation alone reads as the far edge
//    *lifting up*, which is the opposite of the "tips downward toward
//    you" feel we want, so the added drop cancels that and sells it as
//    the panel falling/tipping down into place instead of swinging open.
//  - the whole shaft gets pushed toward the viewer (translateZ) over the
//    same range, a camera-dolly-in accent on top of the ordinary scroll.
//  - left/right walls fade out alongside it. Ceiling/backwall are left
//    alone; they're out of frame well before the floor's done anyway.
//
// Driven off the same shared scroll (ScrollTrigger, wired to Lenis in
// main.ts) as the carousel, not a separate listener.
//
// Skeleton only — none of these curves/magnitudes are tuned yet.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";

gsap.registerPlugin(ScrollTrigger);

const FLOOR_REST_ANGLE = 90; // matches .elevator-wall--floor's resting rotateX in style.css
const FLOOR_DROP_PX = 220; // how far the floor sinks down-screen as it flattens
const DOLLY_PUSH_PX = 450; // how far the whole shaft pushes toward the viewer (< --elevator-perspective's 1200px, well clear of the camera plane)
const EXTRA_VH = 1; // extra viewport-heights of scroll added before the unfold starts, on top of the 1vh it always gets from "top bottom" to "top top"

export function initBoxToGridTransition(
  aboutSection: HTMLElement,
  projectsSection: HTMLElement,
) {
  const shaft = aboutSection.querySelector<HTMLElement>(".elevator-shaft");
  const left = aboutSection.querySelector<HTMLElement>(
    ".elevator-wall--left",
  );
  const right = aboutSection.querySelector<HTMLElement>(
    ".elevator-wall--right",
  );
  const floor = aboutSection.querySelector<HTMLElement>(
    ".elevator-wall--floor",
  );
  if (!shaft || !left || !right || !floor) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: no scrub, no rotation. The walls just keep their
  // resting transform/opacity and scroll off with the rest of the page
  // (ordinary scroll, not an animation) — `.projects-bg-grid` is already
  // there regardless, so it's a hard cut instead of a staged unfold.
  if (reducedMotion) return;

  function apply(progress: number) {
    const sideOpacity = 1 - progress;
    const floorAngle = FLOOR_REST_ANGLE * (1 - progress);
    const floorDrop = FLOOR_DROP_PX * progress;
    const dollyZ = DOLLY_PUSH_PX * progress;

    left!.style.opacity = String(sideOpacity);
    right!.style.opacity = String(sideOpacity);
    floor!.style.transform = `translateY(${floorDrop}px) rotateX(${floorAngle}deg)`;
    shaft!.style.transform = `translateZ(${dollyZ}px)`;
  }

  apply(0);

  ScrollTrigger.create({
    trigger: projectsSection,
    start: `top bottom+=${EXTRA_VH * 100}%`,
    end: "top top",
    scrub: TIMINGS.aboutToProjects.scrub,
    onUpdate: (self) => apply(self.progress),
  });
}
