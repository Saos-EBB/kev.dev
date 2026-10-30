// Hinter dir — the Doom part: shotgun, saw bat, katana, railgun, ice launcher
// and your own elemental skulls; three kinds of zombie (normal, big, the boss),
// burning / poisoned / frozen / shocked zombies, pickups, blood.
// Models: Quaternius "Zombie Apocalypse Kit" (CC0), see NOTICE.md.
// Skull projectiles: the craniumCut01 skull from the site's renderer models.
//
// Damage is per hit, not per pellet: a shotgun blast is one hit — head if
// any pellet found the head (100), else body (50). The saw bat: 500 / 150.
// The second armory (FPS Pack guns, the sabre with arms) is data in
// horror-arsenal.ts; those guns count damage per pellet.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import * as sfx from "./horror-audio";
import { loadSkullGeometry } from "../ct/parts";
import { FLAME, GUNS, GUN_IDS, MELEES, MELEE_IDS, ROCKET, SABER, gunView, meleeView, saberView, type ArsenalId, type GunId, type MeleeId, type ViewModel } from "./horror-arsenal";
import { MONSTERS, MONSTER_IDS, type Clip, type Fake, type MonsterId } from "./horror-bestiary";
import { applyLooseTextures } from "./horror-textures";

export type ZombieKind = "normal" | "big" | "boss" | MonsterId;
export type Weapon = "shotgun" | "bat" | "sword" | "rail" | "ice" | ArsenalId;
export type PickupKind = Weapon | "shells" | "health";
export const WEAPON_NAMES: Record<Weapon, string> = {
  shotgun: "Schrot", bat: "Säge", sword: "Katana", rail: "Railgun", ice: "Eiswerfer", saber: SABER.name,
  ...(Object.fromEntries(GUN_IDS.map((id) => [id, GUNS[id].name])) as Record<GunId, string>),
  ...(Object.fromEntries(MELEE_IDS.map((id) => [id, MELEES[id].name])) as Record<MeleeId, string>),
};
export const WEAPONS: Weapon[] = ["shotgun", "bat", "sword", "rail", "ice", "saber", ...GUN_IDS, ...MELEE_IDS];
const isPileMelee = (w: Weapon | null): w is MeleeId => !!w && w in MELEES;
const MELEE = (w: Weapon | null) => w === "bat" || w === "sword" || w === "saber" || isPileMelee(w);
const isArsenalGun = (w: Weapon | null): w is GunId => !!w && w in GUNS;
export type Kill = { kind: ZombieKind; hits: number; head: boolean; at: THREE.Vector3 };

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
  onImpact: (head: boolean, kill: boolean) => void;
  onHitmarker: (head: boolean) => void; // a shot that found flesh: the crosshair flashes
  onBossPhase: (phase: number) => void;
};

const PELLETS = 8, SPREAD = 0.12, RANGE = 30; // the shotgun scatters: up close it's sure, further out it's luck
const DMG = { shotgun: { head: 100, body: 50 }, bat: { head: 500, body: 150 }, sword: { head: 500, body: 200 }, rail: { head: 600, body: 300 } };
// ice launcher: lobbed like a grenade, bursts on impact, little damage, slows everyone around
const ICE = { speed: 13, every: 0.9, radius: 3.5, dmg: 60, slow: 0.45, slowFor: 4 };
const RAIL_EVERY = 0.5; // the beam goes through everything in a line
// magazines: empty one and you reload (R, or by itself). Shells come from what you find; rail and ice reload forever
type Gun = "shotgun" | "rail" | "ice" | GunId;
const fromGuns = (k: "mag" | "reload") => Object.fromEntries(GUN_IDS.map((id) => [id, GUNS[id][k]])) as Record<GunId, number>;
const MAG: Record<Gun, number> = { shotgun: 7, rail: 21, ice: 7, ...fromGuns("mag") };
const RELOAD: Record<Gun, number> = { shotgun: 1.6, rail: 1.8, ice: 1.5, ...fromGuns("reload") }; // seconds
const isGun = (x: Weapon | null): x is Gun => !!x && x in MAG;
// abilities: chain lightning (E, held) costs energy; frost nova (Q) has a cooldown
// a beam from you to what you aim at, then on from each zombie to the nearest next one, endlessly.
// Damage about like the ice launcher (60 per burst / 0.9 s); every zombie in the chain is stunned
// for 1.4 s, at most every 1.5 s. Mana: 210, costs 7 per second held, refills 5 per second.
const CHAIN = { range: 14, aim: 0.9, tick: 0.1, dps: 65, reach: 5, stunFor: 1.4, stunEvery: 1.5, max: 210, cost: 7, regen: 5, headBonus: 0.05 };
const NOVA = { radius: 6, dmg: 80, slowFor: 5, every: 10 };
const PINK = 0xff4fd8;
// elements your skulls carry (random per throw)
type Element = "fire" | "poison" | "ice" | "shock";
const ELEMENTS: Element[] = ["fire", "poison", "ice", "shock"];
const ELEMENT_COLOR: Record<Element, [number, number, number]> = { fire: [1, 0.45, 0.08], poison: [0.35, 0.9, 0.2], ice: [0.55, 0.85, 1], shock: [0.85, 0.8, 1] };
const BURN_DPS = 35, POISON_DPS = 22, DOT_FOR = 4, SHOCK_CHAIN = { dmg: 120, reach: 4.5, jumps: 3 };
const BAT_RANGE = 2.1, SWORD_RANGE = 2.7; // the sword hits everything in front of you, not just the closest
const OWN_SKULL = { speed: 16, every: 0.5, dmg: 150, head: 300 }; // yours: twice a second
const SHELLS_PER_BOX = 5;
// the boss, three phases by life left: 1 skulls · 2 faster + charges · 3 both
const SKULL_SPEED = 13, SKULL_EVERY: [number, number] = [1.4, 2.0];
const PHASE_AT = [2 / 3, 1 / 3], PHASE_SPEED = [0.6, 1.1, 1.2];
const CHARGE_EVERY = 4, CHARGE_WINDUP = 0.7, CHARGE_SPEED = 10, CHARGE_DMG = 35;
const ZOMBIE_HEIGHT = 1.8; // a normal zombie

type KindSpec = {
  file: string; scale: number; hp: number; speed: [number, number]; attack: string; dmg: number;
  clips?: Partial<Record<Clip, string>>; fake?: Fake; turn?: number; height?: number; // the bestiary's monsters
};
const KINDS: Record<ZombieKind, KindSpec> = {
  ...(Object.fromEntries(MONSTER_IDS.map((id) => { const m = MONSTERS[id]; return [id, { file: m.file, scale: 1, hp: m.hp, speed: m.speed, attack: "Punch", dmg: m.dmg, clips: m.clips, fake: m.fake, turn: m.turn, height: m.height }]; })) as Record<MonsterId, KindSpec>),
  normal: { file: "zombie_basic", scale: 1, hp: 100, speed: [1.3, 2.3], attack: "Punch", dmg: 12 },
  big: { file: "zombie_chubby", scale: 1.3, hp: 200, speed: [1.0, 1.3], attack: "Punch", dmg: 18 },
  boss: { file: "zombie_basic", scale: 2.2, hp: 4000, speed: [0.6, 0.6], attack: "Punch", dmg: 25 }, // the yellow one, big
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

// there's no sword in the kit: a katana from simple parts — a slim, slightly curved
// single-edged blade, a round tsuba, a long wrapped grip
function makeSword() {
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.95, roughness: 0.18 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 1, roughness: 0.08 });
  const black = new THREE.MeshStandardMaterial({ color: 0x15110f, roughness: 0.9 });
  const gold = new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.8, roughness: 0.4 });
  const g = new THREE.Group(); // grip at the origin, blade up +y
  // blade: a 2D profile (back straight-ish, edge curving to the point), extruded thin
  const L = 1.05, Wb = 0.034, sori = 0.045;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(sori * 0.6, L * 0.5, sori, L * 0.92); // back of the blade, bowed
  shape.lineTo(sori - 0.004, L); // kissaki
  shape.quadraticCurveTo(sori - Wb * 0.9, L * 0.9, sori - Wb, L * 0.8); // tip curve into the edge
  shape.quadraticCurveTo(-Wb + sori * 0.4, L * 0.45, -Wb, 0); // cutting edge
  shape.lineTo(0, 0);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 14 }), steel);
  blade.position.set(Wb / 2, 0.16, -0.003);
  const hamon = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.0075, bevelEnabled: false, curveSegments: 14 }), edge); // the bright edge line
  hamon.scale.set(0.35, 1, 1); hamon.position.set(-Wb * 0.55, 0.16, -0.0035);
  const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.016), gold); habaki.position.y = 0.15;
  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), black); tsuba.position.y = 0.13; tsuba.scale.z = 0.8;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.27, 8), black); grip.position.y = -0.01;
  g.add(blade, hamon, habaki, tsuba, grip);
  // the diamond wrap on the grip: small gold rhombi
  for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.044), gold); d.position.y = -0.12 + i * 0.045; d.rotation.y = Math.PI / 4; g.add(d); }
  const kashira = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.019, 0.02, 8), gold); kashira.position.y = -0.155;
  g.add(kashira);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

export function createCombat(w: CombatWorld) {
  const { scene, camera } = w;
  const have = Object.fromEntries(WEAPONS.map((k) => [k, false])) as Record<Weapon, boolean>;
  let weapon: Weapon | null = null;
  let ammo = 0, cooldown = 0, recoil = 0, flashT = 0, bobPhase = 0, swingT = -1, swung = false;
  let skullsUnlocked = false, skullCD = 0, clock = 0;
  const mag: Record<Gun, number> = { ...MAG, shotgun: 0 };
  let trigger = false; // held: the automatic guns keep firing
  let reloadT = 0; // counts down while the gun in hand reloads
  let chainUnlocked = false, chainWant = false, chainTick = 0, energy = CHAIN.max, chainEmpty = false;
  let novaUnlocked = false, novaCD = 0;

  type Pickup = { kind: PickupKind; obj: THREE.Object3D; at: THREE.Vector3; amount: number };
  const pickups: Pickup[] = [];

  /* ---------- assets: load once, in the background ---------- */
  const loader = new GLTFLoader();
  const protos = new Map<string, { scene: THREE.Object3D; clips: THREE.AnimationClip[]; height: number }>();
  const props = { ...Object.fromEntries(WEAPONS.map((k) => [k, null])), sword: makeSword() } as unknown as Record<Weapon, THREE.Object3D | null>;
  const arsenal = new Map<ArsenalId, ViewModel>(); // the second armory's view models, once loaded
  let skullGeo: THREE.BufferGeometry | null = null;
  const ready = (async () => {
    const files = ["zombie_basic", "zombie_chubby"];
    const [gun, bat, rifle, smg, ...zs] = await Promise.all([
      loader.loadAsync("/horror/shotgun.glb"), loader.loadAsync("/horror/bat_saw.glb"),
      loader.loadAsync("/horror/rifle.glb"), loader.loadAsync("/horror/smg.glb"),
      ...files.map((f) => loader.loadAsync(`/horror/${f}.glb`)),
    ]);
    props.shotgun = gun.scene; props.bat = bat.scene;
    // the railgun: the kit's rifle, pink and glowing; the ice launcher: its SMG, frosted
    rifle.scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.material = (o.material as THREE.MeshStandardMaterial).clone(); const m = o.material as THREE.MeshStandardMaterial; m.color.lerp(new THREE.Color(PINK), 0.55); m.emissive.set(0x5a0a48); } });
    smg.scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.material = (o.material as THREE.MeshStandardMaterial).clone(); const m = o.material as THREE.MeshStandardMaterial; m.color.lerp(new THREE.Color(0x9fd8ff), 0.6); m.emissive.set(0x123a55); } });
    props.rail = rifle.scene; props.ice = smg.scene;
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
    for (const p of pickups) if (WEAPONS.includes(p.kind as Weapon)) dressPickup(p);
  })();
  // the second armory loads on its own: a slow file doesn't hold up the zombies
  void (async () => {
    const [saber, map, ...guns] = await Promise.all([
      loader.loadAsync("/horror/weapons/saber_arms.glb"), new THREE.TextureLoader().loadAsync("/horror/weapons/saber.jpg"),
      ...GUN_IDS.map((id) => loader.loadAsync(`/horror/weapons/${GUNS[id].file}.glb`)),
    ]);
    const add = (id: ArsenalId, v: ViewModel) => {
      arsenal.set(id, v);
      v.root.visible = false;
      viewRoot.add(v.root);
      // the same model, posed still, for pickups and the mirror
      const still = SkeletonUtils.clone(v.root); still.visible = true;
      props[id] = still;
      if (id !== "saber") { const f = makeFlash(); f.position.copy(v.muzzle); v.root.add(f); flashes.set(id, f); }
    };
    add("saber", saberView(saber, map));
    await Promise.all(GUN_IDS.map((id, i) => applyLooseTextures(guns[i].scene, GUNS[id].file, "weapons")));
    GUN_IDS.forEach((id, i) => add(id, gunView(guns[i], GUNS[id])));
    const blades = await Promise.all(MELEE_IDS.map((id) => loader.loadAsync(`/horror/weapons/${MELEES[id].file}.glb`)));
    await Promise.all(MELEE_IDS.map((id, i) => applyLooseTextures(blades[i].scene, MELEES[id].file, "weapons")));
    MELEE_IDS.forEach((id, i) => {
      const v = meleeView(blades[i], MELEES[id]);
      const holder = new THREE.Group(); holder.add(v); holder.visible = false;
      viewRoot.add(holder); pileViews.set(id, holder);
      props[id] = v.clone();
    });
    arsenal.get("saber")!.loop("Idle");
    for (const p of pickups) if (p.kind in GUNS || p.kind === "saber") dressPickup(p);
  })();
  const flashes = new Map<ArsenalId, THREE.Sprite>();
  const pileViews = new Map<MeleeId, THREE.Group>();
  // hue for monsters whose texture is missing (cactus green, the rest flesh)
  const MONSTER_TINT: Partial<Record<MonsterId, number>> = { cactus: 0.3, piranha: 0.0, pinguin: 0.6 };
  // the bestiary: each scaled to its height, dimmed a little for the dark
  const monstersReady = (async () => {
    await ready;
    const gl = await Promise.all(MONSTER_IDS.map((id) => loader.loadAsync(`/horror/monsters/${MONSTERS[id].file}.glb`).catch(() => null)));
    // Fatty's skin texture runs through a node setup the exporter can't follow: put it on here
    const fattySkin = await new THREE.TextureLoader().loadAsync("/horror/monsters/fatty.jpg").catch(() => null);
    if (fattySkin) { fattySkin.colorSpace = THREE.SRGBColorSpace; fattySkin.flipY = false; }
    MONSTER_IDS.forEach((id, i) => {
      const g = gl[i];
      if (!g) return;
      g.scene.traverse((o) => {
        if (o instanceof THREE.Mesh && o.name.startsWith("WID")) o.visible = false; // rig widgets that came along
        if (o instanceof THREE.Mesh) {
          o.castShadow = true; o.frustumCulled = false;
          // some textures didn't survive the export: no map and next to black reads as a hole in the dark
          const mats = (Array.isArray(o.material) ? o.material : [o.material]) as THREE.MeshStandardMaterial[];
          o.material = mats.map((m0) => {
            const m = m0.clone();
            if (id === "fatty" && m.name === "skin" && fattySkin) { m.map = fattySkin; m.color.set(0xffffff); }
            if (!m.map && m.color.getHSL({ h: 0, s: 0, l: 0 }).l < 0.2) m.color.setHSL(MONSTER_TINT[id] ?? 0.08, 0.25, 0.42);
            m.metalness = Math.min(m.metalness, 0.2); m.roughness = Math.max(m.roughness, 0.6);
            return m;
          });
          if (o.material.length === 1) o.material = o.material[0];
        }
      });
      void applyLooseTextures(g.scene, MONSTERS[id].file, "monsters");
      const b = new THREE.Box3().setFromObject(g.scene, true);
      g.scene.scale.multiplyScalar(MONSTERS[id].height / Math.max(1e-6, b.max.y - b.min.y));
      const b2 = new THREE.Box3().setFromObject(g.scene, true);
      g.scene.position.y -= b2.min.y; // feet on the floor
      const holder = new THREE.Group(); holder.add(g.scene);
      protos.set(MONSTERS[id].file, { scene: holder, clips: g.animations, height: MONSTERS[id].height });
    });
  })();

  /* ---------- weapons in your hands: own scene, drawn after the world with a
     cleared depth buffer, so they never poke into walls and have their own light ---------- */
  const viewScene = new THREE.Scene();
  const viewRoot = new THREE.Group();
  viewScene.add(viewRoot, new THREE.HemisphereLight(0xc8b49a, 0x2a2018, 2.2));
  const viewLight = new THREE.DirectionalLight(0xffd0a0, 2.5);
  viewLight.position.set(0.3, 1, 0.5);
  viewRoot.add(viewLight, viewLight.target);
  const gun = new THREE.Group(), batView = new THREE.Group(), swordView = new THREE.Group(), railView = new THREE.Group(), iceView = new THREE.Group(); // guns point to -z
  const flash = makeFlash(), railFlash = makeFlash();
  gun.add(flash); railView.add(railFlash);
  railFlash.material = railFlash.material.clone(); railFlash.material.color.set(PINK);
  viewRoot.add(gun, batView, swordView, railView, iceView);
  function buildViewModels() {
    const rm = props.rail!.clone();
    rm.rotation.y = Math.PI; rm.scale.setScalar(0.4);
    rm.position.z = -0.2; // its stock is long: push it forward so it doesn't fill the screen
    railView.add(rm);
    railFlash.position.set(0, 0.03, -1.02 * 0.4 - 0.25);
    const im = props.ice!.clone();
    im.rotation.y = Math.PI; im.scale.setScalar(0.4);
    im.position.z = -0.12;
    iceView.add(im);
    const sw = props.sword!.clone();
    sw.rotation.set(-0.5, 0, -0.35);
    swordView.add(sw);
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
    slowUntil: number; burnUntil: number; poisonUntil: number; fxT: number; // status effects (combat clock)
    stunUntil: number; stunNext: number;
    fakeT: number; phase: number; // the bestiary: time in the current faked move, a step rhythm of its own
  };
  const zombies: Zombie[] = [];

  const real = (z: Zombie, name: string) => z.spec.clips ? z.spec.clips[name as Clip] ?? "" : name;
  function play(z: Zombie, name: string, once = false) {
    const next = z.actions[real(z, name)];
    if (z.current === name && !once) return;
    if (!next && !z.spec.clips) return; // the old zombies: every clip is there
    z.actions[real(z, z.current)]?.fadeOut(0.15);
    z.current = name;
    // a monster without this clip: the code fakes it (lunge, flinch, tipping over), it still takes time
    if (!next) { if (once) z.busy = name === "Death" ? 0.6 : 0.55; z.fakeT = 0; return; }
    next.reset().setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity).fadeIn(0.15).play();
    next.clampWhenFinished = once;
    if (once) z.busy = next.getClip().duration / next.timeScale;
  }

  // spawning waits for the models if they're still loading
  function spawn(kind: ZombieKind, at: THREE.Vector3) {
    void (kind in MONSTERS ? monstersReady : ready).then(() => {
      const spec = KINDS[kind], proto = protos.get(spec.file);
      if (!proto) return; // a monster file that didn't load
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
        slowUntil: 0, burnUntil: 0, poisonUntil: 0, fxT: 0, stunUntil: 0, stunNext: 0, fakeT: 0, phase: Math.random() * 6,
      };
      // the boss is the yellow one, and it stays bright yellow (the others are dimmed for the dark)
      if (kind === "boss") root.traverse((o) => { if (o instanceof THREE.SkinnedMesh) { const m = (o.material as THREE.MeshStandardMaterial).clone(); m.color.multiplyScalar(1 / 0.55); m.emissive.set(0x2a2000); o.material = m; } });
      // feet roughly match the ground
      const walk = actions[real(z, move)];
      if (walk && !spec.clips) walk.timeScale = (move === "Walk" ? speed / 1.3 : speed / 2.6) / spec.scale;
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
    const node: Partial<Record<Weapon, string>> = { shotgun: "Shotgun", bat: "WoodenBat_Saw", rail: "Rifle", ice: "SMG" };
    const held = weapon && (weapon === "sword" ? props.sword!.clone() : node[weapon] ? props[weapon]?.getObjectByName(node[weapon]!)?.clone() : undefined);
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
  function addPickup(kind: PickupKind, at: THREE.Vector3, amount = SHELLS_PER_BOX) {
    const isWeapon = WEAPONS.includes(kind as Weapon);
    const obj = isWeapon ? new THREE.Group() : makeBox(kind as "shells" | "health");
    if (kind === "shells") obj.scale.setScalar(0.6 + amount * 0.08); // the more inside, the bigger the box
    obj.position.set(at.x, w.floorAt(at.x, at.z) + (isWeapon ? 0.3 : 0.15), at.z);
    scene.add(obj);
    const p = { kind, obj, at: obj.position.clone(), amount };
    pickups.push(p);
    if (isWeapon && props[kind as Weapon]) dressPickup(p);
  }
  function dressPickup(p: Pickup) {
    const m = SkeletonUtils.clone(props[p.kind as Weapon]!);
    if (p.kind === "shotgun" || p.kind === "rail" || p.kind === "ice" || p.kind in GUNS) { m.scale.setScalar(0.9); m.rotation.set(0, 0, Math.PI / 2); m.position.z = -0.4; }
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
  // march the ray until it's inside a wall, under the floor or above the ceiling;
  // the normal says which face it came through (for the marks left behind)
  const normal = new THREE.Vector3();
  const wallDistance = (o: THREE.Vector3, d: THREE.Vector3, maxT = RANGE) => {
    for (let t = 0.1; t < maxT; t += 0.08) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const pz = z - d.z * 0.08; // where the ray was one step ago, in z
      if (w.solidAt(x, z)) {
        // stepping only in x would already be inside: it came through an x-facing wall
        if (w.solidAt(x, pz)) normal.set(-Math.sign(d.x), 0, 0); else normal.set(0, 0, -Math.sign(d.z));
        return t;
      }
      if (y < w.floorAt(x, z)) { normal.set(0, 1, 0); return t; }
      if (y > 2.8) { normal.set(0, -1, 0); return t; }
    }
    return Infinity;
  };

  /* ---------- marks: bullet holes and blood that stay (two instanced pools, ring buffers) ---------- */
  function markTexture(kind: "hole" | "blood") {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    if (kind === "hole") {
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 60);
      grd.addColorStop(0, "rgba(0,0,0,1)"); grd.addColorStop(0.25, "rgba(10,8,6,0.95)"); grd.addColorStop(0.5, "rgba(40,34,28,0.6)"); grd.addColorStop(1, "rgba(40,34,28,0)");
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(0,0,0,0.7)"; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = Math.random() * 7; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * (30 + Math.random() * 28), 64 + Math.sin(a) * (30 + Math.random() * 28)); g.stroke(); }
    } else {
      g.fillStyle = "rgba(90,4,4,0.95)";
      for (let i = 0; i < 9; i++) { const x = 34 + Math.random() * 60, y = 34 + Math.random() * 60; g.beginPath(); g.arc(x, y, 6 + Math.random() * 18, 0, 7); g.fill(); }
      for (let i = 0; i < 40; i++) { const a = Math.random() * 7, d = 30 + Math.random() * 30; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 1 + Math.random() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 4; i++) g.fillRect(40 + Math.random() * 48, 64, 3, 20 + Math.random() * 40); // drips (only read right on walls)
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function makeMarks(kind: "hole" | "blood", max: number) {
    const map = markTexture(kind);
    const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.25, roughness: kind === "blood" ? 0.35 : 1, polygonOffset: true, polygonOffsetFactor: -4 });
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, max);
    mesh.count = 0; mesh.frustumCulled = false; mesh.receiveShadow = true;
    scene.add(mesh);
    let next = 0;
    const q = new THREE.Quaternion(), roll = new THREE.Quaternion(), m = new THREE.Matrix4(), s = new THREE.Vector3(), z = new THREE.Vector3(0, 0, 1), p = new THREE.Vector3();
    return (at: THREE.Vector3, n: THREE.Vector3, size: number) => {
      q.setFromUnitVectors(z, n).multiply(roll.setFromAxisAngle(z, Math.random() * Math.PI * 2));
      m.compose(p.copy(at).addScaledVector(n, 0.012), q, s.setScalar(size));
      mesh.setMatrixAt(next, m);
      next = (next + 1) % max;
      mesh.count = Math.min(max, mesh.count + 1);
      mesh.instanceMatrix.needsUpdate = true;
    };
  }
  const hole = makeMarks("hole", 300), blood = makeMarks("blood", 220);
  const markAt = new THREE.Vector3(), up1 = new THREE.Vector3(0, 1, 0);
  // blood on whatever is behind a zombie (exit wound) or under it
  function bloodBehind(from: THREE.Vector3, dir: THREE.Vector3, reach: number, size: number) {
    const t = wallDistance(from, dir, reach);
    if (t < reach) blood(markAt.copy(from).addScaledVector(dir, t), normal.clone(), size * (0.8 + Math.random() * 0.5));
  }
  function bloodPool(at: THREE.Vector3, size: number) {
    markAt.set(at.x + (Math.random() - 0.5) * 0.4, w.floorAt(at.x, at.z), at.z + (Math.random() - 0.5) * 0.4);
    blood(markAt, up1, size);
  }
  // two spheres per zombie: body, and head
  const lift = (z: Zombie) => (z.spec.fake === "fly" ? 1.1 : 0); // the piranha swims in the air
  const bodyHit = (z: Zombie, o: THREE.Vector3, d: THREE.Vector3) => { const p = z.root.position, s = z.height / ZOMBIE_HEIGHT; return raySphere(o, d, center.set(p.x, p.y + lift(z) + z.height * 0.55, p.z), Math.max(0.18, 0.32 * s)); };
  const headHit = (z: Zombie, o: THREE.Vector3, d: THREE.Vector3, grow = 1) => { const p = z.root.position, s = z.height / ZOMBIE_HEIGHT; return raySphere(o, d, center.set(p.x, p.y + lift(z) + z.height * 0.88, p.z), Math.max(0.1, 0.17 * s * grow)); };

  function damage(z: Zombie, head: boolean, amount: number, quiet = false) {
    z.hp -= amount; z.hits++;
    if (head) energy = Math.min(CHAIN.max, energy + CHAIN.max * CHAIN.headBonus); // headshots feed the lightning: 5 %
    flat.subVectors(z.root.position, origin).setY(0).normalize();
    if (z.kind !== "boss" && !quiet) tryMove(z, flat.x * 0.3, flat.z * 0.3); // knockback
    if (z.hp <= 0) {
      z.dying = 0; play(z, "Death", true);
      sfx.die(z.root.position);
      burst(hitAt.copy(z.root.position).setY(z.root.position.y + z.height * 0.6), z.kind === "boss" ? 60 : 20, 0.4, 0.02, 0.02, 3);
      bloodPool(z.root.position, z.kind === "boss" ? 2.4 : 1 + Math.random() * 0.5);
      w.onKill({ kind: z.kind, hits: z.hits, head, at: z.root.position.clone() });
    } else if (!quiet) {
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
    if (weapon === "saber") {
      cooldown = SABER.every; swingT = 0; swung = false; slashes++;
      arsenal.get("saber")?.play(slashes % 3 === 0 ? "Pierce" : "Slash", SABER.every);
      setTimeout(sfx.swing, 120);
      return;
    }
    if (isPileMelee(weapon)) {
      const m = MELEES[weapon];
      cooldown = m.every;
      if (m.saw) { sawT = 0.2; swordHit(m.dmg, m.range); sfx.chop(origin); return; } // revving: every tick is a hit
      swingT = 0; swung = false; setTimeout(sfx.swing, 90);
      return;
    }
    if (MELEE(weapon)) { cooldown = weapon === "sword" ? 0.7 : 0.6; swingT = 0; swung = false; setTimeout(sfx.swing, 90); return; }
    if (!isGun(weapon) || reloadT > 0) return;
    if (mag[weapon] <= 0) { if (!reload()) { sfx.click(); cooldown = 0.3; } return; }
    mag[weapon]--;
    if (weapon === "rail") return fireRail();
    if (weapon === "ice") return fireIce();
    if (isArsenalGun(weapon)) return fireGun(weapon);
    cooldown = 0.85; recoil = 1; flashT = 0.06;
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
      if (best) {
        hits.set(best, (hits.get(best) ?? false) || head);
        burst(hitAt, 6, 0.45, 0.02, 0.02, 2.8);
        if (k % 2 === 0) bloodBehind(hitAt, ray, 2.6, 0.45); // what goes in comes out the back
      } else if (wall < RANGE) {
        burst(hitAt, 3, 0.5, 0.48, 0.44, 1.4);
        hole(hitAt, normal, 0.07 + Math.random() * 0.04);
        if (k === 0) sfx.impact(hitAt);
      }
    }
    // the empty shell flies out to the right
    burst(tmp.copy(origin).addScaledVector(right, 0.25).addScaledVector(up, -0.15).addScaledVector(fwd, 0.4), 1, 0.7, 0.08, 0.05, 1.5);
    for (const [z, head] of hits) damage(z, head, head ? DMG.shotgun.head : DMG.shotgun.body);
    if (hits.size) w.onHitmarker([...hits.values()].some((h) => h));
  }

  /* ---------- the second armory's guns: pellets, spread, pierce from GUNS ---------- */
  let slashes = 0; // every third sabre attack is a thrust
  let sawT = 0; // the chainsaw shakes harder for a moment after each bite
  function fireGun(id: GunId) {
    const g = GUNS[id];
    if (g.special === "rocket") return fireRocket(g.every);
    if (g.special === "flame") return fireFlame(g.every);
    cooldown = g.every; recoil = Math.min(1.4, g.kick); flashT = 0.05;
    sfx.gunshot(g.sound);
    arsenal.get(id)?.play(g.fire, Math.min(g.every, 0.4));
    w.onShot();
    aim();
    const dmg = new Map<Zombie, { d: number; head: boolean }>();
    for (let k = 0; k < g.pellets; k++) {
      ray.copy(fwd).addScaledVector(right, (Math.random() - 0.5) * 2 * g.spread).addScaledVector(up, (Math.random() - 0.5) * 2 * g.spread).normalize();
      const wall = wallDistance(origin, ray);
      // everything in line up to the wall, nearest first; the bullet stops after `pierce`
      const inLine: [number, Zombie, boolean][] = [];
      for (const z of zombies) {
        if (z.dying >= 0) continue;
        const tb = bodyHit(z, origin, ray), th = headHit(z, origin, ray);
        const t = Math.min(tb, th);
        if (t < wall) inLine.push([t, z, th <= tb]);
      }
      inLine.sort((a, b) => a[0] - b[0]);
      for (const [t, z, head] of inLine.slice(0, g.pierce)) {
        const cur = dmg.get(z) ?? { d: 0, head: false };
        cur.d += head ? g.dmg.head : g.dmg.body; cur.head ||= head;
        dmg.set(z, cur);
        hitAt.copy(origin).addScaledVector(ray, t);
        burst(hitAt, 4, 0.45, 0.02, 0.02, 2.6);
        if (k % 3 === 0) bloodBehind(hitAt, ray, 2.4, 0.4);
      }
      if (inLine.length < g.pierce && wall < RANGE) {
        hitAt.copy(origin).addScaledVector(ray, wall);
        burst(hitAt, 2, 0.5, 0.48, 0.44, 1.3);
        hole(hitAt, normal, 0.05 + Math.random() * 0.03);
        if (k === 0) sfx.impact(hitAt);
      }
    }
    for (const [z, { d, head }] of dmg) damage(z, head, d);
    if (dmg.size) w.onHitmarker([...dmg.values()].some((v) => v.head));
  }

  /* ---------- RPG: a rocket that flies straight and bursts ---------- */
  type Rocket = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number };
  const rockets: Rocket[] = [];
  const rocketGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8).rotateX(Math.PI / 2);
  const rocketMat = new THREE.MeshStandardMaterial({ color: 0x3d4a2a, emissive: 0x331100, roughness: 0.6 });
  function fireRocket(every: number) {
    cooldown = every; recoil = 1.4; flashT = 0.08;
    sfx.gunshot(0.9); sfx.thunk();
    w.onShot();
    aim();
    const mesh = new THREE.Mesh(rocketGeo, rocketMat);
    mesh.position.copy(origin).addScaledVector(fwd, 0.7).addScaledVector(right, 0.14).addScaledVector(up, -0.06);
    mesh.lookAt(tmp.copy(mesh.position).add(fwd));
    scene.add(mesh);
    rockets.push({ mesh, vel: fwd.clone().multiplyScalar(ROCKET.speed), life: 3 });
  }
  function explode(at: THREE.Vector3) {
    sfx.shotgun(); sfx.slam(at);
    burst(at, 60, 1, 0.5, 0.1, 7); burst(at, 30, 0.3, 0.28, 0.25, 4);
    let any = false;
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      const d = Math.hypot(z.root.position.x - at.x, z.root.position.z - at.z);
      if (d > ROCKET.radius) continue;
      origin.copy(at);
      z.burnUntil = clock + DOT_FOR;
      damage(z, false, ROCKET.dmg * (1 - (d / ROCKET.radius) * 0.6));
      any = true;
    }
    if (any) w.onHitmarker(false);
    w.onImpact(false, any);
  }

  /* ---------- flamethrower: everything in the cone in front of you burns ---------- */
  function fireFlame(every: number) {
    cooldown = every; recoil = 0.05; flashT = 0.04;
    if (Math.random() < 0.3) sfx.zap();
    aim();
    flat.set(fwd.x, 0, fwd.z).normalize();
    // the flame itself: particles thrown along the cone
    for (let k = 0; k < 4; k++) {
      const t = 0.6 + Math.random() * FLAME.range * 0.8;
      tmp.copy(origin).addScaledVector(fwd, t).addScaledVector(right, (Math.random() - 0.5) * t * 0.3).addScaledVector(up, (Math.random() - 0.5) * t * 0.2 - 0.15);
      if (!w.solidAt(tmp.x, tmp.z)) burst(tmp, 1, 1, 0.35 + Math.random() * 0.3, 0.05, 1.2);
    }
    let any = false;
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      tmp.subVectors(z.root.position, origin).setY(0);
      const d = tmp.length();
      if (d > FLAME.range || tmp.normalize().dot(flat) < FLAME.cone) continue;
      z.burnUntil = clock + DOT_FOR;
      damage(z, false, FLAME.dmg, true);
      any = true;
    }
    if (any && Math.random() < 0.2) w.onHitmarker(false);
  }

  /* ---------- railgun: one beam, through everything in line ---------- */
  const beamMat = new THREE.MeshBasicMaterial({ color: PINK, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  type Fx = { obj: THREE.Object3D; life: number; max: number; mat: THREE.Material & { opacity: number }; grow?: [number, number] };
  const fxs: Fx[] = []; // short-lived visuals: beams, lightning, frost rings
  function addFx(obj: THREE.Object3D, mat: THREE.Material & { opacity: number }, life: number, grow?: [number, number]) { scene.add(obj); fxs.push({ obj, life, max: life, mat, grow }); }
  function fireRail() {
    cooldown = RAIL_EVERY; recoil = 1.2; flashT = 0.08;
    sfx.rail();
    w.onShot();
    aim();
    const wall = wallDistance(origin, fwd);
    const end = Math.min(wall, RANGE);
    // every zombie the line passes through, nearest first
    const hit: [Zombie, boolean][] = [];
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      const th = headHit(z, origin, fwd, 1.2), tb = bodyHit(z, origin, fwd);
      if (Math.min(th, tb) < end) hit.push([z, th <= tb]);
    }
    for (const [z, head] of hit) {
      hitAt.copy(z.root.position).setY(z.root.position.y + z.height * (head ? 0.88 : 0.55));
      spray(hitAt, fwd.x, fwd.z, 26);
      damage(z, head, head ? DMG.rail.head : DMG.rail.body);
    }
    if (hit.length) w.onHitmarker(hit.some(([, h]) => h));
    // the beam: a thin glowing cylinder from the muzzle to wherever it stopped
    const from = tmp.copy(origin).addScaledVector(right, 0.12).addScaledVector(up, -0.1);
    const to = origin.clone().addScaledVector(fwd, end);
    const len = from.distanceTo(to);
    const mat = beamMat.clone();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 6, 1, true), mat);
    beam.position.copy(from).add(to).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(up1, tmp.subVectors(to, from).normalize());
    addFx(beam, mat, 0.3);
    if (wall < RANGE) { hole(to, normal, 0.18); burst(to, 14, 0.5, 0.95, 1, 3); }
  }

  /* ---------- ice launcher: a lobbed shard ball that bursts and slows ---------- */
  type IceBall = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number };
  const iceBalls: IceBall[] = [];
  const iceMat = new THREE.MeshStandardMaterial({ color: 0xbfe9ff, emissive: 0x3aa0ff, emissiveIntensity: 0.8, roughness: 0.2 });
  const iceGeo = new THREE.IcosahedronGeometry(0.11, 0);
  function fireIce() {
    cooldown = ICE.every; recoil = 0.8;
    sfx.thunk();
    aim();
    const mesh = new THREE.Mesh(iceGeo, iceMat);
    mesh.position.copy(origin).addScaledVector(fwd, 0.6).addScaledVector(right, 0.12).addScaledVector(up, -0.08);
    scene.add(mesh);
    iceBalls.push({ mesh, vel: fwd.clone().multiplyScalar(ICE.speed).addScaledVector(up1, 2.5), life: 4 });
  }
  function iceBurst(at: THREE.Vector3) {
    sfx.shatter(at);
    burst(at, 40, 0.6, 0.85, 1, 5);
    let any = false;
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      const d = Math.hypot(z.root.position.x - at.x, z.root.position.z - at.z);
      if (d > ICE.radius) continue;
      z.slowUntil = clock + ICE.slowFor;
      origin.copy(at);
      damage(z, false, ICE.dmg * (1 - (d / ICE.radius) * 0.5));
      any = true;
    }
    if (any) w.onHitmarker(false);
    // a frost ring on the floor, fading
    const mat = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(new THREE.RingGeometry(ICE.radius * 0.85, ICE.radius, 32).rotateX(-Math.PI / 2), mat);
    ring.position.set(at.x, w.floorAt(at.x, at.z) + 0.03, at.z);
    addFx(ring, mat, 0.8);
  }

  /* ---------- lightning: jagged lines between zombies ---------- */
  function bolt(a: THREE.Vector3, b: THREE.Vector3) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const p = a.clone().lerp(b, i / 8);
      if (i && i < 8) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.35));
      pts.push(p);
    }
    const mat = new THREE.LineBasicMaterial({ color: 0xe0d8ff, transparent: true, blending: THREE.AdditiveBlending });
    addFx(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat), mat, 0.18);
  }
  function chainShock(first: Zombie, dmg = SHOCK_CHAIN.dmg * 0.7, quiet = false) {
    const done = new Set([first]);
    let cur = first;
    for (let j = 0; j < SHOCK_CHAIN.jumps; j++) {
      let next: Zombie | null = null, nd = SHOCK_CHAIN.reach;
      for (const z of zombies) {
        if (z.dying >= 0 || done.has(z)) continue;
        const d = z.root.position.distanceTo(cur.root.position);
        if (d < nd) { next = z; nd = d; }
      }
      if (!next) break;
      const a = cur.root.position.clone().setY(cur.root.position.y + cur.height * 0.6), b = next.root.position.clone().setY(next.root.position.y + next.height * 0.6);
      bolt(a, b);
      origin.copy(a);
      damage(next, false, dmg, quiet);
      done.add(next); cur = next;
    }
  }

  // melee connects mid-swing. Bat: the closest zombie in front of you. Sword: every one in reach.
  function meleeHit() {
    if (weapon === "sword") return swordHit();
    if (isPileMelee(weapon)) return swordHit(MELEES[weapon].dmg, MELEES[weapon].range);
    if (weapon === "saber") return swordHit(SABER.dmg, SABER.range);
    batHit();
  }
  function swordHit(dmgOf = DMG.sword, range = SWORD_RANGE) {
    aim();
    flat.set(fwd.x, 0, fwd.z).normalize();
    let any = false, anyHead = false, anyKill = false;
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      tmp.subVectors(z.root.position, origin).setY(0);
      const d = tmp.length(), reach = range + 0.3 * (z.height / ZOMBIE_HEIGHT);
      if (d > reach || tmp.normalize().dot(flat) < 0.3) continue; // a wide arc in front of you
      const head = headHit(z, origin, fwd, 1.8) < Infinity;
      const dmg = head ? dmgOf.head : dmgOf.body;
      hitAt.copy(z.root.position).setY(z.root.position.y + z.height * (head ? 0.88 : 0.55));
      spray(hitAt, -right.x, -right.z, 24);
      burst(hitAt, 10, 0.5, 0.02, 0.02, 3.5);
      if (Math.random() < 0.5) bloodBehind(hitAt, tmp.set(-right.x, 0, -right.z).normalize(), 2.2, 0.9);
      anyKill ||= z.hp - dmg <= 0;
      damage(z, head, dmg);
      any = true; anyHead ||= head;
    }
    if (any) { sfx.chop(origin); w.onImpact(anyHead, anyKill); }
  }

  // your own skulls (unlocked late): straight out of your hands, twice a second
  type OwnSkull = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; el: Element };
  const elementMats = Object.fromEntries(ELEMENTS.map((e) => {
    const [r, g, b] = ELEMENT_COLOR[e];
    return [e, new THREE.MeshStandardMaterial({ color: 0xe3dccb, emissive: new THREE.Color(r, g, b), emissiveIntensity: 1.4, roughness: 0.6 })];
  })) as Record<Element, THREE.MeshStandardMaterial>;
  const ownSkulls: OwnSkull[] = [];
  function throwOwnSkull() {
    if (!skullsUnlocked || skullCD > 0 || !skullGeo) return;
    skullCD = OWN_SKULL.every;
    aim();
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]; // fire, poison, ice or lightning: luck
    const mesh = new THREE.Mesh(skullGeo, elementMats[el]);
    mesh.position.copy(origin).addScaledVector(fwd, 0.5).addScaledVector(right, 0.15).addScaledVector(up, -0.1);
    scene.add(mesh);
    ownSkulls.push({ mesh, vel: fwd.clone().multiplyScalar(OWN_SKULL.speed), life: 3, el });
    sfx.skullThrow(mesh.position);
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
    bloodBehind(hitAt, tmp.set(-right.x, 0, -right.z).normalize(), 2.2, head ? 1.1 : 0.8);
    bloodPool(best.root.position, 0.6);
    burst(hitAt, head ? 20 : 12, 0.5, 0.02, 0.02, 3.5);
    burst(hitAt, 6, 0.18, 0.02, 0.02, 2);
    sfx.chop(hitAt);
    const killed = best.hp - (head ? DMG.bat.head : DMG.bat.body) <= 0;
    damage(best, head, head ? DMG.bat.head : DMG.bat.body);
    if (!killed && best.kind !== "boss") tryMove(best, -right.x * 0.4 + fwd.x * 0.3, -right.z * 0.4 + fwd.z * 0.3); // knocked sideways
    w.onImpact(head, killed);
  }

  // the bestiary's monsters that lack clips: hop, slide, float or waddle, lunge to attack.
  // Works on the model inside the root (child 0), so the root's own placement stays clean.
  function fakeMove(z: Zombie, dt: number, moving: boolean) {
    if (z.spec.turn) z.root.rotateY(z.spec.turn);
    if (!z.spec.clips) return;
    const body = z.root.children[0];
    if (!body) return;
    z.fakeT += dt;
    z.phase += dt * (moving ? 6 + z.speed * 2 : 2);
    const f = z.spec.fake, ph = z.phase;
    let y = 0, rx = 0, rz = 0;
    if (f === "hop") y = moving ? Math.abs(Math.sin(ph)) * 0.25 * Math.min(1.5, z.height) : 0;
    if (f === "fly") { y = 1.1 + Math.sin(ph * 0.5) * 0.15; rz = Math.sin(ph) * 0.25; }
    if (f === "slide") rz = moving ? Math.sin(ph * 0.5) * 0.12 : 0;
    if (f === "waddle") { rz = moving ? Math.sin(ph * 0.5) * 0.14 : 0; y = moving ? Math.abs(Math.sin(ph * 0.5)) * 0.05 : 0; }
    // no attack clip: a lunge forward; no hit clip: a flinch back
    if (z.current === "Punch" && !z.actions[real(z, "Punch")]) rx = Math.sin(Math.min(1, z.fakeT / 0.55) * Math.PI) * 0.45;
    if (z.current === "HitReact" && !z.actions[real(z, "HitReact")]) rx = -Math.sin(Math.min(1, z.fakeT / 0.3) * Math.PI) * 0.3;
    body.position.y = y; body.rotation.x = rx; body.rotation.z = rz;
  }

  function tryMove(z: Zombie, dx: number, dz: number) {
    const p = z.root.position, R = 0.3 * Math.min(2, z.height / ZOMBIE_HEIGHT);
    const ok = (x: number, y: number) => !w.solidAt(x - R, y - R) && !w.solidAt(x + R, y - R) && !w.solidAt(x - R, y + R) && !w.solidAt(x + R, y + R);
    if (ok(p.x + dx, p.z)) p.x += dx;
    if (ok(p.x, p.z + dz)) p.z += dz;
    p.y = w.floorAt(p.x, p.z);
  }

  // dev shortcut: hand over a weapon without the pickup
  function grant(kind: Weapon) {
    if (kind === "shotgun" && !have.shotgun) giveShotgun();
    have[kind] = true;
    weapon = kind;
  }

  function select(next: Weapon) {
    if (!have[next] || weapon === next) return;
    weapon = next; cooldown = 0.25; swingT = -1; reloadT = 0;
    if (next === "saber") arsenal.get("saber")?.play("Draw", 0.4);
  }

  // reload the gun in hand; false if there's nothing to load
  function reload() {
    if (!isGun(weapon) || reloadT > 0 || mag[weapon] >= MAG[weapon]) return false;
    if (weapon === "shotgun" && ammo <= 0) return false;
    reloadT = RELOAD[weapon];
    if (isArsenalGun(weapon)) arsenal.get(weapon)?.play(GUNS[weapon].reloadClip, reloadT);
    sfx.click();
    return true;
  }
  function reloadDone() {
    if (!isGun(weapon)) return;
    if (weapon === "shotgun") { const take = Math.min(MAG.shotgun - mag.shotgun, ammo); mag.shotgun += take; ammo -= take; sfx.pump(); }
    else { mag[weapon] = MAG[weapon]; sfx.pump(); }
  }
  // shotgun shells: new ones go into the reserve, the magazine is filled on reload
  function giveShotgun() {
    if (!have.shotgun) { have.shotgun = true; mag.shotgun = MAG.shotgun; ammo += 30 - MAG.shotgun; }
    else ammo += 30;
  }

  /* ---------- chain lightning (E, held): a beam to what you aim at, then zombie to zombie ---------- */
  const chainMat = new THREE.MeshBasicMaterial({ color: 0xc8b8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  function beam(a: THREE.Vector3, b: THREE.Vector3) {
    const mat = chainMat.clone();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, a.distanceTo(b), 5, 1, true), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up1, ray.subVectors(b, a).normalize());
    addFx(m, mat, CHAIN.tick * 1.3);
    bolt(a, b); // plus a jagged crackle around it
  }
  const chest = (z: Zombie) => z.root.position.clone().setY(z.root.position.y + z.height * 0.6);
  function shock(z: Zombie) {
    if (clock >= z.stunNext) { z.stunUntil = clock + CHAIN.stunFor; z.stunNext = clock + CHAIN.stunEvery; }
    damage(z, false, CHAIN.dps * CHAIN.tick, true);
  }
  function zap() {
    aim();
    const hand = tmp.copy(origin).addScaledVector(fwd, 0.45).addScaledVector(right, 0.12).addScaledVector(up, -0.12).clone();
    let first: Zombie | null = null, bestDot = CHAIN.aim;
    for (const z of zombies) {
      if (z.dying >= 0) continue;
      const c = center.set(z.root.position.x, z.root.position.y + z.height * 0.6, z.root.position.z);
      if (c.distanceTo(origin) > CHAIN.range) continue;
      const dot = ray.subVectors(c, origin).normalize().dot(fwd);
      if (dot > bestDot && w.clearLine(origin, c)) { first = z; bestDot = dot; }
    }
    if (!first) { bolt(hand, origin.clone().addScaledVector(fwd, 3)); return; } // nothing in reach: it crackles into the air
    sfx.zap();
    beam(hand, chest(first));
    origin.copy(hand);
    shock(first);
    // on from each one to its nearest neighbour not yet hit, as long as there is one in reach
    const done = new Set([first]);
    let cur = first;
    for (;;) {
      let next: Zombie | null = null, nd = CHAIN.reach;
      for (const z of zombies) {
        if (z.dying >= 0 || done.has(z)) continue;
        const d = z.root.position.distanceTo(cur.root.position);
        if (d < nd) { next = z; nd = d; }
      }
      if (!next) break;
      beam(chest(cur), chest(next));
      origin.copy(cur.root.position);
      shock(next);
      done.add(next); cur = next;
    }
  }

  /* ---------- frost nova (Q): everything around you freezes up ---------- */
  function nova(at: THREE.Vector3) {
    if (!novaUnlocked || novaCD > 0) return;
    novaCD = NOVA.every;
    sfx.shatter(at);
    let any = false;
    for (const z of zombies) {
      if (z.dying >= 0 || Math.hypot(z.root.position.x - at.x, z.root.position.z - at.z) > NOVA.radius) continue;
      z.slowUntil = clock + NOVA.slowFor;
      origin.copy(at);
      damage(z, false, NOVA.dmg);
      any = true;
    }
    if (any) w.onHitmarker(false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2), mat);
    ring.position.set(at.x, w.floorAt(at.x, at.z) + 0.05, at.z);
    addFx(ring, mat, 0.6, [0.5, NOVA.radius]);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; burst(tmp.set(at.x + Math.cos(a) * 1.5, w.floorAt(at.x, at.z) + 0.6, at.z + Math.sin(a) * 1.5), 2, 0.6, 0.85, 1, 5); }
  }

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
  let bossPhase = 1;
  function bossBrain(z: Zombie, dt: number, player: THREE.Vector3, d: number) {
    const p = z.root.position;
    bossEye.set(p.x, 1, p.z);
    const phase = z.hp / z.spec.hp > PHASE_AT[0] ? 1 : z.hp / z.spec.hp > PHASE_AT[1] ? 2 : 3;
    if (phase !== bossPhase) {
      bossPhase = phase; z.speed = PHASE_SPEED[phase - 1];
      z.actions.Walk.timeScale = z.speed / 1.3 / z.spec.scale;
      sfx.roar(p); w.onBossPhase(phase);
    }
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
    if (phase >= 2 && z.chargeCD <= 0 && z.busy <= 0 && sees && d > 2.5) {
      z.charge = "windup"; z.chargeT = CHARGE_WINDUP;
      z.chargeTo.set(player.x, 0, player.z); // where you are now, not where you'll be
      play(z, "Idle"); sfx.roar(p);
      return true;
    }
    z.throwCD -= dt;
    if (phase !== 2 && z.throwCD <= 0 && d > 3 && z.busy <= 0 && sees) {
      z.throwCD = SKULL_EVERY[0] + Math.random() * (SKULL_EVERY[1] - SKULL_EVERY[0]);
      z.root.lookAt(player.x, p.y, player.z);
      play(z, "Punch", true); throwSkull(z, target);
    }
    return false;
  }

  /* ---------- per frame ---------- */
  function update(dt: number, player: THREE.Vector3, eyeY: number, moving: boolean, onPickup: (kind: PickupKind) => void) {
    cooldown = Math.max(0, cooldown - dt);
    novaCD = Math.max(0, novaCD - dt);
    if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) { reloadT = 0; reloadDone(); } }
    else if (isGun(weapon) && mag[weapon] === 0 && cooldown <= 0) reload(); // empty: reloads by itself
    // the lightning: drains while held, refills by itself when you let go
    // out of mana: it stops, and only starts again once you let go of E
    if (!chainWant) chainEmpty = false;
    if (chainUnlocked && chainWant && !chainEmpty) {
      energy = Math.max(0, energy - CHAIN.cost * dt);
      if (energy <= 0) chainEmpty = true;
      chainTick -= dt;
      if (chainTick <= 0) { chainTick = CHAIN.tick; zap(); }
    } else {
      chainTick = 0;
      energy = Math.min(CHAIN.max, energy + CHAIN.regen * dt);
    }

    // weapons in hand: Doom-style figure-eight bob, recoil, pump dip, bat swing
    clock += dt;
    gun.visible = weapon === "shotgun"; batView.visible = weapon === "bat"; swordView.visible = weapon === "sword"; railView.visible = weapon === "rail"; iceView.visible = weapon === "ice";
    for (const [id, v] of arsenal) { v.root.visible = weapon === id; if (v.root.visible) v.update(dt); }
    // automatic guns fire as long as the trigger is held
    if (trigger && cooldown <= 0 && ((isArsenalGun(weapon) && GUNS[weapon].auto) || (isPileMelee(weapon) && MELEES[weapon].saw))) fire();
    for (const [id, v] of pileViews) v.visible = weapon === id;
    skullCD = Math.max(0, skullCD - dt);
    if (weapon) {
      camera.updateMatrixWorld();
      camera.matrixWorld.decompose(viewRoot.position, viewRoot.quaternion, tmp);
      viewLight.intensity = flashT > 0 ? 9 : 2.5;
      if (moving) bobPhase += dt * 9;
      const bx = Math.sin(bobPhase * 0.5) * 0.018, by = -Math.abs(Math.cos(bobPhase * 0.5)) * 0.014;
      recoil = Math.max(0, recoil - dt * 5);
      const pump = cooldown > 0.15 && cooldown < 0.55 ? Math.sin(((0.55 - cooldown) / 0.4) * Math.PI) : 0;
      // reloading: the gun dips down and tilts, then comes back up
      const dip = reloadT > 0 && isGun(weapon) && !isArsenalGun(weapon) ? Math.sin((1 - reloadT / RELOAD[weapon]) * Math.PI) : 0; // the new guns have their own reload
      viewRoot.translateY(-dip * 0.12); viewRoot.rotateX(-dip * 0.5); viewRoot.rotateZ(dip * 0.3);
      gun.position.set(0.14 + bx, -0.16 + by + recoil * 0.02 - pump * 0.03, -0.3 + recoil * 0.09);
      gun.rotation.set(recoil * 0.25 - pump * 0.12, 0, pump * 0.2);
      railView.position.set(0.14 + bx, -0.15 + by + recoil * 0.02, -0.3 + recoil * 0.1);
      railView.rotation.set(recoil * 0.2, 0, 0);
      iceView.position.set(0.14 + bx, -0.15 + by + recoil * 0.03, -0.3 + recoil * 0.07);
      iceView.rotation.set(recoil * 0.35, 0, 0);
      flashT -= dt;
      flash.visible = weapon === "shotgun" && flashT > 0; railFlash.visible = weapon === "rail" && flashT > 0;
      flash.material.rotation = railFlash.material.rotation = Math.random() * 6;
      if (isArsenalGun(weapon)) {
        const v = arsenal.get(weapon), at = GUNS[weapon].at;
        v?.root.position.set(at[0] + bx, at[1] + by + recoil * 0.015, at[2] + recoil * 0.06);
        v?.root.rotation.set(recoil * 0.2, 0, 0);
        const f = flashes.get(weapon);
        if (f) { f.visible = flashT > 0; f.material.rotation = Math.random() * 6; }
      }
      if (weapon === "saber") arsenal.get("saber")?.root.position.set(bx * 0.6, by * 0.6, 0);
      // swing: wind up over the right shoulder, whip down-left across the view, come back slowly
      if (swingT >= 0) {
        swingT += dt;
        const timing = weapon === "saber" ? { hit: SABER.hit, end: SABER.every } : SWING; // the pile's blades swing like the bat
        if (!swung && swingT > timing.hit) { swung = true; meleeHit(); }
        if (swingT > timing.end) swingT = -1;
      }
      swingPose(swingT, pose);
      const melee = weapon === "sword" ? swordView : isPileMelee(weapon) ? pileViews.get(weapon) ?? batView : batView;
      melee.position.set(pose[0] + bx, pose[1] + by, pose[2]);
      melee.rotation.set(pose[3], pose[4], pose[5]);
      // the chainsaw: held out in front, shaking while it runs
      if (isPileMelee(weapon) && MELEES[weapon].saw) {
        sawT = Math.max(0, sawT - dt);
        const shake = (trigger || sawT > 0 ? 0.012 : 0.003) * (Math.random() - 0.5);
        melee.position.set(0.18 + bx + shake, -0.22 + by + shake, -0.42);
        melee.rotation.set(-1.35 + shake * 4, 0.15, 0);
      }
    }

    // pickups spin, you take them by walking over them
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.obj.rotation.y += dt * 1.6;
      p.obj.position.y = p.at.y + Math.sin(performance.now() / 300 + i) * 0.04;
      if (Math.hypot(player.x - p.at.x, player.z - p.at.z) < 0.9) {
        if (p.kind === "shotgun") { giveShotgun(); weapon = "shotgun"; }
        if (p.kind === "bat" || p.kind === "sword" || p.kind === "rail" || p.kind === "ice" || p.kind === "saber" || p.kind in GUNS) { have[p.kind as Weapon] = true; select(p.kind as Weapon); }
        if (p.kind === "shells") ammo += p.amount;
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
        if (z.spec.clips && !z.actions[real(z, "Death")]) { const k = Math.min(1, z.dying / 0.45); z.root.rotation.x = -k * k * (Math.PI / 2) * 0.95; }
        if (z.dying > 3) p.y -= dt * 0.4;
        if (z.dying > 5) { scene.remove(z.root); zombies.splice(i, 1); }
        continue;
      }
      const dx = player.x - p.x, dz = player.z - p.z, d = Math.hypot(dx, dz);
      // status effects: burning / poisoned hurt over time, slowed walks at half pace; each shows in its colour
      const slow = clock < z.slowUntil ? ICE.slow : 1;
      z.mixer.timeScale = slow;
      const dot = (clock < z.burnUntil ? BURN_DPS : 0) + (clock < z.poisonUntil ? POISON_DPS : 0);
      z.fxT -= dt;
      if (z.fxT <= 0 && (dot || slow < 1)) {
        z.fxT = 0.08;
        tmp.set(p.x + (Math.random() - 0.5) * 0.5, p.y + z.height * (0.3 + Math.random() * 0.6), p.z + (Math.random() - 0.5) * 0.5);
        if (clock < z.burnUntil) burst(tmp, 2, ...ELEMENT_COLOR.fire, 1.5);
        if (clock < z.poisonUntil) burst(tmp, 2, ...ELEMENT_COLOR.poison, 0.8);
        if (slow < 1) burst(tmp, 1, ...ELEMENT_COLOR.ice, 0.4);
      }
      if (dot) { origin.copy(p); damage(z, false, dot * dt, true); if (z.dying >= 0) continue; }
      // stunned by the lightning: frozen mid-move, no steps, no blows
      if (clock < z.stunUntil) {
        z.mixer.timeScale = 0;
        if (Math.random() < dt * 12) burst(tmp.set(p.x, p.y + z.height * (0.4 + Math.random() * 0.5), p.z), 1, 0.8, 0.75, 1, 1.5); // sparks
        continue;
      }
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
        if (z.current === z.move) tryMove(z, (sx / sl) * z.speed * slow * dt, (sz / sl) * z.speed * slow * dt);
        fakeMove(z, dt, z.current === z.move);
      } else {
        z.root.lookAt(player.x, p.y, player.z);
        fakeMove(z, dt, false);
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

    // nobody stands inside anybody: two zombies may overlap by at most 15 % of their size
    for (let i = 0; i < zombies.length; i++) {
      const a = zombies[i];
      if (a.dying >= 0) continue;
      for (let j = i + 1; j < zombies.length; j++) {
        const b = zombies[j];
        if (b.dying >= 0) continue;
        const ra = 0.3 * (a.height / ZOMBIE_HEIGHT), rb = 0.3 * (b.height / ZOMBIE_HEIGHT), min = (ra + rb) * 0.85;
        const dx = b.root.position.x - a.root.position.x, dz = b.root.position.z - a.root.position.z, d = Math.hypot(dx, dz);
        if (d >= min) continue;
        const nx = d > 1e-4 ? dx / d : Math.random() - 0.5, nz = d > 1e-4 ? dz / d : Math.random() - 0.5, push = (min - d) / 2;
        // the bigger one gets pushed less; the boss not at all
        const wa = a.kind === "boss" ? 0 : b.kind === "boss" ? 2 : rb / (ra + rb) * 2, wb = 2 - wa;
        tryMove(a, -nx * push * wa, -nz * push * wa);
        tryMove(b, nx * push * wb, nz * push * wb);
      }
    }

    // rockets: straight on, burst on whatever they touch
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i], m = r.mesh;
      m.position.addScaledVector(r.vel, dt);
      r.life -= dt;
      burst(m.position, 2, 0.9, 0.5, 0.15, 0.6); burst(m.position, 1, 0.35, 0.33, 0.3, 0.4); // fire and smoke behind it
      const touch = zombies.some((z) => z.dying < 0 && Math.hypot(z.root.position.x - m.position.x, z.root.position.z - m.position.z) < Math.max(0.35, 0.45 * (z.height / ZOMBIE_HEIGHT)) && m.position.y < z.root.position.y + lift(z) + z.height);
      if (touch || w.solidAt(m.position.x, m.position.z) || m.position.y < w.floorAt(m.position.x, m.position.z) || m.position.y > 2.8 || r.life <= 0) {
        explode(m.position.clone());
        scene.remove(m); rockets.splice(i, 1);
      }
    }

    // ice balls: arc down, burst on whatever they touch
    for (let i = iceBalls.length - 1; i >= 0; i--) {
      const b = iceBalls[i], m = b.mesh;
      b.vel.y -= 9.8 * dt;
      m.position.addScaledVector(b.vel, dt);
      m.rotation.x += dt * 6; m.rotation.z += dt * 4;
      b.life -= dt;
      burst(m.position, 1, ...ELEMENT_COLOR.ice, 0.3);
      const touch = zombies.some((z) => z.dying < 0 && Math.hypot(z.root.position.x - m.position.x, z.root.position.z - m.position.z) < 0.45 * (z.height / ZOMBIE_HEIGHT) && m.position.y < z.root.position.y + z.height);
      if (touch || w.solidAt(m.position.x, m.position.z) || m.position.y < w.floorAt(m.position.x, m.position.z) || m.position.y > 2.8 || b.life <= 0) {
        iceBurst(m.position.clone());
        scene.remove(m); iceBalls.splice(i, 1);
      }
    }

    // short-lived visuals fade out
    for (let i = fxs.length - 1; i >= 0; i--) {
      const f = fxs[i];
      f.life -= dt;
      f.mat.opacity = Math.max(0, f.life / f.max);
      if (f.grow) f.obj.scale.setScalar(f.grow[0] + (f.grow[1] - f.grow[0]) * (1 - f.life / f.max));
      if (f.life <= 0) { scene.remove(f.obj); fxs.splice(i, 1); }
    }

    // your skulls: fly, hit the first zombie they touch, or break on a wall
    for (let i = ownSkulls.length - 1; i >= 0; i--) {
      const s = ownSkulls[i], m = s.mesh;
      m.position.addScaledVector(s.vel, dt);
      m.rotation.x += dt * 9; m.rotation.y += dt * 7;
      s.life -= dt;
      const [er, eg, eb] = ELEMENT_COLOR[s.el];
      burst(m.position, 1, er, eg, eb, 0.6); // a trail in its colour
      let hit: Zombie | null = null, head = false;
      for (const z of zombies) {
        if (z.dying >= 0) continue;
        const zp = z.root.position, sc = z.height / ZOMBIE_HEIGHT;
        if (m.position.distanceTo(center.set(zp.x, zp.y + z.height * 0.88, zp.z)) < 0.25 * sc) { hit = z; head = true; break; }
        if (Math.hypot(m.position.x - zp.x, m.position.z - zp.z) < 0.4 * sc && m.position.y > zp.y && m.position.y < zp.y + z.height) { hit = z; break; }
      }
      const wall = w.solidAt(m.position.x, m.position.z) || m.position.y < w.floorAt(m.position.x, m.position.z) || m.position.y > 2.8;
      if (hit || wall || s.life <= 0) {
        burst(m.position, 16, 0.85, 0.82, 0.74, 3.5);
        sfx.skullBreak(m.position);
        burst(m.position, 22, er, eg, eb, 4);
        if (hit) {
          origin.copy(camera.position);
          burst(m.position, 10, 0.45, 0.02, 0.02, 3);
          // the element sticks: fire and poison keep hurting, ice slows, lightning jumps on
          if (s.el === "fire") hit.burnUntil = clock + DOT_FOR;
          if (s.el === "poison") hit.poisonUntil = clock + DOT_FOR * 1.5;
          if (s.el === "ice") hit.slowUntil = clock + ICE.slowFor;
          damage(hit, head, head ? OWN_SKULL.head : OWN_SKULL.dmg);
          if (s.el === "shock") chainShock(hit);
          w.onHitmarker(head);
        }
        scene.remove(m); ownSkulls.splice(i, 1);
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
    fire, spawn, addPickup, update, select, grant, mirrorZombie, burst, swingLean, viewScene, ready, throwOwnSkull,
    unlockSkulls: () => { skullsUnlocked = true; },
    get skulls() { return skullsUnlocked; },
    get weapon() { return weapon; },
    get has() { return have; },
    get ammo() { return ammo + mag.shotgun; }, // all shells, in the gun and in your pockets
    // for the HUD: what's in the gun in hand, and what's left to load ("∞" for rail and ice)
    get mag() { return isGun(weapon) ? mag[weapon] : -1; },
    get reserve() { return weapon === "shotgun" ? String(ammo) : "∞"; },
    get reloading() { return reloadT > 0; },
    reload,
    /** held trigger (mouse button / fire button): the automatic guns keep firing */
    trigger: (on: boolean) => { trigger = on; },
    nova,
    chain: (on: boolean) => { chainWant = on; },
    unlockChain: () => { chainUnlocked = true; },
    unlockNova: () => { novaUnlocked = true; },
    get abilities() { return { chain: chainUnlocked, nova: novaUnlocked, energy: (energy / CHAIN.max) * 100, mana: energy, novaCD }; },
    alive: (kind?: ZombieKind) => zombies.filter((z) => z.dying < 0 && (!kind || z.kind === kind)).length,
    bossHealth: () => { const b = boss(); return b && b.dying < 0 ? Math.max(0, b.hp / b.spec.hp) : -1; },
  };
}
