// Lite mode: the project list sits on a wheel. An entry is flat while it
// crosses the middle of the screen; above that it tips back and away over
// the top of the wheel, below it rolls up from behind. Only transform and
// opacity per entry, written once per frame while the page scrolls —
// nothing runs while it stands still. Reduced motion: flat list.

const MAX_TILT = 38; // deg at the screen edge
const DEPTH = 90; // px pushed back at the screen edge
const FLAT_ZONE = 0.25; // fraction of the half-screen around the middle that stays flat
// The sticky "Projekte" title (style.css) starts leaving once the last
// entry's bottom edge rises above this fraction of the screen, so it
// scrolls off together with the last project instead of outstaying it.
const TITLE_EXIT = 0.55;

export function initProjectWheel(root: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !document.documentElement.classList.contains("force-motion")) return;

  const entries = Array.from(root.querySelectorAll<HTMLElement>(".ptease"));
  const title = root.querySelector<HTMLElement>(".projects-title");
  if (!entries.length) return;

  let queued = false;

  const update = () => {
    queued = false;
    const half = window.innerHeight / 2;
    for (const el of entries) {
      // Our own transform turns and pushes the entry around its own
      // center, so the rect's center is still where the layout put it.
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      // -1 at the top edge, 0 in the middle, +1 at the bottom edge.
      const d = Math.max(-1.6, Math.min(1.6, (center - half) / half));
      const a = Math.max(0, Math.abs(d) - FLAT_ZONE) / (1 - FLAT_ZONE);
      const tilt = Math.sign(d) * -Math.min(a, 1.4) * MAX_TILT;
      el.style.transform = `perspective(900px) translateZ(${-Math.min(a, 1.4) * DEPTH}px) rotateX(${tilt}deg)`;
      el.style.opacity = String(Math.max(0, 1 - Math.max(0, a - 0.35) * 0.9));
    }
    if (title) {
      const lastBottom = entries[entries.length - 1].getBoundingClientRect().bottom;
      const lift = Math.min(0, lastBottom - window.innerHeight * TITLE_EXIT);
      title.style.transform = lift ? `translateY(${lift}px)` : "";
    }
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  update();
}
