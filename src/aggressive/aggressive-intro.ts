// /agressiveIntro, public but linked nowhere: the page as a room. The main page's grid
// grows in as the loading screen, the screen's edge glows once, then the grid
// parts towards the edges (like the transition into the main page's contact
// section) and uncovers the skull that was hidden behind it. One button without
// text: a saw blade hits, blood flies and sticks to the walls. The words and the
// room's edges are drawn in the background color on top of that paint, so they
// only exist where blood is behind them. Clicking one sends another blade: this
// time the blood is the background color and hits the screen itself, like a pane
// of glass, and the page is already written on it: each blot paints its piece.
//
// The story: a tool from the old trade hits a thing from the new one, one per
// page (tool-scene.ts). Once all three are seen, the button comes back for the end.
//
// The skull, blade and flying blood are the contact section's scene; only the
// paint on the walls is new.
import gsap from "gsap";
import { createSkullScene } from "../contact/skull/skull-scene";
import { ABOUT } from "../about/about-content";
import { pick } from "../i18n";
import { UI } from "../i18n/ui";
import { createToolScene, type ToolName } from "./tool-scene";
import "./aggressive-intro.css";

const TALL = () => innerWidth / innerHeight < 0.8;
const INK = "#ffffff";
const LOAD_MIN = 1.6; // s the grid takes to grow in even when everything is cached
const PART = 1.1; // s the grid takes to leave
const HIT_DELAY = 0.5; // s from the press to the blade striking (HIT_AT in skull-scene.ts)
const BLADE_DELAY = 0.55; // s the same for a further blade (BLADE_FLIGHT there)
const GLASS_CELL = 70; // px: one big blot per cell, so the pane ends up fully covered
const DROPS_PER_PIXEL = 1500 / (1280 * 800); // on the walls at large
const PIXELS_PER_WORD_DROP = 75; // aimed at each word, so all of them become readable

// The back wall in percent of the screen; lines run from its corners to the screen's.
const BACK_WALL = { wide: [26, 20, 74, 72], tall: [12, 30, 88, 66] };

document.documentElement.dataset.theme = "light";
document.title = "aggresiveIntro";
document.body.classList.add("ai");
document.body.innerHTML = `
  <div class="ai-stage">
    <canvas class="ai-paint" aria-hidden="true"></canvas>
    <svg class="ai-room" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
    <nav class="ai-words">
      <a class="ai-word ai-word--left" href="/#about" data-page="about" tabindex="-1">${UI.navAbout}</a>
      <a class="ai-word ai-word--right" href="/#projects" data-page="projects" tabindex="-1">${UI.navProjects}</a>
      <a class="ai-word ai-word--floor" href="/#contact" data-page="contact" tabindex="-1">${UI.navContact}</a>
    </nav>
    <canvas class="ai-skull" aria-hidden="true"></canvas>
    <button class="ai-button" type="button" hidden>PRESS</button>
    <div class="ai-grid" aria-hidden="true"></div>
    <div class="ai-glow" aria-hidden="true"></div>
    <canvas class="ai-glass" aria-hidden="true" hidden></canvas>
    <article class="ai-page" hidden></article>
  </div>`;

const q = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const stage = q<HTMLElement>(".ai-stage");
const skullCanvas = q<HTMLCanvasElement>(".ai-skull");
const paintCanvas = q<HTMLCanvasElement>(".ai-paint");
const grid = q<HTMLElement>(".ai-grid");
const glow = q<HTMLElement>(".ai-glow");
const button = q<HTMLButtonElement>(".ai-button");
const words = [...document.querySelectorAll<HTMLAnchorElement>(".ai-word")];

// ── the room's edges ──
const [l, t, r, b] = TALL() ? BACK_WALL.tall : BACK_WALL.wide;
q<SVGElement>(".ai-room").innerHTML = `
  <path d="M${l} ${t}H${r}V${b}H${l}Z M0 0L${l} ${t} M100 0L${r} ${t} M100 100L${r} ${b} M0 100L${l} ${b}" vector-effect="non-scaling-stroke"/>`;

// ── the grid ──
const w = innerWidth, h = innerHeight;
const cell = matchMedia("(max-width: 900px)").matches ? 32 : 48;
type Line = { el: HTMLElement; horizontal: boolean; dir: number; rank: number };
const lines: Line[] = [];
const addLine = (horizontal: boolean, at: number, size: number) => {
  const el = document.createElement("i");
  el.className = horizontal ? "ai-line ai-line--h" : "ai-line ai-line--v";
  el.style[horizontal ? "top" : "left"] = `${at}px`;
  grid.append(el);
  lines.push({ el, horizontal, dir: at < size / 2 ? -1 : 1, rank: Math.abs(at - size / 2) / (size / 2) });
};
// A line through the middle, like the main page's grid; both axes from there.
for (let x = w / 2 % cell; x <= w; x += cell) addLine(false, x, w);
for (let y = h / 2 % cell; y <= h; y += cell) addLine(true, y, h);
// The lines either side of the middle: the opening between them shows the skull.
const inner = {
  top: Math.max(...lines.filter((n) => n.horizontal && n.dir < 0).map((n) => parseFloat(n.el.style.top))),
  bottom: Math.min(...lines.filter((n) => n.horizontal && n.dir > 0).map((n) => parseFloat(n.el.style.top))),
  left: Math.max(...lines.filter((n) => !n.horizontal && n.dir < 0).map((n) => parseFloat(n.el.style.left))),
  right: Math.min(...lines.filter((n) => !n.horizontal && n.dir > 0).map((n) => parseFloat(n.el.style.left))),
};

// Grows from the middle out, each line from its own centre.
function growGrid(p: number) {
  for (const n of lines) {
    const s = gsap.utils.clamp(0, 1, (p - n.rank * 0.6) / 0.4);
    n.el.style.transform = n.horizontal ? `scaleX(${s})` : `scaleY(${s})`;
  }
}

function partGrid(part: number) {
  const tx = (w / 2 + cell) * part, ty = (h / 2 + cell) * part;
  for (const n of lines) {
    n.el.style.transform = n.horizontal ? `translateY(${n.dir * ty}px)` : `translateX(${n.dir * tx}px)`;
  }
  const top = Math.max(inner.top - ty, 0), bottom = Math.max(h - inner.bottom - ty, 0);
  const left = Math.max(inner.left - tx, 0), right = Math.max(w - inner.right - tx, 0);
  skullCanvas.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
}

// ── the paint on the walls ──
const dpr = Math.min(devicePixelRatio, 2);
function context(canvas: HTMLCanvasElement) {
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  return ctx;
}
const paint = context(paintCanvas);
paint.fillStyle = INK;
paint.strokeStyle = INK;

type Drop = { at: number; x: number; y: number; r: number; angle: number };
type Drip = { x: number; y: number; width: number; left: number; speed: number };

const rand = (a: number, c: number) => a + Math.random() * (c - a);
// Blots scale with the screen, or a phone just turns white.
const scale = Math.min(1, Math.sqrt((w * h) / (1280 * 800)) * 1.1);
const radius = () => (Math.random() < 0.1 ? rand(14, 46) : rand(1.5, 12)) * scale;

function makeDrops(fromX: number, fromY: number): Drop[] {
  const out: Drop[] = [];
  const add = (x: number, y: number, r: number) => {
    const angle = Math.atan2(y - fromY, x - fromX);
    const dist = Math.hypot(x - fromX, y - fromY);
    out.push({ at: rand(0, 1.5) + dist / 1600, x, y, r, angle });
  };
  for (let i = 0; i < w * h * DROPS_PER_PIXEL; i++) add(rand(0, w), rand(0, h), radius());
  for (const word of words) {
    const box = word.getBoundingClientRect();
    const count = (box.width * box.height) / PIXELS_PER_WORD_DROP;
    for (let i = 0; i < count; i++) {
      add(rand(box.left - 10, box.right + 10), rand(box.top - 10, box.bottom + 10), rand(8, 30) * scale);
    }
  }
  return out.sort((a, c) => a.at - c.at);
}

// Hits the wall flying outward from the wound: stretched that way, plus spray.
function stamp(paint: CanvasRenderingContext2D, d: Drop, drips: Drip[]) {
  paint.beginPath();
  paint.ellipse(d.x, d.y, d.r * 1.35, d.r, d.angle, 0, Math.PI * 2);
  paint.fill();
  const spray = d.r > 6 ? 5 : 1;
  for (let i = 0; i < spray; i++) {
    const a = d.angle + rand(-0.5, 0.5), s = d.r * rand(1.3, 2.8);
    paint.beginPath();
    paint.arc(d.x + Math.cos(a) * s, d.y + Math.sin(a) * s, rand(0.5, d.r * 0.18 + 0.8), 0, Math.PI * 2);
    paint.fill();
  }
  if (d.r > 16 * scale && drips.length < 140) {
    drips.push({ x: d.x + rand(-d.r, d.r) * 0.6, y: d.y, width: rand(1.5, d.r * 0.22), left: rand(40, 260), speed: rand(40, 150) });
  }
}

function runDrops(paint: CanvasRenderingContext2D, drops: Drop[], onDone: () => void) {
  const drips: Drip[] = [];
  let next = 0;
  let done = false, stopped = false;
  const start = performance.now();
  let last = start;
  const tick = (now: number) => {
    if (stopped) return;
    const seconds = (now - start) / 1000, dt = (now - last) / 1000;
    last = now;
    while (next < drops.length && drops[next].at <= seconds) stamp(paint, drops[next++], drips);
    for (const d of drips) {
      if (d.left <= 0) continue;
      const step = d.speed * dt;
      paint.lineWidth = d.width;
      paint.beginPath();
      paint.moveTo(d.x, d.y);
      paint.lineTo(d.x, d.y + step);
      paint.stroke();
      d.y += step;
      d.left -= step;
    }
    if (next === drops.length && !done) { done = true; onDone(); }
    if (next < drops.length || drips.some((d) => d.left > 0)) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => { stopped = true; };
}

function openWords() {
  for (const word of words) {
    word.classList.add("is-open");
    word.tabIndex = 0;
  }
}

// ── the page on the glass ──
// The story's lines. A draft: Kevin's to rewrite in his own words.
const STORY = pick({
  de: {
    about: "Der Hammer ist vom Boden. Fast sieben Jahre Bodenleger und Sonnenschutz, dann zwei Jahre unser Haus saniert. Heute baue ich Software.",
    projects: "Die Brechstange ist von der Sanierung. Erst aufmachen, dann verstehen, dann neu bauen. So entstehen auch diese Projekte.",
    contact: "Mit dem Messer habe ich Böden zugeschnitten. Jetzt macht es deine Mail auf.",
    endTitle: "Früher Böden.",
    endLine: "Heute Software. Das Werkzeug hab ich behalten.",
    endMail: "Schreib mir",
    endBack: "Zur ganzen Seite",
    finish: "ENDE",
  },
  en: {
    about: "The hammer is from the floor. Almost seven years laying floors and fitting sun protection, then two years renovating our house. Today I build software.",
    projects: "The crowbar is from the renovation. Open it up, understand it, build it new. These projects get made the same way.",
    contact: "I used this knife to cut floors. Now it opens your mail.",
    endTitle: "Floors back then.",
    endLine: "Software today. I kept the tools.",
    endMail: "Write to me",
    endBack: "To the whole site",
    finish: "END",
  },
  ru: {
    about: "Молоток с пола. Почти семь лет полы и солнцезащита, затем два года ремонта нашего дома. Сегодня я создаю софт.",
    projects: "Лом с ремонта. Сначала вскрыть, потом понять, потом построить заново. Так появляются и эти проекты.",
    contact: "Этим ножом я резал полы. Теперь он вскрывает твоё письмо.",
    endTitle: "Раньше полы.",
    endLine: "Сегодня софт. Инструменты я оставил.",
    endMail: "Напиши мне",
    endBack: "На весь сайт",
    finish: "КОНЕЦ",
  },
  ja: {
    about: "このハンマーは床の仕事のもの。床職人と日よけの仕事を約7年、その後2年かけて家を改修しました。今はソフトウェアを作っています。",
    projects: "このバールは改修のもの。まず開けて、理解して、作り直す。これらのプロジェクトも同じように生まれます。",
    contact: "このナイフで床を切っていました。今はあなたのメールを開けます。",
    endTitle: "昔は床。",
    endLine: "今はソフトウェア。道具は持ったままです。",
    endMail: "メールする",
    endBack: "サイト全体へ",
    finish: "終わり",
  },
});

const PAGES: Record<string, () => string> = {
  about: () => `
    <h1>${UI.navAbout}</h1>
    <p class="ai-page-lead">${ABOUT.role}</p>
    <p>${STORY.about}</p>
    <h2>${ABOUT.cv[0].heading}</h2>
    <ul>${ABOUT.cv[0].items.map((item) => `<li>${item.replace(/<[^>]+>/g, "")}</li>`).join("")}</ul>`,
  projects: () => `
    <h1>${UI.navProjects}</h1>
    <p>${STORY.projects}</p>
    <ul>${["YourBrand", "TschoBBo", "kev.dev", "AniScript", "ReleaseWatcher", "Oskalizer"].map((name) => `<li>${name}</li>`).join("")}</ul>`,
  contact: () => `
    <h1>${UI.navContact}</h1>
    <p>${STORY.contact}</p>
    <ul>
      <li><a href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a></li>
      <li><a href="https://github.com/saos-ebb" target="_blank" rel="noopener noreferrer">GitHub</a></li>
    </ul>`,
  end: () => `
    <h1>${STORY.endTitle}</h1>
    <p class="ai-page-lead">${STORY.endLine}</p>
    <ul>
      <li><a href="mailto:kevin.schaberl.work@gmail.com">${STORY.endMail}</a></li>
      <li><a href="/">${STORY.endBack}</a></li>
    </ul>`,
};

// The laid-out page, word by word on a canvas: what the blots paint with.
function pageImage(page: HTMLElement) {
  const canvas = document.createElement("canvas");
  const ctx = context(canvas);
  ctx.fillStyle = getComputedStyle(page).backgroundColor;
  ctx.fillRect(0, 0, w, h);
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const style = getComputedStyle(node.parentElement!);
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    for (const word of node.data.matchAll(/\S+/g)) {
      range.setStart(node, word.index);
      range.setEnd(node, word.index + word[0].length);
      const box = range.getBoundingClientRect();
      const m = ctx.measureText(word[0]);
      const ascent = m.fontBoundingBoxAscent, descent = m.fontBoundingBoxDescent;
      ctx.fillText(word[0], box.left, box.top + (box.height - ascent - descent) / 2 + ascent);
    }
  }
  return canvas;
}

function glassDrops(fromX: number, fromY: number) {
  const out: Drop[] = [];
  const add = (x: number, y: number, r: number, from: number, to: number) => {
    const dist = Math.hypot(x - fromX, y - fromY);
    out.push({ at: rand(from, to) + dist / 2400, x, y, r, angle: Math.atan2(y - fromY, x - fromX) });
  };
  for (let i = 0; i < (w * h * DROPS_PER_PIXEL) / 3; i++) add(rand(0, w), rand(0, h), radius(), 0, 0.8);
  for (let x = GLASS_CELL / 2; x < w + GLASS_CELL; x += GLASS_CELL) {
    for (let y = GLASS_CELL / 2; y < h + GLASS_CELL; y += GLASS_CELL) {
      add(x + rand(-8, 8), y + rand(-8, 8), rand(56, 84), 0.2, 1.5);
    }
  }
  return out.sort((a, c) => a.at - c.at);
}

const glass = q<HTMLCanvasElement>(".ai-glass");
const page = q<HTMLElement>(".ai-page");
let throwing = false;
let stopGlass = () => {};
let toolScene: ReturnType<typeof createToolScene> | null = null;
let woundAt: [number, number] = [w / 2, h / 2];
const seen = new Set<string>();
const toolColors = { bg: 0x5c0f1f, ink: 0xffffff, tool: 0x89cff0 };

async function openPage(name: string, scene: Awaited<ReturnType<typeof createSkullScene>>) {
  if (throwing) return;
  throwing = true;
  // Blood in the background color: the scene rereads its colors when the theme attribute is set.
  document.documentElement.style.setProperty("--color-throw", getComputedStyle(document.documentElement).getPropertyValue("--ai-bg").trim());
  document.documentElement.dataset.theme = "light";

  const tool = name !== "end";
  page.innerHTML = `${tool ? `<button class="ai-page-back" type="button" aria-label="${UI.projectBack}">←</button>` : ""}${PAGES[name]()}${tool ? `<canvas class="ai-page-tool" aria-hidden="true"></canvas>` : ""}`;
  page.hidden = false; // laid out but invisible (.ai-page) until the pane is covered
  await document.fonts.ready;
  const image = pageImage(page);
  glass.hidden = false;
  const ctx = context(glass);
  const pattern = ctx.createPattern(image, "no-repeat")!;
  pattern.setTransform(new DOMMatrix().scale(1 / dpr));
  ctx.fillStyle = pattern;
  ctx.strokeStyle = pattern;

  // The end: everything that's left goes in at once.
  for (let n = name === "end" ? 3 : 1; n > 0; n--) await scene.moreHit();
  window.setTimeout(() => {
    const [x, y] = scene.wound();
    woundAt = [((x + 1) / 2) * w, ((1 - y) / 2) * h];
    stopGlass = runDrops(ctx, glassDrops(...woundAt), () => {
      page.classList.add("is-open"); // the same picture, now real text and links
      throwing = false;
      seen.add(name);
      if (tool) toolScene = createToolScene(page.querySelector<HTMLCanvasElement>(".ai-page-tool")!, name as ToolName, toolColors);
    });
  }, BLADE_DELAY * 1000);
}

// The way back: the page as it stands goes onto the pane, the real one away,
// and the same blots now tear holes into the pane until the room shows again.
page.addEventListener("click", (e) => {
  if (throwing || !(e.target as HTMLElement).closest(".ai-page-back")) return;
  throwing = true;
  stopGlass();
  const image = pageImage(page);
  const ctx = context(glass);
  ctx.drawImage(image, 0, 0, w, h);
  toolScene?.paint(ctx);
  toolScene?.stop();
  toolScene = null;
  page.hidden = true;
  page.classList.remove("is-open");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";
  stopGlass = runDrops(ctx, glassDrops(...woundAt), () => {
    glass.hidden = true;
    throwing = false;
    if (["about", "projects", "contact"].every((n) => seen.has(n))) showEnd?.();
  });
});
let showEnd: (() => void) | undefined;

// ── the sequence ──
async function run() {
  growGrid(0);
  let loaded = false;
  const loading = createSkullScene(stage, skullCanvas, [], () => {}, { stopAt: 2.6, crown: 13 }).then((scene) => {
    scene.setRise(0.99); // in place, but the blade only starts at 1
    loaded = true;
    return scene;
  });

  // The grid is the progress bar: creeps towards 90 % until the scene is there.
  await new Promise<void>((resolve) => {
    const start = performance.now();
    let shown = 0;
    const tick = (now: number) => {
      const seconds = (now - start) / 1000;
      const target = loaded && seconds > LOAD_MIN ? 1 : Math.min(0.9 * (1 - Math.exp(-seconds / 0.9)), seconds / LOAD_MIN);
      shown += (target - shown) * 0.12;
      growGrid(shown);
      if (shown > 0.995) { growGrid(1); resolve(); }
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const scene = await loading;
  partGrid(0);
  await gsap.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1, repeatDelay: 0.12 });

  skullCanvas.style.opacity = "1";
  const state = { part: 0 };
  await gsap.to(state, { part: 1, duration: PART, ease: "power2.inOut", onUpdate: () => partGrid(state.part) });
  grid.remove();
  glow.remove();
  skullCanvas.style.clipPath = "";
  button.hidden = false;

  button.addEventListener("click", () => {
    button.remove();
    scene.setRise(1);
    window.setTimeout(() => {
      const [x, y] = scene.wound();
      runDrops(paint, makeDrops(((x + 1) / 2) * w, ((1 - y) / 2) * h), openWords);
    }, HIT_DELAY * 1000);
  }, { once: true });

  // All three seen: the button comes back, and the last press ends the story.
  showEnd = () => {
    showEnd = undefined;
    const end = document.createElement("button");
    end.className = "ai-button ai-button--end";
    end.type = "button";
    end.textContent = STORY.finish;
    stage.append(end);
    end.addEventListener("click", () => {
      end.remove();
      void openPage("end", scene);
    }, { once: true });
  };

  for (const word of words) {
    word.addEventListener("click", (e) => {
      e.preventDefault();
      void openPage(word.dataset.page!, scene);
    });
  }
}

void run();
