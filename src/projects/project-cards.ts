// One card template for every project. Cards differ only in data and in
// which optional fields they fill — a missing optional field means its
// slot simply isn't rendered.
//
// The card is the project's title as a large lettering (it slides in with
// the card, right under the fixed "PROJEKTE" headline) over four boxes,
// each a teaser that opens in full in the shared overlay: Why? (goal/claim/what), Learned!
// (challenge/origin), Screens (screenshots, plus facet tiles that open the
// shared overlay in facet-overlay.ts for a live demo or the B2B site) and
// Code + Architektur (GitHub, tags, decisions, meta).

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

// Facet tiles (in the Screens box): each opens the same shared overlay
// (facet-overlay.ts) — Live-Demo -> widget or the demo link, B2B -> the
// YourBrand accessible-site link. Everything else is shown in the boxes.
export type FacetKind = "live-demo" | "b2b";

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

// Small inline tag in front of a card's text ("Ziel", "Beweis", "Projekt").
const label = (text: string) => `<span class="pcard-label">${text}</span>`;

const open = (text: string) => `<p class="pcard-open">[OFFEN: ${esc(text)}]</p>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// One of the four boxes under the title. Never scrolls: text past the
// box's fixed height fades out, and the expand button opens the whole box
// in the shared overlay (facet-overlay.ts copies .pcard-box-body over).
const box = (kind: string, heading: string, body: string) => `
  <section class="pcard-part pcard-part--${kind}">
    <h4 class="pcard-box-heading">${heading}</h4>
    <div class="pcard-box-body">${body}</div>
    <button class="pcard-expand" type="button" aria-label="${heading} aufklappen">Aufklappen ↗</button>
  </section>
`;

export function renderProjectCard(card: ProjectCard): string {
  const gh = card.links?.find((l) => /github/i.test(l.label));

  const why = [
    `<p class="pcard-goal">${label("Ziel")}${esc(card.learnGoal)}</p>`,
    `<p class="pcard-claim">${label("Beweis")}${esc(card.claim)}</p>`,
    card.what ? `<p class="pcard-what">${label("Projekt")}${esc(card.what)}</p>` : "",
  ].join("");

  const learned =
    card.challenge || card.origin
      ? [
          card.challenge ? `<p class="pcard-what">${label("Herausforderung")}${esc(card.challenge)}</p>` : "",
          card.origin ? `<p class="pcard-what">${label("So entstanden")}${esc(card.origin)}</p>` : "",
        ].join("")
      : open("Herausforderung/Learnings fehlen noch");

  const screens = [
    card.screenshots?.length
      ? `<div class="pcard-shots">${card.screenshots
          .map((s) => `<img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" />`)
          .join("")}</div>`
      : card.facets?.length
        ? ""
        : open("Screenshots fehlen"),
    renderFacetTiles(card),
  ].join("");

  const code = [
    gh?.href
      ? `<p><a class="facet-link" href="${esc(gh.href)}" target="_blank" rel="noopener noreferrer">${esc(gh.label)} ↗</a></p>`
      : open("GitHub-Link fehlt"),
    card.tags?.length ? `<ul class="pcard-tags">${card.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "",
    card.decisions?.length
      ? `<ul class="pcard-decisions">${card.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
      : open("Architektur-Entscheidungen fehlen noch"),
    card.meta ? `<p class="pcard-meta">${esc(card.meta)}</p>` : "",
    card.open?.map(open).join("") ?? "",
  ].join("");

  return `
    <article class="pcard" data-card="${esc(card.id)}">
      <h3 class="pcard-title">${esc(card.title)}</h3>
      ${card.status ? `<span class="pcard-status">${esc(card.status)}</span>` : ""}
      ${box("why", "Why?", why)}
      ${box("learned", "Learned!", learned)}
      ${box("screens", "Screens", screens)}
      ${box("code", "Code + Architektur", code)}
    </article>
  `;
}
