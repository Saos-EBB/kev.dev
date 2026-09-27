// The one color the JS side needs: cloth.ts reads --grid-color live from
// style.css via getComputedStyle every time (so it always follows CSS) and
// falls back to COLORS.line only if that read comes back empty. All other
// colors live in style.css's :root and are rendered by CSS alone, so they
// are deliberately not mirrored here.
export const COLORS = {
  line: "#c80032",
} as const;

// "#rrggbb" -> [r, g, b]
export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.trim().slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
