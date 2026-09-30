// Autonomous "pull" gestures for the hero cloth — a scripted grab-drag-
// release that reuses the same single-node pin cloth.ts already applies
// for a real click-drag, just driven by a timer instead of the pointer.
//
// Two kinds:
//   - the intro pull, once, shortly after the page loads: grabs the point
//     between the name's first letter and the "J" of the subtitle below
//     it, and hauls it up to the opposite (top) corner of the hero card,
//     then lets go.
//   - idle pulls, repeating a random few seconds apart for as long as the
//     page stays open: grab a node resting out past the visible card (in
//     REST_EXPANSE's hidden fringe — see cloth.ts) and yank it hard in a
//     random direction. The grabbed point itself is never on screen, only
//     the tension it puts through the mesh right at the edge of the frame.
//
// Self-contained on purpose — to turn it off, set PULLS_ENABLED = false;
// to remove it, delete this file and the lines marked "cloth-pulls" in
// cloth.ts.

export const PULLS_ENABLED = true;

export const INTRO_DELAY_MS = 250; // wait after load before the intro grab starts
export const INTRO_PULL_MS = 650; // time spent hauling the point to its target
export const INTRO_HOLD_MS = 150; // brief hold at full stretch before letting go — together with the two above, releases ~1s after load
export const INTRO_STRENGTH = 0.4; // lerp/frame while pulled — firmer than ambient hover, softer than a real hard grab

export const IDLE_DELAY_MIN_MS = 3500; // gap between one idle pull ending and the next starting
export const IDLE_DELAY_MAX_MS = 7000;
export const IDLE_PULL_MS = 500;
export const IDLE_HOLD_MS = 250;
export const IDLE_STRENGTH = 0.55; // "thick" — a harder yank than the intro's
export const IDLE_DISTANCE_MIN = 180; // px, how far off its rest point the idle target lands
export const IDLE_DISTANCE_MAX = 380;

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Decelerating ease — the pulled point arrives briskly then settles, same
// shape as the rest of the site's GSAP "power2.out"/"power1.in" tweens.
export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
