// About section: a CSS-3D corridor (one-point perspective) that simply
// scrolls past with the rest of the page — no pin, no faked motion
// (grid streaming, drift, etc). The four side walls are flat panels
// sized to the shaft depth and rotated 90deg around the edge they share
// with the front (viewport) plane, so their far edge lands exactly on
// the back wall. No per-vertex math for the convergence — once the
// geometry lines up, the browser's own perspective projection draws the
// taper toward the vanishing point.

// The CV facts — sourced from b2b-cv's lib/portfolio/career.ts (CAREER,
// EDUCATION, SKILLS, LANGUAGES). Rendered as labeled sections after the
// narrative above, on the same backwall overlay.
export interface CvSection {
  heading: string;
  items: string[];
}

export const cvSections: CvSection[] = [
  {
    heading: "Werdegang",
    items: [
      "Junior Developer — Full-Stack-Bootcamp · Talent Hub – IT Ibis Acam, Linz · Okt 2025 – Jun 2026",
      "Sanierung Wohnhaus (Familienprojekt) · Linz-Ebelsberg · Jun 2023 – Okt 2025",
      "Administrator · BBU GmbH, Linz · Jan 2022 – Jun 2023",
      "Zivildiener · BBU GmbH, Linz · Mär 2021 – Dez 2021",
      "Auslandsaufenthalt · Schwerpunkt Europa · Sep 2019 – Feb 2021",
      "Sonnenschutztechniker · SUNSTAR, Leonding · Jul 2017 – Apr 2019",
      "Bodenleger · Bodendesign Mittermayer, Linz · Sep 2012 – Mai 2017",
    ],
  },
  {
    heading: "Ausbildung",
    items: [
      "Pflichtschule, Gymnasium",
      "Full-Stack-Bootcamp — Zertifikat Junior Developer (2026)",
    ],
  },
  {
    heading: "Skills",
    items: [
      "Backend und Daten — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker",
      "Frontend — React, Next.js, Tailwind, Zustand, Canvas 2D",
      "Werkzeuge und Automatisierung — Node.js, Python, Playwright, Ollama, Git",
      "Grundlagen — Java, OOP, SQL, Datenstrukturen, 3D-Mathematik",
    ],
  },
  {
    heading: "Sprachen",
    items: ["Deutsch — Muttersprache", "Englisch — siehe Lebenslauf"],
  },
];

// The one thing that isn't static: the vanishing point has to track the
// *viewport's* current center as you scroll, not sit fixed at the
// middle of the whole (very tall) corridor. A real corridor works the
// same way — the point you're looking toward is always at your own eye
// level. Without this, the ceiling/floor would be rendered as if seen
// from one fixed spot, so they'd look wrong (over- or under-angled) for
// most of the scroll instead of leveling out to a sliver exactly when
// you're looking straight at them and opening up as you pass.
export function trackElevatorPerspective(section: HTMLElement) {
  const elevator = section.querySelector<HTMLElement>(".elevator");
  if (!elevator) return;

  // Measured from the section's live rect, not from scrollY: transition.ts
  // pins this section at its end, and scrollY keeps growing while it's
  // held — the vanishing point has to stay at the *viewport's* center,
  // wherever the section itself currently sits.
  function update() {
    const rect = section.getBoundingClientRect();
    const originY = ((window.innerHeight / 2 - rect.top) / (rect.height || 1)) * 100;
    elevator!.style.perspectiveOrigin = `50% ${originY}%`;
    requestAnimationFrame(update);
  }
  update();
}
