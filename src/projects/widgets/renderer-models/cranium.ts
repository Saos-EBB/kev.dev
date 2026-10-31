// The craniumCut01 CT skull, by far the biggest model and also used by the
// contact skull, the CT page and the horror game: a binary file instead of a
// JS module, so it's smaller and the browser doesn't have to parse it as code.
// /models/craniumCut01.gzbin, gzipped by us (the host wouldn't compress an
// unknown binary type): Uint32 vertex + triangle count, then Int16 x,y,z in
// thousandths, then Uint16 triangle indices. Positions and indices are stored
// as the difference to the previous value, which compresses better.
export interface Model {
  vs: { x: number; y: number; z: number }[];
  fs: number[][];
}

async function fetchCranium(): Promise<Model> {
  const res = await fetch("/models/craniumCut01.gzbin");
  if (!res.ok || !res.body) throw new Error(`craniumCut01: ${res.status}`);
  const buf = await new Response(res.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  const [nVerts, nTris] = new Uint32Array(buf, 0, 2);
  const pos = new Int16Array(buf, 8, nVerts * 3);
  const idx = new Uint16Array(buf, 8 + nVerts * 6, nTris * 3);
  for (let i = 3; i < pos.length; i++) pos[i] += pos[i - 3];
  for (let i = 1; i < idx.length; i++) idx[i] += idx[i - 1];
  const vs = Array.from({ length: nVerts }, (_, i) => ({ x: pos[i * 3] / 1000, y: pos[i * 3 + 1] / 1000, z: pos[i * 3 + 2] / 1000 }));
  const fs = Array.from({ length: nTris }, (_, i) => [idx[i * 3], idx[i * 3 + 1], idx[i * 3 + 2]]);
  return { vs, fs };
}

let cranium: Promise<Model> | null = null;
export function loadCranium() {
  cranium ??= fetchCranium().catch((e) => { cranium = null; throw e; }); // a failed load can be retried
  return cranium;
}
