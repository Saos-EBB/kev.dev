// One card template for every project. Cards differ only in data and in
// which optional fields they fill — a missing optional field means its
// slot simply isn't rendered.
//
// The card is an always-visible Intro (goal/title/claim/what, then
// tags/meta/open) plus a row of facet tiles that each open the shared
// overlay (facet-overlay.ts) for decisions/challenge/origin, screenshots,
// code link, live demo, or (YourBrand only) the B2B site.

import "./project-cards.css";
import { renderFacetTiles } from "./facet-overlay";

// A link without href renders as plain text (e.g. "Live-Demo auf Anfrage").
export interface ProjectLink {
  label: string;
  href?: string;
}

// A widget is mounted lazily: `mount` is only called the first time the
// card is expanded, so heavy code (renderer canvas, CheerpJ) is never
// loaded on page view. Typically `(el) => import("./widgets/x").then(m => m.mount(el))`.
// It may return a cleanup function.
export interface ProjectWidget {
  label: string;
  mount: (el: HTMLElement) => Promise<void | (() => void)> | void | (() => void);
}

// Facet tiles: each opens the same shared overlay (facet-overlay.ts),
// populated from the card's existing fields (Code -> links' GitHub entry,
// Screenshots -> screenshots, Details -> decisions/challenge/origin,
// Live-Demo -> widget, B2B -> the YourBrand accessible-site link).
export type FacetKind = "code" | "screenshots" | "details" | "live-demo" | "b2b";

export interface ProjectCard {
  id: string;
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
  widget?: ProjectWidget;
  // Which facet tiles this card shows, in display order.
  facets?: FacetKind[];
}

// Small inline tag in front of a card's text ("Ziel", "Beweis", "Projekt"),
// inline so it costs no extra row in the fixed-size bento boxes.
const label = (text: string) => `<span class="pcard-label">${text}</span>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderProjectCard(card: ProjectCard): string {
  return `
    <article class="pcard" data-card="${esc(card.id)}">
      <div class="pcard-part pcard-part--intro-top">
        <p class="pcard-goal">${label("Ziel")}${esc(card.learnGoal)}</p>
        <!-- Title stays here until Handoff B's scroll-synced heading ships; then it moves out. -->
        <h3 class="pcard-title">${esc(card.title)}</h3>
        ${card.status ? `<span class="pcard-status">${esc(card.status)}</span>` : ""}
        <p class="pcard-claim">${label("Beweis")}${esc(card.claim)}</p>
        ${card.what ? `<p class="pcard-what">${label("Projekt")}${esc(card.what)}</p>` : ""}
      </div>
      ${
        card.tags?.length || card.meta || card.open?.length
          ? `<div class="pcard-part pcard-part--intro-bottom">
        ${
          card.tags?.length
            ? `<ul class="pcard-tags">${card.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
            : ""
        }
        ${card.meta ? `<p class="pcard-meta">${esc(card.meta)}</p>` : ""}
        ${card.open?.map((o) => `<p class="pcard-open">[OFFEN: ${esc(o)}]</p>`).join("") ?? ""}
      </div>`
          : ""
      }
      ${renderFacetTiles(card)}
    </article>
  `;
}
