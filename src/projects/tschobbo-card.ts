// TschoBBo's desktop card: the pipeline as a track on the left, a phone
// with an app for the bot in the middle — an illustration, the bot itself
// runs in a terminal and says so under the phone — and the texts as tabs on
// the right, first among them the station the ride is on. Scrolling over
// track or phone rides the five stations once (each plays its steps by
// itself), then the local AI step by step. Stations and steps are the
// engineering overlay's flows, loaded with it once the card comes near the
// screen. The phone: scroll-phone.ts.

import type { EngFlow, EngProject, EngStep } from "../engineering/types";
import { esc, type ProjectCard } from "./project-cards";
import { fitText } from "./big-cards";
import { LANG, pick, type Lang } from "../i18n";
import { paintStates, phoneStage, reduced, runPhone, wheelSteps } from "./scroll-phone";
import "./tschobbo-card.css";

const S = {
  pipeline: { de: "Pipeline", en: "Pipeline", ru: "Конвейер", ja: "パイプライン" },
  ai: { de: "Lokale KI", en: "Local AI", ru: "Локальный ИИ", ja: "ローカルAI" },
  station: { de: "Station", en: "Station", ru: "Этап", ja: "ステーション" },
  from: { de: "aus", en: "from", ru: "из", ja: "出典" },
  open: { de: "Im Engineering-Graph öffnen ↗", en: "Open in the engineering graph ↗", ru: "Открыть в инженерном графе ↗", ja: "エンジニアリンググラフで開く ↗" },
  note: {
    de: "App-Ansicht zur Illustration · TschoBBo läuft im Terminal",
    en: "App view for illustration · TschoBBo runs in a terminal",
    ru: "Вид приложения для наглядности · TschoBBo работает в терминале",
    ja: "説明用のアプリ画面 · TschoBBoはターミナルで動きます",
  },
  scrape: { de: "Scrapen", en: "Scraping", ru: "Сбор", ja: "収集" },
  filter: { de: "Filter", en: "Filter", ru: "Фильтр", ja: "フィルター" },
  letter: { de: "Anschreiben", en: "Cover letter", ru: "Письмо", ja: "応募文" },
  send: { de: "Versand", en: "Sending", ru: "Отправка", ja: "送信" },
  sync: { de: "Gmail-Sync", en: "Gmail sync", ru: "Синхр. Gmail", ja: "Gmail同期" },
  draft: { de: "Entwurf", en: "Draft", ru: "Черновик", ja: "下書き" },
  sendNow: { de: "Senden", en: "Send", ru: "Отправить", ja: "送信" },
  outbox: { de: "Postausgang", en: "Outbox", ru: "Исходящие", ja: "送信トレイ" },
  archive: { de: "Archiv", en: "Archive", ru: "Архив", ja: "アーカイブ" },
  rejudge: { de: "↻ neu urteilen", en: "↻ judge again", ru: "↻ оценить заново", ja: "↻ 再判定" },
  ready: { de: "Entwurf bereit", en: "Draft ready", ru: "Черновик готов", ja: "下書き完成" },
  fresh: { de: "↻ Status frisch", en: "↻ status fresh", ru: "↻ свежий статус", ja: "↻ 最新ステータス" },
  readOnly: { de: "◉ nur lesen", en: "◉ read only", ru: "◉ только чтение", ja: "◉ 読み取り専用" },
  no: { de: "Absage", en: "Rejection", ru: "Отказ", ja: "不採用" },
  yes: { de: "Zusage", en: "Offer", ru: "Согласие", ja: "内定" },
  portal: { de: "Portal", en: "Portal", ru: "Портал", ja: "ポータル" },
  onDemand: { de: "bei Bedarf", en: "on demand", ru: "по запросу", ja: "必要時" },
  oneModel: { de: "RAM · ein Modell", en: "RAM · one model", ru: "RAM · одна модель", ja: "RAM · モデル1つ" },
  prefix: { de: "fester Präfix", en: "fixed prefix", ru: "постоянный префикс", ja: "固定プレフィックス" },
} satisfies Record<string, Record<Lang, string>>;
const tx = (key: keyof typeof S) => S[key][LANG] ?? S[key].de;

const STATIONS = ["scrape", "filter", "letter", "send", "sync"] as const;
// The local AI on its own: the steps on the AI nodes, in the order they
// read best alone — backend, server, model in RAM, then what it does.
const AI_STEPS: [string, number][] = [["letter", 0], ["letter", 1], ["letter", 2], ["filter", 2], ["filter", 3], ["sync", 4]];
// The verdict colors of TschoBBo's own UI (fit, maybe, no).
const FIT = ["#5B8CFF", "#E8B04B", "#E8622A"];

const sk = (style = "") => `<i class="sp-sk" data-w${style ? ` style="${style}"` : ""}></i>`;
const rep = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join("");
const job = (attrs: string, w: number, extra = "") =>
  `<div class="sp-ol tb-job${attrs}" data-w><b class="sp-sk tb-lg" data-w></b><span class="tb-tx">${sk(`width:${w}%`)}${extra}</span></div>`;

// One screen per station (k = the station's own step) and one for the
// local AI (k = its step).
const screens = (mascot: string) => {
  const head = (name: string, right = `<span class="tb-live"></span>`) =>
    `<div class="tb-head">${mascot ? `<img src="${esc(mascot)}" alt="" />` : ""}<b>${esc(name)}</b>${right}</div>`;
  return `
  <div class="sp-page" data-page="scrape">
    ${head(tx("scrape"))}
    <div class="tb-portals" data-at="0">${rep(5, () => `<span class="tb-portal"><b class="sp-sk" data-w></b><i><u></u></i></span>`)}</div>
    <div class="tb-jobs">
      ${job("", 80, `<span class="tb-id sp-st" data-from="2" data-at="2">#a3f9</span>`)}
      ${job(" tb-dup", 80, `<span class="tb-id">#a3f9</span>`).replace("data-w>", 'data-w data-from="3">')}
      ${job("", 60, `<span class="tb-id sp-st" data-from="2">#07c2</span>`)}
      ${job(" tb-off", 70, `<span class="tb-id sp-st" data-from="4">offline ✓</span>`).replace("data-w>", 'data-w data-from="4" data-at="4">')}
      ${job("", 50)}
    </div>
    <span class="tb-pill sp-st" data-from="5" data-at="5">${esc(tx("archive"))}</span>
  </div>
  <div class="sp-page" data-page="filter">
    ${head(tx("filter"))}
    <span class="tb-scan sp-st" data-from="1" data-to="1"></span>
    <div class="tb-jobs">
      ${job(" tb-senior", 70, `<span class="tb-id tb-red">Senior …</span>`).replace("data-w>", 'data-w data-from="1" data-at="0">')}
      ${FIT.map((c, i) => job("", [80, 60, 75][i], `<span class="tb-jev sp-st" data-from="2"${i ? "" : ' data-at="2"'}>${["ABAC", "BBCA", "CCBC"][i].split("").map((l) => `<i>${l}</i>`).join("")}</span>`).replace("</span></div>", `</span><span class="tb-badge sp-st" data-from="4" style="background:${c}"></span></div>`)).join("")}
    </div>
    <div class="tb-prompt sp-st" data-from="3" data-to="3" data-at="3"><span class="tb-fix">${esc(tx("prefix"))}</span><span class="tb-var"></span></div>
    <span class="tb-pill sp-st" data-from="5" data-at="5">${esc(tx("rejudge"))}</span>
  </div>
  <div class="sp-page" data-page="letter">
    ${head(tx("letter"))}
    <div class="tb-power sp-st" data-from="0" data-at="0 1"><b>⏻</b><span>llama-server</span></div>
    <div class="tb-ram sp-st" data-from="2" data-at="2"><div class="tb-bar"><span class="tb-m tb-a">Gemma 4</span></div></div>
    <div class="tb-paper sp-st" data-from="3" data-at="3">
      ${[40, 92, 85, 90, 60, 88, 30].map((w) => `<i class="tb-ln" style="--w:${w}%"></i>`).join("")}
      <span class="tb-id8 sp-st" data-from="4" data-at="4">id8 · 3fa1c2d9</span>
    </div>
    <div class="tb-attempts sp-st" data-from="3" data-to="3"><i></i><i></i><i></i></div>
    <span class="tb-pill sp-st" data-from="5" data-at="5">${esc(tx("ready"))}</span>
  </div>
  <div class="sp-page" data-page="send">
    ${head(tx("send"))}
    <div class="tb-toggle sp-st" data-from="2" data-at="2"><span class="is-a">${esc(tx("draft"))}</span><span>${esc(tx("sendNow"))}</span></div>
    <div class="tb-proto sp-st" data-from="3" data-at="3"><span>${esc(tx("draft"))} → <b>IMAP</b></span><span>${esc(tx("sendNow"))} → <b>SMTP</b></span></div>
    <div class="tb-envwrap">
      <div class="tb-env" data-from="4"><span class="tb-lock sp-st" data-from="0" data-at="0">⚿</span></div>
      <span class="tb-pill tb-fresh sp-st" data-from="1" data-to="1">${esc(tx("fresh"))}</span>
    </div>
    <span class="tb-pill sp-st" data-from="5" data-at="5">${esc(tx("outbox"))}</span>
  </div>
  <div class="sp-page" data-page="sync">
    ${head(tx("sync"), `<span class="tb-eye sp-st" data-from="0" data-at="0">${esc(tx("readOnly"))}</span>`)}
    <div class="tb-inbox">
      <div class="tb-mail" data-at="1"><u style="background:${FIT[0]}"></u>${sk("width:80%")}</div>
      <div class="tb-mail tb-gap" data-from="3" data-at="3"><u></u>${sk("width:65%")}</div>
      <div class="tb-mail" data-at="2"><u style="background:var(--note-1)"></u>${sk("width:72%")}</div>
      <div class="tb-mail tb-gap" data-from="3"><u></u>${sk("width:55%")}</div>
      <div class="tb-mail"><u style="background:${FIT[1]}"></u>${sk("width:60%")}</div>
    </div>
    <div class="tb-kinds sp-st" data-from="4" data-at="4"><span>${esc(tx("no"))}</span><span class="is-a">${esc(tx("yes"))}</span><span>${esc(tx("portal"))}</span></div>
  </div>
  <div class="sp-page" data-page="ai">
    ${head(tx("ai"))}
    <div class="tb-sockets sp-st" data-from="0" data-at="0"><span>LlmProvider</span><i></i><i></i><i></i></div>
    <div class="tb-power tb-kpower sp-st" data-from="1" data-at="1"><b>⏻</b><span>llama-server · ${esc(tx("onDemand"))}</span></div>
    <div class="tb-ram tb-kram sp-st" data-from="2" data-at="2"><span class="tb-tiny">${esc(tx("oneModel"))}</span><div class="tb-bar"><span class="tb-m tb-a">Gemma 4</span><span class="tb-m tb-b">Nimble 9B</span></div></div>
    <div class="tb-fields sp-st" data-from="3" data-at="3">${["A", "C", "B"].map((l, i) => `<div>${sk(`width:${[70, 55, 80][i]}%`)}<i>${l}</i></div>`).join("")}</div>
    <div class="tb-prompt sp-st" data-from="4" data-at="4"><span class="tb-fix">${esc(tx("prefix"))}</span><span class="tb-var"></span></div>
    <div class="tb-kinds tb-kkinds sp-st" data-from="5" data-at="5"><span>${esc(tx("no"))}</span><span>${esc(tx("yes"))}</span><span>${esc(tx("portal"))}</span></div>
  </div>
  <div class="tb-toast" aria-hidden="true"></div>
  <div class="tb-tabbar">${rep(5, () => "<i></i>")}</div>`;
};

type Panel = { kind: string; heading: string; body: string };

// The card; `tabs` renders the text tabs (big-cards.ts) with the station first.
export function tbCard(card: ProjectCard, head: string, tabs: (first: Panel) => string): string {
  return `
    <article class="pcard pcard--big pcard--tb pcard--phone" data-card="${esc(card.id)}" style="--pc: ${card.accent}; --brand: ${card.accent}">
      ${head}
      <div class="tb">
        <section class="sp-box tb-trackbox">
          <p class="tb-boxhead"><span>${esc(tx("pipeline"))}</span><span class="tb-count"></span></p>
          <ol class="tb-track"></ol>
        </section>
        ${phoneStage(`<div class="tb-app">${screens(card.mascot?.src ?? "")}</div>`, "▮▮▮", esc(tx("note")))}
        ${tabs({ kind: "station", heading: tx("pipeline"), body: `<div class="tb-info" aria-live="polite"></div>` })}
      </div>
    </article>`;
}

export function initTschobbo(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".pcard--tb").forEach((el) => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        import("../engineering/data/tschobbo").then((m) => ride(el, m.tschobbo));
      },
      { rootMargin: "50%" },
    );
    io.observe(el);
  });
}

type Step = { flow: EngFlow; page: string; k: number; ai?: EngStep };

const IDLE_MS = 4000; // untouched this long, the ride goes on by itself
const AUTO_MS = 1250; // a station's own steps, one per this
const AI_AUTO_MS = 2600; // the local AI's steps when the ride goes by itself

function ride(el: HTMLElement, P: EngProject) {
  const flow = (id: string) => P.flows.find((f) => f.id === id)!;
  const steps: Step[] = [
    ...STATIONS.map((id) => ({ flow: flow(id), page: id, k: 0 })),
    ...AI_STEPS.map(([id, i], k) => ({ flow: flow(id), page: "ai", k, ai: flow(id).steps[i] })),
  ];
  const aiNodes = new Set(P.nodes.filter((n) => n.layer === "ai").map((n) => n.id));
  const stage = el.querySelector<HTMLElement>(".sp-stage")!;
  const pages = [...stage.querySelectorAll<HTMLElement>(".sp-page")];
  const track = el.querySelector<HTMLElement>(".tb-track")!;
  const info = el.querySelector<HTMLElement>(".tb-info")!;
  const panel = el.querySelector<HTMLElement>(".big-panel[data-panel='station']")!;
  const toast = el.querySelector<HTMLElement>(".tb-toast")!;
  const count = el.querySelector<HTMLElement>(".tb-count")!;
  const href = (f: EngFlow) => `#eng/tschobbo/${f.id}`;

  track.innerHTML = steps
    .map((s, i) =>
      s.ai
        ? `${s.k === 0 ? `<li class="tb-sep">${esc(tx("ai"))}</li>` : ""}<li class="tb-ai"><button type="button" data-i="${i}"><i></i>${esc(pick(s.ai.title))}</button></li>`
        : `<li class="tb-stn"><button type="button" data-i="${i}"><i>${i + 1}</i>${esc(tx(s.page as (typeof STATIONS)[number]))}</button></li>`,
    )
    .join("");
  track.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-i]");
    if (b) go(Number(b.dataset.i));
  });

  let cur = 0, sub = 0, subAt = 0, lastPoke = -1e9, stepAt = 0;
  const poke = () => (lastPoke = performance.now());

  // A station plays its own steps; the toast names the one it's on.
  const paintSub = () => {
    const s = steps[cur];
    if (s.ai) return;
    const page = pages.find((p) => p.dataset.page === s.page)!;
    paintStates(page, sub);
    page.querySelector(".tb-portals")?.classList.toggle("is-run", sub >= 1);
    const st = s.flow.steps[sub];
    toast.textContent = pick(st.title);
    info.querySelectorAll("li").forEach((li, j) => li.classList.toggle("is-on", j === sub));
    count.textContent = `${tx(s.page as (typeof STATIONS)[number])} · ${sub + 1} / ${s.flow.steps.length}`;
  };

  const ph = runPhone(stage, {
    palette: ["#9d57ff", ...FIT, "#cd57ff"],
    shift: () => cur * 0.07,
    shown: poke,
    frame: (now) => {
      if (reduced()) return;
      const s = steps[cur];
      if (now - lastPoke > IDLE_MS && now - stepAt > (s.ai ? AI_AUTO_MS : AUTO_MS * s.flow.steps.length))
        go(cur >= steps.length - 1 ? 0 : cur + 1, false);
      else if (!s.ai && now - subAt > AUTO_MS) {
        subAt = now;
        sub = (sub + 1) % s.flow.steps.length;
        paintSub();
      }
    },
  });

  function go(i: number, poked = true) {
    i = Math.max(0, Math.min(steps.length - 1, i));
    if (poked) poke();
    ph.kick(i >= cur ? 8 : -8);
    cur = i;
    stepAt = subAt = performance.now();
    const s = steps[i];
    pages.forEach((p) => p.classList.toggle("is-show", p.dataset.page === s.page));
    track.querySelectorAll<HTMLElement>("[data-i]").forEach((b) => {
      const j = Number(b.dataset.i);
      b.parentElement!.classList.toggle("is-on", j === i);
      b.parentElement!.classList.toggle("is-done", j < i);
    });
    el.querySelectorAll(".tb-tabbar i").forEach((t, j) => t.classList.toggle("is-on", !s.ai && j === i));
    if (s.ai) {
      paintStates(pages.find((p) => p.dataset.page === "ai")!, s.k);
      el.querySelector(".tb-kpower")!.classList.toggle("is-on", s.k >= 1);
      el.querySelector(".tb-kram")!.classList.toggle("is-swap", s.k >= 3);
      el.querySelectorAll(".tb-kkinds span").forEach((x, j) => x.classList.toggle("is-a", s.k === 5 && j === 0));
      toast.textContent = pick(s.ai.title);
      count.textContent = `${tx("ai")} · ${s.k + 1} / ${AI_STEPS.length}`;
      info.innerHTML = `
        <p class="tb-where tb-where--ai">${esc(tx("ai"))} · ${s.k + 1} / ${AI_STEPS.length} · ${esc(tx("from"))} „${esc(pick(s.flow.title).split(":")[0])}“</p>
        <h4>${esc(pick(s.ai.title))}</h4>
        <p>${esc(pick(s.ai.plain))}</p>
        <a class="tb-open" href="${href(s.flow)}">${esc(tx("open"))}</a>`;
    } else {
      info.innerHTML = `
        <p class="tb-where">${esc(tx("station"))} ${i + 1} / ${STATIONS.length} · ${esc(tx("pipeline"))}</p>
        <h4>${esc(pick(s.flow.title))}</h4>
        <ol>${s.flow.steps.map((x) => `<li${aiNodes.has(x.node) ? ' class="is-ai"' : ""}>${esc(pick(x.title))}</li>`).join("")}</ol>
        <a class="tb-open" href="${href(s.flow)}">${esc(tx("open"))}</a>`;
      // Without motion the station shows all its steps at once.
      sub = reduced() ? s.flow.steps.length - 1 : 0;
      paintSub();
    }
    ph.ripple();
    ph.rail(i / (steps.length - 1), steps.length);
    fitText(panel);
  }

  wheelSteps([el.querySelector(".tb-trackbox")!, stage], () => [cur, steps.length], (dir) => go(cur + dir));
  go(0, false);
}
