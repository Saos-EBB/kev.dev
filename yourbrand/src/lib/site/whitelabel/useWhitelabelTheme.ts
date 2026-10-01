'use client'

import { useEffect, useState } from 'react'

export type WhitelabelTheme = 'dark' | 'light'

function applyThemeToDom(next: WhitelabelTheme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(next)
}

// The light/dark toggle on /whitelabel used to be set from two independent
// places — a click handler and a ?theme= URL-param effect — each writing
// document.documentElement.classList on its own. Both now go through the
// same setTheme(), so there's one function that owns "what dark mode means
// on this page."
export function useWhitelabelTheme() {
  const [theme, setThemeState] = useState<WhitelabelTheme>('light')

  function setTheme(next: WhitelabelTheme) {
    setThemeState(next)
    applyThemeToDom(next)
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Apply ?theme=light|dark from URL on first mount (e.g. when linked from landing page)
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('theme')
    if (param === 'dark' || param === 'light') setTheme(param)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isDark: theme === 'dark', toggleTheme }
}
