// The CT skull on the skull variant (/saos#dev#skull): one point skull,
// fixed at the top right over the whole page, driven by where the page is.
//  - hero + about: it turns to the side, a cut opens it, the brain appears
//  - projects: the region of the card on screen lights up
//  - catalog (desktop): atlas, every small project's region in its colour
//  - before contact: the same in reverse, back to the front; once the
//    contact section is pinned it fades out and the contact scene
//    (src/skull-site/skull-scene.ts) takes over.
// three.js + the skull model + the brain load lazily, after the page.
import "./ct-site.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LITE } from "../viewport";
import type { Pose } from "./ct-scene";
import type { Part } from "./brain-build";

// Which brain region stands for which project (the CT-Schädel concept).
const REGION: Record<string, Part[]> = {
  yourbrand: ["frontal"],
  tschobbo: ["broca", "wernicke"],
  kevdev: ["parietal"],
  renderer: ["occipital"],
  loadtest: ["cerebellum"],
  oskalizer: ["motor"],
  facedots: ["fusiform"],
  aniscript: ["temporal"],
  releasewatcher: ["thalamus"],
  grundlagen: ["hippocampus"],
  shop: ["accumbens"],
};
const ATLAS_IDS = ["loadtest", "oskalizer", "kevdev", "facedots", "aniscript", "releasewatcher", "grundlagen", "shop", "renderer"];

const ease = (x: number) => { const u = Math.min(Math.max(x, 0), 1); return u * u * (3 - 2 * u); };

// Intro choreography (t 0 → 1): turn, then cut, the brain fades in once
// the cut is under way — before that it would show through craniumCut01's
// open forehead.
function introPose(t: number): Pose {
  return {
    rotY: ease((t - 0.12) / 0.48) * (Math.PI / 2),
    cut: -0.95 + ease((t - 0.45) / 0.4) * 0.97,
    brain: ease((t - 0.46) / 0.22),
  };
}

export function initCtSkull() {
  const forceMotion = document.documentElement.classList.contains("force-motion");
  const reducedMotion = !forceMotion && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrap = document.createElement("div");
  wrap.className = "ct-skull";
  wrap.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  wrap.append(canvas);
  document.body.append(wrap);

  // Section boundaries in scroll px, re-read on every ScrollTrigger refresh.
  const at = (sel: string, start = "top top") => {
    const el = document.querySelector(sel);
    return el ? ScrollTrigger.create({ trigger: el, start }) : null;
  };
  const projects = at("#projects");
  const catalog = at("#catalog", "top center");
  const contact = at("#contact");

  const cards = () => Array.from(document.querySelectorAll<HTMLElement>("#projects article[data-card], #catalog article[data-card]"));

  // The card nearest the middle of the screen, if any is on it.
  function cardOnScreen(): string | null {
    const mx = innerWidth / 2, my = innerHeight / 2;
    let best: string | null = null, bd = Infinity;
    for (const a of cards()) {
      const r = a.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
      if (d < bd) { bd = d; best = a.dataset.card ?? null; }
    }
    return best;
  }

  let lastCard: string | null = null;

  import("./ct-scene").then(async ({ createCtScene }) => {
    const { ATLAS } = await import("./brain");
    const ct = await createCtScene(canvas, { phone: LITE });
    const atlasParts = ATLAS_IDS.flatMap((id) => REGION[id]);
    const atlasColors: Partial<Record<Part, string>> = { ...ATLAS, occipital: "#ffe08a" }; // the renderer has no atlas colour of its own

    let mode = "";
    let poseKey = "";
    function update() {
      const y = window.scrollY;
      const vh = innerHeight;
      const pStart = projects?.start ?? vh;
      const cStart = catalog?.start ?? Infinity;
      const kStart = contact?.start ?? Infinity;

      // Pose: intro over everything before the projects, the reverse over
      // the last screen before the contact pin.
      let pose = introPose(reducedMotion ? 1 : y / Math.max(pStart, 1));
      const back = ease((y - (kStart - vh)) / vh);
      if (back > 0) pose = introPose(1 - back);
      const key = `${pose.rotY.toFixed(4)} ${pose.cut?.toFixed(4)} ${pose.brain.toFixed(3)}`;
      if (key !== poseKey) {
        poseKey = key;
        ct.setPose(pose);
        wrap.style.opacity = String(1 - ease((y - kStart) / (vh * 0.3)));
      }

      // Highlight: nothing before the projects, the atlas in the catalog,
      // else the card on screen (kept while the carousel is between two).
      let next: string;
      if (y < pStart) {
        lastCard = null;
        next = "none";
      } else if (!LITE && y >= cStart && back === 0) {
        next = "atlas";
      } else {
        lastCard = cardOnScreen() ?? lastCard;
        next = `card:${lastCard}`;
      }
      if (next !== mode) {
        mode = next;
        if (mode === "atlas") ct.setHighlight(atlasParts, atlasColors);
        else ct.setHighlight(lastCard ? REGION[lastCard] ?? [] : []);
      }
      wrap.dataset.state = mode; // for tests
    }

    // Every frame, not only on scroll: the carousel is scrubbed and keeps
    // moving its cards after the scroll stops. Cheap when nothing changed.
    gsap.ticker.add(update);
    update();
    wrap.classList.add("is-ready");
  }).catch(() => wrap.remove()); // no WebGL: the page without the skull
}
