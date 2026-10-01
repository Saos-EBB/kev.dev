import leoProfanity from 'leo-profanity'

leoProfanity.loadDictionary('en')
leoProfanity.add(leoProfanity.getDictionary('de') ?? [])

/** Returns true if text contains any flagged word (leo base + custom). */
export function containsProfanity(text: string, customWords: string[]): boolean {
  const lower = text.toLowerCase()
  if (leoProfanity.check(lower)) return true
  return customWords.some((w) => lower.includes(w.toLowerCase()))
}
