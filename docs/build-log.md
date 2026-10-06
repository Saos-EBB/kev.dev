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

## 2026-10-01 — feat(projects): Live-Demos als Workspace
**Was:** Aufgeklappte Live-Demos (Renderer, Grundlagen) sind auf dem Desktop (≥1000px) kein langer Scroll-Panel mehr, sondern ein bildschirmfüllender Workspace auf dem Seiten-Grid, in der Farbe des Projekts. Kopf: Projekttitel + Widget-Label. **Grundlagen:** oben die neun Programme als Notizzettel (+ Pfeile), links Cards „Why?“, „Konzepte“, „Was es macht“, in der Mitte das Terminal über die volle Höhe, rechts der Code-Auszug; alles in der Notizfarbe des gewählten Programms. **Renderer:** Canvas groß in der Mitte mit HUD (Modell-Tabs, Ecken/Kanten live gezählt), links „Why?“ und „So funktioniert's“ (Perspektive, Rotation, 16 Tiefenstufen als Farbleiste), rechts Modell-Card mit echten Zahlen, Steuerung, Entscheidungen aus der Card. Widgets bekommen dafür die Card als zweiten Parameter von `mount`. Unter 1000px dieselben Teile gestapelt, Terminal/Canvas zuerst.
**Nicht gebaut:** YourBrand-Live-Demo bleibt der kleine Text-Overlay (dort gibt es kein Widget). CheerpJ lädt in der Testumgebung nicht (CDN gesperrt), das Terminal also nur leer geprüft.

## 2026-10-01 — feat(yourbrand): White-Label-Verkaufsseite aus b2b-cv
**Was:** Die YourBrand-Verkaufsseite (`b2b-cv`: `app/whitelabel/page.tsx` samt `lib/`-Dateien: 7 interaktive Demos, Tiers, Tech-Details, Raygun-Kontakt, DE/EN/RU/JA/AR, Light/Dark) liegt jetzt komplett unter `yourbrand/` als eigene Vite-Seite (`/yourbrand/`, React + Tailwind v4, `noindex`). Der „B2B-Seite“-Button der YourBrand-Card öffnet sie im Workspace-Overlay als iframe; „Portfolio“ in der Seite schließt das Overlay. Dafür neue Dependencies: react, react-dom, lucide-react, zustand, leo-profanity, tailwindcss + @tailwindcss/vite. Haupt-Bundle unverändert (kein React/Tailwind darin), Tailwind scannt nur `yourbrand/src`. Assets aus b2b-cv: `public/fonts/ui/*`, `public/images/{laser_gun.png,social-*}`.
**Geändert gegenüber b2b-cv (nur Next.js-Spezifika):** `next/link` → `<a>`, `NEXT_PUBLIC_*` → deren eingebaute Defaults, Dev-Farbpaletten-Editor und die 37 Logo-Karussell-Schriften weggelassen, Impressum/Datenschutz → die von kev.dev. Quelltext sonst 1:1 — Änderungen in b2b-cv müssen von Hand nachgezogen werden.
**Nicht gebaut:** Live-Demo bleibt „auf Anfrage“.

## 2026-10-01 — feat(tschobbo): echte Screenshots der JoBBoT-UI
**Was:** Vier Screenshots der echten JoBBoT-UI (`Saos-EBB/JoBBoT`, `npm run ui`) unter `public/projects/jobbot/`: Posteingang mit geöffnetem Inserat, Aussortiert, Einstellungsseite „Suche“, Scrape. Die TschoBBo-Visualisierung zeigt jetzt den echten Posteingang im Fensterrahmen (statt des Mockups), Tschobbo als Sticker; Klick darauf oder der neue „Screens“-Button öffnet alle vier als Galerie im Overlay. Offener Punkt „Screenshot der Mail-Client-UI fehlt“ entfernt. Nebenbei: mobil hatte der Claim im Card-Kopf 22rem Höhe (Flex-Basis aus dem Mid-Layout) — behoben.
**Wie die Daten entstanden:** Die Jobbörsen sind aus der Build-Umgebung nicht erreichbar, Ollama läuft dort nicht. Deshalb wurden die echten, öffentlichen Inserate aus JoBBoTs eigenen Test-Fixtures (AMS, karriere.at, devjobs.at, jobs.at) offline durch die echten Parser gespeichert und mit `npm run filter:regex` gefiltert (55 Stellen: 4 Match, 34 Offstack/unsicher, 17 raus). Keine Anschreiben (kein Ollama), nichts als gesendet markiert. Die Screenshots zeigen echte Firmennamen aus öffentlichen Inseraten.

## 2026-10-01 — fix(grundlagen): Terminal ohne Seitwärts-Scrollen
**Was:** Das Java-Terminal scrollt auf keiner Bildschirmgröße mehr seitlich. `terminal.ts` merkt sich die Breite jeder ausgegebenen Zeile und verkleinert die Schrift, bis die breiteste passt (Spielfelder bleiben unumgebrochen), bis minimal 7px. Zeilen über 100 Spalten gelten als Fließtext und brechen einfach um, statt alles kleiner zu machen. Neu angepasst bei jeder Größenänderung. Auf schmalen Screens brechen außerdem die neun Notizzettel in Zeilen um (statt seitlicher Leiste, Pfeile darunter) und der Code-Auszug bricht um.
**Nicht getestet:** mit echter CheerpJ-Ausgabe (CDN in der Testumgebung gesperrt) — geprüft mit simulierter Ausgabe durch die echte `Terminal`-Klasse (60-Spalten-Brett + lange Zeile, 390px: 0px Überhang).

## 2026-10-01 — fix(mobile): schlanke Header/Footer mit Scrollrichtung, kein Grid unter Kontakt
**Was:** Auf Mobile/Tablet (`html.lite`) sind Header und Footer je eine Zeile (44px / 31px), halbtransparent mit Blur, und gleiten mit der Scrollrichtung: runter → beide raus, hoch → beide rein; ganz oben bleibt der Header, ganz unten der Footer (`initDirectionalNav` in `edge-nav.ts`, 12px Hysterese gegen Flackern). Footer zeigt auf schmalen Screens nur „© 2026 SAOS“ plus Links. Desktop unverändert.
**Grid unter Kontakt:** Das Seiten-Grid hing am ganzen Canvas (`body`-Hintergrund → Viewport), sichtbar beim Überscrollen am Seitenende und im Streifen unter der gepinnten Kontakt-Section, sobald die Adressleiste einfährt (Section war `100svh`). Jetzt: Grid nur auf `body` in Inhaltshöhe, `html` einfarbig, Kontakt in Lite `100vh`, Pin-Spacer einfarbig.

## 2026-10-01 — feat(projects): kev.dev als eigenes Projekt
**Was:** Neue 5. Card „kev.dev · Dieses Portfolio“ (vor Grundlagen), Layout `storyboard`: die Seite als Bilderstrecke von oben nach unten — Hero, About, Projekte, Kontakt, Impressum —, jeder Abschnitt mit kleiner CSS-Zeichnung und dem Grund, warum er so ist; jeder Rahmen ist ein Link zu dem Abschnitt. Head-Button „Du bist schon drin“ (Facet `self`) springt zum Hero und zieht einmal am Tuch (`Cloth.pull()`). Why/Learned/Code aus Kevins Beschreibung im Chat, Learned = Mobile-Performance (Lite-Variante). Außerdem: Koeeya Trial hat keine echten Satzzeichen („.“/„,“ werden zur „pdt.“-Trial-Marke) — in Card- und Overlay-Titeln stehen Satzzeichen jetzt in der Lesefont (`displayText`).
**Offen:** Texte in Kevins Worten nachschärfen; Zeitraum/Umfang fehlt (als `[OFFEN]` auf der Card).

## 2026-10-01 — feat(i18n): Seite auf Deutsch, Englisch, Russisch, Japanisch, Arabisch
**Was:** Sprachmenü im Header (🌐 + Kürzel, Liste in eigener Schrift). Die Wahl wird in `localStorage` (`kev-lang`) gespeichert und lädt die Seite neu — die Scroll-Szenen messen Text beim Start, darum kein Live-Umschalten. `<html lang/dir>` wird vor dem Rendern gesetzt; Arabisch ist komplett rechts-nach-links (gespiegelte Layouts, logische CSS-Abstände). Übersetzt: alle UI-Texte (`i18n/ui.ts`), About + Lebenslauf (`about/about-content.ts`), alle Projekt-Cards (`projects/projects-i18n.ts`), Grundlagen-Programme (`widgets/grundlagen-i18n.ts`), Renderer-/Grundlagen-Workspace, Intro, Kontakt-Headline. Die YourBrand-B2B-Seite übernimmt die Sprache (ihr zustand-Store `xxx-language` wird mitgeschrieben).
**Technik:** Schrift-Fallbacks für JA/AR (Koeeya/JetBrains Mono haben die Schriften nicht), Display-Überschriften dort fett; Arabisch ohne Laufweite. Kontakt-Headline fällt auf Arabisch wortweise statt buchstabenweise (Buchstaben müssen verbunden bleiben). Code, Terminal, Mail bleiben LTR. Hero-Textur zeichnet mit fester LTR-Richtung. Swipe-Galerie nutzt `scrollIntoView` (RTL-sicher).
**Bewusst deutsch:** Impressum/Datenschutz (verbindlich, Hinweis in der jeweiligen Sprache darüber), `[OFFEN]`-Marker, Java-Konsolenausgabe.
**Offen:** Übersetzungen von Muttersprachlern gegenlesen lassen (v. a. JA/AR).

## 2026-10-01 — fix(i18n): Browsersprache erkennen, Sprachmenü stabil
**Was:** Beim ersten Besuch (keine gespeicherte Wahl) entscheidet die Browsersprache (`navigator.languages`, erster passender Primärtag, z. B. de-AT → de); Sprachen außerhalb der fünf bekommen Englisch. Die erkannte Sprache wird nicht gespeichert — erst eine Wahl im Menü. Die YourBrand-Seite folgt immer der Portfolio-Sprache.
**Bug:** Auf dem Desktop blendete der Header (nur in den obersten 90px sichtbar) aus, sobald die Maus ins herunterhängende Menü fuhr — der Klick landete dann auf der Projekt-Card darunter und öffnete sie. Jetzt: Header bleibt sichtbar, solange das Menü offen ist (`html.lang-menu-open`) oder Maus/Fokus im Header sind; auf dem Handy gleitet er mit offenem Menü nicht weg. Ein Klick außerhalb schließt nur das Menü (Capture-Phase, wird nicht weitergereicht). Mobil-Header kompakter (Sprachknopf in Buttongröße, Tänzer-Icon unter 480px ausgeblendet), passt ab 360px in allen Sprachen.

## 2026-10-01 — fix(about): Satz über die Seite stimmt wieder
**Was:** In der Story stand, das Logo dieser Seite laufe durch 37 Schriften, fünf davon in Kevins Handschrift — das stammt aus b2b-cv und gilt für kev.dev nicht. Ersetzt (in allen fünf Sprachen) durch: die Überschriften stehen in Graffiti-Lettern und fast alles lässt sich anfassen. Sonst bezieht sich kein Satz im About-Text auf die Seite selbst.

## 2026-10-01 — feat(about): Lebenslauf im Seiten-Design, dunkel und hell
**Was:** Der Lebenslauf (Inhalt unverändert aus b2b-cv) ist jetzt eine HTML-Vorlage im Look der Seite — Koeeya-Name mit Verlauf, JetBrains Mono, Boxen mit Eckmarkern, Lila-Akzente — und wird per `scripts/build-cv.mjs` (Playwright/Chromium) als A4-PDF gedruckt, einmal dunkel, einmal hell. Die „Lebenslauf ↓“-Buttons liefern beim Klick die zum aktuellen Theme passende Fassung (Download-Name `lebenslauf-kevin-schaberl.pdf`). Das Skript bricht ab, wenn der Inhalt nicht mehr auf eine Seite passt.
**Achtung:** Enthält Wohnadresse, Telefonnummer und Geburtsdatum — öffentlich downloadbar. Alte URL `saos-repo.vercel.app` steht noch drin.

## 2026-10-03 — fix(desktop): flüssiger Scroll, Grid an beiden Projekt-Übergängen deckungsgleich
**Was:**
- **Grid rein in Projekte:** Das Monitor-Grid lag nach dem Zoom um ~18px (x) und ~4–6px (y) neben dem Projekte-Grid. Drei Ursachen: Zielphase in x war `vw/2 + cell/2` statt `vw/2` (`calc(50% + cell/2)` bei einer zellbreiten Kachel ergibt genau die halbe Breite); die winzige Zelle (`--grid-cell / maxScale`) und die Offsets werden vom Browser auf 1/64 px gerundet und das ×30 aufgeblasen; der Screen-Kasten lag auf Bruchteil-Pixeln und wird beim Malen gesnappt. Jetzt: Zelle und Offsets auf 1/64 px gesnappt, `maxScale` daraus abgeleitet, Rest über das End-Translate ausgeglichen, Screen-Ecke auf ganzen Pixeln (`transition.ts`). Gemessen deckungsgleich bei 1100×800, 1280×800, 1366×768, 1440×900, 1920×1080.
- **Grid raus aus Projekte:** Die Kontakt-Linien starteten ein eigenes Grid an der Section-Kante (bei 1440×900 12px versetzt in y, ab dem Bento-Breakpoint je nach Breite auch in x). Jetzt setzen sie das `.projects-bg-grid` fort (Phase aus Section-Höhe und Bildschirmmitte), neu berechnet bei jedem Refresh (`contact.ts`).
- **Performance (Raster-Zeit, Chromium-Trace):** Monitor-Zoom 16,3 s → 2,5 s, Projekte 4,9 s → 0,2 s, Übergang in Projekte 0,6 s → 0,03 s.
  - Aufzugwände + Vignetten mit `will-change: transform`: wurden bei jedem Zoom-Frame in neuer Skalierung neu gerastert (jede Wand so hoch wie die ganze About-Section).
  - Sobald der Screen den Viewport füllt, wird der Aufzug dahinter ausgeblendet (`.about-zoom.is-covered`).
  - „PROJEKTE“-Shine: war eine animierte `background-position` auf dem Text selbst, die die ganze Überschrift samt Glow-Filter jeden Frame neu malte. Jetzt ein maskiertes Fenster mit weißer Textkopie, das per `transform` drüberfährt (Text gleitet gegenläufig, steht also still) — reine Compositor-Animation, sieht gleich aus. Gilt auch für die mobile Überschrift.
**Nicht gebaut / offen:** Gemessen nur in Headless-Chromium (Software-Rendering, keine echte GPU) — die Frame-Zeiten dort sind nicht aussagekräftig, die Raster-Einsparungen schon. Nicht in Safari/Firefox geprüft. Hero-Cloth und Aufzugfahrt selbst unverändert.

## 2026-10-03 — fix(cv): Webadresse aktualisiert
**Was:** Im Lebenslauf (beide Fassungen) steht statt `saos-repo.vercel.app` jetzt `kev-dev-gamma.vercel.app`; PDFs neu gebaut.

## 2026-10-03 — feat(intro): Farbe wird in SAOS eingegossen, Loader mind. 2 s, sanfterer Tuch-Zug am Handy
**Was:**
- **Loader:** Statt der Farbebene, die von unten nach oben aufgedeckt wurde, steigt jetzt eine Flüssigkeit im Verlauf der Seite (Pink → Lila → Blau) in den grauen SAOS-Buchstaben hoch — wellige Oberfläche mit heller Kante, die ruhiger wird, je voller es ist, leichter Glow. Alles auf einem Canvas pro Frame; die Splitter beim Zerspringen nehmen genau dieses Bild. Ein Gieß-Strahl war im Mockup, ist bewusst raus.
- **Mindestdauer:** Der Füllstand folgt dem echten Ladefortschritt, steigt aber nie schneller als „voll in 2 s“. Gemessen (Headless): Splittern startet ~2,4 s nach Erscheinen des Loaders, Desktop wie Handy, obwohl die Seite nach ~0,2–0,3 s geladen ist.
- **Tuch, erster Zug auf Touch/schmal (`IS_LITE`):** 1150 ms statt 650 ms, Stärke 0,22 statt 0,4, ease-in-out statt abruptem Ankommen, Halten 280 ms. Desktop unverändert.
**Bug unterwegs:** Der erste rAF-Zeitstempel kann älter sein als der Mount des Loaders (negatives dt → Füllstand schoss sofort auf voll). Zeit kommt jetzt aus `performance.now()`, dt ≥ 0.

## 2026-10-03 — fix(contact): Auto-Scroll ins Kontakt-Finale sanfter
**Was:** Der automatische Rest-Scroll (startet kurz nach dem Eintauchen in den Kontakt-Pin) lief 1,2 s mit ease-out cubic — schoss mit voller Geschwindigkeit los und wirkte gehetzt. Jetzt 2,4 s mit ease-in-out sine: läuft weich an, gleitet, setzt weich auf (`TIMING.contact.autoScroll` in `timings.ts`). Gemessen (Headless, 1280×800): gleichmäßige S-Kurve über ~2,3 s, landet am selben Punkt wie vorher.

## 2026-10-03 — fix(legal): Impressum/Datenschutz scrollbar und ohne Abschneiden
**Was:**
- **Nicht scrollbar:** Während ein Panel offen ist, ist Lenis gestoppt — und ein gestopptes Lenis schluckt Mausrad-Events auf der ganzen Seite. Das Panel hat jetzt `data-lenis-prevent` (wie das Projekt-Overlay), dazu `overscroll-behavior: contain`. Gemessen: Mausrad vorher 0 px, jetzt 600 px gescrollt, Desktop wie 390px-Breite; Touch-Wischen scrollt ebenfalls.
- **Abgeschnitten:** „DATENSCHUTZERKLÄRUNG“ ist ein einziges langes Wort und lief bei 390px Breite ~22px über den Rand (seitliches Scrollen). Titelgröße jetzt `clamp(1.4rem, 7vw, 3rem)` mit Silbentrennung als Reserve; Panel `overflow-x: hidden`.

## 2026-10-03 — feat(legal): Impressum und Datenschutz in allen fünf Sprachen
**Was:** Beide Texte gibt es jetzt auf Deutsch, Englisch, Russisch, Japanisch und Arabisch (`src/legal/legal-content.ts`, gewählt wie der Rest der Seite). Statt „nur auf Deutsch verfügbar“ steht oben: übersetzt aus dem Deutschen, bei Abweichungen gilt die deutsche Fassung. Gesetzesnamen (MedienG, ECG, DSGVO), die Datenschutzbehörde und ihre Adresse bleiben im Original, mit Erklärung in Klammern. Tab-Titel ebenfalls übersetzt; Arabisch rechts-nach-links.
**Technik:** Japanische Absätze: Zeilenumbrüche im Quelltext zwischen zwei CJK-Zeichen würden als Leerzeichen gerendert — `joinCjk()` fügt sie zusammen. Titel `clamp(1.4rem, 6vw, 3rem)`, damit auch „КОНФИДЕНЦИАЛЬНОСТИ“ auf 390px passt.
**Offen:** Übersetzungen von Muttersprachlern gegenlesen lassen.

## 2026-10-03 — fix(legal): Datenschutz nennt YouTube und CheerpJ
**Was:** Der Satz „keine Einbindung von Ressourcen Dritter“ stimmte nicht mehr: Der Musik-Button lädt beim ersten Klick den YouTube-Player (Google Ireland, youtube-nocookie.com), die Grundlagen-Live-Demo beim Öffnen die Java-Laufzeit CheerpJ (Leaning Technologies, UK). Jetzt in allen fünf Sprachen: „Was diese Seite nicht tut“ sagt, dass zwei Funktionen erst nach Klick Inhalte Dritter laden, plus je ein Abschnitt mit Anbieter, übertragenen Daten (IP, Browserdaten, ggf. lokaler Speicher/IndexedDB), Drittland (USA mit DPF / UK mit Angemessenheitsbeschluss) und Rechtsgrundlage (Einwilligung per Klick, Art. 6 Abs. 1 lit. a DSGVO, § 165 Abs. 3 TKG 2021).
**Offen:** Kein Hinweis direkt am Play-Button/an der Demo — für eine saubere Einwilligung wäre ein kurzer Satz dort („lädt von YouTube“) besser. Kein Anwalt hat drübergeschaut.

## 2026-10-03 — feat(music): Hinweis vor dem YouTube-Player (Einwilligung)
**Was:** Der erste Klick auf Play lädt nicht mehr sofort YouTube, sondern öffnet einen kleinen Hinweis unter dem Button: Musik kommt von YouTube, „Abspielen“ lädt den Google-Player und überträgt Daten (u. a. IP), Link zur Datenschutzerklärung, Buttons „Abspielen“ / „Abbrechen“. Erst „Abspielen“ lädt die IFrame-API. Die Wahl merkt sich der Browser (`localStorage` `kev-yt-consent`), spätere Besuche spielen direkt. In allen fünf Sprachen; Box ist fixed und an den Bildschirm geklemmt, Header bleibt sichtbar solange sie offen ist (`.yt-consent-open`), Klick daneben/Esc schließt nur die Box.
**Datenschutzerklärung:** YouTube-Abschnitt in allen Sprachen angepasst — Einwilligung über „Abspielen“ im Hinweis, Speicherung der Wahl im Browser, Widerruf durch Löschen der Website-Daten.
**Gemessen (Headless, 1280px / 360px / Arabisch):** vor „Abspielen“ und nach „Abbrechen“ 0 Anfragen an youtube.com; nach „Abspielen“ genau `iframe_api`; nach Neuladen startet Play ohne Hinweis.

## 2026-10-03 — feat(consent): Hinweis vor CheerpJ, Einwilligungen widerrufbar
**Was:**
- **Grundlagen-Demo:** Statt beim Öffnen sofort CheerpJ zu laden, steht im Terminal zuerst ein Hinweis (Java-Laufzeit von Leaning Technologies, UK; „Starten“ lädt sie, Daten wie IP gehen dorthin; Link zum Datenschutz) mit „Starten“. Erst danach wird geladen und das Programm läuft; auch das Vorladen (`warmUp`) wartet darauf. Der Datenschutz-Link schließt die Demo und öffnet die Erklärung.
- **Gemeinsames Modul** `src/consent.ts` für beide Einwilligungen (`youtube`, `cheerpj`; `localStorage`).
- **Datenschutzerklärung:** neuer Abschnitt „Einwilligungen widerrufen“ mit Status pro Funktion (erteilt / nicht erteilt) und „Widerrufen“-Button. Ist der Player bzw. CheerpJ in der Seite schon geladen, lädt die Seite neu (Hash hält die Erklärung offen), sonst nur Status-Update. YouTube- und CheerpJ-Abschnitte verweisen darauf. Alles in fünf Sprachen.
**Gemessen (Headless, 1280px / 390px):** Demo öffnen → 0 Anfragen an leaningtech.com, Hinweis sichtbar; „Starten“ → Anfrage an cjrtnc.leaningtech.com, Einwilligung gespeichert; Widerrufen → Status „nicht erteilt“, Schlüssel gelöscht. Erklärung in allen Sprachen ohne seitliches Überlaufen.
**Offen:** Von CheerpJ zwischengespeicherte Dateien (IndexedDB) bleiben beim Widerruf liegen — dafür Browserdaten löschen. Neuladen-Pfad beim Widerruf (Player schon geladen) nur logisch geprüft, YouTube ist in der Testumgebung gesperrt.

## 2026-10-05 — copy(about): About-Text sachlicher
**Was:** Story, Prinzipien, „Wie ich arbeite“ und Schluss im About-Overlay nüchterner formuliert, in allen fünf Sprachen. Fakten, Reihenfolge, Highlights und Projekte-Link bleiben gleich; raus sind die emotionalen Zuspitzungen („Mein Kopf hat gebrannt“, „Ich wollte es wissen.“, „Und das Zutrauen …“, „bis es sich richtig anfühlt“). Lebenslauf unverändert.

## 2026-10-05 — copy(about): About-Text neu aufgebaut, YourBrand als SaaS für jede Community
**Was:** About komplett neu nach Kevins Vorgaben: weniger Lebenslauf, mehr Motivation, Arbeitsweise und Kreativität. Roter Faden: „Geht nicht“ wird nicht akzeptiert, Skills wachsen ständig — Spiele (WoW-Addons/WeakAuras, LoL-Mechaniken) erst komplett verstehen, Programmieren fühlt sich genauso an. Neu: C++-Einstieg mit Uni-Graz-Skript (Speicher, Pointer), Ziel Programmierer. YourBrand-Entstehung (Passwort-Cracker → Tamagotchi-App → verworfenes Unity-Spiel → YourBrand nach einem „Das schaffst du nicht“), die anderen Projekte sortiert nach Eigenbedarf (TschoBBo, Release Watcher, Userscripts) und Lernen (Renderer, kev.dev, Java-Grundlagen). „Wie ich arbeite“: die Fragen hinter YourBrand, Arbeitsalltag als „strukturiertes Chaos“ (Projektwechsel nach Ideen, parallele Agents an Bugfix-/Clean-up-Tagen, Tage mit Code-Review einer einzelnen Datei) (User/Admin/Owner, Rechte, Sichtbarkeit, Nutzerschutz, Tickets, Spaß, Monetarisierung). Privates nur im Schluss: Natur, Familie, Sohn. Überschrift „Der Weg hierher“ → „Warum Software“. Alle fünf Sprachen.
**YourBrand-Card:** „Was“ betont jetzt den SaaS-Gedanken — neutraler Kern für jedes Matching-/Community-Szenario (Schachklub, Theatergruppe, Partnerbörse …), jeder Tenant mit eigener Marke.

## 2026-10-05 — feat(projects, mobile): Liste statt Swipe-Galerie, Projekt im Vollbild-Sheet
**Was:** Am Handy (Lite) war jede Projekt-Card ~1700px hoch in einer horizontalen Swipe-Galerie, dazu drei „Aufklappen“-Buttons pro Card — zu viel Gefinger. Jetzt: eine vertikale Liste kurzer Einträge (Index, Titel, drei Stichpunkte, bis zu vier Tags, „Projekt ansehen“). Ein Tipp irgendwo auf den Eintrag öffnet das Projekt im Vollbild-Sheet (`projects/project-sheet.ts`): Kopf mit Claim, Stichpunkten und Facet-Buttons, die Signatur-Visualisierung, dann Why? / Learned! / Code + Architektur als Aufklapp-Sektionen mit dem vollen Text. Schließen über „← Projekte“, ESC oder die Zurück-Geste des Handys (eigener History-Eintrag). Live-Demo/Screens/B2B öffnen wie bisher das Facet-Overlay über dem Sheet. Desktop unverändert.
**Neu in den Daten:** `points` (drei Stichpunkte) pro Projekt, in allen fünf Sprachen.
**Entfernt:** `swiper.ts`, Swipe-CSS, Punkte/Pfeile-Navigation und deren UI-Texte.

## 2026-10-05 — feat(projects, mobile): Projekte-Schriftzug bleibt stehen, Liste läuft wie auf einem Rad
**Was:** Am Handy bleibt der „Projekte“-Schriftzug oben stehen (sticky, mit Verlauf nach unten, damit die Einträge darunter verschwinden statt durch die Buchstaben zu laufen), während die Liste vorbeiläuft. Sobald die Unterkante des letzten Projekts über ~55 % der Bildschirmhöhe steigt, schiebt sich der Schriftzug mit nach oben weg (`TITLE_EXIT` in `projects/project-wheel.ts`). Die Einträge liegen wie auf einem Rad: in der Bildschirmmitte flach, darüber kippen sie nach hinten oben weg, von unten rollen sie von hinten nach vorn (rotateX + translateZ + Opacity, nur beim Scrollen per rAF). Reduced Motion: flache Liste.
**Dazu:** In der Projektansicht ist immer nur eine Aufklapp-Sektion offen — öffnet man Learned!, geht Why? zu (`name`-Attribut auf `<details>`, JS-Fallback für ältere Browser).

## 2026-10-06 — feat(projects): FaceDots als 7. Projekt, Punkte-Modul ausgelagert
**Was:** Neue letzte Projekt-Card „FaceDots“ (Layout `portrait`, als Tool gekennzeichnet): Kevins Gesicht als Partikel, direkt vor Kontakt — am Desktop rechts in der Card, am Handy oben im letzten Listeneintrag (fliegt beim Reinscrollen ein). Live-Demo = das Tool (`projects/widgets/face-tool.ts`): fünf vorbereitete Cap-Fotos oder ein eigenes Foto → Kopf wird im Browser freigestellt → als Punkte, ASCII oder auf dem Hero-Tuch. Texte in allen fünf Sprachen.
**Modul:** `packages/face-dots/` (eigene README/package.json, keine Abhängigkeit zur Seite): `photoToFace` (MediaPipe-Segmentierung, Zuschnitt, Duotone) und `createFaceDots` (Punkte/ASCII mit Federn). Die Seite bindet es über `projects/face-dots-site.ts` ein.
**Lokal:** Bibliothek, wasm und Modell (`public/face-dots/`) kommen von der eigenen Domain — beim Verarbeiten eines Fotos geht kein Request nach außen (geprüft).
**Entfernt:** Testseiten `/testCloth`, `/testDots` (im Tool aufgegangen).
**Offen:** GitHub-Link, sobald `face-dots` ein eigenes Repo ist.
