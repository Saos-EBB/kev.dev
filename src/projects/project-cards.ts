// One card renderer for every project, but each project brings its own
// `layout`: a different arrangement on the grid (project-cards.css) and its
// own signature visual (project-visuals.ts) — a blueprint layer stack for
// the SaaS, a mail inbox for the job bot, a 3D viewport for the renderer,
// a script editor for the userscript, a pinboard for the Bootcamp basics.
// The parts every card shares stay the same: the head (index, kind,
// title, claim, facet buttons) and the teaser boxes — Why? (goal/what),
// Learned! (challenge/origin) and Code + Architektur (GitHub, tags,
// decisions, meta) — each opening in full in the shared overlay.

import "./project-cards.css";
import { renderFacetTiles } from "./facet-overlay";
import { renderVisual } from "./project-visuals";

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
// Screens -> the card's screenshots as a gallery.
export type FacetKind = "live-demo" | "b2b" | "screens";

// Which arrangement + signature visual a card uses (see the file header).
export type CardLayout = "blueprint" | "inbox" | "viewport" | "editor" | "pinboard";

export interface ProjectCard {
  id: string;
  layout: CardLayout;
  // Short genre label in the card head ("White-Label-SaaS").
  kind: string;
  // The card's own color, any CSS color (usually one of the --note-N tokens).
  accent: string;
  learnGoal: string;
  title: string;
  claim: string;
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
  // A character to put on the card's visual (TschoBBo's mascot).
  mascot?: { src: string; alt: string };
  widget?: ProjectWidget;
  // Which facet buttons this card shows, in display order.
  facets?: FacetKind[];
}

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
    <button class="pcard-expand" type="button" aria-label="${heading} aufklappen">Aufklappen ↗</button>
  </section>
`;

// Which boxes each layout shows. The Bootcamp basics have no story or
// architecture of their own — the pinboard is the content there.
const BOXES: Record<CardLayout, ("why" | "learned" | "code")[]> = {
  blueprint: ["why", "learned", "code"],
  inbox: ["why", "learned", "code"],
  viewport: ["why", "learned", "code"],
  editor: ["why", "learned", "code"],
  pinboard: ["why"],
};

const pad = (n: number) => String(n).padStart(2, "0");

export function renderProjectCard(card: ProjectCard, index = 0, total = 1): string {
  const gh = card.links?.find((l) => /github/i.test(l.label));
  const boxes = BOXES[card.layout];
  // Open questions sit with the code facts, or in Why? if a card has none.
  const opens = card.open?.map(open).join("") ?? "";

  const why = [
    `<p class="pcard-goal">${label("Ziel")}${esc(card.learnGoal)}</p>`,
    card.what ? `<p class="pcard-what">${label("Projekt")}${esc(card.what)}</p>` : "",
    boxes.includes("code") ? "" : opens,
  ].join("");

  const learned =
    card.challenge || card.origin
      ? [
          card.challenge ? `<p class="pcard-what">${label("Herausforderung")}${esc(card.challenge)}</p>` : "",
          card.origin ? `<p class="pcard-what">${label("So entstanden")}${esc(card.origin)}</p>` : "",
        ].join("")
      : open("Herausforderung/Learnings fehlen noch");

  const code = [
    gh?.href
      ? `<p><a class="facet-link" href="${esc(gh.href)}" target="_blank" rel="noopener noreferrer">${esc(gh.label)} ↗</a></p>`
      : open("GitHub-Link fehlt"),
    card.tags?.length ? `<ul class="pcard-tags">${card.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "",
    card.decisions?.length
      ? `<ul class="pcard-decisions">${card.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
      : open("Architektur-Entscheidungen fehlen noch"),
    card.meta ? `<p class="pcard-meta">${esc(card.meta)}</p>` : "",
    opens,
  ].join("");

  const parts = {
    why: box("why", "Why?", why),
    learned: box("learned", "Learned!", learned),
    code: box("code", "Code + Architektur", code),
  };

  return `
    <article class="pcard pcard--${card.layout}" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      <header class="pcard-head">
        <p class="pcard-index"><span>${pad(index + 1)}</span> / ${pad(total)} · ${esc(card.kind)}</p>
        <h3 class="pcard-title">${esc(card.title)}</h3>
        ${card.status ? `<span class="pcard-status">${esc(card.status)}</span>` : ""}
        <p class="pcard-claim">${esc(card.claim)}</p>
        ${renderFacetTiles(card)}
      </header>
      <div class="pcard-visual" aria-hidden="${card.layout === "blueprint" || card.layout === "editor" ? "true" : "false"}">
        ${renderVisual(card)}
      </div>
      ${boxes.map((b) => parts[b]).join("")}
    </article>
  `;
}
