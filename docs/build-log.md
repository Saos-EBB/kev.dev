# Build-Log

## 2026-09-24 — feat(projects): Labels Ziel / Beweis / Projekt
**Was:** Die drei Textteile der Karte tragen ein kleines Label: `learnGoal` = „Ziel“, `claim` = „Beweis“, `what` = „Projekt“. Die Details-Überschriften (Entscheidungen, Herausforderung, So entstanden) gab es schon und sind jetzt in `--color-line` statt dem zu dunklen `--color-accent`.
**Nicht gebaut:** Kein „Problem“-Label (`learnGoal` ist bei YourBrand ein Lernziel, kein Problem), keine Labels für Tags/Meta, kein Text geändert. Labels stehen inline, damit die festen Bento-Boxen nicht höher werden. Nicht im Browser geprüft.

## 2026-09-24 — feat(about): Trennlinien, Absätze, Akzente
**Was:** „Wie ich arbeite“ ist an Satzgrenzen in vier Absätze geteilt (Wortlaut unverändert). Jeder Block nach der Karte (Story, Zitate, Wie ich arbeite, CV-Sections, Footer) hat oben eine dünne Linie. Überschriften haben einen kurzen roten Balken davor, die Rolle in der Karte ist rot. Der Overlay-Abstand sinkt von 1.4em auf 1.1em, damit die Linien die feste Höhe nicht sprengen.
**Nicht gebaut:** Kein Umschreiben, keine neuen Texte, `style.css` unberührt. Ungetestet im Browser. `--color-accent` (#5f0027) ist auf dem Hintergrund kaum lesbar (~1,5:1), deshalb hier `--color-line`. Der Token wird an anderen Stellen weiter als Textfarbe genutzt (Projekt-Cards, `[OFFEN]`).

## 2026-09-24 — feat(projects): Cards im Lesefont
**Was:** `.pcard` nutzt `--font-read` (Fließtext und Labels), Beschreibung/Details/Ziel leicht größer, Zeilenabstand 1.65.
**Nicht gebaut:** Kein Umbau von Karten- oder Bento-Layout, Titel bleibt in Koeeya. Nicht im Browser geprüft; die Karten haben feste Slots, längere Texte können dort eng werden.

## 2026-09-24 — feat(about): JetBrains Mono und ruhigere Typografie
**Was:** Lesefont JetBrains Mono (SIL OFL, self-hosted über `@fontsource-variable/jetbrains-mono`) als Token `--font-read` in `src/reading.css`. Im About-Overlay ersetzt er Sans und Mono, Zitate sind nicht mehr kursiv, Zeilenabstand 1.7, Größe leicht angepasst. Auch die CV-Listen nutzen ihn.
**Nicht gebaut:** Kein CDN, keine Italic-/Bold-Dateien, kein Text-Hintergrund über der Wand, Header/Hero/Kontakt unangetastet. Nicht im Browser geprüft (Höhe des Overlays).

## 2026-09-25 — feat(header): YouTube-Play-Button
**Was:** Der Play/Pause-Button in `.site-header` nutzt jetzt die YouTube-IFrame-API (Host `youtube-nocookie.com`) statt Spotify. Der erste Klick lädt die API und erzeugt einen einzigen Player, vorher kommt nichts von YouTube ins DOM. Neben dem Play-Button sitzen ein dekorativer Equalizer (5 CSS-Balken, laufen nur bei Wiedergabe) und ein Next-Button. Das Video liegt off-screen in `.music-panel`. Spotify ist komplett entfernt, weil Besucher ohne Login nur ~30-s-Previews bekamen. Ohne `PLAYLIST_ID` ist der Button deaktiviert.
**Nicht gebaut:** Kein echter Equalizer (die IFrame-API liefert keine Audiodaten), kein Autoplay beim Laden. Der versteckte Player widerspricht den YouTube-Richtlinien (Player muss sichtbar sein), bewusste Entscheidung von Kevin. Nicht im Browser geprüft.

## 2026-09-24 — feat(about): A3/A4/A5 mit finalem Text
**Was:** Grundsätze, „Wie ich arbeite“ und Soft-Footer tragen jetzt den Wortlaut aus dem Handoff. Der Playlist-Platzhalter in A5 ist weg, die Musik wandert in den Header.
**Nicht gebaut:** Keine Story-Absätze (Quelle fehlt, bleibt `[OFFEN]`), kein vierter Grundsatz, keine Höhenanpassung von `#about`.

## 2026-10-01 — feat: Mobile flüssig, Projekte mit eigenem Vibe, Grid durchgehend
**Was:**
- **Performance Mobile:** Das Hero-Cloth pausiert, sobald der Hero aus dem Bild ist oder der Tab versteckt (lief vorher endlos weiter und kostete jeden Frame der restlichen Seite). Auf Touch/schmalen Geräten kleinere Mesh-Fläche, ein Relaxations-Durchlauf weniger, Canvas-DPR max. 1,5. Namens-Textur wird höchstens einmal pro Frame und nur bei sichtbarem Hero neu gerastert.
- **Lite-Modus (≤900px, `html.lite`, `LITE` in `viewport.ts`):** kein 3D-Aufzug, kein Monitor-Zoom, kein gepinntes Karussell — gemessen waren das die Ruckler (Aufzugwände = Layer so hoch wie die ganze About-Section). Stattdessen ein Grid auf der Seite selbst, das von About über Projekte bis Kontakt ohne Naht durchläuft; About-Text in voller Breite; Projekte als native Swipe-Galerie mit Snap, Punkten und Pfeilen (`projects/swiper.ts`). Breakpoint-Wechsel lädt die Seite neu.
- **Touch am Cloth:** Seitwärts wischen oder kurz halten (260 ms) greift das Tuch, vertikal wird normal gescrollt. Ersetzt den Doppeltipp. Kein „Hover“ mehr, der nach dem Loslassen hängen bleibt.
- **Projekt-Cards:** Jedes Projekt hat ein eigenes Layout, eine eigene Akzentfarbe und eine Signatur-Visualisierung (`project-visuals.ts`): YourBrand = Blueprint (Layer-Stack + Tenant-Matrix), TschoBBo = Mail-Inbox mit Tschobbo, Renderer = 3D-Viewport mit HUD (Klick startet Live-Demo), AniScript = Userscript-Editor mit Diff, Grundlagen = Pinnwand (jeder Zettel startet das Terminal). Claim steht jetzt im Card-Kopf, die Screens-Box ist in die Visualisierungen aufgegangen. Overlay übernimmt die Akzentfarbe.
- **Grid:** Linienfarbe als ein Token `--grid-ink` (18 % statt 12 %), auf 3x-Displays 2 Device-Pixel statt einem. Boxen sind halbtransparent mit Eckmarkern, das Grid läuft unter ihnen weiter; auf dem Desktop-Bento liegen alle Kanten auf Grid-Linien.
**Nicht gebaut / offen:** Keine neuen Inhalte — die Labels in den Visualisierungen sind aus den bestehenden Texten abgeleitet; die Tenant-Matrix bei YourBrand ist illustrativ (Tenant A/B/C), bitte prüfen. Mobile hat bewusst keinen Aufzug mehr. Getestet nur in Chromium/Playwright (Mobile-Emulation mit 4x CPU-Drossel), nicht auf echtem Gerät oder Safari.
