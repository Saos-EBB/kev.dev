// The brain kit at runtime: one dot cloud per piece, coloured in the shader
// from a per-region palette, so lighting a region (or the atlas) is only a
// uniform update. The geometry comes from brain-build.ts, built once in a
// worker; the dots are drawn like the skull's (dots.ts). Hang `group` into
// the skull rig.
import * as THREE from "three";
import { buildBrain, DEEP, PARTS, REG, type BrainData, type Part } from "./brain-build";
import { DOT_FILL_RATIO, DOT_FRAG, DOT_VERT } from "./dots";

export type { Part } from "./brain-build";

// Every piece its own red, so the kit reads as pieces.
const BASE: Record<Part, string> = {
  frontal: "#ff3a44", motor: "#b81a28", parietal: "#ff6a5a", occipital: "#a3142a", temporal: "#e0283a",
  broca: "#ff3a44", wernicke: "#e0283a", fusiform: "#8e1220", cerebellum: "#d8344a", stem: "#7a1420",
  amygdala: "#ffe08a", hippocampus: "#ffe08a", thalamus: "#ffe08a", accumbens: "#ffe08a",
};
const HOT = "#ffe08a";

const N = PARTS.length;

// `inner` > 0: a dot on a cut face. Those go pale towards the middle of
// the piece (white matter under a rim of cortex) and are left out while
// the brain is see-through, where they would show as fans of lines.
const VERT = /* glsl */ `
${DOT_VERT}
attribute float shade;
attribute float inner;
attribute float region;
uniform vec4 uColor[${N}];
uniform float uBig[${N}];
uniform float uCutFaces;
#ifdef OFFSET
uniform vec3 uOff[${N}];
#endif
varying vec4 vColor;
void main() {
  int r = int(region + 0.5);
  vec4 c = uColor[r];
  vec3 p = position;
#ifdef OFFSET
  p += uOff[r]; // the part's way out when the brain comes apart
#endif
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vec3 rgb = mix(c.rgb, c.rgb * 0.5 + vec3(0.42, 0.36, 0.34), inner * 0.65);
  vColor = vec4(rgb * shade * dotLight(n, mv.xyz) * dotDepth(mv.z), c.a);
  bool hidden = c.a <= 0.0 || (inner > 0.0 && uCutFaces < 0.5);
  gl_PointSize = dotSize(position, mv.z) * uBig[r];
  gl_Position = hidden ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
${DOT_FRAG}
uniform float uOpacity;
varying vec4 vColor;
void main() {
  gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity * dotAlpha());
  #include <colorspace_fragment>
}`;
// The occluder moves with its parts too, so a part that comes out still
// hides what's behind it — and leaves no invisible wall where it was.
const OCC_VERT = /* glsl */ `
attribute float region;
uniform vec3 uOff[${N}];
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + uOff[int(region + 0.5)], 1.0);
}`;
const OCC_FRAG = /* glsl */ `void main() { gl_FragColor = vec4(0.0); }`;

export interface Brain {
  group: THREE.Group;
  /** Lit parts (yellow unless `colors` says otherwise), bigger dots. Fades over ~300 ms. */
  setHighlight(parts: Part[], colors?: Partial<Record<Part, string>>): void;
  /** Take the brain apart: `parts` move `out` along their out-direction
   *  (towards the viewer in side view), the rest `spread`. Glides there. */
  setExplode(parts: Part[], out: number, spread: number): void;
  /** 0 = hidden, 0.4 = see-through (deep structures still glow), 1 = solid. */
  setOpacity(a: number): void;
  /** Screen px of a part's most camera-facing point. */
  anchor(p: Part, cam: THREE.Camera, w: number, h: number): [number, number];
  /** Advance the colour fade and the parts' glide; true while still changing. */
  tick(dt: number): boolean;
  /** Point size scale: renderer drawing-buffer height / 2. */
  setScale(s: number): void;
}

async function loadData(spacing: number): Promise<BrainData> {
  try {
    const worker = new Worker(new URL("./brain.worker.ts", import.meta.url), { type: "module" });
    return await new Promise<BrainData>((resolve, reject) => {
      worker.onmessage = (e) => { resolve(e.data); worker.terminate(); };
      worker.onerror = (e) => { reject(e); worker.terminate(); };
      worker.postMessage({ spacing });
    });
  } catch {
    return buildBrain(spacing); // no module workers: same build, main thread
  }
}

// spacing: distance between two dots, as for the skull (dots.ts).
export async function createBrain(spacing: number): Promise<Brain> {
  const data = await loadData(spacing);
  const group = new THREE.Group();
  // No transform: brain-build already fitted the kit into the skull's
  // cavity (endocast.json).

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
    uSize: { value: spacing * DOT_FILL_RATIO },
    uScale: { value: 400 },
    uOpacity: { value: 1 },
    uCutFaces: { value: 1 },
  };
  const deepUniforms = { ...uniforms, uOpacity: { value: 1 } };
  // Current and target offset per part (brain space).
  const off = PARTS.map(() => new THREE.Vector3());
  const offTarget = PARTS.map(() => new THREE.Vector3());
  const offUniform = { value: off };

  const surfaceMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uOff: offUniform }, vertexShader: VERT, fragmentShader: FRAG, defines: { OFFSET: "" },
    alphaToCoverage: true,
  });
  // While the brain is see-through: blended, no depth.
  const ghostMat = new THREE.ShaderMaterial({
    uniforms: surfaceMat.uniforms, vertexShader: VERT, fragmentShader: FRAG, defines: { OFFSET: "" },
    transparent: true, depthWrite: false,
  });
  const clouds: THREE.Points[] = [];
  const deepMat = new THREE.ShaderMaterial({
    uniforms: deepUniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const occluderMat = new THREE.ShaderMaterial({
    uniforms: { uOff: offUniform }, vertexShader: OCC_VERT, fragmentShader: OCC_FRAG,
    colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4,
  });
  const occluders: THREE.Mesh[] = [];

  for (const part of data.parts) {
    const og = new THREE.BufferGeometry();
    og.setAttribute("position", new THREE.BufferAttribute(part.occluder.position, 3));
    og.setAttribute("region", new THREE.BufferAttribute(part.occluder.region, 1));
    og.setIndex(new THREE.BufferAttribute(part.occluder.index, 1));
    const occ = new THREE.Mesh(og, occluderMat);
    occ.renderOrder = -1; // depth first, so dots behind it never draw
    occluders.push(occ);
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(part.dots.position, 3));
    dg.setAttribute("normal", new THREE.BufferAttribute(part.dots.normal, 3));
    dg.setAttribute("shade", new THREE.BufferAttribute(part.dots.shade, 1));
    dg.setAttribute("inner", new THREE.BufferAttribute(part.dots.inner, 1));
    dg.setAttribute("region", new THREE.BufferAttribute(part.dots.region, 1));
    const cloud = new THREE.Points(dg, surfaceMat);
    clouds.push(cloud);
    group.add(occ, cloud);
  }

  // Deep structures: dots on small spheres, drawn through everything;
  // moved as objects when they come out (their geometry is local).
  const deepPts: { pts: THREE.Points; base: THREE.Vector3; i: number }[] = [];
  for (const name of DEEP) {
    const [x, y, z, r] = data.deep[name];
    // evenly over the whole sphere (a spiral), a little wider apart than
    // the cortex: they draw through everything, front and back both show
    const count = Math.max(150, Math.round((4 * Math.PI * r * r) / (spacing * spacing * 1.6)));
    const sp = new Float32Array(count * 3), sn = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const y = 1 - (2 * (i + 0.5)) / count, q = Math.sqrt(1 - y * y), a = i * 2.39996;
      sn.set([Math.cos(a) * q, y, Math.sin(a) * q], i * 3);
      sp.set([sn[i * 3] * r, y * r, sn[i * 3 + 2] * r], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sg.setAttribute("normal", new THREE.BufferAttribute(sn, 3));
    sg.setAttribute("shade", new THREE.BufferAttribute(new Float32Array(count).fill(1.6), 1));
    sg.setAttribute("inner", new THREE.BufferAttribute(new Float32Array(count), 1));
    sg.setAttribute("region", new THREE.BufferAttribute(new Float32Array(count).fill(PARTS.indexOf(name)), 1));
    const pts = new THREE.Points(sg, deepMat);
    pts.position.set(x, y, z);
    pts.rotation.y = 0.4;
    if (name === "hippocampus") pts.scale.set(2.2, 1, 0.6);
    pts.renderOrder = 5;
    group.add(pts);
    deepPts.push({ pts, base: pts.position.clone(), i: PARTS.indexOf(name) });
  }

  // Out-directions, with a pull towards the viewer: in side view the
  // camera looks at the left hemisphere, i.e. along +x towards -x.
  const outward = PARTS.map((_, i) => new THREE.Vector3().fromArray(data.outward, i * 3).add(new THREE.Vector3(-0.7, 0, 0)).normalize());

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
        big[i] = lit ? 1.3 : 1;
      });
    },
    setExplode(parts, out, spread) {
      PARTS.forEach((p, i) => offTarget[i].copy(outward[i]).multiplyScalar(parts.includes(p) ? out : spread));
    },
    setOpacity(a) {
      group.visible = a > 0;
      const solid = a >= 1;
      uniforms.uOpacity.value = a;
      uniforms.uCutFaces.value = solid ? 1 : 0;
      for (const c of clouds) c.material = solid ? surfaceMat : ghostMat;
      for (const o of occluders) o.visible = solid;
    },
    anchor(p, cam, w, h) {
      group.updateWorldMatrix(true, false);
      const idx = PARTS.indexOf(p);
      const pts = data.anchors[idx];
      const o = off[idx];
      // Most camera-facing candidate = the nearest to the camera.
      let bestD = Infinity;
      for (let i = 0; i < pts.length; i += 3) {
        tmp.set(pts[i] + o.x, pts[i + 1] + o.y, pts[i + 2] + o.z).applyMatrix4(group.matrixWorld);
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
      const g = 1 - Math.exp(-dt / 0.18); // the parts glide a little slower
      off.forEach((o, i) => {
        if (o.distanceToSquared(offTarget[i]) < 1e-7) { o.copy(offTarget[i]); return; }
        o.lerp(offTarget[i], g);
        moving = true;
      });
      for (const d of deepPts) d.pts.position.copy(d.base).add(off[d.i]);
      return moving;
    },
    setScale(s) {
      uniforms.uScale.value = s;
      deepUniforms.uScale.value = s;
    },
  };
}
