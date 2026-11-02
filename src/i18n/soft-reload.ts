// The language switch still reloads (the scroll scenes measure their text once
// at start-up, see index.ts), but behind a cover: the page's own color spills
// over it (theme/spill.ts), the reload happens underneath, and the cover drains
// away once the new page stands. Looks like a switch in place.
import { spillFrames } from "../theme/spill";

const KEY = "kev-soft-reload";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function cover(color: string) {
  const d = document.createElement("div");
  d.setAttribute("aria-hidden", "true");
  d.style.cssText = `position:fixed;inset:0;z-index:2147483647;background:${color};pointer-events:none`;
  document.documentElement.append(d);
  return d;
}
const pageColor = () => {
  for (const el of [document.body, document.documentElement]) {
    const c = getComputedStyle(el).backgroundColor;
    if (c && c !== "transparent" && c !== "rgba(0, 0, 0, 0)") return c;
  }
  return "#ffffff";
};

export function softReload() {
  const color = pageColor();
  try { sessionStorage.setItem(KEY, color); } catch { /* the cover just won't wait on the other side */ }
  if (reduced() || !Element.prototype.animate) return location.reload();
  const spill = cover(color).animate({ clipPath: spillFrames(innerWidth, innerHeight) }, { duration: 900, easing: "linear", fill: "both" });
  void spill.finished.then(() => location.reload());
}

// The other side of it: covered from the start, drained once the page has loaded.
let color: string | null = null;
try {
  color = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
} catch { /* nothing to cover */ }
// True right after a language switch: pages can skip what a first visit waits for.
export const softReloaded = color !== null;
if (color) {
  const d = cover(color);
  const drain = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (reduced()) return d.remove();
    const frames = spillFrames(innerWidth, innerHeight).reverse();
    const a = d.animate({ clipPath: frames }, { duration: 700, easing: "linear", fill: "both" });
    void a.finished.then(() => d.remove());
  }));
  if (document.readyState === "complete") drain();
  else addEventListener("load", drain, { once: true });
}
