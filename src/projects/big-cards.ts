// The three big projects' desktop cards. Instead of the shared chrome
// (visual + Why?/Learned!/Code teaser boxes), each gets a structure of its
// own built from the same card data — YourBrand rides its module graph
// with a phone (yourbrand-card.ts).
// Phone list and sheet keep the shared layout (project-cards.ts).

import { cardBodies, esc, type MailFolder, type ProjectCard } from "./project-cards";
import { editor, orders, ramp, terminal, viewport } from "./project-visuals";
import { initYourBrand, ybCard } from "./yourbrand-card";
import { initPhones, phone } from "./kevdev-phone";
import { UI } from "../i18n/ui";
import "./big-cards.css";

// A decision reads "Head: the rest" or "Head — the rest"; the head becomes
// the list row's title, like a mail subject.
export function splitDecision(d: string): [string, string] {
  const m = d.match(/^(.{4,60}?)(?::| —) (.+)$/);
  return m ? [m[1], m[2]] : [d, ""];
}

// A tiny highlighter for the architecture excerpt: comments, strings and a
// few keywords — enough to read as code, not a parser.
function highlight(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const safe = esc(line);
      if (safe.trimStart().startsWith("//")) return `<span class="c">${safe}</span>`;
      return safe
        .replace(/&#39;[^&]*&#39;|'[^']*'/g, (m) => `<span class="s">${m}</span>`)
        .replace(/\b(type|interface|Promise)\b/g, (m) => `<span class="k">${m}</span>`);
    })
    .join("\n");
}

// The architecture pane: the pipeline as an aligned table, then the types.
function archPane(card: ProjectCard): string {
  if (!card.arch) return "";
  const w = Math.max(...card.arch.steps.map(([name]) => name.length)) + 2;
  const f = Math.max(...card.arch.steps.map(([, file]) => file.length)) + 2;
  const steps = card.arch.steps
    .map(
      ([name, file, status], i) =>
        `<span class="n">${String(i + 1).padStart(2, "0")}</span>  <span class="k">${esc(name.padEnd(w))}</span><span class="f">${esc(file.padEnd(f))}</span><span class="o">→</span> <span class="s">${esc(status)}</span>`,
    )
    .join("\n");
  return `
    <div class="mail-code" data-pane="arch" hidden>
      <p class="mail-code-head"><span>pipeline</span><span>${esc(UI.boxCode)}</span></p>
      <pre><code>${steps}</code></pre>
      <div class="mail-code-blocks">${card.arch.code
        .split("\n\n")
        .map((block) => `<pre><code>${highlight(block)}</code></pre>`)
        .join("")}</div>
    </div>`;
}

// The fit colors the JobBot list uses (match / off-stack / brutal).
const FIT = ["#5B8CFF", "#E8B04B", "#E8622A"];

// TschoBBo: the card as the bot's own mail client — folders on the left,
// the picked folder's mails in the middle, the picked mail as a letter on
// paper. "Code + Architektur" lists the decisions and opens on the code.
// Clicks are wired in initBigCards.
function mailCard(card: ProjectCard, head: string): string {
  const box = card.mailbox;
  const mails = (folder: MailFolder, first: [string, string]) => [first, ...(box?.[folder] ?? [])];
  const folders: { id: string; label: string; mails: [string, string][] }[] = [
    { id: "what", label: UI.lblWhat, mails: mails("what", [card.title, card.what ?? ""]) },
    { id: "why", label: UI.boxWhy, mails: mails("why", [card.learnGoal, ""]) },
    { id: "learned", label: UI.boxLearned, mails: mails("learned", [UI.lblChallenge, card.challenge ?? ""]) },
    { id: "arch", label: UI.boxCode, mails: (card.decisions ?? []).map((d) => splitDecision(d)) },
    { id: "origin", label: UI.lblOrigin, mails: mails("origin", [UI.lblOrigin, card.origin ?? ""]) },
  ];
  const gh = card.links?.find((l) => l.href);
  // The decisions' letters show the whole decision, not just its tail.
  const body = (f: string, i: number, text: string) => (f === "arch" ? card.decisions![i] : text);

  return `
    <article class="pcard pcard--big pcard--mail" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="mail">
        <div class="mail-bar" aria-hidden="true"><i></i><i></i><i></i><span>jobbot :// ${esc(card.title)}</span></div>
        <div class="mail-panes">
          <nav class="mail-folders">
            <p class="mail-logo" aria-hidden="true">jobbot <span>://</span></p>
            ${folders
              .map(
                (f, i) =>
                  `<button type="button" class="mail-folder" data-folder="${f.id}" aria-pressed="${i === 0}"><span>${esc(f.label)}</span><span class="mail-n">${f.mails.length}</span></button>`,
              )
              .join("")}
            ${card.mascot ? `<img class="mail-mascot" src="${esc(card.mascot.src)}" alt="${esc(card.mascot.alt)}" loading="lazy" decoding="async" />` : ""}
          </nav>
          <div class="mail-list">
            ${folders
              .map(
                (f, fi) => `
              <div class="mail-group" data-list="${f.id}"${fi === 0 ? "" : " hidden"}>
                <p class="mail-list-head">${esc(f.label)}</p>
                ${f.mails
                  .map(
                    ([title, text], i) => `
                <button type="button" class="mail-row" data-mail="${f.id}-${i}" aria-pressed="${fi === 0 && i === 0}">
                  <i style="background: ${FIT[i % FIT.length]}"></i>
                  <span><b>${esc(title)}</b><span>${esc(text)}</span></span>
                </button>`,
                  )
                  .join("")}
              </div>`,
              )
              .join("")}
            <ul class="mail-tags">${(card.tags ?? []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
          <div class="mail-read">
            ${archPane(card)}
            <article class="mail-paper">
              <div class="mail-stamp" aria-hidden="true">
                ${card.mascot ? `<img src="${esc(card.mascot.src)}" alt="" loading="lazy" decoding="async" />` : ""}
                <span>${esc(UI.touchStamp)}</span>
              </div>
              ${folders
                .flatMap((f, fi) =>
                  f.mails.map(
                    ([title, text], i) => `
                <div class="mail-pane" data-pane="${f.id}-${i}"${fi === 0 && i === 0 ? "" : " hidden"}>
                  <p class="mail-kicker">${esc(f.label)}</p>
                  <h4>${esc(title)}</h4>
                  ${body(f.id, i, text) ? `<p>${esc(body(f.id, i, text))}</p>` : ""}
                </div>`,
                  ),
                )
                .join("")}
            </article>
            ${gh ? `<a class="mail-send" href="${esc(gh.href!)}" target="_blank" rel="noopener noreferrer">${esc(gh.label)} ↗</a>` : ""}
          </div>
        </div>
      </div>
    </article>
  `;
}

// The card's texts (Why? / Learned! / Code, cardBodies) as tabs, with any
// extra panels first — a box every big card can use. Clicks: initBigCards.
type Panel = { kind: string; heading: string; body: string };
function textTabs(card: ProjectCard, extra: Panel[] = [], edit = (p: Panel) => p): string {
  const panels = [...extra, ...cardBodies(card)].map(edit);
  const id = (kind: string) => `big-${esc(card.id)}-${kind}`;
  return `
    <section class="big-text" data-tabs>
      <div class="big-tabs" role="tablist">
        ${panels
          .map(
            (b, i) =>
              `<button type="button" role="tab" id="${id(b.kind)}-tab" aria-controls="${id(b.kind)}" aria-selected="${i === 0}" data-tab="${b.kind}">${b.heading}</button>`,
          )
          .join("")}
      </div>
      ${panels
        .map(
          (b, i) =>
            `<div class="big-panel" role="tabpanel" id="${id(b.kind)}" aria-labelledby="${id(b.kind)}-tab" data-panel="${b.kind}"${i === 0 ? "" : " hidden"}>${b.body}</div>`,
        )
        .join("")}
    </section>`;
}

// kev.dev: Why? / Learned! / Code as tabs on the left, in the middle a
// phone with this page in skeletons (kevdev-phone.ts), on the right the
// page's own sections as tabs over one table — what each does, the files
// behind it, what of it is reusable and, where there are some, pros and
// cons. Scrolling the phone picks the tab, a tab scrolls the phone.
function partsCard(card: ProjectCard, head: string): string {
  const story = UI.vizStory;
  const parts = Array.from({ length: Math.max(story.length, card.parts?.length ?? 0) }, (_, i) => {
    const part = card.parts?.[i] ?? { does: "", files: [], reuse: "" };
    return { ...part, name: part.name ?? story[i]?.[0] ?? "", line: part.line ?? story[i]?.[1] ?? "" };
  });
  const pid = (i: number) => `parts-${esc(card.id)}-${i}`;
  const list = (items?: string[]) => (items?.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  return `
    <article class="pcard pcard--big pcard--parts pcard--phone" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head.replace("</header>", `<span class="parts-here" aria-hidden="true">${esc(UI.touchHere)}</span></header>`)}
      <div class="parts">
        ${textTabs(card)}
        ${phone(parts.map((p) => p.name))}
        <div class="parts-side">
          <p class="parts-head">${esc(UI.partsHead)}</p>
          <section class="parts-box" data-tabs>
            <div class="parts-tabbar" role="tablist">
              ${parts
                .map(
                  (p, i) =>
                    `<button type="button" role="tab" id="${pid(i)}-tab" aria-controls="${pid(i)}" aria-selected="${i === 0}" data-tab="p${i}"><i>${String(i + 1).padStart(2, "0")}</i> ${esc(p.name)}</button>`,
                )
                .join("")}
            </div>
            ${parts
              .map(
                (p, i) => `
            <div class="parts-panel" role="tabpanel" id="${pid(i)}" aria-labelledby="${pid(i)}-tab" data-panel="p${i}"${i === 0 ? "" : " hidden"}>
              <div class="parts-top">
                <p><b>${esc(p.name)}</b><span>${esc(p.line)}</span></p>
              </div>
              <table class="parts-table">
                <tbody>
                  <tr><th scope="row">${esc(UI.partsDoes)}</th><td>${esc(p.does)}</td></tr>
                  <tr><th scope="row">${esc(UI.partsFiles)}</th><td>${p.files.map((f) => `<code>${esc(f)}</code>`).join(" ")}</td></tr>
                  <tr><th scope="row">${esc(UI.partsReuse)}</th><td>${esc(p.reuse)}</td></tr>
                  ${
                    p.pros?.length || p.cons?.length
                      ? `<tr><td colspan="2"><div class="parts-procon">
                    <div class="parts-pro"><p>${esc(UI.partsPros)}</p>${list(p.pros)}</div>
                    <div class="parts-con"><p>${esc(UI.partsCons)}</p>${list(p.cons)}</div>
                  </div></td></tr>`
                      : ""
                  }
                </tbody>
              </table>
            </div>`,
              )
              .join("")}
          </section>
        </div>
      </div>
    </article>
  `;
}

// Text boxes never scroll: each one shrinks its type in small steps until
// its text fits (no further than MIN_FIT). The box's content zooms by the
// --fit factor (big-cards.css). A ResizeObserver refits on resize
// and when a hidden tab panel shows (its size goes from 0); content that
// changes in place (TschoBBo's letters) calls fitText itself.
const FIT_BOXES = ".big-panel, .parts-panel, .mail-list, .mail-paper, .mail-code";
const MIN_FIT = 0.65;

export function fitText(el: HTMLElement) {
  if (el.hidden || !el.clientHeight) return;
  let fit = 1;
  el.style.setProperty("--fit", "1");
  const over = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
  while (over() && fit > MIN_FIT) {
    fit = Math.round((fit - 0.04) * 100) / 100;
    el.style.setProperty("--fit", String(fit));
  }
}

// A folder shows its mails and opens the first (the architecture folder
// opens on its code instead); a mail shows its letter. One listener per
// big card; the cards are rendered once, so nothing to tear down.
export function initBigCards(root: HTMLElement, cards: ProjectCard[]) {
  initYourBrand(root, cards);
  initPhones(root);
  const boxes = Array.from(root.querySelectorAll<HTMLElement>(`.pcard--big :is(${FIT_BOXES})`));
  const sizes = new ResizeObserver((entries) => entries.forEach((e) => fitText(e.target as HTMLElement)));
  boxes.forEach((box) => sizes.observe(box));
  // The web fonts change every line's width once they're in.
  document.fonts?.ready.then(() => boxes.forEach(fitText));

  root.querySelectorAll<HTMLElement>(".pcard--mail").forEach((card) => {
    const paper = card.querySelector<HTMLElement>(".mail-paper");
    const show = (pane: string) => {
      card.querySelectorAll<HTMLElement>("[data-pane]").forEach((el) => {
        el.hidden = el.dataset.pane !== pane;
      });
      // The architecture is code, not a letter: no paper behind it.
      if (paper) {
        paper.hidden = pane === "arch";
        paper.scrollTo(0, 0);
      }
      card.querySelectorAll<HTMLElement>(".mail-row").forEach((row) => {
        row.setAttribute("aria-pressed", String(row.dataset.mail === pane));
      });
      // The reading side first: its size settles the row the list sits in.
      [".mail-code", ".mail-paper", ".mail-list"].forEach((sel) => {
        const box = card.querySelector<HTMLElement>(sel);
        if (box) fitText(box);
      });
    };
    card.addEventListener("click", (e) => {
      const target = e.target as Element;
      const folder = target.closest<HTMLElement>("[data-folder]");
      if (folder) {
        const id = folder.dataset.folder!;
        card.querySelectorAll<HTMLElement>("[data-folder]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn === folder)));
        card.querySelectorAll<HTMLElement>("[data-list]").forEach((list) => {
          list.hidden = list.dataset.list !== id;
        });
        card.querySelector(".mail-list")?.scrollTo(0, 0);
        show(id === "arch" && card.querySelector("[data-pane='arch']") ? "arch" : `${id}-0`);
        return;
      }
      const mail = target.closest<HTMLElement>("[data-mail]");
      if (mail) show(mail.dataset.mail!);
    });
  });
  // Every tab box (textTabs and the like): a tab shows its panel within
  // its own [data-tabs] box.
  root.addEventListener("click", (e) => {
    const tab = (e.target as Element).closest<HTMLElement>(".pcard--big [data-tab]");
    const box = tab?.closest<HTMLElement>("[data-tabs]");
    if (!tab || !box) return;
    box.querySelectorAll<HTMLElement>(":scope > [role=tablist] [data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    box.querySelectorAll<HTMLElement>(":scope > [data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab.dataset.tab;
    });
  });
}

// AniScript: a player with its six features pinned where they act, and
// the script as an editor — its real header first, then the texts as tabs.
function aniCard(card: ProjectCard, head: string): string {
  const f = card.features ?? [];
  const pin = (n: number) => `<b class="ani-pin">${n}</b>${esc(f[n - 1] ?? "")}`;
  const lines = (card.points?.[0] ?? "").trim();
  return `
    <article class="pcard pcard--big pcard--ani" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="ani">
        <section class="ani-side">
          <div class="ani-player" aria-hidden="true">
            <span class="ani-theater">${pin(6)}</span>
            <span class="ani-next">${pin(3)}</span>
            <span class="ani-skip"><svg viewBox="0 0 24 24"><path d="M5 5l9 7-9 7z"/><path d="M19 5v14"/></svg>${pin(2)}</span>
            <span class="ani-keys">${pin(4).replace(/ ?X\/C\/V\/B/, "")}<kbd>X</kbd><kbd>C</kbd><kbd>V</kbd><kbd>B</kbd></span>
            <div class="ani-bar">
              <div class="ani-track"><i class="ani-intro"></i><i class="ani-seen"></i><i class="ani-head"></i></div>
              <p><span><svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>${pin(1)}</span><span>${pin(5)}</span></p>
            </div>
          </div>
          <ol class="ani-legend">${f.map((x, i) => `<li><b>${i + 1}</b>${esc(x)}</li>`).join("")}</ol>
        </section>
        <section class="ani-side">
          ${textTabs(card, [{ kind: "script", heading: "aniscript.user.js", body: editor(card) }])}
          <div class="ani-facts">
            <div class="ani-fact">
              <p>${esc(lines)}</p>
              <div class="ani-lines" aria-hidden="true"><span>~5000</span><i style="width: 100%"></i><span>~800</span><i class="is-now" style="width: 16%"></i></div>
            </div>
            <div class="ani-fact">
              <p>${esc(UI.boxLearned)}</p>
              <p class="ani-fix">Violentmonkey → ScriptCat <b>✓</b></p>
              <p>Manifest V2 → V3</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  `;
}

// ReleaseWatcher: its CLI as the terminal it runs in, under it the one
// interface its four API adapters sit behind (each with its quirk); the
// texts as tabs beside them, the whole height.
function watchCard(card: ProjectCard, head: string): string {
  const sources = card.sources ?? [];
  return `
    <article class="pcard pcard--big pcard--watch" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="watch">
        <section class="watch-term">
          ${terminal(card)}
          <div class="watch-arch">
            <p class="watch-iface">interface Source</p>
            <ul class="watch-adapters" style="--n: ${sources.length}">
              ${sources.map(([name, quirk]) => `<li><b>${esc(name)}</b><span>${esc(quirk)}</span></li>`).join("")}
            </ul>
          </div>
        </section>
        <section class="watch-side">
          ${textTabs(card)}
        </section>
      </div>
    </article>
  `;
}

// Oskalizer: the playground's full screen in the animal mode, the keys
// being hammered and Esc held to quit; beside it the modes as they came
// (the first retired) and the texts — Learned! with the speech queue that
// drops what's stale.
function keysCard(card: ProjectCard, head: string): string {
  const modes = card.modes ?? [];
  const keys: [string, string][] = [["Q", ""], ["W", "var(--note-6)"], ["E", ""], ["A", "var(--pc)"], ["S", ""], ["D", "var(--note-3)"], ["F", ""]];
  const queue = `
    <ol class="keys-queue" aria-hidden="true">
      <li><span>#41</span><span>Q</span><b>✕</b></li>
      <li><span>#42</span><span>W</span><b>✕</b></li>
      <li class="is-on"><span>#43</span><span>„A wie Affe“</span><b>▶</b></li>
    </ol>`;
  return `
    <article class="pcard pcard--big pcard--keyscard" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="keys">
        <section class="keys-stage" aria-hidden="true">
          <span class="keys-mode">${esc(modes[1]?.[0] ?? "")}</span>
          <div class="keys-show">
            <span class="keys-letter">A</span>
            <div class="keys-say">
              <span class="keys-animal">🐒</span>
              <span class="keys-voice"><svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>„A wie Affe“</span>
            </div>
          </div>
          <div class="keys-row">
            ${keys.map(([k, c]) => `<kbd${c ? ` class="is-hit" style="--hit: ${c}"` : ""}>${k}</kbd>`).join("")}
            <kbd class="keys-esc">Esc<i></i></kbd>
          </div>
          <p class="keys-note">${esc(splitDecision(card.decisions?.[0] ?? "")[1] || (card.decisions?.[0] ?? ""))}</p>
        </section>
        <section class="keys-side">
          ${textTabs(
            card,
            [
              {
                kind: "modes",
                heading: esc(UI.keysModes),
                body: `<ol class="keys-modes">${modes
                  .map(([name, text], i) => `<li class="${i === 0 ? "is-retired" : i === 1 ? "is-on" : ""}"><b><i>${i + 1}</i> ${esc(name)}</b><span>${esc(text)}</span></li>`)
                  .join("")}</ol>`,
              },
            ],
            (p) => (p.kind === "learned" ? { ...p, body: queue + p.body } : p),
          )}
        </section>
      </div>
    </article>
  `;
}

// The renderer: its climb from the first formula to the skull CT, the
// viewport in the middle (the whole thing starts the live widget, like the
// small card's), and how it works — the same math as widgets/renderer.ts —
// as the first tab before the texts.
function rendererCard(card: ProjectCard, head: string): string {
  const steps = card.steps ?? [];
  const live = card.facets?.includes("live-demo") ? `data-card="${esc(card.id)}" data-facet="live-demo"` : "disabled";
  const shades = Array.from({ length: 16 }, (_, i) => `<i style="--d: ${i}"></i>`).join("");
  const how = `
    <div class="render-how">
      <div><b>${esc(UI.rPerspective)}</b><code>x′ = x / z<br>y′ = y / z</code><span>${esc(UI.rPerspectiveText)}</span></div>
      <div><b>${esc(UI.rRotation)}</b><code>x′ = x·cos θ − z·sin θ<br>z′ = x·sin θ + z·cos θ</code><span>${esc(UI.rRotationText)}</span></div>
      <div><b>${esc(UI.rDepth)}</b><p class="render-shades" aria-hidden="true">${shades}</p><span>${esc(UI.rDepthText)}</span></div>
    </div>`;
  return `
    <article class="pcard pcard--big pcard--render" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="render">
        <section class="render-steps">
          <ol>${steps.map((s, i) => `<li class="${i === steps.length - 1 ? "is-goal" : ""}"><b>${String(i + 1).padStart(2, "0")}</b>${esc(s)}</li>`).join("")}</ol>
          <p>${esc(card.decisions?.[card.decisions.length - 1] ?? "")}</p>
        </section>
        <section class="render-view">
          ${viewport(card)}
          <div class="render-bar">
            <span>${esc(UI.rModel)}: ${Object.values(UI.rModels).map(esc).join(" · ")}</span>
            <button type="button" ${live}>${esc(UI.vizSpin)}</button>
          </div>
        </section>
        ${textTabs(card, [{ kind: "how", heading: esc(UI.rHow), body: how }])}
      </div>
    </article>
  `;
}

// Loadtest: the latest ramp as the check reads it, under it the engine
// with the targets it runs against (each with the files that describe
// it); the texts as tabs beside them, the whole height.
function rampCard(card: ProjectCard, head: string): string {
  const targets: [string, string][] = [
    ["yourbrand", "endpoints.tsv · weights.tsv"],
    ["shop", "target.sh · actions.sh"],
  ];
  return `
    <article class="pcard pcard--big pcard--rampcard" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="watch">
        <section class="watch-term">
          ${ramp(card)}
          <div class="watch-arch">
            <p class="watch-iface">engine · loadgen (C++17)</p>
            <ul class="watch-adapters" style="--n: ${targets.length}">
              ${targets.map(([name, files]) => `<li><b>${esc(name)}</b><span>${esc(files)}</span></li>`).join("")}
            </ul>
          </div>
        </section>
        <section class="watch-side">
          ${textTabs(card)}
        </section>
      </div>
    </article>
  `;
}

// Shop: an order's way through its status machine, under it the risk
// rules that decide which way it goes (names and defaults as the shop's
// system settings have them); the texts as tabs beside them.
function ordersCard(card: ProjectCard, head: string): string {
  const rules: [string, string][] = [
    ["amount_high", "≥ 150 €"],
    ["new_buyer", "≥ 50 €"],
    ["velocity", "≥ 3 / h"],
    ["card_reuse", "≥ 2"],
    ["previous_dispute", ""],
    ["radar_elevated", ""],
  ];
  return `
    <article class="pcard pcard--big pcard--orderscard" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="watch">
        <section class="watch-term">
          ${orders()}
          <ul class="orders-rules">
            ${rules.map(([name, at]) => `<li><code>${esc(name)}</code>${at ? `<span>${esc(at)}</span>` : ""}</li>`).join("")}
          </ul>
        </section>
        <section class="watch-side">
          ${textTabs(card)}
        </section>
      </div>
    </article>
  `;
}

// Which layouts have a desktop card of their own (renderBigCard). The
// carousel centres those and sizes them to the space (data-big, main.ts).
const BIG_LAYOUTS = new Set(["blueprint", "inbox", "storyboard", "editor", "terminal", "keys", "viewport", "ramp", "orders"]);
export const hasBigCard = (card: ProjectCard) => BIG_LAYOUTS.has(card.layout);

// The big card for this project, or "" to fall back to the shared layout.
export function renderBigCard(card: ProjectCard, head: string): string {
  switch (card.layout) {
    case "blueprint":
      return ybCard(card, head, (first) => textTabs(card, [first]));
    case "inbox":
      return mailCard(card, head);
    case "storyboard":
      return partsCard(card, head);
    case "editor":
      return aniCard(card, head);
    case "terminal":
      return watchCard(card, head);
    case "keys":
      return keysCard(card, head);
    case "viewport":
      return rendererCard(card, head);
    case "ramp":
      return rampCard(card, head);
    case "orders":
      return ordersCard(card, head);
    default:
      return "";
  }
}
