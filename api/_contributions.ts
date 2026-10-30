// Reads the contribution calendar off GitHub's public profile fragment
// (the same HTML github.com/<user> loads into its graph). No token, no
// API — but it is HTML, so if GitHub changes the markup this returns
// null and the page simply hides the graph.
// Shared by the Vercel route (api/contributions.ts) and the dev server
// middleware in vite.config.ts. The leading _ keeps Vercel from turning
// this file into a route of its own.

export const GITHUB_USER = "Saos-EBB";

export type ContributionDay = { date: string; level: number; count: number };
export type Contributions = { total: number; days: ContributionDay[] };

export async function fetchContributions(user = GITHUB_USER): Promise<Contributions | null> {
  const res = await fetch(`https://github.com/users/${user}/contributions`, {
    headers: { "user-agent": "kev.dev contribution graph", accept: "text/html" },
  });
  if (!res.ok) return null;
  return parseContributions(await res.text());
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export function parseContributions(html: string): Contributions | null {
  // Tooltips carry the counts ("3 contributions on …", "No contributions on …"),
  // keyed by the id of the day cell they describe.
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const id = attr(m[1], "for");
    const n = m[2].trim().match(/^([\d,.]+)\s+contribution/);
    if (id) counts.set(id, n ? parseInt(n[1].replace(/[,.]/g, ""), 10) : 0);
  }

  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td\b[^>]*\sdata-date="[^"]*"[^>]*>/g)) {
    const date = attr(m[0], "data-date")!;
    const level = Number(attr(m[0], "data-level") ?? 0);
    const id = attr(m[0], "id");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    days.push({ date, level: Math.min(4, Math.max(0, level)), count: (id && counts.get(id)) || 0 });
  }
  if (days.length === 0) return null;

  days.sort((a, b) => a.date.localeCompare(b.date));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return { total, days };
}
