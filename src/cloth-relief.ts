// A cloth relief on a plain, frontally-viewed page element — no CSS-3D plane, no perspective
// camera, unlike skull-field.ts's wallSkull/floorSkull (built for the elevator's obliquely
// viewed walls/floor). A point here is only ever seen head-on, so "standing out of the surface"
// needs no reprojection trick: raised quads just get a small radial offset away from the patch's
// own centre (a puff, reads as bulging toward the camera) plus mesh-patch.ts's own lighting.
//
// Generic on purpose: takes the depth image, its crop, size and position as parameters, so a
// later "render something else here" is a new call with a different image, not a new module.

import { imageDepth } from "./experiments/cloth-grid/depth-map";
import { defaultConfig, type ClothConfig } from "./experiments/cloth-grid/config";
import { mountMeshPatch, type MeshPatch } from "./experiments/room-cloth/mesh-patch";
import type { DepthSource } from "./experiments/cloth-grid/depth-map";

export interface ClothReliefPlacement {
  /** Crop rectangle within the depth image, 0..1 (default: the whole image). */
  crop?: { x0: number; x1: number; y0: number; y1: number };
  /** Centre within the host element, px from its own centre. */
  cx: number;
  cy: number;
  /** Width in the host element's plane, px; height comes from the crop's own aspect. */
  width: number;
  /** How far it puffs out, px — a look (radial bulge + lighting), not a real 3D push. */
  push: number;
}

export interface ClothRelief {
  setProgress(progress: number, snap?: boolean): void;
  destroy(): void;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const rgbOf = (css: string): [number, number, number] => {
  const [r, g, b] = css.match(/[\d.]+/g)!.map(Number);
  return [r, g, b];
};

// Patch-local mesh resolution: a quarter of the live --grid-cell. At the page's own cell (48px,
// 32px on narrow mobile) a relief-sized patch only has a handful of cells across and reads as a
// blob, not a recognizable shape (see docs/errors.md / floor-relief.ts's same fix) — unraised
// cells stay transparent regardless, so the coarser CSS grid underneath still shows through
// outside the silhouette, no seam.
const CELL_DIVISOR = 4;

/**
 * Mounts a cloth relief as a transparent canvas child of `el`, positioned/sized in `el`'s own
 * plane per `placement`. `colorSource` is the element to read the resting wall/line colour off
 * (defaults to `el`) — for a host with no `background-color` of its own (e.g. `.projects-bg-
 * grid`, whose colour lives on its parent `.projects`), pass that ancestor explicitly.
 */
export async function mountClothRelief(
  el: HTMLElement,
  depthUrl: string,
  placement: ClothReliefPlacement,
  band: ClothConfig["band"],
  colorSource: HTMLElement = el,
): Promise<ClothRelief> {
  const source = await imageDepth(depthUrl);
  const crop = placement.crop ?? { x0: 0, x1: 1, y0: 0, y1: 1 };
  const cropAspect = (crop.x1 - crop.x0) / (crop.y1 - crop.y0); // width / height

  const rootStyle = getComputedStyle(document.documentElement);
  const cell = parseFloat(rootStyle.getPropertyValue("--grid-cell")) / CELL_DIVISOR;
  const linePx = parseFloat(rootStyle.getPropertyValue("--grid-line"));
  const gridColor = rgbOf(`rgb(${rootStyle.getPropertyValue("--grid-color")})`);
  const wallColor = rgbOf(getComputedStyle(colorSource).backgroundColor);

  // `el` can be much taller than the viewport (e.g. .projects-bg-grid is inset:0 of #projects,
  // which spans the whole pinned carousel's scroll room, not just one screen) — while pinned,
  // only a viewport-sized slice at its own top is ever actually visible.
  const rect = el.getBoundingClientRect();
  const visibleWidth = Math.min(rect.width, window.innerWidth);
  const visibleHeight = Math.min(rect.height, window.innerHeight);
  const centreX = visibleWidth / 2 + placement.cx;
  const centreY = visibleHeight / 2 + placement.cy;
  const ww = placement.width;
  const wh = ww / cropAspect;

  // The canvas covers the *whole* visible background, not just a box around the picture — cells
  // outside the picture's own silhouette simply never rise (mesh-patch only draws raised quads),
  // so this costs nothing extra to look at, only a few thousand more (cheap) vertices to update
  // per frame while the relief is actively animating.
  const x0 = 0;
  const x1 = Math.ceil(visibleWidth / cell) * cell + cell;
  const y0 = 0;
  const y1 = Math.ceil(visibleHeight / cell) * cell + cell;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const field: DepthSource = {
    sample(u, v) {
      const x = lerp(x0, x1, u);
      const y = lerp(y0, y1, v);
      const uu = (x - centreX) / ww + 0.5;
      const vv = (y - centreY) / wh + 0.5;
      if (uu < 0 || uu > 1 || vv < 0 || vv > 1) return 0;
      const h = source.sample(crop.x0 + uu * (crop.x1 - crop.x0), crop.y0 + vv * (crop.y1 - crop.y0));
      return smoothstep(0.1, 0.16, h) * (0.3 + 0.7 * h);
    },
  };

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    pointerEvents: "none",
    left: `${x0}px`,
    top: `${y0}px`,
    width: `${x1 - x0 + linePx}px`,
    height: `${y1 - y0 + linePx}px`,
  });
  el.append(canvas);

  const cloth: ClothConfig = { ...defaultConfig, band };
  const patch: MeshPatch = mountMeshPatch({
    canvas,
    cols: (x1 - x0) / cell,
    rows: (y1 - y0) / cell,
    cell,
    linePx,
    field,
    maxPush: placement.push,
    // Radial puff: a raised point slides away from the patch's own centre, proportional to how
    // far it's pushed — the only "displacement" a frontal, head-on relief needs.
    displace(lx, ly, delta) {
      const dx = x0 + lx - centreX;
      const dy = y0 + ly - centreY;
      const dist = Math.hypot(dx, dy) || 1;
      const k = delta / dist;
      return { x: dx * k, y: dy * k };
    },
    cloth,
    wallColor,
    lineColor: gridColor,
    lineStrength: 0.6,
    faceStrength: { base: 0.04, lit: 0.22 },
  });

  return patch;
}
