// Custom vertical scroll-progress bar, replacing the native scrollbar
// visually (see style.css for the ::-webkit-scrollbar / scrollbar-width
// rules that hide it) while changing nothing about how scrolling itself
// works. Wheel, trackpad, touch and keyboard scroll all stay 100% native
// and Lenis-driven — this only reads lenis.progress on the existing
// "scroll" event (the same one ScrollTrigger.update is already wired to
// in main.ts) and writes a translateY to the thumb. No second scroll
// source, no rAF loop of its own.
//
// Dragging the thumb is the one place this writes back to scroll state,
// via lenis.scrollTo() — pointer capture keeps the drag tracking even if
// the cursor leaves the thumb, but nothing here ever intercepts wheel/
// touch/keyboard input.

import type Lenis from "lenis";

export function initScrollProgress(lenis: Lenis) {
  const track = document.querySelector<HTMLElement>(".scrollbar");
  const thumb = document.querySelector<HTMLElement>(".scrollbar-thumb");
  if (!track || !thumb) return;

  function render() {
    const travel = Math.max(0, track!.clientHeight - thumb!.clientHeight);
    thumb!.style.transform = `translateY(${lenis.progress * travel}px)`;
  }

  lenis.on("scroll", render);
  window.addEventListener("resize", render, { passive: true });

  // Lenis measures dimensions via a ResizeObserver, which only fires
  // asynchronously after this module's synchronous init — calling here
  // right after the page's full DOM is built means lenis.limit would
  // still read as its initial (near-zero) value otherwise, and
  // progress is defined as 1 when limit is 0 (see lenis's `get
  // progress()`), which briefly snapped the thumb to the bottom on
  // load. Forcing a synchronous resize first avoids that.
  lenis.resize();
  render();

  function seek(clientY: number) {
    const rect = track!.getBoundingClientRect();
    const usable = Math.max(1, rect.height - thumb!.clientHeight);
    const y = clientY - rect.top - thumb!.clientHeight / 2;
    const progress = Math.min(1, Math.max(0, y / usable));
    lenis.scrollTo(progress * lenis.limit, { immediate: true });
  }

  // Listening on window (not the thumb) for move/up is what makes the
  // drag keep tracking once the cursor leaves the thumb's own (3px
  // wide) hit area — pointer capture alone doesn't reliably retarget
  // synthetic/automated pointer events in every environment, and a
  // window-level listener gated by this flag works everywhere.
  let dragging = false;

  thumb.addEventListener("pointerdown", (e) => {
    dragging = true;
    seek(e.clientY);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging) seek(e.clientY);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });
}
