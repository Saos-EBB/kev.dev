// /testFable5.2 (loud.ts): the room behind the menu as a real room. It's dark,
// and two lights are in it: the skull, which glows, and the pointer, a torch.
// Every surface is shaded by how far it is from the skull (the walls get darker
// towards the viewer, the ceiling most), and the floor is polished: it mirrors
// the skull and the paint on the back wall, carries the skull's shadow and a
// sheen under the torch. Where two surfaces meet it's darker (less light gets
// into a corner), the skull's glow spills its color onto the wall behind it and
// the floor under it, and the walls have a grain, so they read as a material.
// A blade striking lights the whole room for a moment, and now and then the
// light dips like a tired tube.
//
// It's painted light, not computed: gradients laid over a flat picture, built
// from the room's own geometry. Good enough to read as a room, not a renderer.
//
// All of it sits between the walls' paint and the words, comes on with the
// first hit (the start stays blank) and is gone at the end (loud.css).
import gsap from "gsap";

const DARK = 0.8; // of the dark's full strength (--fx-dim in loud.css); the rest is for the flicker
const MIRROR = 0.5; // the reflection is drawn at half the screen's pixels: cheaper, and softer
const FLOOR_BELOW_WALL = 0.055; // of the screen's height: where the skull stands if it can't be measured

type Wall = readonly [number, number, number, number]; // the back wall in percent: left, top, right, bottom

export function createRoomLight(stage: HTMLElement, wall: Wall, skull: HTMLCanvasElement, paint: HTMLCanvasElement) {
  let [l, t, r, b] = wall;
  const room = document.createElement("div");
  room.className = "fx-room";
  room.setAttribute("aria-hidden", "true");
  const names = ["back", "left", "right", "ceil", "floor"] as const;
  room.innerHTML = `
    <canvas class="fx-reflect"></canvas>
    ${names.map((name) => `<i class="fx-surf" data-surf="${name}"></i>`).join("")}
    <i class="fx-grain"></i>
    <svg class="fx-corners" viewBox="0 0 100 100" preserveAspectRatio="none"><path/></svg>
    <i class="fx-spill"></i>
    <i class="fx-sheen"></i>
    <i class="fx-shadow"></i>
    <i class="fx-dark"></i>
    <i class="fx-torch"></i>`;
  stage.querySelector(".ai-words")!.before(room);
  const dark = room.querySelector<HTMLElement>(".fx-dark")!;
  const mirror = room.querySelector<HTMLCanvasElement>(".fx-reflect")!;
  const ctx = mirror.getContext("2d")!;
  let W = 0, H = 0;

  // Everything that depends on the wall and the screen's size; again when
  // either changes (resize below).
  function layout() {
    const poly = (...points: number[][]) => `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
    const FLOOR = poly([l, b], [r, b], [100, 100], [0, 100]);
    const surfaces = {
      back: poly([l, t], [r, t], [r, b], [l, b]),
      left: poly([0, 0], [l, t], [l, b], [0, 100]),
      right: poly([100, 0], [r, t], [r, b], [100, 100]),
      ceil: poly([0, 0], [100, 0], [r, t], [l, t]),
      floor: FLOOR,
    };
    // Lit from the skull: every surface is brightest where it meets the back wall
    // and darkest at the screen's edge. In screen percent, so it fits the wall.
    const shade = {
      back: `radial-gradient(ellipse 75% 85% at 50% 55%, transparent 40%, var(--shade) 125%)`,
      left: `linear-gradient(to right, var(--shade) 0%, transparent ${l}%)`,
      right: `linear-gradient(to left, var(--shade) 0%, transparent ${100 - r}%)`,
      ceil: `linear-gradient(to bottom, var(--shade) 0%, var(--shade-soft) ${t}%)`,
      floor: `linear-gradient(to top, var(--shade-soft) 0%, transparent ${100 - b}%)`,
    };
    for (const name of names) {
      const el = room.querySelector<HTMLElement>(`[data-surf="${name}"]`)!;
      el.style.clipPath = surfaces[name];
      el.style.background = shade[name];
    }
    mirror.style.clipPath = FLOOR;
    room.querySelector<HTMLElement>(".fx-sheen")!.style.clipPath = FLOOR;
    room.querySelector("path")!.setAttribute("d", `M${l} ${t}H${r}V${b}H${l}Z M0 0L${l} ${t} M100 0L${r} ${t} M100 100L${r} ${b} M0 100L${l} ${b}`);
    const dpr = Math.min(devicePixelRatio, 2);
    W = mirror.width = Math.round(innerWidth * dpr * MIRROR);
    H = mirror.height = Math.round(innerHeight * dpr * MIRROR);
  }
  layout();

  // Where the skull stands: its lowest row and its middle, read off a thumbnail
  // of its canvas while it's still clean (until arm()). The mirror turns there.
  let foot = b / 100 + FLOOR_BELOW_WALL, middle = 0.5;
  let armed = false, on = false;
  const thumb = document.createElement("canvas");
  thumb.width = 96;
  thumb.height = 54;
  const tctx = thumb.getContext("2d", { willReadFrequently: true })!;
  function measure() {
    tctx.clearRect(0, 0, 96, 54);
    tctx.drawImage(skull, 0, 0, 96, 54);
    const px = tctx.getImageData(0, 0, 96, 54).data;
    let low = -1, minX = 96, maxX = -1;
    for (let y = 0; y < 54; y++) {
      let count = 0;
      for (let x = 0; x < 96; x++) {
        if (px[(y * 96 + x) * 4 + 3] < 24) continue;
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      if (count >= 3) low = y;
    }
    if (low < 0) return; // nothing drawn yet
    foot = (low + 1) / 54;
    middle = (minX + maxX + 1) / 2 / 96;
    room.style.setProperty("--foot", `${foot * 100}%`);
    room.style.setProperty("--middle", `${middle * 100}%`);
  }

  // Called right after the skull's scene has drawn a frame: only then does its
  // canvas still hold the picture.
  function render() {
    if (!armed) return measure();
    if (!on) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    // the back wall's paint, turned over at the wall's foot
    ctx.globalAlpha = 0.35;
    ctx.setTransform(1, 0, 0, -1, 0, 2 * (b / 100) * H);
    ctx.drawImage(paint, 0, 0, W, H);
    // the skull, turned over where it stands
    ctx.globalAlpha = 0.85;
    ctx.setTransform(1, 0, 0, -1, 0, 2 * foot * H);
    ctx.drawImage(skull, 0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    // fades out with the distance from the wall
    const fade = ctx.createLinearGradient(0, (b / 100) * H, 0, H);
    fade.addColorStop(0, "rgba(0, 0, 0, 1)");
    fade.addColorStop(1, "rgba(0, 0, 0, 0.08)");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);
  }

  // The torch follows the pointer a little behind it, like something with weight.
  const light = { x: 50, y: 38, tx: 50, ty: 38, moving: false };
  function follow() {
    light.x += (light.tx - light.x) * 0.14;
    light.y += (light.ty - light.y) * 0.14;
    room.style.setProperty("--mx", `${light.x.toFixed(2)}%`);
    room.style.setProperty("--my", `${light.y.toFixed(2)}%`);
    light.moving = Math.abs(light.tx - light.x) + Math.abs(light.ty - light.y) > 0.05;
    if (light.moving) requestAnimationFrame(follow);
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !on) return;
    light.tx = (e.clientX / innerWidth) * 100;
    light.ty = (e.clientY / innerHeight) * 100;
    if (!light.moving) { light.moving = true; requestAnimationFrame(follow); }
  }, { passive: true });

  // The tube: a short double dip, never a flash. Stops when the room is gone.
  function flicker() {
    if (!room.isConnected || stage.classList.contains("ai-ended")) return;
    if (!gsap.isTweening(dark)) {
      gsap.timeline()
        .to(dark, { opacity: 1, duration: 0.05 })
        .to(dark, { opacity: DARK, duration: 0.07 })
        .to(dark, { opacity: DARK + 0.12, duration: 0.04, delay: 0.06 })
        .to(dark, { opacity: DARK, duration: 0.2 });
    }
    gsap.delayedCall(4 + Math.random() * 6, flicker);
  }

  return {
    render,
    // A new screen size, maybe with another back wall. Once armed the skull
    // can't be measured again: where it stands moves along with the wall's foot.
    resize(to: Wall) {
      if (armed) {
        foot += (to[3] - b) / 100;
        room.style.setProperty("--foot", `${foot * 100}%`);
      }
      [l, t, r, b] = to;
      if (!armed) foot = b / 100 + FLOOR_BELOW_WALL;
      layout();
    },
    // From here on the skull isn't clean any more: keep the last measurement.
    arm() { armed = true; },
    turnOn() {
      if (on) return;
      on = armed = true;
      room.classList.add("is-on");
      gsap.set(dark, { opacity: DARK });
      gsap.delayedCall(5, flicker);
    },
    // A blow lights the room, then the dark comes back.
    flare(power: number) {
      if (!on) return;
      gsap.fromTo(dark, { opacity: Math.max(0, DARK - 0.7 * power) }, { opacity: DARK, duration: 1.1, ease: "power2.in", overwrite: true });
    },
  };
}
