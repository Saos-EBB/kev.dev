## 2026-09-22 — chore: unwire the floor relief, pause for brainstorming

**Was:** removed the `mountFloorRelief` import/mount/`onUpdate` from `src/scroll/transition.ts` —
back to exactly what it was before this whole thread, verified via `git diff` against `02225b5`.
Nothing deleted: `floor-relief.ts`, `cloth-relief.ts` and everything they depend on stay in the
tree, unimported. Confirmed via `npm run build` that Vite drops the whole unreferenced chain from
the bundle (`skull.png` no longer in `dist/`, main.js back to 164KB from 172KB) — dormant costs
nothing, same as `cloth-relief.ts` already did after the projects-wall pivot.
**Nicht gebaut:** nothing new this step — see `docs/handoff.md` for the full state/how-to-
resume writeup asked for here instead of more code.

## 2026-09-22 — fix: drop the CSS-mask skull, make the floor relief a brief flash

**Was:** removed `.projects-bg-grid::after` (the CSS-mask skull from the previous step) entirely
— called ugly on sight, no salvage attempt. Kept: the floor relief (liked, "kinda cool"), but its
band was way too wide (`start:0, end:0.78` — visible across most of the tip-over). `bandValue`
(`push-strength.ts`) has no plateau, it only ever rises then immediately falls, so "how long it's
visible" is entirely rise+fall's width — narrowed to `{start:0.32, end:0.48, rise:0.06,
fall:0.08}`: a quick flash around 40% into the tip-over, not a sustained reveal.
**Nicht gebaut:** floor relief's size (width/push) untouched — the ask was about duration/
subtlety, not shrinking it; it stays the same big skull, just seen for a moment instead of
a long stretch.

## 2026-09-22 — refactor(projects): skull as a CSS mask, not a JS mesh relief

**Was:** dropped the mesh-relief skull from `.projects-bg-grid` (was reading as a small,
secondary "mini" version next to the floor's now much bigger one) — the carousel.ts wiring
(`mountClothRelief` call, its `onUpdate`) is gone, back to exactly what it was before this whole
detour. In its place: `.projects-bg-grid::after`, a plain CSS layer using `skull.png` (the same
baked depth map, white = skull) as a `mask-image` with `mask-mode: luminance`, tinted with
`rgba(var(--grid-color), 0.35)` so it reads as part of the same grid system instead of a foreign
image — no canvas, no JS, no per-frame cost at all, zero bundle-size change (same asset, already
loaded for the floor). `mask-size: 200% 200%` compensates for the source PNG's generous black
margin around the actual skull (see `skull-field.ts`'s `CROP` rect) — a first-pass number, not
yet eyeballed.
**Nicht gebaut:** `cloth-relief.ts` (the generic mount function) stays in the tree unused — it's
the reusable piece asked for earlier ("later render a hand or something else"), costs nothing
sitting idle (nothing imports it, so it doesn't even reach the bundle), not deleted on the
strength of a single caller going away.

## 2026-09-22 — feat(cloth-relief): canvas covers the whole visible background

**Was:** clarified — "make the whole projects wall cloth" meant the canvas itself should span
the entire visible background, not a (however large) centred box on it. `cloth-relief.ts`'s
patch bounds (`x0..x1`, `y0..y1`) are now always `0..visibleWidth`/`0..visibleHeight` (the same
viewport-clamped size from the previous fix), independent of the picture's own `width`/`cx`/`cy`
— those still place the silhouette within that full canvas, cells outside it simply never rise
(mesh-patch only draws raised quads), so this costs nothing extra to look at, only more
(cheap) vertices to update per frame while actively animating.
**Nicht gebaut:** no change to `carousel.ts`'s call itself — same placement numbers, now just
sitting inside a full-background canvas instead of a bounded one.

## 2026-09-22 — fix: floor skull was upside down, enlarge + fix the projects-wall relief

**Was:** three fixes from another look in the browser.
1. `skull-field.ts`'s `floorSkull()` sampled the depth image with the vertical axis inverted
   (`vv = (d − dc) / wh + 0.5`) — chin ended up at the wall's top, forehead at floor level once
   tipped. Local y=0 (the floor div's own top edge) is what becomes the wall's *top* after
   `transition.ts`'s rotation (same fact `.elevator-floor-title`'s own `top` comment in
   style.css relies on), so v=0 (canvas top) needs the picture's own top — flipped to
   `vv = (dc − d) / wh + 0.5`.
2. `cloth-relief.ts` centred itself on `el.getBoundingClientRect()`'s full box — wrong for
   `.projects-bg-grid`, which is `inset:0` of `#projects`, a section many viewport-heights tall
   (it holds the whole carousel's scroll room). While pinned only a viewport-sized slice at the
   top is ever visible, so centring on the *full* (mostly off-screen) box put the patch well
   below the fold. Now clamps to `min(rect.width/height, window.innerWidth/innerHeight)`.
3. Gave `cloth-relief.ts` the same patch-local `CELL_DIVISOR` (a quarter of `--grid-cell`) as
   `floor-relief.ts` already has, and enlarged the projects-wall placement (`width` 420 → 850,
   `push` 60 → 90 in `carousel.ts`) — "make the whole projects wall cloth," read as: the relief
   should dominate the visible background, not sit in a small centred box.
**Nicht gebaut:** no change to timing/band on either relief this round — only geometry/sizing.

## 2026-09-22 — fix(about): floor relief read as a blob, not a skull

**Was:** two changes to `src/about/floor-relief.ts`, both from direct feedback after the first
look in the browser. (1) The patch's own mesh cell is now a quarter of the live `--grid-cell`
(`CELL_DIVISOR`), local to this patch only — at the page's 48px cell a skull-sized patch only had
a handful of cells across, way too coarse to read as a face (same root cause as the abandoned
side-wall relief, see `docs/errors.md`, just fixed here instead of dropped: unraised cells stay
transparent, so the coarser CSS grid still shows through outside the silhouette, no seam). (2)
`PLACEMENT.width` 450 → 1350 (3×), `stretch` 1.1 → 0.6 (now compressing the depth axis, not
expanding it — the only way a picture this wide still fits inside the 1440px shaft depth), `push`
changed from a share of `width` to a flat `PUSH_PX` (50) — scaling push with the new width would
have blown the depth budget on its own. At these numbers the patch covers ~87% of the shaft's
depth — expected and intended for a skull this size, not a bug to shrink away.
**Nicht gebaut:** band timing (rise/peak/fall against the pin's own progress) left unchanged —
it already settles to 0 before the rotation completes, matching "gone once fully tipped."

## 2026-09-22 — feat(cloth-relief): generic frontal relief mount for plain page elements

**Was:** `src/cloth-relief.ts`, `mountClothRelief(el, depthUrl, placement, band, colorSource?)`
— a cloth relief for a plain, frontally-viewed element (no CSS-3D plane, no perspective camera,
unlike `skull-field.ts`'s wall/floor versions). Displacement is a simple radial puff away from
the patch's own centre instead of the wall/floor's ray-reprojection trick — nothing here is seen
obliquely, so there's nothing to correct for. Depth image, its crop and placement are all
parameters, not baked in, so a later "render something else here" is a new call, not a new
module. Reuses `mountMeshPatch()` unchanged. Also memoized `imageDepth()` by URL in
`depth-map.ts` — `floor-relief.ts` and this both load `skull.png`, now the second load is free.
Verdrahtet in `src/projects/carousel.ts`: mounted on `.projects-bg-grid`, driven off the
existing carousel pin's `onUpdate` (`self.progress`, band `{start:0, end:0.1, rise:0.04,
fall:0.06}` — pops once as the pin starts, settled/idle for the remaining ~90% of the long
carousel scroll). `colorSource` passed as `#projects` itself, since `.projects-bg-grid` has no
`background-color` of its own. Placement (`cx`/`cy`/`width`/`push`) is a first pass, not yet
eyeballed in the browser.

## 2026-09-22 — feat(about): wire the floor relief into the live page, drop /cloth

**Was:** `src/about/floor-relief.ts` mounts a canvas patch on the real `.elevator-wall--floor`
and drives it off the same pin ScrollTrigger that rotates the shaft (`onUpdate` in
`transition.ts`) — no separate scroll listener. Reuses `floorSkull()`/`mountMeshPatch()`/
`imageDepth()` from `src/experiments/cloth-grid/` and `src/experiments/room-cloth/` directly
(no copy) — the live site now depends on those experiment modules on purpose. Dropped the
`/cloth` and `/cloth-grid` standalone test pages and everything only they used (their `main.ts`
entries, `cloth-grid.ts`, `room-cloth/config.ts`, `hand.png`, the two HTML files, the
`vite.config.ts` entries) — the side-wall relief they were testing got abandoned (see
`docs/errors.md`), so there was nothing left worth keeping them running for.
**Nicht gebaut:** kein Winkel-Tracking während der Kipp-Rotation selbst (siehe Step 1) — die
Push-Band-Werte (`PLACEMENT`/`PUSH_SHARE` in `floor-relief.ts`) sind ein erster Wurf, noch nicht
im Browser gegengeprüft.

## 2026-09-22 — feat(room-cloth): floorSkull geometry for a floor relief

**Was:** `floorSkull()` in `skull-field.ts`, analog zu `wallSkull()` aber für die horizontale
Bodenebene — Push nach oben (`halfH = vh/2` statt `halfW`), Achsen vertauscht (Canvas-x = Screen-x
direkt, kein Eye-Tracking nötig; Canvas-y = Tiefe, invertiert). Bild-Höhenachse liegt auf der
Tiefenachse, damit der Skull aufrecht steht, sobald `transition.ts` den Boden zur Wand kippt.
**Nicht gebaut:** noch keine Einbindung (Konfiguration/Mount/Kipp-Interaktion) — folgt als
eigener Step, erst statisch im `/cloth`-Testraum geprüft.
