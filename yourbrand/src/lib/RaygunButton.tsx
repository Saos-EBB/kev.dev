'use client'

import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { socialCirclePositions, nozzlePoint, barrelTip as barrelTipGeometry, rotationAngleDeg } from '@/lib/raygunGeometry'

/**
 * GitHub, Mail und Telefon zeigen wieder ihre echten Icons: GitHub das
 * offizielle Invertocat-SVG (unveraendert von brand.github.com), Mail/Telefon
 * die alten PNGs, deren Herkunft zwar ungeklaert aber markenrechtlich
 * unproblematisch ist. WhatsApp bleibt bei lucide-react (ISC), weil Metas
 * offizielles Logo nur nach Freigabe ueber das Brand Resource Center
 * verteilt wird — die alte Datei war eine abgewandelte Kopie ihrer Marke.
 */
const SOCIAL_ITEMS = [
  { href: undefined    ?? 'https://github.com/Saos-EBB',         img: '/images/social-github.svg', alt: 'GitHub'   },
  { href: undefined  ?? 'https://wa.me/436764718807',           Icon: MessageCircle,              alt: 'WhatsApp' },
  { href: undefined     ?? 'mailto:kevin.schaberl.work@gmail.com', img: '/images/social-mail.png',   alt: 'E-Mail'   },
  { href: undefined ?? 'tel:+436764718807',                    img: '/images/social-phone.png',  alt: 'Telefon'  },
]

// Beam colours — RGB tuples so code can inject dynamic alpha
const BEAM_OUTER = undefined ?? '190,70,255'
const BEAM_INNER = undefined ?? '235,185,255'

// Timing
const AUTOTRIGGER_MS      = Number(undefined ?? '5000')
const SHOT_DELAY          = Number(undefined  ?? '500')

const LOAD_START = 1.0, LOAD_END = 3.0
const SHOT_START = 5.5, SHOT_END = 6.0

// Nozzle — the glowing tip at the end of the barrel — sits off-centre in the
// artwork, not at the image's geometric centre. Measured on the 512x512 PNG:
// offset (191.5, -58.5) from centre. Expressed as a ratio + angle so it scales
// with whatever size the icon renders at instead of a fixed pixel offset.
const NOZZLE_DIST_RATIO = Math.hypot(191.5, -58.5) / 512
const NOZZLE_ANGLE_DEG  = Math.atan2(-58.5, 191.5) * (180 / Math.PI)

export function RaygunButton({ inline = false, autoTrigger = false }: { inline?: boolean; autoTrigger?: boolean } = {}) {
  const RENDER_SIZE = inline ? 100 : 60
  const NOZZLE_DIST = NOZZLE_DIST_RATIO * RENDER_SIZE

  const btnRef       = useRef<HTMLButtonElement>(null)
  const iconRefs     = useRef<(HTMLAnchorElement | null)[]>([])
  const canvasRef    = useRef<HTMLCanvasElement | null>(null)
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)
  const bufferRef    = useRef<AudioBuffer | null>(null)
  const loadingRef   = useRef(false)
  const openRef      = useRef(false)
  const animRef      = useRef(false)
  const tokenRef     = useRef<object | null>(null)
  const barrelIdxRef      = useRef(-1)
  const iconsPagePosRef   = useRef<{ left: number; top: number }[]>([])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent =
      `@keyframes raygun-pulse{0%,100%{filter:drop-shadow(0 0 2px rgba(${BEAM_OUTER},.5));}` +
      `50%{filter:drop-shadow(0 0 10px rgba(${BEAM_OUTER},1)) drop-shadow(0 0 18px rgba(${BEAM_OUTER},.6)) brightness(1.3);}}` +
      '.raygun-charging{animation:raygun-pulse 0.38s ease-in-out infinite;}'
    document.head.appendChild(style)

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:400;pointer-events:none;'
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)
    canvasRef.current = canvas
    ctxRef.current    = canvas.getContext('2d')

    function handleResize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      if (!openRef.current || animRef.current) return
      const positions = getSocialCirclePositions(SOCIAL_ITEMS.length)
      iconsPagePosRef.current = positions.map(p => ({
        left: p.left + window.scrollX,
        top:  p.top  + window.scrollY,
      }))
      iconRefs.current.forEach((icon, i) => {
        if (!icon) return
        icon.style.left = positions[i].left + 'px'
        icon.style.top  = positions[i].top  + 'px'
      })
      if (barrelIdxRef.current >= 0) {
        const p = positions[barrelIdxRef.current]
        drawBarrel(p.left + 28, p.top + 28)
      }
    }

    function handleScroll() {
      if (!openRef.current || animRef.current) return
      iconRefs.current.forEach((icon, i) => {
        if (!icon) return
        const page = iconsPagePosRef.current[i]
        if (!page) return
        icon.style.left = (page.left - window.scrollX) + 'px'
        icon.style.top  = (page.top  - window.scrollY) + 'px'
      })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      tokenRef.current = {}
      canvas.remove()
      style.remove()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  function getSocialCirclePositions(count: number) {
    const rect = btnRef.current?.getBoundingClientRect()
    const center = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: 42, y: window.innerHeight - 42 }
    return socialCirclePositions(count, center, { width: window.innerWidth, height: window.innerHeight })
  }

  function btnCenter() {
    const r = btnRef.current!.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  function barrelTip(btnCX: number, btnCY: number, targetX: number, targetY: number) {
    return barrelTipGeometry(btnCX, btnCY, targetX, targetY, NOZZLE_DIST)
  }

  function paintBarrel(btnCX: number, btnCY: number, targetX: number, targetY: number) {
    const ctx = ctxRef.current!
    const tip = barrelTip(btnCX, btnCY, targetX, targetY)
    ctx.beginPath(); ctx.moveTo(tip.originX, tip.originY); ctx.lineTo(tip.tipX, tip.tipY)
    ctx.strokeStyle = 'transparent'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
    ctx.beginPath(); ctx.arc(tip.tipX, tip.tipY, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'transparent'; ctx.fill()
    return tip
  }

  function drawBarrel(targetX: number, targetY: number) {
    const canvas = canvasRef.current!
    ctxRef.current!.clearRect(0, 0, canvas.width, canvas.height)
    const bc = btnCenter()
    paintBarrel(bc.x, bc.y, targetX, targetY)
  }

  function rotateGun(targetX: number, targetY: number) {
    const img = btnRef.current?.querySelector('img') as HTMLImageElement | null
    if (!img) return
    const bc = btnCenter()
    const angleDeg = rotationAngleDeg(bc, targetX, targetY, NOZZLE_ANGLE_DEG)
    img.style.transition      = 'none'
    img.style.transformOrigin = 'center center'
    img.style.transform       = `rotate(${angleDeg}deg)`
  }

  function clearCanvas() {
    const canvas = canvasRef.current!
    ctxRef.current!.clearRect(0, 0, canvas.width, canvas.height)
  }

  function fireBeam(targetX: number, targetY: number, token: object) {
    const bc = btnCenter()
    const { x: beamX, y: beamY } = nozzlePoint(bc, targetX, targetY, NOZZLE_DIST)
    const t0    = performance.now()
    const FADE  = 120
    const cv    = canvasRef.current!
    const ctx   = ctxRef.current!
    function frame(now: number) {
      if (tokenRef.current !== token) return
      const t     = Math.min((now - t0) / FADE, 1)
      const alpha = 1 - t
      ctx.clearRect(0, 0, cv.width, cv.height)
      const fbc = btnCenter()
      paintBarrel(fbc.x, fbc.y, targetX, targetY)
      ctx.beginPath(); ctx.moveTo(beamX, beamY); ctx.lineTo(targetX, targetY)
      ctx.strokeStyle = `rgba(${BEAM_OUTER},${alpha * 0.65})`; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(beamX, beamY); ctx.lineTo(targetX, targetY)
      ctx.strokeStyle = `rgba(${BEAM_INNER},${alpha})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke()
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  function snapIconsToBtn() {
    const rect     = btnRef.current?.getBoundingClientRect()
    const snapTop  = rect ? rect.top  + 'px' : '1.2rem'
    const snapLeft = rect ? rect.left + 'px' : '1.2rem'
    iconRefs.current.forEach(icon => {
      if (!icon) return
      icon.style.transition = 'none'
      icon.style.left       = snapLeft
      icon.style.top        = snapTop
      icon.style.opacity    = '0'
      icon.style.transform  = 'scale(0)'
    })
  }

  async function initAudio() {
    if (!audioCtxRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch { return }
    }
    try { await audioCtxRef.current.resume() } catch { return }
    if (audioCtxRef.current.state !== 'running') return
    if (bufferRef.current || loadingRef.current) return
    loadingRef.current = true
    try {
      const r = await fetch('/sounds/railgun.mp3')
      if (!r.ok) throw new Error()
      const ab      = await r.arrayBuffer()
      bufferRef.current = await audioCtxRef.current.decodeAudioData(ab)
    } catch { loadingRef.current = false }
  }

  function playSegment(startOffset: number, duration: number) {
    if (!audioCtxRef.current || !bufferRef.current) return
    const src = audioCtxRef.current.createBufferSource()
    src.buffer = bufferRef.current
    src.connect(audioCtxRef.current.destination)
    src.start(audioCtxRef.current.currentTime + 0.05, startOffset, duration)
  }

  function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

  // Charge, then fire one shot per social icon — a straight-line sequence
  // instead of a chain of nested setTimeout callbacks. `token` still guards
  // every step: a stale one (superseded by closeSocial() or a fresh
  // openSocial() call) just clears the canvas and stops.
  async function openSocial() {
    if (animRef.current) return
    openRef.current = true; animRef.current = true
    const token = {}; tokenRef.current = token
    btnRef.current?.classList.add('open')
    snapIconsToBtn()
    const positions = getSocialCirclePositions(SOCIAL_ITEMS.length)
    iconsPagePosRef.current = positions.map(p => ({
      left: p.left + window.scrollX,
      top:  p.top  + window.scrollY,
    }))
    barrelIdxRef.current = 0
    drawBarrel(positions[0].left + 28, positions[0].top + 28)
    playSegment(LOAD_START, LOAD_END - LOAD_START)
    btnRef.current?.classList.add('raygun-charging')

    await sleep((LOAD_END - LOAD_START) * 1000)
    if (tokenRef.current !== token) return
    btnRef.current?.classList.remove('raygun-charging')

    for (let i = 0; i < SOCIAL_ITEMS.length; i++) {
      if (tokenRef.current !== token) { clearCanvas(); return }
      const pos     = positions[i]
      const targetX = pos.left + 28
      const targetY = pos.top  + 28
      barrelIdxRef.current = i
      drawBarrel(targetX, targetY)
      rotateGun(targetX, targetY)
      setTimeout(() => playSegment(SHOT_START, SHOT_END - SHOT_START), 75)
      fireBeam(targetX, targetY, token)
      const bc   = btnCenter()
      const icon = iconRefs.current[i]
      if (icon) {
        icon.style.transition = 'none'
        icon.style.left       = `${bc.x - 28}px`
        icon.style.top        = `${bc.y - 28}px`
        icon.style.opacity    = '1'
        icon.style.transform  = 'scale(1)'
        icon.getBoundingClientRect()
        icon.style.transition = 'left 150ms ease-out, top 150ms ease-out'
        icon.style.left       = pos.left + 'px'
        icon.style.top        = pos.top  + 'px'
      }
      await sleep(SHOT_DELAY)
    }
    if (tokenRef.current !== token) { clearCanvas(); return }
    animRef.current = false
  }

  function closeSocial() {
    openRef.current  = false; animRef.current = false; barrelIdxRef.current = -1
    tokenRef.current = {}
    btnRef.current?.classList.remove('open', 'raygun-charging')
    const img = btnRef.current?.querySelector('img') as HTMLImageElement | null
    if (img) { img.style.transition = 'none'; img.style.transform = 'rotate(0deg)' }
    snapIconsToBtn()
    clearCanvas()
  }

  // Auto-fire after 5 s — only when autoTrigger is set
  useEffect(() => {
    if (!autoTrigger) return
    const id = setTimeout(() => {
      if (!openRef.current && !animRef.current) openSocial()
    }, AUTOTRIGGER_MS)
    return () => clearTimeout(id)
  // openSocial closes over refs only — stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrigger])

  async function handleClick() {
    try { await initAudio() } catch { /* optional */ }
    openRef.current ? closeSocial() : openSocial()
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        aria-label="Kontakt öffnen"
        style={inline ? {
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          zIndex:        500,
          pointerEvents: 'auto',
          display:       'block',
        } : {
          position:      'fixed',
          bottom:        '1.2rem',
          left:          '1.2rem',
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          zIndex:        500,
          pointerEvents: 'auto',
        }}
      >
        <img src="/images/laser_gun.png" alt="Kontakt" width={inline ? 100 : 60} height={inline ? 100 : 60} />
      </button>

      {SOCIAL_ITEMS.map((item, i) => (
        <a
          key={item.alt}
          ref={el => { iconRefs.current[i] = el }}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.alt}
          style={{
            position:       'fixed',
            top:            '1.2rem',
            left:           '1.2rem',
            width:          '56px',
            height:         '56px',
            borderRadius:   '50%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            opacity:        0,
            transform:      'scale(0)',
            zIndex:         290,
          }}
        >
          {item.img
            ? <img src={item.img} alt={item.alt} style={{ width: '48px', height: '48px' }} />
            : item.Icon && <item.Icon size={48} strokeWidth={1.5} aria-label={item.alt} />}
        </a>
      ))}
    </>
  )
}
