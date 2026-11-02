// /adhdActivated, the start page: the site as a room. Its pages have routes of
// their own below it (see syncRoute). The main page's grid
// grows in as the loading screen, the screen's edge glows once, then the grid
// parts towards the edges (like the transition into the main page's contact
// section) and uncovers the skull that was hidden behind it. One button without
// text: a saw blade hits, blood flies and sticks to the walls. The words and the
// room's edges are drawn in the background color on top of that paint, so they
// only exist where blood is behind them. Clicking one sends another blade: this
// time the blood is the background color and hits the screen itself, like a pane
// of glass, and the page is already written on it: each blot paints its piece.
//
// After PRESS everything is optional: the words open a page with one click, or
// the guided tour (two arrows) clicks through the story, and only it reaches the
// end. About: text plus the hammer on the keyboard (tool-scene.ts). Projects: a
// tl;dr per project while its model kicks the last one out of the frame
// (project-frame.ts), more behind a button. Contact: a piñata (pinata.ts).
//
// The skull, blade and flying blood are the contact section's scene; only the
// paint on the walls is new.
import gsap from "gsap";
import { createSkullScene } from "../contact/skull/skull-scene";
import { ABOUT } from "../about/about-content";
import { initEngineering, hasEngineering, engHref } from "../engineering";
import { projectCards } from "../projects/projects-data";
import { LANG, pick, setLang, type Lang } from "../i18n";
import { revokeConsent, type ConsentId } from "../consent";
import { DATENSCHUTZ, IMPRESSUM } from "../legal/legal-content";
import { renderConsents } from "../legal/legal-overlay";
import { UI } from "../i18n/ui";
import { createPinata } from "./pinata";
import { createProjectFrame } from "./project-frame";
import { createToolScene } from "./tool-scene";
import Lenis from "lenis";
import { PALETTE, switchTheme } from "./ai-theme";
import { createPageScrollbar } from "./page-scrollbar";
import "./aggressive-intro.css";

const TALL = () => innerWidth / innerHeight < 0.8;
const INK = PALETTE.inkCss;
const LOAD_MIN = 1.6; // s the grid takes to grow in even when everything is cached
const PART = 1.1; // s the grid takes to leave
const HIT_DELAY = 0.5; // s from the press to the blade striking (HIT_AT in skull-scene.ts)
const BLADE_DELAY = 0.55; // s the same for a further blade (BLADE_FLIGHT there)
const GLASS_CELL = 70; // px: one big blot per cell, so the pane ends up fully covered
const WORDS_AFTER = 0.9; // s from the blade striking to the words showing
const DROPS_PER_PIXEL = 1500 / (1280 * 800); // on the walls at large
const PIXELS_PER_WORD_DROP = 75; // aimed at each word, so all of them become readable

// The back wall in percent of the screen; lines run from its corners to the screen's.
const BACK_WALL = { wide: [26, 20, 74, 72], tall: [12, 30, 88, 66] };

document.documentElement.dataset.theme = "light";
document.body.classList.add("ai");
document.body.innerHTML = `
  <div class="ai-stage">
    <svg class="ai-room-under" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
    <canvas class="ai-paint" aria-hidden="true"></canvas>
    <svg class="ai-room" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
    <nav class="ai-words">
      <a class="ai-word ai-word--left" href="/adhdActivated/about" data-page="about" tabindex="-1">${UI.navAbout}</a>
      <a class="ai-word ai-word--right" href="/adhdActivated/projects" data-page="projects" tabindex="-1">${UI.navProjects}</a>
      <a class="ai-word ai-word--floor" href="/adhdActivated/contact" data-page="contact" tabindex="-1">${UI.navContact}</a>
    </nav>
    <canvas class="ai-skull" aria-hidden="true"></canvas>
    <button class="ai-button" type="button" hidden>PRESS</button>
    <div class="ai-grid" aria-hidden="true"></div>
    <div class="ai-glow" aria-hidden="true"></div>
    <canvas class="ai-glass" aria-hidden="true" hidden></canvas>
    <canvas class="ai-freeze" aria-hidden="true" hidden></canvas>
    <article class="ai-page" hidden></article>
    <article class="ai-more" hidden></article>
    <div class="ai-tour" hidden>
      <button class="ai-button ai-tour-start" type="button">GUIDED TOUR</button>
      <button class="ai-button ai-tour-arrow ai-tour-prev" type="button" aria-label="${UI.projectBack}" hidden>←</button>
      <button class="ai-button ai-tour-arrow ai-tour-next" type="button" aria-label="${UI.projectOpen}" hidden>→</button>
      <button class="ai-button ai-tour-arrow ai-tour-end" type="button" hidden>END IT</button>
    </div>
    <canvas class="ai-spray" aria-hidden="true" hidden></canvas>
    <nav class="ai-bar ai-bar--top" hidden>
      <button type="button" data-nav="home">[home]</button>
      <span class="ai-bar-mid">
      <button type="button" data-nav="about"><span class="ai-long">[abt.me]</span><span class="ai-short">[abt]</span></button>
      <button type="button" data-nav="projects"><span class="ai-long">[projects]</span><span class="ai-short">[stuff]</span></button>
      <button type="button" data-nav="contact"><span class="ai-long">[contact]</span><span class="ai-short">[mail]</span></button>
      </span>
      <span class="ai-bar-end">
        <button type="button" data-lang="de"${LANG === "de" ? ' class="is-on"' : ""}>[de]</button>
        <button type="button" data-lang="en"${LANG === "en" ? ' class="is-on"' : ""}>[en]</button>
        <button type="button" data-switch-theme>[theme]</button>
      </span>
    </nav>
    <div class="ai-mark" hidden><span>©</span> Saos</div>
    <footer class="ai-bar ai-bar--bottom" hidden>
      <span class="ai-bar-copy">© copyright saos / kevinschaberl</span>
      <a href="/links">[more stuff]</a>
      <span class="ai-bar-end">
        <a href="/adhdActivated/privacy" data-legal="privacy">[${UI.datenschutz.toLowerCase()}]</a>
        <a href="/adhdActivated/imprint" data-legal="imprint">[${UI.impressum.toLowerCase()}]</a>
      </span>
    </footer>
    <div class="ai-scrollbar" aria-hidden="true" hidden><div class="ai-scrollbar-dot"></div></div>
  </div>`;

const q = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const BASE = "/adhdActivated";
let syncing = false, roomReady = false, moreOpenAt: string | null = null;
function setUrl(path: string) {
  if (!syncing && location.pathname !== path) history.pushState({ inner: true }, "", path);
}
const stage = q<HTMLElement>(".ai-stage");
const skullCanvas = q<HTMLCanvasElement>(".ai-skull");
const paintCanvas = q<HTMLCanvasElement>(".ai-paint");
const grid = q<HTMLElement>(".ai-grid");
const glow = q<HTMLElement>(".ai-glow");
const button = q<HTMLButtonElement>(".ai-button");
const words = [...document.querySelectorAll<HTMLAnchorElement>(".ai-word")];

// ── the room's edges ──
const [l, t, r, b] = TALL() ? BACK_WALL.tall : BACK_WALL.wide;
const edges = `M${l} ${t}H${r}V${b}H${l}Z M0 0L${l} ${t} M100 0L${r} ${t} M100 100L${r} ${b} M0 100L${l} ${b}`;
const line = (d: string, cls: string) => `<path class="${cls}" d="${d}" vector-effect="non-scaling-stroke"/>`;
// Phones: blood alone doesn't show a room on so little wall, so the walls carry
// the grid in perspective, drawn twice: white under the paint, background color
// over it, so it reads on both. It comes with the hit; the start stays blank.
let wallGrid = "";
if (TALL()) {
  const mix = (a: number, c: number, k: number) => a + (c - a) * k;
  for (const k of [0.42, 0.68, 0.84, 0.94]) {
    const x0 = mix(0, l, k), x1 = mix(100, r, k), y0 = mix(0, t, k), y1 = mix(100, b, k);
    wallGrid += `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
  }
  for (const k of [0.25, 0.5, 0.75]) {
    const x = mix(l, r, k), y = mix(t, b, k);
    wallGrid += `M${x} ${t}L${k * 100} 0M${x} ${b}L${k * 100} 100M${l} ${y}L0 ${k * 100}M${r} ${y}L100 ${k * 100}`;
  }
  q<SVGElement>(".ai-room-under").innerHTML = line(wallGrid, "ai-wall-grid") + line(edges, "ai-wall-edge");
}
q<SVGElement>(".ai-room").innerHTML = (wallGrid ? line(wallGrid, "ai-wall-grid") : "") + line(edges, "ai-wall-edge");

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
    close: "Schließen", why: "Warum", learned: "Gelernt", decisions: "Entscheidungen", challenge: "Die Herausforderung", graph: "Graph und Code ansehen",
    endTitle: "Früher Böden.",
    endLine: "Heute Software. Das Werkzeug hab ich behalten.",
    endMail: "Schreib mir",
    endBack: "Zur ganzen Seite",
  },
  en: {
    close: "Close", why: "Why", learned: "Learned", decisions: "Decisions", challenge: "The challenge", graph: "See graph and code",
    endTitle: "Floors back then.",
    endLine: "Software today. I kept the tools.",
    endMail: "Write to me",
    endBack: "To the whole site",
  },
  ru: {
    close: "Закрыть", why: "Зачем", learned: "Чему научился", decisions: "Решения", challenge: "Главная сложность", graph: "Граф и код",
    endTitle: "Раньше полы.",
    endLine: "Сегодня софт. Инструменты я оставил.",
    endMail: "Напиши мне",
    endBack: "На весь сайт",
  },
  ja: {
    close: "閉じる", why: "なぜ", learned: "学んだこと", decisions: "判断", challenge: "課題", graph: "グラフとコードを見る",
    endTitle: "昔は床。",
    endLine: "今はソフトウェア。道具は持ったままです。",
    endMail: "メールする",
    endBack: "サイト全体へ",
  },
});

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// The main page's about, slimmed down; its highlights are blue here (CSS).
const PAGES: Record<string, () => string> = {
  about: () => `
    <h1>${UI.navAbout}</h1>
    <p class="ai-page-lead">${ABOUT.role}</p>
    <p class="ai-page-facts">${ABOUT.facts.join(" · ")}</p>
    <p>${ABOUT.story[0]}</p>
    <p>${ABOUT.story[1]}</p>
    <blockquote>${ABOUT.principles[0]}</blockquote>
    <p>${ABOUT.work[3]}</p>
    <p>${ABOUT.work[6]}</p>
    <h2>${ABOUT.cv[0].heading}</h2>
    <ul>${ABOUT.cv[0].items.map((item) => `<li>${item}</li>`).join("")}</ul>
    <p>${ABOUT.end}</p>`,
  projects: () => `
    <h1>${UI.navProjects}</h1>
    ${projectCards.map((c) => `
      <section class="ai-proj" data-project="${c.id}">
        <h2>${esc(c.title)}</h2>
        <p class="ai-page-facts">${esc(c.kind)}</p>
        <ul class="ai-proj-points">${(c.points ?? [c.claim]).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="ai-proj-more" type="button" data-more="${c.id}">Wanna know more?</button>
      </section>`).join("")}`,
  contact: () => `
    <h1>${UI.navContact}</h1>
    <p class="ai-page-lead">${ABOUT.facts[1]}</p>
    <p class="ai-page-facts">${ABOUT.facts[0]}</p>
    <p>kevin.schaberl.work@gmail.com</p>`,
  end: () => `
    <h1>${STORY.endTitle}</h1>
    <p class="ai-page-lead">${STORY.endLine}</p>
    <ul>
      <li><a href="mailto:kevin.schaberl.work@gmail.com">${STORY.endMail}</a></li>
      <li><a href="/lessAdhd">${STORY.endBack}</a></li>
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
    if (node.parentElement!.closest(".ai-drop")) continue; // they come with the scene
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

// A project's overlay page: everything the card knows.
function moreHtml(id: string) {
  const c = projectCards.find((x) => x.id === id)!;
  const block = (title: string, body?: string) => (body ? `<h2>${title}</h2><p>${esc(body)}</p>` : "");
  return `
    <button class="ai-more-close" type="button" aria-label="${STORY.close}">✕</button>
    <h1>${esc(c.title)}</h1>
    <p class="ai-page-lead">${esc(c.claim)}</p>
    ${c.tags?.length ? `<p class="ai-page-facts">${c.tags.map(esc).join(" · ")}</p>` : ""}
    <p class="ai-more-links">
      ${c.graph && hasEngineering(c.graph) ? `<a class="ai-proj-more" href="${engHref(c.graph)}">${STORY.graph}</a>` : ""}
      ${(c.links ?? []).filter((l) => l.href).map((l) => `<a class="ai-proj-more" href="${esc(l.href!)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join("")}
    </p>
    ${block(STORY.why, c.what)}
    ${block(STORY.learned, c.learnGoal)}
    ${c.decisions?.length ? `<h2>${STORY.decisions}</h2><ul>${c.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
    ${block(STORY.challenge, c.challenge)}
    ${c.screenshots?.length ? `<div class="ai-more-shots">${c.screenshots.map((x) => `<img src="${esc(x.src)}" alt="${esc(x.alt)}" loading="lazy" decoding="async" />`).join("")}</div>` : ""}`;
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
let pageScene: { paint(ctx: CanvasRenderingContext2D): void; stop(): void } | null = null;
let woundAt: [number, number] = [w / 2, h / 2];
let currentPage: string | null = null;
const freeze = q<HTMLCanvasElement>(".ai-freeze");
const more = q<HTMLElement>(".ai-more");
type Scene = Awaited<ReturnType<typeof createSkullScene>>;
let skull: Scene;

// Mouse wheel on the pages as smooth as on the main page. The page's Lenis takes
// the wheel anywhere on the stage (over the frame, arrows and bars as well);
// touch stays native.
const smooth = (wrapper: HTMLElement, eventsTarget: HTMLElement) => {
  const lenis = new Lenis({ wrapper, content: wrapper, eventsTarget, autoRaf: true });
  lenis.stop();
  return lenis;
};
const pageScroll = smooth(page, stage);
const moreScroll = smooth(more, more);

// On a phone there's no hover: the bars are simply there, go away scrolling down
// and come back scrolling up (the CSS only acts on this without a hover).
let barsY = 0;
function barsFollow(el: HTMLElement) {
  const y = el.scrollTop, dy = y - barsY;
  if (Math.abs(dy) < 6 && y > 40) return;
  stage.classList.toggle("ai-bars-away", dy > 0 && y > 40);
  barsY = y;
}
const barsBack = () => {
  barsY = 0;
  stage.classList.remove("ai-bars-away");
};
page.addEventListener("scroll", () => barsFollow(page), { passive: true });

// The next project takes over the moment its title comes up from below: the old
// model gets kicked out then and the new one stands in the frame by the time its
// text has reached the frame's height. Same line scrolling back.
let frame: ReturnType<typeof createProjectFrame> | null = null;
function activeProject() {
  let best = "";
  for (const el of page.querySelectorAll<HTMLElement>(".ai-proj")) {
    if (!best || el.querySelector("h2")!.getBoundingClientRect().top < h * 0.95) best = el.dataset.project!;
  }
  return best;
}
page.addEventListener("scroll", () => { if (frame) frame.show(activeProject()); }, { passive: true });

function mountScene(name: string) {
  if (name === "about") {
    pageScene = createToolScene(page.querySelector<HTMLCanvasElement>(".ai-page-tool")!);
  } else if (name === "projects") {
    frame = createProjectFrame(page.querySelector<HTMLCanvasElement>(".ai-page-tool")!);
    frame.show(activeProject());
    pageScene = frame;
  } else if (name === "contact") {
    pageScene = createPinata(page.querySelector<HTMLCanvasElement>(".ai-page-tool")!, [...page.querySelectorAll<HTMLElement>(".ai-drop")]);
  }
}
function dropScene() {
  pageScene?.stop();
  pageScene = null;
  frame = null;
}

async function openPage(name: string, saw = false) {
  if (throwing || name === currentPage) return;
  throwing = true;
  // Blood in the background color: the scene rereads its colors when the theme attribute is set.
  document.documentElement.style.setProperty("--color-throw", getComputedStyle(document.documentElement).getPropertyValue("--ai-bg").trim());
  document.documentElement.dataset.theme = "light";

  // From another page: that one stays up as a picture until the blots cover it.
  stopGlass();
  const wasOpen = Boolean(currentPage);
  if (currentPage) {
    const still = context(freeze);
    still.drawImage(pageImage(page), 0, 0, w, h);
    pageScene?.paint(still);
    freeze.hidden = false;
    dropScene();
    page.classList.remove("is-open");
  }
  currentPage = name;
  setUrl(`${BASE}/${name}`);
  const hasScene = name !== "end";
  const drops = name === "contact" ? [
    ["https://github.com/saos-ebb", "GitHub"],
    ["mailto:kevin.schaberl.work@gmail.com", UI.email],
    ["tel:+436764718807", UI.phone],
  ] : [];
  // In the order the piñata drops them: phone, cat, letter.
  const dropLinks = name === "contact" ? [drops[2], drops[0], drops[1]].map(([href, label]) => `<a class="ai-drop" href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`).join("") : "";
  page.className = `ai-page ai-page--${name}`;
  page.innerHTML = `${PAGES[name]()}${hasScene ? `<canvas class="ai-page-tool" aria-hidden="true"></canvas>` : ""}${dropLinks}`;
  page.hidden = false; // laid out but invisible (.ai-page) until the pane is covered
  pageScroll.stop();
  pageScroll.resize();
  pageScroll.scrollTo(0, { immediate: true, force: true });
  barsBack();
  seenPages.add(name);
  updateTour();
  await document.fonts.ready;
  const image = pageImage(page);
  glass.hidden = false;
  const ctx = context(glass);
  const pattern = ctx.createPattern(image, "no-repeat")!;
  pattern.setTransform(new DOMMatrix().scale(1 / dpr));
  ctx.fillStyle = pattern;
  ctx.strokeStyle = pattern;

  // A blade only when it can be seen going in: from the room, not from a page
  // under the pane. The tour never spends one, they're for the end.
  const seen = saw && !wasOpen;
  if (seen) await skull.moreHit();
  window.setTimeout(() => {
    if (seen) {
      const [x, y] = skull.wound();
      woundAt = [((x + 1) / 2) * w, ((1 - y) / 2) * h];
    }
    stopGlass = runDrops(ctx, glassDrops(...woundAt), () => {
      page.classList.add("is-open"); // the same picture, now real text and links
      pageScroll.resize();
      if (more.hidden) pageScroll.start();
      freeze.hidden = true;
      glass.hidden = true;
      throwing = false;
      mountScene(name);
      updateTour();
    });
  }, seen ? BLADE_DELAY * 1000 : 0);
}

// The way back: the page as it stands goes onto the pane, the real one away,
// and the same blots now tear holes into the pane until the room shows again.
function closePage(then?: () => void) {
  if (throwing || !currentPage) return;
  throwing = true;
  stopGlass();
  const image = pageImage(page);
  glass.hidden = false;
  const ctx = context(glass);
  ctx.drawImage(image, 0, 0, w, h);
  pageScene?.paint(ctx);
  dropScene();
  pageScroll.stop();
  barsBack();
  page.hidden = true;
  page.classList.remove("is-open");
  currentPage = null;
  setUrl(BASE);
  tourAt = -1;
  updateTour();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";
  stopGlass = runDrops(ctx, glassDrops(...woundAt), () => {
    glass.hidden = true;
    throwing = false;
    then?.();
  });
}

page.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  const id = t.closest<HTMLElement>("[data-more]")?.dataset.more;
  if (id) {
    openProject(id);
  }
});
const openProject = (id: string) => openMore(moreHtml(id), `${BASE}/projects/${id}`);
function openMore(html: string, path: string) {
  moreOpenAt = path;
  setUrl(path);
  more.innerHTML = html;
  more.hidden = false;
  pageScroll.stop();
  moreScroll.resize();
  moreScroll.scrollTo(0, { immediate: true, force: true });
  moreScroll.start();
  more.querySelector<HTMLElement>(".ai-more-close")!.focus();
  scrollbar.render();
}
// Imprint and privacy: the main page's texts in this page's own overlay.
function openLegal(name: string) {
  const legal = name === "imprint" ? IMPRESSUM : DATENSCHUTZ;
  openMore(`
    <button class="ai-more-close" type="button" aria-label="${STORY.close}">✕</button>
    ${UI.legalNote ? `<p class="ai-page-facts" lang="${LANG}">${UI.legalNote}</p>` : ""}
    <div class="ai-legal">${legal.html}</div>`, `${BASE}/${name}`);
  const slot = more.querySelector<HTMLElement>(".legal-consents");
  if (slot) renderConsents(slot);
}
q<HTMLElement>(".ai-bar--bottom").addEventListener("click", (e) => {
  const link = (e.target as HTMLElement).closest<HTMLElement>("[data-legal]");
  if (!link) return;
  e.preventDefault();
  openLegal(link.dataset.legal!);
});
// Back where it was opened from, if that's in this visit's history.
const leaveMore = () => {
  if (history.state?.inner) history.back();
  else closeMore();
};
const closeMore = (url = true) => {
  more.hidden = true;
  moreOpenAt = null;
  if (url) setUrl(currentPage ? `${BASE}/${currentPage}` : BASE);
  moreScroll.stop();
  if (currentPage) pageScroll.start();
  scrollbar.render();
};
const scrollbar = createPageScrollbar(q<HTMLElement>(".ai-scrollbar"), () =>
  !more.hidden ? more : page.classList.contains("is-open") ? page : null);
page.addEventListener("scroll", () => scrollbar.render(), { passive: true });
more.addEventListener("scroll", () => scrollbar.render(), { passive: true });
more.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  if (t.closest(".ai-more-close")) leaveMore();
  const revoke = t.closest<HTMLElement>("[data-revoke]")?.dataset.revoke as ConsentId | undefined;
  if (revoke) {
    revokeConsent(revoke);
    renderConsents(t.closest<HTMLElement>(".legal-consents")!); // nothing that needs one runs on this page
  }
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !more.hidden && !location.hash.startsWith("#eng/")) leaveMore();
});
// The graph and code overlay is the main page's, on its own hash route; it only
// wants something that scrolls to stop, and nothing scrolls behind it here.
initEngineering({ isStopped: true, stop() {}, start() {} } as unknown as Parameters<typeof initEngineering>[0]);

// ── the guided tour ──
// The big three get a step each, so the rest stays a scroll away and not a
// dozen clicks. Without the tour the same arrows lead on from page to page once
// it's read to its end, and having seen them all brings END IT too.
const big = projectCards.filter((c) => c.graph).map((c) => c.id);
const TOUR: { page: string; project?: string }[] = [
  { page: "about" },
  ...big.map((project) => ({ page: "projects", project })),
  { page: "contact" },
  { page: "end" },
];
const tour = q<HTMLElement>(".ai-tour");
const tourStart = q<HTMLButtonElement>(".ai-tour-start");
const tourPrev = q<HTMLButtonElement>(".ai-tour-prev");
const tourNext = q<HTMLButtonElement>(".ai-tour-next");
const tourEnd = q<HTMLButtonElement>(".ai-tour-end");
let tourAt = -1, touring = false;
const FREE_ORDER = ["about", "projects", "contact"];
const seenPages = new Set<string>();
const atPageEnd = () => page.scrollTop + page.clientHeight >= page.scrollHeight - 40;

function updateTour() {
  scrollbar.render();
  const onPage = Boolean(currentPage);
  const allSeen = FREE_ORDER.every((p) => seenPages.has(p));
  tour.classList.toggle("is-split", touring || onPage);
  tourStart.hidden = touring || onPage;
  tourPrev.hidden = touring ? tourAt < 0 : !onPage;
  tourNext.hidden = touring ? tourAt >= TOUR.length - 1 : !onPage || allSeen || !atPageEnd();
  tourEnd.hidden = touring ? tourAt !== TOUR.length - 1 : !allSeen || (onPage && !atPageEnd());
}
page.addEventListener("scroll", updateTour, { passive: true });
window.addEventListener("resize", updateTour);
function goTour(i: number) {
  if (throwing) return;
  tourAt = i;
  updateTour();
  if (i < 0) return closePage();
  const step = TOUR[i];
  if (step.page !== currentPage) void openPage(step.page).then(() => step.project && scrollToProject(step.project));
  else if (step.project) scrollToProject(step.project);
}
function scrollToProject(id: string) {
  const el = page.querySelector<HTMLElement>(`.ai-proj[data-project="${id}"]`);
  if (el) {
    const r = el.getBoundingClientRect();
    pageScroll.scrollTo(page.scrollTop + r.top - (h - r.height) / 2, { duration: 1.1, force: true });
  }
}
function goToPage(name: string) {
  touring = false; // picked by hand: the tour is over
  tourAt = TOUR.findIndex((step) => step.page === name);
  updateTour();
  void openPage(name, true);
}
// The header: after the end nothing's left to go back to but the start.
q<HTMLElement>(".ai-bar--top").addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  const lang = t.closest<HTMLElement>("[data-lang]")?.dataset.lang;
  if (lang) return setLang(lang as Lang);
  if (t.closest("[data-switch-theme]")) return switchTheme();
  const name = t.closest<HTMLElement>("[data-nav]")?.dataset.nav;
  if (!name) return;
  if (ended) return location.reload();
  if (!more.hidden) closeMore(false);
  if (name === "home") {
    closePage();
    setUrl(BASE);
  }
  else goToPage(name);
});
tourStart.addEventListener("click", () => {
  touring = true;
  updateTour();
  tourNext.focus();
  goTour(0);
});
tourNext.addEventListener("click", () => {
  if (touring) return goTour(tourAt + 1);
  const at = FREE_ORDER.indexOf(currentPage!);
  const next = currentPage === "projects" ? "contact" : [1, 2].map((n) => FREE_ORDER[(at + n) % 3]).find((p) => !seenPages.has(p));
  if (next) void openPage(next);
});
tourPrev.addEventListener("click", () => {
  if (touring) goTour(tourAt - 1);
  else closePage();
});
// The end: only the clean skull on the bare background, all fifteen blades go
// in one after another, the blood stays in the air, and it all turns like a ball.
const FROZEN_AT = 0.42; // early, while the blood is still close to its wound
const sprayCanvas = q<HTMLCanvasElement>(".ai-spray");
let ended = false;
// What reaches the visitor: each blow leaves a fine mist on the pane in front of
// them, thickest towards the wound, and it stays there when the skull is turned.
function sprayScreen(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const reach = Math.min(w, h) * 0.42;
  let frames = 9;
  // the fog itself, then the fine drops in it
  const fog = ctx.createRadialGradient(x, y, 0, x, y, reach * 1.5);
  fog.addColorStop(0, `rgba(${PALETTE.inkRgb}, 0.05)`);
  fog.addColorStop(1, `rgba(${PALETTE.inkRgb}, 0)`);
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, w, h);
  const burst = () => {
    ctx.fillStyle = INK;
    for (let i = 0; i < 420; i++) {
      const haze = Math.random() < 0.15;
      const a = Math.random() * Math.PI * 2, r = (Math.random() + Math.random() + Math.random() - 1.5) * reach * 1.4;
      const px = haze ? Math.random() * w : x + Math.cos(a) * r, py = haze ? Math.random() * h : y + Math.sin(a) * r;
      const size = Math.random() < 0.01 ? 1.4 + Math.random() : 0.35 + Math.random() * 0.6;
      ctx.globalAlpha = 0.15 + Math.random() * 0.55;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (--frames > 0) requestAnimationFrame(burst);
  };
  burst();
}
tourEnd.addEventListener("click", () => {
  if (throwing) return;
  touring = false;
  tour.hidden = true;
  // Only the skull on the bare background again, like at the start.
  for (const sel of [".ai-paint", ".ai-room", ".ai-room-under", ".ai-words"]) q<HTMLElement>(sel).style.display = "none";
  const finale = () => {
    ended = true;
    const spray = context(sprayCanvas);
    sprayCanvas.hidden = false;
    document.documentElement.style.setProperty("--color-throw", INK);
    document.documentElement.dataset.theme = "light";
    skull.clean();
    const next = () => {
      if (skull.hitsLeft() < 0) return;
      void skull.moreHit(FROZEN_AT).then(() => {
        const [x, y] = skull.wound();
        window.setTimeout(() => sprayScreen(spray, ((x + 1) / 2) * w, ((1 - y) / 2) * h), BLADE_DELAY * 1000);
        window.setTimeout(next, 260);
      });
    };
    next();
  };
  if (currentPage) closePage(finale);
  else finale();
});

// ── the routes ──
// The address follows whatever opens (setUrl in openPage, closePage, openMore),
// and going back and forth, or arriving by a deep link, opens what it names.
function targetOf(path: string) {
  const [first, second] = path.slice(BASE.length).split("/").filter(Boolean);
  if (first === "privacy" || first === "imprint") return { legal: first };
  if (first === "projects" && projectCards.some((c) => c.id === second)) return { page: first, project: second };
  if (first && first in PAGES) return { page: first };
  return {};
}
type Target = { page?: string; project?: string; legal?: string };
function syncRoute() {
  if (ended) return location.reload(); // nothing to go back to from the end but a new start
  if (throwing) { window.setTimeout(syncRoute, 150); return; }
  const to: Target = targetOf(location.pathname);
  syncing = true;
  if (moreOpenAt !== location.pathname) {
    if (!more.hidden) closeMore(false);
    if (to.legal) openLegal(to.legal);
  }
  if (!to.legal && to.page !== (currentPage ?? undefined)) {
    if (touring) tourAt = TOUR.findIndex((step) => step.page === to.page);
    if (to.page) void openPage(to.page).then(() => showProject(to));
    else closePage();
  } else showProject(to);
  syncing = false;
}
function showProject(to: Target) {
  if (!to.project) return;
  scrollToProject(to.project);
  if (moreOpenAt !== location.pathname) openProject(to.project);
}
window.addEventListener("popstate", () => { if (roomReady) syncRoute(); });

// ── the sequence ──
async function run() {
  growGrid(0);
  let loaded = false;
  const loading = createSkullScene(stage, skullCanvas, [], () => {}, { stopAt: 2.6, crown: 15 }).then((scene) => {
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
  skull = scene;
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
    q<SVGElement>(".ai-room-under").classList.add("is-on");
    scene.setRise(1);
    window.setTimeout(() => {
      const [x, y] = scene.wound();
      runDrops(paint, makeDrops(((x + 1) / 2) * w, ((1 - y) / 2) * h), openWords);
      // Once the blood aimed at them has mostly landed.
      window.setTimeout(() => {
        words.forEach((word) => word.classList.add("is-shown"));
        tour.hidden = false;
        document.querySelectorAll<HTMLElement>(".ai-bar, .ai-mark").forEach((bar) => { bar.hidden = false; });
        roomReady = true;
        if (location.pathname !== BASE) syncRoute(); // arrived by a deep link
      }, WORDS_AFTER * 1000);
    }, HIT_DELAY * 1000);
  }, { once: true });

  for (const word of words) {
    word.addEventListener("click", (e) => {
      e.preventDefault();
      goToPage(word.dataset.page!);
    });
  }
  // A deep link doesn't wait to be pressed.
  if (location.pathname !== BASE) button.click();
}

void run();
