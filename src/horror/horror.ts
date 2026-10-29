// Hinter dir — hidden first-person horror maze (saos.html; only mounts when
// the URL hash is #dev#horror — obscurity, not protection: the hash ships in
// this file). Six notes about me are chalked on the walls of the dead ends;
// something walks your own path a few metres behind you and gets closer
// while you don't look back. Find all six, the steel door opens.
//
// Rendering: three.js, one spotlight (the flashlight) with a short shadow
// camera, fog hides everything past ~15 m, walls are one InstancedMesh.
// Resolution adapts to the frame rate. Append "low" to the hash
// (#dev#horror#low) to force low quality, "fps" to show the stats.
import "./horror.css";
import "@fontsource/caveat-brush/400.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as sfx from "./horror-audio";
import { createLife } from "./horror-life";
import { createFigures } from "./horror-figures";


const MARKUP = `
  <canvas id="gl"></canvas>
  <div class="hud" id="count"><p>Erinnerungen <b id="got">0</b> / <b id="tot">6</b></p><p id="goal">Geh weiter. Es gibt kein Zurück.</p></div>
  <p class="hud" id="fps" hidden></p>
  <div class="hud" id="dot"></div>
  <div class="hud" id="card"><small id="card-tag"></small><span id="card-text"></span></div>
  <div class="hud" id="whisper"></div>
  <div class="hud" id="red"></div>
  <div class="hud" id="vig"></div>
  <div id="touch" aria-hidden="true"></div>
  <p id="err"></p>

  <div class="overlay" id="start">
    <div class="box">
      <h1>Hinter <span>dir</span></h1>
      <p>Sechs Erinnerungen an Kevin Schaberl stehen an den Betonwänden dieses Labyrinths. Finde alle, dann öffnet sich der Ausgang.</p>
      <p>Etwas folgt dir. Es kommt näher, solange du nicht hinsiehst.</p>
      <div class="keys">
        <b>Maus</b><span>umsehen</span>
        <b>W A S D</b><span>gehen</span>
        <b>Shift</b><span>rennen (laut, es hört dich)</span>
        <b>Esc</b><span>Pause</span>
      </div>
      <p class="warn">Kopfhörer empfohlen · Jumpscares · flackerndes Licht</p>
      <button class="btn" id="go" type="button" disabled>lädt …</button>
      <p class="muted">Am Handy: rechts wischen zum Umsehen, Kreis links unten zum Gehen.</p>
    </div>
  </div>

  <div class="overlay" id="pause" hidden>
    <div class="box">
      <h1>Pause</h1>
      <p>Es wartet. Es ist geduldig.</p>
      <button class="btn" id="resume" type="button">Weiter</button>
    </div>
  </div>

  <div class="overlay" id="end" hidden>
    <div class="box">
      <h1>Du bist <span>raus</span></h1>
      <p>Das hast du über Kevin gefunden:</p>
      <ul class="end-list" id="end-list"></ul>
      <button class="btn" id="again" type="button">Noch mal rein</button>
    </div>
  </div>`;

/* ============================ LEVEL ============================
   One long winding corridor, no junctions: you can't get lost.
   # wall · . corridor · S start (facing the wall, first note on it)
   1–5 notes: written on the wall straight ahead when you get there
   G gate: slams shut behind you once you're two cells past it, no way back
   X exit: steel door until all notes are found, the last words behind it */
const MAP = [
  "#############",
  "#S.........1#",
  "###########G#",
  "#2..........#",
  "#G###########",
  "#..........3#",
  "###########G#",
  "#4..........#",
  "#G###########",
  "#..........5#",
  "###########G#",
  "#X..........#",
  "#############",
];

type Note = { tag: string; wall: string; text: string };
const NOTES: Note[] = [
  { tag: "Über mich", wall: "Junior\nSoftware Developer", text: "Junior Software Developer." },
  { tag: "Wo", wall: "Raum Linz\nremote im DACH-Raum\nsofort verfügbar", text: "Raum Linz · remote im DACH-Raum · sofort verfügbar." },
  { tag: "Was", wall: "TypeScript-Fullstack\nBootcamp +\nviel Eigenregie", text: "TypeScript-Fullstack · Bootcamp + viel Eigenregie." },
  { tag: "Davor", wall: "7 Jahre Bodenleger\nSonnenschutztechniker\n2 Jahre Sanierung", text: "Bevor ich Software gebaut habe, habe ich mit den Händen gebaut: fast sieben Jahre als Bodenleger und Sonnenschutztechniker, danach zwei Jahre Sanierung unseres Wohnhauses." },
  { tag: "Prinzip", wall: "„Geht nicht“ heißt meistens:\nnoch nicht verstanden.", text: "„Geht nicht“ heißt meistens: noch nicht verstanden. Ist das Konzept durchdacht, ist die Implementierung der einfachere Teil." },
  { tag: "Prinzip", wall: "Wer nach mir kommt,\nsoll meinen Code\nohne mich verstehen.", text: "Wer nach mir kommt, soll meinen Code ohne mich verstehen." },
];
const FINAL: Note = { tag: "Am Ende", wall: "Natur. Familie.\nMein Sohn.", text: "Ausgleich finde ich in der Natur und bei meiner Familie, allen voran bei meinem Sohn." };
// red writing that appears on walls you already passed
const BEHIND = ["DREH DICH UM", "ICH BIN\nHINTER DIR", "NICHT\nRENNEN", "DU HAST MICH\nGESEHEN", "LAUF"];

const C = 2.6; // cell size (m)
const WH = 2.8; // wall height
const EYE = 1.62;
const PR = 0.28; // player radius
const ROWS = MAP.length, COLS = MAP[0].length;

type Cell = [number, number];
const DIRS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cell = (cx: number, cz: number) => (cz < 0 || cz >= ROWS || cx < 0 || cx >= COLS ? "#" : MAP[cz][cx]);
const openDirs = (x: number, z: number) => DIRS.filter(([dx, dz]) => cell(x + dx, z + dz) !== "#");
const key = (c: Cell) => `${c[0]},${c[1]}`;

function findCell(ch: string): Cell {
  for (let z = 0; z < ROWS; z++) for (let x = 0; x < COLS; x++) if (MAP[z][x] === ch) return [x, z];
  throw new Error(`map has no ${ch}`);
}

function mount() {
  document.body.innerHTML = MARKUP;
  const $ = (id: string) => document.getElementById(id)!;
  const showErr = (m: string) => { $("err").textContent = "Fehler: " + m; };
  window.addEventListener("error", (e) => showErr(e.message || "Script"));
  window.addEventListener("unhandledrejection", (e) => showErr(e.reason?.message || String(e.reason)));

  const hashFlags = location.hash.split("#");
  const LOW = hashFlags.includes("low");
  const SHOW_FPS = hashFlags.includes("fps");
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- map analysis ---------- */
  const start = findCell("S"), exitCell = findCell("X");
  let exitOpen = false;
  const closed = new Set<string>(); // gates that have slammed shut
  const solid = (cx: number, cz: number) => { const k = cell(cx, cz); return k === "#" || (k === "X" && !exitOpen) || closed.has(`${cx},${cz}`); };
  const solidAt = (x: number, z: number) => solid(Math.round(x / C), Math.round(z / C));

  // BFS from the start: distance along the corridor for every cell (and where you came from)
  const parent = new Map<string, Cell>();
  const dist = new Map<string, number>([[key(start), 0]]);
  const reachable: Cell[] = [start];
  for (let i = 0; i < reachable.length; i++) {
    const [x, z] = reachable[i];
    for (const [dx, dz] of DIRS) {
      const n: Cell = [x + dx, z + dz];
      if (cell(...n) !== "#" && !dist.has(key(n))) { dist.set(key(n), dist.get(key([x, z]))! + 1); parent.set(key(n), [x, z]); reachable.push(n); }
    }
  }
  // the wall straight ahead when you walk into a cell (at the start: the wall you face)
  const wallAhead = ([x, z]: Cell): Cell => {
    const from = parent.get(key([x, z]));
    if (!from) { const [ox, oz] = openDirs(x, z)[0]; return [-ox, -oz]; }
    return [x - from[0], z - from[1]];
  };
  const noteCells: Cell[] = [start, ...[1, 2, 3, 4, 5].map((n) => findCell(String(n)))];
  const gates = reachable.filter(([x, z]) => MAP[z][x] === "G");

  /* ============================ RENDERER ============================ */
  const canvas = $("gl") as HTMLCanvasElement;
  // MSAA only where it's cheap (low-DPR screens); high-DPR screens are sharp enough without it
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: devicePixelRatio < 1.5 && !LOW, powerPreference: "high-performance" });
  // adaptive resolution: start at the cap, step down when frames drop, back up when there's headroom
  const Q = { cap: LOW ? 0.75 : Math.min(devicePixelRatio || 1, isTouch ? 1.25 : 1.5), dpr: 1, acc: 0, n: 0, flips: 0, lastDir: 0 };
  Q.dpr = Q.cap;
  renderer.setPixelRatio(Q.dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft costs more and is gone in newer three.js anyway
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.11);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 22); // fog swallows everything past ~15 m
  scene.add(camera);
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  window.addEventListener("resize", resize);
  resize();

  const hemi = new THREE.HemisphereLight(0x3a3430, 0x0a0806, 0.6);
  scene.add(hemi);
  // the only real light: range = fog range, so the shadow camera stays short
  const lamp = new THREE.SpotLight(0xffc48a, 22, 14, 0.6, 0.6, 1.6);
  lamp.position.set(0.18, -0.2, 0.1);
  const SH = isTouch || LOW ? 512 : 1024;
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(SH, SH);
  lamp.shadow.bias = -0.0006;
  lamp.shadow.camera.near = 0.2;
  camera.add(lamp, lamp.target);
  lamp.target.position.set(0, -0.1, -4);

  /* ---------- procedural concrete (value noise, 6 octaves, tileable) ---------- */
  function concreteCanvas(size: number, seed: number, tint: [number, number, number]) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!, img = g.createImageData(size, size), d = img.data;
    const lattice = (n: number, s: number) => { const a = new Float32Array(n * n); let r = s; for (let i = 0; i < a.length; i++) { r = (r * 16807) % 2147483647; a[i] = r / 2147483647; } return a; };
    const octs = [4, 8, 16, 32, 64, 128].map((n, i) => ({ n, a: lattice(n, seed + i * 977), w: 0.5 ** i }));
    const smooth = (t: number) => t * t * (3 - 2 * t);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let v = 0;
      for (const o of octs) {
        const fx = (x / size) * o.n, fy = (y / size) * o.n, ix = Math.floor(fx), iy = Math.floor(fy), tx = smooth(fx - ix), ty = smooth(fy - iy);
        const at = (cx: number, cy: number) => o.a[(cy % o.n) * o.n + (cx % o.n)];
        const A = at(ix, iy), B = at(ix + 1, iy), Cc = at(ix, iy + 1), D = at(ix + 1, iy + 1);
        v += o.w * (A + (B - A) * tx + (Cc - A) * ty + (A - B - Cc + D) * tx * ty);
      }
      const i = (y * size + x) * 4, k = 0.55 + (v / 1.97) * 0.6;
      d[i] = tint[0] * k; d[i + 1] = tint[1] * k; d[i + 2] = tint[2] * k; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // formwork seam, tie holes, rust streaks
    g.fillStyle = "#0006";
    g.fillRect(0, size * 0.5, size, 2);
    for (const [hx, hy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      g.beginPath(); g.arc(hx * size, hy * size, size * 0.014, 0, 7); g.fillStyle = "#000a"; g.fill();
      const grd = g.createLinearGradient(0, hy * size, 0, hy * size + size * 0.22);
      grd.addColorStop(0, "#3a2416aa"); grd.addColorStop(1, "#3a241600");
      g.fillStyle = grd; g.fillRect(hx * size - 3, hy * size, 6, size * 0.22);
    }
    return c;
  }
  const tex = (cv: HTMLCanvasElement, rx: number, ry: number) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  };
  const wallCv = concreteCanvas(512, 7, [150, 143, 132]);
  const wallMat = new THREE.MeshStandardMaterial({ map: tex(wallCv, 1, 1), bumpMap: tex(wallCv, 1, 1), bumpScale: 2.5, roughness: 0.95 });
  const floorCv = concreteCanvas(512, 31, [92, 86, 78]);
  const floorMat = new THREE.MeshStandardMaterial({ map: tex(floorCv, COLS, ROWS), bumpMap: tex(floorCv, COLS, ROWS), bumpScale: 1.5, roughness: 0.85 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: tex(concreteCanvas(256, 77, [70, 66, 60]), COLS, ROWS), roughness: 1 });

  // walls: every '#' one instance of a box -> one draw call
  const walls: Cell[] = [];
  for (let z = 0; z < ROWS; z++) for (let x = 0; x < COLS; x++) if (MAP[z][x] === "#") walls.push([x, z]);
  const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(C, WH, C), wallMat, walls.length);
  const m4 = new THREE.Matrix4();
  walls.forEach(([x, z], i) => wallMesh.setMatrixAt(i, m4.makeTranslation(x * C, WH / 2, z * C)));
  wallMesh.castShadow = wallMesh.receiveShadow = true;
  scene.add(wallMesh);
  const plane = (mat: THREE.Material, y: number, rotX: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(COLS * C, ROWS * C), mat);
    m.rotation.x = rotX; m.position.set(((COLS - 1) * C) / 2, y, ((ROWS - 1) * C) / 2); m.receiveShadow = true;
    scene.add(m);
  };
  plane(floorMat, 0, -Math.PI / 2);
  plane(ceilMat, WH, Math.PI / 2);

  // exit: rusted steel door
  const doorMat = new THREE.MeshStandardMaterial({ map: tex(concreteCanvas(256, 5, [96, 52, 32]), 1, 1), metalness: 0.6, roughness: 0.6 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(C, WH, C), doorMat);
  door.position.set(exitCell[0] * C, WH / 2, exitCell[1] * C);
  door.castShadow = door.receiveShadow = true;
  scene.add(door);

  /* ---------- writing on the walls ---------- */
  function chalk(lines: string, color: string) {
    const cv = document.createElement("canvas");
    cv.width = 1024; cv.height = 512;
    const g = cv.getContext("2d")!;
    const rows = lines.split("\n");
    const fs = Math.min(120, (900 / Math.max(...rows.map((r) => r.length))) * 1.9, 420 / rows.length);
    g.font = `${fs}px "Caveat Brush", cursive`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
    rows.forEach((r, i) => {
      g.save(); g.translate(512, 256 + (i - (rows.length - 1) / 2) * fs * 1.05); g.rotate((Math.sin(i * 3.1) * 2 - 1) * 0.015);
      g.fillText(r, 0, 0); g.restore();
    });
    // worn chalk: punch out specks
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.8})`; g.fillRect(Math.random() * 1024, Math.random() * 512, 1 + Math.random() * 3, 1 + Math.random() * 2); }
    // drips
    g.globalCompositeOperation = "source-over"; g.fillStyle = color; g.globalAlpha = 0.5;
    for (let i = 0; i < 6; i++) g.fillRect(150 + Math.random() * 724, 200 + Math.random() * 150, 2, 40 + Math.random() * 120);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  // writing on the wall of cell (cx,cz) in direction (wx,wz); alphaTest instead of blending: no sorting, no overdraw
  const usedWalls = new Set<string>();
  const writeGeo = new THREE.PlaneGeometry(2.2, 1.1);
  type Writing = { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>; lines: string; color: string };
  const writings: Writing[] = [];
  // glow: the chalk faintly lights itself, so notes read in the dark and through the fog
  function writeOn(cx: number, cz: number, [wx, wz]: Cell, lines: string, color: string, y = 1.6, glow = 0.35) {
    usedWalls.add(`${cx},${cz},${wx},${wz}`);
    const map = chalk(lines, color);
    const mesh = new THREE.Mesh(writeGeo, new THREE.MeshStandardMaterial({
      map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: glow, alphaTest: 0.3, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    mesh.position.set(cx * C + wx * (C / 2 - 0.01), y, cz * C + wz * (C / 2 - 0.01));
    mesh.rotation.y = Math.atan2(-wx, -wz);
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    scene.add(mesh);
    const wr = { mesh, lines, color };
    writings.push(wr);
    return wr;
  }
  const notes = noteCells.map(([x, z], i) => {
    const wr = writeOn(x, z, wallAhead([x, z]), NOTES[i].wall, "#efe6d6");
    return { x, z, i, got: false, mat: wr.mesh.material };
  });
  writeOn(exitCell[0], exitCell[1], wallAhead(exitCell), FINAL.wall, "#e8473c", 1.6, 0.6); // behind the steel door
  $("tot").textContent = String(notes.length);

  /* ---------- gates: a concrete slab drops from the ceiling behind you ---------- */
  const gateSlabs = gates.map(([x, z]) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(C, WH, C), wallMat);
    slab.position.set(x * C, WH * 1.5, z * C); // hidden above the ceiling
    slab.castShadow = slab.receiveShadow = true;
    slab.visible = false;
    scene.add(slab);
    return { x, z, slab, t: -1 };
  });
  // the chalk font arrives async: redraw everything once it's there
  document.fonts.load('80px "Caveat Brush"').then(() => {
    for (const w of writings) { const m = w.mesh.material; m.map?.dispose(); m.map = m.emissiveMap = chalk(w.lines, w.color); m.needsUpdate = true; }
  }).catch(() => {});

  /* ============================ MODELS ============================ */
  function fit(root: THREE.Object3D, h: number) {
    root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(root, true);
    root.position.sub(b.getCenter(new THREE.Vector3()));
    const holder = new THREE.Group();
    holder.add(root);
    holder.scale.setScalar(h / (b.max.y - b.min.y));
    const outer = new THREE.Group();
    outer.add(holder);
    return outer;
  }
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xb8aea2, roughness: 0.75 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8d877d, roughness: 0.95, bumpMap: tex(wallCv, 3, 3), bumpScale: 3 });
  let face: THREE.Group | null = null;
  const faceMorphs: THREE.Mesh[] = [];
  const morph = (name: string, v: number) => faceMorphs.forEach((m) => { const i = m.morphTargetDictionary?.[name]; if (i != null) m.morphTargetInfluences![i] = v; });

  /* ---------- the one behind you ---------- */
  const it = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.55, 10), bodyMat);
  body.position.y = 0.78; body.castShadow = true;
  it.add(body);
  // arms that hang too long, almost to the knees
  const armGeo = new THREE.CylinderGeometry(0.035, 0.025, 1.15, 6);
  for (const s of [-1, 1]) { const a = new THREE.Mesh(armGeo, bodyMat); a.position.set(s * 0.24, 0.92, 0); a.rotation.z = s * 0.06; a.castShadow = true; it.add(a); }
  const itHead = new THREE.Group();
  itHead.position.y = 1.72;
  it.add(itHead);
  const placeholderHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skinMat);
  itHead.add(placeholderHead);
  it.visible = false;
  scene.add(it);

  // heads pushing out of corridor walls; they turn to follow you
  type WallHead = { obj: THREE.Object3D; base: THREE.Vector3; out: THREE.Vector3; gone: number; q: THREE.Quaternion };
  const wallHeads: WallHead[] = [];
  // straight corridor cells away from the start: wall heads, bulbs and drips go here
  const straight = reachable.filter(([x, z]) => {
    const o = openDirs(x, z);
    return o.length === 2 && o[0][0] === -o[1][0] && o[0][1] === -o[1][1] && dist.get(key([x, z]))! > 4 && MAP[z][x] === ".";
  });
  function placeWallHeads(proto: THREE.Object3D) {
    [0.2, 0.45, 0.7, 0.92].forEach((f, i) => {
      const [x, z] = straight[Math.floor(f * (straight.length - 1))];
      const [ox, oz] = openDirs(x, z)[0];
      const side = i % 2 ? [oz, -ox] : [-oz, ox]; // a wall beside the corridor
      const h = fit(proto.clone(true), 0.34);
      h.traverse((m) => { if (m instanceof THREE.Mesh) { m.material = stoneMat; m.castShadow = true; } });
      const base = new THREE.Vector3(x * C + side[0] * (C / 2 - 0.07), 1.55, z * C + side[1] * (C / 2 - 0.07));
      h.position.copy(base);
      h.lookAt(x * C, 1.55, z * C);
      scene.add(h);
      wallHeads.push({ obj: h, base, out: new THREE.Vector3(-side[0], 0, -side[1]), gone: 0, q: h.quaternion.clone() });
    });
  }

  async function loadModels() {
    const loader = new GLTFLoader();
    const [headG, faceG] = await Promise.all([loader.loadAsync("/horror/head.glb"), loader.loadAsync("/horror/face.glb")]);
    headG.scene.traverse((o) => {
      if (o instanceof THREE.Camera || o instanceof THREE.Light) o.visible = false;
      if (o instanceof THREE.Mesh) { o.material = skinMat; o.castShadow = true; }
    });
    itHead.remove(placeholderHead);
    itHead.add(fit(headG.scene.clone(true), 0.3));
    figures.setHead(() => fit(headG.scene.clone(true), 0.28));
    placeWallHeads(headG.scene);
    faceG.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = new THREE.MeshStandardMaterial({ color: 0xd9cbbd, roughness: 0.6 });
        if (o.morphTargetDictionary) faceMorphs.push(o);
      }
    });
    face = fit(faceG.scene, 0.36);
    camera.add(face);
    // compile every shader now (morph-target face included) so the first jumpscare doesn't stutter
    face.visible = it.visible = true;
    face.position.set(0, 0, -0.5);
    try { await renderer.compileAsync(scene, camera); } catch { /* falls back to compiling on first use */ }
    face.visible = it.visible = false;
  }

  /* ============================ STATE ============================ */
  const pos = new THREE.Vector3(start[0] * C, 0, start[1] * C);
  const [sx, sz] = openDirs(...start)[0];
  let yaw = Math.atan2(sx, sz); // looking away from the only opening = at the first note
  let pitch = 0;
  let running = false, paused = false, ended = false, got = 0, dread = 0, emergency = false, turnedOnce = false;
  const keys: Record<string, boolean> = {};
  const crumbs = [pos.clone()]; // your path, every 30 cm; the thing walks it behind you
  const S = { active: false, hidden: false, outSince: 0, reveal: 0, revealCD: 0, back: 0, lookCD: 0, nextBreath: 0, nextHeart: 0, nextWhisper: 0, flickUntil: 0 };
  let shake = 0;
  let flick = 1, nextFlick = 4, blackUntil = 0, scareT = -1, stepPhase = 0, lastStep = 0, now = 0, nextSlam = 30, behindIdx = 0;
  const yawHist: [number, number][] = [];

  /* ---------- HUD ---------- */
  const vig = $("vig"), fpsEl = $("fps");
  fpsEl.hidden = !SHOW_FPS;
  let cardTimer = 0;
  function card(tag: string, text: string, ms = 10000) {
    $("card-tag").textContent = tag; $("card-text").textContent = text; $("card").classList.add("on");
    clearTimeout(cardTimer);
    cardTimer = window.setTimeout(() => $("card").classList.remove("on"), ms);
  }
  function whisperText(t: string, ms = 1600) {
    const w = $("whisper");
    w.textContent = t;
    w.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.15 }, { opacity: 0.2, offset: 0.3 }, { opacity: 0.85, offset: 0.45 }, { opacity: 0 }], { duration: ms, easing: "ease-out" });
  }
  const redFlash = (ms = 900) => $("red").animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "ease-out" });

  /* ---------- events ---------- */
  function blackout(sec: number, then?: () => void) { blackUntil = now + sec; if (then) setTimeout(then, sec * 1000); }

  function jumpscare() {
    if (!face || scareT >= 0) return;
    scareT = 0; face.visible = true; sfx.scream(); redFlash(1200);
    morph("jawOpen", 1); morph("eyeWide_L", 1); morph("eyeWide_R", 1); morph("browInnerUp", 1);
    morph("mouthStretch_L", 0.8); morph("mouthStretch_R", 0.8); morph("noseSneer_L", 0.6); morph("noseSneer_R", 0.6);
  }

  // caught: you get spun around and it is right in your face
  const G = { t: -1, from: 0, hit: false };
  function grab() {
    if (G.t >= 0) return;
    G.t = 0; G.from = yaw; G.hit = false;
    AP.t = -1; S.reveal = 0; it.visible = false;
    dread = 20; S.lookCD = now + 3; // the forced turn must not count as "you looked back"
    sfx.whoosh();
  }

  // the quiet scare: it just stands there, far ahead, until you look straight at it
  const AP = { t: -1, seen: 0, p: new THREE.Vector3() };
  function apparition() {
    // ahead if there's room, else to the side, else behind you (you'll find it when you turn)
    for (const turn of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const fx = -Math.sin(yaw + turn), fz = -Math.cos(yaw + turn);
      for (let d = 7; d >= 3.5; d -= 0.5) {
        AP.p.set(pos.x + fx * d, 0, pos.z + fz * d);
        const room = [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45], [0, 0]].every(([ox, oz]) => !solidAt(AP.p.x + ox, AP.p.z + oz));
        if (room && clearLine(pos, AP.p)) { AP.t = 0; AP.seen = 0; sfx.lowSting(); return; }
      }
    }
  }

  // the maze changes where you've already been: red writing on a wall ~10-15 m back along your path
  function writeBehind() {
    for (let back = 35; back < 60 && back < crumbs.length; back += 3) {
      const p = crumbs[crumbs.length - 1 - back], cx = Math.round(p.x / C), cz = Math.round(p.z / C);
      if (Math.hypot(pos.x - cx * C, pos.z - cz * C) < 6) continue;
      for (const d of DIRS) if (solid(cx + d[0], cz + d[1]) && !usedWalls.has(`${cx},${cz},${d[0]},${d[1]}`)) {
        writeOn(cx, cz, d, BEHIND[behindIdx++ % BEHIND.length], "#b3261c", 1.45 + Math.random() * 0.3);
        return;
      }
    }
  }

  // the story: each note found moves it one step further
  function collect(n: (typeof notes)[number]) {
    n.got = true; got++;
    n.mat.emissiveIntensity = 0.08; // found: the chalk stops glowing
    $("got").textContent = String(got);
    if (got === notes.length) $("goal").textContent = "Zum Ausgang. Lauf.";
    card(NOTES[n.i].tag, NOTES[n.i].text);
    if (got >= 2) setTimeout(writeBehind, 4000);
    if (got === 1) setTimeout(() => { if (running && !turnedOnce) whisperText("Dreh dich um.", 2200); }, 3500);
    if (got === 2) { S.active = true; setTimeout(() => sfx.whisper(sfx.ear, 2.4), 1500); }
    if (got === 3) { blackout(1.4, apparition); setTimeout(sfx.breath, 300); }
    if (got === 4) { setTimeout(() => { whisperText("Es ist direkt hinter dir."); sfx.whisper(sfx.ear, 1.6); }, 2500); S.back = -2; }
    if (got === 5) { blackout(0.9); setTimeout(() => sfx.step(sfx.ear, 0.5), 200); setTimeout(() => sfx.step(sfx.ear, 0.5), 650); }
    if (got === notes.length) {
      blackout(1.2, () => {
        emergency = true; exitOpen = true; door.visible = false; sfx.door();
        lamp.color.set(0xff6b55); hemi.color.set(0x5a0c08);
        behindIdx = BEHIND.length - 1; writeBehind(); // "LAUF"
        card("Ausgang", "Irgendwo hat sich eine Stahltür geöffnet. Lauf.", 5000);
      });
    }
  }

  function finish() {
    ended = true;
    card(FINAL.tag, FINAL.text, 9000);
    grab();
    setTimeout(() => blackout(99), 1250);
    setTimeout(() => {
      running = false;
      document.exitPointerLock?.();
      const list = $("end-list");
      list.replaceChildren(...[...NOTES, FINAL].map((n) => Object.assign(document.createElement("li"), { textContent: n.text })));
      $("end").hidden = false;
      $("again").focus();
    }, 1700);
  }

  /* ============================ INPUT ============================ */
  window.addEventListener("keydown", (e) => { keys[e.code] = true; });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });
  const look = (dx: number, dy: number, k = 0.0022) => { yaw -= dx * k; pitch = Math.max(-1.3, Math.min(1.3, pitch - dy * k)); };
  const lock = () => { try { const p = canvas.requestPointerLock() as unknown as Promise<void> | undefined; p?.catch?.(() => {}); } catch { /* drag-to-look fallback */ } };
  let locked = false, dragging = false;
  const pause = () => { paused = true; $("pause").hidden = false; $("resume").focus(); };
  document.addEventListener("pointerlockchange", () => {
    locked = document.pointerLockElement === canvas;
    if (!locked && running && !ended && !isTouch) pause();
  });
  document.addEventListener("mousemove", (e) => { if (locked) look(e.movementX, e.movementY); else if (dragging) look(e.movementX, e.movementY, 0.004); });
  canvas.addEventListener("mousedown", () => { if (running && !locked) { lock(); dragging = true; } });
  window.addEventListener("mouseup", () => { dragging = false; });
  // hidden tab: pause (no catch-up jump, no CPU burn)
  document.addEventListener("visibilitychange", () => { if (document.hidden && running && !ended && !paused) pause(); });

  // touch: stick bottom-left walks, anywhere else looks
  const stick = { id: -1, x: 0, y: 0, dx: 0, dy: 0 }, lookT = { id: -1, x: 0, y: 0 };
  const pad = $("touch");
  window.addEventListener("touchstart", (e) => {
    if (!running) return;
    for (const t of e.changedTouches) {
      const r = pad.getBoundingClientRect();
      if (t.clientX < r.right + 30 && t.clientY > r.top - 30) Object.assign(stick, { id: t.identifier, x: r.left + r.width / 2, y: r.top + r.height / 2 });
      else Object.assign(lookT, { id: t.identifier, x: t.clientX, y: t.clientY });
    }
  }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stick.id) { stick.dx = Math.max(-1, Math.min(1, (t.clientX - stick.x) / 50)); stick.dy = Math.max(-1, Math.min(1, (t.clientY - stick.y) / 50)); }
      if (t.identifier === lookT.id) { look(t.clientX - lookT.x, t.clientY - lookT.y, 0.005); lookT.x = t.clientX; lookT.y = t.clientY; }
    }
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stick.id) Object.assign(stick, { id: -1, dx: 0, dy: 0 });
      if (t.identifier === lookT.id) lookT.id = -1;
    }
  });

  $("go").addEventListener("click", () => {
    sfx.init();
    $("start").hidden = true; running = true;
    if (isTouch) pad.classList.add("on"); else lock();
  });
  $("resume").addEventListener("click", () => { paused = false; $("pause").hidden = true; lock(); });
  $("again").addEventListener("click", () => location.reload());

  /* ============================ LOOP ============================ */
  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), sph = new THREE.Sphere(new THREE.Vector3(), 0.45);
  const fwd = new THREE.Vector3(), tmp = new THREE.Vector3(), eye = new THREE.Vector3(), qTmp = new THREE.Quaternion(), slamAt = new THREE.Vector3();

  function clearLine(a: THREE.Vector3, b: THREE.Vector3) {
    const n = Math.ceil(a.distanceTo(b) / 0.15);
    for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; }
    return true;
  }
  function tryMove(dx: number, dz: number) {
    const ok = (x: number, z: number) => !solidAt(x - PR, z - PR) && !solidAt(x + PR, z - PR) && !solidAt(x - PR, z + PR) && !solidAt(x + PR, z + PR);
    if (ok(pos.x + dx, pos.z)) pos.x += dx;
    if (ok(pos.x, pos.z + dz)) pos.z += dz;
  }

  // figures that only move while you don't look (from the 2nd note on)
  const figures = createFigures({ scene, C, corridors: straight, openDirs, solidAt, clearLine });
  const inView = (p: THREE.Vector3) => { sph.center.copy(p); return frustum.intersectsSphere(sph); };

  const updateLife = createLife({
    scene, camera, C, WH, corridors: straight, openDirs, solidAt, clearLine,
    pixelRatio: () => renderer.getPixelRatio(),
  });

  // step resolution down fast when frames drop, up slowly; stop adjusting after a few flip-flops
  function adapt(raw: number) {
    Q.acc += raw; Q.n++;
    if (Q.acc < 1.5) return;
    const fps = Q.n / Q.acc;
    Q.acc = Q.n = 0;
    if (SHOW_FPS) fpsEl.textContent = `${fps.toFixed(0)} fps · dpr ${Q.dpr.toFixed(2)} · ${renderer.info.render.calls} calls · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris`;
    if (Q.flips >= 4) return;
    const dir = fps < 48 && Q.dpr > 0.6 ? -1 : fps > 57 && Q.dpr < Q.cap ? 1 : 0;
    if (!dir) return;
    if (Q.lastDir && dir !== Q.lastDir) Q.flips++;
    Q.lastDir = dir;
    Q.dpr = Math.max(0.6, Math.min(Q.cap, Q.dpr + (dir < 0 ? -0.2 : 0.1)));
    renderer.setPixelRatio(Q.dpr);
    resize();
  }

  function update(dt: number) {
    now += dt;
    const sprint = !!(keys.ShiftLeft || keys.ShiftRight);

    // --- grabbed: 0.28 s spin to face it, then it's in your face until the lights go
    if (G.t >= 0) {
      G.t += dt;
      const k = Math.min(1, G.t / 0.28), e = 1 - (1 - k) ** 3;
      yaw = G.from + Math.PI * e;
      pitch *= 0.8;
      if (k >= 1 && !G.hit) {
        G.hit = true;
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        it.position.set(pos.x + fx * 0.55, 0, pos.z + fz * 0.55);
        it.lookAt(tmp.set(pos.x, 0, pos.z));
        it.visible = true;
        itHead.visible = false; // the screaming face below *is* its head
        jumpscare();
      }
      if (G.t > 1.2) { G.t = -1; it.visible = false; itHead.visible = true; S.hidden = true; S.back = 4; }
    }

    // --- apparition: gone once you've looked right at it for a moment, or after a few seconds
    if (AP.t >= 0) {
      AP.t += dt;
      it.position.copy(AP.p);
      it.lookAt(tmp.set(pos.x, 0, pos.z));
      itHead.rotation.z = 0.35; // head tilted, the only thing that's off
      it.visible = flick > 0.3;
      tmp.set(AP.p.x - pos.x, 0, AP.p.z - pos.z).normalize();
      if (-Math.sin(yaw) * tmp.x - Math.cos(yaw) * tmp.z > 0.97) AP.seen += dt; // looking straight at it
      if (AP.seen > 0.4 || AP.t > 4) { AP.t = -1; it.visible = false; itHead.rotation.z = 0; S.flickUntil = now + 0.3; nextFlick = now + 3; }
    }

    // --- notes you haven't found yet breathe a little
    for (const n of notes) if (!n.got) n.mat.emissiveIntensity = 0.3 + 0.12 * Math.sin(now * 2.2 + n.i);

    // --- move (not while it has you)
    const mx = G.t >= 0 ? 0 : (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + stick.dx;
    const mz = G.t >= 0 ? 0 : (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + stick.dy;
    const len = Math.hypot(mx, mz), moving = len > 0.1;
    if (moving) {
      const sp = ((sprint ? 3.4 : 2.0) * dt) / Math.max(1, len);
      const s = Math.sin(yaw), c = Math.cos(yaw);
      tryMove((mx * c + mz * s) * sp, (-mx * s + mz * c) * sp);
      stepPhase += dt * (sprint ? 11 : 8);
      if (stepPhase - lastStep > Math.PI) {
        lastStep = stepPhase;
        sfx.step();
        if (S.active && !S.hidden && it.visible) sfx.step(sfx.it, 0.3, 0.16 + Math.random() * 0.05); // its steps, a beat after yours
      }
    }
    if (crumbs[crumbs.length - 1].distanceTo(pos) > 0.3) { crumbs.push(pos.clone()); if (crumbs.length > 400) crumbs.shift(); }

    // --- looked back? (a turn of ~130° within 0.8 s)
    yawHist.push([now, yaw]);
    while (yawHist[0][0] < now - 0.8) yawHist.shift();
    if (Math.abs(yaw - yawHist[0][1]) > 2.3 && now > S.lookCD) {
      S.lookCD = now + 2.2; turnedOnce = true;
      dread = Math.max(0, dread - 28); S.back = Math.min(S.back + 1.5, 4);
    }

    // --- gates: two cells past one, it slams shut behind you
    const here = dist.get(key([Math.round(pos.x / C), Math.round(pos.z / C)])) ?? 0;
    for (const g of gateSlabs) {
      if (g.t < 0 && here >= dist.get(key([g.x, g.z]))! + 2) {
        g.t = 0; g.slab.visible = true; closed.add(`${g.x},${g.z}`);
        crumbs.length = 0; crumbs.push(pos.clone()); // what follows you is cut off, for now
      }
      if (g.t >= 0 && g.t < 1) {
        g.t = Math.min(1, g.t + dt / 0.35);
        g.slab.position.y = WH * 1.5 - WH * g.t * g.t; // falls, accelerating
        if (g.t >= 1) { sfx.slam(g.slab.position); shake = 0.12; }
      }
    }
    shake *= 0.88;

    // --- notes, exit
    for (const n of notes) if (!n.got && Math.hypot(pos.x - n.x * C, pos.z - n.z * C) < 1.2) collect(n);
    if (exitOpen && !ended && Math.hypot(pos.x - exitCell[0] * C, pos.z - exitCell[1] * C) < 1) finish();

    // --- dread: grows while it follows (faster when you run), drops when you look back
    if (S.active) dread += dt * (2.6 + (moving ? 1.4 : 0) + (moving && sprint ? 2.5 : 0)) * (emergency ? 1.6 : 1);
    vig.style.opacity = S.active ? Math.min(1, dread / 110).toFixed(2) : "0";
    S.back = Math.max(0, S.back - dt * 0.4);
    if (dread >= 100 && G.t < 0 && scareT < 0) grab(); // it caught you
    if (S.active && dread > 55 && now > S.nextHeart) { S.nextHeart = now + 1.15 - dread * 0.006; sfx.heart(dread / 100); }
    if (S.active && dread > 70 && now > S.nextBreath && !S.hidden) { S.nextBreath = now + 3.5; sfx.breath(); }
    if (S.active && dread > 82 && now > S.nextWhisper) { S.nextWhisper = now + 6; whisperText("Dreh dich um."); sfx.whisper(sfx.ear, 1.4); }
    if (S.active && now > nextSlam) {
      nextSlam = now + 25 + Math.random() * 25;
      camera.getWorldDirection(fwd);
      sfx.slam(slamAt.set(pos.x - fwd.x * 9, EYE, pos.z - fwd.z * 9));
      dread += 8;
    }

    // --- light: random flicker, blackouts
    if (now > nextFlick) { nextFlick = now + 3 + Math.random() * 7 * (1 - dread / 160); S.flickUntil = now + 0.1 + Math.random() * 0.4; }
    let target = now < blackUntil ? 0 : now < S.flickUntil ? (Math.random() < 0.5 ? 0.15 : 0.9) : 1;
    if (reduced && target > 0 && target < 1) target = 0.7;
    flick += (target - flick) * Math.min(1, dt * 30);

    // --- wall heads turn to you, then slip back into the concrete when you get close
    eye.set(pos.x, EYE, pos.z);
    for (const h of wallHeads) {
      if (h.gone >= 1) continue;
      if (h.gone > 0) {
        h.gone = Math.min(1, h.gone + dt * 5);
        h.obj.position.copy(h.base).addScaledVector(h.out, -h.gone * 0.35);
        if (h.gone >= 1) h.obj.visible = false;
        continue;
      }
      const d = h.base.distanceTo(eye);
      if (d < 7) { h.obj.lookAt(eye); qTmp.copy(h.obj.quaternion); h.obj.quaternion.copy(h.q).slerp(qTmp, got >= 3 ? 0.25 : 0.02); h.q.copy(h.obj.quaternion); }
      if (d < 1.4 && got >= 2) { h.gone = 0.01; sfx.crack(); }
    }

    figures.update(dt, eye, inView, flick > 0.3, got >= 2);

    // --- jumpscare: the face rushes in and shakes
    if (face && scareT >= 0) {
      scareT += dt;
      const k = Math.min(1, scareT / 0.07);
      face.position.set((Math.random() - 0.5) * 0.02, -0.02 + (Math.random() - 0.5) * 0.02, -0.95 + k * 0.55);
      face.rotation.set((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
      if (scareT > 0.85) { face.visible = false; scareT = -1; blackout(0.35); }
    }
  }

  // the thing behind you: walks your own path a few metres back and is
  // never there when you look, except now and then for one heartbeat
  function updateStalker(dt: number) {
    const back = Math.max(1.6, 7 - dread * 0.055 + S.back);
    const k = Math.round(back / 0.3);
    const p = crumbs[Math.max(0, crumbs.length - 1 - k)];
    it.position.set(p.x, 0, p.z);
    it.lookAt(tmp.set(pos.x, 0, pos.z));
    itHead.lookAt(camera.position);
    sph.center.set(p.x, 1.2, p.z);
    const seen = crumbs.length > k && frustum.intersectsSphere(sph) && clearLine(camera.position, sph.center) && flick > 0.3;
    if (S.reveal > 0) {
      S.reveal -= dt;
      it.visible = true;
      if (S.reveal <= 0) { it.visible = false; S.hidden = true; S.back = 5; blackUntil = now + 0.25; }
    } else if (seen) {
      if (!S.hidden && dread > 50 && now > S.revealCD && Math.random() < 0.6) {
        S.reveal = 0.45; S.revealCD = now + 9; dread = Math.max(0, dread - 35);
        sfx.sting(); it.visible = true; nextFlick = now;
      } else { S.hidden = true; it.visible = false; }
      S.outSince = now;
    } else {
      if (S.hidden && now - S.outSince > 0.6) S.hidden = false;
      it.visible = !S.hidden && crumbs.length > k;
    }
    if (sfx.ready()) sfx.setPos(sfx.it, sph.center);
  }

  function render(dt: number) {
    camera.position.set(pos.x + (Math.random() - 0.5) * shake, EYE + Math.sin(stepPhase) * 0.035 + (Math.random() - 0.5) * shake, pos.z);
    camera.rotation.set(pitch, yaw, Math.sin(stepPhase * 0.5) * 0.006, "YXZ");
    camera.updateMatrixWorld();
    pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(pv); // what you can see this frame (stalker + figures)
    lamp.intensity = 22 * flick * (scareT >= 0 ? 1.6 : 1);
    hemi.intensity = (emergency ? 0.7 : 0.6) * (0.25 + 0.75 * flick);
    if (S.active && running && !paused && G.t < 0 && AP.t < 0) updateStalker(dt);
    updateLife(dt, flick, dread, running && !paused);
    if (sfx.ready()) {
      camera.getWorldDirection(fwd);
      sfx.setListener(camera.position, fwd);
      sfx.setPos(sfx.ear, tmp.copy(camera.position).addScaledVector(fwd, -0.6)); // whispers come from right behind your head
    }
    renderer.render(scene, camera);
  }

  let last = performance.now(), drewPaused = false;
  function frame(t: number) {
    requestAnimationFrame(frame);
    const raw = (t - last) / 1000, dt = Math.min(0.05, raw);
    last = t;
    if (running && !paused) { update(dt); adapt(raw); drewPaused = false; }
    else if (paused) { if (drewPaused) return; drewPaused = true; } // paused: one frame, then idle
    render(dt);
  }
  requestAnimationFrame(frame);

  const ready = () => { const b = $("go") as HTMLButtonElement; b.disabled = false; b.textContent = "Eintreten"; };
  loadModels().then(ready).catch((e) => { showErr("Modelle: " + e.message); ready(); });
}

// Without the hash the page stays an empty body; changing the hash reloads
// so the gate is checked again. (At the bottom: everything above must exist first.)
window.addEventListener("hashchange", () => location.reload());
if (location.hash.startsWith("#dev#horror")) mount();
