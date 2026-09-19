// Contact section: the page's closing beat. The projects grid carries
// straight across the seam with no gap and no early cropping — it's
// still fully intact when the section pins ("top top"). Only once pinned
// (so the whole grid is already on screen) does it dissolve — see the
// grid tweens at the start of `tl` below — before the plain black hold,
// then continuing to scroll drives the headline + mail dropping in
// letter by letter (each
// one tumbling in on its own, in shuffled order, landing clean), followed
// by the icons a beat later fanning out slightly as they land. Directly
// tied to scroll position (not autoplay) so it can be scrubbed back and
// forth like the carousel.
//
// Deliberately NOT a physics sim (gravity/bounce/collision) — the whole
// point here is that the mail address and icons are clickable fast and
// end up at clean, non-overlapping positions every time. A scripted GSAP
// timeline with a light "back.out" overshoot and a randomized stagger
// order gives the same falling/settling, slightly chaotic feel while
// keeping the end state guaranteed.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TIMINGS } from "../timings";

gsap.registerPlugin(ScrollTrigger);

// All timing/easing numbers for this section live in src/timings.ts
// (TIMINGS.contact) — hand-adjust them there instead of here.
const TIMING = TIMINGS.contact;

// The pinned ScrollTrigger, once created — main.ts reads its start/end
// through getContactRevealScrollY() so a nav click can jump straight to
// "Let's talk now" already landed, instead of to the top of the pin
// where the fall-in has only just begun.
let pinTrigger: ScrollTrigger | null = null;

// Exported for nav links: where to scroll so the section is landed on
// "Let's talk now" (headline/mail/icons already settled) rather than at
// the very start of the pin's black hold. Null under reduced motion (no
// pin exists — the plain, always-visible layout needs no special target)
// or before initContact has run.
export function getContactRevealScrollY(): number | null {
  if (!pinTrigger) return null;
  // 0.97, not 1 — the very end of the pin's scroll range is also where
  // it releases, so landing a hair before it keeps the section pinned
  // with everything already settled rather than right on that boundary.
  const progress = 0.97;
  return pinTrigger.start + (pinTrigger.end - pinTrigger.start) * progress;
}

// Breaks an element's text into one <span class="letter"> per character
// so each can fall in independently. The element keeps an aria-label
// with the original text and the letters are aria-hidden — otherwise
// screen readers would read (or the mail link would announce) the text
// one character at a time instead of as a word/address.
function splitLetters(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  el.textContent = "";
  const letters: HTMLElement[] = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "letter";
    span.setAttribute("aria-hidden", "true");
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
    letters.push(span);
  }
  return letters;
}

export function initContact(section: HTMLElement) {
  const headline = section.querySelector<HTMLElement>(".contact-headline");
  const mail = section.querySelector<HTMLElement>(".contact-mail");
  const icons = Array.from(
    section.querySelectorAll<HTMLElement>(".contact-icons li"),
  );
  if (!headline || !mail || icons.length === 0) return;

  const forceMotion = document.documentElement.classList.contains(
    "force-motion",
  );
  const reducedMotion =
    !forceMotion &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reduced motion: no pin, no scrub, no black-screen hold, no letter
  // splitting — headline, mail and icons stay exactly where CSS lays
  // them out as plain text, fully opaque and clickable from the first
  // frame.
  if (reducedMotion) return;

  // Grid lines, built up front so `tl` below can dissolve them — kept
  // fully intact (no fade, no crop) for the entire entry scroll, so
  // nothing here is ever mid-dissolve before the user can actually see
  // it. Only once the section is pinned (fully on screen) does the
  // dissolve play, as the very first thing `tl` does.
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

    for (let y = 0; y <= window.innerHeight; y += tileSize) {
      const line = document.createElement("div");
      line.className = "grid-line grid-line--h";
      line.style.top = `${y}px`;
      // Each line picks which of its two ends it retreats toward — mixed
      // per line so the wipe reads as scattered, not a uniform sweep.
      line.style.transformOrigin = Math.random() < 0.5 ? "left" : "right";
      bgGrid.appendChild(line);
      hLines.push(line);
    }
    for (let x = 0; x <= window.innerWidth; x += tileSize) {
      const line = document.createElement("div");
      line.className = "grid-line grid-line--v";
      line.style.left = `${x}px`;
      line.style.transformOrigin = Math.random() < 0.5 ? "top" : "bottom";
      bgGrid.appendChild(line);
      vLines.push(line);
    }
  }

  const headlineLetters = splitLetters(headline);
  const mailLetters = splitLetters(mail);

  gsap.set(headlineLetters.concat(mailLetters), {
    opacity: 0,
    y: () => gsap.utils.random(-46, -26),
    x: () => gsap.utils.random(-6, 6),
    rotate: () => gsap.utils.random(-12, 12),
  });
  gsap.set(icons, { opacity: 0, y: -28, x: 0, rotate: 0 });

  const mid = (icons.length - 1) / 2;

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

  tl.to(
    {},
    { duration: Math.max(0, TIMING.hold - (bgGrid ? TIMING.grid.duration : 0)) },
  ) // remaining pure black hold, nothing to animate
    .to(headlineLetters, {
      y: 0,
      x: 0,
      rotate: 0,
      opacity: 1,
      duration: TIMING.headline.duration,
      ease: TIMING.headline.ease,
      // Random order (not left-to-right) is what makes this read as
      // letters tumbling in on their own rather than a typewriter reveal.
      stagger: { each: TIMING.headline.staggerEach, from: "random" },
    })
    .to(
      mailLetters,
      {
        y: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
        duration: TIMING.mail.duration,
        ease: TIMING.mail.ease,
        stagger: { each: TIMING.mail.staggerEach, from: "random" },
      },
      `<${TIMING.mail.startOffset}`,
    )
    .to(
      icons,
      {
        y: 0,
        // A small, deterministic fan-out instead of random scatter — reads
        // as "settled apart" rather than "still tumbling", and never
        // overlaps a neighbor since the row already has a fixed gap.
        x: (i) => (i - mid) * 7,
        rotate: (i) => (i - mid) * 5,
        opacity: 1,
        duration: TIMING.icons.duration,
        ease: TIMING.icons.ease,
        stagger: TIMING.icons.stagger,
      },
      `-=${TIMING.icons.startOffset}`,
    );

  pinTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: TIMING.pinScroll,
    pin: true,
    scrub: TIMING.scrub,
    animation: tl,
  });
}
