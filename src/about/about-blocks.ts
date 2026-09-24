// About overlay blocks (A1–A5). Facts (A1) / story (A2) / stance (A3) /
// way of working (A4) / taste (A5). Copy is verbatim from the handoff;
// anything Kevin still has to decide is shown as a visible [OFFEN: …].

import "./about-blocks.css";

// Kevin drops his CV PDF into public/cv/ under this name.
const CV_HREF = "/cv/lebenslauf.pdf";

const PRINCIPLES = [
  "Wenn das Konzept durchdacht ist, ist das Implementieren der entspannte Teil.",
  "Einfache Lösungen brechen weniger leicht — und jeder nach mir versteht sie.",
  "Gute Software muss man im Prozess hassen und lieben, sonst wird\u2019s nichts.",
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
      ${open("Story-Absätze fehlen im Repo — Kevin liefert den Text; der Planungs-Faden (Bodenleger → Systemadministrator → Code) wird dann eingewoben")}
    </section>

    <section class="about-block" aria-label="Grundsätze">
      ${PRINCIPLES.map((q) => `<blockquote class="about-quote">${q}</blockquote>`).join("")}
    </section>

    <section class="about-block" aria-labelledby="about-work">
      <h3 class="about-heading" id="about-work">Wie ich arbeite</h3>
      <p>Ich denke, bevor ich baue. Planung war schon als Bodenleger das A und O — Rapport-Muster für verwinkelte Gänge, die durchlaufen mussten — und als Systemadministrator erst recht: Termine, Ausfallpläne, Behörden, alles unter Zeitdruck. Beim Code ist es dieselbe Denkweise, nur neues Werkzeug: Ist das Konzept durchdacht, ist das Implementieren der entspannte Teil. Ich setze Ideen direkt um und teste sie; hakt es, ist das für mich das Signal, dass der Plan noch nicht scharf genug war — dann gehe ich einen Schritt zurück, strukturiere neu und setze wieder an, bis es sitzt. Die Umsetzung läuft heute oft über Claude Code als Implementierungs-Agent: Architektur und Entscheidungen kommen von mir, CC baut, ich kontrolliere und schärfe nach. Dieselbe Schleife, nur schneller.</p>
    </section>
  `;
}

// A5: soft footer, after the CV facts.
export function renderAboutFooter(): string {
  return `
    <section class="about-block about-footer" aria-label="Zum Schluss">
      <p>Wenn ich nicht am Bildschirm sitze, bastle ich meistens trotzdem an irgendwas — aus reiner Lust am Bauen.</p>
      <div class="about-cta">
        <a class="about-button" href="#projects">Projekte</a>
        <a class="about-button" href="${CV_HREF}" download>Lebenslauf ↓</a>
      </div>
    </section>
  `;
}
