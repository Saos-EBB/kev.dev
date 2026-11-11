// The contact page on /adhdActivated: a piñata being split open.
//
// A striped llama swings on its rope. A saw blade drops from above along the
// rope, cuts it and goes straight through the llama: time stands for a moment,
// then the two halves fly apart, confetti and everything inside burst up and
// out in a fountain, and the blade hits the floor and rolls off. What fell out
// stays where it lands, has a shadow on the floor and can be grabbed and thrown.
// Three of the things are the links (a phone, a cat for GitHub, a mailbox for
// the mail): bigger, in the accent color, each with its name on a sign, and
// while nothing else moves one of them hops to say "take me". A click follows
// them, a drag throws them.
import * as THREE from "three";
import { bladeGeometry } from "../contact/skull/parts";
import { half, loadModel, wireModel } from "./models";
import { BLUE, COLORS, box, dispose, follow, part, reducedMotion, runScene } from "./wire-kit";
import { THEME } from "./ai-theme";
import { LITE } from "../viewport";
import { fx } from "./loud";

const CUT_AT = 1.8; // s until the blade is in the middle of the piñata
const HIT_STOP = 0.09; // s everything stands still at the cut
const BLADE_SPEED = 26; // units/s on its way down
const ROLL_SPEED = 9; // units/s along the floor afterwards
const VIEW = 4.2; // half the height of the picture, in scene units
const PIVOT = 5.2; // where the rope hangs from, above the picture
const HANG_Y = 1; // the piñata's middle
const STRIPES = 9; // bands of paper from head to foot
const CONFETTI = LITE ? 70 : 150;
const GRAVITY = 14;
const BOUNCE = 0.22;
const AIR_SPIN = 2.2, AIR_DRAG = 0.5; // per second: what the air takes from a turn and from speed
const FLOOR_GRIP = 0.78; // what's left of the speed per step on the floor
const THROW_MAX = 22; // units/s
const GRAB = 22; // how hard a held thing follows the pointer
const MOVED = 6; // px: more than this and a press on a link was a throw, not a click
const HOP_EVERY = 3.5; // s between two hops of a link, while all is still
const LINKS = ["phone", "cat", "mailbox"]; // the order of the page's .ai-drop links
const THINGS = ["duck", "gnome", "boombox", "gamepad", "clock", "baseball", "bulb", "camera2"];
// All models come with radius 1: these bring them to sizes that belong together.
// The links are the biggest things on the floor.
const SIZES: Record<string, number> = {
  phone: 1.35, cat: 1.15, mailbox: 1.4, duck: 0.6, gnome: 0.8, boombox: 0.85,
  gamepad: 0.6, clock: 0.65, baseball: 0.4, bulb: 0.5, camera2: 0.7,
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Item = {
  o: THREE.Object3D;
  shadow: THREE.Mesh;
  hx: number; hy: number; r: number; // half its box, the circle it collides with
  x: number; y: number; vx: number; vy: number;
  angle: number; spin: number; yaw: number;
  own: number; // its size
  tall: boolean; // too thin to lie around: gets back on its feet
  out: boolean; on: boolean; // dropped yet; lying on the floor
  quiet: number; asleep: boolean; // how long it's hardly moved; then it stays put until disturbed
  link: HTMLElement | null;
  scale: number;
};

// The model's triangles in every other band of its height: the paper stripes.
function stripes(geo: THREE.BufferGeometry, odd: boolean) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox!;
  const index = geo.getIndex()!, pos = geo.getAttribute("position");
  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    const y = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
    const band = Math.floor(((y - min.y) / (max.y - min.y)) * STRIPES);
    if ((band % 2 === 1) === odd) kept.push(a, b, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", pos);
  g.setIndex(kept);
  return g;
}

export function createPinataBurst(canvas: HTMLCanvasElement, links: HTMLElement[]) {
  const page = canvas.closest<HTMLElement>(".ai-page")!;
  const reduced = reducedMotion();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, VIEW / Math.tan((35 * Math.PI) / 360));
  const root = new THREE.Group();
  scene.add(root);
  const floorLine = box(1, 0.01, 0.01, 1, 1, 1, { opacity: 0.5, sketch: true });
  root.add(floorLine);

  // Shadows on the floor: darker than the page, whichever theme.
  const shadowGeo = new THREE.CircleGeometry(1, 24);
  const makeShadow = () => {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
    follow(mat, () => mat.color.setHex(THEME === "white" ? 0x9cc7de : 0x23050d));
    const m = new THREE.Mesh(shadowGeo, mat);
    m.position.z = -1.5;
    m.visible = false;
    root.add(m);
    return m;
  };
  // Under a thing at height `up` above the floor: wider and fainter the higher it is.
  const castShadow = (m: THREE.Mesh, x: number, reach: number, up: number) => {
    const k = THREE.MathUtils.clamp(1 - up / 6, 0, 1);
    m.visible = k > 0.02;
    m.position.set(x, floor - 0.02, -1.5);
    m.scale.set(reach * (1.5 - 0.4 * k), 0.09 + 0.05 * (1 - k), 1);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.75 * k * k;
  };

  // The rope hangs from above the picture, the piñata on its end: one pendulum.
  const hang = new THREE.Group();
  hang.position.y = PIVOT;
  const ropeLength = PIVOT - HANG_Y - 0.6;
  const rope = new THREE.Group(); // scaled from its top end, see the cut
  const ropeLine = box(0.03, ropeLength, 0.03, 1, 1, 1, { sketch: true });
  ropeLine.position.y = -ropeLength / 2;
  rope.add(ropeLine);
  const front = new THREE.Group(), back = new THREE.Group();
  const pinata = new THREE.Group();
  pinata.add(front, back);
  pinata.position.y = HANG_Y - PIVOT;
  pinata.scale.setScalar(2);
  hang.add(rope, pinata);
  const pinataShadow = makeShadow();

  const bladeGeo = bladeGeometry();
  bladeGeo.computeBoundingBox();
  const blade = part(bladeGeo, { ...BLUE, sketch: true });
  blade.scale.setScalar(1.6);
  const bladeRadius = bladeGeo.boundingBox!.max.x * 1.6;
  blade.visible = false;
  root.add(hang, blade);

  // Confetti: paper in the page's two colors.
  const confettiMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.07), confettiMat, CONFETTI);
  confetti.visible = false;
  confetti.frustumCulled = false;
  const paintConfetti = () => {
    const color = new THREE.Color();
    for (let i = 0; i < CONFETTI; i++) confetti.setColorAt(i, color.setHex(i % 3 ? COLORS.ink : COLORS.blue));
    confetti.instanceColor!.needsUpdate = true;
  };
  follow(confettiMat, paintConfetti);
  root.add(confetti);
  const bits = Array.from({ length: CONFETTI }, () => ({ x: 0, y: 0, z: rand(-0.6, 0.6), vx: 0, vy: 0, a: rand(0, 6), spin: rand(-9, 9), flip: rand(0, 6), down: false }));
  const bitMatrix = new THREE.Object3D();

  const items: Item[] = [];
  const dropAt = new Map<Item, number>();
  let clock = -1, stopped = false, wasCut = false, stop = 0;
  let width = 6, floor = -3.4, size = 1;

  void Promise.all(["llama", ...LINKS, ...THINGS].map(loadModel)).then(([llama, ...drops]) => {
    if (stopped) return;
    for (const [side, into] of [[1, front], [-1, back]] as const) {
      const piece = half(llama, side);
      into.add(wireModel(stripes(piece, false)), wireModel(stripes(piece, true), COLORS.blue));
    }
    size = camera.aspect < 0.8 ? 0.8 : 1;
    const names = [...LINKS, ...THINGS];
    drops.forEach((geo, i) => {
      geo.computeBoundingBox();
      const b = geo.boundingBox!;
      const own = SIZES[names[i]] * size;
      const hx = ((b.max.x - b.min.x) / 2) * own, hy = ((b.max.y - b.min.y) / 2) * own;
      const o = wireModel(geo, i < LINKS.length ? COLORS.blue : COLORS.ink);
      o.scale.setScalar(own);
      o.visible = false;
      root.add(o);
      items.push({
        o, shadow: makeShadow(), hx, hy, r: Math.max(hx, hy) * 0.72, own, tall: hy > hx * 1.6,
        x: rand(-0.3, 0.3), y: HANG_Y, vx: 0, vy: 0,
        angle: rand(0, Math.PI * 2), spin: 0, yaw: rand(-0.7, 0.7),
        out: false, on: false, quiet: 0, asleep: false, link: links[i] ?? null, scale: 1,
      });
    });
    // Out in random order, so what lands where is different every time.
    const order = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((n, k) => { dropAt.set(items[n], k * 0.055); });
    clock = 0;
  });

  // ── grabbing and throwing ──
  let held: { item: Item; x: number; y: number; id: number; startX: number; startY: number } | null = null;
  const toWorld = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width - 0.5) * 2 * width, (0.5 - (e.clientY - r.top) / r.height) * 2 * VIEW];
  };
  const toScreen = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    return [(x / (width * 2) + 0.5) * r.width + r.left, (0.5 - y / (VIEW * 2)) * r.height + r.top] as const;
  };
  const pick = (x: number, y: number) => {
    let best: Item | null = null, bestD = Infinity;
    for (const it of items) {
      if (!it.out) continue;
      const d = Math.hypot(it.x - x, it.y - y);
      if (d < Math.max(it.r, 0.7) * 1.25 && d < bestD) { best = it; bestD = d; }
    }
    return best;
  };
  let moved = false;
  const grab = (item: Item, e: PointerEvent) => {
    e.stopPropagation(); // or the skull's stage takes the pointer for itself
    const [x, y] = toWorld(e);
    held = { item, x, y, id: e.pointerId, startX: e.clientX, startY: e.clientY };
    item.on = false;
    moved = false;
    for (const it of items) { it.asleep = false; it.quiet = 0; } // what lay on it falls
  };
  const onCanvas = (e: PointerEvent) => {
    const [x, y] = toWorld(e);
    const item = pick(x, y);
    if (item) grab(item, e);
  };
  const onMove = (e: PointerEvent) => {
    if (!held || e.pointerId !== held.id) return;
    [held.x, held.y] = toWorld(e);
    if (Math.hypot(e.clientX - held.startX, e.clientY - held.startY) > MOVED) moved = true;
  };
  const onUp = (e: PointerEvent) => {
    if (!held || e.pointerId !== held.id) return;
    const it = held.item;
    it.vx = THREE.MathUtils.clamp(it.vx, -THROW_MAX, THROW_MAX);
    it.vy = THREE.MathUtils.clamp(it.vy, -THROW_MAX, THROW_MAX);
    it.spin = THREE.MathUtils.clamp(-it.vx * 0.25, -4, 4);
    held = null;
    calm = 0;
  };
  canvas.addEventListener("pointerdown", onCanvas);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  const lift: boolean[] = [];
  links.forEach((link, i) => {
    link.draggable = false;
    link.addEventListener("pointerdown", (e) => { if (items[i]) grab(items[i], e); });
    link.addEventListener("click", (e) => { if (moved) e.preventDefault(); });
    link.addEventListener("dragstart", (e) => e.preventDefault());
    const set = (v: boolean) => () => { lift[i] = v; };
    link.addEventListener("pointerenter", set(true));
    link.addEventListener("pointerleave", set(false));
    link.addEventListener("focus", set(true));
    link.addEventListener("blur", set(false));
  });

  // Half the box of a thing turned by `a` around the view axis.
  const extY = (it: Item) => Math.abs(Math.cos(it.angle)) * it.hy + Math.abs(Math.sin(it.angle)) * it.hx;
  const extX = (it: Item) => Math.abs(Math.cos(it.angle)) * it.hx + Math.abs(Math.sin(it.angle)) * it.hy;

  // However things are jammed together: soon after the last throw all is still.
  let calm = 0;
  function step(dt: number) {
    calm += dt;
    if (calm > 3.5 && !held) for (const it of items) if (it.out) { it.asleep = true; it.vx = it.vy = it.spin = 0; }
    for (const it of items) {
      if (!it.out || it.asleep) continue;
      if (held?.item === it) {
        it.vx = (held.x - it.x) * GRAB;
        it.vy = (held.y - it.y) * GRAB;
        it.spin *= 0.8;
      } else {
        it.vy -= GRAVITY * dt;
      }
      it.spin *= Math.exp(-AIR_SPIN * dt);
      it.vx *= Math.exp(-AIR_DRAG * dt);
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.angle += it.spin * dt;
      const bottom = floor + extY(it);
      it.on = it.y <= bottom + 0.01;
      if (it.y < bottom) {
        it.y = bottom;
        it.vy = Math.abs(it.vy) < 1.4 ? 0 : -it.vy * BOUNCE;
        it.vx *= FLOOR_GRIP;
        it.spin *= 0.45;
      }
      // Comes to lie on one of its sides.
      if (it.on && Math.abs(it.vx) < 2.5 && held?.item !== it) {
        const quarter = it.tall ? Math.PI * 2 : Math.PI / 2;
        const flat = Math.round(it.angle / quarter) * quarter;
        it.angle += (flat - it.angle) * Math.min(dt * 8, 1);
        it.spin *= 0.5;
        it.vx *= 0.8;
      }
      const ex = extX(it) + 0.3; // a little spare: turned towards the camera they look wider
      if (it.x < -width + ex) { it.x = -width + ex; it.vx = Math.abs(it.vx) * BOUNCE; }
      if (it.x > width - ex) { it.x = width - ex; it.vx = -Math.abs(it.vx) * BOUNCE; }
      if (it.y > VIEW - extY(it)) { it.y = VIEW - extY(it); it.vy = -Math.abs(it.vy) * BOUNCE; }
      it.quiet = Math.abs(it.vx) + Math.abs(it.vy) + Math.abs(it.spin) < 1.5 && held?.item !== it ? it.quiet + dt : 0;
      if (it.quiet > 0.5) { it.asleep = true; it.vx = it.vy = it.spin = 0; }
    }
    // They push each other aside.
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (!a.out) continue;
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        if (!b.out) continue;
        const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d = Math.hypot(dx, dy) || 0.001;
        if (d >= min || (a.asleep && b.asleep)) continue;
        // A proper knock wakes a sleeper; anything less just lands on it.
        const knock = Math.hypot(b.vx - a.vx, b.vy - a.vy) > 6;
        if (knock) { a.asleep = b.asleep = false; a.quiet = b.quiet = 0; }
        const nx = dx / d, ny = dy / d, push = (min - d) / 2;
        const aHeld = held?.item === a || a.asleep, bHeld = held?.item === b || b.asleep;
        if (!aHeld) { a.x -= nx * push; a.y -= ny * push; }
        if (!bHeld) { b.x += nx * push; b.y += ny * push; }
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel > 0) continue;
        const j2 = (-(1 + BOUNCE) * rel) / 2;
        if (!aHeld) { a.vx -= j2 * nx; a.vy -= j2 * ny; a.spin += j2 * 0.08; }
        if (!bHeld) { b.vx += j2 * nx; b.vy += j2 * ny; b.spin -= j2 * 0.08; }
      }
    }
  }

  // Paper falls slowly, tumbling, and stays lying where it comes down.
  function stepConfetti(dt: number) {
    for (let i = 0; i < CONFETTI; i++) {
      const c = bits[i];
      if (!c.down) {
        c.vy -= GRAVITY * 0.35 * dt;
        c.vx *= Math.exp(-1.6 * dt);
        c.vy *= Math.exp(-1.6 * dt);
        c.flip += 7 * dt;
        c.x += (c.vx + Math.sin(c.flip) * 0.8) * dt; // sways as it tumbles
        c.y += c.vy * dt;
        c.a += c.spin * dt;
        if (Math.abs(c.x) > width) { c.x = Math.sign(c.x) * width; c.vx *= -0.4; }
        if (c.y <= floor + 0.03) { c.y = floor + 0.03; c.down = true; c.a = rand(-0.15, 0.15); }
      }
      bitMatrix.position.set(c.x, c.y, c.z);
      bitMatrix.rotation.set(c.down ? 1.35 : c.flip, 0, c.a); // lying flat: seen almost from the side
      bitMatrix.updateMatrix();
      confetti.setMatrixAt(i, bitMatrix.matrix);
    }
    confetti.instanceMatrix.needsUpdate = true;
  }

  // The cut: the halves and the paper take off, the page feels it.
  const halves = { x: 0, y: 0, vx: 1.9, vy: 2.6, turn: 0 }; // in the piñata's own units; the back half mirrored
  function cut() {
    wasCut = true;
    confetti.visible = true;
    for (const c of bits) {
      const a = rand(0.15, Math.PI - 0.15), v = rand(3, 13);
      c.x = rand(-0.5, 0.5);
      c.y = HANG_Y + rand(-0.5, 0.6);
      c.vx = Math.cos(a) * v;
      c.vy = Math.sin(a) * v;
    }
    fx.boom(...toScreen(0, HANG_Y), 1.1);
  }

  // A link stays over its thing, wherever it's been thrown.
  function placeLink(it: Item) {
    const link = it.link!;
    const r = canvas.getBoundingClientRect();
    const scale = r.height / (VIEW * 2);
    const px = (it.x / (width * 2) + 0.5) * r.width + r.left;
    const py = (0.5 - it.y / (VIEW * 2)) * r.height + r.top + page.scrollTop;
    const w = Math.max(extX(it), 0.5) * 2 * scale, h = Math.max(extY(it), 0.5) * 2 * scale;
    link.style.width = `${w}px`;
    link.style.height = `${h}px`;
    link.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px)`;
    link.classList.add("is-on");
  }

  let hopIn = HOP_EVERY, hopNext = 0;
  const handle = runScene(canvas, camera, scene, (_, dt) => {
    width = VIEW * camera.aspect;
    floor = -VIEW + (camera.aspect < 0.8 ? 0.5 : 1.2);
    floorLine.position.y = floor;
    floorLine.scale.x = width * 2;
    if (clock < 0) return;
    if (stop > 0) { stop -= dt; return; } // the moment of the cut
    if (reduced) clock = Math.max(clock, CUT_AT + 4);
    else if (!wasCut && clock + dt >= CUT_AT) { clock = CUT_AT; stop = HIT_STOP; }
    else clock += dt; // frame time: a slow start can't skip the cut
    const t = clock;
    const after = Math.max(t - CUT_AT, 0);
    if (t >= CUT_AT && !wasCut) cut();

    // the piñata on its rope
    if (!wasCut) hang.rotation.z = Math.sin(t * 2.4) * 0.11;
    rope.scale.y = 1 - Math.min(after / 0.2, 1) * 0.7; // cut: what's left snaps up
    halves.vy -= wasCut ? (GRAVITY / 2) * dt : 0;
    if (wasCut) { halves.x += halves.vx * dt; halves.y += halves.vy * dt; halves.turn += 2.6 * dt; }
    front.position.set(halves.x, halves.y, 0);
    front.rotation.z = -halves.turn;
    back.position.set(-halves.x, halves.y, 0);
    back.rotation.z = halves.turn;
    pinata.visible = halves.y > -8;
    castShadow(pinataShadow, Math.sin(hang.rotation.z) * (PIVOT - HANG_Y), 1.6, wasCut ? 99 : HANG_Y - floor - 1.6);

    // the blade: down the rope, through the piñata, onto the floor, and off
    const rest = floor + bladeRadius;
    const fall = HANG_Y + 0.2 + (CUT_AT - t) * BLADE_SPEED;
    const landed = Math.max(t - (CUT_AT + (HANG_Y + 0.2 - rest) / BLADE_SPEED), 0);
    blade.position.set(landed * ROLL_SPEED, Math.max(fall, rest), 1.2);
    blade.rotation.z = -(t - landed) * 18 - (landed * ROLL_SPEED) / bladeRadius;
    blade.visible = fall < VIEW + bladeRadius + 1 && blade.position.x < width + bladeRadius + 1;
    if (!wasCut) return;

    for (const it of items) {
      if (!it.out && after >= dropAt.get(it)!) {
        it.out = true;
        it.o.visible = true;
        it.vx = rand(-1, 1) * width * 0.95; // a fountain: up first, then anywhere across the floor
        it.vy = rand(5, 11);
        it.spin = rand(-5, 5);
        calm = 0;
      }
    }
    step(dt / 2);
    step(dt / 2);
    stepConfetti(dt);

    // All still: one of the links hops.
    if (!held && items.every((it) => it.out && it.asleep)) {
      hopIn -= dt;
      if (hopIn <= 0) {
        const it = items[hopNext++ % LINKS.length];
        it.asleep = false;
        it.quiet = 0;
        it.vy = 4.2;
        it.spin = rand(-1.5, 1.5);
        calm = 0;
        hopIn = HOP_EVERY;
      }
    }

    items.forEach((it, i) => {
      if (!it.out) return;
      it.scale += ((lift[i] ? 1.12 : 1) - it.scale) * 0.2;
      it.o.position.set(it.x, it.y, 0);
      it.o.rotation.set(0, it.yaw, it.angle);
      it.o.scale.setScalar(it.own * it.scale);
      castShadow(it.shadow, it.x, extX(it), it.y - extY(it) - floor);
      if (it.link) placeLink(it);
    });
  });

  return {
    paint: handle.paint,
    stop() {
      stopped = true;
      handle.stop();
      canvas.removeEventListener("pointerdown", onCanvas);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      dispose(root);
    },
  };
}
