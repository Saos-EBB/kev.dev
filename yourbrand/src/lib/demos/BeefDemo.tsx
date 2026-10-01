'use client'

import { useState, useEffect, useRef } from 'react'
import { Swords, Trophy, RotateCcw, ChevronRight, Flame } from 'lucide-react'

type Screen   = 'pick' | 'challenge' | 'voting' | 'battle' | 'result'
type GameType = 'rpsls' | 'tictactoe' | 'deathroll'

const OPPONENTS = [
  { id: 'dj',     name: 'DJ Phantom', initial: 'D', color: '#f472b6', msg: 'Dein letzter Track war ein Witz 💀' },
  { id: 'king',   name: 'KingKäse',   initial: 'K', color: '#fb923c', msg: 'ich hab mehr followers als du hast 🐑' },
  { id: 'reaper', name: 'Reaper_X',   initial: 'R', color: '#a78bfa', msg: 'Clash? Wenn du dich traust 👊' },
]

const REASONS = [
  'Flow-Battle — wer hat mehr Bars?',
  'Credibility-Check — wer ist echter?',
  'Beef der Woche — Community entscheidet',
]

const GAMES: { id: GameType; label: string; emoji: string; desc: string }[] = [
  { id: 'rpsls',     label: 'Schere Stein Papier Echse Spock', emoji: '✌️', desc: 'Best of 3' },
  { id: 'tictactoe', label: 'Tic Tac Toe',                     emoji: '⬜', desc: '3 in einer Reihe' },
  { id: 'deathroll', label: 'Death Roll',                       emoji: '🎲', desc: 'Wer würfelt die 1?' },
]

const LIVE_COMMENTS = [
  { user: 'Mc_Benz',    text: 'DJ Phantom gewinnt das locker 🔥' },
  { user: 'FlameKid99', text: 'lmaooo voll fertig' },
  { user: 'realShadow', text: 'ich vote für den Underdog' },
  { user: 'BeatQueen',  text: 'das wird krass 👀' },
  { user: 'x0_Luca',    text: 'Community hat gesprochen' },
  { user: 'SkullBoy',   text: 'wer wettet mit mir 💀' },
  { user: 'nachtmahr_', text: 'hab 50 Coins gesetzt' },
  { user: 'xxDarkStar', text: 'beide trash ngl' },
]

// ─── RPSLS ────────────────────────────────────────────────────────────────────

const RPSLS_OPTIONS = [
  { id: 'rock',     label: 'Stein',  emoji: '✊' },
  { id: 'paper',    label: 'Papier', emoji: '✋' },
  { id: 'scissors', label: 'Schere', emoji: '✌️' },
  { id: 'lizard',   label: 'Echse',  emoji: '🦎' },
  { id: 'spock',    label: 'Spock',  emoji: '🖖' },
]

const RPSLS_WINS: Record<string, string[]> = {
  rock:     ['scissors', 'lizard'],
  paper:    ['rock', 'spock'],
  scissors: ['paper', 'lizard'],
  lizard:   ['paper', 'spock'],
  spock:    ['rock', 'scissors'],
}

function rpslsOutcome(a: string, b: string): 'win' | 'lose' | 'draw' {
  if (a === b) return 'draw'
  return RPSLS_WINS[a].includes(b) ? 'win' : 'lose'
}

function RPSLSGame({ onEnd }: { onEnd: (w: 'me' | 'bot') => void }) {
  const [rounds, setRounds] = useState<{ my: string; bot: string; result: 'win' | 'lose' | 'draw' }[]>([])
  const [pending, setPending] = useState(false)
  const ended = useRef(false)

  const score = rounds.reduce(
    (a, r) => ({ me: a.me + (r.result === 'win' ? 1 : 0), bot: a.bot + (r.result === 'lose' ? 1 : 0) }),
    { me: 0, bot: 0 }
  )

  useEffect(() => {
    if (ended.current) return
    if (score.me >= 2) { ended.current = true; setTimeout(() => onEnd('me'), 700) }
    else if (score.bot >= 2) { ended.current = true; setTimeout(() => onEnd('bot'), 700) }
  }, [score.me, score.bot, onEnd])

  function pick(choice: string) {
    if (pending || score.me >= 2 || score.bot >= 2) return
    setPending(true)
    setTimeout(() => {
      const botChoice = RPSLS_OPTIONS[Math.floor(Math.random() * 5)].id
      setRounds(r => [...r, { my: choice, bot: botChoice, result: rpslsOutcome(choice, botChoice) }])
      setPending(false)
    }, 350)
  }

  const last = rounds.at(-1)

  return (
    <div>
      <div className="flex justify-center gap-6 mb-3">
        <div className="text-center">
          <p className="text-lg font-black text-primary-fixed-dim">{score.me}</p>
          <p className="text-[10px] text-on-surface-variant">Du</p>
        </div>
        <span className="text-on-surface-variant self-center">–</span>
        <div className="text-center">
          <p className="text-lg font-black text-on-surface-variant">{score.bot}</p>
          <p className="text-[10px] text-on-surface-variant">Gegner</p>
        </div>
      </div>
      {last && (
        <div className="text-center mb-3">
          <p className={`text-xs font-bold mb-1 ${last.result === 'win' ? 'text-green-400' : last.result === 'lose' ? 'text-red-400' : 'text-on-surface-variant'}`}>
            {last.result === 'win' ? 'Gewonnen! 🎉' : last.result === 'lose' ? 'Verloren 💀' : 'Unentschieden'}
          </p>
          <div className="flex justify-center items-center gap-4">
            <span className="text-2xl">{RPSLS_OPTIONS.find(o => o.id === last.my)?.emoji}</span>
            <span className="text-[10px] text-on-surface-variant">VS</span>
            <span className="text-2xl">{RPSLS_OPTIONS.find(o => o.id === last.bot)?.emoji}</span>
          </div>
        </div>
      )}
      {!last && <p className="text-[11px] text-on-surface-variant text-center mb-3">Wähle deinen Zug — best of 3:</p>}
      <div className="flex justify-center gap-2 flex-wrap">
        {RPSLS_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => pick(opt.id)}
            disabled={pending || score.me >= 2 || score.bot >= 2}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high active:scale-95 disabled:opacity-40 transition-all"
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-[9px] text-on-surface-variant">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── TicTacToe ────────────────────────────────────────────────────────────────

function tttWinner(board: (string | null)[]): string | null {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

function TicTacToeGame({ onEnd }: { onEnd: (w: 'me' | 'bot') => void }) {
  const [board, setBoard]     = useState<(string | null)[]>(Array(9).fill(null))
  const [myTurn, setMyTurn]   = useState(true)
  const [status, setStatus]   = useState<string | null>(null)
  const ended = useRef(false)

  const winner = tttWinner(board)
  const isDraw = !winner && board.every(Boolean)

  useEffect(() => {
    if (ended.current) return
    if (winner === 'X') {
      ended.current = true
      setStatus('Du gewinnst! 🎉')
      setTimeout(() => onEnd('me'), 700)
    } else if (winner === 'O') {
      ended.current = true
      setStatus('Gegner gewinnt 💀')
      setTimeout(() => onEnd('bot'), 700)
    } else if (isDraw) {
      ended.current = true
      setStatus('Unentschieden')
      setTimeout(() => onEnd('me'), 700)
    }
  }, [winner, isDraw, onEnd])

  useEffect(() => {
    if (myTurn || winner || isDraw) return
    const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
    if (!empty.length) return
    const t = setTimeout(() => {
      const cell = empty[Math.floor(Math.random() * empty.length)]
      setBoard(b => { const n = [...b]; n[cell] = 'O'; return n })
      setMyTurn(true)
    }, 600)
    return () => clearTimeout(t)
  }, [myTurn, board, winner, isDraw])

  function click(i: number) {
    if (!myTurn || board[i] || winner || isDraw) return
    setBoard(b => { const n = [...b]; n[i] = 'X'; return n })
    setMyTurn(false)
  }

  return (
    <div>
      <p className="text-[11px] text-center text-on-surface-variant mb-3">
        {status ?? (myTurn ? 'Du bist dran (X)' : 'Gegner denkt…')}
      </p>
      <div className="grid grid-cols-3 gap-1.5 max-w-[180px] mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            className={`aspect-square rounded-xl border text-xl font-bold transition-all ${
              cell === 'X' ? 'border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim' :
              cell === 'O' ? 'border-outline-variant bg-surface-container text-on-surface-variant' :
              'border-outline-variant bg-surface-container hover:bg-surface-container-high active:scale-95'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── DeathRoll ────────────────────────────────────────────────────────────────

type Roll = { player: string; roll: number; prevMax: number }

function DeathRollGame({
  opponentName, opponentColor,
  onEnd,
}: { opponentName: string; opponentColor: string; onEnd: (w: 'me' | 'bot') => void }) {
  const [max, setMax]         = useState(1000)
  const [rolls, setRolls]     = useState<Roll[]>([])
  const [myTurn, setMyTurn]   = useState(true)
  const [display, setDisplay] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [done, setDone]       = useState(false)
  const maxRef   = useRef(1000)
  const endedRef = useRef(false)

  function doRoll(isMe: boolean) {
    if (rolling || done) return
    setRolling(true)
    const currentMax = maxRef.current
    let count = 0
    const anim = setInterval(() => {
      setDisplay(Math.floor(Math.random() * currentMax) + 1)
      count++
      if (count > 9) {
        clearInterval(anim)
        const result = Math.floor(Math.random() * currentMax) + 1
        setDisplay(result)
        setRolls(r => [...r, { player: isMe ? 'Du' : opponentName, roll: result, prevMax: currentMax }])
        maxRef.current = result
        setMax(result)
        setRolling(false)
        if (result === 1) {
          setDone(true)
          if (!endedRef.current) {
            endedRef.current = true
            setTimeout(() => onEnd(isMe ? 'bot' : 'me'), 700)
          }
        } else {
          setMyTurn(!isMe)
        }
      }
    }, 75)
  }

  useEffect(() => {
    if (myTurn || rolling || done) return
    const t = setTimeout(() => doRoll(false), 900)
    return () => clearTimeout(t)
  }, [myTurn, rolling, done])  // eslint-disable-line react-hooks/exhaustive-deps

  const lastRoll = rolls.at(-1)

  return (
    <div>
      <div className="text-center mb-3">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Bereich</p>
        <p className="text-xl font-black text-on-surface">1 – {max}</p>
        {display !== null && (
          <p className={`text-4xl font-black mt-1 transition-colors ${lastRoll?.roll === 1 ? 'text-red-400' : 'text-primary-fixed-dim'}`}>
            {display}
          </p>
        )}
        {lastRoll?.roll === 1 && <p className="text-xs font-bold text-red-400 mt-1">💀 DEATH ROLL!</p>}
      </div>
      <div className="space-y-1 mb-3 max-h-[88px] overflow-y-auto">
        {[...rolls].reverse().map((r, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-surface-container">
            <span className="text-on-surface-variant">{r.player}</span>
            <span className={`font-bold ${r.roll === 1 ? 'text-red-400' : 'text-on-surface'}`}>
              {r.roll === 1 ? '💀 1' : r.roll}
            </span>
            <span className="text-on-surface-variant">von 1–{r.prevMax}</span>
          </div>
        ))}
      </div>
      {myTurn && !done && (
        <button
          onClick={() => doRoll(true)}
          disabled={rolling}
          className="w-full py-3 rounded-xl bg-primary-fixed-dim text-on-primary-container text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
        >
          {rolling ? 'Würfelt…' : `🎲 Würfeln (1–${max})`}
        </button>
      )}
      {!myTurn && !done && (
        <p className="text-center text-[11px] text-on-surface-variant animate-pulse">
          {opponentName} würfelt…
        </p>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BeefDemo() {
  const [screen, setScreen]     = useState<Screen>('pick')
  const [opponent, setOpponent] = useState<(typeof OPPONENTS)[0] | null>(null)
  const [reason, setReason]     = useState<string | null>(null)
  const [game, setGame]         = useState<GameType | null>(null)

  const [countdown, setCountdown] = useState(15)
  const [voteMe, setVoteMe]       = useState(42)
  const [comments, setComments]   = useState<typeof LIVE_COMMENTS>([])
  const commentIdx = useRef(0)

  const [winner, setWinner]   = useState<'me' | 'bot'>('me')
  const [voters, setVoters]   = useState<string[]>([])

  useEffect(() => {
    if (screen !== 'voting') return
    setCountdown(15)
    setVoteMe(42)
    setComments([])
    commentIdx.current = 0

    const voteTimer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setScreen('battle'); return 0 }
        setVoteMe(v => Math.min(70, Math.max(30, v + (Math.random() - 0.45) * 4)))
        return c - 1
      })
    }, 1000)

    const commentTimer = setInterval(() => {
      const idx = commentIdx.current
      if (idx < LIVE_COMMENTS.length) {
        setComments(c => [...c, LIVE_COMMENTS[idx]])
        commentIdx.current = idx + 1
      }
    }, 3200)

    return () => { clearInterval(voteTimer); clearInterval(commentTimer) }
  }, [screen])

  function handleGameEnd(w: 'me' | 'bot') {
    setWinner(w)
    setVoters([...LIVE_COMMENTS].sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.user))
    setScreen('result')
  }

  function reset() {
    setScreen('pick')
    setOpponent(null)
    setReason(null)
    setGame(null)
  }

  const voteMe_ = Math.round(voteMe)

  // ── PICK ──────────────────────────────────────────────────────────────────
  if (screen === 'pick') return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden max-w-sm mx-auto">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center gap-2">
        <Swords size={14} className="text-primary-fixed-dim" />
        <span className="text-xs font-semibold text-on-surface">Beef starten</span>
      </div>
      <div className="p-4">
        <p className="text-[11px] text-on-surface-variant mb-3">Wähle deinen Gegner aus deinen Chats:</p>
        <div className="space-y-2">
          {OPPONENTS.map(opp => (
            <button
              key={opp.id}
              onClick={() => { setOpponent(opp); setScreen('challenge') }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high active:scale-[0.99] transition-all text-left"
            >
              <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: opp.color }}>
                {opp.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface">{opp.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{opp.msg}</p>
              </div>
              <ChevronRight size={14} className="text-on-surface-variant flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── CHALLENGE ─────────────────────────────────────────────────────────────
  if (screen === 'challenge' && opponent) return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden max-w-sm mx-auto">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center gap-2">
        <Swords size={14} className="text-primary-fixed-dim" />
        <span className="text-xs font-semibold text-on-surface">Beef eröffnen</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
          <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: opponent.color }}>
            {opponent.initial}
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface">vs. {opponent.name}</p>
            <p className="text-[10px] text-on-surface-variant">Community entscheidet</p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-on-surface-variant mb-2">Worum geht&apos;s?</p>
          <div className="space-y-1.5">
            {REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                  reason === r
                    ? 'border-primary-fixed-dim bg-primary-fixed-dim/10 text-on-surface font-semibold'
                    : 'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] text-on-surface-variant mb-2">Wähle das Spiel:</p>
          <div className="space-y-1.5">
            {GAMES.map(g => (
              <button
                key={g.id}
                onClick={() => setGame(g.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
                  game === g.id
                    ? 'border-primary-fixed-dim bg-primary-fixed-dim/10 text-on-surface font-semibold'
                    : 'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="text-base flex-shrink-0">{g.emoji}</span>
                <span className="flex-1">{g.label}</span>
                <span className="text-[9px] text-on-surface-variant flex-shrink-0">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { if (reason && game) setScreen('voting') }}
          disabled={!reason || !game}
          className="w-full py-2.5 rounded-xl bg-primary-fixed-dim text-on-primary-container text-xs font-semibold hover:opacity-90 active:scale-[0.99] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          <Swords size={13} />
          Beef starten →
        </button>
      </div>
    </div>
  )

  // ── VOTING ────────────────────────────────────────────────────────────────
  if (screen === 'voting' && opponent) return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden max-w-sm mx-auto">
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-400" />
          <span className="text-xs font-semibold text-on-surface">Live Voting</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-400/40 bg-orange-400/10">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[10px] font-bold text-orange-400">{countdown}s</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 text-center">
            <div className="h-10 w-10 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-bold text-on-primary-container bg-primary-fixed-dim">Du</div>
            <p className="text-sm font-bold text-primary-fixed-dim">{voteMe_}%</p>
          </div>
          <span className="text-xs font-black text-on-surface-variant">VS</span>
          <div className="flex-1 text-center">
            <div className="h-10 w-10 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold text-white" style={{ background: opponent.color }}>
              {opponent.initial}
            </div>
            <p className="text-sm font-bold" style={{ color: opponent.color }}>{100 - voteMe_}%</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-surface-container overflow-hidden mb-1">
          <div className="h-full bg-primary-fixed-dim transition-all duration-700" style={{ width: `${voteMe_}%` }} />
        </div>
        <p className="text-[10px] text-center text-on-surface-variant mb-3">
          {GAMES.find(g => g.id === game)?.emoji} {GAMES.find(g => g.id === game)?.label}
        </p>
        <div className="h-28 overflow-hidden flex flex-col justify-end space-y-1.5">
          {comments.slice(-4).map((c, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] font-bold text-primary-fixed-dim flex-shrink-0">{c.user}</span>
              <span className="text-[10px] text-on-surface-variant">{c.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── BATTLE ────────────────────────────────────────────────────────────────
  if (screen === 'battle' && opponent && game) {
    const gameInfo = GAMES.find(g => g.id === game)!
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden max-w-sm mx-auto">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center gap-2">
          <span>{gameInfo.emoji}</span>
          <span className="text-xs font-semibold text-on-surface">{gameInfo.label}</span>
        </div>
        <div className="p-4">
          {game === 'rpsls'     && <RPSLSGame onEnd={handleGameEnd} />}
          {game === 'tictactoe' && <TicTacToeGame onEnd={handleGameEnd} />}
          {game === 'deathroll' && (
            <DeathRollGame
              opponentName={opponent.name}
              opponentColor={opponent.color}
              onEnd={handleGameEnd}
            />
          )}
        </div>
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === 'result' && opponent) {
    const iWon = winner === 'me'
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden max-w-sm mx-auto">
        <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-xs font-semibold text-on-surface">Ergebnis</span>
        </div>
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">{iWon ? '🏆' : '💀'}</div>
          <h3 className="text-sm font-bold text-on-surface mb-4">
            {iWon ? 'Du hast gewonnen!' : `${opponent.name} hat gewonnen`}
          </h3>
          <div className="rounded-xl bg-surface-container p-3 mb-4 text-left space-y-2">
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wide mb-2">Coin-Verteilung</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface">Du</span>
              <span className={`text-xs font-bold ${iWon ? 'text-green-400' : 'text-on-surface-variant'}`}>{iWon ? '+150 🪙' : '+10 🪙'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface">{opponent.name}</span>
              <span className={`text-xs font-bold ${!iWon ? 'text-green-400' : 'text-on-surface-variant'}`}>{!iWon ? '+150 🪙' : '+10 🪙'}</span>
            </div>
            {voters.length > 0 && (
              <div className="border-t border-outline-variant pt-2 mt-1 space-y-1.5">
                <p className="text-[10px] text-on-surface-variant">Gewinner-Tipper</p>
                {voters.map(v => (
                  <div key={v} className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface">{v}</span>
                    <span className="text-xs font-bold text-green-400">+25 🪙</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl border border-outline-variant bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={12} />
            Neuen Beef starten
          </button>
        </div>
      </div>
    )
  }

  return null
}
