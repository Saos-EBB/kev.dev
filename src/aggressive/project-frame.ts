// The frame on the projects page: every project has its model, and whichever
// comes next, scrolling up or down, flies in and kicks the old one out.
import * as THREE from "three";
import { loadModel, wireModel } from "./models";
import { dispose, dragTurn, place, reducedMotion, runScene } from "./wire-kit";

const KICK_AT = 0.2; // s until the new model reaches the old one
const SETTLE = 0.55; // s until it has stopped in the middle

// Which real model stands for which project. Turn: to show its best side.
const REAL: Record<string, { model: string; turn?: [number, number, number] }> = {
  oskalizer: { model: "keyboard", turn: [0.5, 0, 0] }, // the keyboard
  yourbrand: { model: "yourbrand", turn: [1.1, 0, 0] }, // the board everything runs on
  tschobbo: { model: "tschobbo", turn: [1.2, 0, 0] }, // the clipboard with the applications
  kevdev: { model: "kevdev" }, // the laptop
  aniscript: { model: "aniscript" }, // the film projector
  releasewatcher: { model: "releasewatcher" }, // the TV
  loadtest: { model: "loadtest" }, // the multimeter
  shop: { model: "shop" }, // the cash register
  renderer: { model: "renderer" }, // the camera
  grundlagen: { model: "grundlagen", turn: [0.9, 0, 0] }, // the console
  facedots: { model: "facedots" }, // the bust
};
// Models come with radius 1: at this size every one stays whole inside the frame,
// however it's turned.
const SIZE = 2.5;

// A holder right away, so the kick never waits for a download.
function build(id: string) {
  const holder = new THREE.Group();
  const real = REAL[id] ?? REAL.renderer;
  void loadModel(real.model).then((geo) => {
    const o = wireModel(geo);
    o.scale.setScalar(SIZE);
    if (real.turn) o.rotation.set(...real.turn);
    holder.add(o);
  });
  return holder;
}

export function createProjectFrame(canvas: HTMLCanvasElement) {
  const reduced = reducedMotion();
  for (const r of Object.values(REAL)) void loadModel(r.model); // no holes later
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
  camera.position.z = 9.5;
  const root = place(new THREE.Group(), 0, 0, 0, 0.2);
  const turn = dragTurn(canvas);
  scene.add(root);

  let current: { o: THREE.Object3D; t: number } | null = null;
  const out: { o: THREE.Object3D; t: number; spin: THREE.Vector3 }[] = [];
  let wanted: string | null = null;
  let shown: string | null = null;

  const handle = runScene(canvas, camera, scene, (t, dt) => {
    root.rotation.set(0.2 + turn.x, Math.sin(t * 0.4) * 0.35 - 0.3 + turn.y, 0);
    if (wanted && wanted !== shown && (!current || current.t > SETTLE * 0.6)) {
      shown = wanted;
      const o = build(wanted);
      root.add(place(o, reduced ? 0 : -9));
      // The old one stays where it is until this one arrives.
      const previous = current;
      current = { o, t: 0 };
      if (previous) out.push({ o: previous.o, t: reduced ? 1 : -KICK_AT, spin: new THREE.Vector3(5 - Math.random() * 10, 8, -9) });
    }
    if (current) {
      current.t += dt;
      const k = Math.min(current.t / SETTLE, 1);
      // Straight in at full speed, then the impact brakes it.
      const x = current.t < KICK_AT ? -9 + (current.t / KICK_AT) * 7.2 : -1.8 * (1 - (k - KICK_AT / SETTLE) / (1 - KICK_AT / SETTLE)) ** 3;
      current.o.position.x = reduced ? 0 : x;
    }
    for (let i = out.length - 1; i >= 0; i--) {
      const f = out[i];
      f.t += dt;
      if (f.t <= 0) continue;
      f.o.position.x = f.t * 18;
      f.o.position.y = f.t * 5 - 9 * f.t * f.t;
      f.o.rotation.set(f.spin.x * f.t, f.spin.y * f.t, f.spin.z * f.t);
      if (f.t > 0.9) {
        root.remove(f.o);
        dispose(f.o);
        out.splice(i, 1);
      }
    }
  });

  return {
    // Asked again before it has settled: the last request wins.
    show(id: string) {
      wanted = id;
    },
    paint: handle.paint,
    stop() {
      handle.stop();
      turn.stop();
      for (const f of out) dispose(f.o);
      if (current) dispose(current.o);
    },
  };
}
