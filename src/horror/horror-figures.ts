// Hinter dir — figures standing around the maze. They never move while you
// look at them. Look away long enough and they've turned to you and come a
// step closer (a sitting one has stood up). Get too close and they're gone.
import * as THREE from "three";
import * as sfx from "./horror-audio";

type Cell = [number, number];
type Pose = "wall" | "sit" | "still";
export type FigureWorld = {
  scene: THREE.Scene;
  C: number;
  corridors: Cell[]; // straight corridor cells
  openDirs: (x: number, z: number) => Cell[];
  solidAt: (x: number, z: number) => boolean;
  clearLine: (a: THREE.Vector3, b: THREE.Vector3) => boolean;
};

const clothMat = new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 1 });
const headMat = new THREE.MeshStandardMaterial({ color: 0x9c948a, roughness: 0.8 });
const bodyGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.5, 10);
const armGeo = new THREE.CylinderGeometry(0.03, 0.022, 0.75, 6);
const headGeo = new THREE.SphereGeometry(0.12, 14, 10);

function makeFigure() {
  const root = new THREE.Group(); // stands on the floor, faces +z
  const lean = new THREE.Group(); // pose: sitting leans back against the wall
  const body = new THREE.Mesh(bodyGeo, clothMat);
  body.position.y = 0.75;
  lean.add(body);
  for (const s of [-1, 1]) { const a = new THREE.Mesh(armGeo, clothMat); a.position.set(s * 0.21, 1.08, 0); a.rotation.z = s * 0.05; lean.add(a); }
  const head = new THREE.Group();
  head.position.y = 1.64;
  head.add(new THREE.Mesh(headGeo, headMat));
  lean.add(head);
  lean.traverse((o) => { o.castShadow = true; });
  root.add(lean);
  return { root, lean, head };
}

export function createFigures(w: FigureWorld) {
  const { C } = w;
  const tmp = new THREE.Vector3(), mid = new THREE.Vector3();
  const POSES: Pose[] = ["wall", "sit", "still", "wall", "still"];

  const figures = [0.08, 0.33, 0.58, 0.8, 0.99].map((f, i) => {
    const [x, z] = w.corridors[Math.floor(f * (w.corridors.length - 1))];
    const [ox, oz] = w.openDirs(x, z)[0];
    const side: Cell = i % 2 ? [oz, -ox] : [-oz, ox];
    const pose = POSES[i];
    const fig = makeFigure();
    const base = new THREE.Vector3(x * C, 0, z * C);
    if (pose === "wall") {
      // close to a side wall, face to the concrete, back to you
      fig.root.position.set(base.x + side[0] * (C / 2 - 0.45), 0, base.z + side[1] * (C / 2 - 0.45));
      fig.root.lookAt(tmp.set(base.x + side[0] * C, 0, base.z + side[1] * C));
    } else if (pose === "sit") {
      // slumped against a side wall, head hanging
      fig.root.position.set(base.x + side[0] * (C / 2 - 0.35), 0, base.z + side[1] * (C / 2 - 0.35));
      fig.root.lookAt(base);
      fig.lean.position.y = -0.72;
      fig.lean.rotation.x = -0.25;
      fig.head.rotation.x = 0.7;
    } else {
      // in the middle of the corridor, facing down it, away from you
      fig.root.position.copy(base);
      fig.root.lookAt(tmp.set(base.x + ox * C, 0, base.z + oz * C));
    }
    w.scene.add(fig.root);
    return { ...fig, pose, unseen: 0, steps: 0, gone: 0 };
  });

  // swap the placeholder spheres for the real (scanned) head once it's loaded
  function setHead(make: () => THREE.Object3D) {
    for (const f of figures) {
      f.head.clear();
      const h = make();
      h.traverse((o) => { if (o instanceof THREE.Mesh) { o.material = headMat; o.castShadow = true; } });
      f.head.add(h);
    }
  }

  // one step closer: turn to you, stand up if sitting, move ≤ 0.6 m without touching a wall
  function step(f: (typeof figures)[number], eye: THREE.Vector3) {
    f.steps++;
    f.lean.position.y = 0; f.lean.rotation.x = 0; f.head.rotation.set(0, 0, 0.25 * (Math.random() - 0.5));
    tmp.set(eye.x - f.root.position.x, 0, eye.z - f.root.position.z);
    const d = tmp.length();
    if (d > 2.4) {
      tmp.multiplyScalar(0.6 / d);
      mid.copy(f.root.position).add(tmp);
      const room = [[0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]].every(([ax, az]) => !w.solidAt(mid.x + ax, mid.z + az));
      if (room) f.root.position.copy(mid);
    }
    f.root.lookAt(tmp.set(eye.x, 0, eye.z));
  }

  function update(dt: number, eye: THREE.Vector3, inView: (p: THREE.Vector3) => boolean, lightOn: boolean, awake: boolean) {
    for (const f of figures) {
      if (f.gone >= 1) continue;
      if (f.gone > 0) { // sinking into the dark floor, then gone
        f.gone = Math.min(1, f.gone + dt * 3);
        f.root.position.y = -f.gone * 1.9;
        if (f.gone >= 1) f.root.visible = false;
        continue;
      }
      mid.set(f.root.position.x, 1.2, f.root.position.z);
      const d = mid.distanceTo(eye);
      const seen = lightOn && d < 14 && inView(mid) && w.clearLine(eye, mid);
      if (seen) {
        f.unseen = 0;
        if (d < 1.7) { f.gone = 0.01; sfx.crack(); }
      } else if (awake && d < 12 && f.steps < 4) {
        f.unseen += dt;
        if (f.unseen > 2) { f.unseen = 0; step(f, eye); }
      }
    }
  }

  return { update, setHead };
}
