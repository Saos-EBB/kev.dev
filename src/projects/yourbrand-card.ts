// YourBrand's desktop card: its module graph from the engineering overlay
// on the left, the shared phone with the app in the middle (scroll-phone.ts),
// the texts as tabs on the right — first among them the step the ride is
// on. While the card holds in the carousel, scrolling the page rides four
// flows through the graph (new tenant → login → swipe → chat) and the phone
// shows the app at that step; a node or a flow scrolls the page to its step.
// The graph's data (nodes, flows, texts) is the overlay's own chunk.

import type { EngFlow, EngProject } from "../engineering/types";
import { esc, TENANT_MODULES, type ProjectCard } from "./project-cards";
import { fitText } from "./big-cards";
import { LANG, pick, type Lang } from "../i18n";
import { paintStates, phoneApp, reduced, type Phone } from "./scroll-phone";
import { rideTo } from "./carousel";
import "./yourbrand-card.css";

const S: Record<string, Record<Lang, string>> = {
  graph: { de: "Modul-Graph · die Flows aus dem Repo", en: "Module graph · the flows from the repo", ru: "Граф модулей · сценарии из репозитория", ja: "モジュールグラフ · リポジトリのフロー" },
  flow: { de: "Flow", en: "Flow", ru: "Сценарий", ja: "フロー" },
  open: { de: "Im Engineering-Graph öffnen ↗", en: "Open in the engineering graph ↗", ru: "Открыть в инженерном графе ↗", ja: "エンジニアリンググラフで開く ↗" },
  offRide: { de: "Nicht auf dieser Fahrt — kommt vor in:", en: "Not on this ride — appears in:", ru: "Не на этом маршруте — встречается в:", ja: "このルートにはない — 登場するフロー：" },
};
const tx = (key: keyof typeof S) => S[key][LANG] ?? S[key].de;

// The ride: these flows, in this order, each step on one app screen.
const RIDE = ["tenant", "login", "swipe", "chat"] as const;
const TABS: Record<string, number> = { tenant: 0, login: 0, swipe: 1, chat: 2 };

const sk = (style = "") => `<i class="sp-sk" data-w${style ? ` style="${style}"` : ""}></i>`;
const rep = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join("");

// One screen per flow (a step's k is its index in the flow), plus the home
// screen the new tenant ends on, where the tenants take turns. A function:
// project-cards.ts imports this module before its own TENANT_MODULES exist.
const screens = () => `
  <div class="sp-page" data-page="tenant">
    <div class="sp-ol yb-file" data-w>
      <span class="yb-tiny yb-json">tenant.json</span>
      ${["#F0568C", "#8DB4FF", "#FFC400", "#F0743F"].map((c, i) => `<span class="yb-kv"><u style="background:${c}"></u>${sk(`width:${[70, 50, 82, 40][i]}%`)}</span>`).join("")}
      <span class="yb-ok sp-st" data-from="1" data-at="1">✓</span>
    </div>
    <span class="yb-slug sp-st" data-from="2" data-at="2"></span>
    <div class="yb-infra">
      <div class="sp-ol yb-inf yb-db sp-st" data-w data-from="3" data-at="3 4"><span class="yb-ic"></span><span class="yb-rows">${rep(3, () => `<i class="sp-sk sp-st" data-w data-from="4"></i>`)}</span><span class="yb-tiny">db</span></div>
      <div class="sp-ol yb-inf yb-bucket sp-st" data-w data-from="5" data-at="5"><span class="yb-ic"></span><span class="yb-rows">${sk()}</span><span class="yb-tiny">bucket</span></div>
      <div class="sp-ol yb-inf yb-redis sp-st" data-w data-from="6" data-at="6"><span class="yb-ic"></span><span class="yb-rows">${sk()}</span><span class="yb-tiny">redis</span></div>
    </div>
  </div>
  <div class="sp-page" data-page="home">
    <div class="yb-brand"><span class="yb-logo"></span><b class="yb-tname"></b></div>
    <span class="yb-tkind"></span>
    ${sk("width:80%;height:46px;border-radius:12px")}
    <div class="yb-mods">${TENANT_MODULES.map((m) => `<div class="yb-mod" data-m="${m}"><b></b><span>${m}</span></div>`).join("")}</div>
  </div>
  <div class="sp-page" data-page="login">
    <div class="yb-load sp-st" data-from="0" data-to="0" data-at="0"><i><b></b></i></div>
    <div class="yb-login"><span class="yb-logo"></span>${sk("width:50%;height:8px")}</div>
    <div class="yb-field" data-at="3"><span class="yb-hash sp-st" data-from="3">a9f3·c71e·…</span><i class="sp-sk yb-plain" data-w data-from="3"></i></div>
    <div class="yb-field yb-pw">${rep(8, () => "<i></i>")}</div>
    <div class="yb-go" data-at="4"><span class="yb-spin sp-st" data-from="4" data-to="4"></span><span class="sp-st" data-from="5">✓</span></div>
    <div class="yb-meter sp-st" data-from="1" data-to="1" data-at="1"><span class="yb-tiny">5 / min</span><span class="yb-dots">${rep(5, (i) => `<i${i < 3 ? ' class="f"' : ""}></i>`)}</span></div>
    <div class="yb-meter sp-st" data-from="2" data-to="2" data-at="2"><span class="yb-tiny">max 8</span><span class="yb-slots">${rep(8, (i) => `<i${i < 5 ? ' class="f"' : ""}></i>`)}</span></div>
    <div class="yb-toks sp-st" data-from="5"><span>15 min</span><span>30 d</span></div>
  </div>
  <div class="sp-page" data-page="swipe">
    <div class="yb-top"><span class="yb-brand"><span class="yb-logo yb-logo--s"></span><span class="yb-tiny">discover</span></span><b class="yb-count"></b></div>
    <div class="yb-deck">
      <div class="yb-pc yb-c3"><span class="yb-av"></span>${sk("width:50%")}</div>
      <div class="yb-pc yb-c2"><span class="yb-av"></span>${sk("width:55%")}</div>
      <div class="yb-pc yb-c1" data-from="4">
        <span class="yb-av"></span>
        <span class="yb-radar sp-st" data-from="2" data-to="3"></span>
        <span class="yb-score sp-st" data-from="3" data-to="3"><span>+2</span><span class="neg">−1</span><span>+8 km</span></span>
        ${sk("width:60%;height:9px")}${sk("width:40%")}
      </div>
      <div class="yb-match sp-st" data-from="5"><span class="yb-burst"></span><span class="yb-pair"><i></i><i></i></span><span class="yb-tochat sp-st" data-from="6" data-at="6"></span></div>
    </div>
    <div class="yb-acts"><i>✕</i><i class="yb-like">♥</i></div>
  </div>
  <div class="sp-page" data-page="chat">
    <div class="yb-chead"><span class="yb-av"></span>${sk("width:34%;height:7px")}<span class="yb-room sp-st" data-from="1" data-at="1"># conv</span></div>
    <div class="yb-relay sp-st" data-from="4" data-to="4"><i></i><i></i><i></i></div>
    <div class="yb-msgs">
      <div class="yb-bub yb-them">${sk("width:90px")}${sk("width:60px")}</div>
      <div class="yb-bub yb-me sp-st" data-from="2" data-at="2">${sk("width:80px")}<span class="yb-tick">✓</span></div>
      <div class="yb-bub yb-me sp-st" data-from="3" data-at="3">${sk("width:64px")}<span class="yb-flag">⚑</span><span class="yb-tick">✓</span></div>
      <div class="yb-typing sp-st" data-from="5"><i></i><i></i><i></i></div>
    </div>
    <div class="yb-input"></div>
  </div>
  <div class="yb-tabbar">${rep(4, () => "<i></i>")}</div>`;

type Panel = { kind: string; heading: string; body: string };

// Scroll the ride takes, in carousel timeline units (~140 px per step).
const RIDE_UNITS = 6.5;

// The card; `tabs` renders the text tabs (big-cards.ts) with the flow first.
export function ybCard(card: ProjectCard, head: string, tabs: (first: Panel) => string): string {
  const brand = rideTenant(card)?.color ?? card.accent;
  return `
    <article class="pcard pcard--big pcard--yb pcard--phone" data-card="${esc(card.id)}" data-ride="${RIDE_UNITS}" style="--pc: ${card.accent}; --brand: ${brand}">
      ${head}
      <div class="yb">
        <section class="sp-box yb-graphbox">
          <p class="yb-head"><span>${esc(tx("graph"))}</span><span class="yb-flowname"></span></p>
          <div class="yb-graph"></div>
        </section>
        <div class="sp-slot"></div>
        ${tabs({ kind: "flow", heading: tx("flow"), body: `<div class="yb-segs"></div><div class="yb-step" aria-live="polite"></div>` })}
      </div>
    </article>`;
}

// The tenant the ride's app wears: one that has every module it shows.
const rideTenant = (card: ProjectCard) =>
  card.tenants?.find((t) => t.modules.includes("matching") && t.modules.includes("chat") && t.name !== "YourBrand") ?? card.tenants?.[0];

// The app on the shared phone.
export const ybApp = (card: ProjectCard) =>
  phoneApp(card.id, `<div class="yb-app" style="--brand: ${rideTenant(card)?.color ?? card.accent}">${screens()}</div>`);

export function initYourBrand(el: HTMLElement, card: ProjectCard, phone: Phone) {
  let at = 0;
  let onRide = (_p: number) => {};
  el.addEventListener("ride", (e) => {
    at = (e as CustomEvent<number>).detail;
    onRide(at);
  });
  import("../engineering/data/yourbrand").then((m) => (onRide = ride(el, card, m.yourbrand, phone, at)));
}

interface Step {
  flow: EngFlow;
  k: number;
  node: string;
  page: string;
}

const NS = "http://www.w3.org/2000/svg";
const TENANT_MS = 1400; // the home screen's tenants, one per this

// Sets the ride up; returns what to do with the carousel's ride position.
function ride(el: HTMLElement, card: ProjectCard, P: EngProject, phone: Phone, at: number): (p: number) => void {
  const flows = RIDE.map((id) => P.flows.find((f) => f.id === id)!).filter(Boolean);
  const steps: Step[] = flows.flatMap((flow) =>
    flow.steps.map((s, k) => ({ flow, k, node: s.node, page: flow.id === "tenant" && k === flow.steps.length - 1 ? "home" : flow.id })),
  );
  const app = document.querySelector<HTMLElement>(`.sp-app[data-app="${card.id}"]`)!;
  const pages = [...app.querySelectorAll<HTMLElement>(".sp-page")];
  const host = el.querySelector<HTMLElement>(".yb-graph")!;
  const panel = el.querySelector<HTMLElement>(".big-panel[data-panel='flow']")!;
  const segs = el.querySelector<HTMLElement>(".yb-segs")!;
  const box = el.querySelector<HTMLElement>(".yb-step")!;
  const flowTab = el.querySelector<HTMLElement>(".big-tabs [data-tab='flow']")!;
  const tenants = card.tenants ?? [];
  const home = rideTenant(card);
  const brand = home?.color ?? card.accent;
  app.querySelector(".yb-slug")!.textContent = home?.name.toLowerCase().replace(/\s+/g, "-") ?? "";
  const step = (p: number) => Math.round(p * (steps.length - 1));
  // Jumps go through the page's scroll, so the ride and the page agree;
  // without the carousel (reduced motion) they just go.
  const jump = (i: number) => {
    if (!rideTo(el, i / (steps.length - 1))) go(i);
  };

  const layer = new Map(P.layers.map((l) => [l.id, l]));
  const nodes = new Map(P.nodes.map((n) => [n.id, n]));
  const chip = (id: string) => {
    const n = nodes.get(id)!, l = layer.get(n.layer)!;
    return `<span class="yb-chip" style="--lc: ${l.color}">${esc(pick(n.label))} · ${esc(pick(l.label))}</span>`;
  };
  const href = (flow: string, step?: number) => `#eng/yourbrand/${flow}${step ? `/${step}` : ""}`;

  // --- the graph: layer = column, order = row, edges = consecutive steps
  const edges: [string, string][] = [];
  const seen = new Set<string>();
  for (const f of P.flows)
    for (let i = 1; i < f.steps.length; i++) {
      const a = f.steps[i - 1].node, b = f.steps[i].node, key = [a, b].sort().join("|");
      if (a !== b && !seen.has(key)) seen.add(key), edges.push([a, b]);
    }
  type Box = { x: number; y: number; w: number; h: number };
  let pos = new Map<string, Box>();
  let nodeEls = new Map<string, SVGGElement>();
  let edgeEls = new Map<string, SVGPathElement>();
  let dot: SVGCircleElement | null = null;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  host.append(svg);

  const draw = () => {
    const W = host.clientWidth, H = host.clientHeight;
    if (!W || !H) return;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const cols = P.layers.map((l) => P.nodes.filter((n) => n.layer === l.id));
    const rows = Math.max(...cols.map((c) => c.length));
    const pad = 12, top = 24, colW = (W - pad * 2) / cols.length, rowH = (H - top - pad) / rows, nh = Math.min(22, rowH - 5);
    pos = new Map();
    cols.forEach((col, ci) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", String(pad + ci * colW + 2));
      t.setAttribute("y", "14");
      t.setAttribute("class", "yb-col");
      t.style.setProperty("--lc", P.layers[ci].color);
      t.textContent = pick(P.layers[ci].label);
      svg.append(t);
      const y0 = top + ((rows - col.length) * rowH) / 2;
      col.forEach((n, ri) => pos.set(n.id, { x: pad + ci * colW, y: y0 + ri * rowH + (rowH - nh) / 2, w: colW - 12, h: nh }));
    });
    const g = document.createElementNS(NS, "g");
    svg.append(g);
    edgeEls = new Map();
    for (const [a, b] of edges) {
      const A = pos.get(a)!, B = pos.get(b)!;
      let d: string;
      if (Math.abs(A.x - B.x) < 1) {
        const x = A.x + A.w, y1 = A.y + A.h / 2, y2 = B.y + B.h / 2;
        d = `M${x} ${y1} C${x + 20} ${y1} ${x + 20} ${y2} ${x} ${y2}`;
      } else {
        const [L, R] = A.x < B.x ? [A, B] : [B, A];
        const x1 = L.x + L.w, y1 = L.y + L.h / 2, x2 = R.x, y2 = R.y + R.h / 2, m = (x1 + x2) / 2;
        d = `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`;
      }
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "yb-edge");
      g.append(p);
      edgeEls.set([a, b].sort().join("|"), p);
    }
    nodeEls = new Map();
    for (const n of P.nodes) {
      const q = pos.get(n.id)!;
      const ng = document.createElementNS(NS, "g");
      ng.setAttribute("class", "yb-node");
      ng.style.setProperty("--lc", layer.get(n.layer)!.color);
      ng.innerHTML = `<rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="${q.h / 2}"/><text x="${q.x + 9}" y="${q.y + q.h / 2 + 3.2}">${esc(pick(n.label))}</text>`;
      ng.addEventListener("click", () => pick_(n.id));
      svg.append(ng);
      nodeEls.set(n.id, ng);
    }
    dot = document.createElementNS(NS, "circle");
    dot.setAttribute("r", "4");
    dot.setAttribute("class", "yb-dot");
    svg.append(dot);
    paintGraph();
  };

  let cur = 0;
  let picked: string | null = null;
  let dotFrom: Box | undefined, dotTo: Box | undefined, dotAt = 0;
  const paintGraph = () => {
    const s = steps[cur], fl = s.flow.steps;
    const inFlow = new Set(fl.map((x) => x.node));
    nodeEls.forEach((g, id) => {
      g.classList.toggle("is-flow", inFlow.has(id));
      g.classList.toggle("is-cur", id === s.node);
      g.classList.toggle("is-pick", id === picked);
    });
    const flowEdges = new Set(fl.slice(1).map((x, j) => [fl[j].node, x.node].sort().join("|")));
    const prev = s.k > 0 ? fl[s.k - 1].node : null;
    const curKey = prev && prev !== s.node ? [prev, s.node].sort().join("|") : null;
    edgeEls.forEach((p, key) => {
      p.classList.toggle("is-flow", flowEdges.has(key));
      p.classList.toggle("is-cur", key === curKey);
    });
    dotFrom = pos.get(curKey ? prev! : s.node);
    dotTo = pos.get(s.node);
    dotAt = performance.now();
  };

  // --- the step box: where the ride is, the step, its node, the flow's steps
  segs.innerHTML = flows
    .map((f) => `<button type="button" data-flow="${f.id}">${esc(pick(f.title).split(/[:→]/)[0].trim())}<i><b></b></i></button>`)
    .join("");
  segs.addEventListener("click", (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-flow]");
    if (b) jump(steps.findIndex((s) => s.flow.id === b.dataset.flow));
  });
  const showStep = () => {
    const s = steps[cur], st = s.flow.steps[s.k];
    box.innerHTML = `
      <p class="yb-where">${esc(pick(s.flow.title))} · ${s.k + 1} / ${s.flow.steps.length}</p>
      <h4>${esc(pick(st.title))}</h4>
      <p>${esc(pick(st.plain))}</p>
      <p class="yb-chips">${chip(s.node)}</p>
      <ol>${s.flow.steps.map((x, j) => `<li${j === s.k ? ' class="is-on"' : ""}>${esc(pick(x.title))}</li>`).join("")}</ol>
      <a class="yb-open" href="${href(s.flow.id, s.k + 1)}">${esc(tx("open"))}</a>`;
    segs.querySelectorAll<HTMLElement>("button").forEach((b, j) => {
      const at = flows.indexOf(s.flow);
      b.classList.toggle("is-on", j === at);
      b.querySelector("b")!.style.width = j < at ? "100%" : j > at ? "0" : `${((s.k + 1) / s.flow.steps.length) * 100}%`;
    });
    fitText(panel);
  };
  const showNode = (id: string) => {
    const n = nodes.get(id)!;
    const ins = P.flows.filter((f) => f.steps.some((s) => s.node === id));
    box.innerHTML = `
      <p class="yb-where">${esc(pick(layer.get(n.layer)!.label))}</p>
      <h4>${esc(pick(n.label))}</h4>
      <p>${esc(tx("offRide"))}</p>
      <p class="yb-chips">${ins.map((f) => `<a class="yb-chip" href="${href(f.id)}">${esc(pick(f.title))}</a>`).join("")}</p>`;
    fitText(panel);
  };

  // --- the phone
  let tenantAt = 0, tenantIdx = 0;
  const wearTenant = (i: number) => {
    const t = tenants[i];
    if (!t) return;
    wear(t.color);
    app.querySelector(".yb-tname")!.textContent = t.name;
    app.querySelector(".yb-tkind")!.textContent = t.kind;
    app.querySelectorAll<HTMLElement>(".yb-mod").forEach((m) => m.classList.toggle("is-lit", t.modules.includes(m.dataset.m as never)));
  };

  // The brand the app wears, on the card (graph, step) and on the phone.
  const wear = (c: string) => [el, app].forEach((x) => x.style.setProperty("--brand", c));

  phone.add(card.id, {
    palette: [brand, ...tenants.map((t) => t.color)],
    bar: "▮▮▮",
    shift: () => cur * 0.07,
    shown: () => phone.rail(cur / (steps.length - 1), steps.length),
    frame: (now) => {
      if (steps[cur].page === "home" && !reduced() && now - tenantAt > TENANT_MS) {
        tenantAt = now;
        tenantIdx = (tenantIdx + 1) % tenants.length;
        wearTenant(tenantIdx);
      }
      if (dot && dotTo && dotFrom) {
        const f = Math.min(1, (now - dotAt) / 600), e = 1 - (1 - f) ** 3;
        const ax = dotFrom.x + dotFrom.w / 2, ay = dotFrom.y + dotFrom.h / 2;
        const bx = dotTo.x + dotTo.w / 2, by = dotTo.y + dotTo.h / 2;
        dot.setAttribute("cx", String(ax + (bx - ax) * e));
        dot.setAttribute("cy", String(ay + (by - ay) * e));
        dot.style.opacity = f < 1 ? "1" : "0";
      }
    },
  });

  function go(i: number) {
    i = Math.max(0, Math.min(steps.length - 1, i));
    phone.kick(i >= cur ? 8 : -8);
    cur = i;
    const s = steps[i];
    pages.forEach((p) => {
      p.classList.toggle("is-show", p.dataset.page === s.page);
      if (p.dataset.page === s.page) paintStates(p, s.k);
    });
    if (s.page === "home") {
      tenantIdx = Math.max(0, tenants.indexOf(home!));
      tenantAt = performance.now();
      wearTenant(tenantIdx);
    } else wear(brand);
    app.querySelector(".yb-deck")!.classList.toggle("is-load", s.flow.id === "swipe" && s.k === 0);
    app.querySelector(".yb-deck")!.classList.toggle("is-flash", s.flow.id === "swipe" && s.k === 1);
    app.querySelector(".yb-count")!.textContent = `${s.flow.id === "swipe" && s.k >= 4 ? 19 : 20} / 20`;
    app.querySelector(".yb-chead")!.classList.toggle("is-live", s.flow.id === "chat");
    app.querySelectorAll(".yb-tabbar i").forEach((t, j) => t.classList.toggle("is-on", j === TABS[s.flow.id]));
    el.querySelector(".yb-flowname")!.textContent = pick(s.flow.title);
    if (phone.current() === card.id) {
      phone.ripple();
      phone.rail(i / (steps.length - 1), steps.length);
    }
    picked = null;
    paintGraph();
    showStep();
  }

  // A node: its step in the running flow, else its first on the ride; one
  // off the ride says which flows it is in.
  const pick_ = (id: string) => {
    const s = steps[cur];
    const inFlow = steps.findIndex((x) => x.flow === s.flow && x.node === id);
    const j = inFlow >= 0 ? inFlow : steps.findIndex((x) => x.node === id);
    if (flowTab.getAttribute("aria-selected") !== "true") flowTab.click();
    if (j >= 0) return jump(j);
    picked = id;
    paintGraph();
    showNode(id);
  };

  new ResizeObserver(draw).observe(host);
  go(step(at));
  return (p) => {
    if (step(p) !== cur) go(step(p));
  };
}
