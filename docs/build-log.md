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
