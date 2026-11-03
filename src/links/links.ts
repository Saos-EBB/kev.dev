// /links, the footer's "More stuff": the sites worth showing besides the
// portfolio. The screens in public/more-stuff/ are shots of the live pages. Public
// page, so only what those pages show themselves goes in here.
import "./links.css";
import { LANG, pick } from "../i18n";
import { UI } from "../i18n/ui";

const t = (de: string, en: string, ru: string, ja: string) => pick({ de, en, ru, ja });

type Site = { name: string; url?: string; what: string; why: string; shots: [string, string][] };

const SITES: Site[] = [
  {
    name: t("Das Portfolio: lessAdhd", "The portfolio: lessAdhd", "Портфолио: lessAdhd", "ポートフォリオ: lessAdhd"),
    url: "/lessAdhd",
    what: t(
      "Meine Hauptseite: ein einziger Scroll-Ablauf mit Projekten, Über mich und Kontakt, ohne Frontend-Framework in TypeScript gebaut.",
      "My main site: one single scroll flow with projects, about and contact, built in TypeScript without a frontend framework.",
      "Мой основной сайт: единый сценарий прокрутки с проектами, разделом обо мне и контактами, написан на TypeScript без фронтенд-фреймворка.",
      "メインサイトです。プロジェクト、自己紹介、連絡先を1つのスクロールにまとめ、フロントエンドフレームワークなしでTypeScriptで作りました。",),
    why: t(
      "Die Seite soll selbst zeigen, was ich kann, statt es nur zu behaupten. Wer tiefer will, öffnet bei den großen Projekten Graph und Code.",
      "The site should show what I can do instead of just claiming it. Whoever wants more opens the graph and code on the big projects.",
      "Сайт должен сам показывать, что я умею, а не просто заявлять об этом. Кому интересно глубже, откроет граф и код у больших проектов.",
      "できることを主張するだけでなく、サイト自体で見せるためです。もっと知りたい人は、大きなプロジェクトのグラフとコードを開けます。",),
    shots: [
      ["main-1", t("Der Einstieg", "The start", "Начало", "トップ")],
      ["main-2", t("Der Kontakt mit dem Schädel", "Contact with the skull", "Контакты с черепом", "頭蓋骨のある連絡先")],
    ],
  },
  {
    name: "adhdActivated",
    url: "/adhdActivated",
    what: t(
      "Dieselben Inhalte als Raum: Ein Sägeblatt trifft einen Schädel, und das Blut macht die Wege zu Über mich, Projekten und Kontakt erst sichtbar. Am Ende fliegen alle Blätter.",
      "The same content as a room: a saw blade hits a skull, and only the blood reveals the ways to about, projects and contact. At the end all the blades fly.",
      "То же содержание в виде комнаты: пильный диск бьёт по черепу, и только кровь открывает пути к разделам обо мне, проектам и контактам. В конце летят все диски.",
      "同じ内容を部屋にしました。のこぎりの刃が頭蓋骨に当たり、血によって自己紹介、プロジェクト、連絡先への道が現れます。最後にはすべての刃が飛びます。",),
    why: t(
      "Die laute Variante, bei der man etwas anfassen kann: Der Hammer zerschlägt die Tastatur, und was aus der Piñata fällt, lässt sich herumwerfen.",
      "The loud version, with things to touch: the hammer smashes the keyboard, and what falls out of the piñata can be thrown around.",
      "Громкий вариант, где можно что-то потрогать: молоток разбивает клавиатуру, а то, что выпало из пиньяты, можно разбрасывать.",
      "触って遊べる、にぎやかなバージョンです。ハンマーがキーボードを壊し、ピニャータから落ちた物は投げて遊べます。",),
    shots: [
      ["intro-1", t("Der Raum", "The room", "Комната", "部屋")],
      ["intro-2", t("Über mich: der Hammer und die Tastatur", "About: the hammer and the keyboard", "Обо мне: молоток и клавиатура", "自己紹介: ハンマーとキーボード")],
      ["intro-3", t("Kontakt: was aus der Piñata fällt", "Contact: what falls out of the piñata", "Контакты: что выпало из пиньяты", "連絡先: ピニャータから落ちた物")],
      ["intro-4", t("Das Ende: der Blutnebel", "The end: the blood mist", "Конец: кровавый туман", "最後: 血の霧")],
    ],
  },
  {
    name: "kev.dev Casual",
    url: "https://kevdev-casual.vercel.app",
    what: t(
      "Mein Angebot für Produktseiten mit 3D und Scroll-Animationen, dazu drei Demos mit erfundenen Produkten: ein Kaffeefilter, ein Laptop und eine Limo.",
      "My offer for product pages with 3D and scroll animation, plus three demos with made-up products: a coffee filter, a laptop and a soda.",
    "Моё предложение для страниц продуктов с 3D и анимацией при прокрутке, плюс три демо с вымышленными продуктами: кофейный фильтр, ноутбук и лимонад.",
    "3Dとスクロールアニメーションを使った製品ページの提案と、架空の製品(コーヒーフィルター、ノートPC、ソーダ)の3つのデモです。",),
    why: t(
      "Die freundliche, verkaufende Seite neben dem Portfolio. Sie ist selbst wie eine Produktseite gebaut, und die Demos zeigen die Arbeit, statt sie zu beschreiben.",
      "The friendly, selling page next to the portfolio. It is built like a product page itself, and the demos show the work instead of describing it.",
    "Дружелюбная продающая страница рядом с портфолио. Она сама построена как страница продукта, а демо показывают работу, а не описывают её.",
    "ポートフォリオの隣にある、親しみやすい販売ページです。ページ自体が製品ページのように作られ、デモは仕事を説明する代わりに見せます。",),
    shots: [
      ["casual-1", t("Startseite mit 3D-Visitenkarten", "Home page with 3D business cards", "Главная с 3D-визитками", "3D名刺のあるトップページ")],
      ["casual-2", t("Laptop-Demo Kern 14, im Ganzen", "Kern 14 laptop demo, assembled", "Демо ноутбука Kern 14 в сборе", "ノートPCデモKern 14、組み立て状態")],
      ["casual-3", t("Derselbe Laptop in Einzelteilen", "The same laptop taken apart", "Тот же ноутбук в разобранном виде", "同じノートPCを分解した状態")],
      ["casual-4", t("Technische Daten der Demo", "The demo's technical specs", "Технические данные демо", "デモの技術仕様")],
    ],
  },
  {
    name: "kev.dev Engineering",
    url: "https://kevdev-engineering.vercel.app",
    what: t(
      "Meine Projekte als Präsentation: ein Foliensatz pro Projekt mit Architektur, Schlüsselmodulen, Entscheidungen und Messungen.",
      "My projects as a presentation: one slide deck per project with architecture, key modules, decisions and measurements.",
    "Мои проекты как презентация: набор слайдов на проект с архитектурой, ключевыми модулями, решениями и замерами.",
    "プロジェクトのプレゼンテーションです。プロジェクトごとのスライドに、アーキテクチャ、主要モジュール、判断、計測をまとめました。",),
    why: t(
      "Für Leute, die wissen wollen, wie etwas gebaut ist und nicht nur, wie es aussieht. Jede Folie nennt ihre Quelle, damit man es nachprüfen kann.",
      "For people who want to know how something is built, not just how it looks. Every slide names its source, so it can be checked.",
    "Для тех, кто хочет знать, как что-то устроено, а не только как выглядит. На каждом слайде указан источник, так что всё можно проверить.",
    "見た目だけでなく、どう作られているかを知りたい人向けです。各スライドに出典があるので、確かめられます。",),
    shots: [
      ["engineering-1", t("Der Überblick", "The overview", "Обзор", "概要")],
      ["engineering-2", t("3D-Renderer: die Werkzeugkette", "3D renderer: the tool chain", "3D-рендерер: цепочка инструментов", "3Dレンダラー: ツールチェーン")],
      ["engineering-3", t("3D-Renderer: Entscheidungen samt Verworfenem", "3D renderer: decisions, with what was rejected", "3D-рендерер: решения и то, что было отвергнуто", "3Dレンダラー: 判断と却下した案")],
    ],
  },
  {
    name: "notHosted",
    url: "https://claude.ai/artifact/F2nDy7fH1vQBjujLtMP1bB",
    what: t(
      "YourBrand und TschoBBo im Überblick: Umfang, Videos, Screens, die Postgres-Abfragen samt ihrer Geschichte und der Loadtester. Beide laufen gerade nicht öffentlich, eine Live-Demo setze ich auf Anfrage auf. Die Seite gibt es nur auf Deutsch.",
      "YourBrand and TschoBBo at a glance: scope, videos, screens, the Postgres queries and how they changed, and the load tester. Neither is publicly hosted right now, but I set up a live demo on request. The page is in German only.",
      "YourBrand и TschoBBo в обзоре: объём, видео, скриншоты, запросы Postgres и их история, а также нагрузочный тестер. Сейчас оба не размещены публично, но живое демо я подготовлю по запросу. Страница только на немецком.",
      "YourBrandとTschoBBoの概要です。規模、動画、画面、Postgresのクエリとその変遷、負荷テストツールをまとめました。どちらも現在は公開していませんが、ご依頼があればライブデモを用意します。このページはドイツ語のみです。",),
    why: t(
      "Beide Projekte hängen an Datenbanken, Diensten oder lokalen Modellen, und das soll nicht dauerhaft offen im Netz laufen. Hier sieht man trotzdem, was alles dazugehört.",
      "Both projects depend on databases, services or local models, which shouldn't run openly on the web all the time. Here you can still see everything that belongs to them.",
      "Оба проекта зависят от баз данных, сервисов или локальных моделей, и это не должно постоянно работать в открытой сети. Здесь всё равно видно, что в них входит.",
      "どちらもデータベース、各種サービス、ローカルモデルに依存しており、常時ネットに公開するものではありません。それでも、ここで全体像を見られます。",),
    shots: [
      ["nothosted-1", t("YourBrand: Dashboard", "YourBrand: dashboard", "YourBrand: панель управления", "YourBrand: ダッシュボード")],
      ["nothosted-2", t("KiezConnect, ein Mandant von YourBrand: das Schwarze Brett", "KiezConnect, a YourBrand tenant: the notice board", "KiezConnect, клиент YourBrand: доска объявлений", "YourBrandのテナントKiezConnect: 掲示板")],
      ["nothosted-3", t("TschoBBo: die Inbox", "TschoBBo: the inbox", "TschoBBo: входящие", "TschoBBo: 受信トレイ")],
    ],
  },
  {
    name: t("Das Portfolio als Kopf-CT", "The portfolio as a head CT", "Портфолио как КТ головы", "頭部CTとしてのポートフォリオ"),
    url: "/ct-look",
    what: t(
      "Meine Projekte in einem Schädel aus Punkten, der sich beim Scrollen öffnet. Jedes Projekt ist eine Hirnregion. Am Ende treffen ihn Sägeblätter, und die Splitter sind die Kontakt-Links. Die Seite gibt es nur auf Deutsch.",
      "My projects inside a skull made of points that opens as you scroll. Every project is a brain region. At the end saw blades hit it, and the shards are the contact links. The page is in German only.",
    "Мои проекты внутри черепа из точек, который открывается при прокрутке. Каждый проект это область мозга. В конце в него врезаются пильные диски, а осколки становятся ссылками для связи. Страница только на немецком.",
    "スクロールすると開く、点でできた頭蓋骨の中に私のプロジェクトがあります。各プロジェクトは脳の領域です。最後にのこぎりの刃が当たり、破片が連絡先リンクになります。このページはドイツ語のみです。",),
    why: t(
      "Eine einzige Idee trägt hier die ganze Seite, statt dass 3D nur Deko ist. Der Schädel ist ein CT-Datensatz aus meinem eigenen 3D-Renderer.",
      "One single idea carries the whole page here, instead of 3D being mere decoration. The skull is a CT dataset from my own 3D renderer.",
    "Здесь всю страницу несёт одна идея, а 3D не просто украшение. Череп это набор данных КТ из моего собственного 3D-рендерера.",
    "ここでは3Dは単なる飾りではなく、1つのアイデアがページ全体を支えています。頭蓋骨は自作の3DレンダラーのCTデータです。",),
    shots: [
      ["ct-1", t("Der Schädel öffnet sich", "The skull opens", "Череп открывается", "頭蓋骨が開く")],
      ["ct-2", t("Ein Projekt als Hirnregion", "A project as a brain region", "Проект как область мозга", "脳の領域としてのプロジェクト")],
      ["ct-3", t("Der Atlas mit den kleineren Projekten", "The atlas of the smaller projects", "Атлас небольших проектов", "小さなプロジェクトのアトラス")],
      ["ct-4", t("Kontakt: Sägeblätter und Splitter", "Contact: saw blades and shards", "Контакты: пильные диски и осколки", "連絡先: のこぎりの刃と破片")],
    ],
  },
  {
    name: t("Das frühere Portfolio", "The earlier portfolio", "Прежнее портфолио", "以前のポートフォリオ"),
    url: "https://saos-repo.vercel.app",
    what: t(
      "Mein Portfolio vor kev.dev, in Next.js: Profil, Projekte und Über mich als getrennte Seiten, dazu eine Pitch-Seite für das White-Label-Konzept von YourBrand.",
      "My portfolio before kev.dev, in Next.js: profile, projects and about as separate pages, plus a pitch page for YourBrand's white-label concept.",
    "Моё портфолио до kev.dev на Next.js: профиль, проекты и обо мне как отдельные страницы, плюс питч-страница концепции white-label YourBrand.",
    "kev.dev以前のポートフォリオで、Next.js製です。プロフィール、プロジェクト、自己紹介が別ページになり、YourBrandのホワイトラベル構想のピッチページもあります。",),
    why: t(
      "Jede Seite soll für sich verschickbar sein: Wer nur die Fakten braucht, bekommt nur die Fakten, und wer mehr will, klickt weiter.",
      "Each page can be sent on its own: whoever needs only the facts gets only the facts, and whoever wants more clicks on.",
    "Каждую страницу можно отправить отдельно: кому нужны только факты, получит только факты, а кто хочет больше, кликнет дальше.",
    "各ページは単独で送れます。事実だけ必要な人には事実だけを、もっと知りたい人は先へクリックできます。",),
    shots: [
      ["portfolio-1", t("Profil, nur die Fakten", "Profile, just the facts", "Профиль, только факты", "プロフィール、事実のみ")],
      ["portfolio-2", t("Die drei wichtigsten Projekte", "The three key projects", "Три главных проекта", "主要な3つのプロジェクト")],
      ["portfolio-3", t("Pitch-Seite für das White-Label-Konzept", "Pitch page for the white-label concept", "Питч-страница концепции white-label", "ホワイトラベル構想のピッチページ")],
    ],
  },
  {
    name: t("Der Lebenslauf", "The CV", "Резюме", "履歴書"),
    url: "https://saosme-navy.vercel.app",
    what: t(
      "Mein Lebenslauf als eigene Seite im Terminal-Look: Profil, Skills, Projekte, Werdegang und Kontakt.",
      "My CV as its own page in a terminal look: profile, skills, projects, career and contact.",
    "Моё резюме на отдельной странице в стиле терминала: профиль, навыки, проекты, опыт и контакты.",
    "ターミナル風の専用ページにした履歴書です。プロフィール、スキル、プロジェクト、経歴、連絡先があります。",),
    why: t(
      "Die Oberfläche ist bewusst ohne UI-Framework wie Bootstrap oder Tailwind gebaut, jedes Element folgt einem strengen Raster. Die Seite ist also selbst schon eine Arbeitsprobe.",
      "The interface is deliberately built without a UI framework like Bootstrap or Tailwind, with every element on a strict grid. So the page is a work sample in itself.",
    "Интерфейс намеренно сделан без UI-фреймворков вроде Bootstrap или Tailwind, каждый элемент стоит на строгой сетке. Так что страница сама по себе образец работы.",
    "UIはBootstrapやTailwindなどのフレームワークを使わずに作り、すべての要素を厳密なグリッドに沿わせました。ページ自体が作品サンプルです。",),
    shots: [
      ["cv-1", t("Einstieg mit Drahtgitter-Würfel", "Start with a wireframe cube", "Начало с каркасным кубом", "ワイヤーフレームの立方体で開始")],
      ["cv-2", t("Kontakt", "Contact", "Контакты", "連絡先")],
    ],
  },
];

// Prototypes rather than sites: their own section, at the top, and not all of them are public yet.
const GAMES: Site[] = [
  {
    name: t("Hinter dir", "Hinter dir (Behind you)", "Hinter dir (За тобой)", "Hinter dir(後ろにいる)"),
    what: t(
      "Ein First-Person-Horror im Browser: Mit der Taschenlampe durch ein Labyrinth, und etwas folgt dir. Es kommt näher, solange du nicht hinsiehst. Wer drei Gegenstände findet, kommt nach unten zu den Zombie-Wellen. Dazu gibt es eine Wald-Arena, in der ich Waffen und Monster ausprobiere.",
      "A first-person horror game in the browser: through a maze with a flashlight, and something follows you. It gets closer as long as you don't look. Find three items and you get down to the zombie waves. There is also a forest arena where I try out weapons and monsters.",
      "Хоррор от первого лица в браузере: с фонариком через лабиринт, а за тобой что-то идёт. Оно приближается, пока ты не смотришь. Кто найдёт три предмета, спустится к волнам зомби. Есть ещё лесная арена, где я пробую оружие и монстров.",
      "ブラウザで遊べる一人称ホラーです。懐中電灯を手に迷路を進むと、何かが後をつけてきます。見ていない間に近づいてきます。3つのアイテムを見つけると、下のゾンビウェーブに進めます。武器やモンスターを試す森のアリーナもあります。",),
    why: t(
      "Das Gegenstück zu Frost Grind: Dort geht es um viele Gegner und Tempo, hier um Licht, Sound und Spannung. Ich will herausfinden, wie viel davon ich später in einem Game haben will.",
      "The counterpart to Frost Grind: there it's about many enemies and speed, here about light, sound and tension. I want to find out how much of that I'll want in a game later.",
      "Противоположность Frost Grind: там много врагов и скорость, здесь свет, звук и напряжение. Хочу понять, сколько всего этого мне потом нужно в игре.",
      "Frost Grindとは対照的です。あちらは大量の敵とスピード、こちらは光と音と緊張感が中心です。将来のゲームにこれをどれくらい入れたいかを確かめています。",),
    shots: [
      ["horror-1", t("Das Menü", "The menu", "Меню", "メニュー")],
      ["horror-2", t("Kreide an der Wand, im Licht der Taschenlampe", "Chalk on the wall, in the flashlight", "Мел на стене в свете фонарика", "懐中電灯に照らされた壁のチョーク文字")],
      ["horror-3", t("Halle 1: die erste Zombie-Welle", "Hall 1: the first zombie wave", "Зал 1: первая волна зомби", "ホール1: 最初のゾンビウェーブ")],
      ["horror-4", t("Halle 2: manche sind größer", "Hall 2: some are bigger", "Зал 2: некоторые крупнее", "ホール2: 大きいのもいる")],
      ["horror-5", t("Der Endkampf gegen den Großen", "The final fight against the big one", "Финальный бой с Большим", "大きなやつとの最終戦")],
      ["horror-6", t("Die Wald-Arena", "The forest arena", "Лесная арена", "森のアリーナ")],
    ],
  },
  {
    name: "Frost Grind",
    url: "https://saosgonegametry02.vercel.app",
    what: t(
      "Ein Browser-Game, das ich aus Spaß mache: AoE-Grinden wie der Mage in WoW Classic, dazu Roguelike-Runs mit Karten, Runen und Relikten. Komplett in Arbeit, und der Look ist noch ziemlich raw.",
      "A browser game I make for fun: AoE grinding like the mage in WoW Classic, plus roguelike runs with cards, runes and relics. Entirely a work in progress, and the look is still pretty raw.",
      "Браузерная игра, которую я делаю ради удовольствия: AoE-гринд как у мага в WoW Classic и рогалик-забеги с картами, рунами и реликвиями. Всё ещё в работе, и внешний вид пока довольно сырой.",
      "趣味で作っているブラウザゲームです。WoW ClassicのメイジのようなAoE狩りに、カード、ルーン、レリックを使うローグライクのランを組み合わせました。すべて制作途中で、見た目もまだ粗いです。",),
    why: t(
      "Es verbindet, was ich an Games mag, und ich probiere gerade aus, was sich gut anfühlt: welche Spells, welches Balancing. Es kann sich also jederzeit alles ändern.",
      "It combines what I like about games, and I'm trying out what feels good: which spells, which balancing. So anything can change at any time.",
      "Она объединяет то, что я люблю в играх, и сейчас я пробую, что ощущается хорошо: какие заклинания, какой баланс. Так что всё может измениться в любой момент.",
      "ゲームの好きな要素を組み合わせ、どの呪文やバランスが気持ちよいかを試しています。そのため、いつでもすべて変わる可能性があります。",),
    shots: [
      ["frost-1", t("Das Menü: Figur, Mods und Mob-Modus", "The menu: character, mods and mob mode", "Меню: персонаж, моды и режим мобов", "メニュー: キャラクター、MOD、モブモード")],
      ["frost-2", t("Belagerung: die Mobs kommen vom Rand", "Siege: the mobs come from the edge", "Осада: мобы идут с краёв", "包囲: モブが外周から迫る")],
      ["frost-3", t("Level-Up: eine von vier Karten", "Level up: one of four cards", "Новый уровень: одна из четырёх карт", "レベルアップ: 4枚から1枚を選ぶ")],
      ["frost-4", t("Feuermagier im Dschungel", "Fire mage in the jungle", "Огненный маг в джунглях", "ジャングルの炎の魔法使い")],
      ["frost-5", t("Strichkrieger in der Wüste", "Stick warrior in the desert", "Воин-палочка в пустыне", "砂漠の棒人間戦士")],
      ["frost-6", t("Eismagier in der Schmiede", "Frost mage in the forge", "Ледяной маг в кузне", "鍛冶場の氷の魔法使い")],
    ],
  },
];

// The page the visitor just came from isn't offered again. Other sites of mine
// only send their origin along, this one its whole path.
const norm = (u: URL) => u.origin + u.pathname.replace(/(\/index)?(\.html)?\/?$/, "").replace(/^(\/adhdActivated)\/.*/, "$1");
function cameFrom() {
  try { return document.referrer ? norm(new URL(document.referrer)) : null; } catch { return null; }
}
const from = cameFrom();
// From one of the two main pages it takes on that page's look, and its current
// theme there. Every other way in keeps the plain one.
const stored = (area: Storage, key: string) => {
  try { return area.getItem(key); } catch { return null; }
};
const here = location.origin;
const source = from === `${here}/lessAdhd` ? "lessAdhd" : from === `${here}/adhdActivated` ? "adhdActivated" : null;
if (source === "lessAdhd") document.documentElement.dataset.look = stored(sessionStorage, "theme") === "dark" ? "less-dark" : "less-light";
if (source === "adhdActivated") document.documentElement.dataset.look = stored(localStorage, "kev-ai-theme") === "white" ? "activated-white" : "activated-red";
const offered = (s: Site) => !s.url || norm(new URL(s.url, location.href)) !== from;
const siteHtml = (s: Site) => `
    <section class="site">
      <h2>${s.name}</h2>
      <div class="site-text">
        <div><h3>${t("Was es ist", "What it is", "Что это", "これは何か")}</h3><p>${s.what}</p></div>
        <div><h3>${t("Warum es so ist", "Why it is that way", "Почему так", "なぜこうなのか")}</h3><p>${s.why}</p></div>
      </div>
      ${s.url ? `<a class="site-open" href="${s.url}" target="_blank" rel="noopener">${t("Seite öffnen", "Open site", "Открыть сайт", "サイトを開く")} ↗</a>` : `<p class="site-closed">${t("Noch nicht öffentlich", "Not public yet", "Пока не опубликовано", "まだ公開していません")}</p>`}
      <div class="site-screens">
        ${s.shots.map(([file, alt]) => `<a href="/more-stuff/${file}.webp" target="_blank" rel="noopener"><img src="/more-stuff/${file}.webp" alt="${alt}" width="1280" height="800" loading="lazy" decoding="async" /></a>`).join("")}
      </div>
    </section>`;

document.documentElement.lang = LANG;
document.getElementById("links")!.className = "links";
document.getElementById("links")!.innerHTML = `
  <a class="links-back" href="${source ? `/${source}` : "/"}">← ${source ?? "kev.dev"}</a>
  <h1 class="links-title">${UI.moreStuff}</h1>
  <p class="links-lead">${t("Was ich sonst noch gebaut habe, was es ist und warum es so ist.", "What else I built, what it is and why it is that way.", "Что ещё я построил, что это такое и почему оно так устроено.", "他に作ったもの、それが何で、なぜそうなのか。")}</p>
  <h2 class="links-group">${t("Games in Progress", "Games in progress", "Игры в разработке", "制作中のゲーム")}</h2>
  <p class="links-lead">${t(
    "Gerade baue ich ein paar Prototypen, um zu verstehen, was ich am Ende in einem Game haben will: was sich gut anfühlt, was Spaß macht und was wieder rausfliegt. Fertige Spiele sind das nicht, und es kann sich jederzeit alles ändern.",
    "Right now I'm building a few prototypes to understand what I ultimately want in a game: what feels good, what's fun and what gets thrown out again. These aren't finished games, and anything can change at any time.",
    "Сейчас я делаю несколько прототипов, чтобы понять, что в итоге хочу видеть в игре: что ощущается хорошо, что весело, а что снова отправится в корзину. Это не готовые игры, и всё может измениться в любой момент.",
    "最終的にゲームに何を入れたいかを理解するため、いまプロトタイプをいくつか作っています。何が気持ちよく、何が楽しく、何を捨てるかを確かめています。完成したゲームではなく、いつでもすべて変わる可能性があります。",)}</p>
  ${GAMES.filter(offered).map(siteHtml).join("")}
  <h2 class="links-group">${t("Seiten", "Sites", "Сайты", "サイト")}</h2>
  ${SITES.filter(offered).map(siteHtml).join("")}
  <footer class="links-foot">
    <span>© 2026 Kevin Schaberl</span>
    <a href="/impressum">${UI.impressum}</a>
    <a href="/datenschutz">${UI.datenschutz}</a>
  </footer>`;
