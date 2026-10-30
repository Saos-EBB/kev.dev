// Builds the brain kit off the main thread (brain-build.ts) and hands the
// typed arrays back without copying.
import { buildBrain } from "./brain-build";

self.onmessage = (e: MessageEvent<{ pointsScale: number }>) => {
  const data = buildBrain(e.data.pointsScale);
  const transfer: Transferable[] = [];
  for (const p of data.parts) {
    transfer.push(p.dots.position.buffer, p.dots.shade.buffer, p.dots.region.buffer, p.occluder.position.buffer, p.occluder.region.buffer, p.occluder.index.buffer);
  }
  for (const a of data.anchors) transfer.push(a.buffer);
  transfer.push(data.outward.buffer);
  (self as unknown as Worker).postMessage(data, transfer);
};
