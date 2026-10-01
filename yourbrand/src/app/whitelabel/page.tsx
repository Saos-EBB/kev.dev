'use client'

import React, { useState } from 'react'
import {
  Lock, UserCheck,
  Building2, Globe, Sun, Moon, ArrowRight, Play,
  ChevronDown, Check, Layers, Zap, Star,
  X, ChevronLeft,
} from 'lucide-react'
import {
  LIGHT_FEATURES, DARK_FEATURES, TIERS, TECH_ROWS,
  type FeatureDef, type TierDef, type TierContent, type TierKey,
} from '@/lib/portfolio/b2b-content'
import { useLanguageStore, type UiLang } from '@/lib/store/languageStore'
import { useTranslation } from '@/lib/i18n'
import { DEMOS_BY_ID } from '@/lib/demos/registry'
import { RaygunButton } from '@/lib/RaygunButton'
import { useWhitelabelTheme } from '@/lib/site/whitelabel/useWhitelabelTheme'

// The dev-only colour-palette editor of b2b-cv is not carried over.
const IS_DEV = false
const B2B_LANGS: UiLang[] = ['de', 'en', 'ru', 'ja', 'ar']
const B2B_LANG_LABELS: Partial<Record<UiLang, string>> = { de: 'DE', en: 'EN', ru: 'RU', ja: 'JA', ar: 'AR' }


// ─── Tier helpers ─────────────────────────────────────────────────────────────

const TIER_CARD_CLASS: Record<TierKey, string> = {
  core:    'border-outline-variant bg-surface-container-low',
  connect: 'border-primary-fixed-dim bg-surface-container',
  premium: 'border-tertiary-fixed-dim bg-surface-container-low',
}

const TIER_ICON_CLASS: Record<TierKey, string> = {
  core:    'text-on-surface-variant',
  connect: 'text-primary-fixed-dim',
  premium: 'text-tertiary-fixed-dim',
}

function isIncludeLine(item: string) {
  return item.startsWith('Alles aus') || item.startsWith('Everything in')
}

// ─── Background styles (CSS only, no JS animation) ───────────────────────────

const LIGHT_BG: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}

const DARK_BG: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)',
    'radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '3px 3px, 7px 7px',
  backgroundPosition: '0 0, 2px 2px',
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  feat, content, selected, onToggle,
}: {
  feat: FeatureDef
  content: FeatureDef['de']
  selected: boolean
  onToggle: () => void
}) {
  const Icon = feat.icon
  return (
    <button
      onClick={onToggle}
      className={`w-full h-full text-left rounded-2xl border p-5 transition-all hover:bg-surface-container ${
        selected
          ? 'border-primary-fixed-dim bg-surface-container'
          : 'border-outline-variant bg-surface-container-low'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container">
          <Icon size={18} className="text-primary-fixed-dim" aria-hidden />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-on-surface">{content.title}</h3>
          {feat.demoHref && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-primary-fixed-dim/15 border border-primary-fixed-dim/30 px-2 py-0.5 text-[10px] font-semibold text-primary-fixed-dim">
              <Play size={8} aria-hidden />
              Demo
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">{content.desc}</p>
    </button>
  )
}

// ─── Detail panel (inline below each feature row) ────────────────────────────

function DetailPanel({
  feat, content, onClose, demoProps,
}: {
  feat: FeatureDef
  content: FeatureDef['de']
  onClose: () => void
  demoProps?: Record<string, unknown>
}) {
  const { t } = useTranslation()
  const Icon = feat.icon
  const DemoComponent = DEMOS_BY_ID[feat.id]?.Component
  const slides = content.slides ?? []
  const hasMultipleSlides = slides.length > 1
  const [activeSlide, setActiveSlide] = useState(0)
  const currentSlide = slides[activeSlide] ?? null
  const hasMedia = !!(DemoComponent || currentSlide?.screenSrc || feat.videoSrc || slides.length === 0)

  return (
    <div className="rounded-2xl border border-primary-fixed-dim bg-surface-container p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-high">
            <Icon size={20} className="text-primary-fixed-dim" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-on-surface">{content.title}</h3>
            <p className="text-sm text-on-surface-variant mt-0.5">{content.desc}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t.common.close}
          className="flex-shrink-0 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      {/* Slide tabs (only when > 1 slide) */}
      {hasMultipleSlides && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSlide === i
                  ? 'bg-primary-fixed-dim text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Long description */}
      {currentSlide && !DemoComponent && (
        <p className={`text-sm text-on-surface-variant leading-relaxed${hasMedia ? ' mb-5' : ''}`}>
          {currentSlide.longDesc}
        </p>
      )}

      {/* Media: inline demo > per-slide screenshot > video > placeholder */}
      {DemoComponent ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <DemoComponent {...(demoProps as any)} />
      ) : currentSlide?.screenSrc ? (
        <img
          src={currentSlide.screenSrc}
          alt={currentSlide.label}
          className="w-full rounded-xl border border-outline-variant object-cover"
        />
      ) : feat.videoSrc ? (
        <video
          src={feat.videoSrc}
          controls
          playsInline
          className="w-full rounded-xl border border-outline-variant bg-black"
          aria-label={content.videoLabel}
        />
      ) : slides.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low border border-outline-variant flex flex-col items-center justify-center gap-3 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container border border-outline-variant">
            <Play size={20} className="text-on-surface-variant" aria-hidden />
          </div>
          <p className="text-sm text-on-surface-variant">Demo — {content.videoLabel}</p>
        </div>
      ) : null}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function B2BPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [techOpen, setTechOpen] = useState(false)
  const [colCount, setColCount] = useState(3)
  const gridRef = React.useRef<HTMLDivElement>(null)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const { isDark, toggleTheme } = useWhitelabelTheme()

  const { uiLang, setUiLang } = useLanguageStore()
  const { t } = useTranslation()

  const [customWords, setCustomWords] = useState(['scheiße', 'idiot', 'wichser', 'hurensohn', 'depp', 'arschloch', 'bastard'])
  const addWord    = (w: string) => setCustomWords(p => [...new Set([...p, w])])
  const removeWord = (w: string) => setCustomWords(p => p.filter(x => x !== w))

  const isEn   = uiLang !== 'de'
  const isRtl  = uiLang === 'ar'

  const techRows  = isEn ? TECH_ROWS.en : TECH_ROWS.de

  const features            = isDark ? DARK_FEATURES : LIGHT_FEATURES
  const selectedFeatDef     = selectedFeature !== null
    ? features.find(f => f.id === selectedFeature) ?? null
    : null
  const selectedFeatContent = selectedFeatDef
    ? (isEn ? selectedFeatDef.en : selectedFeatDef.de)
    : null

  React.useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    function measure() {
      const cards = Array.from(grid!.querySelectorAll('[data-feat-card]')) as HTMLElement[]
      if (cards.length < 2) { setColCount(1); return }
      const firstTop = cards[0].getBoundingClientRect().top
      let cols = 1
      for (let i = 1; i < cards.length; i++) {
        if (Math.abs(cards[i].getBoundingClientRect().top - firstTop) < 2) cols++
        else break
      }
      setColCount(cols)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [])

  function getTierContent(tier: TierDef): TierContent {
    const side = isDark ? tier.dark : tier.light
    return isEn ? side.en : side.de
  }

  function handleFeatureToggle(id: string) {
    setSelectedFeature(prev => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-background text-on-surface" dir={isRtl ? 'rtl' : 'ltr'} style={isDark ? DARK_BG : LIGHT_BG}>

      {/* ── Sticky nav ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-surface-container-low/80 backdrop-blur-md border-b border-outline-variant">
        <div className="mx-auto flex h-16 max-w-screen-lg items-center justify-between px-6">

          <div className="flex items-center gap-3">
            <a
              href="/#projects"
              target="_top"
              onClick={(e) => {
                // Embedded in kev.dev's overlay: ask the page to close it
                // instead of reloading the whole portfolio.
                if (window.parent !== window) {
                  e.preventDefault()
                  window.parent.postMessage('yourbrand:close', window.location.origin)
                }
              }}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <ChevronLeft size={14} className="rtl:rotate-180" aria-hidden />
              Portfolio
            </a>
            <span className="text-outline-variant text-xs">|</span>
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-primary-fixed-dim" aria-hidden />
              <span className="text-lg font-bold tracking-tight text-on-surface">{undefined ?? 'YourBrand'}</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1" aria-label="B2B navigation">
            <a href="#features" className="px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              {t.b2b.nav.features}
            </a>
            <a href="#tiers" className="px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              {t.b2b.nav.licensing}
            </a>
            <a href="#contact" className="px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              {t.b2b.nav.contact}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-fixed-dim text-on-primary-container text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t.b2b.nav.cta}
            </a>
            <button
              onClick={() => {
                const idx = B2B_LANGS.indexOf(uiLang)
                setUiLang(B2B_LANGS[(idx === -1 ? 0 : idx + 1) % B2B_LANGS.length])
              }}
              aria-label="Toggle language"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm font-medium transition-colors"
            >
              <Globe size={14} aria-hidden />
              {B2B_LANG_LABELS[uiLang] ?? 'DE'}
            </button>
            {IS_DEV && <button
              onClick={() => setPaletteOpen(v => !v)}
              aria-label="Toggle color palette editor"
              className="hidden sm:block p-2 rounded-lg transition-colors"
              style={{
                color:      paletteOpen ? 'var(--color-primary-fixed-dim)' : 'var(--color-on-surface-variant)',
                background: paletteOpen ? 'var(--color-surface-container)'  : 'transparent',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="13.5" cy="6.5" r="2.5"/>
                <circle cx="19" cy="13" r="2.5"/>
                <circle cx="6" cy="14" r="2.5"/>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c.833 0 1.5-.667 1.5-1.5 0-.39-.15-.74-.39-1-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
              </svg>
            </button>}
            <button
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-lg px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 py-1.5 text-xs font-medium text-on-surface-variant mb-8">
          <Building2 size={12} aria-hidden />
          {t.b2b.hero.badge}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          {t.b2b.hero.line1}
          <br />
          <span className="text-primary-fixed-dim">
            {isDark ? t.b2b.hero.line2_dark : t.b2b.hero.line2_light}
          </span>
        </h1>

        <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-on-surface-variant leading-relaxed">
          {isDark ? t.b2b.hero.sub_dark : t.b2b.hero.sub_light}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary-fixed-dim text-on-primary-container font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {t.b2b.hero.cta}
            <ArrowRight size={16} className="rtl:rotate-180" aria-hidden />
          </a>
        </div>
      </section>

      {/* ── Modules section ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-lg px-6 pb-16">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-8 py-10">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-on-surface">{t.b2b.modules.heading}</h2>
            <p className="mt-2 text-sm text-on-surface-variant max-w-lg mx-auto">{t.b2b.modules.sub}</p>
          </div>

          {/* Flow diagram */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* Auth block */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 rounded-xl border-2 border-primary-fixed-dim bg-surface-container px-4 py-3">
                <Lock size={16} className="text-primary-fixed-dim flex-shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-on-surface whitespace-nowrap">{t.b2b.modules.auth}</span>
              </div>
              <span className="text-[10px] text-primary-fixed-dim font-medium uppercase tracking-wide">{t.b2b.modules.always}</span>
            </div>

            <ArrowRight size={16} className="text-outline-variant flex-shrink-0 mt-[-12px] rtl:rotate-180" aria-hidden />

            {/* Onboarding — optional */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-3">
                <UserCheck size={16} className="text-on-surface-variant flex-shrink-0" aria-hidden />
                <span className="text-sm font-medium text-on-surface-variant whitespace-nowrap">{t.b2b.modules.onboarding}</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wide">{t.b2b.modules.note.split('—')[0].trim()}</span>
            </div>

            <ArrowRight size={16} className="text-outline-variant flex-shrink-0 mt-[-12px] rtl:rotate-180" aria-hidden />

            {/* Module blocks */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex flex-wrap gap-1.5 max-w-[220px] sm:max-w-none justify-center">
                {(['Chat', 'Coins', 'Leaderboard', 'Hidden Zone'].map((mod) => (
                  <span key={mod} className="rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-surface-variant">
                    {mod}
                  </span>
                )))}
              </div>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wide">{t.b2b.modules.modules}</span>
            </div>

            <ArrowRight size={16} className="text-outline-variant flex-shrink-0 mt-[-12px] rtl:rotate-180" aria-hidden />

            {/* Your App */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 rounded-xl border-2 border-primary-fixed-dim bg-primary-fixed-dim/10 px-4 py-3">
                <Building2 size={16} className="text-primary-fixed-dim flex-shrink-0" aria-hidden />
                <span className="text-sm font-bold text-primary-fixed-dim whitespace-nowrap">{t.b2b.modules.app}</span>
              </div>
              <span className="text-[10px] text-primary-fixed-dim font-medium uppercase tracking-wide">white-label</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-screen-lg px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">{t.b2b.features.label}</h2>
        </div>

        <div ref={gridRef} className={`grid gap-4 ${isDark ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {(() => {
            const selectedIdx = selectedFeature ? features.findIndex(f => f.id === selectedFeature) : -1
            const panelAfterIdx = selectedIdx !== -1
              ? Math.min(selectedIdx + (colCount - 1 - (selectedIdx % colCount)), features.length - 1)
              : -1

            return features.flatMap((feat, i) => {
              const items: React.ReactNode[] = [
                <div key={feat.id} data-feat-card className="h-full">
                  <FeatureCard
                    feat={feat}
                    content={isEn ? feat.en : feat.de}
                    selected={selectedFeature === feat.id}
                    onToggle={() => handleFeatureToggle(feat.id)}
                  />
                </div>,
              ]
              if (i === panelAfterIdx && selectedFeatDef && selectedFeatContent) {
                items.push(
                  <div key="panel" className="col-span-full">
                    <DetailPanel
                      key={selectedFeatDef.id}
                      feat={selectedFeatDef}
                      content={selectedFeatContent}
                      onClose={() => setSelectedFeature(null)}
                      demoProps={DEMOS_BY_ID[selectedFeatDef.id]?.propsFor?.({ customWords, addWord, removeWord })}
                    />
                  </div>
                )
              }
              return items
            })
          })()}
        </div>
      </section>

      {/* ── Cliffhanger banner (light mode only) ──────────────────────── */}
      {!isDark && (
        <div className="mx-auto max-w-screen-lg px-6 pb-10">
          <button
            onClick={() => {
              toggleTheme()
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group relative w-full overflow-hidden rounded-2xl border-2 border-primary-fixed-dim bg-primary-fixed-dim/10 px-10 py-9 text-center shadow-lg hover:bg-primary-fixed-dim/20 active:scale-[0.99] transition-all duration-200 animate-[pulse-border_2s_ease-in-out_infinite]"
          >
            {/* subtle shimmer sweep */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-fixed-dim/10 to-transparent group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center justify-center gap-3">
              <Moon size={22} className="text-primary-fixed-dim shrink-0 group-hover:rotate-[-15deg] transition-transform duration-300" aria-hidden />
              <span className="text-base font-medium text-on-surface">
                {t.b2b.cliffhanger.text}{' '}
                <span className="font-bold text-primary-fixed-dim underline-offset-2 group-hover:underline">
                  {t.b2b.cliffhanger.cta}
                </span>
              </span>
              <ArrowRight size={20} className="text-primary-fixed-dim shrink-0 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform duration-200" aria-hidden />
            </span>
          </button>
          <style>{`
            @keyframes pulse-border {
              0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary-fixed-dim) 40%, transparent); }
              50%       { box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary-fixed-dim) 0%, transparent); }
            }
          `}</style>
        </div>
      )}

      {/* ── License tiers ─────────────────────────────────────────────── */}
      <section id="tiers" className="bg-surface-container-lowest py-20">
        <div className="mx-auto max-w-screen-lg px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">{t.b2b.tiers.label}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {TIERS.map((tier) => {
              const c    = getTierContent(tier)
              const Icon = tier.icon
              return (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col ${TIER_CARD_CLASS[tier.key]}`}
                >
                  {tier.key === 'connect' && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-fixed-dim text-on-primary-container text-xs font-bold px-3 py-1 whitespace-nowrap">
                      {t.b2b.tiers.popular}
                    </span>
                  )}

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container mb-4">
                    <Icon size={20} className={TIER_ICON_CLASS[tier.key]} aria-hidden />
                  </div>

                  <h3 className="text-lg font-bold text-on-surface">{c.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 mb-6">{c.desc}</p>

                  <ul className="space-y-3 flex-1">
                    {c.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <Check size={14} className="text-primary-fixed-dim flex-shrink-0 mt-0.5" aria-hidden />
                        <span className={isIncludeLine(item) ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#contact"
                    className={`mt-7 block w-full text-center py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95 ${
                      tier.key === 'connect'
                        ? 'bg-primary-fixed-dim text-on-primary-container'
                        : 'border border-outline-variant text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {t.b2b.tiers.cta}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <section id="contact" className="mx-auto max-w-screen-lg px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">{t.b2b.contact.heading}</h2>
        <p className="mt-3 text-on-surface-variant max-w-xl mx-auto">{t.b2b.contact.sub}</p>

        <div className="mt-40 mb-16 flex items-center justify-center gap-3">
          <RaygunButton inline />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-2xl leading-none text-primary-fixed-dim">{isRtl ? '→' : '←'}</span>
            <span className="text-xs font-medium text-on-surface-variant">click me</span>
          </div>
        </div>
      </section>

      {/* ── Technical details (accordion) ─────────────────────────────── */}
      <section className="mx-auto max-w-screen-lg px-6 pb-16">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low overflow-hidden">
          <button
            onClick={() => setTechOpen(v => !v)}
            aria-expanded={techOpen}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-container transition-colors"
          >
            <span className="text-sm font-semibold text-on-surface">{t.b2b.tech.toggle}</span>
            <ChevronDown
              size={18}
              aria-hidden
              className={`text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${techOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {techOpen && (
            <div className="border-t border-outline-variant px-6 py-6">
              <h3 className="text-sm font-semibold text-on-surface mb-5">{t.b2b.tech.heading}</h3>
              <dl className="space-y-4">
                {techRows.map(({ label, value }) => (
                  <div
                    key={label}
                    className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-6 sm:items-baseline"
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {label}
                    </dt>
                    <dd className="font-mono text-xs text-on-surface leading-relaxed">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-outline-variant py-6 px-6 text-center">
        {/* Eigene Routen statt Modal — das Modal trug eine hartkodierte
            Privatanschrift und deutsches statt österreichisches Recht. */}
        <div className="flex items-center justify-center gap-4">
          <a href="/#impressum" target="_top" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            {t.footer.impressum}
          </a>
          <span className="text-outline-variant text-xs">·</span>
          <a href="/#datenschutz" target="_top" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            {t.footer.datenschutz}
          </a>
        </div>
      </footer>

    </div>
  )
}
