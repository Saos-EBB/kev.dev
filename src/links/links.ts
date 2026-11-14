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
      ["main-2", t("Der Kontakt: Let's talk now", "Contact: Let's talk now", "Контакты: Let's talk now", "連絡先: Let's talk now")],
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
      "Die laute Variante, bei der man etwas anfassen kann: Der Hammer zerschlägt die Tastatur, und was aus der Piñata fällt, lässt sich herumwerfen. Jeder Treffer schüttelt den Bildschirm, blitzt kurz auf und wirft Funken.",
      "The loud version, with things to touch: the hammer smashes the keyboard, and what falls out of the piñata can be thrown around. Every hit shakes the screen, flashes briefly and throws sparks.",
      "Громкий вариант, где можно что-то потрогать: молоток разбивает клавиатуру, а то, что выпало из пиньяты, можно разбрасывать. Каждый удар трясёт экран, коротко вспыхивает и сыплет искрами.",
      "触って遊べる、にぎやかなバージョンです。ハンマーがキーボードを壊し、ピニャータから落ちた物は投げて遊べます。当たるたびに画面が揺れ、一瞬光り、火花が飛びます。",),
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
    name: t("Das Portfolio als Kopf-CT", "The portfolio as a head CT", "Портфолио как КТ головы", "頭部CTとしてのポートフォリオ"),
    url: "/ct-look",
    what: t(
      "Meine Projekte in einem Schädel aus Punkten, der sich beim Scrollen öffnet. Jedes Projekt ist eine Hirnregion. Am Ende ist der Schädel wieder zu, und daneben stehen die Kontakt-Links. Die Seite gibt es nur auf Deutsch.",
      "My projects inside a skull made of points that opens as you scroll. Every project is a brain region. At the end the skull is closed again, with the contact links next to it. The page is in German only.",
    "Мои проекты внутри черепа из точек, который открывается при прокрутке. Каждый проект это область мозга. В конце череп снова закрыт, а рядом стоят ссылки для связи. Страница только на немецком.",
    "スクロールすると開く、点でできた頭蓋骨の中に私のプロジェクトがあります。各プロジェクトは脳の領域です。最後に頭蓋骨は再び閉じ、その横に連絡先リンクがあります。このページはドイツ語のみです。",),
    why: t(
      "Eine einzige Idee trägt hier die ganze Seite, statt dass 3D nur Deko ist. Der Schädel ist ein CT-Datensatz aus meinem eigenen 3D-Renderer.",
      "One single idea carries the whole page here, instead of 3D being mere decoration. The skull is a CT dataset from my own 3D renderer.",
    "Здесь всю страницу несёт одна идея, а 3D не просто украшение. Череп это набор данных КТ из моего собственного 3D-рендерера.",
    "ここでは3Dは単なる飾りではなく、1つのアイデアがページ全体を支えています。頭蓋骨は自作の3DレンダラーのCTデータです。",),
    shots: [
      ["ct-1", t("Der Schädel öffnet sich", "The skull opens", "Череп открывается", "頭蓋骨が開く")],
      ["ct-2", t("Ein Projekt als Hirnregion", "A project as a brain region", "Проект как область мозга", "脳の領域としてのプロジェクト")],
      ["ct-3", t("Der Atlas mit den kleineren Projekten", "The atlas of the smaller projects", "Атлас небольших проектов", "小さなプロジェクトのアトラス")],
      ["ct-4", t("Kontakt: der Schädel ist wieder zu", "Contact: the skull is closed again", "Контакты: череп снова закрыт", "連絡先: 頭蓋骨は再び閉じている")],
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
    url: "/notHosted",
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
];

// Prototypes rather than sites: their own section, after the sites.
const GAMES: Site[] = [
  {
    name: "Frost Grind",
    url: "https://saosgonegametry02.vercel.app",
    what: t(
      "Ein Browser-Game, das ich aus Spaß mache: AoE-Grinden wie der Mage in WoW Classic als Roguelike, mit Level-Karten, Runen, Relikten und Gear, das man an der Figur sieht. Zwei Klassen, generierte Maps in fünf Themes, Portale und eine Weltkarte. Der Prototyp ist fast fertig, gerade läuft der Feinschliff an Maps, Items und Kosmetik. Spielbar nur am Desktop.",
      "A browser game I make for fun: AoE grinding like the mage in WoW Classic as a roguelike, with level-up cards, runes, relics and gear you can see on the character. Two classes, generated maps in five themes, portals and a world map. The prototype is nearly done, right now I'm polishing maps, items and cosmetics. Desktop only.",
      "Браузерная игра, которую я делаю ради удовольствия: AoE-гринд как у мага в WoW Classic в виде рогалика, с картами уровней, рунами, реликвиями и снаряжением, которое видно на персонаже. Два класса, генерируемые карты в пяти темах, порталы и карта мира. Прототип почти готов, сейчас я шлифую карты, предметы и косметику. Только для компьютера.",
      "趣味で作っているブラウザゲームです。WoW ClassicのメイジのようなAoE狩りをローグライクにし、レベルアップカード、ルーン、レリック、キャラクターに表示される装備を加えました。2つのクラス、5つのテーマで生成されるマップ、ポータル、ワールドマップがあります。プロトタイプはほぼ完成で、今はマップ、アイテム、コスメを仕上げています。PC専用です。",),
    why: t(
      "Es verbindet, was ich an Games mag, und ich probiere aus, was sich gut anfühlt: welche Spells, welches Balancing. Die meisten Zahlen sind noch Platzhalter, es kann sich also jederzeit alles ändern.",
      "It combines what I like about games, and I'm trying out what feels good: which spells, which balancing. Most numbers are still placeholders, so anything can change at any time.",
      "Она объединяет то, что я люблю в играх, и я пробую, что ощущается хорошо: какие заклинания, какой баланс. Большинство чисел пока заглушки, так что всё может измениться в любой момент.",
      "ゲームの好きな要素を組み合わせ、どの呪文やバランスが気持ちよいかを試しています。ほとんどの数値はまだ仮なので、いつでもすべて変わる可能性があります。",),
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
  <h2 class="links-group">${t("Seiten", "Sites", "Сайты", "サイト")}</h2>
  ${SITES.filter(offered).map(siteHtml).join("")}
  <h2 class="links-group">${t("Game in Progress", "Game in progress", "Игра в разработке", "制作中のゲーム")}</h2>
  <p class="links-lead">${t(
    "Ein Prototyp, an dem ich herausfinde, was ich am Ende in einem Game haben will: was sich gut anfühlt, was Spaß macht und was wieder rausfliegt.",
    "A prototype where I find out what I ultimately want in a game: what feels good, what's fun and what gets thrown out again.",
    "Прототип, на котором я выясняю, что в итоге хочу видеть в игре: что ощущается хорошо, что весело, а что снова отправится в корзину.",
    "最終的にゲームに何を入れたいかを確かめるプロトタイプです。何が気持ちよく、何が楽しく、何を捨てるかを試しています。",)}</p>
  ${GAMES.filter(offered).map(siteHtml).join("")}
  <footer class="links-foot">
    <span>© 2026 Kevin Schaberl</span>
    <a href="/impressum">${UI.impressum}</a>
    <a href="/datenschutz">${UI.datenschutz}</a>
  </footer>`;
