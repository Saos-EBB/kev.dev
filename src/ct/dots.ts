// The page's dots (skull: skull.ts, brain: brain.ts): where they sit on a
// surface and how one is drawn.
//
// scatter() spreads them evenly — no two closer than `spacing` — instead of
// purely at random, so a surface reads as a surface and not as noise.
// DOT_VERT / DOT_FRAG draw each one round, in real world size, lit from a
// light that stays put while the model turns, and dimmer with distance.
//
// No DOM, no three.js: scatter() runs in the workers.

// Small seeded generator, so the dots sit the same on every load.
export function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Scatter = {
  count: number;
  position: Float32Array; // 3 per dot
  normal: Float32Array; // 3 per dot, interpolated from the vertex normals
  tri: Uint32Array; // 3 per dot: the vertices of the triangle it sits on
  w: Float32Array; // 3 per dot: its weights on those vertices
};

// Dart throwing: random points on the triangles, each kept only if no kept
// dot on the same side of the surface is closer than `spacing`.
export function scatter(pos: ArrayLike<number>, nrm: ArrayLike<number>, index: ArrayLike<number>, spacing: number, rand: () => number): Scatter {
  const nTri = index.length / 3;
  const cum = new Float64Array(nTri);
  let area = 0;
  for (let t = 0; t < nTri; t++) {
    const a = index[t * 3] * 3, b = index[t * 3 + 1] * 3, c = index[t * 3 + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    area += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
    cum[t] = area;
  }
  const cap = Math.ceil((1.2 * area) / (spacing * spacing)) + 1;
  const tries = cap * 4;
  const P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), W = new Float32Array(cap * 3);
  const T = new Uint32Array(cap * 3);
  // Hash grid of the kept dots, cells as wide as the spacing.
  let size = 1;
  while (size < cap * 2) size <<= 1;
  const head = new Int32Array(size).fill(-1), next = new Int32Array(cap);
  const cell = (ix: number, iy: number, iz: number) => (Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663) ^ Math.imul(iz, 83492791)) & (size - 1);
  const r2 = spacing * spacing;
  let n = 0;
  for (let i = 0; i < tries && n < cap && area > 0; i++) {
    const x = rand() * area;
    let lo = 0, hi = nTri - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < x) lo = m + 1; else hi = m; }
    const a = index[lo * 3], b = index[lo * 3 + 1], c = index[lo * 3 + 2];
    const s = Math.sqrt(rand()), q = rand();
    const wa = 1 - s, wb = s * (1 - q), wc = s * q;
    const px = pos[a * 3] * wa + pos[b * 3] * wb + pos[c * 3] * wc;
    const py = pos[a * 3 + 1] * wa + pos[b * 3 + 1] * wb + pos[c * 3 + 1] * wc;
    const pz = pos[a * 3 + 2] * wa + pos[b * 3 + 2] * wb + pos[c * 3 + 2] * wc;
    let nx = nrm[a * 3] * wa + nrm[b * 3] * wb + nrm[c * 3] * wc;
    let ny = nrm[a * 3 + 1] * wa + nrm[b * 3 + 1] * wb + nrm[c * 3 + 1] * wc;
    let nz = nrm[a * 3 + 2] * wa + nrm[b * 3 + 2] * wb + nrm[c * 3 + 2] * wc;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    const ix = Math.floor(px / spacing), iy = Math.floor(py / spacing), iz = Math.floor(pz / spacing);
    let free = true;
    for (let dx = -1; dx <= 1 && free; dx++) for (let dy = -1; dy <= 1 && free; dy++) for (let dz = -1; dz <= 1 && free; dz++) {
      for (let j = head[cell(ix + dx, iy + dy, iz + dz)]; j >= 0; j = next[j]) {
        const ex = P[j * 3] - px, ey = P[j * 3 + 1] - py, ez = P[j * 3 + 2] - pz;
        // (the other side of a thin wall doesn't count)
        if (ex * ex + ey * ey + ez * ez < r2 && N[j * 3] * nx + N[j * 3 + 1] * ny + N[j * 3 + 2] * nz > 0) { free = false; break; }
      }
    }
    if (!free) continue;
    P[n * 3] = px; P[n * 3 + 1] = py; P[n * 3 + 2] = pz;
    N[n * 3] = nx; N[n * 3 + 1] = ny; N[n * 3 + 2] = nz;
    W[n * 3] = wa; W[n * 3 + 1] = wb; W[n * 3 + 2] = wc;
    T[n * 3] = a; T[n * 3 + 1] = b; T[n * 3 + 2] = c;
    const k = cell(ix, iy, iz);
    next[n] = head[k]; head[k] = n;
    n++;
  }
  return { count: n, position: P.subarray(0, n * 3), normal: N.subarray(0, n * 3), tri: T.subarray(0, n * 3), w: W.subarray(0, n * 3) };
}

// ── drawing ─────────────────────────────────────────────────────────────

// A dot's diameter as a share of the spacing: just short of touching.
export const DOT_FILL_RATIO = 0.8;

// Vertex side. dotLight(): key light from the upper left, a weak fill and a
// rim, in view space. dotDepth(): dots behind the model's middle fade
// towards the background. dotSize(): uSize is the diameter in world units,
// a little different for every dot.
export const DOT_VERT = /* glsl */ `
uniform float uSize;
uniform float uScale;
const vec3 DOT_KEY = vec3(-0.479, 0.622, 0.619);
const vec3 DOT_FILL = vec3(0.744, -0.248, 0.620);
float dotLight(vec3 n, vec3 mv) {
  float key = max(dot(n, DOT_KEY), 0.0);
  float fill = max(dot(n, DOT_FILL), 0.0);
  float rim = pow(1.0 - abs(dot(n, normalize(-mv))), 3.0);
  return 0.14 + 0.82 * pow(key, 1.15) + 0.14 * fill + 0.26 * rim;
}
float dotDepth(float z) {
  float centre = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
  return mix(1.0, 0.42, smoothstep(-0.7, 1.0, centre - z));
}
float dotSize(vec3 p, float z) {
  float h = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  return uSize * (0.8 + 0.4 * h) * projectionMatrix[1][1] * uScale / -z;
}`;

// Fragment side: a round dot with a soft edge.
export const DOT_FRAG = /* glsl */ `
float dotAlpha() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  return 1.0 - smoothstep(0.6, 1.0, r);
}`;
