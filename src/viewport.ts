// The height ScrollTrigger itself scrolls and pins against: a `100vh`
// probe, which on phones is the LARGE viewport (address bar retracted) and
// doesn't change when the bar shows/hides — unlike window.innerHeight.
// Anything that has to line up with a ScrollTrigger start/end (pin
// lengths, the headline's exit) must use this, and pinned scenes are sized
// in `vh` (not `svh`) in style.css for the same reason: mixing the two
// leaves the pin off by the address bar's height on mobile.
let probe: HTMLElement | null = null;

export function viewportHeight(): number {
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100vh;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
}

// True when a resize only moved the height — on touch devices that's the
// address bar showing/hiding while scrolling, which must not trigger
// re-layout work (cloth rebuild, canvas realloc, title refit).
export function makeHeightOnlyResizeFilter() {
  let lastWidth = window.innerWidth;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  return () => {
    const heightOnly = isTouch && window.innerWidth === lastWidth;
    lastWidth = window.innerWidth;
    return heightOnly;
  };
}
