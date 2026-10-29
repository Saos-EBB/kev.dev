// Things thrown at the viewer (skull variant only, /saos#dev#skull): a
// can, a saw blade, a poop pile and an axe. Every object is a stack of
// flat hairline SVG "slices" placed in CSS 3D (translate/rotate per
// slice): silhouettes stacked along z give a solid with thickness, rings
// rotated around an axis give a wireframe (the can). All shapes are
// drawn here, nothing copied.

type Slice = {
  w: number;
  h: number;
  viewBox: string;
  svg: string;
  t: string; // the slice's own transform inside the object
  wire?: boolean; // outline only, no fill (rings)
};

export type Throwable = { name: string; w: number; h: number; slices: Slice[] };

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-6; v += step) out.push(v);
  return out;
};

// Silhouette extruded along z; `round` shrinks the outer slices so the
// stack reads as a rounded body instead of a slab.
function extrude(w: number, h: number, viewBox: string, svg: string, depth: number, n: number, round = 0): Slice[] {
  return range(-depth / 2, depth / 2, depth / Math.max(n - 1, 1)).map((z) => {
    const k = depth ? (2 * z) / depth : 0;
    const s = 1 - round * k * k;
    return { w, h, viewBox, svg, t: `translateZ(${z.toFixed(1)}px) scale(${s.toFixed(3)})` };
  });
}

const RING = '<circle cx="50" cy="50" r="48"/>';

function can(): Throwable {
  const d = 80;
  const h = 140;
  const top = '<circle cx="50" cy="50" r="48"/><circle cx="50" cy="50" r="40"/><rect x="40" y="20" width="20" height="12" rx="6"/>';
  const rings = [-h / 2, -h / 2 + 8, h / 2 - 8, h / 2].map((y, i) => ({
    w: d, h: d, viewBox: "0 0 100 100", svg: i === 0 ? top : RING, wire: true,
    t: `translateY(${y}px) rotateX(90deg)${i === 1 || i === 2 ? " scale(0.94)" : ""}`,
  }));
  const sides = [0, 60, 120].map((ry) => ({
    w: d, h, viewBox: `0 0 ${d} ${h}`, wire: true,
    svg: `<rect x="1" y="1" width="${d - 2}" height="${h - 2}"/>`,
    t: `rotateY(${ry}deg)`,
  }));
  return { name: "can", w: d, h, slices: [...rings, ...sides] };
}

function saw(): Throwable {
  const teeth = 18;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const b = a + (Math.PI * 2) / teeth * 0.75;
    pts.push(`${(48 * Math.cos(a)).toFixed(1)},${(48 * Math.sin(a)).toFixed(1)}`);
    pts.push(`${(39 * Math.cos(b)).toFixed(1)},${(39 * Math.sin(b)).toFixed(1)}`);
  }
  const svg = `<polygon points="${pts.join(" ")}"/><circle r="22"/><circle r="7"/>`;
  return { name: "saw", w: 150, h: 150, slices: extrude(150, 150, "-50 -50 100 100", svg, 4, 3) };
}

function axe(): Throwable {
  // Double-bit head on a long handle, both extruded thin.
  const svg =
    '<rect x="4" y="35" width="176" height="10" rx="5"/>' +
    '<path d="M150 22 H164 Q180 20 194 4 Q202 40 194 76 Q180 60 164 58 H150 Z"/>';
  return { name: "axe", w: 230, h: 92, slices: extrude(230, 92, "0 0 200 80", svg, 8, 3) };
}

function poop(): Throwable {
  // Three-tier swirl pile as a rounded stack, tier seams on the front.
  const w = 110;
  const h = 100;
  const vb = "0 0 100 90";
  const pile =
    '<path d="M50 4 C56 10 62 14 60 22 C72 22 78 30 74 38 C88 40 92 52 84 60 C98 64 98 84 82 86 H18 C2 84 2 64 16 60 C8 52 12 40 26 38 C22 30 28 22 40 22 C38 14 44 10 50 4 Z"/>';
  const seams = { w, h, viewBox: vb, wire: true, t: "translateZ(30px) scale(0.9)", svg: '<path d="M26 38 Q50 47 74 38 M16 60 Q50 71 84 60"/>' };
  return { name: "poop", w, h, slices: [...extrude(w, h, vb, pile, 60, 6, 0.45), seams] };
}

export const THROWABLES: Throwable[] = [can(), saw(), poop(), axe()];

export function renderThrowable(t: Throwable): string {
  return t.slices
    .map(
      (s) =>
        `<svg class="ml-slice${s.wire ? " is-wire" : ""}" viewBox="${s.viewBox}" style="width:${s.w}px;height:${s.h}px;margin:${-s.h / 2}px 0 0 ${-s.w / 2}px;transform:${s.t}">${s.svg}</svg>`,
    )
    .join("");
}
