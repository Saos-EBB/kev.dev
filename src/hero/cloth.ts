// Interactive cloth grid for the hero background.
//
// Physics: Verlet integration + iterative distance constraints, after
// Thomas Jakobsen, "Advanced Character Physics" (2001) — no velocity is
// stored explicitly; instead each node remembers its previous position
// and the "velocity" falls out of (current - previous) each step. This
// is what makes constraint relaxation cheap and unconditionally stable.

import { TIMINGS } from "../timings";
import { COLORS, hexToRgb } from "../colors";
import { DRIFT_ENABLED, driftOffset } from "./cloth-drift"; // cloth-drift
import {
  PULLS_ENABLED,
  INTRO_DELAY_MS,
  INTRO_PULL_MS,
  INTRO_HOLD_MS,
  INTRO_STRENGTH,
  INTRO_LITE_PULL_MS,
  INTRO_LITE_HOLD_MS,
  INTRO_LITE_STRENGTH,
  IDLE_DELAY_MIN_MS,
  IDLE_DELAY_MAX_MS,
  IDLE_PULL_MS,
  IDLE_HOLD_MS,
  IDLE_STRENGTH,
  IDLE_DISTANCE_MIN,
  IDLE_DISTANCE_MAX,
  rand,
  easeOutCubic,
  easeInOutSine,
} from "./cloth-pulls"; // cloth-pulls

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const SPACING = 23; // px between resting nodes
const MAX_COLS = 220;
const MAX_ROWS = 140;
// The resting grid spans an area this many times bigger (linearly, so
// area grows with the square of this) than the visible box it's centered
// on. The extra tiles sit outside the visible card and only get pulled
// into view when the cursor drags near them — "there's more" past the
// edge you can see.
const REST_EXPANSE = 2.4;
const ITERATIONS = 4; // constraint relaxation passes per frame
// Phones/tablets: the off-card expanse is mostly invisible there anyway
// (no cursor roams past the card edge), so it shrinks — less than half
// the nodes — and one relaxation pass less. Same look on the card itself.
const IS_LITE = window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
const REST_EXPANSE_LITE = 1.6;
const ITERATIONS_LITE = 3;
const DAMPING = 0.98; // velocity retained per frame (energy loss)
const ANCHOR_K = 0.02; // pull-back strength toward the resting grid point
const GRAVITY = 0; // floating field, tunable

// Hover and click-drag use the same mechanic — pin the single nearest
// node and let its neighbors follow only through the constraints below,
// which is what gives the "pulled from a point" cone shape. Hover just
// re-picks its nearest node every frame (so it trails the cursor) and
// pulls gently; click-drag keeps whatever it grabbed and pulls hard —
// a little taste of the real thing, enough to make you want to click.
const HOVER_RADIUS = 110; // px, how close the cursor must be to affect a node
const HOVER_RADIUS_SQ = HOVER_RADIUS * HOVER_RADIUS;
const HOVER_PULL = TIMINGS.hero.hoverPull; // gentle

const GRAB_RADIUS = 140; // px, how close a pointer must start to grab a node
const DRAG_LERP = TIMINGS.hero.dragLerp; // firm — how snappily the grabbed node follows

// Cheap fake "light": no lighting model, just one additive radial falloff
// centered on the pointer — brighter the closer (distance up, brightness
// down), same direction as the tension highlight in draw() but keyed off
// distance-to-pointer instead of stretch.
// Parked off for now (kept, not deleted — the mouse-follow version reads
// wrong and is getting reworked into the stretch-based light below instead
// of removed outright).
const GLOW_ENABLED = false;
const GLOW_RADIUS = 260; // px, how far the falloff reaches
const GLOW_ALPHA = 0.16; // while hovering
const GLOW_ALPHA_DRAG = 0.3; // brighter while actively dragging a node

// Touch: a vertical swipe must keep scrolling the page, so a finger only
// grabs the cloth when the gesture says so — either it moves sideways
// first (the hero is touch-action: pan-y, so the browser hands sideways
// moves to us and keeps vertical ones for scrolling), or it rests still
// for LONG_PRESS_MS. Once grabbed, touchmove is cancelled so the drag can
// go in any direction without the page scrolling under it.
const LONG_PRESS_MS = TIMINGS.hero.longPressMs;
const TOUCH_SLOP = 8; // px a finger may wobble before it counts as a move

// The text warp uses a coarser sub-sample of the grid (every Nth node in
// each direction) — letters are big enough that this still looks smooth,
// and it keeps the per-frame triangle-draw count cheap.
const WARP_STEP = 4;

interface Node {
  x: number;
  y: number;
  px: number;
  py: number;
  ox: number;
  oy: number;
}

interface Constraint {
  a: number;
  b: number;
  restLength: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// One coarse quad of the text warp: 4 node indices (rest positions define
// the source UV rectangle) plus the matching texture-pixel rectangle.
interface WarpCell {
  tl: number;
  tr: number;
  bl: number;
  br: number;
  su0: number;
  sv0: number;
  su1: number;
  sv1: number;
}

export class Cloth {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private constraints: Constraint[] = [];
  private cols = 0;
  private rows = 0;
  private width = 0;
  private height = 0;
  private lineColor: string = COLORS.line; // fallback only — the constructor below always tries the live --grid-color first

  // The canvas is deliberately bigger than the area the grid rests in
  // (see `boundsEl`), so a dragged node can bleed out over the rest of
  // the hero instead of being clipped at the grid's resting box.
  private boundsEl: HTMLElement | null;
  private textBoundsEl: HTMLElement | null;
  private restRect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  // The name, rendered once to an offscreen texture and warped onto the
  // grid's current (possibly dragged) shape every frame instead of being
  // static DOM text — see setTextTexture() and the WARP_STEP cells below.
  private textTexture: HTMLCanvasElement | null = null;
  private textRect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private warpCells: WarpCell[] = [];

  // Ambient hover: always tracked while the pointer is on the page.
  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;

  // Click-and-hold grab: a single pinned node, released on pointerup.
  private grabbedIndex = -1;
  private pointerDown = false;

  // A finger that's down but hasn't grabbed yet (see LONG_PRESS_MS).
  private touchPending: { id: number; x: number; y: number } | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | undefined;

  // The loop only runs while the hero is on screen and the tab visible —
  // nothing of it is seen otherwise, and on phones the canvas upload alone
  // cost every frame of the rest of the page.
  private onScreen = true;
  private running = false;

  // Whichever node update() is currently pinning/pulling this frame —
  // either the click-drag grab or the nearest node under a plain hover.
  private activeIndex = -1;

  // Scripted grab-drag-release, timer-driven instead of pointer-driven —
  // see cloth-pulls.ts. Takes priority over ambient hover in update()
  // below, but a real click-drag (pointerDown) always wins over it.
  private autoPull: {
    nodeIndex: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    startTime: number;
    pullMs: number;
    holdMs: number;
    strength: number;
    ease: (t: number) => number;
  } | null = null; // cloth-pulls

  private readonly reducedMotion: boolean;
  private readonly touchGrabAnyDirection: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    boundsEl?: HTMLElement,
    textBoundsEl?: HTMLElement,
    // On a page that doesn't scroll (the /test playground) a finger may
    // grab in any direction, not just sideways.
    { touchGrabAnyDirection = false } = {},
  ) {
    this.touchGrabAnyDirection = touchGrabAnyDirection;
    this.canvas = canvas;
    this.boundsEl = boundsEl ?? null;
    this.textBoundsEl = textBoundsEl ?? null;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context not available");
    this.ctx = ctx;

    const lineColorToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--grid-color")
      .trim();
    if (lineColorToken) this.lineColor = lineColorToken;
    this.buildLightSteps();

    // .force-motion (set in dev, or via ?motion in prod — see main.ts)
    // overrides prefers-reduced-motion for local testing. Same check as
    // dancer.ts/contact.ts/transition.ts/carousel.ts.
    const forceMotion = document.documentElement.classList.contains(
      "force-motion",
    );
    this.reducedMotion =
      !forceMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.resize();
    this.buildGrid();
    window.addEventListener("resize", this.handleResize, { passive: true });

    if (this.reducedMotion) {
      this.draw();
      return;
    }

    // The canvas itself is pointer-events:none (see style.css), so hover
    // is tracked globally via window/document instead of canvas events —
    // nav links and icons keep receiving their own clicks untouched.
    window.addEventListener("pointermove", this.handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", this.handlePointerDown, {
      passive: false,
    });
    window.addEventListener("pointerup", this.handlePointerUp, {
      passive: true,
    });
    window.addEventListener("pointercancel", this.handlePointerUp, {
      passive: true,
    });
    // Touch has no hover state, so treat leaving the window/tab as the
    // mouse equivalent of "not near the cloth anymore".
    document.addEventListener("pointerout", this.handlePointerOut);
    // Non-passive: the one place a touch drag stops the page scrolling.
    window.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });

    new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting;
      this.syncRunning();
    }).observe(this.canvas);
    document.addEventListener("visibilitychange", () => this.syncRunning());
    this.syncRunning();
  }

  private syncRunning() {
    const shouldRun = this.onScreen && !document.hidden;
    if (shouldRun === this.running) return;
    this.running = shouldRun;
    if (shouldRun) requestAnimationFrame(this.loop);
  }

  // Public: whether the hero is currently animating — main.ts's name
  // shine piggybacks on it instead of running a loop of its own.
  get isRunning() {
    return this.running;
  }

  // Public: kicks off the scripted intro pull + the recurring idle pulls
  // (see cloth-pulls.ts). Call once the screen above the hero is actually
  // out of the way — the SAOS intro/loader overlay's shatter has finished
  // (or was skipped on a return visit) — not from the constructor, since
  // the cloth is built and starts looping well before that overlay clears
  // and the gesture would otherwise play out hidden behind it. cloth-pulls
  startAutoPulls() {
    if (this.reducedMotion || !PULLS_ENABLED) return;
    setTimeout(() => this.startIntroPull(), INTRO_DELAY_MS);
    this.scheduleIdlePull(
      INTRO_DELAY_MS +
        (IS_LITE ? INTRO_LITE_PULL_MS + INTRO_LITE_HOLD_MS : INTRO_PULL_MS + INTRO_HOLD_MS) +
        rand(IDLE_DELAY_MIN_MS, IDLE_DELAY_MAX_MS),
    );
  }

  // Public: one scripted pull on demand — the kev.dev card's "Du bist schon
  // drin" button jumps to the hero and tugs the cloth once. cloth-pulls
  pull() {
    if (this.reducedMotion) return;
    this.startIntroPull();
  }

  // Nearest node to (x, y) by its resting position, not its current
  // (possibly mid-animation) one — used to pick where a scripted pull
  // grabs from, same idea as the pointer grab search in
  // handlePointerDown but keyed off rest position instead of live
  // position, and with no radius cap since the caller already knows the
  // point is meaningful. cloth-pulls
  private nearestRestNodeIndex(x: number, y: number): number {
    let nearest = -1;
    let nearestDistSq = Infinity;
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const dx = n.ox - x;
      const dy = n.oy - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = i;
      }
    }
    return nearest;
  }

  // The once-per-load intro gesture: grabs the point between the name's
  // first letter and the "J" of the subtitle (both sit near the top-left
  // of textRect, the shared box the two lines share) and hauls it up to
  // the hero's opposite top-right corner. cloth-pulls
  private startIntroPull() {
    if (this.nodes.length === 0 || this.textRect.width <= 0) return;
    const grabX = this.textRect.x + 8;
    const grabY = this.textRect.y + this.textRect.height * 0.5;
    const nodeIndex = this.nearestRestNodeIndex(grabX, grabY);
    if (nodeIndex === -1) return;
    const node = this.nodes[nodeIndex];

    this.autoPull = {
      nodeIndex,
      fromX: node.x,
      fromY: node.y,
      toX: this.width * 0.88,
      toY: this.height * 0.12,
      startTime: performance.now(),
      pullMs: IS_LITE ? INTRO_LITE_PULL_MS : INTRO_PULL_MS,
      holdMs: IS_LITE ? INTRO_LITE_HOLD_MS : INTRO_HOLD_MS,
      strength: IS_LITE ? INTRO_LITE_STRENGTH : INTRO_STRENGTH,
      ease: IS_LITE ? easeInOutSine : easeOutCubic,
    };
  }

  // Repeating ambient gesture: grabs a node resting outside the visible
  // card and yanks it hard in a random direction — the grab point itself
  // never renders (canvas clips to its own box), only the tension it
  // puts through the mesh at the edge of the frame. Reschedules itself
  // after every pull, indefinitely. cloth-pulls
  private scheduleIdlePull(delayMs: number) {
    setTimeout(() => {
      this.startIdlePull();
      this.scheduleIdlePull(rand(IDLE_DELAY_MIN_MS, IDLE_DELAY_MAX_MS));
    }, delayMs);
  }

  private startIdlePull() {
    if (this.nodes.length === 0) return;
    const offscreen: number[] = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (n.ox < 0 || n.ox > this.width || n.oy < 0 || n.oy > this.height) {
        offscreen.push(i);
      }
    }
    if (offscreen.length === 0) return;
    const nodeIndex = offscreen[Math.floor(Math.random() * offscreen.length)];
    const node = this.nodes[nodeIndex];

    const angle = rand(0, Math.PI * 2);
    const distance = rand(IDLE_DISTANCE_MIN, IDLE_DISTANCE_MAX);

    this.autoPull = {
      nodeIndex,
      fromX: node.x,
      fromY: node.y,
      toX: node.x + Math.cos(angle) * distance,
      toY: node.y + Math.sin(angle) * distance,
      startTime: performance.now(),
      pullMs: IDLE_PULL_MS,
      holdMs: IDLE_HOLD_MS,
      strength: IDLE_STRENGTH,
      ease: easeOutCubic,
    };
  }

  private handleResize = () => {
    this.refreshBounds();
  };

  // Public: re-reads boundsEl/textBoundsEl and rebuilds the grid from
  // them. Called on window resize, and externally whenever the name's
  // own layout box changes for a reason resize doesn't cover (e.g. a
  // web font swapping in after load).
  refreshBounds() {
    this.resize();
    this.buildGrid();
    if (this.reducedMotion) this.draw();
  }

  private resize() {
    // Capped: a full-frame canvas at 3x is 9x the pixels of 1x for a mesh
    // of hairlines that look the same at 2x — the mobile frame-time cost.
    // Lite devices cap lower still: the canvas is redrawn every frame, and
    // at 1.5x the hairlines still look sharp on a phone.
    const dpr = Math.min(window.devicePixelRatio || 1, IS_LITE ? 1.5 : 2);
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.boundsEl) {
      const canvasRect = this.canvas.getBoundingClientRect();
      const boundsRect = this.boundsEl.getBoundingClientRect();

      // Union with the text box too, if there is one, so the resting grid
      // actually has nodes to warp under the name — not just its own band.
      let left = boundsRect.left;
      let top = boundsRect.top;
      let right = boundsRect.right;
      let bottom = boundsRect.bottom;
      if (this.textBoundsEl) {
        const t = this.textBoundsEl.getBoundingClientRect();
        left = Math.min(left, t.left);
        top = Math.min(top, t.top);
        right = Math.max(right, t.right);
        bottom = Math.max(bottom, t.bottom);
        this.textRect = {
          x: t.left - canvasRect.left,
          y: t.top - canvasRect.top,
          width: t.width,
          height: t.height,
        };
      }

      const boxWidth = right - left;
      const boxHeight = bottom - top;
      const expanse = IS_LITE ? REST_EXPANSE_LITE : REST_EXPANSE;
      const width = boxWidth * expanse;
      const height = boxHeight * expanse;
      this.restRect = {
        // Centered on the visible box, so it grows outward equally on
        // every side rather than just to the right/bottom.
        x: left - canvasRect.left - (width - boxWidth) / 2,
        y: top - canvasRect.top - (height - boxHeight) / 2,
        width,
        height,
      };
    } else {
      this.restRect = { x: 0, y: 0, width: this.width, height: this.height };
    }
  }

  private buildGrid() {
    const { x: restX, y: restY, width: restW, height: restH } = this.restRect;
    this.cols = Math.min(Math.floor(restW / SPACING), MAX_COLS);
    this.rows = Math.min(Math.floor(restH / SPACING), MAX_ROWS);

    const gridWidth = (this.cols - 1) * SPACING;
    const gridHeight = (this.rows - 1) * SPACING;
    const offsetX = restX + (restW - gridWidth) / 2;
    const offsetY = restY + (restH - gridHeight) / 2;

    this.nodes = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = offsetX + c * SPACING;
        const y = offsetY + r * SPACING;
        this.nodes.push({ x, y, px: x, py: y, ox: x, oy: y });
      }
    }

    this.constraints = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        if (c < this.cols - 1) {
          this.constraints.push({ a: i, b: i + 1, restLength: SPACING });
        }
        if (r < this.rows - 1) {
          this.constraints.push({
            a: i,
            b: i + this.cols,
            restLength: SPACING,
          });
        }
      }
    }

    this.buildWarpCells();
  }

  // Public: called from outside once the name's texture (and its current
  // layout box) is ready/updated — regenerates which coarse grid quads
  // warp-render it and at what texture UVs.
  setTextTexture(texture: HTMLCanvasElement) {
    this.textTexture = texture;
    this.buildWarpCells();
    // No animation loop in reduced-motion mode — redraw now so the
    // texture actually shows up instead of waiting for a frame that
    // never comes.
    if (this.reducedMotion) this.draw();
  }

  private buildWarpCells() {
    this.warpCells = [];
    if (!this.textTexture || this.textRect.width <= 0) return;

    const { x: tx, y: ty, width: tw, height: th } = this.textRect;
    const texW = this.textTexture.width;
    const texH = this.textTexture.height;

    const uvOf = (nodeIndex: number) => {
      const n = this.nodes[nodeIndex];
      return { u: (n.ox - tx) / tw, v: (n.oy - ty) / th };
    };

    for (let r = 0; r + WARP_STEP < this.rows; r += WARP_STEP) {
      for (let c = 0; c + WARP_STEP < this.cols; c += WARP_STEP) {
        const tl = r * this.cols + c;
        const tr = r * this.cols + (c + WARP_STEP);
        const bl = (r + WARP_STEP) * this.cols + c;
        const br = (r + WARP_STEP) * this.cols + (c + WARP_STEP);

        const a = uvOf(tl);
        const b = uvOf(br);
        // Skip cells entirely outside the text box (most of the expanded
        // mesh) — but keep ones that only partially overlap it (e.g. the
        // first/last letter), sampling a bit past the texture edge is
        // harmless since drawImage just returns transparent there.
        if (b.u < 0 || a.u > 1 || b.v < 0 || a.v > 1) continue;

        this.warpCells.push({
          tl,
          tr,
          bl,
          br,
          su0: a.u * texW,
          sv0: a.v * texH,
          su1: b.u * texW,
          sv1: b.v * texH,
        });
      }
    }
  }

  private setPointer(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    // Clamped to the canvas's own box (== the visible hero-frame card) so
    // a node being hovered/dragged is never pulled toward a point outside
    // it — the mesh can still bleed over the nav/name inside the card
    // (see #cloth-canvas in style.css), just not past the card's own edge.
    this.pointerX = clamp(e.clientX - rect.left, 0, this.width);
    this.pointerY = clamp(e.clientY - rect.top, 0, this.height);
    this.pointerActive = true;
  }

  private handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "touch") {
      this.setPointer(e);
      return;
    }
    // Touch: only a finger that's down counts — no stale "hover" left at
    // the spot where the last swipe began.
    if (this.pointerDown) {
      this.setPointer(e);
      return;
    }
    const pending = this.touchPending;
    if (!pending || pending.id !== e.pointerId) return;
    if (this.touchGrabAnyDirection) {
      if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > TOUCH_SLOP) {
        this.grabAt(pending.x, pending.y);
        this.setPointer(e);
      }
      return;
    }
    // Wandered off vertically: that's a scroll, not a press — no
    // long-press grab later either.
    if (Math.abs(e.clientY - pending.y) > TOUCH_SLOP) {
      this.clearTouchPending();
      return;
    }
    // A sideways pull grabs. Vertical moves are the browser's (pan-y) —
    // it cancels the pointer once it starts scrolling, but the first few
    // moves can still reach us before that, so check the direction too.
    const dx = Math.abs(e.clientX - pending.x);
    const dy = Math.abs(e.clientY - pending.y);
    if (dx > TOUCH_SLOP && dx > dy * 1.5) {
      this.grabAt(pending.x, pending.y);
      this.setPointer(e);
    }
  };

  // Whether a press at viewport (x, y) lands on the visible card.
  private onCard(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }

  // Pins the node nearest viewport point (clientX, clientY). Returns
  // whether one was in reach.
  private grabAt(clientX: number, clientY: number) {
    this.clearTouchPending();
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let nearest = -1;
    let nearestDist = GRAB_RADIUS;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const d = Math.hypot(node.x - px, node.y - py);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    if (nearest === -1) return false;
    this.grabbedIndex = nearest;
    this.pointerDown = true;
    this.pointerX = clamp(px, 0, this.width);
    this.pointerY = clamp(py, 0, this.height);
    this.pointerActive = true;
    return true;
  }

  private clearTouchPending() {
    this.touchPending = null;
    clearTimeout(this.longPressTimer);
  }

  private handlePointerDown = (e: PointerEvent) => {
    // Nav links/icons and the SAOS intro overlay all sit over the
    // (pointer-events:none) canvas — let their own clicks through
    // untouched rather than have the cloth capture the pointer first and
    // swallow the click before it ever reaches them (this is what made
    // the intro's "click to shatter" never fire: any pointerdown near a
    // grid node — i.e. almost anywhere over the hero — grabbed the
    // pointer here first).
    const target = e.target;
    if (target instanceof Element && target.closest("a, button, .saos-intro"))
      return;

    // Only allow starting a grab when the press actually lands on the
    // visible card — window-level listeners otherwise mean a click well
    // outside the hero (in the page's own margin, say) could still yank
    // the nearest node in just because it's within GRAB_RADIUS in raw
    // pixel distance, even though nothing cloth-like is under the cursor.
    if (!this.onCard(e.clientX, e.clientY)) return;

    if (e.pointerType === "touch") {
      // Not a grab yet — see LONG_PRESS_MS / handlePointerMove.
      const pending = { id: e.pointerId, x: e.clientX, y: e.clientY };
      this.clearTouchPending();
      this.touchPending = pending;
      this.longPressTimer = setTimeout(() => {
        if (this.touchPending !== pending) return;
        if (this.grabAt(pending.x, pending.y)) navigator.vibrate?.(8);
      }, LONG_PRESS_MS);
      return;
    }

    if (!this.grabAt(e.clientX, e.clientY)) return;
    e.preventDefault();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (this.pointerDown && e.cancelable) e.preventDefault();
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.clearTouchPending();
    this.grabbedIndex = -1;
    this.pointerDown = false;
    if (e.pointerType === "touch") this.pointerActive = false;
  };

  private handlePointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget) this.pointerActive = false;
  };

  private drift = { x: 0, y: 0 }; // cloth-drift

  private update() {
    const seconds = performance.now() / 1000; // cloth-drift
    for (const node of this.nodes) {
      const vx = (node.x - node.px) * DAMPING;
      const vy = (node.y - node.py) * DAMPING;
      node.px = node.x;
      node.py = node.y;
      node.x += vx;
      node.y += vy + GRAVITY;
      // Spring back toward the resting grid position.
      if (DRIFT_ENABLED) driftOffset(node.ox, node.oy, seconds, this.drift); // cloth-drift
      node.x += (node.ox + this.drift.x - node.x) * ANCHOR_K;
      node.y += (node.oy + this.drift.y - node.y) * ANCHOR_K;
    }

    // Pick which single node this frame pins/pulls, and toward what
    // point: a real click-drag always wins, then a scripted auto-pull
    // (see cloth-pulls.ts), then — if just hovering — the nearest node
    // in reach, re-picked every frame so it trails the cursor instead of
    // latching onto one spot.
    this.activeIndex = -1;
    let pullStrength = 0;
    let targetX = 0;
    let targetY = 0;
    if (this.pointerDown && this.grabbedIndex !== -1) {
      this.activeIndex = this.grabbedIndex;
      pullStrength = DRAG_LERP;
      targetX = this.pointerX;
      targetY = this.pointerY;
    } else if (this.autoPull) { // cloth-pulls
      const elapsed = performance.now() - this.autoPull.startTime;
      const t = this.autoPull.ease(clamp(elapsed / this.autoPull.pullMs, 0, 1));
      this.activeIndex = this.autoPull.nodeIndex;
      pullStrength = this.autoPull.strength;
      targetX = this.autoPull.fromX + (this.autoPull.toX - this.autoPull.fromX) * t;
      targetY = this.autoPull.fromY + (this.autoPull.toY - this.autoPull.fromY) * t;
      if (elapsed > this.autoPull.pullMs + this.autoPull.holdMs) this.autoPull = null;
    } else if (this.pointerActive) {
      let nearest = -1;
      let nearestDistSq = HOVER_RADIUS_SQ;
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        const dx = this.pointerX - n.x;
        const dy = this.pointerY - n.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < nearestDistSq) {
          nearestDistSq = distSq;
          nearest = i;
        }
      }
      this.activeIndex = nearest;
      pullStrength = HOVER_PULL;
      targetX = this.pointerX;
      targetY = this.pointerY;
    }

    if (this.activeIndex !== -1) {
      const node = this.nodes[this.activeIndex];
      node.x += (targetX - node.x) * pullStrength;
      node.y += (targetY - node.y) * pullStrength;
    }

    const iterations = IS_LITE ? ITERATIONS_LITE : ITERATIONS;
    for (let iter = 0; iter < iterations; iter++) {
      this.satisfyConstraints();
    }
  }

  private satisfyConstraints() {
    const grabbed = this.activeIndex;

    for (const { a, b, restLength } of this.constraints) {
      const nodeA = this.nodes[a];
      const nodeB = this.nodes[b];
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const diff = (dist - restLength) / dist;
      const offsetX = dx * 0.5 * diff;
      const offsetY = dy * 0.5 * diff;

      const aPinned = a === grabbed;
      const bPinned = b === grabbed;

      if (aPinned) {
        nodeB.x -= offsetX * 2;
        nodeB.y -= offsetY * 2;
      } else if (bPinned) {
        nodeA.x += offsetX * 2;
        nodeA.y += offsetY * 2;
      } else {
        nodeA.x += offsetX;
        nodeA.y += offsetY;
        nodeB.x -= offsetX;
        nodeB.y -= offsetY;
      }
    }
  }

  // Lines are batched into a fixed number of alpha buckets so strokeStyle
  // only changes a handful of times per frame instead of once per line —
  // switching it thousands of times (once stretch varies per line, e.g.
  // while hovering) was the actual frame-time cost, not the line count.
  //
  // Also doubles as the cheap fake "light": no lighting model, just a
  // handful of discrete steps (not a smooth gradient — reads more like an
  // old flat-shaded renderer) keyed off how stretched each line currently
  // is. A line far from its resting length reads as "pulled closer to the
  // screen", so it jumps to a lighter step — color mixed toward white, not
  // just more opaque.
  private readonly LIGHT_STEPS = 5;
  private readonly LIGHT_STRETCH_CAP = 0.5; // stretch at/above which a line is fully lit
  private readonly LIGHT_MIX_MAX = 0.65; // top step's mix-toward-white amount
  private readonly ALPHA_MIN = 0.12;
  private readonly ALPHA_MAX = 0.8;
  private stepColors: string[] = [];
  private bucketed: number[][] = Array.from(
    { length: this.LIGHT_STEPS },
    () => [],
  );

  // Precomputes one rgba string per light step by mixing this.lineColor
  // toward white — called once lineColor is known (constructor) rather
  // than mixed per line per frame.
  private buildLightSteps() {
    const [r, g, b] = hexToRgb(this.lineColor);
    this.stepColors = [];
    for (let i = 0; i < this.LIGHT_STEPS; i++) {
      const t = i / (this.LIGHT_STEPS - 1);
      const mix = t * this.LIGHT_MIX_MAX;
      const mr = Math.round(r + (255 - r) * mix);
      const mg = Math.round(g + (255 - g) * mix);
      const mb = Math.round(b + (255 - b) * mix);
      const alpha = this.ALPHA_MIN + t * (this.ALPHA_MAX - this.ALPHA_MIN);
      this.stepColors.push(`rgba(${mr}, ${mg}, ${mb}, ${alpha.toFixed(2)})`);
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.lineWidth = 1;

    for (const bucket of this.bucketed) bucket.length = 0;

    for (let i = 0; i < this.constraints.length; i++) {
      const { a, b, restLength } = this.constraints[i];
      const nodeA = this.nodes[a];
      const nodeB = this.nodes[b];
      const dist = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
      const stretch = Math.abs(dist - restLength) / restLength;
      const step = Math.min(
        Math.floor((stretch / this.LIGHT_STRETCH_CAP) * this.LIGHT_STEPS),
        this.LIGHT_STEPS - 1,
      );
      this.bucketed[step].push(i);
    }

    for (let step = 0; step < this.LIGHT_STEPS; step++) {
      const indices = this.bucketed[step];
      if (indices.length === 0) continue;
      ctx.strokeStyle = this.stepColors[step];
      ctx.beginPath();
      for (const idx of indices) {
        const { a, b } = this.constraints[idx];
        const nodeA = this.nodes[a];
        const nodeB = this.nodes[b];
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
      }
      ctx.stroke();
    }

    if (this.textTexture) this.drawWarpedText(ctx, this.textTexture);

    this.drawGlow(ctx);
  }

  // The additive falloff described above — drawn last so it washes over
  // both the lines and the warped name.
  private drawGlow(ctx: CanvasRenderingContext2D) {
    if (!GLOW_ENABLED || !this.pointerActive) return;

    const alpha = this.pointerDown ? GLOW_ALPHA_DRAG : GLOW_ALPHA;
    const gradient = ctx.createRadialGradient(
      this.pointerX,
      this.pointerY,
      0,
      this.pointerX,
      this.pointerY,
      GLOW_RADIUS,
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.pointerX - GLOW_RADIUS,
      this.pointerY - GLOW_RADIUS,
      GLOW_RADIUS * 2,
      GLOW_RADIUS * 2,
    );
    ctx.restore();
  }

  // Warps the name texture onto the mesh's *current* (possibly dragged)
  // shape: each coarse cell is split into 2 triangles and drawn with the
  // classic canvas affine-transform-per-triangle trick — an exact affine
  // map exists for any 3 point correspondences, so drawImage() with that
  // transform reproduces the source triangle stretched onto the
  // destination one.
  private drawWarpedText(ctx: CanvasRenderingContext2D, tex: HTMLCanvasElement) {
    for (const cell of this.warpCells) {
      const tl = this.nodes[cell.tl];
      const tr = this.nodes[cell.tr];
      const bl = this.nodes[cell.bl];
      const br = this.nodes[cell.br];

      drawTriangle(
        ctx,
        tex,
        cell.su0,
        cell.sv0,
        cell.su1,
        cell.sv0,
        cell.su0,
        cell.sv1,
        tl.x,
        tl.y,
        tr.x,
        tr.y,
        bl.x,
        bl.y,
      );
      drawTriangle(
        ctx,
        tex,
        cell.su1,
        cell.sv0,
        cell.su1,
        cell.sv1,
        cell.su0,
        cell.sv1,
        tr.x,
        tr.y,
        br.x,
        br.y,
        bl.x,
        bl.y,
      );
    }
  }

  private loop = () => {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  };
}

// Draws the (sx0,sy0)-(sx1,sy1)-(sx2,sy2) triangle of `img` warped onto
// the (dx0,dy0)-(dx1,dy1)-(dx2,dy2) triangle via the unique affine
// transform mapping one to the other, clipped to the destination shape.
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx0: number,
  sy0: number,
  sx1: number,
  sy1: number,
  sx2: number,
  sy2: number,
  dx0: number,
  dy0: number,
  dx1: number,
  dy1: number,
  dx2: number,
  dy2: number,
) {
  const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
  if (Math.abs(denom) < 1e-6) return;

  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
  const e =
    (dx0 * (sx1 * sy2 - sx2 * sy1) +
      dx1 * (sx2 * sy0 - sx0 * sy2) +
      dx2 * (sx0 * sy1 - sx1 * sy0)) /
    denom;
  const f =
    (dy0 * (sx1 * sy2 - sx2 * sy1) +
      dy1 * (sx2 * sy0 - sx0 * sy2) +
      dy2 * (sx0 * sy1 - sx1 * sy0)) /
    denom;

  // Nudge the clip triangle outward from its centroid so neighboring
  // triangles overlap slightly instead of leaving a hairline gap — plain
  // anti-aliased clip edges otherwise show as a faint seam along every
  // shared edge (each side's edge blends toward transparent independently,
  // and the two half-coverage edges don't sum to solid).
  // Proportional to the triangle's own size, not a fixed px amount: while
  // the mesh is being stretched (hover/drag), neighboring cells stretch by
  // different amounts, so a fixed nudge falls short on the more-stretched
  // ones — the seam (and the near-black hero background behind the canvas)
  // flickers through as the mesh keeps moving. Scaling with the triangle
  // itself keeps the overlap sufficient at any stretch.
  const cx = (dx0 + dx1 + dx2) / 3;
  const cy = (dy0 + dy1 + dy2) / 3;
  const GROW_FRACTION = 0.04;
  const grow = (x: number, y: number) => [
    x + (x - cx) * GROW_FRACTION,
    y + (y - cy) * GROW_FRACTION,
  ];
  const [gx0, gy0] = grow(dx0, dy0);
  const [gx1, gy1] = grow(dx1, dy1);
  const [gx2, gy2] = grow(dx2, dy2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
