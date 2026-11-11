// /adhdActivated (loud.ts): the room behind the menu as a real room. It's dark,
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
import { onTheme } from "./ai-theme";

const DARK = 0.8; // of the dark's full strength (--fx-dim in loud.css); the rest is for the flicker
const MIRROR = 0.5; // the reflection is drawn at half the screen's pixels: cheaper, and softer
const FLOOR_BELOW_WALL = 0.055; // of the screen's height: where the skull stands if it can't be measured

type Wall = readonly [number, number, number, number]; // the back wall in percent: left, top, right, bottom

// `lite` (phones, see LIGHT in loud.ts): a dozen full-screen layers over a
// canvas that draws every frame is too much there. The same shade, glow and
// shadow are painted once onto a single canvas (drawFlat) that only changes
// its opacity; no mirror, no grain, no torch, and the skull is measured once
// instead of every frame (reading its canvas back is slow).
export function createRoomLight(stage: HTMLElement, wall: Wall, skull: HTMLCanvasElement, paint: HTMLCanvasElement, lite = false) {
  let [l, t, r, b] = wall;
  const room = document.createElement("div");
  room.className = "fx-room";
  room.setAttribute("aria-hidden", "true");
  const names = ["back", "left", "right", "ceil", "floor"] as const;
  room.innerHTML = lite ? `<canvas class="fx-flat"></canvas>` : `
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
  // What a blow lights up: the dark's layer, or on a phone the one picture.
  const dark = room.querySelector<HTMLElement>(lite ? ".fx-flat" : ".fx-dark")!;
  const mirror = room.querySelector<HTMLCanvasElement>(lite ? ".fx-flat" : ".fx-reflect")!;
  const ctx = mirror.getContext("2d")!;
  let W = 0, H = 0;
  const FULL = lite ? 1 : DARK; // the dark layer's resting opacity; the flat picture has DARK painted in

  // The phone's picture: every surface's shade, the dark around the skull, its
  // glow on wall and floor and its shadow, as in loud.css, in screen pixels.
  function drawFlat() {
    const css = getComputedStyle(room);
    const rgb = (name: string) => {
      const hex = css.getPropertyValue(name).trim().replace("#", "");
      return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0).join(", ");
    };
    const dim = parseFloat(css.getPropertyValue("--fx-dim")) / 100;
    const shadow = rgb("--fx-shadow"), glow = rgb("--fx-glow");
    const shade = (k = 1) => `rgba(${shadow}, ${dim * k})`;
    const clear = `rgba(${shadow}, 0)`;
    const w = W = mirror.width = innerWidth, h = H = mirror.height = innerHeight;
    const X = (x: number) => (x / 100) * w, Y = (y: number) => (y / 100) * h;
    const surface = (points: number[][], fill: CanvasGradient) => {
      ctx.beginPath();
      points.forEach(([x, y], i) => ctx[i ? "lineTo" : "moveTo"](X(x), Y(y)));
      ctx.fillStyle = fill;
      ctx.fill();
    };
    const across = (x0: number, y0: number, x1: number, y1: number, from: string, to: string) => {
      const g = ctx.createLinearGradient(X(x0), Y(y0), X(x1), Y(y1));
      g.addColorStop(0, from);
      g.addColorStop(1, to);
      return g;
    };
    // An ellipse of light or dark: stops along its radius, 1 = its edge.
    const ellipse = (cx: number, cy: number, rx: number, ry: number, stops: [number, string][], reach = 1) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx, ry);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, reach);
      for (const [at, color] of stops) g.addColorStop(at / reach, color);
      ctx.fillStyle = g;
      ctx.fillRect(-w / rx, -h / ry, (2 * w) / rx, (2 * h) / ry);
      ctx.restore();
    };
    ctx.clearRect(0, 0, w, h);
    surface([[0, 0], [l, t], [l, b], [0, 100]], across(0, 0, l, 0, shade(), clear));
    surface([[100, 0], [r, t], [r, b], [100, 100]], across(100, 0, r, 0, shade(), clear));
    surface([[0, 0], [100, 0], [r, t], [l, t]], across(0, 0, 0, t, shade(), shade(0.5)));
    surface([[l, b], [r, b], [100, 100], [0, 100]], across(0, 100, 0, b, shade(0.5), clear));
    ctx.save();
    ctx.beginPath();
    ctx.rect(X(l), Y(t), X(r - l), Y(b - t));
    ctx.clip();
    ellipse(X(50), Y(55), X(75), Y(85), [[0, clear], [0.4, clear], [1.25, shade()]], 1.25);
    ctx.restore();
    const vmax = Math.max(w, h) / 100;
    ellipse(middle * w, h / 2, 56 * vmax, 56 * vmax, [[0, clear], [16 / 56, clear], [1, shade(DARK)]]);
    ctx.fillStyle = shade(DARK); // beyond the gradient's edge
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.arc(middle * w, h / 2, 56 * vmax, 0, Math.PI * 2, true);
    ctx.fill();
    ellipse(middle * w, h / 2, X(30), Y(44), [[0, `rgba(${glow}, 0.14)`], [0.72, `rgba(${glow}, 0)`]]);
    ellipse(middle * w, (foot + 0.04) * h, X(24), Y(9), [[0, `rgba(${glow}, 0.16)`], [0.75, `rgba(${glow}, 0)`]]);
    ellipse(middle * w, foot * h, X(19), Y(5), [[0, `rgba(${shadow}, 0.8)`], [0.45, `rgba(${shadow}, 0.4)`], [1, `rgba(${shadow}, 0)`]]);
  }
  if (lite) onTheme(drawFlat);

  // Everything that depends on the wall and the screen's size; again when
  // either changes (resize below).
  function layout() {
    if (lite) return drawFlat();
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

  // Where the skull stands: its lowest row and its middle, read off a thumbnail
  // of its canvas while it's still clean (until arm()). The mirror turns there.
  let foot = b / 100 + FLOOR_BELOW_WALL, middle = 0.5;
  let armed = false, on = false, measured = false, mirrorSkip = false;
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
    measured = true;
    foot = (low + 1) / 54;
    middle = (minX + maxX + 1) / 2 / 96;
    room.style.setProperty("--foot", `${foot * 100}%`);
    room.style.setProperty("--middle", `${middle * 100}%`);
    if (lite) drawFlat();
  }
  layout();

  // Called right after the skull's scene has drawn a frame: only then does its
  // canvas still hold the picture.
  function render() {
    if (!armed) { if (!lite || !measured) measure(); return; }
    if (!on || lite) return;
    // Every other picture of the skull: the mirror is dim and a little soft,
    // half the rate doesn't show in it.
    if ((mirrorSkip = !mirrorSkip)) return;
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
  // Written only once it has moved a fifth of a percent of the screen: every
  // write paints three full-screen gradients again (dark, sheen, torch).
  const light = { x: 50, y: 38, tx: 50, ty: 38, moving: false, sx: 50, sy: 38 };
  function follow() {
    light.x += (light.tx - light.x) * 0.14;
    light.y += (light.ty - light.y) * 0.14;
    if (Math.abs(light.x - light.sx) + Math.abs(light.y - light.sy) > 0.2) {
      light.sx = light.x;
      light.sy = light.y;
      room.style.setProperty("--mx", `${light.x.toFixed(1)}%`);
      room.style.setProperty("--my", `${light.y.toFixed(1)}%`);
    }
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
    if (lite || !room.isConnected || stage.classList.contains("ai-ended")) return;
    if (!gsap.isTweening(dark)) {
      gsap.timeline()
        .to(dark, { opacity: 1, duration: 0.05 })
        .to(dark, { opacity: DARK, duration: 0.07 })
        .to(dark, { opacity: DARK + 0.12, duration: 0.04, delay: 0.06 })
        .to(dark, { opacity: DARK, duration: 0.2 });
    }
    window.setTimeout(flicker, (4 + Math.random() * 6) * 1000); // a timer, not gsap's: that one would tick every frame while waiting
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
      gsap.set(dark, { opacity: FULL });
      window.setTimeout(flicker, 5000);
    },
    // A blow lights the room, then the dark comes back.
    flare(power: number) {
      if (!on) return;
      gsap.fromTo(dark, { opacity: Math.max(0, FULL - 0.7 * power) }, { opacity: FULL, duration: 1.1, ease: "power2.in", overwrite: true });
    },
  };
}
