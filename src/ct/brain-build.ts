// Procedural brain kit for the CT skull (the Kopf-CT page, /ct-look):
// every region is its own piece, the pieces visibly "plugged together"
// (grooves along every border), rendered as dots. Not a model from the 3D
// renderer: modelled here, out of spheres. Started as a port of the offline
// prototype that made the CT-Schädel mockup images ("#skull infos /
// ct-skull-prototype.html"); the folds, the cut faces and the dots' spread
// are newer.
//
// Pure geometry, no DOM: runs in brain.worker.ts (too slow for the main
// thread), with a main-thread fallback in brain.ts.
//
// Coordinates as the skull after its remap: +z face/front, +y up, x
// sideways; left hemisphere side = -1 (x < 0). Speech areas left only.
import * as THREE from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { mulberry, scatter } from "./dots";
import endo from "./endocast.json";

export const REG = ["frontal", "motor", "parietal", "occipital", "temporal", "broca", "wernicke", "fusiform", "cerebellum", "stem"] as const;
export const DEEP = ["amygdala", "hippocampus", "thalamus", "accumbens"] as const;
export type Region = (typeof REG)[number];
export type Deep = (typeof DEEP)[number];
export type Part = Region | Deep;
// One index space for both: regions 0–9, deep structures 10–13.
export const PARTS: readonly Part[] = [...REG, ...DEEP];

// Deep structures: centre (x, y, z) and radius, shown only when lit —
// in the kit's own space; buildBrain() returns them fitted (BrainData.deep).
const DEEP_AT: Record<Deep, [number, number, number, number]> = {
  amygdala: [-0.27, -0.22, 0.2, 0.07],
  hippocampus: [-0.27, -0.2, -0.08, 0.06],
  thalamus: [-0.08, 0.02, -0.12, 0.09],
  accumbens: [-0.1, -0.1, 0.3, 0.05],
};

const sm = (e0: number, e1: number, t: number) => {
  const u = Math.min(Math.max((t - e0) / (e1 - e0), 0), 1);
  return u * u * (3 - 2 * u);
};
// Region borders tuned against Gray's lateral view (Gray728, public domain):
// the Sylvian fissure rises only gently from the temporal pole to its end,
// behind it the temporal/parietal border runs almost level to the
// occipital lobe, which takes the last ~15 % of the length.
const ys = (z: number) => -0.06 - 0.16 * sm(-0.05, 0.45, z); // Sylvian fissure: y on the unit sphere, by z
const zc = (y: number) => -0.06 + (1 - y) * 0.16; // central sulcus: z, by y

function region(noise: ImprovedNoise, n: { x: number; y: number; z: number }, side: number): Region {
  const j = 0.05 * noise.noise(n.x * 3.1 + 11, n.y * 3.1, n.z * 3.1);
  const x = n.x, y = n.y + j, z = n.z + j * 0.7;
  const s = ys(z), c = zc(y);
  if (y < s && z < 0.5 && z > -0.6 && x > -0.2) {
    if (y < s - 0.55 || (x < 0.35 && y < -0.55)) return "fusiform";
    if (side < 0 && ((z + 0.33) / 0.2) ** 2 + ((y - (s - 0.13)) / 0.13) ** 2 < 1) return "wernicke";
    return "temporal";
  }
  if (z < -0.56 + 0.1 * y) return "occipital";
  if (z < c) return "parietal";
  if (z < c + 0.16) return "motor";
  if (side < 0 && x > 0.2 && ((z - (c + 0.32)) / 0.15) ** 2 + ((y - (s + 0.13)) / 0.12) ** 2 < 1) return "broca";
  return "frontal";
}

// A unit sphere of even triangles (no poles, no seam), welded. Every
// geometry here is welded and free of collapsed triangles, so a mesh edge
// is a real edge.
function ball(detail: number) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  return mergeVertices(g, 1e-5);
}
function weld(g: THREE.BufferGeometry) {
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  const m = mergeVertices(g, 1e-5);
  const idx = m.index!.array, kept: number[] = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    if (a !== b && b !== c && a !== c) kept.push(a, b, c);
  }
  m.setIndex(kept);
  return m;
}
const constant = (g: THREE.BufferGeometry, name: string, value: number) =>
  g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(g.getAttribute("position").count).fill(value), 1));

// 1 on a sulcus' line, falling to 0 within SULCUS_W of it. The distance to
// the line is the field's value over its slope, so the line is equally
// wide everywhere (the value alone gives blots where the field runs flat).
const SULCUS_W = 0.125; // in the field's units; / ~5 = world units
function sulcus(noise: ImprovedNoise, x: number, y: number, z: number) {
  const field = (x: number, y: number, z: number) =>
    noise.noise(x + 0.9 * noise.noise(x * 0.45 + 3, y * 0.45, z * 0.45), y + 0.9 * noise.noise(x * 0.45, y * 0.45 + 9, z * 0.45), z);
  const h = 0.04, v = field(x, y, z);
  const slope = Math.hypot(field(x + h, y, z) - v, field(x, y + h, z) - v, field(x, y, z + h) - v) / h;
  return Math.exp(-((v / Math.max(slope, 0.25) / SULCUS_W) ** 2));
}

// `fold` per vertex: 0 on a gyrus' crown, 1 at the bottom of a sulcus.
function hemisphere(noise: ImprovedNoise, base: THREE.BufferGeometry, side: number) {
  const g = base.clone();
  const pos = g.getAttribute("position");
  const reg = new Float32Array(pos.count), fold = new Float32Array(pos.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = { x: v.x * side, y: v.y, z: v.z };
    reg[i] = REG.indexOf(region(noise, n, side));
    let px = Math.max(n.x, -0.12) * 0.54 + 0.05; // flat medial side, small gap to the midline
    let py = v.y * 0.6;
    let pz = v.z * 0.95;
    if (v.y < 0) py *= 0.74; // flatter base
    // Temporal lobe hanging below like a thumb — continuous weights, never
    // per region, or the surface tears.
    const tw = sm(0.02, -0.18, v.y - ys(v.z)) * sm(0.62, 0.4, v.z) * sm(-0.7, -0.5, v.z) * sm(-0.3, 0.1, n.x);
    py -= 0.1 * tw;
    px += 0.035 * tw * Math.max(0, n.x);
    pz -= 0.12 * tw * sm(0.15, 0.45, v.z);
    py += 0.06 * sm(0.25, 0.5, v.z) * sm(0.1, -0.25, v.y) * (1 - tw); // orbitofrontal underside higher
    py += 0.12 * sm(-0.4, -0.75, v.z) * sm(0.0, -0.4, v.y); // tentorium: room for the cerebellum
    // Sulci: the lines where a (warped) noise field crosses zero — long,
    // winding and about a gyrus apart. They cut in, the crowns between
    // them bulge out a little.
    const f = sulcus(noise, pz * 4.6, py * 5.6, px * 5.6 + side * 7);
    const d = (0.014 * (1 - f) - 0.04 * f) * (0.35 + 0.65 * sm(-0.14, -0.04, n.x)); // shallower on the medial side
    const len = Math.hypot(px, py, pz);
    fold[i] = f;
    pos.setXYZ(i, (px + (px / len) * d) * side, py + (py / len) * d + 0.12, pz + (pz / len) * d - 0.02);
  }
  g.setAttribute("region", new THREE.BufferAttribute(reg, 1));
  g.setAttribute("fold", new THREE.BufferAttribute(fold, 1));
  return g;
}

// Grooves along every border between regions (the kit's seams): graph
// distance to the nearest border by BFS, then pushed in along -normal.
// Leaves `seam` per vertex: that distance, in edges.
function seams(g: THREE.BufferGeometry, depth: number, width: number) {
  const idx = g.index!.array;
  const pos = g.getAttribute("position");
  const reg = g.getAttribute("region");
  const adj: number[][] = Array.from({ length: pos.count }, () => []);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    adj[a].push(b, c);
    adj[b].push(a, c);
    adj[c].push(a, b);
  }
  const dist = new Float32Array(pos.count).fill(99);
  const q: number[] = [];
  for (let a = 0; a < pos.count; a++) {
    if (adj[a].some((b) => reg.getX(b) !== reg.getX(a))) { dist[a] = 0; q.push(a); }
  }
  for (let h = 0; h < q.length; h++) {
    const a = q[h];
    if (dist[a] >= width) continue;
    for (const b of adj[a]) {
      if (reg.getX(b) === reg.getX(a) && dist[b] > dist[a] + 1) { dist[b] = dist[a] + 1; q.push(b); }
    }
  }
  g.computeVertexNormals();
  const nrm = g.getAttribute("normal");
  for (let i = 0; i < pos.count; i++) {
    if (dist[i] > width) continue;
    const s = depth * Math.cos(((dist[i] / (width + 1)) * Math.PI) / 2) ** 2;
    pos.setXYZ(i, pos.getX(i) - nrm.getX(i) * s, pos.getY(i) - nrm.getY(i) * s, pos.getZ(i) - nrm.getZ(i) * s);
  }
  g.setAttribute("seam", new THREE.BufferAttribute(dist, 1));
}

// Two lobes with a notch between them and fine level folia.
function cerebellum(noise: ImprovedNoise) {
  const g = ball(40);
  const pos = g.getAttribute("position");
  const fold = new Float32Array(pos.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const notch = 1 - 0.2 * Math.exp(-(v.x * v.x) / 0.02); // midline (vermis)
    const f = (0.5 + 0.5 * Math.sin(v.y * 30 + v.z * 4 + 1.6 * noise.noise(v.x * 3, v.y * 3, v.z * 3))) ** 5;
    const r = notch * (1 - 0.04 * f);
    fold[i] = f;
    pos.setXYZ(i, v.x * 0.42 * r, v.y * 0.19 * r - 0.37, v.z * 0.26 * r - 0.56); // tucked under the occipital lobe
  }
  constant(g, "region", REG.indexOf("cerebellum"));
  g.setAttribute("fold", new THREE.BufferAttribute(fold, 1));
  return g;
}

function stem() {
  const pts = [[0, -0.82], [0.07, -0.82], [0.085, -0.7], [0.1, -0.6], [0.14, -0.52], [0.15, -0.44], [0.12, -0.36], [0.1, -0.22], [0, -0.2]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const g = weld(new THREE.LatheGeometry(pts, 48));
  g.rotateX(0.22);
  g.translate(0, 0.02, -0.26);
  constant(g, "region", REG.indexOf("stem"));
  constant(g, "fold", 0);
  return g;
}

// A piece's dots: where, facing where, of which region; `shade` darkens
// them (sulci) or lifts them (the edge of a seam); `inner` is 0 on the
// outside and > 0 on a cut face — the more, the deeper inside the piece.
type Dots = { position: Float32Array; normal: Float32Array; region: Float32Array; shade: Float32Array; inner: Float32Array };

const SULCUS = 0.7; // fold value from which a sulcus gets no dots

// Dots on the outside. Region from the nearest corner of the dot's
// triangle, fold and seam distance blended over it.
function surfaceDots(g: THREE.BufferGeometry, spacing: number, rand: () => number): Dots {
  const reg = g.getAttribute("region").array, fold = g.getAttribute("fold").array;
  const seam = g.getAttribute("seam")?.array;
  const s = scatter(g.getAttribute("position").array, g.getAttribute("normal").array, g.index!.array, spacing, rand);
  const out: Dots = { position: new Float32Array(s.count * 3), normal: new Float32Array(s.count * 3), region: new Float32Array(s.count), shade: new Float32Array(s.count), inner: new Float32Array(0) };
  let n = 0;
  for (let i = 0; i < s.count; i++) {
    const a = s.tri[i * 3], b = s.tri[i * 3 + 1], c = s.tri[i * 3 + 2];
    const wa = s.w[i * 3], wb = s.w[i * 3 + 1], wc = s.w[i * 3 + 2];
    const dd = seam ? seam[a] * wa + seam[b] * wb + seam[c] * wc : 99;
    if (dd < 0.9) continue; // the gap between two pieces
    const f = fold[a] * wa + fold[b] * wb + fold[c] * wc;
    if (f > SULCUS) continue; // the bottom of a sulcus stays empty: a dark line
    out.position.set(s.position.subarray(i * 3, i * 3 + 3), n * 3);
    out.normal.set(s.normal.subarray(i * 3, i * 3 + 3), n * 3);
    out.region[n] = reg[wa >= wb && wa >= wc ? a : wb >= wc ? b : c];
    out.shade[n] = (1 - 0.5 * f) * (dd < 2.4 ? 1.2 : 1); // darker into the sulci, a light edge along the seam
    n++;
  }
  return { position: out.position.slice(0, n * 3), normal: out.normal.slice(0, n * 3), region: out.region.slice(0, n), shade: out.shade.slice(0, n), inner: new Float32Array(n) };
}

// The inside of every piece. A region is only a patch of the surface; on
// its own it would come out as a hollow shell. Closing it: side walls from
// the patch's border down to a small copy of the patch near the centre `c`
// (the inner cap), so each piece is a solid wedge. Returned as loose
// triangles with their region, wound like the surface (closed: every edge
// has its reverse), and `depth`: 0 at the surface, 1 at the inner cap.
// `keep` is the triangle index list of the surface (seam triangles removed).
const INNER = 0.12; // inner cap at 12 % of the way out from the centre
function interior(g: THREE.BufferGeometry, keep: ArrayLike<number>, c: THREE.Vector3) {
  const pos = g.getAttribute("position"), reg = g.getAttribute("region");
  const edges = new Set<number>(); // directed edges of the kept triangles
  const ek = (a: number, b: number) => a * pos.count + b;
  for (let t = 0; t < keep.length; t += 3) {
    for (let e = 0; e < 3; e++) edges.add(ek(keep[t + e], keep[t + ((e + 1) % 3)]));
  }
  const P: number[] = [], R: number[] = [], D: number[] = [];
  const at = (i: number) => new THREE.Vector3().fromBufferAttribute(pos, i);
  const inner = (i: number) => at(i).sub(c).multiplyScalar(INNER).add(c);
  const tri = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3, region: number, dp: number, dq: number, dr: number) => {
    P.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
    R.push(region, region, region);
    D.push(dp, dq, dr);
  };
  const open = new Set<number>(); // regions that have a border at all (cerebellum, stem are closed already)
  for (let t = 0; t < keep.length; t += 3) {
    const region = reg.getX(keep[t]);
    for (let e = 0; e < 3; e++) {
      const i = keep[t + e], j = keep[t + ((e + 1) % 3)];
      if (edges.has(ek(j, i))) continue; // shared with a neighbour in the same piece
      open.add(region);
      // Wall: runs the border edge the other way (j -> i), so it joins the
      // patch, its neighbouring walls and the cap without a crack.
      tri(at(j), at(i), inner(i), region, 0, 0, 1);
      tri(at(j), inner(i), inner(j), region, 0, 1, 1);
    }
  }
  // inner caps, reversed (they face the centre), only for pieces with a border
  for (let t = 0; t < keep.length; t += 3) {
    const region = reg.getX(keep[t]);
    if (open.has(region)) tri(inner(keep[t]), inner(keep[t + 2]), inner(keep[t + 1]), region, 1, 1, 1);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute("region", new THREE.Float32BufferAttribute(R, 1));
  out.setAttribute("depth", new THREE.Float32BufferAttribute(D, 1));
  out.computeVertexNormals(); // loose triangles: flat
  return out;
}

// Dots on the cut faces: a thin rim of cortex, the rest white matter.
function interiorDots(g: THREE.BufferGeometry, spacing: number, rand: () => number): Dots {
  const pos = g.getAttribute("position"), reg = g.getAttribute("region").array, depth = g.getAttribute("depth").array;
  const s = scatter(pos.array, g.getAttribute("normal").array, Uint32Array.from({ length: pos.count }, (_, i) => i), spacing, rand);
  const region = new Float32Array(s.count), inner = new Float32Array(s.count);
  for (let i = 0; i < s.count; i++) {
    const a = s.tri[i * 3];
    region[i] = reg[a];
    inner[i] = 0.02 + 0.98 * sm(0.07, 0.2, depth[a] * s.w[i * 3] + depth[a + 1] * s.w[i * 3 + 1] + depth[a + 2] * s.w[i * 3 + 2]);
  }
  return { position: s.position.slice(), normal: s.normal.slice(), region, shade: new Float32Array(s.count).fill(1), inner };
}

// ── fitting the kit into the skull ──────────────────────────────────────
// The skull's cavity (endocast.json, from scripts/ct-endocast.ts) is a
// radial map around its centre. The brain gets the same kind of map around
// its own centre and is scaled along each direction towards the cavity
// wall: a common (median) scale, plus half of what's left per direction —
// a full warp inflates the kit's gaps (under the temporal lobes) into
// lumps. Never past the wall (a little inside it).
const MARGIN = 0.96;
const WARP = 0.5;
const { nTheta: NT, nPhi: NP } = endo;
const ENDO_C = new THREE.Vector3(...(endo.center as [number, number, number]));

const cellOf = (d: THREE.Vector3) => {
  const t = (Math.acos(Math.min(Math.max(d.y, -1), 1)) / Math.PI) * NT - 0.5;
  const p = (((Math.atan2(d.x, d.z) / (Math.PI * 2)) % 1) + 1) % 1 * NP;
  return [t, p] as const;
};

// Bilinear lookup in a radial grid (azimuth wraps around).
function radius(grid: ArrayLike<number>, d: THREE.Vector3) {
  const [t, p] = cellOf(d);
  const t0 = Math.min(Math.max(Math.floor(t), 0), NT - 1), t1 = Math.min(t0 + 1, NT - 1);
  const ft = Math.min(Math.max(t - t0, 0), 1);
  const p0 = Math.floor(p) % NP, p1 = (p0 + 1) % NP, fp = p - Math.floor(p);
  const at = (a: number, b: number) => grid[a * NP + b];
  return (at(t0, p0) * (1 - fp) + at(t0, p1) * fp) * (1 - ft) + (at(t1, p0) * (1 - fp) + at(t1, p1) * fp) * ft;
}

// The kit's own radial map: farthest point per direction cell, empty
// cells filled from their neighbours, then smoothed like the endocast.
function kitRadius(geos: THREE.BufferGeometry[], c: THREE.Vector3) {
  const r = new Float32Array(NT * NP).fill(NaN);
  const v = new THREE.Vector3();
  for (const g of geos) {
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).sub(c);
      const len = v.length();
      const [t, p] = cellOf(v.normalize());
      const k = Math.min(Math.max(Math.round(t), 0), NT - 1) * NP + (Math.round(p) % NP);
      if (!(r[k] >= len)) r[k] = len;
    }
  }
  const at = (t: number, p: number) => r[Math.min(Math.max(t, 0), NT - 1) * NP + ((p + NP) % NP)];
  for (let pass = 0; pass < 200; pass++) {
    let holes = 0;
    const next = r.slice();
    for (let t = 0; t < NT; t++) for (let p = 0; p < NP; p++) {
      if (!Number.isNaN(r[t * NP + p])) continue;
      holes++;
      const n = [at(t - 1, p), at(t + 1, p), at(t, p - 1), at(t, p + 1)].filter((x) => !Number.isNaN(x));
      if (n.length) next[t * NP + p] = n.reduce((a, b) => a + b) / n.length;
    }
    r.set(next);
    if (!holes) break;
  }
  for (let pass = 0; pass < 3; pass++) {
    const next = r.slice();
    for (let t = 0; t < NT; t++) for (let p = 0; p < NP; p++) {
      next[t * NP + p] = (at(t, p) * 4 + at(t - 1, p) + at(t + 1, p) + at(t, p - 1) + at(t, p + 1)) / 8;
    }
    r.set(next);
  }
  return r;
}

// Kit point → skull point; also returns the local scale (for radii).
function makeFit(geos: THREE.BufferGeometry[]) {
  const box = new THREE.Box3();
  for (const g of geos.slice(0, 3)) { g.computeBoundingBox(); box.union(g.boundingBox!); } // hemispheres + cerebellum, not the stem
  const c = box.getCenter(new THREE.Vector3());
  const kit = kitRadius(geos, c);
  const ratios = Array.from(kit, (k, i) => (endo.r[i] * MARGIN) / k).sort((a, b) => a - b);
  const median = ratios[ratios.length >> 1];
  const d = new THREE.Vector3();
  return (x: number, y: number, z: number) => {
    d.set(x, y, z).sub(c);
    const len = d.length() || 1e-6;
    d.divideScalar(len);
    const full = (radius(endo.r, d) * MARGIN) / radius(kit, d);
    const s = Math.min(full, median * Math.pow(full / median, WARP));
    return { p: d.clone().multiplyScalar(len * s).add(ENDO_C), s };
  };
}

export type BrainPart = {
  dots: Dots;
  // Depth-only occluder so dots on the back don't shine through the gaps
  // (with its region per vertex, so it moves along when a part comes out).
  occluder: { position: Float32Array; region: Float32Array; index: Uint32Array };
};
export type BrainData = {
  parts: BrainPart[];
  // Deep structures, fitted: centre (x, y, z) and radius.
  deep: Record<Deep, [number, number, number, number]>;
  // Per part index (PARTS): points near the region's centre, local to the
  // brain group; the anchor is the one facing the camera most.
  anchors: Float32Array[];
  // Per part index: unit direction it moves in when the brain comes apart
  // (from the brain's centre out through the part's centre).
  outward: Float32Array;
};

const cat = (x: Float32Array, y: Float32Array) => { const o = new Float32Array(x.length + y.length); o.set(x); o.set(y, x.length); return o; };

// spacing: distance between two dots (dots.ts scatter).
export function buildBrain(spacing: number): BrainData {
  const noise = new ImprovedNoise();
  const rand = mulberry(3);
  const base = ball(71);
  const geos = [hemisphere(noise, base, -1), hemisphere(noise, base, 1), cerebellum(noise), stem()];
  const fit = makeFit(geos);
  for (const g of geos) {
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const { p } = fit(pos.getX(i), pos.getY(i), pos.getZ(i));
      pos.setXYZ(i, p.x, p.y, p.z);
    }
  }
  const deep = Object.fromEntries(DEEP.map((name) => {
    const [x, y, z, r] = DEEP_AT[name];
    const { p, s } = fit(x, y, z);
    return [name, [p.x, p.y, p.z, r * s]];
  })) as BrainData["deep"];
  seams(geos[0], 0.04, 5);
  seams(geos[1], 0.04, 5);

  const parts = geos.map((g): BrainPart => {
    g.computeVertexNormals();
    const pos = g.getAttribute("position");
    const surface = surfaceDots(g, spacing, rand);
    const region = Float32Array.from(g.getAttribute("region").array);
    // Only triangles that lie wholly in one part: the occluder moves with
    // its part, and a triangle across a seam would stretch over the gap
    // when one side comes out.
    const all = g.index!.array;
    const kept: number[] = [];
    for (let t = 0; t < all.length; t += 3) {
      const a = all[t], b = all[t + 1], c = all[t + 2];
      if (region[a] === region[b] && region[a] === region[c]) kept.push(a, b, c);
    }
    // Close every piece (walls + inner cap), dotted like the outside.
    g.computeBoundingBox();
    const inside = interior(g, kept, g.boundingBox!.getCenter(new THREE.Vector3()));
    const inPos = inside.getAttribute("position").array as Float32Array;
    const cut = inPos.length ? interiorDots(inside, spacing, rand) : null;
    // Occluder: the surface plus the inside, so a piece that comes out
    // hides what's behind it from every side.
    const index = Uint32Array.from([...kept, ...Array.from({ length: inPos.length / 3 }, (_, i) => pos.count + i)]);
    return {
      dots: cut
        ? { position: cat(surface.position, cut.position), normal: cat(surface.normal, cut.normal), region: cat(surface.region, cut.region), shade: cat(surface.shade, cut.shade), inner: cat(surface.inner, cut.inner) }
        : surface,
      occluder: { position: cat(Float32Array.from(pos.array), inPos), region: cat(region, inside.getAttribute("region").array as Float32Array), index },
    };
  });

  // Region anchors: every 7th vertex per region, centroid, then the
  // candidates within 0.35 of it (capped) — picked per frame by view depth.
  const acc: number[][] = PARTS.map(() => []);
  for (const g of geos) {
    const pos = g.getAttribute("position"), reg = g.getAttribute("region");
    for (let i = 0; i < pos.count; i += 7) acc[reg.getX(i)].push(pos.getX(i), pos.getY(i), pos.getZ(i));
  }
  const centres: THREE.Vector3[] = [];
  const anchors = PARTS.map((name, r) => {
    if (r >= REG.length) {
      const [x, y, z] = deep[name as Deep];
      centres[r] = new THREE.Vector3(x, y, z);
      return Float32Array.of(x, y, z);
    }
    const a = acc[r];
    const n = a.length / 3;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < a.length; i += 3) { cx += a[i]; cy += a[i + 1]; cz += a[i + 2]; }
    cx /= n; cy /= n; cz /= n;
    centres[r] = new THREE.Vector3(cx, cy, cz);
    const near: number[] = [];
    for (let i = 0; i < a.length; i += 3) {
      if ((a[i] - cx) ** 2 + (a[i + 1] - cy) ** 2 + (a[i + 2] - cz) ** 2 < 0.35 * 0.35) near.push(a[i], a[i + 1], a[i + 2]);
    }
    const step = Math.max(1, Math.floor(near.length / 3 / 300));
    const out: number[] = [];
    for (let i = 0; i < near.length; i += 3 * step) out.push(near[i], near[i + 1], near[i + 2]);
    return Float32Array.from(out.length ? out : [cx, cy, cz]);
  });

  // Out-directions: from the centre of the cerebrum through the part.
  const box = new THREE.Box3();
  for (const g of geos.slice(0, 2)) { g.computeBoundingBox(); box.union(g.boundingBox!); }
  const mid = box.getCenter(new THREE.Vector3());
  const outward = new Float32Array(PARTS.length * 3);
  centres.forEach((c, i) => {
    const d = c.clone().sub(mid);
    if (d.lengthSq() < 1e-4) d.set(0, 1, 0);
    d.normalize().toArray(outward, i * 3);
  });
  return { parts, deep, anchors, outward };
}
