// Hinter dir — the Doom part: a shotgun you find halfway, zombies that come
// down the corridor at you, shells and health lying around.
// Models: Quaternius "Zombie Apocalypse Kit" (CC0), see NOTICE.md.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import * as sfx from "./horror-audio";

export type CombatWorld = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  solidAt: (x: number, z: number) => boolean;
  onHurt: (damage: number) => void; // the game shows it and handles death
  onShot: () => void; // muzzle flash: the game brightens the lamp for a moment
};

type PickupKind = "shotgun" | "shells" | "health";
const PELLETS = 8, SPREAD = 0.07, PELLET_DMG = 14, RANGE = 30;
const ZOMBIE_HEIGHT = 1.8; // the basic zombie is scaled to this; the others keep their size relative to it
const GUN_SCALE = 0.55;

/* ---------- zombie types ---------- */
type ZombieType = { file: string; hp: number; speed: [number, number]; move: string; run?: string; attack: string };
const TYPES: ZombieType[] = [
  { file: "zombie_basic", hp: 70, speed: [1.2, 2.6], move: "Walk", run: "Run", attack: "Punch" },
  { file: "zombie_chubby", hp: 130, speed: [0.9, 1.2], move: "Walk", attack: "Punch" },
  { file: "zombie_ribcage", hp: 40, speed: [1.8, 2.4], move: "Run", attack: "Run" },
];
type Loaded = { type: ZombieType; proto: THREE.Object3D; clips: THREE.AnimationClip[]; height: number };

/* ---------- muzzle flash sprite ---------- */
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

/* ---------- pickups (boxes; the shotgun pickup uses the model) ---------- */
function makeBox(kind: "shells" | "health") {
  const g = new THREE.Group();
  const color = kind === "shells" ? 0xb52a1a : 0xe8e2d6;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.6 }));
  g.add(box);
  if (kind === "health") {
    const red = new THREE.MeshBasicMaterial({ color: 0xd8291f });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.17, 0.12), red), new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.17, 0.04), red));
  }
  return g;
}

export function createCombat(w: CombatWorld) {
  const { scene, camera } = w;
  let armed = false, ammo = 0, cooldown = 0, recoil = 0, flashT = 0, bobPhase = 0;

  type Pickup = { kind: PickupKind; obj: THREE.Object3D; at: THREE.Vector3 };
  const pickups: Pickup[] = [];

  /* ---------- assets: load once, in the background ---------- */
  let types: Loaded[] = [];
  let gunProto: THREE.Object3D | null = null;
  const loader = new GLTFLoader();
  const ready = (async () => {
    const [gun, ...zs] = await Promise.all([loader.loadAsync("/horror/shotgun.glb"), ...TYPES.map((t) => loader.loadAsync(`/horror/${t.file}.glb`))]);
    gunProto = gun.scene;
    // one scale for all zombies, taken from the basic one, so their sizes stay relative
    const box = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o, true);
    const k = ZOMBIE_HEIGHT / (box(zs[0].scene).max.y - box(zs[0].scene).min.y);
    types = zs.map((g, n) => {
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
      return { type: TYPES[n], proto: g.scene, clips: g.animations, height: b.max.y - b.min.y };
    });
    buildViewGun();
    for (const p of pickups) if (p.kind === "shotgun") swapShotgunPickup(p);
  })();

  /* ---------- the gun in your hands: own scene, drawn after the world with a
     cleared depth buffer, so it never pokes into walls and has its own light ---------- */
  const viewScene = new THREE.Scene();
  const viewRoot = new THREE.Group();
  viewScene.add(viewRoot, new THREE.HemisphereLight(0xc8b49a, 0x2a2018, 2.2));
  const viewLight = new THREE.DirectionalLight(0xffd0a0, 2.5);
  viewLight.position.set(0.3, 1, 0.5);
  viewRoot.add(viewLight, viewLight.target);
  const gun = new THREE.Group(); // muzzle points to -z
  const flash = makeFlash();
  gun.add(flash);
  viewRoot.add(gun);
  function buildViewGun() {
    const m = gunProto!.clone();
    m.rotation.y = Math.PI; // the model's barrel points to +z
    m.scale.setScalar(GUN_SCALE);
    gun.add(m);
    flash.position.set(0, 0.03, -0.97 * GUN_SCALE - 0.05);
  }

  /* ---------- blood + dust particles: one pool, one draw call ---------- */
  const P = 300;
  const pPos = new Float32Array(P * 3), pCol = new Float32Array(P * 3), pVel = new Float32Array(P * 3), pLife = new Float32Array(P);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true }));
  particles.frustumCulled = false;
  scene.add(particles);
  let pNext = 0;
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
    root: THREE.Object3D; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>; t: Loaded;
    current: string; busy: number; // seconds left of a one-shot animation (hit, attack)
    hp: number; speed: number; move: string; attackCD: number; dying: number; growlCD: number; struck: boolean;
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
  function spawn(at: THREE.Vector3) {
    void ready.then(() => {
      // mostly basic ones, now and then a fat one or a fast little one
      const r = Math.random(), t = types[r < 0.6 ? 0 : r < 0.8 ? 1 : 2];
      const root = SkeletonUtils.clone(t.proto);
      root.position.copy(at).setY(0);
      const mixer = new THREE.AnimationMixer(root);
      const actions = Object.fromEntries(t.clips.map((c) => [c.name, mixer.clipAction(c)]));
      const speed = t.type.speed[0] + Math.random() * (t.type.speed[1] - t.type.speed[0]);
      const move = t.type.run && speed > 2 ? t.type.run : t.type.move;
      const z: Zombie = { root, mixer, actions, t, current: "", busy: 0, hp: t.type.hp, speed, move, attackCD: 0, dying: -1, growlCD: 1 + Math.random() * 3, struck: false };
      actions[move].timeScale = move === "Walk" ? speed / 1.3 : speed / 2.6; // feet roughly match the ground
      play(z, move);
      mixer.update(Math.random()); // not all in step
      scene.add(root);
      zombies.push(z);
    });
  }

  /* ---------- pickups ---------- */
  function addPickup(kind: PickupKind, at: THREE.Vector3) {
    const obj = kind === "shotgun" ? new THREE.Group() : makeBox(kind);
    obj.position.copy(at).setY(kind === "shotgun" ? 0.3 : 0.15);
    scene.add(obj);
    const p = { kind, obj, at: obj.position.clone() };
    pickups.push(p);
    if (kind === "shotgun" && gunProto) swapShotgunPickup(p);
  }
  function swapShotgunPickup(p: Pickup) {
    const m = gunProto!.clone();
    m.scale.setScalar(0.9);
    m.rotation.set(0, 0, Math.PI / 2); // lying on its side
    m.position.z = -0.4; // centre the 1.1 m long gun on the spot
    p.obj.add(m);
  }

  /* ---------- shooting ---------- */
  const ray = new THREE.Vector3(), origin = new THREE.Vector3(), tmp = new THREE.Vector3(), hitAt = new THREE.Vector3(), center = new THREE.Vector3();
  const raySphere = (o: THREE.Vector3, d: THREE.Vector3, c: THREE.Vector3, r: number) => {
    tmp.subVectors(c, o);
    const t = tmp.dot(d), d2 = tmp.lengthSq() - t * t;
    return t > 0 && d2 < r * r ? t - Math.sqrt(r * r - d2) : Infinity;
  };
  const wallDistance = (o: THREE.Vector3, d: THREE.Vector3) => {
    for (let t = 0.1; t < RANGE; t += 0.08) if (w.solidAt(o.x + d.x * t, o.z + d.z * t) || o.y + d.y * t < 0 || o.y + d.y * t > 2.8) return t;
    return RANGE;
  };

  function fire() {
    if (!armed || cooldown > 0) return;
    if (ammo <= 0) { sfx.click(); cooldown = 0.3; return; }
    ammo--; cooldown = 0.85; recoil = 1; flashT = 0.06;
    sfx.shotgun(); setTimeout(sfx.pump, 280);
    w.onShot();
    camera.getWorldPosition(origin);
    const fwd = camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize(), up = new THREE.Vector3().crossVectors(right, fwd);
    const dmg = new Map<Zombie, number>();
    for (let k = 0; k < PELLETS; k++) {
      ray.copy(fwd).addScaledVector(right, (Math.random() - 0.5) * 2 * SPREAD).addScaledVector(up, (Math.random() - 0.5) * 2 * SPREAD).normalize();
      const wall = wallDistance(origin, ray);
      let best: Zombie | null = null, bestT = wall, head = false;
      for (const z of zombies) {
        if (z.dying >= 0) continue;
        const p = z.root.position, h = z.t.height;
        // two spheres per zombie: body, and head (counts double)
        const tb = raySphere(origin, ray, center.set(p.x, h * 0.55, p.z), 0.3 * (h / ZOMBIE_HEIGHT) + 0.05);
        const th = raySphere(origin, ray, center.set(p.x, h * 0.88, p.z), 0.16);
        if (tb < bestT) { best = z; bestT = tb; head = false; }
        if (th < bestT) { best = z; bestT = th; head = true; }
      }
      hitAt.copy(origin).addScaledVector(ray, bestT);
      if (best) { dmg.set(best, (dmg.get(best) ?? 0) + PELLET_DMG * (head ? 2 : 1)); burst(hitAt, 4, 0.45, 0.02, 0.02, 2.5); }
      else if (wall < RANGE) { burst(hitAt, 2, 0.5, 0.48, 0.44, 1.2); if (k === 0) sfx.impact(hitAt); }
    }
    for (const [z, d] of dmg) {
      z.hp -= d;
      // knockback away from you
      tmp.subVectors(z.root.position, origin).setY(0).normalize();
      tryMove(z, tmp.x * 0.35 * Math.min(1, d / 40), tmp.z * 0.35 * Math.min(1, d / 40));
      if (z.hp <= 0) {
        z.dying = 0; play(z, "Death", true);
        sfx.die(z.root.position);
        burst(tmp.copy(z.root.position).setY(z.t.height * 0.6), 20, 0.4, 0.02, 0.02, 3);
        if (Math.random() < 0.5) addPickup("shells", z.root.position);
      } else { play(z, "HitReact", true); sfx.pain(z.root.position); }
    }
  }

  function tryMove(z: Zombie, dx: number, dz: number) {
    const p = z.root.position, R = 0.3;
    const ok = (x: number, y: number) => !w.solidAt(x - R, y - R) && !w.solidAt(x + R, y - R) && !w.solidAt(x - R, y + R) && !w.solidAt(x + R, y + R);
    if (ok(p.x + dx, p.z)) p.x += dx;
    if (ok(p.x, p.z + dz)) p.z += dz;
  }

  /* ---------- per frame ---------- */
  function update(dt: number, player: THREE.Vector3, moving: boolean, onPickup: (kind: PickupKind) => void) {
    cooldown = Math.max(0, cooldown - dt);

    // view model: Doom-style figure-eight bob, recoil kick, a dip while pumping
    if (armed) {
      camera.updateMatrixWorld();
      camera.matrixWorld.decompose(viewRoot.position, viewRoot.quaternion, tmp);
      viewLight.intensity = flashT > 0 ? 9 : 2.5;
      if (moving) bobPhase += dt * 9;
      recoil = Math.max(0, recoil - dt * 5);
      const pump = cooldown > 0.15 && cooldown < 0.55 ? Math.sin(((0.55 - cooldown) / 0.4) * Math.PI) : 0;
      gun.position.set(0.14 + Math.sin(bobPhase * 0.5) * 0.018, -0.16 - Math.abs(Math.cos(bobPhase * 0.5)) * 0.014 + recoil * 0.02 - pump * 0.03, -0.3 + recoil * 0.09);
      gun.rotation.set(recoil * 0.25 - pump * 0.12, 0, pump * 0.2);
      flashT -= dt;
      flash.visible = flashT > 0;
      flash.material.rotation = Math.random() * 6;
    }

    // pickups spin, and you take them by walking over them
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.obj.rotation.y += dt * 1.6;
      p.obj.position.y = p.at.y + Math.sin(performance.now() / 300 + i) * 0.04;
      if (Math.hypot(player.x - p.at.x, player.z - p.at.z) < 0.9) {
        if (p.kind === "shotgun") { armed = true; ammo += 8; }
        if (p.kind === "shells") ammo += 6;
        scene.remove(p.obj); pickups.splice(i, 1);
        sfx.pickup(); onPickup(p.kind);
      }
    }

    // zombies: come straight at you, hit when close
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
      tmp.set(player.x - p.x, 0, player.z - p.z);
      const d = tmp.length();
      z.root.lookAt(player.x, 0, player.z);
      z.growlCD -= dt;
      if (z.growlCD <= 0 && d < 14) { z.growlCD = 3 + Math.random() * 4; sfx.growl(p); }
      if (d > 1.0) {
        if (z.busy <= 0) play(z, z.move);
        if (z.current === z.move) { tmp.multiplyScalar((z.speed * dt) / d); tryMove(z, tmp.x, tmp.z); }
      } else {
        z.attackCD -= dt;
        if (z.attackCD <= 0 && z.busy <= 0) { z.attackCD = 1.1; z.struck = false; play(z, z.t.type.attack, true); }
        // the blow lands halfway through the swing, if you're still there
        if (!z.struck && z.current === z.t.type.attack && z.busy < 0.5) { z.struck = true; sfx.hurt(); w.onHurt(12); }
        if (z.busy <= 0 && z.current !== z.t.type.attack) play(z, "Idle");
      }
    }

    // particles fall and fade
    for (let i = 0; i < P; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt;
      pVel[i * 3 + 1] -= 9.8 * dt;
      for (let a = 0; a < 3; a++) pPos[i * 3 + a] += pVel[i * 3 + a] * dt;
      if (pPos[i * 3 + 1] < 0.01) { pPos[i * 3 + 1] = 0.01; pVel[i * 3] = pVel[i * 3 + 1] = pVel[i * 3 + 2] = 0; }
      if (pLife[i] <= 0) pPos[i * 3 + 1] = -10;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }

  return {
    fire, spawn, addPickup, update, viewScene,
    get armed() { return armed; },
    get ammo() { return ammo; },
    get alive() { return zombies.filter((z) => z.dying < 0).length; },
  };
}
