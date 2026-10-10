// Names cycled through the hero header's type/backspace animation (see
// name-typewriter.ts). Add a name here — it's picked up into the
// rotation automatically, no other wiring needed. Keep the first entry
// as the real name: it's also what the page shows with JS disabled and
// under prefers-reduced-motion (see main.ts).
//
// Koeeya Trial (--font-display) is missing most digits: every one of
// 0,1,2,4,5,6,7,8,9 renders as the same placeholder glyph, only "3" is a
// real digit, and "." (period) is likewise a placeholder — checked via
// the font's own glyf table, not a browser fallback issue. "-" (hyphen)
// is a real glyph and renders fine. Check new names against that before
// adding them (e.g. with a test list of characters).
export const HERO_NAMES = ["Kevin Schaberl", "SaoS", "SaosOne!", "SaosGone?","zaoz","saos43","Saos-EBB", "Saos-EBB-43", "or just … kev#"];
