import type { ComponentType, ElementType } from 'react'
import {
  Lock, Accessibility, ShieldCheck, MessageCircle, CreditCard,
  SlidersHorizontal, UserCheck, MapPin, Bell, Funnel,
  Swords, Coins, Trophy, Ghost, ChartBar, Ban, Shuffle, Banknote,
  Layers, Zap, Star, Heart, Palette,
} from 'lucide-react'

export type TierKey = 'core' | 'connect' | 'premium'

export interface FeatureSlide {
  label: string
  longDesc: string
  screenSrc?: string
}

export interface FeatureDef {
  id: string
  icon: ElementType
  videoSrc?: string
  demoHref?: string
  de: { title: string; desc: string; videoLabel: string; slides?: FeatureSlide[] }
  en: { title: string; desc: string; videoLabel: string; slides?: FeatureSlide[] }
}

export interface TierContent {
  title: string
  desc: string
  items: string[]
}

export interface TierDef {
  key: TierKey
  icon: ElementType
  light: { de: TierContent; en: TierContent }
  dark:  { de: TierContent; en: TierContent }
}

// State the profanity-editing demos (chat, mod) need. Other demos take no props.
export interface DemoRegistryState {
  customWords: string[]
  addWord: (w: string) => void
  removeWord: (w: string) => void
}

export interface DemoDef {
  id: string
  Component: ComponentType<Partial<DemoRegistryState>>
  propsFor?: (state: DemoRegistryState) => Partial<DemoRegistryState>
}

// ─── Light features (10) ──────────────────────────────────────────────────────

export const LIGHT_FEATURES: FeatureDef[] = [
  {
    id: 'gdpr', icon: Lock,
    de: { title: 'DSGVO-konform', desc: 'AES-256, Pseudonymisierung, Art.15-Export, Consent Logs.', videoLabel: 'DSGVO-Infrastruktur', slides: [
      { label: 'Export-Button', longDesc: 'Jeder Nutzer kann seine gespeicherten Daten einmalig alle 30 Tage exportieren. Per Klick wird ein vollständiger Daten-Export aus der Datenbank generiert und als PDF bereitgestellt.' },
      { label: 'PDF', longDesc: 'Das generierte PDF enthält alle personenbezogenen Daten die Paarship speichert — Profil, Nachrichten, Consent-Logs, Zahlungshistorie. DSGVO Art. 15 konform.' },
    ]},
    en: { title: 'GDPR Compliant', desc: 'AES-256, pseudonymisation, Art.15 export, consent logs.', videoLabel: 'GDPR infrastructure', slides: [
      { label: 'Export Button', longDesc: 'Each user can export their stored data once every 30 days. One click generates a complete data export from the database and provides it as a PDF.' },
      { label: 'PDF', longDesc: 'The generated PDF contains all personal data stored — profile, messages, consent logs, payment history. GDPR Art. 15 compliant.' },
    ]},
  },
  {
    id: 'a11y', icon: Accessibility,
    demoHref: '/demo/a11y',
    de: { title: 'Barrierefrei by Design', desc: 'WCAG-orientiert: Einfache Sprache, Hoher Kontrast, variable Schriftgrößen.', videoLabel: 'Barrierefreiheit' },
    en: { title: 'Accessible by Design', desc: 'WCAG-oriented: easy language, high contrast, font sizes.', videoLabel: 'Accessibility' },
  },
  {
    id: 'vuln', icon: ShieldCheck,
    de: { title: 'Schutz vulnerabler Nutzer', desc: 'vulnerable_flag + enhanced_protection — automatisch aus der Suche ausgeblendet.', videoLabel: 'Vulnerablen-Schutz', slides: [
      { label: 'Schutz', longDesc: 'Vulnerable Nutzer werden automatisch aus der öffentlichen Suche ausgeblendet. Kein Button, kein UI — der Schutz greift direkt auf Datenbankebene. Bewusst ohne sichtbare Interaktion, um Stigmatisierung zu vermeiden.' },
    ]},
    en: { title: 'Vulnerable User Protection', desc: 'vulnerable_flag + enhanced_protection, auto-hidden from search.', videoLabel: 'Vulnerable protection', slides: [
      { label: 'Protection', longDesc: 'Vulnerable users are automatically hidden from public search. No button, no UI — protection applies directly at database level. Intentionally without visible interaction to avoid stigmatisation.' },
    ]},
  },
  {
    id: 'chat', icon: MessageCircle,
    demoHref: '/demo/chat',
    de: { title: 'Echtzeit-Chat', desc: 'WebSocket, Kontaktanfragen, vollständiger Nachrichtenverlauf.', videoLabel: 'Echtzeit-Chat' },
    en: { title: 'Real-time Chat', desc: 'WebSocket, contact requests, full message history.', videoLabel: 'Real-time chat' },
  },
  {
    id: 'pay', icon: CreditCard,
    de: { title: 'Stripe-Subscriptions', desc: 'Zahlungsabwicklung, Webhooks, Zahlungshistorie, Rechnungen.', videoLabel: 'Stripe-Integration', slides: [
      { label: 'Pakete', longDesc: 'Nutzer wählen zwischen verschiedenen Abonnement-Paketen direkt in der App. Jedes Paket zeigt klar welche Features und Coins enthalten sind.' },
      { label: 'Checkout', longDesc: 'Die Zahlungsabwicklung läuft vollständig über Stripe — PCI-konform, ohne dass Kartendaten Paarship berühren. Nutzer werden sicher weitergeleitet und nach Abschluss automatisch zurückgeleitet.' },
      { label: 'Erfolg', longDesc: 'Nach erfolgreichem Kauf werden Coins sofort gutgeschrieben bzw. das Abo aktiviert. Stripe-Webhooks sorgen für zuverlässige Synchronisation auch bei Verbindungsabbrüchen.' },
    ]},
    en: { title: 'Stripe Subscriptions', desc: 'Payment processing, webhooks, invoices.', videoLabel: 'Stripe integration', slides: [
      { label: 'Packages', longDesc: 'Users choose between subscription packages directly in the app. Each package clearly shows which features and coins are included.' },
      { label: 'Checkout', longDesc: 'Payment processing runs entirely through Stripe — PCI-compliant, without card data ever touching the platform. Users are securely redirected and automatically returned after completion.' },
      { label: 'Success', longDesc: 'After a successful purchase, coins are credited immediately or the subscription is activated. Stripe webhooks ensure reliable synchronisation even during connection interruptions.' },
    ]},
  },
  {
    id: 'mod', icon: SlidersHorizontal,
    demoHref: '/demo/admin',
    de: { title: 'Moderations-Tools', desc: 'Strikes, Bans, Appeals — Admin-Panel mit Ticket-Board.', videoLabel: 'Moderation' },
    en: { title: 'Moderation Tools', desc: 'Strikes, bans, appeals, admin panel with ticket board.', videoLabel: 'Moderation' },
  },
  {
    id: 'profile', icon: UserCheck,
    de: { title: 'Profil-System', desc: 'Onboarding-Wizard, Sichtbarkeit als Grundrecht, Audio-Upload, 100+ Interessen.', videoLabel: 'Profil-System', slides: [
      { label: 'Onboarding-Wizard', longDesc: 'Geführter Einrichtungs-Flow beim ersten Login — Schritt für Schritt: Profilbild, Interessen, Sichtbarkeit, Audio. Kein leeres Profil, kein Drop-off.' },
      { label: 'Sichtbarkeit', longDesc: 'Nutzer entscheiden selbst wer sie sieht — niemand, nur Matches, alle. Sichtbarkeit als Grundrecht, nicht als Premium-Feature.' },
      { label: 'Audio-Upload', longDesc: 'Nutzer können eine Sprachaufnahme als Profilvorstellung hochladen. Authentischer als Text, niedrigschwelliger als Video.' },
      { label: '100+ Interessen', longDesc: 'Über 100 auswählbare Interessen, farblich markiert wenn sie mit einem anderen Profil übereinstimmen. Grüne Tags = direktes Matching-Signal.' },
    ]},
    en: { title: 'Profile System', desc: 'Onboarding wizard, visibility as a right, audio upload, 100+ interests.', videoLabel: 'Profile system', slides: [
      { label: 'Onboarding Wizard', longDesc: 'Guided setup flow on first login — step by step: profile photo, interests, visibility, audio. No empty profiles, no drop-off.' },
      { label: 'Visibility', longDesc: 'Users decide who sees them — nobody, matches only, everyone. Visibility as a right, not a premium feature.' },
      { label: 'Audio Upload', longDesc: 'Users can upload a voice recording as a profile introduction. More authentic than text, lower barrier than video.' },
      { label: '100+ Interests', longDesc: 'Over 100 selectable interests, highlighted green when they match another profile. Green tags = direct matching signal.' },
    ]},
  },
  {
    id: 'discover', icon: MapPin,
    demoHref: '/demo/discover',
    de: { title: 'Discover & Filter', desc: 'PostGIS Radius-Suche, Geschlecht, Alter, Online-Status — auf DB-Ebene.', videoLabel: 'Discover & Filter' },
    en: { title: 'Discover & Filter', desc: 'PostGIS radius search, gender, age, online status, DB-level.', videoLabel: 'Discover & filter' },
  },
  {
    id: 'notif', icon: Bell,
    de: { title: 'Benachrichtigungen', desc: 'In-App für Nachrichten, Matches, Anfragen, Systemereignisse.', videoLabel: 'Benachrichtigungen', slides: [
      { label: 'Vorschau', longDesc: 'Neue Benachrichtigungen erscheinen als Badge auf der Glocke. Ein Klick öffnet eine Vorschau der letzten Ereignisse — Nachrichten, Matches, Anfragen — direkt im Header.' },
      { label: 'Übersicht', longDesc: 'Die vollständige Benachrichtigungsseite zeigt alle Ereignisse chronologisch. Verschiedene Typen — System, Match, Nachricht, Anfrage — sind klar unterschieden.' },
    ]},
    en: { title: 'Notifications', desc: 'In-app for messages, matches, requests, system events.', videoLabel: 'Notifications', slides: [
      { label: 'Preview', longDesc: 'New notifications appear as a badge on the bell icon. One click opens a preview of recent events — messages, matches, requests — directly in the header.' },
      { label: 'Overview', longDesc: 'The full notifications page shows all events chronologically. Different types — system, match, message, request — are clearly distinguished.' },
    ]},
  },
  {
    id: 'kw', icon: Funnel,
    de: { title: 'Keyword-Moderation', desc: 'Profanitätsfilter, DE/AT + EN Wortlisten, Varianten-Normalisierung.', videoLabel: 'Keyword-Moderation', slides: [
      { label: 'Nutzer', longDesc: 'Geflaggte Wörter werden für den Nutzer automatisch durch Sternchen ersetzt. Der Filter greift in Profilen und im Chat — ohne manuelle Moderation.' },
      { label: 'Admin', longDesc: 'Admins können die Keyword-Liste direkt im Panel erweitern. Die Wortlisten sind dateibasiert und unterstützen DE/AT und EN — einfach erweiterbar auf weitere Sprachen.' },
    ]},
    en: { title: 'Keyword Moderation', desc: 'Profanity filter, DE/AT + EN wordlists, variant normalization.', videoLabel: 'Keyword moderation', slides: [
      { label: 'User view', longDesc: 'Flagged words are automatically replaced with asterisks for the user. The filter applies in profiles and chat — without manual moderation.' },
      { label: 'Admin', longDesc: 'Admins can extend the keyword list directly in the panel. Word lists are file-based and support DE/AT and EN — easily extendable to additional languages.' },
    ]},
  },
  {
    id: 'responsive', icon: Layers,
    de: { title: 'Responsive Design', desc: 'Mobile-first — funktioniert auf jedem Gerät ohne separate App.', videoLabel: 'Responsive', slides: [
      { label: 'Mobile-first', longDesc: 'Die gesamte UI ist mobile-first gebaut — kein nachträgliches Anpassen, kein separates Layout. Funktioniert auf Smartphone, Tablet und Desktop aus einer Codebasis.' },
      { label: 'PWA-ready', longDesc: 'Installierbar als Progressive Web App direkt vom Browser — kein App Store, kein Review-Prozess. Push-Notifications, Offline-Support und Home Screen Icon inklusive.' },
      { label: 'Dark & Light', longDesc: 'Vollständiges Theming-System mit Material You Farbpalette — Light Mode für den ersten Eindruck, Dark Mode für Power-Nutzer. Umschaltbar per Toggle.' },
    ]},
    en: { title: 'Responsive Design', desc: 'Mobile-first — works on any device without a separate app.', videoLabel: 'Responsive', slides: [
      { label: 'Mobile-first', longDesc: 'The entire UI is built mobile-first — no retroactive adjustments, no separate layout. Works on smartphone, tablet, and desktop from one codebase.' },
      { label: 'PWA-ready', longDesc: 'Installable as a Progressive Web App directly from the browser — no app store, no review process. Push notifications, offline support, and home screen icon included.' },
      { label: 'Dark & Light', longDesc: 'Full theming system with Material You color palette — light mode for first impressions, dark mode for power users. Toggle-switchable.' },
    ]},
  },
  {
    id: 'match', icon: Heart,
    demoHref: '/demo/matching',
    de: { title: 'Matching-Algorithmus', desc: 'Kompatibilitäts-Score aus Interessen, Standort, Aktivität — sortiertes Discover-Feed.', videoLabel: 'Matching' },
    en: { title: 'Matching Algorithm', desc: 'Compatibility score from interests, location, activity — sorted discover feed.', videoLabel: 'Matching' },
  },
  {
    id: 'custom', icon: Palette,
    de: { title: 'Vollständig anpassbar', desc: 'Logo, Farben, App-Name — alles austauschbar. Kein Rebranding-Aufwand, kein Code-Eingriff.', videoLabel: 'White-Label Customization', slides: [
      { label: 'Branding', longDesc: 'Logo, App-Name und Farbpalette sind vollständig austauschbar — ohne Code-Änderungen. Jede Instanz sieht nach dem Kunden aus, nicht nach dem Framework dahinter.' },
      { label: 'Farben', longDesc: 'Material You Farbsystem mit Light und Dark Mode. Alle Farb-Tokens sind über CSS Custom Properties gesetzt — ein einziger Wert ändert die gesamte UI konsistent durch.' },
      { label: 'Module', longDesc: 'Welche Features sichtbar sind, bestimmt der Lizenzschlüssel — nicht das Deployment. Core, Connect oder Premium: jede Kombination ist möglich, ohne den Code anzufassen.' },
    ]},
    en: { title: 'Fully Customizable', desc: 'Logo, colors, app name — all interchangeable. No rebranding effort, no code changes.', videoLabel: 'White-label customization', slides: [
      { label: 'Branding', longDesc: 'Logo, app name and color palette are fully interchangeable — no code changes required. Every instance looks like the client\'s product, not the framework behind it.' },
      { label: 'Colors', longDesc: 'Material You color system with light and dark mode. All color tokens are set via CSS custom properties — one value change updates the entire UI consistently.' },
      { label: 'Modules', longDesc: 'Which features are visible is determined by the license key — not the deployment. Core, Connect, or Premium: any combination is possible without touching the code.' },
    ]},
  },
]

// ─── Dark features (8) ───────────────────────────────────────────────────────

export const DARK_FEATURES: FeatureDef[] = [
  {
    id: 'beef', icon: Swords, demoHref: '/demo/beef',
    de: { title: 'Beef Battles', desc: 'Live-öffentliche Fights, 15min–48h, Voting, Auto-Resolution.', videoLabel: 'Beef System' },
    en: { title: 'Beef Battles', desc: 'Live public fights, 15min–48h, voting, auto-resolution.', videoLabel: 'Beef system' },
  },
  {
    id: 'coin', icon: Coins,
    de: { title: 'Coin-Economy', desc: 'Coins durch Engagement verdienen, Stripe Coin-Pakete kaufen.', videoLabel: 'Coin-System', slides: [
      { label: 'Balance', longDesc: 'Der aktuelle Coin-Stand ist jederzeit im Header sichtbar. Coins werden durch Engagement in der App verdient — Beefs, Voting, Aktivität.' },
      { label: 'Pakete', longDesc: 'Zusätzliche Coins können direkt über Stripe gekauft werden. Verschiedene Paketgrößen stehen zur Auswahl — einmalig, kein Abo nötig.' },
      { label: 'Abo', longDesc: 'In den Einstellungen wählen Nutzer zwischen Einzelkauf und Abonnement. Abonnenten erhalten monatlich Coins automatisch gutgeschrieben.' },
    ]},
    en: { title: 'Coin Economy', desc: 'Earn via engagement, Stripe coin packages.', videoLabel: 'Coin system', slides: [
      { label: 'Balance', longDesc: 'The current coin balance is always visible in the header. Coins are earned through engagement in the app — beefs, voting, activity.' },
      { label: 'Packages', longDesc: 'Additional coins can be purchased directly via Stripe. Various package sizes are available — one-time, no subscription required.' },
      { label: 'Subscription', longDesc: 'In settings, users choose between single purchase and subscription. Subscribers receive coins credited automatically each month.' },
    ]},
  },
  {
    id: 'badge', icon: Trophy,
    de: { title: 'Rewards & Badges', desc: 'Sieger/Verlierer-Badges, Tooth Chains, Highscore-Leaderboard.', videoLabel: 'Rewards', slides: [
      { label: 'Badges', longDesc: 'Badges sind ausschließlich im Hidden Mode sichtbar — auf dem öffentlichen Profil eines Nutzers. Sie zeigen vergangene Beef-Ergebnisse: Sieger-Badge, Verlierer-Badge, Tooth Chain.' },
      { label: 'Leaderboard', longDesc: 'Das Leaderboard zeigt die Nutzer mit den meisten Beef-Siegen. Nur im Hidden Mode zugänglich — ein stiller Wettbewerb unter denen die wissen wo sie suchen müssen.' },
    ]},
    en: { title: 'Rewards & Badges', desc: 'Winner/loser badges, tooth chains, highscore leaderboard.', videoLabel: 'Rewards', slides: [
      { label: 'Badges', longDesc: 'Badges are visible exclusively in Hidden Mode — on a user\'s public profile. They display past beef results: winner badge, loser badge, tooth chain.' },
      { label: 'Leaderboard', longDesc: 'The leaderboard shows users with the most beef wins. Only accessible in Hidden Mode — a silent competition among those who know where to look.' },
    ]},
  },
  {
    id: 'hidden', icon: Ghost,
    demoHref: '/demo/hidden-zone',
    de: { title: 'Hidden Zone', desc: '5× Klick-Einstieg, 5 rotierende Kultfilm-Passwörter.', videoLabel: 'Hidden Zone' },
    en: { title: 'Hidden Zone', desc: '5x click entry, 5 rotating cult film passwords.', videoLabel: 'Hidden zone' },
  },
  {
    id: 'vote', icon: ChartBar,
    de: { title: 'Live-Voting', desc: 'Echtzeit WebSocket Vote-Updates, gewichtete Lotterie.', videoLabel: 'Voting-System', slides: [
      { label: 'Abstimmung', longDesc: 'Alle Nutzer in der Hidden Zone können während eines laufenden Beefs abstimmen — außer den beiden Beefenden selbst. Votes aktualisieren sich in Echtzeit per WebSocket, sichtbar für alle Beteiligten.' },
      { label: 'Lotterie', longDesc: 'Nach Beef-Ende fließen die Coins in eine gewichtete Lotterie. Wer auf den Gewinner gesetzt hat, wird proportional zum eigenen Einsatz ausgezahlt — Verlierer finanzieren die Gewinnerseite.' },
    ]},
    en: { title: 'Live Voting', desc: 'Real-time WebSocket vote updates, weighted lottery.', videoLabel: 'Voting system', slides: [
      { label: 'Voting', longDesc: 'All users in the Hidden Zone can vote during a running beef — except the two beefing users themselves. Votes update in real time via WebSocket, visible to all participants.' },
      { label: 'Lottery', longDesc: 'After the beef ends, coins flow into a weighted lottery. Those who voted for the winner are paid out proportionally to their stake — losers fund the winning side.' },
    ]},
  },
  {
    id: 'exile', icon: Ban,
    de: { title: 'Exile-Mechanik', desc: '24h Cooldown, Auto-Chicken Cron, KO-Erkennung.', videoLabel: 'Exile-System', slides: [
      { label: 'Exile-Status', longDesc: 'Nach einem Beef tritt automatisch ein Exile-Cooldown ein. Die Dauer beträgt das Vierfache der Beef-Laufzeit — sichtbar auf dem öffentlichen Profil des Nutzers.' },
      { label: 'Beenden', longDesc: 'Nutzer können ihr Exile aktiv beenden — per Klick im eigenen Profil, oder indem sie einen neuen Beef starten. Das Exile schützt vor unmittelbaren Rematches und gibt Abstand.' },
    ]},
    en: { title: 'Exile Mechanic', desc: '24h cooldown, auto-chicken cron, KO detection.', videoLabel: 'Exile system', slides: [
      { label: 'Exile status', longDesc: 'After a beef, an exile cooldown is automatically triggered. The duration is four times the beef runtime — visible on the user\'s public profile.' },
      { label: 'End exile', longDesc: 'Users can actively end their exile — by clicking in their own profile, or by starting a new beef. Exile protects against immediate rematches and provides distance.' },
    ]},
  },
  {
    id: 'dist', icon: Shuffle,
    de: { title: 'Coin-Verteilung', desc: 'Gewichtete Lotterie beim Beef-Close, Verlierer finanzieren Gewinner.', videoLabel: 'Coin-Verteilung', slides: [
      { label: 'Verteilung', longDesc: 'Nach Abschluss eines Beefs wird die Coin-Verteilung live angezeigt. Verlierer finanzieren Gewinner — die genaue Aufteilung folgt der gewichteten Lotterie-Logik.' },
    ]},
    en: { title: 'Coin Distribution', desc: 'Weighted lottery on beef close, losers fund winners.', videoLabel: 'Coin distribution', slides: [
      { label: 'Distribution', longDesc: 'After a beef concludes, coin distribution is displayed live. Losers fund winners — the exact split follows weighted lottery logic.' },
    ]},
  },
  {
    id: 'mono', icon: Banknote,
    de: { title: 'Monetarisierungs-Loop', desc: 'Engagement → Coins → Pakete → Recurring Revenue.', videoLabel: 'Monetarisierung', slides: [
      { label: 'Loop', longDesc: 'Der Monetarisierungs-Loop ist geschlossen: Engagement erzeugt Coin-Bedarf, Coin-Bedarf treibt Käufe, Käufe generieren Recurring Revenue. Plattformbetreiber definieren den Split selbst — flexibel pro Deployment konfigurierbar.' },
    ]},
    en: { title: 'Monetization Loop', desc: 'Engagement → coins → packages → recurring revenue.', videoLabel: 'Monetization', slides: [
      { label: 'Loop', longDesc: 'The monetisation loop is closed: engagement creates coin demand, coin demand drives purchases, purchases generate recurring revenue. Platform operators define the split themselves — flexibly configurable per deployment.' },
    ]},
  },
]

// ─── Tiers ───────────────────────────────────────────────────────────────────

export const TIERS: TierDef[] = [
  {
    key: 'core', icon: Layers,
    light: {
      de: { title: 'Core', desc: 'Alles für den Produktivstart', items: ['Auth & Session-Management', 'Profil + Foto-Upload', 'Echtzeit-Chat & Anfragen', 'Moderation & Reporting', 'Stripe-Subscriptions', 'Benachrichtigungs-System'] },
      en: { title: 'Core', desc: 'Everything to launch in production', items: ['Auth & sessions', 'Profile + photo upload', 'Real-time chat & requests', 'Moderation & reporting', 'Stripe subscriptions', 'Notification system'] },
    },
    dark: {
      de: { title: 'Core', desc: 'Das Beef-Fundament', items: ['Beef Battle System', 'Live-öffentliches Voting', 'Auto-Resolution & KO', 'Exile-Mechanik (24h)', 'Auto-Chicken Cron', 'WebSocket Beef Gateway'] },
      en: { title: 'Core', desc: 'The beef foundation', items: ['Beef battle system', 'Live public voting', 'Auto-resolution & KO', 'Exile mechanic (24h)', 'Auto-chicken cron', 'WebSocket beef gateway'] },
    },
  },
  {
    key: 'connect', icon: Zap,
    light: {
      de: { title: 'Connect', desc: 'Erweiterte Vernetzung', items: ['Alles aus Core', 'Push-Benachrichtigungen', 'Gruppen-Chat', 'Caretaker-System', 'Organisations-Verwaltung', 'Medien im Chat'] },
      en: { title: 'Connect', desc: 'Extended networking', items: ['Everything in Core', 'Push notifications', 'Group chat', 'Caretaker system', 'Organization management', 'Media in chat'] },
    },
    dark: {
      de: { title: 'Connect', desc: 'Coins & Belohnungen', items: ['Alles aus Core', 'Coin-Economy', 'Stripe Coin-Pakete', 'Gewichtetes Lotterie-System', 'Sieger/Verlierer-Badges', 'Tooth Chain Rewards'] },
      en: { title: 'Connect', desc: 'Coins & rewards', items: ['Everything in Core', 'Coin economy', 'Stripe coin packages', 'Weighted lottery system', 'Winner/loser badges', 'Tooth chain rewards'] },
    },
  },
  {
    key: 'premium', icon: Star,
    light: {
      de: { title: 'Premium', desc: 'Vollausstattung', items: ['Alles aus Connect', 'Video-Chat (WebRTC)', 'Matching-Algorithmus', 'Keyword-Moderation', 'Bewertungs-System', 'Rechnungsgenerierung'] },
      en: { title: 'Premium', desc: 'The full suite', items: ['Everything in Connect', 'Video chat (WebRTC)', 'Matching algorithm', 'Keyword moderation', 'Ratings & reviews', 'Invoice generation'] },
    },
    dark: {
      de: { title: 'Premium', desc: 'Der volle Monetarisierungs-Loop', items: ['Alles aus Connect', 'Coin-Verteilungs-Engine', 'Highscore-Leaderboard', 'Hidden Zone (Kultfilm-PW)', 'Leet-Sprache + Themes', 'Revenue Loop Analytics'] },
      en: { title: 'Premium', desc: 'The full monetization loop', items: ['Everything in Connect', 'Coin distribution engine', 'Highscore leaderboard', 'Hidden zone entry (film PW)', 'Leet speak + themes', 'Revenue loop analytics'] },
    },
  },
]

// ─── Tech rows ───────────────────────────────────────────────────────────────

export const TECH_ROWS = {
  de: [
    { label: 'Architektur',        value: 'NestJS Backend · Next.js 16.2.4 · PostgreSQL 16 + PostGIS 3.4 · TypeORM' },
    { label: 'Sicherheit',         value: 'AES-256-CBC · bcrypt · JWT + HttpOnly Refresh Token · SHA-256+Salt E-Mail-Hashing' },
    { label: 'Deployment',         value: 'Railway-ready · Docker · 1 Backend — separate DB pro Kunde möglich' },
    { label: 'APIs',               value: 'REST + WebSocket (Socket.io) · EventEmitter2 · Stripe Webhooks' },
    { label: 'DSGVO-Infrastruktur',value: 'pseudonymize_user() DB-Funktion · 30-Tage Cronjob · consent_logs · Art.15 Export Endpoint' },
    { label: 'Hidden Engine',      value: 'Beef / Coin / Teeth / Badge System · WebSocket HiddenBeefGateway' },
    { label: 'Lizenzierung',       value: 'Core / Connect / Premium — Module per Lizenzschlüssel aktiviert' },
  ],
  en: [
    { label: 'Architecture',       value: 'NestJS Backend · Next.js 16.2.4 · PostgreSQL 16 + PostGIS 3.4 · TypeORM' },
    { label: 'Security',           value: 'AES-256-CBC field encryption · bcrypt · JWT + HttpOnly Refresh Token · SHA-256+Salt email hashing' },
    { label: 'Deployment',         value: 'Railway-ready · Docker · single backend — separate DB per client possible' },
    { label: 'APIs',               value: 'REST + WebSocket (Socket.io) · EventEmitter2 · Stripe Webhooks' },
    { label: 'GDPR infrastructure',value: 'pseudonymize_user() DB function · 30-day cronjob · consent_logs · Art.15 export endpoint' },
    { label: 'Hidden engine',      value: 'Beef / Coin / Teeth / Badge system · WebSocket HiddenBeefGateway' },
    { label: 'Licensing',          value: 'Core / Connect / Premium — modules activated via license key' },
  ],
}
