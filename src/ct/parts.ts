// 3D parts for the CT skull (ct-scene.ts, saw-scene.ts): the
// craniumCut01 skull from the 2D renderer's models, turned to face the
// camera, and an extruded saw blade.
import * as THREE from "three";

interface Model { vs: { x: number; y: number; z: number }[]; fs: number[][] }

export const BLADE_R = 0.62;
const BLADE_R_IN = 0.53;

const loaders = import.meta.glob("../projects/widgets/renderer-models/craniumCut01.js") as Record<
  string,
  () => Promise<{ default: Model }>
>;

export async function loadSkullGeometry() {
  const m = (await Object.values(loaders)[0]()).default;
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

export function bladeGeometry() {
  const s = new THREE.Shape();
  const teeth = 30;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.7) / teeth) * Math.PI * 2;
    const p = (r: number, a: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;
    const [x0, y0] = p(BLADE_R_IN, a0), [x1, y1] = p(BLADE_R, a1);
    if (i === 0) s.moveTo(x0, y0); else s.lineTo(x0, y0);
    s.lineTo(x1, y1);
  }
  s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.09, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2, slot = new THREE.Path();
    slot.absarc(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.05, 0, Math.PI * 2, true);
    s.holes.push(slot);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -0.0175);
  return g;
}
