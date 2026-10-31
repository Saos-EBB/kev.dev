// Contact 3D scene (loaded lazily by contact-skull.ts): the craniumCut01
// skull rises from the bottom as you scroll in (setRise); once it's up, one
// saw blade flies in and cuts deep into it, and green blood spurts out of
// the wound in one hard burst towards the viewer, like a cheap splatter movie
// — deliberately overdone. Pieces of the skull burst out with it, and the
// whole scene freezes while everything is still in the air. Three shards are
// real links (GitHub, mail, phone: the section's .contact-icons <a>s,
// positioned here over the 3D scene every frame). Dragging (mouse, or a sideways swipe) turns the
// whole scene — skull, blade, blood, shards.
//
// Everything after the rise is a closed-form function of the time since the
// sequence started (no stepping; the blood's particles are computed on the
// GPU from that same time), so reduced motion just jumps to the end.
import * as THREE from "three";
import { LITE } from "../../viewport";
import { BLADE_R, bladeGeometry, depthSteps, loadSkullGeometry, wireMesh } from "./parts";
import { createBlood } from "./blood";

const BLADE_FLIGHT = 0.55; // s from off-screen to stuck
const HIT_AT = 0.5; // s after the skull is up
const FREEZE = 2.6; // how fast shards slow down (1/s) — higher stops sooner
const FREEZE_AT = 0.7; // s after the hit: the frame stops, the blood still in the air
const SHARDS = 18;
const YAW = Math.PI / 4; // the skull is turned to the viewer's right, the wound faces the camera
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// The one hit: upper left of the forehead (a point in skull space: face +z,
// vault +y; the nearest front vertex is the hit point), a big blade sunk
// deep (depth = how far its rim goes past the hit point).
const HIT = { want: [-0.32, 0.6, 0.35], scale: 0.78, depth: 0.42, tilt: [0.25, -0.3] } as const;

// Where the three link shards come to rest, in normalized screen coords
// (-1..1, y up) — portrait screens above/below the skull, landscape beside it.
const LINK_REST = {
  wide: [[-0.62, 0.55], [0.64, 0.25], [-0.62, -0.5]],
  tall: [[-0.55, 0.72], [0.55, 0.72], [0, -0.72]],
} as const;
const LINK_STAGGER = 0.12; // s between the three link shards leaving

// Blood (blood.ts): a few spurts close together, under pressure.
const BLOOD_COUNT = LITE ? 1300 : 3600;
const BLOOD_JET = 0.3, BLOOD_PULSES = 3, BLOOD_PRESSURE = 1.4, BLOOD_DROP = 0.45;

export type SkullScene = { setRise(r: number): void; finish(): void };

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const settle = (u: number) => (u <= 0 ? 0 : (1 - Math.exp(-FREEZE * u)) / FREEZE); // distance factor, freezes at 1/FREEZE

// A pause between the expensive parts of the setup, so scrolling stays smooth
// while the scene is built.
const breathe = () =>
  new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) requestIdleCallback(() => resolve(), { timeout: 200 });
    else setTimeout(resolve, 16);
  });

// `section` is the screen-high sticky stage (contact-skull.ts), not the tall
// scroll track around it: sizes, visibility and dragging are taken from it.
export async function createSkullScene(section: HTMLElement, canvas: HTMLCanvasElement, links: HTMLElement[]): Promise<SkullScene> {
  // Phones (LITE): no MSAA and at most 1.5x pixels — at 2-3x with
  // antialiasing the dense wire skull lagged there.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, alpha: true });
  const px = Math.min(devicePixelRatio, LITE ? 1.5 : 2);
  renderer.setPixelRatio(px);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  // Everything sits in `world`, which the drag turns.
  const world = new THREE.Group();
  scene.add(world);

  const lineColor = new THREE.Color(), throwColor = new THREE.Color(), bgColor = new THREE.Color();
  const readColors = () => {
    lineColor.set(css("--color-line") || "#cd57ff");
    throwColor.set(css("--color-throw") || "#89ff57");
    bgColor.set(css("--contact-bg") || "#08070a");
  };
  readColors();

  // ── skull ──
  const geo = await loadSkullGeometry();
  await breathe();
  const skullParts = wireMesh(geo, lineColor, bgColor, 0.32);
  geo.computeBoundingSphere();
  depthSteps(skullParts.lineMat, geo.boundingSphere!.radius + geo.boundingSphere!.center.length());
  const skull = new THREE.Group();
  skull.add(skullParts.group);
  skull.rotation.y = YAW;
  world.add(skull);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  await breathe();

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

  // Cracks: short random walks over vertices near the hit — more and
  // longer than a light hit, the blade goes deep. Ribbons on the surface,
  // wide at the hit and thinning out: the bone is gone there, so they're in
  // the background color.
  const crackTris = (hit: THREE.Vector3) => {
    const near: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i);
      if (v.distanceTo(hit) < 0.9 && v.z > hit.z - 0.45) near.push(v.clone());
    }
    const pts: number[] = [];
    const STEPS = 8;
    const side = new THREE.Vector3();
    const edge = (p: THREE.Vector3, to: THREE.Vector3, width: number) => {
      side.subVectors(to, p).cross(p).normalize().multiplyScalar(width);
      const lifted = p.clone().multiplyScalar(1.008); // just above the fill
      return [lifted.clone().add(side), lifted.clone().sub(side)];
    };
    for (let c = 0; c < 10; c++) {
      let p = hit.clone();
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.6, Math.random() * 0.3).normalize();
      for (let s = 0; s < STEPS; s++) {
        const target = p.clone().addScaledVector(dir, 0.09);
        let q: THREE.Vector3 | null = null, qd = Infinity;
        for (const n of near) { const d = n.distanceTo(target); if (d < qd && n.distanceTo(p) > 0.03) { qd = d; q = n; } }
        if (!q) break;
        const [a, b] = edge(p, q, 0.03 * (1 - s / STEPS));
        const [d, e] = edge(q, q.clone().add(q.clone().sub(p)), 0.03 * (1 - (s + 1) / STEPS));
        for (const t of [a, b, d, d, b, e]) pts.push(t.x, t.y, t.z);
        p = q;
        dir.x += (Math.random() - 0.5) * 0.6; dir.y += (Math.random() - 0.5) * 0.6; dir.normalize();
      }
    }
    return pts;
  };

  // A real piece of the skull: the triangles around a point near the hit,
  // recentred on their middle so it can tumble.
  const index = geo.getIndex()!;
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const triCentre = (t: number) => {
    tri.forEach((c, k) => c.fromBufferAttribute(pos, index.getX(t * 3 + k)));
    return tri[0].clone().add(tri[1]).add(tri[2]).divideScalar(3);
  };
  const centres = Array.from({ length: index.count / 3 }, (_, t) => triCentre(t));
  const skullPiece = (hit: THREE.Vector3) => {
    const around = centres.filter((c) => c.distanceTo(hit) < 0.8);
    const seed = around[Math.floor(Math.random() * around.length)];
    const radius = 0.04 + Math.random() * 0.07;
    const out: number[] = [];
    centres.forEach((c, t) => {
      if (c.distanceTo(seed) > radius) return;
      triCentre(t);
      for (const p of tri) out.push(p.x - seed.x, p.y - seed.y, p.z - seed.z);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
    return g;
  };

  await breathe();

  // ── the hit: blade, cracks, blood, shards ──
  const hit = nearestTo(new THREE.Vector3(...HIT.want));
  const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize(); // the blade lies in the screen plane
  const stuck = hit.clone().addScaledVector(inDir, BLADE_R * HIT.scale - HIT.depth);
  const start = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(0, 0.3, 0.6));

  const blade = wireMesh(bladeGeometry(), throwColor, bgColor, 0.95, true);
  blade.group.visible = false;
  blade.group.scale.setScalar(HIT.scale);
  blade.group.rotation.set(HIT.tilt[0], HIT.tilt[1], 0); // spin (rotation.z) stays around the blade's own axis
  skull.add(blade.group); // rides along with the skull's knock-back

  const crackPts = crackTris(hit);
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(crackPts, 3));
  // in the transparent pass so it's drawn after the skull's lines, and over them
  const crackMat = new THREE.MeshBasicMaterial({ color: bgColor, side: THREE.DoubleSide, transparent: true });
  const cracks = new THREE.Mesh(crackGeo, crackMat);
  cracks.renderOrder = 1;
  skull.add(cracks);
  const crackCount = crackPts.length / 3;

  // Blood out of the wound: straight at the camera (in skull space, so
  // against the yaw), a little outward and up so the spurts arc, in a wide cone.
  const toCamera = new THREE.Vector3(0, 0, 1).applyAxisAngle(Y_AXIS, -YAW);
  const jetAxis = toCamera.clone().add(hit.clone().normalize().multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.2, 0)).normalize();
  const blood = createBlood({ hit, axis: jetAxis, count: BLOOD_COUNT, ink: throwColor, px, jet: BLOOD_JET, pulses: BLOOD_PULSES, pressure: BLOOD_PRESSURE, dropSize: BLOOD_DROP });
  skull.add(blood.points);

  await breathe();

  // The shards are pieces of the skull: same fill, same lines, a bit brighter.
  const shardAxis = jetAxis.clone().applyAxisAngle(Y_AXIS, YAW); // shards live in world space
  const shardMats: ReturnType<typeof wireMesh>[] = [];
  const shards = Array.from({ length: SHARDS }, () => {
    const part = wireMesh(skullPiece(hit), lineColor, bgColor, 0.95);
    part.fillMat.side = THREE.DoubleSide;
    shardMats.push(part);
    const m = part.group;
    m.visible = false;
    world.add(m);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 3.4, (Math.random() - 0.2) * 3.4, Math.random() * 1.4).addScaledVector(shardAxis, 1.8);
    const spin = new THREE.Vector3(Math.random() * 14, Math.random() * 14, Math.random() * 14);
    return { m, vel, spin };
  });

  // Theme toggle (data-theme on <html>): recolor everything in place.
  new MutationObserver(() => {
    readColors();
    skullParts.lineMat.color.copy(lineColor);
    skullParts.fillMat.color.copy(bgColor);
    blade.fillMat.color.copy(bgColor);
    blade.lineMat.color.copy(throwColor);
    crackMat.color.copy(bgColor);
    for (const m of shardMats) { m.lineMat.color.copy(lineColor); m.fillMat.color.copy(bgColor); }
    blood.recolor(); // its ink is throwColor itself
    dirty = true;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── layout ──
  let w = 1, h = 1;
  const resize = () => {
    w = section.clientWidth; h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: step back so skull + blood fit the width
    const tall = w / h < 0.8;
    camera.position.set(0, 0.2, tall ? 8.5 : 5.8);
    camera.lookAt(0, tall ? 0.1 : 0.08, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(section);

  // ── drag to turn the whole scene ──
  // Sideways and up/down for a mouse; on touch only sideways (touch-action
  // pan-y in skull.css), so a vertical swipe still scrolls the page.
  const turn = { x: 0, y: 0, tx: 0, ty: 0 };
  let drag: { id: number; x: number; y: number } | null = null;
  section.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("a")) return; // the link shards stay clickable
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    section.setPointerCapture(e.pointerId);
    section.classList.add("is-turning");
  });
  section.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    turn.ty += (e.clientX - drag.x) * 0.008;
    if (e.pointerType === "mouse") turn.tx = Math.max(-0.9, Math.min(0.9, turn.tx + (e.clientY - drag.y) * 0.006));
    drag.x = e.clientX; drag.y = e.clientY;
    dirty = true;
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    section.classList.remove("is-turning");
  };
  section.addEventListener("pointerup", endDrag);
  section.addEventListener("pointercancel", endDrag);

  // ── state ──
  let rise = 0;
  let started = false;
  let seqT = 0; // seconds since the skull was up
  let dirty = true;
  let last = performance.now();

  const toScreen = (p: THREE.Vector3) => {
    const q = p.clone().project(camera);
    return [q.x, q.y] as const;
  };

  function reset() {
    started = false; seqT = 0;
    for (const link of links) {
      link.style.visibility = "hidden";
      link.style.pointerEvents = "none";
    }
  }

  function pose() {
    // the drag, eased
    turn.x += (turn.tx - turn.x) * 0.15;
    turn.y += (turn.ty - turn.y) * 0.15;
    world.rotation.set(turn.x, turn.y, 0);
    if (Math.abs(turn.tx - turn.x) + Math.abs(turn.ty - turn.y) > 1e-3) dirty = true;

    // rise: from below the screen up to the centre
    skull.position.y = -3.4 * (1 - easeOut(rise));

    // knock-back: one heavy damped wobble, then the shaking until the freeze
    const u = started ? seqT - HIT_AT : -1;
    const kick = u > 0 ? Math.exp(-4 * u) * Math.sin(10 * u) * 1.5 : 0;
    const shake = u > 0 && u < FREEZE_AT ? Math.sin(u * 63) * 0.012 * (1 - u / FREEZE_AT) : 0;
    skull.position.z = -kick * 0.22;
    skull.position.x = shake;
    skull.rotation.x = -kick * 0.12;
    skull.rotation.z = kick * 0.07 * Math.sign(hit.x || 1);
    world.updateMatrixWorld();

    // blade: flies in, sinks, spins down
    const fly = u + BLADE_FLIGHT;
    blade.group.visible = started && fly > 0;
    if (blade.group.visible) {
      const k = Math.min(fly / BLADE_FLIGHT, 1);
      blade.group.position.lerpVectors(start, stuck, k * k);
      blade.group.rotation.z = -(Math.min(fly, BLADE_FLIGHT) * 42 + (u > 0 ? (1 - Math.exp(-3 * u)) * 42 / 3 : 0));
    }
    // cracks spread over 0.5 s (6 vertices per ribbon segment)
    crackGeo.setDrawRange(0, u > 0 ? Math.floor(Math.min(1, u / 0.5) * crackCount / 6) * 6 : 0);
    blood.setTime(u);

    // shards: burst from the hit point, slow down, hang there
    const originWorld = skull.localToWorld(hit.clone());
    const origin = world.worldToLocal(originWorld.clone());
    const d = settle(u);
    for (const s of shards) {
      s.m.visible = u > 0;
      if (!s.m.visible) continue;
      s.m.position.copy(origin).addScaledVector(s.vel, d);
      s.m.rotation.set(s.spin.x * d, s.spin.y * d, s.spin.z * d);
    }

    // the three link shards: the same slowing down, from the hit to their
    // spots, which they reach as the frame stops
    const tall = w / h < 0.8;
    const [hx, hy] = toScreen(originWorld);
    links.forEach((link, i) => {
      const ui = u - i * LINK_STAGGER;
      if (ui <= 0) return;
      const [tx, ty] = (tall ? LINK_REST.tall : LINK_REST.wide)[i];
      const k = settle(ui) / settle(FREEZE_AT - i * LINK_STAGGER); // 0 → 1
      const x = hx + (tx - hx) * k, y = hy + (ty - hy) * k;
      link.style.visibility = "visible";
      link.style.pointerEvents = k > 0.6 ? "auto" : "none";
      link.style.left = `${((x + 1) / 2) * w}px`;
      link.style.top = `${((1 - y) / 2) * h}px`;
      link.style.transform = `translate(-50%, -50%) rotate(${((1 - k) * 540 * Math.sign(tx || 1)).toFixed(1)}deg) scale(${(0.4 + 0.6 * k).toFixed(3)})`;
    });
  }

  // Render only while the section is on screen.
  let visible = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = performance.now(); requestAnimationFrame(frame); }
  }).observe(section);

  const END = HIT_AT + FREEZE_AT;
  function frame(now: number) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (!started && rise >= 0.995) started = true;
    if (started && seqT < END) { seqT = Math.min(seqT + dt, END); dirty = true; }
    if (dirty) { dirty = false; pose(); renderer.render(scene, camera); }
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
      rise = 1; started = true; seqT = END;
      dirty = true;
      pose(); renderer.render(scene, camera);
    },
  };
}
