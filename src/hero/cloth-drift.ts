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

// The same field for a regular grid (rest x per column, rest y per row),
// without per-node trig: sin(a + b) = sin a·cos b + cos a·sin b, with the
// x part fixed per column and the y + time part computed once per row and
// frame. driftOffset does 6 sines per node and frame; this does them per
// row, which on the desktop mesh is about 100× fewer.
export function makeGridDrift(xs: number[], ys: number[]) {
  const W = waves.length, C = xs.length, R = ys.length;
  const colSin = new Float32Array(W * C), colCos = new Float32Array(W * C);
  waves.forEach((w, i) => xs.forEach((x, c) => {
    colSin[i * C + c] = Math.sin(w.kx * x);
    colCos[i * C + c] = Math.cos(w.kx * x);
  }));
  const rSX = new Float32Array(W * R), rCX = new Float32Array(W * R);
  const rSY = new Float32Array(W * R), rCY = new Float32Array(W * R);
  return {
    // once per frame
    update(seconds: number) {
      waves.forEach((w, i) => ys.forEach((y, r) => {
        const b = w.ky * y + w.speed * seconds, k = i * R + r;
        rSX[k] = Math.sin(b + w.phaseX); rCX[k] = Math.cos(b + w.phaseX);
        rSY[k] = Math.sin(b + w.phaseY); rCY[k] = Math.cos(b + w.phaseY);
      }));
    },
    // offset of the node in column c, row r, written into out
    at(c: number, r: number, out: { x: number; y: number }) {
      out.x = 0;
      out.y = 0;
      for (let i = 0; i < W; i++) {
        const s = colSin[i * C + c], co = colCos[i * C + c], k = i * R + r;
        out.x += (s * rCX[k] + co * rSX[k]) * AMPLITUDE;
        out.y += (s * rCY[k] + co * rSY[k]) * AMPLITUDE;
      }
    },
  };
}
