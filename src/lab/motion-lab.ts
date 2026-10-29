// Motion Lab (hidden page, saosebb43/index.html; only mounts when the URL
// hash is #isking — obscurity, not protection: the hash ships in this
// file). Two effects studied from wodniack.dev, rebuilt here with our own
// tokens and code.
//  1. CSS-3D objects: JS only writes --x/--y/--z/--rx/--ry per frame, the
//     transform lives in CSS. Things (cans, balls, a saw
//     blade, a skull, a knife, a teapot — src/lab/throwables.ts) get
//     thrown in every 5–15 s from a random side, each with its own
//     synthesized sound (src/lab/sound.ts); grab one and it
//     comes to the front and follows the pointer; let go and it vanishes.
//  2. Vanish: a 30-frame dissolve sprite (painted here on a canvas, not
//     copied) used as a mask and stepped through with steps(29).
import "../style.css";
import "../reading.css";
import "./motion-lab.css";
import "@fontsource-variable/jetbrains-mono";
import { gsap } from "gsap";
import { THROWABLES, renderThrowable } from "./throwables";
import * as sound from "./sound";

const MARKUP = `
  <div class="ml-scene js-scene"></div>
  <header class="ml-head">
    <h1 class="ml-title">Motion Lab</h1>
    <p class="ml-hint">Something gets thrown at you every 5–15 s. Grab it and let go — it dissolves. Click a card to vanish it.</p>
    <button class="ml-sound js-sound" type="button" aria-pressed="false">Sound: off</button>
  </header>
  <section class="ml-cards">
    <article class="ml-card js-vanish"><h2>Why?</h2><p>Hairline box, see-through, grid underneath.</p></article>
    <article class="ml-card js-vanish"><h2>Learned!</h2><p>Sprite mask, stepped, no tween.</p></article>
    <article class="ml-card js-vanish"><h2>Code</h2><p>Click again once it is back.</p></article>
  </section>`;

// Without the hash the page stays an empty body; changing the hash
// reloads so the gate is checked again.
window.addEventListener("hashchange", () => location.reload());
if (location.hash === "#isking") mount();

function mount() {
  document.body.classList.add("ml");
  document.body.innerHTML = MARKUP;

  const FRAMES = 30;
  const VANISH_MS = 750;
  const START_Z = -3000;
  const END_Z = 700; // just past the camera (perspective 1000px)
  const GAP_S: [number, number] = [5, 15]; // pause between throws
  const FLIGHT_S: [number, number] = [4.5, 7]; // one throw, start to end

  // ---- Vanish sprite --------------------------------------------------
  // Each frame is a 16x16 cell grid; every cell gets a random threshold
  // and is opaque until the frame index passes it, so cells drop out in a
  // random but stable order across the 30 frames.
  function paintVanishSprite(): string {
    const cells = 16;
    const px = 8; // per cell -> 128px frames
    const size = cells * px;
    const canvas = document.createElement("canvas");
    canvas.width = size * FRAMES;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const order = Array.from({ length: cells * cells }, () => Math.random());
    ctx.fillStyle = "#000";
    for (let f = 0; f < FRAMES; f++) {
      const cut = f / (FRAMES - 1);
      order.forEach((t, i) => {
        if (t < cut) return;
        ctx.fillRect(f * size + (i % cells) * px, Math.floor(i / cells) * px, px, px);
      });
    }
    return `url(${canvas.toDataURL("image/png")})`;
  }

  document.documentElement.style.setProperty("--vanish-sprite", paintVanishSprite());

  // ---- 3D objects -----------------------------------------------------
  // One throw every 5–15 s, each from a random direction. The path is laid
  // out on the SCREEN: from just outside that edge, in a slight arc, to
  // near the middle (power1.out, so it is on screen almost the whole
  // time), while z runs from far back to just past the camera (power2.in,
  // so it speeds up as it gets close). World x/y are then un-projected
  // from screen x/y for the current z. A straight 3D line would hug the
  // edge for most of the flight and only cross the screen at the end.

  type Obj = {
    el: HTMLElement;
    name: string;
    from: [number, number]; // screen px from the centre
    to: [number, number];
    arc: number; // sideways bow at mid-flight, screen px
    t: number; // seconds into the flight
    dur: number;
    passed: boolean;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    vrx: number;
    vry: number;
    state: "flying" | "dragging" | "vanishing";
  };

  const scene = document.querySelector<HTMLElement>(".js-scene")!;
  const pointer = { x: 0, y: 0 };
  const flying = new Set<Obj>();
  const easeZ = gsap.parseEase("power2.in");
  const easeXY = gsap.parseEase("power1.out");
  let dragged: Obj | null = null;
  const rand = ([a, b]: [number, number]) => a + Math.random() * (b - a);
  const panOf = (screenX: number) => Math.max(-1, Math.min(1, screenX / (window.innerWidth / 2)));
  // Perspective 1000px, origin at the centre: screen = world * 1000 / (1000 - z).
  const screenX = (x: number, z: number) => (x * 1000) / (1000 - z);
  const worldX = (sx: number, z: number) => (sx * (1000 - z)) / 1000;

  function launch() {
    const t = THROWABLES[Math.floor(Math.random() * THROWABLES.length)];
    const el = document.createElement("div");
    el.className = "ml-obj";
    el.style.setProperty("--w", `${t.w}px`);
    el.style.setProperty("--h", `${t.h}px`);
    el.innerHTML = renderThrowable(t);
    scene.append(el);

    const angle = Math.random() * Math.PI * 2;
    const dir = [Math.cos(angle), Math.sin(angle)];
    const edge = Math.hypot(window.innerWidth, window.innerHeight) / 2 + Math.max(t.w, t.h);
    const miss = 40 + Math.random() * 120; // how far it passes from the centre
    const o: Obj = {
      el,
      name: t.name,
      from: [dir[0] * edge, dir[1] * edge],
      to: [-dir[0] * miss, -dir[1] * miss],
      arc: (Math.random() - 0.5) * 0.6 * edge,
      t: 0,
      dur: rand(FLIGHT_S),
      passed: false,
      x: 0,
      y: 0,
      z: START_Z,
      rx: Math.random() * 360,
      ry: Math.random() * 360,
      vrx: (Math.random() < 0.5 ? -1 : 1) * (0.01 + Math.random() * 0.03), // deg per ms
      vry: (Math.random() < 0.5 ? -1 : 1) * (0.01 + Math.random() * 0.03),
      state: "flying",
    };
    flying.add(o);
    sound.whoosh(o.dur, panOf(o.from[0]), panOf(o.to[0]));

    el.addEventListener("pointerdown", (e) => {
      if (o.state !== "flying") return;
      e.preventDefault();
      pointer.x = e.clientX - window.innerWidth / 2;
      pointer.y = e.clientY - window.innerHeight / 2;
      el.setPointerCapture(e.pointerId);
      o.state = "dragging";
      el.classList.add("is-dragging");
      dragged = o;
    });
    el.addEventListener("pointerup", () => {
      if (o.state !== "dragging") return;
      dragged = null;
      o.state = "vanishing";
      el.classList.add("is-vanishing");
      sound.dissolve(panOf(o.x));
      gsap.delayedCall(VANISH_MS / 1000, () => remove(o));
    });
  }

  function remove(o: Obj) {
    flying.delete(o);
    o.el.remove();
  }

  function scheduleNext() {
    gsap.delayedCall(rand(GAP_S), () => {
      launch();
      scheduleNext();
    });
  }

  // First throw right away, then the 5–15 s gaps count from each throw.
  gsap.delayedCall(1, () => {
    launch();
    scheduleNext();
  });

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX - window.innerWidth / 2;
    pointer.y = e.clientY - window.innerHeight / 2;
  });

  // One loop on gsap.ticker, same as the main site's Lenis/GSAP setup.
  gsap.ticker.add((_time, dt) => {
    for (const o of flying) {
      if (o.state === "flying") {
        o.t += dt / 1000;
        const u = Math.min(o.t / o.dur, 1);
        const q = easeXY(u);
        const bow = Math.sin(Math.PI * u) * o.arc; // perpendicular to the path
        const len = Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]) || 1;
        const nx = -(o.to[1] - o.from[1]) / len;
        const ny = (o.to[0] - o.from[0]) / len;
        const sx = o.from[0] + (o.to[0] - o.from[0]) * q + nx * bow;
        const sy = o.from[1] + (o.to[1] - o.from[1]) * q + ny * bow;
        o.z = START_Z + (END_Z - START_Z) * easeZ(u);
        o.x = worldX(sx, o.z);
        o.y = worldX(sy, o.z);
        o.rx += o.vrx * dt;
        o.ry += o.vry * dt;
        if (!o.passed && o.z > 0) {
          o.passed = true;
          sound.pass(o.name, panOf(screenX(o.x, o.z)));
        }
        if (o.t >= o.dur) {
          remove(o);
          continue;
        }
      } else if (o.state === "dragging" && o === dragged) {
        // Pull to z = 0, where screen position == x/y, and ease after the
        // pointer (the original eases its mouse by 0.1 per frame too).
        o.z += (0 - o.z) * 0.15;
        o.x += (pointer.x - o.x) * 0.2;
        o.y += (pointer.y - o.y) * 0.2;
      }
      const s = o.el.style;
      s.setProperty("--x", o.x.toFixed(1));
      s.setProperty("--y", o.y.toFixed(1));
      s.setProperty("--z", o.z.toFixed(1));
      s.setProperty("--rx", o.rx.toFixed(1));
      s.setProperty("--ry", o.ry.toFixed(1));
    }
  });

  // ---- Sound toggle ---------------------------------------------------

  const soundBtn = document.querySelector<HTMLButtonElement>(".js-sound")!;
  let soundOn = false;
  soundBtn.addEventListener("click", async () => {
    soundOn = !soundOn;
    if (soundOn) await sound.unlock();
    sound.setMuted(!soundOn);
    soundBtn.textContent = `Sound: ${soundOn ? "on" : "off"}`;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
  });

  // ---- Vanish on flat UI ---------------------------------------------

  document.querySelectorAll<HTMLElement>(".js-vanish").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("is-vanishing")) return;
      card.classList.add("is-vanishing");
      card.addEventListener(
        "animationend",
        () => {
          card.classList.replace("is-vanishing", "is-gone");
          gsap.delayedCall(1, () => card.classList.remove("is-gone"));
        },
        { once: true },
      );
    });
  });
}
