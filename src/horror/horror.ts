// Hinter dir — hidden first-person game (saos.html; only mounts when the URL
// hash is #dev#horror — obscurity, not protection: the hash ships in this file).
//
// The story, top to bottom:
//  1. Horror: a short hub with three side passages. Chalk on the walls says
//     who I am; three items lie at the ends. Something follows you.
//  2. All three found: a heavy door opens somewhere. Behind it stairs lead
//     down; the shotgun lies on the steps.
//  3. Hall 1: ten normal zombies. Kill all ten with one headshot each and the
//     saw bat drops right there; otherwise it drops after hall 2.
//  4. Hall 2: big zombies (2x the life). Hall 3: the boss (20x, throws skulls).
//  5. A mirror. You are one of them.
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
import { createCombat } from "./horror-combat";
import { carveUpper } from "./horror-maze";


const MARKUP = `
  <canvas id="gl"></canvas>
  <div class="hud" id="count"><p><span id="clabel">Gegenstände</span> <b id="got">0</b> / <b id="tot">3</b></p><p id="goal">Irgendwo liegen drei Dinge.</p></div>
  <div class="hud" id="bossbar" hidden><small id="bossname">Der Große</small><i><b id="bosshp"></b></i></div>
  <p class="hud" id="fps" hidden></p>
  <div class="hud" id="waves" hidden><p>Welle <b id="wave-n">1</b> / 5 · <b id="wave-k">0</b> / <b id="wave-t">50</b></p><p>Kopfschüsse <b id="heads">0</b></p></div>
  <div class="hud" id="dot"></div>
  <div class="hud" id="card"><small id="card-tag"></small><span id="card-text"></span></div>
  <div class="hud" id="whisper"></div>
  <div class="hud" id="red"></div>
  <div class="hud" id="vig"></div>
  <canvas class="hud" id="gore"></canvas>
  <canvas class="hud" id="splat" hidden></canvas>
  <div class="hud" id="cut" hidden></div>
  <div id="touch" aria-hidden="true"></div>
  <div class="hud" id="status" hidden><p>Leben <b id="hp">100</b></p><p><span id="wname">Schrot</span> <b id="ammo">0</b></p></div>
  <button id="fire" type="button" hidden>Feuer</button>
  <p id="err"></p>

  <div class="overlay" id="start">
    <div class="box">
      <h1>Hinter <span>dir</span></h1>
      <p>Kevin Schaberl hat hier ein paar Dinge hinterlassen. Finde drei davon, dann geht es weiter.</p>
      <p>Etwas folgt dir. Es kommt näher, solange du nicht hinsiehst.</p>
      <div class="keys">
        <b>Maus</b><span>umsehen</span>
        <b>W A S D</b><span>gehen</span>
        <b>Shift</b><span>rennen (laut, es hört dich)</span>
        <b>Klick</b><span>schießen / zuschlagen</span>
        <b>1 · 2</b><span>Waffe wechseln</span>
        <b>Esc</b><span>Pause</span>
      </div>
      <p class="warn">Kopfhörer empfohlen · Jumpscares · flackerndes Licht</p>
      <button class="btn" id="go" type="button" disabled>lädt …</button>
      <p class="muted dev">Dev, Startpunkt:
        <label><input type="radio" name="from" value="start" checked> Anfang</label>
        <label><input type="radio" name="from" value="stairs"> Treppe</label>
        <label><input type="radio" name="from" value="hall1"> Welle 1</label>
        <label><input type="radio" name="from" value="hall2"> Welle 3</label>
        <label><input type="radio" name="from" value="boss"> Endkampf</label>
      </p>
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

  <div class="overlay" id="dead" hidden>
    <div class="box">
      <h1>Du bist <span>tot</span></h1>
      <p>Sie waren zu viele. Oder du warst zu langsam.</p>
      <button class="btn" id="retry" type="button">Noch mal rein</button>
    </div>
  </div>

  <div class="overlay" id="end" hidden>
    <div class="box">
      <h1>Du bist <span>raus</span></h1>
      <p>Das war Kevin. Oder das, was von ihm übrig ist:</p>
      <ul class="end-list" id="end-list"></ul>
      <button class="btn" id="again" type="button">Noch mal rein</button>
    </div>
  </div>`;

/* ============================ LEVEL ============================
   Upper level (floor 0 m) and lower level (floor -2.8 m, halls 5.6 m high).
   # wall · . corridor (upper) · S start, facing the wall
   a b c  the three items, at corners of the maze up top (random each time)
   D      heavy door, opens once you have all three
   v      stairs down (east)
   , h H B  lower floor: corridor, hall 1, hall 2, boss hall (twisty, with pillars)
   G      gate: drops behind you once you're in the next hall
   1 2 3  exit doors of hall 1, 2 and the boss hall: open when it's cleared
   r      mirror room · W the glass · m the room behind the glass (unreachable) */
// the upper part (x 0..14) is replaced by a fresh random maze on every load, see horror-maze.ts
const MAP = carveUpper([
  "####################################################################",
  "#..b#........c################################BBBBBBBBBBB###########",
  "#.###.#####.##################################BB##BBBB##B###########",
  "#...#.....#...########hhhh#hhhh###HHH#HHHHH###BB##BBBB##B###########",
  "###.#####.###.########h##h#h##h###H#H#H##HH###BBBBB##BBBB###########",
  "#S....#...#...########h#hhhhh#h###H#HHH#HH####BBBBB##BBBB##rrrWmmm##",
  "#####.#.###.#..Dvvvv,Ghhh###hhh1,GHH##H#HHH2,GBBBBBBBBBBB3,rrrWmmmm#",
  "#...#.#.#...#.########h#hhhhh#h###H#HHHHH#H###BBBBBBBBBBB##rrrWmmm##",
  "#.#.#.#.#.###.########h##h#h##h###HHH#H##HH###BBBBB##BBBB###########",
  "#.#.#...#.#a#.########hhhh#hhhh####HHHHH#HH###BB##B##B##B###########",
  "#.#.#####.#.#.################################BB##BBBB##B###########",
  "#.........#...################################BBBBBBBBBBB###########",
  "####################################################################",
]);
const UPPER = new Set([".", "S", "a", "b", "c", "D"]);
const DEPTH = 2.8; // how far the stairs go down

// chalk on the walls up top, in the order you pass them (drafts: edit freely)
const WALL_TEXTS = [
  "Hi, ich bin Kev.",
  "Ich bau gern\nunterschiedlichen Stuff.",
  "Warum ein Spiel?\nIch zock gern.\nZombie-Modi vor allem.",
  "Aktuell tob ich mich\nmit Web-Projekten aus.",
  "„Geht nicht“ heißt meistens:\nnoch nicht verstanden.",
  "Wer nach mir kommt,\nsoll meinen Code\nohne mich verstehen.",
];
// the three items: name, what the info card says
type Item = { id: "a" | "b" | "c"; name: string; text: string };
const ITEMS: Item[] = [
  { id: "a", name: "Zollstock", text: "Fast sieben Jahre Bodenleger und Sonnenschutztechniker, danach zwei Jahre Sanierung unseres Wohnhauses. Bevor ich Software gebaut habe, habe ich mit den Händen gebaut." },
  { id: "b", name: "Laptop", text: "Junior Software Developer. TypeScript-Fullstack, Bootcamp und viel Eigenregie. Raum Linz, remote im DACH-Raum, sofort verfügbar." },
  { id: "c", name: "Foto", text: "Ausgleich finde ich in der Natur und bei meiner Familie, allen voran bei meinem Sohn." },
];
// red writing that appears on walls you already passed
const BEHIND = ["DREH DICH UM", "ICH BIN\nHINTER DIR", "NICHT\nRENNEN", "DU HAST MICH\nGESEHEN", "LAUF"];

const C = 2.6; // cell size (m)
const WH = 2.8; // ceiling height (above the upper floor)
const EYE = 1.62;
const PR = 0.28; // player radius
const ROWS = MAP.length, COLS = MAP[0].length;

type Cell = [number, number];
const DIRS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cell = (cx: number, cz: number) => (cz < 0 || cz >= ROWS || cx < 0 || cx >= COLS ? "#" : MAP[cz][cx]);
const openDirs = (x: number, z: number) => DIRS.filter(([dx, dz]) => cell(x + dx, z + dz) !== "#");
const key = (c: Cell) => `${c[0]},${c[1]}`;
const cellsOf = (ch: string) => { const out: Cell[] = []; for (let z = 0; z < ROWS; z++) for (let x = 0; x < COLS; x++) if (MAP[z][x] === ch) out.push([x, z]); return out; };
function findCell(ch: string): Cell {
  const c = cellsOf(ch)[0];
  if (!c) throw new Error(`map has no ${ch}`);
  return c;
}
// floor height: 0 up top, -DEPTH below, a straight ramp across the stairs
const stairs = cellsOf("v");
const stairFrom = (stairs[0][0] - 0.5) * C, stairTo = (stairs[stairs.length - 1][0] + 0.5) * C;
function floorAt(x: number, z: number) {
  const k = cell(Math.round(x / C), Math.round(z / C));
  if (k === "v") return -DEPTH * Math.min(1, Math.max(0, (x - stairFrom) / (stairTo - stairFrom)));
  return UPPER.has(k) ? 0 : -DEPTH;
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
  const start = findCell("S");
  const open = new Set<string>(); // doors that are open (D, 1, 2, 3)
  const closed = new Set<string>(); // gates that have dropped
  const solid = (cx: number, cz: number) => {
    const k = cell(cx, cz);
    if (k === "#" || k === "W" || closed.has(`${cx},${cz}`)) return true;
    return (k === "D" || k === "1" || k === "2" || k === "3") && !open.has(k);
  };
  const solidAt = (x: number, z: number) => solid(Math.round(x / C), Math.round(z / C));
  const charAt = (x: number, z: number) => cell(Math.round(x / C), Math.round(z / C));

  // BFS from the start over everything walkable: distances along the way
  const dist = new Map<string, number>([[key(start), 0]]);
  const reachable: Cell[] = [start];
  for (let i = 0; i < reachable.length; i++) {
    const [x, z] = reachable[i];
    for (const [dx, dz] of DIRS) {
      const n: Cell = [x + dx, z + dz];
      if (!["#", "W", "m"].includes(cell(...n)) && !dist.has(key(n))) { dist.set(key(n), dist.get(key([x, z]))! + 1); reachable.push(n); }
    }
  }
  const halls = { h: cellsOf("h"), H: cellsOf("H"), B: cellsOf("B") };
  // the walkable cell closest to the middle of a hall
  const hallCenter = (cells: Cell[]) => {
    const x = cells.reduce((a, c) => a + c[0], 0) / cells.length, z = cells.reduce((a, c) => a + c[1], 0) / cells.length;
    const [cx, cz] = cells.reduce((a, c) => (Math.hypot(c[0] - x, c[1] - z) < Math.hypot(a[0] - x, a[1] - z) ? c : a));
    return new THREE.Vector3(cx * C, 0, cz * C);
  };
  const glass = cellsOf("W");
  const mirrorX = glass[0][0] * C; // the mirror plane

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
  const fog = new THREE.FogExp2(0x050505, 0.11);
  scene.fog = fog;
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
  const floorMat = new THREE.MeshStandardMaterial({ map: tex(floorCv, 1, 1), bumpMap: tex(floorCv, 1, 1), bumpScale: 1.5, roughness: 0.85 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: tex(concreteCanvas(256, 77, [70, 66, 60]), COLS, ROWS), roughness: 1 });

  // walls: every '#' one instance of a box reaching from the lower floor to the ceiling -> one draw call
  const walls = cellsOf("#");
  const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(C, WH + DEPTH, C), wallMat, walls.length);
  const m4 = new THREE.Matrix4();
  walls.forEach(([x, z], i) => wallMesh.setMatrixAt(i, m4.makeTranslation(x * C, (WH - DEPTH) / 2, z * C)));
  wallMesh.castShadow = wallMesh.receiveShadow = true;
  scene.add(wallMesh);
  // floor tiles at their height (one draw call), steps on the stairs, one ceiling for everything
  const tiles = reachable.concat(cellsOf("m")).filter(([x, z]) => !["v", "W"].includes(MAP[z][x]));
  const floorMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(C, C).rotateX(-Math.PI / 2), floorMat, tiles.length);
  tiles.forEach(([x, z], i) => floorMesh.setMatrixAt(i, m4.makeTranslation(x * C, floorAt(x * C, z * C), z * C)));
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
  const STEPS = 4; // per stair cell
  const stepMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(C / STEPS, 1, C), floorMat, stairs.length * STEPS);
  stairs.forEach(([x, z], i) => {
    for (let k = 0; k < STEPS; k++) {
      const sx = (x - 0.5 + (k + 0.5) / STEPS) * C, top = floorAt(sx, z * C);
      stepMesh.setMatrixAt(i * STEPS + k, m4.makeScale(1, top + DEPTH + 0.01, 1).setPosition(sx, (top - DEPTH) / 2, z * C));
    }
  });
  stepMesh.castShadow = stepMesh.receiveShadow = true;
  scene.add(stepMesh);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(COLS * C, ROWS * C), ceilMat);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(((COLS - 1) * C) / 2, WH, ((ROWS - 1) * C) / 2);
  scene.add(ceiling);

  /* ---------- doors and gates: concrete / steel slabs that move up and down ---------- */
  const doorMat = new THREE.MeshStandardMaterial({ map: tex(concreteCanvas(256, 5, [96, 52, 32]), 1, 1), metalness: 0.6, roughness: 0.6 });
  type Slab = { id: string; x: number; z: number; mesh: THREE.Mesh; from: number; to: number; t: number };
  const slabs: Slab[] = [];
  const slabGeo = new THREE.BoxGeometry(C, WH + DEPTH, C);
  const slabDown = (WH - DEPTH) / 2, slabUp = slabDown + WH + DEPTH; // closed / hidden above the ceiling
  for (const id of ["D", "1", "2", "3"]) {
    const [x, z] = findCell(id);
    const mesh = new THREE.Mesh(slabGeo, doorMat);
    mesh.position.set(x * C, slabDown, z * C);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    slabs.push({ id, x, z, mesh, from: slabDown, to: slabDown, t: 1 });
  }
  for (const [x, z] of cellsOf("G")) {
    const mesh = new THREE.Mesh(slabGeo, wallMat);
    mesh.position.set(x * C, slabUp, z * C);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.visible = false;
    scene.add(mesh);
    slabs.push({ id: key([x, z]), x, z, mesh, from: slabUp, to: slabUp, t: 1 });
  }
  const slab = (id: string) => slabs.find((s) => s.id === id)!;
  // doors rise slowly with a rumble; gates drop fast with a slam
  function openDoor(id: string) {
    const s = slab(id);
    Object.assign(s, { from: slabDown, to: slabUp, t: 0 });
    open.add(id);
    sfx.doorAt(s.mesh.position);
  }
  function dropGate(x: number, z: number) {
    const s = slab(key([x, z]));
    if (s.t < 1 || closed.has(s.id)) return;
    s.mesh.visible = true;
    Object.assign(s, { from: slabUp, to: slabDown, t: 0 });
    closed.add(s.id);
  }
  function moveSlabs(dt: number) {
    for (const s of slabs) {
      if (s.t >= 1) continue;
      const opening = s.to > s.from;
      s.t = Math.min(1, s.t + dt / (opening ? 2.6 : 0.35));
      const e = opening ? s.t * s.t * (3 - 2 * s.t) : s.t * s.t;
      s.mesh.position.y = s.from + (s.to - s.from) * e;
      if (s.t >= 1 && !opening) { sfx.slam(s.mesh.position); shake = 0.12; }
      if (s.t >= 1 && opening) s.mesh.visible = false;
    }
  }

  /* ---------- the mirror: a glass pane; behind it the same room, mirrored ---------- */
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fb4c0, metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.16, depthWrite: false });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(glass.length * C, WH + DEPTH), glassMat);
  pane.rotation.y = -Math.PI / 2;
  pane.position.set(mirrorX, (WH - DEPTH) / 2, (glass[0][1] + (glass.length - 1) / 2) * C);
  scene.add(pane);

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
  // who I am, chalked along the hub (the first one is the wall you face at the start)
  // the first text is the wall you face at the start; the rest go on walls of straight passages,
  // spread from near the start to deep in the maze, so you read them while you search
  const upper = reachable.filter(([x, z]) => UPPER.has(MAP[z][x]) && MAP[z][x] !== "D");
  const far = Math.max(...upper.map((c) => dist.get(key(c))!));
  const textSpots: [number, number, Cell][] = [[start[0], start[1], [-openDirs(...start)[0][0], -openDirs(...start)[0][1]] as Cell]];
  for (let i = 1; i < WALL_TEXTS.length; i++) {
    const want = (far * i) / WALL_TEXTS.length;
    const c = upper.filter(([x, z]) => MAP[z][x] === "." && openDirs(x, z).length === 2 && !textSpots.some((t) => t[0] === x && t[1] === z))
      .sort((a, b) => Math.abs(dist.get(key(a))! - want) - Math.abs(dist.get(key(b))! - want))[0];
    const side = DIRS.find(([dx, dz]) => cell(c[0] + dx, c[1] + dz) === "#")!;
    textSpots.push([c[0], c[1], side]);
  }
  WALL_TEXTS.forEach((t, i) => writeOn(textSpots[i][0], textSpots[i][1], textSpots[i][2], t, "#efe6d6"));
  // the heavy door says what it wants
  {
    const d = slab("D"), map = chalk("Drei Dinge.", "#e8473c");
    const m = new THREE.Mesh(writeGeo, new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.4, alphaTest: 0.3, roughness: 1 }));
    m.position.set(-C / 2 - 0.01, 1.6 - slabDown, 0);
    m.rotation.y = -Math.PI / 2;
    d.mesh.add(m);
    writings.push({ mesh: m, lines: "Drei Dinge.", color: "#e8473c" });
  }

  /* ---------- the three items: simple shapes, glowing a little, turning in the air ---------- */
  function itemModel(id: Item["id"]) {
    const g = new THREE.Group();
    const glow = (color: number, i = 0.35) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i, roughness: 0.6 });
    if (id === "a") { // folding rule: yellow segments in a zigzag
      for (let k = 0; k < 5; k++) {
        const seg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.006), glow(0xe8c21c));
        seg.position.set(-0.3 + k * 0.15, (k % 2) * 0.06, 0); seg.rotation.z = k % 2 ? -0.4 : 0.4;
        g.add(seg);
      }
    } else if (id === "b") { // laptop: base, lid, a lit screen
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.24), glow(0x2a2c30, 0.1));
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.015), glow(0x2a2c30, 0.1));
      lid.position.set(0, 0.11, -0.12); lid.rotation.x = -0.25;
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshBasicMaterial({ color: 0x7fb4ff }));
      screen.position.set(0, 0.11, -0.11); screen.rotation.x = -0.25;
      g.add(base, lid, screen);
    } else { // photo in a frame, warm
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.02), glow(0x5a3a22, 0.15));
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.22), new THREE.MeshBasicMaterial({ color: 0xd8b48a }));
      photo.position.z = 0.011;
      g.add(frame, photo);
    }
    g.traverse((o) => { o.castShadow = true; });
    return g;
  }
  const items = ITEMS.map((it) => {
    const [x, z] = findCell(it.id);
    const obj = itemModel(it.id);
    obj.position.set(x * C, 0.95, z * C);
    scene.add(obj);
    return { ...it, obj, got: false };
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
  let running = false, paused = false, ended = false, got = 0, dread = 0, turnedOnce = false, batDropped = false;
  const keys: Record<string, boolean> = {};
  const crumbs = [pos.clone()]; // your path, every 30 cm; the thing walks it behind you
  const S = { active: false, hidden: false, outSince: 0, reveal: 0, revealCD: 0, back: 0, lookCD: 0, nextBreath: 0, nextHeart: 0, nextWhisper: 0, flickUntil: 0 };
  let shake = 0, fallen = 0, fovKick = 0, kick = 0; // kick: the view jumping up after a shot // fallen: how far the camera has sunk in the ending
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

  /* ---------- part 1: three items, then the door ---------- */
  function takeItem(it: (typeof items)[number]) {
    it.got = true; got++;
    scene.remove(it.obj);
    sfx.pickup();
    $("got").textContent = String(got);
    card(it.name, it.text);
    if (got >= 2) setTimeout(writeBehind, 4000);
    if (got === 1) { S.active = true; setTimeout(() => sfx.whisper(sfx.ear, 2.4), 1500); }
    if (got === 2) blackout(1.4, apparition);
    if (got === 3) {
      $("goal").textContent = "Da ist eine Tür aufgegangen.";
      setTimeout(() => openDoor("D"), 1200); // you hear it before you see it
    }
  }

  /* ---------- part 2: the halls ---------- */
  type Phase = "puzzle" | "stairs" | "normals" | "bigs" | "boss" | "mirror" | "end";
  let phase: Phase = "puzzle";
  // five waves, each 50 bigger than the last (50 … 250). Waves 1–2 in hall 1, 3–5 in hall 2;
  // from wave 3 on, one in five is a big one. A short breather between waves.
  const WAVES = [1, 2, 3, 4, 5].map((n) => ({ n, total: 50 * n, bigShare: n >= 3 ? 0.2 : 0, hall: n <= 2 ? "h" : "H" }));
  const LAST_IN_HALL1 = 2, BREATHER = 5; // seconds
  const maxAlive = (n: number) => 8 + 2 * n, spawnEvery = (n: number) => Math.max(0.5, 1.1 - 0.12 * n);
  // spawned counts the ones still loading too
  const W = { n: 0, spawned: 0, killed: 0, total: 0, bigLeft: 0, nextSpawn: 0, nextWave: 0, pending: 0, drop: 0, heads: 0 };
  // zombies come in from the far side of the hall, away from you
  function spawnIn(cells: Cell[], kind: "normal" | "big" | "boss", n: number) {
    const far = cells.filter(([x, z]) => Math.hypot(x * C - pos.x, z * C - pos.z) > 9);
    for (let i = 0; i < n; i++) {
      const [x, z] = (far.length ? far : cells)[Math.floor(Math.random() * (far.length || cells.length))];
      combat.spawn(kind, new THREE.Vector3(x * C + (Math.random() - 0.5), 0, z * C + (Math.random() - 0.5)));
    }
    W.spawned += n;
  }
  // big ones mixed in evenly over the wave
  function spawnMixed(n: number) {
    const cells = WAVES[W.n - 1].hall === "h" ? halls.h : halls.H;
    for (let i = 0; i < n; i++) {
      const big = W.bigLeft > 0 && Math.random() < W.bigLeft / Math.max(1, W.total - W.spawned);
      if (big) W.bigLeft--;
      spawnIn(cells, big ? "big" : "normal", 1);
    }
  }
  function startWave(n: number) {
    const wave = WAVES[n - 1];
    W.n = n; W.total = wave.total; W.bigLeft = Math.round(wave.total * wave.bigShare);
    W.spawned = 0; W.killed = 0; W.pending = 0; W.nextSpawn = now + spawnEvery(n);
    spawnMixed(6);
    whisperText(`Welle ${n}`, 1800);
    $("goal").textContent = n === 1 ? "Kopf ist einfacher." : n === 3 ? "Manche sind größer." : "";
    waveHud();
  }
  function enterHall(next: Phase, gate: Cell) {
    phase = next;
    dropGate(...gate);
    ($("got").parentElement as HTMLElement).hidden = true; // items are done; the wave counter is top right now
    if (next === "normals") startWave(1);
    if (next === "bigs") startWave(LAST_IN_HALL1 + 1);
    if (next === "boss") { W.total = 1; W.spawned = 0; W.killed = 0; spawnIn(halls.B, "boss", 1); $("count").hidden = true; $("waves").hidden = true; $("bossbar").hidden = false; }
  }
  // keep the hall busy while fewer than the wave's limit are up
  function feedWave() {
    if (W.spawned >= W.total || now < W.nextSpawn || W.spawned - W.killed >= maxAlive(W.n)) return;
    W.nextSpawn = now + spawnEvery(W.n);
    spawnMixed(Math.min(2, W.total - W.spawned, maxAlive(W.n) - (W.spawned - W.killed)));
  }
  const waveHud = () => {
    $("waves").hidden = false;
    $("wave-n").textContent = String(W.n);
    $("wave-k").textContent = String(W.killed); $("wave-t").textContent = String(W.total);
    $("heads").textContent = String(W.heads);
  };

  // headshot kills unlock things: 10 the saw, 50 a pistol, 100 a sword that hits everyone in front,
  // 200 faster legs, 250 the boss's own trick: throwing skulls, twice a second
  const REWARDS: [number, () => void][] = [
    [10, () => { if (!combat.has.bat) { combat.addPickup("bat", tmp.set(pos.x - Math.sin(yaw) * 1.5, 0, pos.z - Math.cos(yaw) * 1.5).clone()); card("10 Kopfschüsse", "Säge-Schläger. Ein Schlag auf den Kopf reicht. Taste 2.", 6000); } }],
    [50, () => { combat.addPickup("pistol", tmp.set(pos.x - Math.sin(yaw) * 1.5, 0, pos.z - Math.cos(yaw) * 1.5).clone()); card("50 Kopfschüsse", "Pistole. Unendlich Munition, schnell, genau. Taste 3.", 6000); }],
    [100, () => { combat.addPickup("sword", tmp.set(pos.x - Math.sin(yaw) * 1.5, 0, pos.z - Math.cos(yaw) * 1.5).clone()); card("100 Kopfschüsse", "Schwert. Trifft alles vor dir. Taste 4.", 6000); }],
    [200, () => { fast = 1.25; card("200 Kopfschüsse", "Du bist schneller.", 5000); }],
    [250, () => { combat.unlockSkulls(); card("250 Kopfschüsse", "Du kannst jetzt, was er kann: F oder Rechtsklick wirft Schädel. Zweimal pro Sekunde.", 7000); }],
  ];
  let fast = 1; // movement multiplier (reward at 200)

  // ammo from the dead, sparingly: half the normal ones leave 3 shells, a big one 4 (60 %);
  // medkits are rare (2.5 %)
  function onKill(k: { kind: string; hits: number; head: boolean; at: THREE.Vector3 }) {
    W.killed++;
    if (k.head && k.kind !== "boss") {
      W.heads++;
      for (const [at, give] of REWARDS) if (W.heads === at) give();
    }
    if (k.kind === "normal" && Math.random() < 0.5) combat.addPickup("shells", k.at, 3);
    if (k.kind === "big" && Math.random() < 0.6) combat.addPickup("shells", k.at, 4);
    if (k.kind !== "boss" && Math.random() < 0.025) combat.addPickup("health", k.at.clone().add(new THREE.Vector3(0.5, 0, 0.3)));
    if (phase === "normals" || phase === "bigs") waveHud();
    hud();
  }
  function waveDone() {
    if (phase === "normals" || phase === "bigs") {
      if (W.n === LAST_IN_HALL1) { openDoor("1"); $("goal").textContent = "Die Tür ist auf. Weiter."; if (!combat.has.bat) combat.addPickup("bat", hallCenter(halls.h)); return; }
      if (W.n === WAVES.length) { openDoor("2"); $("goal").textContent = "Weiter. Der Große wartet."; return; }
      W.pending = W.n + 1; W.nextWave = now + BREATHER;
      $("goal").textContent = `Durchatmen. Welle ${W.pending} kommt.`;
    } else if (phase === "boss") {
      openDoor("3");
      $("bossbar").hidden = true;
      $("goal").textContent = "";
      card("", "Es ist still. Da hinten ist noch ein Raum.", 5000);
    }
  }

  /* ---------- part 3: the mirror ---------- */
  let mirror: Awaited<ReturnType<typeof combat.mirrorZombie>> | null = null;
  let mirrorT = -1, cineT = -1, cinePitch = 0;
  function updateMirror(dt: number, moving: boolean) {
    if (!mirror) return;
    mirror.mixer.update(dt);
    if (cineT >= 0) return; // glass is gone: it stops copying you
    // your reflection: same distance behind the glass, facing the mirrored way
    const mx = 2 * mirrorX - pos.x;
    mirror.root.position.set(mx, floorAt(pos.x, pos.z), pos.z);
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    mirror.root.lookAt(mx - fx, mirror.root.position.y, pos.z + fz);
    mirror.setWalking(moving);
    // close to the glass and looking at it: that's when it sinks in
    if (mirrorT < 0 && pos.x > mirrorX - 6 && fx > 0.7) mirrorT = 0;
    if (mirrorT >= 0) {
      mirrorT += dt;
      if (mirrorT > 1.2 && mirrorT - dt <= 1.2) { sfx.lowSting(); whisperText("Das bist du.", 2600); }
      if (mirrorT > 5 && mirrorT - dt <= 5) $("goal").textContent = "…";
    }
  }
  // your shot (or swing) at the glass: it breaks, and then it's over
  function breakMirror() {
    cineT = 0; cinePitch = pitch;
    $("count").hidden = $("status").hidden = $("dot").hidden = true;
    pane.visible = false;
    sfx.glass();
    const g = new THREE.Vector3();
    for (const [, z] of glass) for (let k = 0; k < 4; k++) combat.burst(g.set(mirrorX - 0.1, floorAt(pos.x, pos.z) + 0.5 + Math.random() * 2.5, z * C + (Math.random() - 0.5) * C), 12, 0.75, 0.85, 0.9, 4);
    $("goal").textContent = "";
  }
  // the end, in one take: you fall back looking up, blood, one last shot, black
  function updateCine(dt: number) {
    if (cineT < 0) return;
    cineT += dt;
    const k = Math.min(1, Math.max(0, (cineT - 0.5) / 1.3)), e = k * k * (3 - 2 * k);
    pitch = cinePitch + (1.35 - cinePitch) * e; // head goes back until you only see the ceiling
    fallen = e * 1.1;
    if (cineT > 0.9 && cineT - dt <= 0.9) mirror?.strike();
    if (cineT > 1.9 && cineT - dt <= 1.9) splatter();
    if (cineT > 2.8 && cineT - dt <= 2.8) { sfx.shotgun(); $("cut").hidden = false; }
    if (cineT > 4.6 && phase !== "end") { phase = "end"; finish(); }
  }
  // a bat hit: a few drops on the lens, near the side the blood came from, fading out
  function goreOnLens(n: number) {
    const cv = $("gore") as HTMLCanvasElement;
    if (cv.width !== innerWidth || cv.height !== innerHeight) { cv.width = innerWidth; cv.height = innerHeight; }
    const g = cv.getContext("2d")!, W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const x = W * (0.05 + Math.random() * 0.35), y = H * (0.15 + Math.random() * 0.7), r = 8 + Math.random() * Math.min(W, H) * 0.05;
      g.fillStyle = `rgba(${110 + Math.random() * 40},0,0,0.9)`;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      for (let k = 0; k < 10; k++) { const a = Math.random() * 7, d = r * (1 + Math.random() * 1.6); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + Math.random() * 3, 0, 7); g.fill(); }
      if (Math.random() < 0.5) g.fillRect(x - 1.5, y, 3, r * (1 + Math.random() * 3)); // runs down
    }
    cv.getAnimations().forEach((a) => a.cancel());
    cv.animate([{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1400, easing: "ease-in", fill: "forwards" });
  }
  // blood on the lens: blobs, spray, drips, drawn once onto a canvas over the view
  function splatter() {
    const cv = $("splat") as HTMLCanvasElement;
    cv.width = innerWidth; cv.height = innerHeight;
    const g = cv.getContext("2d")!, W = cv.width, H = cv.height;
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * W, y = Math.random() * H * 0.8, r = 20 + Math.random() * Math.min(W, H) * 0.12;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(120,0,0,0.95)"); grd.addColorStop(0.7, "rgba(90,0,0,0.85)"); grd.addColorStop(1, "rgba(60,0,0,0)");
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = "rgba(100,0,0,0.9)";
      for (let k = 0; k < 18; k++) { const a = Math.random() * 7, d = r * (1 + Math.random()); g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + Math.random() * 4, 0, 7); g.fill(); }
      if (Math.random() < 0.6) g.fillRect(x - 2, y, 3 + Math.random() * 3, r + Math.random() * H * 0.3); // drip
    }
    cv.hidden = false;
  }

  function finish() {
    ended = true;
    blackout(99);
    setTimeout(() => {
      running = false;
      document.exitPointerLock?.();
      const lines = [...WALL_TEXTS.map((t) => t.replace(/\n/g, " ")), ...ITEMS.map((i) => `${i.name}: ${i.text}`)];
      $("end-list").replaceChildren(...lines.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
      $("end").hidden = false;
      $("again").focus();
    }, 1500);
  }

  /* ============================ INPUT ============================ */
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    const slots = { Digit1: "shotgun", Digit2: "bat", Digit3: "pistol", Digit4: "sword" } as const;
    if (e.code in slots) combat.select(slots[e.code as keyof typeof slots]);
    if (e.code === "KeyF" && running && !paused) combat.throwOwnSkull();
  });
  // mouse wheel: next weapon you have
  window.addEventListener("wheel", (e) => {
    const order = (["shotgun", "bat", "pistol", "sword"] as const).filter((w) => combat.has[w]);
    if (order.length < 2 || !combat.weapon) return;
    const i = order.indexOf(combat.weapon);
    combat.select(order[(i + (e.deltaY > 0 ? 1 : order.length - 1)) % order.length]);
  }, { passive: true });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });
  const look = (dx: number, dy: number, k = 0.0022) => { if (cineT >= 0) return; yaw -= dx * k; pitch = Math.max(-1.3, Math.min(1.3, pitch - dy * k)); };
  const lock = () => { try { const p = canvas.requestPointerLock() as unknown as Promise<void> | undefined; p?.catch?.(() => {}); } catch { /* drag-to-look fallback */ } };
  let locked = false, dragging = false;
  const pause = () => { paused = true; $("pause").hidden = false; $("resume").focus(); };
  document.addEventListener("pointerlockchange", () => {
    locked = document.pointerLockElement === canvas;
    if (!locked && running && !ended && !isTouch) pause();
  });
  document.addEventListener("mousemove", (e) => { if (locked) look(e.movementX, e.movementY); else if (dragging) look(e.movementX, e.movementY, 0.004); });
  canvas.addEventListener("mousedown", (e) => {
    if (running && !locked) { lock(); dragging = true; return; }
    if (running && !paused && e.button === 0) pull();
    if (running && !paused && e.button === 2) combat.throwOwnSkull();
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
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

  $("fire").addEventListener("touchstart", (e) => { e.stopPropagation(); pull(); }, { passive: true });
  // shoot / swing; at the mirror, aimed at the glass, that's the end
  function pull() {
    if (cineT >= 0) return;
    const facingGlass = -Math.sin(yaw) > 0.6, reach = combat.weapon === "bat" ? 3.2 : 99;
    const atMirror = phase === "mirror" && mirror && pos.x > mirrorX - 6 && mirrorX - pos.x < reach && facingGlass;
    if (atMirror && (combat.weapon === "bat" || combat.ammo > 0)) { combat.fire(); breakMirror(); return; }
    combat.fire();
  }
  $("retry").addEventListener("click", () => location.reload());
  $("go").addEventListener("click", () => {
    sfx.init();
    $("start").hidden = true; running = true;
    if (isTouch) pad.classList.add("on"); else lock();
    const from = (document.querySelector<HTMLInputElement>('input[name="from"]:checked')?.value ?? "start");
    if (from === "start") setTimeout(() => { if (running && !turnedOnce) whisperText("Dreh dich um.", 2200); }, 4000);
    else jumpTo(from as "stairs" | "hall1" | "hall2" | "boss");
  });

  // dev shortcut: skip ahead. Doors you'd have opened stand open, items you'd have found are found.
  function jumpTo(where: "stairs" | "hall1" | "hall2" | "boss") {
    const openNow = (id: string) => { open.add(id); const s = slab(id); s.mesh.visible = false; s.t = 1; };
    for (const it of items) if (!it.got) { it.got = true; got++; scene.remove(it.obj); }
    $("got").textContent = String(got);
    openNow("D");
    S.active = false; dread = 0;
    const gates = cellsOf("G");
    if (where === "stairs") {
      phase = "stairs";
      pos.set(stairs[0][0] * C - C, 0, stairs[0][1] * C); // just above the top step
      $("goal").textContent = "Runter.";
    } else if (where === "hall1" || where === "hall2") {
      combat.grant("shotgun"); onPickup("shotgun");
      const g = where === "hall1" ? gates[0] : gates[1];
      if (where === "hall2") { openNow("1"); combat.grant("bat"); combat.grant("shotgun"); }
      pos.set((g[0] + 2) * C, 0, g[1] * C); // two cells into the hall: the gate drops behind you
      enterHall(where === "hall1" ? "normals" : "bigs", g);
    } else {
      openNow("1"); openNow("2");
      phase = "bigs"; W.total = 0; // walking into the boss hall starts the fight
      // the end fight as if you'd earned everything on the way
      combat.grant("pistol"); combat.grant("sword"); combat.grant("bat"); combat.grant("shotgun"); combat.unlockSkulls(); fast = 1.25;
      onPickup("shotgun");
      const [gx, gz] = cellsOf("G")[2];
      pos.set((gx - 1) * C, 0, gz * C);
      $("goal").textContent = "Der Große wartet.";
    }
    yaw = -Math.PI / 2; pitch = 0; // facing east, down the level
    crumbs.length = 0; crumbs.push(pos.clone());
  }
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
    const free = !ok(pos.x, pos.z); // already overlapping something (a slab came down on you): let you walk out
    if (free || ok(pos.x + dx, pos.z)) pos.x += dx;
    if (free || ok(pos.x, pos.z + dz)) pos.z += dz;
  }

  // figures that only move while you don't look (from the 2nd note on)
  const figures = createFigures({ scene, C, corridors: straight, openDirs, solidAt, clearLine });
  const inView = (p: THREE.Vector3) => { sph.center.copy(p); return frustum.intersectsSphere(sph); };

  /* ---------- how zombies find you round corners: a distance map from your cell ---------- */
  const flow = new Map<string, number>();
  let flowFrom = "";
  function updateFlow() {
    const here: Cell = [Math.round(pos.x / C), Math.round(pos.z / C)];
    if (key(here) === flowFrom) return;
    flowFrom = key(here);
    flow.clear(); flow.set(flowFrom, 0);
    const q = [here];
    for (let i = 0; i < q.length; i++) {
      const [x, z] = q[i], d = flow.get(key([x, z]))!;
      if (d > 40) continue;
      for (const [dx, dz] of DIRS) {
        const n: Cell = [x + dx, z + dz];
        if (!solid(...n) && !flow.has(key(n))) { flow.set(key(n), d + 1); q.push(n); }
      }
    }
  }
  // where a zombie at p should head: straight at you if nothing is in between, else the next cell downhill
  function steer(p: THREE.Vector3, out: THREE.Vector3) {
    if (clearLine(p, pos)) return out.set(pos.x, 0, pos.z);
    const cx = Math.round(p.x / C), cz = Math.round(p.z / C);
    let best: Cell = [cx, cz], bestD = flow.get(key(best)) ?? Infinity;
    for (const [dx, dz] of DIRS) {
      const d = flow.get(key([cx + dx, cz + dz]));
      if (d !== undefined && d < bestD) { best = [cx + dx, cz + dz]; bestD = d; }
    }
    return out.set(best[0] * C, 0, best[1] * C);
  }

  /* ---------- the Doom part ---------- */
  let health = 100, flashUntil = 0;
  const combat = createCombat({
    scene, camera, solidAt, floorAt, steer, clearLine,
    // a shot you feel: muzzle flash lights the room, the view kicks up and punches in
    onShot: () => { flashUntil = now + 0.06; shake = Math.max(shake, 0.07); kick = 0.075; fovKick = Math.max(fovKick, 3); },
    // crosshair flashes red when it hit, bigger and with a tick on a headshot
    onBossPhase: (n) => {
      $("bossname").textContent = n === 1 ? "Der Große" : n === 2 ? "Der Große · wütend" : "Der Große · rasend";
      whisperText(n === 2 ? "Er rennt." : "Jetzt alles.", 1800);
      shake = 0.2;
    },
    onHitmarker: (head) => {
      const dot = $("dot");
      dot.classList.remove("hit", "headhit"); void dot.offsetWidth; dot.classList.add(head ? "headhit" : "hit");
      if (head) sfx.tick();
    },
    // a bat hit you can feel: the world stops for a beat, the view jolts, blood on the lens
    onImpact: (head, kill) => {
      hitstopUntil = performance.now() + (kill ? 110 : 70);
      shake = Math.max(shake, head ? 0.16 : 0.1);
      fovKick = head ? 7 : 4;
      goreOnLens(head ? 6 : 3);
    },
    onHurt: (d) => {
      if (ended) return;
      health = Math.max(0, health - d);
      redFlash(400); shake = 0.1;
      if (health <= 0) die();
    },
    onKill,
  });
  // the shotgun on the stairs; shells and medkits in the halls. Ammo budget: 30 + 15 = 45 shells.
  // Without a single headshot you need 10x2 + 4x4 = 36 (the boss gets the bat) — miss more than 20 % and you run dry.
  const midStair = stairs[Math.floor(stairs.length / 2)];
  combat.addPickup("shotgun", new THREE.Vector3(midStair[0] * C, 0, midStair[1] * C));
  const spot = (cells: Cell[], f: number) => { const [x, z] = cells[Math.floor(f * (cells.length - 1))]; return new THREE.Vector3(x * C, 0, z * C); };
  combat.addPickup("health", spot(halls.h, 0.5));
  combat.addPickup("health", spot(halls.H, 0.5));
  combat.addPickup("health", spot(halls.B, 0.2));
  combat.addPickup("health", spot(halls.B, 0.8));
  const hud = () => {
    $("hp").textContent = String(health);
    const names = { shotgun: "Schrot", bat: "Säge", pistol: "Pistole", sword: "Schwert" };
    $("wname").textContent = combat.weapon ? names[combat.weapon] : "";
    $("ammo").textContent = combat.weapon === "shotgun" ? String(combat.ammo) : "∞";
  };
  function onPickup(kind: string) {
    if (kind === "health") health = Math.min(100, health + 25);
    if (kind === "shotgun") {
      $("status").hidden = false; $("dot").classList.add("cross");
      if (isTouch) $("fire").hidden = false;
      card("Schrotflinte", "30 Schuss. Kopf: ein Treffer. Körper: zwei. Mehr gibt es nicht.", 7000);
      $("goal").textContent = "Runter.";
    }

    hud();
  }
  function die() {
    ended = true; blackout(99);
    setTimeout(() => { running = false; document.exitPointerLock?.(); $("dead").hidden = false; $("retry").focus(); }, 900);
  }

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

    // --- items turn in the air
    for (const it of items) if (!it.got) { it.obj.rotation.y += dt * 1.2; it.obj.position.y = 0.95 + Math.sin(now * 2 + it.id.charCodeAt(0)) * 0.05; }

    // --- move (not while it has you)
    const still = G.t >= 0 || cineT >= 0; // it has you / the end is playing
    const mx = still ? 0 : (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + stick.dx;
    const mz = still ? 0 : (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + stick.dy;
    const len = Math.hypot(mx, mz), moving = len > 0.1;
    if (moving) {
      const armed = combat.weapon !== null;
      const sp = ((armed ? (sprint ? 4.8 : 3.2) * fast : sprint ? 3.4 : 2.0) * dt) / Math.max(1, len);
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

    // --- the story, by where you are
    moveSlabs(dt);
    shake *= 0.88;
    for (const it of items) if (!it.got && Math.hypot(pos.x - it.obj.position.x, pos.z - it.obj.position.z) < 1.1) takeItem(it);
    const here = charAt(pos.x, pos.z);
    if (phase === "puzzle" && here === "v") {
      phase = "stairs";
      S.active = false; it.visible = false; dread = 0; // the horror part is over; now they come at you
      crumbs.length = 0; crumbs.push(pos.clone());
    }
    // a gate only drops once you're two cells past it (dropping it while you still
    // stand half in its cell would trap you inside the wall)
    const gates = cellsOf("G"), past = (g: Cell) => (dist.get(key([Math.round(pos.x / C), Math.round(pos.z / C)])) ?? 0) >= dist.get(key(g))! + 2;
    if (phase === "stairs" && here === "h" && combat.weapon && past(gates[0])) enterHall("normals", gates[0]);
    if (phase === "normals" && here === "H" && past(gates[1])) enterHall("bigs", gates[1]);
    if (phase === "bigs" && here === "B" && past(gates[2])) enterHall("boss", gates[2]);
    if ((phase === "normals" || phase === "bigs") && W.total) {
      feedWave();
      if (W.killed >= W.total) { waveDone(); W.total = 0; }
    }
    if (W.pending && now >= W.nextWave) startWave(W.pending);
    if (phase === "boss" && W.total) {
      const hp = combat.bossHealth();
      $("bosshp").style.width = `${Math.max(0, hp) * 100}%`;
      if (W.killed >= W.total) { waveDone(); W.total = 0; }
    }
    if (phase === "boss" && !W.total && here === "r") {
      phase = "mirror";
      void combat.mirrorZombie().then((m) => { mirror = m; scene.add(m.root); });
    }
    // no shells and no bat yet while zombies are still coming: don't leave you stuck
    if (combat.has.shotgun && !combat.has.bat && combat.ammo === 0 && W.total && !batDropped) {
      batDropped = true;
      combat.addPickup("bat", tmp.set(pos.x - Math.sin(yaw) * 1.5, 0, pos.z - Math.cos(yaw) * 1.5));
      card("Leer", "Die Flinte ist leer. Da liegt was.", 5000);
    }
    updateFlow();
    combat.update(dt, pos, floorAt(pos.x, pos.z) + EYE, moving, onPickup);
    if (combat.weapon) hud();
    updateMirror(dt, moving);
    updateCine(dt);

    // --- dread: grows while it follows (faster when you run), drops when you look back
    if (S.active) dread += dt * (2.6 + (moving ? 1.4 : 0) + (moving && sprint ? 2.5 : 0));
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
    camera.position.set(pos.x + (Math.random() - 0.5) * shake, floorAt(pos.x, pos.z) + EYE - fallen + Math.sin(stepPhase) * 0.035 + (Math.random() - 0.5) * shake, pos.z);
    kick *= 0.86;
    camera.rotation.set(pitch + kick, yaw, Math.sin(stepPhase * 0.5) * 0.006 + combat.swingLean() * 0.05, "YXZ"); // lean into the swing
    // FOV punch on a hit, settles back fast
    fovKick *= 0.82;
    const fov = 72 - fovKick;
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
    pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(pv); // what you can see this frame (stalker + figures)
    lamp.intensity = 22 * flick * (scareT >= 0 ? 1.6 : 1);
    // down in the halls it's brighter and redder: you need to see what's coming
    const below = phase !== "puzzle";
    hemi.intensity = (below ? 3.2 : 0.6) * (0.25 + 0.75 * flick);
    if (below && fog.density > 0.065) { fog.density = 0.065; hemi.color.set(0xa0503a); hemi.groundColor.set(0x2a140c); }
    if (S.active && running && !paused && G.t < 0 && AP.t < 0) updateStalker(dt);
    updateLife(dt, flick, dread, running && !paused);
    if (sfx.ready()) {
      camera.getWorldDirection(fwd);
      sfx.setListener(camera.position, fwd);
      sfx.setPos(sfx.ear, tmp.copy(camera.position).addScaledVector(fwd, -0.6)); // whispers come from right behind your head
    }
    if (now < flashUntil) { lamp.intensity *= 3; hemi.intensity += 1.5; }
    renderer.render(scene, camera);
    if (combat.weapon) { // the weapon: own scene, drawn over the world
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(combat.viewScene, camera);
      renderer.autoClear = true;
    }
  }

  let last = performance.now(), drewPaused = false, hitstopUntil = 0;
  function frame(t: number) {
    requestAnimationFrame(frame);
    const raw = (t - last) / 1000, dt = Math.min(0.05, raw);
    last = t;
    if (running && !paused && t < hitstopUntil) { render(0); return; } // hit-stop: everything holds still for a beat
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
