// Desktop: the small projects (tools + along the way) as a catalog under
// the pinned carousel, which only carries the big three now. Each tile
// shows the project's own signature visual; "Open" brings up the full card
// the carousel used to show, in an overlay sliding in from the right — the
// same markup (renderProjectCard), so its tabs, facets and widgets work as
// before (initBigCards / initFacetOverlay run on this section too).

import type Lenis from "lenis";
import { UI } from "../i18n/ui";
import { displayText, esc, indexLine, renderProjectCard, type ProjectCard } from "./project-cards";
import { renderVisual } from "./project-visuals";
import { renderArcade } from "./arcade";
import "./catalog.css";

function tile(card: ProjectCard, index: number, total: number): string {
  const tags = card.tags?.slice(0, 3) ?? [];
  return `
    <article class="ctile" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      <p class="pcard-index">${indexLine(card, index, total)}</p>
      <h3 class="ctile-title">${displayText(card.title)}</h3>
      <p class="ctile-claim">${esc(card.claim)}</p>
      <div class="ctile-viz pcard--${card.layout}" aria-hidden="true" inert>
        ${card.layout === "portrait" ? `<canvas class="ctile-face" data-face-dots></canvas>` : `<div class="pcard-visual">${renderVisual(card)}</div>`}
      </div>
      <div class="ctile-foot">
        ${tags.length ? `<ul class="ctile-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        <button type="button" class="ctile-open" data-catalog-open="${esc(card.id)}">${esc(UI.catalogOpen)} →</button>
      </div>
    </article>`;
}

// titleFx: main.ts's gradient + shine wrapper for the "PROJEKTE" word.
export function renderCatalog(all: ProjectCard[], titleFx: (text: string) => string): string {
  const small = all.filter((c) => c.group !== "big");
  return `
    <div class="catalog-head">
      <div class="catalog-title-row"><h2 class="catalog-title">${titleFx(UI.projects)}</h2><span class="catalog-tag">${esc(UI.catalogTag)}</span></div>
      <p class="catalog-lead">${esc(UI.catalogLead)}</p>
    </div>
    <div class="catalog-grid">
      ${small.map((c) => (c.id === "grundlagen" ? renderArcade : tile)(c, all.indexOf(c), all.length)).join("")}
    </div>
    <div class="catalog-dialog" role="dialog" aria-modal="true" aria-label="${esc(UI.projects)}" hidden data-lenis-prevent>
      <button type="button" class="catalog-close">✕ ${esc(UI.catalogClose)} · Esc</button>
      <div class="catalog-dialog-body">
        ${small.filter((c) => c.id !== "grundlagen").map((c) => `<div class="catalog-full" data-card="${esc(c.id)}" hidden>${renderProjectCard(c, all.indexOf(c), all.length)}</div>`).join("")}
      </div>
    </div>`;
}

export function initCatalog(section: HTMLElement, lenis: Lenis) {
  const dialog = section.querySelector<HTMLElement>(".catalog-dialog")!;
  let opener: HTMLElement | null = null;
  // Only the dialog's own slide, not a transition bubbling up from inside it.
  const hideWhenSlidOut = (e: TransitionEvent) => {
    if (e.target !== dialog) return;
    dialog.removeEventListener("transitionend", hideWhenSlidOut);
    dialog.hidden = true;
  };

  const open = (id: string, from: HTMLElement) => {
    dialog.removeEventListener("transitionend", hideWhenSlidOut); // reopened while still sliding out
    dialog.querySelectorAll<HTMLElement>(".catalog-full").forEach((el) => {
      el.hidden = el.dataset.card !== id;
    });
    opener = from;
    dialog.hidden = false;
    // next frame: the slide-in transition needs the visible start state first
    requestAnimationFrame(() => dialog.classList.add("is-open"));
    lenis.stop();
    dialog.querySelector<HTMLElement>(".catalog-close")!.focus();
  };
  const close = () => {
    if (dialog.hidden) return;
    dialog.classList.remove("is-open");
    lenis.start();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches && !document.documentElement.classList.contains("force-motion")) dialog.hidden = true;
    else dialog.addEventListener("transitionend", hideWhenSlidOut);
    opener?.focus();
  };

  // Tab cycles inside the open card instead of walking the hidden page behind it.
  const keepFocusInside = (e: KeyboardEvent) => {
    const all = [...dialog.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")]
      .filter((el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.offsetParent !== null);
    const first = all[0], last = all[all.length - 1];
    const now = document.activeElement as HTMLElement;
    if (!dialog.contains(now) || (e.shiftKey && now === first) || (!e.shiftKey && now === last)) {
      e.preventDefault();
      (e.shiftKey ? last : first)?.focus();
    }
  };

  // Past the big cards' long pinned ride in one jump, like the #contact links.
  document.querySelector(".catalog-jump")?.addEventListener("click", (e) => {
    e.preventDefault();
    lenis.scrollTo(section, { immediate: true });
  });

  section.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>("[data-catalog-open]");
    // The whole tile opens, unless the visitor was just selecting its text.
    const tile = target.closest<HTMLElement>(".ctile");
    if (btn) open(btn.dataset.catalogOpen!, btn);
    else if (tile && !getSelection()?.toString()) {
      const own = tile.querySelector<HTMLElement>("[data-catalog-open]")!;
      open(own.dataset.catalogOpen!, own);
    } else if ((e.target as HTMLElement).closest(".catalog-close")) close();
  });
  document.addEventListener("keydown", (e) => {
    // the facet overlay (above this one) handles its own keys first
    if (document.querySelector(".facet-overlay:not([hidden])")) return;
    if (e.key === "Escape") close();
    else if (e.key === "Tab" && !dialog.hidden) keepFocusInside(e);
  });
}
