// The engineering overlay itself (lazy chunk, see index.ts). Desktop: a
// panel sliding in from the right with flows on the left, the module graph
// in the middle and the open step on the right. LITE (phones, short
// screens): no graph, the same flows as a readable report.
//
// The graph is plain HTML buttons on a "stage" plus one SVG for the edges,
// both in the same coordinate system, moved and scaled together for zoom
// and pan. Positions come from the data (layer = column, order = row).

import "./engineering.css";
import { LANG, pick } from "../i18n";
import { LITE } from "../viewport";
import type { EngRoute } from "./index";
import type { EngFlow, EngNode, EngProject, EngStep, Text } from "./types";
import { yourbrand } from "./data/yourbrand";

const PROJECTS: EngProject[] = [yourbrand];

const UI = pick({
  de: {
    label: "Engineering",
    back: "zurück zur Seite",
    close: "Schließen",
    search: "Datei, Modul, Tabelle …",
    searchLabel: "In den Abläufen suchen",
    plain: "Einfach",
    dev: "Technisch",
    modeLabel: "Erklärung",
    flows: (n: number) => `${n} ${n === 1 ? "Ablauf" : "Abläufe"}`,
    steps: (n: number) => `${n} Schritte`,
    stepOf: (n: number, total: number) => `Schritt ${n} von ${total}`,
    files: "Dateien",
    why: "Warum so",
    prev: "Zurück",
    next: "Weiter",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    fit: "Alles zeigen",
    minimap: "Übersicht",
    noHit: "Kein Ablauf passt.",
    deOnly: "Die Abläufe gibt es bisher nur auf Deutsch.",
    repo: "Code auf GitHub",
  },
  en: {
    label: "Engineering",
    back: "back to the page",
    close: "Close",
    search: "File, module, table …",
    searchLabel: "Search the flows",
    plain: "Plain",
    dev: "Technical",
    modeLabel: "Explanation",
    flows: (n: number) => `${n} ${n === 1 ? "flow" : "flows"}`,
    steps: (n: number) => `${n} steps`,
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    files: "Files",
    why: "Why this way",
    prev: "Back",
    next: "Next",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Show all",
    minimap: "Overview",
    noHit: "No flow matches.",
    deOnly: "The flows are only available in German so far.",
    repo: "Code on GitHub",
  },
  ru: {
    label: "Engineering",
    back: "назад на страницу",
    close: "Закрыть",
    search: "Файл, модуль, таблица …",
    searchLabel: "Поиск по сценариям",
    plain: "Просто",
    dev: "Технически",
    modeLabel: "Объяснение",
    flows: (n: number) => `сценариев: ${n}`,
    steps: (n: number) => `шагов: ${n}`,
    stepOf: (n: number, total: number) => `Шаг ${n} из ${total}`,
    files: "Файлы",
    why: "Почему так",
    prev: "Назад",
    next: "Дальше",
    zoomIn: "Увеличить",
    zoomOut: "Уменьшить",
    fit: "Показать всё",
    minimap: "Обзор",
    noHit: "Ни один сценарий не подходит.",
    deOnly: "Сценарии пока есть только на немецком.",
    repo: "Код на GitHub",
  },
  ja: {
    label: "Engineering",
    back: "ページに戻る",
    close: "閉じる",
    search: "ファイル、モジュール、テーブル …",
    searchLabel: "フローを検索",
    plain: "かんたん",
    dev: "技術",
    modeLabel: "説明",
    flows: (n: number) => `フロー ${n}件`,
    steps: (n: number) => `${n}ステップ`,
    stepOf: (n: number, total: number) => `ステップ ${n} / ${total}`,
    files: "ファイル",
    why: "なぜこうしたか",
    prev: "戻る",
    next: "次へ",
    zoomIn: "拡大",
    zoomOut: "縮小",
    fit: "全体を表示",
    minimap: "全体図",
    noHit: "該当するフローはありません。",
    deOnly: "フローは今のところドイツ語のみです。",
    repo: "GitHubのコード",
  },
});

const t = (text: Text) => text[LANG] ?? text.de;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pad = (n: number) => String(n).padStart(2, "0");

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
    // storage blocked: the choice just won't persist
  }
}

// Shared with the graph pages (src/graph/main.ts), so the choice carries over.
const MODE_KEY = "graph-mode";
type Mode = "plain" | "dev";

// --- layout ----------------------------------------------------------------

const COL_W = 236;
const NODE_W = 184;
const NODE_H = 40;
const ROW_H = 60;
const HEAD_H = 44;
const PAD = 24;

// Flow path colors, pink at the first step to blue at the last (the
// mockup's gradient), one solid color per edge so vertical edges work too.
const FLOW_FROM = [0xff, 0x5f, 0xc8];
const FLOW_TO = [0x57, 0xb9, 0xff];
function flowColor(f: number): string {
  const c = FLOW_FROM.map((a, i) => Math.round(a + (FLOW_TO[i] - a) * f));
  return `rgb(${c.join(",")})`;
}

interface Placed {
  node: EngNode;
  x: number;
  y: number;
  color: string;
}

function place(p: EngProject): { placed: Map<string, Placed>; width: number; height: number } {
  const cols = p.layers.map((l) => p.nodes.filter((n) => n.layer === l.id));
  const rows = Math.max(...cols.map((c) => c.length));
  const height = HEAD_H + rows * ROW_H + PAD;
  const placed = new Map<string, Placed>();
  cols.forEach((col, ci) => {
    // Shorter columns sit centered against the tallest one.
    const top = HEAD_H + ((rows - col.length) * ROW_H) / 2;
    col.forEach((node, ri) =>
      placed.set(node.id, { node, x: PAD + ci * COL_W, y: top + ri * ROW_H, color: p.layers[ci].color }),
    );
  });
  return { placed, width: PAD * 2 + (p.layers.length - 1) * COL_W + NODE_W, height };
}

// Every consecutive step pair of every flow, once, on different nodes.
function edgesOf(p: EngProject): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const f of p.flows)
    for (let i = 1; i < f.steps.length; i++) {
      const a = f.steps[i - 1].node;
      const b = f.steps[i].node;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (a === b || seen.has(key)) continue;
      seen.add(key);
      out.push([a, b]);
    }
  return out;
}

// From the side of A facing B to the side of B facing A; two nodes in the
// same column get an arc out to the right.
function edgePath(a: Placed, b: Placed): string {
  const ay = a.y + NODE_H / 2;
  const by = b.y + NODE_H / 2;
  if (a.x === b.x) {
    const x = a.x + NODE_W;
    const bulge = 36 + Math.min(60, Math.abs(by - ay) / 4);
    return `M${x},${ay} C${x + bulge},${ay} ${x + bulge},${by} ${x},${by}`;
  }
  const forward = b.x > a.x;
  const ax = forward ? a.x + NODE_W : a.x;
  const bx = forward ? b.x : b.x + NODE_W;
  const mid = (ax + bx) / 2;
  return `M${ax},${ay} C${mid},${ay} ${mid},${by} ${bx},${by}`;
}

// --- tiny code coloring ----------------------------------------------------

const KEYWORDS: Record<string, RegExp> = {
  ts: /\b(async|await|const|let|return|if|else|throw|new|export|function|class|interface|for|of|try|catch|finally|import|from|private|readonly)\b/g,
  sql: /\b(SELECT|FROM|WHERE|AND|OR|NOT|EXISTS|JOIN|LEFT|ON|AS|WITH|CASE|WHEN|THEN|ELSE|END|ORDER BY|GROUP BY|LIMIT|SUM|COALESCE|GREATEST|IS|NULL|CREATE|FUNCTION|TABLE|POLICY|ALTER|INSERT|INTO|VALUES|BEGIN|IF|USING|DESC)\b/g,
};
const COMMENT: Record<string, RegExp> = {
  ts: /^(\s*)(\/\/.*)$/,
  sql: /^(\s*)(--.*)$/,
  yaml: /^(\s*)(#.*)$/,
  nginx: /^(\s*)(#.*)$/,
  json: /^$^/,
};

function colorCode(code: string, lang: string): string {
  const kw = KEYWORDS[lang];
  const cm = COMMENT[lang] ?? COMMENT.ts;
  return code
    .split("\n")
    .map((line) => {
      if (line === "…") return `<span class="eng-c">…</span>`;
      const m = cm.exec(line);
      if (m) return `${esc(m[1])}<span class="eng-c">${esc(m[2])}</span>`;
      // Strings first, then keywords only outside of them.
      return line
        .split(/('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")/)
        .map((part, i) =>
          i % 2
            ? `<span class="eng-s">${esc(part)}</span>`
            : kw
              ? esc(part).replace(kw, '<span class="eng-k">$1</span>')
              : esc(part),
        )
        .join("");
    })
    .join("\n");
}

// --- state -----------------------------------------------------------------

let root: HTMLElement | null = null;
let onClose: () => void = () => {};
let project: EngProject = PROJECTS[0];
let flow: EngFlow = project.flows[0];
let step = 0;
let mode: Mode = stored(MODE_KEY) === "plain" ? "plain" : "dev";
let query = "";
let returnFocus: HTMLElement | null = null;
let view = { x: 0, y: 0, k: 1 };
let layout = place(project);

function setHash() {
  history.replaceState(null, "", `#eng/${project.id}/${flow.id}/${step + 1}`);
}

// --- markup ----------------------------------------------------------------

function topBar(): string {
  return `
    <header class="eng-top">
      <span class="eng-brand">kev.dev<small>/ engineering</small></span>
      <nav class="eng-projects" aria-label="${esc(UI.label)}">
        ${PROJECTS.map(
          (p) =>
            `<button type="button" class="eng-chip" data-project="${p.id}" style="--c: ${p.accent}" aria-pressed="${p.id === project.id}"><i aria-hidden="true"></i>${esc(p.title)}<small>${p.flows.length}</small></button>`,
        ).join("")}
      </nav>
      ${
        LITE
          ? ""
          : `<label class="eng-search"><span class="eng-sr">${esc(UI.searchLabel)}</span><input type="search" data-search placeholder="${esc(UI.search)}" autocomplete="off" value="${esc(query)}" /></label>`
      }
      <div class="eng-mode" role="radiogroup" aria-label="${esc(UI.modeLabel)}">
        ${(["plain", "dev"] as Mode[])
          .map((m) => `<button type="button" role="radio" data-mode="${m}" aria-checked="${m === mode}">${esc(m === "plain" ? UI.plain : UI.dev)}</button>`)
          .join("")}
      </div>
      <button type="button" class="eng-x" data-close aria-label="${esc(UI.close)}">✕${LITE ? "" : " <span>Esc</span>"}</button>
    </header>`;
}

function legend(): string {
  return `<div class="eng-legend">${project.layers
    .map((l) => `<span><i style="background: ${l.color}"></i>${esc(t(l.label))}</span>`)
    .join("")}</div>`;
}

function flowList(): string {
  return `
    <span class="eng-h">${esc(project.title)} · ${esc(UI.flows(project.flows.length))}</span>
    <p class="eng-lead">${esc(t(project.lead))}</p>
    <ol class="eng-flows">
      ${project.flows
        .map(
          (f, i) => `
        <li><button type="button" data-flow="${f.id}" aria-current="${f.id === flow.id}">
          <span class="eng-fi">${pad(i + 1)}</span>
          <span class="eng-ft">${esc(t(f.title))}</span>
          <span class="eng-fn">${esc(UI.steps(f.steps.length))}</span>
        </button></li>`,
        )
        .join("")}
    </ol>
    <p class="eng-nohit" data-nohit hidden>${esc(UI.noHit)}</p>
    ${legend()}`;
}

function stage(): string {
  const { placed, width, height } = layout;
  const heads = project.layers
    .map(
      (l, i) =>
        `<span class="eng-colhead" style="left: ${PAD + i * COL_W}px; width: ${NODE_W}px; --c: ${l.color}">${esc(t(l.label))}</span>`,
    )
    .join("");
  const nodes = [...placed.values()]
    .map(
      ({ node, x, y, color }) =>
        `<button type="button" class="eng-node" data-node="${node.id}" style="left: ${x}px; top: ${y}px; width: ${NODE_W}px; height: ${NODE_H}px; --c: ${color}"><i aria-hidden="true"></i><span>${esc(t(node.label))}</span><b class="eng-badge" aria-hidden="true"></b></button>`,
    )
    .join("");
  return `
    <div class="eng-stage" data-stage style="width: ${width}px; height: ${height}px">
      <svg class="eng-edges" data-edges width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <defs><marker id="eng-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker></defs>
        <g data-base></g><g data-flowedges></g>
      </svg>
      ${heads}
      ${nodes}
    </div>`;
}

function minimap(): string {
  const { placed, width, height } = layout;
  return `
    <button type="button" class="eng-mini" data-mini aria-label="${esc(UI.minimap)}">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        ${[...placed.values()]
          .map(({ node, x, y, color }) => `<rect data-mini-node="${node.id}" x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="20" fill="${color}" />`)
          .join("")}
        <rect class="eng-mini-view" data-mini-view x="0" y="0" width="${width}" height="${height}" />
      </svg>
    </button>`;
}

function filesOf(s: EngStep): string[] {
  const code = s.code ? project.code[s.code] : undefined;
  return [...new Set([...(code ? [code.file] : []), ...(s.files ?? [])])];
}

function fileLink(path: string): string {
  const kind = path.endsWith("/") ? "tree" : "blob";
  const href = `${project.repoUrl}/${kind}/${project.commit}/${path}`;
  return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(path)} ↗</a>`;
}

function codeBlock(s: EngStep): string {
  if (!s.code) return "";
  const c = project.code[s.code];
  const first = /^(\d+)(?:–(\d+))?/.exec(c.lines)!;
  const anchor = `#L${first[1]}${first[2] ? `-L${first[2]}` : ""}`;
  const href = `${project.repoUrl}/blob/${project.commit}/${c.file}${anchor}`;
  return `
    <figure class="eng-code">
      <figcaption><a href="${esc(href)}" target="_blank" rel="noopener">${esc(c.file)} · ${esc(c.lines)} ↗</a></figcaption>
      <pre><code>${colorCode(c.code, c.lang)}</code></pre>
    </figure>`;
}

function stepBody(s: EngStep, i: number, total: number, heading: "h2" | "h4"): string {
  return `
    <${heading} class="eng-st"><b>${pad(i + 1)}</b>${esc(t(s.title))}</${heading}>
    <p class="eng-plain">${esc(t(s.plain))}</p>
    ${
      mode === "dev"
        ? `<p class="eng-dev">${esc(t(s.dev))}</p>
           ${codeBlock(s)}
           <div class="eng-files"><span class="eng-h">${esc(UI.files)}</span>${filesOf(s).map(fileLink).join("")}</div>`
        : ""
    }
    ${s.why ? `<div class="eng-why"><b>${esc(UI.why)}</b>${esc(t(s.why))}</div>` : ""}
    <span class="eng-sr">${esc(UI.stepOf(i + 1, total))}</span>`;
}

function detail(): string {
  const s = flow.steps[step];
  const total = flow.steps.length;
  const prev = flow.steps[step - 1];
  const next = flow.steps[step + 1];
  return `
    <span class="eng-crumb">${esc(project.title)} › ${esc(t(flow.title))} › ${esc(UI.stepOf(step + 1, total))}</span>
    ${stepBody(s, step, total, "h2")}
    <div class="eng-pager">
      ${prev ? `<button type="button" data-go="${step - 1}">← ${pad(step)} ${esc(t(prev.title))}</button>` : "<span></span>"}
      ${next ? `<button type="button" class="eng-next" data-go="${step + 1}">${pad(step + 2)} ${esc(t(next.title))} →</button>` : ""}
    </div>`;
}

function stepBar(): string {
  return flow.steps
    .map(
      (s, i) =>
        `<li><button type="button" data-go="${i}" aria-current="${i === step}" title="${esc(t(s.title))}"><b>${i + 1}</b><span>${esc(t(s.title))}</span></button></li>`,
    )
    .join("");
}

function desktop(): string {
  return `
    <button type="button" class="eng-back" data-close><span>← ${esc(UI.back)} · Esc</span></button>
    <section class="eng-panel" role="dialog" aria-modal="true" aria-label="${esc(UI.label)}" tabindex="-1">
      ${topBar()}
      ${LANG !== "de" ? `<p class="eng-lang">${esc(UI.deOnly)}</p>` : ""}
      <div class="eng-body">
        <aside class="eng-side" data-side>${flowList()}</aside>
        <div class="eng-canvas" data-canvas>
          ${stage()}
          <div class="eng-zoom">
            <button type="button" data-zoom="in" aria-label="${esc(UI.zoomIn)}">+</button>
            <button type="button" data-zoom="out" aria-label="${esc(UI.zoomOut)}">−</button>
            <button type="button" data-zoom="fit" aria-label="${esc(UI.fit)}">⤢</button>
          </div>
          ${minimap()}
          <ol class="eng-steps" data-steps>${stepBar()}</ol>
        </div>
        <aside class="eng-detail" data-detail aria-live="polite">${detail()}</aside>
      </div>
    </section>`;
}

function report(): string {
  return `
    <section class="eng-panel eng-report" role="dialog" aria-modal="true" aria-label="${esc(UI.label)}" tabindex="-1">
      ${topBar()}
      ${LANG !== "de" ? `<p class="eng-lang">${esc(UI.deOnly)}</p>` : ""}
      <div class="eng-scroll" data-scroll>
        <p class="eng-lead">${esc(t(project.lead))}</p>
        <nav class="eng-toc"><ol>${project.flows
          .map((f, i) => `<li><a href="#eng/${project.id}/${f.id}" data-flow="${f.id}">${pad(i + 1)} ${esc(t(f.title))}</a></li>`)
          .join("")}</ol></nav>
        ${project.flows
          .map(
            (f, fi) => `
          <section class="eng-rflow" id="eng-flow-${f.id}">
            <h3><span>${pad(fi + 1)}</span>${esc(t(f.title))}</h3>
            <ol class="eng-rsteps">${f.steps
              .map((s, i) => `<li>${stepBody(s, i, f.steps.length, "h4")}</li>`)
              .join("")}</ol>
          </section>`,
          )
          .join("")}
      </div>
    </section>`;
}

// --- rendering ---------------------------------------------------------------

function q<T extends Element = HTMLElement>(sel: string): T | null {
  return root!.querySelector<T>(sel);
}

function matches(f: EngFlow): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    t(f.title).toLowerCase().includes(needle) ||
    f.steps.some((s) =>
      [t(s.title), t(s.plain), t(s.dev), ...filesOf(s), s.code ? project.code[s.code].code : "", t(nodeById(s.node)!.label)]
        .join("\n")
        .toLowerCase()
        .includes(needle),
    )
  );
}

function nodeById(id: string): EngNode | undefined {
  return project.nodes.find((n) => n.id === id);
}

function drawGraph() {
  const { placed } = layout;
  const base = q("[data-base]")!;
  base.innerHTML = edgesOf(project)
    .map(([a, b]) => `<path class="eng-e" d="${edgePath(placed.get(a)!, placed.get(b)!)}" />`)
    .join("");

  const steps = flow.steps;
  const out: string[] = [];
  for (let i = 1; i < steps.length; i++) {
    const a = placed.get(steps[i - 1].node)!;
    const b = placed.get(steps[i].node)!;
    if (a === b) continue;
    const color = flowColor(steps.length > 2 ? (i - 1) / (steps.length - 2) : 0);
    const cls = i === step || i - 1 === step ? " eng-e-near" : "";
    out.push(`<path class="eng-e eng-e-flow${cls}" style="stroke: ${color}" marker-end="url(#eng-arrow)" d="${edgePath(a, b)}" />`);
  }
  q("[data-flowedges]")!.innerHTML = out.join("");

  // Badges: a node visited more than once in this flow shows every number.
  const numbers = new Map<string, number[]>();
  steps.forEach((s, i) => numbers.set(s.node, [...(numbers.get(s.node) ?? []), i + 1]));
  const hits = new Set(query ? project.nodes.filter((n) => t(n.label).toLowerCase().includes(query.toLowerCase())).map((n) => n.id) : []);
  root!.querySelectorAll<HTMLElement>(".eng-node").forEach((el) => {
    const id = el.dataset.node!;
    const nums = numbers.get(id);
    el.classList.toggle("is-on", Boolean(nums));
    el.classList.toggle("is-sel", steps[step].node === id);
    el.classList.toggle("is-hit", hits.has(id));
    el.querySelector(".eng-badge")!.textContent = nums ? nums.join("·") : "";
  });
  root!.querySelectorAll<SVGRectElement>("[data-mini-node]").forEach((r) => {
    r.classList.toggle("is-on", numbers.has(r.dataset.miniNode!));
  });
}

function renderSide() {
  root!.querySelectorAll<HTMLButtonElement>("[data-flow]").forEach((b) => {
    const f = project.flows.find((x) => x.id === b.dataset.flow)!;
    b.setAttribute("aria-current", String(f.id === flow.id));
    b.closest("li")!.classList.toggle("is-dim", !matches(f));
  });
  const any = project.flows.some(matches);
  q("[data-nohit]")?.toggleAttribute("hidden", any);
}

function renderStep() {
  q("[data-detail]")!.innerHTML = detail();
  q("[data-steps]")!.innerHTML = stepBar();
  drawGraph();
  setHash();
}

// Whole panel: on open, project switch and mode switch.
function renderAll() {
  layout = place(project);
  root!.innerHTML = LITE ? report() : desktop();
  if (!LITE) {
    wirePan(q("[data-canvas]")!);
    renderSide();
    drawGraph();
    focusFlow();
  }
  setHash();
}

// --- zoom and pan --------------------------------------------------------------

function applyView() {
  const el = q("[data-stage]");
  if (!el) return;
  el.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;
  const canvas = q("[data-canvas]")!.getBoundingClientRect();
  const mv = q<SVGRectElement>("[data-mini-view]")!;
  mv.setAttribute("x", String(-view.x / view.k));
  mv.setAttribute("y", String(-view.y / view.k));
  mv.setAttribute("width", String(canvas.width / view.k));
  mv.setAttribute("height", String(canvas.height / view.k));
}

// The usable area leaves room for the step bar at the bottom.
function usable(): DOMRect {
  const r = q("[data-canvas]")!.getBoundingClientRect();
  const bar = q("[data-steps]")!.getBoundingClientRect();
  return new DOMRect(0, 0, r.width, Math.max(120, bar.top - r.top - 8));
}

function fit() {
  const area = usable();
  const k = Math.min(1.1, (area.width - 32) / layout.width, (area.height - 16) / layout.height);
  view = { k, x: (area.width - layout.width * k) / 2, y: Math.max(8, (area.height - layout.height * k) / 2) };
  applyView();
}

// Zoom to the open flow's nodes, never smaller than the whole graph.
function focusFlow() {
  const area = usable();
  const pts = flow.steps.map((s) => layout.placed.get(s.node)!);
  const x0 = Math.min(...pts.map((p) => p.x)) - 40;
  const y0 = Math.min(...pts.map((p) => p.y)) - 40;
  const x1 = Math.max(...pts.map((p) => p.x)) + NODE_W + 90;
  const y1 = Math.max(...pts.map((p) => p.y)) + NODE_H + 40;
  const all = Math.min((area.width - 32) / layout.width, (area.height - 16) / layout.height);
  const k = Math.max(all, Math.min(1.15, area.width / (x1 - x0), area.height / (y1 - y0)));
  view = { k, x: area.width / 2 - ((x0 + x1) / 2) * k, y: area.height / 2 - ((y0 + y1) / 2) * k };
  applyView();
}

function zoomAt(factor: number, cx: number, cy: number) {
  const k = Math.min(2.5, Math.max(0.35, view.k * factor));
  view = { k, x: cx - ((cx - view.x) * k) / view.k, y: cy - ((cy - view.y) * k) / view.k };
  applyView();
}

// Keep the selected node in view when a step moves off-screen.
function reveal(nodeId: string) {
  const p = layout.placed.get(nodeId);
  if (!p) return;
  const area = usable();
  const x = view.x + p.x * view.k;
  const y = view.y + p.y * view.k;
  const w = NODE_W * view.k;
  const h = NODE_H * view.k;
  if (x >= 8 && y >= 8 && x + w <= area.width - 8 && y + h <= area.height - 8) return;
  view = { ...view, x: area.width / 2 - (p.x + NODE_W / 2) * view.k, y: area.height / 2 - (p.y + NODE_H / 2) * view.k };
  applyView();
}

// --- actions ---------------------------------------------------------------------

function goStep(i: number) {
  step = Math.max(0, Math.min(flow.steps.length - 1, i));
  renderStep();
  reveal(flow.steps[step].node);
}

function goFlow(id: string, i = 0) {
  flow = project.flows.find((f) => f.id === id) ?? project.flows[0];
  step = Math.max(0, i);
  renderSide();
  renderStep();
  focusFlow();
}

function onClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>(
    "[data-close],[data-project],[data-mode],[data-flow],[data-go],[data-node],[data-zoom],[data-mini]",
  );
  if (!el) return;
  const d = el.dataset;
  if (d.close !== undefined) return onClose();
  if (d.project) {
    project = PROJECTS.find((p) => p.id === d.project) ?? project;
    flow = project.flows[0];
    step = 0;
    return renderAll();
  }
  if (d.mode) {
    mode = d.mode as Mode;
    store(MODE_KEY, mode);
    if (LITE) {
      const scroll = q("[data-scroll]")!;
      const top = scroll.scrollTop;
      renderAll();
      q("[data-scroll]")!.scrollTop = top;
    } else {
      root!.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b === el)));
      q("[data-detail]")!.innerHTML = detail();
    }
    return;
  }
  if (d.flow) {
    if (LITE) {
      e.preventDefault();
      document.getElementById(`eng-flow-${d.flow}`)?.scrollIntoView({ block: "start" });
      return;
    }
    return goFlow(d.flow);
  }
  if (d.go !== undefined) return goStep(Number(d.go));
  if (d.node) {
    // A node on the open flow jumps to its (first) step there; any other
    // node opens the first flow that passes through it.
    const here = flow.steps.findIndex((s) => s.node === d.node);
    if (here >= 0) return goStep(here);
    const other = project.flows.find((f) => f.steps.some((s) => s.node === d.node));
    if (other) goFlow(other.id, other.steps.findIndex((s) => s.node === d.node));
    return;
  }
  if (d.zoom) {
    const area = usable();
    if (d.zoom === "fit") return fit();
    return zoomAt(d.zoom === "in" ? 1.25 : 0.8, area.width / 2, area.height / 2);
  }
  if (d.mini !== undefined) {
    // Click on the minimap centers the graph on that point.
    const box = el.getBoundingClientRect();
    const s = Math.min(box.width / layout.width, box.height / layout.height);
    const ox = (box.width - layout.width * s) / 2;
    const oy = (box.height - layout.height * s) / 2;
    const gx = (e.clientX - box.left - ox) / s;
    const gy = (e.clientY - box.top - oy) / s;
    const area = usable();
    view = { ...view, x: area.width / 2 - gx * view.k, y: area.height / 2 - gy * view.k };
    applyView();
  }
}

function onKey(e: KeyboardEvent) {
  if (!root || root.hidden) return;
  if (e.key === "Escape") {
    e.preventDefault();
    return onClose();
  }
  if (LITE || (e.target as HTMLElement).closest("input")) return;
  if (e.key === "ArrowRight") goStep(step + 1);
  else if (e.key === "ArrowLeft") goStep(step - 1);
}

function wirePan(canvas: HTMLElement) {
  let drag: { x: number; y: number; vx: number; vy: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-panning");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    view = { ...view, x: drag.vx + e.clientX - drag.x, y: drag.vy + e.clientY - drag.y };
    applyView();
  });
  const end = () => {
    drag = null;
    canvas.classList.remove("is-panning");
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    },
    { passive: false },
  );
}

function wire() {
  root!.addEventListener("click", onClick);
  root!.addEventListener("input", (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>("[data-search]");
    if (!input) return;
    query = input.value.trim();
    renderSide();
    drawGraph();
  });
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (root && !root.hidden && !LITE) focusFlow();
  });
}

// --- public ------------------------------------------------------------------

export function show(route: EngRoute, close: () => void) {
  onClose = close;
  const first = !root;
  if (first) {
    root = document.createElement("div");
    root.className = "eng";
    // Lenis is stopped while this is open, and a stopped Lenis swallows
    // wheel/touch everywhere; this opts the overlay out of that.
    root.setAttribute("data-lenis-prevent", "");
    root.hidden = true;
    document.body.appendChild(root);
    wire();
  }
  const wasHidden = root!.hidden;
  if (wasHidden) returnFocus = document.activeElement as HTMLElement | null;

  const p = PROJECTS.find((x) => x.id === route.project) ?? PROJECTS[0];
  const f = p.flows.find((x) => x.id === route.flow) ?? p.flows[0];
  const sameView = !wasHidden && p === project && f === flow;
  project = p;
  flow = f;
  step = Math.min(route.step, f.steps.length - 1);

  root!.hidden = false;
  if (wasHidden) {
    root!.classList.remove("is-leaving");
    root!.classList.add("is-entering");
    document.documentElement.classList.add("eng-open");
    renderAll();
    root!.querySelector<HTMLElement>(".eng-panel")?.focus();
    window.setTimeout(() => root?.classList.remove("is-entering"), 500);
  } else if (sameView) {
    renderStep();
  } else {
    renderAll();
  }
  if (LITE && route.flow) document.getElementById(`eng-flow-${f.id}`)?.scrollIntoView({ block: "start" });
}

export function hide() {
  if (!root || root.hidden) return;
  const el = root;
  el.classList.add("is-leaving");
  document.documentElement.classList.remove("eng-open");
  window.setTimeout(() => {
    el.hidden = true;
    el.classList.remove("is-leaving");
  }, 300);
  returnFocus?.focus({ preventScroll: true });
}
