// Builds the brain kit off the main thread (brain-build.ts) and hands the
// typed arrays back without copying.
import { buildBrain } from "./brain-build";

self.onmessage = (e: MessageEvent<{ spacing: number }>) => {
  const data = buildBrain(e.data.spacing);
  const transfer = new Set<ArrayBufferLike>([data.outward.buffer]);
  for (const p of data.parts) {
    for (const a of [...Object.values(p.dots), ...Object.values(p.occluder)]) transfer.add(a.buffer);
  }
  for (const a of data.anchors) transfer.add(a.buffer);
  (self as unknown as Worker).postMessage(data, [...transfer] as Transferable[]);
};
