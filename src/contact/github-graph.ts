// Kevin's GitHub contribution calendar under the contact icons. Data comes
// from /api/contributions (api/contributions.ts — fetched and cached
// server-side, so it updates itself and the visitor never talks to GitHub).
// Drawn as one SVG, columns = weeks starting Sunday, rows = weekdays, the
// same grid as on github.com. If the data can't be loaded the whole block
// stays hidden instead of showing an empty frame.

import type { Contributions } from "../../api/_contributions";
import { UI } from "../i18n/ui";
import { LANG } from "../i18n";

const CELL = 10;
const GAP = 3;
const STEP = CELL + GAP;

export async function mountGithubGraph(link: HTMLAnchorElement) {
  const res = await fetch("/api/contributions").catch(() => null);
  const data: Contributions | null = res?.ok ? await res.json().catch(() => null) : null;
  if (!data?.days.length) {
    link.hidden = true;
    return;
  }

  const offset = new Date(`${data.days[0].date}T00:00:00Z`).getUTCDay();
  const weeks = Math.ceil((data.days.length + offset) / 7);
  const rects = data.days
    .map((d, i) => {
      const n = i + offset;
      return `<rect x="${Math.floor(n / 7) * STEP}" y="${(n % 7) * STEP}" width="${CELL}" height="${CELL}" rx="2" data-l="${d.level}"/>`;
    })
    .join("");

  const total = UI.githubContributions(data.total.toLocaleString(LANG));
  link.setAttribute("aria-label", total);
  link.innerHTML = `
    <svg class="contact-graph-grid" viewBox="0 0 ${weeks * STEP - GAP} ${7 * STEP - GAP}" aria-hidden="true">${rects}</svg>
    <span class="contact-graph-caption" aria-hidden="true">${total}</span>
  `;
}
