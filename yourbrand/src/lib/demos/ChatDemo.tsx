'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, EyeOff } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { containsProfanity } from '@/lib/profanity'

interface Msg { id: number; sender: 'A' | 'B'; text: string; time: string }

const INITIAL: Msg[] = [
  { id: 1, sender: 'A', text: 'Hey! Schön, dass wir verbunden sind 😊', time: '14:10' },
  { id: 2, sender: 'B', text: 'Hi! Ja, freut mich auch!', time: '14:11' },
  { id: 3, sender: 'A', text: 'Bist du heute noch online?', time: '14:28' },
  { id: 4, sender: 'B', text: 'Ja, bin noch eine Weile hier 👍', time: '14:29' },
]

const USER_A = { name: 'Sarah K.', initial: 'S', color: '#e879f9', sender: 'A' as const }
const USER_B = { name: 'Marco B.', initial: 'M', color: '#60a5fa', sender: 'B' as const }

function now() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

type User = { name: string; initial: string; color: string; sender: 'A' | 'B' }

function BlurMessage({ text, isOwn, blurHint }: { text: string; isOwn: boolean; blurHint: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <button
      onClick={() => setRevealed(r => !r)}
      title={blurHint}
      className={`rounded-2xl px-3 py-1.5 text-xs leading-relaxed relative overflow-hidden text-left ${isOwn ? 'rounded-br-sm bg-surface-container text-on-surface' : 'rounded-bl-sm bg-primary-fixed-dim text-background'}`}
    >
      <span style={{ filter: revealed ? 'none' : 'blur(6px)', userSelect: revealed ? 'text' : 'none', transition: 'filter 0.2s' }}>
        {text}
      </span>
      {!revealed && (
        <span className="absolute inset-0 flex items-center justify-center gap-1 text-[10px] font-medium opacity-70 pointer-events-none">
          <EyeOff size={10} aria-hidden /> {blurHint}
        </span>
      )}
    </button>
  )
}

function ChatPane({
  me, them, messages, scrollRef, partnerTyping, onSend, onTyping, customWords,
}: {
  me: User
  them: User
  messages: Msg[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  partnerTyping: boolean
  onSend: (sender: 'A' | 'B', text: string) => void
  onTyping: (sender: 'A' | 'B' | null) => void
  customWords: string[]
}) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')

  function send() {
    const text = input.trim()
    if (!text) return
    onSend(me.sender, text)
    onTyping(null)
    setInput('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInput(val)
    onTyping(val ? me.sender : null)
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden h-64 sm:h-[420px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-outline-variant bg-surface-container flex-shrink-0">
        <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: me.color + '33' }}>
          <span className="text-xs font-bold text-on-surface">{me.initial}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-on-surface">{me.name}</p>
          <p className="text-[10px] text-on-surface-variant">{t.chat.demoYou}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: them.color + '22' }}>
            <span className="text-[9px] font-bold" style={{ color: them.color }}>{them.initial}</span>
          </div>
          <p className="text-[10px] text-on-surface-variant">{them.name}</p>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 ml-0.5" />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map(msg => {
          const isOwn = msg.sender === me.sender
          const user = msg.sender === 'A' ? USER_A : USER_B
          const flagged = containsProfanity(msg.text, customWords)
          return (
            <div key={msg.id} className={`flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5" style={{ background: user.color + '33' }}>
                  <span className="text-[9px] font-bold text-on-surface">{user.initial}</span>
                </div>
              )}
              <div className={`flex flex-col gap-0.5 max-w-[78%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {flagged ? (
                  <BlurMessage text={msg.text} isOwn={isOwn} blurHint={t.chat.profanityBlurHint} />
                ) : (
                  <div className={`rounded-2xl px-3 py-1.5 text-xs leading-relaxed ${isOwn ? 'rounded-br-sm bg-surface-container text-on-surface' : 'rounded-bl-sm bg-primary-fixed-dim text-background'}`}>
                    {msg.text}
                  </div>
                )}
                <span className="text-[9px] text-on-surface-variant px-1">{msg.time}</span>
              </div>
            </div>
          )
        })}
        {partnerTyping && (
          <div className="flex items-end gap-1.5 justify-start">
            <div className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5" style={{ background: them.color + '33' }}>
              <span className="text-[9px] font-bold text-on-surface">{them.initial}</span>
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-primary-fixed-dim px-3 py-2">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-background animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-2.5 py-2 border-t border-outline-variant">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder={t.chat.demoWriteAs.replace('{name}', me.name)}
            className="flex-1 rounded-full border border-outline-variant bg-background px-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-fixed-dim min-h-[36px] transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="flex-shrink-0 h-9 w-full sm:w-9 rounded-lg sm:rounded-full bg-primary-fixed-dim text-on-primary-container flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Send size={13} aria-hidden />
            <span className="text-xs font-medium sm:hidden">{t.chat.demoSend}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function ChatDemo({ customWords = [] }: { customWords?: string[] }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Msg[]>(INITIAL)
  const [typing, setTyping] = useState<'A' | 'B' | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollA = useRef<HTMLDivElement>(null)
  const scrollB = useRef<HTMLDivElement>(null)

  function handleSend(sender: 'A' | 'B', text: string) {
    setMessages(ms => [...ms, { id: Date.now(), sender, text, time: now() }])
  }

  function handleTyping(sender: 'A' | 'B' | null) {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setTyping(sender)
    if (sender) {
      typingTimer.current = setTimeout(() => setTyping(null), 2000)
    }
  }

  useEffect(() => {
    if (scrollA.current) scrollA.current.scrollTop = scrollA.current.scrollHeight
    if (scrollB.current) scrollB.current.scrollTop = scrollB.current.scrollHeight
  }, [messages.length, typing])

  return (
    <div>
      <p className="text-xs text-on-surface-variant mb-3 text-center">
        {t.chat.demoHint}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <ChatPane
          me={USER_A} them={USER_B}
          messages={messages} scrollRef={scrollA}
          partnerTyping={typing === 'B'}
          onSend={handleSend} onTyping={handleTyping}
          customWords={customWords}
        />
        <ChatPane
          me={USER_B} them={USER_A}
          messages={messages} scrollRef={scrollB}
          partnerTyping={typing === 'A'}
          onSend={handleSend} onTyping={handleTyping}
          customWords={customWords}
        />
      </div>
    </div>
  )
}
