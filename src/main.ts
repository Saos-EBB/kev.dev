// First: sets <html lang/dir> from the stored language before anything renders.
import { UI } from "./i18n/ui";
import { renderLangSwitch, initLangSwitch } from "./i18n/switcher";
import roomSvg from "./assets/room.svg?raw";
import "@fontsource-variable/jetbrains-mono";
import "./style.css";
import "./reading.css";
import "./i18n/i18n.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Cloth } from "./hero/cloth";
import { cvSections, trackElevatorPerspective } from "./about/elevator";
import { renderAboutBlocks, renderAboutFooter, initCvLinks } from "./about/about-blocks";
import { initYoutubeButton } from "./music/youtube";
import { initThemeToggle } from "./theme/theme";
import { initLegalOverlay } from "./legal/legal-overlay";
import { initCarousel } from "./projects/carousel";
import { projectCards } from "./projects/projects-data";
import { renderProjectCard, renderProjectTeaser } from "./projects/project-cards";
import { initFacetOverlay } from "./projects/facet-overlay";
import { initContact, getContactRevealScrollY } from "./contact/contact";
import { initScrollProgress } from "./scroll/progress";
import { initEdgeNav } from "./scroll/edge-nav";
import { initBoxToGridTransition } from "./scroll/transition";
import { mountSaosLoader } from "./intro/saos-intro";
import { LITE, LITE_QUERY, makeHeightOnlyResizeFilter, viewportHeight } from "./viewport";
import { closeProjectSheet, initProjectSheet } from "./projects/project-sheet";
import { HERO_NAMES } from "./hero/hero-names";
import { startNameTypewriter } from "./hero/name-typewriter";
import { hexToRgb } from "./colors";

gsap.registerPlugin(ScrollTrigger);

// Force-enables all motion for local testing when the OS/browser reports
// prefers-reduced-motion. Cloth/Elevator use this themselves for their
// own JS animation loops, but a plain JS check can't override an
// `@media (prefers-reduced-motion: reduce)` block — that's browser/OS-
// driven and CSS-only. This class is what actually lets style.css's
// reduced-motion fallback rules be switched off too (see the
// `:root:not(.force-motion)` scoping there).
// FORCE_MOTION_EVERYWHERE: on for now — every visitor gets the full
// motion, the OS setting is ignored in production too. Set it to false to
// go back to: always on in `npm run dev` (import.meta.env.DEV), and in
// production only via an explicit `?motion` in the URL, so real
// visitors' OS setting is respected.
const FORCE_MOTION_EVERYWHERE = true;
if (
  FORCE_MOTION_EVERYWHERE ||
  import.meta.env.DEV ||
  new URLSearchParams(window.location.search).has("motion")
) {
  document.documentElement.classList.add("force-motion");
}

if (LITE) document.documentElement.classList.add("lite");
// The scroll scenes are built for one mode at load (see LITE in
// viewport.ts) — crossing the breakpoint (rotating a tablet, dragging a
// desktop window narrow) rebuilds the page in the other one.
window.matchMedia(LITE_QUERY).addEventListener("change", () => location.reload());

// Smooth-scroll base for the whole page, wired to GSAP's ticker so Lenis
// and ScrollTrigger (used by the project carousel) share one scroll
// instead of running two competing rAF loops.
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// "PROJEKTE": the gradient text plus the white copy the shine band shows
// (see .title-fill / .title-shine in style.css).
function titleFx(text: string) {
  return `<span class="title-fill">${text}</span><span class="title-shine" aria-hidden="true"><span class="title-shine-text">${text}</span></span>`;
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="scrollbar" aria-hidden="true">
    <div class="scrollbar-thumb"></div>
  </div>

  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-header-brand" href="#hero"><span class="site-header-brand-name">Kevin Schaberl / </span><span class="brand-accent">SAOS</span></a>
      <nav class="site-header-links" aria-label="${UI.navAria}">
        <a href="#about">${UI.navAbout}</a>
        <a href="#projects">${UI.navProjects}</a>
        <a href="#contact">${UI.navContact}</a>
        <span class="music-controls">
          <button class="music-button" type="button" aria-label="${UI.musicPlay}" aria-pressed="false">
            <svg class="music-icon music-icon--play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            <svg class="music-icon music-icon--pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          </button>
          <a class="dancer-link" target="_blank" rel="noopener noreferrer" aria-label="${UI.playlistOpen}">
            <svg class="dancer idle" viewBox="0 0 120 160" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" aria-hidden="true">
              <g class="figure">
                <g class="body">
                  <line x1="60" y1="46" x2="60" y2="95" />
                  <g class="head"><circle cx="60" cy="28" r="12" fill="currentColor" stroke="none" /></g>
                  <g class="arm-l"><line x1="60" y1="48" x2="38" y2="72" /></g>
                  <g class="arm-r"><line x1="60" y1="48" x2="82" y2="72" /></g>
                  <g class="leg-l"><line x1="60" y1="95" x2="46" y2="135" /></g>
                  <g class="leg-r"><line x1="60" y1="95" x2="74" y2="135" /></g>
                </g>
              </g>
            </svg>
          </a>
        </span>
        <button class="theme-toggle" type="button" aria-label="${UI.themeToLight}" aria-pressed="false">
          <svg class="theme-icon theme-icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <svg class="theme-icon theme-icon--moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        ${renderLangSwitch()}
      </nav>
    </div>
  </header>

  <div class="music-panel" aria-hidden="true"><div class="music-mount"></div></div>

  <section class="hero" id="hero">
    <div class="hero-frame">
      <div class="hero-rule"></div>
      <div class="cloth-body">
        <div class="hero-content">
          <h1 class="hero-name">Kevin Schaberl</h1>
          <p class="hero-subtitle">${UI.heroSubtitle}</p>
        </div>
      </div>
      <div class="hero-rule"></div>
      <canvas id="cloth-canvas" aria-hidden="true"></canvas>
    </div>
  </section>

  <section class="about" id="about">
    <div class="about-zoom">
    <div class="elevator" aria-hidden="true">
      <div class="elevator-shaft">
        <div class="elevator-wall elevator-wall--left"></div>
        <div class="elevator-wall elevator-wall--right"></div>
        <div class="elevator-wall elevator-wall--ceiling"></div>
        <div class="elevator-wall elevator-wall--floor"><div class="elevator-floor-glow"></div></div>
        <div class="elevator-backwall"></div>
      </div>
      <div class="elevator-vignette elevator-vignette--top"></div>
      <div class="elevator-vignette elevator-vignette--bottom"></div>
    </div>

    <div class="office" aria-hidden="true">
      ${roomSvg}
      <div class="office-screen"></div>
    </div>
    </div>

    <div class="about-overlay">
      ${renderAboutBlocks()}
      ${cvSections
        .map(
          (section) => `
        <div class="about-cv-section">
          <h3 class="about-cv-heading">${section.heading}</h3>
          <ul class="about-cv-list">
            ${section.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `,
        )
        .join("")}
      ${renderAboutFooter()}
    </div>
  </section>

  <div class="projects-headline" aria-hidden="true">${titleFx(UI.projects)}</div>

  <section class="projects" id="projects">
    <div class="projects-bg-grid" aria-hidden="true"></div>
    <div class="projects-saos" aria-hidden="true"></div>
    <h2 class="projects-title">${titleFx(UI.projects)}</h2>
    ${
      LITE
        ? `<div class="project-list">
            ${projectCards.map((card, i) => renderProjectTeaser(card, i, projectCards.length)).join("")}
          </div>`
        : `<div class="carousel-stage">
            ${projectCards
              .map(
                (card, i) => `
              <div class="carousel-project" data-project="${i}" data-count="1">
                ${renderProjectCard(card, i, projectCards.length)}
              </div>
            `,
              )
              .join("")}
          </div>`
    }
  </section>

  <section class="contact" id="contact">
    <div class="contact-bg-grid" aria-hidden="true"></div>
    <div class="contact-inner">
      <h2 class="contact-headline">${UI.contactHeadline}</h2>
      <div class="contact-raygun" hidden></div>
      <a class="contact-mail" href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a>
      <ul class="contact-icons">
        <li>
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.78 5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
        </li>
        <li>
          <a href="mailto:kevin.schaberl.work@gmail.com" aria-label="${UI.email}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 5h18v14H3z" />
              <path d="m3 6 9 7 9-7" />
            </svg>
          </a>
        </li>
        <li>
          <a href="#contact" aria-label="${UI.phone}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
        </li>
      </ul>
    </div>
  </section>

  <footer class="footer footer--floating">
    <div class="footer-inner">
      <p class="footer-copy">© 2026 <span class="footer-copy-name">Kevin Schaberl / </span><span class="brand-accent">SAOS</span></p>
      <nav class="footer-links" aria-label="${UI.legalAria}">
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="mailto:kevin.schaberl.work@gmail.com">Mail</a>
        <a href="#impressum">${UI.impressum}</a>
        <a href="#datenschutz">${UI.datenschutz}</a>
      </nav>
    </div>
  </footer>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#cloth-canvas")!;
const clothBody = document.querySelector<HTMLElement>(".cloth-body")!;
const heroContent = document.querySelector<HTMLElement>(".hero-content")!;
const heroName = document.querySelector<HTMLElement>(".hero-name")!;
const heroSubtitle = document.querySelector<HTMLElement>(".hero-subtitle")!;

// Scales an element's font-size so its (single-line) text is exactly
// targetWidth wide, regardless of viewport size or which display font is active.
function fitToWidth(el: HTMLElement, targetWidth: number) {
  if (targetWidth <= 0) return;
  const probeSize = 100;
  el.style.fontSize = `${probeSize}px`;
  const naturalWidth = el.scrollWidth || 1;
  el.style.fontSize = `${(targetWidth / naturalWidth) * probeSize}px`;
}

// Same, for a block that already spans its container (so scrollWidth would
// just report the container): probe the text's natural width shrink-wrapped.
// maxHeightFrac caps the block's total height (line-height is 1, so font
// size + vertical padding) at that share of the viewport — on wide screens
// a full-width line would otherwise eat the space the projects need.
function fitBlockToWidth(el: HTMLElement, maxHeightFrac = 1) {
  const style = getComputedStyle(el);
  const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const targetWidth = el.clientWidth - paddingX;
  if (targetWidth <= 0) return; // display:none
  const probeSize = 100;
  el.style.width = "max-content";
  el.style.fontSize = `${probeSize}px`;
  const naturalWidth = el.scrollWidth - paddingX || 1;
  el.style.width = "";
  const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const maxFont = Math.max(0, viewportHeight() * maxHeightFrac - paddingY);
  el.style.fontSize = `${Math.min((targetWidth / naturalWidth) * probeSize, maxFont)}px`;
}

// Which name needs the most *rendered* width, not the most characters:
// Koeeya Trial (--font-display) is a hand-drawn display font with very
// uneven glyph widths, so character count is not a reliable proxy — e.g.
// "Kevin Schaberl" (14 chars) renders wider than "or just … kev ·" (15
// chars). Measured on `el` itself (a fixed probe size, restored after),
// so it automatically reflects this element's own font/transform.
function widestHeroName(el: HTMLElement): string {
  const probeSize = 100;
  const prevFontSize = el.style.fontSize;
  el.style.fontSize = `${probeSize}px`;
  let widest = HERO_NAMES[0] ?? "";
  let widestWidth = 0;
  for (const name of HERO_NAMES) {
    el.textContent = name;
    if (el.scrollWidth > widestWidth) {
      widestWidth = el.scrollWidth;
      widest = name;
    }
  }
  el.style.fontSize = prevFontSize;
  return widest;
}

function fitHeroName() {
  const parent = heroName.parentElement;
  if (!parent) return;

  // clientWidth includes the parent's own padding; subtract it so the
  // name fits the content box it actually renders in, not the padded one.
  const parentStyle = getComputedStyle(parent);
  const paddingX =
    parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);

  // Fit against the widest-rendering name in the rotation, not whatever's
  // currently typed — the font-size (and the cloth's resting grid, built
  // from this box) must stay fixed while name-typewriter.ts swaps the
  // text in and out. Invisible either way (.hero-name is opacity:0; the
  // cloth paints the texture instead), so swapping the text to measure
  // it causes no flicker.
  const currentText = heroName.textContent;
  heroName.textContent = widestHeroName(heroName);
  fitToWidth(heroName, parent.clientWidth - paddingX);
  heroName.textContent = currentText;
}

// The floor's "PROJEKTE" (lies on the elevator floor, stands up as the
// projects wall's headline) and the reduced-motion heading in #projects:
// both are full-width blocks, so fit to their own content box — but never
// taller than a quarter of the viewport (PROJECTS_TITLE_MAX_VH).
const PROJECTS_TITLE_MAX_VH = 0.25;
const projectsTitles = document.querySelectorAll<HTMLElement>(
  ".projects-title, .projects-headline",
);
function fitProjectsTitles() {
  projectsTitles.forEach((el) => fitBlockToWidth(el, PROJECTS_TITLE_MAX_VH));
  const headline = document.querySelector<HTMLElement>(".projects-headline");
  if (headline) {
    document.documentElement.style.setProperty(
      "--projects-title-h",
      `${headline.offsetHeight}px`,
    );
  }
}
fitProjectsTitles();
document.fonts.ready.then(fitProjectsTitles);
const projectsTitlesResize = makeHeightOnlyResizeFilter();
window.addEventListener(
  "resize",
  () => {
    if (!projectsTitlesResize()) fitProjectsTitles();
  },
  { passive: true },
);

// Size the name correctly before the cloth reads its box for the grid.
fitHeroName();

const cloth = new Cloth(canvas, clothBody, heroContent);

// Renders the (now invisible, see .hero-name/.hero-subtitle{opacity:0} in
// style.css) name + subtitle onto one offscreen texture, each at its own
// position/size within their shared parent box, so the cloth can warp
// the whole lockup onto the mesh instead of it sitting static. The name
// gets the same look as the "PROJEKTE" headings — gradient, glow and a
// periodic shine, all from style.css's --title-* tokens.
const TEXTURE_SUPERSAMPLE = 2; // crisper edges once warped/stretched
// Mirrors .projects-headline's shine keyframes: the band rests for the
// first 55% of each period, then sweeps from -1x to +2x the text width.
const SHINE_REST = 0.55;
const SHINE_BAND = 0.25; // half-width of the band, in text widths
const GLOW_BLUR_EM = 0.12;
const GLOW_ALPHA = 0.45;

type TextLine = {
  isName: boolean;
  text: string;
  font: string;
  color: string;
  x: number;
  y: number;
  height: number;
  fontSize: number;
};

let nameTexture: HTMLCanvasElement | null = null;
let nameLines: TextLine[] = [];

function readToken(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

// shine: band center in text widths from the name's left edge, or null.
function paintNameTexture(shine: number | null) {
  if (!nameTexture) return;
  const tctx = nameTexture.getContext("2d")!;
  tctx.setTransform(TEXTURE_SUPERSAMPLE, 0, 0, TEXTURE_SUPERSAMPLE, 0, 0);
  tctx.clearRect(0, 0, nameTexture.width, nameTexture.height);
  tctx.textBaseline = "middle";
  // Positions below are left edges (measured boxes) — keep that meaning
  // even on the RTL page; the text itself still shapes/orders correctly.
  tctx.direction = "ltr";
  tctx.textAlign = "left";

  for (const line of nameLines) {
    tctx.font = line.font;
    const midY = line.y + line.height / 2;
    if (!line.isName) {
      tctx.fillStyle = line.color;
      tctx.fillText(line.text, line.x, midY);
      continue;
    }

    const textWidth = tctx.measureText(line.text).width;
    const gradient = tctx.createLinearGradient(line.x, 0, line.x + textWidth, 0);
    gradient.addColorStop(0, readToken("--title-grad-from"));
    gradient.addColorStop(0.5, readToken("--title-grad-mid"));
    gradient.addColorStop(1, readToken("--title-grad-to"));
    const [r, g, b] = hexToRgb(readToken("--title-glow"));

    tctx.save();
    tctx.fillStyle = gradient;
    tctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${GLOW_ALPHA})`;
    // shadowBlur ignores the transform, so scale it by hand.
    tctx.shadowBlur = line.fontSize * GLOW_BLUR_EM * TEXTURE_SUPERSAMPLE;
    tctx.fillText(line.text, line.x, midY);
    tctx.restore();

    if (shine !== null) {
      const center = line.x + shine * textWidth;
      const half = SHINE_BAND * textWidth;
      const band = tctx.createLinearGradient(center - half, 0, center + half, 0);
      band.addColorStop(0, "rgba(255, 255, 255, 0)");
      band.addColorStop(0.5, "rgba(255, 255, 255, 0.75)");
      band.addColorStop(1, "rgba(255, 255, 255, 0)");
      tctx.save();
      tctx.globalCompositeOperation = "source-atop"; // only onto the glyphs
      tctx.fillStyle = band;
      tctx.fillRect(center - half, line.y, half * 2, line.height);
      tctx.restore();
    }
  }
}

function updateNameTexture() {
  const rect = heroContent.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  nameLines = [];
  for (const el of [heroName, heroSubtitle]) {
    const elRect = el.getBoundingClientRect();
    if (elRect.width <= 0 || elRect.height <= 0) continue;

    const style = getComputedStyle(el);
    nameLines.push({
      isName: el === heroName,
      text:
        style.textTransform === "uppercase"
          ? el.textContent!.toUpperCase()
          : el.textContent!,
      font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      color: style.color,
      x: elRect.left - rect.left,
      y: elRect.top - rect.top,
      height: elRect.height,
      fontSize: parseFloat(style.fontSize),
    });
  }

  nameTexture = document.createElement("canvas");
  nameTexture.width = Math.round(rect.width * TEXTURE_SUPERSAMPLE);
  nameTexture.height = Math.round(rect.height * TEXTURE_SUPERSAMPLE);
  paintNameTexture(null);
  cloth.setTextTexture(nameTexture);
}

function refreshHeroName() {
  fitHeroName();
  cloth.refreshBounds();
  updateNameTexture();
}

refreshHeroName();
document.fonts.ready.then(refreshHeroName);

// Reduced motion: leave the static name from the HTML/hero-names.ts in
// place, unanimated — same convention as cloth.ts/contact.ts/carousel.ts.
const heroNameForceMotion =
  document.documentElement.classList.contains("force-motion");
const heroNameReducedMotion =
  !heroNameForceMotion &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// The typewriter only flags the texture dirty; the frame loop below
// re-rasterizes it at most once per frame, and only while the cloth is
// actually running (on screen) — off screen the typing goes on in the DOM
// for free and the texture catches up on the first frame back.
let nameTextureDirty = false;
if (!heroNameReducedMotion && HERO_NAMES.length > 0) {
  startNameTypewriter(heroName, () => {
    nameTextureDirty = true;
  });
}

// The name's shine, in step with the CSS one on "PROJEKTE". The cloth
// warps the texture canvas live every frame, so repainting it in place is
// enough; outside the sweep it's left alone.
if (!heroNameReducedMotion) {
  const period = readToken("--title-shine-period");
  const periodMs =
    parseFloat(period) * (period.endsWith("ms") ? 1 : 1000) || 6000;
  const easeInOut = (t: number) => t * t * (3 - 2 * t);
  let shining = false;
  const shineLoop = (now: number) => {
    requestAnimationFrame(shineLoop);
    if (!cloth.isRunning) return;
    if (nameTextureDirty) {
      nameTextureDirty = false;
      updateNameTexture();
      shining = false;
    }
    const phase = (now % periodMs) / periodMs;
    if (phase >= SHINE_REST) {
      const t = easeInOut((phase - SHINE_REST) / (1 - SHINE_REST));
      paintNameTexture(-1 + 3 * t);
      shining = true;
    } else if (shining) {
      paintNameTexture(null);
      shining = false;
    }
  };
  requestAnimationFrame(shineLoop);
}

const heroResize = makeHeightOnlyResizeFilter();
window.addEventListener(
  "resize",
  () => {
    if (!heroResize()) refreshHeroName();
  },
  { passive: true },
);

// ScrollTrigger.refresh() is called inside maybeStart() below, right before
// lenis.start() — guaranteeing correct pin measurements on every device and
// visit type. The old bare window.load listener is replaced by the gate logic.

// Grid hairlines are one *device* pixel wide (see --grid-line in
// style.css): on a 1.5x display a 1px CSS line covers 1.5 device pixels
// and shimmers as it's resampled. Browser zoom changes devicePixelRatio
// and fires resize, so this one listener covers that too.
// On 3x phones a single device pixel at the grid's alpha all but
// vanishes, so from 2.25x up the line is two device pixels — still whole
// device pixels (crisp), just enough ink to read as a grid.
function syncGridLineWidth() {
  const dpr = window.devicePixelRatio || 1;
  const devicePx = dpr >= 2.25 ? 2 : 1;
  document.documentElement.style.setProperty("--grid-line", `${devicePx / dpr}px`);
}
syncGridLineWidth();
window.addEventListener("resize", syncGridLineWidth, { passive: true });

const aboutSection = document.querySelector<HTMLElement>("#about")!;
const projectsSection = document.querySelector<HTMLElement>("#projects")!;

if (!LITE) {
  trackElevatorPerspective(aboutSection, lenis);
  initBoxToGridTransition(aboutSection);
}

initFacetOverlay(projectsSection, projectCards, lenis);

if (LITE) initProjectSheet(projectsSection, projectCards, lenis);
else initCarousel(projectsSection);

initContact(document.querySelector<HTMLElement>("#contact")!, lenis);

// A plain "#contact" anchor jump lands at the top of the pin, where the
// grid has just started dissolving — not what "go to Contact" means.
// Every link that points there jumps straight to the section already
// landed on "Let's talk now" instead. Native anchor jumps on this page
// are instant (no CSS scroll-behavior:smooth set), so this matches that
// with `immediate: true` rather than introducing a different, smoother
// feel just for this one link.
document.querySelectorAll<HTMLAnchorElement>('a[href="#contact"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = getContactRevealScrollY();
    if (target === null) return; // reduced motion — no pin, let the native jump happen
    e.preventDefault();
    lenis.scrollTo(target, { immediate: true });
  });
});

// The kev.dev card's own "demo" is this page: jump to the hero and give the
// cloth one tug, so it's obvious what "Du bist schon drin" means.
document.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest('[data-facet="self"]');
  if (!btn) return;
  e.preventDefault();
  closeProjectSheet();
  lenis.scrollTo(0, { immediate: true });
  setTimeout(() => cloth.pull(), 350);
});

initScrollProgress(lenis);

initEdgeNav(lenis);
initYoutubeButton();
initThemeToggle();
initLangSwitch();
initCvLinks();
initLegalOverlay(lenis);

// ─────────────────────────────────────────────────────────────────────────────
// Start gate: lenis.start() runs exactly once, only after BOTH:
//   A) pageLoaded  — window.load has fired → ScrollTrigger.refresh() is safe
//   B) introDone   — the loader/shatter animation finished (or skipped)
//
// This fixes the mobile race condition where wrong ScrollTrigger measurements
// caused carousel cards to stay off-screen: on any device, first or return
// visit, the user cannot scroll until the page is genuinely ready.
// ─────────────────────────────────────────────────────────────────────────────
let pageLoaded = document.readyState === "complete";
let introDone = false;
let started = false;

function maybeStart() {
  if (started || !pageLoaded || !introDone) return;
  started = true;
  ScrollTrigger.refresh();
  // Give ScrollTrigger one frame to complete layout measurements before
  // Lenis starts processing scroll events (prevents stutter from stale pins).
  requestAnimationFrame(() => lenis.start());
}

// Gate A — window.load
if (pageLoaded) {
  // Already loaded (e.g. script is deferred and fires late) — just mark it.
  // maybeStart() is called after gate B is set up below.
} else {
  window.addEventListener("load", () => {
    pageLoaded = true;
    if (loaderHandle) loaderHandle.setProgress(1.0);
    maybeStart();
  }, { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Loader / intro overlay.
// First visit (dev: always; prod: first session): SAOS loader with color fill.
// Return visit: no animation, gate B opens immediately, gate A still required.
// ─────────────────────────────────────────────────────────────────────────────
const INTRO_SEEN_KEY = "saos-intro-seen";

function shouldPlayIntro(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === null;
  } catch {
    return false; // storage blocked: never trap the visitor behind the intro
  }
}

const overlayEl = document.createElement("div");
document.body.appendChild(overlayEl);

let loaderHandle: { setProgress: (p: number) => void } | null = null;

lenis.stop(); // held in all cases until maybeStart()

if (shouldPlayIntro()) {
  loaderHandle = mountSaosLoader(overlayEl, () => {
    // Shatter animation done — mark intro complete and store the flag.
    if (import.meta.env.PROD) {
      try { sessionStorage.setItem(INTRO_SEEN_KEY, "1"); } catch { /* blocked */ }
    }
    overlayEl.remove();
    introDone = true;
    cloth.startAutoPulls();
    maybeStart();
  });

  // Progress milestones — monotone, always forward.
  // 0.2 is already implied by the loader mounting.
  // 0.5 comes right here: all init* calls above have run synchronously.
  loaderHandle.setProgress(0.5);

  // 0.75 when fonts settle (may fire before or after window.load).
  document.fonts.ready.then(() => loaderHandle?.setProgress(0.75));

  // 1.0 from the window.load listener above (sets gate A + triggers shatter).
  // If window.load already fired (pageLoaded === true), push it now.
  if (pageLoaded) loaderHandle.setProgress(1.0);
} else {
  // Return visit: skip animation, just wait for window.load via gate A.
  overlayEl.remove();
  introDone = true;
  cloth.startAutoPulls();
  maybeStart(); // opens if pageLoaded is also true already
}
