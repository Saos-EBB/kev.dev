# Handoff — was noch offen ist

Stand: 2026-09-25, Branch `main`. Detailtexte stehen in `docs/offen.md`. Hier steht, was als Nächstes zu tun ist,
nach Bereich sortiert. Alles Sichtbare mit `[OFFEN: …]` auf der Seite ist hier erfasst.

## 1. Uncommitted im Working Tree

- Header-Musik auf YouTube umgestellt (`src/music/youtube.ts` neu, `spotify.ts` gelöscht), inkl. `main.ts`,
  `music.css`, `docs/build-log.md`, `docs/offen.md`.
- `src/style.css` hat eine Änderung, die nicht aus der Musik-Arbeit stammt. Vor dem Commit ansehen.
- `.claude/` ist untracked. Entweder in `.gitignore` oder bewusst einchecken.

## 2. Header-Musik (Details: `docs/build-log.md`)

- **Playlist-ID prüfen:** `PLAYLIST_ID` in `src/music/youtube.ts` ist `PLEvL3R13jO5A` (13 Zeichen). Normale
  Playlist-IDs haben meist 34 Zeichen, der Wert ist vermutlich abgeschnitten. Vollständigen `list=`-Wert eintragen.
  Playlist muss öffentlich oder nicht gelistet sein.
- **Im Browser testen:** greift `playVideo()` nach dem Laden, oder blockt der Browser es (dann zweiter Klick)?
  Spielt der Player off-screen (`.music-panel`, `left: -10000px`) wirklich? Funktioniert Next? Auch mobil prüfen.
- **Equalizer ist Deko** (5 CSS-Balken, laufen nur bei Wiedergabe). Die IFrame-API liefert keine Audiodaten.
- **Richtlinien:** Der Player ist versteckt, das widerspricht den YouTube-Richtlinien. Bewusst so entschieden.
- Songs mit gesperrtem Einbetten werden von YouTube übersprungen.

## 3. About-Seite (`src/about/about-blocks.ts`)

- **A2 „Der Weg hierher“ (blockiert durch Kevin):** Story-Absätze fehlen, sichtbar als `[OFFEN]`. Kevin liefert den
  Text, dann Planungs-Faden Bodenleger → Systemadministrator → Code einweben und `open(...)`-Aufruf (Zeile ~32) löschen.
- **Höhe des Overlays:** Feste Höhe (4 Viewports, mobil abzüglich des letzten). Story plus langer A4-Absatz passen
  evtl. nicht. Dann `#about`-Section verlängern (hängt an Elevator-Geometrie und `transition.ts`). Im Browser prüfen.
- **A3 Grundsätze:** fertig, 3 Zitate. Ein 4. („Code ist Handwerk …“) ist nicht eingebaut. Entscheiden, ob es rein soll.
- **A5 persönliche Zeile:** nur ein Vorschlag, darf getauscht werden.
- **Lebenslauf:** `public/cv/` ist leer. PDF als `public/cv/lebenslauf.pdf` ablegen (oder `CV_HREF` anpassen). Bis dahin
  liefern beide CV-Buttons 404.
- **CV-Sections** (Werdegang/Ausbildung/Skills/Sprachen) stehen zwischen A4 und A5, weil es keine Profil-Seite gibt.
  Entscheiden: behalten oder `cvSections`-Block in `main.ts` entfernen.

## 4. Projekt-Cards (`src/projects/projects-data.ts`)

| Card | Was fehlt |
|---|---|
| YourBrand | **Screenshots der laufenden App** (wie bei TschoBBo als „Screens“-Galerie in die Card, `screenshots` + Facet `screens` in `projects-data.ts`) — sobald YourBrand auf Railway läuft: Kevin schickt 3–4 Screens oder die URL. Lokal bräuchte es Postgres/PostGIS, Redis, MinIO, Backend, Worker, Frontend. Außerdem: Multi-Tenancy: „angelegt/gedacht“ oder „voll umgesetzt“? Wortwahl in Claim, Lernziel, Beschreibung bestätigen. |
| TschoBBo | Screenshot der Mail-Client-UI. `public/projects/jobbot.jpeg` ist nur das Maskottchen. |
| Renderer | Welche zwei Baldur's-Gate-Modelle? (`duoOG` ist 41 MB und nie committet, also unbrauchbar.) Dateinamen nennen oder dezimierte Fassung liefern. Ist `craniumCut01` das Schädel-CT? Modell-Reihenfolge bestätigen (aktuell Ducky, Auto, Pochita, Schädel-CT). |
| AniScript | GitHub-Link fehlt komplett. Detail Brave MV2→V3 / Violentmonkey→ScriptCat final gegenchecken. |
| kev.dev | Neue Card „Dieses Portfolio“ (Storyboard). Texte sind aus Kevins Chat-Beschreibung formuliert — in eigenen Worten nachschärfen. Zeitraum/Umfang (Stunden, solo, CC-Anteil) fehlt. |
| Grundlagen | Info-Text für Mastermind (auch als `open` in `widgets/grundlagen.ts:77` sichtbar). |

Nach jeder Antwort: Text eintragen und das `open`-Feld der Card löschen.

## 5. Grundlagen-Widget (Java im Browser)

- Bei neuen oder geänderten Java-Quellen `./scripts/build-java.sh` laufen lassen und `public/java/grundlagen.jar`
  mit committen. `build-java.sh` fällt auf `-source 17` zurück und würde einen Java-21-Aufruf nicht bemängeln.
- **Vor dem Live-Gang auf Vercel:** prüfen, dass `/java/grundlagen.jar` auf einen `Range`-Request mit `206` antwortet
  (`curl -s -o /dev/null -w "%{http_code}\n" -H "Range: bytes=0-99" https://<url>/java/grundlagen.jar`).
- **Startzeit:** 30 s bis über 100 s bis zur ersten Ausgabe (CDN von CheerpJ). Widget zeigt einen Sekundenzähler.
  Idee, falls es stört: Laden schon beim Scrollen ins Bild starten. Widerspricht der Regel „erst beim Aufklappen“.
  Auf echtem Server messen.
- CheerpJ-Loader ist auf 4.3 gepinnt. Vor einem Upgrade Ein- und Ausgabe an RPN und MasterMind neu testen.
- Renderer-Widget: Zoom und Schnittebene (Cutaway) aus dem Original sind nicht portiert.

## 6. Mehrsprachigkeit (DE/EN/RU/JA/AR)

- **Texte doppelt pflegen:** Deutsch ist die Quelle. Ändert sich ein deutscher Text, die vier Übersetzungen mitziehen: UI in `src/i18n/ui.ts`, About/Lebenslauf in `src/about/about-content.ts`, Projekt-Cards in `src/projects/projects-i18n.ts`, Grundlagen-Programme in `src/projects/widgets/grundlagen-i18n.ts`.
- **Übersetzungen prüfen lassen:** EN/RU/JA/AR sind maschinennah von Claude übersetzt — vor allem JA und AR von Muttersprachlern gegenlesen lassen.
- **Bewusst deutsch:** Impressum/Datenschutz (rechtlich verbindlich, mit Hinweis in der jeweiligen Sprache), `[OFFEN]`-Marker, die Konsolenausgabe der Java-Programme, Tech-Tags.

## 7. Allgemein

- **Kontrast:** `--color-accent` (`#5f0027`) auf `#08070a` hat etwa 1,4:1 (WCAG verlangt 4,5:1 für Text). Betrifft
  `[OFFEN]`-Zeilen, Rolle in der Profilkarte, Card-Überschriften, Terminal-Prompt und jetzt auch die Equalizer-Balken.
  Entscheiden, ob der Akzent für Text aufgehellt wird.
- **Nicht getestet:** nur Chromium (Playwright). Kein Firefox/Safari, kein echtes Touch-Gerät, keine Bildschirmleser.
  Das `prefers-reduced-motion`-Layout der Cards, der About-Blöcke und des Equalizers ist nie im Browser angesehen worden.
- **Aufräumen:** `public/projects/releasewatcher.png` und `yourbrand.png` haben keinen Verweis mehr. Löschen, wenn
  nicht gebraucht.
- **Deployment:** `docs/offen.md` nennt noch den Branch `feat/monitor-zoom` mit „kein Push“. Der aktuelle Branch ist
  `main`. Prüfen, ob gepusht und deployed ist, und den Stand in `offen.md` nachziehen.

## Empfohlene Reihenfolge

1. Vollständige Playlist-URL holen, im Browser testen, dann Musik-Änderung committen.
2. Kevin-Input einsammeln: A2-Story, Lebenslauf-PDF, Renderer-Modelle, TschoBBo-Screenshot, AniScript-Link, Mastermind-Text.
3. Texte eintragen, `open`-Einträge löschen, Overlay-Höhe von About im Browser prüfen.
4. Kontrast-Entscheidung, Firefox/Safari/Touch-Check, dann Vercel-Range-Test und Deploy.
