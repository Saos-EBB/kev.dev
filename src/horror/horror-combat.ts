// Hinter dir — the Doom part: a shotgun you find halfway, zombies that come
// down the corridor at you, shells and health lying around.
// Zombies are built from primitives for now; makeZombie() is the one place
// to swap in real models later.
import * as THREE from "three";
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
const ZOMBIE_HP = 70;

/* ---------- zombie (placeholder look) ---------- */
const skin = new THREE.MeshStandardMaterial({ color: 0x5d6152, roughness: 0.9 });
const rags = new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 1 });
const limbGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.75, 6).translate(0, -0.37, 0); // pivot at the top
const torsoGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.75, 8);
const headGeo = new THREE.SphereGeometry(0.13, 12, 9);

function makeZombie(head?: () => THREE.Object3D) {
  const root = new THREE.Group(); // faces +z
  const torso = new THREE.Mesh(torsoGeo, rags);
  torso.position.y = 1.2;
  const h = head ? head() : new THREE.Mesh(headGeo, skin);
  h.position.y = 1.72;
  h.traverse((o) => { if (o instanceof THREE.Mesh) o.material = skin; });
  const limb = (x: number, y: number, mat: THREE.Material) => { const m = new THREE.Mesh(limbGeo, mat); m.position.set(x, y, 0); root.add(m); return m; };
  const armL = limb(-0.23, 1.5, skin), armR = limb(0.23, 1.5, skin);
  const legL = limb(-0.1, 0.8, rags), legR = limb(0.1, 0.8, rags);
  armL.rotation.x = armR.rotation.x = -1.35; // reaching for you
  root.add(torso, h);
  root.traverse((o) => { o.castShadow = true; });
  return { root, head: h, armL, armR, legL, legR };
}

/* ---------- shotgun view model ---------- */
function makeShotgun() {
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.5, roughness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.6 });
  const gun = new THREE.Group();
  for (const x of [-0.022, 0.022]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 10), metal);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(x, 0, -0.3);
    gun.add(barrel);
  }
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.2), wood);
  pump.position.set(0, -0.045, -0.25);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.2), metal);
  body.position.set(0, -0.01, 0.05);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.3), wood);
  stock.position.set(0, -0.06, 0.28); stock.rotation.x = 0.18;
  gun.add(pump, body, stock);
  // muzzle flash
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d")!, grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "#fff6d0"); grd.addColorStop(0.3, "#ffb030cc"); grd.addColorStop(1, "#ff600000");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.position.set(0, 0, -0.68); flash.scale.setScalar(0.35); flash.visible = false;
  gun.add(flash);
  return { gun, pump, flash };
}

/* ---------- pickups ---------- */
function makePickup(kind: PickupKind) {
  if (kind === "shotgun") { const s = makeShotgun().gun; s.scale.setScalar(1.3); s.rotation.set(0, 0.6, Math.PI / 2); return s; }
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
  let headMaker: (() => THREE.Object3D) | undefined;

  // the gun lives in its own little scene, drawn after the world with a cleared
  // depth buffer: it never pokes into walls and has its own light
  const viewScene = new THREE.Scene();
  const viewRoot = new THREE.Group();
  viewScene.add(viewRoot, new THREE.HemisphereLight(0xc8b49a, 0x2a2018, 2.2));
  const viewLight = new THREE.DirectionalLight(0xffd0a0, 2.5);
  viewLight.position.set(0.3, 1, 0.5);
  viewRoot.add(viewLight, viewLight.target);
  const view = makeShotgun();
  view.gun.position.set(0.13, -0.15, -0.5);
  view.gun.scale.setScalar(0.8);
  viewRoot.add(view.gun);

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
  type Zombie = ReturnType<typeof makeZombie> & { hp: number; speed: number; phase: number; attackCD: number; dying: number; growlCD: number; hitT: number };
  const zombies: Zombie[] = [];
  function spawn(at: THREE.Vector3) {
    const z: Zombie = { ...makeZombie(headMaker), hp: ZOMBIE_HP, speed: 1.4 + Math.random() * 0.9, phase: Math.random() * 6, attackCD: 0, dying: -1, growlCD: 1 + Math.random() * 3, hitT: 0 };
    z.root.position.copy(at).setY(0);
    scene.add(z.root);
    zombies.push(z);
  }

  /* ---------- pickups ---------- */
  type Pickup = { kind: PickupKind; obj: THREE.Object3D; at: THREE.Vector3 };
  const pickups: Pickup[] = [];
  function addPickup(kind: PickupKind, at: THREE.Vector3) {
    const obj = makePickup(kind);
    obj.position.copy(at).setY(kind === "shotgun" ? 0.25 : 0.15);
    scene.add(obj);
    pickups.push({ kind, obj, at: obj.position.clone() });
  }

  /* ---------- shooting ---------- */
  const ray = new THREE.Vector3(), origin = new THREE.Vector3(), tmp = new THREE.Vector3(), hitAt = new THREE.Vector3();
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
        const p = z.root.position;
        const tb = raySphere(origin, ray, tmp.set(p.x, 1.1, p.z).clone(), 0.32);
        const th = raySphere(origin, ray, tmp.set(p.x, 1.7, p.z).clone(), 0.17);
        if (tb < bestT) { best = z; bestT = tb; head = false; }
        if (th < bestT) { best = z; bestT = th; head = true; }
      }
      hitAt.copy(origin).addScaledVector(ray, bestT);
      if (best) { dmg.set(best, (dmg.get(best) ?? 0) + PELLET_DMG * (head ? 2 : 1)); burst(hitAt, 4, 0.45, 0.02, 0.02, 2.5); }
      else if (wall < RANGE) { burst(hitAt, 2, 0.5, 0.48, 0.44, 1.2); if (k === 0) sfx.impact(hitAt); }
    }
    for (const [z, d] of dmg) {
      z.hp -= d; z.hitT = 0.15;
      // knockback away from you
      tmp.subVectors(z.root.position, origin).setY(0).normalize();
      tryMove(z, tmp.x * 0.35 * Math.min(1, d / 40), tmp.z * 0.35 * Math.min(1, d / 40));
      if (z.hp <= 0) { z.dying = 0; sfx.die(z.root.position); burst(tmp.copy(z.root.position).setY(1.2), 20, 0.4, 0.02, 0.02, 3); if (Math.random() < 0.5) addPickup("shells", z.root.position); }
      else sfx.pain(z.root.position);
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

    // view model: Doom-style figure-eight bob, recoil kick, pump slide
    if (armed) {
      camera.updateMatrixWorld();
      camera.matrixWorld.decompose(viewRoot.position, viewRoot.quaternion, tmp);
      viewLight.intensity = flashT > 0 ? 9 : 2.5;
      if (moving) bobPhase += dt * 9;
      recoil = Math.max(0, recoil - dt * 5);
      view.gun.position.set(0.13 + Math.sin(bobPhase * 0.5) * 0.018, -0.15 - Math.abs(Math.cos(bobPhase * 0.5)) * 0.014 + recoil * 0.02, -0.5 + recoil * 0.09);
      view.gun.rotation.x = recoil * 0.25;
      const pumpK = cooldown > 0.15 && cooldown < 0.55 ? Math.sin(((0.55 - cooldown) / 0.4) * Math.PI) : 0;
      view.pump.position.z = -0.25 + pumpK * 0.09;
      flashT -= dt;
      view.flash.visible = flashT > 0;
      view.flash.material.rotation = Math.random() * 6;
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

    // zombies: shamble straight at you, swing when close
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i], p = z.root.position;
      if (z.dying >= 0) { // fall over backwards, sink, gone
        z.dying += dt;
        z.root.rotation.x = -Math.min(1, z.dying / 0.45) * Math.PI / 2;
        if (z.dying > 2.5) p.y -= dt * 0.4;
        if (z.dying > 4) { scene.remove(z.root); zombies.splice(i, 1); }
        continue;
      }
      tmp.set(player.x - p.x, 0, player.z - p.z);
      const d = tmp.length();
      z.root.lookAt(player.x, 0, player.z);
      z.phase += dt * z.speed * 4;
      z.legL.rotation.x = Math.sin(z.phase) * 0.5; z.legR.rotation.x = -Math.sin(z.phase) * 0.5;
      z.armL.rotation.x = -1.35 + Math.sin(z.phase * 0.5) * 0.15; z.armR.rotation.x = -1.35 - Math.sin(z.phase * 0.5) * 0.15;
      z.head.rotation.z = Math.sin(z.phase * 0.3) * 0.25;
      z.root.position.y = z.hitT > 0 ? 0.03 : 0;
      z.hitT -= dt;
      z.growlCD -= dt;
      if (z.growlCD <= 0 && d < 14) { z.growlCD = 3 + Math.random() * 4; sfx.growl(p); }
      if (d > 0.95) { tmp.multiplyScalar((z.speed * dt) / d); tryMove(z, tmp.x, tmp.z); }
      else {
        z.attackCD -= dt;
        if (z.attackCD <= 0) { z.attackCD = 0.9; z.armL.rotation.x = z.armR.rotation.x = -0.6; sfx.hurt(); w.onHurt(12); }
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
    setHead: (make: () => THREE.Object3D) => { headMaker = make; },
    get armed() { return armed; },
    get ammo() { return ammo; },
    get alive() { return zombies.filter((z) => z.dying < 0).length; },
  };
}
