// Hinter dir — the second armory: six guns from the "FPS Pack" with their own
// fire and reload animations, and a pirate sabre held in two arms (arms,
// slash and pierce come with the model). Data first: every gun is a row in
// GUNS; horror-combat.ts reads damage, magazine, rate and spread from it.
// Models: public/horror/weapons/, see NOTICE.md.
import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

export type GunId = "pistol" | "revolver" | "p90" | "rifle" | "pump" | "sniper";
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
};

// A normal zombie has 100, a big one 200.
export const GUNS: Record<GunId, GunSpec> = {
  pistol: { file: "fps_pistol", name: "Pistole", mag: 12, reload: 1.2, every: 0.18, auto: false, pellets: 1, spread: 0.004, dmg: { head: 100, body: 40 }, pierce: 1, kick: 0.35, sound: 0.3, fire: "Fire", reloadClip: "Reload", muzzle: "+x", len: 0.26, at: [0.13, -0.13, -0.32] },
  revolver: { file: "fps_revolver", name: "Revolver", mag: 6, reload: 2.2, every: 0.45, auto: false, pellets: 1, spread: 0.002, dmg: { head: 250, body: 90 }, pierce: 2, kick: 0.8, sound: 0.8, fire: "Fire", reloadClip: "Reload", muzzle: "+z", len: 0.32, at: [0.13, -0.13, -0.32] },
  p90: { file: "fps_p90", name: "P90", mag: 50, reload: 2.0, every: 0.065, auto: true, pellets: 1, spread: 0.03, dmg: { head: 45, body: 18 }, pierce: 1, kick: 0.15, sound: 0.25, fire: "Fire", reloadClip: "Reload", muzzle: "+x", len: 0.5, at: [0.14, -0.15, -0.32] },
  rifle: { file: "fps_rifle", name: "Sturmgewehr", mag: 30, reload: 1.8, every: 0.11, auto: true, pellets: 1, spread: 0.015, dmg: { head: 80, body: 34 }, pierce: 1, kick: 0.25, sound: 0.55, fire: "FireWBullet", reloadClip: "Reload", muzzle: "-z", len: 0.66, at: [0.16, -0.17, -0.3] },
  pump: { file: "fps_shotgun", name: "Kampfflinte", mag: 6, reload: 2.0, every: 0.6, auto: false, pellets: 10, spread: 0.09, dmg: { head: 30, body: 14 }, pierce: 1, kick: 1, sound: 1.1, fire: "FireWBullet", reloadClip: "Reload", muzzle: "-z", len: 0.66, at: [0.16, -0.17, -0.3] },
  sniper: { file: "fps_sniperrifle", name: "Scharfschützengewehr", mag: 5, reload: 2.5, every: 1.1, auto: false, pellets: 1, spread: 0, dmg: { head: 1000, body: 220 }, pierce: 4, kick: 1.2, sound: 1.4, fire: "FireWBullet", reloadClip: "Reload", muzzle: "-z", len: 0.78, at: [0.16, -0.17, -0.3] },
};
export const GUN_IDS = Object.keys(GUNS) as GunId[];

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
    m.color.lerp(GUNMETAL, 0.75); m.metalness = 0.55; m.roughness = 0.45;
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
