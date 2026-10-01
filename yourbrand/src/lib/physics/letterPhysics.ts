// ─── Types ────────────────────────────────────────────────────────────────────

interface LetterData {
  el: HTMLDivElement
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  angularVelocity: number
  w: number
  h: number
  radius: number
  active: boolean
  grounded: boolean
}

// ─── Module-level state ───────────────────────────────────────────────────────

let letters: LetterData[] = []
let physicsRafId: number | null = null
let shakeRafId:   number | null = null
let mouseX = -9999
let mouseY = -9999
let _onMouseMove: ((e: MouseEvent) => void) | null = null
let _onTouchMove: ((e: TouchEvent) => void) | null = null

function attachPointerListeners() {
  _onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY }
  _onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY }
  }
  document.addEventListener('mousemove', _onMouseMove)
  document.addEventListener('touchmove', _onTouchMove, { passive: true })
}

function detachPointerListeners() {
  if (_onMouseMove) { document.removeEventListener('mousemove', _onMouseMove); _onMouseMove = null }
  if (_onTouchMove) { document.removeEventListener('touchmove', _onTouchMove); _onTouchMove = null }
  mouseX = -9999; mouseY = -9999
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAVITY            = 0.32   // lighter feel, more airtime
const RESTITUTION        = 0.62   // bouncier collisions floor + letter-to-letter
const FRICTION_AIR       = 0.010  // less drag → letters stay in air longer
const FRICTION_FLOOR_X   = 0.84   // some slide on landing
const FRICTION_FLOOR_ANG = 0.76   // spin decays slower
const FLOOR_PAD          = -15    // letters can go 15px past viewport bottom
const MOUSE_RADIUS       = 140    // px — interaction range around cursor
const MOUSE_FORCE        = 7.0    // repulsion strength at contact distance

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createLetterEl(char: string, fontSize: number, fontFamily = 'inherit'): HTMLDivElement {
  const el = document.createElement('div')
  el.textContent = char
  const color =
    getComputedStyle(document.documentElement).getPropertyValue('--color-on-surface').trim() ||
    '#e0e0e0'
  el.style.cssText =
    `font-size:${fontSize}px;` +
    `font-weight:700;` +
    `font-family:${fontFamily};` +
    `color:${color};` +
    `z-index:200;` +
    `user-select:none;` +
    `pointer-events:none;` +
    `position:fixed;` +
    `left:0;` +
    `top:0;` +
    `margin:0;` +
    `padding:0;` +
    `line-height:1;`
  document.body.appendChild(el)
  return el
}

function measureAndPlace(
  chars: string[],
  originRect: { left: number; top: number },
  fontSize: number,
  fontFamily = 'inherit',
): LetterData[] {
  const measDiv = document.createElement('div')
  measDiv.style.cssText =
    `position:fixed;left:-9999px;top:-9999px;` +
    `font-size:${fontSize}px;font-weight:700;font-family:${fontFamily};` +
    `line-height:1;white-space:nowrap;visibility:hidden;`
  chars.forEach((c) => {
    const span = document.createElement('span')
    span.textContent = c
    measDiv.appendChild(span)
  })
  document.body.appendChild(measDiv)

  const spans = measDiv.querySelectorAll('span')
  const result: LetterData[] = chars.map((char, i) => {
    const span = spans[i] as HTMLSpanElement
    const offsetLeft = span.offsetLeft
    const w = span.offsetWidth || fontSize * 0.6
    const h = span.offsetHeight || fontSize
    const el = createLetterEl(char, fontSize, fontFamily)
    const x = originRect.left + offsetLeft
    const y = originRect.top
    el.style.left = x + 'px'
    el.style.top  = y + 'px'
    return {
      el,
      x, y,
      vx: 0, vy: 0,
      rotation: 0, angularVelocity: 0,
      w, h,
      radius: (w + h) / 4,
      active: false,
      grounded: false,
    }
  })

  document.body.removeChild(measDiv)
  return result
}

// ─── Physics loop (internal) ──────────────────────────────────────────────────

function startPhysicsLoop(): void {
  if (physicsRafId) return
  attachPointerListeners()

  function step() {
    const floor = window.innerHeight - FLOOR_PAD
    const right = window.innerWidth

    letters.forEach((d) => {
      if (!d.active || d.grounded) return

      d.vx *= (1 - FRICTION_AIR)
      d.vy *= (1 - FRICTION_AIR)
      d.angularVelocity *= (1 - FRICTION_AIR)

      d.vy += GRAVITY
      d.x  += d.vx
      d.y  += d.vy
      d.rotation += d.angularVelocity

      // walls
      if (d.x < 0) {
        d.x  = 0
        d.vx = Math.abs(d.vx) * RESTITUTION
      }
      if (d.x + d.w > right) {
        d.x  = right - d.w
        d.vx = -Math.abs(d.vx) * RESTITUTION
      }

      // floor
      if (d.y + d.h >= floor) {
        d.y  = floor - d.h
        d.vy = -Math.abs(d.vy) * RESTITUTION
        d.vx *= FRICTION_FLOOR_X
        d.angularVelocity *= FRICTION_FLOOR_ANG
        if (Math.abs(d.vy) < 0.5 && Math.abs(d.vx) < 0.2) {
          d.vy = 0
          d.vx = 0
          d.angularVelocity = 0
          d.grounded = true
        }
      }

      d.el.style.left      = d.x + 'px'
      d.el.style.top       = d.y + 'px'
      d.el.style.transform = `rotate(${d.rotation}deg)`
    })

    // Mouse / touch repulsion — push letters away from cursor
    if (mouseX > -9999) {
      letters.forEach((d) => {
        if (!d.active) return
        const cx = d.x + d.w / 2
        const cy = d.y + d.h / 2
        const dx = cx - mouseX
        const dy = cy - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist >= MOUSE_RADIUS) return
        const strength = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE
        d.vx += (dx / dist) * strength
        d.vy += (dy / dist) * strength
        d.grounded = false
      })
    }

    // Collision resolution — all active letters incl. grounded (settled letters act as bumpers)
    const active = letters.filter((d) => d.active)
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i]
        const b = active[j]
        if (a.grounded && b.grounded) continue   // both settled — skip
        const dx   = (b.x + b.w / 2) - (a.x + a.w / 2)
        const dy   = (b.y + b.h / 2) - (a.y + a.h / 2)
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minD = a.radius + b.radius
        if (dist >= minD) continue

        const overlap = (minD - dist) * 0.5
        const nx = dx / dist
        const ny = dy / dist
        // Only move the flying letter(s) apart, never push a settled one
        if (!a.grounded) { a.x -= nx * overlap; a.y -= ny * overlap }
        if (!b.grounded) { b.x += nx * overlap; b.y += ny * overlap }

        const dvx = b.vx - a.vx
        const dvy = b.vy - a.vy
        const dot = dvx * nx + dvy * ny
        if (dot < 0) continue

        const imp = dot * (1 + RESTITUTION) * 0.5
        if (!a.grounded) { a.vx += imp * nx; a.vy += imp * ny }
        if (!b.grounded) { b.vx -= imp * nx; b.vy -= imp * ny }

        // Wake settled letter if hit with enough force
        if (a.grounded && imp > 1.2) {
          a.vx = imp * nx * 0.35
          a.vy = -(imp * 0.45)
          a.grounded = false
        }
        if (b.grounded && imp > 1.2) {
          b.vx = -(imp * nx * 0.35)
          b.vy = -(imp * 0.45)
          b.grounded = false
        }
      }
    }

    physicsRafId = requestAnimationFrame(step)
  }

  physicsRafId = requestAnimationFrame(step)
}

// ─── Public API ───────────────────────────────────────────────────────────────

function initLogoLetters(
  text: string,
  originRect: DOMRect,
  options?: { fontSize?: number; fontFamily?: string },
): void {
  cleanup()
  const fontSize   = options?.fontSize   ?? 20
  const fontFamily = options?.fontFamily ?? 'inherit'
  const chars = text.split('').filter((c) => c.trim())
  letters = measureAndPlace(chars, originRect, fontSize, fontFamily)
}

function startShaking(): void {
  let intensity = 0
  let tick      = 0

  function shakeFrame() {
    tick++
    intensity = Math.min(tick * 0.3, 35)
    letters.forEach((d) => {
      const dx  = (Math.random() - 0.5) * 2 * intensity
      const dy  = (Math.random() - 0.5) * intensity * 0.4
      const rot = (Math.random() - 0.5) * intensity * 0.5
      d.el.style.transform = `translate(${dx}px,${dy}px) rotate(${rot}deg)`
    })
    shakeRafId = requestAnimationFrame(shakeFrame)
  }

  shakeRafId = requestAnimationFrame(shakeFrame)
}

function triggerBreak(): void {
  if (shakeRafId) { cancelAnimationFrame(shakeRafId); shakeRafId = null }
  letters.forEach((d) => {
    const rect = d.el.getBoundingClientRect()
    d.x = rect.left
    d.y = rect.top
    d.el.style.transform = ''
    d.el.style.left = d.x + 'px'
    d.el.style.top  = d.y + 'px'
    d.vx             = (Math.random() - 0.5) * 12
    d.vy             = -(6 + Math.random() * 10)
    d.angularVelocity = (Math.random() - 0.5) * 20
    d.active   = true
    d.grounded = false
  })
  startPhysicsLoop()
}

export function cleanup(): void {
  if (physicsRafId) { cancelAnimationFrame(physicsRafId); physicsRafId = null }
  if (shakeRafId)   { cancelAnimationFrame(shakeRafId);   shakeRafId   = null }
  detachPointerListeners()
  letters.forEach((d) => d.el.remove())
  letters = []
}

export function runLogoBreak(text: string, rect: DOMRect, onDone?: () => void): void {
  initLogoLetters(text, rect)
  startShaking()
  setTimeout(() => triggerBreak(), 700)
  setTimeout(() => onDone?.(), 900)
}
