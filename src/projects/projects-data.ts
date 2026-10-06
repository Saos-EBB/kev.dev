// The project cards. Copy is taken verbatim from the handoff — do
// not reword. Order: the strongest three first, then AniScript, then
// Grundlagen last. `open` entries are unresolved questions that stay
// visible on the card until Kevin answers them. `layout` picks the card's
// own arrangement and signature visual (project-visuals.ts), `accent` its
// color — every project looks like itself, on the same grid.

import type { ProjectCard } from "./project-cards";
import { localizeCard } from "./projects-i18n";

const cards: ProjectCard[] = [
  {
    id: "yourbrand",
    layout: "blueprint",
    kind: "White-Label-SaaS",
    accent: "var(--note-2)",
    learnGoal:
      "Wollte lernen, wie man Software modular baut und ein echtes Produkt mit Businesslogik auf die Beine stellt.",
    title: "YourBrand",
    claim:
      "Beweist Architektur-Denken — modulares White-Label-SaaS, multi-tenant gedacht, jeder Layer bewusst entworfen.",
    points: ["White-Label-SaaS für Matching & Community — vom Schachklub bis zur Partnerbörse", "Multi-tenant: Module pro Tenant buchbar, Row-Level Security als Basis", "Solo in rund zwei Monaten — voll funktionsfähiger Prototyp"],
    what: "Mein erster Versuch, echte Software zu bauen: ein modulares White-Label-SaaS für Matching und sozialen Kontakt. Der Kern ist neutral gebaut — dieselbe Plattform trägt einen Schachklub, eine Theatergruppe, eine Partnerbörse oder jede andere Community, die Menschen zusammenbringen will. Multi-tenant angelegt: Jeder Tenant bringt seine eigene Marke mit und bekommt nur die Module, die er bucht. Als konkrete Ausbaustufe eine barrierefreie Plattform: Leichte Sprache, Kontrast- und Schriftgrößen-Optionen, intuitives Design, per i18n auf jede Sprache erweiterbar (aktuell Deutsch).",
    tags: [
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Row-Level Security",
      "PostGIS",
      "WebSockets",
      "Stripe",
      "Docker",
    ],
    meta: "Solo · April–Juni 2026, ca. 450 h · +50–75 h für Loadtests & Test-Dashboard · selbst gewähltes Abschlussprojekt",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/Saos-EBB/WhiteLabel-SaaS---Comunity-Plattform-",
      },
      { label: "Live-Demo auf Anfrage (hoste ich gern)" },
    ],
    decisions: [
      "Modular & multi-tenant angelegt: Module pro Tenant zu-/abschaltbar, Abrechnung nach gebuchtem Umfang",
      "Row-Level Security als Grundzustand: Schutz „von unten“, Sichtbarkeit steuert jede Person selbst",
      "PostGIS für Entfernungsberechnung direkt auf DB-Ebene — leichter als im Backend",
      "Barrierefreiheit von Anfang an (Leichte Sprache, Kontrast, Schriftgröße, i18n-ready)",
      "Moderation, die trägt: Melde-System, Sofort-Sperren/Entsperren, alles mit Notizen",
      "DSGVO-konform durchgezogen (Kopfweh ohne Ende)",
      "Bewusst nicht alles gebaut, was ginge: manche Mechaniken aus ethischen Gründen zurückgehalten",
      "Architektur, Datenmodell und Businesslogik von mir. Die APIs habe ich selbst gebaut, weil sie mich interessiert haben — den Rest der Umsetzung mit CC als Implementierungs-Agent.",
    ],
    challenge:
      "Die eigentliche Herausforderung war der Umfang: kompletter Fullstack solo in zwei Monaten. Die Basis — DB, Security, API — ist sauber und bewusst gebaut. Der Business-Logic-Layer darüber ist der experimentelle Teil: hier habe ich Ideen ausprobiert, statt auf Nummer sicher zu gehen — und dabei am meisten gelernt.",
    origin:
      "2 Wochen DB-Brainstorm (Row-Level Security, PostGIS) → Backend drauf (Postman war Gold beim API-Bauen) → Frontend obendrauf, Layouts und Verhalten durchgespielt, bis es saß.",
    facets: ["live-demo", "b2b"],
    open: [
      "Multi-Tenancy „angelegt/gedacht“ vs. voll umgesetzt — Wortwahl von Kevin bestätigen lassen",
    ],
  },
  {
    id: "tschobbo",
    layout: "inbox",
    kind: "Bewerbungs-Bot",
    accent: "var(--note-5)",
    learnGoal:
      "Keine Lust auf repetitive Bewerbungssuche — und dabei Scraping, LLM und Regex lernen.",
    title: "TschoBBo",
    claim:
      "Beweist Urteilsvermögen — lokale Sprachmodelle statt Cloud, Versand bewusst manuell.",
    points: ["Scrapt österreichische Jobbörsen, filtert per Regex", "Schreibt Anschreiben lokal mit Ollama — keine Cloud", "Versand bleibt bewusst manuell"],
    what: "Mein persönliches Bewerbungs-Tool. Scrapt österreichische Jobbörsen, speichert die Stellen und generiert deutsche Anschreiben lokal per Ollama. Jobseiten absuchen ist repetitiv — das übernimmt der Bot, die Entscheidung bleibt bei mir. Mit dabei: Tschobbo, ein lila Slime-Blob mit Sonnenbrille und endlosen Armen, der beim Scrapen sichtbar für dich arbeitet. Der Gedanke dahinter — Software, die sich lebendig anfühlt und an die man sich bindet. Nervt er, ist er mit einem Klick weg.",
    tags: ["TypeScript", "Node.js", "Playwright", "Ollama", "Regex"],
    meta: "Solo · aus Eigeninteresse gebaut · Sessions von 20 Min bis 4 h",
    links: [
      { label: "GitHub (public)", href: "https://github.com/Saos-EBB/jobsuche-apply-bot" },
      { label: "läuft lokal — Screenshots in den Details" },
    ],
    decisions: [
      "Lokal statt Cloud: Ollama auf der eigenen Maschine — meine Daten bleiben hier",
      "Versand bleibt manuell: der Bot generiert, feuert aber nie selbst eine Bewerbung ab",
      "Filter über Regex, nicht LLM: was ein Regex in Sekunden macht, muss kein Sprachmodell langsam erledigen — LLM nur noch fürs Anschreiben",
      "Mail-Client-UI (Gmail/Proton als Referenz) für maximale Übersicht",
    ],
    challenge:
      "Ich habe viel zu lange am LLM-Filter herumprobiert, obwohl klar war, dass er für eine Aufgabe zu langsam ist, die ein Regex in Sekunden löst. Die Lehre habe ich mitgenommen: das Sprachmodell nur dort einsetzen, wo es wirklich etwas bringt — beim Anschreiben, nicht beim Filtern.",
    origin:
      "Angefangen als reiner Scraper (karriere.at zuerst, weil am leichtesten), dann AMS und devjobs dazu. Erst alles CLI; UI und Maskottchen kamen später, nachdem Freunde Potenzial gesehen haben. Aus derselben Logik ist nebenbei ein kleines CLI-Tool entstanden — Release Watcher, das Manga-Seiten auf neue Kapitel prüft, weil ich zu oft gespoilert wurde. Gleiche Idee, kleiner Rahmen.",
    // UI screenshots: the real JoBBoT UI, fed offline with the real
    // postings from its own test fixtures (parsers + regex filter, no
    // scraping, no Ollama — so no cover letters in them).
    screenshots: [
      { src: "/projects/jobbot/inbox.jpg", alt: "Posteingang: gefilterte Stellen nach Fit (Match/Offstack), Inserat geöffnet" },
      { src: "/projects/jobbot/aussortiert.jpg", alt: "Aussortiert: was der Regex-Filter rausgeworfen hat" },
      { src: "/projects/jobbot/suche.jpg", alt: "Einstellungsseite „Suche“: Portale und Suchbegriffe im Browser bearbeiten" },
      { src: "/projects/jobbot/scrape.jpg", alt: "Scrape: Quellen wählen und den Lauf starten" },
    ],
    mascot: { src: "/projects/jobbot.jpeg", alt: "Tschobbo, der lila Slime-Blob mit Sonnenbrille" },
    facets: ["screens"],
  },
  {
    id: "renderer",
    layout: "viewport",
    kind: "3D ohne Bibliothek",
    accent: "var(--note-3)",
    learnGoal: "Wollte wissen, wie weit man einen simplen 2D-Canvas treiben kann.",
    title: "3D-Wireframe-Renderer",
    claim:
      "Beweist Tiefe — von einer Formel aus einem YouTube-Short bis zum Schädel-CT: OBJ, STL und DICOM auf einem simplen 2D-Canvas, ohne Grafik-Bibliothek.",
    points: ["3D auf einem simplen 2D-Canvas, ohne Grafik-Bibliothek", "Projektion, Rotation und Tiefenschattierung selbst gerechnet", "Lädt OBJ, STL und DICOM — bis zum Schädel-CT"],
    what: "Angefangen mit einer Formel aus einem YouTube-Short (Tsodings „magic formula“): Die Idee, dass ich auf einem simplen 2D-HTML-Canvas komplettes 3D rendern kann, fand ich so spannend, dass ich die Grenzen ausreizen wollte. Projektion, Rotation und Tiefenschattierung selbst gerechnet, ohne Grafik-Bibliothek — dazu zum ersten Mal OBJ- und STL-Dateien eingelesen.",
    tags: ["JavaScript", "Canvas 2D", "3D-Mathematik", "OBJ/STL/DICOM"],
    meta: "Solo · aus Eigeninteresse · ca. 2 Wochen bis zum Ziel",
    links: [
      { label: "GitHub", href: "https://github.com/Saos-EBB/Renderder" },
      { label: "Live direkt im Widget" },
    ],
    decisions: [
      "2D-Canvas statt WebGL/Three.js — bewusst der harte Weg, um zu verstehen, wie 3D wirklich entsteht",
      "Projektion, Rotation, Tiefenschattierung selbst gerechnet",
      "OBJ-, STL- und DICOM-Einlesen selbst gebaut, um echte Modelle und Volumendaten zu laden",
      "Erste Versuche selbst getippt, danach mit CC als Implementierungs-Agent immer weiter ausgereizt — bis zum Schädel-CT. Architektur und Entscheidungen von mir.",
    ],
    challenge:
      "Es war durchgehend Neuland — Projektion, Rotation, das Einlesen von OBJ und STL, überall Probleme, die ich mir vorher nie gestellt hatte. Der Reiz war der Aufstieg: vom simplen Wireframe bis dahin, ein komplettes Schädel-CT aus DICOM-Daten auf einem 2D-Canvas zu rendern.",
    widget: {
      label: "3D-Modelle, mit der Maus drehbar",
      mount: (el, card) => import("./widgets/renderer").then((m) => m.mount(el, card)),
    },
    facets: ["live-demo"],
    open: [
      "Baldur's-Gate-Modelle fehlen im Widget — welche zwei? (duoOG ist 41 MB und nicht im Renderer-Repo)",
      "Ist craniumCut01 das Schädel-CT aus DICOM? Modell-Reihenfolge bestätigen",
    ],
  },
  {
    id: "aniscript",
    layout: "editor",
    kind: "Userscript",
    accent: "var(--note-1)",
    learnGoal:
      "Userscripts/Tampermonkey und DOM-Manipulation lernen — und üben, fremden Code zu verstehen und zu erweitern.",
    title: "AniScript",
    claim: "Ein Userscript für den eigenen Gebrauch — adaptiert und erweitert, nicht neu gebaut.",
    points: ["Userscript für den eigenen Gebrauch", "Fremden Code adaptiert und erweitert: Hoster-Handling, Ad-Skip, Auto-Play", "Render-Bug bis zum Userscript-Manager zurückverfolgt"],
    what: "Ein Userscript, das ich adaptiert und um eigene Features erweitert habe: Hoster-Handling (Voe/Filemoon), Ad-Skipping, Auto-Play. Übung darin, fremden Code zu verstehen, zu warten und gezielt zu erweitern, statt bei null anzufangen. (Zielseite: aniworld.to)",
    tags: ["JavaScript", "Tampermonkey/Userscript", "DOM"],
    meta: "Solo · für den eigenen Gebrauch · laufend gepflegt (v0.0.85)",
    links: [{ label: "GitHub (public)" }, { label: "kein Live-Widget (Userscript)" }],
    decisions: [
      "Bewusst adaptiert statt neu gebaut — Ziel war Erweitern, nicht Nachbauen",
      "bs.to-Adaption geprüft und verworfen: andere Architektur (leitet auf externen Hoster um, statt im iframe einzubetten)",
    ],
    challenge:
      "Lange ein Render-Bug mit Darstellungsfehlern — Ursache war nicht das Script, sondern der Userscript-Manager unter Braves Umstieg von Manifest V2 auf V3. Der Wechsel von Violentmonkey zu ScriptCat hat's behoben, das mit MV3 sauber zurechtkam.",
    open: [
      "GitHub-Link für AniScript fehlt",
      "Brave/MV2→V3-Detail final gegenchecken",
    ],
  },
  {
    id: "kevdev",
    layout: "storyboard",
    kind: "Dieses Portfolio",
    accent: "var(--note-9)",
    learnGoal:
      "Ein Portfolio, das man erlebt statt liest — und in dem jedes Element einen Grund hat.",
    title: "kev.dev",
    claim: "Beweist Gestaltungs-Denken — jede Animation erzählt etwas, nichts ist Deko.",
    points: ["Portfolio zum Erleben — jedes Element hat einen Grund", "Vanilla TypeScript, GSAP, eigene Tuch-Physik auf Canvas", "Eigene Lite-Variante fürs Handy"],
    what: "Viele Portfolio-Seiten angesehen, dann jedes Element mit einem Sinn gebaut: Das Tuch im Hero ist so groß, dass man es anfassen muss. About ist ein Aufzug, an dem mein Leben vorbeizieht. Die Projekte liegen wie auf einer Werkbank, jedes mit Why und Learned. Kontakt kommt mit einem Übergang, und wer klickt, findet ein verstecktes Wow. Impressum und Datenschutz liegen als Overlay auf dem One-Pager, damit die Musik ohne Schnitt weiterläuft.",
    tags: ["TypeScript", "Vite", "GSAP / ScrollTrigger", "Lenis", "Canvas 2D", "CheerpJ"],
    links: [{ label: "GitHub (public)", href: "https://github.com/Saos-EBB/kev.dev" }],
    decisions: [
      "Vanilla TypeScript + Vite, kein Framework — die Seite ist Animation, nicht State",
      "Tuch als eigene Verlet-Physik auf Canvas, der Name wird als Textur mitverzerrt",
      "Aufzug aus CSS-3D-Wänden, Zoom in den Monitor als Übergang ins Projekte-Grid",
      "Ein durchgehendes Grid als roter Faden von About bis Kontakt",
      "Impressum/Datenschutz als Overlay statt eigener Seite — die Musik läuft weiter",
      "Eigene Lite-Variante fürs Handy statt Kompromisse für beide",
    ],
    challenge:
      "Mobile ist eine eigene Welt: Was am Desktop flüssig lief, ruckelte am Handy. Messen statt raten — die Aufzugswände waren Layer so hoch wie die ganze Section. Am Ende eine eigene Lite-Variante statt Kompromisse für beide.",
    facets: ["self"],
    open: [
      "Zeitraum und Umfang (Stunden, solo, Anteil CC als Implementierungs-Agent) — Kevin bestätigt",
      "Texte in Kevins Worten nachschärfen",
    ],
  },
  {
    id: "grundlagen",
    layout: "pinboard",
    kind: "Bootcamp · Java",
    accent: "var(--note-6)",
    learnGoal: "Die Basics — von Hand, im Bootcamp gelernt (Java, OOP, SQL, Datenstrukturen).",
    title: "Grundlagen",
    claim: "Die Handwerks-Grundlagen — alles von Hand getippt, im Bootcamp gelernt.",
    points: ["Bootcamp-Basics: Java, OOP, SQL, Datenstrukturen", "Alles von Hand getippt", "Die Programme laufen direkt im Browser"],
    widget: {
      label: "Bootcamp-Projekte, direkt im Browser ausführbar",
      mount: (el, card) => import("./widgets/grundlagen").then((m) => m.mount(el, card)),
    },
    facets: ["live-demo"],
    open: [
      "Info-Texte zu Mastermind, Personalverwaltung und Bibliothek",
      "Bibliothek-Quelle fehlt; Personalverwaltung hat kein main (kein Terminal)",
    ],
  },
  {
    id: "facedots",
    layout: "portrait",
    kind: "Tool · Foto zu Punkten",
    accent: "var(--note-4)",
    learnGoal:
      "Wollte wissen, wie man Bilderkennung direkt im Browser laufen lässt — ohne Server, ohne dass ein Foto irgendwohin geht.",
    title: "FaceDots",
    claim: "Ein kleines Tool: Foto rein, Kopf freistellen, als Punkte, ASCII oder Tuch wieder raus — alles im Browser.",
    points: [
      "Foto rein: ein Bildmodell stellt den Kopf frei, lokal im Browser",
      "Raus als Punkte, ASCII oder auf dem Tuch aus dem Hero",
      "Eigenes Modul — als eigenes Repo auslagerbar",
    ],
    what: "Ein Foto geht durch ein Segmentierungsmodell, das für jeden Pixel schätzt, ob er Haare, Haut, Kleidung oder Hintergrund ist. Übrig bleibt der Kopf, eingefärbt im Verlauf dieser Seite. Daraus werden Punkte: ein Raster über das Bild, jeder Punkt so groß, wie die Stelle hell ist, jeder an einer Feder — wisch durch, sie weichen aus und federn zurück. Oder als ASCII, oder aufs Tuch aus dem Hero. Das Gesicht hier bin ich.",
    tags: ["TypeScript", "Canvas 2D", "MediaPipe", "WebAssembly", "Partikel-Physik"],
    meta: "Solo · eigenes Modul (packages/face-dots), als eigenes Repo auslagerbar",
    links: [{ label: "Live direkt im Tool" }],
    decisions: [
      "Alles lokal: Bibliothek, wasm und Modell liegen auf dieser Seite — kein Request an Google, kein Upload",
      "Punkte statt 3D-Modell: ein Gesichts-Mesh aus Fotos blieb eine glatte Maske, die Punkte zeigen das echte Bild",
      "Feder pro Punkt, Farben in 16 Gruppen gezeichnet — läuft am Handy flüssig und steht still, sobald alles liegt",
      "Als eigenständiges Modul gebaut, ohne Abhängigkeit zur Seite",
    ],
    challenge:
      "Drei Varianten ausprobiert: Gesicht aufs Tuch, als 3D-Drahtgitter aus mehreren Fotos, als Punkte. Das Tuch verzerrt Gesichter schnell ins Gruselige, das 3D-Modell kennt nur die Gesichtsfläche ohne Cap und Haare. Die Punkte haben gewonnen.",
    origin:
      "Idee für ein interaktives Porträt auf dieser Seite → Testseiten für Tuch, 3D-Modell und Punkte → das Freistellen erst offline, dann direkt im Browser → Modell selbst gehostet → als Modul ausgelagert.",
    widget: {
      label: "Foto → Punkte, ASCII oder Tuch",
      mount: (el, card) => import("./widgets/face-tool").then((m) => m.mount(el, card)),
    },
    facets: ["live-demo"],
  },
];

// In the visitor's language (projects-i18n.ts).
export const projectCards: ProjectCard[] = cards.map(localizeCard);
