// Interactive cloth grid for the hero background.
//
// Physics: Verlet integration + iterative distance constraints, after
// Thomas Jakobsen, "Advanced Character Physics" (2001) — no velocity is
// stored explicitly; instead each node remembers its previous position
// and the "velocity" falls out of (current - previous) each step. This
// is what makes constraint relaxation cheap and unconditionally stable.

import { TIMINGS } from "../timings";
import { COLORS, hexToRgbTriple } from "../colors";

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

// Touch has no hover, so a plain one-finger scroll already reads as
// "hover" through pointermove (see handlePointerMove) — but a bare
// touchdown can't also grab-and-pin the way a mouse click does, or every
// scroll gesture that starts near a node would hijack the page instead of
// scrolling it. A double-tap is the deliberate "no, I mean grab this"
// gesture instead: the second tap (if close enough in time/space to the
// first) is what grabs, exactly like a mouse pointerdown would.
const DOUBLE_TAP_MS = TIMINGS.hero.doubleTapMs;
const DOUBLE_TAP_RADIUS = 40; // px, how far apart two taps can land and still count as one

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

  // Last touch tap's time/position, to recognize the second tap of a
  // double-tap-to-grab gesture (see DOUBLE_TAP_MS/RADIUS above).
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;

  // Whichever node update() is currently pinning/pulling this frame —
  // either the click-drag grab or the nearest node under a plain hover.
  private activeIndex = -1;

  private readonly reducedMotion: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    boundsEl?: HTMLElement,
    textBoundsEl?: HTMLElement,
  ) {
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

    // ?motion in the URL force-enables the cloth for local testing when the
    // OS/browser reports prefers-reduced-motion but you want to see it move
    // anyway. Production behavior (respecting the OS setting) is unchanged.
    const forceMotion = new URLSearchParams(window.location.search).has(
      "motion",
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

    this.loop();
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      const width = boxWidth * REST_EXPANSE;
      const height = boxHeight * REST_EXPANSE;
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
    this.pointerX = e.clientX - rect.left;
    this.pointerY = e.clientY - rect.top;
    this.pointerActive = true;
  }

  private handlePointerMove = (e: PointerEvent) => {
    this.setPointer(e);
  };

  private handlePointerDown = (e: PointerEvent) => {
    // Nav links and icons sit over the (pointer-events:none) canvas — let
    // their own clicks through untouched rather than treating them as a
    // cloth grab.
    const target = e.target;
    if (target instanceof Element && target.closest("a, button")) return;

    this.setPointer(e);

    if (e.pointerType === "touch") {
      const now = performance.now();
      const dx = this.pointerX - this.lastTapX;
      const dy = this.pointerY - this.lastTapY;
      const isSecondTap =
        now - this.lastTapTime < DOUBLE_TAP_MS &&
        Math.hypot(dx, dy) < DOUBLE_TAP_RADIUS;

      if (!isSecondTap) {
        // First tap — remember it and otherwise let this touch behave
        // like a normal scroll, not a grab.
        this.lastTapTime = now;
        this.lastTapX = this.pointerX;
        this.lastTapY = this.pointerY;
        return;
      }
      this.lastTapTime = 0;
    }

    let nearest = -1;
    let nearestDist = GRAB_RADIUS;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const d = Math.hypot(node.x - this.pointerX, node.y - this.pointerY);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    if (nearest === -1) return;

    e.preventDefault();
    this.grabbedIndex = nearest;
    this.pointerDown = true;
    // Prevent the page from scrolling while a drag is in progress, but
    // otherwise leave touch scrolling free (see #cloth-canvas in CSS).
    this.canvas.style.touchAction = "none";
    this.canvas.setPointerCapture(e.pointerId);
  };

  private handlePointerUp = () => {
    this.grabbedIndex = -1;
    this.pointerDown = false;
    this.canvas.style.touchAction = "pan-y";
  };

  private handlePointerOut = (e: PointerEvent) => {
    if (!e.relatedTarget) this.pointerActive = false;
  };

  private update() {
    for (const node of this.nodes) {
      const vx = (node.x - node.px) * DAMPING;
      const vy = (node.y - node.py) * DAMPING;
      node.px = node.x;
      node.py = node.y;
      node.x += vx;
      node.y += vy + GRAVITY;
      // Spring back toward the resting grid position.
      node.x += (node.ox - node.x) * ANCHOR_K;
      node.y += (node.oy - node.y) * ANCHOR_K;
    }

    // Pick which single node the pointer currently affects: whatever's
    // pinned by an active click-drag, or — if just hovering — the
    // nearest node in reach, re-picked every frame so it trails the
    // cursor instead of latching onto one spot.
    this.activeIndex = -1;
    let pullStrength = 0;
    if (this.pointerDown && this.grabbedIndex !== -1) {
      this.activeIndex = this.grabbedIndex;
      pullStrength = DRAG_LERP;
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
    }

    if (this.activeIndex !== -1) {
      const node = this.nodes[this.activeIndex];
      node.x += (this.pointerX - node.x) * pullStrength;
      node.y += (this.pointerY - node.y) * pullStrength;
    }

    for (let iter = 0; iter < ITERATIONS; iter++) {
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
  private readonly ALPHA_BUCKETS = 14;
  private readonly ALPHA_MIN = 0.12;
  private readonly ALPHA_MAX = 0.8;
  private bucketed: number[][] = Array.from(
    { length: this.ALPHA_BUCKETS },
    () => [],
  );

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.lineWidth = 1;

    for (const bucket of this.bucketed) bucket.length = 0;

    const span = this.ALPHA_MAX - this.ALPHA_MIN;
    for (let i = 0; i < this.constraints.length; i++) {
      const { a, b, restLength } = this.constraints[i];
      const nodeA = this.nodes[a];
      const nodeB = this.nodes[b];
      const dist = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
      const stretch = Math.abs(dist - restLength) / restLength;
      const alpha = Math.min(this.ALPHA_MIN + stretch * 0.7, this.ALPHA_MAX);
      const bucketIndex = Math.min(
        Math.round(((alpha - this.ALPHA_MIN) / span) * (this.ALPHA_BUCKETS - 1)),
        this.ALPHA_BUCKETS - 1,
      );
      this.bucketed[bucketIndex].push(i);
    }

    for (let bi = 0; bi < this.ALPHA_BUCKETS; bi++) {
      const indices = this.bucketed[bi];
      if (indices.length === 0) continue;
      const alpha = this.ALPHA_MIN + (bi / (this.ALPHA_BUCKETS - 1)) * span;
      ctx.strokeStyle = `rgba(${hexToRgbTriple(this.lineColor)}, ${alpha.toFixed(2)})`;
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

  // Nudge the clip triangle outward from its centroid by ~0.75px so
  // neighboring triangles overlap slightly instead of leaving a hairline
  // gap — plain anti-aliased clip edges otherwise show as a faint seam
  // along every shared edge (each side's edge blends toward transparent
  // independently, and the two half-coverage edges don't sum to solid).
  const cx = (dx0 + dx1 + dx2) / 3;
  const cy = (dy0 + dy1 + dy2) / 3;
  const grow = (x: number, y: number) => {
    const vx = x - cx;
    const vy = y - cy;
    const len = Math.hypot(vx, vy) || 1;
    const k = 0.75 / len;
    return [x + vx * k, y + vy * k];
  };
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
