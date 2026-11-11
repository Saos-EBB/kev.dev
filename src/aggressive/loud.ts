// /adhdActivated, the loud part. Everything here is an extra on top of what
// the page already does: a blade striking shakes the
// screen, flashes it faintly and throws sparks; a finished page gets a faint
// light sweeping over it; clicks, hovers and dragging the skull spark. The
// room behind the menu gets light, shade and a mirroring floor (room-light.ts). The
// glow, shine and slam-ins are CSS (loud.css), keyed on <html data-fx="loud">,
// which adhdActivated.html sets. Without it every function here does nothing.
//
// Reduced motion switches all of it off (the attribute goes, so the CSS too).
// Full-screen flashes are at least FLASH_GAP apart: never three a second.
import gsap from "gsap";
import { createRoomLight } from "./room-light";
import { onTheme } from "./ai-theme";
import "./loud.css";

const root = document.documentElement;
const LOUD = root.dataset.fx === "loud"; // the page's flag, whatever the motion setting
const ON = LOUD && !(matchMedia("(prefers-reduced-motion: reduce)").matches && !root.classList.contains("force-motion"));
if (LOUD && !ON) delete root.dataset.fx;
// Phones get a lighter version, decided once at load: everything that makes
// the browser filter or read back a full-screen canvas every frame is left out
// (the skull's glow and color split, the mirroring floor, grain and blurred
// corners), and there are fewer, plainer sparks. Shake, flash, the room's shade
// and the slam-ins stay. loud.css follows the attribute.
const LIGHT = matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches;
if (ON && LIGHT) root.dataset.fxLight = "";

const FLASH_GAP = 450; // ms
const SHAKE = 16; // px at power 1
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const css = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

type Spark = { x: number; y: number; vx: number; vy: number; left: number; life: number; size: number; color: string };
const sparks: Spark[] = [];

let ctx: CanvasRenderingContext2D | null = null;
let flashEl: HTMLElement, sweepEl: HTMLElement;
let w = 0, h = 0;
// The sparks' canvas at the screen's size; again when that changes.
function size(canvas: HTMLCanvasElement) {
  const dpr = LIGHT ? 1 : Math.min(devicePixelRatio, 2); // streaks in flight: a phone doesn't need them sharp
  w = innerWidth;
  h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
}
function setup() {
  if (ctx) return;
  const canvas = document.createElement("canvas");
  canvas.className = "fx-sparks";
  flashEl = document.createElement("div");
  flashEl.className = "fx-flash";
  sweepEl = document.createElement("div");
  sweepEl.className = "fx-sweep";
  for (const el of [canvas, flashEl, sweepEl]) el.setAttribute("aria-hidden", "true");
  document.body.append(canvas, sweepEl, flashEl);
  size(canvas);
  addEventListener("resize", () => size(canvas), { passive: true });
}

// Sparks are streaks along their flight: a soft halo, then the hot core.
const STROKES = LIGHT ? [[1, 1.4]] : [[0.25, 4], [1, 1]];
let running = false, last = 0;
function frame(now: number) {
  const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05); // a frame's time can lie before wake()'s
  last = now;
  ctx!.clearRect(0, 0, w, h);
  ctx!.globalCompositeOperation = "lighter";
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.left -= dt;
    if (s.left <= 0) { sparks.splice(i, 1); continue; }
    s.vy += 900 * dt; // they fall
    s.vx *= 1 - 1.8 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const k = s.left / s.life;
    ctx!.strokeStyle = s.color;
    for (const [alpha, width] of STROKES) {
      ctx!.globalAlpha = k * alpha;
      ctx!.lineWidth = s.size * width;
      ctx!.beginPath();
      ctx!.moveTo(s.x, s.y);
      ctx!.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
      ctx!.stroke();
    }
  }
  ctx!.globalAlpha = 1;
  if (sparks.length) requestAnimationFrame(frame);
  else {
    ctx!.clearRect(0, 0, w, h);
    running = false;
  }
}
function wake() {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

// The sparks' colors, read once per theme: a burst comes with every pointer move of a drag.
let colors: string[] | null = null;
onTheme(() => { colors = null; });
function burst(x: number, y: number, count = 14, speed = 420) {
  setup();
  colors ??= [css("--ai-ink"), css("--ai-accent"), css("--fx-shine")];
  if (LIGHT) count = Math.ceil(count / 2);
  for (let i = 0; i < count && sparks.length < 900; i++) {
    const a = rand(0, Math.PI * 2), v = speed * rand(0.25, 1);
    const life = rand(0.35, 0.9);
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25, left: life, life, size: rand(1, 2.6), color: colors[i % 3] });
  }
  wake();
}

// One shake at a time: a new blow only tops up what's left of the last one.
const shaking = { k: 0, power: 0 };
function shake(power: number) {
  const stage = document.querySelector<HTMLElement>(".ai-stage")!;
  shaking.power = Math.max(power, shaking.power * shaking.k);
  // Scale and rotation change every frame: without this hint the browser draws
  // everything on the stage again for each new scale. Only while it shakes.
  stage.style.willChange = "transform";
  gsap.fromTo(shaking, { k: 1 }, {
    k: 0, duration: 0.5, ease: "power2.out", overwrite: true,
    onUpdate() {
      const a = SHAKE * shaking.power * shaking.k;
      gsap.set(stage, { x: rand(-a, a), y: rand(-a, a), rotation: rand(-0.5, 0.5) * shaking.power * shaking.k, scale: 1 + 0.04 * shaking.power * shaking.k });
    },
    onComplete() {
      shaking.power = 0;
      stage.style.willChange = "";
      gsap.set(stage, { clearProps: "transform" }); // or the stage stays the pages' containing block
    },
  });
}

let flashedAt = 0;
function flash(power: number) {
  const now = performance.now();
  if (now - flashedAt < FLASH_GAP) return;
  flashedAt = now;
  setup();
  gsap.fromTo(flashEl, { opacity: Math.min(0.12 * power, 0.25) }, { opacity: 0, duration: 0.45, ease: "power2.out", overwrite: true });
}

// The skull's lines split into red and blue for a moment (loud.css).
function chroma() {
  if (LIGHT) return;
  const skull = document.querySelector<HTMLElement>(".ai-skull");
  if (!skull) return;
  skull.classList.remove("fx-hit");
  void skull.offsetWidth; // restart it
  skull.classList.add("fx-hit");
}

// A blade striking, or anything else that should land like one.
function boom(x: number, y: number, power = 1, withFlash = true) {
  light?.flare(power);
  shake(power);
  if (withFlash) flash(power);
  burst(x, y, Math.round(46 * power), 950 * Math.min(power, 1.4));
  chroma();
}

// A band of light across the whole screen: a page has just become real.
function sweep() {
  setup();
  gsap.fromTo(sweepEl, { xPercent: -130, opacity: 1 }, { xPercent: 130, duration: 0.6, ease: "power2.inOut", overwrite: true, onComplete: () => gsap.set(sweepEl, { opacity: 0 }) });
}

// The projects below the fold slam in when they're scrolled to. The ones on
// screen when the page opens were painted by the blots already and stay put.
let watcher: IntersectionObserver | null = null;
function watch(page: HTMLElement) {
  watcher?.disconnect();
  let first = true;
  watcher = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      if (!first) (e.target as HTMLElement).closest(".ai-proj")!.classList.add("fx-in");
      watcher!.unobserve(e.target);
    }
    first = false;
  }, { root: page, rootMargin: "0px 0px -10% 0px" });
  for (const title of page.querySelectorAll(".ai-proj h2")) watcher.observe(title);
}

// The next project's model kicks the last one out: the frame takes the blow.
function kick(canvas: HTMLElement) {
  const box = canvas.getBoundingClientRect();
  burst(box.left + box.width / 2, box.top + box.height / 2, 26, 700);
  canvas.classList.remove("fx-kick");
  void canvas.offsetWidth;
  canvas.classList.add("fx-kick");
}

if (ON) {
  // Every click sparks; so does pointing at a button, and dragging the skull.
  const HOT = ".ai-word, .ai-button, .ai-proj-more, .ai-more-close";
  addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY, 16, 480), { passive: true });
  addEventListener("pointerover", (e) => {
    const hot = (e.target as Element).closest?.(HOT);
    if (e.pointerType === "mouse" && hot && !hot.contains(e.relatedTarget as Node | null)) burst(e.clientX, e.clientY, 10, 300);
  }, { passive: true });
  let dragged = 0;
  addEventListener("pointermove", (e) => {
    if (!(e.buttons & 1) || (e.target as Element).closest?.(".ai-page, .ai-more, .ai-bar, .ai-scrollbar")) return;
    if (e.timeStamp - dragged < 30) return;
    dragged = e.timeStamp;
    burst(e.clientX, e.clientY, 2, 220);
  }, { passive: true });
}

// The room's light and reflections (room-light.ts): built once the room's
// walls are known, on from the first hit.
let light: ReturnType<typeof createRoomLight> | null = null;
const room = {
  build(stage: HTMLElement, wall: Parameters<typeof createRoomLight>[1], skull: HTMLCanvasElement, paint: HTMLCanvasElement) {
    light = createRoomLight(stage, wall, skull, paint, LIGHT);
    setup(); // the sparks' canvas now, while the page loads, not at the first blow
  },
  render() { light?.render(); },
  resize(wall: Parameters<typeof createRoomLight>[1]) { light?.resize(wall); },
  arm() { light?.arm(); },
  turnOn() { light?.turnOn(); },
};

const nothing = () => {};
const all = { boom, burst, sweep, watch, kick, room };
export const fx: typeof all = ON ? all : { boom: nothing, burst: nothing, sweep: nothing, watch: nothing, kick: nothing, room: { build: nothing, render: nothing, resize: nothing, arm: nothing, turnOn: nothing } };
