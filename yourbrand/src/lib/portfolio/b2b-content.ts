import type { ComponentType, ElementType } from 'react'
import type { UiLang } from '@/lib/store/languageStore'
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
  ru: { title: string; desc: string; videoLabel: string; slides?: FeatureSlide[] }
  ja: { title: string; desc: string; videoLabel: string; slides?: FeatureSlide[] }
}

export interface TierContent {
  title: string
  desc: string
  items: string[]
}

export interface TierDef {
  key: TierKey
  icon: ElementType
  light: Record<UiLang, TierContent>
  dark:  Record<UiLang, TierContent>
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
      { label: 'PDF', longDesc: 'Das generierte PDF enthält alle personenbezogenen Daten die die Plattform speichert — Profil, Nachrichten, Consent-Logs, Zahlungshistorie. DSGVO Art. 15 konform.' },
    ]},
    en: { title: 'GDPR Compliant', desc: 'AES-256, pseudonymisation, Art.15 export, consent logs.', videoLabel: 'GDPR infrastructure', slides: [
      { label: 'Export Button', longDesc: 'Each user can export their stored data once every 30 days. One click generates a complete data export from the database and provides it as a PDF.' },
      { label: 'PDF', longDesc: 'The generated PDF contains all personal data stored — profile, messages, consent logs, payment history. GDPR Art. 15 compliant.' },
    ]},
    ru: { title: "Соответствие GDPR", desc: "AES-256, псевдонимизация, экспорт по ст. 15, журналы согласий.", videoLabel: "Инфраструктура GDPR", slides: [
      { label: "Кнопка экспорта", longDesc: "Каждый пользователь может раз в 30 дней экспортировать свои данные. Один клик создаёт полный экспорт из базы и выдаёт его в PDF." },
      { label: "PDF", longDesc: "В созданном PDF есть все хранимые персональные данные: профиль, сообщения, журналы согласий, история платежей. Соответствует ст. 15 GDPR." },
    ]},
    ja: { title: "GDPR準拠", desc: "AES-256、仮名化、第15条エクスポート、同意ログ。", videoLabel: "GDPR基盤", slides: [
      { label: "エクスポートボタン", longDesc: "各ユーザーは30日に1回、保存データをエクスポートできます。ワンクリックでデータベースから完全なエクスポートを生成し、PDFで提供します。" },
      { label: "PDF", longDesc: "生成されるPDFには、プロフィール、メッセージ、同意ログ、支払い履歴など保存中の個人データがすべて含まれます。GDPR第15条に準拠。" },
    ]},
  },
  {
    id: 'a11y', icon: Accessibility,
    demoHref: '/demo/a11y',
    de: { title: 'Barrierefrei by Design', desc: 'WCAG-orientiert: Einfache Sprache, Hoher Kontrast, variable Schriftgrößen.', videoLabel: 'Barrierefreiheit' },
    en: { title: 'Accessible by Design', desc: 'WCAG-oriented: easy language, high contrast, font sizes.', videoLabel: 'Accessibility' },
    ru: { title: "Доступность с самого начала", desc: "С ориентацией на WCAG: простой язык, высокий контраст, размеры шрифта.", videoLabel: "Доступность" },
    ja: { title: "設計からアクセシブル", desc: "WCAG準拠を目指し、やさしい言葉、高コントラスト、文字サイズに対応。", videoLabel: "アクセシビリティ" },
  },
  {
    id: 'vuln', icon: ShieldCheck,
    de: { title: 'Schutz vulnerabler Nutzer', desc: 'vulnerable_flag + enhanced_protection — automatisch aus der Suche ausgeblendet.', videoLabel: 'Vulnerablen-Schutz', slides: [
      { label: 'Schutz', longDesc: 'Vulnerable Nutzer werden automatisch aus der öffentlichen Suche ausgeblendet. Kein Button, kein UI — der Schutz greift direkt auf Datenbankebene. Bewusst ohne sichtbare Interaktion, um Stigmatisierung zu vermeiden.' },
    ]},
    en: { title: 'Vulnerable User Protection', desc: 'vulnerable_flag + enhanced_protection, auto-hidden from search.', videoLabel: 'Vulnerable protection', slides: [
      { label: 'Protection', longDesc: 'Vulnerable users are automatically hidden from public search. No button, no UI — protection applies directly at database level. Intentionally without visible interaction to avoid stigmatisation.' },
    ]},
    ru: { title: "Защита уязвимых пользователей", desc: "vulnerable_flag + enhanced_protection, автоматическое скрытие из поиска.", videoLabel: "Защита уязвимых", slides: [
      { label: "Защита", longDesc: "Уязвимые пользователи автоматически скрыты из публичного поиска. Без кнопки и интерфейса: защита действует прямо на уровне базы. Видимого взаимодействия намеренно нет, чтобы избежать стигмы." },
    ]},
    ja: { title: "脆弱なユーザーの保護", desc: "vulnerable_flag + enhanced_protection、検索から自動で非表示。", videoLabel: "脆弱なユーザーの保護", slides: [
      { label: "保護", longDesc: "脆弱なユーザーは公開検索から自動で非表示になります。ボタンもUIもなく、保護はデータベースレベルで直接働きます。偏見を避けるため、あえて目に見える操作をなくしています。" },
    ]},
  },
  {
    id: 'chat', icon: MessageCircle,
    demoHref: '/demo/chat',
    de: { title: 'Echtzeit-Chat', desc: 'WebSocket, Kontaktanfragen, vollständiger Nachrichtenverlauf.', videoLabel: 'Echtzeit-Chat' },
    en: { title: 'Real-time Chat', desc: 'WebSocket, contact requests, full message history.', videoLabel: 'Real-time chat' },
    ru: { title: "Чат в реальном времени", desc: "WebSocket, запросы на контакт, полная история сообщений.", videoLabel: "Чат в реальном времени" },
    ja: { title: "リアルタイムチャット", desc: "WebSocket、連絡リクエスト、全メッセージ履歴。", videoLabel: "リアルタイムチャット" },
  },
  {
    id: 'pay', icon: CreditCard,
    de: { title: 'Stripe-Subscriptions', desc: 'Zahlungsabwicklung, Webhooks, Zahlungshistorie, Rechnungen.', videoLabel: 'Stripe-Integration', slides: [
      { label: 'Pakete', longDesc: 'Nutzer wählen zwischen verschiedenen Abonnement-Paketen direkt in der App. Jedes Paket zeigt klar welche Features und Coins enthalten sind.' },
      { label: 'Checkout', longDesc: 'Die Zahlungsabwicklung läuft vollständig über Stripe — PCI-konform, ohne dass Kartendaten die Plattform berühren. Nutzer werden sicher weitergeleitet und nach Abschluss automatisch zurückgeleitet.' },
      { label: 'Erfolg', longDesc: 'Nach erfolgreichem Kauf werden Coins sofort gutgeschrieben bzw. das Abo aktiviert. Stripe-Webhooks sorgen für zuverlässige Synchronisation auch bei Verbindungsabbrüchen.' },
    ]},
    en: { title: 'Stripe Subscriptions', desc: 'Payment processing, webhooks, invoices.', videoLabel: 'Stripe integration', slides: [
      { label: 'Packages', longDesc: 'Users choose between subscription packages directly in the app. Each package clearly shows which features and coins are included.' },
      { label: 'Checkout', longDesc: 'Payment processing runs entirely through Stripe — PCI-compliant, without card data ever touching the platform. Users are securely redirected and automatically returned after completion.' },
      { label: 'Success', longDesc: 'After a successful purchase, coins are credited immediately or the subscription is activated. Stripe webhooks ensure reliable synchronisation even during connection interruptions.' },
    ]},
    ru: { title: "Подписки Stripe", desc: "Обработка платежей, вебхуки, счета.", videoLabel: "Интеграция Stripe", slides: [
      { label: "Пакеты", longDesc: "Пользователи выбирают пакет подписки прямо в приложении. У каждого пакета ясно указано, какие функции и монеты в него входят." },
      { label: "Оплата", longDesc: "Платежи полностью проходят через Stripe: соответствие PCI, данные карты никогда не касаются платформы. Пользователь безопасно переходит на оплату и автоматически возвращается." },
      { label: "Успех", longDesc: "После покупки монеты зачисляются сразу или активируется подписка. Вебхуки Stripe обеспечивают надёжную синхронизацию даже при обрывах связи." },
    ]},
    ja: { title: "Stripeサブスクリプション", desc: "決済処理、Webhook、請求書。", videoLabel: "Stripe連携", slides: [
      { label: "パッケージ", longDesc: "ユーザーはアプリ内でサブスクリプションパッケージを選びます。各パッケージには、含まれる機能とコインが明記されています。" },
      { label: "チェックアウト", longDesc: "決済はすべてStripeで処理されます。PCI準拠で、カード情報がプラットフォームに触れることはありません。安全に移動し、完了後は自動で戻ります。" },
      { label: "完了", longDesc: "購入が成功すると、コインがすぐ付与されるか、サブスクリプションが有効になります。Stripe Webhookにより、接続が途切れても確実に同期されます。" },
    ]},
  },
  {
    id: 'mod', icon: SlidersHorizontal,
    demoHref: '/demo/admin',
    de: { title: 'Moderations-Tools', desc: 'Strikes, Bans, Appeals — Admin-Panel mit Ticket-Board.', videoLabel: 'Moderation' },
    en: { title: 'Moderation Tools', desc: 'Strikes, bans, appeals, admin panel with ticket board.', videoLabel: 'Moderation' },
    ru: { title: "Инструменты модерации", desc: "Страйки, баны, апелляции, админ-панель с доской тикетов.", videoLabel: "Модерация" },
    ja: { title: "モデレーションツール", desc: "ストライク、BAN、異議申し立て、チケットボード付き管理パネル。", videoLabel: "モデレーション" },
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
    ru: { title: "Система профилей", desc: "Мастер настройки, видимость как право, загрузка аудио, более 100 интересов.", videoLabel: "Система профилей", slides: [
      { label: "Мастер настройки", longDesc: "Пошаговая настройка при первом входе: фото, интересы, видимость, аудио. Никаких пустых профилей и потерь на старте." },
      { label: "Видимость", longDesc: "Пользователь сам решает, кто его видит: никто, только мэтчи или все. Видимость это право, а не премиум-функция." },
      { label: "Загрузка аудио", longDesc: "Можно загрузить голосовое представление в профиль. Искреннее текста, а порог ниже, чем у видео." },
      { label: "Более 100 интересов", longDesc: "Более 100 интересов на выбор; совпадающие с другим профилем подсвечиваются зелёным. Зелёные теги это прямой сигнал для подбора." },
    ]},
    ja: { title: "プロフィールシステム", desc: "オンボーディングウィザード、権利としての公開範囲、音声アップロード、100以上の興味。", videoLabel: "プロフィールシステム", slides: [
      { label: "オンボーディングウィザード", longDesc: "初回ログイン時の案内付き設定で、写真、興味、公開範囲、音声を順に設定します。空のプロフィールも途中離脱もありません。" },
      { label: "公開範囲", longDesc: "誰に見せるかはユーザーが決めます。誰にも見せない、マッチのみ、全員。公開範囲はプレミアム機能ではなく権利です。" },
      { label: "音声アップロード", longDesc: "自己紹介の音声をプロフィールにアップロードできます。文章より本物らしく、動画より気軽です。" },
      { label: "100以上の興味", longDesc: "100以上の興味から選べ、他のプロフィールと一致すると緑で強調されます。緑のタグはマッチングの直接のシグナルです。" },
    ]},
  },
  {
    id: 'discover', icon: MapPin,
    demoHref: '/demo/discover',
    de: { title: 'Discover & Filter', desc: 'PostGIS Radius-Suche, Geschlecht, Alter, Online-Status — auf DB-Ebene.', videoLabel: 'Discover & Filter' },
    en: { title: 'Discover & Filter', desc: 'PostGIS radius search, gender, age, online status, DB-level.', videoLabel: 'Discover & filter' },
    ru: { title: "Поиск и фильтры", desc: "Поиск по радиусу через PostGIS, пол, возраст, онлайн-статус, на уровне БД.", videoLabel: "Поиск и фильтры" },
    ja: { title: "発見とフィルター", desc: "PostGISの半径検索、性別、年齢、オンライン状態をDBレベルで。", videoLabel: "発見とフィルター" },
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
    ru: { title: "Уведомления", desc: "В приложении: сообщения, мэтчи, запросы, системные события.", videoLabel: "Уведомления", slides: [
      { label: "Предпросмотр", longDesc: "Новые уведомления видны как значок на колокольчике. Клик открывает прямо в шапке предпросмотр последних событий: сообщений, мэтчей, запросов." },
      { label: "Обзор", longDesc: "Полная страница уведомлений показывает все события по времени. Типы (система, мэтч, сообщение, запрос) чётко различаются." },
    ]},
    ja: { title: "通知", desc: "メッセージ、マッチ、リクエスト、システムイベントのアプリ内通知。", videoLabel: "通知", slides: [
      { label: "プレビュー", longDesc: "新しい通知はベルのアイコンにバッジで表示されます。クリックすると、メッセージ、マッチ、リクエストなど最近の出来事をヘッダーでプレビューできます。" },
      { label: "一覧", longDesc: "通知ページではすべての出来事を時系列で表示します。システム、マッチ、メッセージ、リクエストの種類は明確に区別されます。" },
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
    ru: { title: "Модерация по словам", desc: "Фильтр ругательств, списки DE/AT + EN, нормализация вариантов.", videoLabel: "Модерация по словам", slides: [
      { label: "Вид пользователя", longDesc: "Отмеченные слова автоматически заменяются звёздочками. Фильтр работает в профилях и чате без ручной модерации." },
      { label: "Админ", longDesc: "Админы могут расширять список слов прямо в панели. Списки хранятся в файлах и поддерживают DE/AT и EN; другие языки легко добавить." },
    ]},
    ja: { title: "キーワードモデレーション", desc: "不適切語フィルター、DE/AT + ENの単語リスト、表記ゆれの正規化。", videoLabel: "キーワードモデレーション", slides: [
      { label: "ユーザーの表示", longDesc: "該当する単語は自動でアスタリスクに置き換わります。フィルターはプロフィールとチャットで働き、手作業のモデレーションは不要です。" },
      { label: "管理者", longDesc: "管理者はパネルで単語リストを追加できます。リストはファイルベースでDE/ATとENに対応し、他の言語も簡単に追加できます。" },
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
    ru: { title: "Адаптивный дизайн", desc: "Mobile-first: работает на любом устройстве без отдельного приложения.", videoLabel: "Адаптивность", slides: [
      { label: "Mobile-first", longDesc: "Весь интерфейс построен по принципу mobile-first, без последующих подгонок и отдельной вёрстки. Смартфон, планшет и десктоп работают из одной кодовой базы." },
      { label: "PWA-ready", longDesc: "Устанавливается как Progressive Web App прямо из браузера, без магазина приложений и проверки. Push-уведомления, офлайн-режим и значок на главном экране уже есть." },
      { label: "Тёмная и светлая", longDesc: "Полная система тем с палитрой Material You: светлая для первого впечатления, тёмная для опытных пользователей. Переключается одной кнопкой." },
    ]},
    ja: { title: "レスポンシブデザイン", desc: "モバイルファーストで、別アプリなしにどの端末でも動きます。", videoLabel: "レスポンシブ", slides: [
      { label: "モバイルファースト", longDesc: "UI全体をモバイルファーストで構築しています。後からの調整も別レイアウトもなく、スマホ、タブレット、デスクトップが1つのコードベースで動きます。" },
      { label: "PWA対応", longDesc: "ブラウザーからProgressive Web Appとしてインストールでき、アプリストアも審査も不要です。プッシュ通知、オフライン対応、ホーム画面アイコンも含まれます。" },
      { label: "ダークとライト", longDesc: "Material Youのカラーパレットによる完全なテーマシステム。第一印象にはライト、パワーユーザーにはダーク。ボタンで切り替えられます。" },
    ]},
  },
  {
    id: 'match', icon: Heart,
    demoHref: '/demo/matching',
    de: { title: 'Matching-Algorithmus', desc: 'Kompatibilitäts-Score aus Interessen, Standort, Aktivität — sortiertes Discover-Feed.', videoLabel: 'Matching' },
    en: { title: 'Matching Algorithm', desc: 'Compatibility score from interests, location, activity — sorted discover feed.', videoLabel: 'Matching' },
    ru: { title: "Алгоритм подбора", desc: "Оценка совместимости по интересам, месту и активности, отсортированная лента.", videoLabel: "Подбор" },
    ja: { title: "マッチングアルゴリズム", desc: "興味、場所、活動からの相性スコアで並べ替えたフィード。", videoLabel: "マッチング" },
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
    ru: { title: "Полная настройка", desc: "Логотип, цвета, название: всё заменяется. Без затрат на ребрендинг и правок кода.", videoLabel: "Настройка white-label", slides: [
      { label: "Брендинг", longDesc: "Логотип, название и палитра полностью заменяются без правок кода. Каждый экземпляр выглядит как продукт клиента, а не как стоящий за ним фреймворк." },
      { label: "Цвета", longDesc: "Система Material You со светлой и тёмной темой. Все цветовые токены заданы через CSS custom properties: одно значение единообразно меняет весь интерфейс." },
      { label: "Модули", longDesc: "Какие функции видны, определяет лицензионный ключ, а не развёртывание. Core, Connect или Premium: возможна любая комбинация без правок кода." },
    ]},
    ja: { title: "完全カスタマイズ", desc: "ロゴ、色、アプリ名をすべて変更可能。リブランディングの手間もコード変更も不要。", videoLabel: "ホワイトラベルのカスタマイズ", slides: [
      { label: "ブランディング", longDesc: "ロゴ、アプリ名、カラーパレットはコード変更なしで完全に変更できます。どのインスタンスも、裏のフレームワークではなく顧客の製品に見えます。" },
      { label: "色", longDesc: "ライトとダークに対応したMaterial Youのカラーシステム。色トークンはすべてCSSカスタムプロパティで設定し、1つの値の変更でUI全体が一貫して変わります。" },
      { label: "モジュール", longDesc: "どの機能を表示するかは、デプロイではなくライセンスキーで決まります。Core、Connect、Premiumのどの組み合わせも、コードに触れずに可能です。" },
    ]},
  },
]

// ─── Dark features (8) ───────────────────────────────────────────────────────

export const DARK_FEATURES: FeatureDef[] = [
  {
    id: 'beef', icon: Swords, demoHref: '/demo/beef',
    de: { title: 'Beef Battles', desc: 'Live-öffentliche Fights, 15min–48h, Voting, Auto-Resolution.', videoLabel: 'Beef System' },
    en: { title: 'Beef Battles', desc: 'Live public fights, 15min–48h, voting, auto-resolution.', videoLabel: 'Beef system' },
    ru: { title: "Биф-баттлы", desc: "Публичные бои вживую, от 15 мин до 48 ч, голосование, автоматический итог.", videoLabel: "Система бифов" },
    ja: { title: "ビーフバトル", desc: "公開ライブ対決、15分~48時間、投票、自動決着。", videoLabel: "ビーフシステム" },
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
    ru: { title: "Экономика монет", desc: "Заработок за активность, пакеты монет через Stripe.", videoLabel: "Система монет", slides: [
      { label: "Баланс", longDesc: "Текущий баланс монет всегда виден в шапке. Монеты зарабатываются активностью в приложении: бифы, голосование, участие." },
      { label: "Пакеты", longDesc: "Дополнительные монеты можно купить прямо через Stripe. Есть пакеты разного размера: разовая покупка, без подписки." },
      { label: "Подписка", longDesc: "В настройках можно выбрать разовую покупку или подписку. Подписчики получают монеты автоматически каждый месяц." },
    ]},
    ja: { title: "コイン経済", desc: "活動で獲得、Stripeのコインパッケージ。", videoLabel: "コインシステム", slides: [
      { label: "残高", longDesc: "現在のコイン残高は常にヘッダーに表示されます。コインはビーフ、投票、活動などアプリ内の参加で獲得します。" },
      { label: "パッケージ", longDesc: "追加のコインはStripeで直接購入できます。さまざまなサイズがあり、1回限りでサブスクリプションは不要です。" },
      { label: "サブスクリプション", longDesc: "設定で単発購入かサブスクリプションかを選べます。登録者には毎月自動でコインが付与されます。" },
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
    ru: { title: "Награды и значки", desc: "Значки победителя и проигравшего, цепочки зубов, таблица рекордов.", videoLabel: "Награды", slides: [
      { label: "Значки", longDesc: "Значки видны только в Hidden Mode, в публичном профиле пользователя. Они показывают прошлые итоги бифов: значок победителя, значок проигравшего, цепочку зубов." },
      { label: "Рейтинг", longDesc: "Рейтинг показывает пользователей с наибольшим числом побед в бифах. Доступен только в Hidden Mode: тихое соревнование среди тех, кто знает, где искать." },
    ]},
    ja: { title: "報酬とバッジ", desc: "勝者/敗者バッジ、歯のチェーン、ハイスコアランキング。", videoLabel: "報酬", slides: [
      { label: "バッジ", longDesc: "バッジはHidden Modeのユーザー公開プロフィールでのみ表示されます。過去のビーフの結果(勝者バッジ、敗者バッジ、歯のチェーン)を示します。" },
      { label: "ランキング", longDesc: "ビーフの勝利数が多いユーザーを表示します。Hidden Modeでのみ利用でき、場所を知る人だけの静かな競争です。" },
    ]},
  },
  {
    id: 'hidden', icon: Ghost,
    demoHref: '/demo/hidden-zone',
    de: { title: 'Hidden Zone', desc: '5× Klick-Einstieg, 5 rotierende Kultfilm-Passwörter.', videoLabel: 'Hidden Zone' },
    en: { title: 'Hidden Zone', desc: '5x click entry, 5 rotating cult film passwords.', videoLabel: 'Hidden zone' },
    ru: { title: "Hidden Zone", desc: "Вход через 5 кликов, 5 меняющихся паролей из культовых фильмов.", videoLabel: "Hidden Zone" },
    ja: { title: "Hidden Zone", desc: "5回クリックで入場、カルト映画のパスワード5種を日替わりで。", videoLabel: "Hidden Zone" },
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
    ru: { title: "Голосование вживую", desc: "Обновления голосов через WebSocket в реальном времени, взвешенная лотерея.", videoLabel: "Система голосования", slides: [
      { label: "Голосование", longDesc: "Во время бифа голосовать могут все в Hidden Zone, кроме двух участников. Голоса обновляются в реальном времени через WebSocket и видны всем." },
      { label: "Лотерея", longDesc: "После бифа монеты идут во взвешенную лотерею. Голосовавшие за победителя получают выплату пропорционально ставке, а проигравшие финансируют победившую сторону." },
    ]},
    ja: { title: "ライブ投票", desc: "WebSocketによるリアルタイムの投票更新、重み付き抽選。", videoLabel: "投票システム", slides: [
      { label: "投票", longDesc: "ビーフの最中は、対戦中の2人を除きHidden Zoneの全員が投票できます。票はWebSocketでリアルタイムに更新され、全員に見えます。" },
      { label: "抽選", longDesc: "ビーフの終了後、コインは重み付き抽選に入ります。勝者に投票した人には賭け金に応じて支払われ、敗者側が勝者側の資金になります。" },
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
    ru: { title: "Механика изгнания", desc: "Перерыв 24 ч, авто-cron «трус», определение нокаута.", videoLabel: "Система изгнания", slides: [
      { label: "Статус изгнания", longDesc: "После бифа автоматически начинается перерыв-изгнание. Он длится в четыре раза дольше бифа и виден в публичном профиле пользователя." },
      { label: "Конец изгнания", longDesc: "Изгнание можно закончить самому: кликом в своём профиле или начав новый биф. Изгнание защищает от немедленных реваншей и даёт дистанцию." },
    ]},
    ja: { title: "追放の仕組み", desc: "24時間のクールダウン、自動チキン判定cron、KO検出。", videoLabel: "追放システム", slides: [
      { label: "追放ステータス", longDesc: "ビーフの後、追放のクールダウンが自動で始まります。期間はビーフの4倍で、ユーザーの公開プロフィールに表示されます。" },
      { label: "追放の終了", longDesc: "ユーザーは自分のプロフィールでのクリックか、新しいビーフの開始で追放を終えられます。追放は即時の再戦を防ぎ、距離を置かせます。" },
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
    ru: { title: "Распределение монет", desc: "Взвешенная лотерея при закрытии бифа, проигравшие финансируют победителей.", videoLabel: "Распределение монет", slides: [
      { label: "Распределение", longDesc: "После бифа распределение монет показывается вживую. Проигравшие финансируют победителей, а точная доля следует логике взвешенной лотереи." },
    ]},
    ja: { title: "コイン配分", desc: "ビーフ終了時の重み付き抽選で、敗者が勝者の資金になります。", videoLabel: "コイン配分", slides: [
      { label: "配分", longDesc: "ビーフ終了後、コイン配分をライブで表示します。敗者が勝者の資金となり、正確な配分は重み付き抽選のロジックに従います。" },
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
    ru: { title: "Цикл монетизации", desc: "Активность → монеты → пакеты → регулярный доход.", videoLabel: "Монетизация", slides: [
      { label: "Цикл", longDesc: "Цикл монетизации замкнут: активность создаёт спрос на монеты, спрос ведёт к покупкам, покупки дают регулярный доход. Долю оператор платформы задаёт сам, гибко для каждого развёртывания." },
    ]},
    ja: { title: "収益化ループ", desc: "活動 → コイン → パッケージ → 継続収益。", videoLabel: "収益化", slides: [
      { label: "ループ", longDesc: "収益化ループは閉じています。活動がコイン需要を生み、需要が購入を促し、購入が継続収益を生みます。配分はプラットフォーム運営者が決め、デプロイごとに柔軟に設定できます。" },
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
      ru: { title: "Core", desc: "Всё для запуска в продакшен", items: ["Авторизация и сессии", "Профиль + загрузка фото", "Чат и запросы в реальном времени", "Модерация и жалобы", "Подписки Stripe", "Система уведомлений"] },
      ja: { title: "Core", desc: "本番開始に必要なものすべて", items: ["認証とセッション", "プロフィール + 写真アップロード", "リアルタイムチャットとリクエスト", "モデレーションと通報", "Stripeサブスクリプション", "通知システム"] },
    },
    dark: {
      de: { title: 'Core', desc: 'Das Beef-Fundament', items: ['Beef Battle System', 'Live-öffentliches Voting', 'Auto-Resolution & KO', 'Exile-Mechanik (24h)', 'Auto-Chicken Cron', 'WebSocket Beef Gateway'] },
      en: { title: 'Core', desc: 'The beef foundation', items: ['Beef battle system', 'Live public voting', 'Auto-resolution & KO', 'Exile mechanic (24h)', 'Auto-chicken cron', 'WebSocket beef gateway'] },
      ru: { title: "Core", desc: "Основа бифов", items: ["Система биф-баттлов", "Публичное голосование вживую", "Автоитог и нокаут", "Механика изгнания (24 ч)", "Авто-cron «трус»", "WebSocket-шлюз бифов"] },
      ja: { title: "Core", desc: "ビーフの土台", items: ["ビーフバトルシステム", "公開ライブ投票", "自動決着とKO", "追放の仕組み(24時間)", "自動チキン判定cron", "WebSocketビーフゲートウェイ"] },
    },
  },
  {
    key: 'connect', icon: Zap,
    light: {
      de: { title: 'Connect', desc: 'Erweiterte Vernetzung', items: ['Alles aus Core', 'Push-Benachrichtigungen', 'Gruppen-Chat', 'Caretaker-System', 'Organisations-Verwaltung', 'Medien im Chat'] },
      en: { title: 'Connect', desc: 'Extended networking', items: ['Everything in Core', 'Push notifications', 'Group chat', 'Caretaker system', 'Organization management', 'Media in chat'] },
      ru: { title: "Connect", desc: "Расширенное общение", items: ["Всё из Core", "Push-уведомления", "Групповой чат", "Система опеки", "Управление организациями", "Медиа в чате"] },
      ja: { title: "Connect", desc: "拡張ネットワーク", items: ["Coreのすべて", "プッシュ通知", "グループチャット", "ケア担当者システム", "組織管理", "チャット内メディア"] },
    },
    dark: {
      de: { title: 'Connect', desc: 'Coins & Belohnungen', items: ['Alles aus Core', 'Coin-Economy', 'Stripe Coin-Pakete', 'Gewichtetes Lotterie-System', 'Sieger/Verlierer-Badges', 'Tooth Chain Rewards'] },
      en: { title: 'Connect', desc: 'Coins & rewards', items: ['Everything in Core', 'Coin economy', 'Stripe coin packages', 'Weighted lottery system', 'Winner/loser badges', 'Tooth chain rewards'] },
      ru: { title: "Connect", desc: "Монеты и награды", items: ["Всё из Core", "Экономика монет", "Пакеты монет Stripe", "Система взвешенной лотереи", "Значки победителя и проигравшего", "Награды-цепочки зубов"] },
      ja: { title: "Connect", desc: "コインと報酬", items: ["Coreのすべて", "コイン経済", "Stripeコインパッケージ", "重み付き抽選システム", "勝者/敗者バッジ", "歯のチェーン報酬"] },
    },
  },
  {
    key: 'premium', icon: Star,
    light: {
      de: { title: 'Premium', desc: 'Vollausstattung', items: ['Alles aus Connect', 'Video-Chat (WebRTC)', 'Matching-Algorithmus', 'Keyword-Moderation', 'Bewertungs-System', 'Rechnungsgenerierung'] },
      en: { title: 'Premium', desc: 'The full suite', items: ['Everything in Connect', 'Video chat (WebRTC)', 'Matching algorithm', 'Keyword moderation', 'Ratings & reviews', 'Invoice generation'] },
      ru: { title: "Premium", desc: "Полный набор", items: ["Всё из Connect", "Видеочат (WebRTC)", "Алгоритм подбора", "Модерация по словам", "Оценки и отзывы", "Создание счетов"] },
      ja: { title: "Premium", desc: "フルスイート", items: ["Connectのすべて", "ビデオチャット(WebRTC)", "マッチングアルゴリズム", "キーワードモデレーション", "評価とレビュー", "請求書の作成"] },
    },
    dark: {
      de: { title: 'Premium', desc: 'Der volle Monetarisierungs-Loop', items: ['Alles aus Connect', 'Coin-Verteilungs-Engine', 'Highscore-Leaderboard', 'Hidden Zone (Kultfilm-PW)', 'Leet-Sprache + Themes', 'Revenue Loop Analytics'] },
      en: { title: 'Premium', desc: 'The full monetization loop', items: ['Everything in Connect', 'Coin distribution engine', 'Highscore leaderboard', 'Hidden zone entry (film PW)', 'Leet speak + themes', 'Revenue loop analytics'] },
      ru: { title: "Premium", desc: "Полный цикл монетизации", items: ["Всё из Connect", "Движок распределения монет", "Таблица рекордов", "Вход в Hidden Zone (пароль из фильма)", "Leet-речь + темы", "Аналитика цикла дохода"] },
      ja: { title: "Premium", desc: "完全な収益化ループ", items: ["Connectのすべて", "コイン配分エンジン", "ハイスコアランキング", "Hidden Zone入場(映画パスワード)", "Leet語 + テーマ", "収益ループ分析"] },
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
  ru: [
    { label: "Архитектура", value: "NestJS Backend · Next.js 16.2.4 · PostgreSQL 16 + PostGIS 3.4 · TypeORM" },
    { label: "Безопасность", value: "Шифрование полей AES-256-CBC · bcrypt · JWT + HttpOnly Refresh Token · хеширование почты SHA-256+Salt" },
    { label: "Развёртывание", value: "Готово для Railway · Docker · один бэкенд, возможна отдельная БД на клиента" },
    { label: "API", value: "REST + WebSocket (Socket.io) · EventEmitter2 · вебхуки Stripe" },
    { label: "Инфраструктура GDPR", value: "Функция БД pseudonymize_user() · cron на 30 дней · consent_logs · endpoint экспорта по ст. 15" },
    { label: "Hidden Engine", value: "Система Beef / Coin / Teeth / Badge · WebSocket HiddenBeefGateway" },
    { label: "Лицензирование", value: "Core / Connect / Premium: модули включаются лицензионным ключом" },
  ],
  ja: [
    { label: "アーキテクチャ", value: "NestJS Backend · Next.js 16.2.4 · PostgreSQL 16 + PostGIS 3.4 · TypeORM" },
    { label: "セキュリティ", value: "AES-256-CBCフィールド暗号化 · bcrypt · JWT + HttpOnly Refresh Token · SHA-256+Saltメールハッシュ" },
    { label: "デプロイ", value: "Railway対応 · Docker · 単一バックエンド、顧客ごとの別DBも可能" },
    { label: "API", value: "REST + WebSocket (Socket.io) · EventEmitter2 · Stripe Webhook" },
    { label: "GDPR基盤", value: "DB関数pseudonymize_user() · 30日cronジョブ · consent_logs · 第15条エクスポートエンドポイント" },
    { label: "Hidden Engine", value: "Beef / Coin / Teeth / Badgeシステム · WebSocket HiddenBeefGateway" },
    { label: "ライセンス", value: "Core / Connect / Premium: ライセンスキーでモジュールを有効化" },
  ],
}
