// Hinter dir — the second armory: six guns from the "FPS Pack" with their own
// fire and reload animations, and a pirate sabre held in two arms (arms,
// slash and pierce come with the model). Data first: every gun is a row in
// GUNS; horror-combat.ts reads damage, magazine, rate and spread from it.
// Models: public/horror/weapons/, see NOTICE.md.
import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

export type GunId =
  | "pistol" | "p90" | "rifle" | "pump" | "sniper"
  | "rpg" | "flamer" | "mg" | "sniper1a" | "smg2" | "ak47" | "shtgn";
export type ArsenalId = GunId | "saber";

export type GunSpec = {
  file: string; name: string;
  mag: number; reload: number; every: number; auto: boolean; // reload and every in seconds
  pellets: number; spread: number; dmg: { head: number; body: number }; // damage per pellet
  pierce: number; // how many zombies one bullet goes through
  kick: number; // recoil, 1 = the shotgun
  sound: number; // calibre for sfx.gunshot
  fire: string; reloadClip: string;
  // the model's muzzle direction, how long it is in the hand (m), where it sits in front of the eye
  muzzle: "+x" | "-x" | "+z" | "-z"; len: number; at: [number, number, number];
  special?: "rocket" | "flame"; // the RPG fires a rocket that explodes; the flamethrower a burning cone
};

// A normal zombie has 100, a big one 200.
export const GUNS: Record<GunId, GunSpec> = {
  pistol: { file: "fps_pistol", name: "Pistole", mag: 12, reload: 1.2, every: 0.18, auto: false, pellets: 1, spread: 0.004, dmg: { head: 100, body: 40 }, pierce: 1, kick: 0.35, sound: 0.3, fire: "Fire", reloadClip: "Reload", muzzle: "+x", len: 0.26, at: [0.13, -0.13, -0.32] },
  p90: { file: "fps_p90", name: "P90", mag: 50, reload: 2.0, every: 0.065, auto: true, pellets: 1, spread: 0.03, dmg: { head: 45, body: 18 }, pierce: 1, kick: 0.15, sound: 0.25, fire: "Fire", reloadClip: "Reload", muzzle: "+x", len: 0.5, at: [0.14, -0.15, -0.32] },
  rifle: { file: "fps_rifle", name: "Sturmgewehr", mag: 30, reload: 1.8, every: 0.11, auto: true, pellets: 1, spread: 0.015, dmg: { head: 80, body: 34 }, pierce: 1, kick: 0.25, sound: 0.55, fire: "FireWBullet", reloadClip: "Reload", muzzle: "-z", len: 0.66, at: [0.16, -0.17, -0.3] },
  pump: { file: "fps_shotgun", name: "Kampfflinte", mag: 6, reload: 2.0, every: 0.6, auto: false, pellets: 10, spread: 0.09, dmg: { head: 30, body: 14 }, pierce: 1, kick: 1, sound: 1.1, fire: "FireWBullet", reloadClip: "Reload", muzzle: "-z", len: 0.66, at: [0.16, -0.17, -0.3] },
  // the test bench's rest: static models (no clips), all from ~/Assets cc0
  rpg: { file: "w_rpg", name: "RPG", mag: 1, reload: 2.4, every: 0.6, auto: false, pellets: 0, spread: 0, dmg: { head: 0, body: 0 }, pierce: 0, kick: 1.4, sound: 0.9, fire: "", reloadClip: "", muzzle: "+x", len: 0.95, at: [0.17, -0.14, -0.25], special: "rocket" },
  flamer: { file: "w_flamer", name: "Flammenwerfer", mag: 100, reload: 2.5, every: 0.06, auto: true, pellets: 0, spread: 0, dmg: { head: 0, body: 0 }, pierce: 0, kick: 0.05, sound: 0, fire: "", reloadClip: "", muzzle: "+x", len: 0.8, at: [0.16, -0.17, -0.28], special: "flame" },
  mg: { file: "w_mg", name: "MG", mag: 100, reload: 3.2, every: 0.07, auto: true, pellets: 1, spread: 0.045, dmg: { head: 60, body: 26 }, pierce: 1, kick: 0.3, sound: 0.7, fire: "", reloadClip: "", muzzle: "-z", len: 0.85, at: [0.17, -0.19, -0.28] },
  sniper1a: { file: "w_sniper1a", name: "Jagdgewehr", mag: 4, reload: 2.2, every: 0.9, auto: false, pellets: 1, spread: 0, dmg: { head: 800, body: 200 }, pierce: 3, kick: 1.1, sound: 1.3, fire: "", reloadClip: "", muzzle: "-x", len: 0.85, at: [0.16, -0.17, -0.28] },
  smg2: { file: "w_smg2", name: "MP", mag: 32, reload: 1.6, every: 0.075, auto: true, pellets: 1, spread: 0.035, dmg: { head: 50, body: 20 }, pierce: 1, kick: 0.15, sound: 0.3, fire: "", reloadClip: "", muzzle: "-z", len: 0.5, at: [0.14, -0.15, -0.32] },
  ak47: { file: "w_ak47", name: "AK", mag: 30, reload: 2.0, every: 0.1, auto: true, pellets: 1, spread: 0.02, dmg: { head: 90, body: 38 }, pierce: 1, kick: 0.3, sound: 0.6, fire: "", reloadClip: "", muzzle: "-z", len: 0.75, at: [0.16, -0.17, -0.3] },
  shtgn: { file: "w_shtgn", name: "Doppellauf", mag: 2, reload: 1.8, every: 0.3, auto: false, pellets: 14, spread: 0.11, dmg: { head: 30, body: 15 }, pierce: 1, kick: 1.3, sound: 1.2, fire: "", reloadClip: "", muzzle: "+x", len: 0.8, at: [0.16, -0.17, -0.3] },
  sniper: { file: "fps_sniperrifle", name: "Scharfschützengewehr", mag: 5, reload: 2.5, every: 1.1, auto: false, pellets: 1, spread: 0, dmg: { head: 1000, body: 220 }, pierce: 4, kick: 1.2, sound: 1.4, fire: "FireWBullet", reloadClip: "Reload", muzzle: "-z", len: 0.78, at: [0.16, -0.17, -0.3] },
};
export const GUN_IDS = Object.keys(GUNS) as GunId[];

// RPG: a rocket flies straight and bursts; the flamethrower sets everything in a cone alight
export const ROCKET = { speed: 24, radius: 4.5, dmg: 400 };
export const FLAME = { range: 7, cone: 0.88, dmg: 8 }; // per tick (every 0.06 s), plus burning

// the sabre: a wide cut in front of you, the pierce reaches further but hits one
export const SABER = { name: "Säbel", range: 2.6, dmg: { head: 400, body: 160 }, every: 0.75, hit: 0.3, speed: 2.2 };

export type ViewModel = {
  root: THREE.Group; // add to the view scene; positioned by the combat code
  muzzle: THREE.Vector3; // local to root
  play(clip: string, seconds?: number): number; // once; returns its length in seconds
  loop(clip: string): void;
  update(dt: number): void;
};

function actions(scene: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const mixer = new THREE.AnimationMixer(scene);
  const all = new Map(clips.map((c) => [c.name, mixer.clipAction(c)]));
  let looping: THREE.AnimationAction | null = null;
  // a one-shot ends: back to the loop (the sabre's idle), if there is one
  mixer.addEventListener("finished", (e) => {
    const done = (e as unknown as { action: THREE.AnimationAction }).action;
    if (!looping || done === looping) return;
    done.fadeOut(0.12);
    looping.reset().fadeIn(0.12).play();
  });
  return {
    play(name: string, seconds?: number) {
      const a = all.get(name);
      if (!a) return 0;
      const len = a.getClip().duration;
      for (const other of all.values()) if (other !== a && other !== looping) other.stop();
      a.reset().setLoop(THREE.LoopOnce, 1);
      a.clampWhenFinished = true;
      a.timeScale = seconds ? len / seconds : 1;
      a.setEffectiveWeight(1).play();
      looping?.fadeOut(0.08);
      return seconds ?? len;
    },
    loop(name: string) {
      const a = all.get(name);
      if (!a || a === looping) return;
      looping?.fadeOut(0.15);
      a.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.15).play();
      looping = a;
    },
    update: (dt: number) => mixer.update(dt),
  };
}

const GUNMETAL = new THREE.Color(0x26282c);

// FPS Pack gun: turned so the muzzle points to -z, scaled to its length, centred
export function gunView(g: GLTF, spec: GunSpec): ViewModel {
  const inner = g.scene;
  inner.rotation.y = { "+x": Math.PI / 2, "-x": -Math.PI / 2, "+z": Math.PI, "-z": 0 }[spec.muzzle];
  // the pack is untextured and toy-beige: gunmetal, keeping a little of its shading
  inner.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.frustumCulled = false;
    const m = (o.material as THREE.MeshStandardMaterial).clone();
    m.color.lerp(GUNMETAL, m.map ? 0.1 : 0.75); m.metalness = m.map ? 0.2 : 0.55; m.roughness = 0.45;
    o.material = m;
  });
  const wrap = new THREE.Group();
  wrap.add(inner);
  wrap.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(wrap, true);
  inner.scale.multiplyScalar(spec.len / Math.max(1e-6, box.max.z - box.min.z));
  wrap.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(wrap, true);
  inner.position.sub(box.getCenter(new THREE.Vector3()));
  const root = new THREE.Group();
  root.add(wrap);
  const muzzle = new THREE.Vector3(0, (box.max.y - box.min.y) * 0.2, -(box.max.z - box.min.z) / 2 - 0.03);
  const a = actions(inner, g.animations);
  return { root, muzzle, ...a };
}

// the sabre: arms animated relative to the model's own camera; put the
// whole thing into that camera's space, then it sits in front of ours
export function saberView(g: GLTF, map: THREE.Texture): ViewModel {
  const scene = g.scene;
  scene.updateMatrixWorld(true);
  const cam = g.cameras[0];
  if (cam) {
    scene.applyMatrix4(cam.matrixWorld.clone().invert());
    cam.parent?.remove(cam);
  }
  map.colorSpace = THREE.SRGBColorSpace;
  map.flipY = false; // glTF UVs
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.frustumCulled = false;
    if (o.name.startsWith("Arms")) { // the arms' texture didn't ship: dark sleeves and gloves
      const m = (o.material as THREE.MeshStandardMaterial).clone();
      m.color.set(0x2a2420); m.roughness = 0.85; m.metalness = 0;
      o.material = m;
    }
    if (o.name.startsWith("Pirate")) {
      const m = (o.material as THREE.MeshStandardMaterial).clone();
      m.map = map; m.color.set(0xffffff); m.roughness = 0.5; m.metalness = 0.4;
      o.material = m;
    }
  });
  // tipped forward a touch: the long blade reaches out of the top of the screen otherwise
  const tip = new THREE.Group();
  tip.rotation.x = -0.08;
  tip.add(scene);
  const root = new THREE.Group();
  root.add(tip);
  return { root, muzzle: new THREE.Vector3(), ...actions(scene, g.animations) };
}
