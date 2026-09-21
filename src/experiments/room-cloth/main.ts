// Entry for cloth.html: a copy of the About elevator room (same markup as main.ts, same
// style.css). The wall grid stays pure CSS; on the side walls 4 canvas patches sit
// flush on it (same cell, same phase, same 3D plane) and push that same grid out locally
// with the skull field. The page opens at scroll progress 0.264 (`?p=` overrides).

import "../../style.css";
import Lenis from "lenis";
import { galleryItems, cvSections, trackElevatorPerspective } from "../../about/elevator";
import { imageDepth } from "../cloth-grid/depth-map";
import { mountMeshPatch } from "./mesh-patch";
import { wallSkull } from "./skull-field";
import { baseConfig, roomCloth } from "./config";
import skullUrl from "../cloth-grid/depth/skull.png?url";

const START_PROGRESS = 0.264;

// Finer wall grid than the main page's, for this test only — walls and patches both read it.
document.documentElement.style.setProperty("--grid-cell", `${roomCloth.cell}px`);
// Hairlines are one device pixel wide, as on the main page (see main.ts).
document.documentElement.style.setProperty("--grid-line", `${1 / (window.devicePixelRatio || 1)}px`);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <section class="about" id="about">
    <div class="elevator" aria-hidden="true">
      <div class="elevator-shaft">
        <div class="elevator-wall elevator-wall--left"></div>
        <div class="elevator-wall elevator-wall--right"></div>
        <div class="elevator-wall elevator-wall--ceiling"></div>
        <div class="elevator-wall elevator-wall--floor"><div class="elevator-floor-glow"></div><div class="elevator-floor-title">Projekte</div></div>
        <div class="elevator-backwall"></div>
      </div>
      <div class="elevator-vignette elevator-vignette--top"></div>
      <div class="elevator-vignette elevator-vignette--bottom"></div>
    </div>

    <div class="about-overlay">
      ${galleryItems
        .map(
          (item) => `
        <figure class="about-gallery-item">
          <blockquote class="about-gallery-art">${item.text}</blockquote>
          <figcaption class="about-gallery-caption">
            ${item.label}${item.attribution ? ` · ${item.attribution}` : ""}
          </figcaption>
        </figure>
      `,
        )
        .join("")}
      ${cvSections
        .map(
          (section) => `
        <div class="about-cv-section">
          <h3 class="about-cv-heading">${section.heading}</h3>
          <ul class="about-cv-list">
            ${section.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `,
        )
        .join("")}
    </div>
  </section>
`;

const lenis = new Lenis({ autoRaf: true });
trackElevatorPerspective(document.querySelector<HTMLElement>("#about")!);

// --- the wall's own grid: cell, line, colour, background -----------------------------------
const rootStyle = getComputedStyle(document.documentElement);
const cell = parseFloat(rootStyle.getPropertyValue("--grid-cell"));
const linePx = parseFloat(rootStyle.getPropertyValue("--grid-line"));
const rgbOf = (css: string): [number, number, number] => {
  const [r, g, b] = css.match(/[\d.]+/g)!.map(Number);
  return [r, g, b];
};
const gridColor = rgbOf(`rgb(${rootStyle.getPropertyValue("--grid-color")})`);
const wallColor = rgbOf(getComputedStyle(document.querySelector(".elevator-wall--left")!).backgroundColor);
const depthPx = parseFloat(getComputedStyle(document.querySelector(".elevator-wall--left")!).width);
const perspective = parseFloat(getComputedStyle(document.querySelector(".elevator")!).perspective);

const skullDepth = await imageDepth(skullUrl);

// Lenis measures asynchronously; force it so lenis.limit is real before placing patches.
lenis.resize();

// Where the viewport sits at the peak — the skulls' heights are set for that scroll position.
const vw = window.innerWidth;
const vh = window.innerHeight;
const camera = { vw, vh, perspective, eyeY: lenis.limit * roomCloth.peak + vh / 2, depthPx };

// One transparent canvas per skull, lying in the wall's own plane, its vertices on the wall's
// grid corners. Only the raised quads are drawn (mesh-patch.ts); the wall itself stays pure CSS.
const grids = roomCloth.skulls.map((spec) => {
  const push = spec.height * spec.push;
  const skull = wallSkull(
    skullDepth,
    camera,
    { side: spec.side, d: spec.d, sy: spec.y * vh, height: spec.height, stretch: roomCloth.stretch, push },
    cell,
  );
  const cols = (skull.x1 - skull.x0) / cell;
  const rows = (skull.y1 - skull.y0) / cell;

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    pointerEvents: "none",
    left: `${skull.x0}px`,
    top: `${skull.y0}px`,
    // + one line width: a line occupies [k·cell, k·cell + line), so the last one needs the room.
    width: `${cols * cell + linePx}px`,
    height: `${rows * cell + linePx}px`,
  });
  document.querySelector(`.elevator-wall--${spec.side}`)!.append(canvas);

  return mountMeshPatch({
    canvas,
    cols,
    rows,
    cell,
    linePx,
    field: skull.field,
    maxPush: push,
    displace: skull.displace,
    cloth: baseConfig,
    wallColor,
    lineColor: gridColor,
    lineStrength: roomCloth.lineStrength,
    faceStrength: roomCloth.faceStrength,
  });
});

const readout = document.querySelector<HTMLElement>("#readout")!;
function onProgress() {
  for (const g of grids) g.setProgress(lenis.progress);
  readout.textContent = `progress ${lenis.progress.toFixed(3)}`;
}
lenis.on("scroll", onProgress);

// Jump to the start position (snap = no spring, so the first paint already shows the relief).
const start = Number(new URLSearchParams(location.search).get("p") ?? START_PROGRESS);
lenis.scrollTo(lenis.limit * start, { immediate: true });
for (const g of grids) g.setProgress(start, true);
readout.textContent = `progress ${start.toFixed(3)}`;

import.meta.hot?.dispose(() => {
  for (const g of grids) g.destroy();
  lenis.destroy();
});
