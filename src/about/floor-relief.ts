// The elevator floor's own relief: a skull stands up out of the floor while
// transition.ts tips it into the projects wall, then sinks back before the
// tip finishes. Reuses the floor-plane reprojection math and the mesh-patch
// renderer built for the /cloth room test (see skull-field.ts, mesh-patch.ts)
// — no separate copy of that geometry here.
//
// Unlike the side-wall test, this reads the live page's own --grid-cell
// (48px, 32px on narrow mobile — see style.css), so the relief's quads land
// on the same grid the rest of the floor/wall already draws, seamlessly.
//
// Placement is a first pass, meant to be tuned by eye once it's on screen —
// see the comment on PLACEMENT below for why the numbers are what they are.

import { imageDepth } from "../experiments/cloth-grid/depth-map";
import { defaultConfig, type ClothConfig } from "../experiments/cloth-grid/config";
import { floorSkull, type FloorPlacement } from "../experiments/room-cloth/skull-field";
import { mountMeshPatch, type MeshPatch } from "../experiments/room-cloth/mesh-patch";
import skullUrl from "../experiments/cloth-grid/depth/skull.png?url";

/**
 * The floor is only --elevator-depth (1440px) deep in total — far less room than a side wall's
 * 400vh — and the skull picture is near-square, so its depth-axis footprint (computed from
 * `width` via the picture's own aspect) ends up comparable to `width` itself: a "big" skull
 * inevitably takes up a large share of that depth. `stretch` and `push` both grow the patch
 * further (see skull-field.ts's displace() — the push reprojection needs extra depth room
 * proportional to how far it stands out), so both are kept modest here on purpose.
 */
const PLACEMENT: Omit<FloorPlacement, "push"> = {
  d: 450,
  sx: 0,
  width: 450,
  stretch: 1.1,
};
const PUSH_SHARE = 0.15; // share of `width`

export interface FloorRelief {
  setProgress(progress: number, snap?: boolean): void;
  destroy(): void;
}

export async function mountFloorRelief(floorEl: HTMLElement): Promise<FloorRelief> {
  const depth = await imageDepth(skullUrl);

  const rootStyle = getComputedStyle(document.documentElement);
  const cell = parseFloat(rootStyle.getPropertyValue("--grid-cell"));
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
  const push = PLACEMENT.width * PUSH_SHARE;
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
    // Rises across the first ~35% of the pinned tip-over, gone again by ~78% — comfortably
    // before the rotation itself finishes at (holdUnits+rotate.duration)/tl.duration() (see
    // TIMINGS.aboutToProjects), so the relief has settled flat before the wall stands frontal.
    band: { start: 0, end: 0.78, rise: 0.35, fall: 0.43 },
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
