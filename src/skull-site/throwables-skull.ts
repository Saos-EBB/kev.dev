// What the skull variant throws instead of the main page's set
// (src/lab/throwables.ts): a can, a saw blade, a poop pile and an axe.
// The can and the saw blade are the main page's; poop and axe are drawn
// here the same way (extruded hairline SVG slices).
import { can, extrude, saw, type Throwable } from "../lab/throwables";

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

export const SKULL_THROWABLES: Throwable[] = [can(), saw(), poop(), axe()];
