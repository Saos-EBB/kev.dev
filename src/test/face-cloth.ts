// Test page (/test): the hero's cloth, but with Kevin's face as the
// texture instead of the name. The image is pre-processed offline
// (background removed, duotoned in the site's gradient) — only that
// result is in the repo, never the original photo.

import "./face-cloth.css";
import { Cloth } from "../hero/cloth";

const canvas = document.querySelector<HTMLCanvasElement>("#face-cloth")!;
const bounds = document.querySelector<HTMLElement>(".face-bounds")!;
const box = document.querySelector<HTMLElement>(".face-box")!;

const cloth = new Cloth(canvas, bounds, box);

const img = new Image();
img.src = "/test/face.webp";
img.decode().then(() => {
  const tex = document.createElement("canvas");
  tex.width = img.naturalWidth;
  tex.height = img.naturalHeight;
  tex.getContext("2d")!.drawImage(img, 0, 0);
  cloth.setTextTexture(tex);
  cloth.startAutoPulls();
});
