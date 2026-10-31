// Balloon loader (balloon-loader.ts): turns one glyph mask per letter into the
// shape a foil letter takes under pressure. Slow enough to freeze a phone for a
// moment, hence a worker: the page stays responsive while the mirror is up.
//  - the mask, dilated, is the welded outline
//  - solving the Poisson equation inside it gives the membrane's height
//  - creases run from the seam inwards: each pixel reads a value at its nearest rim point

const seeded = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function valueNoise(x: number, y: number) {
  const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j;
  const u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
  const h = (a: number, b: number) => seeded(a * 57 + b * 131, 9);
  return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
}

function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s;
    do {
      const r = v[k];
      s = (f[q] + q * q - f[r] - r * r) / (2 * q - 2 * r);
    } while (s <= z[k] && --k > -1);
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    d[q] = (q - r) * (q - r) + f[r];
  }
}

function distanceSquared(grid: Float64Array, W: number, H: number) {
  const m = Math.max(W, H), f = new Float64Array(m), d = new Float64Array(m), v = new Int32Array(m), z = new Float64Array(m + 1);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = grid[y * W + x];
    edt1d(f, H, d, v, z);
    for (let y = 0; y < H; y++) grid[y * W + x] = d[y];
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = grid[y * W + x];
    edt1d(f, W, d, v, z);
    for (let x = 0; x < W; x++) grid[y * W + x] = d[x];
  }
}

export interface FieldJob {
  W: number;
  H: number;
  glyphs: Uint8Array[]; // 1 inside the letter
  grow: number[]; // welded border per letter, in pixels
  sweeps: number;
}

self.onmessage = (e: MessageEvent<FieldJob>) => {
  const { W, H, glyphs, grow, sweeps } = e.data;
  const pillow = new Float32Array(W * H * 4), crease = new Float32Array(W * H * 4);
  const scale = W / 1024;
  let top = 0;
  glyphs.forEach((glyph, n) => {
    const d = new Float64Array(W * H);
    for (let i = 0; i < W * H; i++) d[i] = glyph[i] ? 0 : 1e20;
    distanceSquared(d, W, H);
    const mask = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) mask[i] = d[i] < grow[n] * grow[n] ? 1 : 0;

    // Over-relaxed: converges in a few hundred sweeps at this size.
    const h = new Float32Array(W * H);
    for (let it = 0; it < sweeps; it++) {
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (mask[i]) h[i] += 1.88 * ((h[i - 1] + h[i + 1] + h[i - W] + h[i + W] + 1) / 4 - h[i]);
        }
      }
    }

    // Nearest rim point by jump flooding.
    const rx = new Int16Array(W * H).fill(-1), ry = new Int16Array(W * H);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (mask[i] && !(mask[i - 1] && mask[i + 1] && mask[i - W] && mask[i + W])) { rx[i] = x; ry[i] = y; }
      }
    }
    for (let step = 64; step >= 1; step >>= 1) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (!mask[i]) continue;
          let bx = rx[i], by = ry[i], best = bx < 0 ? 1e12 : (bx - x) ** 2 + (by - y) ** 2;
          for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step], [step, step], [-step, -step], [step, -step], [-step, step]]) {
            const a = x + dx, b = y + dy;
            if (a < 0 || b < 0 || a >= W || b >= H) continue;
            const o = b * W + a;
            if (rx[o] < 0) continue;
            const dist = (rx[o] - x) ** 2 + (ry[o] - y) ** 2;
            if (dist < best) { best = dist; bx = rx[o]; by = ry[o]; }
          }
          rx[i] = bx; ry[i] = by;
        }
      }
    }

    for (let i = 0; i < W * H; i++) {
      if (h[i] > top) top = h[i];
      pillow[i * 4 + n] = h[i];
      if (mask[i] && rx[i] >= 0) {
        const a = valueNoise((rx[i] * 0.13) / scale + n * 9, (ry[i] * 0.13) / scale);
        const b = valueNoise((rx[i] * 0.045) / scale + 3, (ry[i] * 0.045) / scale + n);
        crease[i * 4 + n] = (1 - Math.abs(2 * a - 1)) * (0.35 + 0.65 * b);
      }
    }
  });
  for (let i = 0; i < pillow.length; i++) pillow[i] /= top;
  (self as unknown as Worker).postMessage({ pillow, crease }, [pillow.buffer, crease.buffer]);
};
