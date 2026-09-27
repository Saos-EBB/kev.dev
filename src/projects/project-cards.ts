// One card template for every project. Cards differ only in data and in
// which optional fields they fill — a missing optional field means its
// slot simply isn't rendered.
//
// The card is a container of parts (head, what, facts, links, more) plus
// the click-to-expand "Details" panel (decisions, challenge, origin, and
// optional widget / screenshots). A part with no data isn't rendered.

import "./project-cards.css";

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

// Facet tiles: each opens the same overlay, populated from the card's
// existing fields (Code -> links' GitHub entry, Screenshots -> screenshots,
// Details -> decisions/challenge/origin, Live-Demo -> widget, B2B -> the
// YourBrand accessible-site link). Built in A2; only the ordering per card
// lives here for now.
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
  // Which facet tiles this card shows, in display order. Rendered by A2;
  // unused until then.
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
  const panelId = `details-${card.id}`;
  const hasDetails =
    card.decisions?.length ||
    card.challenge ||
    card.origin ||
    card.screenshots?.length ||
    card.widget;
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
      ${
        hasDetails
          ? `<div class="pcard-part pcard-part--more">
        <button class="pcard-toggle" type="button" aria-expanded="false" aria-controls="${panelId}">
          Details
        </button>
      </div>
      <div class="pcard-details" id="${panelId}">
        <div class="pcard-details-inner">
          ${
            card.decisions?.length
              ? `<div class="pcard-sec"><h4>Entscheidungen</h4>
          <ul class="pcard-decisions">${card.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>`
              : ""
          }
          ${
            card.challenge || card.origin
              ? `<div class="pcard-sec">${card.challenge ? `<h4>Herausforderung</h4><p>${esc(card.challenge)}</p>` : ""}${card.origin ? `<h4>So entstanden</h4><p>${esc(card.origin)}</p>` : ""}</div>`
              : ""
          }
          ${
            card.screenshots?.length
              ? `<div class="pcard-shots">${card.screenshots
                  .map((s) => `<img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" />`)
                  .join("")}</div>`
              : ""
          }
          ${card.widget ? `<div class="pcard-widget" aria-label="${esc(card.widget.label)}"></div>` : ""}
        </div>
      </div>`
          : ""
      }
    </article>
  `;
}

// Wires click-to-expand for every card inside `root`. Widgets mount once,
// on first expand.
export function initProjectCards(root: HTMLElement, cards: ProjectCard[]) {
  const byId = new Map(cards.map((c) => [c.id, c]));

  root.querySelectorAll<HTMLElement>(".pcard").forEach((el) => {
    const data = byId.get(el.dataset.card ?? "");
    const toggle = el.querySelector<HTMLButtonElement>(".pcard-toggle");
    if (!data || !toggle) return;

    let widgetMounted = false;

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      el.classList.toggle("is-open", open);
      el.toggleAttribute("data-lenis-prevent", open);

      if (open && data.widget && !widgetMounted) {
        widgetMounted = true;
        const host = el.querySelector<HTMLElement>(".pcard-widget");
        if (host) {
          Promise.resolve(data.widget.mount(host)).catch(() => {
            widgetMounted = false;
            host.textContent = "Widget konnte nicht geladen werden.";
          });
        }
      }
    });
  });
}
