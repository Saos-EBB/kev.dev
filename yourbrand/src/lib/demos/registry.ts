import type { DemoDef } from '@/lib/portfolio/b2b-content'
import { ChatDemo } from './ChatDemo'
import { AdminDemo } from './AdminDemo'
import { DiscoverDemo } from './DiscoverDemo'
import { MatchingDemo } from './MatchingDemo'
import { HiddenZoneDemo } from './HiddenZoneDemo'
import { A11yDemo } from './A11yDemo'
import { BeefDemo } from './BeefDemo'

// One place binding a feature id to its demo component and the props it
// needs — replaces a feature-id lookup that used to be spread across
// INLINE_DEMOS and a props ternary in app/whitelabel/page.tsx.
export const DEMOS: DemoDef[] = [
  { id: 'chat', Component: ChatDemo, propsFor: ({ customWords }) => ({ customWords }) },
  { id: 'mod', Component: AdminDemo, propsFor: ({ customWords, addWord, removeWord }) => ({ customWords, addWord, removeWord }) },
  { id: 'discover', Component: DiscoverDemo },
  { id: 'match', Component: MatchingDemo },
  { id: 'hidden', Component: HiddenZoneDemo },
  { id: 'a11y', Component: A11yDemo },
  { id: 'beef', Component: BeefDemo },
]

export const DEMOS_BY_ID: Partial<Record<string, DemoDef>> =
  Object.fromEntries(DEMOS.map(d => [d.id, d]))
