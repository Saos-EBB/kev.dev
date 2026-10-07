// Impressum/Datenschutz used to be separate full-page-reload routes. That
// meant every visit killed and rebuilt the whole page: the YouTube player
// included, so music cut out and had to reload from scratch (a ~2s gap),
// and the header's dancer icon had to fake a "resume" that occasionally
// glitched into a visible wake-up/collapse blip. Living as hidden overlay
// panels on the one-pager instead means the JS/player context never gets
// destroyed in the first place — switching to Impressum is just toggling
// visibility, nothing else on the page (music, theme, scroll position)
// is touched.
//
// Routing is a plain URL hash (#impressum / #datenschutz): opening one
// sets location.hash (a normal <a href="#impressum"> already does this on
// its own), closing clears it. That keeps deep links and back/forward
// working without pulling in a router.
import type Lenis from "lenis";
import { UI } from "../i18n/ui";
import { LANG, RTL } from "../i18n";
import { DATENSCHUTZ, IMPRESSUM } from "./legal-content";
import { hasConsent, revokeConsent, type ConsentId } from "../consent";

// The privacy policy's "withdraw consent" rows (slot .legal-consents in
// legal-content.ts): current state per feature plus a withdraw button.
const CONSENTS: { id: ConsentId; label: () => string; loaded: () => boolean }[] = [
  { id: "youtube", label: () => UI.consentYoutube, loaded: () => "YT" in window },
  { id: "cheerpj", label: () => UI.consentCheerpj, loaded: () => "cheerpjInit" in window },
  { id: "facedots", label: () => UI.consentFacedots, loaded: () => document.documentElement.dataset.faceModel === "loaded" },
];

function renderConsents(slot: HTMLElement) {
  slot.innerHTML = CONSENTS.map(({ id, label }) => {
    const on = hasConsent(id);
    return `<div class="legal-consent-row">
      <span>${label()}: <b>${on ? UI.consentOn : UI.consentOff}</b></span>
      <button type="button" data-revoke="${id}" ${on ? "" : "disabled"}>${UI.consentRevoke}</button>
    </div>`;
  }).join("");
}

interface LegalRoute {
  hash: string;
  title: string;
  html: string;
}

// Texts in the page language — see legal-content.ts (German is binding).
const ROUTES: LegalRoute[] = [
  { hash: "impressum", ...IMPRESSUM },
  { hash: "datenschutz", ...DATENSCHUTZ },
];

export function initLegalOverlay(lenis: Lenis) {
  const panels = new Map<string, HTMLElement>();

  for (const route of ROUTES) {
    const panel = document.createElement("div");
    panel.className = "legal-overlay";
    panel.dataset.route = route.hash;
    // Lenis is stopped while a panel is open, and a stopped Lenis swallows
    // wheel/touch everywhere — this opts the panel's own scroll out of it.
    panel.setAttribute("data-lenis-prevent", "");
    panel.innerHTML = `
      <main class="legal-main">
        <article class="legal">
          ${UI.legalNote ? `<p class="legal-lang-note" lang="${LANG}">${UI.legalNote}</p>` : ""}
          <div>${route.html}</div>
          <a class="legal-back" href="#">${RTL ? "&rarr;" : "&larr;"} ${UI.legalBack}</a>
        </article>
      </main>
    `;
    document.body.appendChild(panel);
    panels.set(route.hash, panel);

    const consentSlot = panel.querySelector<HTMLElement>(".legal-consents");
    consentSlot?.addEventListener("click", (e) => {
      const id = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-revoke]")?.dataset.revoke as ConsentId | undefined;
      if (!id) return;
      revokeConsent(id);
      // Already loaded in this page: only a reload really stops it (the hash
      // keeps this panel open). Otherwise just show the new state.
      if (CONSENTS.find((c) => c.id === id)!.loaded()) location.reload();
      else renderConsents(consentSlot);
    });

    // preventDefault so the empty-fragment href never triggers the
    // browser's native "no target → scroll to top of document" fallback
    // — that would silently reset the main page's scroll position out
    // from under Lenis. replaceState instead of leaving the old hash
    // around also means the back button, on close, goes to wherever the
    // visitor actually was before opening this panel.
    panel.querySelector<HTMLAnchorElement>(".legal-back")?.addEventListener("click", (e) => {
      e.preventDefault();
      history.replaceState(null, "", location.pathname + location.search);
      render();
    });
  }

  const siteTitle = document.title;
  let isOpen = false;
  let wasStoppedBeforeOpen = false;

  function currentRoute(): string | null {
    const hash = location.hash.replace(/^#/, "");
    return panels.has(hash) ? hash : null;
  }

  function render() {
    const active = currentRoute();

    if (active && !isOpen) {
      // Closed → open: remember whether Lenis was already stopped for an
      // unrelated reason (e.g. the intro loader) so closing doesn't
      // resume scrolling that wasn't ours to resume.
      wasStoppedBeforeOpen = lenis.isStopped;
      lenis.stop();
    } else if (!active && isOpen) {
      if (!wasStoppedBeforeOpen) lenis.start();
    }
    isOpen = Boolean(active);

    document.documentElement.classList.toggle("legal-open", isOpen);
    document.title = active ? `${ROUTES.find((r) => r.hash === active)!.title} — Kevin Schaberl` : siteTitle;

    for (const [hash, panel] of panels) {
      const isActive = hash === active;
      panel.classList.toggle("is-open", isActive);
      if (isActive) {
        panel.scrollTop = 0;
        const slot = panel.querySelector<HTMLElement>(".legal-consents");
        if (slot) renderConsents(slot);
      }
    }
  }

  window.addEventListener("hashchange", render);
  render();
}
