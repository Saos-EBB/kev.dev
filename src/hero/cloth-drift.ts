// Constant, random ambient movement for the hero cloth.
//
// A few slow plane waves with random direction, wavelength, speed and
// phase (rolled once per page load) shift each node's resting point a few
// px. cloth.ts's anchor spring then pulls the node toward that moving
// target, so the constraints smooth it into a soft, never-repeating ripple.
//
// Self-contained on purpose — to turn it off, set DRIFT_ENABLED = false;
// to remove it, delete this file and the lines marked "cloth-drift" in
// cloth.ts.

export const DRIFT_ENABLED = true;

const WAVE_COUNT = 3;
const AMPLITUDE = 5; // px, per wave, per axis
const WAVELENGTH_MIN = 300; // px
const WAVELENGTH_MAX = 900; // px
const SPEED_MIN = 0.15; // rad/s
const SPEED_MAX = 0.45; // rad/s

interface Wave {
  kx: number; // spatial frequency along x (rad/px)
  ky: number; // spatial frequency along y (rad/px)
  speed: number; // rad/s
  phaseX: number; // separate phases so x and y don't move in lockstep
  phaseY: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const waves: Wave[] = Array.from({ length: WAVE_COUNT }, () => {
  const angle = rand(0, Math.PI * 2);
  const k = (Math.PI * 2) / rand(WAVELENGTH_MIN, WAVELENGTH_MAX);
  return {
    kx: Math.cos(angle) * k,
    ky: Math.sin(angle) * k,
    speed: rand(SPEED_MIN, SPEED_MAX) * (Math.random() < 0.5 ? -1 : 1),
    phaseX: rand(0, Math.PI * 2),
    phaseY: rand(0, Math.PI * 2),
  };
});

// Offset of the resting point at (x, y) at time `seconds`. Written into
// `out` instead of returning a fresh object — it runs per node per frame.
export function driftOffset(
  x: number,
  y: number,
  seconds: number,
  out: { x: number; y: number },
) {
  out.x = 0;
  out.y = 0;
  for (const w of waves) {
    const arg = w.kx * x + w.ky * y + w.speed * seconds;
    out.x += Math.sin(arg + w.phaseX) * AMPLITUDE;
    out.y += Math.sin(arg + w.phaseY) * AMPLITUDE;
  }
}
