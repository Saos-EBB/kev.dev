// The five project cards. Copy is taken verbatim from the handoff — do
// not reword. Order: the strongest three first, then AniScript, then
// Grundlagen last. `open` entries are unresolved questions that stay
// visible on the card until Kevin answers them.

import type { ProjectCard } from "./project-cards";

export const projectCards: ProjectCard[] = [
  {
    id: "yourbrand",
    learnGoal:
      "Wollte lernen, wie man Software modular baut und ein echtes Produkt mit Businesslogik auf die Beine stellt.",
    title: "YourBrand",
    claim:
      "Beweist Architektur-Denken — modulares White-Label-SaaS, multi-tenant gedacht, jeder Layer bewusst entworfen.",
    what: "Mein erster Versuch, echte Software zu bauen: ein modulares White-Label-SaaS. Multi-tenant angelegt — jeder Tenant bekommt nur die Module, die er bucht. Als konkrete Ausbaustufe eine barrierefreie Plattform: Leichte Sprache, Kontrast- und Schriftgrößen-Optionen, intuitives Design, per i18n auf jede Sprache erweiterbar (aktuell Deutsch).",
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
    learnGoal:
      "Keine Lust auf repetitive Bewerbungssuche — und dabei Scraping, LLM und Regex lernen.",
    title: "TschoBBo",
    claim:
      "Beweist Urteilsvermögen — lokale Sprachmodelle statt Cloud, Versand bewusst manuell.",
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
    screenshots: [{ src: "/projects/jobbot.jpeg", alt: "Tschobbo, der lila Slime-Blob mit Sonnenbrille" }],
    open: ["Screenshot der Mail-Client-UI fehlt noch — Kevin liefert"],
  },
  {
    id: "renderer",
    learnGoal: "Wollte wissen, wie weit man einen simplen 2D-Canvas treiben kann.",
    title: "3D-Wireframe-Renderer",
    claim:
      "Beweist Tiefe — von einer Formel aus einem YouTube-Short bis zum Schädel-CT: OBJ, STL und DICOM auf einem simplen 2D-Canvas, ohne Grafik-Bibliothek.",
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
      mount: (el) => import("./widgets/renderer").then((m) => m.mount(el)),
    },
    facets: ["live-demo"],
    open: [
      "Baldur's-Gate-Modelle fehlen im Widget — welche zwei? (duoOG ist 41 MB und nicht im Renderer-Repo)",
      "Ist craniumCut01 das Schädel-CT aus DICOM? Modell-Reihenfolge bestätigen",
    ],
  },
  {
    id: "aniscript",
    learnGoal:
      "Userscripts/Tampermonkey und DOM-Manipulation lernen — und üben, fremden Code zu verstehen und zu erweitern.",
    title: "AniScript",
    claim: "Ein Userscript für den eigenen Gebrauch — adaptiert und erweitert, nicht neu gebaut.",
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
    id: "grundlagen",
    learnGoal: "Die Basics — von Hand, im Bootcamp gelernt (Java, OOP, SQL, Datenstrukturen).",
    title: "Grundlagen",
    claim: "Die Handwerks-Grundlagen — alles von Hand getippt, im Bootcamp gelernt.",
    widget: {
      label: "Bootcamp-Projekte, direkt im Browser ausführbar",
      mount: (el) => import("./widgets/grundlagen").then((m) => m.mount(el)),
    },
    facets: ["live-demo"],
    open: [
      "Info-Texte zu Mastermind, Personalverwaltung und Bibliothek",
      "Bibliothek-Quelle fehlt; Personalverwaltung hat kein main (kein Terminal)",
    ],
  },
];
