// Skull variant's contact 3D scene (loaded lazily by contact-skull.ts): the craniumCut01
// skull rises from the bottom as you scroll in (setRise), and once it's up,
// three saw blades hit it one after another. Each hit throws bone shards
// that slow down and hang in the air — and one shard of each hit is a real
// link (GitHub, mail, phone: the section's .contact-icons <a>s, positioned
// here over the 3D scene every frame).
//
// Everything after the rise is a closed-form function of the time since the
// sequence started (no stepping), so reduced motion just jumps to the end.
import * as THREE from "three";
import { LITE } from "../viewport";
import { BLADE_R, bladeGeometry, loadSkullGeometry, wireMesh } from "./parts";

const BLADE_FLIGHT = 0.45; // s from off-screen to stuck
const HIT_AT = [0.5, 1.9, 3.3]; // s after the skull is up
const FREEZE = 2.6; // how fast shards slow down (1/s) — higher stops sooner
const SHARDS_PER_HIT = 16;

// Where each hit lands on the skull (a point in skull space: face +z, vault
// +y; the nearest vertex on the front half is the hit point) and where its link shard comes to
// rest, in normalized screen coords (-1..1, y up) — portrait screens get
// their own spots above/below the skull, landscape ones beside it.
// Spread like real throws, not a pattern: crown (top left, steep), right
// temple (from the side, flat), left cheekbone (from below) — each with
// its own size, depth and tilt out of the screen plane (radians, around x/y).
const HITS = [
  { want: [-0.3, 0.72, 0.25], scale: 0.62, depth: 0.17, tilt: [0.25, -0.35], wide: [-0.62, 0.55], tall: [-0.55, 0.72] },
  { want: [0.72, 0.22, 0.2], scale: 0.52, depth: 0.12, tilt: [-0.15, 0.5], wide: [0.64, 0.25], tall: [0.55, 0.72] },
  { want: [-0.6, -0.15, 0.55], scale: 0.46, depth: 0.1, tilt: [0.4, 0.2], wide: [-0.62, -0.5], tall: [0, -0.72] },
] as const;

export type SkullScene = { setRise(r: number): void; finish(): void };

type Hooks = { onFirstHit(): void; onReset(): void };

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const settle = (u: number) => (u <= 0 ? 0 : (1 - Math.exp(-FREEZE * u)) / FREEZE); // distance factor, freezes at 1/FREEZE

// `section` is the screen-high sticky stage (contact-skull.ts), not the tall
// scroll track around it: sizes and visibility are taken from it.
export async function createSkullScene(section: HTMLElement, canvas: HTMLCanvasElement, links: HTMLElement[], hooks: Hooks): Promise<SkullScene> {
  // Phones (LITE): no MSAA and at most 1.5x pixels — at 2-3x with
  // antialiasing the dense wire skull lagged there.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);

  const lineColor = new THREE.Color(), throwColor = new THREE.Color(), bgColor = new THREE.Color(), textColor = new THREE.Color();
  const readColors = () => {
    lineColor.set(css("--color-line") || "#cd57ff");
    throwColor.set(css("--color-throw") || "#89ff57");
    bgColor.set(css("--contact-bg") || "#08070a");
    textColor.set(css("--color-text") || "#f5f5f6");
  };
  readColors();

  // ── skull ──
  const geo = await loadSkullGeometry();
  const skullParts = wireMesh(geo, lineColor, bgColor, 0.32);
  const skull = new THREE.Group();
  const body = skullParts.group;
  skull.add(body);
  scene.add(skull);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;

  const v = new THREE.Vector3();
  const nearestTo = (p: THREE.Vector3) => {
    let best = Infinity;
    const out = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.z < 0) continue; // front half only, so the hit is visible
      const d = v.distanceToSquared(p);
      if (d < best) { best = d; out.copy(v); }
    }
    return out;
  };

  // Cracks: short random walks over vertices near the hit.
  const crackLines = (hit: THREE.Vector3) => {
    const near: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i);
      if (v.distanceTo(hit) < 0.6 && v.z > hit.z - 0.35) near.push(v.clone());
    }
    const pts: number[] = [];
    for (let c = 0; c < 6; c++) {
      let p = hit.clone();
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.6, Math.random() * 0.3).normalize();
      for (let s = 0; s < 5; s++) {
        const target = p.clone().addScaledVector(dir, 0.09);
        let q: THREE.Vector3 | null = null, qd = Infinity;
        for (const n of near) { const d = n.distanceTo(target); if (d < qd && n.distanceTo(p) > 0.03) { qd = d; q = n; } }
        if (!q) break;
        pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
        p = q;
        dir.x += (Math.random() - 0.5) * 0.6; dir.y += (Math.random() - 0.5) * 0.6; dir.normalize();
      }
    }
    return pts;
  };

  // ── per hit: blade, cracks, shards ──
  const bladeGeo = bladeGeometry();
  const shardGeos = [new THREE.TetrahedronGeometry(1), new THREE.OctahedronGeometry(1), new THREE.IcosahedronGeometry(1)].map((g) => new THREE.WireframeGeometry(g));
  const throwMats: THREE.LineBasicMaterial[] = [];
  const crackMats: THREE.LineBasicMaterial[] = [];
  const bladeFills: THREE.MeshBasicMaterial[] = [];

  const hits = HITS.map((h, i) => {
    const hit = nearestTo(new THREE.Vector3(...h.want));
    const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize(); // the blade lies in the screen plane
    const stuck = hit.clone().addScaledVector(inDir, BLADE_R * h.scale - h.depth);
    const start = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(0, 0.3, 0.6));

    const blade = wireMesh(bladeGeo, throwColor, bgColor, 0.95, true);
    throwMats.push(blade.lineMat); bladeFills.push(blade.fillMat);
    blade.group.visible = false;
    blade.group.scale.setScalar(h.scale);
    blade.group.rotation.set(h.tilt[0], h.tilt[1], 0); // spin (rotation.z) stays around the blade's own axis
    skull.add(blade.group); // rides along with the skull's knock-back

    const pts = crackLines(hit);
    const crackGeo = new THREE.BufferGeometry();
    crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const crackMat = new THREE.LineBasicMaterial({ color: textColor, transparent: true, opacity: 0.8, depthTest: false });
    crackMats.push(crackMat);
    const cracks = new THREE.LineSegments(crackGeo, crackMat);
    skull.add(cracks);

    const shards = Array.from({ length: SHARDS_PER_HIT }, (_, k) => {
      const mat = new THREE.LineBasicMaterial({ color: k % 3 ? lineColor : throwColor, transparent: true, opacity: 0.95 });
      if (k % 3 === 0) throwMats.push(mat);
      const m = new THREE.LineSegments(shardGeos[k % 3], mat);
      m.scale.setScalar(0.025 + Math.random() * 0.06);
      m.visible = false;
      scene.add(m);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.2) * 3, Math.random() * 1.2).addScaledVector(inDir, 1.6);
      const spin = new THREE.Vector3(Math.random() * 14, Math.random() * 14, Math.random() * 14);
      return { m, vel, spin };
    });
    return { at: HIT_AT[i], hit, inDir, stuck, start, blade: blade.group, crackGeo, crackCount: pts.length / 3, shards, h, link: links[i] };
  });

  // Theme toggle (data-theme on <html>): recolor everything in place.
  new MutationObserver(() => {
    readColors();
    skullParts.lineMat.color.copy(lineColor);
    skullParts.fillMat.color.copy(bgColor);
    bladeFills.forEach((m) => m.color.copy(bgColor));
    throwMats.forEach((m) => m.color.copy(throwColor));
    crackMats.forEach((m) => m.color.copy(textColor));
    for (const h of hits) for (const s of h.shards) if (!throwMats.includes(s.m.material as THREE.LineBasicMaterial)) (s.m.material as THREE.LineBasicMaterial).color.copy(lineColor);
    dirty = true;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── layout ──
  let w = 1, h = 1;
  const resize = () => {
    w = section.clientWidth; h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: step back so skull + blades fit the width
    const tall = w / h < 0.8;
    camera.position.set(0, 0.2, tall ? 8 : 5.4);
    camera.lookAt(0, tall ? 0.1 : 0.08, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(section);

  // ── state ──
  let rise = 0;
  let started = false;
  let seqT = 0; // seconds since the skull was up
  let firstHitSent = false;
  let dirty = true;
  let last = performance.now();

  const toScreen = (p: THREE.Vector3) => {
    const q = p.clone().project(camera);
    return [q.x, q.y] as const;
  };

  function reset() {
    started = false; seqT = 0; firstHitSent = false;
    for (const hh of hits) {
      hh.link.style.visibility = "hidden";
      hh.link.style.pointerEvents = "none";
    }
    hooks.onReset();
  }

  function pose() {
    // rise: from below the screen up to the centre
    skull.position.y = -3.4 * (1 - easeOut(rise));

    // knock-back: a damped wobble per hit, summed
    let kick = 0, tilt = 0;
    for (const hh of hits) {
      const u = seqT - hh.at;
      if (started && u > 0) {
        const k = Math.exp(-6 * u) * Math.sin(11 * u);
        kick += k;
        tilt += k * Math.sign(hh.hit.x || 1);
      }
    }
    skull.position.z = -kick * 0.18;
    skull.rotation.x = -kick * 0.1;
    skull.rotation.z = tilt * 0.06;
    skull.updateMatrixWorld();

    const tall = w / h < 0.8;
    for (const hh of hits) {
      const u = started ? seqT - hh.at : -1;
      // blade: flies in, sticks, spins down
      const fly = u + BLADE_FLIGHT;
      hh.blade.visible = started && fly > 0;
      if (hh.blade.visible) {
        const k = Math.min(fly / BLADE_FLIGHT, 1);
        hh.blade.position.lerpVectors(hh.start, hh.stuck, k * k);
        hh.blade.rotation.z = -(Math.min(fly, BLADE_FLIGHT) * 38 + (u > 0 ? (1 - Math.exp(-4 * u)) * 38 / 4 : 0));
      }
      // cracks spread over 0.35 s
      hh.crackGeo.setDrawRange(0, u > 0 ? Math.floor(Math.min(1, u / 0.35) * hh.crackCount) : 0);

      // shards: burst from the hit point, slow down, hang there
      const origin = skull.localToWorld(hh.hit.clone());
      const d = settle(u);
      for (const s of hh.shards) {
        s.m.visible = u > 0;
        if (!s.m.visible) continue;
        s.m.position.copy(origin).addScaledVector(s.vel, d);
        s.m.rotation.set(s.spin.x * d, s.spin.y * d, s.spin.z * d);
      }

      // the link shard: same freeze, from the hit to its resting spot
      const link = hh.link;
      if (u > 0) {
        const [hx, hy] = toScreen(origin);
        const [tx, ty] = tall ? hh.h.tall : hh.h.wide;
        const k = d * FREEZE; // 0 → 1
        const x = hx + (tx - hx) * k, y = hy + (ty - hy) * k;
        link.style.visibility = "visible";
        link.style.pointerEvents = k > 0.6 ? "auto" : "none";
        link.style.left = `${((x + 1) / 2) * w}px`;
        link.style.top = `${((1 - y) / 2) * h}px`;
        link.style.transform = `translate(-50%, -50%) rotate(${((1 - k) * 540 * Math.sign(tx || 1)).toFixed(1)}deg) scale(${(0.4 + 0.6 * k).toFixed(3)})`;
      }
    }

    if (started && !firstHitSent && seqT > HIT_AT[0]) {
      firstHitSent = true;
      hooks.onFirstHit();
    }
  }

  // Render only while the section is on screen.
  let visible = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = performance.now(); requestAnimationFrame(frame); }
  }).observe(section);

  const END = HIT_AT[HIT_AT.length - 1] + 4;
  function frame(now: number) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (!started && rise >= 0.995) started = true;
    if (started && seqT < END) { seqT += dt; dirty = true; }
    if (dirty) { pose(); renderer.render(scene, camera); dirty = false; }
    requestAnimationFrame(frame);
  }

  resize();
  reset();
  return {
    setRise(r: number) {
      if (r === rise) return;
      rise = r;
      if (started && r < 0.5) reset(); // scrolled back out: replay next time
      dirty = true;
    },
    finish() {
      rise = 1; started = true; seqT = END; firstHitSent = true;
      dirty = true;
      pose(); renderer.render(scene, camera);
    },
  };
}
