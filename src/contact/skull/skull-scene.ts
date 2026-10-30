// Contact 3D scene (loaded lazily by contact-skull.ts): the craniumCut01
// skull rises from the bottom as you scroll in (setRise); once it's up, one
// saw blade flies in and cuts deep into it, and green blood spurts out of
// the wound in pulses, like a cheap splatter movie — deliberately overdone. Bone shards burst out
// with it and hang in the air, and three of them are real links (GitHub,
// mail, phone: the section's .contact-icons <a>s, positioned here over the
// 3D scene every frame). Dragging (mouse, or a sideways swipe) turns the
// whole scene — skull, blade, blood, shards.
//
// Everything after the rise is a closed-form function of the time since the
// sequence started (no stepping; the blood's particles are computed on the
// GPU from that same time), so reduced motion just jumps to the end.
import * as THREE from "three";
import { LITE } from "../../viewport";
import { BLADE_R, bladeGeometry, loadSkullGeometry, wireMesh } from "./parts";

const BLADE_FLIGHT = 0.55; // s from off-screen to stuck
const HIT_AT = 0.5; // s after the skull is up
const FREEZE = 2.6; // how fast shards slow down (1/s) — higher stops sooner
const SHARDS = 22;

// The one hit: upper left of the forehead (a point in skull space: face +z,
// vault +y; the nearest front vertex is the hit point), a big blade sunk
// deep (depth = how far its rim goes past the hit point).
const HIT = { want: [-0.32, 0.6, 0.35], scale: 0.78, depth: 0.42, tilt: [0.25, -0.3] } as const;

// Where the three link shards come to rest, in normalized screen coords
// (-1..1, y up) — portrait screens above/below the skull, landscape beside it.
const LINK_REST = {
  wide: [[-0.62, 0.55], [0.64, 0.25], [-0.62, -0.5]],
  tall: [[-0.55, 0.72], [0.55, 0.72], [0, -0.72]],
} as const;
const LINK_STAGGER = 0.12; // s between the three link shards leaving

// Blood: spurts out of the wound for JET s, in PULSES like a heartbeat
// (each weaker than the last); every drop has its own birth time, life,
// direction and speed, and the vertex shader throws it on a ballistic arc
// until it hits the floor under the skull, where it stays: the drops
// collect into a growing pool (it turns with the scene).
const JET = 3.6;
const PULSES = 7;
const BLOOD_COUNT = LITE ? 1100 : 3000;
const BLOOD_LIFE: [number, number] = [0.8, 1.7];
const BLOOD_SPEED: [number, number] = [1.8, 4.8];
const GRAVITY = 5.2; // scene units / s², pulls the drops down
const FLOOR_Y = -0.85; // the floor the drops land on, just under the jaw (skull space)

export type SkullScene = { setRise(r: number): void; finish(): void };

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const settle = (u: number) => (u <= 0 ? 0 : (1 - Math.exp(-FREEZE * u)) / FREEZE); // distance factor, freezes at 1/FREEZE
const rand = ([a, b]: readonly [number, number]) => a + Math.random() * (b - a);

const BLOOD_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  uniform float uGravity;
  uniform float uFloor;
  attribute float aBirth;
  attribute float aLife;
  attribute float aSpeed;
  attribute vec3 aDir;
  attribute float aSize;
  varying float vF;
  varying float vSeed;
  varying float vLanded;
  void main() {
    float age = uTime - aBirth;
    vF = clamp(age / aLife, 0.0, 1.0);
    vSeed = fract(aBirth * 37.0);
    if (age < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    // thrown out along its direction, falling on a ballistic arc until it
    // reaches the floor (solve y(t) = uFloor), then it stays put
    vec3 v0 = aDir * aSpeed;
    float tLand = (v0.y + sqrt(max(v0.y * v0.y + 2.0 * uGravity * (position.y - uFloor), 0.0))) / uGravity;
    float t = min(age, tLand);
    vLanded = step(tLand, age);
    vec3 p = v0 * t;
    p.y -= 0.5 * uGravity * t * t;
    vec4 mv = modelViewMatrix * vec4(position + p, 1.0);
    gl_Position = projectionMatrix * mv;
    // in flight it shrinks a little; landed it splats wider
    gl_PointSize = aSize * mix(1.0 - 0.25 * vF, 1.3, vLanded) * uPx / -mv.z;
  }
`;

const BLOOD_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uDark;
  varying float vF;
  varying float vSeed;
  varying float vLanded;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c) * 4.0;
    if (d > 1.0) discard;
    // a glossy drop: dark rim, the ink in the middle, a wet highlight;
    // each drop a slightly different green, darkening as it flies and
    // once it lies in the pool
    vec3 col = mix(uInk, uDark, 0.25 * vSeed + 0.35 * vF + 0.2 * vLanded);
    col = mix(col, uDark, smoothstep(0.55, 1.0, d));
    col += smoothstep(0.06, 0.0, dot(c + vec2(0.14, 0.14), c + vec2(0.14, 0.14))) * 0.6;
    float a = smoothstep(1.0, 0.8, d);
    gl_FragColor = vec4(col, a);
  }
`;

// `section` is the screen-high sticky stage (contact-skull.ts), not the tall
// scroll track around it: sizes, visibility and dragging are taken from it.
export async function createSkullScene(section: HTMLElement, canvas: HTMLCanvasElement, links: HTMLElement[]): Promise<SkullScene> {
  // Phones (LITE): no MSAA and at most 1.5x pixels — at 2-3x with
  // antialiasing the dense wire skull lagged there.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, alpha: true });
  const px = Math.min(devicePixelRatio, LITE ? 1.5 : 2);
  renderer.setPixelRatio(px);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  // Everything sits in `world`, which the drag turns.
  const world = new THREE.Group();
  scene.add(world);

  const lineColor = new THREE.Color(), throwColor = new THREE.Color(), bgColor = new THREE.Color(), textColor = new THREE.Color();
  const readColors = () => {
    lineColor.set(css("--color-line") || "#cd57ff");
    throwColor.set(css("--color-throw") || "#89ff57");
    bgColor.set(css("--contact-bg") || "#08070a");
    textColor.set(css("--color-text") || "#f5f5f6");
  };
  readColors();

  // ── skull ──
  const geo = await loadSkullGeometry();
  const skullParts = wireMesh(geo, lineColor, bgColor, 0.32);
  const skull = new THREE.Group();
  skull.add(skullParts.group);
  world.add(skull);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;

  const v = new THREE.Vector3();
  const nearestTo = (p: THREE.Vector3) => {
    let best = Infinity;
    const out = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.z < 0) continue; // front half only, so the hit is visible
      const d = v.distanceToSquared(p);
      if (d < best) { best = d; out.copy(v); }
    }
    return out;
  };

  // Cracks: short random walks over vertices near the hit — more and
  // longer than a light hit, the blade goes deep.
  const crackLines = (hit: THREE.Vector3) => {
    const near: THREE.Vector3[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i);
      if (v.distanceTo(hit) < 0.9 && v.z > hit.z - 0.45) near.push(v.clone());
    }
    const pts: number[] = [];
    for (let c = 0; c < 10; c++) {
      let p = hit.clone();
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.6, Math.random() * 0.3).normalize();
      for (let s = 0; s < 8; s++) {
        const target = p.clone().addScaledVector(dir, 0.09);
        let q: THREE.Vector3 | null = null, qd = Infinity;
        for (const n of near) { const d = n.distanceTo(target); if (d < qd && n.distanceTo(p) > 0.03) { qd = d; q = n; } }
        if (!q) break;
        pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
        p = q;
        dir.x += (Math.random() - 0.5) * 0.6; dir.y += (Math.random() - 0.5) * 0.6; dir.normalize();
      }
    }
    return pts;
  };

  // ── the hit: blade, cracks, blood, shards ──
  const hit = nearestTo(new THREE.Vector3(...HIT.want));
  const inDir = new THREE.Vector3(hit.x, hit.y, 0).normalize(); // the blade lies in the screen plane
  const stuck = hit.clone().addScaledVector(inDir, BLADE_R * HIT.scale - HIT.depth);
  const start = stuck.clone().addScaledVector(inDir, 6).add(new THREE.Vector3(0, 0.3, 0.6));

  const blade = wireMesh(bladeGeometry(), throwColor, bgColor, 0.95, true);
  blade.group.visible = false;
  blade.group.scale.setScalar(HIT.scale);
  blade.group.rotation.set(HIT.tilt[0], HIT.tilt[1], 0); // spin (rotation.z) stays around the blade's own axis
  skull.add(blade.group); // rides along with the skull's knock-back

  const crackPts = crackLines(hit);
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(crackPts, 3));
  const crackMat = new THREE.LineBasicMaterial({ color: textColor, transparent: true, opacity: 0.85, depthTest: false });
  skull.add(new THREE.LineSegments(crackGeo, crackMat));
  const crackCount = crackPts.length / 3;

  // Blood out of the wound: mostly along the outward normal (away from
  // the skull's centre, tipped towards the camera so the spurts read and
  // a little up so they arc), in a wide cone.
  const jetAxis = hit.clone().normalize().add(new THREE.Vector3(0, 0.35, 0.5)).normalize();
  const bloodGeo = new THREE.BufferGeometry();
  const bloodPos = new Float32Array(BLOOD_COUNT * 3);
  const birth = new Float32Array(BLOOD_COUNT), life = new Float32Array(BLOOD_COUNT);
  const speed = new Float32Array(BLOOD_COUNT), size = new Float32Array(BLOOD_COUNT);
  const dirs = new Float32Array(BLOOD_COUNT * 3);
  const d3 = new THREE.Vector3();
  for (let i = 0; i < BLOOD_COUNT; i++) {
    bloodPos.set([hit.x, hit.y, hit.z], i * 3);
    // which spurt: earlier ones get more drops (weight 1/(n+1))
    let n = 0;
    for (let r = Math.random() * 2.6; n < PULSES - 1 && r > 1 / (n + 1); n++) r -= 1 / (n + 1);
    const strength = 1 - n / PULSES;
    birth[i] = (n * JET) / PULSES + Math.random() * 0.12;
    life[i] = rand(BLOOD_LIFE);
    speed[i] = rand(BLOOD_SPEED) * (0.55 + 0.6 * strength);
    // mostly fine spray, every few a fat gob
    size[i] = Math.random() < 0.12 ? 90 + Math.random() * 80 : 18 + Math.random() * 45;
    d3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.9).add(jetAxis).normalize();
    // Not much towards the camera: drops flying at it landed in front of
    // the skull, low on the screen and big, and the pool covered the footer.
    d3.z = Math.min(d3.z, 0.2);
    dirs.set([d3.x, d3.y, d3.z], i * 3);
  }
  bloodGeo.setAttribute("position", new THREE.BufferAttribute(bloodPos, 3));
  bloodGeo.setAttribute("aBirth", new THREE.BufferAttribute(birth, 1));
  bloodGeo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
  bloodGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  bloodGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  bloodGeo.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
  const inkDark = new THREE.Color();
  const bloodMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: -1 },
      uPx: { value: px },
      uGravity: { value: GRAVITY },
      uFloor: { value: FLOOR_Y },
      uInk: { value: throwColor },
      uDark: { value: inkDark.copy(throwColor).multiplyScalar(0.3) },
    },
    vertexShader: BLOOD_VERT,
    fragmentShader: BLOOD_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const blood = new THREE.Points(bloodGeo, bloodMat);
  blood.frustumCulled = false; // the spray leaves the geometry's bounds
  skull.add(blood);

  const shardGeos = [new THREE.TetrahedronGeometry(1), new THREE.OctahedronGeometry(1), new THREE.IcosahedronGeometry(1)].map((g) => new THREE.WireframeGeometry(g));
  // The shards are in the blood's green too, all of them.
  const shardMats: THREE.LineBasicMaterial[] = [];
  const shards = Array.from({ length: SHARDS }, (_, k) => {
    const mat = new THREE.LineBasicMaterial({ color: throwColor, transparent: true, opacity: 0.95 });
    shardMats.push(mat);
    const m = new THREE.LineSegments(shardGeos[k % 3], mat);
    m.scale.setScalar(0.025 + Math.random() * 0.07);
    m.visible = false;
    world.add(m);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 3.4, (Math.random() - 0.2) * 3.4, Math.random() * 1.4).addScaledVector(jetAxis, 1.8);
    const spin = new THREE.Vector3(Math.random() * 14, Math.random() * 14, Math.random() * 14);
    return { m, vel, spin };
  });

  // Theme toggle (data-theme on <html>): recolor everything in place.
  new MutationObserver(() => {
    readColors();
    skullParts.lineMat.color.copy(lineColor);
    skullParts.fillMat.color.copy(bgColor);
    blade.fillMat.color.copy(bgColor);
    blade.lineMat.color.copy(throwColor);
    crackMat.color.copy(textColor);
    for (const m of shardMats) m.color.copy(throwColor);
    inkDark.copy(throwColor).multiplyScalar(0.3); // uInk shares throwColor itself
    dirty = true;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── layout ──
  let w = 1, h = 1;
  const resize = () => {
    w = section.clientWidth; h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: step back so skull + blood fit the width
    const tall = w / h < 0.8;
    camera.position.set(0, 0.2, tall ? 8.5 : 5.8);
    camera.lookAt(0, tall ? 0.1 : 0.08, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(section);

  // ── drag to turn the whole scene ──
  // Sideways and up/down for a mouse; on touch only sideways (touch-action
  // pan-y in skull.css), so a vertical swipe still scrolls the page.
  const turn = { x: 0, y: 0, tx: 0, ty: 0 };
  let drag: { id: number; x: number; y: number } | null = null;
  section.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("a")) return; // the link shards stay clickable
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    section.setPointerCapture(e.pointerId);
    section.classList.add("is-turning");
  });
  section.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    turn.ty += (e.clientX - drag.x) * 0.008;
    if (e.pointerType === "mouse") turn.tx = Math.max(-0.9, Math.min(0.9, turn.tx + (e.clientY - drag.y) * 0.006));
    drag.x = e.clientX; drag.y = e.clientY;
    dirty = true;
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    section.classList.remove("is-turning");
  };
  section.addEventListener("pointerup", endDrag);
  section.addEventListener("pointercancel", endDrag);

  // ── state ──
  let rise = 0;
  let started = false;
  let seqT = 0; // seconds since the skull was up
  let dirty = true;
  let last = performance.now();

  const toScreen = (p: THREE.Vector3) => {
    const q = p.clone().project(camera);
    return [q.x, q.y] as const;
  };

  function reset() {
    started = false; seqT = 0;
    for (const link of links) {
      link.style.visibility = "hidden";
      link.style.pointerEvents = "none";
    }
  }

  function pose() {
    // the drag, eased
    turn.x += (turn.tx - turn.x) * 0.15;
    turn.y += (turn.ty - turn.y) * 0.15;
    world.rotation.set(turn.x, turn.y, 0);
    if (Math.abs(turn.tx - turn.x) + Math.abs(turn.ty - turn.y) > 1e-3) dirty = true;

    // rise: from below the screen up to the centre
    skull.position.y = -3.4 * (1 - easeOut(rise));

    // knock-back: one heavy damped wobble, then the shaking while it bleeds
    const u = started ? seqT - HIT_AT : -1;
    const kick = u > 0 ? Math.exp(-4 * u) * Math.sin(10 * u) * 1.5 : 0;
    const shake = u > 0 && u < JET ? Math.sin(u * 63) * 0.012 * (1 - u / JET) : 0;
    skull.position.z = -kick * 0.22;
    skull.position.x = shake;
    skull.rotation.x = -kick * 0.12;
    skull.rotation.z = kick * 0.07 * Math.sign(hit.x || 1);
    world.updateMatrixWorld();

    // blade: flies in, sinks, spins down
    const fly = u + BLADE_FLIGHT;
    blade.group.visible = started && fly > 0;
    if (blade.group.visible) {
      const k = Math.min(fly / BLADE_FLIGHT, 1);
      blade.group.position.lerpVectors(start, stuck, k * k);
      blade.group.rotation.z = -(Math.min(fly, BLADE_FLIGHT) * 42 + (u > 0 ? (1 - Math.exp(-3 * u)) * 42 / 3 : 0));
    }
    // cracks spread over 0.5 s
    crackGeo.setDrawRange(0, u > 0 ? Math.floor(Math.min(1, u / 0.5) * crackCount) : 0);
    bloodMat.uniforms.uTime.value = u;

    // shards: burst from the hit point, slow down, hang there
    const originWorld = skull.localToWorld(hit.clone());
    const origin = world.worldToLocal(originWorld.clone());
    const d = settle(u);
    for (const s of shards) {
      s.m.visible = u > 0;
      if (!s.m.visible) continue;
      s.m.position.copy(origin).addScaledVector(s.vel, d);
      s.m.rotation.set(s.spin.x * d, s.spin.y * d, s.spin.z * d);
    }

    // the three link shards: the same freeze, from the hit to their spots
    const tall = w / h < 0.8;
    const [hx, hy] = toScreen(originWorld);
    links.forEach((link, i) => {
      const ui = u - i * LINK_STAGGER;
      if (ui <= 0) return;
      const [tx, ty] = (tall ? LINK_REST.tall : LINK_REST.wide)[i];
      const k = settle(ui) * FREEZE; // 0 → 1
      const x = hx + (tx - hx) * k, y = hy + (ty - hy) * k;
      link.style.visibility = "visible";
      link.style.pointerEvents = k > 0.6 ? "auto" : "none";
      link.style.left = `${((x + 1) / 2) * w}px`;
      link.style.top = `${((1 - y) / 2) * h}px`;
      link.style.transform = `translate(-50%, -50%) rotate(${((1 - k) * 540 * Math.sign(tx || 1)).toFixed(1)}deg) scale(${(0.4 + 0.6 * k).toFixed(3)})`;
    });
  }

  // Render only while the section is on screen.
  let visible = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { last = performance.now(); requestAnimationFrame(frame); }
  }).observe(section);

  // until the last drop has landed: the latest spurt + the longest fall
  const END = HIT_AT + JET + (BLOOD_SPEED[1] + Math.sqrt(BLOOD_SPEED[1] ** 2 + 2 * GRAVITY * 4)) / GRAVITY + 0.5;
  function frame(now: number) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (!started && rise >= 0.995) started = true;
    if (started && seqT < END) { seqT += dt; dirty = true; }
    if (dirty) { dirty = false; pose(); renderer.render(scene, camera); }
    requestAnimationFrame(frame);
  }

  resize();
  reset();
  return {
    setRise(r: number) {
      if (r === rise) return;
      rise = r;
      if (started && r < 0.5) reset(); // scrolled back out: replay next time
      dirty = true;
    },
    finish() {
      rise = 1; started = true; seqT = END;
      dirty = true;
      pose(); renderer.render(scene, camera);
    },
  };
}
