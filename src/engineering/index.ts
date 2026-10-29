// Entry point for the engineering overlay, loaded with the page. It is only
// the router: the overlay itself (graph, data, styles) is a separate chunk,
// imported the first time someone opens it.
//
// Routing is a URL hash like the legal overlay: #eng/<project>[/<flow>[/<step>]].
// A plain <a href="#eng/yourbrand/login"> opens it, closing clears the hash
// with replaceState, so deep links and the back button both work.

import type Lenis from "lenis";

// Projects that have flows.
const PROJECTS = ["yourbrand", "tschobbo", "kevdev"];

export function hasEngineering(project: string): boolean {
  return PROJECTS.includes(project);
}

export function engHref(project: string, flow?: string): string {
  return `#eng/${project}${flow ? `/${flow}` : ""}`;
}

export interface EngRoute {
  project: string;
  flow?: string;
  // 0-based
  step: number;
}

function currentRoute(): EngRoute | null {
  const m = /^#eng\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?(?:\/(\d+))?$/.exec(location.hash);
  if (!m || !hasEngineering(m[1])) return null;
  return { project: m[1], flow: m[2], step: m[3] ? Math.max(0, Number(m[3]) - 1) : 0 };
}

export function initEngineering(lenis: Lenis) {
  let overlay: Promise<typeof import("./overlay")> | null = null;
  let isOpen = false;
  let wasStoppedBeforeOpen = false;

  function close() {
    history.replaceState(null, "", location.pathname + location.search);
    void render();
  }

  async function render() {
    const route = currentRoute();
    if (route) {
      if (!isOpen) {
        // Same rule as the legal overlay: only resume scrolling on close if
        // it wasn't stopped for another reason (intro, a sheet) before.
        wasStoppedBeforeOpen = lenis.isStopped;
        lenis.stop();
        isOpen = true;
      }
      overlay ??= import("./overlay");
      (await overlay).show(route, close);
    } else if (isOpen) {
      isOpen = false;
      (await overlay!).hide();
      if (!wasStoppedBeforeOpen) lenis.start();
    }
  }

  window.addEventListener("hashchange", () => void render());
  void render();
}
