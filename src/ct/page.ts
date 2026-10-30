// The CT-Schädel page (/saos#dev#skull, loaded by src/saos-entry.ts),
// rebuilt after the live prototype ("#skull infos /ct-live.zip") and the
// CT-Desktop / CT-Mobile mockup. One point skull (ct-scene.ts) in a fixed
// canvas over the right half; the section on screen sets its state and the
// skull follows smoothly:
//  - intro (pinned): facing you, a cut opens it and the brain shows; then
//    it turns to the side and the brain rises out of the skull
//  - each finding: the brain comes apart, its part moves out and lights
//    up, a pointer runs to the heading
//  - atlas: the eight small projects' parts out and in colour, one line
//    per row
//  - anamnesis: side view, the brain back together, nothing lit
//  - contact: back to the front, three saw blades hit it (saw.ts); the
//    links ride on the shards that freeze in the air.
// Copy from the mockup, the project texts from the main page's
// projects-data.ts. German, like the mockup.
import "@fontsource-variable/jetbrains-mono";
import "./page.css";
import gsap from "gsap";
import Lenis from "lenis";
import { projectCards } from "../projects/projects-data";
import { esc } from "../projects/project-cards";
import { initScrollProgress } from "../scroll/progress";
import type { Part } from "./brain-build";
import type { CtScene } from "./ct-scene";

document.documentElement.lang = "de";
document.title = "Kevin Schaberl — Kopf-CT";

const PHONE = matchMedia("(max-width: 700px)").matches;
// Like the main page (FORCE_MOTION_EVERYWHERE in main.ts): every visitor
// gets the motion, the OS "reduce motion" setting is ignored for now —
// with it, the skull would just sit in its end state while you scroll.
const FORCE_MOTION = true;
const REDUCED = !FORCE_MOTION && matchMedia("(prefers-reduced-motion: reduce)").matches;
const HOT = "#ffe08a";

// The main page's project texts (projects-data.ts), by id.
const CARD = new Map(projectCards.map((c) => [c.id, c]));

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
// Order as in the live prototype.
const ATLAS: { id: string; part: Part; label: string; name: string; sub: string; color: string }[] = [
  { id: "loadtest", part: "cerebellum", label: "Kleinhirn", name: "Loadtest", sub: "C++17-Lastgenerator ohne Libraries", color: "#ffd400" },
  { id: "oskalizer", part: "motor", label: "Motorcortex", name: "Oskalizer", sub: "Tastatur-Spielplatz", color: "#57ff8f" },
  { id: "kevdev", part: "parietal", label: "Parietallappen", name: "kev.dev", sub: "Aufzug, Stoff, Würfe", color: "#57b9ff" },
  { id: "facedots", part: "fusiform", label: "Gyrus fusiformis", name: "FaceDots", sub: "Foto zu Punkten", color: "#ff8a3d" },
  { id: "aniscript", part: "temporal", label: "Schläfenlappen", name: "AniScript", sub: "Userscript", color: "#ff5fc8" },
  { id: "releasewatcher", part: "thalamus", label: "Thalamus", name: "ReleaseWatcher", sub: "CLI + Web-UI", color: "#ffffff" },
  { id: "grundlagen", part: "hippocampus", label: "Hippocampus", name: "Grundlagen", sub: "Bootcamp · Java", color: "#7fe6ff" },
  { id: "shop", part: "accumbens", label: "Belohnungssystem", name: "Shop", sub: "Shop-Modul für YourBrand", color: "#ffd400" },
];

const ICON = {
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.78 5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  mail: '<path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
};
const icon = (d: string) => `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

// The project's own text from the main page: what it is, stack, effort.
function report(id: string) {
  const c = CARD.get(id);
  if (!c) return "";
  return `
      <div class="ct-report">
        <h3 class="ct-report-h">Befundbericht</h3>
        ${c.what ? `<p>${esc(c.what)}</p>` : ""}
        ${c.tags?.length ? `<p class="ct-tags">${c.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</p>` : ""}
        ${c.meta ? `<p class="ct-meta">${esc(c.meta)}</p>` : ""}
      </div>`;
}

function repo(id: string) {
  const l = CARD.get(id)?.links?.find((x) => x.href?.includes("github.com"));
  return l ? `<a class="ct-button ct-button--ghost" href="${l.href}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : "";
}

const finding = (f: Finding) => `
  <section class="ct-sec${f.id === "horror" ? " ct-sec--horror" : ""}" id="${f.id}" data-state="${f.id}" aria-labelledby="h-${f.id}">
    <p class="ct-kick"><span>${f.no}</span>${f.region}</p>
    <p class="ct-func">${f.sub}</p>
    <h2 class="ct-h" id="h-${f.id}" data-pointer>${f.title}</h2>
    <p class="ct-claim">${f.lead}</p>
    <dl class="ct-stats">${f.stats.map(([v, l]) => `<div><dd>${v}</dd><dt>${l}</dt></div>`).join("")}</dl>
    <ul class="ct-points">${f.points.map((p) => `<li>${p}</li>`).join("")}</ul>
    ${report(f.id)}
    <p class="ct-links-row">
      <a class="ct-button ct-button--hot" href="${f.href}">Befund öffnen →</a>
      ${repo(f.id)}
    </p>
  </section>`;

document.body.className = "ct-body";
document.body.innerHTML = `
  <a class="ct-skip" href="#yourbrand">Zu den Befunden</a>
  <canvas class="ct-skull" aria-label="Schädel-CT aus Punkten, dreht sich und öffnet sich beim Scrollen"></canvas>
  <svg class="ct-pointers" aria-hidden="true"></svg>
  <p class="ct-status" aria-hidden="true">lädt …</p>
  <div class="scrollbar" aria-hidden="true"><div class="scrollbar-thumb"></div></div>

  <header class="ct-header">
    <span class="ct-brand">Kevin Schaberl / <span>SAOS</span></span>
    <nav class="ct-nav" aria-label="Hauptnavigation">
      <a href="#yourbrand">Befunde</a><a href="#atlas">Atlas</a><a href="#kontakt" class="is-hot">Kontakt</a>
    </nav>
  </header>

  <main>
    <section class="ct-intro" data-state="intro" aria-label="Intro"><div class="ct-pin">
      <p class="ct-kick">Kopf-CT · Junior Fullstack-Developer</p>
      <h1 class="ct-h ct-h1">Kevin<br>Schaberl</h1>
      <p class="ct-lead">Scroll, und der Schädel rechts dreht sich, wird aufgeschnitten und zeigt, was drin ist. Jedes Projekt hat seine Region.</p>
      <p><a class="ct-button ct-button--red" href="#yourbrand">Befunde ansehen ↓</a></p>
      <p class="ct-hint">↓ Scrollen — der Schädel dreht sich zur Seite, die Schnittebene fährt durch</p>
      <p class="ct-note">Schädel: craniumCut01, CT-Datensatz aus meinem 3D-Renderer. Gehirn: für diese Seite in three.js modelliert — jede Region ein eigenes Teil, zusammengesteckt.</p>
    </div></section>

    ${FINDINGS.map(finding).join("")}

    <section class="ct-atlas" id="atlas" data-state="atlas" aria-labelledby="h-atlas">
      <h2 class="ct-h ct-h2" id="h-atlas">Atlas</h2>
      <p class="ct-func">Acht kleinere Projekte, acht Regionen.</p>
      <ul class="ct-atlas-list">${ATLAS.map((a) => `
        <li tabindex="0" data-region="${a.part}" style="--c: ${a.color}">
          <small>${a.label}</small>
          <b>${a.name}</b>
          <span>${a.sub}${CARD.get(a.id)?.claim ? `<em>${esc(CARD.get(a.id)!.claim)}</em>` : ""}</span>
        </li>`).join("")}
      </ul>
    </section>

    <section class="ct-about" data-state="about" aria-labelledby="h-about">
      <h2 class="ct-h ct-h2" id="h-about">Anamnese</h2>
      <div class="ct-cv"><small>01</small><div><b>Bodenleger</b><span>Handwerk. Der Anfang.</span></div></div>
      <div class="ct-cv"><small>02</small><div><b>Administrator</b><span>BBU: in einem Jahr 88-mal am Flughafen Wien-Schwechat.</span></div></div>
      <div class="ct-cv"><small>03</small><div><b>Developer</b><span>Junior Fullstack. 11 Projekte auf kev.dev.</span></div></div>
      <blockquote>„Geht nicht“ heißt meistens: noch nicht verstanden.</blockquote>
    </section>

    <section class="ct-contact" id="kontakt" data-state="contact" aria-labelledby="h-kontakt">
      <p class="ct-kick">Der Schädel dreht sich zurück · ${PHONE ? "ein Sägeblatt" : "drei Sägeblätter"} · die Splitter sind die Links</p>
      <h2 class="ct-h ct-h2" id="h-kontakt">Zweit&shy;meinung?</h2>
      <p class="ct-claim">Wenn du hier ankommst, fliegen die Blätter.</p>
      <p><a class="ct-mail" href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a></p>
    </section>
  </main>

  <a class="ct-shard" href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${icon(ICON.github)}</a>
  <a class="ct-shard" href="mailto:kevin.schaberl.work@gmail.com" aria-label="E-Mail">${icon(ICON.mail)}</a>
  <a class="ct-shard" href="#kontakt" aria-label="Telefon">${icon(ICON.phone)}</a>

  <footer class="ct-footer">
    <span>© 2026 Kevin Schaberl / SAOS</span>
    <span><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a></span>
  </footer>`;

// ── scroll ──────────────────────────────────────────────────────────────
const lenis = new Lenis({ smoothWheel: !REDUCED });
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
initScrollProgress(lenis); // the main page's scrollbar (src/scroll/progress.ts)

// In-page links scroll without touching the URL, so /saos#dev#skull stays
// in the address bar and a reload still lands on this page.
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector<HTMLElement>(a.getAttribute("href")!);
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target);
});

// ── the skull ───────────────────────────────────────────────────────────
type State = { hi: Part[]; colors?: Partial<Record<Part, string>>; op?: number; front?: boolean };
const STATES: Record<string, State> = {
  intro: { hi: [] },
  ...Object.fromEntries(FINDINGS.map((f) => [f.id, { hi: f.parts, op: f.brain }])),
  atlas: { hi: ATLAS.map((a) => a.part), colors: Object.fromEntries(ATLAS.map((a) => [a.part, a.color])) },
  about: { hi: [] },
  contact: { hi: [], front: true },
};

const canvas = document.querySelector<HTMLCanvasElement>(".ct-skull")!;
const svg = document.querySelector<SVGSVGElement>(".ct-pointers")!;
const status = document.querySelector<HTMLElement>(".ct-status")!;
const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-state]"));
const intro = sections[0];
const shards = Array.from(document.querySelectorAll<HTMLElement>(".ct-shard"));
const atlasRows = Array.from(document.querySelectorAll<HTMLElement>(".ct-atlas-list li"));

const sm = (e0: number, e1: number, t: number) => { const u = Math.min(Math.max((t - e0) / (e1 - e0), 0), 1); return u * u * (3 - 2 * u); };
const ease = (t: number) => sm(0, 1, t);
const introProgress = () => {
  const r = intro.getBoundingClientRect();
  return Math.min(Math.max(-r.top / (r.height - innerHeight * 0.4), 0), 1);
};
// The last section whose top has passed 55 % of the screen.
const pickActive = () => {
  let a = "intro";
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.55) a = s.dataset.state!;
  return a;
};

// Atlas: hovering or focusing a row lights only its region.
let hovered: Part | null = null;
atlasRows.forEach((li) => {
  const on = () => { hovered = li.dataset.region as Part; };
  const off = () => { hovered = null; };
  li.addEventListener("pointerenter", on); li.addEventListener("focus", on);
  li.addEventListener("pointerleave", off); li.addEventListener("blur", off);
});

import("./ct-scene").then(async ({ createCtScene }) => {
  const ct = await createCtScene(canvas, {
    phone: PHONE,
    distance: 6.4,
    saw: true,
    sawSingle: PHONE, // phones: one blade + blood, like the main page's contact
  });
  status.remove();
  document.documentElement.classList.add("ct-ready");

  let active = "";
  let lastHi = "";
  const cur = { rotY: 0, cut: -0.95, op: 0, lift: 0 };

  // Drag turns skull + brain on top of the scroll pose: sideways on touch
  // (touch-action pan-y in page.css keeps vertical swipes scrolling),
  // sideways + up/down with a mouse. Eased; a new section turns it back.
  const turn = { x: 0, y: 0, tx: 0, ty: 0 };
  let drag: { id: number; x: number; y: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-turning");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    turn.ty += (e.clientX - drag.x) * 0.01;
    if (e.pointerType === "mouse") turn.tx = Math.max(-0.8, Math.min(0.8, turn.tx + (e.clientY - drag.y) * 0.008));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    canvas.classList.remove("is-turning");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  let lastEx = "";
  let last = performance.now();

  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const a = pickActive();
    if (a !== active) {
      active = a;
      // phones: the finale gets the whole width (page.css), so the blood
      // and the shards aren't cut off by the small skull window
      document.documentElement.classList.toggle("ct-finale", active === "contact");
      turn.tx = 0; turn.ty = 0;
      if (active === "contact") ct.saw?.start();
      else if (ct.saw?.running) ct.saw.reset();
      if (REDUCED && active === "contact") ct.saw?.finish();
      ct.requestRender();
    }
    const st = STATES[active];

    // Highlight (the atlas row under the pointer wins).
    const hi = active === "atlas" && hovered ? [hovered] : st.hi;
    const key = hi.join() + (st.colors ? "c" : "");
    if (key !== lastHi) { lastHi = key; ct.setHighlight(hi, st.colors); }

    // The brain comes apart: the lit parts move out, the rest a little.
    const ex = active === "atlas" ? [0.24, 0.03] : FINDINGS.some((x) => x.id === active) ? [0.36, 0.06] : [0, 0];
    const exKey = key + ex.join();
    if (exKey !== lastEx) { lastEx = exKey; ct.setExplode(hi, ex[0], ex[1]); }

    // Pose: the intro follows the scroll, everything else is a state; the
    // skull glides towards it. Intro, from the first scrolled pixel: the
    // cut runs through while it faces you and the brain shows, then it
    // turns to the side, then the brain rises out of the skull.
    let tRot: number, tCut: number, tOp: number, tLift: number;
    if (active === "intro") {
      const t = REDUCED ? 1 : introProgress();
      tCut = -0.95 + ease(t / 0.35) * 0.97;
      tOp = ease((t - 0.05) / 0.25);
      tRot = ease((t - 0.35) / 0.35) * (Math.PI / 2);
      tLift = ease((t - 0.72) / 0.28);
    } else if (st.front) { tRot = 0; tCut = -5; tOp = 0; tLift = 0; }
    else { tRot = Math.PI / 2; tCut = 0.02; tOp = st.op ?? 1; tLift = 1; }
    const f = REDUCED ? 1 : 1 - Math.exp(-dt * 8);
    cur.rotY += (tRot - cur.rotY) * f;
    cur.cut += (tCut - cur.cut) * f;
    cur.op += (tOp - cur.op) * f;
    cur.lift += (tLift - cur.lift) * f;
    const ft = 1 - Math.exp(-dt * 12);
    turn.x += (turn.tx - turn.x) * ft;
    turn.y += (turn.ty - turn.y) * ft;
    const settled = Math.abs(tRot - cur.rotY) + Math.abs(tCut - cur.cut) + Math.abs(tOp - cur.op) + Math.abs(tLift - cur.lift)
      + Math.abs(turn.tx - turn.x) + Math.abs(turn.ty - turn.y) < 1e-4;
    if (!settled) {
      ct.rig.rotation.x = turn.x;
      ct.setPose({ rotY: cur.rotY + turn.y, cut: cur.cut, brain: cur.op < 0.02 ? 0 : cur.op > 0.98 ? 1 : cur.op, lift: cur.lift });
    }

    drawPointers(ct, active, st, hi);
    placeShards(ct);
  });
}).catch(() => { canvas.remove(); status.remove(); document.documentElement.classList.add("no-skull"); });

const cr = () => canvas.getBoundingClientRect();

// Lines from the lit regions to the section's heading (atlas: to each row).
function drawPointers(ct: CtScene, active: string, st: State, hi: Part[]) {
  let out = "";
  const sideView = Math.abs(currentRot(ct) - Math.PI / 2) < 0.2;
  if (!PHONE && sideView && active !== "intro" && active !== "about" && active !== "contact") {
    const sec = sections.find((s) => s.dataset.state === active)!;
    const r = cr();
    const targets = st.colors
      ? atlasRows.filter((li) => hi.includes(li.dataset.region as Part)).map((li) => ({ part: li.dataset.region as Part, el: li }))
      : hi.map((part) => ({ part, el: sec.querySelector<HTMLElement>("[data-pointer]")! }));
    for (const { part, el } of targets) {
      const [x, y] = ct.anchor(part);
      const ax = r.left + x, ay = r.top + y;
      const b = el.getBoundingClientRect();
      const tx = b.right + 16, ty = b.top + b.height / 2;
      if (ty < -50 || ty > innerHeight + 50) continue;
      const col = st.colors?.[part] ?? HOT;
      out += `<path d="M${ax} ${ay} C${ax - 140} ${ay} ${tx + 140} ${ty} ${tx} ${ty}" fill="none" stroke="${col}" stroke-width="1.6" opacity="0.9"/>`
        + `<circle cx="${ax}" cy="${ay}" r="6" fill="#05060a" stroke="${col}" stroke-width="3"/>`
        + `<circle cx="${ax}" cy="${ay}" r="18" fill="none" stroke="${col}" stroke-opacity="0.35" stroke-width="2"/>`;
    }
  }
  if (svg.innerHTML !== out) svg.innerHTML = out;
}
const currentRot = (ct: CtScene) => ct.rig.rotation.y;

// The contact links ride on the first shard of each hit.
function placeShards(ct: CtScene) {
  const pts = ct.saw?.linkPoints() ?? [];
  const r = cr();
  shards.forEach((a, i) => {
    const p = pts[i];
    if (p) {
      const [x, y] = ct.project(p);
      a.style.transform = `translate(${(r.left + x).toFixed(1)}px, ${(r.top + y).toFixed(1)}px) translate(-50%, -50%)`;
    }
    a.classList.toggle("is-on", !!p);
  });
}

