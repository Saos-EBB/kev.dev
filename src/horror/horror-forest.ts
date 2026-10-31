// Hinter dir — the arena as a cozy forest room: moss, a leaf ceiling, four
// giant trees in the middle, glowing mushrooms, one door in and one door out.
// Everything is drawn procedurally (no model files) and stays visible across
// the whole room: thin fog, no flashlight. Collision still comes from the map
// grid; this file is only what you see.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type ForestWorld = {
  scene: THREE.Scene;
  C: number; // cell size
  x0: number; x1: number; z0: number; z1: number; // the room, in cells
  pillars: [number, number][]; // top-left cell of each 2x2 tree
  floorY: number; ceilY: number;
};

type Palette = { sky: number; ground: number; hemi: number; sun: number; sunI: number; fog: number; tint: number; caps: number[] };
const PALETTES: Palette[] = [
  { sky: 0xfff0c8, ground: 0x4a6a3a, hemi: 2.6, sun: 0xffe0a0, sunI: 1.6, fog: 0xb9c98e, tint: 0xffffff, caps: [0xff6a4a, 0xffb347, 0xffe27a] }, // morning
  { sky: 0xffc8a8, ground: 0x5a3a5a, hemi: 2.4, sun: 0xff9a6a, sunI: 1.4, fog: 0xc08a78, tint: 0xffc0a0, caps: [0xd86bff, 0xff7ac8, 0x7ad8ff] }, // dusk
  { sky: 0x9ab8e8, ground: 0x2a4a5a, hemi: 2.0, sun: 0x9ac0ff, sunI: 0.9, fog: 0x4a6a88, tint: 0x8aa4d8, caps: [0x5affd8, 0x7ac8ff, 0xb08aff] }, // glowing night
];
const FOG_DENSITY = 0.006;
const DOOR_W = 2.2, DOOR_H = 3.2;

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, rx = 1, ry = 1) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!, seeded(w * 31 + h + rx));
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const blobs = (g: CanvasRenderingContext2D, r: () => number, n: number, w: number, h: number, colors: string[], lo: number, hi: number) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    g.beginPath(); g.arc(r() * w, r() * h, lo + r() * (hi - lo), 0, 7); g.fill();
  }
};
const mossTexture = (rx: number, ry: number) => paint(512, 512, (g, r) => {
  g.fillStyle = "#4f6b34"; g.fillRect(0, 0, 512, 512);
  blobs(g, r, 900, 512, 512, ["#5d7c3c55", "#3e5a2a55", "#6e8c4455", "#7a6a3c33"], 6, 30);
  blobs(g, r, 260, 512, 512, ["#c98a3acc", "#a8622ccc", "#d8b04acc"], 1.5, 4); // fallen leaves
  blobs(g, r, 3000, 512, 512, ["#2f4a2266", "#8aa85a44"], 0.5, 1.6);
}, rx, ry);
const canopyTexture = (rx: number, ry: number) => paint(512, 512, (g, r) => {
  g.fillStyle = "#24401f"; g.fillRect(0, 0, 512, 512);
  blobs(g, r, 700, 512, 512, ["#2f5a28", "#3c6e30", "#1c3618", "#4d7f38"], 8, 34);
  blobs(g, r, 34, 512, 512, ["#fff2b8"], 1.5, 6); // sky through the leaves
}, rx, ry);
const backdropTexture = (rx: number) => paint(1024, 512, (g, r) => {
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#dfe6a8"); sky.addColorStop(0.65, "#a8c07a"); sky.addColorStop(1, "#54723c");
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  // three rows of trunks, the far ones pale; each row wraps around the edge so the wall tiles
  for (const [n, col, lo, hi] of [[34, "#a4b67c", 8, 18], [22, "#6f8a52", 16, 34], [12, "#3f5230", 30, 56]] as [number, string, number, number][]) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) { const x = r() * 1024, w = lo + r() * (hi - lo); for (const ox of [-1024, 0, 1024]) g.fillRect(x + ox, 0, w, 512); }
  }
  for (let i = 0; i < 90; i++) { // bushes along the bottom
    g.fillStyle = ["#2f4a26", "#3c5c2c", "#4f7238"][i % 3];
    const x = r() * 1024, y = 440 + r() * 80, s = 24 + r() * 50;
    for (const ox of [-1024, 0, 1024]) { g.beginPath(); g.arc(x + ox, y, s, 0, 7); g.fill(); }
  }
}, rx, 1);
const barkTexture = (rx: number, ry: number) => paint(256, 512, (g, r) => {
  g.fillStyle = "#5c4029"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 170; i++) {
    g.strokeStyle = ["#3d2a1a", "#6e5034", "#2e1f13"][i % 3]; g.lineWidth = 1 + r() * 5;
    const x = r() * 256, y = r() * 512;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + r() * 16 - 8, y + 40, x + r() * 16 - 8, y + 80, x, y + 60 + r() * 80); g.stroke();
  }
  blobs(g, r, 60, 256, 512, ["#5d7c3c88", "#6e8c4488"], 3, 16); // moss
}, rx, ry);
const capTexture = () => paint(128, 64, (g, r) => {
  g.fillStyle = "#fff"; g.fillRect(0, 0, 128, 64);
  blobs(g, r, 12, 128, 44, ["#ffffff", "#fff"], 2, 3);
  const shade = g.createLinearGradient(0, 0, 0, 64);
  shade.addColorStop(0, "#fff"); shade.addColorStop(1, "#b0b0b0");
  g.globalCompositeOperation = "multiply"; g.fillStyle = shade; g.fillRect(0, 0, 128, 64);
  g.globalCompositeOperation = "source-over";
  blobs(g, r, 12, 128, 40, ["#fffef2"], 2.5, 5);
});
const grassTexture = () => paint(128, 128, (g, r) => {
  g.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = ["#6e9a44", "#88b050", "#54803a"][i % 3]; g.lineWidth = 3;
    const x = 10 + r() * 108;
    g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + r() * 14 - 7, 70, x + r() * 30 - 15, 6 + r() * 50); g.stroke();
  }
});
const glowTexture = () => paint(64, 64, (g) => {
  const c = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  c.addColorStop(0, "#fff"); c.addColorStop(0.3, "#ffffff88"); c.addColorStop(1, "#ffffff00");
  g.fillStyle = c; g.fillRect(0, 0, 64, 64);
});
const shaftTexture = () => paint(64, 256, (g) => {
  const c = g.createLinearGradient(0, 0, 0, 256);
  c.addColorStop(0, "#fff3c0aa"); c.addColorStop(1, "#fff3c000");
  g.fillStyle = c; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = "destination-in";
  const e = g.createLinearGradient(0, 0, 64, 0);
  e.addColorStop(0, "#fff0"); e.addColorStop(0.5, "#fff"); e.addColorStop(1, "#fff0");
  g.fillStyle = e; g.fillRect(0, 0, 64, 256);
});
const woodTexture = () => paint(256, 384, (g, r) => {
  g.fillStyle = "#7a4e2a"; g.fillRect(0, 0, 256, 384);
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#8a5a32" : "#6e4524"; g.fillRect(i * 52, 0, 50, 384); }
  for (let i = 0; i < 80; i++) { g.strokeStyle = "#4a2e1644"; g.lineWidth = 1; const x = r() * 256; g.beginPath(); g.moveTo(x, r() * 384); g.lineTo(x + r() * 4 - 2, r() * 384); g.stroke(); }
  g.fillStyle = "#3a2412"; g.fillRect(0, 70, 256, 16); g.fillRect(0, 298, 256, 16);
  g.fillStyle = "#e6b84a"; g.beginPath(); g.arc(226, 192, 9, 0, 7); g.fill(); // handle
});
const signTexture = (text: string) => paint(512, 128, (g) => {
  g.fillStyle = "#5c3a1e"; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#3a2412"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 118);
  g.font = '84px "Caveat Brush", cursive'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffe0a0";
  g.fillText(text, 256, 68);
});

export function createForest(w: ForestWorld) {
  const { C, floorY, ceilY } = w;
  const group = new THREE.Group();
  w.scene.add(group);
  const minX = (w.x0 - 0.5) * C, maxX = (w.x1 + 0.5) * C, minZ = (w.z0 - 0.5) * C, maxZ = (w.z1 + 0.5) * C;
  const sizeX = maxX - minX, sizeZ = maxZ - minZ, midX = (minX + maxX) / 2, midZ = (minZ + maxZ) / 2;
  const roofY = ceilY - 0.1, H = roofY - floorY;
  const trees = w.pillars.map(([x, z]) => new THREE.Vector2((x + 0.5) * C, (z + 0.5) * C));

  /* ---------- the shell: floor, leaf ceiling, painted forest on the walls ---------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(sizeX, sizeZ).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: mossTexture(sizeX / 9, sizeZ / 9) }));
  floor.position.set(midX, floorY, midZ);
  const roofMat = new THREE.MeshBasicMaterial({ map: canopyTexture(sizeX / 11, sizeZ / 11) });
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(sizeX, sizeZ).rotateX(Math.PI / 2), roofMat);
  roof.position.set(midX, roofY, midZ);
  const backMat = new THREE.MeshBasicMaterial({ map: backdropTexture(1), fog: false });
  const backdrop = (len: number, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, H), backMat.clone());
    (m.material as THREE.MeshBasicMaterial).map = backdropTexture(Math.round(len / 16));
    m.position.set(x, floorY + H / 2, z); m.rotation.y = ry;
    return m;
  };
  const walls = [backdrop(sizeX, midX, minZ, 0), backdrop(sizeX, midX, maxZ, Math.PI), backdrop(sizeZ, minX, midZ, Math.PI / 2), backdrop(sizeZ, maxX, midZ, -Math.PI / 2)];
  group.add(floor, roof, ...walls);

  /* ---------- trees: four giants (the pillars) and a ring standing in the walls ---------- */
  const bark = new THREE.MeshLambertMaterial({ map: barkTexture(2, 1) });
  // twelve sides, flats on the grid: the 2x2 collision block sits just inside it, only its corners reach past
  const giantGeo = new THREE.CylinderGeometry(2.75, 3.0, H, 12, 1, true);
  const flareGeo = new THREE.ConeGeometry(3.7, 1.5, 12, 1, true);
  for (const t of trees) {
    const trunk = new THREE.Mesh(giantGeo, bark);
    trunk.position.set(t.x, floorY + H / 2, t.y);
    const flare = new THREE.Mesh(flareGeo, bark);
    flare.position.set(t.x, floorY + 0.75, t.y);
    group.add(trunk, flare);
  }
  const ring: { x: number; z: number; r: number }[] = [];
  const ringR = seeded(11);
  const ringAlong = (a: number, b: number, at: (s: number) => [number, number]) => {
    for (let s = a; s < b; s += 2.6 + ringR() * 2.2) { const r = 0.55 + ringR() * 0.5; const [x, z] = at(s); ring.push({ x, z, r }); }
  };
  ringAlong(minX, maxX, (s) => [s, minZ - 0.15]);
  ringAlong(minX, maxX, (s) => [s, maxZ + 0.15]);
  ringAlong(minZ, maxZ, (s) => [minX - 0.15, s]);
  ringAlong(minZ, maxZ, (s) => [maxX + 0.15, s]);
  const keepClear = ring.filter((t) => Math.abs(t.z - midZ) > DOOR_W); // not in front of the doors
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.15, H, 10, 1, true), bark, keepClear.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  keepClear.forEach((t, i) => trunks.setMatrixAt(i, m4.compose(p.set(t.x, floorY + H / 2, t.z), q.identity(), s.set(t.r, 1, t.r))));
  group.add(trunks);

  /* ---------- leaf clumps hanging under the ceiling ---------- */
  const LEAVES = 170;
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), LEAVES);
  group.add(leaves);

  /* ---------- mushrooms: caps are unlit, so they read as glowing without a real light ---------- */
  const SHROOMS = 240;
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.6, 1, 1, 8, 1, true).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color: 0xe8dcc0 }), SHROOMS);
  const caps = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: capTexture() }), SHROOMS);
  group.add(stems, caps);

  /* ---------- grass: two crossed quads per tuft, one draw call ---------- */
  const GRASS = 1100;
  const grassGeo = mergeGeometries([new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateY(Math.PI / 2)])!;
  const grass = new THREE.InstancedMesh(grassGeo, new THREE.MeshLambertMaterial({ map: grassTexture(), alphaTest: 0.5, side: THREE.DoubleSide }), GRASS);
  group.add(grass);

  /* ---------- light shafts through the canopy, fireflies ---------- */
  const SHAFTS = 14;
  const shaftGeo = mergeGeometries([new THREE.PlaneGeometry(1, 1), new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2)])!;
  const shafts = new THREE.InstancedMesh(shaftGeo, new THREE.MeshBasicMaterial({ map: shaftTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }), SHAFTS);
  group.add(shafts);
  const FLIES = 160;
  const flyPos = new Float32Array(FLIES * 3), flySeed = new Float32Array(FLIES);
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute("position", new THREE.BufferAttribute(flyPos, 3));
  const flies = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: glowTexture(), color: 0xfff0a0, size: 0.16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flies.frustumCulled = false;
  group.add(flies);
  const flyHome: THREE.Vector3[] = [];

  /* ---------- the two doors ---------- */
  const glow = glowTexture(), wood = woodTexture();
  function makeDoor(wallX: number, into: 1 | -1, text: string, tint: number) {
    const g = new THREE.Group();
    g.position.set(wallX, floorY, midZ);
    g.rotation.y = into > 0 ? Math.PI / 2 : -Math.PI / 2; // local +z points into the room
    const light = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W, DOOR_H), new THREE.MeshBasicMaterial({ color: tint, fog: false }));
    light.position.set(0, DOOR_H / 2, 0.02);
    const pivot = new THREE.Group();
    pivot.position.set(-DOOR_W / 2, 0, 0.1);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.1), new THREE.MeshLambertMaterial({ map: wood }));
    leaf.position.set(DOOR_W / 2, DOOR_H / 2, 0);
    pivot.add(leaf);
    const frame = new THREE.MeshLambertMaterial({ map: bark.map });
    const post = (x: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, DOOR_H + 0.4, 0.34), frame); m.position.set(x, (DOOR_H + 0.4) / 2, 0.12); return m; };
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.7, 0.34, 0.34), frame);
    lintel.position.set(0, DOOR_H + 0.3, 0.12);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: signTexture(text) }));
    sign.position.set(0, DOOR_H + 0.86, 0.14);
    const lantern = (x: number) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffc070, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      sp.position.set(x, 2.4, 0.45); sp.scale.setScalar(1.1);
      return sp;
    };
    g.add(light, pivot, post(-DOOR_W / 2 - 0.17), post(DOOR_W / 2 + 0.17), lintel, sign, lantern(-DOOR_W / 2 - 0.45), lantern(DOOR_W / 2 + 0.45));
    group.add(g);
    return { swing: (k: number) => { pivot.rotation.y = -k * 1.9; } };
  }
  const entry = makeDoor(minX, 1, "Eingang", 0xfff0d0);
  const exit = makeDoor(maxX, -1, "Pilzladen", 0xffd080);

  /* ---------- moving parts of a round: new scatter, new light ---------- */
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(midX - 30, 40, midZ - 20); sun.target.position.set(midX, 0, midZ);
  group.add(sun, sun.target);

  const col = new THREE.Color();
  // not on top of a tree or a door
  const free = (x: number, z: number, pad: number) => trees.every((t) => Math.hypot(t.x - x, t.y - z) > 3.1 + pad) && !(Math.abs(z - midZ) < 2.6 && (x - minX < 4 || maxX - x < 4));

  let palette = PALETTES[0];
  function dress(round: number) {
    palette = PALETTES[round % PALETTES.length];
    const r = seeded(round * 7919 + 13);
    const inRoom = (pad: number): [number, number] => { for (;;) { const x = minX + pad + r() * (sizeX - 2 * pad), z = minZ + pad + r() * (sizeZ - 2 * pad); if (free(x, z, 0.1)) return [x, z]; } };
    (roofMat.color as THREE.Color).set(palette.tint);
    for (const m of walls) (m.material as THREE.MeshBasicMaterial).color.set(palette.tint);

    for (let i = 0; i < LEAVES; i++) {
      const [x, z] = inRoom(0);
      leaves.setMatrixAt(i, m4.compose(p.set(x, roofY - 0.3 - r() * 0.8, z), q.setFromAxisAngle(up, r() * 6.3), s.set(1.4 + r() * 2.2, 0.5 + r() * 0.6, 1.4 + r() * 2.2)));
      leaves.setColorAt(i, col.setHSL(0.26 + r() * 0.08, 0.45, 0.24 + r() * 0.12));
    }
    leaves.instanceMatrix.needsUpdate = true; leaves.instanceColor!.needsUpdate = true;

    // a third hug the giant trees, a third line the walls (the tall ones), the rest are scattered in clusters
    let i = 0;
    const put = (x: number, z: number, y: number, h: number, capR: number) => {
      if (i >= SHROOMS) return;
      stems.setMatrixAt(i, m4.compose(p.set(x, y, z), q.identity(), s.set(capR * 0.26, h, capR * 0.26)));
      caps.setMatrixAt(i, m4.compose(p.set(x, y + h * 0.92, z), q.identity(), s.set(capR, capR * 0.6, capR)));
      caps.setColorAt(i, col.set(palette.caps[Math.floor(r() * palette.caps.length)]));
      i++;
    };
    for (const t of trees) for (let n = 0; n < 20; n++) { const a = r() * 6.3, d = 3.3 + r() * 1.5; put(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, floorY, 0.25 + r() * 0.5, 0.18 + r() * 0.3); }
    for (let n = 0; n < 70; n++) {
      const side = Math.floor(r() * 4), along = r();
      const x = side === 0 ? minX + 0.6 : side === 1 ? maxX - 0.6 : minX + along * sizeX, z = side === 2 ? minZ + 0.6 : side === 3 ? maxZ - 0.6 : minZ + along * sizeZ;
      if (free(x, z, 0.2)) put(x, z, floorY, 1.2 + r() * 1.6, 0.5 + r() * 0.6);
    }
    while (i < SHROOMS) {
      const [cx, cz] = inRoom(2);
      for (let n = 0, m = 3 + Math.floor(r() * 6); n < m; n++) put(cx + r() * 1.6 - 0.8, cz + r() * 1.6 - 0.8, floorY, 0.12 + r() * 0.3, 0.1 + r() * 0.2);
    }
    stems.instanceMatrix.needsUpdate = true; caps.instanceMatrix.needsUpdate = true; caps.instanceColor!.needsUpdate = true;

    for (let n = 0; n < GRASS; n++) {
      const [x, z] = inRoom(0.2), h = 0.3 + r() * 0.5;
      grass.setMatrixAt(n, m4.compose(p.set(x, floorY, z), q.setFromAxisAngle(up, r() * 3.1), s.set(0.6 + r() * 0.5, h, 0.6 + r() * 0.5)));
      grass.setColorAt(n, col.setHSL(0.24 + r() * 0.07, 0.5, 0.55 + r() * 0.2));
    }
    grass.instanceMatrix.needsUpdate = true; grass.instanceColor!.needsUpdate = true;

    for (let n = 0; n < SHAFTS; n++) {
      const [x, z] = inRoom(4), wd = 1.6 + r() * 1.6;
      shafts.setMatrixAt(n, m4.compose(p.set(x, floorY + H / 2, z), q.setFromAxisAngle(up, r() * 3.1), s.set(wd, H, wd)));
    }
    shafts.instanceMatrix.needsUpdate = true;

    flyHome.length = 0;
    for (let n = 0; n < FLIES; n++) { const [x, z] = inRoom(1); flyHome.push(new THREE.Vector3(x, floorY + 0.4 + r() * 3, z)); flySeed[n] = r() * 100; }
    sun.color.set(palette.sun); sun.intensity = palette.sunI;
  }
  dress(0);

  let t = 0;
  return {
    /** points just inside each door, on the eye-independent ground plane */
    entryAt: new THREE.Vector3(minX + 0.5, 0, midZ),
    exitAt: new THREE.Vector3(maxX - 0.5, 0, midZ),
    entryDoor: entry, exitDoor: exit,
    dress,
    /** this round's look, set every frame because the main loop also drives these */
    light(hemi: THREE.HemisphereLight, fog: THREE.FogExp2, scene: THREE.Scene) {
      hemi.intensity = palette.hemi; hemi.color.set(palette.sky); hemi.groundColor.set(palette.ground);
      fog.density = FOG_DENSITY; fog.color.set(palette.fog);
      (scene.background as THREE.Color).set(palette.fog);
    },
    update(dt: number) {
      t += dt;
      for (let i = 0; i < FLIES; i++) {
        const h = flyHome[i], k = flySeed[i];
        flyPos[i * 3] = h.x + Math.sin(t * 0.5 + k) * 1.2;
        flyPos[i * 3 + 1] = h.y + Math.sin(t * 0.8 + k * 2) * 0.4;
        flyPos[i * 3 + 2] = h.z + Math.cos(t * 0.4 + k) * 1.2;
      }
      flyGeo.attributes.position.needsUpdate = true;
    },
  };
}
export type Forest = ReturnType<typeof createForest>;
