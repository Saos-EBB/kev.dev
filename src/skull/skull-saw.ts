// Skull + saw blade — hidden scene on saos.html, mounts only on #dev#skull#saw
// (src/saos-entry.ts; plain #dev#skull is the skull variant of the main page).
// The cranium is craniumCut01 from the 2D renderer (renderer-models), turned
// to face the camera. A saw blade flies in from the upper left, sticks in
// the forehead, bone shards burst toward the viewer. Pink wireframe on black.
import "./skull-saw.css";
import * as THREE from "three";
import { loadCranium, type Model } from "../projects/widgets/renderer-models/cranium";


const PINK = 0xff4fb8, SOFT = 0xff9ad6, DIM = 0x7a2459;
const T_FLY = 0.9, T_HIT = 1.38, T_FADE = 5.2, T_END = 6.0;
const R = 0.62, R_IN = 0.53, DEPTH_IN = 0.24;

const wire = (geo: THREE.BufferGeometry, color: number, opacity: number) =>
  new THREE.LineSegments(
    new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
const blackFill = () =>
  new THREE.MeshBasicMaterial({ color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

function skullGeometry(m: Model) {
  const pos = new Float32Array(m.vs.length * 3);
  // model: face +y, vault -z  →  three: face +z (camera), vault +y
  m.vs.forEach((v, i) => { pos[i * 3] = v.x; pos[i * 3 + 1] = -v.z; pos[i * 3 + 2] = v.y; });
  const idx: number[] = [];
  for (const f of m.fs) for (let k = 1; k < f.length - 1; k++) idx.push(f[0], f[k], f[k + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.center();
  return g;
}

function bladeGeometry() {
  const s = new THREE.Shape();
  const teeth = 30;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.7) / teeth) * Math.PI * 2;
    const p = (r: number, a: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;
    const [x0, y0] = p(R_IN, a0), [x1, y1] = p(R, a1);
    if (i === 0) s.moveTo(x0, y0); else s.lineTo(x0, y0);
    s.lineTo(x1, y1);
  }
  s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.09, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2, slot = new THREE.Path();
    slot.absarc(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.05, 0, Math.PI * 2, true);
    s.holes.push(slot);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -0.0175);
  return g;
}

async function mount() {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas"); canvas.id = "sk-gl";
  canvas.setAttribute("aria-label", "Wireframe-Schädel, in den ein Sägeblatt fliegt");
  const load = document.createElement("p"); load.className = "sk-load"; load.textContent = "lädt schädel …";
  const hud = document.createElement("div"); hud.className = "sk-hud";
  hud.innerHTML = `<span class="sk-tag">kev.dev // craniumCut01</span>
    <button type="button" class="sk-btn" data-a="pause">Pause</button>
    <button type="button" class="sk-btn" data-a="again">Nochmal werfen ↻</button>`;
  document.body.append(canvas, load, hud);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 5, 11);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole skull + blade in frame on narrow (portrait) screens
    camera.position.set(0, 0.35, w / h < 0.8 ? 7 : 5.4);
    camera.lookAt(0, 0.3, 0);
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize); resize();

  const grid = new THREE.GridHelper(14, 40, DIM, DIM);
  grid.position.y = -1.0;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.5;
  scene.add(grid);

  const model = await loadCranium();
  load.remove();

  // ── skull ──
  const geo = skullGeometry(model);
  const skull = new THREE.Group();
  skull.add(new THREE.Mesh(geo, blackFill()), wire(geo, PINK, 0.3));
  scene.add(skull);

  // hit point: the vertex furthest toward upper-left-front (forehead)
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const want = new THREE.Vector3(-0.35, 0.75, 0.55).normalize();
  const v = new THREE.Vector3(), hit = new THREE.Vector3();
  let best = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.dot(want);
    if (d > best) { best = d; hit.copy(v); }
  }
  // blade lies in the camera plane (XY); it cuts in along the in-plane outward direction
  const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize();
  const stuck = hit.clone().addScaledVector(inDir, R - DEPTH_IN);
  const start = stuck.clone().addScaledVector(inDir, 7).add(new THREE.Vector3(0, 0.3, 0.8));

  // ── cracks: random walks over nearby vertices ──
  const near: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i += 3) {
    v.fromBufferAttribute(pos, i);
    if (v.distanceTo(hit) < 0.7 && v.z > hit.z - 0.35) near.push(v.clone());
  }
  const crackPts: number[] = [];
  for (let c = 0; c < 7; c++) {
    let p = hit.clone();
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.7, Math.random() * 0.3).normalize();
    for (let s = 0; s < 6; s++) {
      const target = p.clone().addScaledVector(dir, 0.09);
      let q: THREE.Vector3 | null = null, qd = Infinity;
      for (const n of near) { const d = n.distanceTo(target); if (d < qd && n.distanceTo(p) > 0.03) { qd = d; q = n; } }
      if (!q) break;
      crackPts.push(p.x, p.y, p.z, q.x, q.y, q.z);
      p = q;
      dir.x += (Math.random() - 0.5) * 0.6; dir.y += (Math.random() - 0.5) * 0.6; dir.normalize();
    }
  }
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(crackPts, 3));
  const crackMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false });
  crackGeo.setDrawRange(0, 0);
  skull.add(new THREE.LineSegments(crackGeo, crackMat));

  // ── blade ──
  const bGeo = bladeGeometry();
  const blade = new THREE.Group();
  blade.add(new THREE.Mesh(bGeo, blackFill()), wire(bGeo, SOFT, 0.95));
  scene.add(blade);

  // ── shockwave ring ──
  const ringMat = new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), ringMat);
  ring.position.copy(hit);
  scene.add(ring);

  // ── shards ──
  type Shard = { m: THREE.LineSegments; vel: THREE.Vector3; spin: THREE.Vector3; mat: THREE.LineBasicMaterial };
  const shardGeos = [new THREE.TetrahedronGeometry(1), new THREE.OctahedronGeometry(1), new THREE.IcosahedronGeometry(1)];
  const shards: Shard[] = [];
  for (let i = 0; i < 46; i++) {
    const mat = new THREE.LineBasicMaterial({ color: i % 3 ? PINK : SOFT, transparent: true, opacity: 0 });
    const m = new THREE.LineSegments(new THREE.WireframeGeometry(shardGeos[i % 3]), mat);
    m.visible = false;
    scene.add(m);
    shards.push({ m, vel: new THREE.Vector3(), spin: new THREE.Vector3(), mat });
  }
  const FLOOR = grid.position.y + 0.02;
  const spawnShards = () => {
    const world = skull.localToWorld(hit.clone());
    for (const s of shards) {
      s.m.position.copy(world);
      s.m.scale.setScalar(0.025 + Math.random() * 0.07);
      s.vel.set((Math.random() - 0.5) * 3, 0.8 + Math.random() * 2.6, 0.4 + Math.random() * 1.6).addScaledVector(inDir, 1.4);
      s.spin.set(Math.random() * 12, Math.random() * 12, Math.random() * 12);
      s.mat.opacity = 1; s.m.visible = true;
    }
  };
  const stepShards = (dt: number, fade: number) => {
    for (const s of shards) {
      if (!s.m.visible) continue;
      s.vel.y -= 5.5 * dt;
      s.m.position.addScaledVector(s.vel, dt);
      if (s.m.position.y < FLOOR) { s.m.position.y = FLOOR; s.vel.y *= -0.35; s.vel.x *= 0.6; s.vel.z *= 0.6; s.spin.multiplyScalar(0.5); }
      s.m.rotation.x += s.spin.x * dt; s.m.rotation.y += s.spin.y * dt; s.m.rotation.z += s.spin.z * dt;
      s.mat.opacity = fade;
    }
  };

  // ── timeline ──
  let t = 0, kick = 0, kickVel = 0, hitDone = false, paused = false, animating = !reduceMotion, spin = 0;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const reset = () => {
    t = 0; kick = 0; kickVel = 0; hitDone = false;
    for (const s of shards) s.m.visible = false;
    crackGeo.setDrawRange(0, 0); crackMat.opacity = 0; ringMat.opacity = 0;
  };
  const update = (dt: number) => {
    t += dt;
    const fade = t > T_FADE ? Math.max(0, 1 - (t - T_FADE) / (T_END - T_FADE)) : 1;
    // blade
    if (t < T_FLY) { blade.visible = false; }
    else if (t < T_HIT) {
      blade.visible = true;
      const k = (t - T_FLY) / (T_HIT - T_FLY);
      blade.position.lerpVectors(start, stuck, k * k);
      spin += dt * 38;
    } else {
      blade.visible = true;
      if (!hitDone) { hitDone = true; spawnShards(); kickVel = -9; }
      spin += dt * 38 * Math.max(0, 1 - (t - T_HIT) * 4);
    }
    blade.rotation.z = -spin;
    // skull knock-back: damped spring, blade rides along
    kickVel += (-kick * 70 - kickVel * 7) * dt;
    kick += kickVel * dt;
    skull.position.z = kick * 0.12;
    skull.rotation.x = kick * 0.08;
    skull.rotation.z = kick * 0.05;
    if (t >= T_HIT) blade.position.copy(skull.localToWorld(stuck.clone()));
    // cracks + ring
    if (hitDone) {
      const dtHit = t - T_HIT;
      crackGeo.setDrawRange(0, Math.floor(Math.min(1, dtHit / 0.35) * (crackPts.length / 3)));
      crackMat.opacity = fade * (dtHit < 0.15 ? 1 : 0.75);
      const r = ease(Math.min(1, dtHit / 0.5));
      ring.scale.setScalar(0.05 + r * 1.6);
      ringMat.opacity = (1 - r) * 0.8;
      stepShards(dt, fade);
    }
    ((blade.children[1] as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = 0.95 * fade;
    if (t > T_END) { if (reduceMotion) { animating = false; showStatic(); } else reset(); }
  };
  const showStatic = () => { reset(); for (let i = 0; i < 160; i++) update(1 / 60); };
  const play = () => { reset(); animating = true; paused = false; pauseBtn.textContent = "Pause"; };

  const pauseBtn = hud.querySelector<HTMLButtonElement>('[data-a="pause"]')!;
  pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? "Weiter" : "Pause"; };
  hud.querySelector<HTMLButtonElement>('[data-a="again"]')!.onclick = play;
  canvas.addEventListener("click", play);
  if (reduceMotion) showStatic();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    if (animating && !paused) update(dt);
    // slight idle sway so the static mesh doesn't look frozen
    if (!reduceMotion) skull.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.12;
    renderer.render(scene, camera);
  });
}

if (location.hash.startsWith("#dev#skull#saw")) mount();
