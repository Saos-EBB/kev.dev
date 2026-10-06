# face-dots

Photo → cut-out face → interactive dots or ASCII. Everything runs in the
browser; the photo is never uploaded.

1. **`photoToFace(photo, options)`** — cuts the head out of a photo with
   MediaPipe's multiclass selfie segmenter (hair, face, neck, accessories
   like a cap), crops to it and duotones it along a color gradient.
   Returns a canvas with a transparent background.
2. **`createFaceDots(canvas, options)`** — turns any image with
   transparency into particles: one dot (or ASCII character) per grid
   cell, sized by brightness, each on a spring. The pointer pushes them
   away, they fly back. Idle once settled.

Written for [kev.dev](https://github.com/Saos-EBB/kev.dev) — that's where
it runs live, as the last project. Free of anything site-specific.
Standalone repo: https://github.com/Saos-EBB/faceDots

## Use

```ts
import { photoToFace, createFaceDots, loadImage } from "face-dots";

const dots = createFaceDots(document.querySelector("canvas")!, {
  mode: "dots", // or "ascii"
  interactive: "all", // "mouse" | "none"
});

// A face made earlier …
dots.setImage(await loadImage("/face.webp"), { scatter: true });

// … or straight from a photo:
const face = await photoToFace(file, {
  wasmLoaderPath: "/mediapipe/vision_wasm_internal.js",
  wasmBinaryPath: "/mediapipe/vision_wasm_internal.wasm",
  modelPath: "/models/selfie_multiclass_256x256.tflite",
});
dots.setImage(face, { scatter: true });
dots.setMode("ascii");
```

## Self-hosting (no requests to anyone else)

- `npm i @mediapipe/tasks-vision` and serve its `wasm/vision_wasm_internal.js`
  and `.wasm` from your own site (with Vite: `import url from "…?url"`).
- Download the model once and serve it yourself (Apache-2.0):
  `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite`

The model is only fetched on the first `photoToFace` call.

## Options

`photoToFace`: `gradient` (stops `[pos, [r,g,b]]`, dark → bright),
`outWidth` (default 900).

`createFaceDots`: `mode`, `interactive`, `fit` (share of the canvas, 0.9),
`columns` (grid density, 100), `ascii` (characters dark → bright),
`pushRadius` (80 px).
