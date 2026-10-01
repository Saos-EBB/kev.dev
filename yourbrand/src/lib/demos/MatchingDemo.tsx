'use client'

import { useState, useRef } from 'react'
import { Heart, X, MapPin, Sparkles, RefreshCw, CheckCircle2, MessageCircle, Calendar } from 'lucide-react'

interface Candidate { id: string; nickname: string; age: number; city: string; distance: number; bio: string; score: number; color: string; interests: { name: string; green: boolean }[] }
interface MatchItem { id: string; nickname: string; age: number; city: string; date: string; color: string }

const DECK: Candidate[] = [
  { id: 'c01', nickname: 'Sarah_K',    age: 26, city: 'Wien',      distance: 3,  score: 87, color: '#e879f9', bio: 'Yoga, Kochen und spontane Abenteuer. Suche echte Verbindungen.',            interests: [{ name: 'Yoga', green: true }, { name: 'Kochen', green: true }, { name: 'Gaming', green: false }] },
  { id: 'c02', nickname: 'AnnaW',      age: 24, city: 'Wien',      distance: 1,  score: 72, color: '#34d399', bio: 'Sportbegeistert und Bücherwurm. Mag Spaziergänge und guten Kaffee.',        interests: [{ name: 'Sport', green: true }, { name: 'Lesen', green: true }, { name: 'Party', green: false }] },
  { id: 'c03', nickname: 'MiaRosen',   age: 22, city: 'Wien',      distance: 5,  score: 64, color: '#f472b6', bio: 'Mode, Tanzen, das Leben genießen. Always good vibes only.',                  interests: [{ name: 'Mode', green: true }, { name: 'Tanzen', green: true }] },
  { id: 'c04', nickname: 'ElsaB',      age: 35, city: 'Wien',      distance: 14, score: 79, color: '#f87171', bio: 'Leseratten-Abende, guter Wein, lange Wanderungen. Suche Tiefe.',             interests: [{ name: 'Wandern', green: true }, { name: 'Wein', green: true }, { name: 'Clubs', green: false }] },
  { id: 'c05', nickname: 'LilyV',      age: 27, city: 'Graz',      distance: 18, score: 68, color: '#fb923c', bio: 'Fotografin, Reisejunkie, Katzenmama. Coffee first, everything else later.', interests: [{ name: 'Foto', green: true }, { name: 'Reisen', green: true }] },
  { id: 'c06', nickname: 'NinaK',      age: 29, city: 'Wien',      distance: 7,  score: 83, color: '#38bdf8', bio: 'Barista by day, Bookclub by night. Kein Small Talk bitte.',                  interests: [{ name: 'Kochen', green: true }, { name: 'Lesen', green: true }, { name: 'Gaming', green: false }] },
  { id: 'c07', nickname: 'LaraFox',    age: 23, city: 'Wien',      distance: 2,  score: 91, color: '#a78bfa', bio: 'Architekturstudentin, Hobbymaler, verfolge zu viele Projekte gleichzeitig.', interests: [{ name: 'Kunst', green: true }, { name: 'Architektur', green: true }] },
  { id: 'c08', nickname: 'SophieM',    age: 31, city: 'Linz',      distance: 42, score: 61, color: '#4ade80', bio: 'Tierärztin, Bergsteigerin, Fan von schlechten Wortspielen.',                  interests: [{ name: 'Tiere', green: true }, { name: 'Klettern', green: true }, { name: 'Party', green: false }] },
  { id: 'c09', nickname: 'JulianeR',   age: 28, city: 'Wien',      distance: 9,  score: 75, color: '#facc15', bio: 'Musikerin, Hobbyköchin, morgens schlechtgelaunt, abends aufgedreht.',        interests: [{ name: 'Musik', green: true }, { name: 'Kochen', green: true }] },
  { id: 'c10', nickname: 'ClaraS',     age: 25, city: 'Salzburg',  distance: 68, score: 58, color: '#e879f9', bio: 'Psychologiestudentin, Meditationsfan, liebt ehrliche Gespräche.',             interests: [{ name: 'Meditation', green: true }, { name: 'Yoga', green: true }, { name: 'Sport', green: false }] },
  { id: 'c11', nickname: 'TomK',       age: 28, city: 'Wien',      distance: 8,  score: 80, color: '#facc15', bio: 'Klettert, kocht schlecht, redet zu viel über Kaffee.',                        interests: [{ name: 'Klettern', green: true }, { name: 'Kaffee', green: true }] },
  { id: 'c12', nickname: 'MarcoB',     age: 31, city: 'Graz',      distance: 12, score: 55, color: '#60a5fa', bio: 'Gamer und Hobby-DJ. Suche jemanden für Late-Night-Sessions.',                 interests: [{ name: 'Gaming', green: true }, { name: 'Musik', green: true }, { name: 'Lesen', green: false }] },
  { id: 'c13', nickname: 'PhilW',      age: 33, city: 'Wien',      distance: 6,  score: 70, color: '#c084fc', bio: 'Softwareentwickler. Kaffe, Open Source, gelegentlich die Sonne.',             interests: [{ name: 'Tech', green: true }, { name: 'Kaffee', green: true }] },
  { id: 'c14', nickname: 'LukasN',     age: 27, city: 'Wien',      distance: 4,  score: 85, color: '#34d399', bio: 'Sportlehrer, Marathonläufer, einmal pro Jahr zu einem Festival.',             interests: [{ name: 'Sport', green: true }, { name: 'Musik', green: true }] },
  { id: 'c15', nickname: 'FabianR',    age: 30, city: 'Wien',      distance: 11, score: 67, color: '#f472b6', bio: 'Fotograf, Stadtmensch, suche jemanden für Sonnenuntergangs-Picknicks.',       interests: [{ name: 'Foto', green: true }, { name: 'Reisen', green: true }, { name: 'Gaming', green: false }] },
  { id: 'c16', nickname: 'DavidH',     age: 36, city: 'Wien',      distance: 16, score: 62, color: '#fb923c', bio: 'Koch in einem kleinen Restaurant. Ernährung ist meine Sprache.',              interests: [{ name: 'Kochen', green: true }, { name: 'Wein', green: true }] },
  { id: 'c17', nickname: 'JanP',       age: 25, city: 'Wien',      distance: 3,  score: 77, color: '#38bdf8', bio: 'Physikstudent, Schachspieler, Fan von guten Filmen.',                         interests: [{ name: 'Schach', green: true }, { name: 'Filme', green: true }, { name: 'Party', green: false }] },
  { id: 'c18', nickname: 'MaxT',       age: 29, city: 'Linz',      distance: 38, score: 73, color: '#a78bfa', bio: 'Musiker und Architekt. Suche kreative Seelen.',                               interests: [{ name: 'Musik', green: true }, { name: 'Kunst', green: true }] },
  { id: 'c19', nickname: 'BenjaO',     age: 24, city: 'Wien',      distance: 5,  score: 88, color: '#4ade80', bio: 'Veganer Koch, Skater, schreibt manchmal Gedichte.',                           interests: [{ name: 'Kochen', green: true }, { name: 'Skaten', green: true }] },
  { id: 'c20', nickname: 'SimonK',     age: 32, city: 'Salzburg',  distance: 55, score: 59, color: '#f87171', bio: 'Bergführer. Ich lebe draußen. Wirklich.',                                      interests: [{ name: 'Wandern', green: true }, { name: 'Klettern', green: true }, { name: 'Clubs', green: false }] },
  { id: 'c21', nickname: 'KarolineF',  age: 26, city: 'Wien',      distance: 6,  score: 82, color: '#e879f9', bio: 'Tänzerin und Yogalehrerin. Bewegt sich lieber als stillzusitzen.',            interests: [{ name: 'Tanzen', green: true }, { name: 'Yoga', green: true }] },
  { id: 'c22', nickname: 'IrisM',      age: 23, city: 'Wien',      distance: 2,  score: 90, color: '#facc15', bio: 'Grafikdesignerin mit einer Schwäche für Ramen und Retro-Games.',              interests: [{ name: 'Design', green: true }, { name: 'Gaming', green: true }] },
  { id: 'c23', nickname: 'LeaG',       age: 30, city: 'Wien',      distance: 13, score: 71, color: '#60a5fa', bio: 'Ärztin, hobbyweise Malerin, suche Balance zwischen Chaos und Ruhe.',          interests: [{ name: 'Kunst', green: true }, { name: 'Lesen', green: true }] },
  { id: 'c24', nickname: 'EmiliaS',    age: 28, city: 'Graz',      distance: 21, score: 65, color: '#c084fc', bio: 'Journalistin. Schreibe über alles außer Sport.',                              interests: [{ name: 'Schreiben', green: true }, { name: 'Reisen', green: true }, { name: 'Sport', green: false }] },
  { id: 'c25', nickname: 'ViolaK',     age: 27, city: 'Wien',      distance: 4,  score: 86, color: '#34d399', bio: 'Cello-Spielerin, Hobbybäckerin, suche authentische Verbindungen.',           interests: [{ name: 'Musik', green: true }, { name: 'Kochen', green: true }] },
  { id: 'c26', nickname: 'ZoeN',       age: 21, city: 'Wien',      distance: 7,  score: 69, color: '#f472b6', bio: 'Studiert Theaterwissenschaft. Liebt Drama auf der Bühne, nicht im Leben.',   interests: [{ name: 'Theater', green: true }, { name: 'Filme', green: true }] },
  { id: 'c27', nickname: 'HannaB',     age: 34, city: 'Wien',      distance: 10, score: 78, color: '#fb923c', bio: 'Unternehmerin, Mutter einer Katze, suche Spontaneität.',                      interests: [{ name: 'Reisen', green: true }, { name: 'Wein', green: true }] },
  { id: 'c28', nickname: 'TamaraN',    age: 25, city: 'Wien',      distance: 3,  score: 94, color: '#38bdf8', bio: 'Data Scientist bei Tag, Hobbyastronomin bei Nacht.',                         interests: [{ name: 'Tech', green: true }, { name: 'Astronomie', green: true }] },
  { id: 'c29', nickname: 'OliviaR',    age: 29, city: 'Wien',      distance: 8,  score: 76, color: '#a78bfa', bio: 'Produktdesignerin, Klettert, macht zu spät Abends noch Pläne.',              interests: [{ name: 'Design', green: true }, { name: 'Klettern', green: true }] },
  { id: 'c30', nickname: 'FelixB',     age: 26, city: 'Wien',      distance: 5,  score: 84, color: '#4ade80', bio: 'Barkeeper und Hobbymusiker. Jede Nacht hat eine gute Geschichte.',           interests: [{ name: 'Musik', green: true }, { name: 'Kochen', green: true }] },
]

const INITIAL_MATCHES: MatchItem[] = [
  { id: 'm1', nickname: 'LunaStrike', age: 29, city: 'Linz',     date: '08.06.2025', color: '#fb923c' },
  { id: 'm2', nickname: 'xPhoenix',   age: 33, city: 'Salzburg', date: '05.06.2025', color: '#a78bfa' },
]

function SwipeTab({ onMatch }: { onMatch: (n: string) => void }) {
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState<'like' | 'skip' | null>(null)
  const [swiping, setSwiping] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = DECK[idx]
  const hasMore = idx < DECK.length

  function swipe(action: 'like' | 'skip') {
    if (swiping || !hasMore) return
    setSwiping(true)
    setDir(action)
    if (action === 'like' && idx === 0) {
      setTimeout(() => { onMatch(DECK[0].nickname); advance() }, 300)
    } else {
      t.current = setTimeout(advance, 300)
    }
  }

  function advance() { setIdx(i => i + 1); setDir(null); setSwiping(false) }

  if (!hasMore) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Sparkles size={32} className="text-on-surface-variant opacity-30" aria-hidden />
      <p className="font-semibold text-on-surface text-sm">Alle Profile gesehen</p>
      <button onClick={() => { setIdx(0); setDir(null); setSwiping(false) }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-fixed-dim text-on-primary-container text-xs font-semibold hover:opacity-90 transition-opacity">
        <RefreshCw size={12} aria-hidden /> Neu laden
      </button>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-xs px-3 py-2 rounded-xl flex items-center gap-2 text-xs bg-surface-container border border-outline-variant">
        <Sparkles size={12} className="text-primary-fixed-dim flex-shrink-0" aria-hidden />
        <span className="text-on-surface-variant">Score basiert auf gemeinsamen Interessen</span>
      </div>

      <div className="w-full max-w-xs transition-all duration-200"
        style={{ transform: dir === 'like' ? 'translateX(8px) rotate(1.5deg)' : dir === 'skip' ? 'translateX(-8px) rotate(-1.5deg)' : 'none', opacity: swiping ? 0.8 : 1 }}>
        <article className="rounded-2xl overflow-hidden shadow-xl bg-surface-container">
          <div className="relative aspect-[3/4] flex items-center justify-center" style={{ background: current.color + '22' }}>
            <span className="text-7xl font-bold" style={{ color: current.color + 'cc' }}>{current.nickname[0].toUpperCase()}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
              <Sparkles size={10} className="text-yellow-400" aria-hidden />
              <span className="text-white text-xs font-bold">{current.score}%</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-bold text-lg">{current.nickname}, {current.age}</p>
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-white/70" aria-hidden />
                <span className="text-white/80 text-xs">{current.city} · {current.distance} km</span>
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-on-surface-variant text-xs line-clamp-2">{current.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {current.interests.map(i => (
                <span key={i.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${i.green ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/40' : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'}`}>
                  {i.green ? '💚' : '🚩'} {i.name}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      <p className="text-xs text-on-surface-variant">{idx + 1} / {DECK.length}</p>

      <div className="flex items-center gap-6">
        <button onClick={() => swipe('skip')} disabled={swiping} aria-label="Überspringen"
          className="h-14 w-14 rounded-full flex items-center justify-center border-2 border-red-500/40 bg-surface-container hover:bg-red-500/10 active:scale-95 disabled:opacity-40 transition-all">
          <X size={24} className="text-red-400" aria-hidden />
        </button>
        <button onClick={() => swipe('like')} disabled={swiping} aria-label="Liken"
          className="h-14 w-14 rounded-full flex items-center justify-center border-2 border-green-500/40 bg-surface-container hover:bg-green-500/10 active:scale-95 disabled:opacity-40 transition-all">
          <Heart size={24} className="text-green-400" fill="currentColor" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function MatchesTab({ matches }: { matches: MatchItem[] }) {
  if (matches.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Heart size={36} className="text-primary-fixed-dim" fill="currentColor" aria-hidden />
      <p className="font-semibold text-on-surface text-sm">Noch keine Matches — swipe nach rechts!</p>
    </div>
  )
  return (
    <div className="space-y-2.5">
      {matches.map(m => (
        <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold" style={{ background: m.color + '33', color: m.color }}>
            {m.nickname[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface text-sm">{m.nickname}, {m.age}</p>
            <p className="text-xs text-on-surface-variant flex items-center gap-1"><MapPin size={10} aria-hidden /> {m.city}</p>
            <p className="text-xs text-on-surface-variant flex items-center gap-1"><Calendar size={10} aria-hidden /> {m.date}</p>
          </div>
          <button className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-primary-fixed-dim text-on-primary-container hover:opacity-90 transition-opacity">
            <MessageCircle size={12} aria-hidden /> Chat
          </button>
        </div>
      ))}
    </div>
  )
}

export function MatchingDemo() {
  const [tab, setTab] = useState<'swipe' | 'matches'>('swipe')
  const [matches, setMatches] = useState<MatchItem[]>(INITIAL_MATCHES)
  const [banner, setBanner] = useState<string | null>(null)
  const bt = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMatch(n: string) {
    if (bt.current) clearTimeout(bt.current)
    setBanner(n)
    setMatches(ms => [{ id: `m${Date.now()}`, nickname: n, age: 26, city: 'Wien', date: new Date().toLocaleDateString('de-DE'), color: '#e879f9' }, ...ms])
    bt.current = setTimeout(() => setBanner(null), 2500)
  }

  return (
    <div className="space-y-3">
      {banner && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary-fixed-dim text-on-primary-container" role="status" aria-live="polite">
          <CheckCircle2 size={16} aria-hidden />
          <span className="flex-1 font-semibold text-sm">It's a Match — {banner}!</span>
          <button onClick={() => { setBanner(null); setTab('matches') }} className="text-xs font-bold underline underline-offset-2">Matches</button>
        </div>
      )}

      <div className="flex rounded-xl p-1 gap-1 bg-surface-container" role="tablist">
        {(['swipe', 'matches'] as const).map(id => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-primary-fixed-dim text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {id === 'swipe' ? 'Entdecken' : `Matches${matches.length > 0 ? ` (${matches.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'swipe' ? <SwipeTab onMatch={handleMatch} /> : <MatchesTab matches={matches} />}
    </div>
  )
}
