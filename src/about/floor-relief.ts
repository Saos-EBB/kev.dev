// The elevator floor's own relief: a skull stands up out of the floor while
// transition.ts tips it into the projects wall, then sinks back before the
// tip finishes. Reuses the floor-plane reprojection math and the mesh-patch
// renderer built for the /cloth room test (see skull-field.ts, mesh-patch.ts)
// — no separate copy of that geometry here.
//
// The patch's own mesh is finer than the live page's --grid-cell (48px, 32px
// on narrow mobile — see style.css): at the page's own cell size a skull-
// sized patch only has a handful of cells across and reads as a blob, not a
// face (see docs/errors.md's side-wall entry — same problem there, why that
// was dropped instead of fixed like this). It doesn't need to match the
// surrounding grid's cell here the way the old side-wall test assumed —
// unraised cells in the patch just stay transparent, so the coarser CSS grid
// underneath still shows through everywhere outside the silhouette; only the
// filled shape's own edge has to read cleanly, not literal gridline-for-
// gridline continuity.
//
// Placement is a first pass, meant to be tuned by eye once it's on screen —
// see the comment on PLACEMENT below for why the numbers are what they are.

import { imageDepth } from "../experiments/cloth-grid/depth-map";
import { defaultConfig, type ClothConfig } from "../experiments/cloth-grid/config";
import { floorSkull, type FloorPlacement } from "../experiments/room-cloth/skull-field";
import { mountMeshPatch, type MeshPatch } from "../experiments/room-cloth/mesh-patch";
import skullUrl from "../experiments/cloth-grid/depth/skull.png?url";

/** Patch mesh resolution: a quarter of the live grid's own cell, patch-local only (see above). */
const CELL_DIVISOR = 4;

/**
 * The floor is only --elevator-depth (1440px) deep in total — far less room than a side wall's
 * 400vh — and the skull picture is near-square, so its depth-axis footprint (computed from
 * `width` via the picture's own aspect) ends up comparable to `width` itself: at this width,
 * even with `stretch` pulled below 1 (compressing rather than expanding the depth axis, the
 * opposite of the side-wall test's use of it), the patch still fills most of the shaft's depth —
 * a large skull here unavoidably does, there's no way to keep it big *and* small in that axis.
 * `push` is a flat px amount, not a share of `width` any more: at this size scaling it with
 * `width` would blow the depth budget on its own (see skull-field.ts's displace() — the push
 * reprojection needs extra depth room proportional to how far it stands out).
 */
const PLACEMENT: Omit<FloorPlacement, "push"> = {
  d: 650,
  sx: 0,
  width: 1350,
  stretch: 0.6,
};
const PUSH_PX = 50;

export interface FloorRelief {
  setProgress(progress: number, snap?: boolean): void;
  destroy(): void;
}

export async function mountFloorRelief(floorEl: HTMLElement): Promise<FloorRelief> {
  const depth = await imageDepth(skullUrl);

  const rootStyle = getComputedStyle(document.documentElement);
  const cell = parseFloat(rootStyle.getPropertyValue("--grid-cell")) / CELL_DIVISOR;
  const linePx = parseFloat(rootStyle.getPropertyValue("--grid-line"));
  const rgbOf = (css: string): [number, number, number] => {
    const [r, g, b] = css.match(/[\d.]+/g)!.map(Number);
    return [r, g, b];
  };
  const gridColor = rgbOf(`rgb(${rootStyle.getPropertyValue("--grid-color")})`);
  const wallColor = rgbOf(getComputedStyle(floorEl).backgroundColor);
  const depthPx = parseFloat(getComputedStyle(floorEl).height);
  const elevator = floorEl.closest<HTMLElement>(".elevator")!;
  const perspective = parseFloat(getComputedStyle(elevator).perspective);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const push = PUSH_PX;
  const skull = floorSkull(depth, { vw, vh, perspective, depthPx }, { ...PLACEMENT, push }, cell);

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    pointerEvents: "none",
    left: `${skull.x0}px`,
    top: `${skull.y0}px`,
    width: `${skull.x1 - skull.x0 + linePx}px`,
    height: `${skull.y1 - skull.y0 + linePx}px`,
  });
  floorEl.append(canvas);

  const cloth: ClothConfig = {
    ...defaultConfig,
    // A brief flash, not a sustained reveal: rises and falls quickly around the ~40% mark of
    // the pinned tip-over (partway through the rotation — see TIMINGS.aboutToProjects), gone
    // long before the rotation itself finishes at (holdUnits+rotate.duration)/tl.duration()
    // (≈0.83). Widen rise/fall here to make it linger longer, not by adding a hold — the band
    // has no plateau (see push-strength.ts's bandValue), it only ever rises then immediately
    // falls, so "how long it lingers" is entirely rise+fall's width.
    band: { start: 0.32, end: 0.48, rise: 0.06, fall: 0.08 },
  };

  const patch: MeshPatch = mountMeshPatch({
    canvas,
    cols: (skull.x1 - skull.x0) / cell,
    rows: (skull.y1 - skull.y0) / cell,
    cell,
    linePx,
    field: skull.field,
    maxPush: push,
    displace: skull.displace,
    cloth,
    wallColor,
    lineColor: gridColor,
    lineStrength: 0.6,
    faceStrength: { base: 0.04, lit: 0.22 },
  });

  return patch;
}
