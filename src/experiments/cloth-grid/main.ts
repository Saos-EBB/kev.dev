// Standalone entry for cloth.html. This is the only place that knows about Lenis.

import Lenis from "lenis";
import { mountClothGrid } from "./cloth-grid";
import { defaultConfig } from "./config";
import { imageDepth } from "./depth-map";
import handUrl from "./depth/hand.png?url";
import skullUrl from "./depth/skull.png?url";

const canvas = document.querySelector<HTMLCanvasElement>("#cloth")!;
const readout = document.querySelector<HTMLElement>("#readout")!;

// Default is the baked skull (see bake-depth.mjs); `?depth=hand` or `?depth=bumps` (procedural) switch it.
const baked: Record<string, string> = { hand: handUrl, skull: skullUrl };
const depthName = new URLSearchParams(location.search).get("depth") ?? "skull";
const grid = mountClothGrid(
  canvas,
  defaultConfig,
  baked[depthName] ? await imageDepth(baked[depthName]) : undefined,
);
const lenis = new Lenis({ autoRaf: true });

// `cloth.html?p=0.5` pins the progress, handy for tuning one frame without scrolling.
const pinned = new URLSearchParams(location.search).get("p");

function onProgress() {
  const progress = pinned === null ? lenis.progress : Number(pinned);
  grid.setProgress(progress, pinned !== null);
  readout.textContent = `progress ${progress.toFixed(3)}`;
}

lenis.on("scroll", onProgress);
lenis.resize();
onProgress();

// Editing config.ts / the effect reloads this module — drop the old instance first.
import.meta.hot?.dispose(() => {
  grid.destroy();
  lenis.destroy();
});
