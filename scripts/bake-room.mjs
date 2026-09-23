#!/usr/bin/env node
// Bakes the office at the shaft's bottom (desk + monitor, one plant) into
// src/assets/room.svg: simple 3D solids in the shaft's own world units,
// projected with exactly the shaft's perspective at the END of the ride,
// hidden surfaces removed with a painter's algorithm. Build-time tool, run
// by hand, no dependencies:
//
//   node scripts/bake-room.mjs
//
// Camera model (see style.css .elevator / about/elevator.ts): the shaft is
// seen through `perspective: 1200px`, and at the end of the ride the
// perspective-origin is the viewport centre (trackElevatorPerspective).
// Camera space here: origin on the eye axis in the picture plane (the
// section's plane, z = 0), X right, Y DOWN, Z toward the eye, so the shaft
// runs from z = 0 to z = -DEPTH. A point projects with k = P / (P - z):
//   screenX = VW/2 + X * k,  screenY = VH/2 + Y * k.
// The floor is the section's bottom edge, i.e. Y = +VH/2.
//
// The shaft's size depends on the viewport, so this bakes for a reference
// viewport (REF_VW x REF_VH); style.css scales the result with vh.

import { writeFileSync } from "node:fs";

// --- constants, from style.css / the shaft ------------------------------
const PERSPECTIVE = 1200; // --elevator-perspective
const DEPTH = 1440; // --elevator-depth (back wall at z = -DEPTH)
const CELL = 48; // --grid-cell (desktop): world spacing of the grid on the objects
const REF_VW = 1440;
const REF_VH = 900;
const FLOOR_Y = REF_VH / 2; // section bottom edge = viewport bottom at ride end
const EYE = [0, 0, PERSPECTIVE];

// --- objects, camera space (Y down, floor at FLOOR_Y) -------------------
const DESK_Z = [-1300, -1060];
const DESK_TOP = FLOOR_Y - 190; // top surface of the desk plate
const boxes = [
  // desk: plate + four legs
  { x: [-270, 270], y: [DESK_TOP, DESK_TOP + 20], z: DESK_Z, grid: true },
  ...[-250, 230].flatMap((x) =>
    [-1280, -1100].map((z) => ({
      x: [x, x + 20],
      y: [DESK_TOP + 20, FLOOR_Y],
      z: [z, z + 20],
      grid: true,
    })),
  ),
  // monitor: foot, neck, body (front face frontal at z = MON_FRONT)
  { x: [-45, 45], y: [DESK_TOP - 6, DESK_TOP], z: [-1205, -1155] },
  { x: [-12, 12], y: [DESK_TOP - 34, DESK_TOP - 6], z: [-1200, -1188] },
  { x: [-170, 170], y: [DESK_TOP - 230, DESK_TOP - 34], z: [-1200, -1184] },
];
const MON_FRONT = -1184;
const SCREEN = { x: [-162, 162], y: [DESK_TOP - 222, DESK_TOP - 64] }; // on the front face
const LED = [0, DESK_TOP - 49, MON_FRONT];

// plant: pot (square frustum) + a few flat leaves
const PLANT = [-350, -1180];
const POT_H = 80;
const pot = { bottom: 34, top: 46 };
const LEAF_BASE = [PLANT[0], FLOOR_Y - POT_H, PLANT[1]];
const leaves = [
  // yaw (deg), lean from vertical (deg), length, width
  [10, 20, 170, 56],
  [80, 42, 150, 52],
  [150, 36, 158, 54],
  [220, 46, 140, 50],
  [290, 38, 152, 52],
];

// --- geometry helpers ----------------------------------------------------
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const centroid = (pts) => pts[0].map((_, i) => pts.reduce((s, p) => s + p[i], 0) / pts.length);

function project([x, y, z]) {
  const k = PERSPECTIVE / (PERSPECTIVE - z);
  return [REF_VW / 2 + x * k, REF_VH / 2 + y * k];
}

const faces = [];

// A solid's faces, each with an outward normal (from the solid's centre)
// and back-face culling against the eye. `grid` adds world-aligned lines.
function addSolid(polys, style, gridBox) {
  const centre = centroid(polys.flat());
  for (const pts of polys) {
    const c = centroid(pts);
    let n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
    if (dot(n, sub(c, centre)) < 0) n = n.map((v) => -v);
    if (dot(n, sub(EYE, c)) <= 0) continue; // faces away from the camera
    faces.push({ pts, style, c, grid: gridBox, n });
  }
}

function boxPolys({ x, y, z }) {
  const P = (i, j, k) => [x[i], y[j], z[k]];
  return [
    [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], // back
    [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], // front
    [P(0, 0, 0), P(0, 0, 1), P(0, 1, 1), P(0, 1, 0)], // left
    [P(1, 0, 0), P(1, 0, 1), P(1, 1, 1), P(1, 1, 0)], // right
    [P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], // top
    [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], // bottom
  ];
}

for (const b of boxes) addSolid(boxPolys(b), "solid", b.grid ? b : null);

// pot: square frustum
{
  const [px, pz] = PLANT;
  const ring = (h, y) => [
    [px - h, y, pz - h],
    [px + h, y, pz - h],
    [px + h, y, pz + h],
    [px - h, y, pz + h],
  ];
  const lo = ring(pot.bottom, FLOOR_Y);
  const hi = ring(pot.top, FLOOR_Y - POT_H);
  const polys = [lo, hi];
  for (let i = 0; i < 4; i++) polys.push([lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]]);
  addSolid(polys, "solid", null);
}

// leaves: flat kites, double-sided, never culled
for (const [yawDeg, leanDeg, len, wid] of leaves) {
  const yaw = (yawDeg * Math.PI) / 180;
  const lean = (leanDeg * Math.PI) / 180;
  const d = [Math.sin(lean) * Math.cos(yaw), -Math.cos(lean), Math.sin(lean) * Math.sin(yaw)];
  const s = [-Math.sin(yaw), 0, Math.cos(yaw)];
  const at = (t, side) =>
    LEAF_BASE.map((v, i) => v + d[i] * len * t + s[i] * (wid / 2) * side);
  const pts = [at(0, 0), at(0.4, 1), at(1, 0), at(0.4, -1)];
  faces.push({ pts, style: "leaf", c: centroid(pts), grid: null, n: null });
}

// Painter's algorithm: farthest (centroid to eye) first.
faces.sort((a, b) => Math.hypot(...sub(b.c, EYE)) - Math.hypot(...sub(a.c, EYE)));

// --- grid lines: world-aligned, same spacing as the shaft's grid ---------
// For an axis-aligned box face: lines at every multiple of CELL along the two
// axes the face spans, drawn across the face's extent.
function gridLines(face) {
  const { pts, grid: box } = face;
  const ranges = [box.x, box.y, box.z];
  const flat = [0, 1, 2].filter((a) => pts.every((p) => p[a] === pts[0][a]))[0];
  const spans = [0, 1, 2].filter((a) => a !== flat);
  const lines = [];
  for (const [along, across] of [spans, [spans[1], spans[0]]]) {
    const [lo, hi] = ranges[across];
    for (let v = Math.ceil(lo / CELL) * CELL; v <= hi; v += CELL) {
      if (v <= lo || v >= hi) continue;
      const a = [0, 0, 0];
      const b = [0, 0, 0];
      a[flat] = b[flat] = pts[0][flat];
      a[across] = b[across] = v;
      a[along] = ranges[along][0];
      b[along] = ranges[along][1];
      lines.push([project(a), project(b)]);
    }
  }
  return lines;
}

// --- output ---------------------------------------------------------------
const f = (n) => Math.round(n * 100) / 100;
const path = (pts) => "M" + pts.map((p) => p.map(f).join(" ")).join("L") + "Z";

let body = "";
const allPts = [];
for (const face of faces) {
  const pts = face.pts.map(project);
  allPts.push(...pts);
  body += `<path class="room-${face.style}" d="${path(pts)}"/>`;
  if (face.grid) {
    for (const [a, b] of gridLines(face)) {
      body += `<path class="room-grid" d="M${a.map(f).join(" ")}L${b.map(f).join(" ")}"/>`;
    }
  }
}

// Monitor screen: frontal, so a plain rect. #screen carries only position;
// the live HTML screen is placed over its bounding box (see transition.ts).
const [sx0, sy0] = project([SCREEN.x[0], SCREEN.y[0], MON_FRONT]);
const [sx1, sy1] = project([SCREEN.x[1], SCREEN.y[1], MON_FRONT]);
const stroke = 1.5;
body += `<rect id="screen" x="${f(sx0)}" y="${f(sy0)}" width="${f(sx1 - sx0)}" height="${f(sy1 - sy0)}" fill="none" stroke="none"/>`;
// Accent frame just OUTSIDE the screen rect, so it is off-canvas once the
// screen fills the viewport.
body += `<rect class="room-accent" x="${f(sx0 - stroke / 2)}" y="${f(sy0 - stroke / 2)}" width="${f(sx1 - sx0 + stroke)}" height="${f(sy1 - sy0 + stroke)}"/>`;
const [lx, ly] = project(LED);
body += `<circle class="room-led" cx="${f(lx)}" cy="${f(ly)}" r="2"/>`;

// viewBox: symmetric about the shaft's centre line so the SVG can be
// centred; bottom = the lowest point (the pot's / desk's feet).
const margin = 4;
const half = Math.max(...allPts.map((p) => Math.abs(p[0] - REF_VW / 2))) + margin;
const top = Math.min(...allPts.map((p) => p[1])) - margin;
const bottom = Math.max(...allPts.map((p) => p[1])) + margin;
const vbW = 2 * half;
const vbH = bottom - top;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(REF_VW / 2 - half)} ${f(top)} ${f(vbW)} ${f(vbH)}">
<style>
.room-solid,.room-leaf{fill:var(--about-bg,#08070a);stroke:var(--color-room-line,#faebd7);stroke-width:1.5;stroke-linejoin:round}
.room-leaf,.room-accent{stroke:var(--color-room-accent,#9370db)}
.room-accent{fill:none;stroke-width:${stroke}}
.room-grid{fill:none;stroke:var(--color-room-line,#faebd7);stroke-width:.75;opacity:.3}
.room-led{fill:var(--color-room-accent,#9370db)}
</style>
${body}</svg>
`;
writeFileSync(new URL("../src/assets/room.svg", import.meta.url), svg);

console.log(`room.svg  viewBox ${f(vbW)} x ${f(vbH)}`);
console.log(`--room-aspect: ${f(vbW)} / ${f(vbH)}`);
console.log(`--room-height-vh: ${f((vbH / REF_VH) * 100)}  (svg height in vh)`);
console.log(`--room-bottom-vh: ${f(((REF_VH - bottom) / REF_VH) * 100)}  (svg bottom above section bottom)`);
