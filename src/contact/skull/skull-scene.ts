// Contact 3D scene (loaded lazily by contact-skull.ts): the craniumCut01
// skull comes at you from far behind the grid as you scroll in (setRise); once it's up, one
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
import { createBlood, type Blood } from "./blood";

const BLADE_FLIGHT = 0.55; // s from off-screen to stuck
const HIT_AT = 0.5; // s after the skull is up
const APPROACH_Z = -38; // how far back the skull starts, inside the camera's 50 far plane
const FREEZE = 2.6; // how fast shards slow down (1/s) — higher stops sooner
const FREEZE_AT = 0.7; // s after the hit: the frame stops, the blood still in the air
const SHARDS = 18;
const YAW = Math.PI / 4; // the skull is turned to the viewer's right, the wound faces the camera
const Y_AXIS = new THREE.Vector3(0, 1, 0);

// The one hit: upper left of the forehead (a point in skull space: face +z,
// vault +y; the nearest front vertex is the hit point), a big blade sunk
// deep (depth = how far its rim goes past the hit point).
const HIT = { want: [-0.32, 0.6, 0.35], scale: 0.78, depth: 0.42, tilt: [0.25, -0.3] } as const;
// The blades the [more?] button sends after it (skull-more.ts), one per press;
// the last one comes by itself when the song starts.
const MORE_HITS = [
  { want: [-0.85, 0.35, -0.2], scale: 0.7, depth: 0.38, tilt: [-0.2, 0.25] },
  { want: [-0.5, -0.15, 0.5], scale: 0.62, depth: 0.32, tilt: [0.3, 0.2] },
  { want: [-0.7, -0.25, -0.55], scale: 0.72, depth: 0.4, tilt: [-0.3, -0.25] },
  { want: [-0.55, 0.75, -0.35], scale: 0.8, depth: 0.42, tilt: [0.2, 0.3] },
] as const;
const SETTLED_PAUSE = 600; // ms the frozen frame stands before the button appears

// Where the three link shards come to rest, in normalized screen coords
// (-1..1, y up) — portrait screens in a row above the skull (the
// [more?] button has the space below it), landscape beside it.
const LINK_REST = {
  wide: [[-0.62, 0.55], [0.64, 0.25], [-0.62, -0.5]],
  tall: [[-0.62, 0.76], [0.62, 0.76], [0, 0.76]],
} as const;
const LINK_STAGGER = 0.12; // s between the three link shards leaving

// Blood (blood.ts): a few spurts close together, under pressure.
const BLOOD_COUNT = LITE ? 1300 : 3600;
const BLOOD_JET = 0.3, BLOOD_PULSES = 3, BLOOD_PRESSURE = 1.4, BLOOD_DROP = 0.45;
// Fades like the skull: brightest close to the camera, faint at the wound.
const BLOOD_DEPTH = { front: 4.5, range: 4.5 };
// Blades around the skull spurt sideways and away, so depth may not eat them,
// and their blood stays close enough to see which wound it came from.
const AROUND_PRESSURE = 0.82, AROUND_DROP = 0.2, AROUND_COUNT = LITE ? 1000 : 2800;
// The finale's fog on top of that: very fine, thrown at the camera, some of it
// gets right up to it.
const MIST_COUNT = LITE ? 3000 : 10000, MIST_PRESSURE = 1.7, MIST_DROP = 0.07;
const AROUND_DEPTH = { front: 3, range: 12 };

export type SkullScene = { setRise(r: number): void; setGap(x: number, y: number): void; finish(): void; hitsLeft(): number; moreHit(stop?: number): Promise<void>; clean(): void; wound(): readonly [number, number] };

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

// `stopAt`: seconds after the hit the time stands still (the blood in the air by
// default; later than the blood's life, and it's gone).
// `crown`: instead of the fixed hits, this many blades all over the skull.
type SceneOptions = { stopAt?: number; crown?: number };
type HitDef = {
  want?: readonly number[];
  scale: number;
  depth: number;
  tilt: readonly number[];
  // Worked out by crownHits: the exact vertex, and the way out of the skull.
  hit?: THREE.Vector3;
  out?: THREE.Vector3;
};

// `section` is the screen-high sticky stage (contact-skull.ts), not the tall
// scroll track around it: sizes, visibility and dragging are taken from it.
export async function createSkullScene(section: HTMLElement, canvas: HTMLCanvasElement, links: HTMLElement[], onSettled: (settled: boolean) => void, { stopAt = FREEZE_AT, crown = 0 }: SceneOptions = {}): Promise<SkullScene> {
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

  const lineColor = new THREE.Color(), throwColor = new THREE.Color(), bgColor = new THREE.Color(), bladeColor = new THREE.Color();
  const readColors = () => {
    lineColor.set(css("--color-line") || "#cd57ff");
    throwColor.set(css("--color-throw") || "#89ff57");
    bgColor.set(css("--contact-bg") || "#08070a");
    bladeColor.set(css("--color-blade") || throwColor);
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
  // What the eye takes for the skull's middle, not the model's origin.
  geo.computeBoundingBox();
  const visualCentre = geo.boundingBox!.getCenter(new THREE.Vector3()).applyAxisAngle(Y_AXIS, YAW);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  await breathe();

  const v = new THREE.Vector3();
  const nearestTo = (p: THREE.Vector3) => {
    let best = Infinity;
    const out = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
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

  // ── a hit: blade, cracks, blood, shards ──
  const toCamera = new THREE.Vector3(0, 0, 1).applyAxisAngle(Y_AXIS, -YAW);
  const shardMats: ReturnType<typeof wireMesh>[] = [];
  const blades: ReturnType<typeof wireMesh>[] = [];
  const crackMat = new THREE.MeshBasicMaterial({ color: bgColor, side: THREE.DoubleSide, transparent: true }); // in the transparent pass so it's drawn after the skull's lines, and over them

  // Blades all over the skull, at the first blade's size and depth, each standing
  // straight out of it with its face as far towards the camera as that allows.
  // Two discs can't touch if their centres are more than a diameter apart, so
  // the directions are pushed apart until all of them are.
  const crownHits = (count: number): HitDef[] => {
    const radius = BLADE_R * HIT.scale;
    const sample: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i += 7) sample.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    const units = sample.map((p) => p.clone().normalize());
    const surface = (dir: THREE.Vector3) => {
      let best = 0, bestDot = -2;
      for (let i = 0; i < units.length; i++) {
        const d = units[i].dot(dir);
        if (d > bestDot) { bestDot = d; best = i; }
      }
      return sample[best];
    };
    const centre = (dir: THREE.Vector3) => surface(dir).clone().addScaledVector(dir, radius - HIT.depth);

    const faceOf = (dir: THREE.Vector3) => {
      const face = toCamera.clone().addScaledVector(dir, -toCamera.dot(dir));
      if (face.lengthSq() < 1e-3) face.set(0, 1, 0).addScaledVector(dir, -dir.y);
      return face.normalize();
    };
    // Do two discs cut each other? Where their planes meet, a line; they touch
    // if that line runs through both, along a shared stretch.
    const line = new THREE.Vector3(), toOther = new THREE.Vector3();
    const reach = radius * 1.04;
    const touch = (a: THREE.Vector3, na: THREE.Vector3, c: THREE.Vector3, nc: THREE.Vector3) => {
      line.crossVectors(na, nc);
      const sin2 = line.lengthSq();
      if (sin2 < 1e-4) return Math.abs(toOther.subVectors(c, a).dot(na)) < 0.04 && a.distanceTo(c) < reach * 2;
      // the point on the line nearest to a: in a's plane, on c's plane
      const inPlane = new THREE.Vector3().crossVectors(line, na).normalize();
      const dist = toOther.subVectors(c, a).dot(nc) / inPlane.dot(nc);
      const onLine = a.clone().addScaledVector(inPlane, dist);
      line.normalize();
      const halfA = reach ** 2 - dist ** 2;
      const offC = onLine.clone().sub(c);
      const alongC = offC.dot(line);
      const halfC = reach ** 2 - (offC.lengthSq() - alongC ** 2);
      if (halfA <= 0 || halfC <= 0) return false;
      return Math.abs(alongC) < Math.sqrt(halfA) + Math.sqrt(halfC);
    };

    // Even on a sphere to begin with (Fibonacci), then apart on the real shape.
    const dirs = Array.from({ length: count }, (_, n) => {
      const y = 1 - (2 * (n + 0.5)) / count, r = Math.sqrt(1 - y * y), a = n * Math.PI * (3 - Math.sqrt(5));
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    });
    const push = new THREE.Vector3();
    for (let round = 0; round < 400; round++) {
      const at = dirs.map(centre), faces = dirs.map(faceOf);
      let clear = true;
      dirs.forEach((dir, n) => {
        push.set(0, 0, 0);
        at.forEach((other, m) => {
          if (m === n || !touch(at[n], faces[n], other, faces[m])) return;
          clear = false;
          push.add(at[n].clone().sub(other).normalize());
        });
        dir.addScaledVector(push, 0.03).normalize();
      });
      if (clear) break;
    }

    // The ones the camera sees come first; the very first where the single hit is.
    const facing = toCamera.clone().multiplyScalar(0.7).add(new THREE.Vector3(...HIT.want).normalize()).normalize();
    dirs.sort((p, q) => q.dot(facing) - p.dot(facing));
    return dirs.map((dir) => {
      const turned = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceOf(dir)), "XYZ");
      return { scale: HIT.scale, depth: HIT.depth, tilt: [turned.x, turned.y], hit: surface(dir).clone(), out: dir };
    });
  };

  const makeHit = async (def: HitDef, startU: number) => {
    const hit = def.hit ?? nearestTo(new THREE.Vector3(...def.want!));
    const inDir = def.out ?? new THREE.Vector3(hit.x, hit.y, 0).normalize(); // the blade lies in the screen plane
    const stuck = hit.clone().addScaledVector(inDir, BLADE_R * def.scale - def.depth);
    const start = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(0, 0.3, 0.6));

    const blade = wireMesh(bladeGeometry(), bladeColor, bgColor, 0.95, true);
    blades.push(blade);
    blade.group.visible = false;
    blade.group.scale.setScalar(def.scale);
    blade.group.rotation.set(def.tilt[0], def.tilt[1], 0); // spin (rotation.z) stays around the blade's own axis
    skull.add(blade.group); // rides along with the skull's knock-back

    const crackPts = crackTris(hit);
    const crackGeo = new THREE.BufferGeometry();
    crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(crackPts, 3));
    crackGeo.setDrawRange(0, 0); // nothing until pose() says so: a blade gets built while the scene keeps rendering
    const cracks = new THREE.Mesh(crackGeo, crackMat);
    cracks.renderOrder = 1;
    skull.add(cracks);
    const crackCount = crackPts.length / 3;

    // Blood out of the wound: straight at the camera (in skull space, so
    // against the yaw), a little outward and up so the spurts arc, in a wide cone.
    // A blade placed around the skull: straight out of its own wound, or blood
    // from the far side would come through the head.
    const jetAxis = def.out
      ? def.out.clone().add(new THREE.Vector3(0, 0.1, 0)).normalize()
      : toCamera.clone().add(hit.clone().normalize().multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.2, 0)).normalize();
    const blood = createBlood({ hit, axis: jetAxis, count: def.out ? AROUND_COUNT : BLOOD_COUNT, ink: throwColor, px, jet: BLOOD_JET, pulses: BLOOD_PULSES, pressure: def.out ? AROUND_PRESSURE : BLOOD_PRESSURE, dropSize: def.out ? AROUND_DROP : BLOOD_DROP, depth: def.out ? AROUND_DEPTH : BLOOD_DEPTH });
    blood.setTime(-1);
    skull.add(blood.points);

    await breathe();

    // The shards are pieces of the skull: same fill, same lines, a bit brighter.
    const shardAxis = jetAxis.clone().applyAxisAngle(Y_AXIS, YAW); // shards live in world space
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

    return {
      hit,
      blood,
      startU,
      u: startU, // seconds since the blade struck, negative while it's on its way
      fired: false,
      stop: stopAt,
      mist: null as Blood | null,
      addMist() {
        if (this.mist) return;
        const axis = jetAxis.clone().multiplyScalar(0.5).add(toCamera).normalize();
        this.mist = createBlood({ hit, axis, count: MIST_COUNT, ink: throwColor, px, jet: BLOOD_JET, pulses: BLOOD_PULSES, pressure: MIST_PRESSURE, dropSize: MIST_DROP, depth: AROUND_DEPTH });
        skull.add(this.mist.points);
      },
      // Blade, cracks, blood and shards at this hit's time.
      pose() {
        const u = this.fired ? this.u : -1e3;
        // blade: flies in, sinks, spins down
        const fly = u + BLADE_FLIGHT;
        blade.group.visible = fly > 0;
        if (blade.group.visible) {
          const k = Math.min(fly / BLADE_FLIGHT, 1);
          blade.group.position.lerpVectors(start, stuck, k * k);
          blade.group.rotation.z = -(Math.min(fly, BLADE_FLIGHT) * 42 + (u > 0 ? (1 - Math.exp(-3 * u)) * 42 / 3 : 0));
        }
        // cracks spread over 0.5 s (6 vertices per ribbon segment)
        crackGeo.setDrawRange(0, u > 0 ? Math.floor(Math.min(1, u / 0.5) * crackCount / 6) * 6 : 0);
        blood.setTime(u);
        this.mist?.setTime(u);

        // shards: burst from the hit point, slow down, hang there
        const origin = world.worldToLocal(skull.localToWorld(hit.clone()));
        const d = settle(u);
        for (const s of shards) {
          // With a later stop nothing hangs in the air: they're gone by then.
          s.m.visible = u > 0 && (this.stop === FREEZE_AT || u < this.stop);
          if (!s.m.visible) continue;
          s.m.position.copy(origin).addScaledVector(s.vel, d);
          s.m.rotation.set(s.spin.x * d, s.spin.y * d, s.spin.z * d);
        }
      },
    };
  };

  await breathe();
  const placed = crown ? crownHits(crown) : [];
  const moreDefs: readonly HitDef[] = crown ? placed.slice(1) : MORE_HITS;
  const first = await makeHit(placed[0] ?? HIT, -HIT_AT);
  const hits = [first];
  let fired = 1; // how many of the blades are in play

  // Theme toggle (data-theme, or data-ai-theme on adhdActivated): recolor everything in place.
  new MutationObserver(() => {
    readColors();
    skullParts.lineMat.color.copy(lineColor);
    skullParts.fillMat.color.copy(bgColor);
    for (const b of blades) { b.fillMat.color.copy(bgColor); b.lineMat.color.copy(bladeColor); }
    crackMat.color.copy(bgColor);
    for (const m of shardMats) { m.lineMat.color.copy(lineColor); m.fillMat.color.copy(bgColor); }
    for (const h of hits) { h.blood.recolor(); h.mist?.recolor(); } // its ink is throwColor itself
    dirty = true;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-ai-theme"] });

  // ── layout ──
  let w = 1, h = 1;
  const resize = () => {
    w = section.clientWidth; h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: step back so skull + blood fit the width
    const tall = w / h < 0.8;
    camera.position.set(0, 0.2, tall ? 8.5 : 5.8);
    // narrow screens: the skull's visible middle in the screen's
    if (free) {
      camera.position.x = visualCentre.x;
      camera.position.y = visualCentre.y;
      camera.lookAt(visualCentre);
    } else if (tall) camera.lookAt(visualCentre);
    else camera.lookAt(0, 0.08, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    dirty = true;
  };
  new ResizeObserver(resize).observe(section);

  // ── drag to turn the whole scene ──
  // Sideways and up/down for a mouse; on touch only sideways (touch-action
  // pan-y in skull.css), so a vertical swipe still scrolls the page.
  const turn = { x: 0, y: 0, tx: 0, ty: 0 };
  let free = false, misty = false;
  const pivot = new THREE.Vector3();
  const freeTurn = new THREE.Quaternion(), freeStep = new THREE.Quaternion(), freeEuler = new THREE.Euler();
  let drag: { id: number; x: number; y: number } | null = null;
  section.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("a, button")) return; // the link shards and the button stay clickable
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    section.setPointerCapture(e.pointerId);
    section.classList.add("is-turning");
  });
  section.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (free) {
      freeEuler.set((e.clientY - drag.y) * 0.008, (e.clientX - drag.x) * 0.008, 0);
      freeTurn.premultiply(freeStep.setFromEuler(freeEuler));
      drag.x = e.clientX; drag.y = e.clientY;
      dirty = true;
      return;
    }
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
  const gap = { x: 0, y: 0 };
  const gapPoint = new THREE.Vector3();
  let started = false;
  let instant = false; // reduced motion: hits jump to their end
  let settledAt = 0; // when the last hit froze, 0 while one is under way
  let settled = false;
  let building = false; // a [more?] hit is still being built
  let dirty = true;
  let last = performance.now();

  const toScreen = (p: THREE.Vector3) => {
    const q = p.clone().project(camera);
    return [q.x, q.y] as const;
  };

  function reset() {
    started = false;
    fired = 1;
    for (const h of hits) { h.u = h.startU; h.fired = false; }
    settledAt = 0;
    if (settled) { settled = false; onSettled(false); }
    for (const link of links) {
      link.style.visibility = "hidden";
      link.style.pointerEvents = "none";
    }
  }

  function pose() {
    // the drag, eased
    turn.x += (turn.tx - turn.x) * 0.15;
    turn.y += (turn.ty - turn.y) * 0.15;
    if (free) {
      // Around the skull's own middle, which stays in the middle of the screen.
      world.quaternion.copy(freeTurn);
      world.position.copy(visualCentre).sub(pivot.copy(visualCentre).applyQuaternion(freeTurn));
    } else world.rotation.set(turn.x, turn.y, 0);
    if (Math.abs(turn.tx - turn.x) + Math.abs(turn.ty - turn.y) > 1e-3) dirty = true;

    // approach: from far behind the grid, in the middle of its opening, up to
    // its place in front of the camera
    const away = 1 - easeOut(rise);
    const far = APPROACH_Z * away;
    gapPoint.set(gap.x, gap.y, 0.5).unproject(camera).sub(camera.position);
    gapPoint.multiplyScalar((far + visualCentre.z - camera.position.z) / gapPoint.z).add(camera.position).sub(visualCentre);
    skull.position.y = gapPoint.y * away;

    // knock-back: per hit one heavy damped wobble, then the shaking until the freeze
    let kick = 0, shake = 0, kickZ = 0;
    for (const h of hits) {
      if (!h.fired || h.u <= 0) continue;
      // Frozen in the finale's ball: the knocks have to be over by then, or the
      // skull hangs off the middle it turns around.
      const k = Math.exp(-4 * h.u) * Math.sin(10 * h.u) * 1.5 * (free ? 1 - THREE.MathUtils.smoothstep(h.u, 0, h.stop) : 1);
      kick += k;
      kickZ += k * Math.sign(h.hit.x || 1);
      if (h.u < FREEZE_AT) shake += Math.sin(h.u * 63) * 0.012 * (1 - h.u / FREEZE_AT);
    }
    skull.position.z = far - kick * 0.22;
    skull.position.x = gapPoint.x * away + shake;
    skull.rotation.x = -kick * 0.12;
    skull.rotation.z = kickZ * 0.07;
    world.updateMatrixWorld();

    for (const h of hits) h.pose();

    const originWorld = skull.localToWorld(first.hit.clone());
    const u = first.fired ? first.u : -1;

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

  function frame(now: number) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (!started && rise >= 0.995) { started = true; first.fired = true; }
    if (started) {
      let done = !building;
      for (const h of hits) {
        if (!h.fired || h.u >= h.stop) continue;
        h.u = instant ? h.stop : Math.min(h.u + dt, h.stop);
        done = h.u >= h.stop && done;
        dirty = true;
      }
      if (!done) settledAt = 0;
      else if (!settledAt) settledAt = now;
      if (!settled && settledAt && (instant || now - settledAt > SETTLED_PAUSE)) { settled = true; onSettled(true); }
    }
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
    setGap(x: number, y: number) {
      gap.x = x; gap.y = y;
      dirty = true;
    },
    wound: () => toScreen(skull.localToWorld(hits[fired - 1].hit.clone())), // the latest hit
    // A clean skull again, every blade back in play, and from now on it turns
    // like a ball, any way round.
    clean() {
      for (const h of hits) { h.fired = false; h.u = h.startU; }
      fired = 0;
      misty = true;
      free = true;
      // and back in its starting pose, however it was turned
      drag = null;
      turn.x = turn.y = turn.tx = turn.ty = 0;
      freeTurn.identity();
      section.style.touchAction = "none";
      resize(); // the camera now looks straight at the skull's middle
      dirty = true;
    },
    hitsLeft: () => moreDefs.length - 1 - (fired - 1),
    // `stop`: this hit freezes that long after striking; by default as the rest.
    async moreHit(stop = stopAt) {
      if (fired > moreDefs.length) return;
      const i = fired++;
      settled = false;
      settledAt = 0;
      building = true;
      hits[i] ??= await makeHit(moreDefs[i - 1], -BLADE_FLIGHT);
      building = false;
      hits[i].stop = stop;
      if (misty) hits[i].addMist();
      hits[i].u = -BLADE_FLIGHT;
      if (i < fired) hits[i].fired = true; // unless scrolled back out meanwhile
    },
    finish() {
      rise = 1; started = true; instant = true;
      first.fired = true;
      first.u = FREEZE_AT;
      dirty = true;
      pose(); renderer.render(scene, camera);
    },
  };
}
