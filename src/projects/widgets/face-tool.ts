// FaceDots tool (the FaceDots card's live demo): pick one of Kevin's
// prepared faces or any photo, the head is cut out in the browser
// (face-dots' photoToFace — self-hosted model, nothing uploaded), then it
// becomes dots, ASCII, or the hero's cloth. Loaded lazily with the
// overlay; the cloth is only built the first time it's picked.

import "./face-tool.css";
import { UI } from "../../i18n/ui";
import type { ProjectCard } from "../project-cards";
import { createFaceDots, loadImage, photoToFace } from "../../../packages/face-dots/src";
import { FACES, PROCESS_OPTIONS, faceUrl, type FaceId } from "../face-dots-site";
// Static on purpose: the hero already has the cloth in the main bundle.
// A dynamic import() of it made the bundler need a namespace helper that
// ended up in YourBrand's chunk — the portfolio then pulled in (and
// crashed on) the whole YourBrand app.
import { Cloth } from "../../hero/cloth";

type View = "dots" | "ascii" | "cloth";

export function mount(host: HTMLElement, _card?: ProjectCard) {
  host.classList.add("ftool");
  host.innerHTML = `
    <div class="ftool-bar">
      <div class="ftool-group" role="group" aria-label="${UI.ftFacesAria}">
        ${FACES.map((id, i) => `<button type="button" data-face="${id}" aria-pressed="${i === 0}">${UI.ftFaces[i]}</button>`).join("")}
        <label class="ftool-pick">${UI.ftPick}<input type="file" accept="image/*" hidden /></label>
      </div>
      <div class="ftool-group" role="group" aria-label="${UI.ftViewAria}">
        <button type="button" data-view="dots" aria-pressed="true">${UI.ftDots}</button>
        <button type="button" data-view="ascii" aria-pressed="false">ASCII</button>
        <button type="button" data-view="cloth" aria-pressed="false">${UI.ftCloth}</button>
      </div>
    </div>
    <div class="ftool-stage">
      <canvas class="ftool-dots" aria-label="${UI.ftCanvasAria}"></canvas>
      <div class="ftool-cloth" hidden>
        <canvas></canvas>
        <div class="ftool-cloth-bounds"><div class="ftool-cloth-box"></div></div>
      </div>
      <div class="ftool-drop" hidden>${UI.ftDrop}</div>
    </div>
    <p class="ftool-status" aria-live="polite">${UI.ftHint}</p>
    <p class="ftool-privacy">${UI.ftPrivacy}</p>
  `;

  const status = host.querySelector<HTMLElement>(".ftool-status")!;
  const stage = host.querySelector<HTMLElement>(".ftool-stage")!;
  const dotsCanvas = host.querySelector<HTMLCanvasElement>(".ftool-dots")!;
  const clothWrap = host.querySelector<HTMLElement>(".ftool-cloth")!;
  const clothBox = host.querySelector<HTMLElement>(".ftool-cloth-box")!;
  const drop = host.querySelector<HTMLElement>(".ftool-drop")!;
  const faceButtons = [...host.querySelectorAll<HTMLButtonElement>("[data-face]")];
  const viewButtons = [...host.querySelectorAll<HTMLButtonElement>("[data-view]")];
  const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;

  const dots = createFaceDots(dotsCanvas, { interactive: "all" });
  let view: View = "dots";
  let face: HTMLCanvasElement | null = null;
  let cloth: Cloth | null = null;

  async function showOnCloth() {
    if (!face) return;
    if (!cloth) {
      cloth = new Cloth(
        clothWrap.querySelector("canvas")!,
        clothWrap.querySelector<HTMLElement>(".ftool-cloth-bounds")!,
        clothBox,
        { touchGrabAnyDirection: true },
      );
      cloth.startAutoPulls();
    }
    clothBox.style.aspectRatio = `${face.width} / ${face.height}`;
    cloth.refreshBounds();
    cloth.setTextTexture(face);
  }

  function setFace(img: HTMLCanvasElement) {
    face = img;
    dots.setImage(img, { scatter: true });
    if (view === "cloth") showOnCloth();
  }

  function setView(v: View) {
    view = v;
    viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    clothWrap.hidden = v !== "cloth";
    dotsCanvas.hidden = v === "cloth";
    if (v === "cloth") showOnCloth();
    else dots.setMode(v);
  }

  async function usePhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    status.textContent = UI.ftWorking;
    try {
      setFace(await photoToFace(file, PROCESS_OPTIONS));
      faceButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      status.textContent = UI.ftHint;
    } catch {
      status.textContent = UI.ftFailed;
    }
  }

  faceButtons.forEach((b) =>
    b.addEventListener("click", async () => {
      faceButtons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      setFace(await loadImage(faceUrl(b.dataset.face as FaceId)));
    }),
  );
  viewButtons.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view as View)));
  input.addEventListener("change", () => usePhoto(input.files?.[0]));

  // Drag & drop a photo onto the stage.
  let depth = 0;
  stage.addEventListener("dragenter", (e) => { e.preventDefault(); depth++; drop.hidden = false; });
  stage.addEventListener("dragleave", () => { if (--depth <= 0) drop.hidden = true; });
  stage.addEventListener("dragover", (e) => e.preventDefault());
  stage.addEventListener("drop", (e) => {
    e.preventDefault();
    depth = 0;
    drop.hidden = true;
    usePhoto(e.dataTransfer?.files[0]);
  });

  return loadImage(faceUrl("front")).then(setFace).then(() => () => dots.destroy());
}
