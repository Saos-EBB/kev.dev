// Each card's signature visual — the part that gives a project its own
// vibe at a glance. Plain HTML + CSS (project-cards.css), no canvas and no
// per-frame JS: the only motion is the renderer's CSS cube, which runs on
// the compositor. Everything shown is taken from the card's own data or
// from facts already stated in its copy; nothing here is new information.
//
// Buttons carrying data-card/data-facet open the shared overlay exactly
// like the head's facet buttons (facet-overlay.ts listens on [data-facet]),
// so the viewport and the pinboard notes double as "start the live demo".

import { esc, type ProjectCard } from "./project-cards";

// YourBrand: the four layers named in its copy (DB → Security → API, and
// the experimental business logic on top), plus the per-tenant modules.
function blueprint(card: ProjectCard): string {
  const layers = [
    ["Business-Logic", "der experimentelle Teil"],
    ["API", "NestJS · WebSockets · Stripe"],
    ["Security", "Row-Level Security"],
    ["Datenbank", "PostgreSQL · PostGIS"],
  ];
  const modules = ["Moderation", "Barrierefrei", "Geo", "Payments"];
  // Which modules each example tenant has booked — illustrates "jeder
  // Tenant bekommt nur die Module, die er bucht", not real customers.
  const tenants: [string, boolean[]][] = [
    ["Tenant A", [true, true, false, true]],
    ["Tenant B", [true, false, true, false]],
    ["Tenant C", [true, true, true, true]],
  ];
  return `
    <div class="viz-blueprint">
      <p class="viz-caption">fig. 1 — Layer, von unten gebaut</p>
      <ol class="viz-stack">
        ${layers
          .map(
            ([name, sub], i) =>
              `<li style="--i: ${layers.length - 1 - i}"><b>${name}</b><span>${sub}</span></li>`,
          )
          .join("")}
      </ol>
      <p class="viz-caption">fig. 2 — Module pro Tenant</p>
      <table class="viz-tenants">
        <thead><tr><th></th>${modules.map((m) => `<th>${m}</th>`).join("")}</tr></thead>
        <tbody>
          ${tenants
            .map(
              ([name, on]) =>
                `<tr><th>${name}</th>${on.map((v) => `<td class="${v ? "on" : ""}"></td>`).join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <span class="viz-stamp">${esc(card.title)} · ${esc(card.kind)}</span>
    </div>
  `;
}

// TschoBBo: its own mail-client UI, as a mock — the boards it scrapes in
// the list, manual sending in the folders, Tschobbo himself in the corner.
function inbox(card: ProjectCard): string {
  const shot = card.screenshots?.[0];
  const mails = [
    ["karriere.at", "Stelle gespeichert · Anschreiben lokal generiert", "Ollama"],
    ["AMS", "Treffer aus dem Regex-Filter", "Regex"],
    ["devjobs", "Entwurf fertig — Versand bleibt manuell", "Entwurf"],
  ];
  return `
    <div class="viz-inbox">
      <div class="viz-window-bar"><i></i><i></i><i></i><span>${esc(card.title)} — Posteingang</span></div>
      <div class="viz-inbox-body">
        <ul class="viz-folders">
          <li class="is-active">Gescrapt</li>
          <li>Entwürfe</li>
          <li>Gesendet <em>manuell</em></li>
        </ul>
        <ul class="viz-mails">
          ${mails
            .map(
              ([from, subject, tag], i) => `
            <li class="${i === 0 ? "is-unread" : ""}">
              <b>${from}</b><span>${subject}</span><i>${tag}</i>
            </li>`,
            )
            .join("")}
        </ul>
      </div>
      ${shot ? `<img class="viz-mascot" src="${esc(shot.src)}" alt="${esc(shot.alt)}" loading="lazy" decoding="async" />` : ""}
    </div>
  `;
}

// Renderer: a 3D app viewport — wireframe cube in a cube, HUD corners.
// The whole viewport is the Live-Demo button.
function viewport(card: ProjectCard): string {
  const faces = ["front", "back", "left", "right", "top", "bottom"]
    .map((f) => `<i class="f-${f}"></i>`)
    .join("");
  const demo = card.facets?.includes("live-demo")
    ? `data-card="${esc(card.id)}" data-facet="live-demo"`
    : "disabled";
  return `
    <button class="viz-viewport" type="button" ${demo} aria-label="${esc(card.widget?.label ?? "Live-Demo")} öffnen">
      <span class="viz-scene" aria-hidden="true">
        <span class="viz-cube">${faces}</span>
        <span class="viz-cube viz-cube--inner">${faces}</span>
      </span>
      <span class="viz-hud viz-hud--tl">canvas 2d · 0 libs</span>
      <span class="viz-hud viz-hud--tr">OBJ · STL · DICOM</span>
      <span class="viz-hud viz-hud--bl">x 0.00 · y 0.00 · z −4.00</span>
      <span class="viz-hud viz-hud--br">▶ Live drehen</span>
    </button>
  `;
}

// AniScript: the userscript's own header block, then its features as a diff.
function editor(card: ProjectCard): string {
  const lines: [string, string][] = [
    ["c", "// ==UserScript=="],
    ["c", `// @name        ${card.title}`],
    ["c", "// @version     0.0.85"],
    ["c", "// @match       https://aniworld.to/*"],
    ["c", "// ==/UserScript=="],
    ["", ""],
    ["add", "+ Hoster-Handling (Voe/Filemoon)"],
    ["add", "+ Ad-Skipping"],
    ["add", "+ Auto-Play"],
    ["del", "- bs.to-Adaption (verworfen)"],
    ["", ""],
    ["c", "// Fix: Violentmonkey → ScriptCat (MV3)"],
  ];
  return `
    <div class="viz-editor">
      <div class="viz-tabs"><span class="is-active">aniscript.user.js</span><span>ScriptCat · MV3</span></div>
      <pre class="viz-code"><code>${lines
        .map(
          ([kind, text], i) =>
            `<span class="ln">${String(i + 1).padStart(2, " ")}</span><span class="${kind}">${esc(text)}</span>`,
        )
        .join("\n")}<span class="viz-caret"></span></code></pre>
      <div class="viz-status"><span><b>●</b> aktiv auf aniworld.to</span><span>JavaScript · UTF-8</span></div>
    </div>
  `;
}

// Grundlagen: the nine Bootcamp programs as sticky notes in their own
// colors (same --note-N each one has in the widget), each one starts the
// in-browser Java terminal. Labels mirror NOTES in widgets/grundlagen.ts —
// not imported, that module pulls in all the Java sources.
function pinboard(card: ProjectCard): string {
  const notes = [
    "Game of Life",
    "Pokémon",
    "Mastermind",
    "RPN-Rechner",
    "Personalverwaltung",
    "Bibliothek",
    "Minesweeper",
    "Zahlenraten",
    "Chiffre",
  ];
  const demo = card.facets?.includes("live-demo")
    ? `data-card="${esc(card.id)}" data-facet="live-demo"`
    : "disabled";
  return `
    <div class="viz-pinboard">
      ${notes
        .map(
          (n, i) =>
            `<button class="viz-note" type="button" ${demo} style="--n: var(--note-${i + 1}); --r: ${((i * 37) % 7) - 3}deg">${n}</button>`,
        )
        .join("")}
      <button class="viz-prompt" type="button" ${demo}><span>$</span> java Launcher<i></i></button>
    </div>
  `;
}

export function renderVisual(card: ProjectCard): string {
  switch (card.layout) {
    case "blueprint":
      return blueprint(card);
    case "inbox":
      return inbox(card);
    case "viewport":
      return viewport(card);
    case "editor":
      return editor(card);
    case "pinboard":
      return pinboard(card);
  }
}
