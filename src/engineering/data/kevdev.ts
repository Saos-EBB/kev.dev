// kev.dev's own flows, checked against this public repo (github.com/Saos-EBB/kev.dev,
// main at 66fb98c). Code excerpts are generated verbatim into kevdev-code.ts.

import type { EngProject } from "../types";
import { CODE } from "./kevdev-code";

export const kevdev: EngProject = {
  id: "kevdev",
  title: "kev.dev",
  accent: "var(--note-9)",
  repoUrl: "https://github.com/Saos-EBB/kev.dev",
  commit: "66fb98c",
  code: CODE,
  lead: {
    de: "Diese Seite: ein einziger Scroll-Ablauf in Vanilla TypeScript, ohne Framework. Die Szenen oben, darunter das Fundament, das sie zusammenhält, und die Widgets, die erst laden, wenn man sie braucht.",
    en: "This site: one single scroll flow in vanilla TypeScript, no framework. The scenes on top, the foundation that holds them together underneath, and the widgets that only load when you need them.",
    ru: "Этот сайт: один сплошной сценарий прокрутки на чистом TypeScript, без фреймворка. Сверху сцены, под ними основа, которая их держит, и виджеты, которые загружаются только по необходимости.",
    ja: "このサイトはフレームワークなしのバニラTypeScriptで作った1本のスクロール体験です。上にシーン、その下に全体を支える土台、そして必要になったときだけ読み込むウィジェットがあります。",
  },
  layers: [
    { id: "scenes", color: "var(--note-9)", label: { de: "Szenen", en: "Scenes", ru: "Сцены", ja: "シーン" } },
    { id: "base", color: "var(--note-3)", label: { de: "Fundament", en: "Foundation", ru: "Основа", ja: "土台" } },
    { id: "content", color: "var(--note-5)", label: { de: "Inhalt", en: "Content", ru: "Контент", ja: "コンテンツ" } },
    { id: "widgets", color: "var(--note-6)", label: { de: "Widgets", en: "Widgets", ru: "Виджеты", ja: "ウィジェット" } },
  ],
  nodes: [
    { id: "intro", layer: "scenes", label: { de: "Intro" } },
    { id: "texture", layer: "scenes", label: { de: "Namens-Textur" } },
    { id: "cloth", layer: "scenes", label: { de: "Tuch-Simulation" } },

    { id: "lite", layer: "base", label: { de: "LITE-Modus" } },
    { id: "probe", layer: "base", label: { de: "100vh-Messstreifen" } },
    { id: "loop", layer: "base", label: { de: "Eine Scroll-Schleife" } },
    { id: "gate", layer: "base", label: { de: "Start-Schranke" } },

    { id: "lang", layer: "content", label: { de: "Sprache" } },
    { id: "b2b", layer: "content", label: { de: "YourBrand-iframe" } },

    { id: "lazy", layer: "widgets", label: { de: "Lazy Mount" } },
    { id: "consent", layer: "widgets", label: { de: "Einwilligung" } },
    { id: "cheerpj", layer: "widgets", label: { de: "CheerpJ + stdin" } },
  ],
  flows: [
    {
      id: "start",
      title: { de: "Bevor du scrollen kannst" },
      steps: [
        {
          node: "lite",
          title: { de: "Handy oder Desktop, einmal entschieden" },
          plain: { de: "Beim Laden entscheidet die Seite, ob sie die große Fassung mit 3D-Szenen zeigt oder die flache fürs Handy." },
          dev: {
            de: "LITE per matchMedia auf (max-width: 900px), (max-height: 760px), einmal beim Laden. Kein 3D-Aufzug, kein gepinntes Karussell, stattdessen eine Wisch-Galerie. Auch kurze Laptop-Fenster bekommen LITE, weil die gepinnten Szenen die Höhe brauchen.",
          },
          code: "start-lite",
          files: ["src/viewport.ts"],
        },
        {
          node: "lite",
          title: { de: "Grenze überschritten: neu laden" },
          plain: { de: "Dreht man das Tablet oder zieht das Fenster schmal, lädt die Seite in der anderen Fassung neu." },
          dev: { de: "Ein change-Listener auf dieselbe Media-Query ruft location.reload(), statt die Szenen live umzubauen." },
          code: "start-reload",
          files: ["src/main.ts"],
          why: { de: "Die Scroll-Szenen werden für einen Modus gebaut und vermessen. Ein Umbau zur Laufzeit wäre eine zweite, kaum testbare Fassung." },
        },
        {
          node: "loop",
          title: { de: "Ein Takt für Scrollen und Animation" },
          plain: { de: "Weiches Scrollen und alle Animationen laufen im selben Takt. Nichts ruckelt gegeneinander." },
          dev: {
            de: "Lenis wird aus gsap.ticker getickt, lagSmoothing ist aus, und jedes Scroll-Event ruft ScrollTrigger.update. Es gibt keine zweite requestAnimationFrame-Schleife für den Scroll.",
          },
          code: "start-loop",
          files: ["src/main.ts"],
        },
        {
          node: "intro",
          title: { de: "Intro hält die Seite an" },
          plain: { de: "Beim ersten Besuch läuft das Lade-Intro. Solange lässt sich nicht scrollen." },
          dev: {
            de: "lenis.stop() gleich zu Beginn. Das SAOS-Intro meldet Fortschritt (Fonts, window.load) und ruft am Ende des Zerspringens maybeStart(). Ein Wiederkehrer in derselben Sitzung überspringt das Intro über sessionStorage.",
          },
          code: "start-intro",
          files: ["src/intro/saos-intro.ts", "src/main.ts"],
        },
        {
          node: "gate",
          title: { de: "Erst messen, dann scrollen" },
          plain: { de: "Man kann erst scrollen, wenn die Seite wirklich fertig geladen ist. Sonst landeten auf Handys Karten falsch." },
          dev: {
            de: "Zwei Schranken: window.load und das Ende des Intros. Erst wenn beide offen sind, ScrollTrigger.refresh(), einen Frame später lenis.start(). Genau einmal.",
          },
          code: "start-gate",
          files: ["src/main.ts"],
          why: { de: "Auf Mobil vermaß ScrollTrigger die gepinnten Szenen, bevor das Layout stand. Karten des Karussells blieben dann außerhalb des Bildes." },
        },
        {
          node: "probe",
          title: { de: "Höhe ohne Adressleiste" },
          plain: { de: "Ein unsichtbarer Messstreifen sorgt dafür, dass nichts springt, wenn auf dem Handy die Adressleiste ein- und ausfährt." },
          dev: {
            de: "Alles, was mit einem ScrollTrigger-Pin übereinstimmen muss, misst an einem fixen 100vh-Element statt an innerHeight. Gepinnte Szenen nutzen vh, nicht svh.",
          },
          code: "start-probe",
          files: ["src/viewport.ts"],
          why: { de: "100vh bleibt stabil, innerHeight ändert sich mit der Adressleiste. Gemischt läge der Pin um deren Höhe daneben." },
        },
      ],
    },
    {
      id: "hero",
      title: { de: "Das Tuch mit meinem Namen" },
      steps: [
        {
          node: "texture",
          title: { de: "Tippen markiert nur" },
          plain: { de: "Oben tippt sich mein Name immer wieder neu. Jeder Buchstabe merkt nur an, dass das Bild neu gemalt werden muss." },
          dev: {
            de: "Der Typewriter setzt nameTextureDirty. Gemalt wird nicht sofort, sondern im nächsten Frame der Schleife, höchstens einmal pro Frame.",
          },
          code: "hero-dirty",
          files: ["src/hero/name-typewriter.ts", "src/hero/hero-names.ts"],
        },
        {
          node: "texture",
          title: { de: "Neu malen nur, wenn sichtbar" },
          plain: { de: "Name, Verlauf und Glanz werden auf ein Bild gemalt, das das Tuch trägt. Ist das Tuch nicht zu sehen, wird nichts gemalt." },
          dev: {
            de: "Die Schleife bricht ab, solange cloth.isRunning false ist. Ist die Textur dirty, wird sie neu gerastert. Der Glanz-Sweep läuft im selben Takt wie die CSS-Keyframes von .title-shine.",
          },
          code: "hero-shine",
          files: ["src/main.ts"],
          why: { de: "Außerhalb des Bildes tippt der Name im DOM weiter, kostenlos. Die Textur holt beim ersten Frame zurück auf." },
        },
        {
          node: "cloth",
          title: { de: "Tuch schläft außerhalb des Bildes" },
          plain: { de: "Scrollt man weg, hört die Simulation auf zu rechnen. Kommt man zurück, läuft sie weiter." },
          dev: {
            de: "Ein IntersectionObserver auf das Canvas und visibilitychange schalten die eigene requestAnimationFrame-Schleife des Tuchs an und aus.",
          },
          code: "hero-visible",
          files: ["src/hero/cloth.ts"],
        },
        {
          node: "cloth",
          title: { de: "Feste Schritte, egal wie schnell der Bildschirm" },
          plain: { de: "Das Tuch bewegt sich auf einem 60-Hz- und einem 144-Hz-Bildschirm gleich schnell und gerät nach einem Hänger nicht ins Schleudern." },
          dev: {
            de: "Fester Zeitschritt von 1/60 s, höchstens 2 Schritte pro Frame, ein längerer Hänger verwirft den Rückstand. 0,8 als Spielraum, weil rAF-Zeitstempel um 16,7 ms zittern. Gezeichnet wird nur, wenn ein Schritt lief.",
          },
          code: "hero-step",
          files: ["src/hero/cloth.ts", "src/hero/cloth-drift.ts"],
          why: { de: "Ohne Spielraum würde ein 16,5-ms-Frame seinen Schritt auslassen und der nächste zwei machen. Das sieht man als Ruckeln." },
        },
      ],
    },
    {
      id: "demo",
      title: { de: "Java im Browser, erst wenn du willst" },
      steps: [
        {
          node: "lazy",
          title: { de: "Code laden erst beim Öffnen" },
          plain: { de: "Die großen Live-Demos laden erst, wenn man eine Karte wirklich öffnet. Die Seite selbst bleibt dadurch schnell." },
          dev: {
            de: "Jedes Widget ist ein dynamischer import() in mount, aufgerufen beim ersten Öffnen der Demo. CheerpJ, der 3D-Renderer und FaceDots landen nie im Bundle der Startseite.",
          },
          code: "demo-lazy",
          files: ["src/projects/projects-data.ts", "src/projects/project-cards.ts"],
        },
        {
          node: "lazy",
          title: { de: "Einmal montiert, bleibt montiert" },
          plain: { de: "Schließt man die Demo und öffnet sie wieder, ist sie sofort da, mit allem, was man schon getippt hat." },
          dev: {
            de: "mountedWidgets merkt sich jeden Host. Der Host wird beim ersten Mal gebaut und danach nur noch umgehängt. Schlägt mount fehl, fliegt er aus dem Set und der nächste Klick versucht es neu.",
          },
          code: "demo-mount",
          files: ["src/projects/facet-overlay.ts"],
        },
        {
          node: "consent",
          title: { de: "Erst fragen, dann laden" },
          plain: { de: "Die Java-Laufzeit kommt von einem fremden Server. Bevor man nicht zustimmt, wird von dort nichts geladen." },
          dev: {
            de: "hasConsent('cheerpj') entscheidet vor jedem Start. Ohne Zustimmung steht ein Hinweis an der Stelle des Terminals, und es wird nichts von CheerpJ geladen.",
          },
          code: "demo-consent",
          files: ["src/consent.ts", "src/projects/widgets/grundlagen.ts"],
        },
        {
          node: "cheerpj",
          title: { de: "stdin, das es nicht gibt" },
          plain: { de: "Meine ersten Java-Programme aus dem Bootcamp laufen direkt auf der Seite, mit Tastatureingabe wie im echten Terminal." },
          dev: {
            de: "CheerpJ hat keine stdin-API. java-runner ersetzt dafür die interne cheerpOSInitFds und gibt jedem Prozess eine eigene Konsole als fd 0, 1 und 2, die aus einer Session liest und in sie schreibt.",
          },
          code: "demo-stdin",
          files: ["src/projects/widgets/java-runner.ts"],
          why: { de: "Das ist ein Eingriff in Interna. Bei einem CheerpJ-Update ist das die Stelle, die als Erstes brechen kann." },
        },
        {
          node: "cheerpj",
          title: { de: "Ein Programm starten" },
          plain: { de: "Ein Klick auf ein Spiel startet das echte Java-Programm. Was man tippt, geht als Zeile hinein." },
          dev: {
            de: "runJava setzt starting auf die neue Session, dann startet cheerpjRunMain den Launcher im vorgebauten public/java/grundlagen.jar. Zurück kommen sendLine und stop für das Terminal.",
          },
          code: "demo-run",
          files: ["src/projects/widgets/terminal.ts", "java/"],
        },
      ],
    },
    {
      id: "lang",
      title: { de: "Vier Sprachen, eine Entscheidung" },
      steps: [
        {
          node: "lang",
          title: { de: "Wahl, sonst Browser, sonst Englisch" },
          plain: { de: "Die Seite spricht, was man gewählt hat. Ohne Wahl nimmt sie die Sprache des Browsers, und wenn die nicht dabei ist, Englisch." },
          dev: {
            de: "Gespeicherte Wahl zuerst. Sonst das erste unterstützte Primär-Tag aus navigator.languages (de-AT → de), sonst en. Die erkannte Sprache wird nicht gespeichert, sie folgt weiter dem Browser.",
          },
          code: "lang-read",
          files: ["src/i18n/index.ts"],
        },
        {
          node: "b2b",
          title: { de: "Das iframe spricht mit" },
          plain: { de: "Die eingebettete YourBrand-Seite öffnet in derselben Sprache wie diese Seite." },
          dev: {
            de: "Beim Laden schreibt i18n die Sprache in den zustand-Store der YourBrand-App (Schlüssel xxx-language), bevor das iframe überhaupt startet.",
          },
          code: "lang-b2b",
          files: ["yourbrand/src/main.tsx"],
          why: { de: "Zwei Sprachspeicher, die sich widersprechen können, wären ein Fehler, den man nur manchmal sieht." },
        },
        {
          node: "lang",
          title: { de: "Deutsch als Netz" },
          plain: { de: "Fehlt eine Übersetzung, steht dort Deutsch statt einer Lücke." },
          dev: {
            de: "pick() nimmt die aktuelle Sprache, sonst de. Der Typ der UI-Texte kommt aus dem deutschen Original, darum meldet der Compiler fehlende Schlüssel.",
          },
          code: "lang-pick",
          files: ["src/i18n/ui.ts", "src/projects/projects-i18n.ts"],
        },
        {
          node: "gate",
          title: { de: "Umschalten heißt neu laden" },
          plain: { de: "Wählt man eine andere Sprache, lädt die Seite neu, und alles steht in der neuen Sprache." },
          dev: { de: "setLang speichert und ruft location.reload(). Die YourBrand-Sprache folgt beim nächsten Laden." },
          code: "lang-set",
          files: ["src/i18n/index.ts"],
          why: { de: "Die Scroll-Szenen messen ihren Text beim Start. Ein Wechsel zur Laufzeit würde jede Messung ungültig machen." },
        },
      ],
    },
  ],
};
