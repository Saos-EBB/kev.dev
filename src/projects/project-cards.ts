// One card renderer for every project, but each project brings its own
// `layout`: a different arrangement on the grid (project-cards.css) and its
// own signature visual (project-visuals.ts) — a blueprint layer stack for
// the SaaS, a mail inbox for the job bot, a 3D viewport for the renderer,
// a script editor for the userscript, a pinboard for the Bootcamp basics.
// The parts every card shares stay the same: the head (index, kind,
// title, claim, facet buttons) and the teaser boxes — Why? (goal/what),
// Learned! (challenge/origin) and Code + Architektur (GitHub, tags,
// decisions, meta) — each opening in full in the shared overlay.

import { RTL } from "../i18n";
import { UI } from "../i18n/ui";
import "./project-cards.css";
import { renderFacetTiles } from "./facet-overlay";
import { renderTouch, renderVisual } from "./project-visuals";

// A link without href renders as plain text (e.g. "Live-Demo auf Anfrage").
export interface ProjectLink {
  label: string;
  href?: string;
}

// A widget is mounted lazily: `mount` is only called the first time the
// card is expanded, so heavy code (renderer canvas, CheerpJ) is never
// loaded on page view. Typically `(el) => import("./widgets/x").then(m => m.mount(el))`.
// It may return a cleanup function.
// It gets the card too, so its workspace cards (Why?, decisions …) can use
// the card's own copy instead of repeating it.
export interface ProjectWidget {
  label: string;
  mount: (el: HTMLElement, card: ProjectCard) => Promise<void | (() => void)> | void | (() => void);
}

// Facet buttons (in the card head, and on some signature visuals): each
// opens the same shared overlay (facet-overlay.ts) — Live-Demo -> widget
// or the demo link, B2B -> the YourBrand accessible-site link.
// Screens -> the card's screenshots as a gallery. Self -> no overlay: the
// portfolio's own card, its "demo" is the page you're on (main.ts).
// YourBrand's switchable modules, as its registry names them
// (TENANT_MODULES in the YourBrand repo); labels in UI.vizModules.
export const TENANT_MODULES = ["chat", "matching", "payments", "hidden", "board", "caretaker", "orgs", "shop"] as const;
export type TenantModule = (typeof TENANT_MODULES)[number];

// One tenant in YourBrand's Screens facet: what it is, what it booked, a
// click-through clip (.mp4) and its screens, each as desktop and mobile.
export interface TenantShowcase {
  name: string;
  // Its primary brand color (--color-primary-fixed-dim in its tenant.json).
  color: string;
  kind: string;
  about: string;
  tier: string;
  modules: TenantModule[];
  video: { src: string; poster: string; alt: string };
  // `mobile` is missing where the phone capture was unusable.
  screenshots: { src: string; mobile?: string; alt: string }[];
}

export type FacetKind ="live-demo" | "b2b" | "screens" | "self";

// Which arrangement + signature visual a card uses (see the file header).
export type CardLayout = "blueprint" | "inbox" | "viewport" | "editor" | "terminal" | "keys" | "pinboard" | "storyboard" | "portrait";

// Which of the three project groups a card belongs to. The cards are
// ordered by group (projects-data.ts); the group's word shows up around
// the "Projekte" heading while its cards are on screen (project-groups.ts).
export type ProjectGroup = "big" | "tools" | "along";
export const GROUP_LABELS: Record<ProjectGroup, string> = {
  big: "TheBigOnes",
  tools: "Tools",
  along: "Along the way",
};

// The group words, one span each; CSS places them (fixed spots around the
// desktop headline, all on one spot in the phone title).
export const groupTagsHtml = () =>
  (Object.keys(GROUP_LABELS) as ProjectGroup[])
    .map((g) => `<span class="projects-group" data-group="${g}">${GROUP_LABELS[g]}</span>`)
    .join("");

export interface ProjectCard {
  id: string;
  group: ProjectGroup;
  layout: CardLayout;
  // Short genre label in the card head ("White-Label-SaaS").
  kind: string;
  // The card's own color, any CSS color (usually one of the --note-N tokens).
  accent: string;
  learnGoal: string;
  title: string;
  claim: string;
  // Three short bullet points for the phone list (lite), the whole card
  // opens in the project sheet (project-sheet.ts).
  points?: string[];
  what?: string;
  tags?: string[];
  meta?: string;
  links?: ProjectLink[];
  decisions?: string[];
  challenge?: string;
  origin?: string;
  status?: string;
  // Unresolved content questions, shown visibly on the card until answered.
  open?: string[];
  screenshots?: { src: string; alt: string }[];
  // YourBrand's Screens facet: an intro, then one accordion section per
  // tenant instead of a flat gallery of `screenshots`.
  tenantsIntro?: string;
  tenants?: TenantShowcase[];
  // A character to put on the card's visual (TschoBBo's mascot).
  mascot?: { src: string; alt: string };
  widget?: ProjectWidget;
  // Which facet buttons this card shows, in display order.
  facets?: FacetKind[];
}

// Koeeya Trial (--font-display) has no real punctuation — its "." and ","
// render as a "pdt." trial mark. In display titles they're set in the
// reading font instead (.pcard-title-punct).
export const displayText = (s: string) =>
  esc(s).replace(/[.,:;!?]/g, (c) => `<span class="pcard-title-punct">${c}</span>`);

// Small inline tag in front of a card's text ("Ziel", "Beweis", "Projekt").
const label = (text: string) => `<span class="pcard-label">${text}</span>`;

const open = (text: string) => `<p class="pcard-open">[OFFEN: ${esc(text)}]</p>`;

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// One of the teaser boxes. Never scrolls: text past the
// box's fixed height fades out, and the expand button opens the whole box
// in the shared overlay (facet-overlay.ts copies .pcard-box-body over).
const box = (kind: string, heading: string, body: string) => `
  <section class="pcard-part pcard-part--${kind}">
    <h4 class="pcard-box-heading">${heading}</h4>
    <div class="pcard-box-body">${body}</div>
    <button class="pcard-expand" type="button" aria-label="${UI.expandAria(heading)}">${UI.expand}</button>
  </section>
`;

// Which boxes each layout shows. The Bootcamp basics have no story or
// architecture of their own — the pinboard is the content there.
const BOXES: Record<CardLayout, ("why" | "learned" | "code")[]> = {
  blueprint: ["why", "learned", "code"],
  inbox: ["why", "learned", "code"],
  viewport: ["why", "learned", "code"],
  editor: ["why", "learned", "code"],
  terminal: ["why", "learned", "code"],
  keys: ["why", "learned", "code"],
  pinboard: ["why"],
  storyboard: ["why", "learned", "code"],
  portrait: ["why", "learned", "code"],
};

const pad = (n: number) => String(n).padStart(2, "0");

// The three text bodies (Why? / Learned! / Code + Architektur), shared by
// the desktop card's teaser boxes and the phone sheet's accordions.
function cardBodies(card: ProjectCard) {
  const gh = card.links?.find((l) => /github/i.test(l.label));
  const boxes = BOXES[card.layout];
  // Open questions sit with the code facts, or in Why? if a card has none.
  const opens = card.open?.map(open).join("") ?? "";

  const why = [
    `<p class="pcard-goal">${label(UI.lblGoal)}${esc(card.learnGoal)}</p>`,
    card.what ? `<p class="pcard-what">${label(UI.lblWhat)}${esc(card.what)}</p>` : "",
    boxes.includes("code") ? "" : opens,
  ].join("");

  const learned =
    card.challenge || card.origin
      ? [
          card.challenge ? `<p class="pcard-what">${label(UI.lblChallenge)}${esc(card.challenge)}</p>` : "",
          card.origin ? `<p class="pcard-what">${label(UI.lblOrigin)}${esc(card.origin)}</p>` : "",
        ].join("")
      : open("Herausforderung/Learnings fehlen noch");

  const code = [
    gh?.href
      ? `<p><a class="facet-link" href="${esc(gh.href)}" target="_blank" rel="noopener noreferrer">${esc(gh.label)} ↗</a></p>`
      : gh // a private repo: named, nothing to link
        ? `<p>${esc(gh.label)}</p>`
        : open("GitHub-Link fehlt"),
    card.tags?.length ? `<ul class="pcard-tags">${card.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "",
    card.decisions?.length
      ? `<ul class="pcard-decisions">${card.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
      : open("Architektur-Entscheidungen fehlen noch"),
    card.meta ? `<p class="pcard-meta">${esc(card.meta)}</p>` : "",
    opens,
  ].join("");

  const headings = { why: UI.boxWhy, learned: UI.boxLearned, code: UI.boxCode };
  return boxes.map((kind) => ({ kind, heading: headings[kind], body: { why, learned, code }[kind] }));
}

const indexLine = (card: ProjectCard, index: number, total: number) =>
  `<span>${pad(index + 1)}</span> / ${pad(total)} · ${esc(card.kind)}`;

const visualHidden = (card: ProjectCard) =>
  card.layout === "blueprint" || card.layout === "editor" ? "true" : "false";

export function renderProjectCard(card: ProjectCard, index = 0, total = 1): string {
  return `
    <article class="pcard pcard--${card.layout}" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      <header class="pcard-head">
        <p class="pcard-index">${indexLine(card, index, total)}</p>
        <h3 class="pcard-title" aria-label="${esc(card.title)}">${displayText(card.title)}</h3>
        ${card.status ? `<span class="pcard-status">${esc(card.status)}</span>` : ""}
        <p class="pcard-claim">${esc(card.claim)}</p>
        ${renderFacetTiles(card)}
      </header>
      <div class="pcard-visual" aria-hidden="${visualHidden(card)}">
        ${renderVisual(card)}
      </div>
      ${cardBodies(card).map((b) => box(b.kind, b.heading, b.body)).join("")}
      ${card.group === "big" ? renderTouch(card) : ""}
    </article>
  `;
}

// Phone list entry (lite): index, title, three bullet points, a few tags.
// The title's button is stretched over the whole entry (project-sheet.css)
// and opens the project sheet.
export function renderProjectTeaser(card: ProjectCard, index = 0, total = 1): string {
  const tags = card.tags?.slice(0, 4) ?? [];
  return `
    <article class="ptease" data-card="${esc(card.id)}" data-group="${card.group}" style="--pc: ${card.accent}">
      ${card.layout === "portrait" ? `<canvas class="ptease-face" data-face-dots aria-hidden="true"></canvas>` : ""}
      <p class="pcard-index">${indexLine(card, index, total)}</p>
      <h3 class="ptease-title">
        <button type="button" data-open-project="${esc(card.id)}" aria-label="${esc(card.title)} — ${esc(UI.projectOpen)}">${displayText(card.title)}</button>
      </h3>
      ${card.points?.length ? `<ul class="ptease-points">${card.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${tags.length ? `<ul class="ptease-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <span class="ptease-cta" aria-hidden="true">${esc(UI.projectOpen)} ${RTL ? "←" : "→"}</span>
    </article>
  `;
}

// The whole card for the phone sheet: head, bullet points, visual, then
// Why? / Learned! / Code as accordions with their full text.
export function renderProjectSheet(card: ProjectCard, index = 0, total = 1): string {
  return `
    <article class="pcard psheet-card pcard--${card.layout}" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      <header class="pcard-head">
        <p class="pcard-index">${indexLine(card, index, total)}</p>
        <h3 class="pcard-title" id="psheet-title">${displayText(card.title)}</h3>
        ${card.status ? `<span class="pcard-status">${esc(card.status)}</span>` : ""}
        <p class="pcard-claim">${esc(card.claim)}</p>
        ${card.points?.length ? `<ul class="ptease-points">${card.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        ${renderFacetTiles(card)}
      </header>
      <div class="pcard-visual" aria-hidden="${visualHidden(card)}">
        ${renderVisual(card)}
      </div>
      ${cardBodies(card)
        .map(
          (b) => `
        <details class="psheet-acc pcard-part--${b.kind}" name="psheet-acc">
          <summary class="pcard-box-heading">${b.heading}</summary>
          <div class="psheet-acc-body">${b.body}</div>
        </details>`,
        )
        .join("")}
    </article>
  `;
}
