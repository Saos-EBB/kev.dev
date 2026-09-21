// Tunables for the /cloth room test. Edit a value, save, Vite reloads — adjust by eye.
// The cloth itself (spring, light, line look) is the shared ClothConfig; only what is
// specific to patches on the elevator walls lives here.

import { defaultConfig, type ClothConfig } from "../cloth-grid/config";
import type { SkullPlacement } from "./skull-field";

/** A skull as written in this config: `y` is a share of the viewport height, `push` a share of `height`. */
export type SkullSpec = Omit<SkullPlacement, "sy" | "push"> & { y: number; push: number };

export const roomCloth = {
  /** Scroll progress where the relief is at full push; it rises before and falls right after. */
  peak: 0.267,
  /** Progress the relief starts rising / is gone again. */
  bandStart: 0.15,
  bandEnd: 0.33,

  /** Wall grid cell in px on this page (main page: 48). Must divide the shaft depth (1440). Smaller = finer skulls. */
  cell: 16,

  /**
   * The test skulls, each a step bigger and standing further out of the wall than the last, to
   * compare side by side (see skull-field.ts). `d` = centre along the shaft in px behind the
   * viewport plane (the nearer, the less oblique the wall is seen), `y` = centre height on
   * screen (0..1), `height` = skull height in the wall plane in px, `push` = how far it stands
   * out, as a share of `height`.
   */
  skulls: [
    { side: "left", d: 450, y: 0.27, height: 280, push: 0.2 },
    { side: "right", d: 450, y: 0.27, height: 330, push: 0.28 },
    { side: "left", d: 450, y: 0.7, height: 380, push: 0.36 },
    { side: "right", d: 450, y: 0.7, height: 430, push: 0.44 },
  ] as SkullSpec[],
  /** Skull stretch along the shaft in the wall plane (see skull-field.ts): compensates the perspective squash. */
  stretch: 1.8,
  /** Edge colour of the raised quads: share of the way from the wall colour to the grid colour (solid, no alpha). */
  lineStrength: 0.6,
  /** Fill of the quads' faces: same scale; `lit` is added on faces leaning toward the light. */
  faceStrength: { base: 0.04, lit: 0.22 },
};

/** Shared cloth settings: spring, scroll band, light (the rest of the cloth config is unused here). */
export const baseConfig: ClothConfig = {
  ...defaultConfig,
  band: {
    start: roomCloth.bandStart,
    end: roomCloth.bandEnd,
    rise: roomCloth.peak - roomCloth.bandStart,
    fall: roomCloth.bandEnd - roomCloth.peak,
  },
};
