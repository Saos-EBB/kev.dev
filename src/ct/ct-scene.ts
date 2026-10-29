// The CT skull as a live scene: craniumCut01 as purple→blue dots, the brain
// kit (brain.ts) inside, a cut plane that opens the skull lengthwise. The
// page drives it with setPose()/setHighlight(); it renders only when
// something changed. Numbers from the prototype that made the mockup
// ("#skull infos /ct-skull-prototype.html").
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { loadSkullGeometry } from "../skull-site/parts";
import { createBrain, type Part } from "./brain";

const LDIR = new THREE.Vector3(-0.5, 0.6, 0.6).normalize();
const TOP = new THREE.Color("#b48cff");
const BOTTOM = new THREE.Color("#5fa8ff");

export type Pose = {
  rotY: number; // 0 = from the front, π/2 = side view (left hemisphere to the camera)
  cut: number | null; // keeps local x > cut; null = whole skull
  brain: number; // brain opacity, see Brain.setOpacity
};

export interface CtScene {
  setPose(p: Pose): void;
  setHighlight(parts: Part[], colors?: Partial<Record<Part, string>>): void;
  /** Canvas CSS px of a brain part's visible point. */
  anchor(p: Part): [number, number];
  resize(): void;
  /** Rendered something this frame (a fade still running counts). */
  onFrame?: () => void;
  readonly skull: THREE.Group;
  readonly rig: THREE.Group;
  readonly camera: THREE.PerspectiveCamera;
  requestRender(): void;
}

function skullDots(geo: THREE.BufferGeometry, n: number) {
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(flat)).build();
  const P = new Float32Array(n * 3), C = new Float32Array(n * 3);
  const p = new THREE.Vector3(), nn = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    sampler.sample(p, nn);
    const shade = 0.3 + 0.7 * Math.pow(Math.max(0, nn.dot(LDIR)), 1.2);
    c.copy(BOTTOM).lerp(TOP, Math.min(Math.max((p.y + 1.1) / 2, 0), 1)).multiplyScalar(shade);
    P.set([p.x, p.y, p.z], i * 3);
    C.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  return g;
}

export async function createCtScene(canvas: HTMLCanvasElement, opts: { phone?: boolean } = {}): Promise<CtScene> {
  const phone = !!opts.phone;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0, 0);
  renderer.localClippingEnabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, phone ? 1.5 : 2));

  const [skullGeo, brain] = await Promise.all([
    loadSkullGeometry().then((g) => {
      const m = mergeVertices(g, 1e-4);
      m.center();
      return m;
    }),
    createBrain({ pointsScale: phone ? 1 / 3 : 1 }),
  ]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.1, 6.2);
  camera.lookAt(0, 0, 0);

  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.95);
  const skullMat = new THREE.PointsMaterial({
    size: 0.012, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, clippingPlanes: [plane],
  });
  const skull = new THREE.Group();
  skull.add(new THREE.Points(skullDots(skullGeo, phone ? 25000 : 70000), skullMat));

  const rig = new THREE.Group();
  rig.add(skull, brain.group);
  scene.add(rig);

  let cut: number | null = null;
  let dirty = true;
  let raf = 0;
  let last = performance.now();

  function applyCut() {
    rig.updateMatrixWorld(true);
    // Local x > cut, carried into world space with the rig.
    plane.set(new THREE.Vector3(1, 0, 0), cut === null ? 1e3 : -cut);
    plane.applyMatrix4(rig.matrixWorld);
  }

  function size() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    brain.setScale(renderer.domElement.height / 2);
    return [w, h] as const;
  }

  const api: CtScene = {
    skull, rig, camera,
    setPose(p) {
      rig.rotation.y = p.rotY;
      cut = p.cut;
      brain.setOpacity(p.brain);
      applyCut();
      api.requestRender();
    },
    setHighlight(parts, colors) {
      brain.setHighlight(parts, colors);
      api.requestRender();
    },
    anchor(p) {
      rig.updateMatrixWorld(true);
      return brain.anchor(p, camera, canvas.clientWidth, canvas.clientHeight);
    },
    resize() {
      size();
      api.requestRender();
    },
    requestRender() {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(frame);
    },
  };

  function frame(now: number) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const fading = brain.tick(dt);
    if (dirty || fading) {
      dirty = false;
      renderer.render(scene, camera);
      api.onFrame?.();
    }
    if (fading) raf = requestAnimationFrame(frame);
  }

  size();
  api.setPose({ rotY: 0, cut: null, brain: 0 });
  new ResizeObserver(() => api.resize()).observe(canvas);
  return api;
}
