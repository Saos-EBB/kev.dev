// Header/footer "peek" overlays for the long one-page scroll: a slim
// fixed bar at the very top (.site-header — the page's only nav bar;
// the hero no longer carries its own) and the floating footer
// (.footer--floating) at the very bottom. Visible two ways, either is
// enough:
//  - scroll position within 10% of that edge (top/bottom of the whole
//    page) — the "just there" case right where you'd expect it.
//  - the pointer sitting near the top/bottom edge of the *viewport* —
//    reachable from anywhere in the scroll, not just the page's own
//    edges, the same "hover the screen edge to reveal chrome" pattern
//    as an auto-hiding browser toolbar.
// Reuses the existing lenis "scroll" event (same one the progress bar
// and ScrollTrigger.update are already wired to in main.ts), no
// separate scroll source for the scroll-position half.

import type Lenis from "lenis";
import { TIMINGS } from "../timings";
import { LITE } from "../viewport";

export function initEdgeNav(lenis: Lenis) {
  const header = document.querySelector<HTMLElement>(".site-header");
  const footer = document.querySelector<HTMLElement>(".footer--floating");
  if (!header || !footer) return;

  if (LITE) {
    initDirectionalNav(lenis, header, footer);
    return;
  }

  // -1 = no pointer seen yet (touch-only devices never set this), so the
  // hover checks below simply never fire and scroll position alone
  // decides visibility, same as before.
  let pointerY = -1;

  function render() {
    const progress = lenis.progress;
    const edge = TIMINGS.edgeNav.edge;
    const zone = TIMINGS.edgeNav.hoverZone;
    const nearTop = pointerY >= 0 && pointerY <= zone;
    const nearBottom = pointerY >= 0 && pointerY >= window.innerHeight - zone;

    // Also while the pointer or keyboard focus is in the header itself —
    // the language menu hangs below the hover zone.
    const inHeader = header!.matches(":hover, :focus-within");
    header!.classList.toggle("is-visible", progress <= edge || nearTop || inHeader);
    footer!.classList.toggle("is-visible", progress >= 1 - edge || nearBottom);
  }

  lenis.on("scroll", render);

  window.addEventListener(
    "pointermove",
    (e) => {
      pointerY = e.clientY;
      render();
    },
    { passive: true },
  );
  // No relatedTarget means the pointer left the whole window, not just
  // one element within it — same check cloth.ts uses for its own hover
  // tracking.
  document.addEventListener("pointerout", (e) => {
    if (!e.relatedTarget) {
      pointerY = -1;
      render();
    }
  });

  render();
}

// Lite page (phones / narrow tablets): no hover, and the bars are slim
// one-liners, so they follow the scroll direction instead — scrolling
// down slides both away to free the screen, scrolling up brings both back
// (the usual mobile-browser pattern). The header is always there at the
// very top, the footer at the very bottom. Direction only flips after
// FLIP_PX of travel, so a finger's small wobble doesn't make them flicker.
const FLIP_PX = 12;
const TOP_PX = 60;

function initDirectionalNav(lenis: Lenis, header: HTMLElement, footer: HTMLElement) {
  let lastY = lenis.scroll;
  let travel = 0; // px moved in the current direction (signed)
  let up = true;

  function render() {
    const y = lenis.scroll;
    const dy = y - lastY;
    lastY = y;
    if (dy !== 0) {
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
      if (Math.abs(travel) >= FLIP_PX) up = travel < 0;
    }
    const atTop = y <= TOP_PX;
    const atBottom = lenis.limit - y <= TOP_PX;
    header.classList.toggle("is-visible", atTop || up);
    footer.classList.toggle("is-visible", atBottom || (up && !atTop));
  }

  lenis.on("scroll", render);
  render();
}
