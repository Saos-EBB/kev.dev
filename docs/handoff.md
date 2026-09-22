# Handoff — floor/background cloth relief

Status: **off**. Paused for more brainstorming on what this should actually look/feel like, not
abandoned — nothing was deleted, only unwired from the live page.

## Where things stand

The elevator floor's skull relief is built and worked (right orientation, right timing), but was
switched off at your call — you liked the big floor skull as a brief flash, want to think more
before deciding what (if anything) goes in the projects background, and didn't want to keep
either half-decided on the live site while that's open.

**Currently live:** nothing — `src/scroll/transition.ts` is back to exactly what it was before
this thread (no import, no mount, no `onUpdate`). `.projects-bg-grid` is back to its original
plain CSS tile, no `::after`. Confirmed via `npm run build`: with nothing importing the relief
code, Vite drops it from the bundle entirely — `skull.png` no longer even appears in `dist/`,
bundle is back to 164KB (was 172KB with the floor relief wired in). Re-enabling costs nothing
extra to load once it's wired again; leaving it unwired costs nothing to keep around.

**Still in the tree, dormant, ready to re-wire:**
- `src/about/floor-relief.ts` — `mountFloorRelief(floorEl)`. Mounts a skull relief on the
  elevator floor, sized/timed as a brief flash partway through the tip-over.
- `src/cloth-relief.ts` — `mountClothRelief(el, depthUrl, placement, band, colorSource?)`. The
  generic version for a plain frontal element (no CSS-3D plane) — built for "maybe a hand or
  something else, somewhere else, later." Unused right now, not tied to the projects wall or
  anything specific.
- `src/experiments/room-cloth/skull-field.ts` (`floorSkull`, still has `wallSkull` too, unused),
  `src/experiments/room-cloth/mesh-patch.ts` (the shared quad renderer both relief modules call),
  `src/experiments/cloth-grid/depth-map.ts` (`imageDepth`, memoized by URL), `.../config.ts`
  (`defaultConfig`/`ClothConfig`), `.../depth/skull.png` (the baked depth map both use).

## To re-enable the floor relief exactly as it last worked

In `src/scroll/transition.ts`:
1. `import { mountFloorRelief, type FloorRelief } from "../about/floor-relief";`
2. Right after the `if (reducedMotion) return;` line:
   ```ts
   let relief: FloorRelief | undefined;
   const floorEl = aboutSection.querySelector<HTMLElement>(".elevator-wall--floor");
   if (floorEl) mountFloorRelief(floorEl).then((r) => (relief = r));
   ```
3. Add `onUpdate: (self) => relief?.setProgress(self.progress),` to the `pin` `ScrollTrigger.create({...})` call.

(Full diff is commit `e1e3a3b` plus the fixes on top — `git log --oneline 02225b5..a75c9a0`
has the whole thread in order, `git show <hash>` for any one step.)

## What was tried and learned along the way

Short version — full detail in `docs/errors.md` and `docs/build-log.md`:

- A side-wall relief (skulls standing out of the elevator's left/right walls) was tried first,
  in a `/cloth` test room. Dropped: the live page's `--grid-cell` (48px) is too coarse for a
  wall-sized patch to read as a face, just a blob.
- The floor was picked instead — bigger available area, same coarse-cell problem fixed by giving
  the patch its own finer mesh (a quarter of `--grid-cell`, local to the patch only; unraised
  cells stay transparent so the coarser page grid still shows through outside the silhouette, no
  seam).
- `floorSkull()`'s depth-image sampling had the vertical axis inverted (fixed) — the floor's own
  top edge is what becomes the wall's top once `transition.ts` tips it up, so that had to map to
  the picture's top (forehead), not its bottom (chin).
- A "big skull" on the floor unavoidably eats most of `--elevator-depth`'s (1440px) budget — the
  skull picture is near-square, so its depth-axis footprint is roughly its own width regardless
  of `stretch`. Not a bug, just a hard ceiling of "square picture, narrow shaft."
- Tried the same relief technique (mesh-patch quads) on `.projects-bg-grid` (the projects
  carousel's always-visible pinned background) — first as a small centred patch, then as a
  canvas spanning the whole visible background. Dropped: read as a lesser "mini" version next to
  the floor's now-bigger skull.
- Tried a pure-CSS alternative for the projects background: `skull.png` as a `mask-image` with
  `mask-mode: luminance`, tinted with the grid colour, zero JS. Also dropped — called ugly on
  sight, no salvage attempt.
- Floor relief's band was originally wide (visible across ~78% of the tip-over) — narrowed to a
  quick flash (`{start:0.32, end:0.48, rise:0.06, fall:0.08}`) once you'd seen it: `bandValue`
  (`push-strength.ts`) has no plateau, it only ever rises then immediately falls, so duration is
  entirely rise+fall's width, not a separate "hold."

## Open questions for the next round

- Does anything belong in the projects background at all, or was that reaching for symmetry
  ("it's the same floor, so...") that the design doesn't actually need?
- If something goes in the projects background: same skull, a different shape entirely, or
  nothing there and let the floor's own flash be the whole moment?
- Is the skull the right image long-term, or a placeholder that happened to already exist
  (`bake-depth.mjs` can bake a new one from any mesh if a different shape is wanted)?
