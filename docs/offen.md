# Offen — Projekt-Cards, About, Widgets

Stand: 2026-09-23, Branch `feat/monitor-zoom`. Alles hier ist auf der Seite als `[OFFEN: …]`
sichtbar (Projekt-Cards über das Feld `open`, About über `about-blocks.ts`), bis es beantwortet
ist. Wenn ein Punkt erledigt ist: Text eintragen und den `open`-Eintrag bzw. `open(...)`-Aufruf
löschen.

## Inhalt, den nur Kevin liefern kann

### Projekt-Cards (`src/projects/projects-data.ts`)

| Card | Offen |
|---|---|
| YourBrand | Multi-Tenancy: „angelegt/gedacht“ oder „voll umgesetzt“? Wortwahl bestätigen (kommt in Claim, Lernziel und Beschreibung vor). |
| TschoBBo | Screenshot der Mail-Client-UI. Aktuell liegt nur `public/projects/jobbot.jpeg` drin, und das ist das Maskottchen, nicht die UI. |
| Renderer | (1) Welche **zwei Baldur's-Gate-Modelle** sollen ins Widget? Im Renderer-Repo ist nur `duoOG` gelistet (41 MB, nie committet, also unbrauchbar für das Web). Ich kann keine andere Datei eindeutig zuordnen. Entweder Dateinamen nennen oder eine dezimierte Fassung liefern. (2) Ist `craniumCut01` das Schädel-CT aus DICOM? Angenommen wegen Name und Doku, nicht bestätigt. (3) Modell-Reihenfolge: aktuell Ducky, Auto, Pochita, Schädel-CT. |
| AniScript | GitHub-Link (fehlt komplett, Link-Slot zeigt nur den Text). Brave MV2→V3 / Violentmonkey→ScriptCat-Detail final gegenchecken. |
| Grundlagen | Info-Text für **Mastermind**. Siehe auch „Grundlagen-Widget“ unten. |

### About (`src/about/about-blocks.ts`)

- **A2 „Der Weg hierher“:** Die Story-Absätze existieren weder im Repo noch in der Git-History. Text liefern;
  der Planungs-Faden (Bodenleger → Systemadministrator → Code) wird dann eingewoben. Bis dahin steht der `[OFFEN]`-Platzhalter.
  **Achtung Höhe:** Das Overlay hat eine feste Höhe (4 Viewports, auf Mobile abzüglich des reservierten
  letzten). Story plus der lange A4-Absatz passen evtl. nicht mehr hinein. Dann muss die Höhe der `#about`-Section wachsen, und
  die hängt an der Elevator-Geometrie und am Übergang in `transition.ts`. Im Browser prüfen.
- **A3 Grundsätze:** Erledigt, drei Zitate. Ein vierter („Code ist Handwerk …“) ist nicht eingebaut.
- **A4, A5:** Erledigt. Die persönliche Zeile in A5 ist ein Vorschlag und darf getauscht werden.
- **Header-Musik:** `PLAYLIST_URI` in `src/music/spotify.ts` setzen (`spotify:playlist:<id>`). Bis dahin ist der Button
  deaktiviert (Tooltip `[OFFEN: Playlist-URL fehlt]`). Danach einmal im Browser prüfen, ob `play()` nach dem Laden
  greift oder der Browser es blockt (dann muss der Nutzer im Embed selbst auf Play).
- **Lebenslauf:** PDF nach `public/cv/lebenslauf.pdf` legen (Ordner existiert, `.gitkeep` drin). Anderer
  Name: `CV_HREF` in `about-blocks.ts` anpassen. Bis dahin liefern die beiden Buttons 404.
- **CV-Sections:** Werdegang/Ausbildung/Skills/Sprachen stehen unverändert zwischen A4 und A5, weil es keine
  Profil-Seite gibt, auf die sie sonst gehen würden. Wenn sie raus sollen: in `main.ts` den
  `cvSections`-Block entfernen.
- Der Terry-Davis-Zitat-Platzhalter ist weg (A3 ersetzt ihn). Steht noch in der Git-History.

## Grundlagen-Widget (Terminal)

- **Personalverwaltung, Bibliothek, Minesweeper, Chiffre:** laufen im Terminal. Die Quellen sind unveränderte
  Kopien aus dem Monorepo (Ausnahme: Zahlenraten, siehe unten) (`learning/first-steps-in-java`, Bibliothek und Personalverwaltung liegen dort
  vollständig vor). Beim Bibliothek-Menü beendet ein unbekannter Autor das Programm mit einer Exception
  (`bib.get` liefert null): „Neu starten“ startet neu. Das Original wurde bewusst nicht angefasst.
- **Zahlenraten:** läuft im Terminal. In der Kopie unter `java/` ist `List.getLast()` (Java 21) durch
  `get(size() - 1)` ersetzt, weil CheerpJ Java 17 hat; die „(Test: …)“-Ausgabe,
  die die gesuchte Zahl verriet, ist entfernt. Das Original im Monorepo ist unverändert.
  Achtung: `build-java.sh` fällt auf `-source 17` zurück und würde einen Java-21-Aufruf nicht bemängeln.
- **Mastermind:** Nur der Info-Text fehlt.
- Neue oder geänderte Java-Quellen: `./scripts/build-java.sh` neu laufen lassen und
  `public/java/grundlagen.jar` mit committen. Das JAR ist eingecheckt.

## Technik, die man wissen sollte

- **CheerpJ hängt an internen Funktionen.** Es gibt keine öffentliche stdin-API. `java-runner.ts` ersetzt
  `cheerpOSInitFds` und nutzt `cheerpjCreateConsole`. Deshalb ist der Loader auf **4.3** gepinnt. Vor einem
  Upgrade die Bridge neu testen (Ein- und Ausgabe an RPN und MasterMind).
- **Lizenz:** CheerpJ Community License: kostenlos für persönliche Projekte, mit Credit (steht im Widget), und
  nur vom CDN `cjrtnc.leaningtech.com`. Kein Self-Hosting ohne kommerzielle Lizenz.
- **Server muss `Range`-Header können,** sonst kann CheerpJ das JAR nicht laden. Vite (dev) kann es. Bei
  Vercel bin ich davon ausgegangen, **nicht getestet**. **Vor dem Live-Gang auf der echten Vercel-URL
  prüfen**, dass `/java/grundlagen.jar` auf einen `Range`-Request mit `206 Partial Content` antwortet
  (z. B. `curl -s -o /dev/null -w "%{http_code}\n" -H "Range: bytes=0-99" https://<url>/java/grundlagen.jar`).
  CheerpJ lädt das JAR oft per Range-Request, und lokal funktionieren heißt nicht, dass es auf Vercel geht.
- **Launcher:** `MasterMind` (`static void main`, nicht public) und `pkemn/Main.java` (`void main()` außerhalb
  einer Klasse, Java 21+) starten unter Java 17 nicht. `java/Launcher.java` ruft sie auf. Die Originale sind
  unverändert. Ohne `--release`-Unterstützung im lokalen JDK baut das Skript mit `-source 17 -target 17`.
- **Pokémon** liest seine Daten über den relativen Pfad `Pkmn/src/Persistierung/…`. Das Widget schreibt die
  drei Dateien vor dem Start nach `/files/` (dort liegt das Arbeitsverzeichnis).
- **Renderer-Widget:** portiert aus `Saos-EBB/Renderder`, zeichnet nur bei Interaktion. **Nicht gebaut:**
  Zoom und Schnittebene (Cutaway) aus dem Original. Die 4 Modelle liegen als lazy Chunks in
  `src/projects/widgets/renderer-models/` (~4 MB Quelltext, das CT ~525 kB gzip).

## Deployment und Alternative

**Vercel in zwei Zeilen:** (1) Der CheerpJ-Loader kommt zur Laufzeit vom CDN, nicht aus dem Bundle: ein
dynamisch angehängtes `<script>` in `java-runner.ts`, erst beim ersten Aufklappen der Card. (2) Das JAR
liegt in `public/java/grundlagen.jar` und wird von Vercel statisch ausgeliefert (Range-Test siehe oben).

**Warum `<script>` und nicht `import()`:** Der Loader ist ein klassisches Skript, das Globals setzt
(`cheerpjInit`, `cheerpjRunMain`). Als ES-Modul importiert würden diese Globals nicht entstehen.

**TeaVM als Alternative, ausdrücklich nicht der Default:** TeaVM übersetzt Java-Bytecode nach JavaScript
oder WebAssembly, ohne fremde Runtime vom CDN. Das Prinzip ist bekannt, **hier aber ungetestet**: ob die
vier Programme (`Scanner` auf `System.in`, ANSI-Ausgabe, Dateizugriff bei Pokémon) damit laufen und wie
Ein-/Ausgabe anzubinden wäre, ist offen. Nur ein Thema, falls CheerpJ (Lizenz, Startzeit, interne Globals)
zum Problem wird.

## Startzeit des Java-Widgets

Die CheerpJ-Runtime kommt vom fremden CDN und braucht beim Start sehr unterschiedlich lange. Gemessen
(Klick auf „Details“ bis zur ersten Programmausgabe, Chromium headless, kalter Cache):

| Messung | Zeit |
|---|---|
| Einzelläufe an einem Tag | 32 s, 43 s, 50 s, 55 s, 88 s, 107 s |
| Zwei Läufe parallel, gleiche Bedingungen | 195 s bis 376 s (CDN war zu der Zeit stark gedrosselt) |
| Zweiter Start im selben Browser-Profil (Cache gefüllt) | 106 s, also **nicht** schneller als der Erststart mit 43 s |
| Wechsel des Programms, wenn die Runtime läuft | ca. 3 s |

- **`preloadResources`** (offizielle Startzeit-Optimierung, Liste per `cjGetRuntimeResources()` profiliert)
  habe ich ausprobiert und wieder ausgebaut: In zwei parallelen Vergleichsrunden war es nicht schneller
  (376 s gegen 363 s, 264 s gegen 195 s). Der Profil-Lauf hatte nur 6 Dateien ergeben.
- **Ein Browser-Cache-Vorteil ist nicht belegt.** Ob er in echten Browsern greift, habe ich nicht messen können.
- Die Wartezeit ist also Netzwerk zum CDN und nicht mein Code. Das Widget zeigt deshalb während des Ladens einen
  Sekundenzähler, bis die erste Ausgabe kommt.
- **Idee, falls es stört:** Das Laden schon starten, wenn die Grundlagen-Card ins Bild scrollt (statt erst beim
  Aufklappen). Das widerspricht der Handoff-Regel „Runtime erst beim Aufklappen“, deshalb nicht gebaut. Und
  die Zeit auf echtem Server (Vercel) und echtem Netz messen, nicht vom Entwickler-Rechner aus.

## Aufräumen

Der Repo-Cleanup vom 2026-09-23 ist erledigt: Relief-Experiment samt seiner Docs, `buildlog.md`,
`saos-lines.webp`, tote CSS-Regeln, ungenutzte `COLORS`-Werte und der Branch `experiment/cloth-grid`
sind weg (Gründe stehen in den Commit-Messages, alles bleibt in der Git-History).

Bewusst noch da: `public/projects/releasewatcher.png` und `yourbrand.png` (seit den neuen Cards ohne
Verweis). Wenn nicht mehr gebraucht: löschen. `testMobile.html` ist inzwischen auch weg.

- Commit `8803eb9` (Zoom-Arbeit) hat meine `main.ts`-Änderung für die About-Blöcke mitgenommen. Er importiert
  `about-blocks`, das erst in `9bb00e1` liegt, und baut allein nicht. Mit `9bb00e1` darauf ist alles
  konsistent. Nur relevant für Bisect.
- **Kontrast:** Mit dem dunkelroten Schema ist `--color-accent` (`#5f0027`) auf dem Hintergrund (`#08070a`)
  bei etwa 1,4:1 kaum lesbar (WCAG verlangt 4,5:1 für Text). Betrifft alles, was den Akzent als Textfarbe
  nutzt: die `[OFFEN]`-Zeilen, die Rolle in der Profilkarte, Card-Überschriften der Details, Terminal-Prompt.

## Nicht getestet

- Nur Chromium (Playwright) geprüft, kein Firefox/Safari, kein echtes Touch-Gerät, keine Bildschirmleser.
- Das `prefers-reduced-motion`-Layout der neuen Cards und der About-Blöcke: Regeln stehen in
  `project-cards.css`, aber ich habe es nicht im Browser angesehen.
- Nicht auf `main` gemergt und nicht deployed. Alles liegt auf `feat/monitor-zoom`, kein Push.
