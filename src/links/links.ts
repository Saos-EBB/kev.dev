// /links, the footer's "More stuff": the sites worth showing besides the
// portfolio. The screens in public/more-stuff/ are shots of the live pages. Public
// page, so only what those pages show themselves goes in here.
import "./links.css";
import { LANG, pick } from "../i18n";

const t = (de: string, en: string) => pick({ de, en, ru: en, ja: en });

type Site = { name: string; url: string; what: string; why: string; shots: [string, string][] };

const SITES: Site[] = [
  {
    name: "kev.dev Casual",
    url: "https://kevdev-casual.vercel.app",
    what: t(
      "Mein Angebot für Produktseiten mit 3D und Scroll-Animationen, dazu drei Demos mit erfundenen Produkten: ein Kaffeefilter, ein Laptop und eine Limo.",
      "My offer for product pages with 3D and scroll animation, plus three demos with made-up products: a coffee filter, a laptop and a soda.",
    ),
    why: t(
      "Die freundliche, verkaufende Seite neben dem Portfolio. Sie ist selbst wie eine Produktseite gebaut, und die Demos zeigen die Arbeit, statt sie zu beschreiben.",
      "The friendly, selling page next to the portfolio. It is built like a product page itself, and the demos show the work instead of describing it.",
    ),
    shots: [
      ["casual-1", t("Startseite mit 3D-Visitenkarten", "Home page with 3D business cards")],
      ["casual-2", t("Laptop-Demo Kern 14, im Ganzen", "Kern 14 laptop demo, assembled")],
      ["casual-3", t("Derselbe Laptop in Einzelteilen", "The same laptop taken apart")],
      ["casual-4", t("Technische Daten der Demo", "The demo's technical specs")],
    ],
  },
  {
    name: "kev.dev Engineering",
    url: "https://kevdev-engineering.vercel.app",
    what: t(
      "Meine Projekte als Präsentation: ein Foliensatz pro Projekt mit Architektur, Schlüsselmodulen, Entscheidungen und Messungen.",
      "My projects as a presentation: one slide deck per project with architecture, key modules, decisions and measurements.",
    ),
    why: t(
      "Für Leute, die wissen wollen, wie etwas gebaut ist und nicht nur, wie es aussieht. Jede Folie nennt ihre Quelle, damit man es nachprüfen kann.",
      "For people who want to know how something is built, not just how it looks. Every slide names its source, so it can be checked.",
    ),
    shots: [
      ["engineering-1", t("Der Überblick", "The overview")],
      ["engineering-2", t("3D-Renderer: die Werkzeugkette", "3D renderer: the tool chain")],
      ["engineering-3", t("3D-Renderer: Entscheidungen samt Verworfenem", "3D renderer: decisions, with what was rejected")],
    ],
  },
  {
    name: t("Das Portfolio als Kopf-CT", "The portfolio as a head CT"),
    url: "/ct-look",
    what: t(
      "Meine Projekte in einem Schädel aus Punkten, der sich beim Scrollen öffnet. Jedes Projekt ist eine Hirnregion. Am Ende treffen ihn Sägeblätter, und die Splitter sind die Kontakt-Links. Die Seite gibt es nur auf Deutsch.",
      "My projects inside a skull made of points that opens as you scroll. Every project is a brain region. At the end saw blades hit it, and the shards are the contact links. The page is in German only.",
    ),
    why: t(
      "Eine einzige Idee trägt hier die ganze Seite, statt dass 3D nur Deko ist. Der Schädel ist ein CT-Datensatz aus meinem eigenen 3D-Renderer.",
      "One single idea carries the whole page here, instead of 3D being mere decoration. The skull is a CT dataset from my own 3D renderer.",
    ),
    shots: [
      ["ct-1", t("Der Schädel öffnet sich", "The skull opens")],
      ["ct-2", t("Ein Projekt als Hirnregion", "A project as a brain region")],
      ["ct-3", t("Der Atlas mit den kleineren Projekten", "The atlas of the smaller projects")],
      ["ct-4", t("Kontakt: Sägeblätter und Splitter", "Contact: saw blades and shards")],
    ],
  },
  {
    name: t("Das frühere Portfolio", "The earlier portfolio"),
    url: "https://saos-repo.vercel.app",
    what: t(
      "Mein Portfolio vor kev.dev, in Next.js: Profil, Projekte und Über mich als getrennte Seiten, dazu eine Pitch-Seite für das White-Label-Konzept von YourBrand.",
      "My portfolio before kev.dev, in Next.js: profile, projects and about as separate pages, plus a pitch page for YourBrand's white-label concept.",
    ),
    why: t(
      "Jede Seite soll für sich verschickbar sein: Wer nur die Fakten braucht, bekommt nur die Fakten, und wer mehr will, klickt weiter.",
      "Each page can be sent on its own: whoever needs only the facts gets only the facts, and whoever wants more clicks on.",
    ),
    shots: [
      ["portfolio-1", t("Profil, nur die Fakten", "Profile, just the facts")],
      ["portfolio-2", t("Die drei wichtigsten Projekte", "The three key projects")],
      ["portfolio-3", t("Pitch-Seite für das White-Label-Konzept", "Pitch page for the white-label concept")],
    ],
  },
  {
    name: t("Der Lebenslauf", "The CV"),
    url: "https://saosme-navy.vercel.app",
    what: t(
      "Mein Lebenslauf als eigene Seite im Terminal-Look: Profil, Skills, Projekte, Werdegang und Kontakt.",
      "My CV as its own page in a terminal look: profile, skills, projects, career and contact.",
    ),
    why: t(
      "Die Oberfläche ist bewusst ohne UI-Framework wie Bootstrap oder Tailwind gebaut, jedes Element folgt einem strengen Raster. Die Seite ist also selbst schon eine Arbeitsprobe.",
      "The interface is deliberately built without a UI framework like Bootstrap or Tailwind, with every element on a strict grid. So the page is a work sample in itself.",
    ),
    shots: [
      ["cv-1", t("Einstieg mit Drahtgitter-Würfel", "Start with a wireframe cube")],
      ["cv-2", t("Kontakt", "Contact")],
    ],
  },
];

document.documentElement.lang = LANG;
document.getElementById("links")!.className = "links";
document.getElementById("links")!.innerHTML = `
  <a class="links-back" href="/">← kev.dev</a>
  <h1 class="links-title">More stuff</h1>
  <p class="links-lead">${t("Was ich sonst noch gebaut habe, was es ist und warum es so ist.", "What else I built, what it is and why it is that way.")}</p>
  ${SITES.map((s) => `
    <section class="site">
      <h2>${s.name}</h2>
      <div class="site-text">
        <div><h3>${t("Was es ist", "What it is")}</h3><p>${s.what}</p></div>
        <div><h3>${t("Warum es so ist", "Why it is that way")}</h3><p>${s.why}</p></div>
      </div>
      <a class="site-open" href="${s.url}" target="_blank" rel="noopener">${t("Seite öffnen", "Open site")} ↗</a>
      <div class="site-screens">
        ${s.shots.map(([file, alt]) => `<a href="/more-stuff/${file}.webp" target="_blank" rel="noopener"><img src="/more-stuff/${file}.webp" alt="${alt}" width="1280" height="800" loading="lazy" decoding="async" /></a>`).join("")}
      </div>
    </section>`).join("")}
  <footer class="links-foot">
    <span>© 2026 Kevin Schaberl</span>
    <a href="/impressum">Impressum</a>
    <a href="/datenschutz">Datenschutz</a>
  </footer>`;
