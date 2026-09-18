import "./style.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Cloth } from "./hero/cloth";
import { galleryItems, cvSections, trackElevatorPerspective } from "./about/elevator";
import { initCarousel, projects, BADGE_LABEL } from "./projects/carousel";
import { initContact } from "./contact/contact";
import { initScrollProgress } from "./scroll/progress";
import { initEdgeNav } from "./scroll/edge-nav";
import { initBoxToGridTransition } from "./scroll/transition";

gsap.registerPlugin(ScrollTrigger);

// ?motion force-enables all motion for local testing when the
// OS/browser reports prefers-reduced-motion. Cloth/Elevator use this
// themselves for their own JS animation loops, but a plain JS check
// can't override an `@media (prefers-reduced-motion: reduce)` block —
// that's browser/OS-driven and CSS-only. This class is what actually
// lets style.css's reduced-motion fallback rules be switched off too
// (see the `:root:not(.force-motion)` scoping there).
if (new URLSearchParams(window.location.search).has("motion")) {
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
      </nav>
    </div>
  </header>

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
    <div class="elevator" aria-hidden="true">
      <div class="elevator-shaft">
        <div class="elevator-wall elevator-wall--left"></div>
        <div class="elevator-wall elevator-wall--right"></div>
        <div class="elevator-wall elevator-wall--ceiling"></div>
        <div class="elevator-wall elevator-wall--floor"></div>
        <div class="elevator-backwall"></div>
      </div>
      <div class="elevator-vignette elevator-vignette--top"></div>
      <div class="elevator-vignette elevator-vignette--bottom"></div>
    </div>

    <div class="about-overlay">
      ${galleryItems
        .map(
          (item) => `
        <figure class="about-gallery-item">
          <blockquote class="about-gallery-art">${item.text}</blockquote>
          <figcaption class="about-gallery-caption">
            ${item.label}${item.attribution ? ` · ${item.attribution}` : ""}
          </figcaption>
        </figure>
      `,
        )
        .join("")}
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
    </div>
  </section>

  <section class="projects" id="projects">
    <div class="projects-bg-grid" aria-hidden="true"></div>
    <div class="carousel-stage">
      <div class="carousel-perspective">
        <div class="carousel-track">
          ${projects
            .map(
              (p, i) => `
            <a class="carousel-card" data-layout="${p.layout}" href="${p.href}" target="_blank" rel="noopener noreferrer">
              <span class="carousel-card-number">${String(i + 1).padStart(2, "0")}</span>
              <span class="carousel-card-badge">${BADGE_LABEL[p.badge]}</span>
              ${p.image ? `<span class="carousel-card-image"><img src="${p.image}" alt="" loading="lazy" /></span>` : ""}
              <span class="carousel-card-body">
                <span class="carousel-card-title">${p.title}</span>
                <span class="carousel-card-role">${p.role}</span>
                <span class="carousel-card-proves">${p.proves}</span>
                <ul class="carousel-card-bullets">
                  ${p.bullets.map((b) => `<li>${b}</li>`).join("")}
                </ul>
                <span class="carousel-card-tags">
                  ${p.tags.map((t) => `<span>${t}</span>`).join("")}
                </span>
                <span class="carousel-card-code">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.78 5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  Code
                </span>
              </span>
            </a>
          `,
            )
            .join("")}
        </div>
      </div>
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

// Scales the name's font-size so it always spans the full width of its
// container, regardless of viewport size or which display font is active.
function fitHeroName() {
  const parent = heroName.parentElement;
  if (!parent) return;

  // clientWidth includes the parent's own padding; subtract it so the
  // name fits the content box it actually renders in, not the padded one.
  const parentStyle = getComputedStyle(parent);
  const paddingX =
    parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
  const targetWidth = parent.clientWidth - paddingX;
  if (targetWidth <= 0) return;

  const probeSize = 100;
  heroName.style.fontSize = `${probeSize}px`;
  const naturalWidth = heroName.scrollWidth || 1;
  heroName.style.fontSize = `${(targetWidth / naturalWidth) * probeSize}px`;
}

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
window.addEventListener("resize", refreshHeroName, { passive: true });

const aboutSection = document.querySelector<HTMLElement>("#about")!;
const projectsSection = document.querySelector<HTMLElement>("#projects")!;

trackElevatorPerspective(aboutSection);

initBoxToGridTransition(aboutSection, projectsSection);

initCarousel(projectsSection);

initContact(document.querySelector<HTMLElement>("#contact")!);

initScrollProgress(lenis);

initEdgeNav(lenis);
