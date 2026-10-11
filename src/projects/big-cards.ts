// The three big projects' desktop cards. Instead of the shared chrome
// (visual + Why?/Learned!/Code teaser boxes), each gets a structure of its
// own built from the same card data — YourBrand reads as its data model.
// Phone list and sheet keep the shared layout (project-cards.ts).

import { cardBodies, esc, TENANT_MODULES, type Detail, type MailFolder, type ProjectCard, type TenantModule } from "./project-cards";
import { blueprint } from "./project-visuals";
import { LANG } from "../i18n";
import { UI } from "../i18n/ui";
import "./big-cards.css";

// Crow's-foot ends for the relation lines between entities.
const ONE = (x: number) => `<line x1="${x}" y1="13" x2="${x}" y2="27" /><line x1="${x + 5}" y1="13" x2="${x + 5}" y2="27" />`;
const MANY_RIGHT = `<line x1="38" y1="12" x2="38" y2="28" /><line x1="42" y1="20" x2="52" y2="10" /><line x1="42" y1="20" x2="52" y2="30" />`;
const MANY_LEFT = `<line x1="14" y1="12" x2="14" y2="28" /><line x1="10" y1="20" x2="0" y2="10" /><line x1="10" y1="20" x2="0" y2="30" />`;

function relation(ends: string, label: string): string {
  return `
    <div class="er-rel" aria-hidden="true">
      <svg viewBox="0 0 52 40"><line x1="0" y1="20" x2="52" y2="20" />${ends}</svg>
      <span>${label}</span>
    </div>`;
}

// One attribute row. Its text isn't in the table: picking the row shows it
// in the detail box under the diagram, so the tables stay as tall as their
// rows and the text gets the card's full width.
// `viz`: the chart beside the text, largest first — the first that fits
// the free space is shown (initBigCards), smaller ones are the fallbacks.
type ErRow = { key?: string; swatch?: string; attr: string; type?: string; body: string; hot?: boolean; viz?: string[] };

// The charts beside a row's text, shown only where the text leaves room
// (initBigCards). One hue throughout: the row's own part in --pc, the
// context dimmed — never a color per series.

// The layer stack with one layer lit (none: -1, all at full strength).
function vizStack(active: number, caption = true): string {
  const layers = UI.vizLayers;
  return `
    ${caption ? `<p class="viz-caption">${UI.vizFig1}</p>` : ""}
    <ol class="viz-stack er-stack${caption ? "" : " er-stack--tight"}${active < 0 ? " er-stack--all" : ""}">
      ${layers
        .map(([name, sub], i) => `<li class="${i === active ? "hl" : ""}" style="--i: ${layers.length - 1 - i}"><b>${esc(name)}</b><span>${esc(sub)}</span></li>`)
        .join("")}
    </ol>`;
}

// Tenants × modules with one tenant's row or one module's column lit.
function vizMatrix(card: ProjectCard, hl: { tenant?: number; module?: TenantModule }): string {
  const tenants = card.tenants ?? [];
  const lit = (i: number, m: TenantModule) => hl.tenant === i || hl.module === m;
  return `
    <p class="viz-caption">${UI.vizFig2}</p>
    <table class="viz-tenants er-matrix ${hl.module ? "er-matrix--col" : hl.tenant !== undefined ? "er-matrix--row" : ""}">
      <thead><tr><th></th>${TENANT_MODULES.map(
        (m) => `<th class="${m === "shop" ? "wip" : ""}${hl.module === m ? " hl" : ""}"><span>${esc(UI.vizModules[m])}</span></th>`,
      ).join("")}</tr></thead>
      <tbody>
        ${tenants
          .map(
            (t, i) =>
              `<tr class="${hl.tenant === i ? "hl" : ""}"><th>${esc(t.name)}</th>${TENANT_MODULES.map(
                (m) =>
                  `<td class="${t.modules.includes(m) ? "on" : m === "shop" ? "wip" : ""}${lit(i, m) ? " hl" : ""}" title="${esc(t.name)} · ${esc(UI.vizModules[m])}"></td>`,
              ).join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

// The compact form of one matrix row or column: a square per item, filled
// where it's booked.
function vizList(items: { label: string; on: boolean }[]): string {
  return `
    <ul class="er-list${items.length > 5 ? " er-list--2" : ""}">
      ${items.map((it) => `<li class="${it.on ? "on" : ""}">${esc(it.label)}</li>`).join("")}
    </ul>`;
}

// Hours as bars on one scale: the solid part is the low estimate, the
// lighter part the rest of the range. Every bar carries its value.
function vizHours(rows: [string, number, number][]): string {
  const max = Math.ceil(Math.max(...rows.map(([, , hi]) => hi)) / 100) * 100;
  const pct = (v: number) => `${(v / max) * 100}%`;
  const value = (lo: number, hi: number) => (lo === hi ? `~${lo} h` : `${lo}–${hi} h`);
  return `
    <div class="er-bars">
      ${rows
        .map(
          ([label, lo, hi]) => `
        <div class="er-bar" title="${esc(label)}: ${value(lo, hi)}">
          <span class="er-bar-label">${esc(label)}</span>
          <span class="er-bar-track"><i style="width: ${pct(lo)}"></i>${hi > lo ? `<i class="er-bar-range" style="width: ${pct(hi - lo)}"></i>` : ""}<b>${value(lo, hi)}</b></span>
        </div>`,
        )
        .join("")}
    </div>`;
}

// The timeline as phases over months (April 2026 on), the current one lit.
function vizTimeline(rows: [string, number, number][]): string {
  const months = Math.max(...rows.map(([, , to]) => to)) + 1;
  const name = new Intl.DateTimeFormat(LANG, { month: "short" });
  return `
    <div class="er-gantt" style="--months: ${months}">
      ${Array.from({ length: months }, (_, i) => `<span class="er-gantt-m">${esc(name.format(new Date(2026, 3 + i, 1)))}</span>`).join("")}
      ${rows
        .map(
          ([label, from, to], i) => `
        <span class="er-gantt-l">${esc(label)}</span>
        <i class="${i === rows.length - 1 ? "hl" : ""}" style="grid-column: ${from + 1} / ${to + 2}" title="${esc(label)}"></i>`,
        )
        .join("")}
    </div>`;
}

function entity(name: string, count: string, rows: ErRow[], selected: string, lead = false): string {
  return `
    <section class="er-entity${rows.length > 6 ? " er-entity--wide" : ""}">
      <h4 class="er-name${lead ? " er-name--lead" : ""}"><span>${name}</span><span>${esc(count)}</span></h4>
      <div class="er-rows">${rows
        .map(
          (r, i) => `
      <button type="button" class="er-row${r.hot ? " er-row--hot" : ""}" data-er="${name}-${i}" aria-pressed="${`${name}-${i}` === selected}">
        ${r.swatch ? `<span class="er-swatch" style="background: ${esc(r.swatch)}"></span>` : `<span class="er-key">${r.key ?? ""}</span>`}
        <span class="er-attr">${esc(r.attr)}</span>
        ${r.type ? `<span class="er-type">${esc(r.type)}</span>` : ""}
      </button>`,
        )
        .join("")}</div>
    </section>`;
}

// YourBrand: project —1:1— core —1:n— tenant —n:m— module, left to right,
// and under them the picked row's text.
function erCard(card: ProjectCard, head: string): string {
  const tenants = card.tenants ?? [];
  const p = (s?: string) => (s ? `<p>${esc(s)}</p>` : "");
  const detail = (d?: Detail) => (d ? p(d.about) + `<ul>${d.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const links = (card.links ?? [])
    .map((l) => (l.href ? `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>` : esc(l.label)))
    .join(" · ");

  const overview = [blueprint(card), vizMatrix(card, {}), vizStack(-1, false)];
  const project: ErRow[] = [
    { key: "PK", attr: "why", type: "text", body: p(card.learnGoal) + p(card.what), viz: overview },
    // The challenge: a clean base, the business logic on top experimental.
    { attr: "learned", type: "text", body: p(card.challenge), viz: [vizStack(0), vizStack(0, false)] },
    { attr: "architecture", type: "text[]", body: `<ul>${(card.decisions ?? []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`, viz: overview },
    { attr: "hours", type: "text", body: p(card.meta), viz: card.hoursChart && [vizHours(card.hoursChart)] },
    { attr: "timeline", type: "text", body: p(card.origin), viz: card.timelineChart && [vizTimeline(card.timelineChart)] },
    { attr: "repo", type: "url", body: `<p>${links}</p><ul class="er-tags">${(card.tags ?? []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`, viz: overview },
  ];

  const layers = UI.vizLayers;
  const core: ErRow[] = layers.map(([name, sub], i) => ({
    key: `L${layers.length - i}`,
    attr: name,
    body: `<p><b>${esc(sub)}</b></p>${detail(card.layers?.[i])}`,
    viz: [vizStack(i), vizStack(i, false)],
  }));

  const tenant: ErRow[] = tenants.map((t, i) => ({
    swatch: t.color,
    attr: t.name,
    type: t.tier,
    body: `<p><b>${esc(t.kind)}</b></p>${p(t.about)}<p class="er-mods">${t.modules.map((m) => esc(UI.vizModules[m])).join(" · ")}</p>`,
    viz: [vizMatrix(card, { tenant: i }), vizList(TENANT_MODULES.map((m) => ({ label: UI.vizModules[m], on: t.modules.includes(m) })))],
  }));

  const module: ErRow[] = TENANT_MODULES.map((m) => {
    const users = tenants.filter((t) => t.modules.includes(m));
    const wip = m === "shop";
    return {
      attr: UI.vizModules[m],
      type: wip ? UI.vizWip : `${users.length} / ${tenants.length}`,
      hot: wip,
      body: detail(card.moduleInfo?.[m]) + `<p class="er-mods">${esc(users.length ? users.map((t) => t.name).join(" · ") : UI.vizWip)}</p>`,
      viz: [vizMatrix(card, { module: m }), vizList(tenants.map((t) => ({ label: t.name, on: t.modules.includes(m) })))],
    };
  });

  const all: [string, ErRow[]][] = [["project", project], ["core", core], ["tenant", tenant], ["module", module]];
  const selected = "project-0";
  const panes = all
    .flatMap(([name, rows]) =>
      rows.map(
        (r, i) => `
      <div class="er-pane" data-er-pane="${name}-${i}"${`${name}-${i}` === selected ? "" : " hidden"}>
        <p class="er-path"><span>${name}</span> › ${esc(r.attr)}${r.type ? ` <i>${esc(r.type)}</i>` : ""}</p>
        <div class="er-main">
          <div class="er-body">${r.body}</div>
          ${r.viz ? `<figure class="er-viz" hidden>${r.viz.map((v) => `<div class="er-viz-v" hidden>${v}</div>`).join("")}</figure>` : ""}
        </div>
      </div>`,
      ),
    )
    .join("");

  return `
    <article class="pcard pcard--big pcard--er" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="er">
        ${entity("project", "1", project, selected, true)}
        ${relation(ONE(7) + ONE(40), "1 : 1")}
        ${entity("core", "1", core, selected)}
        ${relation(ONE(7) + MANY_RIGHT, "1 : n")}
        ${entity("tenant", String(tenants.length), tenant, selected)}
        ${relation(MANY_LEFT + MANY_RIGHT, "n : m")}
        ${entity("module", String(TENANT_MODULES.length), module, selected)}
      </div>
      <section class="er-detail">
        ${panes}
        <p class="er-pager" hidden>
          <button type="button" data-er-page="-1" aria-label="${esc(UI.erPrev)}">‹</button>
          <span dir="ltr"></span>
          <button type="button" data-er-page="1" aria-label="${esc(UI.erNext)}">›</button>
        </p>
      </section>
    </article>
  `;
}

// A decision reads "Head: the rest" or "Head — the rest"; the head becomes
// the list row's title, like a mail subject.
function splitDecision(d: string): [string, string] {
  const m = d.match(/^(.{4,60}?)(?::| —) (.+)$/);
  return m ? [m[1], m[2]] : [d, ""];
}

// A tiny highlighter for the architecture excerpt: comments, strings and a
// few keywords — enough to read as code, not a parser.
function highlight(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const safe = esc(line);
      if (safe.trimStart().startsWith("//")) return `<span class="c">${safe}</span>`;
      return safe
        .replace(/&#39;[^&]*&#39;|'[^']*'/g, (m) => `<span class="s">${m}</span>`)
        .replace(/\b(type|interface|Promise)\b/g, (m) => `<span class="k">${m}</span>`);
    })
    .join("\n");
}

// The architecture pane: the pipeline as an aligned table, then the types.
function archPane(card: ProjectCard): string {
  if (!card.arch) return "";
  const w = Math.max(...card.arch.steps.map(([name]) => name.length)) + 2;
  const f = Math.max(...card.arch.steps.map(([, file]) => file.length)) + 2;
  const steps = card.arch.steps
    .map(
      ([name, file, status], i) =>
        `<span class="n">${String(i + 1).padStart(2, "0")}</span>  <span class="k">${esc(name.padEnd(w))}</span><span class="f">${esc(file.padEnd(f))}</span><span class="o">→</span> <span class="s">${esc(status)}</span>`,
    )
    .join("\n");
  return `
    <div class="mail-code" data-pane="arch" hidden>
      <p class="mail-code-head"><span>pipeline</span><span>${esc(UI.boxCode)}</span></p>
      <pre><code>${steps}</code></pre>
      <pre><code>${highlight(card.arch.code)}</code></pre>
    </div>`;
}

// The fit colors the JobBot list uses (match / off-stack / brutal).
const FIT = ["#5B8CFF", "#E8B04B", "#E8622A"];

// TschoBBo: the card as the bot's own mail client — folders on the left,
// the picked folder's mails in the middle, the picked mail as a letter on
// paper. "Code + Architektur" lists the decisions and opens on the code.
// Clicks are wired in initBigCards.
function mailCard(card: ProjectCard, head: string): string {
  const box = card.mailbox;
  const mails = (folder: MailFolder, first: [string, string]) => [first, ...(box?.[folder] ?? [])];
  const folders: { id: string; label: string; mails: [string, string][] }[] = [
    { id: "what", label: UI.lblWhat, mails: mails("what", [card.title, card.what ?? ""]) },
    { id: "why", label: UI.boxWhy, mails: mails("why", [card.learnGoal, ""]) },
    { id: "learned", label: UI.boxLearned, mails: mails("learned", [UI.lblChallenge, card.challenge ?? ""]) },
    { id: "arch", label: UI.boxCode, mails: (card.decisions ?? []).map((d) => splitDecision(d)) },
    { id: "origin", label: UI.lblOrigin, mails: mails("origin", [UI.lblOrigin, card.origin ?? ""]) },
  ];
  const gh = card.links?.find((l) => l.href);
  // The decisions' letters show the whole decision, not just its tail.
  const body = (f: string, i: number, text: string) => (f === "arch" ? card.decisions![i] : text);

  return `
    <article class="pcard pcard--big pcard--mail" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="mail">
        <div class="mail-bar" aria-hidden="true"><i></i><i></i><i></i><span>jobbot :// ${esc(card.title)}</span></div>
        <div class="mail-panes">
          <nav class="mail-folders">
            <p class="mail-logo" aria-hidden="true">jobbot <span>://</span></p>
            ${folders
              .map(
                (f, i) =>
                  `<button type="button" class="mail-folder" data-folder="${f.id}" aria-pressed="${i === 0}"><span>${esc(f.label)}</span><span class="mail-n">${f.mails.length}</span></button>`,
              )
              .join("")}
            ${card.mascot ? `<img class="mail-mascot" src="${esc(card.mascot.src)}" alt="${esc(card.mascot.alt)}" loading="lazy" decoding="async" />` : ""}
          </nav>
          <div class="mail-list">
            ${folders
              .map(
                (f, fi) => `
              <div class="mail-group" data-list="${f.id}"${fi === 0 ? "" : " hidden"}>
                <p class="mail-list-head">${esc(f.label)}</p>
                ${f.mails
                  .map(
                    ([title, text], i) => `
                <button type="button" class="mail-row" data-mail="${f.id}-${i}" aria-pressed="${fi === 0 && i === 0}">
                  <i style="background: ${FIT[i % FIT.length]}"></i>
                  <span><b>${esc(title)}</b><span>${esc(text)}</span></span>
                </button>`,
                  )
                  .join("")}
              </div>`,
              )
              .join("")}
            <ul class="mail-tags">${(card.tags ?? []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
          <div class="mail-read">
            ${archPane(card)}
            <article class="mail-paper">
              <div class="mail-stamp" aria-hidden="true">
                ${card.mascot ? `<img src="${esc(card.mascot.src)}" alt="" loading="lazy" decoding="async" />` : ""}
                <span>${esc(UI.touchStamp)}</span>
              </div>
              ${folders
                .flatMap((f, fi) =>
                  f.mails.map(
                    ([title, text], i) => `
                <div class="mail-pane" data-pane="${f.id}-${i}"${fi === 0 && i === 0 ? "" : " hidden"}>
                  <p class="mail-kicker">${esc(f.label)}</p>
                  <h4>${esc(title)}</h4>
                  ${body(f.id, i, text) ? `<p>${esc(body(f.id, i, text))}</p>` : ""}
                </div>`,
                  ),
                )
                .join("")}
            </article>
            ${gh ? `<a class="mail-send" href="${esc(gh.href!)}" target="_blank" rel="noopener noreferrer">${esc(gh.label)} ↗</a>` : ""}
          </div>
        </div>
      </div>
    </article>
  `;
}

// One small looping animation per section of this page (CSS in
// big-cards.css), in UI.vizStory's order: cloth, elevator, project cards,
// falling letters, the legal overlay with the music still going.
const DEMOS = [
  `<span class="demo-cloth"><b>Kev</b></span>`,
  `<span class="demo-shaft"></span><span class="demo-car"></span>`,
  `<span class="demo-card"></span><span class="demo-card"></span><span class="demo-card"></span>`,
  `<span class="demo-fall">H</span><span class="demo-fall">I</span><span class="demo-fall">!</span>`,
  `<span class="demo-page"></span><span class="demo-sheet"></span><span class="demo-bars"><i></i><i></i><i></i></span>`,
  `<span class="demo-lang"><b>Hallo</b><b>Hello</b><b>Привет</b><b>こんにちは</b></span>`,
];

// The card's texts (Why? / Learned! / Code, cardBodies) as tabs, with any
// extra panels first — a box every big card can use. Clicks: initBigCards.
type Panel = { kind: string; heading: string; body: string };
function textTabs(card: ProjectCard, extra: Panel[] = []): string {
  const panels = [...extra, ...cardBodies(card)];
  const id = (kind: string) => `big-${esc(card.id)}-${kind}`;
  return `
    <section class="big-text" data-tabs>
      <div class="big-tabs" role="tablist">
        ${panels
          .map(
            (b, i) =>
              `<button type="button" role="tab" id="${id(b.kind)}-tab" aria-controls="${id(b.kind)}" aria-selected="${i === 0}" data-tab="${b.kind}">${b.heading}</button>`,
          )
          .join("")}
      </div>
      ${panels
        .map(
          (b, i) =>
            `<div class="big-panel" role="tabpanel" id="${id(b.kind)}" aria-labelledby="${id(b.kind)}-tab" data-panel="${b.kind}"${i === 0 ? "" : " hidden"}>${b.body}</div>`,
        )
        .join("")}
    </section>`;
}

// kev.dev: Why? / Learned! / Code as tabs on the left, the page's own
// sections on the right as accordions — each with a mini demo, and opened,
// what it does, the files behind it and what of it is reusable.
function partsCard(card: ProjectCard, head: string): string {
  const story = UI.vizStory;
  const parts = Array.from({ length: Math.max(story.length, card.parts?.length ?? 0) }, (_, i) => {
    const part = card.parts?.[i] ?? { does: "", files: [], reuse: "" };
    return { ...part, name: part.name ?? story[i]?.[0] ?? "", line: part.line ?? story[i]?.[1] ?? "" };
  });
  const list = (items?: string[]) => (items?.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  return `
    <article class="pcard pcard--big pcard--parts" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head.replace("</header>", `<span class="parts-here" aria-hidden="true">${esc(UI.touchHere)}</span></header>`)}
      <div class="parts">
        ${textTabs(card)}
        <div class="parts-list">
          <p class="parts-head">${esc(UI.partsHead)}</p>
          ${parts
            .map(
              (p, i) => `
            <details class="parts-item" name="parts-${esc(card.id)}"${i === 0 ? " open" : ""}>
              <summary>
                <span class="parts-demo" aria-hidden="true">${DEMOS[i] ?? ""}</span>
                <span class="parts-name"><b><i>${String(i + 1).padStart(2, "0")}</i> ${esc(p.name)}</b><span>${esc(p.line)}</span></span>
              </summary>
              <dl class="parts-body">
                <dt>${esc(UI.partsDoes)}</dt><dd>${esc(p.does)}</dd>
                <dt>${esc(UI.partsFiles)}</dt><dd>${p.files.map((f) => `<code>${esc(f)}</code>`).join(" ")}</dd>
                <dt>${esc(UI.partsReuse)}</dt><dd>${esc(p.reuse)}</dd>
              </dl>
              ${
                p.pros?.length || p.cons?.length
                  ? `<div class="parts-procon">
                <div class="parts-pro"><p>${esc(UI.partsPros)}</p>${list(p.pros)}</div>
                <div class="parts-con"><p>${esc(UI.partsCons)}</p>${list(p.cons)}</div>
              </div>`
                  : ""
              }
            </details>`,
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

// A folder shows its mails and opens the first (the architecture folder
// opens on its code instead); a mail shows its letter. One listener per
// big card; the cards are rendered once, so nothing to tear down.
export function initBigCards(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".pcard--mail").forEach((card) => {
    const paper = card.querySelector<HTMLElement>(".mail-paper");
    const show = (pane: string) => {
      card.querySelectorAll<HTMLElement>("[data-pane]").forEach((el) => {
        el.hidden = el.dataset.pane !== pane;
      });
      // The architecture is code, not a letter: no paper behind it.
      if (paper) {
        paper.hidden = pane === "arch";
        paper.scrollTo(0, 0);
      }
      card.querySelectorAll<HTMLElement>(".mail-row").forEach((row) => {
        row.setAttribute("aria-pressed", String(row.dataset.mail === pane));
      });
    };
    card.addEventListener("click", (e) => {
      const target = e.target as Element;
      const folder = target.closest<HTMLElement>("[data-folder]");
      if (folder) {
        const id = folder.dataset.folder!;
        card.querySelectorAll<HTMLElement>("[data-folder]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn === folder)));
        card.querySelectorAll<HTMLElement>("[data-list]").forEach((list) => {
          list.hidden = list.dataset.list !== id;
        });
        card.querySelector(".mail-list")?.scrollTo(0, 0);
        show(id === "arch" && card.querySelector("[data-pane='arch']") ? "arch" : `${id}-0`);
        return;
      }
      const mail = target.closest<HTMLElement>("[data-mail]");
      if (mail) show(mail.dataset.mail!);
    });
  });
  // YourBrand: a row shows its text in the detail box. Text that doesn't
  // fit runs on into more columns to the side; the pager slides them in a
  // box-width at a time — pages instead of a scrollbar.
  root.querySelectorAll<HTMLElement>(".pcard--er").forEach((card) => {
    const pager = card.querySelector<HTMLElement>(".er-pager");
    let page = 0;
    const paginate = () => {
      const pane = card.querySelector<HTMLElement>(".er-pane:not([hidden])");
      const body = pane?.querySelector<HTMLElement>(".er-body");
      const viz = pane?.querySelector<HTMLElement>(".er-viz");
      if (!body || !pager) return;
      body.style.transform = "";
      body.style.flex = "";
      body.style.columnCount = "";
      if (viz) viz.hidden = true;
      const css = getComputedStyle(body);
      const gap = parseFloat(css.columnGap) || 0;
      const step = body.clientWidth + gap;
      // How far the columns reach past the box's start edge.
      const reach = () => {
        const box = body.getBoundingClientRect();
        let r = 0;
        for (const el of Array.from(body.children)) {
          for (const rect of Array.from(el.getClientRects())) r = Math.max(r, rect.right - box.left);
        }
        return r;
      };
      const used = reach();
      const pages = step > 0 ? Math.max(1, Math.ceil((used - 1) / step)) : 1;
      // Text that leaves whole columns empty gives them to the chart: the
      // text keeps exactly the columns it fills, same width as before.
      if (viz && pages === 1) {
        const count = Math.min(4, Math.max(1, Math.floor((body.clientWidth + gap) / ((parseFloat(css.columnWidth) || 240) + gap))));
        const col = (body.clientWidth - (count - 1) * gap) / count;
        const cols = Math.max(1, Math.ceil((used + gap - 1) / (col + gap)));
        const free = body.clientWidth - cols * (col + gap);
        if (cols < count && free >= 16 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
          body.style.flex = `0 0 ${cols * col + (cols - 1) * gap}px`;
          body.style.columnCount = String(cols);
          viz.hidden = false;
          // The largest chart that fits; one that doesn't fit at all stays
          // out rather than being cut off.
          const fits = (v: HTMLElement) => v.offsetHeight <= viz.clientHeight + 1 && v.scrollWidth <= viz.clientWidth + 1;
          const variants = Array.from(viz.querySelectorAll<HTMLElement>(".er-viz-v"));
          let shown = false;
          for (const v of variants) {
            variants.forEach((o) => (o.hidden = o !== v));
            if (fits(v)) {
              shown = true;
              break;
            }
          }
          if (!shown) {
            viz.hidden = true;
            body.style.flex = "";
            body.style.columnCount = "";
          }
        }
      }
      page = Math.min(page, pages - 1);
      body.style.transform = page ? `translateX(${-page * step}px)` : "";
      pager.hidden = pages < 2;
      pager.querySelector("span")!.textContent = `${page + 1} / ${pages}`;
      pager.querySelectorAll<HTMLButtonElement>("[data-er-page]").forEach((b) => {
        b.disabled = b.dataset.erPage === "-1" ? page === 0 : page === pages - 1;
      });
    };
    card.addEventListener("click", (e) => {
      const target = e.target as Element;
      const turn = target.closest<HTMLElement>("[data-er-page]");
      if (turn) {
        page += Number(turn.dataset.erPage);
        paginate();
        return;
      }
      const pick = target.closest<HTMLElement>("[data-er]");
      if (!pick) return;
      card.querySelectorAll<HTMLElement>("[data-er]").forEach((row) => row.setAttribute("aria-pressed", String(row === pick)));
      card.querySelectorAll<HTMLElement>("[data-er-pane]").forEach((pane) => {
        pane.hidden = pane.dataset.erPane !== pick.dataset.er;
      });
      page = 0;
      paginate();
    });
    const detail = card.querySelector(".er-detail");
    if (detail) new ResizeObserver(paginate).observe(detail);
  });
  // Every tab box (textTabs and the like): a tab shows its panel within
  // its own [data-tabs] box.
  root.addEventListener("click", (e) => {
    const tab = (e.target as Element).closest<HTMLElement>(".pcard--big [data-tab]");
    const box = tab?.closest<HTMLElement>("[data-tabs]");
    if (!tab || !box) return;
    box.querySelectorAll<HTMLElement>(":scope > [role=tablist] [data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    box.querySelectorAll<HTMLElement>(":scope > [data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab.dataset.tab;
    });
  });
  root.querySelectorAll<HTMLElement>(".pcard--parts").forEach((card) => {
    // An opened part scrolls the list until all of it is in view; one
    // taller than the list scrolls down to its end (pro/con), the start is
    // a wheel turn up — so the list needs no scrollbar. `toggle` doesn't
    // bubble: listened for in the capture phase.
    const list = card.querySelector<HTMLElement>(".parts-list");
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("force-motion");
    card.addEventListener(
      "toggle",
      (e) => {
        const item = e.target as HTMLDetailsElement;
        if (!list || !item.matches(".parts-item") || !item.open) return;
        requestAnimationFrame(() => {
          const top = item.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
          const end = top + item.offsetHeight - list.clientHeight;
          const target = item.offsetHeight > list.clientHeight ? end : Math.min(top, Math.max(list.scrollTop, end));
          list.scrollTo({ top: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
        });
      },
      true,
    );
  });
}

// Which layouts have a desktop card of their own (renderBigCard). The
// carousel centres those and sizes them to the space (data-big, main.ts).
const BIG_LAYOUTS = new Set(["blueprint", "inbox", "storyboard"]);
export const hasBigCard = (card: ProjectCard) => BIG_LAYOUTS.has(card.layout);

// The big card for this project, or "" to fall back to the shared layout.
export function renderBigCard(card: ProjectCard, head: string): string {
  switch (card.layout) {
    case "blueprint":
      return erCard(card, head);
    case "inbox":
      return mailCard(card, head);
    case "storyboard":
      return partsCard(card, head);
    default:
      return "";
  }
}
