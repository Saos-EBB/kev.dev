// The page language. Picked once at load — from the visitor's earlier
// choice, else German — because the scroll scenes measure text at start-up
// (hero name, "PROJEKTE", contact letters); switching therefore stores the
// choice and reloads, the same way LITE (viewport.ts) is decided once.
//
// Every module reads LANG / the ui() strings at render time. Arabic sets
// dir="rtl" on <html>, so the whole page reads right to left.

export type Lang = "de" | "en" | "ru" | "ja" | "ar";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "de", label: "DE", native: "Deutsch" },
  { code: "en", label: "EN", native: "English" },
  { code: "ru", label: "RU", native: "Русский" },
  { code: "ja", label: "JA", native: "日本語" },
  { code: "ar", label: "AR", native: "العربية" },
];

const STORE_KEY = "kev-lang";
// The YourBrand sales page (yourbrand/, from b2b-cv) keeps its own language
// in this zustand-persisted key — written too, so it opens in the same one.
const B2B_STORE_KEY = "xxx-language";

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && LANGS.some((l) => l.code === stored)) return stored as Lang;
  } catch {
    // storage blocked — German
  }
  return "de";
}

export const LANG: Lang = readLang();
export const RTL = LANG === "ar";

document.documentElement.lang = LANG;
document.documentElement.dir = RTL ? "rtl" : "ltr";

export function setLang(lang: Lang) {
  if (lang === LANG) return;
  try {
    localStorage.setItem(STORE_KEY, lang);
    localStorage.setItem(B2B_STORE_KEY, JSON.stringify({ state: { uiLang: lang }, version: 0 }));
  } catch {
    // storage blocked — the reload below then just stays German
  }
  location.reload();
}

// Picks the current language's entry, German as the fallback for anything
// not translated (yet).
export function pick<T>(byLang: Partial<Record<Lang, T>> & { de: T }): T {
  return byLang[LANG] ?? byLang.de;
}
