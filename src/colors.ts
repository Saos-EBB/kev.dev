// The page's color palette, in one place — the JS-readable mirror of the
// *shared* colors in style.css's :root (--color-bg, --color-text, etc),
// the same pairing as timings.ts is for animation timing. Two things in
// :root aren't mirrored here, since they only matter to CSS: the
// per-section backgrounds (--hero-bg, --about-bg, --projects-bg,
// --contact-bg), the room/projects colors (--color-room-*, --note-*,
// --term-*, --shade-*, ...) and --grid-color (deliberately shared across
// every scene). All of them are plain hex values in :root.
//
// Unlike timings, this isn't a real two-sided split: almost every color
// on the page is rendered by CSS (backgrounds, text, borders, hover
// states), and CSS can't import a .ts file — so style.css's :root stays
// the one actual source of truth. This file exists for the page's only
// real JS-side color need: cloth.ts reads --grid-color live via
// getComputedStyle every time (so it always follows CSS), and falls back
// to COLORS.line only in the unlikely case that read comes back empty.
// It's also a single named place to reference the palette from JS if
// that ever grows beyond cloth.ts.
//
// Hand-adjust a color in style.css's :root first, then mirror the same
// value here — never the other way around, and never both independently.
export const COLORS = {
  bg: "#08070a",
  text: "#f5f5f6",
  textMuted: "#8a8a93",
  accent: "#5f0027",
  line: "#c80032",
} as const;

// "#rrggbb" -> "r, g, b" — for building rgba(${...}, alpha) strings.
export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.trim().slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const hexToRgbTriple = (hex: string): string => hexToRgb(hex).join(", ");
