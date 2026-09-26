// Random dance sequencer for the header figure (markup in main.ts, moves in
// music.css). Idle: the figure lies flat and grey. When music starts it
// springs up (waking), picks a random move, runs it for PLAY_MS, then a
// short turn transition, then the next move. When music stops it collapses
// back to the floor (sleeping) and is idle again.

const MOVES = [
  "m-moonwalk",
  "m-salto",
  "m-twist",
  "m-batusi",
  "m-runman",
  "m-disco",
  "m-cwalk",
];
const PLAY_MS = 2800; // how long one move runs
const TRANS_MS = 700; // must match the duration of tr-turn in music.css
const WAKE_MS = 900; // must match wk-* in music.css
const SLEEP_MS = 700; // must match sl-* in music.css

type State = "idle" | "waking" | "dancing" | "sleeping";

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !document.documentElement.classList.contains("force-motion");

export function createDancer(el: SVGElement | null) {
  let timer: number | undefined;
  let state: State = "idle";
  let last = "";

  const pickMove = () => {
    let move: string;
    do move = MOVES[Math.floor(Math.random() * MOVES.length)];
    while (move === last);
    return (last = move);
  };

  const set = (cls: string) => {
    if (!el) return;
    el.setAttribute("class", `dancer ${cls}`.trim());
    void el.getBoundingClientRect(); // reflow so animations restart
  };
  const after = (ms: number, fn: () => void) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, ms);
  };

  function randomStep() {
    state = "dancing";
    set(`playing ${pickMove()}`);
    after(PLAY_MS, () => {
      set("playing t-active");
      after(TRANS_MS, randomStep);
    });
  }

  function toIdle() {
    state = "idle";
    last = "";
    // Reduced motion: no lying down either, the figure just stands grey.
    set(reducedMotion() ? "" : "idle");
  }

  toIdle();

  return {
    start() {
      if (state === "waking" || state === "dancing") return;
      if (reducedMotion()) return;
      state = "waking";
      set("playing waking");
      after(WAKE_MS, randomStep);
    },
    stop() {
      if (state === "idle" || state === "sleeping") return;
      window.clearTimeout(timer);
      if (reducedMotion()) return toIdle();
      state = "sleeping";
      set("playing sleeping");
      after(SLEEP_MS, toIdle);
    },
  };
}
