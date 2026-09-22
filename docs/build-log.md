## 2026-09-22 — feat(room-cloth): floorSkull geometry for a floor relief

**Was:** `floorSkull()` in `skull-field.ts`, analog zu `wallSkull()` aber für die horizontale
Bodenebene — Push nach oben (`halfH = vh/2` statt `halfW`), Achsen vertauscht (Canvas-x = Screen-x
direkt, kein Eye-Tracking nötig; Canvas-y = Tiefe, invertiert). Bild-Höhenachse liegt auf der
Tiefenachse, damit der Skull aufrecht steht, sobald `transition.ts` den Boden zur Wand kippt.
**Nicht gebaut:** noch keine Einbindung (Konfiguration/Mount/Kipp-Interaktion) — folgt als
eigener Step, erst statisch im `/cloth`-Testraum geprüft.
