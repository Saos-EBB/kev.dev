// Photo -> face image: cut out the head with MediaPipe's multiclass
// selfie segmenter (hair, face skin, neck, accessories like a cap), crop
// to it and duotone it along a color gradient. Runs entirely in the
// browser; the photo is never uploaded. Where the wasm and the model come
// from is up to the caller — self-host them and nothing leaves your site.

import type { ImageSegmenter } from "@mediapipe/tasks-vision";

export type RGB = [number, number, number];

export interface ProcessOptions {
  /** URL of vision_wasm_internal.js from @mediapipe/tasks-vision/wasm. */
  wasmLoaderPath: string;
  /** URL of vision_wasm_internal.wasm from @mediapipe/tasks-vision/wasm. */
  wasmBinaryPath: string;
  /** URL of selfie_multiclass_256x256.tflite. */
  modelPath: string;
  /** Duotone stops, dark to bright: [position 0..1, rgb]. */
  gradient?: [number, RGB][];
  /** Width of the returned image in px. */
  outWidth?: number;
}

/** Violet to pink to light blue — kev.dev's colors. */
export const DEFAULT_GRADIENT: [number, RGB][] = [
  [0.0, [0x14, 0x0c, 0x22]],
  [0.35, [0x6a, 0x2a, 0x8a]],
  [0.6, [0xcd, 0x57, 0xa6]],
  [0.8, [0xcd, 0x57, 0xff]],
  [1.0, [0x9f, 0xd8, 0xff]],
];

const MAX_SIDE = 1024; // working size

// selfie_multiclass categories: 0 background, 1 hair, 2 body skin,
// 3 face skin, 4 clothes, 5 accessories.
const HAIR = 1, BODY_SKIN = 2, FACE_SKIN = 3, ACCESSORIES = 5;

const segmenters = new Map<string, Promise<ImageSegmenter>>();

function getSegmenter(o: ProcessOptions) {
  let s = segmenters.get(o.modelPath);
  if (!s) {
    s = import("@mediapipe/tasks-vision").then(({ ImageSegmenter }) =>
      ImageSegmenter.createFromOptions(
        { wasmLoaderPath: o.wasmLoaderPath, wasmBinaryPath: o.wasmBinaryPath },
        {
          baseOptions: { modelAssetPath: o.modelPath },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        },
      ),
    );
    s.catch(() => segmenters.delete(o.modelPath));
    segmenters.set(o.modelPath, s);
  }
  return s;
}

function colorAt(stops: [number, RGB][], t: number): RGB {
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      const k = (t - t0) / (t1 - t0 || 1);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return stops[stops.length - 1][1];
}

/** Cuts the head out of a photo and duotones it. Throws if no head is found. */
export async function photoToFace(photo: Blob, options: ProcessOptions): Promise<HTMLCanvasElement> {
  const stops = options.gradient ?? DEFAULT_GRADIENT;
  const outWidth = options.outWidth ?? 900;

  // Respects the photo's EXIF rotation (phone pictures).
  const bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(bitmap, 0, 0, w, h);

  const result = (await getSegmenter(options)).segment(src);
  const cats = result.categoryMask!.getAsUint8Array();
  // Soft edges from the per-class confidences, sharpened so the background
  // goes fully clear but hair keeps a soft rim.
  const conf = result.confidenceMasks!.map((m) => m.getAsFloat32Array());
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const keep = conf[HAIR][i] + conf[BODY_SKIN][i] + conf[FACE_SKIN][i] + conf[ACCESSORIES][i];
    const t = Math.max(0, Math.min(1, (keep - 0.35) / 0.3));
    alpha[i] = t * t * (3 - 2 * t);
  }

  // Crop to the head (hair, face, accessories — body skin would pull in
  // the arms), then a bit further down for the neck.
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++) {
    const c = cats[i];
    if (c !== HAIR && c !== FACE_SKIN && c !== ACCESSORIES) continue;
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  result.close();
  if (x1 <= x0 || y1 <= y0) throw new Error("no head found");

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
  // Stretch the head's own tonal range over the whole gradient, so a dim
  // photo and a bright one end up looking alike.
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.03)] ?? 0;
  const hi = sample[Math.floor(sample.length * 0.97)] ?? 1;

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) {
    const fade = Math.min(1, (ch - y) / (ch * 0.15)); // soft bottom edge
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      const [r, g, b] = colorAt(stops, Math.max(0, Math.min(1, (lum[i] - lo) / (hi - lo || 1))));
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = alpha[(y + y0) * w + x + x0] * fade * 255;
    }
  }
  octx.putImageData(img, 0, 0);

  const fin = document.createElement("canvas");
  fin.width = outWidth;
  fin.height = Math.round((outWidth * ch) / cw);
  const fctx = fin.getContext("2d")!;
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(out, 0, 0, fin.width, fin.height);
  return fin;
}

/** Loads an image URL into a canvas (e.g. a face made earlier). */
export async function loadImage(url: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c;
}
