// "Grundlagen" widget: nine notes, one shared terminal. Clicking a note shows
// its info and a code excerpt and runs the original Java program in the
// terminal (see java-runner.ts). The runtime starts loading when the card is
// first expanded, never on page view.

import "./grundlagen.css";
import { runJava, warmUp, writeFiles, type JavaProcess } from "./java-runner";
import { Terminal } from "./terminal";

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
  x: number; // free placement on wide screens, in % of the note area
  y: number;
  rotate: number;
}

// Hues stay within green → violet so the nine read as one family with the
// page's green accent (hue 140), not as a rainbow.
const NOTES: Note[] = [
  {
    id: "gameoflife",
    label: "Game of Life",
    color: "var(--note-1)",
    bullets: [
      "Gitter- und Nachbar-Zähllogik von Grund auf gebaut",
      "Schritt-für-Schritt-Simulation mit Zykluserkennung — stoppt von selbst, wenn sich ein Muster wiederholt",
    ],
    code: { file: "GameOfLife.java", text: excerpt(gameOfLifeSrc, 85, 116) },
    run: "gameoflife",
    x: 1, y: 4, rotate: -2,
  },
  {
    id: "pokemon",
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
    x: 35, y: 0, rotate: 1.5,
  },
  {
    id: "mastermind",
    label: "Mastermind",
    color: "var(--note-3)",
    open: "Info-Text zu Mastermind fehlt",
    code: { file: "MasterMind.java", text: excerpt(masterMindSrc, 40, 69) },
    run: "mastermind",
    x: 68, y: 8, rotate: -1,
  },
  {
    id: "rpn",
    label: "RPN-Rechner",
    color: "var(--note-4)",
    bullets: [
      "Selbst implementierte einfach verkettete Liste",
      "Stack darauf aufgebaut, zum Auswerten der Ausdrücke genutzt",
    ],
    code: { file: "MyStack.java", text: excerpt(myStackSrc, 1, 32) },
    run: "rpn",
    x: 6, y: 36, rotate: 1,
  },
  {
    id: "personal",
    label: "Personalverwaltung",
    color: "var(--note-5)",
    bullets: [
      "Verwaltungen (Standorte) anlegen und Personen mit Adresse, Geschlecht (Enum) und Geburtsdatum darin ablegen",
      "Überladene create-Methoden je nach Datenumfang; ein falsches Datumsformat wird abgefangen",
    ],
    code: { file: "PersonenVerwaltung/PM.java", text: excerpt(pmSrc, 5, 27) },
    run: "personal",
    x: 38, y: 32, rotate: -1.5,
  },
  {
    id: "bibliothek",
    label: "Bibliothek",
    color: "var(--note-6)",
    bullets: [
      "Autoren und ihre Bücher in einer HashMap mit HashSets, dazu Zitate pro Titel",
      "Menü: Autoren auflisten, Bibliografie ansehen, Zitat zu einem Titel, Autor zu einem Titel finden, eigene Autoren ergänzen",
    ],
    code: { file: "Bibliothek.java", text: excerpt(bibliothekSrc, 10, 29) },
    run: "bibliothek",
    x: 70, y: 40, rotate: 2,
  },
  {
    id: "minesweeper",
    label: "Minesweeper",
    color: "var(--note-7)",
    bullets: [
      "10×10-Feld, Eingabe per Koordinate (z. B. A3): du rätst, wo keine Mine liegt",
      "Aufgedeckt wird je nach Feldwert 1×1, 3×3 oder 5×5 rund um das Feld",
    ],
    code: { file: "MinesweaperV2.java", text: excerpt(minesweeperSrc, 49, 80) },
    run: "minesweeper",
    x: 2, y: 68, rotate: 1.5,
  },
  {
    id: "zahlenraten",
    label: "Zahlenraten",
    color: "var(--note-8)",
    bullets: [
      "Roboter gegen Mensch: abwechselnd eine Zahl von 0 bis 100 raten",
      "Der Roboter nimmt jeweils die Mitte der noch möglichen Zahlen und streicht anhand der Hinweise („Fast da“, „Relativ nah“ …) ganze Bereiche",
    ],
    code: { file: "ZahlenRatenV2.java", text: excerpt(zahlenratenSrc, 30, 54) },
    run: "zahlenraten",
    x: 36, y: 64, rotate: -1,
  },
  {
    id: "chiffre",
    label: "Chiffre",
    color: "var(--note-9)",
    bullets: [
      "Polyalphabetische Verschlüsselung: jeder Buchstabe wird um den passenden Buchstaben des Passworts verschoben, das Passwort wiederholt sich",
      "Eingabe wird bereinigt (Umlaute → AE/OE/UE, ß → SS, nur A–Z); das Ergebnis wird direkt wieder entschlüsselt",
    ],
    code: { file: "ChiffrePOLY.java", text: excerpt(chiffreSrc, 62, 80) },
    run: "chiffre",
    x: 66, y: 70, rotate: -2,
  },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function mount(host: HTMLElement) {
  host.classList.add("gwidget");
  host.innerHTML = `
    <div class="gwidget-notes" role="group" aria-label="Projekte">
      ${NOTES.map(
        (n) => `<button type="button" class="gwidget-note" data-note="${n.id}" aria-pressed="false"
          style="--pc: ${n.color}; --x: ${n.x}%; --y: ${n.y}%; --r: ${n.rotate}deg">${esc(n.label)}</button>`,
      ).join("")}
    </div>
    <div class="gwidget-info" hidden></div>
    <div class="gwidget-term" hidden>
      <div class="gwidget-term-bar">
        <span class="gwidget-term-title"></span>
        <button type="button" class="gwidget-restart">Neu starten</button>
      </div>
      <pre class="gwidget-out" role="log" aria-live="off" aria-label="Programmausgabe" tabindex="0"></pre>
      <form class="gwidget-in">
        <label class="gwidget-prompt">
          <span aria-hidden="true">›</span>
          <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Eingabe an das Programm" disabled />
        </label>
      </form>
      <p class="gwidget-status" aria-live="polite"></p>
    </div>
    <p class="gwidget-credit">
      Java im Browser, damit mein Code original so laufen kann, wie er ist.
      Läuft mit <a href="https://cheerpj.com" target="_blank" rel="noopener noreferrer">CheerpJ</a>.
    </p>
  `;

  const q = <T extends HTMLElement>(sel: string) => host.querySelector<T>(sel)!;
  const info = q<HTMLElement>(".gwidget-info");
  const termBox = q<HTMLElement>(".gwidget-term");
  const title = q<HTMLElement>(".gwidget-term-title");
  const out = q<HTMLElement>(".gwidget-out");
  const form = q<HTMLFormElement>(".gwidget-in");
  const input = q<HTMLInputElement>(".gwidget-in input");
  const status = q<HTMLElement>(".gwidget-status");
  const restart = q<HTMLButtonElement>(".gwidget-restart");
  const buttons = [...host.querySelectorAll<HTMLButtonElement>(".gwidget-note")];
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
      status.textContent = "Für dieses Projekt gibt es keinen Konsolen-Einstieg.";
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
      status.textContent = `Java lädt … ${seconds} s. Das kann bis zu einer Minute oder länger dauern.`;
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
          term.write(`\n[Programm beendet, Code ${code}]\n`);
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
      status.textContent = e instanceof Error ? e.message : "Java konnte nicht gestartet werden.";
      restart.disabled = false;
    }
  }

  function select(note: Note) {
    active = note;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.note === note.id)));
    host.style.setProperty("--pc", note.color);

    info.hidden = false;
    info.innerHTML = `
      <h4>${esc(note.label)}</h4>
      ${note.bullets ? `<ul>${note.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      ${note.open ? `<p class="gwidget-open">[OFFEN: ${esc(note.open)}]</p>` : ""}
      ${
        note.code
          ? `<p class="gwidget-file">${esc(note.code.file)}</p><pre class="gwidget-code"><code>${esc(note.code.text)}</code></pre>`
          : ""
      }
    `;
    termBox.hidden = false;
    title.textContent = note.run ? `$ java ${note.label}` : `$ ${note.label}`;
    start(note);
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => select(NOTES.find((n) => n.id === b.dataset.note)!)),
  );
  restart.addEventListener("click", () => active && start(active));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!process) return;
    const line = input.value;
    input.value = "";
    term.write(line + "\n");
    process.sendLine(line);
  });

  // Start downloading the runtime now, so the first click is quicker.
  warmUp().catch(() => {});
}
