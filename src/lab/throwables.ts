// Things the Motion Lab throws at the viewer. Every object is a stack of
// flat hairline SVG "slices" placed in CSS 3D (translate/rotate per
// slice): silhouettes stacked along z give a solid with thickness, rings
// rotated around an axis give a wireframe (ball, can). All shapes are
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

function ball(): Throwable {
  const d = 110;
  const meridians = [0, 45, 90, 135].map((ry) => ({ w: d, h: d, viewBox: "0 0 100 100", svg: RING, t: `rotateY(${ry}deg)`, wire: true }));
  const latitudes = [-0.55, 0, 0.55].map((k) => ({
    w: d, h: d, viewBox: "0 0 100 100", svg: RING, wire: true,
    t: `translateY(${((k * d) / 2).toFixed(1)}px) rotateX(90deg) scale(${Math.sqrt(1 - k * k).toFixed(3)})`,
  }));
  return { name: "ball", w: d, h: d, slices: [...meridians, ...latitudes] };
}

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

function knife(): Throwable {
  const svg =
    '<path d="M6 22 L132 8 L132 32 Q70 34 6 22 Z"/>' +
    '<rect x="134" y="11" width="60" height="18" rx="5"/><circle cx="152" cy="20" r="2.5"/><circle cx="176" cy="20" r="2.5"/>';
  return { name: "knife", w: 240, h: 48, slices: extrude(240, 48, "0 0 200 40", svg, 4, 2) };
}

function skull(): Throwable {
  // Cranium + cheekbones as a rounded stack (outer slices shrink like a
  // head), the lower jaw as a shallower stack of its own, and the face
  // (eye sockets, nose cavity, teeth, cheek lines) on one slice at the
  // front, so it reads as a skull from the front and as a head from the
  // side. Sockets and nose are filled darker holes (.hole).
  const w = 110;
  const h = 132;
  const vb = "0 0 100 120";
  const cranium =
    '<path d="M50 4 C24 4 8 22 8 46 C8 58 12 66 16 72 C18 76 20 80 23 84 L31 87 L69 87 L77 84 C80 80 82 76 84 72 C88 66 92 58 92 46 C92 22 76 4 50 4 Z"/>';
  const jaw = '<path d="M27 84 C27 97 35 108 50 110 C65 108 73 97 73 84 L66 90 H34 Z"/>';
  const face =
    '<path class="hole" d="M25 49 C25 40 33 35 41 39 C47 42 46 54 41 58 C35 62 25 58 25 49 Z"/>' +
    '<path class="hole" d="M75 49 C75 40 67 35 59 39 C53 42 54 54 59 58 C65 62 75 58 75 49 Z"/>' +
    '<path class="hole" d="M50 61 L44 73 C46 75 48 75 50 73 C52 75 54 75 56 73 Z"/>' +
    '<path d="M17 69 C23 65 30 65 35 68 M83 69 C77 65 70 65 65 68"/>' +
    '<path d="M33 86 H67 M38 82 V92 M44 82 V93 M50 82 V93 M56 82 V93 M62 82 V92 M36 94 C44 97 56 97 64 94"/>';
  const head = extrude(w, h, vb, cranium, 70, 7, 0.4);
  const mandible = extrude(w, h, vb, jaw, 44, 4, 0.3).map((sl) => ({ ...sl, t: `translateZ(10px) ${sl.t}` }));
  const front = { w, h, viewBox: vb, svg: face, wire: true, t: "translateZ(36px) scale(0.92)" };
  // Side profile through the middle (rotateY 90deg turns its left edge to
  // the front), so the skull keeps its shape when seen side-on.
  const profile = {
    w, h, viewBox: vb, t: "rotateY(90deg) scale(0.8)",
    svg:
      '<path d="M60 4 C82 4 95 22 95 45 C95 62 88 72 80 79 L76 90 C72 99 64 103 57 104 L42 109 C35 110 30 106 30 99 L28 92 L20 88 C16 86 16 82 18 79 L13 71 C11 67 13 63 17 61 L15 48 C15 24 34 4 60 4 Z"/>' +
      '<path class="hole" d="M18 44 C24 40 32 42 33 50 C34 57 26 60 19 57 Z"/><circle class="hole" cx="70" cy="62" r="4"/>' +
      '<path d="M24 68 C36 66 48 66 60 68 M30 92 H52 M34 88 V96 M40 88 V97 M46 88 V97"/>',
  };
  return { name: "skull", w, h, slices: [...head, ...mandible, profile, front] };
}

function teapot(): Throwable {
  // Body: a squashed wire sphere (meridian ellipses + rings); lid, knob,
  // spout and handle: one flat outline through its middle.
  const w = 170;
  const h = 120;
  const bw = 96; // body width in px (viewBox 140 -> 170px: 80 units)
  const bh = 78;
  const ell = `<ellipse cx="50" cy="50" rx="48" ry="48"/>`;
  const meridians = [0, 60, 120].map((ry) => ({
    w: bw, h: bh, viewBox: "0 0 100 100", svg: ell, wire: true, t: `translateY(12px) rotateY(${ry}deg)`,
  }));
  const rings = [-0.5, 0, 0.5].map((k) => ({
    w: bw, h: bw, viewBox: "0 0 100 100", svg: RING, wire: true,
    t: `translateY(${(12 + (k * bh) / 2).toFixed(1)}px) rotateX(90deg) scale(${Math.sqrt(1 - k * k).toFixed(3)})`,
  }));
  const parts =
    '<path d="M46 32 Q70 18 94 32"/><circle cx="70" cy="18" r="5"/>' +
    '<path d="M108 64 Q126 58 134 36 L128 33 Q120 50 106 50"/><path d="M32 46 Q6 46 10 64 Q13 80 34 76"/><path d="M50 91 H90"/>';
  const flat = extrude(w, h, "0 0 140 100", parts, 6, 2).map((sl) => ({ ...sl, wire: true }));
  return { name: "teapot", w, h, slices: [...meridians, ...rings, ...flat] };
}

export const THROWABLES: Throwable[] = [can(), ball(), saw(), skull(), knife(), teapot()];

export function renderThrowable(t: Throwable): string {
  return t.slices
    .map(
      (s) =>
        `<svg class="ml-slice${s.wire ? " is-wire" : ""}" viewBox="${s.viewBox}" style="width:${s.w}px;height:${s.h}px;margin:${-s.h / 2}px 0 0 ${-s.w / 2}px;transform:${s.t}">${s.svg}</svg>`,
    )
    .join("");
}
