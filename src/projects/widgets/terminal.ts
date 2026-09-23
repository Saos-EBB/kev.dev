// A tiny output-only terminal: appends text to a <pre>, understands the ANSI
// "SGR" colour codes the Java projects print (reset, bold, 30-37, 90-97,
// 40-47, 100-107 and 24-bit 38;2/48;2) and nothing else — no cursor
// movement, no clearing. Output is batched into one DOM update per frame,
// because the programs write one small chunk per token.

const PALETTE = [
  "#3b3f4a", "#ff5c6c", "#55ff88", "#ffd866", "#5c9dff", "#c792ea", "#4dd6e4", "#d8dae0",
  "#6b7080", "#ff8592", "#8affaa", "#ffe38f", "#8ab8ff", "#dbb2f5", "#86e6ef", "#ffffff",
];

// Keeps the DOM small when a program prints boards in an endless loop.
const MAX_NODES = 2500;

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

  constructor(out: HTMLElement) {
    this.out = out;
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
