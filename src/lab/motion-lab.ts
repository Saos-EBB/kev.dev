// Motion Lab (hidden page, saosebb43/index.html; only mounts when the URL
// hash is #isking — obscurity, not protection: the hash ships in this
// file). Two effects studied from wodniack.dev, rebuilt here with our own
// tokens and code.
//  1. CSS-3D objects: JS only writes --x/--y/--z/--rx/--ry per frame, the
//     transform lives in CSS. Things (cans, balls, a saw
//     blade, a skull, a knife, a teapot — src/lab/throwables.ts) fly in
//     from deep z; grab one and it
//     comes to the front and follows the pointer; let go and it vanishes.
//  2. Vanish: a 30-frame dissolve sprite (painted here on a canvas, not
//     copied) used as a mask and stepped through with steps(29).
import "../style.css";
import "../reading.css";
import "./motion-lab.css";
import "@fontsource-variable/jetbrains-mono";
import { gsap } from "gsap";
import { THROWABLES, renderThrowable } from "./throwables";

const MARKUP = `
  <div class="ml-scene js-scene"></div>
  <header class="ml-head">
    <h1 class="ml-title">Motion Lab</h1>
    <p class="ml-hint">Grab something and let go — it dissolves. Click a card to vanish it.</p>
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
  const COUNT = 9;
  const FAR_Z = -20000;
  const NEAR_Z = 900; // past the camera (perspective 1000px) -> respawn

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

  type Obj = {
    el: HTMLElement;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    vz: number;
    vrx: number;
    vry: number;
    state: "flying" | "dragging" | "vanishing";
  };

  const scene = document.querySelector<HTMLElement>(".js-scene")!;
  const pointer = { x: 0, y: 0 };
  let dragged: Obj | null = null;

  function spawn(o: Obj, randomDepth: boolean) {
    o.x = (Math.random() - 0.5) * window.innerWidth * 1.2;
    o.y = (Math.random() - 0.5) * window.innerHeight * 1.2;
    o.z = randomDepth ? FAR_Z * Math.random() : FAR_Z;
    o.rx = Math.random() * 360;
    o.ry = Math.random() * 360;
    o.vz = 4 + Math.random() * 6; // px per ms
    o.vrx = 0.02 + Math.random() * 0.06; // deg per ms
    o.vry = 0.02 + Math.random() * 0.06;
    o.state = "flying";
    o.el.classList.remove("is-vanishing", "is-dragging");
    // A new random thing on every throw.
    const t = THROWABLES[Math.floor(Math.random() * THROWABLES.length)];
    o.el.style.setProperty("--w", `${t.w}px`);
    o.el.style.setProperty("--h", `${t.h}px`);
    o.el.innerHTML = renderThrowable(t);
  }

  const objects: Obj[] = Array.from({ length: COUNT }, () => {
    const el = document.createElement("div");
    el.className = "ml-obj";
    scene.append(el);
    const o: Obj = { el, x: 0, y: 0, z: 0, rx: 0, ry: 0, vz: 0, vrx: 0, vry: 0, state: "flying" };
    spawn(o, true);
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
      gsap.delayedCall((VANISH_MS + 1000) / 1000, () => spawn(o, false));
    });
    return o;
  });

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX - window.innerWidth / 2;
    pointer.y = e.clientY - window.innerHeight / 2;
  });

  // One loop on gsap.ticker, same as the main site's Lenis/GSAP setup.
  gsap.ticker.add((_time, dt) => {
    for (const o of objects) {
      if (o.state === "flying") {
        o.z += o.vz * dt;
        o.rx += o.vrx * dt;
        o.ry += o.vry * dt;
        if (o.z > NEAR_Z) spawn(o, false);
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
