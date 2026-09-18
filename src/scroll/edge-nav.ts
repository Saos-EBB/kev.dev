// Header/footer "peek" overlays for the long one-page scroll: a slim
// fixed bar at the very top (.site-header — separate from .hero-nav,
// which stays untouched as part of the hero card itself) and the
// floating footer (.footer--floating) at the very bottom, each only
// visible while scroll progress is within 10% of that edge — out of
// the way during the scroll-driven scenes in between, reachable again
// right where they're needed. Reuses the existing lenis "scroll" event
// (same one the progress bar and ScrollTrigger.update are already
// wired to in main.ts), no separate scroll source.

import type Lenis from "lenis";
import { TIMINGS } from "../timings";

export function initEdgeNav(lenis: Lenis) {
  const header = document.querySelector<HTMLElement>(".site-header");
  const footer = document.querySelector<HTMLElement>(".footer--floating");
  if (!header || !footer) return;

  function render() {
    const progress = lenis.progress;
    const edge = TIMINGS.edgeNav.edge;
    header!.classList.toggle("is-visible", progress <= edge);
    footer!.classList.toggle("is-visible", progress >= 1 - edge);
  }

  lenis.on("scroll", render);
  render();
}
