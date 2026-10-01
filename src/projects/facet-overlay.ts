// Facet tiles + one shared, accessible overlay for every project card. A
// tile opens the SAME overlay element; its content is swapped in per
// click, resolved straight from the card's existing fields (Code -> the
// GitHub link, Screenshots -> screenshots, Details -> decisions/
// challenge/origin, Live-Demo -> widget, B2B -> the YourBrand link) so
// nothing is duplicated or reworded.
//
// A Live-Demo facet's widget (renderer canvas, CheerpJ terminal) is
// mounted lazily, only on the first time that card's Live-Demo tile is
// opened — the heavy widget code never loads on page view. Its host stays
// permanently in a hidden, always-connected container (widgetHosts) and
// is only ever moved (not recreated or removed) in and out of the
// overlay body: since the overlay's other content is rebuilt via
// innerHTML on every click, recreating the host each open would destroy
// a running widget — restarting a 30-100s CheerpJ boot every time the
// user closes and reopens the overlay.
//
// Accessibility (non-negotiable per the handoff): focus trap, ESC and
// backdrop close it, background scroll is locked (lenis.stop/start, same
// pattern as the SAOS intro overlay in main.ts), and focus returns to the
// tile that opened it. Mobile (<=640px) is a full-screen sheet, not a
// small popup (facet-overlay.css).

import { UI } from "../i18n/ui";
import "./facet-overlay.css";
import type Lenis from "lenis";
import { displayText, type ProjectCard, type ProjectWidget, type FacetKind } from "./project-cards";

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
  "live-demo": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4" /></svg>`,
  screens: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="1" /><path d="M8 21h8M12 17v4" /></svg>`,
  self: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>`,
  b2b: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6M9 12h.01M15 12h.01M9 16h.01M15 16h.01" /></svg>`,
};

const LABELS: Record<FacetKind, string> = {
  "live-demo": UI.facetLiveDemo,
  b2b: UI.facetB2b,
  screens: UI.facetScreens,
  self: UI.facetSelf,
};

export function renderFacetTiles(card: ProjectCard): string {
  if (!card.facets?.length) return "";
  return `
    <div class="facet-tiles" role="group" aria-label="${esc(UI.moreAbout(card.title))}">
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
  `;
}

interface FacetContent {
  title: string;
  bodyHtml: string;
  widget?: ProjectWidget;
}

const B2B_PAGE: ProjectWidget = {
  label: UI.b2bTitle,
  mount: (el) => {
    el.classList.add("b2b-frame-host");
    const frame = document.createElement("iframe");
    frame.className = "b2b-frame";
    frame.src = "/yourbrand/";
    frame.title = `YourBrand — ${UI.b2bTitle}`;
    el.appendChild(frame);
  },
};

const findLink = (card: ProjectCard, test: RegExp) => card.links?.find((l) => test.test(l.label));

function resolveFacetContent(card: ProjectCard, kind: FacetKind): FacetContent {
  switch (kind) {
    case "live-demo": {
      if (card.widget) {
        // bodyHtml unused here: the widget's persistent host is moved in
        // by the caller instead (see widgetHosts below).
        return { title: card.widget.label, bodyHtml: "", widget: card.widget };
      }
      const demo = findLink(card, /live-demo/i);
      return {
        title: UI.facetLiveDemo,
        bodyHtml: demo
          ? demo.href
            ? `<p><a class="facet-link" href="${esc(demo.href)}" target="_blank" rel="noopener noreferrer">${esc(demo.label)} ↗</a></p>`
            : `<p>${esc(demo.label)}</p>`
          : `<p class="pcard-open">[OFFEN: Live-Demo-Info fehlt]</p>`,
      };
    }
    case "self":
      return { title: card.title, bodyHtml: "" };
    case "screens":
      return {
        title: UI.screensTitle(card.title),
        bodyHtml: card.screenshots?.length
          ? `<div class="facet-gallery">${card.screenshots
              .map(
                (s) => `<figure><img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" /><figcaption>${esc(s.alt)}</figcaption></figure>`,
              )
              .join("")}</div>`
          : `<p class="pcard-open">[OFFEN: Screenshots fehlen]</p>`,
      };
    case "b2b":
      // The white-label sales page (yourbrand/, from the b2b-cv repo) —
      // its own React page, so it lives in an iframe: its styles stay out
      // of the portfolio. Handled like a widget, so the workspace shows it
      // full-screen and the frame is only created on the first open (moving
      // it in and out of the overlay reloads it, which is fine here).
      return { title: UI.b2bTitle, bodyHtml: "", widget: B2B_PAGE };
  }
}

// Widget hosts: one persistent <div class="pcard-widget"> per card,
// created on first mount and never removed — only ever reparented
// between this hidden container and the overlay body, so the widget
// itself (and its DOM/state) survives closing and reopening the overlay.
let hostContainer: HTMLElement | null = null;
const widgetHosts = new Map<string, HTMLElement>();
const mountedWidgets = new Set<string>();
let activeWidgetCardId: string | null = null;

function ensureHostContainer(): HTMLElement {
  if (hostContainer) return hostContainer;
  hostContainer = document.createElement("div");
  hostContainer.hidden = true;
  document.body.appendChild(hostContainer);
  return hostContainer;
}

function getWidgetHost(cardId: string): HTMLElement {
  let host = widgetHosts.get(cardId);
  if (!host) {
    host = document.createElement("div");
    host.className = "pcard-widget";
    ensureHostContainer().appendChild(host);
    widgetHosts.set(cardId, host);
  }
  return host;
}

// Moves the currently-shown widget host (if any) back to the hidden
// container, so it keeps running out of view instead of being destroyed.
function parkActiveWidget() {
  if (!activeWidgetCardId) return;
  const host = widgetHosts.get(activeWidgetCardId);
  if (host) ensureHostContainer().appendChild(host);
  activeWidgetCardId = null;
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
    <div class="facet-overlay-panel" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="facet-overlay-title">
      <button class="facet-overlay-close" type="button" data-close aria-label="${UI.close}">✕</button>
      <h3 class="facet-overlay-title" id="facet-overlay-title"></h3>
      <p class="facet-overlay-sub"></p>
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
  // The embedded B2B page's "Portfolio" link asks to be closed.
  window.addEventListener("message", (e) => {
    if (e.origin === window.location.origin && e.data === "yourbrand:close") close();
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

  // opener is null for a tile clicked inside the open overlay (Screens
  // box): it swaps the content, focus still returns to the card's button.
  const show = (el: HTMLElement, opener: HTMLElement | null, card?: ProjectCard) => {
    const panel = el.querySelector<HTMLElement>(".facet-overlay-panel")!;
    if (card) panel.style.setProperty("--pc", card.accent);
    else panel.style.removeProperty("--pc");
    el.hidden = false;
    lenis.stop();
    if (opener) lastFocused = opener;
    el.querySelector<HTMLElement>(".facet-overlay-close")!.focus();
  };

  // A box's expand button: the overlay shows that box's full content,
  // copied from the card itself — nothing rendered twice from the data.
  root.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".pcard-expand");
    if (!btn) return;
    const boxEl = btn.closest<HTMLElement>(".pcard-part")!;
    const card = byId.get(btn.closest<HTMLElement>(".pcard")?.dataset.card ?? "");
    const el = ensureOverlay(lenis);
    parkActiveWidget();
    el.classList.remove("facet-overlay--workspace");
    el.querySelector(".facet-overlay-sub")!.textContent = "";
    el.querySelector(".facet-overlay-title")!.innerHTML = displayText(
      `${card?.title ?? ""} — ${boxEl.querySelector(".pcard-box-heading")!.textContent}`,
    );
    el.querySelector(".facet-overlay-body")!.innerHTML = boxEl.querySelector(".pcard-box-body")!.innerHTML;
    show(el, btn, card);
  });

  // Anything with data-facet opens it: the head's facet buttons and the
  // signature visuals' own buttons (project-visuals.ts). Listened for on
  // document, not just the section, so it also works inside the overlay.
  document.addEventListener("click", (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-facet]");
    if (!tile) return;
    const inOverlay = !!overlayEl?.contains(tile);
    if (!inOverlay && !root.contains(tile)) return;
    const card = byId.get(tile.dataset.card ?? "");
    const kind = tile.dataset.facet as FacetKind | undefined;
    if (!card || !kind) return;
    if (kind === "self") return; // handled in main.ts — it's this page, not an overlay

    const el = ensureOverlay(lenis);
    const content = resolveFacetContent(card, kind);
    const body = el.querySelector<HTMLElement>(".facet-overlay-body")!;

    parkActiveWidget();
    // A live widget gets the workspace: the whole screen, the project's
    // name as the title and the widget's own label under it.
    el.classList.toggle("facet-overlay--workspace", !!content.widget);
    el.querySelector(".facet-overlay-title")!.innerHTML = displayText(content.widget ? card.title : content.title);
    el.querySelector(".facet-overlay-sub")!.textContent = content.widget ? content.title : "";

    if (content.widget) {
      body.replaceChildren();
      const hostId = `${card.id}:${kind}`;
      const host = getWidgetHost(hostId);
      body.appendChild(host);
      activeWidgetCardId = hostId;
      if (!mountedWidgets.has(hostId)) {
        mountedWidgets.add(hostId);
        Promise.resolve(content.widget.mount(host, card)).catch(() => {
          mountedWidgets.delete(hostId);
          host.textContent = UI.widgetError;
        });
      }
    } else {
      body.innerHTML = content.bodyHtml;
    }

    show(el, inOverlay ? null : tile, card);
  });
}
