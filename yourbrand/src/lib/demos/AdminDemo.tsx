'use client'

import { useState, useEffect } from 'react'
import { Inbox, Users, Zap, BookOpen, Check, X, AlertTriangle, Trash2, UserRoundX, Eye, EyeOff, ImageIcon, Music2, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type Tab = 'tickets' | 'users' | 'strikes' | 'profanity' | 'media'

const TICKETS = [
  { id: 't1', type: 'report', user: 'user_4f2a', target: 'GrumpyCat99', reason: 'Beleidigungen im Chat', created: 'Heute 09:14', status: 'open' },
  { id: 't2', type: 'appeal', user: 'ShadowFox22', target: null, reason: 'Ich wurde zu Unrecht gesperrt.', created: 'Gestern 22:05', status: 'open' },
  { id: 't3', type: 'report', user: 'LunaStrike', target: 'xXxDarkBoy', reason: 'Spam und unerwünschte Nachrichten', created: 'Gestern 14:30', status: 'closed' },
]

const USERS_DATA = [
  { id: 'u1', nickname: 'Sarah_K',     email: 's.k***@gmail.com',   role: 'user',  status: 'active', joined: '12.03.2025', strikes: 0 },
  { id: 'u2', nickname: 'GrumpyCat99', email: 'g.c***@web.de',      role: 'user',  status: 'banned', joined: '01.11.2024', strikes: 3 },
  { id: 'u3', nickname: 'Marco_B',     email: 'm.b***@outlook.de',  role: 'user',  status: 'active', joined: '28.06.2024', strikes: 1 },
  { id: 'u4', nickname: 'AdminUser1',  email: 'a***@internal.de',   role: 'admin', status: 'active', joined: '15.01.2024', strikes: 0 },
]

const STRIKES_DATA = [
  { id: 's1', user: 'GrumpyCat99', reason: 'Beleidigung',         given_by: 'AdminUser1', date: 'Heute 09:22' },
  { id: 's2', user: 'GrumpyCat99', reason: 'Spam',                given_by: 'AdminUser1', date: 'Gestern 11:00' },
  { id: 's3', user: 'Marco_B',     reason: 'Unangemessenes Foto', given_by: 'AdminUser1', date: '08.06.2025' },
]

export const PROFANITY_WORDS = ['scheiße', 'idiot', 'wichser', 'hurensohn', 'depp', 'arschloch', 'bastard']

const MEDIA_DATA = [
  { id: 'm1', type: 'image' as const, uploader: 'Sarah_K',    uploaded: 'Heute 10:14',   color: '#e879f9' },
  { id: 'm2', type: 'audio' as const, uploader: 'Marco_B',    uploaded: 'Heute 09:50',   color: '#60a5fa' },
  { id: 'm3', type: 'image' as const, uploader: 'AnnaW',      uploaded: 'Gestern 22:13', color: '#34d399' },
  { id: 'm4', type: 'audio' as const, uploader: 'LunaStrike', uploaded: 'Gestern 20:05', color: '#fb923c' },
  { id: 'm5', type: 'image' as const, uploader: 'xPhoenix',   uploaded: '08.06.2025',    color: '#a78bfa' },
  { id: 'm6', type: 'image' as const, uploader: 'MiaRosen',   uploaded: '08.06.2025',    color: '#f472b6' },
]

function TicketsPanel() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState(TICKETS)
  return (
    <div className="space-y-2.5">
      {tickets.map(ticket => (
        <div key={ticket.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ticket.type === 'report' ? 'bg-error/10 text-error' : 'bg-amber-500/10 text-amber-600'}`}>
                <AlertTriangle size={9} aria-hidden />
                {ticket.type === 'report' ? t.admin.ticketTypeReport : t.admin.ticketTypeAppeal}
              </span>
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${ticket.status === 'open' ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {ticket.status === 'open' ? t.admin.reportsFilterOpen : t.admin.reportsFilterClosed}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant flex-shrink-0">{ticket.created}</span>
          </div>
          <p className="text-sm text-on-surface">
            <span className="font-medium">{ticket.user}</span>
            {ticket.target ? <> → <span className="font-medium">{ticket.target}</span></> : ''}
          </p>
          <p className="text-xs text-on-surface-variant italic">"{ticket.reason}"</p>
          {ticket.status === 'open' && (
            <div className="flex gap-2">
              <button
                onClick={() => setTickets(ts => ts.map(x => x.id === ticket.id ? { ...x, status: 'closed' } : x))}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary-fixed-dim text-on-primary-container text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Check size={11} aria-hidden /> {t.common.close}
              </button>
              <button
                onClick={() => setTickets(ts => ts.filter(x => x.id !== ticket.id))}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-colors"
              >
                <Trash2 size={11} aria-hidden /> {t.common.delete}
              </button>
            </div>
          )}
        </div>
      ))}
      {tickets.filter(ticket => ticket.status === 'open').length === 0 && (
        <div className="text-center py-8 text-on-surface-variant text-sm">{t.admin.ticketAllDone}</div>
      )}
    </div>
  )
}

function UsersPanel() {
  const { t } = useTranslation()
  const [users, setUsers] = useState(USERS_DATA)
  const [vis, setVis] = useState<Record<string, boolean>>({})
  return (
    <div className="space-y-2">
      {users.map(u => (
        <div key={u.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-on-surface-variant">{u.nickname[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-on-surface">{u.nickname}</span>
              {u.role === 'admin' && (
                <span className="text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 px-1.5 py-0.5">
                  {t.admin.managementRoleAdmin}
                </span>
              )}
              <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${u.status === 'banned' ? 'bg-error/10 text-error' : 'bg-green-500/10 text-green-600'}`}>
                {u.status === 'banned' ? t.admin.usersFilterBanned : t.admin.usersFilterActive}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-on-surface-variant">{vis[u.id] ? u.email : u.email.slice(0, 3) + '***'}</span>
              <button onClick={() => setVis(v => ({ ...v, [u.id]: !v[u.id] }))} className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                {vis[u.id] ? <EyeOff size={10} aria-hidden /> : <Eye size={10} aria-hidden />}
              </button>
            </div>
            <p className="text-xs text-on-surface-variant/60">
              {u.strikes} Strike{u.strikes !== 1 ? 's' : ''} · {t.admin.strikesSince} {u.joined}
            </p>
          </div>
          <button
            onClick={() => setUsers(us => us.map(x => x.id === u.id ? { ...x, status: x.status === 'banned' ? 'active' : 'banned' } : x))}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.status === 'banned' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-error/10 text-error hover:bg-error/20'}`}
          >
            {u.status === 'banned' ? <><Check size={10} aria-hidden /> {t.admin.usersUnban}</> : <><UserRoundX size={10} aria-hidden /> {t.admin.usersBan}</>}
          </button>
        </div>
      ))}
    </div>
  )
}

function StrikesPanel() {
  const { t } = useTranslation()
  const [strikes, setStrikes] = useState(STRIKES_DATA)
  return (
    <div className="space-y-2">
      {strikes.map(s => (
        <div key={s.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-error" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">{s.user}</p>
            <p className="text-xs text-on-surface-variant">{s.reason} · {s.date} · von {s.given_by}</p>
          </div>
          <button
            onClick={() => setStrikes(ss => ss.filter(x => x.id !== s.id))}
            className="flex-shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X size={13} aria-hidden />
          </button>
        </div>
      ))}
      {strikes.length === 0 && (
        <div className="text-center py-8 text-on-surface-variant text-sm">{t.admin.strikesNone}</div>
      )}
    </div>
  )
}

const LEO_PREVIEW = ['ass', 'bitch', 'crap', 'damn', 'fuck', 'hell', 'shit']

export function ProfanityPanel({ customWords, addWord, removeWord }: {
  customWords: string[]
  addWord: (w: string) => void
  removeWord: (w: string) => void
}) {
  const { t } = useTranslation()
  const [newWord, setNewWord] = useState('')

  function add() {
    const w = newWord.trim().toLowerCase()
    if (!w) return
    addWord(w)
    setNewWord('')
  }

  return (
    <div className="space-y-3">
      {/* Built-in wordlist preview */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{t.admin.profanityBuiltIn} (leo-profanity EN+DE)</p>
        <div className="flex flex-wrap gap-1.5">
          {LEO_PREVIEW.map(w => (
            <span key={w} className="rounded-full bg-surface-container border border-outline-variant px-2 py-0.5 text-[10px] font-mono text-on-surface-variant/60">
              {w}
            </span>
          ))}
          <span className="rounded-full bg-surface-container border border-outline-variant px-2 py-0.5 text-[10px] text-on-surface-variant/40">…+1000</span>
        </div>
      </div>

      {/* Custom words */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newWord}
          onChange={e => setNewWord(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder={t.admin.profanityNewWord}
          className="flex-1 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary-fixed-dim transition-colors min-h-[40px]"
        />
        <button
          onClick={add}
          disabled={!newWord.trim()}
          className="px-3 py-2 rounded-xl bg-primary-fixed-dim text-on-primary-container text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
        >
          + {t.admin.profanityAdd}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {customWords.map(w => (
          <span key={w} className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-xs font-mono text-on-surface">
            {w}
            <button
              onClick={() => removeWord(w)}
              aria-label={t.admin.profanityRemoveAriaLabel.replace('{word}', w)}
              className="text-on-surface-variant/40 hover:text-error transition-colors"
            >
              <X size={10} aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant">
        {t.admin.profanityWordCount.replace('{count}', String(customWords.length))}
      </p>
      <div className="rounded-xl border border-primary-fixed-dim/30 bg-primary-fixed-dim/5 px-3 py-2.5 text-xs text-on-surface-variant">
        {t.admin.profanityDemoNote}
      </div>
    </div>
  )
}

type MediaFilter = 'all' | 'image' | 'audio'
type MediaItem = typeof MEDIA_DATA[0]

function MediaThumb({ m, large }: { m: MediaItem; large?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center relative w-full" style={{ background: m.color + '22', height: large ? 200 : undefined, aspectRatio: large ? undefined : '1' }}>
      {m.type === 'image'
        ? <ImageIcon size={large ? 48 : 24} style={{ color: m.color + 'cc' }} aria-hidden />
        : (
          <div className="flex flex-col items-center gap-2">
            <Music2 size={large ? 44 : 22} style={{ color: m.color + 'cc' }} aria-hidden />
            <div className="flex items-end gap-0.5" style={{ height: large ? 28 : 16 }}>
              {[3, 6, 4, 7, 5, 3, 6].map((h, i) => (
                <span key={i} className="w-1.5 rounded-sm" style={{ height: large ? h * 3.5 : h * 2, background: m.color + '99' }} />
              ))}
            </div>
          </div>
        )
      }
      <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.type === 'image' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
        {m.type === 'image' ? t.admin.mediaTypeImage : t.admin.mediaAudio}
      </span>
    </div>
  )
}

function MediaPanel() {
  const { t } = useTranslation()
  const [items, setItems] = useState(MEDIA_DATA)
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [swipeMode, setSwipeMode] = useState(false)
  const [swipeIdx, setSwipeIdx] = useState(0)
  const [swipeDir, setSwipeDir] = useState<'ok' | 'reject' | null>(null)
  const [gridFeedback, setGridFeedback] = useState<{ id: string; action: 'ok' | 'reject' } | null>(null)

  const visible = filter === 'all' ? items : items.filter(m => m.type === filter)
  const safeIdx = Math.min(swipeIdx, Math.max(0, visible.length - 1))
  const current = visible[safeIdx]

  useEffect(() => setSwipeIdx(0), [filter])

  useEffect(() => {
    if (!swipeMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') doSwipe('ok')
      else if (e.key === 'ArrowLeft') doSwipe('reject')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function doSwipe(action: 'ok' | 'reject') {
    if (!current || swipeDir) return
    setSwipeDir(action)
    setTimeout(() => {
      setItems(ms => ms.filter(m => m.id !== current.id))
      setSwipeDir(null)
      setSwipeIdx(i => Math.max(0, Math.min(i, visible.length - 2)))
    }, 320)
  }

  function gridAct(id: string, action: 'ok' | 'reject') {
    setGridFeedback({ id, action })
    setTimeout(() => {
      setItems(ms => ms.filter(m => m.id !== id))
      setGridFeedback(null)
    }, 450)
  }

  const empty = visible.length === 0
  const emptyState = (
    <div className="text-center py-10 text-on-surface-variant text-sm">{t.admin.mediaNoMedia}</div>
  )

  const filterLabels: Record<MediaFilter, string> = {
    all:   t.admin.swipeAll,
    image: t.admin.mediaImages,
    audio: t.admin.mediaAudio,
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', 'image', 'audio'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-primary-fixed-dim text-on-primary-container' : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'}`}>
            {filterLabels[f]}
          </button>
        ))}
        <button onClick={() => { setSwipeMode(s => !s); setSwipeIdx(0) }}
          className={`ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${swipeMode ? 'bg-primary-fixed-dim text-on-primary-container border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'}`}>
          <Play size={9} aria-hidden /> {t.admin.mediaSwipeMode}
        </button>
        <span className="text-xs text-on-surface-variant">
          {t.admin.swipePendingCount.replace('{count}', String(visible.length))}
        </span>
      </div>

      {swipeMode ? (
        empty ? emptyState : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-on-surface-variant">
              {t.admin.swipeProgress.replace('{current}', String(safeIdx + 1)).replace('{total}', String(visible.length))}
            </p>
            <div className="w-full max-w-xs"
              style={{
                transform: swipeDir === 'ok' ? 'translateX(60px) rotate(5deg)' : swipeDir === 'reject' ? 'translateX(-60px) rotate(-5deg)' : 'none',
                opacity: swipeDir ? 0 : 1,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
              }}>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low overflow-hidden shadow-lg">
                <MediaThumb m={current} large />
                <div className="px-4 py-3">
                  <p className="font-semibold text-on-surface text-sm">{current.uploader}</p>
                  <p className="text-xs text-on-surface-variant">{current.uploaded}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <button onClick={() => doSwipe('reject')} disabled={!!swipeDir}
                className="h-14 w-14 rounded-full flex items-center justify-center border-2 border-error/40 bg-surface-container hover:bg-error/10 active:scale-95 disabled:opacity-40 transition-all">
                <ChevronLeft size={26} className="text-error" aria-hidden />
              </button>
              <button onClick={() => doSwipe('ok')} disabled={!!swipeDir}
                className="h-14 w-14 rounded-full flex items-center justify-center border-2 border-green-500/40 bg-surface-container hover:bg-green-500/10 active:scale-95 disabled:opacity-40 transition-all">
                <ChevronRight size={26} className="text-green-500" aria-hidden />
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant/50">{t.admin.swipeKeyboardHint}</p>
          </div>
        )
      ) : (
        empty ? emptyState : (
          <div className="grid grid-cols-3 gap-2.5">
            {visible.map(m => {
              const fading = gridFeedback?.id === m.id
              return (
                <div key={m.id} className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden flex flex-col"
                  style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                  <div className="relative overflow-hidden">
                    <MediaThumb m={m} />
                    {fading && (
                      <div className={`absolute inset-0 flex items-center justify-center text-2xl ${gridFeedback?.action === 'ok' ? 'bg-green-500/25' : 'bg-error/25'}`}>
                        {gridFeedback?.action === 'ok' ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1.5">
                    <div>
                      <p className="text-xs font-semibold text-on-surface truncate">{m.uploader}</p>
                      <p className="text-[10px] text-on-surface-variant">{m.uploaded}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => gridAct(m.id, 'ok')}
                        className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded-lg bg-green-500/15 text-green-600 text-[10px] font-semibold hover:bg-green-500/25 transition-colors">
                        <Check size={9} aria-hidden /> {t.admin.swipeApprove}
                      </button>
                      <button onClick={() => gridAct(m.id, 'reject')}
                        className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded-lg bg-error/10 text-error text-[10px] font-semibold hover:bg-error/20 transition-colors">
                        <X size={9} aria-hidden /> {t.admin.swipeReject}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

export function AdminDemo({ customWords = [], addWord = () => {}, removeWord = () => {} }: {
  customWords?: string[]
  addWord?: (w: string) => void
  removeWord?: (w: string) => void
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('tickets')

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tickets',   label: t.admin.tabTickets,   icon: <Inbox size={13} /> },
    { key: 'users',     label: t.admin.tabUsers,     icon: <Users size={13} /> },
    { key: 'strikes',   label: t.admin.tabStrikes,   icon: <Zap size={13} /> },
    { key: 'profanity', label: t.admin.tabProfanity, icon: <BookOpen size={13} /> },
    { key: 'media',     label: t.admin.tabMedia,     icon: <ImageIcon size={13} /> },
  ]

  return (
    <div className="space-y-3">
      <div className="w-full rounded-xl bg-surface-container border border-outline-variant p-1 flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${tab === key ? 'bg-primary-fixed-dim text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
            {icon}{label}
          </button>
        ))}
      </div>
      {tab === 'tickets'   && <TicketsPanel />}
      {tab === 'users'     && <UsersPanel />}
      {tab === 'strikes'   && <StrikesPanel />}
      {tab === 'profanity' && <ProfanityPanel customWords={customWords} addWord={addWord} removeWord={removeWord} />}
      {tab === 'media'     && <MediaPanel />}
    </div>
  )
}
