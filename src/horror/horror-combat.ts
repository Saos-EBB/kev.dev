// Hinter dir — the Doom part: shotgun and saw bat, three kinds of zombie
// (normal, big, the boss that throws skulls), pickups, blood.
// Models: Quaternius "Zombie Apocalypse Kit" (CC0), see NOTICE.md.
// Skull projectiles: the craniumCut01 skull from the site's renderer models.
//
// Damage is per hit, not per pellet: a shotgun blast is one hit — head if
// any pellet found the head (100), else body (50). The saw bat: 500 / 150.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import * as sfx from "./horror-audio";
import { loadSkullGeometry } from "../skull-site/parts";

export type ZombieKind = "normal" | "big" | "boss";
export type PickupKind = "shotgun" | "bat" | "shells" | "health";
export type Kill = { kind: ZombieKind; hits: number; head: boolean };

export type CombatWorld = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  solidAt: (x: number, z: number) => boolean;
  floorAt: (x: number, z: number) => number;
  steer: (from: THREE.Vector3, out: THREE.Vector3) => THREE.Vector3; // next point on the way to you
  clearLine: (a: THREE.Vector3, b: THREE.Vector3) => boolean;
  onHurt: (damage: number) => void; // the game shows it and handles death
  onShot: () => void; // muzzle flash: the game brightens the lamp for a moment
  onKill: (k: Kill) => void;
  onImpact: (head: boolean, kill: boolean) => void; // bat connects: the game freezes a beat, shakes, splatters the lens
};

const PELLETS = 8, SPREAD = 0.07, RANGE = 30;
const DMG = { shotgun: { head: 100, body: 50 }, bat: { head: 500, body: 150 } };
const BAT_RANGE = 2.1;
const SHELLS_PER_BOX = 5;
// the boss: skulls fly fast; below 40 % life it charges at where you stood when it started
const SKULL_SPEED = 13, SKULL_EVERY: [number, number] = [1.4, 2.0];
const CHARGE_BELOW = 0.4, CHARGE_EVERY = 4, CHARGE_WINDUP = 0.7, CHARGE_SPEED = 10, CHARGE_DMG = 35;
const ZOMBIE_HEIGHT = 1.8; // a normal zombie

type KindSpec = { file: string; scale: number; hp: number; speed: [number, number]; attack: string; dmg: number };
const KINDS: Record<ZombieKind, KindSpec> = {
  normal: { file: "zombie_basic", scale: 1, hp: 100, speed: [1.3, 2.3], attack: "Punch", dmg: 12 },
  big: { file: "zombie_chubby", scale: 1.3, hp: 200, speed: [1.0, 1.3], attack: "Punch", dmg: 18 },
  boss: { file: "zombie_chubby", scale: 2.1, hp: 2000, speed: [0.6, 0.6], attack: "Punch", dmg: 25 },
};

/* ---------- small helpers ---------- */
function makeFlash() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d")!, grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "#fff6d0"); grd.addColorStop(0.3, "#ffb030cc"); grd.addColorStop(1, "#ff600000");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.scale.setScalar(0.35);
  flash.visible = false;
  return flash;
}
function makeBox(kind: "shells" | "health") {
  const g = new THREE.Group();
  const color = kind === "shells" ? 0xb52a1a : 0xe8e2d6;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, roughness: 0.6 })));
  if (kind === "health") {
    const red = new THREE.MeshBasicMaterial({ color: 0xd8291f });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.17, 0.12), red), new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.17, 0.04), red));
  }
  return g;
}

export function createCombat(w: CombatWorld) {
  const { scene, camera } = w;
  const have = { shotgun: false, bat: false };
  let weapon: "shotgun" | "bat" | null = null;
  let ammo = 0, cooldown = 0, recoil = 0, flashT = 0, bobPhase = 0, swingT = -1, swung = false;

  type Pickup = { kind: PickupKind; obj: THREE.Object3D; at: THREE.Vector3 };
  const pickups: Pickup[] = [];

  /* ---------- assets: load once, in the background ---------- */
  const loader = new GLTFLoader();
  const protos = new Map<string, { scene: THREE.Object3D; clips: THREE.AnimationClip[]; height: number }>();
  const props: Record<"shotgun" | "bat", THREE.Object3D | null> = { shotgun: null, bat: null };
  let skullGeo: THREE.BufferGeometry | null = null;
  const ready = (async () => {
    const files = ["zombie_basic", "zombie_chubby"];
    const [gun, bat, ...zs] = await Promise.all([
      loader.loadAsync("/horror/shotgun.glb"), loader.loadAsync("/horror/bat_saw.glb"),
      ...files.map((f) => loader.loadAsync(`/horror/${f}.glb`)),
    ]);
    props.shotgun = gun.scene; props.bat = bat.scene;
    const box = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o, true);
    const k = ZOMBIE_HEIGHT / (box(zs[0].scene).max.y - box(zs[0].scene).min.y); // one scale for the pack
    zs.forEach((g, n) => {
      g.scene.scale.setScalar(k);
      g.scene.traverse((o) => {
        o.castShadow = true;
        if (o instanceof THREE.SkinnedMesh) {
          o.frustumCulled = false;
          // the pack is bright and cartoony; grime it down for the dark
          const m = (o.material as THREE.MeshStandardMaterial).clone();
          m.color.multiplyScalar(0.55); m.roughness = 1; m.metalness = 0;
          o.material = m;
        }
      });
      const b = box(g.scene);
      protos.set(files[n], { scene: g.scene, clips: g.animations, height: b.max.y - b.min.y });
    });
    // skulls: scaled to ~30 cm, bone white
    skullGeo = await loadSkullGeometry();
    skullGeo.computeBoundingBox();
    const s = skullGeo.boundingBox!.getSize(new THREE.Vector3());
    skullGeo.scale(0.3 / s.y, 0.3 / s.y, 0.3 / s.y);
    skullGeo.computeVertexNormals();
    buildViewModels();
    for (const p of pickups) if (p.kind === "shotgun" || p.kind === "bat") dressPickup(p);
  })();

  /* ---------- weapons in your hands: own scene, drawn after the world with a
     cleared depth buffer, so they never poke into walls and have their own light ---------- */
  const viewScene = new THREE.Scene();
  const viewRoot = new THREE.Group();
  viewScene.add(viewRoot, new THREE.HemisphereLight(0xc8b49a, 0x2a2018, 2.2));
  const viewLight = new THREE.DirectionalLight(0xffd0a0, 2.5);
  viewLight.position.set(0.3, 1, 0.5);
  viewRoot.add(viewLight, viewLight.target);
  const gun = new THREE.Group(), batView = new THREE.Group(); // gun muzzle points to -z
  const flash = makeFlash();
  gun.add(flash);
  viewRoot.add(gun, batView);
  function buildViewModels() {
    const g = props.shotgun!.clone();
    g.rotation.y = Math.PI; // the model's barrel points to +z
    g.scale.setScalar(0.55);
    gun.add(g);
    flash.position.set(0, 0.03, -0.97 * 0.55 - 0.05);
    const b = props.bat!.clone(); // handle at the origin, blade up +y
    b.scale.setScalar(0.6);
    b.rotation.set(-0.5, 0, -0.35);
    batView.add(b);
  }

  /* ---------- blood + dust + bone particles: one pool, one draw call ---------- */
  const P = 400;
  const pPos = new Float32Array(P * 3), pCol = new Float32Array(P * 3), pVel = new Float32Array(P * 3), pLife = new Float32Array(P);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true }));
  particles.frustumCulled = false;
  scene.add(particles);
  let pNext = 0;
  // a directed spray: most of it flies along (dx, dz), fast, in a flat fan
  function spray(at: THREE.Vector3, dx: number, dz: number, n: number) {
    for (let k = 0; k < n; k++) {
      const i = pNext++ % P, sp = 2 + Math.random() * 5;
      pPos.set([at.x, at.y, at.z], i * 3);
      pCol.set([0.35 + Math.random() * 0.2, 0.01, 0.01], i * 3);
      pVel.set([dx * sp + (Math.random() - 0.5) * 2, Math.random() * 2.5, dz * sp + (Math.random() - 0.5) * 2], i * 3);
      pLife[i] = 0.8 + Math.random() * 0.6;
    }
  }
  function burst(at: THREE.Vector3, n: number, r: number, g: number, b: number, speed: number) {
    for (let k = 0; k < n; k++) {
      const i = pNext++ % P;
      pPos.set([at.x, at.y, at.z], i * 3);
      pCol.set([r, g, b], i * 3);
      pVel.set([(Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed], i * 3);
      pLife[i] = 0.6 + Math.random() * 0.5;
    }
  }

  /* ---------- zombies ---------- */
  type Zombie = {
    kind: ZombieKind; spec: KindSpec; root: THREE.Object3D; height: number;
    mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>;
    current: string; busy: number; // seconds left of a one-shot animation (hit, attack)
    hp: number; hits: number; speed: number; move: string;
    attackCD: number; struck: boolean; dying: number; growlCD: number; throwCD: number;
    charge: "none" | "windup" | "dash"; chargeT: number; chargeCD: number; chargeTo: THREE.Vector3; chargeHit: boolean;
  };
  const zombies: Zombie[] = [];

  function play(z: Zombie, name: string, once = false) {
    const next = z.actions[name];
    if (!next || (z.current === name && !once)) return;
    z.actions[z.current]?.fadeOut(0.15);
    next.reset().setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity).fadeIn(0.15).play();
    next.clampWhenFinished = once;
    z.current = name;
    if (once) z.busy = next.getClip().duration / next.timeScale;
  }

  // spawning waits for the models if they're still loading
  function spawn(kind: ZombieKind, at: THREE.Vector3) {
    void ready.then(() => {
      const spec = KINDS[kind], proto = protos.get(spec.file)!;
      const root = SkeletonUtils.clone(proto.scene);
      root.scale.multiplyScalar(spec.scale);
      root.position.set(at.x, w.floorAt(at.x, at.z), at.z);
      const mixer = new THREE.AnimationMixer(root);
      const actions = Object.fromEntries(proto.clips.map((c) => [c.name, mixer.clipAction(c)]));
      const speed = spec.speed[0] + Math.random() * (spec.speed[1] - spec.speed[0]);
      const move = kind === "normal" && speed > 2 ? "Run" : "Walk";
      const z: Zombie = {
        kind, spec, root, height: proto.height * spec.scale, mixer, actions, current: "", busy: 0,
        hp: spec.hp, hits: 0, speed, move, attackCD: 0, struck: false, dying: -1, growlCD: 1 + Math.random() * 3, throwCD: 3,
        charge: "none", chargeT: 0, chargeCD: 0, chargeTo: new THREE.Vector3(), chargeHit: false,
      };
      // feet roughly match the ground
      actions[move].timeScale = (move === "Walk" ? speed / 1.3 : speed / 2.6) / spec.scale;
      play(z, move);
      mixer.update(Math.random());
      scene.add(root);
      zombies.push(z);
      if (kind === "boss") sfx.roar(root.position);
    });
  }

  // a zombie that copies you, for the mirror at the end
  // holding your weapon in its left hand: a mirror image of your right
  async function mirrorZombie() {
    await ready;
    const proto = protos.get("zombie_basic")!;
    const root = SkeletonUtils.clone(proto.scene);
    // the weapon mesh node itself (not its scene wrapper), placed with the grip the pack
    // uses for its armed characters (Characters_*_SingleWeapon: child of Middle1.L)
    const held = weapon && props[weapon]?.getObjectByName(weapon === "bat" ? "WoodenBat_Saw" : "Shotgun")?.clone();
    const hand = root.getObjectByName("Middle1L"); // GLTFLoader drops the dot from "Middle1.L"
    if (held && hand) {
      held.position.set(0.0116, 0.1046, -0.0458);
      held.quaternion.set(0.4333, 0.5569, 0.4398, 0.5556);
      held.traverse((o) => { o.castShadow = true; });
      hand.add(held);
    }
    const mixer = new THREE.AnimationMixer(root);
    const clip = (n: string) => mixer.clipAction(proto.clips.find((c) => c.name === n)!);
    const walk = clip("Walk"), idle = clip("Idle"), punch = clip("Punch");
    idle.play();
    let walking = false;
    return {
      root, mixer,
      setWalking(on: boolean) {
        if (on === walking) return;
        walking = on;
        (on ? idle : walk).fadeOut(0.2);
        (on ? walk : idle).reset().fadeIn(0.2).play();
      },
      // raises the weapon at you
      strike() { punch.reset().setLoop(THREE.LoopOnce, 1).play(); punch.clampWhenFinished = true; },
    };
  }

  /* ---------- skulls the boss throws ---------- */
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe3dccb, roughness: 0.7 });
  type Skull = { mesh: THREE.Mesh; vel: THREE.Vector3; spin: THREE.Vector3; life: number };
  const skulls: Skull[] = [];
  function throwSkull(z: Zombie, target: THREE.Vector3) {
    if (!skullGeo) return;
    const mesh = new THREE.Mesh(skullGeo, boneMat);
    mesh.castShadow = true;
    mesh.position.set(z.root.position.x, z.root.position.y + z.height * 0.8, z.root.position.z);
    const vel = new THREE.Vector3().subVectors(target, mesh.position).normalize().multiplyScalar(SKULL_SPEED);
    scene.add(mesh);
    skulls.push({ mesh, vel, spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0), life: 5 });
    sfx.skullThrow(mesh.position);
  }

  /* ---------- pickups ---------- */
  function addPickup(kind: PickupKind, at: THREE.Vector3) {
    const obj = kind === "shotgun" || kind === "bat" ? new THREE.Group() : makeBox(kind);
    obj.position.set(at.x, w.floorAt(at.x, at.z) + (kind === "shells" || kind === "health" ? 0.15 : 0.3), at.z);
    scene.add(obj);
    const p = { kind, obj, at: obj.position.clone() };
    pickups.push(p);
    if ((kind === "shotgun" || kind === "bat") && props[kind]) dressPickup(p);
  }
  function dressPickup(p: Pickup) {
    const m = props[p.kind as "shotgun" | "bat"]!.clone();
    if (p.kind === "shotgun") { m.scale.setScalar(0.9); m.rotation.set(0, 0, Math.PI / 2); m.position.z = -0.4; }
    else { m.scale.setScalar(0.8); m.rotation.set(0, 0, Math.PI / 2); m.position.x = 0.35; }
    p.obj.add(m);
  }

  /* ---------- hitting things ---------- */
  const ray = new THREE.Vector3(), origin = new THREE.Vector3(), tmp = new THREE.Vector3(), hitAt = new THREE.Vector3(), center = new THREE.Vector3();
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), flat = new THREE.Vector3(), target = new THREE.Vector3();
  const raySphere = (o: THREE.Vector3, d: THREE.Vector3, c: THREE.Vector3, r: number) => {
    tmp.subVectors(c, o);
    const t = tmp.dot(d), d2 = tmp.lengthSq() - t * t;
    return t > 0 && d2 < r * r ? t - Math.sqrt(r * r - d2) : Infinity;
  };
  const wallDistance = (o: THREE.Vector3, d: THREE.Vector3) => {
    for (let t = 0.1; t < RANGE; t += 0.08) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      if (w.solidAt(x, z) || y < w.floorAt(x, z) || y > 2.8) return t;
    }
    return RANGE;
  };
  // two spheres per zombie: body, and head
  const bodyHit = (z: Zombie, o: THREE.Vector3, d: THREE.Vector3) => { const p = z.root.position, s = z.height / ZOMBIE_HEIGHT; return raySphere(o, d, center.set(p.x, p.y + z.height * 0.55, p.z), 0.32 * s); };
  const headHit = (z: Zombie, o: THREE.Vector3, d: THREE.Vector3, grow = 1) => { const p = z.root.position, s = z.height / ZOMBIE_HEIGHT; return raySphere(o, d, center.set(p.x, p.y + z.height * 0.88, p.z), 0.17 * s * grow); };

  function damage(z: Zombie, head: boolean, amount: number) {
    z.hp -= amount; z.hits++;
    flat.subVectors(z.root.position, origin).setY(0).normalize();
    if (z.kind !== "boss") tryMove(z, flat.x * 0.3, flat.z * 0.3); // knockback
    if (z.hp <= 0) {
      z.dying = 0; play(z, "Death", true);
      sfx.die(z.root.position);
      burst(hitAt.copy(z.root.position).setY(z.root.position.y + z.height * 0.6), z.kind === "boss" ? 60 : 20, 0.4, 0.02, 0.02, 3);
      w.onKill({ kind: z.kind, hits: z.hits, head });
    } else {
      if (z.kind !== "boss" || Math.random() < 0.25) play(z, "HitReact", true);
      sfx.pain(z.root.position);
    }
  }

  function aim() {
    camera.getWorldPosition(origin);
    camera.getWorldDirection(fwd);
    right.crossVectors(fwd, camera.up).normalize();
    up.crossVectors(right, fwd);
  }

  function fire() {
    if (!weapon || cooldown > 0) return;
    if (weapon === "bat") { cooldown = 0.6; swingT = 0; swung = false; setTimeout(sfx.swing, 90); return; }
    if (ammo <= 0) { sfx.click(); cooldown = 0.3; return; }
    ammo--; cooldown = 0.85; recoil = 1; flashT = 0.06;
    sfx.shotgun(); setTimeout(sfx.pump, 280);
    w.onShot();
    aim();
    const hits = new Map<Zombie, boolean>(); // zombie -> any pellet in the head
    for (let k = 0; k < PELLETS; k++) {
      ray.copy(fwd).addScaledVector(right, (Math.random() - 0.5) * 2 * SPREAD).addScaledVector(up, (Math.random() - 0.5) * 2 * SPREAD).normalize();
      const wall = wallDistance(origin, ray);
      let best: Zombie | null = null, bestT = wall, head = false;
      for (const z of zombies) {
        if (z.dying >= 0) continue;
        const tb = bodyHit(z, origin, ray), th = headHit(z, origin, ray);
        if (tb < bestT) { best = z; bestT = tb; head = false; }
        if (th < bestT) { best = z; bestT = th; head = true; }
      }
      hitAt.copy(origin).addScaledVector(ray, bestT);
      if (best) { hits.set(best, (hits.get(best) ?? false) || head); burst(hitAt, 4, 0.45, 0.02, 0.02, 2.5); }
      else if (wall < RANGE) { burst(hitAt, 2, 0.5, 0.48, 0.44, 1.2); if (k === 0) sfx.impact(hitAt); }
    }
    for (const [z, head] of hits) damage(z, head, head ? DMG.shotgun.head : DMG.shotgun.body);
  }

  // the bat connects mid-swing: the closest zombie in front of you, head if you're aiming at it
  function batHit() {
    aim();
    flat.set(fwd.x, 0, fwd.z).normalize();
    let best: Zombie | null = null, bestD = Infinity;
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      tmp.subVectors(z.root.position, origin).setY(0);
      const d = tmp.length(), reach = BAT_RANGE + 0.3 * (z.height / ZOMBIE_HEIGHT);
      if (d > reach || tmp.normalize().dot(flat) < 0.55) continue;
      if (d < bestD) { best = z; bestD = d; }
    }
    if (!best) return;
    const head = headHit(best, origin, fwd, 1.5) < Infinity;
    hitAt.copy(best.root.position).setY(best.root.position.y + best.height * (head ? 0.88 : 0.55));
    // blood flies the way the bat went (to your left), plus a cloud, plus a few dark chunks
    spray(hitAt, -right.x, -right.z, head ? 46 : 30);
    burst(hitAt, head ? 20 : 12, 0.5, 0.02, 0.02, 3.5);
    burst(hitAt, 6, 0.18, 0.02, 0.02, 2);
    sfx.chop(hitAt);
    const killed = best.hp - (head ? DMG.bat.head : DMG.bat.body) <= 0;
    damage(best, head, head ? DMG.bat.head : DMG.bat.body);
    if (!killed && best.kind !== "boss") tryMove(best, -right.x * 0.4 + fwd.x * 0.3, -right.z * 0.4 + fwd.z * 0.3); // knocked sideways
    w.onImpact(head, killed);
  }

  function tryMove(z: Zombie, dx: number, dz: number) {
    const p = z.root.position, R = 0.3 * Math.min(2, z.height / ZOMBIE_HEIGHT);
    const ok = (x: number, y: number) => !w.solidAt(x - R, y - R) && !w.solidAt(x + R, y - R) && !w.solidAt(x - R, y + R) && !w.solidAt(x + R, y + R);
    if (ok(p.x + dx, p.z)) p.x += dx;
    if (ok(p.x, p.z + dz)) p.z += dz;
    p.y = w.floorAt(p.x, p.z);
  }

  // dev shortcut: hand over a weapon without the pickup
  function grant(kind: "shotgun" | "bat") {
    have[kind] = true;
    if (kind === "shotgun") ammo = Math.max(ammo, 30);
    weapon = kind;
  }

  function select(next: "shotgun" | "bat") { if (have[next] && weapon !== next) { weapon = next; cooldown = 0.25; swingT = -1; } }

  /* ---------- the bat swing: three poses, eased between ---------- */
  // [x, y, z, rotX, rotY, rotZ] of the bat in front of the camera
  const REST = [0.22, -0.28, -0.35, 0, 0, 0];
  const WINDUP = [0.36, -0.06, -0.28, 0.55, -0.35, -0.7]; // raised over the right shoulder
  const STRIKE = [-0.2, -0.4, -0.48, -1.35, 0.55, 1.0]; // swept through, down and left
  const SWING = { windup: 0.13, strike: 0.25, hit: 0.19, end: 0.58 }; // seconds
  const pose = REST.slice();
  const ease = { out: (t: number) => 1 - (1 - t) ** 3, in: (t: number) => t * t * t, inOut: (t: number) => t * t * (3 - 2 * t) };
  const mix = (a: number[], b: number[], t: number) => { for (let i = 0; i < 6; i++) pose[i] = a[i] + (b[i] - a[i]) * t; };
  function swingPose(t: number, _out: number[]) {
    if (t < 0) return mix(REST, REST, 0);
    if (t < SWING.windup) return mix(REST, WINDUP, ease.out(t / SWING.windup));
    if (t < SWING.strike) return mix(WINDUP, STRIKE, ease.in((t - SWING.windup) / (SWING.strike - SWING.windup)));
    return mix(STRIKE, REST, ease.inOut(Math.min(1, (t - SWING.strike) / (SWING.end - SWING.strike))));
  }
  // how far into the strike we are (0..1), for the camera to lean into it
  const swingLean = () => (swingT > SWING.windup && swingT < SWING.end ? Math.sin(Math.min(1, (swingT - SWING.windup) / (SWING.end - SWING.windup)) * Math.PI) : 0);

  /* ---------- the boss: skulls, and below 40 % a charge ---------- */
  const aimAt = new THREE.Vector3(), bossEye = new THREE.Vector3();
  // returns true while the charge owns the boss (wind-up or dash)
  function bossBrain(z: Zombie, dt: number, player: THREE.Vector3, d: number) {
    const p = z.root.position;
    bossEye.set(p.x, 1, p.z);
    z.chargeCD -= dt;
    if (z.charge === "windup") { // stands, roars, stares at the spot it's about to run to
      z.chargeT -= dt;
      z.root.lookAt(z.chargeTo.x, p.y, z.chargeTo.z);
      if (z.chargeT <= 0) {
        z.charge = "dash"; z.chargeHit = false;
        play(z, "Run"); z.actions.Run.timeScale = 2.2;
      }
      return true;
    }
    if (z.charge === "dash") {
      const tx = z.chargeTo.x - p.x, tz = z.chargeTo.z - p.z, tl = Math.hypot(tx, tz);
      const step = Math.min(tl, CHARGE_SPEED * dt);
      const bx = p.x, bz = p.z;
      if (tl > 0.01) tryMove(z, (tx / tl) * step, (tz / tl) * step);
      const blocked = Math.hypot(p.x - bx, p.z - bz) < step * 0.3; // ran into a pillar
      if (!z.chargeHit && d < 1.3) { z.chargeHit = true; sfx.hurt(); w.onHurt(CHARGE_DMG); }
      if (tl < 0.3 || blocked) {
        z.charge = "none"; z.chargeCD = CHARGE_EVERY;
        z.actions.Run.timeScale = 1;
        play(z, "HitReact", true); // stumbles: your window
        if (blocked) sfx.slam(p);
      }
      return true;
    }
    const sees = w.clearLine(bossEye, aimAt.set(player.x, 1, player.z));
    if (z.hp / z.spec.hp <= CHARGE_BELOW && z.chargeCD <= 0 && z.busy <= 0 && sees && d > 2.5) {
      z.charge = "windup"; z.chargeT = CHARGE_WINDUP;
      z.chargeTo.set(player.x, 0, player.z); // where you are now, not where you'll be
      play(z, "Idle"); sfx.roar(p);
      return true;
    }
    z.throwCD -= dt;
    if (z.throwCD <= 0 && d > 3 && z.busy <= 0 && sees) {
      z.throwCD = SKULL_EVERY[0] + Math.random() * (SKULL_EVERY[1] - SKULL_EVERY[0]);
      z.root.lookAt(player.x, p.y, player.z);
      play(z, "Punch", true); throwSkull(z, target);
    }
    return false;
  }

  /* ---------- per frame ---------- */
  function update(dt: number, player: THREE.Vector3, eyeY: number, moving: boolean, onPickup: (kind: PickupKind) => void) {
    cooldown = Math.max(0, cooldown - dt);

    // weapons in hand: Doom-style figure-eight bob, recoil, pump dip, bat swing
    gun.visible = weapon === "shotgun"; batView.visible = weapon === "bat";
    if (weapon) {
      camera.updateMatrixWorld();
      camera.matrixWorld.decompose(viewRoot.position, viewRoot.quaternion, tmp);
      viewLight.intensity = flashT > 0 ? 9 : 2.5;
      if (moving) bobPhase += dt * 9;
      const bx = Math.sin(bobPhase * 0.5) * 0.018, by = -Math.abs(Math.cos(bobPhase * 0.5)) * 0.014;
      recoil = Math.max(0, recoil - dt * 5);
      const pump = cooldown > 0.15 && cooldown < 0.55 ? Math.sin(((0.55 - cooldown) / 0.4) * Math.PI) : 0;
      gun.position.set(0.14 + bx, -0.16 + by + recoil * 0.02 - pump * 0.03, -0.3 + recoil * 0.09);
      gun.rotation.set(recoil * 0.25 - pump * 0.12, 0, pump * 0.2);
      flashT -= dt;
      flash.visible = flashT > 0;
      flash.material.rotation = Math.random() * 6;
      // swing: wind up over the right shoulder, whip down-left across the view, come back slowly
      if (swingT >= 0) {
        swingT += dt;
        if (!swung && swingT > SWING.hit) { swung = true; batHit(); }
        if (swingT > SWING.end) swingT = -1;
      }
      swingPose(swingT, pose);
      batView.position.set(pose[0] + bx, pose[1] + by, pose[2]);
      batView.rotation.set(pose[3], pose[4], pose[5]);
    }

    // pickups spin, you take them by walking over them
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.obj.rotation.y += dt * 1.6;
      p.obj.position.y = p.at.y + Math.sin(performance.now() / 300 + i) * 0.04;
      if (Math.hypot(player.x - p.at.x, player.z - p.at.z) < 0.9) {
        if (p.kind === "shotgun") { have.shotgun = true; ammo += 30; weapon = "shotgun"; }
        if (p.kind === "bat") { have.bat = true; weapon = "bat"; }
        if (p.kind === "shells") ammo += SHELLS_PER_BOX;
        scene.remove(p.obj); pickups.splice(i, 1);
        sfx.pickup(); onPickup(p.kind);
      }
    }

    // zombies: come straight at you, hit when close; the boss also throws skulls
    target.set(player.x, eyeY - 0.2, player.z);
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i], p = z.root.position;
      z.mixer.update(dt);
      z.busy -= dt;
      if (z.dying >= 0) { // the death animation plays, then it sinks away
        z.dying += dt;
        if (z.dying > 3) p.y -= dt * 0.4;
        if (z.dying > 5) { scene.remove(z.root); zombies.splice(i, 1); }
        continue;
      }
      const dx = player.x - p.x, dz = player.z - p.z, d = Math.hypot(dx, dz);
      z.growlCD -= dt;
      if (z.growlCD <= 0 && d < 14) { z.growlCD = 3 + Math.random() * 4; if (z.kind === "boss") sfx.roar(p); else sfx.growl(p); }
      if (z.kind === "boss" && bossBrain(z, dt, player, d)) continue; // charging: nothing else this frame
      const reach = Math.max(1, (z.height / ZOMBIE_HEIGHT) * 0.8);
      if (d > reach) {
        // round corners: head for the next point on the way to you
        w.steer(p, aimAt);
        z.root.lookAt(aimAt.x, p.y, aimAt.z);
        const sx = aimAt.x - p.x, sz = aimAt.z - p.z, sl = Math.hypot(sx, sz) || 1;
        if (z.busy <= 0) play(z, z.move);
        if (z.current === z.move) tryMove(z, (sx / sl) * z.speed * dt, (sz / sl) * z.speed * dt);
      } else {
        z.root.lookAt(player.x, p.y, player.z);
        z.attackCD -= dt;
        if (z.attackCD <= 0 && z.busy <= 0) { z.attackCD = 1.1; z.struck = false; play(z, z.spec.attack, true); }
        // the blow lands halfway through the swing, if you're still there
        if (!z.struck && z.current === z.spec.attack && z.busy < 0.5) { z.struck = true; sfx.hurt(); w.onHurt(z.spec.dmg); }
        if (z.busy <= 0 && z.current !== z.spec.attack) play(z, "Idle");
      }
    }

    // skulls fly, spin, break on walls or on you
    for (let i = skulls.length - 1; i >= 0; i--) {
      const s = skulls[i], m = s.mesh;
      m.position.addScaledVector(s.vel, dt);
      m.rotation.x += s.spin.x * dt; m.rotation.y += s.spin.y * dt;
      s.life -= dt;
      const hitYou = Math.hypot(m.position.x - player.x, m.position.z - player.z) < 0.5 && Math.abs(m.position.y - (eyeY - 0.3)) < 0.8;
      const hitWall = w.solidAt(m.position.x, m.position.z) || m.position.y < w.floorAt(m.position.x, m.position.z);
      if (hitYou || hitWall || s.life <= 0) {
        burst(m.position, 14, 0.85, 0.82, 0.74, 3);
        sfx.skullBreak(m.position);
        if (hitYou) { sfx.hurt(); w.onHurt(15); }
        scene.remove(m); skulls.splice(i, 1);
      }
    }

    // particles fall and fade
    for (let i = 0; i < P; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt;
      pVel[i * 3 + 1] -= 9.8 * dt;
      for (let a = 0; a < 3; a++) pPos[i * 3 + a] += pVel[i * 3 + a] * dt;
      const floor = w.floorAt(pPos[i * 3], pPos[i * 3 + 2]) + 0.01;
      if (pPos[i * 3 + 1] < floor) { pPos[i * 3 + 1] = floor; pVel[i * 3] = pVel[i * 3 + 1] = pVel[i * 3 + 2] = 0; }
      if (pLife[i] <= 0) pPos[i * 3 + 1] = -100;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }

  const boss = () => zombies.find((z) => z.kind === "boss");
  return {
    fire, spawn, addPickup, update, select, grant, mirrorZombie, burst, swingLean, viewScene, ready,
    get weapon() { return weapon; },
    get has() { return have; },
    get ammo() { return ammo; },
    alive: (kind?: ZombieKind) => zombies.filter((z) => z.dying < 0 && (!kind || z.kind === kind)).length,
    bossHealth: () => { const b = boss(); return b && b.dying < 0 ? Math.max(0, b.hp / b.spec.hp) : -1; },
  };
}
