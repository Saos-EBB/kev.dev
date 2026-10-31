// Live wireframe renderer for the renderer card's "Details" panel.
// Ported from https://github.com/Saos-EBB/Renderder (renderer.js): same
// math — perspective divide (x/z, y/z), rotation in a plane, 16-step depth
// shading — on a plain 2D canvas, no graphics library.
//
// Differences from the original, on purpose: it redraws only when something
// changed (no idle loop) and works on typed arrays so a frame allocates
// nothing. Everything else is there: rotate, zoom, cutaway with its three
// axes, model switch.
//
// Loaded lazily: this file and every model are separate chunks that only
// download when the demo is first opened.
//
// Shown full screen (fullscreen: true on the card's widget): while it's open
// the demo takes every input, the glowing frame says so, Esc leaves. Next to
// the canvas the chain that turns downloaded files into models, from the
// Renderder repo's README.

import "./renderer.css";
import { UI } from "../../i18n/ui";
import { LITE } from "../../viewport";
import { loadCranium } from "./renderer-models/cranium";

interface Model {
  vs: { x: number; y: number; z: number }[];
  fs: number[][];
}

// Order matters: something simple first, the CT last as the highlight.
const MODELS = [
  { id: "ducky", label: UI.rModels.ducky },
  { id: "car", label: UI.rModels.car },
  { id: "pochita30", label: UI.rModels.pochita30 },
  { id: "craniumCut01", label: UI.rModels.craniumCut01 },
] as const;

const loaders = import.meta.glob("./renderer-models/*.js") as Record<
  string,
  () => Promise<{ default: Model }>
>;

// 16 blues, near (bright) to far (dark) — colors live in style.css :root (--shade-0..15).
const readShades = () => {
  const st = getComputedStyle(document.documentElement);
  return Array.from({ length: 16 }, (_, i) => st.getPropertyValue(`--shade-${i}`).trim());
};

const CAMERA_DISTANCE = 2.5;
const DRAG_SPEED = 0.01; // radians per pixel
const KEY_STEP = 0.15;
const ZOOM_STEP = 1.1; // multiplied: a fixed step is nothing far away and a jump up close
const ZOOM_MIN = 0.1; // the perspective divide needs z above 0
const ZOOM_MAX = 40;
const CUT_STEP = 0.05;
const AXES = ["x", "y", "z"] as const;
// One wheel notch; trackpads send many small deltas instead.
const notches = (e: WheelEvent) => Math.max(-3, Math.min(3, -e.deltaY / (e.deltaMode === 1 ? 3 : 100)));

interface Mesh {
  verts: Float32Array; // xyz per vertex, rotated in place
  base: Float32Array; // as loaded, for the cutaway and reset: the cut plane turns with the model
  edges: Uint32Array; // vertex index pairs, each edge once
  // Per edge and axis (xyz per edge): the lowest centroid of the faces it
  // belongs to. The edge stays while one of its faces is still in front of the plane.
  cuts: Float32Array;
  range: { lo: number; hi: number }[]; // centroid range per axis
}

function buildMesh(model: Model): Mesh {
  const n = model.vs.length;
  const verts = new Float32Array(n * 3);
  model.vs.forEach((v, i) => {
    verts[i * 3] = v.x;
    verts[i * 3 + 1] = v.y;
    verts[i * 3 + 2] = v.z;
  });
  // Neighbouring faces share edges; keep each once. Rough by face centroid,
  // like the original: the cut edge is jagged and the inside shows hollow.
  const seen = new Map<number, number>();
  const pairs: number[] = [];
  const cuts: number[] = [];
  const range = AXES.map(() => ({ lo: Infinity, hi: -Infinity }));
  for (const f of model.fs) {
    const centroid = AXES.map((axis, k) => {
      const c = f.reduce((sum, i) => sum + model.vs[i][axis], 0) / f.length;
      if (c < range[k].lo) range[k].lo = c;
      if (c > range[k].hi) range[k].hi = c;
      return c;
    });
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      const key = a < b ? a * n + b : b * n + a;
      const at = seen.get(key);
      if (at === undefined) {
        seen.set(key, pairs.length / 2);
        pairs.push(a, b);
        cuts.push(...centroid);
      } else {
        for (let k = 0; k < 3; k++) cuts[at * 3 + k] = Math.min(cuts[at * 3 + k], centroid[k]);
      }
    }
  }
  return { verts, base: verts.slice(), edges: Uint32Array.from(pairs), cuts: Float32Array.from(cuts), range };
}

// Horizontal drag turns around Y (x/z plane), vertical around X (y/z
// plane) — screen axes, like the original.
function rotate(verts: Float32Array, aroundY: number, aroundX: number) {
  const cy = Math.cos(aroundY);
  const sy = Math.sin(aroundY);
  const cx = Math.cos(aroundX);
  const sx = Math.sin(aroundX);
  for (let i = 0; i < verts.length; i += 3) {
    const x = verts[i] * cy - verts[i + 2] * sy;
    let z = verts[i] * sy + verts[i + 2] * cy;
    const y = verts[i + 1] * cx - z * sx;
    z = verts[i + 1] * sx + z * cx;
    verts[i] = x;
    verts[i + 1] = y;
    verts[i + 2] = z;
  }
}

export function mount(host: HTMLElement) {
  host.classList.add("rwidget");
  const file = (ext: string) => `<span class="rchain-file">${ext}</span>`;
  const tool = (name: string, what: string) =>
    `<div class="rchain-tool"><code>${name}</code><span>${what}</span></div>`;
  const keys = (list: string[], what: string) => `<li>${list.map((k) => `<kbd>${k}</kbd>`).join("")} <span>${what}</span></li>`;
  host.innerHTML = `
    <p class="rwidget-capture"><i aria-hidden="true"></i>${UI.rCapture}</p>
    <details class="rchain"${LITE ? "" : " open"}>
      <summary>${UI.rChainTitle}</summary>
      <p class="rchain-lead">${UI.rChainLead}</p>
      <div class="rchain-flow">
        ${file(".dcm")}
        ${tool("dcm2stl.py", UI.rConvDcm)}
        ${file(".stl")}
        ${tool("cutInHalf.js", UI.rConvCut)}
        ${file(".stl")}
        ${tool("stl2model.js", UI.rConvStl)}
        <div class="rchain-side">${file(".obj")}${tool("obj2model.js", UI.rConvObj)}</div>
        <div class="rchain-end">
          ${file("modell.js")}
          <p>${UI.rConvOut}</p>
          <p class="rwidget-hud--stats" aria-live="polite"></p>
        </div>
      </div>
    </details>
    <div class="rwidget-stage">
      <div class="rwidget-tabs" role="group" aria-label="${UI.rPick}">
        ${MODELS.map((m, i) => `<button type="button" data-model="${m.id}" aria-pressed="false">${i + 1} ${m.label}</button>`).join("")}
      </div>
      <canvas class="rwidget-canvas" tabindex="0" role="img" aria-label="${UI.rCanvas}"></canvas>
      <p class="rwidget-status" aria-live="polite"></p>
      <div class="rwidget-bar">
        <label class="rwidget-cut"><span>${UI.rCut}</span><input type="range" min="0" max="1" step="0.005" value="0" /></label>
        <button type="button" data-axis>${UI.rAxis} <b>z</b></button>
        <button type="button" data-zoom="1" aria-label="${UI.rZoom} −">−</button>
        <button type="button" data-zoom="-1" aria-label="${UI.rZoom} +">+</button>
        <button type="button" data-reset>${UI.rReset}</button>
      </div>
      <ul class="rwidget-keys">
        ${keys([UI.rKeyLeft, "← ↑ ↓ →"], UI.rDoTurn)}
        ${keys([UI.rKeyWheel, "+ −"], UI.rZoom)}
        ${keys([UI.rKeyRightWheel, "Shift + " + UI.rKeyWheel, "[ ]"], UI.rCut)}
        ${keys(["A", UI.rKeyThumb], UI.rAxis)}
        ${keys(["R"], UI.rReset)}
      </ul>
    </div>
  `;
  const canvas = host.querySelector<HTMLCanvasElement>(".rwidget-canvas")!;
  const status = host.querySelector<HTMLElement>(".rwidget-status")!;
  const hudStats = host.querySelector<HTMLElement>(".rwidget-hud--stats")!;
  const fmt = new Intl.NumberFormat(UI.numberLocale);
  const tabs = [...host.querySelectorAll<HTMLButtonElement>("[data-model]")];
  const ctx = canvas.getContext("2d")!;
  const cutInput = host.querySelector<HTMLInputElement>(".rwidget-cut input")!;
  const axisLabel = host.querySelector<HTMLElement>("[data-axis] b")!;

  const cache = new Map<string, Mesh>();
  let mesh: Mesh | null = null;
  let requested = "";
  let pending = 0;
  const SHADES = readShades();
  const buckets: number[][] = SHADES.map(() => []);
  let projected = new Float32Array(0); // x, y, z per vertex, reused
  let distance = CAMERA_DISTANCE;
  let axis = 2; // z, depends on how the model happens to be oriented
  let cut = Infinity; // nothing cut: above every centroid on this axis

  function draw() {
    pending = 0;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!mesh) return;

    const { verts, edges, cuts } = mesh;
    const n = verts.length / 3;
    if (projected.length !== n * 3) projected = new Float32Array(n * 3);
    const scale = Math.min(w, h) / 2;
    const cx = w / 2;
    const cy = h / 2;

    // Shading window from the mesh's real z range, so all 16 steps get used.
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 2; i < verts.length; i += 3) {
      if (verts[i] < lo) lo = verts[i];
      if (verts[i] > hi) hi = verts[i];
    }
    const near = lo + distance;
    const far = hi > lo ? hi + distance : near + 1;

    for (let i = 0; i < n; i++) {
      const z = verts[i * 3 + 2] + distance;
      projected[i * 3] = cx + (verts[i * 3] / z) * scale;
      projected[i * 3 + 1] = cy - (verts[i * 3 + 1] / z) * scale;
      projected[i * 3 + 2] = z;
    }

    for (const b of buckets) b.length = 0;
    for (let e = 0; e < edges.length; e += 2) {
      if (cuts[(e / 2) * 3 + axis] > cut) continue;
      const za = projected[edges[e] * 3 + 2];
      const zb = projected[edges[e + 1] * 3 + 2];
      if (za <= 0.01 || zb <= 0.01) continue;
      const t = Math.min(1, Math.max(0, ((za + zb) / 2 - near) / (far - near)));
      buckets[Math.min(SHADES.length - 1, Math.floor(t * SHADES.length))].push(e);
    }

    ctx.lineWidth = Math.max(1, window.devicePixelRatio || 1);
    // Far first, so near (bright) edges end up on top.
    for (let s = SHADES.length - 1; s >= 0; s--) {
      ctx.strokeStyle = SHADES[s];
      ctx.beginPath();
      for (const e of buckets[s]) {
        const a = edges[e] * 3;
        const b = edges[e + 1] * 3;
        ctx.moveTo(projected[a], projected[a + 1]);
        ctx.lineTo(projected[b], projected[b + 1]);
      }
      ctx.stroke();
    }
  }

  function schedule() {
    if (!pending) pending = requestAnimationFrame(draw);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w === 0 || h === 0 || (w === canvas.width && h === canvas.height)) return;
    canvas.width = w;
    canvas.height = h;
    schedule();
  }
  new ResizeObserver(resize).observe(canvas);

  async function show(id: string) {
    requested = id;
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.model === id)));
    let next = cache.get(id);
    if (!next) {
      status.textContent = UI.rLoading;
      try {
        const model = id === "craniumCut01" ? await loadCranium() : (await loaders[`./renderer-models/${id}.js`]()).default;
        next = buildMesh(model);
        cache.set(id, next);
      } catch {
        if (requested === id) status.textContent = UI.rError;
        return;
      }
    }
    if (requested !== id) return; // user already picked another model
    status.textContent = "";
    mesh = next;
    distance = CAMERA_DISTANCE;
    setAxis(2);
    const verts = fmt.format(next.verts.length / 3);
    const edges = fmt.format(next.edges.length / 2);
    hudStats.textContent = UI.rStats(verts, edges);
    schedule();
  }

  // The slider runs from nothing cut (0) to everything but the last faces (1).
  function setCut(value: number) {
    if (!mesh) return;
    const { lo, hi } = mesh.range[axis];
    cut = Math.min(hi, Math.max(lo, value));
    cutInput.value = String((hi - cut) / (hi - lo || 1));
    schedule();
  }
  function setAxis(next: number) {
    axis = next;
    axisLabel.textContent = AXES[axis];
    cut = Infinity;
    cutInput.value = "0";
    schedule();
  }
  const zoom = (by: number) => {
    distance = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, distance * ZOOM_STEP ** by));
    schedule();
  };
  const moveCut = (by: number) => {
    if (mesh) setCut(Math.min(cut, mesh.range[axis].hi) - by * CUT_STEP);
  };
  const reset = () => {
    if (!mesh) return;
    mesh.verts.set(mesh.base);
    distance = CAMERA_DISTANCE;
    setAxis(2);
  };

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.model!)));
  cutInput.addEventListener("input", () => {
    if (!mesh) return;
    const { lo, hi } = mesh.range[axis];
    setCut(hi - Number(cutInput.value) * (hi - lo));
  });
  host.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-axis]")) setAxis((axis + 1) % 3);
    else if (t.closest("[data-reset]")) reset();
    const z = t.closest<HTMLElement>("[data-zoom]");
    if (z) zoom(Number(z.dataset.zoom));
  });

  // ── every input goes here ──
  // Right button + wheel cuts, wheel alone zooms, forward pushes away / cuts deeper.
  host.addEventListener("wheel", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.buttons & 2 || e.shiftKey) moveCut(notches(e));
    else zoom(notches(e));
  }, { passive: false });
  host.addEventListener("contextmenu", (e) => e.preventDefault());
  // The thumb buttons would otherwise go back in history and lose everything.
  // On window and capturing: they may be pressed anywhere while the demo is open.
  // pointerdown, because cancelling it also cancels the mouse events after it.
  for (const type of ["mousedown", "mouseup", "auxclick", "pointerdown", "pointerup"]) {
    window.addEventListener(type, (e) => {
      const { button } = e as MouseEvent;
      if ((button !== 3 && button !== 4) || !host.closest(".facet-overlay:not([hidden])")) return;
      e.preventDefault();
      if (type === "pointerdown" && button === 3) setAxis((axis + 1) % 3);
    }, true);
  }

  // Drag turns; two fingers pinch to zoom.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return; // the right button belongs to the cut
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) pinch = spread();
  });
  canvas.addEventListener("pointermove", (e) => {
    const last = pointers.get(e.pointerId);
    if (!last || !mesh) return;
    const dx = e.clientX - last.x;
    const dy = last.y - e.clientY;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const now = spread();
      zoom(Math.log(pinch / now) / Math.log(ZOOM_STEP));
      pinch = now;
      return;
    }
    rotate(mesh.verts, dx * DRAG_SPEED, dy * DRAG_SPEED);
    schedule();
  });
  const release = (e: PointerEvent) => pointers.delete(e.pointerId);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // On window and capturing, before the page's own keys. Esc (leaves), Tab
  // (reaches the controls) and browser shortcuts stay untouched.
  window.addEventListener("keydown", (e) => {
    if (!host.closest(".facet-overlay:not([hidden])") || e.key === "Escape" || e.key === "Tab") return;
    if (e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.key)) return;
    const onControl = (e.target as HTMLElement).matches?.("button, input");
    if (onControl && (e.key === " " || e.key === "Enter")) return;
    if (onControl && e.target === cutInput && e.key.startsWith("Arrow")) return;
    e.preventDefault();
    e.stopPropagation();
    if (!mesh) return;
    const turn: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    };
    const t = turn[e.key];
    if (t) {
      rotate(mesh.verts, t[0], t[1]);
      schedule();
    } else if (e.key === "+") zoom(-1);
    else if (e.key === "-") zoom(1);
    else if (e.key === "]") moveCut(1);
    else if (e.key === "[") moveCut(-1);
    else if (e.key === "a" || e.key === "A") setAxis((axis + 1) % 3);
    else if (e.key === "r" || e.key === "R") reset();
    else if (MODELS[Number(e.key) - 1]) void show(MODELS[Number(e.key) - 1].id);
  }, true);

  resize();
  return show(MODELS[0].id);
}
