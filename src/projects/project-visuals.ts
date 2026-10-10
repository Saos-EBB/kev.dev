// Each card's signature visual — the part that gives a project its own
// vibe at a glance. Plain HTML + CSS (project-cards.css), no per-frame JS —
// except FaceDots' particles, which only move while settling or pushed.
// Everything shown is taken from the card's own data or from facts
// already stated in its copy; nothing here is new information.
//
// Buttons carrying data-card/data-facet open the shared overlay exactly
// like the head's facet buttons (facet-overlay.ts listens on [data-facet]),
// so the viewport and the pinboard notes double as "start the live demo".

import { esc, TENANT_MODULES, type ProjectCard, type TenantModule } from "./project-cards";
import { UI } from "../i18n/ui";
import { RTL } from "../i18n";
import { NOTE_IDS, noteLabel } from "./widgets/grundlagen-i18n";

// YourBrand: the four layers named in its copy (DB → Security → API, and
// the experimental business logic on top), plus which module each real
// tenant has switched on (their tenant.json). Shop is being built, no
// tenant has it yet.
function blueprint(card: ProjectCard): string {
  const layers = UI.vizLayers;
  const wip = (m: TenantModule) => m === "shop";
  return `
    <div class="viz-blueprint">
      <p class="viz-caption">${UI.vizFig1}</p>
      <ol class="viz-stack">
        ${layers
          .map(
            ([name, sub], i) =>
              `<li style="--i: ${layers.length - 1 - i}"><b>${name}</b><span>${sub}</span></li>`,
          )
          .join("")}
      </ol>
      <p class="viz-caption">${UI.vizFig2} · ${esc(UI.vizModules.shop)} ${UI.vizWip}</p>
      <table class="viz-tenants">
        <thead><tr><th></th>${TENANT_MODULES.map(
          (m) => `<th class="${wip(m) ? "wip" : ""}"><span>${esc(UI.vizModules[m])}</span></th>`,
        ).join("")}</tr></thead>
        <tbody>
          ${(card.tenants ?? [])
            .map(
              (t) =>
                `<tr><th>${esc(t.name)}</th>${TENANT_MODULES.map(
                  (m) => `<td class="${t.modules.includes(m) ? "on" : wip(m) ? "wip" : ""}"></td>`,
                ).join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// TschoBBo: its real mail-client UI (first screenshot) in a window frame,
// Tschobbo himself as a sticker on the corner. The whole window opens the
// screenshot gallery (the "screens" facet).
function inbox(card: ProjectCard): string {
  const shot = card.screenshots?.[0];
  const mascot = card.mascot;
  const gallery = card.facets?.includes("screens")
    ? `data-card="${esc(card.id)}" data-facet="screens"`
    : "disabled";
  return `
    <button class="viz-inbox" type="button" ${gallery} aria-label="${esc(UI.vizScreensAria(card.title))}">
      <span class="viz-window-bar"><i></i><i></i><i></i><span>jobbot :// ${UI.vizInbox}</span><b>${UI.vizScreensCount(card.screenshots?.length ?? 0)}</b></span>
      ${shot ? `<img class="viz-inbox-shot" src="${esc(shot.src)}" alt="${esc(shot.alt)}" loading="lazy" decoding="async" />` : ""}
      ${mascot ? `<img class="viz-mascot" src="${esc(mascot.src)}" alt="${esc(mascot.alt)}" loading="lazy" decoding="async" />` : ""}
    </button>
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
    <button class="viz-viewport" type="button" ${demo} aria-label="${esc(UI.vizOpen(card.widget?.label ?? UI.facetLiveDemo))}">
      <span class="viz-scene" aria-hidden="true">
        <span class="viz-cube">${faces}</span>
        <span class="viz-cube viz-cube--inner">${faces}</span>
      </span>
      <span class="viz-hud viz-hud--tl">canvas 2d · 0 libs</span>
      <span class="viz-hud viz-hud--tr">OBJ · STL · DICOM</span>
      <span class="viz-hud viz-hud--bl">x 0.00 · y 0.00 · z −4.00</span>
      <span class="viz-hud viz-hud--br">${UI.vizSpin}</span>
    </button>
  `;
}

// AniScript: the userscript's own header block, then its features as a diff.
function editor(card: ProjectCard): string {
  const lines: [string, string][] = [
    ["c", "// ==UserScript=="],
    ["c", `// @name        ${card.title}`],
    ["c", "// @version     0.2.5"],
    ["c", "// @grant       GM_getValue"],
    ["c", "// ==/UserScript=="],
    ["", ""],
    ...UI.vizEditorFeatures,
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
      <div class="viz-status"><span><b>●</b> ${UI.vizEditorStatus}</span><span>JavaScript · UTF-8</span></div>
    </div>
  `;
}

// ReleaseWatcher: its own CLI in the editor's window chrome — the
// commands as its README lists them, no made-up output.
function terminal(card: ProjectCard): string {
  const lines: [string, string][] = [
    ["c", "# release-watcher · Bun + SQLite"],
    ["", "$ bun run start add --source mangadex <query>"],
    ["", "$ bun run start check-new"],
    ["add", "+ tmdb · anilist · mangadex · tvdb"],
    ["", "$ bun run start progress <id> <number>"],
    ["", "$ bun run ui"],
    ["c", "# → http://localhost:3000"],
  ];
  return `
    <div class="viz-editor">
      <div class="viz-tabs"><span class="is-active">${esc(card.title.toLowerCase())}</span><span>zsh</span></div>
      <pre class="viz-code"><code>${lines
        .map(
          ([kind, text], i) =>
            `<span class="ln">${String(i + 1).padStart(2, " ")}</span><span class="${kind}">${esc(text)}</span>`,
        )
        .join("\n")}<span class="viz-caret"></span></code></pre>
      <div class="viz-status"><span><b>●</b> bun test</span><span>TypeScript · SQLite</span></div>
    </div>
  `;
}

// Oskalizer: the playground's screen as the animal mode shows it — one
// key, big, with its animal and what the voice says — and the three modes
// it went through, the current one lit.
function keys(): string {
  const [blobs, animals, typing] = UI.vizKeysModes;
  return `
    <div class="viz-keys">
      <div class="viz-keys-screen"><span class="viz-keys-letter">A</span><span class="viz-keys-animal">🐒</span></div>
      <p class="viz-keys-say">„A wie Affe“</p>
      <ol class="viz-keys-modes"><li>${blobs}</li><li class="is-on">${animals}</li><li>${typing}</li></ol>
    </div>
  `;
}

// Grundlagen: the nine Bootcamp programs as sticky notes in their own
// colors (same --note-N each one has in the widget), each one starts the
// in-browser Java terminal. Labels come from widgets/grundlagen-i18n.ts,
// not grundlagen.ts — that module pulls in all the Java sources.
function pinboard(card: ProjectCard): string {
  const notes = NOTE_IDS.map(noteLabel);
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

// kev.dev: this page as a storyboard, top to bottom — each section with a
// tiny drawing of itself and the reason it exists. Every frame is a real
// link to that section, so the card navigates the page it's part of.
function storyboard(_card: ProjectCard): string {
  const targets: [string, string][] = [
    ["#hero", "cloth"],
    ["#about", "elevator"],
    ["#projects", "bench"],
    ["#contact", "contact"],
    ["#impressum", "legal"],
  ];
  const frames = targets.map(([href, thumb], i) => [href, thumb, ...UI.vizStory[i]]);
  return `
    <ol class="viz-story">
      ${frames
        .map(
          ([href, thumb, name, why], i) => `
        <li>
          <a class="viz-frame" href="${href}">
            <span class="viz-thumb viz-thumb--${thumb}" aria-hidden="true"></span>
            <span class="viz-frame-text">
              <b><i>${String(i + 1).padStart(2, "0")}</i> ${name}</b>
              <span>${why}</span>
            </span>
            <span class="viz-frame-go" aria-hidden="true">${RTL ? "↖" : "↗"}</span>
          </a>
        </li>`,
        )
        .join("")}
    </ol>
  `;
}

// FaceDots: Kevin's face as live particles (face-dots-site.ts mounts
// them on the canvas); the button opens the tool.
function portrait(card: ProjectCard): string {
  return `
    <div class="viz-faces">
      <canvas class="viz-faces-canvas" data-face-dots aria-hidden="true"></canvas>
      <button class="viz-faces-open" type="button" data-card="${esc(card.id)}" data-facet="live-demo">${UI.vizFacesOpen}</button>
    </div>
  `;
}

// kev.dev's extra touch on its desktop card: a "you are here" pin — the card is the page you're on. Decoration only.
export function renderTouch(card: ProjectCard): string {
  switch (card.layout) {
    case "storyboard":
      return `<div class="pcard-touch touch-here" aria-hidden="true">${esc(UI.touchHere)}</div>`;
    default:
      return "";
  }
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
    case "terminal":
      return terminal(card);
    case "keys":
      return keys();
    case "pinboard":
      return pinboard(card);
    case "storyboard":
      return storyboard(card);
    case "portrait":
      return portrait(card);
  }
}
