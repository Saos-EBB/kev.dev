// About overlay blocks (A1–A5). Facts (A1) / story (A2) / stance (A3) /
// way of working (A4) / taste (A5). Copy is verbatim from the handoff;
// anything Kevin still has to decide is shown as a visible [OFFEN: …].
// The copy itself, in every language, lives in about-content.ts.

import "./about-blocks.css";
import { ABOUT } from "./about-content";
import { UI } from "../i18n/ui";

// The CV in the site's look, dark and light (built by scripts/build-cv.mjs).
// The links point at the dark one; initCvLinks swaps in the light one at
// click time when the page is in light mode.
const CV_FILE = (theme: "dark" | "light") => `/cv/lebenslauf-kevin-schaberl-${theme}.pdf`;
const CV_HREF = CV_FILE("dark");
const CV_DOWNLOAD = "lebenslauf-kevin-schaberl.pdf";

// A1–A4: shown before the CV facts.
export function renderAboutBlocks(): string {
  return `
    <section class="about-block about-card" aria-label="${UI.aboutProfileAria}">
      <h2 class="about-card-name">Kevin Schaberl</h2>
      <p class="about-card-role">${ABOUT.role}</p>
      ${ABOUT.facts.map((f) => `<p>${f}</p>`).join("")}
      <a class="about-button" href="${CV_HREF}" download="${CV_DOWNLOAD}" data-cv>${UI.cvButton}</a>
    </section>

    <section class="about-block" aria-labelledby="about-story">
      <h3 class="about-heading" id="about-story">${UI.aboutStory}</h3>
      ${ABOUT.story.map((p) => `<p>${p}</p>`).join("")}
    </section>

    <section class="about-block" aria-label="${UI.aboutPrinciplesAria}">
      ${ABOUT.principles.map((q) => `<blockquote class="about-quote">${q}</blockquote>`).join("")}
    </section>

    <section class="about-block" aria-labelledby="about-work">
      <h3 class="about-heading" id="about-work">${UI.aboutWork}</h3>
      ${ABOUT.work.map((p) => `<p>${p}</p>`).join("")}
    </section>
  `;
}

// A5: soft footer, after the CV facts.
export function renderAboutFooter(): string {
  return `
    <section class="about-block about-footer" aria-label="${UI.aboutEndAria}">
      <p>${ABOUT.end}</p>
      <div class="about-cta">
        <a class="about-button" href="#projects">${UI.aboutProjectsButton}</a>
        <a class="about-button" href="${CV_HREF}" download="${CV_DOWNLOAD}" data-cv>${UI.cvButton}</a>
      </div>
    </section>
  `;
}

// Hands out the CV matching the current theme (light mode sets
// data-theme="light" on <html>, see theme.ts).
export function initCvLinks() {
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-cv]");
    if (!link) return;
    const light = document.documentElement.dataset.theme === "light";
    link.href = CV_FILE(light ? "light" : "dark");
  });
}
