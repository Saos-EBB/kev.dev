# Handoff: Lizenz- und Rechte-Check über alle Repos von Saos-EBB

## Ziel

Für jedes Repo feststellen:

1. Unter welcher Lizenz steht es heute? Meist keine.
2. Was steckt an **fremdem** Code und an fremden Assets drin, und welche Pflichten folgen daraus?
3. Was ist **riskant**, also darf so nicht öffentlich sein?

Am Ende steht **ein Bericht** pro Repo plus eine Liste offener Entscheidungen für Kevin. **Nichts ändern, nichts committen.** Nur lesen und berichten, der Plan entsteht danach gemeinsam.

## Repos (Stand 2026-10-06)

| Repo | Sichtbarkeit | Was es ist |
|---|---|---|
| Saos-EBB/kev.dev | public | Portfolio-Seite (Vite + TS), enthält auch eine Kopie von faceDots unter `packages/face-dots/` und die YourBrand-B2B-Seite unter `yourbrand/` |
| Saos-EBB/faceDots | public | Modul: Foto → freigestelltes Gesicht → Punkte/ASCII (nutzt MediaPipe) |
| Saos-EBB/YourBrand | public | White-Label-SaaS (NestJS, Postgres/PostGIS, Stripe …), Abschlussprojekt |
| Saos-EBB/AniScript | public | Userscript, **adaptiert von fremdem Code**, Herkunft prüfen |
| Saos-EBB/ReleaseWatcher | public | CLI-Tool, prüft Manga-Seiten auf neue Kapitel |
| Saos-EBB/JoBBoT | public | Bewerbungs-Bot (Scraping, Ollama) |
| Saos-EBB/jobbotMaiia | **private** | Variante/Fork des Bewerbungs-Bots? klären |
| Saos-EBB/Renderder | public | 3D-Wireframe-Renderer (Canvas), lädt OBJ/STL/DICOM-Modelle |
| Saos-EBB/RPN-Calculator | public | Bootcamp/Java |
| Saos-EBB/-GAMES- | public | Spiele, Assets prüfen |
| Saos-EBB/Custom-Datastructures | public | Java, eigene Datenstrukturen |
| Saos-EBB/PersonalManagement | public | Java-Bootcamp-Projekt |
| Saos-EBB/pkemn | public | vermutlich Pokémon-bezogen, **Marken/Assets prüfen** |
| Saos-EBB/monorepo | **private** | unklar, Inhalt beschreiben |
| Saos-EBB/b2b-cv | **private** | Quelle der YourBrand-B2B-Seite und des Lebenslaufs |

## Pro Repo prüfen

**1. Eigene Lizenz**
- Gibt es `LICENSE`/`LICENSE.md`/`COPYING`? Welche Lizenz?
- `license`-Feld in `package.json` / `pom.xml` / `pyproject.toml`?
- README-Hinweise zur Lizenz?

**2. Abhängigkeiten**
- Node: `npx license-checker --summary` (oder `--production`). Alles auflisten, was **nicht** MIT/ISC/BSD/Apache-2.0 ist (GPL, AGPL, LGPL, CC-BY-NC, „UNLICENSED“, unbekannt).
- Java/Maven/Gradle, Python: Abhängigkeiten und ihre Lizenzen grob auflisten.

**3. Mitgelieferter fremder Code und fremde Assets** (der wichtigste Teil)
- Kopierter oder adaptierter Code: Kommentare wie „based on“, „forked from“, „credits“, fremde Copyright-Header, auffällig andere Stile. **AniScript besonders:** Ursprungs-Script finden (Greasy Fork / OpenUserJS / GitHub), dessen Lizenz notieren und prüfen, ob Kevins Version die Bedingungen erfüllt (Namensnennung, gleiche Lizenz bei GPL).
- Mitgelieferte Bibliotheken (vendor-Ordner, minifizierte Dateien).
- **Modelle und Daten:** z. B. `public/face-dots/selfie_multiclass_256x256.tflite` (MediaPipe, Apache-2.0) in kev.dev; 3D-Modelle im Renderer (Herkunft von OBJ/STL/DICOM, z. B. Pochita, Ente, Auto, Schädel-CT, Baldur's-Gate-Modelle); Datensätze.
- **Bilder, Fonts, Sounds, Videos:** Herkunft und Lizenz. Fonts in kev.dev: Koeeya (Trial-Version!), JetBrains Mono. In Spielen: Sprites, Sounds.
- **Marken/Fremd-IP:** Pokémon, Anime/Manga-Bilder, Promi-Fotos (bekannt: YourBrand-Testprofile im Discover nutzen Bilder echter Personen und Manga-Panels).

**4. Persönliche Daten und Geheimnisse**
- Telefonnummer, Wohnadresse, Geburtsdatum (bekannt: Lebenslauf-PDF in kev.dev unter `public/cv/`).
- `.env`, API-Keys, Tokens, Passwörter, auch in der Git-History (`git log -p | grep -iE "key|secret|token|password"` grob).
- Echte Daten Dritter (Bewerbungen, Jobanzeigen-Dumps, Chatverläufe, Fotos anderer Leute).

**5. Rechtliches rund ums Scraping** (JoBBoT, ReleaseWatcher, AniScript)
- Welche Seiten werden gescrapt bzw. manipuliert? Nur notieren, keine Rechtsberatung. Kevin entscheidet, ob das Repo public bleibt.

## Ausgabe

Eine Markdown-Datei mit:

1. **Übersicht:** Tabelle `Repo | Lizenz heute | Fremdes drin? | Risiko (keins/niedrig/mittel/hoch) | Wichtigster Punkt`
2. **Pro Repo** ein Abschnitt:
   - Lizenz heute
   - Problematische Abhängigkeiten (Name, Lizenz, warum relevant)
   - Fremder Code/Assets mit Fundstelle (Pfad) und bekannter oder vermuteter Herkunft und Lizenz
   - Persönliche Daten/Secrets mit Fundstelle
   - Pflichten, die schon jetzt gelten (z. B. „Apache-Hinweis für MediaPipe-Modell fehlt“)
   - Vorschlag: welche Lizenz passt, oder keine, plus Begründung in 1–2 Sätzen
3. **Offene Entscheidungen für Kevin** als nummerierte Fragen, z. B. „AniScript: Original ist GPL-3.0 → dein Repo muss GPL-3.0 werden oder privat. Was willst du?“

Unsicheres als **„unklar“** markieren und sagen, was zur Klärung fehlt. Nicht raten.

## Kontext, der schon feststeht

- Kevins grobe Richtung aus dem Gespräch: **faceDots → MIT** (soll nutzbar sein), **kev.dev → keine Lizenz / All rights reserved** (Portfolio, Design nicht kopierbar), **YourBrand → offen** (keine Lizenz oder AGPL, falls er es selbst verwerten will; MIT nur, wenn reiner Showcase). Noch nichts entschieden.
- kev.dev: MediaPipe-Modell und wasm sind selbst gehostet (Apache-2.0), ein Lizenzhinweis dafür fehlt noch.
- kev.dev: Der YourBrand-Showcase (`public/projects/yourbrand/`) wurde bewusst **ohne** den Discover-Screen eingebaut (Promi-/Fremdbilder).
- Lizenzen sollen **später** gesetzt werden, dieser Check ist die Grundlage dafür.
