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
    hoverPull: 0.045, // ambient hover, always gentle
    dragLerp: 0.35, // active click-drag, firm — the grabbed node should feel held, not chased
    doubleTapMs: 300, // touch only: max gap between two taps to count as one double-tap-to-grab gesture
  },

  // ------------------------------------------------------------------
  // About → Projects — src/scroll/transition.ts. The elevator floor's
  // unfold + wall fade-out, driven by #projects scrolling into view.
  // ------------------------------------------------------------------
  aboutToProjects: {
    scrub: 0.4, // lag (seconds) between scroll position and the unfold's progress — light smoothing, not full "eases in after you stop" lag
  },

  // ------------------------------------------------------------------
  // Projects — src/projects/carousel.ts. The pinned 3D card carousel.
  // ------------------------------------------------------------------
  projects: {
    scrollPerCard: 600, // px of scroll it takes to rotate one card into the front (pin's total scroll length = (cardCount - 1) * this + one viewport height)
    scrub: 0.4, // lag (seconds) between scroll position and the cylinder's rotation
  },

  // ------------------------------------------------------------------
  // Contact — src/contact/contact.ts. Grid dissolve → black hold →
  // headline/mail/icons falling in, all one pinned & scrubbed timeline.
  // ------------------------------------------------------------------
  contact: {
    pinScroll: "+=140%", // scroll distance (relative to section height) the whole dissolve+hold+fall plays over — extra room so the fall doesn't feel rushed at normal scroll speed
    scrub: 0.85, // lag (seconds) between scroll position and timeline position — high enough that everything reads as an eased animation catching up to scroll rather than snapping 1:1 to it; safe to push since this page's scroll is already Lenis-smoothed, not the raw native scrollbar

    grid: {
      travel: 440, // px the bg grid keeps drifting down as it dissolves — 3x --elevator-tile; no actual gap between #projects and #contact, this drift is what sells "still descending into the tunnel" instead
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
  },

  // ------------------------------------------------------------------
  // Page chrome — src/scroll/edge-nav.ts. Not a duration but a
  // scroll-progress threshold: how close to the very top/bottom of the
  // page (as a 0..1 fraction of total scroll) counts as "at the edge"
  // for showing .site-header / .footer--floating. The fade itself is
  // CSS (--edge-nav-fade in style.css's :root).
  // ------------------------------------------------------------------
  edgeNav: {
    edge: 0.1,
  },
} as const;
