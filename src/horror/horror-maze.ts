// Hinter dir — the maze up top is new every time. It's really one winding
// path from the start to the heavy door (no forks you can get lost in), with
// a few one-step niches that look like side passages. The three items lie at
// corners: each one 3–7 turns after the one before.
//
// The upper area is x 0..14 of the map; corridors run on odd cells, walls on
// even ones. Column 15 (the door) and everything east of it is left alone.

type Cell = [number, number];
const XS = [1, 13], ZS = [1, 11]; // odd-cell bounds
const MIN_LEN = 24, MIN_TURNS = 15; // cells, corners

export function carveUpper(rows: string[], rnd = Math.random): string[] {
  const g = rows.map((r) => r.split(""));
  for (const row of g) for (let x = 0; x < 15; x++) row[x] = "#";
  const inside = (x: number, z: number) => x >= XS[0] && x <= XS[1] && z >= ZS[0] && z <= ZS[1];
  const key = (c: Cell) => c[0] * 100 + c[1];
  const start: Cell = [1, 5];
  const end: Cell = rnd() < 0.5 ? [13, 5] : [13, 7]; // next to the passage to the door at (15, 6)

  // random depth-first walk from start to end; keep the first one long and twisty enough
  let path: Cell[] = [];
  const corners = (p: Cell[]) => {
    const out: number[] = [];
    for (let i = 1; i < p.length - 1; i++) {
      const a = [p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]], b = [p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]];
      if (a[0] !== b[0] || a[1] !== b[1]) out.push(i);
    }
    return out;
  };
  for (let attempt = 0; attempt < 200 && !path.length; attempt++) {
    const p: Cell[] = [start], used = new Set([key(start)]);
    let steps = 0;
    const walk = (): boolean => {
      if (++steps > 3000) return false;
      const [x, z] = p[p.length - 1];
      if (x === end[0] && z === end[1]) return p.length >= MIN_LEN && corners(p).length >= MIN_TURNS;
      for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]].sort(() => rnd() - 0.5)) {
        const n: Cell = [x + dx, z + dz];
        if (!inside(...n) || used.has(key(n))) continue;
        p.push(n); used.add(key(n));
        if (walk()) return true;
        p.pop(); used.delete(key(n));
      }
      return false;
    };
    if (walk()) path = p;
  }

  // carve it: cells and the wall cells between them
  path.forEach(([x, z], i) => {
    g[z][x] = ".";
    if (i) g[(z + path[i - 1][1]) / 2][(x + path[i - 1][0]) / 2] = ".";
  });
  g[start[1]][start[0]] = "S";
  g[6][13] = "."; g[6][14] = "."; // out to the door

  // items at corners, each 3–7 turns after the last (and always room left for the rest)
  const turns = corners(path);
  let t = 0;
  (["a", "b", "c"] as const).forEach((id, n) => {
    t = Math.min(t + 3 + Math.floor(rnd() * 5), turns.length - (2 - n));
    const [x, z] = path[turns[t - 1]];
    g[z][x] = id;
  });

  // niches: one step into the wall here and there, so it looks like there's a choice
  for (const [x, z] of path) {
    if (rnd() > 0.25) continue;
    const open = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as Cell[]).filter(([dx, dz]) => inside(x + 2 * dx, z + 2 * dz) && g[z + 2 * dz][x + 2 * dx] === "#" && g[z + dz][x + dx] === "#");
    if (open.length) { const [dx, dz] = open[Math.floor(rnd() * open.length)]; g[z + dz][x + dx] = "."; }
  }
  return g.map((r) => r.join(""));
}
