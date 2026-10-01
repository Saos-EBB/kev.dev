// The header's language menu: a globe button with the current code, a
// small list of the five languages in their own script. Picking one stores
// it and reloads (see setLang in index.ts).

import "./switcher.css";
import { LANG, LANGS, setLang, type Lang } from "./index";
import { UI } from "./ui";

export function renderLangSwitch(): string {
  const current = LANGS.find((l) => l.code === LANG)!;
  return `
    <div class="lang-switch">
      <button class="lang-button" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${UI.langAria}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span>${current.label}</span>
      </button>
      <ul class="lang-menu" role="menu" hidden>
        ${LANGS.map(
          (l) => `<li role="none"><button type="button" role="menuitemradio" aria-checked="${l.code === LANG}" data-lang="${l.code}" lang="${l.code}" dir="${l.code === "ar" ? "rtl" : "ltr"}"><b>${l.label}</b> ${l.native}</button></li>`,
        ).join("")}
      </ul>
    </div>
  `;
}

export function initLangSwitch() {
  const root = document.querySelector<HTMLElement>(".lang-switch");
  if (!root) return;
  const button = root.querySelector<HTMLButtonElement>(".lang-button")!;
  const menu = root.querySelector<HTMLElement>(".lang-menu")!;

  const setOpen = (open: boolean) => {
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    // While the menu is open the header must stay put (edge-nav.ts would
    // otherwise fade or slide it away under the pointer/finger) — see
    // .lang-menu-open in switcher.css.
    document.documentElement.classList.toggle("lang-menu-open", open);
    if (open) menu.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  };
  const isOpen = () => !menu.hidden;

  button.addEventListener("click", () => setOpen(!isOpen()));
  menu.addEventListener("click", (e) => {
    const item = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-lang]");
    if (item) setLang(item.dataset.lang as Lang);
  });
  // A click outside only closes the menu — it must not also open the
  // project card (or anything else) that happens to sit under it.
  // Capture phase, so it's stopped before any other handler sees it.
  const closeOutside = (e: Event) => {
    if (!isOpen() || root.contains(e.target as Node)) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };
  document.addEventListener("click", closeOutside, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });
}
