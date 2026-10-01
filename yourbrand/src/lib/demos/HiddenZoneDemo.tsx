'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { runLogoBreak, cleanup } from '@/lib/physics/letterPhysics'

const FILMS = [
  { title: 'Fight Club (1999)', password: 'fightclub', quotes: ["The first rule of Fight Club is: You do not talk about Fight Club.", "It's only after we've lost everything that we're free to do anything.", 'I want you to hit me as hard as you can.', "This is your life, and it's ending one minute at a time.", 'You met me at a very strange time in my life.'] },
  { title: 'Reservoir Dogs (1992)', password: 'reservoirdogs', quotes: ['Are you gonna bark all day, little doggie, or are you gonna bite?', 'Why am I Mr. Pink?', "I don't tip.", "Let's go to work.", 'You shoot me in a dream, you better wake up and apologize.'] },
  { title: 'Trainspotting (1996)', password: 'trainspotting', quotes: ['Choose life.', 'Choose a job.', 'Who needs reasons when you got heroin?', 'I chose not to choose life.', "It's shite being Scottish."] },
  { title: 'A Clockwork Orange (1971)', password: 'aclockworkorange', quotes: ["What's it going to be then, eh?", 'There was me, that is Alex, and my three droogs.', 'Viddy well, little brother.', 'A bit of the old ultra-violence.', 'I was cured all right.'] },
  { title: 'American Psycho (2000)', password: 'americanpsycho', quotes: ['I have to return some videotapes.', 'Do you like Huey Lewis and the News?', 'I simply am not there.', 'This confession has meant nothing.', 'My pain is constant and sharp.'] },
]

const BRAND = undefined || 'YourBrand'

export function HiddenZoneDemo() {
  const [phase, setPhase] = useState<'logo' | 'entry' | 'unlocked'>('logo')
  const [film, setFilm] = useState(() => FILMS[Math.floor(Math.random() * FILMS.length)])
  const [logoClicks, setLogoClicks] = useState(0)
  const [logoPulse, setLogoPulse] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [typePos, setTypePos] = useState(0)
  const [fading, setFading] = useState(false)
  const [value, setValue] = useState('')
  const [shaking, setShaking] = useState(false)
  const [hint, setHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLButtonElement>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Typewriter
  useEffect(() => {
    if (phase !== 'entry') return
    const quote = film.quotes[quoteIdx]
    if (typePos >= quote.length) return
    const t = setTimeout(() => setTypePos(p => p + 1), 38)
    return () => clearTimeout(t)
  }, [typePos, quoteIdx, film.quotes, phase])

  // Cleanup physics on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
      cleanup()
    }
  }, [])

  function handleLogoClick() {
    setLogoPulse(true)
    setTimeout(() => setLogoPulse(false), 120)
    const next = logoClicks + 1
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    if (next >= 5) {
      setLogoClicks(0)
      const el = logoRef.current
      if (!el) return
runLogoBreak(BRAND, el.getBoundingClientRect(), () => setPhase('entry'))
    } else {
      setLogoClicks(next)
      clickTimerRef.current = setTimeout(() => setLogoClicks(0), 3000)
    }
  }

  function reloadFilm() {
    cleanup()
    const next = FILMS.filter(f => f.title !== film.title)
    setFilm(next[Math.floor(Math.random() * next.length)])
    setPhase('logo')
    setLogoClicks(0)
    setValue('')
    setQuoteIdx(0)
    setTypePos(0)
    setHint(false)
  }

  function nextQuote() {
    setFading(true)
    setTimeout(() => { setQuoteIdx(i => (i + 1) % film.quotes.length); setTypePos(0); setFading(false) }, 400)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const n = value.toLowerCase().replace(/\s+/g, '')
    if (n === film.password) {
      setValue('')
      setPhase('unlocked')
      return
    }
    setValue('')
    setShaking(true)
    setTimeout(() => { setShaking(false); inputRef.current?.focus() }, 450)
    nextQuote()
  }

  const Controls = (
    <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between">
      <button
        onClick={reloadFilm}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/50 hover:text-white/80 transition-colors"
        aria-label="Anderen Film laden"
      >
        <RefreshCw size={14} aria-hidden />
      </button>
    </div>
  )

  // ── Logo phase ───────────────────────────────────────────────────────────────
  if (phase === 'logo') {
    return (
      <div className="rounded-xl bg-black overflow-hidden relative flex flex-col items-center justify-center gap-6" style={{ minHeight: 380 }}>
        <button
          ref={logoRef}
          onClick={handleLogoClick}
          className={`text-2xl font-bold tracking-tight text-white select-none transition-transform duration-100 ${logoPulse ? 'scale-95' : ''}`}
          aria-label="Logo klicken"
        >
          {BRAND}
        </button>

        {/* Click progress dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${i < logoClicks ? 'bg-white/70 scale-125' : 'bg-white/15'}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Unlocked phase ───────────────────────────────────────────────────────────
  if (phase === 'unlocked') {
    return (
      <div className="rounded-xl bg-black flex flex-col items-center justify-center gap-4 px-6 text-center py-12 relative">
        {Controls}
        <div className="text-5xl">💀</div>
        <p className="text-white text-xl font-bold tracking-wider">WILLKOMMEN IN DER HIDDEN ZONE</p>
        <p className="text-white/50 text-sm max-w-xs">Beef Battles · Coin Economy · Exile · Leaderboard — L33T-Speak aktiviert 🔥</p>
        <button onClick={() => { setPhase('logo'); setValue(''); setLogoClicks(0); setQuoteIdx(0); setTypePos(0); setHint(false) }}
          className="mt-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
          ← Zurück
        </button>
      </div>
    )
  }

  // ── Entry phase ──────────────────────────────────────────────────────────────
  const quote = film.quotes[quoteIdx]
  const displayed = quote.slice(0, typePos)
  const isTyping = typePos < quote.length

  return (
    <div className="rounded-xl bg-black overflow-hidden relative" style={{ minHeight: 380 }}>
      {Controls}

      <div className="absolute inset-x-0 top-8 bottom-28 flex items-center justify-center px-8">
        <p className="text-lg italic text-white/50 text-center leading-relaxed transition-opacity duration-[400ms]" style={{ opacity: fading ? 0 : 1 }}>
          {displayed}
          {isTyping && <span className="animate-pulse opacity-60">|</span>}
        </p>
      </div>

      <div className="absolute bottom-5 inset-x-0 flex flex-col items-center gap-2.5 px-6">
        <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKey}
          autoComplete="off" autoFocus
          className={`w-full max-w-xs rounded-lg bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/30 transition-colors text-center${shaking ? ' animate-[shake_0.4s_ease]' : ''}`}
          style={shaking ? { animation: 'shake 0.4s ease' } : {}}
          placeholder="Passwort eingeben + Enter"
        />
        <button onClick={() => setHint(h => !h)} className="text-white/25 hover:text-white/45 text-[10px] transition-colors">
          {hint ? 'Hint verbergen' : 'Hint anzeigen'}
        </button>
        {hint && (
          <p className="text-white/30 text-[10px] font-mono text-center">{film.password}</p>
        )}
      </div>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`}</style>
    </div>
  )
}
