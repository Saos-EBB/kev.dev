// YourBrand's desktop card as its database diagram: five tables (project,
// core, tenant, tier, module), lines from row to row — who books which
// module, which tier a tenant has, which module needs another — and an
// inspector top right with whatever row is picked. Three flows walk
// through the diagram step by step. The rows and their texts come from
// the card's own data (already in the visitor's language); only the
// lines, the flows and the chrome are new here, all four languages inline.
// The lines are an SVG over the measured rows, like the highlight graphs
// (src/graph/main.ts), redrawn whenever the card's layout moves.

import { esc, TENANT_MODULES, type Detail, type ProjectCard } from "./project-cards";
import { LANG, type Lang } from "../i18n";
import { UI } from "../i18n/ui";
import { fitText, splitDecision, vizHours, vizList, vizStack, vizTimeline } from "./big-cards";

type Text = Record<Lang, string>;
const tx = (t: Text) => t[LANG] ?? t.de;

const S = {
  idleTitle: { de: "Klick auf eine Zeile", en: "Click a row", ru: "Нажмите на строку", ja: "行をクリック" },
  idleText: {
    de: "Jede Zeile ist ein Teil von YourBrand. Die Linien zeigen, wer was bucht und was wovon abhängt; hier steht, was zum Angeklickten gehört.",
    en: "Every row is a part of YourBrand. The lines show who books what and what depends on what; this box shows whatever you click.",
    ru: "Каждая строка — часть YourBrand. Линии показывают, кто что подключает и что от чего зависит; здесь — всё о выбранном.",
    ja: "各行はYourBrandの一部です。線は誰が何を契約し、何が何に依存するかを示します。クリックした項目の内容がここに表示されます。",
  },
  flows: { de: "Flows", en: "Flows", ru: "Сценарии", ja: "フロー" },
  connected: { de: "Verbunden mit", en: "Connected to", ru: "Связано с", ja: "つながり" },
  inFlows: { de: "In Flows", en: "In flows", ru: "В сценариях", ja: "登場するフロー" },
  context: { de: "Kontext", en: "context", ru: "контекст", ja: "文脈" },
  prev: { de: "Zurück", en: "Back", ru: "Назад", ja: "戻る" },
  next: { de: "Weiter", en: "Next", ru: "Дальше", ja: "次へ" },
  done: { de: "Fertig", en: "Done", ru: "Готово", ja: "完了" },
  close: { de: "Schließen", en: "Close", ru: "Закрыть", ja: "閉じる" },
  bookedBy: { de: "Gebucht von", en: "Booked by", ru: "Подключили", ja: "契約テナント" },
  premiumNote: { de: "Matching gibt es erst ab Premium.", en: "Matching only comes with Premium.", ru: "Матчинг доступен только с Premium.", ja: "マッチングはPremiumからです。" },
  lgBooks: { de: "n : m · bucht", en: "n : m · books", ru: "n : m · подключает", ja: "n : m · 契約" },
  lgTier: { de: "n : 1 · Tier", en: "n : 1 · tier", ru: "n : 1 · тариф", ja: "n : 1 · ティア" },
  lgNeeds: { de: "braucht", en: "needs", ru: "нужен", ja: "必要" },
  lgContext: { de: "Kontext, bei Auswahl", en: "context, when picked", ru: "контекст, при выборе", ja: "文脈（選択時）" },
} satisfies Record<string, Text>;

const step = (n: number, total: number) =>
  tx({ de: `Schritt ${n} von ${total}`, en: `Step ${n} of ${total}`, ru: `Шаг ${n} из ${total}`, ja: `ステップ ${n} / ${total}` });
const tenantCount = (n: number) => tx({ de: `${n} Mand.`, en: `${n} ten.`, ru: `${n} аренд.`, ja: `${n}テナント` });
const stats = (tenants: number, modules: number, lines: number) =>
  tx({
    de: `${tenants} Mandanten · ${modules} Module · ${lines} Linien`,
    en: `${tenants} tenants · ${modules} modules · ${lines} lines`,
    ru: `${tenants} арендаторов · ${modules} модулей · ${lines} линий`,
    ja: `テナント${tenants} · モジュール${modules} · 線${lines}`,
  });

const L = {
  books: { de: "bucht", en: "books", ru: "подключает", ja: "契約" },
  tier: { de: "hat Tier", en: "has tier", ru: "имеет тариф", ja: "ティア" },
  needs: { de: "braucht", en: "needs", ru: "нужен", ja: "必要" },
  builds: { de: "baut auf", en: "builds on", ru: "строится на", ja: "の上に構築" },
  ownDb: { de: "eigene Datenbank", en: "own database", ru: "своя база данных", ja: "専用データベース" },
  experiment: { de: "der experimentelle Teil", en: "the experimental part", ru: "экспериментальная часть", ja: "実験的な部分" },
  silo: { de: "Silo-DB pro Mandant", en: "silo DB per tenant", ru: "отдельная БД на арендатора", ja: "テナントごとのサイロDB" },
  sockets: { de: "WebSockets", en: "WebSockets", ru: "WebSockets", ja: "WebSocket" },
  webhooks: { de: "Stripe-Webhooks", en: "Stripe webhooks", ru: "вебхуки Stripe", ja: "Stripe Webhook" },
  radius: { de: "PostGIS-Umkreis", en: "PostGIS radius", ru: "радиус PostGIS", ja: "PostGISの半径検索" },
  coins: { de: "Coins und Battles", en: "coins and battles", ru: "монеты и баттлы", ja: "コインとバトル" },
  premium: { de: "ab Premium", en: "from Premium", ru: "с Premium", ja: "Premiumから" },
} satisfies Record<string, Text>;

// --- rows --------------------------------------------------------------

type TableId = "project" | "core" | "tenant" | "tier" | "module";
const TABLE_COLOR: Record<TableId, string> = {
  project: "var(--pc)",
  core: "var(--note-3)",
  tenant: "var(--note-7)",
  tier: "var(--note-2)",
  module: "var(--note-6)",
};

interface Row {
  id: string;
  table: TableId;
  key?: string;
  swatch?: string;
  attr: string;
  type?: string;
  wip?: boolean;
  title: string;
  body: string;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const p = (s?: string) => (s ? `<p>${esc(s)}</p>` : "");
const ul = (items: string[]) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
const detail = (d?: Detail) => (d ? p(d.about) + ul(d.points) : "");
const LAYER_IDS = ["l4", "l3", "l2", "l1"];

function buildRows(card: ProjectCard): Map<TableId, Row[]> {
  const tenants = card.tenants ?? [];
  const links = (card.links ?? [])
    .map((l) => (l.href ? `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>` : esc(l.label)))
    .join(" · ");
  const project: Row[] = [
    { id: "why", table: "project", key: "PK", attr: "why", type: "text", title: UI.lblGoal, body: p(card.learnGoal) + p(card.what) },
    { id: "learned", table: "project", attr: "learned", type: "text", title: UI.boxLearned, body: p(card.challenge) },
    { id: "arch", table: "project", attr: "architecture", type: "text[]", title: UI.boxCode, body: ul((card.decisions ?? []).map((d) => splitDecision(d)[0])) },
    { id: "hours", table: "project", attr: "hours", type: "int", title: "hours", body: p(card.meta) + (card.hoursChart ? vizHours(card.hoursChart) : "") },
    { id: "timeline", table: "project", attr: "timeline", type: "date[]", title: "timeline", body: (card.timelineChart ? vizTimeline(card.timelineChart) : "") + p(card.origin) },
    { id: "repo", table: "project", attr: "repo", type: "url", title: "repo", body: `<p>${links}</p><ul class="er-tags">${(card.tags ?? []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` },
  ];
  const core: Row[] = UI.vizLayers.map(([name, sub], i) => ({
    id: LAYER_IDS[i],
    table: "core",
    key: `L${UI.vizLayers.length - i}`,
    attr: name,
    title: `${name} · ${sub}`,
    body: detail(card.layers?.[i]) + vizStack(i, false),
  }));
  const tenant: Row[] = tenants.map((t) => ({
    id: slug(t.name),
    table: "tenant",
    swatch: t.color,
    attr: t.name,
    type: t.tier,
    title: t.name,
    body: `<p><b>${esc(t.kind)}</b></p>${p(t.about)}${vizList(TENANT_MODULES.map((m) => ({ label: UI.vizModules[m], on: t.modules.includes(m) })))}`,
  }));
  const tierNames = [...new Set(tenants.map((t) => t.tier))].sort((a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));
  const tier: Row[] = tierNames.map((name) => {
    const users = tenants.filter((t) => t.tier === name);
    return {
      id: slug(name),
      table: "tier",
      attr: name,
      type: tenantCount(users.length),
      title: `Tier ${name}`,
      body: `<p>${esc(tx(S.bookedBy))}: ${users.map((t) => esc(t.name)).join(", ")}.</p>${name === "Premium" ? p(tx(S.premiumNote)) : ""}`,
    };
  });
  const module: Row[] = TENANT_MODULES.map((m) => {
    const users = tenants.filter((t) => t.modules.includes(m));
    const wip = m === "shop";
    return {
      id: m,
      table: "module",
      attr: UI.vizModules[m],
      type: wip ? UI.vizWip : `${users.length} / ${tenants.length}`,
      wip,
      title: UI.vizModules[m],
      body: detail(card.moduleInfo?.[m]) + (wip ? "" : vizList(tenants.map((t) => ({ label: t.name, on: t.modules.includes(m) })))),
    };
  });
  return new Map<TableId, Row[]>([
    ["project", project],
    ["core", core],
    ["tenant", tenant],
    ["tier", tier],
    ["module", module],
  ]);
}

const TIER_ORDER = ["Core", "Connect", "Premium"];

// --- lines -------------------------------------------------------------

type Kind = "books" | "tier" | "needs" | "builds" | "context";
interface Edge {
  a: string;
  b: string;
  kind: Kind;
  label: Text;
}

function buildEdges(card: ProjectCard): Edge[] {
  const edges: Edge[] = [];
  for (const t of card.tenants ?? []) {
    const id = `tenant.${slug(t.name)}`;
    for (const m of t.modules) edges.push({ a: id, b: `module.${m}`, kind: "books", label: L.books });
    edges.push({ a: id, b: `tier.${slug(t.tier)}`, kind: "tier", label: L.tier });
    edges.push({ a: id, b: "core.l1", kind: "context", label: L.ownDb });
  }
  // The "needs" lines, as the modules' own texts state them (moduleInfo).
  for (const [a, b] of [["matching", "chat"], ["board", "chat"], ["orgs", "caretaker"], ["shop", "payments"]]) {
    edges.push({ a: `module.${a}`, b: `module.${b}`, kind: "needs", label: L.needs });
  }
  for (const [a, b] of [["l4", "l3"], ["l3", "l2"], ["l2", "l1"]]) edges.push({ a: `core.${a}`, b: `core.${b}`, kind: "builds", label: L.builds });
  const ctx: [string, string, Text][] = [
    ["project.learned", "core.l4", L.experiment],
    ["project.arch", "core.l1", L.silo],
    ["module.chat", "core.l3", L.sockets],
    ["module.payments", "core.l3", L.webhooks],
    ["module.matching", "core.l1", L.radius],
    ["module.board", "core.l1", L.radius],
    ["module.hidden", "core.l4", L.coins],
    ["tier.premium", "module.matching", L.premium],
  ];
  for (const [a, b, label] of ctx) edges.push({ a, b, kind: "context", label });
  return edges;
}

// --- flows -------------------------------------------------------------

interface Flow {
  id: string;
  title: Text;
  intro: Text;
  steps: [string, Text][];
}

const FLOWS: Flow[] = [
  {
    id: "book",
    title: { de: "Ein Mandant bucht Module", en: "A tenant books modules", ru: "Арендатор подключает модули", ja: "テナントがモジュールを契約" },
    intro: { de: "KiezConnect, vom Tier bis zur eigenen Datenbank.", en: "KiezConnect, from its tier to its own database.", ru: "KiezConnect — от тарифа до собственной базы данных.", ja: "KiezConnect、ティアから専用データベースまで。" },
    steps: [
      ["tenant.kiezconnect", { de: "KiezConnect ist ein Schwarzes Brett für die Nachbarschaft. Alles, was ihn ausmacht, steht in einer tenant.json.", en: "KiezConnect is a notice board for the neighbourhood. Everything that defines it lives in one tenant.json.", ru: "KiezConnect — доска объявлений для района. Всё, что его определяет, записано в одном tenant.json.", ja: "KiezConnectは近所向けの掲示板です。それを形づくるすべてが1つのtenant.jsonにあります。" }],
      ["tier.core", { de: "Gebucht ist Core. Das Tier legt den Umfang fest, abgerechnet wird nach gebuchten Modulen.", en: "It's on Core. The tier sets the scope; billing follows the booked modules.", ru: "Подключён тариф Core. Тариф задаёт объём, оплата идёт по подключённым модулям.", ja: "契約はCore。ティアが範囲を決め、請求は契約したモジュールに応じます。" }],
      ["module.chat", { de: "Chat ist bei jedem Mandanten dabei, weil das Gateway auch Benachrichtigungen und Bans zustellt.", en: "Every tenant has chat, because the gateway also delivers notifications and bans.", ru: "Чат есть у каждого арендатора, потому что шлюз доставляет ещё и уведомления и баны.", ja: "ゲートウェイが通知やBANも届けるので、チャットはどのテナントにもあります。" }],
      ["module.board", { de: "Das Schwarze Brett braucht Chat: „Zettel abreißen“ schickt eine Kontaktanfrage.", en: "The notice board needs chat: “tear off a slip” sends a contact request.", ru: "Доске объявлений нужен чат: «оторвать листок» отправляет запрос на контакт.", ja: "掲示板にはチャットが必要です。「紙をちぎる」で連絡リクエストが届きます。" }],
      ["module.payments", { de: "Bezahlung über Stripe, ohne die Seite zu verlassen.", en: "Payment via Stripe, without leaving the page.", ru: "Оплата через Stripe, не уходя со страницы.", ja: "Stripeで、ページを離れずに支払い。" }],
      ["core.l1", { de: "Darunter liegt eine Datenbank nur für KiezConnect. Seine DSGVO-Daten sind physisch von allen anderen getrennt.", en: "Underneath sits a database just for KiezConnect. Its GDPR data is physically separate from everyone else's.", ru: "Под этим — база данных только для KiezConnect. Его данные по GDPR физически отделены от всех остальных.", ja: "その下にはKiezConnect専用のデータベース。GDPRデータは他と物理的に分かれています。" }],
    ],
  },
  {
    id: "layers",
    title: { de: "Von unten gebaut", en: "Built from the bottom up", ru: "Построено снизу вверх", ja: "下から積み上げる" },
    intro: { de: "Erst die Datenbank, ganz oben das Experiment.", en: "The database first, the experiment on top.", ru: "Сначала база данных, наверху — эксперимент.", ja: "まずデータベース、いちばん上に実験。" },
    steps: [
      ["core.l1", { de: "Zwei Wochen DB-Entwurf, bevor die erste Zeile Backend stand. PostGIS rechnet Entfernungen direkt in der Datenbank.", en: "Two weeks of DB design before the first line of backend. PostGIS computes distances right in the database.", ru: "Две недели проектирования БД до первой строки бэкенда. PostGIS считает расстояния прямо в базе.", ja: "バックエンドの1行目の前に2週間のDB設計。PostGISが距離をデータベース内で計算します。" }],
      ["core.l2", { de: "Row-Level Security als Grundzustand: Schutz von unten.", en: "Row-level security as the default: protection from the bottom up.", ru: "Row-Level Security по умолчанию: защита снизу.", ja: "行レベルセキュリティが初期状態。下からの保護です。" }],
      ["core.l3", { de: "Die API habe ich selbst gebaut, REST und WebSockets auf einem Port.", en: "I built the API myself, REST and WebSockets on one port.", ru: "API я построил сам: REST и WebSockets на одном порту.", ja: "APIは自作。RESTとWebSocketを1つのポートで。" }],
      ["core.l4", { de: "Ganz oben die Business-Logic, der experimentelle Teil.", en: "On top, the business logic: the experimental part.", ru: "На самом верху — бизнес-логика, экспериментальная часть.", ja: "いちばん上がビジネスロジック、実験的な部分です。" }],
      ["project.learned", { de: "Genau dort habe ich am meisten gelernt, weil ich Ideen ausprobiert habe, statt auf Nummer sicher zu gehen.", en: "That's exactly where I learned the most, because I tried ideas instead of playing it safe.", ru: "Именно там я научился больше всего, потому что пробовал идеи, а не перестраховывался.", ja: "安全策ではなくアイデアを試したので、まさにそこで一番多くを学びました。" }],
    ],
  },
  {
    id: "needs",
    title: { de: "Module brauchen Module", en: "Modules need modules", ru: "Модулям нужны модули", ja: "モジュールが必要とするモジュール" },
    intro: { de: "Welche Bausteine ohne andere nicht laufen.", en: "Which building blocks don't run without others.", ru: "Какие блоки не работают без других.", ja: "他がないと動かない部品。" },
    steps: [
      ["module.shop", { de: "Der Shop braucht Bezahlung, und der Mandant braucht eine USt-IdNr. oder Steuernummer.", en: "The shop needs payments, and the tenant needs a VAT ID or tax number.", ru: "Магазину нужна оплата, а арендатору — номер НДС или налоговый номер.", ja: "ショップには決済が必要で、テナントには付加価値税IDか税番号が必要です。" }],
      ["module.payments", { de: "Bezahlung läuft über Stripe. Der Shop spricht nur über den Broker damit.", en: "Payments run on Stripe. The shop only talks to it through the broker.", ru: "Оплата идёт через Stripe. Магазин общается с ней только через брокер.", ja: "決済はStripe。ショップはブローカー経由でのみ話します。" }],
      ["module.orgs", { de: "Eine Organisation ist ein Träger mit seinem Team.", en: "An organisation is a provider with its team.", ru: "Организация — это учреждение со своей командой.", ja: "組織とは、運営者とそのチームです。" }],
      ["module.caretaker", { de: "Deshalb braucht sie Betreuung: Die Betreuungen gehören zur Organisation.", en: "That's why it needs care: the care relationships belong to the organisation.", ru: "Поэтому ей нужна опека: опекунские связи принадлежат организации.", ja: "だから見守りが必要です。見守りは組織に属します。" }],
      ["module.matching", { de: "Matching braucht Chat, denn ein Match legt sofort eine Unterhaltung an.", en: "Matching needs chat, because a match opens a conversation right away.", ru: "Матчингу нужен чат, потому что матч сразу открывает разговор.", ja: "マッチすると即座に会話が作られるので、マッチングにはチャットが必要です。" }],
      ["module.chat", { de: "Chat ist der Baustein, auf den am meisten anderes aufsetzt.", en: "Chat is the building block that the most other parts sit on.", ru: "Чат — блок, на который опирается больше всего остального.", ja: "チャットは、最も多くの部品が載っている土台です。" }],
    ],
  },
];

// --- markup ------------------------------------------------------------

const LAYOUT: Record<TableId, string> = {
  project: "1 / 1",
  core: "2 / 1",
  tenant: "1 / 2",
  tier: "2 / 2",
  module: "1 / 3 / 3 / 4",
};

function table(id: TableId, rows: Row[]): string {
  return `
    <section class="sch-tbl sch-tbl--${id}" style="--tc: ${TABLE_COLOR[id]}; grid-area: ${LAYOUT[id]}">
      <h4 class="sch-name"><span>${id}</span><span>${rows.length}</span></h4>
      ${rows
        .map(
          (r) => `
      <button type="button" class="sch-row${r.wip ? " sch-row--wip" : ""}" data-sch="${id}.${r.id}" aria-pressed="false">
        ${r.swatch ? `<span class="sch-swatch" style="background: ${esc(r.swatch)}"></span>` : `<span class="sch-key">${esc(r.key ?? "")}</span>`}
        <span class="sch-attr">${esc(r.attr)}</span>
        <span class="sch-type">${esc(r.type ?? "")}</span>
      </button>`,
        )
        .join("")}
    </section>`;
}

const LEGEND_SVG = {
  books: `<svg viewBox="0 0 34 12" aria-hidden="true"><path d="M0 6 H34 M0 1 L6 6 L0 11 M34 1 L28 6 L34 11" /></svg>`,
  tier: `<svg viewBox="0 0 34 12" aria-hidden="true"><path d="M0 6 H34 M0 1 L6 6 L0 11 M29 1 V11 M32 1 V11" /></svg>`,
  needs: `<svg viewBox="0 0 34 12" aria-hidden="true"><path d="M0 6 H34" stroke-dasharray="4 4" /></svg>`,
  context: `<svg viewBox="0 0 34 12" aria-hidden="true"><path class="is-ctx" d="M0 6 H34" /></svg>`,
};

export function schemaCard(card: ProjectCard, head: string): string {
  const rows = buildRows(card);
  return `
    <article class="pcard pcard--big pcard--schema" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      ${head}
      <div class="sch">
        <div class="sch-er">
          <svg class="sch-edges" aria-hidden="true"></svg>
          ${[...rows].map(([id, r]) => table(id, r)).join("")}
        </div>
        <aside class="sch-insp" aria-live="polite"></aside>
        <p class="sch-legend">
          <span>${LEGEND_SVG.books}${esc(tx(S.lgBooks))}</span>
          <span>${LEGEND_SVG.tier}${esc(tx(S.lgTier))}</span>
          <span>${LEGEND_SVG.needs}${esc(tx(S.lgNeeds))}</span>
          <span>${LEGEND_SVG.context}${esc(tx(S.lgContext))}</span>
        </p>
      </div>
    </article>
  `;
}

// --- behaviour ---------------------------------------------------------

const MARKERS = `<defs>
  <marker id="sch-many" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M12 1 L3 6 L12 11 M3 6 H12" fill="none" stroke="context-stroke" /></marker>
  <marker id="sch-one" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M6 1 V11 M9 1 V11" fill="none" stroke="context-stroke" /></marker>
</defs>`;

const EDGE_COLOR: Record<Kind, string> = {
  books: TABLE_COLOR.tenant,
  tier: TABLE_COLOR.tenant,
  needs: TABLE_COLOR.module,
  builds: TABLE_COLOR.core,
  context: "var(--pc)",
};

const MIN_SCH_FIT = 0.7;

export function initSchema(root: HTMLElement, cards: ProjectCard[]) {
  root.querySelectorAll<HTMLElement>(".pcard--schema").forEach((el) => {
    const card = cards.find((c) => c.id === el.dataset.card);
    if (!card) return;
    const rows = new Map<string, Row>();
    for (const [, list] of buildRows(card)) for (const r of list) rows.set(`${r.table}.${r.id}`, r);
    const edges = buildEdges(card).filter((e) => rows.has(e.a) && rows.has(e.b));
    const er = el.querySelector<HTMLElement>(".sch-er")!;
    const svg = el.querySelector<SVGSVGElement>(".sch-edges")!;
    const insp = el.querySelector<HTMLElement>(".sch-insp")!;
    const rowEls = new Map([...er.querySelectorAll<HTMLElement>("[data-sch]")].map((b) => [b.dataset.sch!, b]));

    let selected: string | null = null;
    let hovered: string | null = null;
    let flow: { id: string; step: number } | null = null;

    // Positions come from the layout (offsetTop/Left up to the diagram),
    // not from getBoundingClientRect: the carousel moves and tilts the
    // card, and screen coordinates would carry that along.
    const box = (node: HTMLElement) => {
      let x = 0;
      let y = 0;
      for (let n: HTMLElement | null = node; n && n !== er; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return { x, y, w: node.offsetWidth, h: node.offsetHeight };
    };
    // The diagram shrinks its type in small steps until every table fits
    // the card's height, like the text boxes (fitText).
    const fit = () => {
      let f = 1;
      er.style.setProperty("--sch-fit", "1");
      while (er.scrollHeight > er.clientHeight + 1 && f > MIN_SCH_FIT) {
        f = Math.round((f - 0.04) * 100) / 100;
        er.style.setProperty("--sch-fit", String(f));
      }
    };
    const draw = () => {
      if (!er.offsetWidth) return;
      fit();
      svg.setAttribute("viewBox", `0 0 ${er.offsetWidth} ${er.offsetHeight}`);
      svg.innerHTML =
        MARKERS +
        edges
          .map((e, i) => {
            const a = box(rowEls.get(e.a)!);
            const b = box(rowEls.get(e.b)!);
            const at = (r: typeof a, side: "l" | "r") => ({ x: side === "l" ? r.x : r.x + r.w, y: r.y + r.h / 2 });
            let d: string;
            if (Math.abs(a.x - b.x) < 4) {
              // Same table column: an arc out to the side — core's to the
              // left (nothing there), the others' to the right.
              const side = e.a.startsWith("core.") ? "l" : "r";
              const A = at(a, side);
              const B = at(b, side);
              const out = (side === "l" ? -1 : 1) * Math.min(44, 14 + Math.abs(B.y - A.y) / 5);
              d = `M ${A.x} ${A.y} C ${A.x + out} ${A.y}, ${B.x + out} ${B.y}, ${B.x} ${B.y}`;
            } else {
              const right = b.x > a.x;
              const A = at(a, right ? "r" : "l");
              const B = at(b, right ? "l" : "r");
              const mx = (A.x + B.x) / 2;
              d = `M ${A.x} ${A.y} C ${mx} ${A.y}, ${mx} ${B.y}, ${B.x} ${B.y}`;
            }
            const ends =
              e.kind === "books"
                ? ' marker-start="url(#sch-many)" marker-end="url(#sch-many)"'
                : e.kind === "tier"
                  ? ' marker-start="url(#sch-many)" marker-end="url(#sch-one)"'
                  : "";
            return `<path d="${d}" class="sch-e sch-e--${e.kind}" style="--ec: ${EDGE_COLOR[e.kind]}" data-i="${i}"${ends} />`;
          })
          .join("");
      paint();
    };

    const touching = (id: string) => edges.filter((e) => e.a === id || e.b === id);
    const trail = () => {
      if (!flow) return new Set<string>();
      const f = FLOWS.find((x) => x.id === flow!.id)!;
      return new Set(f.steps.slice(0, flow.step + 1).map(([id]) => id));
    };

    const paint = () => {
      const focus = hovered ?? selected;
      const near = new Set(focus ? touching(focus).flatMap((e) => [e.a, e.b]) : []);
      const tr = trail();
      const quiet = !!focus || !!flow;
      rowEls.forEach((b, id) => {
        b.classList.toggle("is-near", near.has(id) && id !== focus);
        b.classList.toggle("is-trail", tr.has(id));
        b.classList.toggle("is-dim", quiet && id !== focus && !near.has(id) && !tr.has(id));
        b.setAttribute("aria-pressed", String(id === selected));
      });
      svg.querySelectorAll<SVGPathElement>("path[data-i]").forEach((path) => {
        const e = edges[Number(path.dataset.i)];
        const on = !!focus && (e.a === focus || e.b === focus);
        const inTrail = tr.has(e.a) && tr.has(e.b);
        path.classList.toggle("is-on", on);
        path.classList.toggle("is-trail", inTrail);
        path.classList.toggle("is-dim", quiet && !on && !inTrail);
      });
    };

    const path = (r: Row) =>
      `<p class="sch-path" style="--tc: ${TABLE_COLOR[r.table]}"><b>${r.table}</b> › ${esc(r.attr)}${r.type ? ` · ${esc(r.type)}` : ""}</p>`;
    const closeBtn = `<button type="button" class="sch-close" data-sch-close aria-label="${esc(tx(S.close))}">×</button>`;

    const render = () => {
      let html: string;
      if (flow) {
        const f = FLOWS.find((x) => x.id === flow!.id)!;
        const [id, text] = f.steps[flow.step];
        const r = rows.get(id)!;
        const last = flow.step === f.steps.length - 1;
        html = `${closeBtn}
          <div>
            <p class="sch-h">▶ ${esc(tx(f.title))}</p>
            <ol class="sch-steps">${f.steps.map((_, i) => `<li class="${i < flow!.step ? "is-done" : i === flow!.step ? "is-on" : ""}"></li>`).join("")}</ol>
            ${path(r)}
            <p class="sch-step">${esc(step(flow.step + 1, f.steps.length))}</p>
            <h5 class="sch-title">${esc(r.title)}</h5>
            <p>${esc(tx(text))}</p>
            <div class="sch-nav">
              <button type="button" data-sch-prev${flow.step ? "" : " disabled"}>← ${esc(tx(S.prev))}</button>
              <button type="button" data-sch-next class="is-primary">${esc(tx(last ? S.done : S.next))}${last ? "" : " →"}</button>
            </div>
          </div>`;
      } else if (selected) {
        const r = rows.get(selected)!;
        // Bookings are already the chips in the body (vizList), so the
        // list keeps the other lines: tier, "needs", layers, context.
        const links = touching(selected)
          .filter((e) => e.kind !== "books")
          .map((e) => {
            const other = rows.get(e.a === selected ? e.b : e.a)!;
            return `<li><button type="button" data-sch-go="${other.table}.${other.id}"><span>${e.a === selected ? "→" : "←"} ${other.table} › ${esc(other.attr)}</span><small>${esc(tx(e.label))}${e.kind === "context" ? ` · ${esc(tx(S.context))}` : ""}</small></button></li>`;
          })
          .join("");
        const inFlows = FLOWS.filter((f) => f.steps.some(([id]) => id === selected));
        html = `${closeBtn}
          <div>
            ${path(r)}
            <h5 class="sch-title">${esc(r.title)}</h5>
            <div class="sch-body">${r.body}</div>
            ${links ? `<p class="sch-h">${esc(tx(S.connected))}</p><ul class="sch-links">${links}</ul>` : ""}
            ${inFlows.length ? `<p class="sch-h">${esc(tx(S.inFlows))}</p><ul class="sch-flows">${inFlows.map((f) => `<li><button type="button" data-sch-flow="${f.id}"><b>▶ ${esc(tx(f.title))}</b></button></li>`).join("")}</ul>` : ""}
          </div>`;
      } else {
        const base = edges.filter((e) => e.kind !== "context").length;
        html = `
          <div>
            <p class="sch-path"><b>yourbrand</b> › schema</p>
            <h5 class="sch-title">${esc(tx(S.idleTitle))}</h5>
            <p>${esc(tx(S.idleText))}</p>
            <p class="sch-h">${esc(tx(S.flows))}</p>
            <ul class="sch-flows">${FLOWS.map((f) => `<li><button type="button" data-sch-flow="${f.id}"><b>▶ ${esc(tx(f.title))}</b><small>${esc(tx(f.intro))}</small></button></li>`).join("")}</ul>
            <p class="sch-path">${esc(stats(card.tenants?.length ?? 0, TENANT_MODULES.length, base))}</p>
          </div>`;
      }
      insp.innerHTML = html;
      fitText(insp);
    };

    const select = (id: string | null) => {
      selected = id;
      render();
      paint();
    };
    const showStep = () => {
      selected = FLOWS.find((f) => f.id === flow!.id)!.steps[flow!.step][0];
      render();
      paint();
    };
    const stop = () => {
      flow = null;
      select(null);
    };

    el.addEventListener("click", (e) => {
      const t = e.target as Element;
      const row = t.closest<HTMLElement>("[data-sch]");
      if (row) {
        flow = null;
        return select(selected === row.dataset.sch ? null : row.dataset.sch!);
      }
      const go = t.closest<HTMLElement>("[data-sch-go]");
      if (go) {
        flow = null;
        return select(go.dataset.schGo!);
      }
      const fl = t.closest<HTMLElement>("[data-sch-flow]");
      if (fl) {
        flow = { id: fl.dataset.schFlow!, step: 0 };
        return showStep();
      }
      if (t.closest("[data-sch-next]") && flow) {
        const f = FLOWS.find((x) => x.id === flow!.id)!;
        if (flow.step >= f.steps.length - 1) return stop();
        flow.step++;
        return showStep();
      }
      if (t.closest("[data-sch-prev]") && flow && flow.step > 0) {
        flow.step--;
        return showStep();
      }
      if (t.closest("[data-sch-close]")) stop();
    });
    er.addEventListener("pointerover", (e) => {
      const id = (e.target as Element).closest<HTMLElement>("[data-sch]")?.dataset.sch ?? null;
      if (id === hovered) return;
      hovered = id;
      paint();
    });
    er.addEventListener("pointerleave", () => {
      hovered = null;
      paint();
    });
    // Keys only while focus is inside the card, so they never fight the
    // carousel's own.
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && (selected || flow)) stop();
      if (!flow) return;
      if (e.key === "ArrowRight") el.querySelector<HTMLElement>("[data-sch-next]")?.click();
      if (e.key === "ArrowLeft") el.querySelector<HTMLElement>("[data-sch-prev]")?.click();
    });

    new ResizeObserver(draw).observe(er);
    new ResizeObserver(() => fitText(insp)).observe(insp);
    document.fonts?.ready.then(() => {
      draw();
      fitText(insp);
    });
    render();
    draw();
  });
}
