## 2026-09-22 — feat(cloth-relief): generic frontal relief mount for plain page elements

**Was:** `src/cloth-relief.ts`, `mountClothRelief(el, depthUrl, placement, band, colorSource?)`
— a cloth relief for a plain, frontally-viewed element (no CSS-3D plane, no perspective camera,
unlike `skull-field.ts`'s wall/floor versions). Displacement is a simple radial puff away from
the patch's own centre instead of the wall/floor's ray-reprojection trick — nothing here is seen
obliquely, so there's nothing to correct for. Depth image, its crop and placement are all
parameters, not baked in, so a later "render something else here" is a new call, not a new
module. Reuses `mountMeshPatch()` unchanged. Also memoized `imageDepth()` by URL in
`depth-map.ts` — `floor-relief.ts` and this both load `skull.png`, now the second load is free.
**Nicht gebaut:** noch nicht an einem Element verdrahtet — folgt als eigener Step
(`src/projects/carousel.ts`, siehe Plan).

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
