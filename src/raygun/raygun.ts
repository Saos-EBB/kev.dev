// Reusable "raygun" contact button — ported from the old SAOS.ME site's
// SaosButton.js/SocialButton.js (see also the sibling XXX-Frontend/b2b-cv
// projects' React ports, which this follows for the nozzle-offset math).
//
// Click it: the gun charges (audio + purple pulse), then fires one shot per
// contact icon — a canvas laser beam plus the icon flying from the button
// to its fanned-out resting spot. Click again to snap everything back.
//
// Two variants, same core sequence:
//   "fixed"  — floating bottom-left button (legal pages), creates its own
//              button/icons/canvas and appends them to <body>.
//   "inline" — the button renders inside `container` in normal document
//              flow (contact section, under the headline); the fan-out
//              icons and beam canvas still overlay the whole viewport as
//              fixed-position elements, positioned off the button's live
//              bounding rect, exactly like the fixed variant.
import "./raygun.css";
import {
  barrelTip,
  nozzlePoint,
  rotationAngleDeg,
  socialCirclePositions,
} from "./raygun-geometry";
import { UI } from "../i18n/ui";

export interface RaygunItem {
  href: string;
  label: string;
  svg: string; // inner <svg> markup, matches .contact-icons' inline icons
}

export interface RaygunOptions {
  variant?: "fixed" | "inline";
  items?: RaygunItem[];
}

const GITHUB_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.78 5.07 5.07 0 0 0-.09-3.77s-1.18-.35-3.91 1.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>';
const MAIL_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3z" /><path d="m3 6 9 7 9-7" /></svg>';
const PHONE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>';

// Mirrors the site's existing .contact-icons list (main.ts) so the same
// three channels show up everywhere the raygun button appears.
const DEFAULT_ITEMS: RaygunItem[] = [
  { href: "https://github.com/", label: "GitHub", svg: GITHUB_SVG },
  {
    href: "mailto:kevin.schaberl.work@gmail.com",
    label: "Email",
    svg: MAIL_SVG,
  },
  { href: "#contact", label: "Phone", svg: PHONE_SVG },
];

const AUDIO_PATH = "/sounds/railgun.mp3";
const ICON_PATH = "/images/raygun.png";

const LOAD_START = 1.0;
const LOAD_END = 3.0;
const SHOT_START = 5.5;
const SHOT_END = 6.0;
const SHOT_DELAY = 500;

// Nozzle — the glowing tip at the end of the barrel — sits off-centre in
// the artwork, not at the image's geometric centre. Measured on the
// 512x512 source PNG: offset (191.5, -58.5) from centre. Expressed as a
// ratio + angle so it scales with whatever size the icon renders at.
const NOZZLE_DIST_RATIO = Math.hypot(191.5, -58.5) / 512;
const NOZZLE_ANGLE_DEG = Math.atan2(-58.5, 191.5) * (180 / Math.PI);

// Beam colours match --color-line (#cd57ff) so the effect stays on-brand
// in both themes without reading CSS at runtime (that value never
// changes between light/dark — see style.css's :root[data-theme="light"]
// override, which leaves it alone).
const BEAM_OUTER = "205,87,255";
const BEAM_INNER = "235,200,255";

let styleInjected = false;
function injectChargeStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement("style");
  // A tight rim, not a diffuse cloud — small blur radii so the glow hugs
  // the png's own silhouette (drop-shadow follows alpha, not a bounding
  // box). White core + purple halo both present throughout, only their
  // strength pulses, which is what reads as a white/lila rim-light rather
  // than a single hue breathing in and out.
  style.textContent =
    "@keyframes raygun-pulse{" +
    "0%,100%{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 3px rgba(255,255,255,.6)) " +
    `drop-shadow(0 0 4px rgba(${BEAM_OUTER},.85));}` +
    "50%{filter:drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 4px rgba(255,255,255,.9)) " +
    `drop-shadow(0 0 7px rgba(${BEAM_OUTER},1));}` +
    "}" +
    ".raygun-charging{animation:raygun-pulse 0.38s ease-in-out infinite;}";
  document.head.appendChild(style);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function mountRaygunButton(
  container: HTMLElement,
  options: RaygunOptions = {},
) {
  const variant = options.variant ?? "fixed";
  const items = options.items ?? DEFAULT_ITEMS;
  const renderSize = variant === "inline" ? 84 : 60;
  const nozzleDist = NOZZLE_DIST_RATIO * renderSize;
  const iconSize = 48;

  injectChargeStyle();

  const button = document.createElement("button");
  button.type = "button";
  button.className = variant === "inline" ? "raygun-btn raygun-btn--inline" : "raygun-btn raygun-btn--fixed";
  button.setAttribute("aria-label", UI.contactOpen);
  const img = document.createElement("img");
  img.src = ICON_PATH;
  img.alt = "";
  img.width = renderSize;
  img.height = renderSize;
  button.appendChild(img);
  container.appendChild(button);

  // Fixed variant floats bottom-left of the viewport — on the legal pages
  // that's the same corner their sticky .footer sits in, so the button
  // must clear its actual (responsive, clamp()-sized) height rather than a
  // guessed constant.
  if (variant === "fixed") {
    const footer = document.querySelector<HTMLElement>(".footer");
    if (footer) {
      const updateClear = () => {
        button.style.setProperty(
          "--raygun-footer-clear",
          `${footer.getBoundingClientRect().height}px`,
        );
      };
      updateClear();
      new ResizeObserver(updateClear).observe(footer);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.className = "raygun-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const iconEls = items.map((item) => {
    const a = document.createElement("a");
    a.className = "raygun-icon";
    a.href = item.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", item.label);
    a.innerHTML = item.svg;
    a.style.width = `${iconSize}px`;
    a.style.height = `${iconSize}px`;
    document.body.appendChild(a);
    return a;
  });

  let audioCtx: AudioContext | null = null;
  let buffer: AudioBuffer | null = null;
  let loading = false;
  let open = false;
  let animating = false;
  let token: object | null = null;
  let barrelIdx = -1;

  function btnCenter() {
    const r = button.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function getPositions(count: number) {
    const rect = button.getBoundingClientRect();
    const center =
      rect.width > 0
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: 42, y: window.innerHeight - 42 };
    return socialCirclePositions(count, center, {
      width: window.innerWidth,
      height: window.innerHeight,
    }).map((p) => ({ left: p.x - iconSize / 2, top: p.y - iconSize / 2 }));
  }

  function paintBarrel(cx: number, cy: number, tx: number, ty: number) {
    const tip = barrelTip(cx, cy, tx, ty, nozzleDist);
    ctx.beginPath();
    ctx.moveTo(tip.originX, tip.originY);
    ctx.lineTo(tip.tipX, tip.tipY);
    ctx.strokeStyle = "transparent";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function drawBarrel(tx: number, ty: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bc = btnCenter();
    paintBarrel(bc.x, bc.y, tx, ty);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function rotateGun(tx: number, ty: number) {
    const bc = btnCenter();
    const angle = rotationAngleDeg(bc, tx, ty, NOZZLE_ANGLE_DEG);
    img.style.transition = "none";
    img.style.transformOrigin = "center center";
    img.style.transform = `rotate(${angle}deg)`;
  }

  function fireBeam(tx: number, ty: number, fireToken: object) {
    const bc = btnCenter();
    const { x: beamX, y: beamY } = nozzlePoint(bc, tx, ty, nozzleDist);
    const t0 = performance.now();
    const FADE = 120;
    function frame(now: number) {
      if (token !== fireToken) return;
      const t = Math.min((now - t0) / FADE, 1);
      const alpha = 1 - t;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fbc = btnCenter();
      paintBarrel(fbc.x, fbc.y, tx, ty);
      ctx.beginPath();
      ctx.moveTo(beamX, beamY);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = `rgba(${BEAM_OUTER},${alpha * 0.65})`;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(beamX, beamY);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = `rgba(${BEAM_INNER},${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.stroke();
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function snapIconsToBtn() {
    const rect = button.getBoundingClientRect();
    for (const icon of iconEls) {
      icon.style.transition = "none";
      icon.style.left = `${rect.left}px`;
      icon.style.top = `${rect.top}px`;
      icon.style.opacity = "0";
      icon.style.transform = "scale(0)";
    }
  }

  async function initAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new AudioContext();
      } catch {
        return;
      }
    }
    try {
      await audioCtx.resume();
    } catch {
      return;
    }
    if (audioCtx.state !== "running") return;
    if (buffer || loading) return;
    loading = true;
    try {
      const res = await fetch(AUDIO_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      buffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      loading = false;
    }
  }

  function playSegment(startOffset: number, duration: number) {
    if (!audioCtx || !buffer) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(audioCtx.destination);
    src.start(audioCtx.currentTime + 0.05, startOffset, duration);
  }

  async function openSocial() {
    if (animating) return;
    open = true;
    animating = true;
    const myToken = {};
    token = myToken;
    button.classList.add("open");
    snapIconsToBtn();

    const positions = getPositions(items.length);
    barrelIdx = 0;
    drawBarrel(positions[0].left + iconSize / 2, positions[0].top + iconSize / 2);
    playSegment(LOAD_START, LOAD_END - LOAD_START);
    button.classList.add("raygun-charging");

    await sleep((LOAD_END - LOAD_START) * 1000);
    if (token !== myToken) return;
    button.classList.remove("raygun-charging");

    for (let i = 0; i < items.length; i++) {
      if (token !== myToken) {
        clearCanvas();
        return;
      }
      const pos = positions[i];
      const targetX = pos.left + iconSize / 2;
      const targetY = pos.top + iconSize / 2;
      barrelIdx = i;
      drawBarrel(targetX, targetY);
      rotateGun(targetX, targetY);
      setTimeout(() => playSegment(SHOT_START, SHOT_END - SHOT_START), 75);
      fireBeam(targetX, targetY, myToken);

      const bc = btnCenter();
      const icon = iconEls[i];
      icon.style.transition = "none";
      icon.style.left = `${bc.x - iconSize / 2}px`;
      icon.style.top = `${bc.y - iconSize / 2}px`;
      icon.style.opacity = "1";
      icon.style.transform = "scale(1)";
      icon.getBoundingClientRect(); // flush before transitioning
      icon.style.transition = "left 150ms ease-out, top 150ms ease-out";
      icon.style.left = `${pos.left}px`;
      icon.style.top = `${pos.top}px`;

      await sleep(SHOT_DELAY);
    }
    if (token !== myToken) {
      clearCanvas();
      return;
    }
    animating = false;
  }

  // Instant on a click; with `durationMs` the icons fly back into the gun
  // and it turns back over that time instead (the contact section closes
  // it that way alongside its letters' return, see contact.ts).
  function closeSocial(durationMs = 0) {
    open = false;
    animating = false;
    barrelIdx = -1;
    token = {};
    button.classList.remove("open", "raygun-charging");
    clearCanvas();
    if (durationMs <= 0) {
      img.style.transition = "none";
      img.style.transform = "rotate(0deg)";
      snapIconsToBtn();
      return;
    }
    img.style.transition = `transform ${durationMs}ms ease-in-out`;
    img.style.transform = "rotate(0deg)";
    const bc = btnCenter();
    for (const icon of iconEls) {
      icon.style.transition = ["left", "top", "opacity", "transform"]
        .map((prop) => `${prop} ${durationMs}ms ease-in`)
        .join(", ");
      icon.style.left = `${bc.x - iconSize / 2}px`;
      icon.style.top = `${bc.y - iconSize / 2}px`;
      icon.style.opacity = "0";
      icon.style.transform = "scale(0)";
    }
  }

  button.addEventListener("click", async () => {
    try {
      await initAudio();
    } catch {
      // audio is optional — the fan/beam sequence still runs without it
    }
    if (open) closeSocial();
    else void openSocial();
  });

  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!open || animating) return;
    const positions = getPositions(items.length);
    iconEls.forEach((icon, i) => {
      icon.style.left = `${positions[i].left}px`;
      icon.style.top = `${positions[i].top}px`;
    });
    if (barrelIdx >= 0) {
      const p = positions[barrelIdx];
      drawBarrel(p.left + iconSize / 2, p.top + iconSize / 2);
    }
  }
  window.addEventListener("resize", handleResize);

  return {
    button,
    close(durationMs = 0) {
      if (open) closeSocial(durationMs);
    },
    destroy() {
      window.removeEventListener("resize", handleResize);
      audioCtx?.close().catch(() => {});
      canvas.remove();
      for (const icon of iconEls) icon.remove();
      button.remove();
    },
  };
}
