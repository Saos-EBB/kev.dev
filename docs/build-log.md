# Build-Log

## 2026-09-24 — feat(projects): Cards im Lesefont
**Was:** `.pcard` nutzt `--font-read` (Fließtext und Labels), Beschreibung/Details/Ziel leicht größer, Zeilenabstand 1.65.
**Nicht gebaut:** Kein Umbau von Karten- oder Bento-Layout, Titel bleibt in Koeeya. Nicht im Browser geprüft; die Karten haben feste Slots, längere Texte können dort eng werden.

## 2026-09-24 — feat(about): JetBrains Mono und ruhigere Typografie
**Was:** Lesefont JetBrains Mono (SIL OFL, self-hosted über `@fontsource-variable/jetbrains-mono`) als Token `--font-read` in `src/reading.css`. Im About-Overlay ersetzt er Sans und Mono, Zitate sind nicht mehr kursiv, Zeilenabstand 1.7, Größe leicht angepasst. Auch die CV-Listen nutzen ihn.
**Nicht gebaut:** Kein CDN, keine Italic-/Bold-Dateien, kein Text-Hintergrund über der Wand, Header/Hero/Kontakt unangetastet. Nicht im Browser geprüft (Höhe des Overlays).

## 2026-09-24 — feat(header): Spotify-Play-Button
**Was:** Play/Pause-Button in `.site-header`. Der erste Klick lädt die Spotify-Embed-iframe-API und erzeugt einen einzigen Controller. Vorher kommt nichts von Spotify ins DOM. Der Embed steckt in einem eigenen fixen Panel unten rechts, damit die Bedienung bleibt, wenn der Header mitten im Scroll ausblendet. Ohne Playlist-URL ist der Button deaktiviert.
**Nicht gebaut:** Kein OAuth und kein Web Playback SDK (Fremde ohne Login bekommen ~30-s-Previews), keine erfundene Playlist-URL, kein Autoplay. Ungetestet gegen echtes Spotify, solange `PLAYLIST_URI` in `src/music/spotify.ts` leer ist.

## 2026-09-24 — feat(about): A3/A4/A5 mit finalem Text
**Was:** Grundsätze, „Wie ich arbeite“ und Soft-Footer tragen jetzt den Wortlaut aus dem Handoff. Der Playlist-Platzhalter in A5 ist weg, die Musik wandert in den Header.
**Nicht gebaut:** Keine Story-Absätze (Quelle fehlt, bleibt `[OFFEN]`), kein vierter Grundsatz, keine Höhenanpassung von `#about`.
