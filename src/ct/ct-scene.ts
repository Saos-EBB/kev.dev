// The CT skull as a live scene: craniumCut01 as purple→blue dots (skull.ts),
// the brain kit (brain.ts) inside, a cut that opens the skull lengthwise.
// The page drives it with setPose()/setHighlight(); it renders only when
// something changed.
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { loadSkullGeometry } from "./parts";
import { createBrain, type Part } from "./brain";
import { createSkull } from "./skull";

export type Pose = {
  rotY: number; // 0 = from the front, π/2 = side view (left hemisphere to the camera)
  cut: number | null; // keeps local x > cut; null = whole skull
  brain: number; // brain opacity, see Brain.setOpacity
  lift?: number; // 0 = brain inside the skull, 1 = lifted out above it
};

// How far the brain rises out of the skull at lift 1, and how far the
// skull sinks so both stay in the frame.
const LIFT_BRAIN = 0.4;
const LIFT_SKULL = 0.5;

// Distance between two dots, world units (the skull is about 2 high).
// Phones show it much smaller, so fewer and bigger dots.
const SPACING = 0.0115;
const SPACING_PHONE = 0.021;

export interface CtScene {
  setPose(p: Pose): void;
  setHighlight(parts: Part[], colors?: Partial<Record<Part, string>>): void;
  /** Take the brain apart (brain.ts setExplode). */
  setExplode(parts: Part[], out: number, spread: number): void;
  /** Canvas CSS px of a brain part's visible point. */
  anchor(p: Part): [number, number];
  readonly rig: THREE.Group;
  readonly camera: THREE.PerspectiveCamera;
  requestRender(): void;
}

export async function createCtScene(canvas: HTMLCanvasElement, opts: { phone?: boolean } = {}): Promise<CtScene> {
  const phone = !!opts.phone;
  const spacing = phone ? SPACING_PHONE : SPACING;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, phone ? 1.5 : 2));

  const [skull, brain] = await Promise.all([
    loadSkullGeometry().then((g) => {
      const m = mergeVertices(g, 1e-4);
      m.center();
      return createSkull(m, spacing);
    }),
    createBrain(spacing),
  ]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.1, 6.2);
  camera.lookAt(0, 0, 0);

  const rig = new THREE.Group();
  rig.add(skull.group, brain.group);
  scene.add(rig);

  let dirty = true;
  let raf = 0;
  let last = performance.now();

  function size() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const scale = renderer.domElement.height / 2;
    brain.setScale(scale);
    skull.setScale(scale);
  }

  const api: CtScene = {
    rig, camera,
    setPose(p) {
      rig.rotation.y = p.rotY;
      brain.group.position.y = (p.lift ?? 0) * LIFT_BRAIN;
      skull.group.position.y = -(p.lift ?? 0) * LIFT_SKULL;
      skull.setCut(p.cut);
      brain.setOpacity(p.brain);
      api.requestRender();
    },
    setHighlight(parts, colors) {
      brain.setHighlight(parts, colors);
      api.requestRender();
    },
    setExplode(parts, out, spread) {
      brain.setExplode(parts, out, spread);
      api.requestRender();
    },
    anchor(p) {
      rig.updateMatrixWorld(true);
      return brain.anchor(p, camera, canvas.clientWidth, canvas.clientHeight);
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
    }
    if (fading) raf = requestAnimationFrame(frame);
  }

  size();
  api.setPose({ rotY: 0, cut: null, brain: 0 });
  new ResizeObserver(() => { size(); api.requestRender(); }).observe(canvas);
  return api;
}
