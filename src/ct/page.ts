// The CT-Schädel page (/saos#dev#skull, loaded by src/saos-entry.ts): its
// own page after the "kev.dev – Konzepte" canvas (boards CT-Desktop /
// CT-Mobile), not the main page. One point skull (ct-scene.ts) stays fixed
// at the top right; the scroll position drives it:
//  - hero: it turns to the side, a cut opens it, the brain appears
//  - each finding: its brain region lights up, a pointer runs to the text
//    (phones: a ring on the region instead)
//  - atlas: the eight small projects' regions in colour, one line each
//  - anamnesis: back to the front, fading out
//  - contact: its own scene (saw-scene.ts) — skull rises, three saw blades,
//    the shards that hang in the air are the links.
// German only, like the mockup.
import "@fontsource-variable/jetbrains-mono";
import "../lab/throws.css";
import "./page.css";
import gsap from "gsap";
import Lenis from "lenis";
import { startThrowLayer } from "../lab/throw-layer";
import { pauseThrows } from "../lab/throws";
import type { Part } from "./brain-build";
import type { CtScene, Pose } from "./ct-scene";

document.documentElement.lang = "de";
document.title = "Kevin Schaberl — Kopf-CT";

const PHONE = matchMedia("(max-width: 900px)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HOT = "#ffe08a";

type Finding = {
  id: string; no: string; region: string; sub: string; title: string; lead: string;
  stats: [string, string][]; points: string[]; href: string; parts: Part[]; brain?: number;
};

const FINDINGS: Finding[] = [
  {
    id: "yourbrand", no: "01", region: "Präfrontaler Cortex", sub: "Planung · Entscheidungen · Architektur", title: "YourBrand",
    lead: "Modulares White-Label-SaaS für Matching und Community — vom Schachklub bis zur Partnerbörse.",
    stats: [["1.200", "req/s"], ["5", "Mandanten"], ["19", "Farb-Tokens"]],
    points: [
      "Eigene Datenbank, Bucket und Redis-Prefix pro Mandant",
      "Eine tenant.json: Marke, Theme, Sprachen, Tier, Module",
      "Mandanten-Console mit Diff und WCAG-Kontrastprüfung",
      "Audit: 34 MB → 8 ms · JWT-Prüfung ≈ 30 % CPU behoben",
    ],
    href: "/#eng/yourbrand", parts: ["frontal"],
  },
  {
    id: "tschobbo", no: "02", region: "Broca- & Wernicke-Areal", sub: "Sprache sprechen · Sprache verstehen", title: "TschoBBo",
    lead: "Lokale Sprachmodelle statt Cloud — und abgeschickt wird immer von mir.",
    stats: [["590", "Tests"], ["≈ 4×", "schneller"], ["bis 92 %", "JEV"]],
    points: ["scrape · scrapers/*.ts", "filter · lib/filter-runner.ts", "anschreiben · lib/anschreiben.ts", "review · ui/", "gmail · mail/gmail.ts"],
    href: "/#eng/tschobbo", parts: ["broca", "wernicke"],
  },
  {
    id: "horror", no: "03", region: "Amygdala", sub: "Angst · Schreck · Flucht", title: "Hinter dir",
    lead: "Ego-Horror im Browser · three.js. Fünf Akte, ein Spiegel.",
    stats: [["3", "Hallen"], ["20×", "Boss-Leben"], ["1", "Spiegel"]],
    points: ["Akt I · Der Gang", "Akt II · Die Tür", "Akt III · Halle 1", "Akt IV · Halle 2 & 3", "Akt V · Der Spiegel"],
    href: "/saos#dev#horror", parts: ["amygdala"], brain: 0.4,
  },
  {
    id: "renderer", no: "04", region: "Visueller Cortex", sub: "Sehen · Formen · Tiefe", title: "3D-Renderer",
    lead: "Wireframe ohne Bibliothek — alle Modelle dieser Seite kommen aus ihm.",
    stats: [["21", "Modelle"], ["0", "Libraries"], ["3", "Konverter"]],
    points: [".obj → obj2model.js", ".stl → stl2model.js", ".dcm (CT) → dcm2stl.py → stl2model.js"],
    href: "/#projects", parts: ["occipital"],
  },
];

// Ordered by where their regions sit on screen, top to bottom, so no two
// pointer lines cross.
const ATLAS: { part: Part; label: string; name: string; sub: string; color: string }[] = [
  { part: "motor", label: "Motorcortex", name: "Oskalizer", sub: "Tastatur-Spielplatz", color: "#57ff8f" },
  { part: "parietal", label: "Parietallappen", name: "kev.dev", sub: "Aufzug, Stoff, Würfe", color: "#57b9ff" },
  { part: "thalamus", label: "Thalamus", name: "ReleaseWatcher", sub: "CLI + Web-UI", color: "#ffffff" },
  { part: "accumbens", label: "Belohnungssystem", name: "Shop", sub: "Shop-Modul für YourBrand", color: "#ffd400" },
  { part: "temporal", label: "Schläfenlappen", name: "AniScript", sub: "Userscript", color: "#ff5fc8" },
  { part: "hippocampus", label: "Hippocampus", name: "Grundlagen", sub: "Bootcamp · Java", color: "#7fe6ff" },
  { part: "cerebellum", label: "Kleinhirn", name: "Loadtest", sub: "C++17-Lastgenerator ohne Libraries", color: "#ffd400" },
  { part: "fusiform", label: "Gyrus fusiformis", name: "FaceDots", sub: "Foto zu Punkten", color: "#ff8a3d" },
];

const ICON = {
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.78 5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  mail: '<path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
};
const icon = (d: string) => `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const finding = (f: Finding) => `
  <section class="ct-finding${f.id === "horror" ? " ct-finding--horror" : ""}" id="${f.id}" data-ct="${f.id}" aria-labelledby="h-${f.id}">
    <article>
      <p class="ct-eyebrow ct-eyebrow--hot"><span>${f.no}</span><span>${f.region}</span></p>
      <p class="ct-sub" data-pointer-from>${f.sub}</p>
      <h2 class="ct-display ct-title" id="h-${f.id}">${f.title}</h2>
      <p class="ct-lead">${f.lead}</p>
      <dl class="ct-stats">${f.stats.map(([v, l], i) => `<div><dd${i === 0 ? ' class="is-red"' : ""}>${v}</dd><dt>${l}</dt></div>`).join("")}</dl>
      <ul class="ct-points">${f.points.map((p) => `<li>${p}</li>`).join("")}</ul>
      <a class="ct-button ct-button--hot" href="${f.href}">Befund öffnen →</a>
    </article>
  </section>`;

document.body.className = "ct-body";
document.body.innerHTML = `
  <a class="ct-skip" href="#befunde">Zu den Befunden</a>
  <div class="ct-skull" aria-hidden="true"><canvas></canvas></div>
  <svg class="ct-pointers" aria-hidden="true"></svg>
  <div class="ct-progress" aria-hidden="true"><div></div></div>

  <header class="ct-header">
    <span class="ct-brand">${PHONE ? "Kevin" : "Kevin Schaberl"} / <span>SAOS</span></span>
    <button class="ct-menu" type="button" aria-expanded="false" aria-controls="ct-nav">Menü</button>
    <nav class="ct-nav" id="ct-nav" aria-label="Hauptnavigation">
      <a href="#befunde">Befunde</a><a href="#atlas">Atlas</a><a href="#kontakt" class="is-hot">Kontakt</a>
    </nav>
  </header>

  <main>
    <section class="ct-hero" data-ct="hero" aria-label="Intro">
      <p class="ct-eyebrow">Kopf-CT · Junior Fullstack-Dev${PHONE ? "" : "eloper"}</p>
      <h1 class="ct-display ct-h1">Kevin<br>Schaberl</h1>
      <p class="ct-hero-lead">${PHONE
        ? "Scroll, und der Schädel oben rechts öffnet sich. Jedes Projekt hat seine Region."
        : "Scroll, und der Schädel oben rechts dreht sich, wird aufgeschnitten und zeigt, was drin ist. Jedes Projekt hat seine Region."}</p>
      <div class="ct-actions">
        <a class="ct-button ct-button--red" href="#befunde">Befunde ansehen ↓</a>
        <a class="ct-button ct-button--ghost" href="#kontakt">Kontakt</a>
      </div>
      <p class="ct-note">Schädel: craniumCut01, CT-Datensatz aus meinem 3D-Renderer. Gehirn: für diese Seite in three.js modelliert — jede Region ein eigenes Teil, zusammengesteckt.</p>
    </section>

    <section class="ct-intro" id="befunde" data-ct="befunde" aria-labelledby="h-befunde">
      <h2 class="ct-display ct-h2" id="h-befunde">Befunde</h2>
      <p class="ct-muted">Vier große Projekte. Der Schädel rechts zeigt jeweils die Region, die dafür zuständig ist.</p>
    </section>
    ${FINDINGS.map(finding).join("")}

    <section class="ct-atlas" id="atlas" data-ct="atlas" aria-labelledby="h-atlas">
      <h2 class="ct-display ct-h2" id="h-atlas">Atlas</h2>
      <ol class="ct-atlas-list">${ATLAS.map((a, i) => `
        <li tabindex="0" data-part="${a.part}" style="--c: ${a.color}">
          <span class="ct-atlas-no">${i + 1}</span>
          <span class="ct-atlas-label">${a.label}</span>
          <span><span class="ct-atlas-name">${a.name}</span><span class="ct-atlas-sub">${a.sub}</span></span>
        </li>`).join("")}
      </ol>
    </section>

    <section class="ct-anamnesis" data-ct="anamnese" aria-labelledby="h-anamnese">
      <h2 class="ct-display ct-h2" id="h-anamnese">Anamnese</h2>
      <div>
        <ol class="ct-history">
          <li><span>01</span><span><b>Bodenleger</b><span>Handwerk. Der Anfang.</span></span></li>
          <li><span>02</span><span><b>Administrator</b><span>BBU: in einem Jahr 88-mal am Flughafen Wien-Schwechat.</span></span></li>
          <li><span>03</span><span><b>Developer</b><span>Junior Fullstack. 11 Projekte auf kev.dev.</span></span></li>
        </ol>
        <blockquote class="ct-quote">„Geht nicht“ heißt meistens: noch nicht verstanden.</blockquote>
      </div>
    </section>

    <section class="ct-contact" id="kontakt" data-ct="kontakt" aria-labelledby="h-kontakt">
      <div class="ct-stage">
        <canvas></canvas>
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${icon(ICON.github)}</a>
        <a href="mailto:kevin.schaberl.work@gmail.com" aria-label="E-Mail">${icon(ICON.mail)}</a>
        <a href="#kontakt" aria-label="Telefon">${icon(ICON.phone)}</a>
      </div>
      <div class="ct-contact-text">
        ${PHONE ? "" : `<p class="ct-eyebrow ct-eyebrow--hot">Schädel kommt frontal zurück · drei Sägeblätter · die Splitter sind die Links</p>`}
        <h2 class="ct-display ct-title" id="h-kontakt">Zweit&shy;meinung?</h2>
        ${PHONE ? "" : `<p class="ct-lead">Wenn du hier ankommst, dreht sich der Schädel zurück nach vorne — und dann fliegen die Blätter.</p>`}
        <a class="ct-mail" href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a>
      </div>
    </section>
  </main>

  <footer class="ct-footer">
    <span>© 2026 Kevin Schaberl / SAOS</span>
    <span><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a></span>
  </footer>`;

// ── scroll ──────────────────────────────────────────────────────────────
const lenis = new Lenis({ smoothWheel: !REDUCED });
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// In-page links scroll without touching the URL, so /saos#dev#skull stays
// in the address bar and a reload still lands on this page.
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector<HTMLElement>(a.getAttribute("href")!);
  if (!target) return;
  e.preventDefault();
  closeMenu();
  lenis.scrollTo(target, { offset: a.getAttribute("href") === "#kontakt" ? 0 : -24 });
});

const menu = document.querySelector<HTMLButtonElement>(".ct-menu")!;
const closeMenu = () => { menu.setAttribute("aria-expanded", "false"); document.body.classList.remove("is-menu"); };
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("is-menu", open);
});

const progressBar = document.querySelector<HTMLElement>(".ct-progress > div")!;

// ── the fixed skull ─────────────────────────────────────────────────────
const ease = (x: number) => { const u = Math.min(Math.max(x, 0), 1); return u * u * (3 - 2 * u); };
// Turn, then cut; the brain only once the cut is under way (craniumCut01
// is open at the forehead, the brain would show through).
const introPose = (t: number): Pose => ({
  rotY: ease((t - 0.12) / 0.48) * (Math.PI / 2),
  cut: -0.95 + ease((t - 0.45) / 0.4) * 0.97,
  brain: ease((t - 0.46) / 0.22),
});

const wrap = document.querySelector<HTMLElement>(".ct-skull")!;
const svg = document.querySelector<SVGSVGElement>(".ct-pointers")!;
const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-ct]"));
const sectionOf = (id: string) => sections.find((s) => s.dataset.ct === id)!;
const atlasRows = Array.from(document.querySelectorAll<HTMLElement>(".ct-atlas-list li"));
let hovered: Part | null = null;
atlasRows.forEach((li) => {
  const on = () => { hovered = li.dataset.part as Part; };
  const off = () => { hovered = null; };
  li.addEventListener("pointerenter", on); li.addEventListener("focus", on);
  li.addEventListener("pointerleave", off); li.addEventListener("blur", off);
});

import("./ct-scene").then(async ({ createCtScene }) => {
  const ct = await createCtScene(wrap.querySelector("canvas")!, { phone: PHONE, distance: PHONE ? 5.6 : 5.2 });
  wrap.classList.add("is-ready");
  let lastKey = "";
  let lastHi = "";

  gsap.ticker.add(() => {
    const y = window.scrollY, vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progressBar.style.transform = `scaleY(${(max > 0 ? y / max : 0).toFixed(4)})`;

    // The section under the reading line (40 % down the screen).
    const line = vh * 0.4;
    const active = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= line && r.bottom > line; })?.dataset.ct ?? "hero";
    const befundeTop = sectionOf("befunde").offsetTop;
    const ana = sectionOf("anamnese");

    // Pose: intro over the hero, back to the front over the anamnesis.
    let pose = introPose(REDUCED ? 1 : y / Math.max(befundeTop - vh * 0.35, 1));
    const back = ease((y + line - ana.offsetTop) / (ana.offsetHeight * 0.6));
    if (back > 0) pose = introPose(1 - back);
    const f = FINDINGS.find((x) => x.id === active);
    if (f?.brain !== undefined && pose.brain > 0) pose = { ...pose, brain: f.brain };
    // Fades while it turns back: the anamnesis is text only, the contact
    // has its own skull.
    const fade = 1 - back;
    wrap.style.opacity = fade.toFixed(3);
    wrap.classList.toggle("is-atlas", active === "atlas" && !PHONE);

    // Phones: the skull starts big in the hero and shrinks into the corner.
    if (PHONE) {
      const k = ease(y / (vh * 0.6));
      const w = wrap.offsetWidth;
      const x = (innerWidth - w) / 2 * (1 - k);
      wrap.style.transform = `translateX(${(-x).toFixed(1)}px) scale(${(1.5 - 0.5 * k).toFixed(3)})`;
    }

    const key = `${pose.rotY.toFixed(4)} ${pose.cut?.toFixed(4)} ${pose.brain.toFixed(3)}`;
    if (key !== lastKey) { lastKey = key; ct.setPose(pose); }

    // Highlight.
    let parts: Part[] = [];
    let colors: Partial<Record<Part, string>> | undefined;
    if (active === "atlas") {
      parts = hovered ? [hovered] : ATLAS.map((a) => a.part);
      colors = Object.fromEntries(ATLAS.map((a) => [a.part, a.color]));
    } else if (f) parts = f.parts;
    const hi = parts.join() + (colors ? "c" : "");
    if (hi !== lastHi) { lastHi = hi; ct.setHighlight(parts, colors); }

    drawPointers(ct, active, fade);
  });
}).catch(() => wrap.remove()); // no WebGL: the page without the skull

// Pointer lines (desktop) or rings (phones) from the regions to the text.
function drawPointers(ct: CtScene, active: string, fade: number) {
  const items: { part: Part; color: string; from?: HTMLElement; no?: number; dashed?: boolean }[] = [];
  const f = FINDINGS.find((x) => x.id === active);
  if (f) {
    const from = sectionOf(f.id).querySelector<HTMLElement>("[data-pointer-from]")!;
    f.parts.forEach((part, i) => items.push({ part, color: HOT, from, dashed: i > 0 }));
  } else if (active === "atlas") {
    ATLAS.forEach((a, i) => items.push({ part: a.part, color: a.color, from: atlasRows[i], no: i + 1 }));
  }
  const sec = sectionOf(active === "hero" ? "befunde" : active);
  const r = sec.getBoundingClientRect(), vh = innerHeight;
  // Fade in once the section is well on screen, out as it leaves.
  const vis = Math.min(ease((vh * 0.75 - r.top) / (vh * 0.25)), ease((r.bottom - vh * 0.25) / (vh * 0.25))) * fade;
  if (!items.length || vis <= 0.01 || wrap.style.display === "none") { if (svg.childElementCount) svg.replaceChildren(); return; }

  const canvas = wrap.querySelector("canvas")!;
  const cr = canvas.getBoundingClientRect();
  const sx = cr.width / canvas.clientWidth, sy = cr.height / canvas.clientHeight;
  let out = "";
  for (const it of items) {
    const [ax, ay] = ct.anchor(it.part);
    const ex = cr.left + ax * sx, ey = cr.top + ay * sy;
    if (PHONE) {
      out += `<circle cx="${ex}" cy="${ey}" r="${it.no ? 9 : 8}" fill="#05060acc" stroke="${it.color}" stroke-width="2"/>`;
      if (it.no) out += `<text x="${ex}" y="${ey + 3.5}" fill="${it.color}" font-size="10" text-anchor="middle">${it.no}</text>`;
      continue;
    }
    const fr = it.from!.getBoundingClientRect();
    const fx = it.no ? fr.right + 8 : Math.max(fr.left + 700, fr.right + 24);
    const fy = fr.top + fr.height / 2;
    const bend = Math.min(160, Math.abs(ex - fx) * 0.45);
    out += `<path d="M${ex} ${ey} C${ex - bend} ${ey} ${fx + bend * 0.6} ${fy} ${fx} ${fy}" fill="none" stroke="${it.color}" stroke-width="1.6" stroke-opacity="0.9"${it.dashed ? ' stroke-dasharray="4 5"' : ""}/>`;
    out += `<circle cx="${ex}" cy="${ey}" r="${it.no ? 6 : 7}" fill="#05060a" stroke="${it.color}" stroke-width="3"/>`;
    if (!it.no) out += `<circle cx="${ex}" cy="${ey}" r="20" fill="none" stroke="${it.color}" stroke-opacity="0.35" stroke-width="2"/>`;
  }
  svg.style.opacity = vis.toFixed(3);
  svg.innerHTML = out;
}

// ── contact: skull rises, three blades, the shards are the links ────────
const stage = document.querySelector<HTMLElement>(".ct-stage")!;
const links = Array.from(stage.querySelectorAll<HTMLElement>("a"));
const rise = { v: 0 };
let riseTween: gsap.core.Tween | null = null;
const loadIo = new IntersectionObserver(([e]) => {
  if (!e.isIntersecting) return;
  loadIo.disconnect();
  import("./saw-scene").then(({ createSkullScene }) =>
    createSkullScene(stage, stage.querySelector("canvas")!, links, {
      onFirstHit: () => pauseThrows(true),
      onReset: () => pauseThrows(false),
    }),
  ).then((scene) => {
    if (REDUCED) { scene.finish(); return; }
    // Up once the stage is half on screen; scrolled back above: reset.
    new IntersectionObserver(([e]) => {
      riseTween?.kill();
      if (e.isIntersecting) {
        riseTween = gsap.to(rise, { v: 1, duration: 1.3 * (1 - rise.v), ease: "none", onUpdate: () => scene.setRise(rise.v) });
      } else if (e.boundingClientRect.top > 0) {
        rise.v = 0;
        scene.setRise(0);
      }
    }, { threshold: 0.5 }).observe(stage);
  }).catch(() => stage.classList.add("no-skull"));
}, { rootMargin: "300% 0px" });
loadIo.observe(stage);

startThrowLayer();
