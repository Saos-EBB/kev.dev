// The finale on the page's one skull (ct-scene.ts), as in the live
// prototype ("#skull infos /ct-live.zip", saw(T)): three saw blades hit it
// one after another, each hit throws shards that slow down and freeze in
// the air. The <a>s handed in ride on the first shard of each hit and
// become clickable once it stands. A closed-form function of the time
// since start(), seeded, so it plays the same every time.
// `single` (phones), like the main page's contact: ONE big blade cut deep,
// many more shards (the three links ride on its first three) and green
// splatter blood (src/contact/skull/blood.ts) that fades in the air — no
// pool.
import * as THREE from "three";
import { BLADE_R, bladeGeometry } from "./parts";
import { dotMaterial, surfaceDots } from "./dots";
import { createBlood, type Blood } from "../contact/skull/blood";

const FLIGHT = 0.45; // s from off-screen to stuck
const DELAY = 0.6; // s after start() before the first blade leaves
const SHARDS = 14;
const END = 2.2 + 4;
const SINGLE_SHARDS = 60;
const SINGLE_BLOOD = 1300;

const HITS = [
  { want: [-0.3, 0.72, 0.25], scale: 0.62, depth: 0.17, tilt: [0.25, -0.35], at: 0.4 },
  { want: [0.72, 0.22, 0.2], scale: 0.52, depth: 0.12, tilt: [-0.15, 0.5], at: 1.3 },
  { want: [-0.6, -0.15, 0.55], scale: 0.46, depth: 0.1, tilt: [0.4, 0.2], at: 2.2 },
] as const;

const SINGLE_HIT = [{ want: [-0.32, 0.6, 0.35], scale: 0.78, depth: 0.42, tilt: [0.25, -0.3], at: 0.4 }] as const;

// Shards slow down and freeze at 0.55 / 2.6 of their velocity.
const settle = (u: number) => (u <= 0 ? 0 : (0.55 * (1 - Math.exp(-2.6 * u))) / 2.6);

export interface Saw {
  start(): void;
  reset(): void;
  finish(): void;
  readonly running: boolean;
  /** Advance by dt seconds and pose everything; true while it still moves. */
  tick(dt: number): boolean;
  /** Each link's shard in world space (null while it isn't out yet). */
  linkPoints(): (THREE.Vector3 | null)[];
}

export function createSaw(opts: {
  skull: THREE.Group; // the skull's group; blades and shards ride on it
  geo: THREE.BufferGeometry; // its geometry, skull space
  onFirstHit(): void;
  onReset(): void;
  single?: boolean; // one blade, more shards, blood (see the header)
  px?: number; // the renderer's pixel ratio, for the blood's drop sizes
}): Saw {
  const { skull, geo } = opts;
  let seed = 7;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

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

  const bladeCol = new THREE.Color("#fff1c9"), shardCol = new THREE.Color("#c9b8ff");
  const bladeDots = surfaceDots(bladeGeometry(), 8000, (_, c) => { c.copy(bladeCol); });
  const shardDots = surfaceDots(new THREE.IcosahedronGeometry(1, 0), 60, (_, c) => { c.copy(shardCol); });
  const mat = dotMaterial();

  const rig = new THREE.Group();
  skull.add(rig);
  const HIT_LIST = opts.single ? SINGLE_HIT : HITS;
  const nShards = opts.single ? SINGLE_SHARDS : SHARDS;
  let blood: Blood | null = null;
  const hits = HIT_LIST.map((h) => {
    const hit = nearestTo(new THREE.Vector3(...h.want));
    const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize(); // the blade lies in the screen plane
    const stuck = hit.clone().addScaledVector(inDir, BLADE_R * h.scale - h.depth);
    const start = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(0, 0.3, 0.6));
    const outer = new THREE.Group(), inner = new THREE.Points(bladeDots, mat);
    outer.add(inner);
    outer.scale.setScalar(h.scale);
    outer.rotation.set(h.tilt[0], h.tilt[1], 0); // the spin (inner.rotation.z) stays around the blade's own axis
    rig.add(outer);
    if (opts.single) {
      const axis = hit.clone().normalize().add(new THREE.Vector3(0, 0.35, 0.5)).normalize();
      blood = createBlood({ hit, axis, count: SINGLE_BLOOD, ink: new THREE.Color("#89ff57"), px: opts.px ?? 1 });
      rig.add(blood.points);
    }
    // single: the three link shards fly apart on their own paths (up
    // left, up right, down) so the links never land on top of each other
    const LINK_VEL = [[-3.2, 2.4, 0.9], [3.4, 1.6, 0.9], [0.6, -3.4, 1.1]];
    const shards = Array.from({ length: nShards }, (_, k) => {
      const s = new THREE.Points(shardDots, mat);
      const vel = opts.single && k < 3
        ? new THREE.Vector3(...LINK_VEL[k])
        : new THREE.Vector3((rnd() - 0.5) * 3, (rnd() - 0.2) * 3, rnd() * 1.2).addScaledVector(inDir, 1.6);
      const spin = [rnd() * 14, rnd() * 14, rnd() * 14];
      s.scale.setScalar(0.03 + rnd() * 0.06);
      rig.add(s);
      return { s, vel, spin };
    });
    return { ...h, hit, stuck, start, outer, inner, shards };
  });

  const end = opts.single ? SINGLE_HIT[0].at + (blood as Blood | null)!.duration : END;

  let running = false;
  let t = 0;
  let firstHitSent = false;

  function pose() {
    const T = running ? t - DELAY : -1;
    for (const h of hits) {
      const u = T - h.at, fly = u + FLIGHT;
      h.outer.visible = T >= 0 && fly > 0;
      const k = Math.min(Math.max(fly, 0) / FLIGHT, 1);
      h.outer.position.lerpVectors(h.start, h.stuck, k * k);
      h.inner.rotation.z = -(Math.min(Math.max(fly, 0), FLIGHT) * 38 + (u > 0 ? ((1 - Math.exp(-4 * u)) * 38) / 4 : 0));
      const d = settle(u);
      blood?.setTime(T >= 0 ? u : -1);
      for (const { s, vel, spin } of h.shards) {
        s.visible = T >= 0 && u > 0;
        s.position.copy(h.hit).addScaledVector(vel, d);
        s.rotation.set(spin[0] * d, spin[1] * d, spin[2] * d);
      }
    }
    if (running && !firstHitSent && T > HIT_LIST[0].at) {
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
      const was = firstHitSent;
      running = false; t = 0; firstHitSent = false;
      pose();
      if (was) opts.onReset();
    },
    finish() {
      running = true; t = end + DELAY; firstHitSent = true;
      pose();
    },
    tick(dt) {
      if (!running) return false;
      const moving = t < end + DELAY;
      if (moving) t = Math.min(t + dt, end + DELAY);
      pose();
      return moving;
    },
    linkPoints() {
      // one hit: the links ride on its first three shards
      const carriers = opts.single ? hits[0].shards.slice(0, 3) : hits.map((h) => h.shards[0]);
      return carriers.map(({ s }) => (s.visible ? s.getWorldPosition(new THREE.Vector3()) : null));
    },
  };
  saw.reset();
  return saw;
}
