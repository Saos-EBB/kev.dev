// The contact page: a llama piñata on a rope. A saw blade cuts it in two, the
// halves fall away and everything in it drops out at random, stays where it
// lands and can be grabbed and thrown around. Three of the things are the links:
// a phone, a cat for GitHub and a mailbox for the mail. A click follows them, a
// drag throws them.
import * as THREE from "three";
import { bladeGeometry } from "../contact/skull/parts";
import { half, loadModel, wireModel } from "./models";
import { BLUE, COLORS, box, dispose, part, place, reducedMotion, runScene } from "./wire-kit";

const CUT_AT = 1.6; // s until the blade reaches the piñata
const VIEW = 4.2; // half the height of the picture, in scene units
const GRAVITY = 14;
const BOUNCE = 0.35;
const THROW_MAX = 22; // units/s
const GRAB = 22; // how hard a held thing follows the pointer
const MOVED = 6; // px: more than this and a press on a link was a throw, not a click
const LINKS = ["phone", "cat", "mailbox"]; // the order of the page's .ai-drop links
const THINGS = ["duck", "gnome", "boombox", "gamepad", "clock", "baseball", "bulb", "camera2"];
// All models come with radius 1: these bring them to sizes that belong together.
const SIZES: Record<string, number> = {
  phone: 1.15, cat: 0.95, mailbox: 1.2, duck: 0.65, gnome: 0.85, boombox: 0.9,
  gamepad: 0.65, clock: 0.7, baseball: 0.42, bulb: 0.55, camera2: 0.75,
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Item = {
  o: THREE.Object3D;
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

export function createPinata(canvas: HTMLCanvasElement, links: HTMLElement[]) {
  const page = canvas.closest<HTMLElement>(".ai-page")!;
  const reduced = reducedMotion();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, VIEW / Math.tan((35 * Math.PI) / 360));
  const root = new THREE.Group();
  scene.add(root);
  const floorLine = box(1, 0.01, 0.01, 1, 1, 1, { opacity: 0.5, sketch: true });
  root.add(floorLine);

  const rope = place(box(0.02, 6, 0.02, 1, 1, 1, { sketch: true }), 0, 4, 0);
  const blade = part(bladeGeometry(), { ...BLUE, sketch: true });
  blade.scale.setScalar(1.6);
  blade.visible = false;
  root.add(rope, blade);

  const front = new THREE.Group(), back = new THREE.Group();
  const pinata = new THREE.Group();
  pinata.add(front, back);
  pinata.position.y = 1;
  pinata.scale.setScalar(2);
  root.add(pinata);

  const items: Item[] = [];
  let clock = -1, stopped = false;
  let width = 6, floor = -3.4, size = 1;

  void Promise.all(["llama", ...LINKS, ...THINGS].map(loadModel)).then(([llama, ...drops]) => {
    if (stopped) return;
    front.add(wireModel(half(llama, 1)));
    back.add(wireModel(half(llama, -1)));
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
        o, hx, hy, r: Math.max(hx, hy) * 0.72, own, tall: hy > hx * 1.6,
        x: rand(-0.3, 0.3), y: pinata.position.y, vx: 0, vy: 0,
        angle: rand(0, Math.PI * 2), spin: 0, yaw: rand(-0.7, 0.7),
        out: false, on: false, quiet: 0, asleep: false, link: links[i] ?? null, scale: 1,
      });
    });
    // Out in random order, so what lands where is different every time.
    const order = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((n, k) => { dropAt.set(items[n], k * 0.09); });
    clock = 0;
    blade.visible = true;
  });
  const dropAt = new Map<Item, number>();

  // ── grabbing and throwing ──
  let held: { item: Item; x: number; y: number; id: number; startX: number; startY: number } | null = null;
  const toWorld = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width - 0.5) * 2 * width, (0.5 - (e.clientY - r.top) / r.height) * 2 * VIEW];
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
  const grab = (item: Item, e: PointerEvent) => {
    e.stopPropagation(); // or the skull's stage takes the pointer for itself
    const [x, y] = toWorld(e);
    held = { item, x, y, id: e.pointerId, startX: e.clientX, startY: e.clientY };
    item.on = false;
    moved = false;
    for (const it of items) { it.asleep = false; it.quiet = 0; } // what lay on it falls
  };
  let moved = false;
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
    it.spin = -it.vx * 0.8;
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
    if (calm > 4.5 && !held) for (const it of items) if (it.out) { it.asleep = true; it.vx = it.vy = it.spin = 0; }
    for (const it of items) {
      if (!it.out || it.asleep) continue;
      if (held?.item === it) {
        it.vx = (held.x - it.x) * GRAB;
        it.vy = (held.y - it.y) * GRAB;
        it.spin *= 0.9;
      } else {
        it.vy -= GRAVITY * dt;
      }
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.angle += it.spin * dt;
      const bottom = floor + extY(it);
      it.on = it.y <= bottom + 0.01;
      if (it.y < bottom) {
        it.y = bottom;
        it.vy = Math.abs(it.vy) < 1.4 ? 0 : -it.vy * BOUNCE;
        it.vx *= 0.82;
        it.spin = it.spin * 0.6 + it.vx * -0.25 * dt * 60 * 0.05;
      }
      // Comes to lie on one of its sides.
      if (it.on && Math.abs(it.vx) < 1 && held?.item !== it) {
        const quarter = it.tall ? Math.PI * 2 : Math.PI / 2;
        const flat = Math.round(it.angle / quarter) * quarter;
        it.angle += (flat - it.angle) * Math.min(dt * 8, 1);
        it.spin *= 0.7;
        it.vx *= 0.9;
      }
      const ex = extX(it);
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
        const knock = Math.hypot(b.vx - a.vx, b.vy - a.vy) > 4;
        if (knock) { a.asleep = b.asleep = false; a.quiet = b.quiet = 0; }
        const nx = dx / d, ny = dy / d, push = (min - d) / 2;
        const aHeld = held?.item === a || a.asleep, bHeld = held?.item === b || b.asleep;
        if (!aHeld) { a.x -= nx * push; a.y -= ny * push; }
        if (!bHeld) { b.x += nx * push; b.y += ny * push; }
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel > 0) continue;
        const j2 = (-(1 + BOUNCE) * rel) / 2;
        if (!aHeld) { a.vx -= j2 * nx; a.vy -= j2 * ny; a.spin += j2 * 0.4; }
        if (!bHeld) { b.vx += j2 * nx; b.vy += j2 * ny; b.spin -= j2 * 0.4; }
      }
    }
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

  const handle = runScene(canvas, camera, scene, (_, dt) => {
    width = VIEW * camera.aspect;
    floor = -VIEW + (camera.aspect < 0.8 ? 0.5 : 1.2);
    floorLine.position.y = floor;
    floorLine.scale.x = width * 2;
    if (clock < 0) return;
    clock += dt; // frame time: a slow start can't skip the cut
    const t = reduced ? CUT_AT + 4 : clock;
    if (t < CUT_AT) pinata.rotation.z = Math.sin(t * 3) * 0.06;
    rope.visible = t < CUT_AT + 0.4;
    const k = Math.min(t / CUT_AT, 1);
    blade.position.set(-width - 2 + (width + 2) * k * k + (t > CUT_AT ? (t - CUT_AT) * 11 : 0), pinata.position.y + 0.4, 1.2);
    blade.rotation.z = -t * 18;
    blade.visible = t < CUT_AT + 0.9;
    const after = Math.max(t - CUT_AT, 0);
    const drop = 0.5 * GRAVITY * after * after; // falls out of the picture, the things stay
    front.position.set(Math.min(after, 1.4) * 0.35, -drop / 2, 0);
    front.rotation.z = -Math.min(after * 0.9, 0.8);
    back.position.set(-Math.min(after, 1.4) * 0.35, -drop / 2, 0);
    back.rotation.z = Math.min(after * 0.9, 0.8);
    pinata.visible = drop < 16;
    if (t < CUT_AT) return;

    for (const it of items) {
      if (!it.out && after >= dropAt.get(it)!) {
        it.out = true;
        it.o.visible = true;
        it.vx = rand(-width, width) * 1.1; // anywhere across the floor
        it.vy = rand(1, 6);
        it.spin = rand(-9, 9);
        calm = 0;
      }
    }
    step(dt / 2);
    step(dt / 2);
    items.forEach((it, i) => {
      if (!it.out) return;
      it.scale += ((lift[i] ? 1.12 : 1) - it.scale) * 0.2;
      it.o.position.set(it.x, it.y, 0);
      it.o.rotation.set(0, it.yaw, it.angle);
      it.o.scale.setScalar(it.own * it.scale);
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
