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
// Calibrated to a specific on-screen size, not an arbitrary canvas: SAOS
// ships as a standalone wordmark at up to --saos-height (400px, see
// style.css), not stretched across the floor's whole variable width
// any more, so "how big it'll actually be drawn" is a known, fixed
// number and the bake can target it directly instead of guessing.
//
//   node scripts/bake-saos.mjs [--display-height N] [--scale N] [--margin M] [--blur-ratio N]
//
//   --display-height N  target on-screen height in CSS px — match
//                        --saos-height's largest value (default 400)
//   --scale N            working/shipped resolution as a multiple of
//                         display size, for a crisp look on retina
//                         screens (default 2)
//   --margin M            empty border as a fraction of the canvas (default 0.1)
//   --blur-ratio N        gaussian sigma as a fraction of the letters'
//                         own height, not an absolute px count, so it
//                         scales with --display-height (default 0.028)
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

const ASPECT = 5 / 3; // landscape, like the cloth-grid bakes

const rest = process.argv.slice(2);
const opt = { "display-height": 400, scale: 2, margin: 0.1, "blur-ratio": 0.028 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = rest[i + 1];
const displayHeight = Number(opt["display-height"]);
const scale = Number(opt.scale);
const margin = Number(opt.margin);
const blurRatio = Number(opt["blur-ratio"]);

const H = Math.round(displayHeight * scale);
const W = Math.round(H * ASPECT);

const assetsDir = resolve(root, "src/assets/relief");
const depthPath = join(assetsDir, "saos-depth.png");
const shadePath = join(assetsDir, "saos-shade.webp");
const linesPath = join(assetsDir, "saos-lines.webp");

// --- step 1: depth map -------------------------------------------------------
// caption: fits the largest pointsize of the given font that renders the
// word without wrapping inside the margin box — an auto-fit "as bold and
// big as the margin allows" instead of a guessed --pointsize. -extent then
// pads that back out to the full canvas on black, centered, before the
// blur turns the hard edges into soft bulges. Blur sigma is a fraction of
// the letters' own box height (textH), not a flat px count, so it looks
// the same regardless of --display-height/--scale.
let sigma;
function bakeDepth() {
  const fontPath = join(root, "public/fonts/koeeya-trial.ttf");
  const textW = Math.round(W * (1 - 2 * margin));
  const textH = Math.round(H * (1 - 2 * margin));
  sigma = Math.round(blurRatio * textH);
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

// Ships at the full working resolution now (that resolution IS the
// intended 2x-for-retina size, not an oversized intermediate) — just
// lossy-compressed, no further downscale.
function writeRgba(rgba, outPath) {
  execFileSync(
    "magick",
    [
      "-size", `${W}x${H}`, "-depth", "8", "RGBA:-",
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
// A grid at the page's own --grid-cell density, converted to this image's
// pixel scale via the SAME --scale factor the whole bake is calibrated
// to (1 CSS px = `scale` image px, exactly like a retina backing store —
// so a 48px CSS grid cell is `48 * scale` image px here), sampled through
// a parallax-style offset built from the same depth gradient: near a
// raised edge, the sample point shifts by the slope times a push
// distance, so the lines bend around the bulge instead of cutting
// straight through it. Pure white on transparent — an alpha mask,
// colored at runtime via CSS mask-image + background-color so it always
// matches the live theme.
const GRID_CELL_CSS_PX = 48; // style.css's --grid-cell (desktop value)
const CELL_PX = GRID_CELL_CSS_PX * scale;
const LINE_HALF_WIDTH_PX = scale; // ~1 CSS px wide
const MAX_WARP_PX = 14 * scale; // displacement at the steepest slope; raw gradients are tiny (soft blur), so scale relative to the field's own max rather than a flat multiplier

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
