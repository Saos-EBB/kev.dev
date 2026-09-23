// All tunables for the cloth-grid experiment. Edit a value, save, Vite HMR
// reloads the page — that is the whole "adjust by eye" workflow.

export interface Bump {
  /** Centre in normalised grid space, 0..1 (origin top-left). */
  cx: number;
  cy: number;
  /** Gaussian radii in the same space (x / y stretch the bump). */
  sx: number;
  sy: number;
  /** Relative height; the whole field is renormalised to max 1 afterwards. */
  amp: number;
}

export interface ClothConfig {
  /** Grid density: points per row / column. */
  cols: number;
  rows: number;
  /** Empty border around the grid, as a fraction of the canvas size. */
  margin: number;

  /** Displacement in px per unit of depth at full push. */
  maxPush: number;
  /** Direction the relief is lifted in (fake parallax). Normalised at use. */
  lift: { x: number; y: number };
  /** Bulge: px each point slides away from the bump centre at the steepest slope. */
  radialPush: number;
  /** Upper bound for pushStrength, so the grid is hinted at, never dissolved. */
  pushCap: number;

  /** Scroll-progress window (0..1, from Lenis) in which the relief exists. */
  band: {
    start: number;
    end: number;
    /** Progress span of the smoothstep in at `start` and out at `end`. */
    rise: number;
    fall: number;
  };

  /** Release spring: pushStrength chases the band value and overshoots. */
  spring: {
    stiffness: number;
    /** 0 = critically damped (no overshoot) … 1 = very bouncy. */
    wobble: number;
  };

  depth: {
    bumps: Bump[];
    /** 3×3 box-blur passes over the sampled depth. More = softer relief. */
    blurPasses: number;
  };

  light: {
    /** Direction TOWARD the light in screen space (y down). Normalised at use. */
    dir: { x: number; y: number };
    /** Multiplier on slope→brightness before the cap. */
    gain: number;
    /** Max share of the way to the tint colour / peak alpha (keeps it off pure white). */
    highlightCap: number;
    /** Highlight tint: blend between antiquewhite (0) and mediumpurple (1). */
    tintMix: number;
  };

  lines: {
    width: number;
    baseAlpha: number;
    /** Alpha at full highlight. */
    peakAlpha: number;
    /** Extra width factor on lines along a bump edge (steep slope). */
    edgeWidth: number;
    /** Extra alpha on lines along a bump edge. */
    edgeAlpha: number;
  };
}

export const defaultConfig: ClothConfig = {
  cols: 200,
  rows: 120,
  margin: 0.06,

  maxPush: 110,
  lift: { x: 0, y: -1 },
  radialPush: 60,
  pushCap: 1,

  band: { start: 0.2, end: 0.8, rise: 0.15, fall: 0.15 },

  spring: { stiffness: 110, wobble: 0.65 },

  depth: {
    // Rough brows + nose bridge, only meant to hint at a face.
    bumps: [
      { cx: 0.36, cy: 0.38, sx: 0.11, sy: 0.05, amp: 0.85 }, // left brow
      { cx: 0.64, cy: 0.38, sx: 0.11, sy: 0.05, amp: 0.85 }, // right brow
      { cx: 0.5, cy: 0.5, sx: 0.045, sy: 0.16, amp: 1 }, // nose bridge
      { cx: 0.5, cy: 0.66, sx: 0.07, sy: 0.05, amp: 0.7 }, // nose tip
      { cx: 0.26, cy: 0.58, sx: 0.08, sy: 0.08, amp: 0.4 }, // left cheek
      { cx: 0.74, cy: 0.58, sx: 0.08, sy: 0.08, amp: 0.4 }, // right cheek
    ],
    blurPasses: 1,
  },

  light: {
    dir: { x: -0.6, y: -0.8 },
    gain: 3.5,
    highlightCap: 0.95,
    tintMix: 0.35,
  },

  lines: {
    width: 0.7,
    baseAlpha: 0.2,
    peakAlpha: 0.95,
    edgeWidth: 1.2,
    edgeAlpha: 0.18,
  },
};
