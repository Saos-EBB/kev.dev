// /links, the footer's "More stuff": the sites worth showing besides the
// portfolio. The screens in public/more-stuff/ are shots of the live pages. Public
// page, so only what those pages show themselves goes in here.
import "./links.css";
import { LANG, pick } from "../i18n";
import { UI } from "../i18n/ui";

const t = (de: string, en: string, ru: string, ja: string) => pick({ de, en, ru, ja });

type Site = { name: string; url: string; what: string; why: string; shots: [string, string][] };

const SITES: Site[] = [
  {
    name: t("Das Portfolio", "The portfolio", "Портфолио", "ポートフォリオ"),
    url: "/",
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
    name: "agressiveIntro",
    url: "/agressiveIntro",
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

// The page the visitor just came from isn't offered again. Other sites of mine
// only send their origin along, this one its whole path.
const norm = (u: URL) => u.origin + u.pathname.replace(/(\/index)?(\.html)?\/?$/, "");
function cameFrom() {
  try { return document.referrer ? norm(new URL(document.referrer)) : null; } catch { return null; }
}
const from = cameFrom();
const shown = SITES.filter((s) => norm(new URL(s.url, location.href)) !== from);

document.documentElement.lang = LANG;
document.getElementById("links")!.className = "links";
document.getElementById("links")!.innerHTML = `
  <a class="links-back" href="/">← kev.dev</a>
  <h1 class="links-title">${UI.moreStuff}</h1>
  <p class="links-lead">${t("Was ich sonst noch gebaut habe, was es ist und warum es so ist.", "What else I built, what it is and why it is that way.", "Что ещё я построил, что это такое и почему оно так устроено.", "他に作ったもの、それが何で、なぜそうなのか。")}</p>
  ${shown.map((s) => `
    <section class="site">
      <h2>${s.name}</h2>
      <div class="site-text">
        <div><h3>${t("Was es ist", "What it is", "Что это", "これは何か")}</h3><p>${s.what}</p></div>
        <div><h3>${t("Warum es so ist", "Why it is that way", "Почему так", "なぜこうなのか")}</h3><p>${s.why}</p></div>
      </div>
      <a class="site-open" href="${s.url}" target="_blank" rel="noopener">${t("Seite öffnen", "Open site", "Открыть сайт", "サイトを開く")} ↗</a>
      <div class="site-screens">
        ${s.shots.map(([file, alt]) => `<a href="/more-stuff/${file}.webp" target="_blank" rel="noopener"><img src="/more-stuff/${file}.webp" alt="${alt}" width="1280" height="800" loading="lazy" decoding="async" /></a>`).join("")}
      </div>
    </section>`).join("")}
  <footer class="links-foot">
    <span>© 2026 Kevin Schaberl</span>
    <a href="/impressum">${UI.impressum}</a>
    <a href="/datenschutz">${UI.datenschutz}</a>
  </footer>`;
