// Contact section of the skull variant (/saos#dev#skull, see
// src/saos-entry.ts) — replaces src/contact/contact.ts there: the page's
// closing beat. The projects grid carries
// straight across the seam and dissolves once the section fills the screen;
// then scrolling on lifts the craniumCut01 skull up from the bottom
// (scrubbed). The section is a tall scroll track with a sticky, screen-high
// stage inside (not a ScrollTrigger pin): on phones touch scrolling runs on
// its own thread and a pin, swapped in on the main thread, lags behind it —
// it jumped and stuttered there. Sticky moves with the scroll itself.
// From 70 % of the way up, the page scrolls the rest by itself at the speed
// you were scrolling. Once the skull is up, three saw blades hit it and the
// shards that hang in the air are the GitHub / mail / phone links
// (skull-scene.ts). The first hit stops the thrown objects (throws.ts);
// scrolling back out resets it all and lets them fly again.
//
// The 3D scene (three.js + the 1.4 MB skull model) loads once the section
// is within three screens. No "Let's talk" text any more: the heading is
// screen-reader-only and the links only show as shards (or, if WebGL
// fails, as a plain row). Under reduced motion there's no scroll track:
// the scene just shows its end state.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { LITE } from "../viewport";
import { BENTO_MIN_WIDTH_PX } from "../projects/carousel";
import { pauseThrows } from "../lab/throws";
import type { SkullScene } from "./skull-scene";
import "./skull-site.css";

gsap.registerPlugin(ScrollTrigger);

// Grid dissolve → the skull rising from the bottom, one pinned & scrubbed
// timeline; the saw blades' own timing lives in skull-scene.ts. Kept here
// rather than in src/timings.ts so the main page's TIMINGS.contact stays
// untouched.
const TIMING = {
  // Scroll distance the dissolve + rise play over: the section is this
  // much taller than its sticky stage (skull-site.css, .contact--track).
  scrub: 0.85, // lag (seconds) between scroll position and timeline position — reads as eased catching-up; this page's scroll is already Lenis-smoothed

  grid: {
    travel: 440, // px the bg grid keeps drifting down as it dissolves
    duration: 1,
    ease: "power1.in",
    staggerEach: 0.01, // gap between each line starting its own wipe
  },

  rise: 1.5, // timeline units the skull takes to come up, after the grid

  // At this fraction of the skull's way up, the page scrolls the rest by
  // itself, at the speed the user was scrolling.
  autoScrollAt: 0.7,
  autoScroll: {
    minSpeed: 700, // px/s, floor for a very slow scroll so it still finishes promptly
    maxDuration: 1.2, // s, cap for the same reason
  },
};

// The scrubbed ScrollTrigger, once created — main.ts reads its start/end
// through getSkullContactRevealScrollY() so a nav click can jump straight to
// the skull already up instead of to the top of the pin.
let pinTrigger: ScrollTrigger | null = null;

// 0.97, not 1 — at the very end of the track the sticky stage starts to
// scroll away, so landing a hair before it keeps the skull filling the screen.
const LANDED_PROGRESS = 0.97;

export function getSkullContactRevealScrollY(): number | null {
  if (!pinTrigger) return null;
  return (
    pinTrigger.start + (pinTrigger.end - pinTrigger.start) * LANDED_PROGRESS
  );
}

export function initSkullContact(section: HTMLElement, lenis: Lenis) {
  const canvas = section.querySelector<HTMLCanvasElement>(".contact-skull");
  const links = Array.from(section.querySelectorAll<HTMLElement>(".contact-icons a"));
  if (!canvas || links.length < 3) return;

  // The screen-high sticky stage everything is drawn in (see the header).
  const stage = document.createElement("div");
  stage.className = "contact-stage";
  stage.append(...Array.from(section.childNodes));
  section.append(stage);

  const forceMotion = document.documentElement.classList.contains("force-motion");
  const reducedMotion = !forceMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rise value the scrubbed timeline drives (0 = below the screen, 1 = up);
  // kept here so a scene that loads late picks up where scroll already is.
  const rise = { value: reducedMotion ? 1 : 0 };
  let scene: SkullScene | null = null;

  // Load the scene once the section is within 1.5 screens.
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    import("./skull-scene")
      .then(({ createSkullScene }) =>
        createSkullScene(stage, canvas, links, {
          onFirstHit: () => pauseThrows(true),
          onReset: () => pauseThrows(false),
        }),
      )
      .then((s) => {
        scene = s;
        if (reducedMotion) s.finish();
        else s.setRise(rise.value);
      })
      .catch(() => {
        section.classList.add("no-skull"); // no WebGL / load failed: plain row of links
      });
  }, { rootMargin: "300% 0px" });
  io.observe(section);

  if (reducedMotion) return;
  section.classList.add("contact--track");

  // Grid lines, built up front so `tl` below can dissolve them — kept
  // fully intact (no fade, no crop) for the entire entry scroll, so
  // nothing here is ever mid-dissolve before the user can actually see
  // it. Only once the stage fills the screen does the dissolve play, as
  // the very first thing `tl` does.
  const bgGrid = section.querySelector<HTMLElement>(".contact-bg-grid");
  const hLines: HTMLElement[] = [];
  const vLines: HTMLElement[] = [];
  if (bgGrid) {
    const tileSize =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--grid-cell",
        ),
      ) || 48;
    const phase = (v: number) => ((v % tileSize) + tileSize) % tileSize;

    // The lines carry on the grid of whatever sits right above, line for
    // line, instead of starting their own at the section's edge (which
    // read as the grid jumping at the seam):
    //  - lite page: the grid painted on the page itself (style.css), so
    //    rows are phased by the section's document offset — the
    //    trigger's start, which settles only after fonts/layout;
    //  - desktop: .projects-bg-grid, whose rows start at #projects' top —
    //    one section height above this one once its pin has run out — and
    //    whose columns run through the centre from the bento breakpoint
    //    on (style.css: half the width), else from the left edge.
    const projects = document.querySelector<HTMLElement>("#projects");
    const layout = () => {
      let px = 0;
      let py = 0;
      if (LITE) {
        const top = pinTrigger
          ? pinTrigger.start
          : section.getBoundingClientRect().top + window.scrollY;
        py = phase(-top);
      } else if (projects) {
        py = phase(-projects.offsetHeight);
        if (window.matchMedia(`(min-width: ${BENTO_MIN_WIDTH_PX}px)`).matches) {
          px = phase(projects.clientWidth / 2);
        }
      }
      const w = section.clientWidth;
      const h = window.innerHeight;
      hLines.forEach((line, i) => {
        const y = py + i * tileSize;
        line.style.top = `${y}px`;
        line.style.display = y <= h ? "" : "none";
      });
      vLines.forEach((line, i) => {
        const x = px + i * tileSize;
        line.style.left = `${x}px`;
        line.style.display = x <= w ? "" : "none";
      });
    };

    // One spare line each way, so a phase shift never leaves a gap; the
    // tweens below hold on to these elements, so refresh only moves them.
    const rows = Math.ceil(window.innerHeight / tileSize) + 1;
    const cols = Math.ceil(window.innerWidth / tileSize) + 1;
    for (let i = 0; i < rows; i++) {
      const line = document.createElement("div");
      line.className = "grid-line grid-line--h";
      // Each line picks which of its two ends it retreats toward — mixed
      // per line so the wipe reads as scattered, not a uniform sweep.
      line.style.transformOrigin = Math.random() < 0.5 ? "left" : "right";
      bgGrid.appendChild(line);
      hLines.push(line);
    }
    for (let i = 0; i < cols; i++) {
      const line = document.createElement("div");
      line.className = "grid-line grid-line--v";
      line.style.transformOrigin = Math.random() < 0.5 ? "top" : "bottom";
      bgGrid.appendChild(line);
      vLines.push(line);
    }
    layout();
    ScrollTrigger.addEventListener("refresh", layout);
  }

  const tl = gsap.timeline({ paused: true });

  if (bgGrid) {
    tl.to(bgGrid, {
      y: TIMING.grid.travel,
      duration: TIMING.grid.duration,
      ease: TIMING.grid.ease,
    })
      .to(
        hLines,
        {
          scaleX: 0,
          duration: TIMING.grid.duration,
          stagger: { each: TIMING.grid.staggerEach, from: "random" },
        },
        "<",
      )
      .to(
        vLines,
        {
          scaleY: 0,
          duration: TIMING.grid.duration,
          stagger: { each: TIMING.grid.staggerEach, from: "random" },
        },
        "<",
      );
  }

  tl.addLabel("rise").to(rise, {
    value: 1,
    duration: TIMING.rise,
    ease: "none", // the scene eases the motion itself
    onUpdate: () => scene?.setRise(rise.value),
  });
  // A little slack after the rise, so it's fully up (rise = 1, which
  // starts the saw blades) before LANDED_PROGRESS — the track's very end.
  tl.to({}, { duration: 0.15 });

  // Scroll progress at which the skull is autoScrollAt of the way up.
  const riseStart = tl.labels.rise / tl.duration();
  const riseEnd = (tl.labels.rise + TIMING.rise) / tl.duration();
  const autoAt = riseStart + (riseEnd - riseStart) * TIMING.autoScrollAt;
  let hasAutoScrolled = false;

  pinTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: TIMING.scrub,
    animation: tl,
    onUpdate(self) {
      // Past 70 % of the rise while scrolling down: finish the scroll at
      // the speed the user was going (lenis.velocity is px per frame).
      if (!hasAutoScrolled && self.direction === 1 && self.progress > autoAt && self.progress < LANDED_PROGRESS) {
        hasAutoScrolled = true;
        const target = getSkullContactRevealScrollY()!;
        const speed = Math.max(Math.abs(lenis.velocity) * 60, TIMING.autoScroll.minSpeed);
        const duration = Math.min(Math.max((target - lenis.scroll) / speed, 0.15), TIMING.autoScroll.maxDuration);
        lenis.scrollTo(target, { duration, easing: (t: number) => t, lock: true });
      }
      if (self.progress < riseStart) hasAutoScrolled = false; // re-armed once the skull is back down
    },
  });
}
