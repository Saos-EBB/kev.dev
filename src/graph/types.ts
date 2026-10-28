// The highlight graphs (graph/*.html): one per big project, hand-picked
// nodes in layers, each node backed by real files in its repo. Every text
// comes in all four languages inline — the graph is small enough that a
// node keeps its copy in one place instead of matched by position.

import type { Lang } from "../i18n";

export type Text = Record<Lang, string>;

export interface GraphLayer {
  id: string;
  label: Text;
  // Lane color, any CSS color (usually one of the --note-N tokens).
  color: string;
}

export interface GraphNode {
  id: string;
  layer: string;
  title: Text;
  // One sentence for someone who doesn't code (the "Recruiter" view).
  plain: Text;
  // What it does technically and why it was built that way ("Dev" view).
  dev: Text;
  // Paths in the repo. `private` ones exist only in a private repo, so
  // they're shown without a link.
  files: string[];
  privateFiles?: string[];
  // A card on kev.dev this node is its own project on (e.g. the shop).
  card?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: Text;
}

export interface GraphTour {
  id: string;
  title: Text;
  intro: Text;
  steps: string[];
}

export interface GraphProject {
  id: string;
  title: string;
  accent: string;
  lead: Text;
  // GitHub blob base for file links, ending in "/".
  repoBlob: string;
  repoLabel: string;
  layers: GraphLayer[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  tours: GraphTour[];
}
