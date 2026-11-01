// The story of the aggresiveIntro pages: a tool from the old trade hits a thing
// from the new one. One wireframe scene per page, in the skull's look: the tool
// flies in once the page has formed, the target breaks, then it all just hangs.
import * as THREE from "three";

export type ToolName = "about" | "projects" | "contact";

const FLY = 0.42; // s from out of frame to the hit
const SETTLE = 2.6; // how fast the fragments slow down (1/s)

const rand = (a: number, b: number) => a + Math.random() * (b - a);
type Look = { color: number; opacity: number };
type Fragment = { o: THREE.Object3D; home: THREE.Vector3; v: THREE.Vector3; s: THREE.Vector3; turn: THREE.Euler };
type Pose = { pos: [number, number, number]; rot: [number, number, number] };
type Built = { tool: THREE.Object3D; rest: Pose; from: Pose; fragments: Fragment[]; tilt: [number, number] };

export function createToolScene(canvas: HTMLCanvasElement, name: ToolName, colors: { bg: number; ink: number; tool: number }) {
  const TARGET: Look = { color: colors.ink, opacity: 0.65 };
  const DIM: Look = { color: colors.ink, opacity: 0.25 };
  const BRIGHT: Look = { color: colors.ink, opacity: 0.9 };
  const TOOL: Look = { color: colors.tool, opacity: 0.95 };

  const part = (geo: THREE.BufferGeometry, look: Look) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colors.bg, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
    g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: look.color, transparent: true, opacity: look.opacity })));
    return g;
  };
  const place = <T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    o.position.set(x, y, z);
    o.rotation.set(rx, ry, rz);
    return o;
  };
  const box = (w: number, h: number, d: number, sx: number, sy: number, sz: number, look: Look) => part(new THREE.BoxGeometry(w, h, d, sx, sy, sz), look);
  const shape = (pts: number[][], depth: number, look: Look, holes: number[][][] = []) => {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return part(g, look);
  };
  const tube = (pts: number[][], r: number, seg: number, rad: number, look: Look) =>
    part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z = 0]) => new THREE.Vector3(x, y, z))), seg, r, rad, false), look);
  const fragment = (o: THREE.Object3D, v: [number, number, number]): Fragment => ({
    o, home: o.position.clone(), v: new THREE.Vector3(...v), s: new THREE.Vector3(rand(-7, 7), rand(-7, 7), rand(-7, 7)), turn: o.rotation.clone(),
  });
  const shards = (root: THREE.Object3D, at: [number, number, number], count: number) =>
    Array.from({ length: count }, () => {
      const o = place(shape([[0, 0], [rand(0.15, 0.32), rand(-0.06, 0.08)], [rand(0.04, 0.22), rand(0.15, 0.32)]], 0.015, BRIGHT), ...at);
      root.add(o);
      return fragment(o, [rand(-1.6, 1.6), rand(0.2, 2), rand(-0.3, 1.6)]);
    });

  const BUILD: Record<ToolName, (root: THREE.Group) => Built> = {
    // The floor layer's hammer on the keyboard.
    about(root) {
      root.add(place(box(5, 0.18, 1.9, 16, 1, 6, DIM), 0, -0.1, 0));
      const fragments: Fragment[] = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) {
        const x = (c - 6.5) * 0.335 + (r % 2) * 0.05, z = (r - 2) * 0.335;
        const key = place(part(new THREE.CylinderGeometry(0.13, 0.19, 0.14, 4, 1).rotateY(Math.PI / 4), TARGET), x, 0.07, z);
        root.add(key);
        if (Math.hypot(x, z * 1.2) < 0.8) fragments.push(fragment(key, [x * 3 + rand(-0.5, 0.5), rand(1.1, 2.2), z * 3 + rand(-0.3, 0.6)]));
      }
      const tool = new THREE.Group();
      tool.add(place(part(new THREE.CylinderGeometry(0.17, 0.2, 0.34, 12, 1), TOOL), 0, 0.17, 0));
      tool.add(place(part(new THREE.CylinderGeometry(0.14, 0.17, 0.26, 12, 1), TOOL), 0, 0.47, 0));
      tool.add(place(shape([[-0.14, 0], [0.14, 0], [0.4, 0.3], [0.56, 0.2], [0.24, -0.18], [-0.24, -0.18]], 0.2, TOOL), 0, 0.78, 0));
      tool.add(tube([[0, 0.45], [0.75, 0.47], [1.5, 0.5], [2.3, 0.6]], 0.08, 20, 8, TOOL));
      root.add(tool);
      return { tool, rest: { pos: [0, 0.05, 0], rot: [0, 0.3, 0.72] }, from: { pos: [-0.4, 3.4, 0.3], rot: [0, 0.3, 2.2] }, fragments: fragments.concat(shards(root, [0, 0.1, 0], 6)), tilt: [0.6, -0.5] };
    },
    // The renovation's crowbar through the monitor.
    projects(root) {
      const W = 2.2, H = 1.35;
      root.add(place(shape([[-W, -H], [W, -H], [W, H], [-W, H]], 0.2, TARGET, [[[-W + 0.13, -H + 0.13], [-W + 0.13, H - 0.13], [W - 0.13, H - 0.13], [W - 0.13, -H + 0.13]]]), 0, 0.4, 0));
      root.add(place(box(0.42, 0.9, 0.16, 2, 3, 1, TARGET), 0, -1.35, -0.1), place(box(1.8, 0.1, 0.9, 6, 1, 3, TARGET), 0, -1.8, 0));
      const hit = [0.35, 0.15];
      for (let i = 0; i < 18; i++) {
        if (i % 3 === 0) continue;
        const a = (i / 18) * Math.PI * 2, b = ((i + 1) / 18) * Math.PI * 2;
        const edge = (t: number) => {
          const x = Math.cos(t) * 3, y = Math.sin(t) * 3, k = Math.min(2.07 / Math.max(Math.abs(x), 1e-3), 1.22 / Math.max(Math.abs(y), 1e-3));
          return [x * k, y * k];
        };
        root.add(place(shape([[hit[0] + Math.cos(a) * 0.35, hit[1] + Math.sin(a) * 0.35], edge(a), edge(b)], 0.02, TARGET), 0, 0.4, 0.02 + (i % 2) * 0.03));
      }
      const tool = new THREE.Group();
      tool.add(tube([[0, 0], [0.5, 0.05], [1.4, 0.05], [2, 0.05], [2.3, 0.2], [2.5, 0.5], [2.4, 0.72], [2.2, 0.7]], 0.075, 60, 6, TOOL));
      tool.add(shape([[-0.1, 0], [0.2, 0.12], [0.5, 0.09], [0.5, -0.09], [0.2, -0.12]], 0.05, TOOL));
      root.add(tool);
      return { tool, rest: { pos: [0.35, 0.55, -0.1], rot: [0, -0.8, -0.3] }, from: { pos: [3.2, -0.4, 3.6], rot: [0, -0.8, -0.3] }, fragments: shards(root, [0.35, 0.55, 0.05], 16), tilt: [0.15, -0.55] };
    },
    // The carpet knife through the envelope, pinned to the wall.
    contact(root) {
      root.add(place(box(5.6, 4.2, 0.05, 14, 11, 1, DIM), 0, 0, -0.06));
      const W = 1.7, H = 1.1;
      root.add(box(W * 2, H * 2, 0.04, 8, 6, 1, TARGET));
      root.add(place(shape([[-W, H], [W, H], [0, -0.08]], 0.02, BRIGHT), 0, 0, 0.04));
      root.add(place(shape([[-W, -H], [0, 0.02], [W, -H]], 0.02, TARGET), 0, 0, 0.03));
      const tool = new THREE.Group();
      tool.add(shape([[0, 0], [0.42, 0.26], [0.72, 0.26], [0.72, 0]], 0.02, TOOL)); // the blade
      tool.add(shape([[0.7, -0.04], [2.5, -0.1], [2.75, 0.06], [2.6, 0.3], [0.7, 0.3]], 0.2, TOOL));
      root.add(tool);
      return { tool, rest: { pos: [0.05, 0.25, -0.2], rot: [0, -0.72, -0.15] }, from: { pos: [2.6, 0.7, 2.2], rot: [0, -0.72, -0.15] }, fragments: shards(root, [0.05, 0.25, 0.1], 12), tilt: [0.08, 0.5] };
    },
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
  camera.position.z = 8.6;
  const root = new THREE.Group();
  scene.add(root);
  const built = BUILD[name](root);

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(r.height, 1);
    // A narrow canvas: step back until the whole scene fits its width.
    camera.position.z = 8.6 * Math.max(1, 1.35 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let frameId = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const t = (now - start) / 1000, after = t - FLY;
    const k = Math.min(t / FLY, 1), e = k * k * k;
    root.rotation.set(built.tilt[0], built.tilt[1] + Math.sin(t * 0.3) * 0.08, 0);
    const wobble = after > 0 ? Math.exp(-5 * after) * Math.sin(after * 34) * 0.05 : 0;
    const { from, rest, tool } = built;
    tool.position.set(...(from.pos.map((p, i) => p + (rest.pos[i] - p) * e) as [number, number, number]));
    tool.rotation.set(from.rot[0] + (rest.rot[0] - from.rot[0]) * e + wobble, from.rot[1] + (rest.rot[1] - from.rot[1]) * e, from.rot[2] + (rest.rot[2] - from.rot[2]) * e + wobble);
    const d = after > 0 ? (1 - Math.exp(-SETTLE * after)) / SETTLE : 0;
    for (const f of built.fragments) {
      f.o.position.copy(f.home).addScaledVector(f.v, d);
      f.o.rotation.set(f.turn.x + f.s.x * d, f.turn.y + f.s.y * d, f.turn.z + f.s.z * d);
      f.o.visible = after > 0 || f.v.lengthSq() === 0 || f.o.userData.keep === true;
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  };
  // Keys stay on the board until they're hit; only the loose shards wait unseen.
  for (const f of built.fragments) f.o.userData.keep = !(f.o.children[0] as THREE.Mesh).geometry.type.startsWith("Extrude");
  frameId = requestAnimationFrame(tick);

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
