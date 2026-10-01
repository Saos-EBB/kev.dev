// About overlay blocks (A1–A5). Facts (A1) / story (A2) / stance (A3) /
// way of working (A4) / taste (A5). Copy is verbatim from the handoff;
// anything Kevin still has to decide is shown as a visible [OFFEN: …].
// The copy itself, in every language, lives in about-content.ts.

import "./about-blocks.css";
import { ABOUT } from "./about-content";
import { UI } from "../i18n/ui";

// Kevin drops his CV PDF into public/cv/ under this name.
const CV_HREF = "/cv/lebenslauf.pdf";

// A1–A4: shown before the CV facts.
export function renderAboutBlocks(): string {
  return `
    <section class="about-block about-card" aria-label="${UI.aboutProfileAria}">
      <h2 class="about-card-name">Kevin Schaberl</h2>
      <p class="about-card-role">${ABOUT.role}</p>
      ${ABOUT.facts.map((f) => `<p>${f}</p>`).join("")}
      <a class="about-button" href="${CV_HREF}" download>${UI.cvButton}</a>
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
        <a class="about-button" href="${CV_HREF}" download>${UI.cvButton}</a>
      </div>
    </section>
  `;
}
