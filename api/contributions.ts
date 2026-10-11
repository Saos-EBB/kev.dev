// GET /api/contributions — Kevin's GitHub contribution calendar as JSON,
// for the graph under the contact icons (src/contact/github-graph.ts).
// Fetched server-side so the visitor's browser only ever talks to kev.dev
// (no third party, nothing new for the Datenschutz page). Vercel's CDN
// caches it for an hour and serves the old copy for a day while it
// refreshes, so the graph keeps itself up to date without a redeploy.

import { fetchContributions } from "./_contributions";

export async function GET(): Promise<Response> {
  const data = await fetchContributions().catch(() => null);
  if (!data) return new Response("Contributions unavailable", { status: 502 });
  return Response.json(data, {
    headers: { "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
