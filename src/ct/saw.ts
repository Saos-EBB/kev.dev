// The finale on the page's one skull (ct-scene.ts): three saw blades hit
// it one after another; each hit cracks the bone and throws shards that
// slow down and hang in the air — one shard of each hit is a real link
// (GitHub, mail, phone: the <a>s handed in, placed in % of the canvas).
// Everything is a closed-form function of the time since start(), so
// finish() just jumps to the end.
import * as THREE from "three";
import { BLADE_R, bladeGeometry } from "./parts";
import { dotMaterial, surfaceDots } from "./dots";

const BLADE_FLIGHT = 0.45; // s from off-screen to stuck
const HIT_AT = [0.5, 1.9, 3.3]; // s after start()
const FREEZE = 2.6; // how fast shards slow down (1/s) — higher stops sooner
const SHARDS_PER_HIT = 16;
const END = HIT_AT[HIT_AT.length - 1] + 4;

// Where each hit lands (a point in skull space: face +z, vault +y; the
// nearest vertex on the front half is the hit point), and where its link
// shard comes to rest, in world units next to the skull — beside it on
// wide canvases, above/below on tall ones. Spread like real throws: crown
// (top left, steep), right temple (flat), left cheekbone (from below).
const HITS = [
  { want: [-0.3, 0.72, 0.25], scale: 0.62, depth: 0.17, tilt: [0.25, -0.35], wide: [-1.35, 0.95], tall: [-0.8, 1.45] },
  { want: [0.72, 0.22, 0.2], scale: 0.52, depth: 0.12, tilt: [-0.15, 0.5], wide: [1.4, 0.35], tall: [0.8, 1.45] },
  { want: [-0.6, -0.15, 0.55], scale: 0.46, depth: 0.1, tilt: [0.4, 0.2], wide: [-1.3, -0.65], tall: [0, -1.5] },
] as const;

const settle = (u: number) => (u <= 0 ? 0 : (1 - Math.exp(-FREEZE * u)) / FREEZE); // distance factor, freezes at 1/FREEZE

export interface Saw {
  start(): void;
  reset(): void;
  finish(): void;
  readonly running: boolean;
  /** Advance by dt seconds and pose everything; true while it still moves. */
  tick(dt: number, aspect: number): boolean;
}

export function createSaw(opts: {
  skull: THREE.Group; // the skull's group (knocked back on each hit)
  geo: THREE.BufferGeometry; // its geometry, skull space
  scene: THREE.Scene;
  camera: THREE.Camera;
  links: HTMLElement[];
  tall?: boolean; // links above/below the skull instead of beside it (phones)
  onFirstHit(): void;
  onReset(): void;
}): Saw {
  const { skull, geo, scene, camera, links } = opts;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const nearestTo = (p: THREE.Vector3) => {
    let best = Infinity;
    const out = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.z < 0) continue; // front half only, so the hit is visible
      const d = v.distanceToSquared(p);
      if (d < best) { best = d; out.copy(v); }
    }
    return out;
  };

  // Cracks: short random walks over vertices near the hit.
  const crackLines = (hit: THREE.Vector3) => {
    const near: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i);
      if (v.distanceTo(hit) < 0.6 && v.z > hit.z - 0.35) near.push(v.clone());
    }
    const pts: number[] = [];
    for (let c = 0; c < 6; c++) {
      let p = hit.clone();
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.6, Math.random() * 0.3).normalize();
      for (let s = 0; s < 5; s++) {
        const target = p.clone().addScaledVector(dir, 0.09);
        let q: THREE.Vector3 | null = null, qd = Infinity;
        for (const n of near) { const d = n.distanceTo(target); if (d < qd && n.distanceTo(p) > 0.03) { qd = d; q = n; } }
        if (!q) break;
        pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
        p = q;
        dir.x += (Math.random() - 0.5) * 0.6; dir.y += (Math.random() - 0.5) * 0.6; dir.normalize();
      }
    }
    return pts;
  };

  const bladeCol = new THREE.Color("#fff1c9"), shardCol = new THREE.Color("#c9b8ff");
  const bladeDots = surfaceDots(bladeGeometry(), 9000, (_, c) => { c.copy(bladeCol); });
  const shardGeos = [new THREE.TetrahedronGeometry(1), new THREE.OctahedronGeometry(1), new THREE.IcosahedronGeometry(1)]
    .map((g) => surfaceDots(g, 60, (_, c) => { c.copy(shardCol); }));
  const dotMat = dotMaterial();
  const crackMat = new THREE.LineBasicMaterial({ color: "#e9edf2", transparent: true, opacity: 0.8, depthTest: false });

  const hits = HITS.map((h, i) => {
    const hit = nearestTo(new THREE.Vector3(...h.want));
    const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize(); // the blade lies in the screen plane
    const stuck = hit.clone().addScaledVector(inDir, BLADE_R * h.scale - h.depth);
    const start = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(0, 0.3, 0.6));

    const blade = new THREE.Group();
    blade.add(new THREE.Points(bladeDots, dotMat));
    blade.visible = false;
    blade.scale.setScalar(h.scale);
    blade.rotation.set(h.tilt[0], h.tilt[1], 0); // the spin (rotation.z) stays around the blade's own axis
    skull.add(blade); // rides along with the skull's knock-back

    const pts = crackLines(hit);
    const crackGeo = new THREE.BufferGeometry();
    crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    crackGeo.setDrawRange(0, 0);
    skull.add(new THREE.LineSegments(crackGeo, crackMat));

    const shards = Array.from({ length: SHARDS_PER_HIT }, (_, k) => {
      const m = new THREE.Points(shardGeos[k % 3], dotMat);
      m.scale.setScalar(0.025 + Math.random() * 0.06);
      m.visible = false;
      scene.add(m);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.2) * 3, Math.random() * 1.2).addScaledVector(inDir, 1.6);
      const spin = new THREE.Vector3(Math.random() * 14, Math.random() * 14, Math.random() * 14);
      return { m, vel, spin };
    });
    return { at: HIT_AT[i], hit, stuck, start, blade, crackGeo, crackCount: pts.length / 3, shards, h, link: links[i] };
  });

  let running = false;
  let t = 0;
  let firstHitSent = false;
  const q = new THREE.Vector3();

  function pose(aspect: number) {
    // Knock-back: a damped wobble per hit, summed.
    let kick = 0, tilt = 0;
    for (const hh of hits) {
      const u = t - hh.at;
      if (running && u > 0) {
        const k = Math.exp(-6 * u) * Math.sin(11 * u);
        kick += k;
        tilt += k * Math.sign(hh.hit.x || 1);
      }
    }
    skull.position.z = -kick * 0.18;
    skull.rotation.x = -kick * 0.1;
    skull.rotation.z = tilt * 0.06;
    skull.updateMatrixWorld();

    const tall = opts.tall || aspect < 0.8;
    for (const hh of hits) {
      const u = running ? t - hh.at : -1;
      const fly = u + BLADE_FLIGHT;
      hh.blade.visible = running && fly > 0;
      if (hh.blade.visible) {
        const k = Math.min(fly / BLADE_FLIGHT, 1);
        hh.blade.position.lerpVectors(hh.start, hh.stuck, k * k);
        hh.blade.rotation.z = -(Math.min(fly, BLADE_FLIGHT) * 38 + (u > 0 ? ((1 - Math.exp(-4 * u)) * 38) / 4 : 0));
      }
      hh.crackGeo.setDrawRange(0, u > 0 ? Math.floor(Math.min(1, u / 0.35) * hh.crackCount) : 0);

      // Shards burst from the hit point, slow down, hang there.
      const origin = skull.localToWorld(hh.hit.clone());
      const d = settle(u);
      for (const s of hh.shards) {
        s.m.visible = u > 0;
        if (!s.m.visible) continue;
        s.m.position.copy(origin).addScaledVector(s.vel, d);
        s.m.rotation.set(s.spin.x * d, s.spin.y * d, s.spin.z * d);
      }

      // The link shard: same freeze, from the hit to its resting spot.
      const link = hh.link;
      if (u > 0) {
        const k = d * FREEZE; // 0 → 1
        const [tx, ty] = tall ? hh.h.tall : hh.h.wide;
        q.set(tx, ty, 0).lerp(origin, 1 - k).project(camera);
        link.style.visibility = "visible";
        link.style.pointerEvents = k > 0.6 ? "auto" : "none";
        link.style.left = `${((q.x + 1) / 2) * 100}%`;
        link.style.top = `${((1 - q.y) / 2) * 100}%`;
        link.style.transform = `translate(-50%, -50%) rotate(${((1 - k) * 540 * Math.sign(tx || 1)).toFixed(1)}deg) scale(${(0.4 + 0.6 * k).toFixed(3)})`;
      } else {
        link.style.visibility = "hidden";
        link.style.pointerEvents = "none";
      }
    }

    if (running && !firstHitSent && t > HIT_AT[0]) {
      firstHitSent = true;
      opts.onFirstHit();
    }
  }

  const saw: Saw = {
    get running() { return running; },
    start() {
      if (running) return;
      running = true; t = 0; firstHitSent = false;
    },
    reset() {
      const was = running || firstHitSent;
      running = false; t = 0; firstHitSent = false;
      pose(1);
      for (const hh of hits) for (const s of hh.shards) s.m.visible = false;
      if (was) opts.onReset();
    },
    finish() {
      running = true; t = END; firstHitSent = true;
    },
    tick(dt, aspect) {
      if (!running) return false;
      const moving = t < END;
      if (moving) t = Math.min(t + dt, END);
      pose(aspect);
      return moving;
    },
  };
  saw.reset();
  return saw;
}
