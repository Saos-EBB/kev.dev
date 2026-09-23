#!/usr/bin/env node
// Bakes the floor's "SAOS" relief: a depth map, a Lambert shading overlay,
// and a warped grid-line mask — three static images, no canvas/mesh
// rendering at runtime (see src/about/floor-relief.ts for the old per-frame
// approach this replaces). Build-time tool, run by hand.
//
// Text rasterisation from a TTF needs a real font renderer, which pure Node
// doesn't have — rather than add a canvas/font-rasteriser npm dependency,
// this shells out to the system's ImageMagick (`magick`, already installed)
// both for the text-to-bitmap step and for raw-pixel <-> PNG/WebP I/O
// (`gray:-` / `RGBA:-` streams), while the shading/warp math is plain Node.
//
//   node scripts/bake-saos.mjs [--size WxH] [--margin M] [--blur N]
//
//   --size WxH   canvas pixels, 5:3 landscape like the cloth-grid bakes
//                (default 1600x960)
//   --margin M   empty border as a fraction of the canvas (default 0.1)
//   --blur N     gaussian sigma in px for the depth map — bigger = softer
//                bulges (default 24)
//
// Output:
//   src/assets/relief/saos-depth.png  — greyscale depth (white = raised)
//   src/assets/relief/saos-shade.webp — RGBA Lambert shading overlay
//   src/assets/relief/saos-lines.webp — RGBA grid-line mask, warped by depth

import { execFileSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const MAX_BUFFER = 64 * 1024 * 1024;

const rest = process.argv.slice(2);
const opt = { size: "1600x960", margin: 0.1, blur: 24 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = rest[i + 1];
const [W, H] = String(opt.size).split("x").map(Number);
const margin = Number(opt.margin);
const sigma = Number(opt.blur);

const assetsDir = resolve(root, "src/assets/relief");
const depthPath = join(assetsDir, "saos-depth.png");
const shadePath = join(assetsDir, "saos-shade.webp");
const linesPath = join(assetsDir, "saos-lines.webp");

// --- step 1: depth map -------------------------------------------------------
// caption: fits the largest pointsize of the given font that renders the
// word without wrapping inside the margin box — an auto-fit "as bold and
// big as the margin allows" instead of a guessed --pointsize. -extent then
// pads that back out to the full canvas on black, centered, before the
// blur turns the hard edges into soft bulges.
function bakeDepth() {
  const fontPath = join(root, "public/fonts/koeeya-trial.ttf");
  const textW = Math.round(W * (1 - 2 * margin));
  const textH = Math.round(H * (1 - 2 * margin));
  execFileSync("magick", [
    "-size", `${textW}x${textH}`,
    "-background", "black",
    "-fill", "white",
    "-font", fontPath,
    "-gravity", "center",
    "caption:SAOS",
    "-gravity", "center",
    "-background", "black",
    "-extent", `${W}x${H}`,
    "-blur", `0x${sigma}`,
    "-colorspace", "Gray",
    "-depth", "8",
    depthPath,
  ], { stdio: "inherit" });
  console.log(`depth  -> ${depthPath} (${W}x${H}, blur sigma ${sigma}px)`);
}

function readDepth() {
  const raw = execFileSync(
    "magick",
    [depthPath, "-depth", "8", "gray:-"],
    { maxBuffer: MAX_BUFFER },
  );
  const field = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) field[i] = raw[i] / 255;
  return field;
}

// Both layers are soft/blurred by construction, and CSS stretches them to
// fill the floor box regardless of source size (background-size: 100%
// 100%), so shipping them at the full working resolution buys nothing —
// downscale at encode time instead. Cuts saos-shade.webp from ~245KB to
// ~110KB with no visible difference (checked by eye).
const ENCODE_SCALE = 0.5;

function writeRgba(rgba, outPath) {
  const outW = Math.round(W * ENCODE_SCALE);
  const outH = Math.round(H * ENCODE_SCALE);
  execFileSync(
    "magick",
    [
      "-size", `${W}x${H}`, "-depth", "8", "RGBA:-",
      "-filter", "Lanczos", "-resize", `${outW}x${outH}`,
      "-quality", "82", "-define", "webp:alpha-quality=80",
      outPath,
    ],
    { input: rgba, maxBuffer: MAX_BUFFER },
  );
}

const at = (field, x, y) => field[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];

function gradient(field, x, y) {
  const gx = (at(field, x + 1, y) - at(field, x - 1, y)) * 0.5;
  const gy = (at(field, x, y + 1) - at(field, x, y - 1)) * 0.5;
  return [gx, gy];
}

// --- step 2: Lambert shading -------------------------------------------------
// Per-pixel surface normal from the depth gradient (finite differences),
// lit from a light coming from upper-left and slightly toward the camera.
// A flat pixel (gradient 0) has normal (0,0,1) and so a constant Lambert
// term equal to the light's own z — that baseline is subtracted out so
// flat cloth bakes fully transparent (alpha 0) and only slopes near an
// edge shade at all: lit slopes -> white with alpha, shadowed slopes ->
// black with alpha, both theme-neutral (plain translucent white/black
// composites correctly over either theme's floor background).
const LIGHT = normalize([-0.6, -0.6, 0.6]);
const NORMAL_STRENGTH = 18; // gradient -> normal tilt; bigger = punchier shading
const SHADE_GAIN = 6; // Lambert deviation -> alpha

function normalize([x, y, z]) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

function bakeShade(depth) {
  const rgba = new Uint8ClampedArray(W * H * 4);
  const flatLambert = LIGHT[2]; // dot((0,0,1), LIGHT)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [gx, gy] = gradient(depth, x, y);
      const n = normalize([-gx * NORMAL_STRENGTH, -gy * NORMAL_STRENGTH, 1]);
      const lambert = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      const diff = lambert - flatLambert;
      const alpha = Math.min(1, Math.abs(diff) * SHADE_GAIN);
      const v = diff > 0 ? 255 : 0;
      const i = (y * W + x) * 4;
      rgba[i] = v; rgba[i + 1] = v; rgba[i + 2] = v; rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  writeRgba(rgba, shadePath);
  console.log(`shade  -> ${shadePath}`);
}

// --- step 3: warped grid-line mask -------------------------------------------
// A grid at roughly the page's own --grid-cell density (converted to this
// image's pixel scale, assuming a representative floor width — the live
// floor's actual width varies with the viewport, so this is a density
// match, not a pixel-registered overlay), sampled through a parallax-style
// offset built from the same depth gradient: near a raised edge, the
// sample point shifts by the slope times a push distance, so the lines
// bend around the bulge instead of cutting straight through it. Pure
// white on transparent — an alpha mask, colored at runtime via CSS
// mask-image + background-color so it always matches the live theme.
const REFERENCE_FLOOR_WIDTH_PX = 1920; // typical desktop viewport, for the density conversion above
const CELL_PX = (W * 48) / REFERENCE_FLOOR_WIDTH_PX;
const LINE_HALF_WIDTH_PX = 0.8;
const MAX_WARP_PX = 14; // displacement at the steepest slope; raw gradients are tiny (soft blur), so scale relative to the field's own max rather than a flat multiplier

function distToGrid(v, cell) {
  const m = ((v % cell) + cell) % cell;
  return Math.min(m, cell - m);
}

function bakeLines(depth) {
  const gradients = new Float32Array(W * H * 2);
  let maxMag = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [gx, gy] = gradient(depth, x, y);
      const i = (y * W + x) * 2;
      gradients[i] = gx; gradients[i + 1] = gy;
      maxMag = Math.max(maxMag, Math.hypot(gx, gy));
    }
  }
  const warpScale = MAX_WARP_PX / (maxMag || 1);

  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i2 = (y * W + x) * 2;
      const sx = x - gradients[i2] * warpScale;
      const sy = y - gradients[i2 + 1] * warpScale;
      const d = Math.min(distToGrid(sx, CELL_PX), distToGrid(sy, CELL_PX));
      const alpha = Math.max(0, 1 - d / LINE_HALF_WIDTH_PX);
      const i = (y * W + x) * 4;
      rgba[i] = 255; rgba[i + 1] = 255; rgba[i + 2] = 255; rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  writeRgba(rgba, linesPath);
  console.log(`lines  -> ${linesPath} (cell ${CELL_PX.toFixed(1)}px, warp scale ${warpScale.toFixed(0)})`);
}

bakeDepth();
const depth = readDepth();
bakeShade(depth);
bakeLines(depth);
