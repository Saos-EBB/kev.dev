// Thrown objects: every 5–15 s something (cans, balls, a saw blade, a
// skull, a knife, a teapot — throwables.ts) flies at the viewer from a
// random side, with its own synthesized sound (sound.ts), and always
// leaves the same way: through the screen, past the viewer. Grab one and it
// comes to the front and follows the pointer; let go and it is thrown on,
// through you.
// Studied from wodniack.dev, rebuilt with our own shapes and code:
// CSS-3D — JS only writes --x/--y/--z/--rx/--ry per frame, the transform
// lives in throws.css.
// The layer is position: fixed over the viewport, so whatever is thrown is
// always in view, wherever the page is scrolled.
import "./throws.css";
import { gsap } from "gsap";
import { THROWABLES, renderThrowable } from "./throwables";
import { pass, whoosh } from "./sound";

export function startThrows(scene: HTMLElement, firstDelay = 1) {
  const START_Z = -1200;
  // The camera sits at z = 1000 (perspective 1000px): ending past it makes
  // the thing fly right through the viewer — it fills the screen, crosses
  // the camera (the browser stops drawing it behind the eye) — and only
  // then is it removed.
  const END_Z = 1300;
  const GAP_S: [number, number] = [5, 15]; // pause between throws
  const FLIGHT_S: [number, number] = [4.5, 7]; // one throw, start to end
  const RETHROW_S: [number, number] = [1.1, 1.6]; // after a drag: on through you

  // ---- 3D objects -----------------------------------------------------
  // One throw every 5–15 s, each from a random direction. The path is laid
  // out on the SCREEN: from just outside that edge, in a slight arc, to
  // near the middle (power1.out, so it is on screen almost the whole
  // time), while z runs from far back to just past the camera (sine.in,
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
    z0: number; // where this flight starts in depth
    passed: boolean;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    vrx: number;
    vry: number;
    state: "flying" | "dragging";
  };

  const pointer = { x: 0, y: 0 };
  const flying = new Set<Obj>();
  const easeZ = gsap.parseEase("sine.in");
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
      z0: START_Z,
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
    whoosh(o.dur, panOf(o.from[0]), panOf(o.to[0]));

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
      // Let go: a short new flight from where it is now (z ≈ 0, so screen
      // == world x/y) towards the middle and on through the camera — every
      // throw leaves through the screen, past the viewer.
      const miss = 40 + Math.random() * 80;
      const d = Math.hypot(o.x, o.y) || 1;
      o.from = [o.x, o.y];
      o.to = [(-o.x / d) * miss, (-o.y / d) * miss];
      o.arc = 0;
      o.t = 0;
      o.dur = rand(RETHROW_S);
      o.z0 = o.z;
      o.passed = false;
      o.state = "flying";
      el.classList.remove("is-dragging");
      whoosh(o.dur, panOf(o.from[0]), panOf(o.to[0]));
    });
  }

  function remove(o: Obj) {
    flying.delete(o);
    o.el.remove();
  }

  // Nobody sees a throw in a background tab: wait until it is visible
  // again, then throw.
  function whenVisible(fn: () => void) {
    if (!document.hidden) return fn();
    document.addEventListener("visibilitychange", function once() {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", once);
      fn();
    });
  }

  function scheduleNext() {
    gsap.delayedCall(rand(GAP_S), () =>
      whenVisible(() => {
        launch();
        scheduleNext();
      }),
    );
  }

  // First throw right away, then the 5–15 s gaps count from each throw.
  gsap.delayedCall(firstDelay, () => {
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
        o.z = o.z0 + (END_Z - o.z0) * easeZ(u);
        o.x = worldX(sx, o.z);
        o.y = worldX(sy, o.z);
        o.rx += o.vrx * dt;
        o.ry += o.vry * dt;
        if (!o.passed && o.z > 600) {
          o.passed = true;
          pass(o.name, panOf(screenX(o.x, o.z)));
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
}
