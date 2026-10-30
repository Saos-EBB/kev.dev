// The finale on the page's one skull (ct-scene.ts): one saw blade flies in
// and sinks a good third of its diameter into the crown; out of the cut a
// fountain of green particles splatters up and every particle freezes at the
// top of its arc. Three of them are the links (the <a>s handed in ride on
// them). Everything hangs on the skull, so the whole thing turns with it
// when dragged. A closed-form function of the time since start(), seeded,
// so it plays the same every time.
import * as THREE from "three";
import { BLADE_R, bladeGeometry } from "./parts";
import { dotMaterial, surfaceDots } from "./dots";

const DELAY = 0.6; // s after start() before the blade leaves
const FLIGHT = 0.5; // s from off-screen to stuck
const HIT_AT = 0.4; // s after the delay
const SCALE = 0.85; // blade size
const INSIDE = 0.38; // share of the blade's diameter inside the skull
const WANT = new THREE.Vector3(-0.15, 0.85, 0.15); // the crown, a little left and forward
const PARTICLES = 130;
const G = 4; // "gravity" of the arcs
const SLOW = 0.6; // the fountain runs at 60 % speed, so it reads
const END = HIT_AT + 3;

// The three link particles: launch velocities (x, y, z) chosen so they
// stand left, top and right of the fountain.
const LINK_VEL = [
  [-1.5, 1.6, 0.6],
  [0.1, 1.9, 0.7],
  [1.55, 1.5, 0.6],
] as const;

export interface Saw {
  start(): void;
  reset(): void;
  finish(): void;
  readonly running: boolean;
  /** Advance by dt seconds and pose everything; true while it still moves. */
  tick(dt: number): boolean;
  /** Each link's particle in world space (null while it isn't out yet). */
  linkPoints(): (THREE.Vector3 | null)[];
}

export function createSaw(opts: {
  skull: THREE.Group; // the skull's group; blade and particles ride on it
  geo: THREE.BufferGeometry; // its geometry, skull space
  onFirstHit(): void;
  onReset(): void;
}): Saw {
  const { skull, geo } = opts;
  let seed = 7;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // The hit: the skull vertex nearest the wanted spot (front half).
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const hit = new THREE.Vector3();
  let best = Infinity;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.z < 0) continue;
    const d = v.distanceToSquared(WANT);
    if (d < best) { best = d; hit.copy(v); }
  }
  // The blade stands in the screen plane, its centre outside the skull
  // along the way in, so INSIDE of its diameter is in the bone.
  const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize();
  const r = BLADE_R * SCALE;
  const stuck = hit.clone().addScaledVector(inDir, r - INSIDE * 2 * r);
  const from = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(-2.5, 0.5, 0.8));

  const mat = dotMaterial();
  const rig = new THREE.Group();
  skull.add(rig);
  const blade = new THREE.Group();
  const spinner = new THREE.Points(surfaceDots(bladeGeometry(), 9000, (_, c) => { c.set("#fff1c9"); }), mat);
  blade.add(spinner);
  blade.scale.setScalar(SCALE);
  blade.rotation.set(0.15, -0.2, 0); // a little out of the screen plane; it spins around its own axis
  rig.add(blade);

  // Green, so they stand out against the violet skull and the pale blade.
  const shardDots = surfaceDots(new THREE.IcosahedronGeometry(1, 0), 60, (_, c) => { c.set("#89ff57"); });
  const particles = Array.from({ length: PARTICLES }, (_, i) => {
    const vel = i < LINK_VEL.length
      ? new THREE.Vector3(...LINK_VEL[i])
      : new THREE.Vector3((rnd() - 0.5) * 4.6, 0.9 + rnd() * 1.0, (rnd() - 0.3) * 2.2);
    const s = new THREE.Points(shardDots, mat);
    s.scale.setScalar(i < LINK_VEL.length ? 0.07 : 0.045 + rnd() * 0.07);
    rig.add(s);
    return { s, vel, spin: [rnd() * 9, rnd() * 9, rnd() * 9] };
  });

  let running = false;
  let t = 0;
  let firstHitSent = false;

  function pose() {
    const T = running ? t - DELAY : -1; // time since the blade left
    const fly = T >= 0 ? Math.min(T / FLIGHT, 1) : 0;
    blade.visible = T >= 0;
    blade.position.lerpVectors(from, stuck, fly * fly);
    const u = T - HIT_AT; // time since the hit
    spinner.rotation.z = -(Math.min(Math.max(T, 0), HIT_AT) * 40 + (u > 0 ? ((1 - Math.exp(-5 * u)) * 40) / 5 : 0));

    // Each particle on its arc, frozen at the top of it.
    for (const { s, vel, spin } of particles) {
      s.visible = u > 0;
      const tau = Math.min(Math.max(u, 0) * SLOW, vel.y / G);
      s.position.set(hit.x + vel.x * tau, hit.y + vel.y * tau - (G / 2) * tau * tau, hit.z + vel.z * tau);
      s.rotation.set(spin[0] * tau, spin[1] * tau, spin[2] * tau);
    }
    if (running && !firstHitSent && u > 0) {
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
      running = true; t = DELAY + END; firstHitSent = true;
      pose();
    },
    tick(dt) {
      if (!running) return false;
      const moving = t < DELAY + END;
      if (moving) t = Math.min(t + dt, DELAY + END);
      pose();
      return moving;
    },
    linkPoints() {
      return particles.slice(0, LINK_VEL.length).map(({ s }) => (s.visible ? s.getWorldPosition(new THREE.Vector3()) : null));
    },
  };
  saw.reset();
  return saw;
}
