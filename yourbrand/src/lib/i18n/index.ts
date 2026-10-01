import { useLanguageStore } from '@/lib/store/languageStore'
import { de } from './de'
import { en } from './en'
import { ru } from './ru'
import { ja } from './ja'
import { ar } from './ar'

export type { Translations as TranslationKeys } from './de'
export type { UiLang as Locale } from '@/lib/store/languageStore'

const translations = { de, en, ru, ja, ar }

export function useTranslation() {
  const uiLang = useLanguageStore((s) => s.uiLang)
  const t = translations[uiLang] ?? de
  return { t, locale: uiLang }
}
