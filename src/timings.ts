// Every scroll/JS-driven animation timing on the page, in one place,
// ordered top to bottom the way the sections themselves appear. This is
// the JS/GSAP half of the site's timing; the other half — plain CSS
// hover fades and the hero-nav load-in — lives as custom properties in
// style.css's `:root` block (see the comment there), since CSS can't
// import values from a .ts file. Hand-adjust durations in exactly one
// of those two places, never by editing the section modules directly.
//
// `duration` / `staggerEach` / `hold` values inside a GSAP timeline that
// gets `scrub`bed (about, projects, contact) are all in the same
// timeline "duration units" — arbitrary but consistent relative
// weights between tweens in that one timeline. They only become real
// seconds once GSAP maps the whole timeline's progress against the
// ScrollTrigger's scroll distance (`pinScroll` / `end`), so changing one
// tween's duration reshapes how much of the *scroll* (not the clock)
// that beat gets, relative to the others in the same timeline — it does
// not, by itself, change how long the section's pin lasts.

export const TIMINGS = {
  // ------------------------------------------------------------------
  // Hero — src/hero/cloth.ts (interactive cloth grid) + the hero-nav
  // load-in, which is plain CSS (see --hero-nav-fade-duration/-delay in
  // style.css's :root, not here).
  // ------------------------------------------------------------------
  hero: {
    // How snappily a node follows the pointer, per frame — not a
    // duration but the same idea: higher = catches up faster/tighter.
    hoverPull: 0.75, // ambient hover, always gentle
    dragLerp: 0.35, // active click-drag, firm — the grabbed node should feel held, not chased
    doubleTapMs: 300, // touch only: max gap between two taps to count as one double-tap-to-grab gesture
  },

  // ------------------------------------------------------------------
  // Hero name rotation — src/hero/name-typewriter.ts. Types each name
  // from hero-names.ts in, holds it, backspaces it out, moves to the next.
  // ------------------------------------------------------------------
  heroName: {
    typeMs: 90, // per character while typing in
    deleteMs: 45, // per character while backspacing — quicker than typing, reads as a deliberate erase
    holdMs: 2200, // how long the finished name sits before it starts backspacing
    pauseMs: 400, // blank pause after the last character is deleted, before the next name starts typing
  },

  // ------------------------------------------------------------------
  // About → Projects — src/scroll/transition.ts. #about pins once its
  // floor edge reaches the bottom of the viewport (the elevator halts),
  // holds on the office, zooms into the monitor, then releases into the projects.
  // ------------------------------------------------------------------
  aboutToProjects: {
    scrollPerUnit: 700, // px of scroll per timeline "duration unit" (same convention as the sections below)
    mobileScrollScale: 0.7, // shorter scroll distance on narrow viewports
    scrub: 0.4, // lag (seconds) between scroll position and timeline position
    haltVh: 10, // scroll LENGTH (vh): the ride is over, the view holds still on the office
    zoomVh: 150, // scroll LENGTH (vh): the camera zooms into the monitor (exponential, so it reads as constant speed)
    fadeVh: 10, // scroll LENGTH (vh): the projects headline fades in once the screen fills the viewport
    endHoldUnits: 0.3, // rest at the end so the scrub's lag has caught up before the pin releases
  },

  // ------------------------------------------------------------------
  // Projects — src/projects/carousel.ts. Pinned, one GSAP timeline: per
  // project, the group slides in from the right (reveal), its 3-5 cards
  // then build up one at a time in place (cardReveal), hold once the
  // full set has landed, then the whole group slides out left (clear)
  // before the next project's group does the same.
  // ------------------------------------------------------------------
  projects: {
    scrollPerCard: 600, // px of scroll per timeline "duration unit" (see timings.ts's own header comment on what that means)
    holdUnits: 0.6, // extra dwell once a project's full set has landed, before it clears
    scrub: 0.4, // lag (seconds) between scroll position and timeline position

    reveal: {
      duration: 0.8,
      ease: "power2.out", // decelerates smoothly into the resting spot — no bounce, just a clean slide
    },

    cardReveal: {
      duration: 0.5,
      ease: "power2.out", // same clean deceleration as the group's own reveal, just smaller
      staggerEach: 0.25, // gap between each card of the group starting its own small slide-in
    },

    clear: {
      duration: 0.6,
      ease: "power1.in", // accelerates away — mirrors reveal's deceleration
    },
  },

  // ------------------------------------------------------------------
  // Contact — src/contact/contact.ts. Grid dissolve → black hold →
  // headline/mail/icons falling in, all one pinned & scrubbed timeline.
  // ------------------------------------------------------------------
  contact: {
    pinScroll: "+=140%", // scroll distance (relative to section height) the whole dissolve+hold+fall plays over — extra room so the fall doesn't feel rushed at normal scroll speed
    scrub: 0.85, // lag (seconds) between scroll position and timeline position — high enough that everything reads as an eased animation catching up to scroll rather than snapping 1:1 to it; safe to push since this page's scroll is already Lenis-smoothed, not the raw native scrollbar

    grid: {
      travel: 440, // px the bg grid keeps drifting down as it dissolves; no actual gap between #projects and #contact, this drift is what sells "still descending into the tunnel" instead
      duration: 1, // carved out of the front of hold below — fast, so most of the hold afterward is still plain black
      ease: "power1.in",
      staggerEach: 0.01, // gap between each line starting its own wipe
    },

    hold: 0.9, // total black-hold budget — grid.duration above is carved out of the front of it, the rest stays pure black before the fall-in starts

    headline: {
      duration: 0.9,
      ease: "back.out(2.4)", // higher overshoot than a "plain" back.out — reads as a small bounce settling after each letter lands
      staggerEach: 0.035, // random order + small `each` = letters read as tumbling in independently, several falling at once
    },

    mail: {
      duration: 0.8,
      ease: "back.out(2.4)",
      staggerEach: 0.03,
      startOffset: 0.25, // starts this far into the headline's own fall — overlapping, not sequential
    },

    icons: {
      duration: 0.7,
      ease: "back.out(2.2)",
      stagger: 0.1,
      startOffset: 0.2, // pulled back this far from the mail tween's end — overlapping
    },

    // Once the user has scrolled this far into the pin (a little past the
    // black hold — see `hold` above), the page finishes the rest of the
    // scroll itself so the headline/mail/icons land without further manual
    // scrolling — see the ScrollTrigger onUpdate in contact.ts.
    autoScrollAt: 0.08,
    autoScroll: {
      duration: 1.2, // seconds, real scroll time (Lenis), not timeline units
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // ease-out cubic
    },

    // Ambient per-letter float once landed (progress 1) — killed the
    // instant the user scrolls back out. Applied to `.letter-inner`, never
    // the outer `.letter` the entrance tween drives, so the two can't fight.
    idle: {
      minDuration: 0.9,
      maxDuration: 1.6,
      maxDelay: 1, // random per-letter start offset, so they don't all bob in sync
      yAmplitude: 5, // px, up/down
      rotateAmplitude: 3, // deg
    },

    // Click-to-shatter — src/contact/contact-physics.ts. 3 clicks on the
    // headline (not the mail link/icons, see contact.ts's isBreakTarget)
    // build up a shake, the 3rd drops everything into gravity/collision
    // physics; scrolling back away tweens it back to rest. Physics constants
    // ported as-is from the old SAOS.ME site's SaosAnimation.js — tuned
    // there for similarly letter-sized elements, so they carry over as
    // reasonable starting values.
    shake: {
      limit: 3, // clicks until break — matches SaosAnimation.js's SHAKE_LIMIT
      maxIntensity: 40, // px, jitter amplitude cap on the 3rd/strongest shake
    },

    break: {
      gravity: 0.4,
      restitution: 0.22, // energy kept per bounce — lower = settles faster
      frictionAir: 0.018, // velocity drained per frame in-air
      frictionFloorX: 0.9, // horizontal damping on each floor contact
      frictionFloorAng: 0.85, // angular damping on each floor contact
      mouseRadius: 60, // px, how close the pointer must be to push a fallen piece
      floorPad: 20, // px, floor sits this far above the very bottom of the viewport
      returnDuration: 0.8, // seconds — the animated "wander back" once scrolling away
      returnEase: "power2.inOut",
    },
  },

  // ------------------------------------------------------------------
  // Page chrome — src/scroll/edge-nav.ts. Two thresholds, not durations,
  // for showing .site-header / .footer--floating (either is enough). The
  // fade itself is CSS (--edge-nav-fade in style.css's :root).
  // ------------------------------------------------------------------
  edgeNav: {
    edge: 0.1, // how close to the very top/bottom of the whole page (as a 0..1 fraction of total scroll) counts as "at the edge"
    hoverZone: 90, // px from the top/bottom of the viewport that reveals header/footer on hover, from anywhere in the scroll
  },
} as const;
