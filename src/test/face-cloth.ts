// Test page (/test): the hero's cloth, but with Kevin's face as the
// texture instead of the name. The default face (public/test/face.webp)
// was processed offline — only that result is in the repo, never the
// original photo. Any other photo can be dropped in (or picked) and is
// cut out and duotoned right here in the browser (face-process.ts);
// "Bild speichern" downloads the result to put into public/test/.
//
// Motion is always on here (html.force-motion, like the main page), and a
// finger may grab in any direction — nothing on this page scrolls.

import "./face-cloth.css";
import { Cloth } from "../hero/cloth";

const canvas = document.querySelector<HTMLCanvasElement>("#face-cloth")!;
const bounds = document.querySelector<HTMLElement>(".face-bounds")!;
const box = document.querySelector<HTMLElement>(".face-box")!;
const hint = document.querySelector<HTMLElement>(".face-hint")!;
const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
const save = document.querySelector<HTMLButtonElement>("[data-save]")!;
const drop = document.querySelector<HTMLElement>(".face-drop")!;

const cloth = new Cloth(canvas, bounds, box, { touchGrabAnyDirection: true });

let current: HTMLCanvasElement | null = null;

function show(tex: HTMLCanvasElement) {
  current = tex;
  box.style.aspectRatio = `${tex.width} / ${tex.height}`;
  cloth.refreshBounds(); // the box changed shape: re-measure before mapping
  cloth.setTextTexture(tex);
}

const img = new Image();
img.src = "/test/face.webp";
img.decode().then(() => {
  const tex = document.createElement("canvas");
  tex.width = img.naturalWidth;
  tex.height = img.naturalHeight;
  tex.getContext("2d")!.drawImage(img, 0, 0);
  show(tex);
  cloth.startAutoPulls();
});

async function useFile(file: File | undefined) {
  if (!file || !file.type.startsWith("image/")) return;
  hint.textContent = "Wird freigestellt … (beim ersten Mal lädt das Modell, ~16 MB)";
  try {
    const { photoToFaceTexture } = await import("./face-process");
    show(await photoToFaceTexture(file));
    save.hidden = false;
    hint.textContent = "Fertig · zieh am Tuch";
  } catch (err) {
    hint.textContent = `Hat nicht geklappt: ${err instanceof Error ? err.message : err}`;
  }
}

input.addEventListener("change", () => useFile(input.files?.[0]));

let dragDepth = 0;
window.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragDepth++;
  drop.hidden = false;
});
window.addEventListener("dragleave", () => {
  if (--dragDepth <= 0) drop.hidden = true;
});
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  drop.hidden = true;
  useFile(e.dataTransfer?.files[0]);
});

save.addEventListener("click", () => {
  current?.toBlob(
    (blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "face.webp";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    "image/webp",
    0.88,
  );
});
