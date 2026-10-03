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
import type Lenis from "lenis";
import { TIMINGS } from "../timings";
import { LITE } from "../viewport";
import { BENTO_MIN_WIDTH_PX } from "../projects/carousel";
import { LANG } from "../i18n";
import { applyMouseForce, makeBody, stepPhysics, type PhysicsBody } from "./contact-physics";
import { mountRaygunButton } from "../raygun/raygun";

gsap.registerPlugin(ScrollTrigger);

// All timing/easing numbers for this section live in src/timings.ts
// (TIMINGS.contact) — hand-adjust them there instead of here.
const TIMING = TIMINGS.contact;

// The pinned ScrollTrigger, once created — main.ts reads its start/end
// through getContactRevealScrollY() so a nav click can jump straight to
// "Let's talk now" already landed, instead of to the top of the pin
// where the fall-in has only just begun.
let pinTrigger: ScrollTrigger | null = null;

// 0.97, not 1 — the very end of the pin's scroll range is also where it
// releases, so landing a hair before it keeps the section pinned with
// everything already settled rather than right on that boundary. Shared
// with the auto-scroll/idle-float onUpdate below: that's the same "landed"
// point the auto-scroll targets and the idle float gates on, so the two
// features agree on what "landed" means instead of drifting apart.
const LANDED_PROGRESS = 0.97;

// The idle float's own gate is a hair below LANDED_PROGRESS: the auto-scroll
// above targets an exact pixel scrollY for LANDED_PROGRESS, but converting
// that pixel position back into a progress fraction lands a hair short of
// 0.97 (sub-pixel rounding) — verified empirically (landed at 0.9696), so
// gating idle on `>= LANDED_PROGRESS` exactly would never fire.
const IDLE_PROGRESS = LANDED_PROGRESS - 0.005;

// Exported for nav links: where to scroll so the section is landed on
// "Let's talk now" (headline/mail/icons already settled) rather than at
// the very start of the pin's black hold. Null under reduced motion (no
// pin exists — the plain, always-visible layout needs no special target)
// or before initContact has run.
export function getContactRevealScrollY(): number | null {
  if (!pinTrigger) return null;
  return (
    pinTrigger.start + (pinTrigger.end - pinTrigger.start) * LANDED_PROGRESS
  );
}

// Breaks an element's text into one <span class="letter"> per character
// (each wrapping an inner <span class="letter-inner">) so each can fall in
// independently. The element keeps an aria-label with the original text and
// the letters are aria-hidden — otherwise screen readers would read (or
// the mail link would announce) the text one character at a time instead of
// as a word/address.
//
// Two layers, not one: the outer .letter is the entrance tween's target
// (x/y/rotate/opacity, driven by the scrub below) and the inner .letter-inner
// is the idle float's target (see startIdle/stopIdle). Splitting them keeps
// the two animations off the same element/properties — the scrub re-renders
// the outer span's transform on every scroll tick (including at rest, once
// progress is pinned at 1), which would otherwise stomp the idle loop's
// transform mid-wobble.
//
// Arabic letters change shape by their neighbours and must stay joined —
// one span per letter would print them all in their isolated form. There
// the pieces are whole words (spaces kept as their own piece).
function splitLetters(el: HTMLElement): { outer: HTMLElement[]; inner: HTMLElement[] } {
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  el.textContent = "";
  const outer: HTMLElement[] = [];
  const inner: HTMLElement[] = [];
  const pieces = LANG === "ar" ? text.split(/( )/).filter(Boolean) : Array.from(text);
  for (const ch of pieces) {
    const span = document.createElement("span");
    span.className = "letter";
    span.setAttribute("aria-hidden", "true");
    const innerSpan = document.createElement("span");
    innerSpan.className = "letter-inner";
    innerSpan.textContent = ch === " " ? " " : ch;
    span.appendChild(innerSpan);
    el.appendChild(span);
    outer.push(span);
    inner.push(innerSpan);
  }
  return { outer, inner };
}

export function initContact(section: HTMLElement, lenis: Lenis) {
  const headline = section.querySelector<HTMLElement>(".contact-headline");
  const mail = section.querySelector<HTMLElement>(".contact-mail");
  const icons = Array.from(
    section.querySelectorAll<HTMLElement>(".contact-icons li"),
  );
  if (!headline || !mail || icons.length === 0) return;

  // Raygun button — hidden until the headline has shattered (startBreak),
  // hidden again once it's tweened back to rest (returnHome). Mounted lazily
  // on the first reveal so the audio/canvas overlay never loads for a
  // visitor who never clicks the headline.
  const raygunMount = section.querySelector<HTMLElement>(".contact-raygun");
  let raygunMounted = false;
  function revealRaygun() {
    if (!raygunMount) return;
    raygunMount.hidden = false;
    if (!raygunMounted) {
      raygunMounted = true;
      mountRaygunButton(raygunMount, { variant: "inline" });
    }
  }
  function hideRaygun() {
    if (raygunMount) raygunMount.hidden = true;
  }

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
    const phase = (v: number) => ((v % tileSize) + tileSize) % tileSize;

    // The lines carry on the grid of whatever sits right above, line for
    // line, instead of starting their own at the section's edge (which
    // read as the grid jumping at the seam):
    //  - lite page: the grid painted on the page itself (style.css), so
    //    rows are phased by the section's document offset — the pinned
    //    spacer's start, which settles only after fonts/layout;
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

  const headlineLetters = splitLetters(headline);
  const mailLetters = splitLetters(mail);
  const outerLetters = headlineLetters.outer.concat(mailLetters.outer);
  const innerLetters = headlineLetters.inner.concat(mailLetters.inner);

  // Click-to-shatter physics (see startBreak/returnHome below) targets these
  // same "safe inner layer" elements the idle float already uses, plus each
  // icon's own <a> — never the outer .letter/<li> the entrance tween drives,
  // and never anything reparented out of its real link, so a scattered mail
  // letter or icon keeps working as mailto/github/etc. the whole time.
  const iconLinks = icons.map((li) => li.querySelector<HTMLElement>("a")!);
  const physicsElements = innerLetters.concat(iconLinks);

  gsap.set(outerLetters, {
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
    .to(headlineLetters.outer, {
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
      mailLetters.outer,
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

  // Ambient float once landed — independent per-letter GSAP loops on the
  // *inner* spans (see splitLetters' comment for why not the outer ones).
  // Built lazily on first startIdle() and reused after that; stopIdle()
  // kills them and snaps back to rest so a subsequent reverse of the
  // entrance tween never stacks on a leftover idle offset.
  let idleTweens: gsap.core.Tween[] | null = null;

  function startIdle() {
    if (idleTweens) return;
    const { minDuration, maxDuration, maxDelay, yAmplitude, rotateAmplitude } =
      TIMING.idle;
    idleTweens = innerLetters.map((letter) =>
      gsap.to(letter, {
        y: () => gsap.utils.random(-yAmplitude, yAmplitude),
        rotate: () => gsap.utils.random(-rotateAmplitude, rotateAmplitude),
        duration: () => gsap.utils.random(minDuration, maxDuration),
        delay: () => gsap.utils.random(0, maxDelay),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      }),
    );
  }

  function stopIdle() {
    if (!idleTweens) return;
    idleTweens.forEach((tween) => tween.kill());
    idleTweens = null;
    gsap.set(innerLetters, { y: 0, rotate: 0 });
  }

  // Click-to-shatter: 3 clicks on the headline (or empty space — never the
  // mail link/icons themselves, see isBreakTarget) build up a shake, the
  // 3rd drops everything into real gravity/collision physics
  // (contact-physics.ts). Scrolling away tweens it back to rest instead of
  // resetting instantly — see returnHome.
  let isBroken = false;
  let isReturning = false;
  let shakeCount = 0;
  let shakeRafId: number | null = null;
  let physicsRafId: number | null = null;
  let physicsBodies: PhysicsBody[] = [];
  let mouseX = 0;
  let mouseY = 0;
  let prevMouseX = 0;
  let prevMouseY = 0;

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // Jitter grows with each click — same feel as SaosAnimation.js's shake
  // (intensity = clickCount * 3.5, capped), just applied via GSAP instead of
  // raw style writes.
  function shakeStep() {
    const intensity = Math.min(shakeCount * 3.5, TIMING.shake.maxIntensity);
    gsap.set(physicsElements, {
      x: () => (Math.random() - 0.5) * 2 * intensity,
      y: () => (Math.random() - 0.5) * intensity * 0.5,
      rotation: () => (Math.random() - 0.5) * intensity * 0.6,
    });
    shakeRafId = requestAnimationFrame(shakeStep);
  }

  function startShake() {
    if (shakeRafId === null) shakeRafId = requestAnimationFrame(shakeStep);
  }

  function stopShake() {
    if (shakeRafId === null) return;
    cancelAnimationFrame(shakeRafId);
    shakeRafId = null;
  }

  function teardownPhysics() {
    if (physicsRafId !== null) {
      cancelAnimationFrame(physicsRafId);
      physicsRafId = null;
    }
    window.removeEventListener("mousemove", handleMouseMove);
  }

  function startBreak() {
    stopShake();
    stopIdle();
    isBroken = true;
    revealRaygun();

    const floorY = window.innerHeight - TIMING.break.floorPad;
    physicsBodies = physicsElements.map((el) =>
      makeBody(el, floorY, window.innerWidth),
    );
    // A small impulse so the break reads as letting go, not a plain drop.
    for (const body of physicsBodies) {
      body.vx = (Math.random() - 0.5) * 6;
      body.vy = 2 + Math.random() * 4;
      body.angularVelocity = (Math.random() - 0.5) * 10;
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;
    window.addEventListener("mousemove", handleMouseMove);

    const loop = () => {
      stepPhysics(physicsBodies, TIMING.break);
      applyMouseForce(
        physicsBodies,
        mouseX,
        mouseY,
        mouseX - prevMouseX,
        mouseY - prevMouseY,
        TIMING.break.mouseRadius,
      );
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      for (const body of physicsBodies) {
        gsap.set(body.el, { x: body.ox, y: body.oy, rotation: body.rotation });
      }
      physicsRafId = requestAnimationFrame(loop);
    };
    physicsRafId = requestAnimationFrame(loop);
  }

  function returnHome() {
    if (!isBroken || isReturning) return;
    isReturning = true;
    teardownPhysics();
    gsap.to(physicsElements, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: TIMING.break.returnDuration,
      ease: TIMING.break.returnEase,
      onComplete: () => {
        isBroken = false;
        isReturning = false;
        hideRaygun();
      },
    });
  }

  // The mail link and icons must always behave as real links, never get
  // absorbed into the shake counter — mirrors SaosAnimation.js's
  // isSocialTarget() exclusion for the same reason.
  function isBreakTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return true;
    return !target.closest(".contact-mail, .contact-icons a");
  }

  function handleContactClick(e: MouseEvent) {
    if (isBroken || isReturning) return;
    if (!isBreakTarget(e.target)) return;
    if (!pinTrigger || pinTrigger.progress < IDLE_PROGRESS) return;

    shakeCount++;
    startShake();
    if (shakeCount >= TIMING.shake.limit) {
      stopShake();
      gsap.set(physicsElements, { x: 0, y: 0, rotation: 0 }); // clear jitter before measuring rest rects
      shakeCount = 0;
      startBreak();
    }
  }

  section.addEventListener("click", handleContactClick);

  // One-shot per visit: once scrolled a little way into the pin (past the
  // black hold, see TIMING.autoScrollAt), finish the rest of the scroll —
  // and thus the fall-in — without further manual scrolling. Re-armed once
  // the user scrolls back out the top (progress <= 0), so re-entering the
  // section auto-plays it again.
  let hasAutoScrolled = false;
  let lastProgress = 0;

  pinTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: TIMING.pinScroll,
    pin: true,
    scrub: TIMING.scrub,
    animation: tl,
    onUpdate(self) {
      if (isBroken && self.progress < lastProgress) returnHome();

      if (
        !hasAutoScrolled &&
        self.progress > TIMING.autoScrollAt &&
        self.progress < LANDED_PROGRESS
      ) {
        hasAutoScrolled = true;
        lenis.scrollTo(getContactRevealScrollY()!, {
          duration: TIMING.autoScroll.duration,
          easing: TIMING.autoScroll.easing,
          lock: true,
        });
      }

      if (!isBroken) {
        if (self.progress >= IDLE_PROGRESS) startIdle();
        else stopIdle();
      }

      if (self.progress <= 0) hasAutoScrolled = false;
      lastProgress = self.progress;
    },
  });
}
