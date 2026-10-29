// The engineering overlay (#eng/<project>/<flow>): per project a fixed
// module graph and a handful of flows through it. A flow is a numbered
// path of steps; each step sits on one node and explains what happens
// there, plain and technical, with a verbatim code excerpt from the public
// repo. Edges aren't hand-drawn: they are the consecutive step pairs of all
// flows, so every line in the graph is one some flow actually takes.

import type { Lang } from "../i18n";

// German is the source language; a missing translation falls back to it.
export type Text = { de: string } & Partial<Record<Lang, string>>;

export interface CodeExcerpt {
  file: string;
  // Cut ranges in the file, e.g. "21–34" or "8–12, 27–32".
  lines: string;
  lang: string;
  code: string;
}

export interface EngLayer {
  id: string;
  label: Text;
  // Any CSS color, usually one of the --note-N tokens.
  color: string;
}

// Position is fixed by the data: the layer is the column, the order of the
// node within its layer is the row. No simulation, nothing moves.
export interface EngNode {
  id: string;
  layer: string;
  label: Text;
}

export interface EngStep {
  node: string;
  title: Text;
  // For someone who doesn't code.
  plain: Text;
  // What happens technically.
  dev: Text;
  // Key into the project's generated CODE map.
  code?: string;
  // Repo paths besides the excerpt's own file; a trailing "/" is a folder.
  files?: string[];
  why?: Text;
}

export interface EngFlow {
  id: string;
  title: Text;
  steps: EngStep[];
}

export interface EngProject {
  id: string;
  title: string;
  accent: string;
  lead: Text;
  repoUrl: string;
  // Commit the excerpts were cut at; code links point there so the line
  // numbers stay right when main moves on.
  commit: string;
  layers: EngLayer[];
  nodes: EngNode[];
  flows: EngFlow[];
  code: Record<string, CodeExcerpt>;
}
