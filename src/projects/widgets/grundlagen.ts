// "Grundlagen" widget: a workspace for the nine Bootcamp programs. Along
// the top they sit as sticky notes (plus prev/next); the picked one fills
// the rest — its Why?, concepts and what it does as cards on the left, the
// shared terminal running the original Java program in the middle (see
// java-runner.ts), its code excerpt on the right. All of it takes the
// note's own color. The runtime starts loading when the card is first
// expanded, never on page view.

import "./grundlagen.css";
import { runJava, warmUp, writeFiles, type JavaProcess } from "./java-runner";
import { Terminal } from "./terminal";
import type { ProjectCard } from "../project-cards";
import { UI } from "../../i18n/ui";
import { grantConsent, hasConsent } from "../../consent";
import { RTL } from "../../i18n";
import { localizeNote } from "./grundlagen-i18n";

import gameOfLifeSrc from "../../../java/GameOfLife.java?raw";
import masterMindSrc from "../../../java/MasterMind.java?raw";
import bibliothekSrc from "../../../java/Bibliothek.java?raw";
import minesweeperSrc from "../../../java/MinesweaperV2.java?raw";
import zahlenratenSrc from "../../../java/ZahlenRatenV2.java?raw";
import chiffreSrc from "../../../java/ChiffrePOLY.java?raw";
import pmSrc from "../../../java/PersonenVerwaltung/PM.java?raw";
import myStackSrc from "../../../java/MyStack.java?raw";
import dmgCalcSrc from "../../../java/src/Logik/DmgCalc.java?raw";
import pokemonRaw from "../../../java/src/Persistierung/PokemonRawData?raw";
import attackRaw from "../../../java/src/Persistierung/AttackRawData?raw";
import effectivenessRaw from "../../../java/src/Persistierung/EffectivenessRawData?raw";

// 1-based, inclusive line range of a real source file.
const excerpt = (src: string, from: number, to: number) =>
  src.split("\n").slice(from - 1, to).join("\n");

interface Note {
  id: string;
  label: string;
  color: string; // one colour per project (--note-N in style.css); the terminal takes it over
  bullets?: string[];
  open?: string; // shown as [OFFEN: …] where copy or code is still missing
  code?: { file: string; text: string };
  run?: string; // Launcher argument; no run = no console entry point
  files?: Record<string, string>; // written to the virtual /files/ before the run
  intro?: string; // short explanation shown under the title
  concepts?: string[]; // what the project exercises, shown as small tags
}

// Hues stay within green → violet so the nine read as one family with the
// page's green accent (hue 140), not as a rainbow.
const NOTES: Note[] = [
  {
    id: "gameoflife",
    intro: "Conways Spiel des Lebens als Konsolenprogramm: Zellen leben, sterben oder entstehen je nach Nachbarn. Ich wollte verstehen, wie man ein Gitter modelliert und aus einfachen Regeln ein Verhalten entstehen lässt.",
    concepts: ["2D-Arrays", "Nachbar-Zählung", "Zykluserkennung"],
    label: "Game of Life",
    color: "var(--note-1)",
    bullets: [
      "Gitter- und Nachbar-Zähllogik von Grund auf gebaut",
      "Schritt-für-Schritt-Simulation mit Zykluserkennung — stoppt von selbst, wenn sich ein Muster wiederholt",
    ],
    code: { file: "GameOfLife.java", text: excerpt(gameOfLifeSrc, 85, 116) },
    run: "gameoflife",
  },
  {
    id: "pokemon",
    intro: "Ein kleines Kampfsystem im Stil von Pokémon. Die Daten zu Pokémon, Attacken und Typ-Stärken werden aus Dateien eingelesen und der Schaden wird daraus berechnet. Hier habe ich Klassenhierarchien geübt.",
    concepts: ["Vererbung", "Klassenhierarchie", "Kampfschleife", "Dateien einlesen"],
    label: "Pokémon",
    color: "var(--note-2)",
    bullets: [
      "Klassenhierarchie für Pokémon und Attacken",
      "Rundenbasierte Kampfschleife mit Textausgabe",
    ],
    code: { file: "Logik/DmgCalc.java", text: excerpt(dmgCalcSrc, 9, 22) },
    run: "pokemon",
    files: {
      "Pkmn/src/Persistierung/PokemonRawData": pokemonRaw,
      "Pkmn/src/Persistierung/AttackRawData": attackRaw,
      "Pkmn/src/Persistierung/EffectivenessRawData": effectivenessRaw,
    },
  },
  {
    id: "mastermind",
    intro: "Das Code-Rate-Spiel Mastermind in der Konsole: Du tippst eine Kombination, das Programm bewertet sie.",
    concepts: ["Konsolen-Eingabe", "Spiellogik"],
    label: "Mastermind",
    color: "var(--note-3)",
    open: "Info-Text zu Mastermind fehlt",
    code: { file: "MasterMind.java", text: excerpt(masterMindSrc, 40, 69) },
    run: "mastermind",
  },
  {
    id: "rpn",
    intro: "Ein Rechner für die umgekehrte polnische Notation (Operanden zuerst, dann der Operator). Die Datenstruktur dahinter, Liste und Stack, habe ich selbst gebaut statt eine fertige zu nutzen.",
    concepts: ["Verkettete Liste", "Stack", "Ausdrücke auswerten"],
    label: "RPN-Rechner",
    color: "var(--note-4)",
    bullets: [
      "Selbst implementierte einfach verkettete Liste",
      "Stack darauf aufgebaut, zum Auswerten der Ausdrücke genutzt",
    ],
    code: { file: "MyStack.java", text: excerpt(myStackSrc, 1, 32) },
    run: "rpn",
  },
  {
    id: "personal",
    intro: "Eine kleine Verwaltung für Standorte und die Personen darin. Der Fokus lag auf sauberem Klassendesign, Enums und dem Abfangen falscher Eingaben. Es hat kein main, deshalb gibt es kein Terminal.",
    concepts: ["Enum", "Überladene Methoden", "Fehlerbehandlung"],
    label: "Personalverwaltung",
    color: "var(--note-5)",
    bullets: [
      "Verwaltungen (Standorte) anlegen und Personen mit Adresse, Geschlecht (Enum) und Geburtsdatum darin ablegen",
      "Überladene create-Methoden je nach Datenumfang; ein falsches Datumsformat wird abgefangen",
    ],
    code: { file: "PersonenVerwaltung/PM.java", text: excerpt(pmSrc, 5, 27) },
    run: "personal",
  },
  {
    id: "bibliothek",
    intro: "Eine Mini-Bibliothek in der Konsole: Autoren, ihre Bücher und Zitate, durchsuchbar über ein Menü. Hier ging es um die Wahl passender Collections.",
    concepts: ["HashMap", "HashSet", "Konsolen-Menü"],
    label: "Bibliothek",
    color: "var(--note-6)",
    bullets: [
      "Autoren und ihre Bücher in einer HashMap mit HashSets, dazu Zitate pro Titel",
      "Menü: Autoren auflisten, Bibliografie ansehen, Zitat zu einem Titel, Autor zu einem Titel finden, eigene Autoren ergänzen",
    ],
    code: { file: "Bibliothek.java", text: excerpt(bibliothekSrc, 10, 29) },
    run: "bibliothek",
  },
  {
    id: "minesweeper",
    intro: "Minesweeper mit Twist: Du rätst, wo keine Mine liegt, und je nach Feldwert wird ein größerer Bereich aufgedeckt.",
    concepts: ["2D-Arrays", "Koordinaten-Eingabe", "Felder aufdecken"],
    label: "Minesweeper",
    color: "var(--note-7)",
    bullets: [
      "10×10-Feld, Eingabe per Koordinate (z. B. A3): du rätst, wo keine Mine liegt",
      "Aufgedeckt wird je nach Feldwert 1×1, 3×3 oder 5×5 rund um das Feld",
    ],
    code: { file: "MinesweaperV2.java", text: excerpt(minesweeperSrc, 49, 80) },
    run: "minesweeper",
  },
  {
    id: "zahlenraten",
    intro: "Ein Zahlenraten-Duell zwischen Roboter und Mensch. Der Roboter rät nicht zufällig, sondern grenzt den Bereich mit jedem Hinweis systematisch ein.",
    concepts: ["Bereichs-Suche", "Intervalle eingrenzen"],
    label: "Zahlenraten",
    color: "var(--note-8)",
    bullets: [
      "Roboter gegen Mensch: abwechselnd eine Zahl von 0 bis 100 raten",
      "Der Roboter nimmt jeweils die Mitte der noch möglichen Zahlen und streicht anhand der Hinweise („Fast da“, „Relativ nah“ …) ganze Bereiche",
    ],
    code: { file: "ZahlenRatenV2.java", text: excerpt(zahlenratenSrc, 30, 54) },
    run: "zahlenraten",
  },
  {
    id: "chiffre",
    intro: "Eine Vigenère-artige Verschlüsselung in Java: Text wird mit einem Passwort verschoben und danach zur Kontrolle direkt wieder entschlüsselt.",
    concepts: ["Strings", "Modulo-Verschiebung", "Ver-/Entschlüsselung"],
    label: "Chiffre",
    color: "var(--note-9)",
    bullets: [
      "Polyalphabetische Verschlüsselung: jeder Buchstabe wird um den passenden Buchstaben des Passworts verschoben, das Passwort wiederholt sich",
      "Eingabe wird bereinigt (Umlaute → AE/OE/UE, ß → SS, nur A–Z); das Ergebnis wird direkt wieder entschlüsselt",
    ],
    code: { file: "ChiffrePOLY.java", text: excerpt(chiffreSrc, 62, 80) },
    run: "chiffre",
  },
].map(localizeNote); // texts in the visitor's language (grundlagen-i18n.ts)

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function mount(host: HTMLElement, _card?: ProjectCard) {
  host.classList.add("gwidget");
  host.innerHTML = `
    <div class="gwidget-bar">
      <div class="gwidget-tabs" role="tablist" aria-label="${UI.gPrograms}">
        ${NOTES.map(
          (n, i) => `<button type="button" role="tab" class="gwidget-tab" data-note="${n.id}" aria-selected="false"
            style="--pc: ${n.color}; --r: ${((i * 37) % 7) - 3}deg">${esc(n.label)}</button>`,
        ).join("")}
      </div>
      <div class="gwidget-nav">
        <button type="button" class="gwidget-prev" aria-label="${UI.gPrev}">${RTL ? "→" : "←"}</button>
        <span class="gwidget-count" aria-live="polite"></span>
        <button type="button" class="gwidget-next" aria-label="${UI.gNext}">${RTL ? "←" : "→"}</button>
      </div>
    </div>
    <div class="gwidget-info" role="tabpanel"></div>
    <div class="gwidget-term">
      <div class="gwidget-term-bar">
        <span class="gwidget-term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="gwidget-term-title"></span>
        <button type="button" class="gwidget-restart">${UI.gRestart}</button>
      </div>
      <pre class="gwidget-out" role="log" aria-live="off" aria-label="${UI.gOutput}" tabindex="0"></pre>
      <form class="gwidget-in">
        <label class="gwidget-prompt">
          <span aria-hidden="true">›</span>
          <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${UI.gInput}" disabled />
        </label>
      </form>
      <p class="gwidget-status" aria-live="polite"></p>
      <div class="gwidget-consent" hidden>
        <p>${UI.gConsentText}</p>
        <div class="gwidget-consent-actions">
          <button type="button" class="gwidget-consent-start">${UI.gConsentStart}</button>
          <a href="#datenschutz" data-close>${UI.consentPrivacy}</a>
        </div>
      </div>
    </div>
    <aside class="gwidget-codecol">
      <section class="ws-card gwidget-codecard">
        <h5 class="ws-card-heading">${UI.gCode} <span class="gwidget-file"></span></h5>
        <pre class="gwidget-code"><code></code></pre>
      </section>
      <p class="gwidget-credit">
        ${UI.gCredit} <a href="https://cheerpj.com" target="_blank" rel="noopener noreferrer">CheerpJ</a>.
      </p>
    </aside>
  `;

  const q = <T extends HTMLElement>(sel: string) => host.querySelector<T>(sel)!;
  const info = q<HTMLElement>(".gwidget-info");
  const termBox = q<HTMLElement>(".gwidget-term");
  const codeFile = q<HTMLElement>(".gwidget-file");
  const codeBody = q<HTMLElement>(".gwidget-code code");
  const title = q<HTMLElement>(".gwidget-term-title");
  const out = q<HTMLElement>(".gwidget-out");
  const form = q<HTMLFormElement>(".gwidget-in");
  const input = q<HTMLInputElement>(".gwidget-in input");
  const status = q<HTMLElement>(".gwidget-status");
  const restart = q<HTMLButtonElement>(".gwidget-restart");
  const consent = q<HTMLElement>(".gwidget-consent");
  const buttons = [...host.querySelectorAll<HTMLButtonElement>(".gwidget-tab")];
  const prev = q<HTMLButtonElement>(".gwidget-prev");
  const next = q<HTMLButtonElement>(".gwidget-next");
  const count = q<HTMLElement>(".gwidget-count");
  const term = new Terminal(out);

  let active: Note | null = null;
  let process: JavaProcess | null = null;
  let runId = 0;

  const setInputEnabled = (on: boolean) => {
    input.disabled = !on;
    if (!on) input.value = "";
  };

  async function start(note: Note) {
    const id = ++runId;
    process?.stop();
    process = null;
    term.clear();
    setInputEnabled(false);
    restart.disabled = true;

    if (!note.run) {
      termBox.classList.remove("is-gated");
      consent.hidden = true;
      status.textContent = UI.gNoConsole;
      return;
    }
    // Nothing loads from CheerpJ's server before the visitor agrees here
    // (see consent.ts) — the notice stands in for the terminal until then.
    const gated = !hasConsent("cheerpj");
    termBox.classList.toggle("is-gated", gated);
    consent.hidden = !gated;
    if (gated) {
      status.textContent = "";
      return;
    }
    // The runtime (and then the JVM) can take a while on a cold cache; a
    // running counter, kept until the program's first output, shows that
    // something is happening.
    const t0 = Date.now();
    let loading = true;
    const showLoading = () => {
      if (id !== runId) return stopLoading();
      const seconds = Math.round((Date.now() - t0) / 1000);
      status.textContent = UI.gLoading(seconds);
    };
    const ticker = setInterval(showLoading, 1000);
    function stopLoading() {
      if (!loading) return;
      loading = false;
      clearInterval(ticker);
      if (id === runId) status.textContent = "";
    }
    showLoading();
    try {
      if (note.files) await writeFiles(note.files);
      const started = await runJava(note.run, {
        onOutput: (text) => {
          if (id !== runId) return;
          stopLoading();
          term.write(text);
        },
        onExit: (code) => {
          if (id !== runId) return;
          stopLoading();
          term.write(`\n${UI.gExit(code)}\n`);
          process = null;
          setInputEnabled(false);
          restart.disabled = false;
        },
      });
      if (id !== runId) {
        started.stop();
        return;
      }
      process = started;
      setInputEnabled(true);
      restart.disabled = false;
      input.focus({ preventScroll: true });
    } catch (e) {
      stopLoading();
      if (id !== runId) return;
      status.textContent = e instanceof Error ? e.message : UI.gStartError;
      restart.disabled = false;
    }
  }

  function select(note: Note) {
    active = note;
    const i = NOTES.indexOf(note);
    buttons.forEach((b) => {
      const on = b.dataset.note === note.id;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    host.style.setProperty("--pc", note.color);
    count.textContent = `${i + 1} / ${NOTES.length}`;

    const card = (heading: string, body: string, extra = "") =>
      `<section class="ws-card ${extra}"><h5 class="ws-card-heading">${heading}</h5>${body}</section>`;
    info.innerHTML = [
      `<h4 class="gwidget-name">${esc(note.label)}</h4>`,
      note.intro ? card(UI.boxWhy, `<p class="gwidget-intro">${esc(note.intro)}</p>`) : "",
      note.concepts
        ? card(UI.gConcepts, `<ul class="gwidget-tags">${note.concepts.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`)
        : "",
      note.bullets
        ? card(UI.gDoes, `<ul class="gwidget-bullets">${note.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`)
        : "",
      note.open ? `<p class="gwidget-open">[OFFEN: ${esc(note.open)}]</p>` : "",
    ].join("");
    codeFile.textContent = note.code ? note.code.file : "";
    codeBody.textContent = note.code ? note.code.text : UI.gNoCode;
    termBox.hidden = false;
    title.textContent = note.run ? `java Launcher ${note.run}` : note.label;
    start(note);
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => select(NOTES.find((n) => n.id === b.dataset.note)!)),
  );
  const step = (d: number) =>
    select(NOTES[(NOTES.indexOf(active!) + d + NOTES.length) % NOTES.length]);
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  restart.addEventListener("click", () => active && start(active));
  q<HTMLButtonElement>(".gwidget-consent-start").addEventListener("click", () => {
    grantConsent("cheerpj");
    if (active) start(active);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!process) return;
    const line = input.value;
    input.value = "";
    term.write(line + "\n");
    process.sendLine(line);
  });

  select(NOTES[0]);

  // Start downloading the runtime now, so the first click is quicker —
  // only once the visitor has agreed to load it.
  if (hasConsent("cheerpj")) warmUp().catch(() => {});
}
