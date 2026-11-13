// The skull as dots (dots.ts) on the craniumCut01 mesh, with the mesh
// itself drawn depth-only behind them, so the wall in front hides the dots
// on the walls behind it.
import * as THREE from "three";
import { DOT_FILL_RATIO, DOT_FRAG, DOT_VERT, mulberry, scatter, type Scatter } from "./dots";
import type { ScatterJob } from "./scatter.worker";

// The skull: blue at the jaw, purple at the crown; everything with local
// x < uCut is cut away.
const BOTTOM = new THREE.Color("#5fa8ff");
const TOP = new THREE.Color("#b48cff");

const SKULL_VERT = /* glsl */ `
${DOT_VERT}
attribute vec3 tint;
uniform float uCut;
varying vec3 vColor;
varying float vKeep;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  if (dot(n, mv.xyz) > 0.0) n = -n; // the wall's inside, seen through the cut
  vColor = tint * dotLight(n, mv.xyz) * dotDepth(mv.z);
  vKeep = position.x - uCut;
  gl_PointSize = dotSize(position, mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const SKULL_FRAG = /* glsl */ `
${DOT_FRAG}
varying vec3 vColor;
varying float vKeep;
void main() {
  if (vKeep < 0.0) discard;
  gl_FragColor = vec4(vColor, dotAlpha());
  #include <colorspace_fragment>
}`;
// Depth only: the wall in front hides the dots on the walls behind it.
const WALL_VERT = /* glsl */ `
uniform float uCut;
varying float vKeep;
void main() {
  vKeep = position.x - uCut;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const WALL_FRAG = /* glsl */ `
varying float vKeep;
void main() {
  if (vKeep < 0.0) discard;
  gl_FragColor = vec4(0.0);
}`;

export type Skull = {
  group: THREE.Group;
  /** Keep local x > cut; null = the whole skull. */
  setCut(cut: number | null): void;
  /** Point size scale: renderer drawing-buffer height / 2. */
  setScale(s: number): void;
};

// Scattering ~100k dots takes about half a second: off the main thread
// (scatter.worker.ts), so the loader keeps moving; same call here if
// module workers aren't there.
type Spread = Pick<Scatter, "position" | "normal">;
async function spread(geo: THREE.BufferGeometry, spacing: number): Promise<Spread> {
  const job: ScatterJob = {
    pos: geo.getAttribute("position").array as Float32Array, nrm: geo.getAttribute("normal").array as Float32Array,
    index: geo.index!.array as Uint32Array | Uint16Array, spacing, seed: 11,
  };
  try {
    const worker = new Worker(new URL("./scatter.worker.ts", import.meta.url), { type: "module" });
    return await new Promise<Spread>((resolve, reject) => {
      worker.onmessage = (e) => { resolve(e.data); worker.terminate(); };
      worker.onerror = (e) => { reject(e); worker.terminate(); };
      worker.postMessage(job);
    });
  } catch {
    return scatter(job.pos, job.nrm, job.index, spacing, mulberry(job.seed));
  }
}

// `geo`: indexed, centred skull mesh. `spacing`: distance between dots.
export async function createSkull(geo: THREE.BufferGeometry, spacing: number): Promise<Skull> {
  geo.computeVertexNormals();
  const s = await spread(geo, spacing);
  const count = s.position.length / 3;
  const tint = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    c.copy(BOTTOM).lerp(TOP, Math.min(Math.max((s.position[i * 3 + 1] + 1.1) / 2, 0), 1)).toArray(tint, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(s.position, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(s.normal, 3));
  g.setAttribute("tint", new THREE.BufferAttribute(tint, 3));

  const uCut = { value: -1e3 };
  const uScale = { value: 400 };
  const dots = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uSize: { value: spacing * DOT_FILL_RATIO }, uScale, uCut },
    vertexShader: SKULL_VERT, fragmentShader: SKULL_FRAG, alphaToCoverage: true,
  }));
  const wall = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: { uCut }, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG,
    colorWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4,
  }));
  wall.renderOrder = -1;
  const group = new THREE.Group();
  group.add(wall, dots);
  return {
    group,
    setCut(cut) { uCut.value = cut ?? -1e3; },
    setScale(v) { uScale.value = v; },
  };
}
