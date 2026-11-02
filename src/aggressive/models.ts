// The real models (CC0, see NOTICE.md; public/models/*.bin): geometry only, as
// vertex count, triangle count, positions, indices. All centred, radius 1. They
// wear the skull's look: every triangle a line, fading with depth.
import { THEME } from "./ai-theme";
import * as THREE from "three";
import { depthSteps, wireMesh } from "../contact/skull/parts";
import { COLORS } from "./wire-kit";

const cache = new Map<string, Promise<THREE.BufferGeometry>>();

export function loadModel(name: string) {
  let geo = cache.get(name);
  if (!geo) {
    geo = fetch(`/models/${name}.bin`).then((r) => r.arrayBuffer()).then((buf) => {
      const [verts, tris] = new Uint32Array(buf, 0, 2);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buf, 8, verts * 3), 3));
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, 8 + verts * 12, tris * 3), 1));
      return g;
    });
    cache.set(name, geo);
  }
  return geo;
}

// A model made of parts (keyboard.bin: a part list after the indices): each
// triangle as nine numbers, the first part is the case, the rest are its keys.
export async function loadParts(name: string) {
  const buf = await fetch(`/models/${name}.bin`).then((r) => r.arrayBuffer());
  const [verts, count] = new Uint32Array(buf, 0, 2);
  const pos = new Float32Array(buf, 8, verts * 3), index = new Uint32Array(buf, 8 + verts * 12, count * 3);
  const at = 8 + verts * 12 + count * 12;
  const n = new Uint32Array(buf, at, 1)[0];
  const parts = [...new Uint32Array(buf, at + 4, n)];
  const tris: number[][] = [];
  for (let i = 0; i < count; i++) {
    const t: number[] = [];
    for (let k = 0; k < 3; k++) {
      const v = index[i * 3 + k];
      t.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    }
    tris.push(t);
  }
  return { tris, parts };
}

export function wireModel(geo: THREE.BufferGeometry, color: number = COLORS.ink) {
  const parts = wireMesh(geo, color, COLORS.bg, 0.32);
  geo.computeBoundingSphere();
  // On white the fade into depth leaves hardly anything: even lines instead.
  if (THEME === "white") parts.lineMat.opacity = 0.8;
  else depthSteps(parts.lineMat, geo.boundingSphere!.radius + geo.boundingSphere!.center.length());
  return parts.group;
}

// The triangles on one side of x = 0, for a model that gets cut in two.
export function half(geo: THREE.BufferGeometry, side: number) {
  const index = geo.getIndex()!, pos = geo.getAttribute("position");
  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    if ((pos.getX(a) + pos.getX(b) + pos.getX(c)) * side >= 0) kept.push(a, b, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", pos);
  g.setIndex(kept);
  return g;
}
