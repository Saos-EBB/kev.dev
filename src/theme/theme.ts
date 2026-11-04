import "./theme.css";
import { UI } from "../i18n/ui";
import { spillSwitch } from "./spill";

// Light/dark toggle for the header icon (markup in main.ts, colors in the
// `:root[data-theme="light"]` override in style.css). Every visit starts
// light; a choice only lasts the tab's session (sessionStorage), so the reloads
// for language and breakpoint changes keep it.

const STORAGE_KEY = "theme";
type Theme = "light" | "dark";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

const readStored = (): Theme | null => {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
};

const writeStored = (theme: Theme) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // sessionStorage unavailable (private mode etc.) — theme just won't persist.
  }
};

// Set on import, not in initThemeToggle: main.ts builds the cloth and the
// intro from the color tokens before it gets there.
document.documentElement.setAttribute("data-theme", readStored() ?? "light");

export function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>(".theme-toggle");
  if (!button) return;

  let theme: Theme = readStored() ?? "light";

  const apply = () => {
    document.documentElement.setAttribute("data-theme", theme);
    button.setAttribute("aria-pressed", String(theme === "light"));
    button.setAttribute(
      "aria-label",
      theme === "light" ? UI.themeToDark : UI.themeToLight,
    );
  };

  apply();

  // Each theme's background, for the spill. Reading the other one means
  // switching the page's theme for a moment, a style recalc of the whole page:
  // done once while the browser is idle, not on the click.
  const root = document.documentElement;
  const backgrounds: Partial<Record<Theme, string>> = {};
  const readBackgrounds = () => {
    const now = root.getAttribute("data-theme") as Theme;
    for (const t of [now === "light" ? "dark" : "light", now] as const) {
      root.setAttribute("data-theme", t);
      backgrounds[t] = getComputedStyle(document.body).backgroundColor;
    }
  };
  (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500)))(() => { if (!backgrounds.light) readBackgrounds(); });

  button.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    writeStored(theme);
    if (!backgrounds[theme]) readBackgrounds(); // clicked before the browser was ever idle
    // The new colors spill in from the top left corner (spill.ts).
    spillSwitch(apply, backgrounds[theme]!);
  });
}
