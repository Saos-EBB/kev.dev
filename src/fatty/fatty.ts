// Fatty — hidden slap page (saos.html; only mounts on #dev#fatty, behind the
// password screen like every #dev page).
//
// One figure, nothing else. The cursor is a hand; swiping it through him is a
// slap, the faster the harder. His fat has mass: it gets shoved, sloshes and
// swings back; head and torso rock away from the blow. The story:
//   - too many slaps in a row: he covers up
//   - 45 slaps: he's had enough, turns round and waddles off — slap his back
//   - 60 slaps: he goes down and stays down (and still wobbles)
// That's level 1. At 150 slaps two more drop from the sky (level 2, 15 each),
// then four (level 3, 150 each). After that: a screen telling you to get help.
// He grunts when hit, whines when he covers up, pants as he runs, groans when
// he lands and wheezes in between — a synthesized voice (formant filters on a
// low buzz), like every other sound here.
//
// The jiggle, all in the vertex shader after skinning, never along the vertex
// normal (the mesh is split at UV and shading seams; normals differ there and
// the surface would tear):
//  - Mass: the fat is clustered into clumps (belly, chest, love handles, butt,
//    upper arms, thighs …), each a damped spring riding on its bone. Slaps
//    shove the clumps near the hit, and every move of the bone swings them —
//    each step of the run, the fall, the head jolt. Vertices follow the clumps
//    round them, blended so overlaps don't add up.
//  - Smack: a short ripple running out from the hit (up to 8 live)
//      off = dir * amp * fat * falloff(d) * e^(-decay t) * sin(freq t - k d)
// `fat` is a per-vertex mask from the bone weights (belly, chest, upper arms,
// thighs yes; hands, feet, face barely) and how far the vertex sits from its
// bone. The same mask makes him fatter on load: thick parts pushed out from
// the bone, the belly sagging a little. The normal tilts with the slopes so
// the light rolls with the fat.
//
// Model: "Fatty" by Drummyfish (CC0, opengameart.org/content/fatty), exported
// to public/fatty/ with three poses (stand, cover, pushup) — see NOTICE.md.
// He has no walk cycle; the run is procedural, rotating bones on top of "stand".
import "./fatty.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

// one open right hand, palm to the viewer; outline drawn once under all fills
const HAND_SHAPES = `
  <rect x="30" y="16" width="17" height="62" rx="8.5"/>
  <rect x="49" y="6" width="17" height="70" rx="8.5"/>
  <rect x="68" y="12" width="17" height="64" rx="8.5"/>
  <rect x="86" y="30" width="15" height="48" rx="7.5"/>
  <rect x="10" y="64" width="18" height="48" rx="9" transform="rotate(-38 19 88)"/>
  <path d="M28 60 h73 v34 q0 36 -37 36 q-36 0 -36 -36 z"/>`;
const HAND = `
  <svg viewBox="0 0 120 140" width="100%" height="100%">
    <g fill="#3b1c20" stroke="#3b1c20" stroke-width="9" stroke-linejoin="round">${HAND_SHAPES}</g>
    <g fill="#f6cfba">${HAND_SHAPES}</g>
    <g fill="none" stroke="#c98a78" stroke-width="2.5" stroke-linecap="round">
      <path d="M42 100 q18 12 38 0"/><path d="M46 86 q14 -6 30 -2"/>
    </g>
  </svg>`;

const MARKUP = `
  <canvas id="gl"></canvas>
  <p class="hud" id="count">Level <b id="lvl">1</b> · Slaps <b id="n">0</b></p>
  <div class="hud" id="tags"></div>
  <p class="hud" id="banner" hidden></p>
  <p class="hud" id="say" hidden></p>
  <p class="hud" id="hint">lädt …</p>
  <div id="fx" aria-hidden="true"></div>
  <div id="hand" aria-hidden="true"><div id="palm">${HAND}</div></div>
  <div id="end" hidden>
    <h1>Such dir Hilfe.</h1>
    <p><b id="end-n">0</b> Slaps auf sieben Fattys.</p>
    <button id="again" type="button">Nochmal</button>
  </div>
`;

const HEIGHT = 1.8; // m
const HITS = 8; // live slaps the shader keeps
// meters and seconds throughout; converted to model units once loaded
// the smack: a short ripple at the hit — surface detail, the mass does the rest
const WAVE = { freq: 17, decay: 4.5, k: 7, radius: 0.35, amp: 0.05 };
const LIFE = 1.5; // s until a slap's slot is free again
// the mass: fat clumps on springs. Low and loose = heavy.
const MASS = { clumps: 12, hz: 2.3, damping: 0.07, inertia: 1, slap: 3.4, max: 0.2, breath: 0.01 };
const BULK = { inflate: 0.035, sag: 0.025 }; // how much fatter he gets on load
const MAX_OFF = 0.3; // all jiggle together never moves a vertex further
// The hand slaps by moving: swiping into him (or turning round inside him) is a
// slap, as hard as the hand was fast, in screen heights per second.
const SLAP = { min: 0.35, full: 4, gap: 110 }; // min speed, speed for the hardest slap, ms between slaps
const strengthOf = (speed: number) => THREE.MathUtils.clamp(0.25 + (speed / innerHeight / SLAP.full) * 1.45, 0.25, 1.7);
const COVER_AFTER = 7; // slaps within COVER_WINDOW s → he covers up
const COVER_WINDOW = 2;
const FLEE_AT = 45, DOWN_AT = 60;
const RUN = { hz: 1.7, speed: 0.4, far: 1.3, bob: 0.07, turn: 0.7 }; // a fat man's run: slow, bouncy

// How much each bone's flesh moves. Keys are bone names without spaces,
// dots and side (GLTFLoader turns "hand upper.L" into "hand_upperL").
const FAT: [RegExp, number][] = [
  [/^back/, 1],
  [/^legupper/, 0.9],
  [/^handupper/, 0.85],
  [/^(hand|leg)lower/, 0.3],
  [/^head/, 0.15],
  [/^(palm|finger|foot)/, 0],
];
const boneKey = (name: string) => name.replace(/\.?[LR]$/, "").toLowerCase().replace(/[^a-z]/g, "");
const fatOf = (name: string) => FAT.find(([re]) => re.test(boneKey(name)))?.[1] ?? 0;

const HEADER = /* glsl */ `
uniform vec3 uHitPos[${HITS}];
uniform vec3 uHitDir[${HITS}];
uniform float uHitT[${HITS}];
uniform float uHitAmp[${HITS}];
uniform float uTime, uFreq, uDecay, uK, uRadius, uMax;
uniform vec3 uClumpC[${MASS.clumps}];
uniform float uClumpR[${MASS.clumps}];
uniform vec3 uClumpOff[${MASS.clumps}];
attribute float fat;
// rest: bind-pose position (the clumps live there); p: skinned; n: skinned normal
void jiggle(vec3 rest, vec3 p, vec3 n, out vec3 off, out vec3 slope) {
  // mass: each clump drags the flesh round it
  vec3 m = vec3(0.0), ms = vec3(0.0);
  float gs = 0.0;
  for (int c = 0; c < ${MASS.clumps}; c++) {
    vec3 q = rest - uClumpC[c];
    float r2 = uClumpR[c] * uClumpR[c];
    float g = exp(-2.0 * dot(q, q) / r2);
    if (g < 0.004) continue;
    m += uClumpOff[c] * g;
    ms += q * (4.0 * g * dot(uClumpOff[c], n) / r2);
    gs += g;
  }
  float k = fat / max(gs, 1.0); // blended: where clumps overlap they share, not stack
  off = m * k;
  slope = ms * k;
  // smack: the ripple out from the hit; phase < 0 means it isn't here yet
  for (int i = 0; i < ${HITS}; i++) {
    float t = uTime - uHitT[i];
    if (uHitAmp[i] <= 0.0 || t < 0.0) continue;
    vec3 r = p - uHitPos[i];
    float d = length(r);
    float w = uFreq * t - uK * d;
    if (d > uRadius || w < 0.0) continue;
    float env = uHitAmp[i] * fat * exp(-uDecay * t) * (1.0 - smoothstep(0.0, uRadius, d));
    off += uHitDir[i] * env * sin(w);
    vec3 rt = r - n * dot(r, n);
    float l = length(rt);
    if (l > 1e-4) slope += rt / l * env * -uK * cos(w);
  }
  slope -= n * dot(slope, n);
  float l = length(off);
  if (l > uMax) off *= uMax / l; // stacked slaps never tear the mesh
}
`;
// skinned position early, so the normal can tilt before it's transformed
const NORMAL = /* glsl */ `
vec3 jOff = vec3(0.0);
#ifdef USE_SKINNING
{
  vec4 sv = bindMatrix * vec4(position, 1.0);
  vec4 sk = boneMatX * sv * skinWeight.x + boneMatY * sv * skinWeight.y + boneMatZ * sv * skinWeight.z + boneMatW * sv * skinWeight.w;
  vec3 slope;
  jiggle(position, (bindMatrixInverse * sk).xyz, normalize(objectNormal), jOff, slope);
  float sl = length(slope);
  if (sl > 0.7) slope *= 0.7 / sl; // big waves: shade them, don't crease them
  objectNormal = normalize(objectNormal + slope * 0.8);
}
#endif
#include <defaultnormal_vertex>
`;

type Fatty = ReturnType<ReturnType<typeof makeFattyFactory>>;

export async function mount() {
  document.title = "Fatty";
  document.body.innerHTML = MARKUP;
  const $ = (id: string) => document.getElementById(id)!;
  const canvas = $("gl") as HTMLCanvasElement;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);

  const key = new THREE.DirectionalLight(0xfff0e0, 2.4);
  key.position.set(1.6, 3.2, 3);
  const rimL = new THREE.DirectionalLight(0x8fb4ff, 2.2);
  rimL.position.set(-3, 2, -2.5);
  const rimR = new THREE.DirectionalLight(0xff8fc4, 1.6);
  rimR.position.set(3, 2.4, -2);
  scene.add(key, rimL, rimR, new THREE.HemisphereLight(0xfff4ea, 0x251a22, 0.5));

  const tex = new THREE.TextureLoader();
  const loadTex = (url: string, srgb: boolean) =>
    tex.loadAsync(url).then((t) => {
      t.flipY = false; // glTF UVs
      t.wrapS = t.wrapT = THREE.RepeatWrapping; // head, hands and feet sit outside 0..1, like in the .blend
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    });
  let gltf, map, bump;
  try {
    [gltf, map, bump] = await Promise.all([
      new GLTFLoader().loadAsync("/fatty/fatty.glb"),
      loadTex("/fatty/fatty.jpg", true),
      loadTex("/fatty/fatty_bump.jpg", false),
    ]);
  } catch (e) {
    $("hint").textContent = `Fatty ließ sich nicht laden: ${e instanceof Error ? e.message : e}`;
    return;
  }

  const clock = new THREE.Clock();
  const hud = { say: $("say"), banner: $("banner"), tags: $("tags") };
  const makeFatty = makeFattyFactory({ gltf, map, bump, scene, clock, hud });

  // --- levels: one Fatty, then two, then four. Each needs `goal` slaps.
  const LEVELS = [
    { count: 1, goal: 150 },
    { count: 2, goal: 15 },
    { count: 4, goal: 150 },
  ];
  const SPACING = 1.5; // m between them
  let level = -1, fatties: Fatty[] = [], total = 0, switching = false, over = false;
  const frame = new THREE.Box3();
  function startLevel(i: number) {
    level = i;
    switching = false;
    fatties.forEach((f) => f.remove());
    const { count, goal } = LEVELS[i];
    // a row; on a tall screen two rows, the back one half a step over
    const cols = camera.aspect < 1 && count > 2 ? Math.ceil(count / 2) : count;
    const spots = Array.from({ length: count }, (_, k) => {
      const row = Math.floor(k / cols), col = k % cols;
      return new THREE.Vector3((col - (cols - 1) / 2 + row * 0.5) * SPACING, 0, -row * 1.8);
    });
    const mid = spots.reduce((a, p) => a + p.x, 0) / count;
    fatties = spots.map((p, k) => makeFatty(p.x - mid, p.z, goal, i === 0 ? 0 : 3.5 + k * 0.6));
    frameAll();
    // cut, don't glide: the banner covers it
    camAt.copy(camBase);
    look.set(camBase.x, HEIGHT * 0.52, frameZ());
    $("lvl").textContent = String(i + 1);
    if (i > 0) banner(`Level ${i + 1}`, `${count} Stück. Jeder ${goal} Slaps.`);
  }
  function banner(title: string, sub: string) {
    hud.banner.innerHTML = `<b>${title}</b><small>${sub}</small>`;
    hud.banner.hidden = false;
    hud.banner.classList.remove("show");
    void hud.banner.offsetWidth; // restart the animation
    hud.banner.classList.add("show");
  }
  function checkLevel() {
    if (switching || over || !fatties.every((f) => f.count >= f.goal)) return;
    switching = true;
    if (level === LEVELS.length - 1) return void setTimeout(theEnd, 1200);
    setTimeout(() => startLevel(level + 1), 1400);
  }
  function theEnd() {
    over = true;
    $("end-n").textContent = String(total);
    $("end").hidden = false;
    $("hand").classList.remove("on");
    document.body.classList.remove("own-cursor");
  }
  $("again").addEventListener("click", () => location.reload());

  // --- camera: a little below their chests, looking up — they should loom.
  // Framed on all of them; follows when they run off or go down.
  const look = new THREE.Vector3(0, HEIGHT * 0.52, 0), lookTo = new THREE.Vector3();
  const camBase = new THREE.Vector3(), camTo = new THREE.Vector3(), camAt = new THREE.Vector3();
  function frameAll() {
    frame.makeEmpty();
    for (const f of fatties) frame.union(f.box);
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // more room on top once there are counters over their heads
    const halfH = (frame.max.y - frame.min.y) / 2 + (fatties.length > 1 ? 0.45 : 0.12), halfW = (frame.max.x - frame.min.x) / 2 + 0.1;
    const dist = Math.max(halfH / t, halfW / (t * camera.aspect)) + (frame.max.z - frame.min.z) / 2;
    camBase.set((frame.min.x + frame.max.x) / 2, HEIGHT * 0.3, frame.max.z + dist * 1.04 - 0.4);
    if (camAt.lengthSq() === 0) camAt.copy(camBase);
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (fatties.length) frameAll();
  }
  addEventListener("resize", resize);
  resize();

  // --- the hand
  const hand = $("hand"), palm = $("palm"), fx = $("fx");
  const fine = matchMedia("(pointer: fine)").matches;
  if (fine) document.body.classList.add("own-cursor");
  let handTimer = 0;
  let lean = 0, lastMove = 0;
  function moveHand(x: number, y: number, vx = 0) {
    lean += (THREE.MathUtils.clamp(vx / 40, -30, 30) - lean) * 0.35;
    hand.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${lean.toFixed(1)}deg)`;
  }
  function swing(x: number, y: number, hit: boolean, touch: boolean, vx: number) {
    moveHand(x, y);
    const sx = vx < 0 ? -1 : 1; // wind up on the side it came from
    hand.classList.add("on");
    palm.animate(
      [
        { transform: `translate(${-34 * sx}px, -30px) rotate(${-38 * sx}deg) scale(1.12)` },
        { transform: `translate(${6 * sx}px, 6px) rotate(${14 * sx}deg) scale(0.88)`, offset: 0.4 },
        { transform: "none" },
      ],
      { duration: hit ? 300 : 220, easing: "cubic-bezier(.2,.8,.3,1)" },
    );
    if (touch) {
      clearTimeout(handTimer);
      handTimer = window.setTimeout(() => hand.classList.remove("on"), 450);
    }
    if (!hit) return;
    const b = document.createElement("div");
    b.className = "burst";
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.innerHTML = `<svg viewBox="-50 -50 100 100"><polygon points="${star()}"/></svg>`;
    b.addEventListener("animationend", () => b.remove());
    fx.append(b);
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || over) return;
    moveHand(e.clientX, e.clientY, (e.movementX / Math.max(e.timeStamp - lastMove, 4)) * 1000); // px/s
    lastMove = e.timeStamp;
    hand.classList.add("on");
  });
  document.documentElement.addEventListener("pointerleave", () => fine && hand.classList.remove("on"));

  // --- slapping
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const trail: { x: number; y: number; t: number }[] = [];
  let down = false, lastSlap = -1e9, shake = 0;

  // A slap is armed while the hand is off them (~150 ms), slow, or swinging back
  // the other way; moving over one faster than SLAP.min fires it. So one swipe
  // through is one slap, and wiping back and forth is a slap each way.
  let armed = true, offSince = 0;
  const lastDir = new THREE.Vector2();
  function handMoved({ x, y, t, touch }: { x: number; y: number; t: number; touch: boolean }) {
    const { vx, vy } = velocity(t), speed = Math.hypot(vx, vy) / innerHeight;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const isOver = fatties.some((f) => f.over(ray.ray));
    const dir = new THREE.Vector2(vx, vy).normalize();
    if (isOver) offSince = 0;
    else offSince ||= t;
    // off them for a moment (not just the gap between arm and belly), slow, or turned round
    if ((offSince && t - offSince > 150) || speed < SLAP.min * 0.6 || dir.dot(lastDir) < -0.3) armed = true;
    if (isOver && armed && speed > SLAP.min && t - lastSlap > SLAP.gap && slap(x, y, t)) {
      armed = false;
      lastDir.copy(dir);
      swing(x, y, true, touch, vx);
    }
  }

  function velocity(now: number) {
    while (trail.length > 2 && now - trail[0].t > 80) trail.shift();
    if (trail.length < 2) return { vx: 0, vy: 0 };
    const a = trail[0], b = trail[trail.length - 1], dt = Math.max(b.t - a.t, 8) / 1000;
    return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
  }

  function slap(x: number, y: number, now: number, minStrength = 0) {
    if (over) return false;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(fatties.flatMap((f) => f.meshes), false)[0];
    if (!hit) return false;
    const who = fatties.find((f) => f.meshes.includes(hit.object as THREE.SkinnedMesh))!;
    const { vx, vy } = velocity(now), speed = Math.hypot(vx, vy);
    const strength = Math.max(strengthOf(speed), minStrength);
    // into him along the view ray, bent by the swipe
    const swipe = new THREE.Vector3()
      .setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(vx)
      .addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), -vy);
    const dirW = ray.ray.direction.clone();
    if (speed > 1) dirW.addScaledVector(swipe.normalize(), Math.min(speed / 1500, 1) * 0.9).normalize();

    who.slapped(hit.point, dirW, strength, now);
    shake = Math.min(shake + 0.014 * strength, 0.04);
    slapSound(strength);
    lastSlap = now;
    $("n").textContent = String(++total);
    $("hint").classList.add("gone");
    checkLevel();
    return true;
  }

  canvas.addEventListener("pointerdown", (e) => {
    initAudio();
    down = true;
    canvas.setPointerCapture(e.pointerId);
    const hit = slap(e.clientX, e.clientY, e.timeStamp, 0.6);
    armed = !hit;
    swing(e.clientX, e.clientY, hit, e.pointerType !== "mouse", 0);
  });
  addEventListener("pointermove", (e) => {
    trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    // every event, not once a frame: a quick back-and-forth fits between two frames
    if (e.pointerType === "mouse" || down) handMoved({ x: e.clientX, y: e.clientY, t: e.timeStamp, touch: e.pointerType !== "mouse" });
  });
  const up = () => (down = false);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  startLevel(0);
  $("hint").textContent = fine ? "Fahr mit der Hand durch ihn. Je schneller, desto fester." : "Wisch über ihn. Je schneller, desto fester.";

  const tmp = new THREE.Vector3();
  renderer.setAnimationLoop(() => {
    const dt = Math.max(Math.min(clock.getDelta(), 0.05), 1e-3), t = clock.getElapsedTime();
    for (const f of fatties) shake = Math.max(shake, f.update(dt, t));

    // the camera follows a little: they run off, they go down
    const k = 1 - Math.exp(-dt * 2.5);
    lookTo.set(0, 0, 0);
    let downs = 0;
    for (const f of fatties) {
      lookTo.add(f.body.position);
      if (f.phase === "down") downs++;
    }
    lookTo.divideScalar(fatties.length);
    const lying = downs === fatties.length;
    lookTo.y = lying ? 0.35 : HEIGHT * 0.52;
    look.lerp(lookTo, k);
    camTo.copy(camBase).add(tmp.set(0, lying ? -0.2 : 0, (lookTo.z - frameZ()) * 0.55));
    camAt.lerp(camTo, k);
    shake *= Math.exp(-dt * 14);
    camera.position.copy(camAt).add(tmp.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
    camera.lookAt(look);
    camera.updateMatrixWorld();
    for (const f of fatties) f.placeTag(camera);
    renderer.render(scene, camera);
    restoreBones();
  });
  function frameZ() {
    return fatties.reduce((a, f) => a + f.home.z, 0) / fatties.length;
  }
}

// --- bones on top of the pose. The mixer only writes a bone when the clip's
// value changes (the poses are constant), so everything goes on for one
// render and the pose is put back after.
const touched = new Map<THREE.Bone, THREE.Quaternion>();
const qa = new THREE.Quaternion(), qp = new THREE.Quaternion(), qi = new THREE.Quaternion();
function rotateWorld(b: THREE.Bone | undefined, axis: THREE.Vector3, angle: number) {
  if (!b || Math.abs(angle) < 1e-5) return;
  if (!touched.has(b)) touched.set(b, b.quaternion.clone());
  b.parent!.getWorldQuaternion(qp);
  qa.setFromAxisAngle(axis, angle).premultiply(qi.copy(qp).invert()).multiply(qp);
  b.quaternion.premultiply(qa);
  b.updateMatrixWorld(true);
}
function restoreBones() {
  for (const [b, q] of touched) b.quaternion.copy(q);
  touched.clear();
}

type Shared = {
  gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] };
  map: THREE.Texture;
  bump: THREE.Texture;
  scene: THREE.Scene;
  clock: THREE.Clock;
  hud: { say: HTMLElement; banner: HTMLElement; tags: HTMLElement };
};

// Everything that's the same for every Fatty is worked out once here: size,
// fat mask, the bulk, the clumps — the clones share the geometry. Returns the
// function that puts a new one in the scene.
function makeFattyFactory({ gltf, map, bump, scene, clock, hud }: Shared) {
  const proto = gltf.scene;
  proto.rotation.y = Math.PI; // exported facing away
  const protoMeshes: THREE.SkinnedMesh[] = [];
  proto.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) protoMeshes.push(o as THREE.SkinnedMesh);
  });

  // pose first, then size: 1.8 m tall, feet on the floor, centered
  const protoMixer = new THREE.AnimationMixer(proto);
  protoMixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, "stand")).play();
  protoMixer.update(0);
  proto.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(proto, true);
  proto.scale.setScalar(HEIGHT / (box.max.y - box.min.y));
  proto.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(proto, true);
  const c = box.getCenter(new THREE.Vector3());
  proto.position.set(-c.x, -box.min.y, -c.z);
  proto.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(proto, true);
  const u = 1 / protoMeshes[0].getWorldScale(new THREE.Vector3()).x; // model units per meter

  let boneRadius = new Float32Array(0); // per bone, model units: how far the flesh reaches
  let topBone = new Int32Array(0);
  for (const m of protoMeshes) {
    const mask = fatMask(m, BULK.inflate * u, BULK.sag * u);
    m.geometry.setAttribute("fat", new THREE.BufferAttribute(mask.fat, 1));
    if (m === protoMeshes[0]) {
      boneRadius = mask.maxDist.map((d) => d + BULK.inflate * u);
      topBone = mask.top;
    }
  }
  const clumpData = findClumps(protoMeshes[0], topBone, u);

  // soft blob instead of real shadows: the skinned jiggle would need its own depth material
  const blob = document.createElement("canvas");
  blob.width = blob.height = 128;
  const bx = blob.getContext("2d")!, grad = bx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.7)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  bx.fillStyle = grad;
  bx.fillRect(0, 0, 128, 128);
  const shadowGeo = new THREE.PlaneGeometry(1.6, 1);
  const shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blob), transparent: true, depthWrite: false });
  const shadowSize = new THREE.Vector2((box.max.x - box.min.x) / 1.6 + 0.3, box.max.z - box.min.z + 0.4);

  const massK = (Math.PI * 2 * MASS.hz) ** 2, massC = 2 * MASS.damping * Math.PI * 2 * MASS.hz;
  const ease = (x: number) => x * x * (3 - 2 * x);

  return function makeFatty(x: number, z: number, goal: number, dropFrom: number) {
    // body: the pivot that drops in, turns and runs; the clone inside is sized already
    const fatty = cloneSkinned(proto) as THREE.Group;
    const body = new THREE.Group();
    body.add(fatty);
    body.position.set(x, dropFrom, z);
    scene.add(body);
    const home = new THREE.Vector3(x, 0, z);
    const meshes: THREE.SkinnedMesh[] = [];
    fatty.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh);
    });
    const skel = meshes[0].skeleton;
    const bone = (name: string) => skel.bones.find((b) => b.name.replace(/[^A-Za-z]/g, "").toLowerCase() === name);

    const mixer = new THREE.AnimationMixer(fatty);
    const clip = (name: string) => mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, name));
    const stand = clip("stand"), cover = clip("cover"), lie = clip("pushup");
    stand.play();
    mixer.update(0);
    body.updateMatrixWorld(true);
    const refit = () => meshes.forEach((m) => m.computeBoundingSphere());
    refit();

    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(shadowSize.x, 1, shadowSize.y);
    scene.add(shadow);

    const tag = document.createElement("p");
    tag.className = "tag";
    hud.tags.append(tag);

    const uniforms = {
      uHitPos: { value: Array.from({ length: HITS }, () => new THREE.Vector3()) },
      uHitDir: { value: Array.from({ length: HITS }, () => new THREE.Vector3(0, 0, -1)) },
      uHitT: { value: new Array<number>(HITS).fill(-99) },
      uHitAmp: { value: new Array<number>(HITS).fill(0) },
      uTime: { value: 0 },
      uFreq: { value: WAVE.freq },
      uDecay: { value: WAVE.decay },
      uK: { value: WAVE.k / u },
      uRadius: { value: WAVE.radius * u },
      uMax: { value: MAX_OFF * u },
      uClumpC: { value: clumpData.map((d) => d.c.clone()) },
      uClumpR: { value: clumpData.map((d) => d.r) },
      uClumpOff: { value: clumpData.map(() => new THREE.Vector3()) },
    };
    const materials = meshes.map((m) => {
      const nail = m.geometry.attributes.position.count < 1000; // the nails are their own small primitive
      const mat = new THREE.MeshStandardMaterial({
        map,
        bumpMap: bump,
        bumpScale: nail ? 0.3 : 1.4,
        roughness: nail ? 0.3 : 0.5,
        metalness: 0,
        color: nail ? 0xf2dcd4 : 0xffffff,
      });
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms);
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", `#include <common>\n${HEADER}`)
          .replace("#include <defaultnormal_vertex>", NORMAL)
          .replace("#include <skinning_vertex>", "#include <skinning_vertex>\ntransformed += jOff;");
      };
      m.material = mat;
      m.frustumCulled = false; // the wave pushes past the bounds a little
      return mat;
    });

    // the mass: every clump a damped spring on its bone (meters, world space)
    const worldScale = meshes[0].getWorldScale(new THREE.Vector3()).x;
    const clumps = clumpData.map((d) => {
      const b = skel.bones[d.bone];
      const local = d.c.clone().applyMatrix4(meshes[0].bindMatrix).applyMatrix4(skel.boneInverses[d.bone]);
      const at = local.clone().applyMatrix4(b.matrixWorld);
      return { bone: b, local, at, lastAt: at.clone(), lastVel: new THREE.Vector3(), p: new THREE.Vector3(), v: new THREE.Vector3(), radius: d.r * worldScale };
    });

    // springs: torso and head rock away from the blow
    type Spring = { bone: THREE.Bone; k: number; d: number; gain: number; th: THREE.Vector3; om: THREE.Vector3 };
    const springOn = (name: string, k: number, d: number, gain: number): Spring | null => {
      const b = bone(name);
      return b ? { bone: b, k, d, gain, th: new THREE.Vector3(), om: new THREE.Vector3() } : null;
    };
    const springs = [springOn("backlower", 140, 10, 0.5), springOn("backupper", 90, 7, 1), springOn("head", 55, 4.5, 1.8)].filter(
      (s): s is Spring => !!s,
    );
    const headBone = bone("head");
    const RB = {
      hips: bone("backlower"), chest: bone("backupper"),
      thighL: bone("legupperl"), thighR: bone("legupperr"), shinL: bone("leglowerl"), shinR: bone("leglowerr"),
      armL: bone("handupperl"), armR: bone("handupperr"),
    };

    const fwd = new THREE.Vector3(), side = new THREE.Vector3(), axisTmp = new THREE.Vector3();
    const vel = new THREE.Vector3(), acc = new THREE.Vector3(), breathV = new THREE.Vector3(), shoveDir = new THREE.Vector3();
    const m3 = new THREE.Matrix3(), inv = new THREE.Matrix4(), cA = new THREE.Vector3(), cB = new THREE.Vector3();
    const recent: number[] = [];
    const breathAt = Math.random() * 6; // out of step with each other
    let phase: "drop" | "stand" | "flee" | "down" = dropFrom > 0 ? "drop" : "stand";
    let phaseT = 0, landed = false, kick = 0, covering = 0, slot = 0, runPhase = 0, runW = 0, fallV = 0;
    let nextBreath = 3 + breathAt, jolt = 0;

    const me = {
      body, meshes, home, goal, count: 0,
      get phase() { return phase; },
      get box() { return box.clone().translate(home); },

      // cheap "is the hand over him": the ray against a capsule round every bone
      over(r: THREE.Ray) {
        const bones = skel.bones;
        for (let i = 0; i < bones.length; i++) {
          const rad = boneRadius[i] * worldScale * 0.95;
          if (rad <= 0) continue;
          bones[i].getWorldPosition(cA);
          const child = bones[i].children.find((ch) => (ch as THREE.Bone).isBone);
          const d2 = child ? r.distanceSqToSegment(cA, child.getWorldPosition(cB)) : r.distanceSqToPoint(cA);
          if (d2 < rad * rad) return true;
        }
        return false;
      },

      slapped(point: THREE.Vector3, dirW: THREE.Vector3, strength: number, now: number) {
        const t = clock.getElapsedTime();
        inv.copy(meshes[0].matrixWorld).invert();
        // oldest slot that's done; else the oldest one
        let i = slot;
        for (let j = 0; j < HITS; j++) {
          const k = (slot + j) % HITS;
          if (t - uniforms.uHitT.value[k] > LIFE) { i = k; break; }
        }
        slot = (i + 1) % HITS;
        uniforms.uHitPos.value[i].copy(point).applyMatrix4(inv);
        uniforms.uHitDir.value[i].copy(dirW).transformDirection(inv);
        uniforms.uHitT.value[i] = t;
        uniforms.uHitAmp.value[i] = WAVE.amp * u * strength;
        // a slap shoves the clumps near it along the blow — and up: fat bounces,
        // then drops back under its own weight ("into him" alone hardly shows from the front)
        shoveDir.copy(dirW).add(axisTmp.set(0, 0.6, 0));
        for (const c of clumps) {
          const d = point.distanceTo(c.at) / c.radius;
          c.v.addScaledVector(shoveDir, MASS.slap * strength * Math.exp(-0.6 * d * d)); // centres sit inside him: reach them
        }

        const headShot = phase !== "down" && !!headBone && point.y > headBone.getWorldPosition(cA).y - 0.05;
        if (phase !== "down") {
          // torso and head: tip away from the blow, harder on a head shot
          const push = new THREE.Vector3(dirW.x, 0, dirW.z);
          if (push.lengthSq() < 1e-4) push.set(0, 0, -1);
          const axis = new THREE.Vector3(0, 1, 0).cross(push.normalize());
          for (const s of springs) s.om.addScaledVector(axis, strength * s.gain * (s.bone === headBone && headShot ? 2.5 : 1));
        }
        if (phase === "flee") kick += 0.5 * strength; // a slap on the back speeds him up
        if (phase !== "down" || Math.random() < 0.4) grunt(strength, headShot);

        me.count++;
        recent.push(now / 1000);
        while (recent.length && now / 1000 - recent[0] > COVER_WINDOW) recent.shift();
        if (me.count === FLEE_AT) flee(t);
        else if (me.count === DOWN_AT) goDown(t);
        else if (phase === "stand" && recent.length >= COVER_AFTER) coverUp(t);
      },

      // returns how hard the camera should shake (a landing)
      update(dt: number, t: number) {
        uniforms.uTime.value = t;
        jolt = 0;
        if (covering && t > covering) uncover();
        if (t > nextBreath) {
          if (phase === "stand" || phase === "down") wheeze(phase === "down");
          nextBreath = t + (phase === "down" ? 2.6 : 4 + Math.random() * 3);
        }

        // where he is: dropping in, turning and waddling off, or down
        const since = t - phaseT;
        if (phase === "drop") {
          fallV -= 9.81 * 1.3 * dt;
          body.position.y = Math.max(body.position.y + fallV * dt, 0);
          if (body.position.y === 0) {
            phase = "stand";
            for (const c of clumps) c.v.y -= 2.4; // splat
            thudSound();
            jolt = 0.05;
          }
        } else {
          if (phase === "flee") {
            body.rotation.y = Math.PI * ease(Math.min(since / RUN.turn, 1));
            runW = Math.min(Math.max((since - RUN.turn * 0.4) / 0.5, 0), 1);
          } else if (phase === "down") {
            runW = Math.max(runW - dt * 4, 0);
            if (!landed && since > 0.5) land();
          }
          kick *= Math.exp(-dt * 3);
          const zz = body.position.z - (body.position.z > home.z - RUN.far ? RUN.speed * runW : 0) * dt - kick * dt;
          body.position.set(home.x, RUN.bob * Math.abs(Math.sin(runPhase)) * runW, Math.max(zz, home.z - RUN.far - 0.8));
        }
        shadow.position.set(body.position.x, 0.002, body.position.z);
        const fade = 1 / (1 + body.position.y * 0.6); // smaller while he's still up in the air
        shadow.scale.x = shadowSize.x * fade;
        shadow.scale.z += ((phase === "down" ? shadowSize.y * 2.4 : shadowSize.y) * fade - shadow.scale.z) * (1 - Math.exp(-dt * 6));

        mixer.update(dt);
        body.updateMatrixWorld(true);
        // springs
        for (const s of springs) {
          s.om.addScaledVector(s.th, -s.k * dt).multiplyScalar(Math.exp(-s.d * dt));
          s.th.addScaledVector(s.om, dt);
          const a = s.th.length();
          if (a > 1e-5) rotateWorld(s.bone, axisTmp.copy(s.th).divideScalar(a), Math.min(a, 0.6));
        }
        run(dt);
        mass(dt, t);
        return jolt;
      },

      placeTag(cam: THREE.Camera) {
        headBone?.getWorldPosition(cA);
        cA.y += 0.45;
        cA.project(cam);
        const done = me.count >= goal;
        tag.textContent = done ? `✓ ${me.count}` : `${me.count} / ${goal}`;
        tag.classList.toggle("done", done);
        tag.style.transform = `translate(${((cA.x + 1) / 2) * innerWidth}px, ${((1 - cA.y) / 2) * innerHeight}px)`;
        tag.hidden = cA.z > 1;
      },

      remove() {
        scene.remove(body, shadow);
        materials.forEach((m) => m.dispose());
        tag.remove();
        mixer.stopAllAction();
      },
    };

    // the run: legs and arms swing, hips waddle, torso leans in
    function run(dt: number) {
      if (runW <= 0) return;
      const w = runW;
      const step = Math.floor(runPhase / Math.PI);
      runPhase += dt * Math.PI * 2 * RUN.hz;
      if (Math.floor(runPhase / Math.PI) !== step && w > 0.5) pant(step % 2 === 0);
      fwd.set(0, 0, 1).applyQuaternion(body.quaternion);
      side.set(0, -1, 0).cross(fwd).normalize(); // + swings a hanging limb forward, tips the torso back
      const s = Math.sin(runPhase);
      rotateWorld(RB.hips, fwd, 0.1 * s * w);
      rotateWorld(RB.chest, side, -0.22 * w);
      rotateWorld(RB.thighL, side, 0.5 * s * w);
      rotateWorld(RB.thighR, side, -0.5 * s * w);
      rotateWorld(RB.shinL, side, -0.9 * Math.max(0, s) * w);
      rotateWorld(RB.shinR, side, -0.9 * Math.max(0, -s) * w);
      rotateWorld(RB.armL, side, -0.55 * s * w);
      rotateWorld(RB.armR, side, 0.55 * s * w);
    }

    function mass(dt: number, t: number) {
      const br = Math.sin((t + breathAt) * 1.5) * MASS.breath;
      breathV.set(0, br * 0.6, 0).addScaledVector(fwd.set(0, 0, 1).applyQuaternion(body.quaternion), br);
      m3.setFromMatrix4(inv.copy(meshes[0].matrixWorld).invert()); // linear part only: meters → model units
      clumps.forEach((c, i) => {
        c.at.copy(c.local).applyMatrix4(c.bone.matrixWorld);
        // the bone moves, the fat lags behind: drive the spring with its anchor's acceleration
        vel.copy(c.at).sub(c.lastAt).divideScalar(dt);
        acc.copy(vel).sub(c.lastVel).divideScalar(dt).clampLength(0, 80);
        c.lastAt.copy(c.at);
        c.lastVel.copy(vel);
        c.v.addScaledVector(c.p, -massK * dt).addScaledVector(c.v, -massC * dt).addScaledVector(acc, -MASS.inertia * dt);
        c.p.addScaledVector(c.v, dt).clampLength(0, MASS.max);
        uniforms.uClumpOff.value[i].copy(c.p).add(breathV).applyMatrix3(m3);
      });
    }

    function coverUp(t: number) {
      if (covering < t) {
        cover.reset().play();
        stand.crossFadeTo(cover, 0.25, false);
        setTimeout(refit, 400);
        say(["Hey!", "Lass das.", "Aua.", "Genug!"][Math.floor(Math.random() * 4)]);
        whine();
      }
      covering = t + 2.2;
    }
    function uncover() {
      stand.reset().play();
      cover.crossFadeTo(stand, 0.5, false);
      setTimeout(refit, 650);
      covering = 0;
    }
    function flee(t: number) {
      if (covering) uncover();
      phase = "flee";
      phaseT = t;
      say("Ich hau ab!");
      whine();
    }
    function goDown(t: number) {
      phase = "down";
      phaseT = t;
      lie.reset().play();
      stand.crossFadeTo(lie, 0.55, false);
      say("K.O.");
    }
    function land() {
      landed = true;
      fwd.set(0, 0, 1).applyQuaternion(body.quaternion);
      for (const c of clumps) c.v.add(new THREE.Vector3(0, -1.8, 0).addScaledVector(fwd, 0.6));
      jolt = 0.06;
      thudSound();
      setTimeout(groan, 180);
      refit();
    }
    return me;
  };

  // the speech bubble is shared: the last one to say something wins
  function say(text: string) {
    hud.say.textContent = text;
    hud.say.hidden = false;
    clearTimeout(sayTimer);
    sayTimer = window.setTimeout(() => (hud.say.hidden = true), 1600);
  }
}
let sayTimer = 0;

// fat per vertex: how fleshy its bones are × how far it sits from the bone.
// Then bulk him up: fat pushed out from its bone, the belly sagging a little.
function fatMask(m: THREE.SkinnedMesh, inflate: number, sag: number) {
  const g = m.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const n = pos.count, bones = m.skeleton.bones;
  const heads = bones.map((_, i) => new THREE.Vector3().setFromMatrixPosition(m.skeleton.boneInverses[i].clone().invert()));
  const tails = bones.map((b, i) => {
    const child = b.children.find((ch) => (ch as THREE.Bone).isBone);
    return child ? heads[bones.indexOf(child as THREE.Bone)] : heads[i];
  });
  const weight = bones.map((b) => fatOf(b.name));
  const top = new Int32Array(n), dist = new Float32Array(n), maxDist = new Float32Array(bones.length);
  const out = new Float32Array(n), axis = new Float32Array(n * 3);
  const p = new THREE.Vector3(), seg = new THREE.Line3(), q = new THREE.Vector3();
  for (let v = 0; v < n; v++) {
    let f = 0, best = 0, bw = -1;
    for (let j = 0; j < 4; j++) {
      const b = si.getComponent(v, j), w = sw.getComponent(v, j);
      f += w * weight[b];
      if (w > bw) { bw = w; best = b; }
    }
    p.fromBufferAttribute(pos, v).applyMatrix4(m.bindMatrix);
    seg.set(heads[best], tails[best]);
    // leaf bones (head, finger tips, feet) have no tail: distance to the joint
    if (seg.distance() > 1e-6) seg.closestPointToPoint(p, true, q);
    else q.copy(heads[best]);
    dist[v] = q.distanceTo(p);
    q.toArray(axis, v * 3);
    maxDist[best] = Math.max(maxDist[best], dist[v]);
    top[v] = best;
    out[v] = f;
  }
  for (let v = 0; v < n; v++) out[v] *= 0.5 + 0.5 * Math.pow(dist[v] / (maxDist[top[v]] || 1), 0.7);

  // bulk, in bind space (y up there, like the rest pose)
  const s = new THREE.Vector3().setFromMatrixColumn(m.bindMatrix, 0).length(); // model units → bind units
  const back = m.bindMatrix.clone().invert();
  for (let v = 0; v < n; v++) {
    if (out[v] <= 0) continue;
    p.fromBufferAttribute(pos, v).applyMatrix4(m.bindMatrix);
    q.fromArray(axis, v * 3);
    const out_ = p.clone().sub(q);
    if (out_.lengthSq() > 1e-12) p.addScaledVector(out_.normalize(), Math.pow(out[v], 1.3) * inflate * s);
    p.y -= out[v] * out[v] * sag * s;
    p.applyMatrix4(back);
    pos.setXYZ(v, p.x, p.y, p.z);
  }
  pos.needsUpdate = true;
  return { fat: out, maxDist, top };
}

// fat clumps: k-means over the fleshy vertices (rest pose, model units).
// Each one rides on the bone most of its vertices hang on.
function findClumps(m: THREE.SkinnedMesh, top: Int32Array, u: number) {
  const pos = m.geometry.attributes.position, fat = m.geometry.attributes.fat;
  const idx: number[] = [];
  for (let v = 0; v < pos.count; v++) if (fat.getX(v) > 0.45) idx.push(v);
  const P = idx.map((v) => new THREE.Vector3().fromBufferAttribute(pos, v));
  // farthest-point start from the fattest vertex: spread out, the same every load
  let first = 0;
  idx.forEach((v, i) => fat.getX(v) > fat.getX(idx[first]) && (first = i));
  const C = [P[first].clone()];
  const near = P.map((x) => x.distanceToSquared(C[0]));
  while (C.length < MASS.clumps) {
    let far = 0;
    near.forEach((d, i) => d > near[far] && (far = i));
    C.push(P[far].clone());
    P.forEach((x, i) => (near[i] = Math.min(near[i], x.distanceToSquared(P[far]))));
  }
  const of = new Int32Array(P.length);
  for (let it = 0; it < 10; it++) {
    P.forEach((x, i) => {
      let b = 0;
      for (let c = 1; c < C.length; c++) if (x.distanceToSquared(C[c]) < x.distanceToSquared(C[b])) b = c;
      of[i] = b;
    });
    const sum = C.map(() => new THREE.Vector3()), cnt = C.map(() => 0);
    P.forEach((x, i) => (sum[of[i]].add(x), cnt[of[i]]++));
    C.forEach((c, k) => cnt[k] && c.copy(sum[k].divideScalar(cnt[k])));
  }
  return C.map((c, k) => {
    let spread = 0, n = 0;
    const votes = new Map<number, number>();
    P.forEach((x, i) => {
      if (of[i] !== k) return;
      spread += x.distanceToSquared(c);
      n++;
      votes.set(top[idx[i]], (votes.get(top[idx[i]]) ?? 0) + 1);
    });
    const bone = [...votes].sort((a, z) => z[1] - a[1])[0]?.[0] ?? 0;
    return { c, r: Math.max(Math.sqrt(spread / Math.max(n, 1)) * 1.6, 0.12 * u), bone };
  });
}

// a comic impact star, 8 points, slightly irregular
function star() {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, r = i % 2 ? 18 : 40 + Math.random() * 8;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

// --- sound: wet noise slap + a low body thump, all synthesized
let ctx: AudioContext | null = null, noise: AudioBuffer;
function initAudio() {
  if (ctx) return void ctx.resume();
  ctx = new AudioContext();
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function burst(f: number, type: BiquadFilterType, q: number, vol: number, len: number) {
  const c = ctx!, t = c.currentTime, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise;
  s.playbackRate.value = 0.85 + Math.random() * 0.3;
  fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  s.connect(fl).connect(g).connect(c.destination);
  s.start(t, Math.random() * 0.2, len + 0.02);
}
function thump(f0: number, f1: number, vol: number, len: number) {
  const c = ctx!, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + len * 0.75);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + len + 0.02);
}
function slapSound(strength: number) {
  if (!ctx) return;
  const v = Math.min(strength, 1.3);
  burst(1500 + Math.random() * 700, "bandpass", 0.9, 0.9 * v, 0.07 + 0.03 * v);
  burst(3800, "highpass", 0.7, 0.45 * v, 0.025);
  thump(150, 55, 0.55 * v, 0.16);
}
function thudSound() {
  if (!ctx) return;
  thump(95, 30, 1, 0.5);
  burst(260, "lowpass", 0.7, 1, 0.35);
}

// --- his voice: a buzzy low source (sawtooth + breath noise) through three
// formant band-passes. Vowels as formant frequencies, Hz.
const VOWEL = { u: [320, 800, 2400], o: [450, 850, 2500], a: [720, 1150, 2600], e: [500, 1700, 2500] } as const;
type Voice = { f0: number; f1: number; len: number; vowel: keyof typeof VOWEL; breath?: number; vol?: number; at?: number };
let voiceFree = 0; // one mouth: no talking over himself
function voice({ f0, f1, len, vowel, breath = 0.25, vol = 0.5, at = 0 }: Voice) {
  if (!ctx) return;
  const c = ctx, t = c.currentTime + at, out = c.createGain(), lp = c.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 3200;
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(vol, t + Math.min(0.04, len * 0.2));
  out.gain.setValueAtTime(vol, t + len * 0.55);
  out.gain.exponentialRampToValueAtTime(0.001, t + len);
  out.connect(lp).connect(c.destination);
  const src = c.createGain();
  if (breath < 1) {
    const o = c.createOscillator(), g = c.createGain(), wob = c.createOscillator(), wg = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + len);
    wob.frequency.value = 5 + Math.random() * 2; wg.gain.value = f0 * 0.03; // a bit of wobble in the throat
    wob.connect(wg).connect(o.frequency);
    g.gain.value = 1 - breath;
    o.connect(g).connect(src);
    o.start(t); wob.start(t);
    o.stop(t + len + 0.05); wob.stop(t + len + 0.05);
  }
  if (breath > 0) {
    const n = c.createBufferSource(), g = c.createGain();
    n.buffer = noise; n.loop = true;
    g.gain.value = breath * 1.6;
    n.connect(g).connect(src);
    n.start(t, Math.random() * 0.3); n.stop(t + len + 0.05);
  }
  VOWEL[vowel].forEach((f, i) => {
    const bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = "bandpass"; bp.frequency.value = f * (0.95 + Math.random() * 0.1); bp.Q.value = 9;
    g.gain.value = [1, 0.6, 0.25][i] * 4;
    src.connect(bp).connect(g).connect(out);
  });
}
function speak(v: Voice, gap = 0.05) {
  if (!ctx || ctx.currentTime < voiceFree) return;
  voiceFree = ctx.currentTime + (v.at ?? 0) + v.len + gap;
  voice(v);
}
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
// "uff" / "ohf" / "hmpf": a short pushed-out grunt, higher and sharper on the head
function grunt(strength: number, head: boolean) {
  const f = head ? 165 : 105 + Math.random() * 20;
  speak({ f0: f * (1 + strength * 0.15), f1: f * 0.7, len: 0.16 + strength * 0.08, vowel: head ? "o" : pick(["u", "o"] as const), breath: 0.35, vol: 0.35 + 0.2 * strength }, 0.12);
}
// "nnnäh": rising, whiny
function whine() {
  speak({ f0: 150, f1: 210, len: 0.45, vowel: "e", breath: 0.15, vol: 0.4 }, 0.1);
}
// heavy panting while he runs: out on one step, in on the next
function pant(out: boolean) {
  if (!ctx) return;
  voice(out ? { f0: 110, f1: 95, len: 0.22, vowel: "a", breath: 0.75, vol: 0.4 } : { f0: 100, f1: 105, len: 0.18, vowel: "o", breath: 0.95, vol: 0.25 });
}
// long groan after hitting the floor: "ooohhh…"
function groan() {
  speak({ f0: 115, f1: 68, len: 1.3, vowel: "o", breath: 0.3, vol: 0.55 }, 0.4);
}
// a wheezy breath in, a sigh out — louder and quicker lying down
function wheeze(lying: boolean) {
  if (!ctx || ctx.currentTime < voiceFree) return;
  voice({ f0: 90, f1: 96, len: 0.7, vowel: "e", breath: 0.97, vol: lying ? 0.3 : 0.18 });
  voice({ f0: 100, f1: 80, len: 0.8, vowel: "a", breath: 0.8, vol: lying ? 0.32 : 0.2, at: 0.8 });
  voiceFree = ctx.currentTime + 1.8;
}

void mount();
