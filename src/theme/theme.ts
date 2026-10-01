import "./theme.css";
import { UI } from "../i18n/ui";

// Light/dark toggle for the header icon (markup in main.ts, colors in the
// `:root[data-theme="light"]` override in style.css). Dark is the site's
// default look; the choice is remembered in localStorage so a return visit
// keeps it.

const STORAGE_KEY = "theme";
type Theme = "light" | "dark";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

const readStored = (): Theme | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
};

const writeStored = (theme: Theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private mode etc.) — theme just won't persist.
  }
};

export function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>(".theme-toggle");
  if (!button) return;

  let theme: Theme = readStored() ?? "dark";

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
