// Procedural brain kit for the CT skull (skull variant, /saos#dev#skull):
// every region is its own piece, the pieces visibly "plugged together"
// (grooves along every border), rendered as dots. Ported from the offline
// prototype that made the CT-Schädel mockup images ("#skull infos /
// ct-skull-prototype.html") — same functions, same numbers. Not a model
// from the 3D renderer: modelled here, out of spheres.
//
// Pure geometry, no DOM: runs in brain.worker.ts (the seam BFS over ~52k
// vertices per hemisphere is too slow for the main thread), with a
// main-thread fallback in brain.ts.
//
// Coordinates as the skull after its remap: +z face/front, +y up, x
// sideways; left hemisphere side = -1 (x < 0). Speech areas left only.
import * as THREE from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

export const REG = ["frontal", "motor", "parietal", "occipital", "temporal", "broca", "wernicke", "fusiform", "cerebellum", "stem"] as const;
export const DEEP = ["amygdala", "hippocampus", "thalamus", "accumbens"] as const;
export type Region = (typeof REG)[number];
export type Deep = (typeof DEEP)[number];
export type Part = Region | Deep;
// One index space for both: regions 0–9, deep structures 10–13.
export const PARTS: readonly Part[] = [...REG, ...DEEP];

// Deep structures: centre (x, y, z) and radius, shown only when lit.
export const DEEP_AT: Record<Deep, [number, number, number, number]> = {
  amygdala: [-0.27, -0.22, 0.2, 0.07],
  hippocampus: [-0.27, -0.2, -0.08, 0.06],
  thalamus: [-0.08, 0.02, -0.12, 0.09],
  accumbens: [-0.1, -0.1, 0.3, 0.05],
};

// Baked light for the dots' shading (local: it turns with the brain).
const LDIR = new THREE.Vector3(-0.3, 0.7, 0.65).normalize();

const sm = (e0: number, e1: number, t: number) => {
  const u = Math.min(Math.max((t - e0) / (e1 - e0), 0), 1);
  return u * u * (3 - 2 * u);
};
const ys = (z: number) => -0.2 + (0.35 - z) * 0.45; // Sylvian fissure: y on the unit sphere, by z
const zc = (y: number) => -0.06 + (1 - y) * 0.16; // central sulcus: z, by y

function region(noise: ImprovedNoise, n: { x: number; y: number; z: number }, side: number): Region {
  const j = 0.05 * noise.noise(n.x * 3.1 + 11, n.y * 3.1, n.z * 3.1);
  const x = n.x, y = n.y + j, z = n.z + j * 0.7;
  const s = ys(z), c = zc(y);
  if (y < s && z < 0.5 && z > -0.62 && x > -0.2) {
    if (y < s - 0.55 || (x < 0.35 && y < -0.55)) return "fusiform";
    if (side < 0 && ((z + 0.33) / 0.2) ** 2 + ((y - (s - 0.13)) / 0.13) ** 2 < 1) return "wernicke";
    return "temporal";
  }
  if (z < -0.6 + 0.12 * y) return "occipital";
  if (z < c) return "parietal";
  if (z < c + 0.16) return "motor";
  if (side < 0 && x > 0.2 && ((z - (c + 0.32)) / 0.15) ** 2 + ((y - (s + 0.13)) / 0.12) ** 2 < 1) return "broca";
  return "frontal";
}

function hemisphere(noise: ImprovedNoise, side: number) {
  const g = new THREE.SphereGeometry(1, 260, 200);
  const pos = g.getAttribute("position");
  const reg = new Float32Array(pos.count);
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
    // Gyri: soft ridged noise, low frequency.
    const nz = 1 - Math.abs(noise.noise(pz * 6.5, py * 6.5, px * 6.5 + side * 7));
    const d = 0.022 * nz * nz * (n.x > -0.08 ? 1 : 0.35);
    const len = Math.hypot(px, py, pz);
    pos.setXYZ(i, (px + (px / len) * d) * side, py + (py / len) * d + 0.12, pz + (pz / len) * d - 0.02);
  }
  g.setAttribute("region", new THREE.BufferAttribute(reg, 1));
  return g;
}

// Grooves along every border between regions (the kit's seams): graph
// distance to the nearest border by BFS, then pushed in along -normal.
function seams(g: THREE.BufferGeometry, depth: number, width: number) {
  const idx = g.index!.array;
  const pos = g.getAttribute("position");
  const reg = g.getAttribute("region");
  // Weld the UV sphere's duplicate vertices by position for adjacency.
  const id = new Int32Array(pos.count);
  const map = new Map<string, number>();
  let k = 0;
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
    let n = map.get(key);
    if (n === undefined) map.set(key, (n = k++));
    id[i] = n;
  }
  const adj = Array.from({ length: k }, () => new Set<number>());
  const rOf = new Int32Array(k);
  for (let i = 0; i < pos.count; i++) rOf[id[i]] = reg.getX(i);
  for (let t = 0; t < idx.length; t += 3) {
    const a = id[idx[t]], b = id[idx[t + 1]], c = id[idx[t + 2]];
    adj[a].add(b).add(c);
    adj[b].add(a).add(c);
    adj[c].add(a).add(b);
  }
  const dist = new Int32Array(k).fill(99);
  const q: number[] = [];
  for (let a = 0; a < k; a++) {
    for (const b of adj[a]) {
      if (rOf[b] !== rOf[a]) {
        dist[a] = 0;
        q.push(a);
        break;
      }
    }
  }
  for (let h = 0; h < q.length; h++) {
    const a = q[h];
    if (dist[a] >= width) continue;
    for (const b of adj[a]) {
      if (rOf[b] === rOf[a] && dist[b] > dist[a] + 1) {
        dist[b] = dist[a] + 1;
        q.push(b);
      }
    }
  }
  g.computeVertexNormals();
  const nrm = g.getAttribute("normal");
  for (let i = 0; i < pos.count; i++) {
    const dd = dist[id[i]];
    if (dd > width) continue;
    const s = depth * Math.cos(((dd / (width + 1)) * Math.PI) / 2) ** 2;
    pos.setXYZ(i, pos.getX(i) - nrm.getX(i) * s, pos.getY(i) - nrm.getY(i) * s, pos.getZ(i) - nrm.getZ(i) * s);
  }
  g.setAttribute("seam", new THREE.BufferAttribute(Float32Array.from({ length: pos.count }, (_, i) => dist[id[i]]), 1));
  g.computeVertexNormals();
}

function cerebellum() {
  const g = new THREE.SphereGeometry(1, 160, 120);
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const lobe = 1 - 0.18 * Math.exp(-(v.x * v.x) / 0.02); // midline notch (vermis)
    const fol = 0.03 * Math.pow(Math.abs(Math.sin(v.y * 26 + v.z * 9)), 0.6); // folia: fine parallel ridges
    const r = lobe + fol;
    pos.setXYZ(i, v.x * 0.46 * r, v.y * 0.21 * r - 0.38, v.z * 0.3 * r - 0.6);
  }
  g.setAttribute("region", new THREE.BufferAttribute(new Float32Array(pos.count).fill(REG.indexOf("cerebellum")), 1));
  g.computeVertexNormals();
  return g;
}

function stem() {
  const pts = [[0, -0.82], [0.07, -0.82], [0.085, -0.7], [0.1, -0.6], [0.14, -0.52], [0.15, -0.44], [0.12, -0.36], [0.1, -0.22], [0, -0.2]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(0.22);
  g.translate(0, 0.02, -0.26);
  g.setAttribute("region", new THREE.BufferAttribute(new Float32Array(g.getAttribute("position").count).fill(REG.indexOf("stem")), 1));
  g.computeVertexNormals();
  return g;
}

// Dots on a surface: shade baked from the normal; region, colour edge and
// seam gap from the nearest vertex (spatial hash).
function sampleDots(g: THREE.BufferGeometry, n: number) {
  const pos = g.getAttribute("position");
  const regA = g.getAttribute("region");
  const seamA = g.getAttribute("seam");
  const cell = 0.05;
  const key = (x: number, y: number, z: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const hash = new Map<string, number[]>();
  for (let i = 0; i < pos.count; i += 2) {
    const k = key(pos.getX(i), pos.getY(i), pos.getZ(i));
    let arr = hash.get(k);
    if (!arr) hash.set(k, (arr = []));
    arr.push(i);
  }
  const flat = g.index ? g.toNonIndexed() : g.clone();
  flat.computeVertexNormals();
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(flat)).build();
  const P = new Float32Array(n * 3), S = new Float32Array(n), R = new Float32Array(n);
  const p = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < n; ) {
    sampler.sample(p, nn);
    let best = 0, bd = 1e9;
    const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell), cz = Math.floor(p.z / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const arr = hash.get(`${cx + dx},${cy + dy},${cz + dz}`);
      if (!arr) continue;
      for (const j of arr) {
        const d = (pos.getX(j) - p.x) ** 2 + (pos.getY(j) - p.y) ** 2 + (pos.getZ(j) - p.z) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
    }
    const dd = seamA ? seamA.getX(best) : 99;
    if (dd <= 1 && Math.random() < 0.98) continue; // the gap between two pieces
    let shade = 0.3 + 0.7 * Math.pow(Math.max(0, nn.dot(LDIR)), 1.2);
    if (dd >= 2 && dd <= 3) shade *= 1.35; // light edge along the seam
    P.set([p.x, p.y, p.z], i * 3);
    S[i] = shade;
    R[i] = regA.getX(best);
    i++;
  }
  return { position: P, shade: S, region: R };
}

export type BrainPart = {
  dots: { position: Float32Array; shade: Float32Array; region: Float32Array };
  // Depth-only occluder so dots on the back don't shine through the gaps.
  occluder: { position: Float32Array; index: Uint32Array };
};
export type BrainData = {
  parts: BrainPart[];
  // Per part index (PARTS): points near the region's centre, local to the
  // brain group; the anchor is the one facing the camera most.
  anchors: Float32Array[];
};

// pointsScale: 1 on desktop (~45k dots per 30k vertices), ~1/3 on phones.
export function buildBrain(pointsScale = 1): BrainData {
  const noise = new ImprovedNoise();
  const geos = [hemisphere(noise, -1), hemisphere(noise, 1), cerebellum(), stem()];
  for (const g of geos) if (g.getAttribute("position").count > 30000) seams(g, 0.045, 4);

  const parts = geos.map((g): BrainPart => {
    const pos = g.getAttribute("position");
    const dots = sampleDots(g, Math.round((45000 * pointsScale * pos.count) / 30000));
    const index = g.index ? Uint32Array.from(g.index.array) : Uint32Array.from({ length: pos.count }, (_, i) => i);
    return { dots, occluder: { position: Float32Array.from(pos.array as ArrayLike<number>), index } };
  });

  // Region anchors: every 7th vertex per region, centroid, then the
  // candidates within 0.35 of it (capped) — picked per frame by view depth.
  const acc: number[][] = PARTS.map(() => []);
  for (const g of geos) {
    const pos = g.getAttribute("position"), reg = g.getAttribute("region");
    for (let i = 0; i < pos.count; i += 7) acc[reg.getX(i)].push(pos.getX(i), pos.getY(i), pos.getZ(i));
  }
  const anchors = PARTS.map((name, r) => {
    if (r >= REG.length) {
      const [x, y, z] = DEEP_AT[name as Deep];
      return Float32Array.of(x, y, z);
    }
    const a = acc[r];
    const n = a.length / 3;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < a.length; i += 3) { cx += a[i]; cy += a[i + 1]; cz += a[i + 2]; }
    cx /= n; cy /= n; cz /= n;
    const near: number[] = [];
    for (let i = 0; i < a.length; i += 3) {
      if ((a[i] - cx) ** 2 + (a[i + 1] - cy) ** 2 + (a[i + 2] - cz) ** 2 < 0.35 * 0.35) near.push(a[i], a[i + 1], a[i + 2]);
    }
    const step = Math.max(1, Math.floor(near.length / 3 / 300));
    const out: number[] = [];
    for (let i = 0; i < near.length; i += 3 * step) out.push(near[i], near[i + 1], near[i + 2]);
    return Float32Array.from(out.length ? out : [cx, cy, cz]);
  });
  return { parts, anchors };
}
