#!/usr/bin/env node
// Bakes a mesh into the greyscale depth PNG that depth-map.ts expects.
// Build-time tool, run by hand once per model — nothing here ships to the page.
//
//   node src/experiments/cloth-grid/bake-depth.mjs <mesh> <name> [options]
//
//   <mesh>   .obj, .stl (binary or ASCII), or a model .js in the { vs, fs }
//            format of the wireframe renderer (default export)
//   <name>   writes src/experiments/cloth-grid/depth/<name>.png
//
//   --rx --ry --rz  rotate in degrees (applied x, then y, then z) to face the
//                   camera. The camera sits on +z looking down -z, so the
//                   part you want pushed out must point toward +z.
//   --size WxH      output pixels (default 320x192, same 5:3 as the 40x24 grid)
//   --blur N        box-blur radius in px, 3 passes ≈ gaussian (default 6)
//   --floor F       lowest grey a mesh pixel gets, 0..1 (default 0.12). Keeps
//                   the silhouette a step above the flat cloth (black).
//   --margin M      empty border as a fraction of the size (default 0.08)
//   --gamma G       tone curve on the depth before --floor is applied
//                   (default 1 = linear). > 1 flattens the far parts and
//                   spreads the near ones, so fine relief in the front
//                   (eye sockets, nose, cheekbones) gets more contrast.
//
// Output: 8-bit greyscale, white = nearest to camera, black = background.

import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// --- args -------------------------------------------------------------------
const [meshPath, name, ...rest] = process.argv.slice(2);
if (!meshPath || !name) {
  console.error("usage: bake-depth.mjs <mesh> <name> [--rx --ry --rz --size WxH --blur N --floor F --margin M --gamma G]");
  process.exit(1);
}
const opt = { rx: 0, ry: 0, rz: 0, size: "320x192", blur: 6, floor: 0.12, margin: 0.08, gamma: 1 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = rest[i + 1];
const [W, H] = String(opt.size).split("x").map(Number);

// --- mesh loading -----------------------------------------------------------
async function loadMesh(path) {
  const ext = extname(path).toLowerCase();
  if (ext === ".obj") return parseObj(readFileSync(path, "utf8"));
  if (ext === ".stl") return parseStl(readFileSync(path));
  if (ext === ".js") {
    // Renderer models are ESM but sit next to a CommonJS package.json, so
    // import the text via a data: URL instead of the file.
    const text = readFileSync(path, "utf8");
    const mod = await import("data:text/javascript;base64," + Buffer.from(text).toString("base64"));
    const { vs, fs } = mod.default;
    const tris = [];
    for (const f of fs) for (let k = 1; k + 1 < f.length; k++) tris.push([f[0], f[k], f[k + 1]]); // 2-entry edges yield nothing
    return { verts: vs.map((v) => [v.x, v.y, v.z]), tris };
  }
  throw new Error(`unsupported mesh type: ${ext}`);
}

function parseObj(text) {
  const verts = [];
  const tris = [];
  for (const line of text.split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p[0] === "v") verts.push([+p[1], +p[2], +p[3]]);
    else if (p[0] === "f") {
      // "12/4/7" -> 12; negative indices count back from the end
      const idx = p.slice(1).map((s) => {
        const n = parseInt(s, 10);
        return n < 0 ? verts.length + n : n - 1;
      });
      for (let k = 1; k + 1 < idx.length; k++) tris.push([idx[0], idx[k], idx[k + 1]]);
    }
  }
  return { verts, tris };
}

function parseStl(buf) {
  const verts = [];
  const tris = [];
  const weld = new Map();
  const add = (x, y, z) => {
    const key = `${x},${y},${z}`;
    let i = weld.get(key);
    if (i === undefined) weld.set(key, (i = verts.push([x, y, z]) - 1));
    return i;
  };
  const count = buf.readUInt32LE(80);
  if (buf.length === 84 + count * 50) {
    for (let t = 0; t < count; t++) {
      const o = 84 + t * 50 + 12; // skip the normal
      tris.push([0, 1, 2].map((k) => add(buf.readFloatLE(o + k * 12), buf.readFloatLE(o + k * 12 + 4), buf.readFloatLE(o + k * 12 + 8))));
    }
  } else {
    const nums = [...buf.toString("utf8").matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)];
    for (let t = 0; t + 2 < nums.length; t += 3) {
      tris.push([0, 1, 2].map((k) => add(+nums[t + k][1], +nums[t + k][2], +nums[t + k][3])));
    }
  }
  return { verts, tris };
}

// --- orient + fit -----------------------------------------------------------
function rotate([x, y, z], rx, ry, rz) {
  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rz); s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

function toPixels(verts) {
  const d = Math.PI / 180;
  const r = verts.map((v) => rotate(v, opt.rx * d, opt.ry * d, opt.rz * d));
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const v of r) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], v[a]); hi[a] = Math.max(hi[a], v[a]); }
  const m = 1 - 2 * opt.margin;
  const scale = Math.min((W * m) / (hi[0] - lo[0]), (H * m) / (hi[1] - lo[1]));
  const cx = (lo[0] + hi[0]) / 2;
  const cy = (lo[1] + hi[1]) / 2;
  const zSpan = hi[2] - lo[2] || 1;
  // px, py (y flipped: image y grows downward), depth 0 = far … 1 = near
  return r.map((v) => [W / 2 + (v[0] - cx) * scale, H / 2 - (v[1] - cy) * scale, (v[2] - lo[2]) / zSpan]);
}

// --- z-buffer rasteriser ----------------------------------------------------
function rasterise(pts, tris) {
  const depth = new Float32Array(W * H); // 0 = background
  for (const [ia, ib, ic] of tris) {
    const a = pts[ia], b = pts[ib], c = pts[ic];
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area;
        const w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = opt.floor + (1 - opt.floor) * Math.pow(w0 * a[2] + w1 * b[2] + w2 * c[2], opt.gamma);
        if (z > depth[y * W + x]) depth[y * W + x] = z; // nearest wins
      }
    }
  }
  return depth;
}

// --- blur (3 separable box passes ≈ gaussian) -----------------------------
function blur(src, radius) {
  const r = Math.round(radius);
  if (r <= 0) return src;
  let cur = src;
  for (let pass = 0; pass < 3; pass++) {
    for (const horizontal of [true, false]) {
      const out = new Float32Array(cur.length);
      const len = horizontal ? W : H;
      const lines = horizontal ? H : W;
      for (let l = 0; l < lines; l++) {
        const at = (i) => cur[horizontal ? l * W + i : i * W + l];
        let sum = 0;
        for (let i = -r; i <= r; i++) sum += at(Math.min(len - 1, Math.max(0, i)));
        for (let i = 0; i < len; i++) {
          out[horizontal ? l * W + i : i * W + l] = sum / (2 * r + 1);
          sum += at(Math.min(len - 1, i + r + 1)) - at(Math.max(0, i - r));
        }
      }
      cur = out;
    }
  }
  return cur;
}

// --- PNG (8-bit greyscale) --------------------------------------------------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}
function encodePng(field) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth; colour type 0 = greyscale
  const raw = Buffer.alloc((W + 1) * H); // each row starts with filter byte 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) raw[y * (W + 1) + 1 + x] = Math.round(Math.min(1, Math.max(0, field[y * W + x])) * 255);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- run ---------------------------------------------------------------------
const { verts, tris } = await loadMesh(resolve(meshPath));
const field = blur(rasterise(toPixels(verts), tris), Number(opt.blur));
const out = fileURLToPath(new URL(`./depth/${name}.png`, import.meta.url));
writeFileSync(out, encodePng(field));
console.log(`${basename(meshPath)}: ${verts.length} verts, ${tris.length} tris -> ${out} (${W}x${H})`);
