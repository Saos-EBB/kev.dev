// scatter() (dots.ts) off the main thread, for the skull (skull.ts).
import { mulberry, scatter } from "./dots";

export type ScatterJob = { pos: Float32Array; nrm: Float32Array; index: Uint32Array | Uint16Array; spacing: number; seed: number };

self.onmessage = (e: MessageEvent<ScatterJob>) => {
  const { pos, nrm, index, spacing, seed } = e.data;
  const s = scatter(pos, nrm, index, spacing, mulberry(seed));
  const position = s.position.slice(), normal = s.normal.slice();
  (self as unknown as Worker).postMessage({ position, normal }, [position.buffer, normal.buffer]);
};
