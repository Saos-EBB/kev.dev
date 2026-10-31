import "./theme.css";
import { UI } from "../i18n/ui";

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

  button.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    apply();
    writeStored(theme);
  });
}
