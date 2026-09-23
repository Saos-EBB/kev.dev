#!/usr/bin/env node
// Bakes the "SAOS" wordmark into a greyscale depth PNG for the floor relief
// — white = nearest/raised, black = flat background, the same convention
// bake-depth.mjs uses for a mesh (see src/experiments/cloth-grid/bake-
// depth.mjs). Build-time tool, run by hand; depth-map.ts/mesh-patch.ts
// consume the PNG later, nothing here ships to the page as-is.
//
// Text rasterisation from a TTF needs a real font renderer, which pure Node
// doesn't have — rather than add a canvas/font-rasteriser npm dependency,
// this shells out to the system's ImageMagick (`magick`, already installed)
// for the whole render: text, fit, blur and PNG encode all in one pass.
//
//   node scripts/bake-saos.mjs [--size WxH] [--margin M] [--blur N]
//
//   --size WxH   canvas pixels, 5:3 landscape like the cloth-grid bakes
//                (default 1600x960)
//   --margin M   empty border as a fraction of the canvas (default 0.1)
//   --blur N     gaussian sigma in px — bigger = softer bulges (default 48)
//
// Output: src/assets/relief/saos-depth.png

import { execFileSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const rest = process.argv.slice(2);
const opt = { size: "1600x960", margin: 0.1, blur: 48 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = rest[i + 1];
const [W, H] = String(opt.size).split("x").map(Number);
const margin = Number(opt.margin);
const sigma = Number(opt.blur);

const fontPath = join(root, "public/fonts/koeeya-trial.ttf");
const textW = Math.round(W * (1 - 2 * margin));
const textH = Math.round(H * (1 - 2 * margin));
const out = resolve(root, "src/assets/relief/saos-depth.png");

// caption: fits the largest pointsize of the given font that renders the
// word without wrapping inside textW x textH — an auto-fit "as bold and
// big as the margin allows" instead of a guessed --pointsize. -extent then
// pads that back out to the full canvas on black, centered, before the
// blur turns the hard edges into soft bulges.
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
  out,
], { stdio: "inherit" });

console.log(`SAOS -> ${out} (${W}x${H}, blur sigma ${sigma}px)`);
