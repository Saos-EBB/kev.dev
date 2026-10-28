// One highlight graph per page (graph/yourbrand.html, tschobbo.html,
// kevdev.html — the project comes from <body data-graph>). The graph is
// plain HTML: every layer a lane, every node a button in it, so it wraps
// and reads like the rest of the site on any width. The edges are an SVG
// drawn over it from the boxes' measured positions, redrawn whenever the
// layout moves. No framework, no graph library.

import "@fontsource-variable/jetbrains-mono";
import "../style.css";
import "../reading.css";
import "../i18n/i18n.css";
import "./graph.css";
import { LANG, LANG_AI } from "../i18n";
import { GUI } from "./ui-text";
import type { GraphNode, GraphProject, Text } from "./types";
import { yourbrand } from "./data/yourbrand";
import { tschobbo } from "./data/tschobbo";
import { kevdev } from "./data/kevdev";

const PROJECTS: GraphProject[] = [yourbrand, tschobbo, kevdev];

const t = (text: Text) => text[LANG] ?? text.de;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same keys the main page uses, so theme and view follow the visitor.
function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage blocked — the choice just won't persist
  }
}

if (stored("theme") === "light") document.documentElement.setAttribute("data-theme", "light");

type Mode = "plain" | "dev";
const MODE_KEY = "graph-mode";

const project = PROJECTS.find((p) => p.id === document.body.dataset.graph) ?? PROJECTS[0];
const nodeById = new Map(project.nodes.map((n) => [n.id, n]));
const layerById = new Map(project.layers.map((l) => [l.id, l]));

let mode: Mode = stored(MODE_KEY) === "dev" ? "dev" : "plain";
let selected: string | null = null;
let tour: { id: string; step: number } | null = null;
let query = "";

document.title = `${project.title} · Graph — Kevin Schaberl`;
document.body.style.setProperty("--pc", project.accent);

// --- markup ------------------------------------------------------------

function header(): string {
  return `
    <header class="g-head">
      <nav class="g-nav" aria-label="${esc(GUI.graphs)}">
        <a class="g-back" href="/#projects">← ${esc(GUI.back)}</a>
        <ul class="g-switch">
          ${PROJECTS.map(
            (p) =>
              `<li><a href="/graph/${p.id}.html" style="--pc: ${p.accent}"${p.id === project.id ? ' aria-current="page"' : ""}>${esc(p.title)}</a></li>`,
          ).join("")}
        </ul>
      </nav>
      <div class="g-title-row">
        <h1 class="g-title">${esc(project.title)}</h1>
        <p class="g-lead">${esc(t(project.lead))}</p>
      </div>
      <div class="g-tools">
        <label class="g-search">
          <span class="g-sr">${esc(GUI.search)}</span>
          <input id="g-search" type="search" placeholder="${esc(GUI.searchPlaceholder)}" autocomplete="off" />
        </label>
        <div class="g-mode" role="radiogroup" aria-label="${esc(GUI.modeLabel)}">
          ${(["plain", "dev"] as Mode[])
            .map(
              (m) =>
                `<button type="button" role="radio" data-mode="${m}" aria-checked="${m === mode}" title="${esc(m === "plain" ? GUI.modePlainHint : GUI.modeDevHint)}">${esc(m === "plain" ? GUI.modePlain : GUI.modeDev)}</button>`,
            )
            .join("")}
        </div>
        <div class="g-tours" aria-label="${esc(GUI.tours)}">
          ${project.tours
            .map((tr) => `<button type="button" data-tour="${tr.id}"><span aria-hidden="true">▶</span> ${esc(t(tr.title))}</button>`)
            .join("")}
        </div>
      </div>
    </header>`;
}

function lanes(): string {
  return project.layers
    .map((layer) => {
      const nodes = project.nodes.filter((n) => n.layer === layer.id);
      return `
      <section class="g-lane" style="--lc: ${layer.color}" aria-label="${esc(t(layer.label))}">
        <h2 class="g-lane-label">${esc(t(layer.label))}</h2>
        <div class="g-lane-nodes">
          ${nodes
            .map(
              (n) =>
                `<button type="button" class="g-node" data-node="${n.id}" aria-pressed="false"><span class="g-node-title">${esc(t(n.title))}</span><span class="g-node-file">${esc(n.files[0] ?? n.privateFiles?.[0] ?? "")}</span></button>`,
            )
            .join("")}
        </div>
      </section>`;
    })
    .join("");
}

document.body.innerHTML = `
  ${header()}
  <main class="g-main">
    <div class="g-graph" id="g-graph">
      <svg class="g-edges" id="g-edges" aria-hidden="true"></svg>
      ${lanes()}
      <p class="g-nomatch" id="g-nomatch" hidden>${esc(GUI.noMatch)}</p>
    </div>
    <aside class="g-panel" id="g-panel" aria-live="polite"></aside>
  </main>
  ${LANG_AI ? `<p class="g-ai">${esc(GUI.aiNote)}</p>` : ""}
`;

const graphEl = document.getElementById("g-graph")!;
const svg = document.getElementById("g-edges") as unknown as SVGSVGElement;
const panel = document.getElementById("g-panel")!;
const nodeEls = new Map(
  [...graphEl.querySelectorAll<HTMLButtonElement>(".g-node")].map((el) => [el.dataset.node!, el]),
);

// --- edges ---------------------------------------------------------------

// From the bottom of the upper box to the top of the lower one; two boxes
// in the same lane get an arc over the top instead.
function drawEdges() {
  const box = graphEl.getBoundingClientRect();
  svg.setAttribute("width", String(box.width));
  svg.setAttribute("height", String(box.height));
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  const paths = project.edges.map((e, i) => {
    const a = nodeEls.get(e.from)?.getBoundingClientRect();
    const b = nodeEls.get(e.to)?.getBoundingClientRect();
    if (!a || !b) return "";
    const ax = a.left + a.width / 2 - box.left;
    const bx = b.left + b.width / 2 - box.left;
    let d: string;
    if (Math.abs(a.top - b.top) < 4) {
      // Same row: neighbours get a short straight link between their
      // facing sides; farther apart, a low arc that stays in the gap
      // above the row (never up into the lane or toolbar above).
      const [l, r] = a.left < b.left ? [a, b] : [b, a];
      const y = l.top + l.height / 2 - box.top;
      if (r.left - l.right < 40) {
        d = `M ${l.right - box.left} ${y} L ${r.left - box.left} ${y}`;
      } else {
        const top = a.top - box.top;
        const lift = Math.min(22, 10 + Math.abs(bx - ax) / 20);
        d = `M ${ax} ${top} C ${ax} ${top - lift}, ${bx} ${top - lift}, ${bx} ${top}`;
      }
    } else {
      const down = a.top < b.top;
      const ay = (down ? a.bottom : a.top) - box.top;
      const by = (down ? b.top : b.bottom) - box.top;
      const mid = (ay + by) / 2;
      d = `M ${ax} ${ay} C ${ax} ${mid}, ${bx} ${mid}, ${bx} ${by}`;
    }
    return `<path d="${d}" data-edge="${i}" data-from="${e.from}" data-to="${e.to}" />`;
  });
  svg.innerHTML = paths.join("");
  paint();
}

new ResizeObserver(() => drawEdges()).observe(graphEl);
document.fonts?.ready.then(drawEdges);

// --- state → classes -----------------------------------------------------

function neighbors(id: string): Set<string> {
  const out = new Set<string>();
  for (const e of project.edges) {
    if (e.from === id) out.add(e.to);
    if (e.to === id) out.add(e.from);
  }
  return out;
}

function matches(n: GraphNode): boolean {
  if (!query) return true;
  const hay = [t(n.title), t(n.plain), t(n.dev), ...n.files, ...(n.privateFiles ?? [])].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word));
}

// The tour's path so far: its steps up to the current one, and the edges
// between consecutive steps.
function tourTrail(): { nodes: Set<string>; pairs: Set<string> } {
  const nodes = new Set<string>();
  const pairs = new Set<string>();
  if (!tour) return { nodes, pairs };
  const steps = project.tours.find((tr) => tr.id === tour!.id)!.steps.slice(0, tour.step + 1);
  steps.forEach((s, i) => {
    nodes.add(s);
    if (i > 0) pairs.add(`${steps[i - 1]}>${s}`).add(`${s}>${steps[i - 1]}`);
  });
  return { nodes, pairs };
}

let hovered: string | null = null;

function paint() {
  const focus = hovered ?? selected;
  const near = focus ? neighbors(focus) : new Set<string>();
  const trail = tourTrail();
  let shown = 0;
  for (const [id, el] of nodeEls) {
    const n = nodeById.get(id)!;
    const hit = matches(n);
    if (hit) shown++;
    el.classList.toggle("is-dim", !hit || (!!focus && id !== focus && !near.has(id) && !trail.nodes.has(id)));
    el.classList.toggle("is-near", near.has(id));
    el.classList.toggle("is-trail", trail.nodes.has(id));
    el.setAttribute("aria-pressed", String(id === selected));
  }
  document.getElementById("g-nomatch")!.hidden = shown > 0;
  svg.querySelectorAll<SVGPathElement>("path").forEach((p) => {
    const { from, to } = p.dataset;
    const on = !!focus && (from === focus || to === focus);
    const inTrail = trail.pairs.has(`${from}>${to}`);
    p.classList.toggle("is-on", on);
    p.classList.toggle("is-trail", inTrail);
    p.classList.toggle("is-dim", (!!focus || tour !== null) && !on && !inTrail);
  });
}

// --- panel ---------------------------------------------------------------

function fileLinks(n: GraphNode): string {
  const pub = n.files.map(
    (f) =>
      `<li><a href="${esc(project.repoBlob + f)}" target="_blank" rel="noopener noreferrer">${esc(f)} ↗</a></li>`,
  );
  const priv = (n.privateFiles ?? []).map((f) => `<li><span>${esc(f)}</span> <small>${esc(GUI.privateFile)}</small></li>`);
  return [...pub, ...priv].join("");
}

function nodePanel(n: GraphNode): string {
  const layer = layerById.get(n.layer)!;
  const links = project.edges
    .filter((e) => e.from === n.id || e.to === n.id)
    .map((e) => {
      const other = nodeById.get(e.from === n.id ? e.to : e.from)!;
      const dir = e.from === n.id ? "→" : "←";
      return `<li><button type="button" data-goto="${other.id}"><span>${dir} ${esc(t(other.title))}</span>${e.label && mode === "dev" ? `<small>${esc(t(e.label))}</small>` : ""}</button></li>`;
    })
    .join("");
  return `
    <p class="g-p-layer" style="--lc: ${layer.color}">${esc(t(layer.label))}</p>
    <h2 class="g-p-title">${esc(t(n.title))}</h2>
    <p class="g-p-text">${esc(t(mode === "dev" ? n.dev : n.plain))}</p>
    ${mode === "dev" && (n.files.length || n.privateFiles?.length) ? `<h3 class="g-p-h">${esc(GUI.files)}</h3><ul class="g-p-files">${fileLinks(n)}</ul>` : ""}
    ${links ? `<h3 class="g-p-h">${esc(GUI.connections)}</h3><ul class="g-p-links">${links}</ul>` : ""}
    ${n.card ? `<p><a class="g-p-card" href="/#projects">${esc(GUI.toCard)} →</a></p>` : ""}`;
}

function renderPanel() {
  const closeBtn = `<button type="button" class="g-p-close" data-close aria-label="${esc(GUI.close)}">×</button>`;
  if (tour) {
    const tr = project.tours.find((x) => x.id === tour!.id)!;
    const n = nodeById.get(tr.steps[tour.step])!;
    const last = tour.step === tr.steps.length - 1;
    panel.innerHTML = `
      ${closeBtn}
      <div class="g-p-tour">
        <p class="g-p-tour-name"><span aria-hidden="true">▶</span> ${esc(t(tr.title))}</p>
        ${tour.step === 0 ? `<p class="g-p-tour-intro">${esc(t(tr.intro))}</p>` : ""}
        <ol class="g-p-steps" aria-label="${esc(GUI.tourStep(tour.step + 1, tr.steps.length))}">
          ${tr.steps.map((_, i) => `<li class="${i < tour!.step ? "is-done" : i === tour!.step ? "is-on" : ""}"></li>`).join("")}
        </ol>
        <p class="g-p-step">${esc(GUI.tourStep(tour.step + 1, tr.steps.length))}</p>
      </div>
      ${nodePanel(n)}
      <div class="g-p-tour-nav">
        <button type="button" data-tour-prev ${tour.step === 0 ? "disabled" : ""}>← ${esc(GUI.tourPrev)}</button>
        <button type="button" data-tour-next class="is-primary">${esc(last ? GUI.tourDone : GUI.tourNext)} ${last ? "" : "→"}</button>
      </div>`;
  } else if (selected) {
    panel.innerHTML = closeBtn + nodePanel(nodeById.get(selected)!);
  } else {
    panel.innerHTML = `
      <h2 class="g-p-title">${esc(GUI.idleTitle)}</h2>
      <p class="g-p-text">${esc(GUI.idleText)}</p>
      <p class="g-p-stats">${esc(GUI.stats(project.nodes.length, project.edges.length))}</p>
      <ul class="g-p-tourlist">
        ${project.tours.map((tr) => `<li><button type="button" data-tour="${tr.id}"><b>▶ ${esc(t(tr.title))}</b><span>${esc(t(tr.intro))}</span></button></li>`).join("")}
      </ul>
      <p class="g-p-repo"><a href="${esc(project.repoBlob.replace(/\/blob\/[^/]+\/$/, ""))}" target="_blank" rel="noopener noreferrer">${esc(project.repoLabel)} ↗</a></p>`;
  }
  panel.classList.toggle("is-open", !!(selected || tour));
  document.body.classList.toggle("has-panel", !!(selected || tour));
}

// --- actions -------------------------------------------------------------

function select(id: string | null, scroll = false) {
  selected = id;
  if (id && scroll) nodeEls.get(id)?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  try {
    history.replaceState(null, "", id ? `#${id}` : location.pathname);
  } catch {
    // sandboxed history — the deep link just doesn't update
  }
  renderPanel();
  paint();
}

function startTour(id: string) {
  tour = { id, step: 0 };
  goTourStep();
}

function goTourStep() {
  const tr = project.tours.find((x) => x.id === tour!.id)!;
  select(tr.steps[tour!.step], true);
}

function endTour() {
  tour = null;
  select(null);
}

document.addEventListener("click", (e) => {
  const el = e.target as Element;
  const node = el.closest<HTMLElement>("[data-node]");
  if (node) {
    if (tour) tour = null;
    select(selected === node.dataset.node ? null : node.dataset.node!);
    return;
  }
  const go = el.closest<HTMLElement>("[data-goto]");
  if (go) {
    if (tour) tour = null;
    select(go.dataset.goto!, true);
    return;
  }
  const tb = el.closest<HTMLElement>("[data-tour]");
  if (tb) return startTour(tb.dataset.tour!);
  if (el.closest("[data-tour-next]")) {
    const tr = project.tours.find((x) => x.id === tour!.id)!;
    if (tour!.step >= tr.steps.length - 1) return endTour();
    tour!.step++;
    return goTourStep();
  }
  if (el.closest("[data-tour-prev]") && tour && tour.step > 0) {
    tour.step--;
    return goTourStep();
  }
  if (el.closest("[data-close]")) return tour ? endTour() : select(null);
  const m = el.closest<HTMLElement>("[data-mode]");
  if (m) {
    mode = m.dataset.mode as Mode;
    store(MODE_KEY, mode);
    document.querySelectorAll<HTMLElement>("[data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b === m)));
    document.body.dataset.mode = mode;
    renderPanel();
  }
});

graphEl.addEventListener("pointerover", (e) => {
  const node = (e.target as Element).closest<HTMLElement>("[data-node]");
  const id = node?.dataset.node ?? null;
  if (id === hovered) return;
  hovered = id;
  paint();
});
graphEl.addEventListener("pointerleave", () => {
  hovered = null;
  paint();
});

document.getElementById("g-search")!.addEventListener("input", (e) => {
  query = (e.target as HTMLInputElement).value.trim();
  paint();
});
document.getElementById("g-search")!.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const first = project.nodes.find(matches);
  if (first) select(first.id, true);
});

document.addEventListener("keydown", (e) => {
  if ((e.target as Element).closest("input")) return;
  if (e.key === "Escape") return tour ? endTour() : select(null);
  if (!tour) return;
  if (e.key === "ArrowRight") (document.querySelector("[data-tour-next]") as HTMLElement | null)?.click();
  if (e.key === "ArrowLeft") (document.querySelector("[data-tour-prev]") as HTMLElement | null)?.click();
});

// --- start ---------------------------------------------------------------

document.body.dataset.mode = mode;
const deep = location.hash.slice(1);
selected = nodeById.has(deep) ? deep : null;
renderPanel();
drawEdges();
if (selected) requestAnimationFrame(() => nodeEls.get(selected!)?.scrollIntoView({ block: "center" }));
