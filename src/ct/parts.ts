// The CT skull's mesh (ct-scene.ts; the horror game's boss uses it too):
// the craniumCut01 skull from the 2D renderer's models, turned to face the
// camera.
import * as THREE from "three";
import { loadCranium } from "../projects/widgets/renderer-models/cranium";

export async function loadSkullGeometry() {
  const m = await loadCranium();
  const pos = new Float32Array(m.vs.length * 3);
  // model: face +y, vault -z  →  three: face +z (camera), vault +y
  m.vs.forEach((v, i) => { pos[i * 3] = v.x; pos[i * 3 + 1] = -v.z; pos[i * 3 + 2] = v.y; });
  const idx: number[] = [];
  for (const f of m.fs) for (let k = 1; k < f.length - 1; k++) idx.push(f[0], f[k], f[k + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.center();
  return g;
}
