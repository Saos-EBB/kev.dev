#!/usr/bin/env node
// Builds the CV as two PDFs in kev.dev's own look — dark and light, the
// About buttons hand out the one matching the visitor's theme:
//
//   public/cv/lebenslauf-kevin-schaberl-dark.pdf
//   public/cv/lebenslauf-kevin-schaberl-light.pdf
//
// The CV is an HTML page (same fonts, grid, corner brackets and purple as
// the site) printed to A4 by Chromium via Playwright. Content below is the
// CV from the b2b-cv repo, unchanged — edit it here and re-run:
//
//   node scripts/build-cv.mjs
//
// Needs Playwright + a Chromium (in the dev container: /opt/pw-browsers;
// elsewhere `npx playwright install chromium` and drop CHROMIUM_PATH).

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "cv");
const font = (p) => pathToFileURL(join(ROOT, p)).href;

const CV = {
  name: "Kevin Schaberl",
  role: "Junior Software Developer",
  tagline: "Raum Linz · vor Ort, hybrid oder remote im DACH-Raum · sofort verfügbar",
  contact: [
    ["mail", "kevin.schaberl.work@gmail.com"],
    ["tel", "+43 676 471 88 07"],
    ["adresse", "Lerchenfeldstraße 7, 4100 Ottensheim"],
    ["web", "saos-repo.vercel.app"],
    ["code", "github.com/Saos-EBB"],
    ["geboren", "24.04.1996, Österreich"],
  ],
  profile:
    "Quereinsteiger aus dem Handwerk. Vor der Umschulung war ich Administrator einer Bundesagentur — die Stelle entstand aus der IT-Arbeit heraus, die ich dort übernommen habe. Seit meiner ersten Zeile Code sind rund zehn Monate vergangen; in dieser Zeit sind die unten genannten Projekte entstanden, mit einem Stack, den ich mir überwiegend selbst erarbeitet habe.",
  skills: [
    ["Sprachen", "TypeScript · JavaScript · Java · Python · SQL"],
    ["Backend", "NestJS · Node.js · PostgreSQL · PostGIS · WebSockets · Stripe"],
    ["Frontend", "React · Next.js · Tailwind · Canvas 2D"],
    ["Werkzeuge", "Git · Docker · Playwright · Ollama"],
    ["Persönlich", "Teamplayer · schnelle Auffassungsgabe · lernbereit · verlässlich"],
  ],
  languages: [
    ["Deutsch", "Muttersprache"],
    ["Englisch", "Fortgeschritten (B2/C1)"],
  ],
  education: [
    ["Junior Developer", "Talent Hub – IT Ibis Acam, Linz · Jun 2026"],
    ["Pflichtschule, Gymnasium", ""],
  ],
  experience: [
    ["Okt 2025 – Jun 2026", "Junior Developer — Full-Stack-Bootcamp", "Talent Hub – IT Ibis Acam, Linz", "Acht Monate, täglich acht Stunden. Abschluss mit Zertifikat Junior Developer."],
    ["Jun 2023 – Okt 2025", "Sanierung Wohnhaus (Familienprojekt)", "Linz-Ebelsberg", "Das Haus meiner Urgroßeltern in Eigenleistung erhalten und wieder bewohnbar gemacht."],
    ["Jan 2022 – Jun 2023", "Administrator", "BBU GmbH, Linz", "Aus dem Zivildienst übernommen, die Stelle entstand aus der Arbeit heraus. Ich habe für die Geschäftsstelle die gesamte IT betreut, soweit es ohne Administratorrechte ging: Arbeitsplätze eingerichtet, Abläufe automatisiert, Kolleginnen und Kollegen geschult."],
    ["Mär 2021 – Dez 2021", "Zivildiener", "BBU GmbH, Linz", ""],
    ["Sep 2019 – Feb 2021", "Auslandsaufenthalt", "Schwerpunkt Europa", ""],
    ["Jul 2017 – Apr 2019", "Sonnenschutztechniker", "SUNSTAR, Leonding", ""],
    ["Sep 2012 – Mai 2017", "Bodenleger", "Bodendesign Mittermayer, Linz", "Lehrzeit 2012–2015 vollständig absolviert, danach weiterbeschäftigt. Die Lehrabschlussprüfung habe ich nie abgelegt."],
  ],
  projects: [
    ["YourBrand", "Modulare White-Label-Plattform. Allein von der Datenbank bis zum Frontend: NestJS, PostgreSQL/PostGIS, Echtzeit-Chat über WebSockets, Stripe-Zahlungen, vollständiger DSGVO-Ablauf."],
    ["TschoBBo", "Job-Scraper mit lokalen Sprachmodellen über Ollama, ohne Cloud. Scrape → Filter → Anschreiben; der Versand bleibt bewusst ein manueller Klick."],
    ["3D-Wireframe-Renderer", "Projektion, Rotation und Tiefenschattierung von Hand geschrieben, ohne Bibliothek. Dazu eine Werkzeugkette in Node und Python, die aus .obj, .stl oder einer CT-Serie ein darstellbares Modell macht."],
  ],
  courses: [
    "Grundausbildung (Okt – Dez 2025): prozedurale Programmierung, Lern- und Arbeitsmethoden.",
    "Bootcamp (Dez 2025 – Jun 2026): OOP in Java, Datenbanken (MySQL, SQL, Oracle), Web-Entwicklung (HTML, CSS, JS, PHP), zweimonatiges Abschlussprojekt.",
  ],
};

// Same values as style.css's :root / light theme.
const THEMES = {
  dark: { bg: "#08070a", text: "#f5f5f6", muted: "#8a8a93", line: "#cd57ff", accent: "#cd57a6", blue: "#57b9ff", grid: 0.16, box: 0.82 },
  light: { bg: "#ffffff", text: "#0d0d0f", muted: "#55555c", line: "#a43fd6", accent: "#b23a86", blue: "#2a7fd0", grid: 0.12, box: 0.9 },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function html(t) {
  const section = (title, body) => `<section class="box"><h3>${title}</h3>${body}</section>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
@font-face { font-family: "Koeeya"; src: url("${font("public/fonts/koeeya-trial.ttf")}"); }
@font-face { font-family: "JBM"; font-weight: 100 800; src: url("${font("node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2")}"); }
@font-face { font-family: "JBM"; font-weight: 100 800; src: url("${font("node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2")}"); unicode-range: U+0100-024F, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
@page { size: A4; margin: 0; }
:root {
  --bg: ${t.bg}; --text: ${t.text}; --muted: ${t.muted}; --line: ${t.line}; --accent: ${t.accent}; --blue: ${t.blue};
  --grid: color-mix(in srgb, var(--line) ${t.grid * 100}%, transparent);
  --soft: color-mix(in srgb, var(--line) 38%, transparent);
  --cell: 7mm;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  width: 210mm; height: 297mm; overflow: hidden; position: relative;
  padding: 10mm 12mm 12mm;
  background-color: var(--bg);
  background-image:
    linear-gradient(to bottom, var(--grid) 0 0.25pt, transparent 0.25pt),
    linear-gradient(to right, var(--grid) 0 0.25pt, transparent 0.25pt);
  background-size: var(--cell) var(--cell);
  color: var(--text); font-family: "JBM", monospace; font-size: 7.3pt; line-height: 1.45;
}
header { display: flex; justify-content: space-between; align-items: flex-end; gap: 6mm; padding-bottom: 4mm; border-bottom: 1.2pt solid var(--line); margin-bottom: 5mm; }
h1 {
  font-family: "Koeeya", sans-serif; font-weight: normal; font-size: 34pt; line-height: 0.95; text-transform: uppercase;
  background: linear-gradient(90deg, var(--accent), var(--line) 50%, var(--blue));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.role { margin-top: 1.5mm; font-size: 9pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.tagline { margin-top: 1mm; color: var(--muted); }
.mark { font-family: "Koeeya", sans-serif; font-size: 16pt; color: var(--accent); text-align: right; line-height: 1; }
.mark small { display: block; font-family: "JBM"; font-size: 6pt; letter-spacing: 0.14em; color: var(--muted); margin-top: 1mm; }
.cols { display: grid; grid-template-columns: 68mm 1fr; gap: 5mm; }
.col { display: flex; flex-direction: column; gap: 3.2mm; }
.box {
  position: relative; padding: 3.2mm 3.6mm;
  border: 0.6pt solid var(--soft);
  background: color-mix(in srgb, var(--bg) ${t.box * 100}%, transparent);
}
.box::after {
  content: ""; position: absolute; inset: -0.6pt; pointer-events: none;
  --t: 3mm; --w: 1.2pt;
  background:
    linear-gradient(var(--line), var(--line)) top left / var(--t) var(--w),
    linear-gradient(var(--line), var(--line)) top left / var(--w) var(--t),
    linear-gradient(var(--line), var(--line)) top right / var(--t) var(--w),
    linear-gradient(var(--line), var(--line)) top right / var(--w) var(--t),
    linear-gradient(var(--line), var(--line)) bottom left / var(--t) var(--w),
    linear-gradient(var(--line), var(--line)) bottom left / var(--w) var(--t),
    linear-gradient(var(--line), var(--line)) bottom right / var(--t) var(--w),
    linear-gradient(var(--line), var(--line)) bottom right / var(--w) var(--t);
  background-repeat: no-repeat;
}
h3 { font-size: 7pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--line); margin-bottom: 2mm; display: flex; align-items: center; gap: 2mm; }
h3::before { content: ""; width: 4mm; height: 1.2pt; background: var(--line); }
dl { display: grid; grid-template-columns: auto 1fr; gap: 1mm 2.5mm; }
dt { color: var(--muted); font-size: 6.4pt; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 0.4mm; }
dd { word-break: break-word; }
.skill { margin-bottom: 1.6mm; }
.skill b { display: block; font-size: 6.4pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 600; }
.job { display: grid; grid-template-columns: 27mm 1fr; gap: 0 3mm; padding: 1.3mm 0; border-top: 0.4pt dashed var(--soft); }
.job:first-of-type { border-top: 0; padding-top: 0; }
.when { color: var(--line); font-size: 6.2pt; padding-top: 0.6mm; white-space: nowrap; }
.job b { font-weight: 700; }
.job .where { color: var(--muted); }
.job p { margin-top: 0.6mm; }
.proj { margin-bottom: 1.4mm; }
.proj b { font-family: "Koeeya", sans-serif; font-weight: normal; font-size: 10.5pt; color: var(--text); }
ul { list-style: none; } li { position: relative; padding-left: 3mm; margin-bottom: 1mm; }
li::before { content: ""; position: absolute; left: 0; top: 1.6mm; width: 1.2mm; height: 1.2mm; background: var(--line); }
footer { position: absolute; left: 12mm; right: 12mm; bottom: 6mm; display: flex; justify-content: space-between; color: var(--muted); font-size: 6pt; letter-spacing: 0.1em; text-transform: uppercase; }
</style></head><body>
<header>
  <div>
    <h1>${esc(CV.name)}</h1>
    <p class="role">${esc(CV.role)}</p>
    <p class="tagline">${esc(CV.tagline)}</p>
  </div>
  <div class="mark">SAOS<small>Lebenslauf</small></div>
</header>
<div class="cols">
  <div class="col">
    ${section("Kontakt", `<dl>${CV.contact.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`)}
    ${section("Kompetenzen", CV.skills.map(([k, v]) => `<p class="skill"><b>${k}</b>${esc(v)}</p>`).join(""))}
    ${section("Sprachen", `<dl>${CV.languages.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`)}
    ${section("Ausbildung", CV.education.map(([k, v]) => `<p class="skill"><b>${esc(k)}</b>${esc(v)}</p>`).join(""))}
    ${section("Kurse &amp; Zertifikate", `<ul>${CV.courses.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`)}
  </div>
  <div class="col">
    ${section("Profil", `<p>${esc(CV.profile)}</p>`)}
    ${section("Berufserfahrung", CV.experience.map(([when, what, where, note]) => `<div class="job"><span class="when">${when}</span><div><b>${esc(what)}</b><div class="where">${esc(where)}</div>${note ? `<p>${esc(note)}</p>` : ""}</div></div>`).join(""))}
    ${section("Ausgewählte Projekte", CV.projects.map(([n, d]) => `<div class="proj"><b>${esc(n)}</b><p>${esc(d)}</p></div>`).join(""))}
  </div>
</div>
<footer><span>${esc(CV.name)} · ${esc(CV.role)}</span><span>github.com/Saos-EBB</span></footer>
</body></html>`;
}

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
mkdirSync(OUT_DIR, { recursive: true });
for (const [name, theme] of Object.entries(THEMES)) {
  const page = await browser.newPage();
  const file = join(OUT_DIR, `.cv-${name}.html`);
  writeFileSync(file, html(theme));
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const out = join(OUT_DIR, `lebenslauf-kevin-schaberl-${name}.pdf`);
  // One page, always — if the content ever grows past A4 this throws instead
  // of quietly printing a second page.
  const overflow = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight);
  if (overflow > 0) throw new Error(`CV ist ${overflow}px zu lang für eine A4-Seite`);
  await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true, pageRanges: "1" });
  if (process.env.CV_PREVIEW) await page.screenshot({ path: join(process.env.CV_PREVIEW, `cv-${name}.png`), fullPage: true });
  console.log("geschrieben:", out);
  await page.close();
  (await import("node:fs")).unlinkSync(file);
}
await browser.close();
