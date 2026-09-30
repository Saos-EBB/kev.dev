// About section: a CSS-3D corridor (one-point perspective) that simply
// scrolls past with the rest of the page — no pin, no faked motion
// (grid streaming, drift, etc). The four side walls are flat panels
// sized to the shaft depth and rotated 90deg around the edge they share
// with the front (viewport) plane, so their far edge lands exactly on
// the back wall. No per-vertex math for the convergence — once the
// geometry lines up, the browser's own perspective projection draws the
// taper toward the vanishing point.

import type Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { viewportHeight } from "../viewport";

// The CV facts — sourced from b2b-cv's lib/portfolio/career.ts (CAREER,
// EDUCATION, SKILLS, LANGUAGES). Rendered as labeled sections after the
// blocks A1–A4 (about-blocks.ts), on the same backwall overlay.
export interface CvSection {
  heading: string;
  items: string[];
}

// A highlighted term per row, same accent treatment as the story/work text
// (about-blocks.ts) — the role/category up front, details in plain text.
const hl = (s: string) => `<span class="about-highlight">${s}</span>`;

export const cvSections: CvSection[] = [
  {
    heading: "Werdegang",
    items: [
      `${hl("Junior Developer")} — Full-Stack-Bootcamp · Talent Hub – IT Ibis Acam, Linz · Okt 2025 – Jun 2026`,
      `${hl("Sanierung Wohnhaus")} (Familienprojekt) · Linz-Ebelsberg · Jun 2023 – Okt 2025`,
      `${hl("Administrator")} · BBU GmbH, Linz · Jan 2022 – Jun 2023`,
      `${hl("Zivildiener")} · BBU GmbH, Linz · Mär 2021 – Dez 2021`,
      `${hl("Auslandsaufenthalt")} · Schwerpunkt Europa · Sep 2019 – Feb 2021`,
      `${hl("Sonnenschutztechniker")} · SUNSTAR, Leonding · Jul 2017 – Apr 2019`,
      `${hl("Bodenleger")} · Bodendesign Mittermayer, Linz · Sep 2012 – Mai 2017`,
    ],
  },
  {
    heading: "Ausbildung",
    items: [
      `${hl("Pflichtschule, Gymnasium")}`,
      `${hl("Full-Stack-Bootcamp")} — Zertifikat Junior Developer (2026)`,
    ],
  },
  {
    heading: "Skills",
    items: [
      `${hl("Backend und Daten")} — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker`,
      `${hl("Frontend")} — React, Next.js, Tailwind, Zustand, Canvas 2D`,
      `${hl("Werkzeuge und Automatisierung")} — Node.js, Python, Playwright, Ollama, Git`,
      `${hl("Grundlagen")} — Java, OOP, SQL, Datenstrukturen, 3D-Mathematik`,
    ],
  },
  {
    heading: "Sprachen",
    items: [`${hl("Deutsch")} — Muttersprache`, `${hl("Englisch")} — siehe Lebenslauf`],
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
//
// Driven off lenis's own "scroll" event (same cheap pattern as
// scroll/progress.ts's initScrollProgress) instead of an own
// requestAnimationFrame loop: recomputing this needs the section's
// current top, which used to come from a fresh getBoundingClientRect()
// every single frame — forced layout, run forever from page load,
// whether or not the page was even scrolling. section top/height barely
// change (only on resize/layout), so they're cached here and only that
// arithmetic runs per scroll tick.
export function trackElevatorPerspective(section: HTMLElement, lenis: Lenis) {
  const elevator = section.querySelector<HTMLElement>(".elevator");
  if (!elevator) return;

  // sectionTop: document-flow offset (rect.top + scrollY), not tied to
  // scroll position. sectionHeight: unaffected by transition.ts's pin —
  // GSAP pins via position, never resizes the trigger element.
  let sectionTop = 0;
  let sectionHeight = 1;
  // The scroll position at which transition.ts's `start: "bottom bottom"`
  // ScrollTrigger pins #about — from there on the section's rect.top is
  // frozen (pinned), not "sectionTop - scroll" anymore.
  let pinStartScroll = 0;

  function measure() {
    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    sectionHeight = rect.height || 1;
    pinStartScroll = sectionTop + sectionHeight - viewportHeight();
  }
  measure();
  ScrollTrigger.addEventListener("refresh", measure);

  // Same value transition.ts's pin freezes rect.top to once pinned
  // ("bottom bottom": section bottom flush with viewport bottom).
  const pinnedTop = () => viewportHeight() - sectionHeight;

  function update() {
    const top =
      lenis.scroll < pinStartScroll ? sectionTop - lenis.scroll : pinnedTop();
    const originY = ((viewportHeight() / 2 - top) / sectionHeight) * 100;
    elevator!.style.perspectiveOrigin = `50% ${originY}%`;
  }
  lenis.on("scroll", update);
  update();
}
