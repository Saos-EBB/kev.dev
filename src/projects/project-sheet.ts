// Lite mode (phones / narrow tablets, see LITE in viewport.ts): the
// projects are a vertical list of short entries (renderProjectTeaser), and
// tapping one opens the whole project in a full-screen sheet — head,
// bullet points, visual, then Why? / Learned! / Code as accordions. One
// sheet element, its content is swapped in per project.
//
// The sheet lives inside the projects section, so the facet buttons in it
// (Live-Demo, Screens …) are picked up by facet-overlay.ts as usual; that
// overlay stacks on top of the sheet. Background scroll is locked
// (lenis.stop + html.psheet-open), ESC and the back button close it, and
// it takes a history entry so the phone's own back gesture closes it too.

import type Lenis from "lenis";
import "./project-sheet.css";
import { RTL } from "../i18n";
import { UI } from "../i18n/ui";
import { renderProjectSheet, type ProjectCard } from "./project-cards";

let closeSheet: () => void = () => {};

// For the kev.dev card's "Du bist schon drin" (main.ts): jumping to the
// hero has to take the sheet away first.
export function closeProjectSheet() {
  closeSheet();
}

export function initProjectSheet(root: HTMLElement, cards: ProjectCard[], lenis: Lenis) {
  const sheet = document.createElement("div");
  sheet.className = "psheet";
  sheet.hidden = true;
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-labelledby", "psheet-title");
  sheet.dataset.lenisPrevent = "";
  sheet.innerHTML = `
    <div class="psheet-bar">
      <button class="psheet-back" type="button">${RTL ? "→" : "←"} ${UI.projectBack}</button>
    </div>
    <div class="psheet-body"></div>
  `;
  root.appendChild(sheet);

  const body = sheet.querySelector<HTMLElement>(".psheet-body")!;
  const back = sheet.querySelector<HTMLButtonElement>(".psheet-back")!;
  let opener: HTMLElement | null = null;
  let ownsHistoryEntry = false;

  const hide = () => {
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.documentElement.classList.remove("psheet-open");
    lenis.start();
    opener?.focus({ preventScroll: true });
    opener = null;
  };

  const open = (id: string, from: HTMLElement) => {
    const i = cards.findIndex((c) => c.id === id);
    if (i < 0) return;
    body.innerHTML = renderProjectSheet(cards[i], i, cards.length);
    sheet.style.setProperty("--pc", cards[i].accent);
    sheet.scrollTop = 0;
    sheet.hidden = false;
    document.documentElement.classList.add("psheet-open");
    lenis.stop();
    opener = from;
    back.focus({ preventScroll: true });
    if (!ownsHistoryEntry) {
      history.pushState({ psheet: id }, "");
      ownsHistoryEntry = true;
    }
  };

  // Closing by button/ESC also pops the entry we pushed; the browser's
  // back gesture arrives here as popstate and only has to hide it.
  closeSheet = () => {
    if (sheet.hidden) return;
    if (ownsHistoryEntry) history.back();
    else hide();
  };
  window.addEventListener("popstate", () => {
    ownsHistoryEntry = false;
    hide();
  });

  root.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-open-project]");
    if (btn) open(btn.dataset.openProject!, btn);
  });
  back.addEventListener("click", closeSheet);

  document.addEventListener("keydown", (e) => {
    if (sheet.hidden || e.key !== "Escape") return;
    // ESC inside the facet overlay closes only that overlay.
    if (document.querySelector(".facet-overlay:not([hidden])")) return;
    closeSheet();
  }, true); // capture: runs before the overlay's own ESC handler hides it
}
