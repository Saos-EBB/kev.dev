// Turns any photo into the cloth's face texture, right in the browser:
// cut out the head (MediaPipe's multiclass selfie segmenter: hair, face
// and neck skin), crop to it, then duotone it in the site's gradient.
// Nothing is uploaded — the photo never leaves the page — and nothing is
// fetched from anyone else: the library, its wasm and the model all come
// from this site. The model (Google's, Apache-2.0, ~16 MB in public/models/)
// only loads once a photo is actually dropped in.

import type { ImageSegmenter } from "@mediapipe/tasks-vision";
// The package's exports map hides its wasm folder, hence the plain path;
// Vite emits both files as assets, so nothing comes from a CDN.
import wasmLoaderPath from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js?url";
import wasmBinaryPath from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm?url";

// Self-hosted copy of
// storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/
const MODEL_URL = "/models/selfie_multiclass_256x256.tflite";

// selfie_multiclass categories: 0 background, 1 hair, 2 body skin,
// 3 face skin, 4 clothes, 5 accessories.

// Dark violet -> accent pink -> line purple -> light blue (style.css).
const STOPS: [number, [number, number, number]][] = [
  [0.0, [0x14, 0x0c, 0x22]],
  [0.35, [0x6a, 0x2a, 0x8a]],
  [0.6, [0xcd, 0x57, 0xa6]],
  [0.8, [0xcd, 0x57, 0xff]],
  [1.0, [0x9f, 0xd8, 0xff]],
];

const MAX_SIDE = 1024; // working size; plenty for a texture this big on screen
const OUT_WIDTH = 900;

let segmenter: Promise<ImageSegmenter> | null = null;

function getSegmenter() {
  segmenter ??= import("@mediapipe/tasks-vision").then(({ ImageSegmenter }) =>
    ImageSegmenter.createFromOptions(
      { wasmLoaderPath, wasmBinaryPath },
      {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        outputCategoryMask: true,
        outputConfidenceMasks: true,
      },
    ),
  );
  return segmenter;
}

function gradient(t: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    if (t <= t1) {
      const [t0, c0] = STOPS[i - 1];
      const k = (t - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export async function photoToFaceTexture(file: Blob): Promise<HTMLCanvasElement> {
  // Respects the photo's EXIF rotation (phone pictures).
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(bitmap, 0, 0, w, h);

  const seg = await getSegmenter();
  const result = seg.segment(src);
  const cats = result.categoryMask!.getAsUint8Array();
  // Soft edges from the per-class confidences (hair + face skin + body
  // skin + accessories, so a cap or glasses stay on), sharpened so the background goes fully clear but hair strands
  // keep a soft rim instead of the category mask's hard staircase.
  const conf = result.confidenceMasks!.map((m) => m.getAsFloat32Array());
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const keep = conf[1][i] + conf[2][i] + conf[3][i] + conf[5][i];
    const t = Math.max(0, Math.min(1, (keep - 0.35) / 0.3));
    alpha[i] = t * t * (3 - 2 * t);
  }

  // Crop to the head: hair, face skin and accessories (cap) only — body
  // skin would pull in the arms — then a bit further down for the neck.
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++) {
    if (cats[i] !== 1 && cats[i] !== 3 && cats[i] !== 5) continue;
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  result.close();
  if (x1 <= x0 || y1 <= y0) throw new Error("Kein Gesicht gefunden");

  const headH = y1 - y0;
  const padX = Math.round((x1 - x0) * 0.08);
  x0 = Math.max(0, x0 - padX);
  x1 = Math.min(w - 1, x1 + padX);
  y0 = Math.max(0, y0 - Math.round(headH * 0.04));
  y1 = Math.min(h - 1, y1 + Math.round(headH * 0.22));
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  const px = sctx.getImageData(x0, y0, cw, ch).data;
  const lum = new Float32Array(cw * ch);
  const sample: number[] = [];
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      const l = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
      lum[i] = l;
      if (alpha[(y + y0) * w + x + x0] > 0.5) sample.push(l);
    }
  }
  // Stretch the head's own tonal range across the whole gradient, so a
  // dim bathroom photo and a bright one end up looking alike.
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.03)] ?? 0;
  const hi = sample[Math.floor(sample.length * 0.97)] ?? 1;

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) {
    // Fade out the bottom 15% so the neck doesn't end in a hard line.
    const fade = Math.min(1, (ch - y) / (ch * 0.15));
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      const t = Math.max(0, Math.min(1, (lum[i] - lo) / (hi - lo || 1)));
      const [r, g, b] = gradient(t);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = alpha[(y + y0) * w + x + x0] * fade * 255;
    }
  }
  octx.putImageData(img, 0, 0);

  // Final size.
  const fin = document.createElement("canvas");
  fin.width = OUT_WIDTH;
  fin.height = Math.round((OUT_WIDTH * ch) / cw);
  const fctx = fin.getContext("2d")!;
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(out, 0, 0, fin.width, fin.height);
  return fin;
}
