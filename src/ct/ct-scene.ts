// The CT skull as a live scene: craniumCut01 as purple→blue dots, the brain
// kit (brain.ts) inside, a cut plane that opens the skull lengthwise. The
// page drives it with setPose()/setHighlight(); it renders only when
// something changed. Numbers from the prototype that made the mockup
// ("#skull infos /ct-skull-prototype.html").
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { loadSkullGeometry } from "./parts";
import { createBrain, type Part } from "./brain";
import { dotMaterial, skullDots } from "./dots";
import { createSaw, type Saw } from "./saw";

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

export interface CtScene {
  setPose(p: Pose): void;
  /** Extra turn on top of the pose, from dragging (radians). */
  setUserTurn(yaw: number, pitch: number): void;
  setHighlight(parts: Part[], colors?: Partial<Record<Part, string>>): void;
  /** Take the brain apart (brain.ts setExplode). */
  setExplode(parts: Part[], out: number, spread: number): void;
  /** Canvas CSS px of a brain part's visible point. */
  anchor(p: Part): [number, number];
  resize(): void;
  /** Rendered something this frame (a fade still running counts). */
  onFrame?: () => void;
  readonly skull: THREE.Group;
  readonly rig: THREE.Group;
  readonly camera: THREE.PerspectiveCamera;
  /** The finale (saw.ts), when asked for. */
  readonly saw: Saw | null;
  /** Canvas CSS px of a world-space point. */
  project(p: THREE.Vector3): [number, number];
  requestRender(): void;
}

type Options = {
  phone?: boolean;
  distance?: number; // camera distance (6.2 as in the mockup renders; closer = bigger)
  // The finale (saw.ts) and its hooks (throws pause on the first hit).
  saw?: boolean;
  onFirstHit?(): void;
  onReset?(): void;
};

export async function createCtScene(canvas: HTMLCanvasElement, opts: Options = {}): Promise<CtScene> {
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
  camera.position.set(0, 0.1, opts.distance ?? 6.2);
  camera.lookAt(0, 0, 0);

  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.95);
  const skullMat = dotMaterial({ transparent: true, opacity: 0.9, depthWrite: false, clippingPlanes: [plane] });
  const skull = new THREE.Group();
  skull.add(new THREE.Points(skullDots(skullGeo, phone ? 25000 : 70000), skullMat));

  const rig = new THREE.Group();
  rig.add(skull, brain.group);
  scene.add(rig);

  const saw = opts.saw
    ? createSaw({
        skull, geo: skullGeo,
        onFirstHit: () => opts.onFirstHit?.(),
        onReset: () => opts.onReset?.(),
      })
    : null;

  let cut: number | null = null;
  let baseRotY = 0, userYaw = 0, userPitch = 0;
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
    skull, rig, camera, saw,
    setPose(p) {
      baseRotY = p.rotY;
      rig.rotation.set(userPitch, baseRotY + userYaw, 0);
      brain.group.position.y = (p.lift ?? 0) * LIFT_BRAIN;
      skull.position.y = -(p.lift ?? 0) * LIFT_SKULL;
      cut = p.cut;
      brain.setOpacity(p.brain);
      applyCut();
      api.requestRender();
    },
    setUserTurn(yaw, pitch) {
      userYaw = yaw;
      userPitch = pitch;
      rig.rotation.set(userPitch, baseRotY + userYaw, 0);
      applyCut();
      api.requestRender();
    },
    setHighlight(parts, colors) {
      brain.setHighlight(parts, colors);
      api.requestRender();
    },
    project(p) {
      const q = p.clone().project(camera);
      return [((q.x + 1) / 2) * canvas.clientWidth, ((1 - q.y) / 2) * canvas.clientHeight];
    },
    setExplode(parts, out, spread) {
      brain.setExplode(parts, out, spread);
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
    const sawing = saw?.running ? saw.tick(dt) : false;
    if (dirty || fading || sawing) {
      dirty = false;
      renderer.render(scene, camera);
      api.onFrame?.();
    }
    if (fading || sawing) raf = requestAnimationFrame(frame);
  }

  size();
  api.setPose({ rotY: 0, cut: null, brain: 0 });
  new ResizeObserver(() => api.resize()).observe(canvas);
  return api;
}
