// Wireframe building blocks in the skull's look: a fill in the background color
// hides what's behind, the lines sit on top. Shared by the page scenes.
import * as THREE from "three";
import { PALETTE } from "./ai-theme";

export const COLORS = { bg: PALETTE.bg, ink: PALETTE.ink, blue: PALETTE.accent };

// `sketch`: only the real edges, no triangles: a clean drawing, for models that
// can't match the skull's scanned detail.
export type Look = { color?: number; opacity?: number; sketch?: boolean };
export const DIM: Look = { opacity: 0.4 };
export const BLUE: Look = { color: COLORS.blue, opacity: 0.95 };

let sketching = false;
// Everything built inside `fn` comes out as a sketch.
export const sketched = <T>(fn: () => T): T => {
  sketching = true;
  try { return fn(); } finally { sketching = false; }
};
export const part = (geo: THREE.BufferGeometry, { color = COLORS.ink, opacity = 0.7, sketch = sketching }: Look = {}) => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLORS.bg, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
  g.add(new THREE.LineSegments(sketch ? new THREE.EdgesGeometry(geo, 25) : new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: sketch ? 1 : opacity })));
  return g;
};
export const place = <T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
};
export const box = (w: number, h: number, d: number, sx = 1, sy = 1, sz = 1, look?: Look) => part(new THREE.BoxGeometry(w, h, d, sx, sy, sz), look);
export const cyl = (r1: number, r2: number, h: number, seg = 12, look?: Look) => part(new THREE.CylinderGeometry(r1, r2, h, seg, 1), look);
export const ball = (r: number, look?: Look) => part(new THREE.SphereGeometry(r, 14, 10), look);
export const lathe = (pts: number[][], seg = 16, look?: Look) => part(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), look);
export const shape = (pts: number[][], depth: number, look?: Look, holes: number[][][] = []) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return part(g, look);
};
export const tube = (pts: number[][], r: number, look?: Look) =>
  part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z = 0]) => new THREE.Vector3(x, y, z))), 30, r, 7, false), look);
export const group = (...children: THREE.Object3D[]) => {
  const g = new THREE.Group();
  g.add(...children);
  return g;
};

// Dragging turns a model, all the way round. A finger only sideways on a page
// that scrolls; a mouse both ways.
export function dragTurn(el: HTMLElement) {
  const turn = { x: 0, y: 0, moved: false, stop() { el.removeEventListener("pointerdown", down); } };
  let last: { x: number; y: number; id: number; mouse: boolean } | null = null;
  const down = (e: PointerEvent) => {
    e.stopPropagation(); // or the skull's stage takes the pointer for itself
    last = { x: e.clientX, y: e.clientY, id: e.pointerId, mouse: e.pointerType === "mouse" };
    turn.moved = false;
    try { el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", (e) => {
    if (!last || e.pointerId !== last.id) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) turn.moved = true;
    turn.y += dx * 0.01;
    if (last.mouse) turn.x += dy * 0.01;
    last.x = e.clientX;
    last.y = e.clientY;
  });
  const up = () => { last = null; };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  return turn;
}

// Every visitor gets the full scenes for now, as with FORCE_MOTION_EVERYWHERE in
// main.ts; false respects the OS setting again.
const FORCE_MOTION = true;
export const reducedMotion = () => !FORCE_MOTION && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function dispose(o: THREE.Object3D) {
  o.traverse((n) => {
    const m = n as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose?.();
  });
}

// A renderer that keeps its canvas's size and draws while `tick` is running.
export function runScene(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, scene: THREE.Scene, tick: (t: number, dt: number) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(r.height, 1);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const start = performance.now();
  let last = start, frameId = 0;
  const frame = (now: number) => {
    tick((now - start) / 1000, Math.min((now - last) / 1000, 0.05));
    last = now;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  };
  frameId = requestAnimationFrame(frame);
  return {
    // The scene as it stands, for the pane the way back tears up.
    paint(ctx: CanvasRenderingContext2D) {
      const r = canvas.getBoundingClientRect();
      renderer.render(scene, camera);
      ctx.drawImage(canvas, r.left, r.top, r.width, r.height);
    },
    stop() {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      renderer.dispose();
    },
  };
}
