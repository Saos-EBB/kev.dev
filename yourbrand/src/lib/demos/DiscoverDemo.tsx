'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Users, ChevronDown, Check, Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type ConnStatus = 'NONE' | 'SENT' | 'CONNECTED'
type Gender = 'f' | 'm' | 'd'
type Looking = 'friendship' | 'relationship' | 'any'

interface Profile {
  id: string; nickname: string; age: number; city: string; distance: number
  online: boolean; interests: string[]; conn: ConnStatus; color: string
  gender: Gender; lookingFor: Looking
}

const PROFILES: Profile[] = [
  { id: 'p1', nickname: 'Sarah_K',    age: 26, city: 'Wien',     distance: 3,  online: true,  gender: 'f', lookingFor: 'relationship', interests: ['Yoga', 'Kochen', 'Reisen'],  conn: 'NONE',      color: '#e879f9' },
  { id: 'p2', nickname: 'Marco_B',    age: 31, city: 'Graz',     distance: 12, online: false, gender: 'm', lookingFor: 'friendship',   interests: ['Gaming', 'Musik'],           conn: 'CONNECTED', color: '#60a5fa' },
  { id: 'p3', nickname: 'AnnaW',      age: 24, city: 'Wien',     distance: 1,  online: true,  gender: 'f', lookingFor: 'any',          interests: ['Sport', 'Lesen'],            conn: 'NONE',      color: '#34d399' },
  { id: 'p4', nickname: 'LunaStrike', age: 29, city: 'Linz',     distance: 45, online: false, gender: 'f', lookingFor: 'friendship',   interests: ['Kunst', 'Foto'],             conn: 'SENT',      color: '#fb923c' },
  { id: 'p5', nickname: 'xPhoenix',   age: 33, city: 'Salzburg', distance: 78, online: true,  gender: 'm', lookingFor: 'relationship', interests: ['Wandern', 'Kochen'],         conn: 'NONE',      color: '#a78bfa' },
  { id: 'p6', nickname: 'MiaRosen',   age: 22, city: 'Wien',     distance: 5,  online: true,  gender: 'f', lookingFor: 'any',          interests: ['Mode', 'Tanzen'],            conn: 'NONE',      color: '#f472b6' },
  { id: 'p7', nickname: 'TomK',       age: 28, city: 'Wien',     distance: 8,  online: false, gender: 'm', lookingFor: 'friendship',   interests: ['Klettern', 'Kaffee'],        conn: 'NONE',      color: '#facc15' },
  { id: 'p8', nickname: 'ElsaB',      age: 35, city: 'Wien',     distance: 14, online: true,  gender: 'f', lookingFor: 'relationship', interests: ['Lesen', 'Wein', 'Yoga'],     conn: 'NONE',      color: '#f87171' },
]

interface Filters {
  radius: number
  gender: 'all' | Gender
  lookingFor: 'all' | Looking
  minAge: number
  maxAge: number
  onlineOnly: boolean
}

const DEFAULT_FILTERS: Filters = { radius: 100, gender: 'all', lookingFor: 'all', minAge: 18, maxAge: 50, onlineOnly: false }

function applyFilters(profiles: Profile[], f: Filters) {
  return profiles.filter(p =>
    p.distance <= f.radius &&
    (f.gender === 'all' || p.gender === f.gender) &&
    (f.lookingFor === 'all' || p.lookingFor === f.lookingFor || p.lookingFor === 'any') &&
    p.age >= f.minAge && p.age <= f.maxAge &&
    (!f.onlineOnly || p.online)
  )
}

function DualRangeSlider({ min, max, from, to, onChange }: {
  min: number; max: number; from: number; to: number
  onChange: (from: number, to: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const active = useRef<'from' | 'to' | null>(null)
  const live = useRef({ from, to, onChange })
  live.current = { from, to, onChange }

  useEffect(() => {
    function clientX(e: MouseEvent | TouchEvent) {
      return 'touches' in e ? e.touches[0].clientX : e.clientX
    }
    function snap(raw: number) {
      const rect = trackRef.current!.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (raw - rect.left) / rect.width))
      return Math.round(pct * (max - min) + min)
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (!active.current || !trackRef.current) return
      const val = snap(clientX(e))
      const { from, to, onChange } = live.current
      if (active.current === 'from') onChange(Math.min(val, to), to)
      else onChange(from, Math.max(val, from))
    }
    function onUp() { active.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [min, max])

  const fromPct = ((from - min) / (max - min)) * 100
  const toPct   = ((to   - min) / (max - min)) * 100

  return (
    <div ref={trackRef} className="relative flex items-center select-none" style={{ height: 24 }}>
      {/* Track */}
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-surface-container-highest" />
      {/* Fill */}
      <div className="absolute h-1.5 rounded-full bg-primary-fixed-dim pointer-events-none"
        style={{ left: `${fromPct}%`, right: `${100 - toPct}%` }} />
      {/* Min handle */}
      <div
        className="absolute h-4 w-4 rounded-full bg-primary-fixed-dim border-2 border-background shadow cursor-grab active:cursor-grabbing touch-none"
        style={{ left: `${fromPct}%`, transform: 'translateX(-50%)', zIndex: fromPct > 90 ? 2 : 1 }}
        onMouseDown={e => { e.preventDefault(); active.current = 'from' }}
        onTouchStart={() => { active.current = 'from' }}
      />
      {/* Max handle */}
      <div
        className="absolute h-4 w-4 rounded-full bg-primary-fixed-dim border-2 border-background shadow cursor-grab active:cursor-grabbing touch-none"
        style={{ left: `${toPct}%`, transform: 'translateX(-50%)', zIndex: 2 }}
        onMouseDown={e => { e.preventDefault(); active.current = 'to' }}
        onTouchStart={() => { active.current = 'to' }}
      />
    </div>
  )
}

function Card({ p, onConn }: { p: Profile; onConn: (id: string, c: ConnStatus) => void }) {
  const { t } = useTranslation()
  return (
    <article className="rounded-xl bg-surface-container border border-outline-variant overflow-hidden flex flex-col">
      <div className="aspect-[3/4] flex items-center justify-center relative" style={{ background: p.color + '22' }}>
        <span className="text-4xl font-bold" style={{ color: p.color + 'cc' }}>{p.nickname[0].toUpperCase()}</span>
        {p.online && <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full ring-2 ring-surface-container bg-green-500" />}
      </div>
      <div className="p-2.5 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-semibold text-on-surface text-xs">{p.nickname}, {p.age}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={9} className="text-on-surface-variant flex-shrink-0" aria-hidden />
            <p className="text-[10px] text-on-surface-variant truncate">{p.city} · {p.distance} km</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {p.interests.slice(0, 2).map(i => (
            <span key={i} className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-medium">{i}</span>
          ))}
        </div>
        <div className="mt-auto">
          {p.conn === 'CONNECTED' ? (
            <div className="w-full py-1.5 rounded-full bg-primary-fixed-dim/20 text-primary-fixed-dim text-[10px] font-semibold text-center flex items-center justify-center gap-1">
              <Check size={10} aria-hidden /> {t.discover.demoConnected}
            </div>
          ) : p.conn === 'SENT' ? (
            <div className="w-full py-1.5 rounded-full bg-surface-container-high text-primary-fixed-dim text-[10px] font-semibold text-center">{t.discover.demoSent}</div>
          ) : (
            <button onClick={() => onConn(p.id, 'SENT')}
              className="w-full py-1.5 rounded-full bg-primary-fixed-dim text-on-primary-container text-[10px] font-semibold hover:opacity-90 active:scale-95 transition-all">
              {t.discover.demoConnect}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function DiscoverDemo() {
  const { t } = useTranslation()
  const [profiles, setProfiles] = useState(PROFILES)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const displayed = applyFilters(profiles, filters)

  function set<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  return (
    <div className="space-y-3">
      {/* Filter panel */}
      <div className="rounded-xl bg-surface-container border border-outline-variant p-3 space-y-3">

        {/* Row 1: city + gender + looking_for */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-on-surface-variant pointer-events-none" aria-hidden />
            <input readOnly value="Wien"
              className="w-full pl-7 pr-2 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface text-xs min-h-[36px] cursor-default focus:outline-none"
            />
          </div>
          <div className="relative">
            <select value={filters.gender} onChange={e => set('gender', e.target.value as Filters['gender'])}
              className="w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary-fixed-dim min-h-[36px] cursor-pointer">
              <option value="all">{t.discover.demoGenderAll}</option>
              <option value="f">{t.discover.demoGenderFemale}</option>
              <option value="m">{t.discover.demoGenderMale}</option>
              <option value="d">{t.discover.demoGenderDiverse}</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-on-surface-variant pointer-events-none" aria-hidden />
          </div>
          <div className="relative">
            <select value={filters.lookingFor} onChange={e => set('lookingFor', e.target.value as Filters['lookingFor'])}
              className="w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-primary-fixed-dim min-h-[36px] cursor-pointer">
              <option value="all">{t.discover.demoLookingForAll}</option>
              <option value="friendship">{t.onboarding.lookingForFriendship}</option>
              <option value="relationship">{t.onboarding.lookingForRelationship}</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-on-surface-variant pointer-events-none" aria-hidden />
          </div>
        </div>

        {/* Row 2: radius — live filter */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-on-surface-variant w-14 flex-shrink-0">{t.discover.demoRadius}</span>
          <input type="range" min={5} max={500} step={5} value={filters.radius} onChange={e => set('radius', Number(e.target.value))}
            className="flex-1 accent-primary-fixed-dim" aria-label={t.discover.demoRadius} />
          <span className="text-xs text-on-surface-variant w-16 text-right flex-shrink-0">{filters.radius} km</span>
        </div>

        {/* Row 3: age range dual slider — live filter */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-on-surface-variant w-14 flex-shrink-0">{t.discover.demoAge}</span>
          <div className="flex-1 px-1">
            <DualRangeSlider
              min={18} max={65}
              from={filters.minAge} to={filters.maxAge}
              onChange={(from, to) => setFilters(f => ({ ...f, minAge: from, maxAge: to }))}
            />
          </div>
          <span className="text-xs text-on-surface-variant w-16 text-right flex-shrink-0">{filters.minAge}–{filters.maxAge} J.</span>
        </div>

        {/* Row 4: online toggle + live result count */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
            <input type="checkbox" checked={filters.onlineOnly} onChange={e => set('onlineOnly', e.target.checked)} className="sr-only" />
            <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${filters.onlineOnly ? 'bg-primary-fixed-dim' : 'bg-surface-container-highest'}`}>
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition duration-200 ${filters.onlineOnly ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
            <span className="text-sm text-on-surface">{t.discover.demoOnlineOnly}</span>
          </label>
          <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <Search size={11} aria-hidden className="text-primary-fixed-dim" />
            {t.discover.demoFound.replace('{count}', String(displayed.length))}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayed.map(p => <Card key={p.id} p={p} onConn={(id, c) => setProfiles(ps => ps.map(x => x.id === id ? { ...x, conn: c } : x))} />)}
        {displayed.length === 0 && (
          <div className="col-span-3 flex flex-col items-center py-12 gap-2 text-on-surface-variant">
            <Users size={32} className="opacity-30" aria-hidden />
            <p className="text-sm">{t.discover.demoNoProfiles}</p>
          </div>
        )}
      </div>
    </div>
  )
}
