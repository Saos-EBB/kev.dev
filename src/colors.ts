// The one color the JS side needs: cloth.ts reads --grid-color live from
// style.css via getComputedStyle every time (so it always follows CSS) and
// falls back to COLORS.line only if that read comes back empty. All other
// colors live in style.css's :root and are rendered by CSS alone, so they
// are deliberately not mirrored here.
export const COLORS = {
  line: "#c80032",
} as const;

// "#rrggbb" or "#rgb" -> [r, g, b]. The short form is real: the production
// build minifies #ffffff to #fff, and the browser hands that back as written.
export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.trim().slice(1);
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
