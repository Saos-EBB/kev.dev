// Green splatter-movie blood, shared by the main page's contact skull
// (src/contact/skull/skull-scene.ts) and the CT page's finale (src/ct/saw.ts):
// spurts out of a wound in PULSES like a heartbeat (each weaker than the
// last); every drop has its own birth time, life, direction and speed, and
// the vertex shader throws it on a ballistic arc — a closed-form function of
// the time since the hit, so nothing is stepped on the CPU.
// With a `floorY` the drops land on that floor and stay there (a growing
// pool); without one they fade out at the end of their life, mid-air.
import * as THREE from "three";

const JET = 3.6; // s the wound keeps spurting
const PULSES = 7;
const LIFE: [number, number] = [0.8, 1.7];
const SPEED: [number, number] = [1.8, 4.8];
const GRAVITY = 5.2; // scene units / s², pulls the drops down

const rand = ([a, b]: readonly [number, number]) => a + Math.random() * (b - a);

const BLOOD_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  uniform float uGravity;
  uniform float uFloor;
  uniform float uPool;
  uniform float uDepthFront;
  uniform float uDepthRange;
  attribute float aBirth;
  attribute float aLife;
  attribute float aSpeed;
  attribute vec3 aDir;
  attribute float aSize;
  varying float vF;
  varying float vSeed;
  varying float vLanded;
  varying float vDepth;
  void main() {
    float age = uTime - aBirth;
    vF = clamp(age / aLife, 0.0, 1.0);
    vSeed = fract(aBirth * 37.0);
    // not thrown yet, or (no pool) its life is over
    if (age < 0.0 || (uPool < 0.5 && age > aLife)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    // thrown out along its direction, falling on a ballistic arc until it
    // reaches the floor (solve y(t) = uFloor), then it stays put
    vec3 v0 = aDir * aSpeed;
    float tLand = uPool > 0.5 ? (v0.y + sqrt(max(v0.y * v0.y + 2.0 * uGravity * (position.y - uFloor), 0.0))) / uGravity : 1e6;
    float t = min(age, tLand);
    vLanded = step(tLand, age);
    vec3 p = v0 * t;
    p.y -= 0.5 * uGravity * t * t;
    vec4 mv = modelViewMatrix * vec4(position + p, 1.0);
    gl_Position = projectionMatrix * mv;
    // measured from the parent's origin, so it stays right while the scene turns
    vDepth = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z + uDepthFront - mv.z;
    vDepth /= uDepthRange;
    // in flight it shrinks a little; landed it splats wider
    // (capped: a drop right in front of the camera would cover the screen)
    gl_PointSize = min(aSize * mix(1.0 - 0.25 * vF, 1.3, vLanded) / -mv.z, 110.0) * uPx;
  }
`;

const BLOOD_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uDark;
  uniform float uPool;
  uniform float uDepthRange;
  varying float vF;
  varying float vSeed;
  varying float vLanded;
  varying float vDepth;
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
    // without a pool, a drop fades over the last fifth of its life
    float a = smoothstep(1.0, 0.8, d) * mix(1.0 - smoothstep(0.8, 1.0, vF), 1.0, uPool);
    // same steps as the skull's wireframe (depthSteps in parts.ts)
    if (uDepthRange > 0.0) {
      float depthStep = min(floor(clamp(vDepth, 0.0, 1.0) * 16.0), 15.0) / 15.0;
      a *= mix(0.85, 0.08, depthStep);
    }
    gl_FragColor = vec4(col, a);
  }
`;

export type Blood = {
  points: THREE.Points;
  /** Seconds since the hit (negative: nothing out yet). */
  setTime(u: number): void;
  /** After a theme change: the ink object was changed in place. */
  recolor(): void;
  /** Seconds after the hit until every drop is done (landed or faded). */
  readonly duration: number;
};

export function createBlood(o: {
  hit: THREE.Vector3; // the wound, in the parent's space
  axis: THREE.Vector3; // main direction of the spurts (unit)
  count: number;
  ink: THREE.Color; // shared, so a theme change can recolor it in place
  px: number; // the renderer's pixel ratio
  floorY?: number; // a floor to collect on (parent space); none: no pool
  maxZ?: number; // cap on a drop's direction towards the camera
  jet?: number; // s the wound keeps spurting (default JET)
  pulses?: number; // how many spurts (default PULSES)
  pressure?: number; // factor on the drops' speed (default 1)
  dropSize?: number; // factor on the drops' size (default 1)
  depth?: { front: number; range: number }; // fade with depth: from `front` ahead of the parent's origin, over `range`
}): Blood {
  const pool = o.floorY !== undefined;
  const jet = o.jet ?? JET, pulses = o.pulses ?? PULSES, pressure = o.pressure ?? 1, dropSize = o.dropSize ?? 1;
  let weights = 0;
  for (let n = 0; n < pulses; n++) weights += 1 / (n + 1);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(o.count * 3);
  const birth = new Float32Array(o.count), life = new Float32Array(o.count);
  const speed = new Float32Array(o.count), size = new Float32Array(o.count);
  const dirs = new Float32Array(o.count * 3);
  const d3 = new THREE.Vector3();
  for (let i = 0; i < o.count; i++) {
    pos.set([o.hit.x, o.hit.y, o.hit.z], i * 3);
    // which spurt: earlier ones get more drops (weight 1/(n+1))
    let n = 0;
    for (let r = Math.random() * weights; n < pulses - 1 && r > 1 / (n + 1); n++) r -= 1 / (n + 1);
    const strength = 1 - n / pulses;
    birth[i] = (n * jet) / pulses + Math.random() * 0.12;
    life[i] = rand(LIFE);
    speed[i] = rand(SPEED) * (0.55 + 0.6 * strength) * pressure;
    // mostly fine spray, every few a fat gob
    size[i] = (Math.random() < 0.12 ? 90 + Math.random() * 80 : 18 + Math.random() * 45) * dropSize;
    d3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.9).add(o.axis).normalize();
    if (o.maxZ !== undefined) d3.z = Math.min(d3.z, o.maxZ);
    dirs.set([d3.x, d3.y, d3.z], i * 3);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aBirth", new THREE.BufferAttribute(birth, 1));
  geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
  // White ink in the light theme: barely shaded, or it reads as gray.
  const shade = () => (document.documentElement.getAttribute("data-theme") === "light" ? 0.88 : 0.3);
  const dark = new THREE.Color().copy(o.ink).multiplyScalar(shade());
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: -1 },
      uPx: { value: o.px },
      uGravity: { value: GRAVITY },
      uFloor: { value: o.floorY ?? 0 },
      uPool: { value: pool ? 1 : 0 },
      uInk: { value: o.ink },
      uDark: { value: dark },
      uDepthFront: { value: o.depth?.front ?? 0 },
      uDepthRange: { value: o.depth?.range ?? 0 },
    },
    vertexShader: BLOOD_VERT,
    fragmentShader: BLOOD_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // the spray leaves the geometry's bounds
  return {
    points,
    setTime(u) { mat.uniforms.uTime.value = u; },
    recolor() { dark.copy(o.ink).multiplyScalar(shade()); },
    // pool: until the last drop can have landed (the latest spurt + the
    // longest fall); no pool: until the last drop's life is over
    duration: jet + (pool ? (SPEED[1] * pressure + Math.sqrt((SPEED[1] * pressure) ** 2 + 2 * GRAVITY * 4)) / GRAVITY : LIFE[1]),
  };
}
