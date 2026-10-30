// Test bench for the CT skull (/saos#dev#skull#ct): the scene full screen,
// a slider for the intro choreography and buttons for the region states.
// Also driven by the hash for screenshots: #dev#skull#ct#t=0.8#hi=atlas.
import "./ct-test.css";
import { createCtScene, type Pose } from "./ct-scene";
import { ATLAS, type Part } from "./brain";
import * as THREE from "three";
import endo from "./endocast.json";

const ease = (x: number) => { const u = Math.min(Math.max(x, 0), 1); return u * u * (3 - 2 * u); };

// Intro choreography from the handoff: turn, then cut, brain fades in.
export function introPose(t: number): Pose {
  return {
    rotY: ease((t - 0.12) / 0.48) * (Math.PI / 2),
    cut: -0.95 + ease((t - 0.45) / 0.4) * 0.97,
    brain: ease((t - 0.46) / 0.22),
  };
}

type State = { label: string; parts: Part[]; colors?: Partial<Record<Part, string>>; brain?: number };
const STATES: Record<string, State> = {
  none: { label: "Nichts", parts: [] },
  yourbrand: { label: "YourBrand · frontal", parts: ["frontal"] },
  tschobbo: { label: "TschoBBo · Broca + Wernicke", parts: ["broca", "wernicke"] },
  horror: { label: "Hinter dir · Amygdala", parts: ["amygdala"], brain: 0.4 },
  renderer: { label: "3D-Renderer · occipital", parts: ["occipital"] },
  atlas: { label: "Atlas", parts: Object.keys(ATLAS) as Part[], colors: ATLAS },
};

const flags = new Map(location.hash.split("#").filter((f) => f.includes("=")).map((f) => f.split("=") as [string, string]));

document.body.classList.add("ct-test");
document.body.innerHTML = `
  <canvas class="ct-test-canvas"></canvas>
  <div class="ct-test-hud">
    <label>Scroll <input type="range" min="0" max="1" step="0.001" value="${flags.get("t") ?? "1"}"><output></output></label>
    <div class="ct-test-states">${Object.entries(STATES).map(([k, s]) => `<button type="button" data-k="${k}">${s.label}</button>`).join("")}</div>
    <p class="ct-test-status">Gehirn wird gebaut …</p>
  </div>`;

const canvas = document.querySelector<HTMLCanvasElement>(".ct-test-canvas")!;
const slider = document.querySelector<HTMLInputElement>("input")!;
const out = document.querySelector("output")!;
const status = document.querySelector<HTMLElement>(".ct-test-status")!;

const t0 = performance.now();
createCtScene(canvas, { phone: matchMedia("(max-width: 900px)").matches }).then((ct) => {
  status.textContent = `fertig in ${Math.round(performance.now() - t0)} ms`;
  let state = STATES[flags.get("hi") ?? "none"] ?? STATES.none;
  const apply = () => {
    const t = Number(slider.value);
    out.textContent = t.toFixed(2);
    const pose = introPose(t);
    if (state.brain !== undefined && pose.brain > 0) pose.brain = Math.min(pose.brain, state.brain);
    ct.setPose(pose);
    ct.setHighlight(state.parts, state.colors);
    // #ex=0.3: the lit parts come out of the brain by that much.
    const ex = Number(flags.get("ex") ?? 0);
    ct.setExplode(state.parts, ex, ex * 0.15);
  };
  // #endo: the cranial cavity (endocast.json) as white dots, to check it.
  if (location.hash.includes("#endo")) {
    const { center: c, nTheta: NT, nPhi: NP, r } = endo;
    const pts: number[] = [];
    for (let t = 0; t < NT; t++) for (let p = 0; p < NP; p++) {
      const th = ((t + 0.5) / NT) * Math.PI, ph = (p / NP) * Math.PI * 2, d = r[t * NP + p];
      pts.push(c[0] + d * Math.sin(th) * Math.sin(ph), c[1] + d * Math.cos(th), c[2] + d * Math.sin(th) * Math.cos(ph));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    ct.rig.add(new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 0.02 })));
  }
  slider.addEventListener("input", apply);
  document.querySelectorAll<HTMLButtonElement>("[data-k]").forEach((b) =>
    b.addEventListener("click", () => { state = STATES[b.dataset.k!]; apply(); }),
  );
  apply();
  document.title = "ct-ready";
}).catch((e) => {
  status.textContent = `Fehler: ${e}`;
  throw e;
});
