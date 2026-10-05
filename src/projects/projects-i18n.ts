// Translations of the project cards (projects-data.ts holds the German
// original and everything that isn't text). Per language and card id,
// only the text fields; links/screenshots are matched by position. [OFFEN]
// notes stay German on purpose — they're Kevin's to-dos, not copy.

import { LANG, type Lang } from "../i18n";
import type { ProjectCard } from "./project-cards";

interface CardText {
  title?: string;
  kind?: string;
  learnGoal?: string;
  claim?: string;
  what?: string;
  meta?: string;
  decisions?: string[];
  challenge?: string;
  origin?: string;
  links?: string[];
  screenshots?: string[];
  mascot?: string;
  widget?: string;
}

const T: Partial<Record<Lang, Record<string, CardText>>> = {
  en: {
    yourbrand: {
      kind: "White-label SaaS",
      learnGoal: "I wanted to learn how to build software in a modular way and get a real product with business logic off the ground.",
      claim: "Proves architectural thinking — a modular white-label SaaS, designed multi-tenant, every layer built on purpose.",
      what: "My first attempt at building real software: a modular white-label SaaS for matching and social contact. The core is neutral — the same platform can carry a chess club, a theatre group, a dating site or any other community that wants to bring people together. Set up multi-tenant: every tenant brings its own brand and only gets the modules it books. As a concrete stage, an accessible platform: plain language, contrast and font-size options, intuitive design, extendable to any language via i18n (currently German).",
      meta: "Solo · April–June 2026, approx. 450 h · +50–75 h for load tests & a test dashboard · self-chosen final project",
      links: ["GitHub", "Live demo on request (happy to host it)"],
      decisions: [
        "Modular & multi-tenant: modules can be switched on/off per tenant, billing by booked scope",
        "Row-level security as the baseline: protection \"from the bottom\", every person controls their own visibility",
        "PostGIS for distance calculation right in the database — easier than in the backend",
        "Accessibility from the start (plain language, contrast, font size, i18n-ready)",
        "Moderation that holds up: reporting system, instant blocking/unblocking, all with notes",
        "GDPR-compliant all the way through (endless headaches)",
        "Deliberately not building everything possible: some mechanics held back for ethical reasons",
        "Architecture, data model and business logic are mine. I built the APIs myself because they interested me — the rest of the implementation with CC as the implementation agent.",
      ],
      challenge: "The real challenge was scope: a complete full stack, solo, in two months. The base — DB, security, API — is clean and built on purpose. The business-logic layer on top is the experimental part: there I tried out ideas instead of playing it safe — and learned the most.",
      origin: "2 weeks of DB brainstorming (row-level security, PostGIS) → backend on top (Postman was gold while building the API) → frontend on top of that, playing through layouts and behaviour until it fit.",
    },
    tschobbo: {
      kind: "Job-application bot",
      learnGoal: "No patience for repetitive job hunting — and learning scraping, LLMs and regex along the way.",
      claim: "Proves judgement — local language models instead of the cloud, sending deliberately left manual.",
      what: "My personal job-application tool. It scrapes Austrian job boards, stores the postings and writes German cover letters locally with Ollama. Searching job sites is repetitive — the bot takes that over, the decision stays with me. Along for the ride: Tschobbo, a purple slime blob with sunglasses and endless arms who visibly works for you while scraping. The idea behind it — software that feels alive and that you get attached to. If he gets on your nerves, one click and he's gone.",
      meta: "Solo · built out of my own interest · sessions from 20 min to 4 h",
      links: ["GitHub (public)", "runs locally — screenshots in the details"],
      decisions: [
        "Local instead of cloud: Ollama on my own machine — my data stays here",
        "Sending stays manual: the bot generates, but never fires off an application itself",
        "Filtering via regex, not an LLM: what a regex does in seconds doesn't need a slow language model — the LLM only writes the letters",
        "Mail-client UI (Gmail/Proton as reference) for maximum overview",
      ],
      challenge: "I tinkered with the LLM filter for far too long, although it was clear it was too slow for a job a regex solves in seconds. The lesson stuck: use the language model only where it really adds something — for the cover letter, not for filtering.",
      origin: "Started as a plain scraper (karriere.at first, because it was easiest), then AMS and devjobs. At first everything was CLI; the UI and mascot came later, after friends saw potential in it. The same logic also produced a small CLI tool on the side — Release Watcher, which checks manga sites for new chapters because I got spoiled too often. Same idea, smaller scale.",
      screenshots: [
        "Inbox: filtered postings by fit (Match/Offstack), a posting opened",
        "Filtered out: what the regex filter threw out",
        "\"Search\" settings page: edit job boards and search terms in the browser",
        "Scrape: pick sources and start the run",
      ],
      mascot: "Tschobbo, the purple slime blob with sunglasses",
    },
    renderer: {
      title: "3D Wireframe Renderer",
      kind: "3D without a library",
      learnGoal: "I wanted to see how far a simple 2D canvas can be pushed.",
      claim: "Proves depth — from a formula in a YouTube Short to a skull CT: OBJ, STL and DICOM on a simple 2D canvas, without a graphics library.",
      what: "It started with a formula from a YouTube Short (Tsoding's \"magic formula\"): the idea that I could render full 3D on a simple 2D HTML canvas excited me so much that I wanted to push the limits. Projection, rotation and depth shading calculated myself, without a graphics library — plus reading OBJ and STL files for the first time.",
      meta: "Solo · out of my own interest · about 2 weeks to the goal",
      links: ["GitHub", "Live right in the widget"],
      decisions: [
        "2D canvas instead of WebGL/Three.js — deliberately the hard way, to understand how 3D really comes about",
        "Projection, rotation, depth shading calculated myself",
        "OBJ, STL and DICOM reading built myself, to load real models and volume data",
        "First attempts typed by hand, then pushed further and further with CC as the implementation agent — all the way to the skull CT. Architecture and decisions are mine.",
      ],
      challenge: "It was new territory throughout — projection, rotation, reading OBJ and STL, problems everywhere I had never faced before. The appeal was the climb: from a simple wireframe to rendering a complete skull CT from DICOM data on a 2D canvas.",
      widget: "3D models, rotate them with the mouse",
    },
    aniscript: {
      learnGoal: "Learn userscripts/Tampermonkey and DOM manipulation — and practise understanding and extending someone else's code.",
      claim: "A userscript for my own use — adapted and extended, not built from scratch.",
      what: "A userscript I adapted and extended with my own features: hoster handling (Voe/Filemoon), ad skipping, autoplay. Practice in understanding, maintaining and extending someone else's code instead of starting from zero. (Target site: aniworld.to)",
      meta: "Solo · for my own use · continuously maintained (v0.0.85)",
      links: ["GitHub (public)", "no live widget (userscript)"],
      decisions: [
        "Deliberately adapted instead of rebuilt — the goal was extending, not recreating",
        "bs.to adaptation checked and dropped: different architecture (redirects to an external hoster instead of embedding in an iframe)",
      ],
      challenge: "For a long time a render bug with display glitches — the cause wasn't the script but the userscript manager during Brave's switch from Manifest V2 to V3. Switching from Violentmonkey to ScriptCat, which handled MV3 cleanly, fixed it.",
    },
    kevdev: {
      kind: "This portfolio",
      learnGoal: "A portfolio you experience rather than read — where every element has a reason.",
      claim: "Proves design thinking — every animation tells something, nothing is decoration.",
      what: "I looked at a lot of portfolio sites, then built every element with a purpose: the cloth in the hero is so big you have to touch it. About is an elevator my life passes by. The projects lie on a workbench, each with Why and Learned. Contact comes with a transition, and whoever clicks finds a hidden wow. Imprint and privacy policy are overlays on the one-pager, so the music keeps playing without a cut.",
      links: ["GitHub (public)"],
      decisions: [
        "Vanilla TypeScript + Vite, no framework — the page is animation, not state",
        "The cloth is its own Verlet physics on canvas; the name is warped along with it as a texture",
        "Elevator built from CSS 3D walls, zooming into the monitor as the transition into the projects grid",
        "One continuous grid as the common thread from About to Contact",
        "Imprint/privacy as an overlay instead of a separate page — the music keeps playing",
        "Its own lite version for phones instead of compromises for both",
      ],
      challenge: "Mobile is a world of its own: what ran smoothly on desktop stuttered on the phone. Measuring instead of guessing — the elevator walls were layers as tall as the whole section. In the end, a lite version of its own instead of compromises for both.",
    },
    grundlagen: {
      title: "Fundamentals",
      kind: "Bootcamp · Java",
      learnGoal: "The basics — by hand, learned at the bootcamp (Java, OOP, SQL, data structures).",
      claim: "The fundamentals of the craft — all typed by hand, learned at the bootcamp.",
      widget: "Bootcamp projects, runnable right in the browser",
    },
  },

  ru: {
    yourbrand: {
      kind: "White-label SaaS",
      learnGoal: "Хотел научиться строить ПО модульно и поставить на ноги настоящий продукт с бизнес-логикой.",
      claim: "Доказывает архитектурное мышление — модульный white-label SaaS, задуманный как multi-tenant, каждый слой спроектирован осознанно.",
      what: "Моя первая попытка сделать настоящее ПО: модульный white-label SaaS для матчинга и социальных контактов. Ядро нейтрально — одна и та же платформа подойдёт шахматному клубу, театральной труппе, сайту знакомств или любому другому сообществу, которое хочет сводить людей вместе. Заложен как multi-tenant: каждый тенант приходит со своим брендом и получает только те модули, которые оплатил. Как конкретная ступень — доступная платформа: простой язык, настройки контраста и размера шрифта, интуитивный дизайн, расширяемость на любой язык через i18n (сейчас немецкий).",
      meta: "Соло · апрель–июнь 2026, около 450 ч · +50–75 ч на нагрузочные тесты и тестовую панель · самостоятельно выбранный выпускной проект",
      links: ["GitHub", "Демо по запросу (с радостью разверну)"],
      decisions: [
        "Модульность и multi-tenant: модули включаются/выключаются по тенантам, оплата по объёму подписки",
        "Row-Level Security как базовое состояние: защита «снизу», видимостью каждый управляет сам",
        "PostGIS для расчёта расстояний прямо в базе — проще, чем в бэкенде",
        "Доступность с самого начала (простой язык, контраст, размер шрифта, готовность к i18n)",
        "Модерация, которая работает: система жалоб, мгновенная блокировка/разблокировка, всё с заметками",
        "Соответствие GDPR до конца (бесконечная головная боль)",
        "Сознательно не всё, что возможно: некоторые механики отложены по этическим причинам",
        "Архитектура, модель данных и бизнес-логика — мои. API я написал сам, потому что мне было интересно, — остальную реализацию с CC как агентом-исполнителем.",
      ],
      challenge: "Настоящей трудностью был объём: полный full stack в одиночку за два месяца. Основа — БД, безопасность, API — сделана чисто и осознанно. Слой бизнес-логики поверх — экспериментальная часть: там я пробовал идеи вместо того, чтобы перестраховываться, — и научился больше всего.",
      origin: "2 недели мозгового штурма по БД (Row-Level Security, PostGIS) → поверх бэкенд (Postman был на вес золота при создании API) → поверх фронтенд, проигрывал макеты и поведение, пока не село.",
    },
    tschobbo: {
      kind: "Бот для откликов",
      learnGoal: "Не хотелось однообразно искать вакансии — и заодно научиться скрейпингу, LLM и регулярным выражениям.",
      claim: "Доказывает здравое суждение — локальные языковые модели вместо облака, отправка сознательно вручную.",
      what: "Мой личный инструмент для откликов. Собирает вакансии с австрийских сайтов, сохраняет их и локально через Ollama пишет сопроводительные письма на немецком. Просматривать сайты с вакансиями — рутина, её берёт на себя бот, решение остаётся за мной. В комплекте: Tschobbo, фиолетовый слизень в солнечных очках с бесконечными руками, который у тебя на глазах работает во время скрейпинга. Идея за этим — софт, который ощущается живым и к которому привязываешься. Надоел — убирается одним кликом.",
      meta: "Соло · сделано из собственного интереса · сессии от 20 мин до 4 ч",
      links: ["GitHub (public)", "работает локально — скриншоты в деталях"],
      decisions: [
        "Локально вместо облака: Ollama на своей машине — мои данные остаются здесь",
        "Отправка остаётся ручной: бот генерирует, но сам никогда не отправляет отклик",
        "Фильтр через regex, а не LLM: то, что regex делает за секунды, не должна медленно делать языковая модель, — LLM только для писем",
        "Интерфейс почтового клиента (по образцу Gmail/Proton) для максимального обзора",
      ],
      challenge: "Я слишком долго возился с LLM-фильтром, хотя было ясно, что он слишком медленный для задачи, которую regex решает за секунды. Урок я усвоил: использовать языковую модель только там, где она действительно полезна, — для писем, а не для фильтрации.",
      origin: "Начиналось как простой скрейпер (сначала karriere.at, потому что проще всего), потом добавились AMS и devjobs. Сначала всё в CLI; интерфейс и маскот появились позже, когда друзья увидели потенциал. Из той же логики попутно вырос маленький CLI-инструмент — Release Watcher, который проверяет сайты манги на новые главы, потому что мне слишком часто спойлерили. Та же идея, масштаб поменьше.",
      screenshots: [
        "Входящие: вакансии, отфильтрованные по соответствию (Match/Offstack), открыта вакансия",
        "Отсеянные: что выбросил regex-фильтр",
        "Страница настроек «Поиск»: сайты и поисковые запросы правятся в браузере",
        "Скрейпинг: выбрать источники и запустить",
      ],
      mascot: "Tschobbo, фиолетовый слизень в солнечных очках",
    },
    renderer: {
      title: "3D-каркасный рендерер",
      kind: "3D без библиотек",
      learnGoal: "Хотел узнать, как далеко можно зайти с простым 2D-канвасом.",
      claim: "Доказывает глубину — от формулы из YouTube Short до КТ черепа: OBJ, STL и DICOM на простом 2D-канвасе, без графической библиотеки.",
      what: "Началось с формулы из YouTube Short («magic formula» от Tsoding): мысль, что на простом 2D-канвасе HTML можно отрисовать полноценное 3D, так меня зацепила, что захотелось выжать максимум. Проекцию, вращение и затенение по глубине посчитал сам, без графической библиотеки, — и впервые научился читать файлы OBJ и STL.",
      meta: "Соло · из собственного интереса · около 2 недель до цели",
      links: ["GitHub", "Вживую прямо в виджете"],
      decisions: [
        "2D-канвас вместо WebGL/Three.js — сознательно трудный путь, чтобы понять, как на самом деле возникает 3D",
        "Проекция, вращение, затенение по глубине посчитаны самостоятельно",
        "Чтение OBJ, STL и DICOM написано самим, чтобы загружать реальные модели и объёмные данные",
        "Первые попытки набраны вручную, потом с CC как агентом-исполнителем всё дальше — вплоть до КТ черепа. Архитектура и решения мои.",
      ],
      challenge: "Всё время это была новая территория — проекция, вращение, чтение OBJ и STL, повсюду задачи, с которыми я раньше не сталкивался. Привлекал сам подъём: от простого каркаса до отрисовки полного КТ черепа из данных DICOM на 2D-канвасе.",
      widget: "3D-модели, вращаются мышью",
    },
    aniscript: {
      learnGoal: "Освоить юзерскрипты/Tampermonkey и манипуляции с DOM — и потренироваться понимать и расширять чужой код.",
      claim: "Юзерскрипт для собственного пользования — адаптирован и расширен, а не написан с нуля.",
      what: "Юзерскрипт, который я адаптировал и дополнил своими функциями: работа с хостерами (Voe/Filemoon), пропуск рекламы, автовоспроизведение. Практика в том, чтобы понимать, поддерживать и целенаправленно расширять чужой код, а не начинать с нуля. (Целевой сайт: aniworld.to)",
      meta: "Соло · для собственного пользования · постоянно поддерживается (v0.0.85)",
      links: ["GitHub (public)", "без живого виджета (юзерскрипт)"],
      decisions: [
        "Сознательно адаптирован, а не переписан — цель была расширить, а не воссоздать",
        "Адаптация под bs.to проверена и отброшена: другая архитектура (перенаправляет на внешний хостер вместо встраивания в iframe)",
      ],
      challenge: "Долгое время был баг с искажённым отображением — причиной был не скрипт, а менеджер юзерскриптов при переходе Brave с Manifest V2 на V3. Помог переход с Violentmonkey на ScriptCat, который нормально работал с MV3.",
    },
    kevdev: {
      kind: "Это портфолио",
      learnGoal: "Портфолио, которое переживаешь, а не читаешь, — и в котором у каждого элемента есть причина.",
      claim: "Доказывает дизайнерское мышление — каждая анимация что-то рассказывает, ничего ради украшения.",
      what: "Пересмотрел много сайтов-портфолио и затем строил каждый элемент со смыслом: ткань в hero такая большая, что её надо потрогать. «Обо мне» — лифт, мимо которого проезжает моя жизнь. Проекты лежат как на верстаке, у каждого «Зачем» и «Чему научился». Контакт приходит с переходом, а тот, кто кликнет, найдёт спрятанный сюрприз. Выходные данные и политика конфиденциальности — оверлеи на одностраничнике, чтобы музыка играла без обрыва.",
      links: ["GitHub (public)"],
      decisions: [
        "Чистый TypeScript + Vite, без фреймворка — страница это анимация, а не состояние",
        "Ткань — собственная физика Верле на канвасе, имя деформируется вместе с ней как текстура",
        "Лифт из CSS-3D-стен, зум в монитор как переход к сетке проектов",
        "Одна сквозная сетка как красная нить от «Обо мне» до «Контакта»",
        "Выходные данные/конфиденциальность — оверлей вместо отдельной страницы: музыка не прерывается",
        "Собственная облегчённая версия для телефона вместо компромиссов для обоих",
      ],
      challenge: "Мобильные — отдельный мир: то, что плавно работало на десктопе, дёргалось на телефоне. Измерять, а не гадать — стены лифта были слоями высотой во всю секцию. В итоге отдельная облегчённая версия вместо компромиссов для обоих.",
    },
    grundlagen: {
      title: "Основы",
      kind: "Буткемп · Java",
      learnGoal: "Основы — вручную, выучено на буткемпе (Java, ООП, SQL, структуры данных).",
      claim: "Основы ремесла — всё набрано вручную, выучено на буткемпе.",
      widget: "Проекты буткемпа, запускаются прямо в браузере",
    },
  },

  ja: {
    yourbrand: {
      kind: "ホワイトラベルSaaS",
      learnGoal: "ソフトウェアをモジュール式に作り、ビジネスロジックを持つ本物のプロダクトを立ち上げる方法を学びたかった。",
      claim: "設計思考の証明 — モジュール式のホワイトラベルSaaS、マルチテナント前提、どのレイヤーも意図して設計。",
      what: "本物のソフトウェアを作る最初の試み：マッチングと交流のためのモジュール式ホワイトラベルSaaS。コアは汎用的に作ってあり、同じプラットフォームでチェスクラブ、劇団、出会い系サービスなど、人と人をつなぎたいあらゆるコミュニティを支えられる。マルチテナントとして設計し、各テナントは自分のブランドを持ち込み、契約したモジュールだけを使える。具体的な段階として、アクセシブルなプラットフォーム：やさしい言葉、コントラストと文字サイズの設定、直感的なデザイン、i18nで任意の言語に拡張可能（現在はドイツ語）。",
      meta: "ソロ · 2026年4〜6月、約450時間 · 負荷テストとテスト用ダッシュボードに＋50〜75時間 · 自分で選んだ修了プロジェクト",
      links: ["GitHub", "ライブデモはご依頼に応じて（喜んでホストします）"],
      decisions: [
        "モジュール式＆マルチテナント：テナントごとにモジュールをオン/オフ、契約範囲に応じて課金",
        "行レベルセキュリティを基本に：「下から」守り、可視範囲は各自が管理",
        "距離計算はPostGISでDB上で直接 — バックエンドより簡単",
        "最初からアクセシビリティ（やさしい言葉、コントラスト、文字サイズ、i18n対応）",
        "機能するモデレーション：通報、即時のブロック/解除、すべてメモ付き",
        "GDPR準拠を徹底（頭痛の種は尽きず）",
        "可能なものをすべて作ったわけではない：倫理的な理由で見送った仕組みもある",
        "アーキテクチャ、データモデル、ビジネスロジックは私。APIは興味があったので自分で作り、残りの実装はCCを実装エージェントとして使った。",
      ],
      challenge: "本当の課題は規模でした。フルスタックを一人で2か月で。土台 — DB、セキュリティ、API — はきれいに意図して作った。その上のビジネスロジック層は実験的な部分で、安全策より新しいアイデアを試し、そこで一番多くを学びました。",
      origin: "2週間のDB構想（行レベルセキュリティ、PostGIS）→ その上にバックエンド（API作りではPostmanが大活躍）→ さらにフロントエンド、しっくりくるまでレイアウトと挙動を試した。",
    },
    tschobbo: {
      kind: "応募ボット",
      learnGoal: "単調な求人探しが嫌で、ついでにスクレイピング、LLM、正規表現を学ぶ。",
      claim: "判断力の証明 — クラウドではなくローカルの言語モデル、送信はあえて手動。",
      what: "個人用の応募ツール。オーストリアの求人サイトをスクレイピングして求人を保存し、Ollamaでドイツ語のカバーレターをローカル生成。求人サイトを探すのは単調なのでボットに任せ、決めるのは自分。おまけに、サングラスをかけた紫のスライム、無限の腕を持つTschobboが、スクレイピング中に目の前で働いてくれる。根底にある考え — 生きているように感じられ、愛着のわくソフトウェア。邪魔ならワンクリックで消せる。",
      meta: "ソロ · 自分の興味で作成 · 1回20分〜4時間の作業",
      links: ["GitHub（公開）", "ローカルで動作 — スクリーンショットは詳細に"],
      decisions: [
        "クラウドではなくローカル：自分のマシンでOllama — データは手元に残る",
        "送信は手動のまま：ボットは生成するが、自分で応募を送ることはない",
        "フィルタはLLMではなく正規表現：正規表現が数秒でやることを遅い言語モデルにやらせる必要はない — LLMはカバーレターだけ",
        "全体を見渡すためのメールクライアント風UI（Gmail/Protonを参考）",
      ],
      challenge: "正規表現なら数秒で済む作業にLLMフィルタは遅すぎると分かっていたのに、長く試行錯誤しすぎました。教訓：言語モデルは本当に役立つところだけに使う — フィルタではなくカバーレターに。",
      origin: "最初は単なるスクレイパー（いちばん簡単なkarriere.atから）、その後AMSとdevjobsを追加。最初はすべてCLIで、UIとマスコットは友人が可能性を感じてくれた後に加えた。同じロジックから小さなCLIツールも生まれた — Release Watcher。ネタバレされすぎたので、漫画サイトの新章をチェックする。同じ発想、小さな規模。",
      screenshots: [
        "受信トレイ：適合度（Match/Offstack）で絞り込んだ求人、1件を表示中",
        "除外：正規表現フィルタが外したもの",
        "「検索」設定ページ：求人サイトと検索語をブラウザで編集",
        "スクレイプ：取得元を選んで実行",
      ],
      mascot: "サングラスをかけた紫のスライム、Tschobbo",
    },
    renderer: {
      title: "3Dワイヤーフレーム・レンダラー",
      kind: "ライブラリなしの3D",
      learnGoal: "シンプルな2Dキャンバスでどこまでできるか知りたかった。",
      claim: "深さの証明 — YouTubeショートの数式から頭蓋骨CTまで：OBJ、STL、DICOMをグラフィックライブラリなしでシンプルな2Dキャンバスに。",
      what: "YouTubeショートの数式（Tsodingの「magic formula」）から始まりました。シンプルな2DのHTMLキャンバスで完全な3Dを描けるという発想に夢中になり、限界まで試したくなった。投影、回転、奥行きの陰影をグラフィックライブラリなしで自分で計算し、初めてOBJとSTLファイルも読み込んだ。",
      meta: "ソロ · 自分の興味で · 目標まで約2週間",
      links: ["GitHub", "ウィジェットでそのままライブ"],
      decisions: [
        "WebGL/Three.jsではなく2Dキャンバス — 3Dが本当にどう生まれるか理解するため、あえて険しい道",
        "投影、回転、奥行きの陰影は自分で計算",
        "実際のモデルとボリュームデータを読み込むため、OBJ、STL、DICOMの読み込みを自作",
        "最初は手で打ち、その後CCを実装エージェントにどんどん先へ — 頭蓋骨CTまで。設計と判断は私。",
      ],
      challenge: "ずっと未知の領域でした — 投影、回転、OBJとSTLの読み込み、どこにもそれまで直面したことのない問題。魅力はその登り道：シンプルなワイヤーフレームから、DICOMデータの頭蓋骨CT全体を2Dキャンバスに描くまで。",
      widget: "マウスで回せる3Dモデル",
    },
    aniscript: {
      kind: "ユーザースクリプト",
      learnGoal: "ユーザースクリプト/TampermonkeyとDOM操作を学び、他人のコードを理解して拡張する練習。",
      claim: "自分用のユーザースクリプト — ゼロからではなく、手を加えて拡張。",
      what: "手を加え、独自機能を追加したユーザースクリプト：ホスター対応（Voe/Filemoon）、広告スキップ、自動再生。ゼロから始めるのではなく、他人のコードを理解し、保守し、狙って拡張する練習。（対象サイト：aniworld.to）",
      meta: "ソロ · 自分用 · 継続的にメンテナンス（v0.0.85）",
      links: ["GitHub（公開）", "ライブウィジェットなし（ユーザースクリプト）"],
      decisions: [
        "作り直すのではなく、あえて手を加える — 目的は再現ではなく拡張",
        "bs.to対応は検討して見送り：構造が違う（iframeに埋め込まず外部ホスターへリダイレクト）",
      ],
      challenge: "長い間、表示が崩れるレンダリングのバグがありました。原因はスクリプトではなく、BraveのManifest V2からV3への移行時のユーザースクリプトマネージャー。MV3にきちんと対応したScriptCatへViolentmonkeyから乗り換えて解決。",
    },
    kevdev: {
      kind: "このポートフォリオ",
      learnGoal: "読むのではなく体験するポートフォリオ — すべての要素に理由がある。",
      claim: "デザイン思考の証明 — どのアニメーションも何かを語り、飾りは一つもない。",
      what: "多くのポートフォリオサイトを見たうえで、すべての要素に意味を持たせて作りました。ヒーローの布は大きく、触らずにはいられない。自己紹介は人生が通り過ぎていくエレベーター。プロジェクトは作業台に並び、それぞれに「なぜ」と「学んだこと」。連絡にはトランジションがあり、クリックした人には隠し玉が。運営者情報とプライバシーポリシーはワンページ上のオーバーレイなので、音楽が途切れない。",
      links: ["GitHub（公開）"],
      decisions: [
        "フレームワークなしの素のTypeScript＋Vite — このページは状態ではなくアニメーション",
        "布はキャンバス上の自作ベルレ物理、名前もテクスチャとして一緒に歪む",
        "CSS 3Dの壁で作ったエレベーター、モニターへのズームがプロジェクトのグリッドへの遷移",
        "自己紹介から連絡まで一貫したグリッドが一本の糸",
        "運営者情報/プライバシーは別ページではなくオーバーレイ — 音楽は流れ続ける",
        "両方に妥協するのではなく、スマホ専用の軽量版",
      ],
      challenge: "モバイルは別世界でした。デスクトップで滑らかだったものがスマホではカクついた。推測ではなく計測 — エレベーターの壁がセクション全体の高さのレイヤーだった。最終的に、両方への妥協ではなく専用の軽量版に。",
    },
    grundlagen: {
      title: "基礎",
      kind: "ブートキャンプ · Java",
      learnGoal: "基礎 — 手で書いて、ブートキャンプで学んだ（Java、OOP、SQL、データ構造）。",
      claim: "職人の基礎 — すべて手打ち、ブートキャンプで学んだ。",
      widget: "ブラウザでそのまま動くブートキャンプのプロジェクト",
    },
  },

  ar: {
    yourbrand: {
      kind: "SaaS بعلامة بيضاء",
      learnGoal: "أردت أن أتعلّم كيف تُبنى البرمجيات بشكل معياري وكيف يُطلق منتج حقيقي بمنطق أعمال.",
      claim: "يثبت التفكير المعماري — SaaS معياري بعلامة بيضاء، مصمّم لعدة مستأجرين، وكل طبقة مبنية عن قصد.",
      what: "أول محاولة لي لبناء برمجيات حقيقية: SaaS معياري بعلامة بيضاء للمطابقة والتواصل الاجتماعي. النواة محايدة — المنصة نفسها تصلح لنادي شطرنج أو فرقة مسرحية أو موقع تعارف أو أي مجتمع آخر يريد أن يجمع الناس. مُعدّ لعدة مستأجرين: كل مستأجر يأتي بعلامته الخاصة ويحصل فقط على الوحدات التي يحجزها. وكمرحلة ملموسة، منصة سهلة الوصول: لغة مبسّطة، خيارات للتباين وحجم الخط، تصميم بديهي، وقابلة للتوسّع لأي لغة عبر i18n (حاليًا الألمانية).",
      meta: "منفرد · أبريل–يونيو 2026، نحو 450 ساعة · +50–75 ساعة لاختبارات الحمل ولوحة الاختبار · مشروع تخرّج اخترته بنفسي",
      links: ["GitHub", "عرض مباشر عند الطلب (أستضيفه بكل سرور)"],
      decisions: [
        "معياري ومتعدد المستأجرين: الوحدات تُفعّل/تُعطّل لكل مستأجر، والفوترة حسب النطاق المحجوز",
        "أمان على مستوى الصفوف كأساس: حماية «من الأسفل»، وكل شخص يتحكم في ظهوره بنفسه",
        "PostGIS لحساب المسافات مباشرة في قاعدة البيانات — أسهل من الواجهة الخلفية",
        "سهولة الوصول منذ البداية (لغة مبسّطة، تباين، حجم الخط، جاهزية i18n)",
        "إشراف يُعتمد عليه: نظام بلاغات، حظر/إلغاء حظر فوري، وكل ذلك مع ملاحظات",
        "التزام كامل باللائحة العامة لحماية البيانات (صداع لا ينتهي)",
        "لم أبنِ عمدًا كل ما هو ممكن: بعض الآليات أُجّلت لأسباب أخلاقية",
        "البنية ونموذج البيانات ومنطق الأعمال من عملي. بنيت واجهات API بنفسي لأنها أثارت اهتمامي — وبقية التنفيذ مع CC كوكيل تنفيذ.",
      ],
      challenge: "التحدي الحقيقي كان الحجم: نظام متكامل بالكامل، منفردًا، في شهرين. الأساس — قاعدة البيانات والأمان وواجهة API — نظيف ومبني عن قصد. طبقة منطق الأعمال فوقه هي الجزء التجريبي: هناك جرّبت أفكارًا بدل اللعب على المضمون — وتعلّمت الأكثر.",
      origin: "أسبوعان من العصف الذهني لقاعدة البيانات (أمان على مستوى الصفوف، PostGIS) ← الواجهة الخلفية فوقها (كان Postman كنزًا أثناء بناء API) ← ثم الواجهة الأمامية، مع تجربة التخطيطات والسلوك حتى استقر.",
    },
    tschobbo: {
      kind: "بوت للتقديم على الوظائف",
      learnGoal: "لا رغبة في البحث المتكرر عن الوظائف — وتعلّم الكشط والنماذج اللغوية والتعابير النمطية في الطريق.",
      claim: "يثبت حسن التقدير — نماذج لغوية محلية بدل السحابة، والإرسال يدوي عن قصد.",
      what: "أداتي الشخصية للتقديم على الوظائف. تكشط مواقع الوظائف النمساوية، وتحفظ الإعلانات، وتكتب رسائل تعريف بالألمانية محليًا عبر Ollama. تصفّح مواقع الوظائف عمل متكرر — يتولّاه البوت، والقرار يبقى لي. ومعه: Tschobbo، كائن هلامي بنفسجي بنظارة شمسية وأذرع لا تنتهي، يعمل أمامك أثناء الكشط. الفكرة وراءه — برمجيات تبدو حيّة وتتعلّق بها. وإن أزعجك، يختفي بنقرة واحدة.",
      meta: "منفرد · بُني بدافع شخصي · جلسات من 20 دقيقة إلى 4 ساعات",
      links: ["GitHub (عام)", "يعمل محليًا — لقطات الشاشة في التفاصيل"],
      decisions: [
        "محلي بدل السحابة: Ollama على جهازي — بياناتي تبقى هنا",
        "الإرسال يبقى يدويًا: البوت يُنشئ، لكنه لا يرسل طلبًا بنفسه أبدًا",
        "التصفية بالتعابير النمطية لا بنموذج لغوي: ما تفعله التعابير النمطية في ثوانٍ لا يحتاج نموذجًا لغويًا بطيئًا — النموذج للرسائل فقط",
        "واجهة بأسلوب عميل البريد (Gmail/Proton كمرجع) لأقصى وضوح",
      ],
      challenge: "أمضيت وقتًا طويلًا جدًا في تجربة مرشّح النموذج اللغوي، مع أنه كان واضحًا أنه بطيء جدًا لمهمة تحلّها التعابير النمطية في ثوانٍ. وخرجت بالدرس: استخدام النموذج اللغوي فقط حيث يضيف شيئًا فعلًا — في رسالة التعريف، لا في التصفية.",
      origin: "بدأ ككاشط بسيط (karriere.at أولًا لأنه الأسهل)، ثم أُضيف AMS وdevjobs. في البداية كان كل شيء في سطر الأوامر؛ جاءت الواجهة والتميمة لاحقًا بعدما رأى أصدقائي فيه إمكانات. ومن المنطق نفسه وُلدت أداة صغيرة جانبية — Release Watcher، تتحقّق من مواقع المانغا بحثًا عن فصول جديدة لأنني تعرّضت لحرق الأحداث كثيرًا. الفكرة نفسها، بنطاق أصغر.",
      screenshots: [
        "البريد الوارد: وظائف مصفّاة حسب الملاءمة (Match/Offstack)، مع إعلان مفتوح",
        "المستبعَد: ما أخرجه مرشّح التعابير النمطية",
        "صفحة إعدادات «البحث»: تعديل المواقع وكلمات البحث في المتصفح",
        "الكشط: اختيار المصادر وبدء التشغيل",
      ],
      mascot: "Tschobbo، الكائن الهلامي البنفسجي بالنظارة الشمسية",
    },
    renderer: {
      title: "مُصيِّر ثلاثي الأبعاد سلكي",
      kind: "ثلاثي الأبعاد بلا مكتبة",
      learnGoal: "أردت أن أعرف إلى أي حدّ يمكن دفع لوحة رسم ثنائية الأبعاد بسيطة.",
      claim: "يثبت العمق — من معادلة في مقطع YouTube قصير إلى أشعة مقطعية للجمجمة: OBJ وSTL وDICOM على لوحة ثنائية الأبعاد بسيطة، دون مكتبة رسوميات.",
      what: "بدأ بمعادلة من مقطع YouTube قصير («المعادلة السحرية» لـ Tsoding): فكرة أنني أستطيع رسم ثلاثي أبعاد كامل على لوحة HTML ثنائية الأبعاد بسيطة شدّتني لدرجة أنني أردت بلوغ الحدود. الإسقاط والدوران وتظليل العمق حسبتها بنفسي دون مكتبة رسوميات — وقرأت ملفات OBJ وSTL لأول مرة.",
      meta: "منفرد · بدافع شخصي · نحو أسبوعين حتى الهدف",
      links: ["GitHub", "مباشر داخل الأداة"],
      decisions: [
        "لوحة ثنائية الأبعاد بدل WebGL/Three.js — الطريق الصعب عن قصد، لفهم كيف ينشأ ثلاثي الأبعاد فعلًا",
        "الإسقاط والدوران وتظليل العمق محسوبة بنفسي",
        "قراءة OBJ وSTL وDICOM مبنية بنفسي، لتحميل نماذج وبيانات حجمية حقيقية",
        "المحاولات الأولى كُتبت يدويًا، ثم دُفعت أبعد فأبعد مع CC كوكيل تنفيذ — حتى أشعة الجمجمة المقطعية. البنية والقرارات مني.",
      ],
      challenge: "كان كله أرضًا جديدة — الإسقاط والدوران وقراءة OBJ وSTL، ومشكلات في كل مكان لم أواجهها من قبل. الجاذبية كانت في الصعود: من سلكي بسيط إلى رسم أشعة مقطعية كاملة للجمجمة من بيانات DICOM على لوحة ثنائية الأبعاد.",
      widget: "نماذج ثلاثية الأبعاد، أدِرها بالفأرة",
    },
    aniscript: {
      kind: "سكربت مستخدم",
      learnGoal: "تعلّم سكربتات المستخدم/Tampermonkey والتعامل مع DOM — والتمرّن على فهم كود الآخرين وتوسيعه.",
      claim: "سكربت مستخدم لاستعمالي الشخصي — مُكيَّف ومُوسَّع، لا مبني من الصفر.",
      what: "سكربت مستخدم كيّفته ووسّعته بميزات خاصة: التعامل مع المستضيفين (Voe/Filemoon)، تخطّي الإعلانات، التشغيل التلقائي. تمرين على فهم كود الآخرين وصيانته وتوسيعه بشكل موجّه، بدل البدء من الصفر. (الموقع المستهدف: aniworld.to)",
      meta: "منفرد · للاستعمال الشخصي · صيانة مستمرة (v0.0.85)",
      links: ["GitHub (عام)", "بلا أداة مباشرة (سكربت مستخدم)"],
      decisions: [
        "مُكيَّف عن قصد بدل إعادة البناء — الهدف التوسيع لا الاستنساخ",
        "فُحص تكييف bs.to ثم تُرك: بنية مختلفة (يعيد التوجيه إلى مستضيف خارجي بدل التضمين في iframe)",
      ],
      challenge: "لفترة طويلة كان هناك خلل في العرض — السبب لم يكن السكربت، بل مدير سكربتات المستخدم أثناء انتقال Brave من Manifest V2 إلى V3. حلّه الانتقال من Violentmonkey إلى ScriptCat الذي تعامل مع MV3 بسلاسة.",
    },
    kevdev: {
      kind: "هذا الموقع",
      learnGoal: "موقع أعمال تعيشه بدل أن تقرأه — ولكل عنصر فيه سبب.",
      claim: "يثبت التفكير التصميمي — كل حركة تحكي شيئًا، ولا شيء للزينة.",
      what: "اطّلعت على مواقع أعمال كثيرة، ثم بنيت كل عنصر بمعنى: القماش في الواجهة كبير لدرجة أنك مضطر للمسه. «نبذة» مصعد تمرّ به حياتي. المشاريع على طاولة عمل، لكل منها «لماذا» و«ما تعلّمته». التواصل يأتي مع انتقال، ومن ينقر يجد مفاجأة مخفية. بيانات الناشر وسياسة الخصوصية طبقات فوق الصفحة الواحدة، كي تستمر الموسيقى دون انقطاع.",
      links: ["GitHub (عام)"],
      decisions: [
        "TypeScript خالص مع Vite، بلا إطار — الصفحة حركة لا حالة",
        "القماش فيزياء Verlet خاصة على لوحة رسم، والاسم يتشوّه معه كخامة",
        "مصعد من جدران CSS ثلاثية الأبعاد، والتكبير داخل الشاشة هو الانتقال إلى شبكة المشاريع",
        "شبكة واحدة متصلة كخيط ناظم من «نبذة» إلى «تواصل»",
        "بيانات الناشر/الخصوصية طبقة بدل صفحة مستقلة — الموسيقى تستمر",
        "نسخة خفيفة خاصة للهاتف بدل تنازلات للاثنين",
      ],
      challenge: "الهاتف عالم قائم بذاته: ما كان سلسًا على الحاسوب كان يتقطّع على الهاتف. القياس بدل التخمين — جدران المصعد كانت طبقات بارتفاع القسم كله. وفي النهاية نسخة خفيفة خاصة بدل تنازلات للاثنين.",
    },
    grundlagen: {
      title: "الأساسيات",
      kind: "معسكر تدريبي · Java",
      learnGoal: "الأساسيات — يدويًا، تعلّمتها في المعسكر التدريبي (Java، OOP، SQL، هياكل البيانات).",
      claim: "أساسيات الحِرفة — كلها مكتوبة يدويًا، تعلّمتها في المعسكر التدريبي.",
      widget: "مشاريع المعسكر التدريبي، تعمل مباشرة في المتصفح",
    },
  },
};

// The card in the current language: German original with the translated
// text laid over it. Links and screenshots keep their href/src.
export function localizeCard(card: ProjectCard): ProjectCard {
  const t = T[LANG]?.[card.id];
  if (!t) return card;
  return {
    ...card,
    title: t.title ?? card.title,
    kind: t.kind ?? card.kind,
    learnGoal: t.learnGoal ?? card.learnGoal,
    claim: t.claim ?? card.claim,
    what: t.what ?? card.what,
    meta: t.meta ?? card.meta,
    decisions: t.decisions ?? card.decisions,
    challenge: t.challenge ?? card.challenge,
    origin: t.origin ?? card.origin,
    links: card.links?.map((l, i) => ({ ...l, label: t.links?.[i] ?? l.label })),
    screenshots: card.screenshots?.map((s, i) => ({ ...s, alt: t.screenshots?.[i] ?? s.alt })),
    mascot: card.mascot && t.mascot ? { ...card.mascot, alt: t.mascot } : card.mascot,
    widget: card.widget && t.widget ? { ...card.widget, label: t.widget } : card.widget,
  };
}
