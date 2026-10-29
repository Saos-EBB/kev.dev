// Dots on a mesh surface, as in the CT-Schädel mockup: MeshSurfaceSampler,
// shade baked from the normal (0.3 + 0.7·max(0, n·L)^1.2), colour per dot.
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

const LDIR = new THREE.Vector3(-0.5, 0.6, 0.6).normalize();
const TOP = new THREE.Color("#b48cff");
const BOTTOM = new THREE.Color("#5fa8ff");

export function surfaceDots(geo: THREE.BufferGeometry, n: number, colorOf: (p: THREE.Vector3, out: THREE.Color) => void) {
  const flat = geo.index ? geo.toNonIndexed() : geo.clone();
  flat.computeVertexNormals();
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(flat)).build();
  const P = new Float32Array(n * 3), C = new Float32Array(n * 3);
  const p = new THREE.Vector3(), nn = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    sampler.sample(p, nn);
    colorOf(p, c);
    c.multiplyScalar(0.3 + 0.7 * Math.pow(Math.max(0, nn.dot(LDIR)), 1.2));
    P.set([p.x, p.y, p.z], i * 3);
    C.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  return g;
}

// The skull's look: blue at the jaw, purple at the crown.
export const skullDots = (geo: THREE.BufferGeometry, n: number) =>
  surfaceDots(geo, n, (p, c) => { c.copy(BOTTOM).lerp(TOP, Math.min(Math.max((p.y + 1.1) / 2, 0), 1)); });

export const dotMaterial = (opts: THREE.PointsMaterialParameters = {}) =>
  new THREE.PointsMaterial({ size: 0.012, vertexColors: true, ...opts });
