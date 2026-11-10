// /testFable5.2: the same room as /adhdActivated, louder. Everything here is an
// extra on top of what the page already does: a blade striking shakes the
// screen, flashes it and throws sparks and a shockwave; a finished page gets a
// light sweeping over it; clicks, hovers and dragging the skull spark. The
// glow, shine and slam-ins are CSS (loud.css), keyed on <html data-fx="loud">,
// which testFable.html sets. On /adhdActivated every function here does nothing.
//
// Reduced motion switches all of it off (the attribute goes, so the CSS too).
// Full-screen flashes are at least FLASH_GAP apart: never three a second.
import gsap from "gsap";
import "./loud.css";

const root = document.documentElement;
export const LOUD = root.dataset.fx === "loud"; // the route, whatever the motion setting
const ON = LOUD && !(matchMedia("(prefers-reduced-motion: reduce)").matches && !root.classList.contains("force-motion"));
if (LOUD && !ON) delete root.dataset.fx;

const FLASH_GAP = 450; // ms
const SHAKE = 16; // px at power 1
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const css = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

type Spark = { x: number; y: number; vx: number; vy: number; left: number; life: number; size: number; color: string };
type Ring = { x: number; y: number; r: number; speed: number; left: number; life: number; width: number; color: string };
const sparks: Spark[] = [];
const rings: Ring[] = [];

let ctx: CanvasRenderingContext2D | null = null;
let flashEl: HTMLElement, sweepEl: HTMLElement;
let w = 0, h = 0;
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
  const dpr = Math.min(devicePixelRatio, 2);
  w = innerWidth;
  h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
}

// Sparks are streaks along their flight, rings a line that widens and thins.
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
    for (const [alpha, width] of [[0.25, 4], [1, 1]]) { // a soft halo, then the hot core
      ctx!.globalAlpha = k * alpha;
      ctx!.lineWidth = s.size * width;
      ctx!.beginPath();
      ctx!.moveTo(s.x, s.y);
      ctx!.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
      ctx!.stroke();
    }
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.left -= dt;
    if (r.left <= 0) { rings.splice(i, 1); continue; }
    r.r += r.speed * dt;
    r.speed *= 1 - 2.2 * dt;
    const k = r.left / r.life;
    ctx!.globalAlpha = k;
    ctx!.strokeStyle = r.color;
    ctx!.lineWidth = r.width * k + 1;
    ctx!.beginPath();
    ctx!.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx!.stroke();
  }
  ctx!.globalAlpha = 1;
  if (sparks.length || rings.length) requestAnimationFrame(frame);
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

function burst(x: number, y: number, count = 14, speed = 420) {
  setup();
  const colors = [css("--ai-ink"), css("--ai-accent"), css("--fx-shine")];
  for (let i = 0; i < count && sparks.length < 900; i++) {
    const a = rand(0, Math.PI * 2), v = speed * rand(0.25, 1);
    const life = rand(0.35, 0.9);
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25, left: life, life, size: rand(1, 2.6), color: colors[i % 3] });
  }
  wake();
}

function ring(x: number, y: number, power: number) {
  setup();
  const reach = Math.hypot(w, h);
  for (const [k, color] of [[1, css("--fx-shine")], [0.6, css("--ai-accent")]] as const) {
    rings.push({ x, y, r: 8, speed: reach * 1.5 * k * Math.min(power, 1.5), left: 0.7, life: 0.7, width: 14 * power * k, color });
  }
  wake();
}

// One shake at a time: a new blow only tops up what's left of the last one.
const shaking = { k: 0, power: 0 };
function shake(power: number) {
  const stage = document.querySelector<HTMLElement>(".ai-stage")!;
  shaking.power = Math.max(power, shaking.power * shaking.k);
  gsap.fromTo(shaking, { k: 1 }, {
    k: 0, duration: 0.5, ease: "power2.out", overwrite: true,
    onUpdate() {
      const a = SHAKE * shaking.power * shaking.k;
      gsap.set(stage, { x: rand(-a, a), y: rand(-a, a), rotation: rand(-0.5, 0.5) * shaking.power * shaking.k, scale: 1 + 0.04 * shaking.power * shaking.k });
    },
    onComplete() {
      shaking.power = 0;
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
  gsap.fromTo(flashEl, { opacity: Math.min(0.3 * power, 0.6) }, { opacity: 0, duration: 0.45, ease: "power2.out", overwrite: true });
}

// The skull's lines split into red and blue for a moment (loud.css).
function chroma() {
  const skull = document.querySelector<HTMLElement>(".ai-skull");
  if (!skull) return;
  skull.classList.remove("fx-hit");
  void skull.offsetWidth; // restart it
  skull.classList.add("fx-hit");
}

// A blade striking, or anything else that should land like one.
function boom(x: number, y: number, power = 1, withFlash = true) {
  shake(power);
  if (withFlash) flash(power);
  ring(x, y, power);
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

const nothing = () => {};
const all = { boom, burst, sweep, watch, kick };
export const fx: typeof all = ON ? all : { boom: nothing, burst: nothing, sweep: nothing, watch: nothing, kick: nothing };
