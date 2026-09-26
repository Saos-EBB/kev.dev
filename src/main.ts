import roomSvg from "./assets/room.svg?raw";
import "@fontsource-variable/jetbrains-mono";
import "./style.css";
import "./reading.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Cloth } from "./hero/cloth";
import { cvSections, trackElevatorPerspective } from "./about/elevator";
import { renderAboutBlocks, renderAboutFooter } from "./about/about-blocks";
import { initYoutubeButton } from "./music/youtube";
import { initCarousel } from "./projects/carousel";
import { projectCards } from "./projects/projects-data";
import { renderProjectCard, initProjectCards } from "./projects/project-cards";
import { initContact, getContactRevealScrollY } from "./contact/contact";
import { initScrollProgress } from "./scroll/progress";
import { initEdgeNav } from "./scroll/edge-nav";
import { initBoxToGridTransition } from "./scroll/transition";
import { mountSaosIntro, type IntroMode } from "./intro/saos-intro";
import { makeHeightOnlyResizeFilter, viewportHeight } from "./viewport";

gsap.registerPlugin(ScrollTrigger);

// Force-enables all motion for local testing when the OS/browser reports
// prefers-reduced-motion. Cloth/Elevator use this themselves for their
// own JS animation loops, but a plain JS check can't override an
// `@media (prefers-reduced-motion: reduce)` block — that's browser/OS-
// driven and CSS-only. This class is what actually lets style.css's
// reduced-motion fallback rules be switched off too (see the
// `:root:not(.force-motion)` scoping there).
// Always on in `npm run dev` (import.meta.env.DEV) so local testing
// never needs the query param; production builds only force it via an
// explicit `?motion` in the URL, so real visitors' OS setting is still
// respected.
if (
  import.meta.env.DEV ||
  new URLSearchParams(window.location.search).has("motion")
) {
  document.documentElement.classList.add("force-motion");
}

// Smooth-scroll base for the whole page, wired to GSAP's ticker so Lenis
// and ScrollTrigger (used by the project carousel) share one scroll
// instead of running two competing rAF loops.
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="scrollbar" aria-hidden="true">
    <div class="scrollbar-thumb"></div>
  </div>

  <header class="site-header">
    <div class="site-header-inner">
      <span class="site-header-brand">Kevin Schaberl</span>
      <nav class="site-header-links" aria-label="Primary">
        <a href="#about">About</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
        <span class="music-controls">
          <button class="music-button" type="button" aria-label="Musik abspielen" aria-pressed="false">
            <svg class="music-icon music-icon--play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            <svg class="music-icon music-icon--pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          </button>
          <a class="dancer-link" target="_blank" rel="noopener noreferrer" aria-label="Playlist auf YouTube öffnen">
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
          <button class="music-next" type="button" aria-label="Nächster Song" disabled>
            <svg class="music-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5v14l9-7zM16 5h2v14h-2z" /></svg>
          </button>
        </span>
      </nav>
    </div>
  </header>

  <div class="music-panel" aria-hidden="true"><div class="music-mount"></div></div>

  <section class="hero" id="hero">
    <div class="hero-frame">
      <nav class="hero-nav" aria-label="Primary">
        <ul class="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <ul class="nav-icons">
          <li>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.78 5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
          </li>
          <li>
            <a href="mailto:kevin.schaberl.work@gmail.com" aria-label="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 5h18v14H3z" />
                <path d="m3 6 9 7 9-7" />
              </svg>
            </a>
          </li>
          <li>
            <a href="#contact" aria-label="Phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          </li>
        </ul>
      </nav>

      <div class="hero-rule"></div>
      <div class="cloth-body">
        <div class="hero-content">
          <h1 class="hero-name">Kevin Schaberl</h1>
          <p class="hero-subtitle">Junior Developer</p>
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

  <div class="projects-headline" aria-hidden="true">Projekte</div>

  <section class="projects" id="projects">
    <div class="projects-bg-grid" aria-hidden="true"></div>
    <div class="projects-saos" aria-hidden="true"></div>
    <h2 class="projects-title">Projekte</h2>
    <div class="carousel-stage">
      ${projectCards
        .map(
          (card, i) => `
        <div class="carousel-project" data-project="${i}" data-count="1">
          ${renderProjectCard(card)}
        </div>
      `,
        )
        .join("")}
    </div>
  </section>

  <section class="contact" id="contact">
    <div class="contact-bg-grid" aria-hidden="true"></div>
    <div class="contact-inner">
      <h2 class="contact-headline">Let's talk now</h2>
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
          <a href="mailto:kevin.schaberl.work@gmail.com" aria-label="Email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 5h18v14H3z" />
              <path d="m3 6 9 7 9-7" />
            </svg>
          </a>
        </li>
        <li>
          <a href="#contact" aria-label="Phone">
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
      <p class="footer-copy">© 2026 Kevin Schaberl</p>
      <nav class="footer-links" aria-label="Rechtliches">
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="mailto:kevin.schaberl.work@gmail.com">Mail</a>
        <a href="/impressum.html">Impressum</a>
        <a href="/datenschutz.html">Datenschutz</a>
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

function fitHeroName() {
  const parent = heroName.parentElement;
  if (!parent) return;

  // clientWidth includes the parent's own padding; subtract it so the
  // name fits the content box it actually renders in, not the padded one.
  const parentStyle = getComputedStyle(parent);
  const paddingX =
    parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
  fitToWidth(heroName, parent.clientWidth - paddingX);
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
// the whole lockup onto the mesh instead of it sitting static.
function updateNameTexture() {
  const rect = heroContent.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const supersample = 2; // crisper edges once warped/stretched
  const tex = document.createElement("canvas");
  tex.width = Math.round(rect.width * supersample);
  tex.height = Math.round(rect.height * supersample);

  const tctx = tex.getContext("2d")!;
  tctx.scale(supersample, supersample);

  for (const el of [heroName, heroSubtitle]) {
    const elRect = el.getBoundingClientRect();
    if (elRect.width <= 0 || elRect.height <= 0) continue;

    const style = getComputedStyle(el);
    const offsetX = elRect.left - rect.left;
    const offsetY = elRect.top - rect.top;

    tctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    tctx.fillStyle = style.color;
    tctx.textBaseline = "middle";
    const text =
      style.textTransform === "uppercase"
        ? el.textContent!.toUpperCase()
        : el.textContent!;
    tctx.fillText(text, offsetX, offsetY + elRect.height / 2);
  }

  cloth.setTextTexture(tex);
}

function refreshHeroName() {
  fitHeroName();
  cloth.refreshBounds();
  updateNameTexture();
}

refreshHeroName();
document.fonts.ready.then(refreshHeroName);
const heroResize = makeHeightOnlyResizeFilter();
window.addEventListener(
  "resize",
  () => {
    if (!heroResize()) refreshHeroName();
  },
  { passive: true },
);

// Late-arriving images/fonts can change layout after ScrollTrigger measured
// its starts/ends — re-measure once everything is in.
window.addEventListener("load", () => ScrollTrigger.refresh());

// Grid hairlines are one *device* pixel wide (see --grid-line in
// style.css): on a 1.5x display a 1px CSS line covers 1.5 device pixels
// and shimmers as it's resampled. Browser zoom changes devicePixelRatio
// and fires resize, so this one listener covers that too.
function syncGridLineWidth() {
  const dpr = window.devicePixelRatio || 1;
  document.documentElement.style.setProperty("--grid-line", `${1 / dpr}px`);
}
syncGridLineWidth();
window.addEventListener("resize", syncGridLineWidth, { passive: true });

const aboutSection = document.querySelector<HTMLElement>("#about")!;
const projectsSection = document.querySelector<HTMLElement>("#projects")!;

trackElevatorPerspective(aboutSection);

initBoxToGridTransition(aboutSection);

initProjectCards(projectsSection, projectCards);

initCarousel(projectsSection);

initContact(document.querySelector<HTMLElement>("#contact")!);

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

initScrollProgress(lenis);

initEdgeNav(lenis);
initYoutubeButton();

// Intro overlay: one word switches the style. Shown once per session; after
// the first run (or on any return visit) the hero is simply there.
const INTRO_MODE: IntroMode = "shatter";
const INTRO_SEEN_KEY = "saos-intro-seen";

function isFirstVisit(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === null;
  } catch {
    return false; // storage blocked: never trap the visitor behind the intro
  }
}

const overlayEl = document.createElement("div");
document.body.appendChild(overlayEl);

if (isFirstVisit()) {
  lenis.stop();
  const destroy = mountSaosIntro(
    overlayEl,
    () => {
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      destroy();
      overlayEl.remove();
      lenis.start();
    },
    INTRO_MODE,
  );
} else {
  overlayEl.remove();
  lenis.start();
}
