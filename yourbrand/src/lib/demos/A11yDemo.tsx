'use client'

import { useState } from 'react'

type FontSize = 'normal' | 'large' | 'xl'

const FONT_SIZES: { key: FontSize; label: string }[] = [
  { key: 'normal', label: 'Normal' },
  { key: 'large',  label: 'Groß' },
  { key: 'xl',     label: 'Sehr groß' },
]

const TEXT_SM: Record<FontSize, string> = { normal: 'text-sm', large: 'text-base', xl: 'text-lg' }
const TEXT_XS: Record<FontSize, string> = { normal: 'text-xs', large: 'text-sm',   xl: 'text-base' }

const CONTENT = {
  normal: {
    heading: 'Datenschutz & Einwilligung',
    body: 'Durch die Nutzung dieser Funktion stimmen Sie der Verarbeitung personenbezogener Daten gemäß Art. 6 Abs. 1 lit. b DSGVO zu. Eine Pseudonymisierung erfolgt automatisch.',
    hint: 'Sie können Ihre Einwilligung jederzeit widerrufen.',
  },
  simple: {
    heading: 'Deine Daten',
    body: 'Wir speichern einige Daten von dir. Das brauchen wir, damit die App funktioniert. Dein Name wird nicht weitergegeben.',
    hint: 'Du kannst das jederzeit stoppen.',
  },
}

export function A11yDemo() {
  const [fontSize, setFontSize]     = useState<FontSize>('normal')
  const [highContrast, setHighContrast] = useState(false)
  const [simple, setSimple]         = useState(false)

  const c = simple ? CONTENT.simple : CONTENT.normal

  const textSm  = TEXT_SM[fontSize]
  const textXs  = TEXT_XS[fontSize]
  const textColor = highContrast ? 'text-white'      : 'text-on-surface'
  const subColor  = highContrast ? 'text-yellow-300' : 'text-on-surface-variant'
  const hintColor = highContrast ? 'text-green-400'  : 'text-on-surface-variant'
  const bg        = highContrast ? 'bg-black'        : 'bg-surface-container'
  const cardBg    = highContrast
    ? 'bg-zinc-900 border-zinc-600'
    : 'bg-surface-container-high border-outline-variant'

  function Btn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
          active
            ? 'bg-primary-fixed-dim text-on-primary-container border-primary-fixed-dim'
            : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden select-none">
      {/* Controls */}
      <div className="flex gap-2 p-3 bg-surface-container-low border-b border-outline-variant flex-wrap">
        <div className="flex gap-1">
          {FONT_SIZES.map(({ key, label }) => (
            <Btn key={key} active={fontSize === key} onClick={() => setFontSize(key)} label={label} />
          ))}
        </div>
        <Btn active={highContrast} onClick={() => setHighContrast(v => !v)} label="Hoher Kontrast" />
        <Btn active={simple} onClick={() => setSimple(v => !v)} label="Einfache Sprache" />
      </div>

      {/* Preview */}
      <div className={`p-4 transition-colors ${bg}`}>
        <div className={`rounded-xl border p-4 transition-colors ${cardBg}`}>
          <p className={`font-semibold mb-2 transition-all ${textSm} ${textColor}`}>
            {c.heading}
          </p>
          <p className={`leading-relaxed mb-3 transition-all ${textSm} ${subColor}`}>
            {c.body}
          </p>
          <p className={`transition-all ${textXs} ${hintColor}`}>
            {c.hint}
          </p>
        </div>
      </div>
    </div>
  )
}
