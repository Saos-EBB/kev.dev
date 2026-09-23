// About overlay blocks (A1–A5). Facts (A1) / story (A2) / stance (A3) /
// way of working (A4) / taste (A5). Copy is verbatim from the handoff;
// anything Kevin still has to decide is shown as a visible [OFFEN: …].

import "./about-blocks.css";

// Kevin drops his CV PDF into public/cv/ under this name.
const CV_HREF = "/cv/lebenslauf.pdf";

const PRINCIPLES = [
  "Etwas nervt mich oder interessiert mich — dann baue ich es.",
  "Ich habe noch nie akzeptiert, dass etwas nicht geht.",
  "Ich wollte es wissen.",
];

const open = (text: string) => `<p class="about-open">[OFFEN: ${text}]</p>`;

// A1–A4: shown before the CV facts.
export function renderAboutBlocks(): string {
  return `
    <section class="about-block about-card" aria-label="Kurzprofil">
      <h2 class="about-card-name">Kevin Schaberl</h2>
      <p class="about-card-role">Junior Software Developer</p>
      <p>Raum Linz · remote im DACH-Raum</p>
      <p>sofort verfügbar</p>
      <p>TypeScript-Fullstack · Autodidakt</p>
      <a class="about-button" href="${CV_HREF}" download>Lebenslauf ↓</a>
    </section>

    <section class="about-block" aria-labelledby="about-story">
      <h3 class="about-heading" id="about-story">Der Weg hierher</h3>
      ${open("die 6 Absätze der Story fehlen im Repo — Kevin liefert den Text; 1:1 übernehmen oder leicht straffen")}
    </section>

    <section class="about-block" aria-label="Grundsätze">
      ${PRINCIPLES.map((q) => `<blockquote class="about-quote">${q}</blockquote>`).join("")}
      ${open("finale Auswahl 3–4 Grundsätze durch Kevin")}
    </section>

    <section class="about-block" aria-labelledby="about-work">
      <h3 class="about-heading" id="about-work">Wie ich arbeite</h3>
      ${open("finaler Wortlaut A4 inkl. CC-Framing")}
    </section>
  `;
}

// A5: soft footer, after the CV facts.
export function renderAboutFooter(): string {
  return `
    <section class="about-block about-footer" aria-label="Zum Schluss">
      ${open("Playlist-Link „was beim Bauen läuft“ — Kevin fügt ihn später ein")}
      <div class="about-cta">
        <a class="about-button" href="#projects">Projekte</a>
        <a class="about-button" href="${CV_HREF}" download>Lebenslauf ↓</a>
      </div>
    </section>
  `;
}
