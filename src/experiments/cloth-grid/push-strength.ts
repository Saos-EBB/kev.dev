// pushStrength: how far the relief is pressed out right now.
//   band value  — smoothstep 0 → 1 → 0 over a narrow window of scroll progress
//   spring      — chases the band value, so the release overshoots and settles
//                 instead of snapping to 0 (undershoot = fabric dips in briefly)

import type { ClothConfig } from "./config";

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 0 → 1 → 0 across the band, from Lenis progress (0..1). */
export function bandValue(progress: number, band: ClothConfig["band"]): number {
  return (
    smoothstep(band.start, band.start + band.rise, progress) *
    (1 - smoothstep(band.end - band.fall, band.end, progress))
  );
}

export interface PushSpring {
  /** Set from scroll progress. `snap` jumps straight there, no spring. */
  setProgress(progress: number, snap?: boolean): void;
  /** Advance by dt seconds. */
  step(dt: number): void;
  /** Current pushStrength, already capped. */
  readonly value: number;
  readonly settled: boolean;
}

export function createPushSpring(config: ClothConfig): PushSpring {
  const { pushCap, band, spring } = config;
  const damping = 2 * (1 - 0.95 * spring.wobble) * Math.sqrt(spring.stiffness);
  let target = 0;
  let x = 0;
  let v = 0;

  return {
    setProgress(progress, snap = false) {
      target = bandValue(progress, band) * pushCap;
      if (snap) {
        x = target;
        v = 0;
      }
    },
    step(dt) {
      v += (spring.stiffness * (target - x) - damping * v) * dt;
      x += v * dt;
      // Cap the top; allow a little dip below 0 for the snap-back.
      x = Math.min(pushCap, Math.max(-0.5 * pushCap, x));
    },
    get value() {
      return x;
    },
    get settled() {
      return Math.abs(target - x) < 1e-3 && Math.abs(v) < 1e-2;
    },
  };
}
