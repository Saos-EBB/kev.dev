// The three big projects' desktop cards. Instead of the shared chrome
// (visual + Why?/Learned!/Code teaser boxes), each gets a structure of its
// own built from the same card data — YourBrand reads as its data model.
// Phone list and sheet keep the shared layout (project-cards.ts).

import { esc, TENANT_MODULES, type ProjectCard } from "./project-cards";
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
    <section class="er-entity" data-lenis-prevent>
      <h4 class="er-name${lead ? " er-name--lead" : ""}"><span>${name}</span><span>${esc(count)}</span></h4>
      ${rows}
    </section>`;
}

// YourBrand: project —1:1— core —1:n— tenant —n:m— module, left to right,
// each deeper than the last.
function erCard(card: ProjectCard, head: string): string {
  const tenants = card.tenants ?? [];
  const p = (s?: string) => (s ? `<p>${esc(s)}</p>` : "");
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
    .map(([name, sub], i) => row("core", { key: `L${layers.length - i}`, attr: name, open: i === 1, body: p(sub) }))
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
      body: users.length ? p(users.map((t) => t.name).join(" · ")) : p(UI.vizWip),
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

// The big card for this project, or "" to fall back to the shared layout.
export function renderBigCard(card: ProjectCard, head: string): string {
  switch (card.layout) {
    case "blueprint":
      return erCard(card, head);
    default:
      return "";
  }
}
