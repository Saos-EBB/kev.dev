// Live wireframe renderer for the renderer card's "Details" panel.
// Ported from https://github.com/Saos-EBB/Renderder (renderer.js): same
// math — perspective divide (x/z, y/z), rotation in a plane, 16-step depth
// shading — on a plain 2D canvas, no graphics library.
//
// Differences from the original, on purpose: it redraws only when the
// model is dragged or switched (no idle loop), works on typed arrays so a
// frame allocates nothing, and drops cutaway/zoom to stay small.
//
// Loaded lazily: this file and every model are separate chunks that only
// download when the card is first expanded.

import "./renderer.css";

interface Model {
  vs: { x: number; y: number; z: number }[];
  fs: number[][];
}

// Order matters: something simple first, the CT last as the highlight.
const MODELS = [
  { id: "ducky", label: "Ducky" },
  { id: "car", label: "Auto" },
  { id: "pochita30", label: "Pochita" },
  { id: "craniumCut01", label: "Schädel-CT" },
] as const;

const loaders = import.meta.glob("./renderer-models/*.js") as Record<
  string,
  () => Promise<{ default: Model }>
>;

// 16 blues, near (bright) to far (dark), from the original renderer.
const SHADES = [
  "#89bff5", "#76b5f4", "#63abf2", "#50a1f1", "#3e96ef", "#2b8cee", "#1882ec", "#1278de",
  "#106ecb", "#0f63b8", "#0d59a5", "#0c4f92", "#0a457f", "#093b6d", "#07305a", "#062647",
];

const CAMERA_DISTANCE = 2.5;
const DRAG_SPEED = 0.01; // radians per pixel
const KEY_STEP = 0.15;

interface Mesh {
  verts: Float32Array; // xyz per vertex, rotated in place
  edges: Uint32Array; // vertex index pairs, each edge once
}

function buildMesh(model: Model): Mesh {
  const n = model.vs.length;
  const verts = new Float32Array(n * 3);
  model.vs.forEach((v, i) => {
    verts[i * 3] = v.x;
    verts[i * 3 + 1] = v.y;
    verts[i * 3 + 2] = v.z;
  });
  // Neighbouring faces share edges; keep each once.
  const seen = new Set<number>();
  const pairs: number[] = [];
  for (const f of model.fs) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      const key = a < b ? a * n + b : b * n + a;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(a, b);
    }
  }
  return { verts, edges: Uint32Array.from(pairs) };
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
  host.innerHTML = `
    <div class="rwidget-tabs" role="group" aria-label="Modell wählen">
      ${MODELS.map((m) => `<button type="button" data-model="${m.id}" aria-pressed="false">${m.label}</button>`).join("")}
    </div>
    <canvas class="rwidget-canvas" tabindex="0" role="img"
      aria-label="3D-Modell als Drahtgitter. Mit Maus ziehen oder Pfeiltasten drehen."></canvas>
    <p class="rwidget-status" aria-live="polite"></p>
  `;
  const canvas = host.querySelector<HTMLCanvasElement>(".rwidget-canvas")!;
  const status = host.querySelector<HTMLElement>(".rwidget-status")!;
  const tabs = [...host.querySelectorAll<HTMLButtonElement>("[data-model]")];
  const ctx = canvas.getContext("2d")!;

  const cache = new Map<string, Mesh>();
  let mesh: Mesh | null = null;
  let requested = "";
  let pending = 0;
  let projected = new Float32Array(0); // x, y, z per vertex, reused
  const buckets: number[][] = SHADES.map(() => []);

  function draw() {
    pending = 0;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!mesh) return;

    const { verts, edges } = mesh;
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
    const near = lo + CAMERA_DISTANCE;
    const far = hi > lo ? hi + CAMERA_DISTANCE : near + 1;

    for (let i = 0; i < n; i++) {
      const z = verts[i * 3 + 2] + CAMERA_DISTANCE;
      projected[i * 3] = cx + (verts[i * 3] / z) * scale;
      projected[i * 3 + 1] = cy - (verts[i * 3 + 1] / z) * scale;
      projected[i * 3 + 2] = z;
    }

    for (const b of buckets) b.length = 0;
    for (let e = 0; e < edges.length; e += 2) {
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
      status.textContent = "Lädt …";
      try {
        const mod = await loaders[`./renderer-models/${id}.js`]();
        next = buildMesh(mod.default);
        cache.set(id, next);
      } catch {
        if (requested === id) status.textContent = "Modell konnte nicht geladen werden.";
        return;
      }
    }
    if (requested !== id) return; // user already picked another model
    status.textContent = "";
    mesh = next;
    schedule();
  }

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.model!)));

  let last: { x: number; y: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    last = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!last || !mesh) return;
    rotate(
      mesh.verts,
      (e.clientX - last.x) * DRAG_SPEED,
      (last.y - e.clientY) * DRAG_SPEED,
    );
    last = { x: e.clientX, y: e.clientY };
    schedule();
  });
  const release = () => {
    last = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("keydown", (e) => {
    if (!mesh) return;
    const turn: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    };
    const t = turn[e.key];
    if (!t) return;
    e.preventDefault();
    rotate(mesh.verts, t[0], t[1]);
    schedule();
  });

  resize();
  return show(MODELS[0].id);
}
