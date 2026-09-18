# Buildlog — kev.dev

Portfolio-Site, Vanilla TypeScript + Vite. Kein Framework, kein React/Vue.
Lenis fürs Smooth-Scrolling, GSAP + ScrollTrigger nur für die Szenen, die es
brauchen (Projects, Contact). Canvas 2D für die Cloth-Simulation im Hero.

Stand: 2026-09-18

## Stack

- `vite` + `typescript`, `npm run dev` / `npm run build` (`tsc && vite build`)
- `lenis` — smooth scroll, an GSAPs Ticker gehängt (`gsap.ticker.add`,
  `lenis.on("scroll", ScrollTrigger.update)`, `lagSmoothing(0)`), damit
  Lenis und ScrollTrigger sich einen Scroll teilen statt zwei rAF-Loops
  gegeneinander laufen zu lassen.
- `gsap` + `ScrollTrigger` — nur im Projects-Carousel und im Contact-Reveal.
- Design-Tokens als CSS-Custom-Properties in `:root` (`src/style.css`):
  `--color-bg`, `--color-text`, `--color-text-muted`, `--color-accent`,
  `--color-line` (als unitless RGB-Triple, für `rgba()` UND Canvas-Code
  gleichermaßen), `--font-sans` / `--font-mono` / `--font-display`.
- `?motion` URL-Param + `.force-motion`-Klasse auf `<html>`: bypassed
  lokal `prefers-reduced-motion`, sowohl für JS-Loops als auch für
  CSS-`@media`-Blöcke (die scopen sich als `:root:not(.force-motion) …`).
  Durchgezogen in jeder Section.

## Sections

### Hero (`src/hero/cloth.ts`)

Verlet-Cloth-Simulation (Jakobsen-Technik) auf Canvas 2D, Hover = Finger
streicht übers Tuch (schwache Anziehung), Click-Drag = gepinnter Knoten
(starke Anziehung). Name + Subtitle werden nicht als DOM-Text gerendert,
sondern als Textur auf die Cloth-Dreiecke gewarpt (`drawWarpedText`,
`drawTriangle`), damit sich der Schriftzug mitverformt. Header (`.hero-nav`)
hat einen opaken Background, damit ein hochgezogener Cloth-Knoten dahinter
verschwindet statt drüber zu bleeden.

### About (`src/about/elevator.ts`)

Statischer CSS-3D-Korridor (One-Point-Perspective), 4x Viewporthöhe, läuft
einfach normal durch beim Scrollen — kein Pin, kein JS-Grid-Streaming. Die
einzige JS-Bewegung ist `perspective-origin`, die dem Viewport-Scroll folgt
(geometrische Korrektur, kein Deko-Effekt) — sonst würden Decke/Boden über
weite Strecken schief wirken statt nur genau dann, wenn man sie direkt
anschaut.

### Projects (`src/projects/carousel.ts`)

Rotierender Zylinder, Viewpoint auf der Achse. Cards kleben innen am
Zylindermantel, in einer absteigenden Spirale. Fixer Winkelabstand von
360°/`CARDS_PER_LAYER` (4) statt 360°/n — pro voller Umdrehung eine
"Layer", darunter geht's eine Etage tiefer weiter. Dadurch bleibt der
Abstand zwischen Nachbarn immer gleich groß, egal wie viele Projekte
dazukommen (mehr Projekte = mehr Layer, nicht engerer Ring).

Scroll treibt eine `easeInOutCubic`-Kurve pro Karten-Schritt: die aktive
Karte verweilt kurz mittig, der Wechsel zur nächsten geht zügig. Scale ist
an den Fokus gekoppelt (aktive Karte ~1.12×, Rand-Karten schrumpfen).
Aktuell 5 Projekte × 3 Cards (siehe TODOs).

**Verworfene Ansätze** (zur Erinnerung, falls das nochmal aufkommt): flaches
lineares Perspective-Karussell → verworfen zugunsten Zylinder. Linearer
Z-Depth-Pfad (explizite Korrektur-Vorgabe) → nochmal verworfen, zurück zum
Zylinder ("Ring war besser").

#### Übergang Box → Projekte (`src/scroll/transition.ts`)

Kein geometrisches Morphing der 5 Box-Flächen — ein getimter Crossfade.
Eigenes `ScrollTrigger` (`trigger: #projects, start: "top bottom", end:
"top top"`, `scrub`), das zwei Opacities aus demselben Fortschrittswert
ableitet: `.elevator-shaft` (alle 5 Box-Flächen, ein gemeinsames Element)
blendet über die ersten 70% des Bereichs aus, `.projects-bg-grid` (flaches
Gitter, liegt als erstes Kind vor `.carousel-stage` in `#projects`, damit
es hinterm Zylinder bleibt) blendet ab 30% ein — 40% Überlappung in der
Mitte, damit nie eine Lücke entsteht (immer mindestens ein Gitter-Muster
sichtbar). Endet exakt dort, wo Carousels eigenes Pin einsetzt, damit das
Hintergrund-Gitter beim Start der Zylinder-Fahrt schon fertig eingeblendet
ist. Reduced-Motion: kein Scrub — `.projects-bg-grid` steht per CSS-Default
schon auf `opacity: 1`, die Box verschwindet einfach durch normales
Scrollen (kein JS-Override), also ein harter Wechsel statt Blend.

### Contact (`src/contact/contact.ts`)

Gepinnt, scroll-scrubbed (nicht Autoplay): erster Teil des Scrolls ist
reiner Schwarzbild-Hold, danach hängt der Fall direkt am Scroll-Fortschritt.
Headline ("Let's talk now") und Mail-Adresse sind in Einzelbuchstaben
zerlegt (`splitLetters()`) und fallen in zufälliger Reihenfolge mit
Überlappung rein (`stagger: { each, from: "random" }`), pro Buchstabe ein
kleiner Zufalls-Twist (Rotation/X-Offset), landen aber alle sauber lesbar.
Icons folgen versetzt und fächern minimal auf (deterministischer Fan-Out,
kein echtes Chaos). `aria-label` auf Headline/Mail-Link, damit Screenreader
den ganzen Text vorlesen statt Buchstabe für Buchstabe.

Bewusst **keine** Physik-Simulation (Gravity/Bounce/Kollision) — bei
gescriptetem GSAP ist das Settle-Timing und die Endposition garantiert
sauber/klickbar, bei echter Physik nicht.

### Scroll-System (`src/scroll/progress.ts`, `src/scroll/edge-nav.ts`)

- **Custom Scroll-Progress-Bar**: native Scrollbar per CSS versteckt
  (`scrollbar-width: none` / `::-webkit-scrollbar{display:none}`), eigene
  Bar rechts fixed, Thumb-Position kommt 1:1 aus `lenis.progress` (kein
  zweiter Scroll-Listener-Kreis). Thumb ist draggable → `lenis.scrollTo()`.
  Mobile (≤640px) ausgeblendet, Touch-Scroll unangetastet.
- **Edge-Nav**: `.site-header` (fixed, oben) und `.footer--floating` (fixed,
  unten) blenden nur in den jeweils äußeren 10% des Scroll-Fortschritts ein
  — dazwischen unsichtbar, `visibility:hidden` (nicht nur `opacity:0`),
  damit sie im hidden-State nicht per Tab fokussierbar sind. `.hero-nav`
  bleibt bewusst unangetastet Teil der Hero-Card (eigenes Element, keine
  Restrukturierung des Cloth-Masking-Aufbaus).

### Footer & Legal (`src/legal/legal.ts`, `impressum.html`, `datenschutz.html`)

Impressum/Datenschutz sind eigene statische Seiten (kein SPA-Routing),
über `vite.config.ts` (`rollupOptions.input`) als zusätzliche Build-Einträge
registriert. Inhalt von Kevins `cv-new/datenschutz.html` +
`impressum.html` übernommen und an kev.dev angepasst: DOS-Emulator/CSP-
Build-Enforcement-Passagen raus (existieren hier nicht), Sprachwahl-
Speicherungs-Absatz raus (kein `localStorage` im Projekt), Design an die
bestehenden Tokens angepasst. Footer-Markup ist auf beiden Legal-Seiten
und der Haupt-SPA hand-synchronisiert (kein gemeinsames Include-System).

## Bekannte Platzhalter / offene TODOs

- **GitHub-Link** ist überall noch `https://github.com/` (Hero-Nav,
  Contact-Icons, Footer) — echter Handle (`Saos-EBB`, siehe `cv-new`) noch
  nicht eingesetzt.
- **Projects-Daten**: `kind`-Labels sind geraten (Automation / Web App /
  Canvas-Graphics / Simulation / Tool), `href` überall `#`. Die 3 Cards
  pro Projekt sind aktuell inhaltlich identisch (Platzhalter für später
  unterschiedliche Screenshots/Slides).
- **About-Texte** in `elevator.ts` sind noch Platzhalter-Absätze.
- **Contact "Phone"-Icon** verlinkt noch auf `#contact` statt eine echte
  Telefonnummer/`tel:`-Link.

## Testmethodik

Playwright mit `DISPLAY=:0` + `headless:false` für echte GPU-Rendering-
Checks — headless Chromium fällt auf SwiftShader (Software-Rendering)
zurück, was bei CSS-3D-lastigen Szenen falsch niedrige FPS-Werte zeigt.
2D-Canvas-Arbeit (Cloth) ist davon nicht betroffen, alles mit 3D-Transforms
(Elevator, Carousel, Contact-Pin) schon.
