// 3D parts for the contact section's skull scene (skull-scene.ts): the
// craniumCut01 skull from the 2D renderer's models, turned to face the
// camera, and an extruded saw blade.
import * as THREE from "three";
import { loadCranium } from "../../projects/widgets/renderer-models/cranium";

export const BLADE_R = 0.62;
const BLADE_R_IN = 0.53;

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

// The wireframe of an indexed mesh, sharing its vertices. WireframeGeometry
// keys its edges by string, which blocks for hundreds of ms on the skull.
function indexedWire(geo: THREE.BufferGeometry) {
  const index = geo.getIndex()!;
  const position = geo.getAttribute("position");
  const seen = new Set<number>();
  const edges: number[] = [];
  const add = (a: number, b: number) => {
    const key = Math.min(a, b) * position.count + Math.max(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(a, b);
  };
  for (let t = 0; t < index.count; t += 3) {
    const a = index.getX(t), b = index.getX(t + 1), c = index.getX(t + 2);
    add(a, b); add(b, c); add(c, a);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", position);
  g.setIndex(edges);
  return g;
}

// Pink/violet "mesh look": a fill in the background color hides the back
// faces' lines, the wireframe sits on top of it.
// `outline`: only the real edges (EdgesGeometry) instead of every triangle —
// for flat shapes like the saw blade, whose triangulation would cross its face.
export function wireMesh(geo: THREE.BufferGeometry, line: THREE.Color | number, fill: THREE.Color | number, opacity: number, outline = false) {
  const fillMat = new THREE.MeshBasicMaterial({ color: fill, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const lineMat = new THREE.LineBasicMaterial({ color: line, transparent: true, opacity });
  const g = new THREE.Group();
  const lines = outline ? new THREE.EdgesGeometry(geo, 30) : geo.getIndex() ? indexedWire(geo) : new THREE.WireframeGeometry(geo);
  g.add(new THREE.Mesh(geo, fillMat), new THREE.LineSegments(lines, lineMat));
  return { group: g, fillMat, lineMat };
}

// 16 depth steps on a wireframe, like the 2D renderer's shades: bright in
// front, fading into the background behind. Worked out in the shader from
// the view depth, so it stays right while the scene turns. `radius`: the
// geometry's bounding sphere around its origin. The window ends a little
// behind the middle, further back the fill hides the lines anyway.
const DEPTH_STEPS = 16;
export function depthSteps(lineMat: THREE.LineBasicMaterial, radius: number) {
  lineMat.opacity = 1;
  lineMat.onBeforeCompile = (shader) => {
    shader.uniforms.uRadius = { value: radius };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uRadius;\nvarying float vDepth;")
      .replace("#include <project_vertex>", `#include <project_vertex>
        vDepth = ((modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z + uRadius - mvPosition.z) / (uRadius * 1.25);`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vDepth;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        float depthStep = min(floor(clamp(vDepth, 0.0, 1.0) * ${DEPTH_STEPS}.0), ${DEPTH_STEPS - 1}.0) / ${DEPTH_STEPS - 1}.0;
        diffuseColor.a = mix(0.85, 0.08, depthStep);`);
  };
}
