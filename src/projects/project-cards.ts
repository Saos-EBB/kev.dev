// One card template for every project. Cards differ only in data and in
// which optional fields they fill — a missing optional field means its
// slot simply isn't rendered.
//
// Slots (see the handoff): learnGoal, title, claim, what, tags, meta,
// links on the front; decisions, challenge, origin (+ optional widget /
// screenshots) inside the click-to-expand "Details" panel.

import "./project-cards.css";

export interface ProjectLink {
  label: string;
  href: string;
}

// A widget is mounted lazily: `mount` is only called the first time the
// card is expanded, so heavy code (renderer canvas, CheerpJ) is never
// loaded on page view. Typically `(el) => import("./widgets/x").then(m => m.mount(el))`.
// It may return a cleanup function.
export interface ProjectWidget {
  label: string;
  mount: (el: HTMLElement) => Promise<void | (() => void)> | void | (() => void);
}

export interface ProjectCard {
  id: string;
  learnGoal: string;
  title: string;
  claim: string;
  what: string;
  tags: string[];
  meta: string;
  links: ProjectLink[];
  decisions: string[];
  challenge: string;
  origin: string;
  status?: string;
  screenshots?: { src: string; alt: string }[];
  widget?: ProjectWidget;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderProjectCard(card: ProjectCard): string {
  const panelId = `details-${card.id}`;
  return `
    <article class="pcard" data-card="${esc(card.id)}">
      <p class="pcard-goal">${esc(card.learnGoal)}</p>
      <h3 class="pcard-title">${esc(card.title)}</h3>
      ${card.status ? `<span class="pcard-status">${esc(card.status)}</span>` : ""}
      <p class="pcard-claim">${esc(card.claim)}</p>
      <p class="pcard-what">${esc(card.what)}</p>
      <ul class="pcard-tags">${card.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <p class="pcard-meta">${esc(card.meta)}</p>
      <div class="pcard-links">
        ${card.links
          .map(
            (l) =>
              `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`,
          )
          .join("")}
      </div>
      <button class="pcard-toggle" type="button" aria-expanded="false" aria-controls="${panelId}">
        Details
      </button>
      <div class="pcard-details" id="${panelId}" data-lenis-prevent>
        <div class="pcard-details-inner">
          <h4>Entscheidungen</h4>
          <ul class="pcard-decisions">${card.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          <h4>Herausforderung</h4>
          <p>${esc(card.challenge)}</p>
          <h4>So entstanden</h4>
          <p>${esc(card.origin)}</p>
          ${
            card.screenshots?.length
              ? `<div class="pcard-shots">${card.screenshots
                  .map((s) => `<img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" />`)
                  .join("")}</div>`
              : ""
          }
          ${card.widget ? `<div class="pcard-widget" aria-label="${esc(card.widget.label)}"></div>` : ""}
        </div>
      </div>
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
