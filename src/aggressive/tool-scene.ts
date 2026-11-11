// The about page's scene: the hammer really breaks the keyboard. Four to seven
// blows, each tears a hole into the case and throws the keys around it, the last
// one snaps the case in two. Runs by itself; dragging turns it.
import * as THREE from "three";
import { loadModel, loadParts, wireModel } from "./models";
import { CALM, COLORS, dispose, dragTurn, part, place, reducedMotion, runScene } from "./wire-kit";

const FIRST_AT = 1.4, BETWEEN = 1.9; // s: a look at it whole first, then one blow at a time
const SWING = 0.2; // s of the blow itself
const HOLD = 0.2, REBOUND = 0.22; // s at the top; s of the bounce off the keys
const HAMMER = 1.15; // its size
const GRIP = -0.72, HEAD = 0.885, FACE = 0.32; // along its handle: the hand, the head; the face's distance from the handle
const FOREARM = 1.6, ELBOW = 0.5; // its length; how far (radians) the hand hangs below the elbow at the impact
const SIZE = 3;
const FLOOR = -1.5, GRAVITY = 9;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Loose = { o: THREE.Object3D; v: THREE.Vector3; s: THREE.Vector3; free: boolean; rest: boolean };

const triGeometry = (src: number[]) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(src, 3));
  return g;
};

export function createToolScene(canvas: HTMLCanvasElement) {
  const reduced = reducedMotion();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
  const root = new THREE.Group();
  scene.add(root);
  const turn = dragTurn(canvas);
  const keyboard = new THREE.Group();
  root.add(keyboard);

  // A hammer as it's really swung: gripped at the end of the handle, the forearm
  // turns at the elbow, the wrist snaps last, so the head comes down on an arc and
  // lands with its flat face, the handle level, on the keyboard. All of it in one
  // plane, standing on the target.
  const rig = new THREE.Group();
  rig.rotation.y = 0.2; // seen from the side, the whole arc in view
  rig.visible = false;
  const forearm = new THREE.Group();
  const wrist = place(new THREE.Group(), -FOREARM);
  forearm.add(wrist);
  rig.add(forearm);
  root.add(rig);
  forearm.position.set(
    (HEAD - GRIP) * HAMMER + FOREARM * Math.cos(ELBOW),
    FACE * HAMMER + FOREARM * Math.sin(ELBOW),
    0,
  );
  const hammerReady = loadModel("hammer").then((geo) => {
    const o = wireModel(geo, COLORS.blue);
    o.scale.setScalar(HAMMER);
    // In the model the handle runs along y, the head on top, its face towards -x.
    wrist.add(place(o, 0, -GRIP * HAMMER));
  });
  // Both 0 at the impact, 1 at the top of the backswing.
  const pose = (lift: number, cock: number) => {
    forearm.rotation.z = ELBOW - lift * 0.5;
    wrist.rotation.z = Math.PI / 2 - cock * 1.4 - forearm.rotation.z;
  };
  pose(0.2, 0.2);

  const blows = 4 + Math.floor(Math.random() * 4); // 4 to 7
  const loose: Loose[] = [];
  let baseTris: number[][] = [];
  let baseLeft: THREE.Group | null = null, baseRight: THREE.Group | null = null;
  let clock = -1, done = 0, stopped = false, top = 0, snapped = 0;
  const targets: THREE.Vector3[] = [];

  const drawBase = () => {
    baseLeft?.removeFromParent();
    baseRight?.removeFromParent();
    const sides: number[][] = [[], []];
    for (const t of baseTris) {
      const x = (t[0] + t[3] + t[6]) / 3, z = (t[2] + t[5] + t[8]) / 3;
      sides[x + Math.sin(z * 14) * 0.08 < 0 ? 0 : 1].push(...t);
    }
    [baseLeft, baseRight] = sides.map((s) => {
      const g = part(triGeometry(s), { opacity: 0.55 });
      const holder = new THREE.Group();
      holder.add(g);
      keyboard.add(holder);
      return holder;
    });
  };

  void Promise.all([loadParts("keyboard"), hammerReady]).then(([{ tris, parts }]) => {
    if (stopped) return;
    keyboard.scale.setScalar(1);
    const scaled = tris.map((t) => t.map((v) => v * SIZE));
    baseTris = scaled.slice(0, parts[0]);
    drawBase();
    top = -Infinity;
    for (let i = 1; i < parts.length; i++) {
      const own = scaled.slice(parts[i - 1], parts[i]).flat();
      const centre = new THREE.Vector3();
      for (let k = 0; k < own.length; k += 3) {
        centre.x += own[k]; centre.y += own[k + 1]; centre.z += own[k + 2];
        top = Math.max(top, own[k + 1]);
      }
      centre.divideScalar(own.length / 3);
      for (let k = 0; k < own.length; k += 3) { own[k] -= centre.x; own[k + 1] -= centre.y; own[k + 2] -= centre.z; }
      const o = part(triGeometry(own), { opacity: 0.8 });
      o.position.copy(centre);
      keyboard.add(o);
      loose.push({ o, v: new THREE.Vector3(), s: new THREE.Vector3(), free: false, rest: false });
    }
    // Spread over the board, so each blow finds keys of its own.
    for (let i = 0; i < blows; i++) {
      const x = ((i + 0.5) / blows - 0.5) * 2.2 * (i % 2 ? 1 : 0.8);
      targets.push(new THREE.Vector3(x, top, rand(-0.35, 0.5)));
    }
    clock = 0; // only now: the page is up (it mounts this) and both models are here
    if (reduced) while (done < blows) strike(done);
  });

  function strike(i: number) {
    const at = targets[i];
    done = i + 1;
    const last = done === blows;
    const radius = last ? Infinity : 0.72;
    for (const k of loose) {
      if (k.free) continue;
      const d = Math.hypot(k.o.position.x - at.x, k.o.position.z - at.z);
      if (d > radius) continue;
      k.free = true;
      const away = new THREE.Vector3(k.o.position.x - at.x, 0, k.o.position.z - at.z).normalize();
      k.v.copy(away).multiplyScalar(last ? rand(0.6, 2) : rand(1, 2.6)).setY(rand(2.5, 5.5));
      k.s.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
    }
    // A hole in the case where it hit; pieces of it join the keys.
    const kept: number[][] = [];
    let thrown = 0;
    for (const t of baseTris) {
      const x = (t[0] + t[3] + t[6]) / 3, z = (t[2] + t[5] + t[8]) / 3, y = (t[1] + t[4] + t[7]) / 3;
      if (!last && y > top - 0.42 && Math.hypot(x - at.x, z - at.z) < 0.42) {
        // Long slivers of the mesh would fly around as spikes: only real chips.
        const span = Math.max(t[0], t[3], t[6]) - Math.min(t[0], t[3], t[6]) + Math.max(t[2], t[5], t[8]) - Math.min(t[2], t[5], t[8]);
        if (span < 0.45 && thrown++ < 26) {
          const c = [x, y, z], own = t.map((v, n) => v - c[n % 3]);
          const o = place(part(triGeometry(own), { opacity: 0.9 }), x, y, z);
          keyboard.add(o);
          loose.push({ o, v: new THREE.Vector3(rand(-2, 2), rand(2, 5), rand(-1.5, 2)), s: new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9)), free: true, rest: false });
        }
      } else kept.push(t);
    }
    baseTris = kept;
    drawBase();
    if (last) snapped = performance.now();
  }

  const handle = runScene(canvas, camera, scene, (t, dt) => {
    camera.position.z = 12 * Math.max(1, 1.35 / camera.aspect);
    root.rotation.set(0.55 + turn.x, -0.45 + turn.y + Math.sin(t * 0.3) * 0.05, 0);
    if (clock < 0) return;
    const now = (clock += dt); // frame time: after a stall the blows don't catch up in a burst

    // One beat per blow: back up slowly, a short hold, then down, faster and
    // faster, the wrist last, and a small bounce off the keyboard.
    if (done < blows && !reduced) {
      const hitAt = FIRST_AT + done * BETWEEN, to = targets[done];
      const since = now - (hitAt - BETWEEN);
      const rise = THREE.MathUtils.smoothstep(since, REBOUND, BETWEEN - SWING - HOLD);
      const fall = THREE.MathUtils.clamp(1 - (hitAt - now) / SWING, 0, 1);
      const bounce = done && since < REBOUND ? Math.sin((since / REBOUND) * Math.PI) * 0.12 : 0;
      if (done) rig.position.lerpVectors(targets[done - 1], to, rise); // moves on while it's up
      else rig.position.copy(to);
      rig.visible = true;
      pose(rise * (1 - fall ** 3) + bounce, rise * (1 - fall ** 5) + bounce);
      if (now >= hitAt) {
        pose(0, 0);
        strike(done);
      }
    } else if (done === blows && !reduced) {
      // Done: it stays a little above the wreck, where it last hit.
      const a = Math.min((performance.now() - snapped) / 400, 1);
      pose(a * 0.25, a * 0.15);
    }

    // the case breaks in two
    if (snapped || (reduced && done === blows)) {
      const a = reduced ? 1 : Math.min((performance.now() - snapped) / 500, 1);
      if (baseLeft && baseRight) {
        baseLeft.rotation.z = 0.28 * a;
        baseRight.rotation.z = -0.28 * a;
        baseLeft.position.set(-0.18 * a, -0.45 * a * a, 0);
        baseRight.position.set(0.18 * a, -0.45 * a * a, 0);
      }
    }

    for (const k of loose) {
      if (!k.free || k.rest) continue;
      k.v.y -= GRAVITY * dt;
      k.o.position.addScaledVector(k.v, dt);
      k.o.rotation.x += k.s.x * dt; k.o.rotation.y += k.s.y * dt; k.o.rotation.z += k.s.z * dt;
      if (k.o.position.y < FLOOR) {
        k.o.position.y = FLOOR;
        if (Math.abs(k.v.y) < 1.2) { k.rest = true; continue; }
        k.v.y *= -0.35; k.v.x *= 0.6; k.v.z *= 0.6; k.s.multiplyScalar(0.5);
      }
    }
    // The wreck lies still, nobody turns it: only the slow sway is left.
    if (done === blows && !turn.held && (reduced || performance.now() - snapped > 700) && loose.every((k) => !k.free || k.rest)) return CALM;
  });

  return {
    paint: handle.paint,
    stop() {
      stopped = true;
      handle.stop();
      turn.stop();
      dispose(root);
    },
  };
}
