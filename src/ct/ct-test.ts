// Test bench for the CT skull (/saos#dev#skull#ct): the scene full screen,
// a slider for the intro choreography and buttons for the region states.
// Also driven by the hash for screenshots: #dev#skull#ct#t=0.8#hi=atlas.
import "./ct-test.css";
import { createCtScene, type Pose } from "./ct-scene";
import { ATLAS, type Part } from "./brain";

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
  };
  // Brain fit for tuning: #bs=0.9#by=-0.05#bz=-0.2
  const brainGroup = ct.rig.children[1];
  if (flags.has("bs")) brainGroup.scale.set(Number(flags.get("bs")), Number(flags.get("bs")) * Number(flags.get("bsy") ?? 1), Number(flags.get("bs")));
  if (flags.has("by") || flags.has("bz")) brainGroup.position.set(0, Number(flags.get("by") ?? -0.02), Number(flags.get("bz") ?? 0));
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
