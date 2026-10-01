// The page language. Picked once at load — from the visitor's earlier
// choice, else the browser's language (see readLang) — because the scroll scenes measure text at start-up
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

// The visitor's own choice wins. Without one (first visit), the browser's
// language list decides: the first entry we support, by its primary tag
// ("de-AT" → de). A browser in none of our five languages gets English —
// the most widely read of them. The detected language is not stored, so
// it keeps following the browser until the visitor picks one.
function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && isLang(stored)) return stored;
  } catch {
    // storage blocked — fall through to the browser's language
  }
  const wanted = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of wanted) {
    const primary = tag?.toLowerCase().split("-")[0];
    if (primary && isLang(primary)) return primary;
  }
  return "en";
}

function isLang(code: string): code is Lang {
  return LANGS.some((l) => l.code === code);
}

export const LANG: Lang = readLang();
export const RTL = LANG === "ar";

// The YourBrand page (iframe) keeps its own language store — always start
// it in the portfolio's language, so the two never disagree.
try {
  localStorage.setItem(B2B_STORE_KEY, JSON.stringify({ state: { uiLang: LANG }, version: 0 }));
} catch {
  // storage blocked
}

document.documentElement.lang = LANG;
document.documentElement.dir = RTL ? "rtl" : "ltr";

export function setLang(lang: Lang) {
  if (lang === LANG) return;
  try {
    localStorage.setItem(STORE_KEY, lang); // the YourBrand store follows on load
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
