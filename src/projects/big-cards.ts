// The three big projects' desktop cards. Instead of the shared chrome
// (visual + Why?/Learned!/Code teaser boxes), each gets a structure of its
// own built from the same card data — YourBrand reads as its data model.
// Phone list and sheet keep the shared layout (project-cards.ts).

import { cardBodies, esc, TENANT_MODULES, type Detail, type MailFolder, type ProjectCard } from "./project-cards";
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

// One attribute row: an accordion in its entity (one open at a time).
function row(entity: string, opts: { key?: string; swatch?: string; attr: string; type?: string; body: string; open?: boolean; hot?: boolean }): string {
  return `
    <details class="er-row${opts.hot ? " er-row--hot" : ""}" name="er-${entity}"${opts.open ? " open" : ""}>
      <summary>
        ${opts.swatch ? `<span class="er-swatch" style="background: ${esc(opts.swatch)}"></span>` : `<span class="er-key">${opts.key ?? ""}</span>`}
        <span class="er-attr">${esc(opts.attr)}</span>
        ${opts.type ? `<span class="er-type">${esc(opts.type)}</span>` : ""}
      </summary>
      <div class="er-body">${opts.body}</div>
    </details>`;
}

function entity(name: string, count: string, rows: string, lead = false): string {
  return `
    <section class="er-entity">
      <h4 class="er-name${lead ? " er-name--lead" : ""}"><span>${name}</span><span>${esc(count)}</span></h4>
      ${rows}
    </section>`;
}

// YourBrand: project —1:1— core —1:n— tenant —n:m— module, left to right,
// each deeper than the last.
function erCard(card: ProjectCard, head: string): string {
  const tenants = card.tenants ?? [];
  const p = (s?: string) => (s ? `<p>${esc(s)}</p>` : "");
  const detail = (d?: Detail) => (d ? p(d.about) + `<ul>${d.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const links = (card.links ?? [])
    .map((l) => (l.href ? `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>` : esc(l.label)))
    .join(" · ");

  const project = [
    row("project", { key: "PK", attr: "why", type: "text", open: true, body: p(card.learnGoal) + p(card.what) }),
    row("project", { attr: "learned", type: "text", body: p(card.challenge) }),
    row("project", {
      attr: "architecture",
      type: "text[]",
      body: `<ul>${(card.decisions ?? []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`,
    }),
    row("project", { attr: "hours", type: "text", body: p(card.meta) }),
    row("project", { attr: "timeline", type: "text", body: p(card.origin) }),
    row("project", {
      attr: "repo",
      type: "url",
      body: `<p>${links}</p><ul class="er-tags">${(card.tags ?? []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`,
    }),
  ].join("");

  const layers = UI.vizLayers;
  const core = layers
    .map(([name, sub], i) =>
      row("core", { key: `L${layers.length - i}`, attr: name, open: i === 1, body: `<p><b>${esc(sub)}</b></p>${detail(card.layers?.[i])}` }),
    )
    .join("");

  const tenant = tenants
    .map((t, i) =>
      row("tenant", {
        swatch: t.color,
        attr: t.name,
        type: t.tier,
        open: i === 0,
        body: `<p><b>${esc(t.kind)}</b></p>${p(t.about)}<p class="er-mods">${t.modules.map((m) => esc(UI.vizModules[m])).join(" · ")}</p>`,
      }),
    )
    .join("");

  const module = TENANT_MODULES.map((m, i) => {
    const users = tenants.filter((t) => t.modules.includes(m));
    const wip = m === "shop";
    return row("module", {
      attr: UI.vizModules[m],
      type: wip ? UI.vizWip : `${users.length} / ${tenants.length}`,
      hot: wip,
      open: i === 1,
      body: detail(card.moduleInfo?.[m]) + `<p class="er-mods">${esc(users.length ? users.map((t) => t.name).join(" · ") : UI.vizWip)}</p>`,
    });
  }).join("");

  return `
    <article class="pcard pcard--big pcard--er" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="er">
        ${entity("project", "1", project, true)}
        ${relation(ONE(7) + ONE(40), "1 : 1")}
        ${entity("core", "1", core)}
        ${relation(ONE(7) + MANY_RIGHT, "1 : n")}
        ${entity("tenant", String(tenants.length), tenant)}
        ${relation(MANY_LEFT + MANY_RIGHT, "n : m")}
        ${entity("module", String(TENANT_MODULES.length), module)}
      </div>
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
];

// kev.dev: Why? / Learned! / Code as tabs on the left, the page's own
// sections on the right as accordions — each with a mini demo, and opened,
// what it does, the files behind it and what of it is reusable.
function partsCard(card: ProjectCard, head: string): string {
  const bodies = cardBodies(card);
  const parts = UI.vizStory.map(([name, line], i) => ({ name, line, ...(card.parts?.[i] ?? { does: "", files: [], reuse: "" }) }));
  const id = (kind: string) => `parts-${esc(card.id)}-${kind}`;
  return `
    <article class="pcard pcard--big pcard--parts" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head.replace("</header>", `<span class="parts-here" aria-hidden="true">${esc(UI.touchHere)}</span></header>`)}
      <div class="parts">
        <section class="parts-text">
          <div class="parts-tabs" role="tablist">
            ${bodies
              .map(
                (b, i) =>
                  `<button type="button" role="tab" id="${id(b.kind)}-tab" aria-controls="${id(b.kind)}" aria-selected="${i === 0}" data-tab="${b.kind}">${b.heading}</button>`,
              )
              .join("")}
          </div>
          ${bodies
            .map(
              (b, i) =>
                `<div class="parts-panel" role="tabpanel" id="${id(b.kind)}" aria-labelledby="${id(b.kind)}-tab" data-panel="${b.kind}"${i === 0 ? "" : " hidden"}>${b.body}</div>`,
            )
            .join("")}
        </section>
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
  // kev.dev's text tabs.
  root.querySelectorAll<HTMLElement>(".pcard--parts").forEach((card) => {
    card.addEventListener("click", (e) => {
      const tab = (e.target as Element).closest<HTMLElement>("[data-tab]");
      if (!tab) return;
      card.querySelectorAll<HTMLElement>("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      card.querySelectorAll<HTMLElement>("[data-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.panel !== tab.dataset.tab;
      });
    });
  });
}

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
