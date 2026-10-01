// A tiny output-only terminal: appends text to a <pre>, understands the ANSI
// "SGR" colour codes the Java projects print (reset, bold, 30-37, 90-97,
// 40-47, 100-107 and 24-bit 38;2/48;2) and nothing else — no cursor
// movement, no clearing. Output is batched into one DOM update per frame,
// because the programs write one small chunk per token.
//
// It never scrolls sideways: the font shrinks until the widest line printed
// so far fits the box (board games print fixed-width grids that must not
// wrap), down to MIN_FONT_PX. Lines longer than PROSE_COLS are text, not
// layout — they just wrap (white-space: pre-wrap in grundlagen.css)
// instead of shrinking everything else. Re-fitted when the
// box resizes.

const PALETTE = Array.from({ length: 16 }, (_, i) => `var(--term-${i})`); // colors live in style.css :root

// Keeps the DOM small when a program prints boards in an endless loop.
const MAX_NODES = 2500;

// Below this a line wraps rather than shrinking further — still readable on a phone.
const MIN_FONT_PX = 7;
const TAB_COLS = 8;
// Wider than any board the programs print — a line this long is text.
const PROSE_COLS = 100;

interface Style {
  fg: string | null;
  bg: string | null;
  bold: boolean;
}

export class Terminal {
  private style: Style = { fg: null, bg: null, bold: false };
  private queue = "";
  private pendingEscape = "";
  private frame = 0;
  private out: HTMLElement;
  // Every distinct line width printed since the last clear(), in monospace
  // columns (a handful of values — boards repeat the same widths), and the
  // width of the line currently being printed.
  private widths = new Set<number>();
  private lineCols = 0;
  private baseFontPx = 0;
  private charRatio = 0; // glyph advance / font-size of the terminal font

  constructor(out: HTMLElement) {
    this.out = out;
    new ResizeObserver(() => this.fit()).observe(out);
  }

  write(text: string) {
    this.queue += text;
    if (!this.frame) this.frame = requestAnimationFrame(() => this.flush());
  }

  clear() {
    this.out.textContent = "";
    this.queue = "";
    this.pendingEscape = "";
    this.style = { fg: null, bg: null, bold: false };
    this.widths.clear();
    this.lineCols = 0;
    this.fit();
  }

  private countCols(text: string) {
    for (const ch of text) {
      if (ch === "\n" || ch === "\r") {
        if (this.lineCols) this.widths.add(this.lineCols);
        this.lineCols = 0;
      } else if (ch === "\t") this.lineCols += TAB_COLS - (this.lineCols % TAB_COLS);
      else this.lineCols++;
    }
  }

  // Font size that makes the widest fitting line fit the box: never above the CSS size,
  // never below MIN_FONT_PX.
  private fit() {
    const out = this.out;
    if (!this.baseFontPx) {
      out.style.fontSize = "";
      this.baseFontPx = parseFloat(getComputedStyle(out).fontSize) || 12;
    }
    const cs = getComputedStyle(out);
    const width = out.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (width <= 0) return; // not laid out (hidden) — the ResizeObserver comes back
    if (!this.charRatio) {
      const probe = document.createElement("span");
      probe.textContent = "0".repeat(100);
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:inherit;font-size:${this.baseFontPx}px`;
      out.appendChild(probe);
      this.charRatio = probe.getBoundingClientRect().width / 100 / this.baseFontPx || 0.6;
      probe.remove();
    }
    // Lines up to PROSE_COLS are layout (boards, tables) and drive the
    // size — down to the minimum, where a board still too wide wraps a
    // little. Longer lines are prose: they just wrap and don't shrink anything.
    let cols = this.lineCols <= PROSE_COLS ? this.lineCols : 0; // the unfinished line counts too
    for (const w of this.widths) if (w <= PROSE_COLS && w > cols) cols = w;
    const fitPx = cols ? width / (cols * this.charRatio) : this.baseFontPx;
    const px = Math.max(MIN_FONT_PX, Math.min(this.baseFontPx, Math.floor(fitPx * 10) / 10));
    out.style.fontSize = `${px}px`;
  }

  private flush() {
    this.frame = 0;
    const text = this.pendingEscape + this.queue;
    this.queue = "";
    this.pendingEscape = "";

    const nearBottom =
      this.out.scrollHeight - this.out.scrollTop - this.out.clientHeight < 40;
    const fragment = document.createDocumentFragment();
    let plain = "";
    const emit = () => {
      if (!plain) return;
      this.countCols(plain);
      const span = document.createElement("span");
      span.textContent = plain;
      if (this.style.fg) span.style.color = this.style.fg;
      if (this.style.bg) span.style.backgroundColor = this.style.bg;
      if (this.style.bold) span.style.fontWeight = "700";
      fragment.appendChild(span);
      plain = "";
    };

    for (let i = 0; i < text.length; i++) {
      if (text[i] !== "\u001b") {
        plain += text[i];
        continue;
      }
      // An escape sequence cut off by the chunk boundary waits for the next frame.
      const end = text.slice(i).search(/[A-Za-z]/);
      if (text[i + 1] !== "[" || end === -1) {
        if (i + 1 >= text.length || end === -1) {
          this.pendingEscape = text.slice(i);
          break;
        }
        continue;
      }
      const seq = text.slice(i + 2, i + end);
      const final = text[i + end];
      i += end;
      if (final !== "m") continue;
      emit();
      this.applySgr(seq === "" ? [0] : seq.split(";").map(Number));
    }
    emit();

    this.out.appendChild(fragment);
    this.fit();
    while (this.out.childNodes.length > MAX_NODES) this.out.firstChild!.remove();
    if (nearBottom) this.out.scrollTop = this.out.scrollHeight;
  }

  private applySgr(codes: number[]) {
    for (let i = 0; i < codes.length; i++) {
      const c = codes[i];
      if (c === 0) this.style = { fg: null, bg: null, bold: false };
      else if (c === 1) this.style.bold = true;
      else if (c === 22) this.style.bold = false;
      else if (c >= 30 && c <= 37) this.style.fg = PALETTE[c - 30];
      else if (c >= 90 && c <= 97) this.style.fg = PALETTE[c - 90 + 8];
      else if (c >= 40 && c <= 47) this.style.bg = PALETTE[c - 40];
      else if (c >= 100 && c <= 107) this.style.bg = PALETTE[c - 100 + 8];
      else if (c === 39) this.style.fg = null;
      else if (c === 49) this.style.bg = null;
      else if ((c === 38 || c === 48) && codes[i + 1] === 2) {
        const rgb = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`;
        if (c === 38) this.style.fg = rgb;
        else this.style.bg = rgb;
        i += 4;
      }
    }
  }
}
