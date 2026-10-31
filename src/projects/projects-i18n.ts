// Translations of the project cards (projects-data.ts holds the German
// original and everything that isn't text), one file per language
// (projects-i18n-<lang>.ts). Per card id, only the text fields;
// links/screenshots are matched by position. [OFFEN] notes stay German on purpose — they're Kevin's to-dos, not copy.

import { LANG, type Lang } from "../i18n";
import type { Detail, MailFolder, ProjectCard, TenantModule } from "./project-cards";

export interface CardText {
  title?: string;
  kind?: string;
  learnGoal?: string;
  claim?: string;
  points?: string[];
  what?: string;
  meta?: string;
  decisions?: string[];
  challenge?: string;
  origin?: string;
  links?: string[];
  screenshots?: string[];
  tenantsIntro?: string;
  // Matched to the card's tenants by position; name and tier stay as they are.
  tenants?: { kind: string; about: string; video: string; screenshots: string[] }[];
  // Matched to the card's parts by position; files stay as they are.
  parts?: { name?: string; line?: string; does: string; reuse: string; pros?: string[]; cons?: string[] }[];
  // Replace the card's own as a whole (no fallback per entry).
  mailbox?: Record<MailFolder, [string, string][]>;
  layers?: Detail[];
  moduleInfo?: Record<TenantModule, Detail>;
  // Whole lists; sources: the quirks only, by position (names stay).
  features?: string[];
  steps?: string[];
  sources?: string[];
  modes?: [string, string][];
  // Labels only, by position; the numbers stay the card's.
  hoursChart?: string[];
  timelineChart?: string[];
  mascot?: string;
  widget?: string;
}

// Only the visitor's language is fetched. If that fails, the cards stay German.
const loaders: Partial<Record<Lang, () => Promise<{ default: Record<string, CardText> }>>> = {
  en: () => import("./projects-i18n-en"),
  ru: () => import("./projects-i18n-ru"),
  ja: () => import("./projects-i18n-ja"),
};
const T: Record<string, CardText> = (await loaders[LANG]?.().catch(() => null))?.default ?? {};

// The card in the current language: German original with the translated
// text laid over it. Links and screenshots keep their href/src.
export function localizeCard(card: ProjectCard): ProjectCard {
  const t = T[card.id];
  if (!t) return card;
  return {
    ...card,
    title: t.title ?? card.title,
    kind: t.kind ?? card.kind,
    learnGoal: t.learnGoal ?? card.learnGoal,
    claim: t.claim ?? card.claim,
    points: t.points ?? card.points,
    what: t.what ?? card.what,
    meta: t.meta ?? card.meta,
    decisions: t.decisions ?? card.decisions,
    challenge: t.challenge ?? card.challenge,
    origin: t.origin ?? card.origin,
    links: card.links?.map((l, i) => ({ ...l, label: t.links?.[i] ?? l.label })),
    screenshots: card.screenshots?.map((s, i) => ({ ...s, alt: t.screenshots?.[i] ?? s.alt })),
    tenantsIntro: t.tenantsIntro ?? card.tenantsIntro,
    tenants: card.tenants?.map((tenant, i) => {
      const tt = t.tenants?.[i];
      if (!tt) return tenant;
      return {
        ...tenant,
        kind: tt.kind,
        about: tt.about,
        video: { ...tenant.video, alt: tt.video },
        screenshots: tenant.screenshots.map((s, j) => ({ ...s, alt: tt.screenshots[j] ?? s.alt })),
      };
    }),
    mailbox: t.mailbox ?? card.mailbox,
    layers: t.layers ?? card.layers,
    moduleInfo: t.moduleInfo ?? card.moduleInfo,
    features: t.features ?? card.features,
    steps: t.steps ?? card.steps,
    sources: card.sources?.map(([name, quirk], i) => [name, t.sources?.[i] ?? quirk]),
    modes: t.modes ?? card.modes,
    hoursChart: card.hoursChart?.map(([label, lo, hi], i) => [t.hoursChart?.[i] ?? label, lo, hi]),
    timelineChart: card.timelineChart?.map(([label, a, b], i) => [t.timelineChart?.[i] ?? label, a, b]),
    parts: card.parts?.map((part, i) => (t.parts?.[i] ? { ...part, ...t.parts[i] } : part)),
    mascot: card.mascot && t.mascot ? { ...card.mascot, alt: t.mascot } : card.mascot,
    widget: card.widget && t.widget ? { ...card.widget, label: t.widget } : card.widget,
  };
}
