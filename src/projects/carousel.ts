// Scroll-driven 3D project carousel: a cylinder with the viewer at its
// center axis. Cards are stuck to the inside of the cylinder wall,
// facing inward toward the viewer, in a slow descending spiral around
// the inside. The angle between cards is fixed at 360/CARDS_PER_LAYER
// (not 360/total) — every four cards complete one full lap and form a
// "layer" of the spiral, then the next four start a layer below. That
// keeps the angular gap between neighbors constant and roomy no matter
// how many projects get added; more projects just add more layers
// instead of squeezing the ring tighter. Scrolling rotates the whole
// cylinder around the viewer, sweeping cards from right to left until
// the next one settles dead ahead — that's the active card.
//
// GSAP + ScrollTrigger pin the section for the ride and drive a single
// scroll-progress value; Lenis is wired to it in main.ts so there's one
// shared scroll instead of two competing systems.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";

gsap.registerPlugin(ScrollTrigger);

export type Badge = "project" | "tool" | "ground-up";

export const BADGE_LABEL: Record<Badge, string> = {
  project: "Projekt",
  tool: "Werkzeug",
  "ground-up": "Von Grund auf",
};

export interface Project {
  title: string;
  role: string;
  /** One line: what does this project prove? Shown right under the title. */
  proves: string;
  bullets: string[]; // top 2 highlights — the card has room for these, not the full b2b-cv description
  tags: string[];
  badge: Badge;
  href: string; // GitHub repo
  image?: string; // public/-relative screenshot; projects without one render text-only
  // "horizontal" (image band up top) vs "vertical" (text-only, more room
  // for bullets) — picked per project by whether it has a screenshot to
  // show, not a fixed choice; card footprint/position on the cylinder
  // stays identical either way, only the content inside reflows.
  layout: "horizontal" | "vertical";
}

// Sourced from b2b-cv's lib/portfolio/content.ts (the PROJECTS array
// there) — same seven projects, same order (by strength, not chronology,
// per that file's own comment), German only since this site has no
// language toggle. Bullets trimmed to the top 2 per project to fit the
// card; full descriptions stay on GitHub.
export const projects: Project[] = [
  {
    title: "YourBrand",
    role: "Modulare White-Label-Plattform",
    proves:
      "Beweist Umfang: allein von der Datenbank bis zum Frontend, mit Zahlungen, Echtzeit und DSGVO-Ablauf.",
    bullets: [
      "NestJS + PostgreSQL/PostGIS Backend mit Echtzeit-Chat über WebSockets",
      "Stripe-Zahlungen und vollständiger DSGVO-konformer Consent-Flow",
    ],
    tags: ["NestJS", "Next.js", "PostgreSQL", "PostGIS", "WebSockets", "Stripe"],
    badge: "project",
    href: "https://github.com/Saos-EBB/WhiteLabel-SaaS---Comunity-Plattform-",
    image: "/projects/yourbrand.png",
    layout: "horizontal",
  },
  {
    title: "TschoBBo",
    role: "Lokaler Job-Scraper + LLM-Anschreiben",
    proves:
      "Beweist Urteilsvermögen: lokale Sprachmodelle statt Cloud, und der Versand bleibt bewusst manuell.",
    bullets: [
      "Scrape → Filter → Anschreiben-Pipeline über mehrere Jobportale",
      "Mehrere lokale Ollama-Modelle verglichen und für Qualität/RAM-Verbrauch ausgewählt",
    ],
    tags: ["TypeScript", "Node.js", "Playwright", "Ollama"],
    badge: "tool",
    href: "https://github.com/Saos-EBB/jobsuche-apply-bot",
    image: "/projects/jobbot.jpeg",
    layout: "horizontal",
  },
  {
    title: "3D-Wireframe-Renderer",
    role: "Canvas, ohne Bibliothek",
    proves:
      "Beweist Tiefe: Projektion, Rotation und Tiefenschattierung von Hand, ohne Bibliothek.",
    bullets: [
      "Eigene Projektion und Rotation, Tiefen-Shading in 16 Stufen aus der echten z-Spanne des Meshes",
      "Cutaway über Flächen-Schwerpunkte: die Schnittkante bleibt gezackt, das Innere liegt hohl frei",
    ],
    tags: ["JavaScript", "Canvas 2D", "Node.js", "Python"],
    badge: "ground-up",
    href: "https://github.com/Saos-EBB/Renderder",
    layout: "vertical",
  },
  {
    title: "ReleaseWatcher",
    role: "CLI, spoilerfrei",
    proves: "Beweist Zurückhaltung: das Werkzeug tut genau eine Sache und keine mehr.",
    bullets: [
      "Reiner HTTP-Status-Check — kein Scraping, keine Vorschau, keine Spoiler",
      "Watchlist im Terminal: hinzufügen, löschen, alle auf einmal prüfen",
    ],
    tags: ["JavaScript", "CLI"],
    badge: "tool",
    href: "https://github.com/Saos-EBB/ReleaseWatcher",
    image: "/projects/releasewatcher.png",
    layout: "horizontal",
  },
  {
    title: "Pokémon Battle-Sim",
    role: "Java-Original → SAOS·BOY-Port",
    proves:
      "Beweist Objektorientierung: Klassenhierarchie, Kampfschleife und Datenhaltung selbst entworfen.",
    bullets: [
      "Klassenhierarchie für Pokémon und Attacken",
      "Rundenbasierte Kampfschleife mit Textausgabe",
    ],
    tags: ["Java"],
    badge: "ground-up",
    href: "https://github.com/Saos-EBB/pkemn",
    layout: "vertical",
  },
  {
    title: "RPN-Rechner",
    role: "Java, Datenstrukturen von Grund auf",
    proves:
      "Beweist Grundlagen: verkettete Liste und Stack selbst gebaut, statt die fertigen zu nehmen.",
    bullets: [
      "Selbst implementierte einfach verkettete Liste",
      "Stack darauf aufgebaut, zum Auswerten der Ausdrücke genutzt",
    ],
    tags: ["Java"],
    badge: "ground-up",
    href: "https://github.com/Saos-EBB/RPN-Calculator",
    layout: "vertical",
  },
  {
    title: "Game of Life",
    role: "Java, Terminal",
    proves:
      "Beweist Genauigkeit: Nachbarschaftslogik und Zykluserkennung, erst auf Papier, dann im Code.",
    bullets: [
      "Gitter- und Nachbar-Zähllogik von Grund auf gebaut",
      "Schritt-für-Schritt-Simulation mit Zykluserkennung — stoppt von selbst, wenn sich ein Muster wiederholt",
    ],
    tags: ["Java"],
    badge: "ground-up",
    href: "https://github.com/Saos-EBB/-GAMES-/tree/main/GameOfLife",
    layout: "vertical",
  },
];

const CARDS_PER_LAYER = 4; // one full lap of the cylinder per layer
// 90deg is already the max spacing four cards can have on one lap, so
// widening it further isn't on the table without dropping below 4/layer —
// RADIUS is the real lever for "more air": a bigger ring puts the same
// 90deg apart cards further apart in actual screen space.
const ANGLE_PER_CARD = 360 / CARDS_PER_LAYER;
// The viewer sits at the ring's axis, so every card is the same RADIUS
// from them regardless of angle — but NOT the same distance from the eye
// (which sits off-axis, `perspective` px back): the dead-ahead card is
// the ring's farthest point from the eye (perspective + RADIUS), while a
// card swinging toward the back is the ring's *closest* point
// (|perspective - RADIUS|) — the smaller RADIUS is, relative to
// perspective, the less that gap swings between "far" and "right in your
// face". A bigger RADIUS alone can't fix both; it just moves where the
// swing happens.
const RADIUS = 650;
const Y_STEP = 60; // px each card descends from the previous one
const FOV_HALF = 70; // deg — cards past this from dead-ahead are fully hidden (not just dim, see the opacity floor removal below) — well before they'd reach the close/behind part of the ring
const OTHER_LAYER_DIM = 0.35; // extra dim for cards sharing the active card's angular slot on a different layer, so they read as floors above/below rather than a second active card
const ACTIVE_SCALE = 1.12; // the centered card grows slightly, reads as "free and big"
const MIN_SCALE = 0.82; // cards at the edge of focus shrink instead of staying full-size while just fading

// Slow near 0/1 (a card sitting centered), fast through the middle (the
// swap between cards) — applied per card-step so the ring eases into a
// brief dwell on each active card instead of drifting through at a flat
// linear rate.
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function initCarousel(section: HTMLElement) {
  const track = section.querySelector<HTMLElement>(".carousel-track");
  const cards = Array.from(
    section.querySelectorAll<HTMLAnchorElement>(".carousel-card"),
  );
  const n = cards.length;
  if (!track || n === 0) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: the CSS fallback (see style.css, scoped to
  // :not(.force-motion)) lays these out as a plain static grid of
  // normal links — nothing here needs to run at all.
  if (reducedMotion) return;

  const layerOf = (i: number) => Math.floor(i / CARDS_PER_LAYER);

  // Each card's fixed spot on the cylinder wall — set once, never
  // touched again except for the trailing scale() (below), which layout()
  // rewrites every frame. Negative RADIUS (receding into the screen)
  // combined with the un-flipped rotateY already faces the card inward
  // toward the viewer at the axis, no extra 180deg flip needed.
  const baseTransforms = cards.map((card, i) => {
    const y = i * Y_STEP;
    const angle = -i * ANGLE_PER_CARD;
    const base = `translateY(${y}px) rotateY(${angle}deg) translateZ(${-RADIUS}px) translate(-50%, -50%)`;
    card.style.transform = `${base} scale(1)`;
    return base;
  });

  function normalizeAngle(deg: number) {
    let a = deg % 360;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    return a;
  }

  function layout(progress: number) {
    // Positive trackAngle here + negative per-card angle above is the
    // combination that sweeps cards right-to-left in screen space while
    // still bringing them into the active spot in array order (0..n-1)
    // — verified by eye, not just by the angle math.
    const raw = progress * (n - 1);
    const step = Math.floor(raw);
    const frac = raw - step;
    const easedRaw = Math.min(step + easeInOutCubic(frac), n - 1);
    const trackAngle = easedRaw * ANGLE_PER_CARD;
    track!.style.transform = `rotateY(${trackAngle}deg)`;

    // Fixed 90deg spacing means every 4th card lands back in the same
    // angular slot (one layer down), so angle alone can't tell the true
    // active card from its lower-floor twins — pick it from raw (not
    // eased) scroll progress instead, and dim anything outside that
    // layer.
    const activeIdx = Math.round(raw);
    const activeLayer = layerOf(activeIdx);

    for (let i = 0; i < n; i++) {
      const card = cards[i];
      const rel = normalizeAngle(-i * ANGLE_PER_CARD + trackAngle);
      const abs = Math.abs(rel);
      const isActive = i === activeIdx;
      let focus = Math.max(0, 1 - abs / FOV_HALF);
      if (layerOf(i) !== activeLayer) focus *= OTHER_LAYER_DIM;
      const scale = MIN_SCALE + (ACTIVE_SCALE - MIN_SCALE) * focus;

      card.style.transform = `${baseTransforms[i]} scale(${scale})`;
      // No opacity floor: cards outside FOV_HALF go fully to 0 instead of
      // staying faintly visible — otherwise they're still on screen (and
      // uncomfortably close, see RADIUS above) while swinging through the
      // side/back of the ring, just dim instead of gone.
      card.style.opacity = String(focus);
      card.classList.toggle("is-active", isActive);
      card.style.pointerEvents = isActive ? "auto" : "none";
      card.tabIndex = isActive ? 0 : -1;
    }
  }

  layout(0);

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: `+=${(n - 1) * TIMINGS.projects.scrollPerCard + window.innerHeight}`,
    pin: true,
    scrub: TIMINGS.projects.scrub,
    onUpdate: (self) => layout(self.progress),
  });
}
