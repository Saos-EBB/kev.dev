// kev.dev's side of the face-dots module (packages/face-dots): where its
// files live on this site, the prepared faces, and mounting the live face
// on the FaceDots card (desktop card, phone list entry, phone sheet).
// Everything is self-hosted — library, wasm and model come from this
// domain, nothing is requested from anyone else.

import { createFaceDots, loadImage, type FaceDots, type ProcessOptions } from "../../packages/face-dots/src";
// The package's exports map hides its wasm folder, hence the plain path;
// Vite emits both files as assets.
import wasmLoaderPath from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js?url";
import wasmBinaryPath from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm?url";

export const PROCESS_OPTIONS: ProcessOptions = {
  wasmLoaderPath,
  wasmBinaryPath,
  // Self-hosted copy of Google's selfie_multiclass_256x256 (Apache-2.0).
  modelPath: "/face-dots/selfie_multiclass_256x256.tflite",
};

// Made from Kevin's photos with scripts/face-textures.py.
export const FACES = ["front", "left", "right", "look", "side"] as const;
export type FaceId = (typeof FACES)[number];
export const faceUrl = (id: FaceId) => `/face-dots/face-${id}.webp`;

const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !document.documentElement.classList.contains("force-motion");

const mounted = new WeakMap<HTMLCanvasElement, FaceDots>();

// Every [data-face-dots] canvas under root that isn't live yet: the face
// loads once it first scrolls near the screen and flies in each time it
// comes back into view. Mouse pushes the dots; on touch they stay put
// there, so the page still scrolls and taps still open the project.
export function mountFaceVisuals(root: ParentNode) {
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-face-dots]").forEach((canvas) => {
    if (mounted.has(canvas)) return;
    const dots = createFaceDots(canvas, { interactive: "mouse", columns: 80, fit: 0.92 });
    mounted.set(canvas, dots);
    let loaded = false;
    new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!loaded) {
          loaded = true;
          loadImage(faceUrl("front")).then((img) => dots.setImage(img, { scatter: !reduced() }));
        } else if (!reduced()) {
          dots.scatter();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    ).observe(canvas);
  });
}
