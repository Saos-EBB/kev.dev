// Facet tiles + one shared, accessible overlay for every project card. A
// tile opens the SAME overlay element; its content is swapped in per
// click, resolved straight from the card's existing fields (Code -> the
// GitHub link, Screenshots -> screenshots, Details -> decisions/
// challenge/origin, Live-Demo -> widget, B2B -> the YourBrand link) so
// nothing is duplicated or reworded.
//
// Static content only for now: a Live-Demo facet with a widget shows its
// mount point but doesn't call `widget.mount()` yet — that's wired up
// once this lands (see the widget-facets follow-up), keeping the heavy
// widget code out of the bundle until then.
//
// Accessibility (non-negotiable per the handoff): focus trap, ESC and
// backdrop close it, background scroll is locked (lenis.stop/start, same
// pattern as the SAOS intro overlay in main.ts), and focus returns to the
// tile that opened it. Mobile (<=640px) is a full-screen sheet, not a
// small popup (facet-overlay.css).

import "./facet-overlay.css";
import type Lenis from "lenis";
import type { ProjectCard, ProjectWidget, FacetKind } from "./project-cards";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Feather-style outline icons, matching the stroke weight already used
// for the contact section's GitHub/mail/phone icons (main.ts).
const ICONS: Record<FacetKind, string> = {
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18-6-6 6-6M15 6l6 6-6 6" /></svg>`,
  screenshots: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 16-4.5-4.5a2 2 0 0 0-2.8 0L7 18" /></svg>`,
  details: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 16v-6M12 8h.01" /></svg>`,
  "live-demo": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4" /></svg>`,
  b2b: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6M9 12h.01M15 12h.01M9 16h.01M15 16h.01" /></svg>`,
};

const LABELS: Record<FacetKind, string> = {
  code: "Code",
  screenshots: "Screenshots",
  details: "Details",
  "live-demo": "Live-Demo",
  b2b: "B2B-Seite",
};

export function renderFacetTiles(card: ProjectCard): string {
  if (!card.facets?.length) return "";
  return `
    <div class="pcard-part pcard-part--facets">
      <div class="facet-tiles" role="group" aria-label="Mehr zu ${esc(card.title)}">
        ${card.facets
          .map(
            (kind) => `
          <button class="facet-tile" type="button" data-card="${esc(card.id)}" data-facet="${kind}">
            ${ICONS[kind]}
            <span>${LABELS[kind]}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

interface FacetContent {
  title: string;
  bodyHtml: string;
  widget?: ProjectWidget;
}

const findLink = (card: ProjectCard, test: RegExp) => card.links?.find((l) => test.test(l.label));

function resolveFacetContent(card: ProjectCard, kind: FacetKind): FacetContent {
  switch (kind) {
    case "code": {
      const gh = findLink(card, /github/i);
      return {
        title: "Code",
        bodyHtml:
          gh?.href
            ? `<p><a class="facet-link" href="${esc(gh.href)}" target="_blank" rel="noopener noreferrer">${esc(gh.label)} ↗</a></p>`
            : `<p class="pcard-open">[OFFEN: GitHub-Link fehlt]</p>`,
      };
    }
    case "screenshots":
      return {
        title: "Screenshots",
        bodyHtml: card.screenshots?.length
          ? `<div class="pcard-shots">${card.screenshots
              .map((s) => `<img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" />`)
              .join("")}</div>`
          : `<p class="pcard-open">[OFFEN: Screenshots fehlen]</p>`,
      };
    case "details": {
      const sections = [
        card.decisions?.length
          ? `<div class="pcard-sec"><h4>Entscheidungen</h4><ul class="pcard-decisions">${card.decisions
              .map((d) => `<li>${esc(d)}</li>`)
              .join("")}</ul></div>`
          : "",
        card.challenge || card.origin
          ? `<div class="pcard-sec">${card.challenge ? `<h4>Herausforderung</h4><p>${esc(card.challenge)}</p>` : ""}${
              card.origin ? `<h4>So entstanden</h4><p>${esc(card.origin)}</p>` : ""
            }</div>`
          : "",
      ].join("");
      return {
        title: "Details",
        bodyHtml: sections || `<p class="pcard-open">[OFFEN: Entscheidungen/Herausforderung fehlen noch]</p>`,
      };
    }
    case "live-demo": {
      if (card.widget) {
        return { title: card.widget.label, bodyHtml: `<div class="pcard-widget"></div>`, widget: card.widget };
      }
      const demo = findLink(card, /live-demo/i);
      return {
        title: "Live-Demo",
        bodyHtml: demo
          ? demo.href
            ? `<p><a class="facet-link" href="${esc(demo.href)}" target="_blank" rel="noopener noreferrer">${esc(demo.label)} ↗</a></p>`
            : `<p>${esc(demo.label)}</p>`
          : `<p class="pcard-open">[OFFEN: Live-Demo-Info fehlt]</p>`,
      };
    }
    case "b2b":
      return {
        title: "B2B-Seite",
        bodyHtml: `<p class="pcard-open">[OFFEN: URL der barrierefreien B2B-Seite fehlt — Kevin liefert]</p>`,
      };
  }
}

let overlayEl: HTMLElement | null = null;
let lastFocused: HTMLElement | null = null;

function isOpen(): boolean {
  return overlayEl ? !overlayEl.hidden : false;
}

function trapFocus(e: KeyboardEvent) {
  const panel = overlayEl!.querySelector<HTMLElement>(".facet-overlay-panel")!;
  const focusables = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function ensureOverlay(lenis: Lenis): HTMLElement {
  if (overlayEl) return overlayEl;

  const el = document.createElement("div");
  el.className = "facet-overlay";
  el.hidden = true;
  el.innerHTML = `
    <div class="facet-overlay-backdrop" data-close></div>
    <div class="facet-overlay-panel" role="dialog" aria-modal="true" aria-labelledby="facet-overlay-title">
      <button class="facet-overlay-close" type="button" data-close aria-label="Schließen">✕</button>
      <h3 class="facet-overlay-title" id="facet-overlay-title"></h3>
      <div class="facet-overlay-body"></div>
    </div>
  `;
  document.body.appendChild(el);
  overlayEl = el;

  const close = () => {
    if (!isOpen()) return;
    el.hidden = true;
    lenis.start();
    lastFocused?.focus();
    lastFocused = null;
  };

  el.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") close();
    else if (e.key === "Tab") trapFocus(e);
  });

  return el;
}

export function initFacetOverlay(root: HTMLElement, cards: ProjectCard[], lenis: Lenis) {
  const byId = new Map(cards.map((c) => [c.id, c]));

  root.addEventListener("click", (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLButtonElement>(".facet-tile");
    if (!tile) return;
    const card = byId.get(tile.dataset.card ?? "");
    const kind = tile.dataset.facet as FacetKind | undefined;
    if (!card || !kind) return;

    const el = ensureOverlay(lenis);
    const content = resolveFacetContent(card, kind);
    el.querySelector(".facet-overlay-title")!.textContent = content.title;
    el.querySelector(".facet-overlay-body")!.innerHTML = content.bodyHtml;
    el.hidden = false;
    lenis.stop();
    lastFocused = tile;
    el.querySelector<HTMLElement>(".facet-overlay-close")!.focus();
  });
}
