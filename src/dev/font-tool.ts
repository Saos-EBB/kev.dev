// Dev-only font playground (npm run dev, never in the build — main.ts
// imports it behind import.meta.env.DEV). Swap the page's font roles
// (--font-display/-read/-sans/-mono), scale the root size, or pick any
// element and change its family/size/weight/line-height/spacing live.
// "CSS kopieren" puts the result on the clipboard as plain CSS to hand
// over. Fonts can come from the ones the site ships, a system font,
// Google Fonts (by name) or a local .ttf/.otf/.woff(2) file.
//
// Lives in a shadow root so neither the site's CSS nor its own font
// changes reach the panel. State is kept in localStorage (best effort)
// so a reload keeps the experiment; uploaded files are kept only while
// they're small enough to fit.

type Rule = { family?: string; size?: string; weight?: string; lineHeight?: string; letterSpacing?: string };
type Upload = { name: string; data: string };
type State = {
  rootSize: number;
  vars: Record<string, string>;
  rules: Record<string, Rule>;
  google: string[];
  uploads: Upload[];
};

const KEY = "kevdev.fonttool";
const ROLES: { v: string; label: string; fallback: string }[] = [
  { v: "--font-display", label: "Display (Name, Titel)", fallback: "sans-serif" },
  { v: "--font-read", label: "Lesetext", fallback: "monospace" },
  { v: "--font-sans", label: "Sans (Body)", fallback: "sans-serif" },
  { v: "--font-mono", label: "Mono", fallback: "monospace" },
];
const QUICK = [".hero-name", ".hero-subtitle", ".projects-title", ".pcard-title", ".ptease-title", ".about-block", "body"];
const SHIPPED: [string, string][] = [
  ["Space Grotesk", "/fonts/ui/SpaceGrotesk-300-latin.woff2"],
  ["Source Serif 4", "/fonts/ui/SourceSerif4-400-latin.woff2"],
  ["Courier Prime", "/fonts/ui/CourierPrime-400-latin.woff2"],
  ["JetBrains Mono", "/fonts/ui/JetBrainsMono-400-latin.woff2"],
];
const SYSTEM = ["system-ui", "sans-serif", "serif", "monospace", "Georgia", "Times New Roman", "Arial", "Helvetica", "Verdana", "Courier New", "Impact"];
const RULE_FIELDS: { k: keyof Rule; css: string; label: string; ph: string }[] = [
  { k: "family", css: "font-family", label: "Font", ph: "z. B. Space Grotesk" },
  { k: "size", css: "font-size", label: "Größe", ph: "z. B. 2.4rem, 48px, clamp(…)" },
  { k: "weight", css: "font-weight", label: "Gewicht", ph: "400, 700 …" },
  { k: "lineHeight", css: "line-height", label: "Zeilenhöhe", ph: "1.2" },
  { k: "letterSpacing", css: "letter-spacing", label: "Laufweite", ph: "0.02em" },
];

const empty = (): State => ({ rootSize: 100, vars: {}, rules: {}, google: [], uploads: [] });

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    return s ? { ...empty(), ...s } : empty();
  } catch {
    return empty();
  }
}

// A bare name gets quoted plus a generic fallback; anything that already
// looks like a font stack (comma, quotes, var()) is used as typed.
function stack(value: string, fallback: string) {
  const v = value.trim();
  if (!v) return "";
  if (/[,"'(]/.test(v) || SYSTEM.slice(0, 4).includes(v)) return v;
  return `"${v}", ${fallback}`;
}

function ruleCss(sel: string, r: Rule, important: boolean) {
  const imp = important ? " !important" : "";
  const decls = RULE_FIELDS.filter((f) => r[f.k]?.trim()).map((f) => {
    const val = f.k === "family" ? stack(r.family!, "sans-serif") : r[f.k]!.trim();
    return `  ${f.css}: ${val}${imp};`;
  });
  return decls.length ? `${sel} {\n${decls.join("\n")}\n}` : "";
}

function buildCss(s: State, important: boolean) {
  const imp = important ? " !important" : "";
  const out: string[] = [];
  if (s.rootSize !== 100) out.push(`html {\n  font-size: ${s.rootSize}%${imp};\n}`);
  const vars = ROLES.filter((r) => s.vars[r.v]?.trim()).map((r) => `  ${r.v}: ${stack(s.vars[r.v], r.fallback)}${imp};`);
  // html[lang] too: i18n.css redefines the roles per language.
  if (vars.length) out.push(`${important ? ":root, html[lang]" : ":root"} {\n${vars.join("\n")}\n}`);
  for (const [sel, r] of Object.entries(s.rules)) {
    const css = ruleCss(sel, r, important);
    if (css) out.push(css);
  }
  return out.join("\n\n");
}

function selectorFor(el: Element): string {
  if (el === document.body) return "body";
  if (el.id) return `#${CSS.escape(el.id)}`;
  const cls = Array.from(el.classList).filter((c) => !/^(is-|has-|active|open)/.test(c));
  if (cls.length) return `.${cls.map((c) => CSS.escape(c)).join(".")}`;
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent || parent === document.body) return tag;
  return `${selectorFor(parent)} > ${tag}`;
}

export function mountFontTool(onChange: () => void) {
  let s = load();
  const fontNames = new Set<string>(["Koeeya Trial", "JetBrains Mono Variable", ...SHIPPED.map((f) => f[0]), ...SYSTEM]);

  const pageStyle = document.createElement("style");
  pageStyle.id = "font-tool-style";
  document.head.appendChild(pageStyle);

  let queued = false;
  const apply = () => {
    pageStyle.textContent = buildCss(s, true);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // Probably an upload too big for localStorage: keep it for this
      // session only, remember the rest.
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...s, uploads: [] }));
      } catch {}
    }
    if (queued) return;
    queued = true;
    // The hero name is painted into the cloth from computed styles: let
    // the new font load, then have main.ts re-measure and repaint.
    requestAnimationFrame(() => {
      queued = false;
      document.fonts.ready.then(onChange);
    });
  };

  for (const [name, url] of SHIPPED) {
    new FontFace(name, `url(${url})`).load().then((f) => document.fonts.add(f), () => {});
  }
  const addGoogle = (name: string) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}&display=swap`;
    document.head.appendChild(link);
    fontNames.add(name);
  };
  const addUpload = async (u: Upload) => {
    const buf = await (await fetch(u.data)).arrayBuffer();
    const face = await new FontFace(u.name, buf).load();
    document.fonts.add(face);
    fontNames.add(u.name);
  };
  s.google.forEach(addGoogle);
  Promise.all(s.uploads.map((u) => addUpload(u).catch(() => {}))).then(() => fillList());

  // ---- DOM -------------------------------------------------------------
  const host = document.createElement("div");
  host.dataset.lenisPrevent = "";
  host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000;";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; font: 12px/1.35 system-ui, sans-serif; }
  .toggle { position: fixed; left: 12px; bottom: 12px; pointer-events: auto; width: 40px; height: 40px;
    border-radius: 50%; border: 1px solid #555; background: #111; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
  .panel { position: fixed; left: 12px; bottom: 60px; width: 340px; max-height: calc(100vh - 80px); overflow: auto;
    pointer-events: auto; background: #151515f2; color: #eee; border: 1px solid #444; border-radius: 8px; padding: 10px; }
  .panel[hidden], .hl[hidden] { display: none; }
  h3 { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #aaa; margin: 12px 0 6px; }
  h3:first-child { margin-top: 0; }
  label { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 6px; margin: 4px 0; }
  input, button, select { background: #222; color: #eee; border: 1px solid #444; border-radius: 4px; padding: 4px 6px; min-width: 0; }
  button { cursor: pointer; }
  button:hover { border-color: #888; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin: 4px 0; }
  .row input { flex: 1; }
  .sample { padding: 2px 0 6px 116px; font-size: 18px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .muted { color: #999; }
  .chip { padding: 2px 6px; font-size: 11px; }
  .primary { background: #2b5cff; border-color: #2b5cff; color: #fff; font-weight: 700; }
  .hl { position: fixed; pointer-events: none; outline: 2px solid #2b5cff; background: #2b5cff22; }
  .rules div { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
  .rules code { font-family: ui-monospace, monospace; color: #9cf; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
<div class="hl" hidden></div>
<button class="toggle" type="button" title="Font-Tool (nur localhost)">Aa</button>
<div class="panel" hidden>
  <h3>Font-Rollen (ganze Seite)</h3>
  <div class="roles"></div>
  <label>Grundgröße <span class="row"><input class="root" type="range" min="70" max="160" step="5"><span class="rootv"></span></span></label>

  <h3>Element</h3>
  <div class="row"><button class="pick" type="button">🎯 Element wählen</button><span class="muted">oder:</span></div>
  <div class="row quick"></div>
  <label>Selektor <input class="sel" placeholder="z. B. .hero-name"></label>
  <div class="cands row"></div>
  <div class="computed muted"></div>
  <div class="fields"></div>
  <div class="row"><button class="minus" type="button">A−</button><button class="plus" type="button">A+</button><button class="clearrule" type="button">Element zurücksetzen</button></div>
  <div class="rules"></div>

  <h3>Fonts laden</h3>
  <div class="row"><input class="gname" placeholder="Google-Font-Name, z. B. Bebas Neue"><button class="gadd" type="button">laden</button></div>
  <div class="row"><input class="file" type="file" accept=".ttf,.otf,.woff,.woff2"></div>

  <h3>Ergebnis</h3>
  <div class="row"><button class="copy primary" type="button">CSS kopieren</button><button class="reset" type="button">Alles zurücksetzen</button><span class="msg muted"></span></div>
</div>
<datalist id="fonts"></datalist>`;

  const $ = <T extends Element = HTMLElement>(q: string) => root.querySelector(q) as unknown as T;
  const panel = $(".panel");
  const hl = $(".hl");
  const list = $("#fonts");
  const sel = $<HTMLInputElement>(".sel");
  const msg = $(".msg");

  function fillList() {
    list.innerHTML = Array.from(fontNames).map((n) => `<option value="${n.replace(/"/g, "&quot;")}"></option>`).join("");
  }
  fillList();

  // Font roles
  const roles = $(".roles");
  for (const r of ROLES) {
    const lab = document.createElement("label");
    lab.innerHTML = `${r.label}<input list="fonts">`;
    const sample = document.createElement("div");
    sample.className = "sample";
    sample.textContent = "Kevin Schaberl 0123 Äöü!";
    const inp = lab.querySelector("input")!;
    inp.placeholder = getComputedStyle(document.documentElement).getPropertyValue(r.v).trim().slice(0, 40);
    inp.value = s.vars[r.v] ?? "";
    const sync = () => {
      sample.style.fontFamily = stack(inp.value, r.fallback) || `var(${r.v})`;
    };
    sync();
    inp.addEventListener("input", () => {
      s.vars[r.v] = inp.value;
      sync();
      apply();
    });
    roles.append(lab, sample);
  }

  const rootIn = $<HTMLInputElement>(".root");
  const rootV = $(".rootv");
  rootIn.value = String(s.rootSize);
  rootV.textContent = `${s.rootSize}%`;
  rootIn.addEventListener("input", () => {
    s.rootSize = Number(rootIn.value);
    rootV.textContent = `${s.rootSize}%`;
    apply();
  });

  // Element rule editor
  const fields = $(".fields");
  const inputs = new Map<keyof Rule, HTMLInputElement>();
  for (const f of RULE_FIELDS) {
    const lab = document.createElement("label");
    lab.innerHTML = `${f.label}<input ${f.k === "family" ? 'list="fonts"' : ""} placeholder="${f.ph}">`;
    const inp = lab.querySelector("input")!;
    inp.addEventListener("input", () => {
      const key = sel.value.trim();
      if (!key) return;
      (s.rules[key] ??= {})[f.k] = inp.value;
      apply();
      renderRules();
    });
    inputs.set(f.k, inp);
    fields.append(lab);
  }

  const computed = $(".computed");
  function showSelector() {
    const key = sel.value.trim();
    const r = s.rules[key] ?? {};
    for (const [k, inp] of inputs) inp.value = r[k] ?? "";
    let el: Element | null = null;
    let n = 0;
    try {
      n = key ? document.querySelectorAll(key).length : 0;
      el = key ? document.querySelector(key) : null;
    } catch {
      computed.textContent = "Ungültiger Selektor";
      return;
    }
    if (!el) {
      computed.textContent = key ? "Kein Treffer auf der Seite" : "";
      return;
    }
    const cs = getComputedStyle(el);
    computed.textContent = `${n} Treffer · jetzt: ${cs.fontSize}, ${cs.fontWeight}, ${cs.fontFamily.slice(0, 60)}`;
  }
  sel.addEventListener("input", showSelector);

  const quick = $(".quick");
  for (const q of QUICK) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = q;
    b.addEventListener("click", () => {
      sel.value = q;
      $(".cands").innerHTML = "";
      showSelector();
    });
    quick.append(b);
  }

  // A+/A− scale the current size by 5 %, starting from the computed one.
  const nudge = (factor: number) => {
    const key = sel.value.trim();
    let el: Element | null = null;
    try {
      el = key ? document.querySelector(key) : null;
    } catch {}
    if (!el) return;
    const px = parseFloat(getComputedStyle(el).fontSize) * factor;
    (s.rules[key] ??= {}).size = `${Math.round(px * 10) / 10}px`;
    apply();
    showSelector();
    renderRules();
  };
  $(".plus").addEventListener("click", () => nudge(1.05));
  $(".minus").addEventListener("click", () => nudge(1 / 1.05));
  $(".clearrule").addEventListener("click", () => {
    delete s.rules[sel.value.trim()];
    apply();
    showSelector();
    renderRules();
  });

  const rulesBox = $(".rules");
  function renderRules() {
    rulesBox.innerHTML = "";
    for (const [key, r] of Object.entries(s.rules)) {
      if (!Object.values(r).some((v) => v?.trim())) continue;
      const row = document.createElement("div");
      const code = document.createElement("code");
      code.textContent = key;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "chip";
      edit.textContent = "bearbeiten";
      edit.addEventListener("click", () => {
        sel.value = key;
        showSelector();
      });
      row.append(code, edit);
      rulesBox.append(row);
    }
  }
  renderRules();

  // Picking: hover highlights, click takes the element. Every element
  // under the pointer (minus canvases, e.g. the cloth over the name) is
  // offered as a candidate, since the visible text is often a child of
  // what the pointer lands on, or hidden under a canvas.
  let picking = false;
  const candidatesAt = (x: number, y: number) =>
    document.elementsFromPoint(x, y).filter((e) => e !== host && e.tagName !== "CANVAS" && e !== document.documentElement).slice(0, 5);
  const onMove = (e: PointerEvent) => {
    const el = candidatesAt(e.clientX, e.clientY)[0];
    if (!el) return void (hl.hidden = true);
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    hl.hidden = false;
  };
  const stopPick = () => {
    picking = false;
    hl.hidden = true;
    document.removeEventListener("pointermove", onMove, true);
    document.removeEventListener("click", onClick, true);
    $(".pick").textContent = "🎯 Element wählen";
  };
  const onClick = (e: MouseEvent) => {
    if (e.composedPath().includes(host)) return;
    e.preventDefault();
    e.stopPropagation();
    const cands = candidatesAt(e.clientX, e.clientY);
    stopPick();
    const box = $(".cands");
    box.innerHTML = "";
    cands.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = selectorFor(c);
      b.title = (c.textContent || "").trim().slice(0, 80);
      b.addEventListener("click", () => {
        sel.value = b.textContent!;
        showSelector();
      });
      box.append(b);
      if (i === 0) sel.value = b.textContent;
    });
    showSelector();
  };
  $(".pick").addEventListener("click", () => {
    if (picking) return stopPick();
    picking = true;
    $(".pick").textContent = "Klick aufs Element (Esc = abbrechen)";
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("click", onClick, true);
  });
  document.addEventListener("keydown", (e) => {
    if (picking && e.key === "Escape") stopPick();
  });

  // Loading fonts
  const gname = $<HTMLInputElement>(".gname");
  $(".gadd").addEventListener("click", () => {
    const name = gname.value.trim();
    if (!name) return;
    if (!s.google.includes(name)) s.google.push(name);
    addGoogle(name);
    fillList();
    apply();
    msg.textContent = `„${name}“ geladen, jetzt oben auswählbar`;
    gname.value = "";
  });
  $<HTMLInputElement>(".file").addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const u = { name: file.name.replace(/\.[^.]+$/, ""), data: String(reader.result) };
      try {
        await addUpload(u);
        s.uploads = s.uploads.filter((x) => x.name !== u.name).concat(u);
        fillList();
        apply();
        msg.textContent = `„${u.name}“ geladen, jetzt oben auswählbar`;
      } catch {
        msg.textContent = "Datei ließ sich nicht als Font laden";
      }
    };
    reader.readAsDataURL(file);
  });

  // Result
  $(".copy").addEventListener("click", async () => {
    const extra = [
      ...s.google.map((g) => `Google Font: ${g}`),
      ...s.uploads.map((u) => `Lokale Datei: ${u.name}`),
    ];
    const css = buildCss(s, false);
    const text = `/* kev.dev Font-Tool${extra.length ? ` · ${extra.join(" · ")}` : ""} */\n${css || "/* keine Änderungen */"}\n`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      root.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    msg.textContent = "Kopiert ✓";
  });
  $(".reset").addEventListener("click", () => {
    s = { ...empty(), google: s.google, uploads: s.uploads };
    root.querySelectorAll<HTMLInputElement>(".roles input").forEach((i) => {
      i.value = "";
      i.dispatchEvent(new Event("input"));
    });
    rootIn.value = "100";
    rootV.textContent = "100%";
    sel.value = "";
    showSelector();
    renderRules();
    apply();
    msg.textContent = "Zurückgesetzt";
  });

  // Keys typed into the panel shouldn't reach the page's own shortcuts.
  panel.addEventListener("keydown", (e) => e.stopPropagation());
  $(".toggle").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });

  apply();
}
