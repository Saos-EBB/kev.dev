# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kevin Schaberl's personal portfolio site (kev.dev / "SAOS"), built as a single-page, scroll-driven experience in vanilla TypeScript + Vite — no frontend framework for the main site. Content (project copy, CV, i18n strings) is hand-authored data, not pulled from a CMS. The repo is "All rights reserved" (see `LICENSE`); third-party assets/libraries are tracked separately in `NOTICE.md` — update it when adding a dependency, model, font, or asset that isn't yours.

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — `tsc` (type-check only, `noEmit: true`) then `vite build`. This is the only check in the repo: there is no separate lint, format, or test command/config.
- `npm run preview` — serve the built `dist/`.

There is no unit/integration test suite. Verifying a change means running `npm run dev` and checking the page in a browser (and `npm run build` for type errors).

## Multi-entry build

`vite.config.ts` declares four Rollup entries — `index.html`, `impressum.html`, `datenschutz.html`, `yourbrand/index.html` — because Impressum/Datenschutz are separate static pages with full browser reload (no client-side router) and `yourbrand/` is its own React app (see below). Tailwind is only wired up for `yourbrand/`'s stylesheet.

## Main site architecture (`src/`)

`src/main.ts` is the orchestrator: it builds the whole page by injecting one large template string into `#app`, then calls per-feature `init*`/`mount*` functions imported from the sibling directories (`hero/`, `about/`, `projects/`, `contact/`, `scroll/`, `theme/`, `i18n/`, `legal/`, `intro/`, `music/`). There's no component framework or virtual DOM — each feature module owns its own DOM queries, event wiring, and (where relevant) CSS file.

Things that only make sense once you've read `main.ts`:

- **Startup gate**: the page only becomes scrollable (`lenis.start()`) once both `window.load` has fired *and* the intro/loader animation has finished (`maybeStart()`). This exists to fix a mobile race where ScrollTrigger measured pinned sections before layout had settled.
- **LITE mode** (`src/viewport.ts`): decided once at load from `matchMedia("(max-width: 900px)")`. Phones/narrow tablets get a flattened layout (no 3D elevator, no pinned carousel — swipeable list/sheet instead); desktop gets the full scroll-driven scenes. Crossing the breakpoint live (resizing, rotating) triggers a full page reload rather than a live re-layout, because the scroll scenes are built for one mode at load time.
- **Language** (`src/i18n/index.ts`): `LANG` is also decided once at load — stored choice, else browser language, else `"en"` — because scroll scenes measure text at startup. `setLang()` stores and reloads. Arabic flips `dir="rtl"` on `<html>`. UI copy lives in `src/i18n/ui.ts`, accessed via `pick()`.
- **One shared scroll loop**: Lenis drives smooth scroll and is ticked from `gsap.ticker` so Lenis and GSAP ScrollTrigger (used by the project carousel and pinned sections) never run two competing `requestAnimationFrame` loops.
- **Viewport height probe**: anything that must line up with a ScrollTrigger pin uses `viewportHeight()` (a `100vh` probe element), not `window.innerHeight` — `100vh` stays stable when a mobile browser's address bar shows/hides, `innerHeight` doesn't. Pinned scene CSS uses `vh`, not `svh`, for the same reason.
- **`FORCE_MOTION_EVERYWHERE`** in `main.ts` currently overrides `prefers-reduced-motion` for every visitor; flipping it to `false` restores respecting the OS setting in production (always-on remains for `npm run dev`).

### Hero

`hero/cloth.ts` runs a cloth/spring canvas simulation; `main.ts` renders the hero name + subtitle onto an offscreen canvas texture (gradient fill, glow, periodic "shine" sweep matching the `.title-shine` CSS keyframes) and feeds that texture to the cloth so the simulated fabric displays the warped text instead of static DOM text. `hero/name-typewriter.ts` rotates through `hero/hero-names.ts` and marks the texture dirty; a `requestAnimationFrame` loop re-rasterizes it at most once per frame, only while the cloth is on-screen and running.

### Projects

Project content is data-driven: `src/projects/projects-data.ts` holds one `ProjectCard` per project (copy, tags, links, `layout`, `accent` color). `project-cards.ts` renders the chrome every card shares (head, Why?/Learned!/Code teasers, facet buttons); `project-visuals.ts` renders each card's own signature visual based on its `layout` (`blueprint`, `inbox`, `viewport`, `editor`, `pinboard`, `storyboard`, `portrait`). A card's interactive widget (`src/projects/widgets/*`) is lazy-loaded via dynamic `import()` only the first time its card is expanded — this is why heavy runtimes (CheerpJ, the 3D renderer, face-dots) never load on page view.

Notable widgets:
- `widgets/grundlagen.ts` + `widgets/java-runner.ts`: runs the original bootcamp Java programs (sourced live from `java/` via `?raw` imports) in-browser through CheerpJ, executing a prebuilt `public/java/grundlagen.jar`. CheerpJ has no stdin API, so `java-runner.ts` replaces the runtime's internal `cheerpOSInitFds` to bridge stdin/stdout to a custom terminal (`widgets/terminal.ts`) — treat that bridge as fragile across CheerpJ version bumps.
- `widgets/renderer.ts`: a from-scratch 2D-canvas wireframe 3D renderer (perspective divide + plane rotation + depth shading), ported from a separate `Renderder` repo; models in `widgets/renderer-models/`.
- `projects/face-dots-site.ts` mounts the `face-dots` package (below) as the portfolio card's own particle visual.

### Other site modules

- `about/elevator.ts` + `scroll/transition.ts`: the pinned "elevator ride" / box-to-grid scroll scenes (desktop only, skipped under LITE).
- `theme/theme.ts`: light/dark toggle via CSS custom properties.
- `legal/`: Impressum/Datenschutz content, shown both as their own static page entries and as an in-page overlay (`legal-overlay.ts`).

## `packages/face-dots/`

A standalone, site-agnostic local package (own `package.json`, not published to this repo's npm scope — see its own repo/README for the public version). Two entry points: `photoToFace()` cuts a face out of a photo client-side using MediaPipe's selfie segmenter and duotones it; `createFaceDots()` turns any transparent-background image into an interactive particle/ASCII grid. Nothing is ever uploaded — segmentation runs fully in-browser via WASM.

## `yourbrand/`

A separate React 19 + Tailwind app (its own Vite entry, `yourbrand/index.html` / `yourbrand/src/main.tsx`), carried over largely unchanged from a different Next.js project ("b2b-cv"). It's a white-label SaaS sales/demo page. kev.dev embeds it in an iframe from the YourBrand project card's "B2B" facet button, but it also works standalone at `/yourbrand/`. Next.js-specific pieces were swapped for browser equivalents (`next/link` → `<a>`, env vars → built-in defaults); the dev-only palette editor and an unrelated logo carousel were dropped. It keeps its own zustand-persisted language store (`localStorage` key `"xxx-language"`) which `src/i18n/index.ts` seeds from the portfolio's own language choice on load, so the two never disagree — if you change either language-storage key, update the other side too.

## `java/`

Source for the original bootcamp exercises shown live in the Grundlagen widget (imported via Vite's `?raw` loader, not compiled by this repo's own build). The actual bytecode the browser runs, `public/java/grundlagen.jar`, is produced by a build script that lives in the gitignored `scripts/` directory (not checked into this repo) — if that jar needs rebuilding, there is no in-repo command to do it.

## Working with this repo

- `scripts/` and `docs/` are gitignored by design ("internal notes and helper scripts, stay local only") — don't expect them to exist or to be part of the committed project.
- There's no router: every section lives on one scroll timeline on one HTML page, except the handful of separate Rollup entries listed above, which are real full-navigation pages.
