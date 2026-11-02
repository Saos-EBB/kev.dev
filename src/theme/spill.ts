// The theme switch's reveal shape: liquid spilled in the top left corner,
// running to the bottom right as if the page were tilted that way. Returns
// clip-path keyframes for ::view-transition-new(root) (theme.ts). Every
// frame has the same points, so the browser interpolates between them; a new
// random spill per call. u runs down the slope, v across it.

const FRAMES = 24;
const FOOT_SAMPLES = 8; // points per finger flank
const HEAD_SAMPLES = 8; // points around a finger's round tip
const DROP_SAMPLES = 8;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smooth = (a: number, b: number, t: number) => {
  const u = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return u * u * (3 - 2 * u);
};

export function spillFrames(w: number, h: number): string[] {
  const L = (w + h) / Math.SQRT2; // top left corner to bottom right corner
  const V = L; // half the width of the slope that has to be covered
  const swell = L * 0.03; // the front's lobes

  const scale = Math.min(Math.max(L / 1400, 0.55), 1); // thinner runs on small screens
  const count = Math.round(Math.min(Math.max(L / (75 * scale), 8), 20));
  // Only v within the screen shows: at u, that's |v| <= min(u, L - u) plus
  // the screen's skew, so the fingers spread over all of it.
  const reach = Math.max(w, h) / Math.SQRT2;
  const fingers = Array.from({ length: count }, (_, i) => {
    const neck = rand(5, 13) * scale;
    return {
      v: -reach + ((i + rand(0.2, 0.8)) / count) * 2 * reach,
      neck,
      head: neck * rand(1.35, 1.9),
      foot: neck + rand(30, 70) * scale,
      len: L * (Math.random() < 0.4 ? rand(0.14, 0.27) : rand(0.04, 0.11)),
      sway: rand(6, 22) * scale * (Math.random() < 0.5 ? -1 : 1), // no run is straight
      phase: rand(0, 6.3),
      start: rand(0, 0.4),
      span: rand(0.32, 0.5),
    };
  });
  // Drops hang off the longest fingers' tips, then lag and get swallowed.
  const drops = [...fingers].sort((a, b) => b.len - a.len).slice(0, 6).map((f) => ({
    finger: f,
    at: f.start + f.span * rand(0.55, 0.8),
    r: rand(3, 8),
    ahead: rand(16, 46),
  }));

  const k = [rand(3, 5) / reach, rand(8, 13) / reach];
  const ph = [rand(0, 6.3), rand(0, 6.3)];

  const toXY = (u: number, v: number) =>
    `${Math.round((u + v) / Math.SQRT2)} ${Math.round((u - v) / Math.SQRT2)}`;

  const frame = (t: number) => {
    // Slow to get going while the pool spreads, the fingers run ahead of it,
    // and by the end the pool has passed the far corner.
    const base = -1.5 * swell + (L + 5 * swell) * (0.35 * t + 0.65 * t * t * (3 - 2 * t));
    const front = (v: number) =>
      base + swell * Math.sin(v * k[0] + ph[0] + t * 2) + swell * 0.4 * Math.sin(v * k[1] + ph[1] - t * 3);

    const pts: string[] = [toXY(front(-V), -V)];
    for (const f of fingers) {
      const g = f.len * smooth(f.start, f.start + f.span, t);
      const r = f.head * Math.min(1, g / (f.head * 3));
      const n = Math.min(f.neck, r);
      const foot = n + (f.foot - f.neck) * Math.min(1, g / (f.foot * 2));
      // Sideways drift along the run, none at the foot.
      const sway = (e: number) => f.sway * Math.min(1, g / 60) * e * Math.sin(e * 4 + f.phase);
      // A wide foot pulling in quickly to the neck, the way a run leaves a pool.
      const flank = (e: number, side: number) => {
        const v = f.v + sway(e) + side * (n + (foot - n) * (1 - e) ** 4);
        pts.push(toXY(front(f.v + side * foot * (1 - e)) + g * e, v));
      };
      for (let i = 0; i < FOOT_SAMPLES; i++) flank(i / FOOT_SAMPLES, -1);
      const tip = front(f.v) + g;
      for (let i = 0; i <= HEAD_SAMPLES; i++) {
        const a = -Math.PI / 2 + (i / HEAD_SAMPLES) * Math.PI;
        pts.push(toXY(tip + r * Math.cos(a), f.v + sway(1) + r * Math.sin(a)));
      }
      for (let i = FOOT_SAMPLES - 1; i >= 0; i--) flank(i / FOOT_SAMPLES, 1);
    }
    pts.push(toXY(front(V), V), toXY(-L, V), toXY(-L, -V));
    let d = `M${pts.join("L")}Z`;

    // Same turning direction as the outline above, so overlaps add up
    // instead of cutting holes (nonzero fill).
    for (const drop of drops) {
      const f = drop.finger;
      const grown = smooth(drop.at, drop.at + 0.1, t);
      const r = Math.max(drop.r * grown, 0.01);
      const u = front(f.v) + f.len * smooth(f.start, f.start + f.span, t) + f.head + drop.ahead * grown;
      const ring: string[] = [];
      for (let i = 0; i < DROP_SAMPLES; i++) {
        const a = (i / DROP_SAMPLES) * Math.PI * 2;
        ring.push(toXY(u + r * Math.cos(a), f.v + f.sway * Math.sin(4 + f.phase) + r * Math.sin(a)));
      }
      d += `M${ring.join("L")}Z`;
    }
    return `path("${d}")`;
  };

  return Array.from({ length: FRAMES + 1 }, (_, i) => frame(i / FRAMES));
}
