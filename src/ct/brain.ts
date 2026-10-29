// The brain kit at runtime: one dot cloud per piece, coloured in the shader
// from a per-region palette, so lighting a region (or the atlas) is only a
// uniform update. The geometry comes from brain-build.ts, built once in a
// worker. Hang `group` into the skull rig.
import * as THREE from "three";
import { buildBrain, DEEP, DEEP_AT, PARTS, REG, type BrainData, type Part } from "./brain-build";

export type { Part } from "./brain-build";

// Every piece its own red, so the kit reads as pieces.
const BASE: Record<Part, string> = {
  frontal: "#ff3a44", motor: "#b81a28", parietal: "#ff6a5a", occipital: "#a3142a", temporal: "#e0283a",
  broca: "#ff3a44", wernicke: "#e0283a", fusiform: "#8e1220", cerebellum: "#d8344a", stem: "#7a1420",
  amygdala: "#ffe08a", hippocampus: "#ffe08a", thalamus: "#ffe08a", accumbens: "#ffe08a",
};
export const HOT = "#ffe08a";
export const ATLAS: Partial<Record<Part, string>> = {
  cerebellum: "#ffd400", motor: "#57ff8f", parietal: "#57b9ff", fusiform: "#ff8a3d", temporal: "#ff5fc8",
  thalamus: "#ffffff", hippocampus: "#7fe6ff", accumbens: "#ffd400",
};

const N = PARTS.length;
const DOT = 0.012;

const VERT = /* glsl */ `
attribute float shade;
attribute float region;
uniform vec4 uColor[${N}];
uniform float uBig[${N}];
uniform float uSize;
uniform float uScale;
varying vec4 vColor;
void main() {
  int r = int(region + 0.5);
  vec4 c = uColor[r];
  vColor = vec4(c.rgb * shade, c.a);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uBig[r] * (uScale / -mv.z);
  gl_Position = c.a > 0.0 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
}`;
const FRAG = /* glsl */ `
uniform float uOpacity;
varying vec4 vColor;
void main() {
  gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
  #include <colorspace_fragment>
}`;

export interface Brain {
  group: THREE.Group;
  /** Lit parts (yellow unless `colors` says otherwise), 1.7x bigger dots. Fades over ~300 ms. */
  setHighlight(parts: Part[], colors?: Partial<Record<Part, string>>): void;
  /** 0 = hidden, 0.4 = see-through (deep structures still glow), 1 = solid. */
  setOpacity(a: number): void;
  /** Screen px of a part's most camera-facing point. */
  anchor(p: Part, cam: THREE.Camera, w: number, h: number): [number, number];
  /** Advance the colour fade; true while still changing. */
  tick(dt: number): boolean;
  /** Point size scale: renderer drawing-buffer height / 2. */
  setScale(s: number): void;
}

async function loadData(pointsScale: number): Promise<BrainData> {
  try {
    const worker = new Worker(new URL("./brain.worker.ts", import.meta.url), { type: "module" });
    return await new Promise<BrainData>((resolve, reject) => {
      worker.onmessage = (e) => { resolve(e.data); worker.terminate(); };
      worker.onerror = (e) => { reject(e); worker.terminate(); };
      worker.postMessage({ pointsScale });
    });
  } catch {
    return buildBrain(pointsScale); // no module workers: same build, main thread
  }
}

export async function createBrain(opts: { pointsScale?: number } = {}): Promise<Brain> {
  const data = await loadData(opts.pointsScale ?? 1);
  const group = new THREE.Group();
  // Fitted into craniumCut01's vault (side view against the skull dots):
  // back to the occiput, a little taller, frontal lobe behind the forehead,
  // tilted front-up a little so it follows the skull's sloping base.
  group.scale.set(0.92, 1.012, 0.92);
  group.position.set(0, -0.02, -0.2);
  group.rotation.x = -0.1;

  // Current and target colours per part, linear RGB + alpha (alpha 0 = hidden).
  const cur = PARTS.map((p, i) => {
    const c = new THREE.Color(BASE[p]);
    return new THREE.Vector4(c.r, c.g, c.b, i < REG.length ? 1 : 0);
  });
  const target = cur.map((v) => v.clone());
  const big = new Float32Array(N).fill(1);
  const uniforms = {
    uColor: { value: cur },
    uBig: { value: big },
    uSize: { value: DOT },
    uScale: { value: 400 },
    uOpacity: { value: 1 },
  };
  const deepUniforms = { ...uniforms, uSize: { value: DOT * 1.1 }, uOpacity: { value: 1 } };

  const surfaceMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
  const deepMat = new THREE.ShaderMaterial({
    uniforms: deepUniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const occluderMat = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 });
  const occluders: THREE.Mesh[] = [];

  for (const part of data.parts) {
    const og = new THREE.BufferGeometry();
    og.setAttribute("position", new THREE.BufferAttribute(part.occluder.position, 3));
    og.setIndex(new THREE.BufferAttribute(part.occluder.index, 1));
    const occ = new THREE.Mesh(og, occluderMat);
    occ.renderOrder = -1; // depth first, so dots behind it never draw
    occluders.push(occ);
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(part.dots.position, 3));
    dg.setAttribute("shade", new THREE.BufferAttribute(part.dots.shade, 1));
    dg.setAttribute("region", new THREE.BufferAttribute(part.dots.region, 1));
    group.add(occ, new THREE.Points(dg, surfaceMat));
  }

  // Deep structures: dots on small spheres, drawn through everything.
  for (const name of DEEP) {
    const [x, y, z, r] = DEEP_AT[name];
    const sg = new THREE.SphereGeometry(r, 24, 18);
    const count = sg.getAttribute("position").count;
    sg.setAttribute("shade", new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
    sg.setAttribute("region", new THREE.BufferAttribute(new Float32Array(count).fill(PARTS.indexOf(name)), 1));
    const pts = new THREE.Points(sg, deepMat);
    pts.position.set(x, y, z);
    pts.rotation.y = 0.4;
    if (name === "hippocampus") pts.scale.set(2.2, 1, 0.6);
    pts.renderOrder = 5;
    group.add(pts);
  }

  const tmp = new THREE.Vector3();
  const best = new THREE.Vector3();

  return {
    group,
    setHighlight(parts, colors = {}) {
      PARTS.forEach((p, i) => {
        const lit = parts.includes(p);
        const c = new THREE.Color(lit ? colors[p] ?? HOT : BASE[p]);
        const deep = i >= REG.length;
        target[i].set(c.r, c.g, c.b, deep ? (lit ? 1 : 0) : 1);
        big[i] = lit ? 1.7 : 1;
      });
    },
    setOpacity(a) {
      group.visible = a > 0;
      const solid = a >= 1;
      uniforms.uOpacity.value = a;
      surfaceMat.transparent = !solid;
      surfaceMat.depthWrite = solid;
      for (const o of occluders) o.visible = solid;
    },
    anchor(p, cam, w, h) {
      group.updateWorldMatrix(true, false);
      const pts = data.anchors[PARTS.indexOf(p)];
      // Most camera-facing candidate = the nearest to the camera.
      let bestD = Infinity;
      for (let i = 0; i < pts.length; i += 3) {
        tmp.set(pts[i], pts[i + 1], pts[i + 2]).applyMatrix4(group.matrixWorld);
        const d = tmp.distanceToSquared(cam.position);
        if (d < bestD) { bestD = d; best.copy(tmp); }
      }
      best.project(cam);
      return [((best.x + 1) / 2) * w, ((1 - best.y) / 2) * h];
    },
    tick(dt) {
      const k = 1 - Math.exp(-dt / 0.1); // ~300 ms to settle
      let moving = false;
      cur.forEach((c, i) => {
        const t = target[i];
        if (Math.abs(c.x - t.x) + Math.abs(c.y - t.y) + Math.abs(c.z - t.z) + Math.abs(c.w - t.w) < 1e-3) { c.copy(t); return; }
        c.lerp(t, k);
        moving = true;
      });
      return moving;
    },
    setScale(s) {
      uniforms.uScale.value = s;
      deepUniforms.uScale.value = s;
    },
  };
}
