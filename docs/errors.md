# Errors — kev.dev

## 2026-09-22 — Side-wall skull relief looked blocky, not like a highlight

**Symptom:** the `/cloth` room test's side-wall skulls (mesh-patch quads on the elevator's left/
right wall) read as coarse and chunky, not as a clean relief — even the biggest test skull only
spanned a handful of grid cells.

**Ursache:** the relief's quads must land exactly on the wall's own CSS grid corners (no seam,
see mesh-patch.ts) — so the relief's resolution is capped by the page's own `--grid-cell` (48px
live, 32px on narrow mobile), not a smaller one chosen for the effect. A skull-sized patch at
that cell size just doesn't have enough cells to read as a face.

**Fix:** dropped the side-wall relief entirely — the walls stay a plain CSS grid, cheap and
clean, no canvas overlay. Only the floor gets a relief (see below), deliberately large enough to
span many live-grid cells even at 48px.

## 2026-09-22 — Floor relief patch exploded past the shaft's depth

**Symptom:** the floor skull's computed patch depth-extent exceeded `--elevator-depth` (1440px
total) and got clamped to the whole shaft — the relief covered the floor almost edge to edge and
was unrecognizable as "a skull standing up," read as noise instead.

**Ursache:** the floor's local depth axis only has `--elevator-depth` (1440px) of room, much less
than a side wall's local height (400vh). The skull picture is near-square, so its depth-axis
footprint (derived from `width` via the picture's own aspect) ends up close to `width` itself —
a "big" skull inherently eats a large share of that 1440px budget before any push is applied.
`push`'s reprojection padding (∝ CSS perspective distance, see skull-field.ts's `displace()`)
adds more on top, and grows fast with `push`.

**Fix:** kept `width`/`stretch`/`push` modest in `src/about/floor-relief.ts`'s `PLACEMENT` (450px
width, 1.1 stretch, 15% push share) so the patch comfortably fits inside the shaft. Sizing this
by formula only gets you "doesn't explode" — the actual look needs eye-tuning on the live page.
