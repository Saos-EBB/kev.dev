// All copy of the About overlay (about-blocks.ts) and the CV facts
// (elevator.ts's cvSections), per language. German is Kevin's original
// wording; the other four are translations of it — keep them in step when
// the German changes. Inline markup: hl() is the accent highlight, the
// story's last paragraph links to #projects.

import { pick } from "../i18n";

const hl = (s: string) => `<span class="about-highlight">${s}</span>`;
const projectsLink = (label: string) => `<a class="about-inline-link" href="#projects">${label}</a>`;

export interface CvSection {
  heading: string;
  items: string[];
}

export interface AboutContent {
  role: string;
  facts: string[];
  story: string[];
  principles: string[];
  work: string[];
  end: string;
  cv: CvSection[];
}

const de: AboutContent = {
  role: "Junior Software Developer",
  facts: ["Raum Linz · remote im DACH-Raum", "sofort verfügbar", "TypeScript-Fullstack · Autodidakt"],
  story: [
    `${hl("„Geht nicht“ akzeptiere ich nicht.")} Das zieht sich durch alles, was ich anfange. Wenn ich ein neues Spiel starte, nehme ich es zuerst auseinander: In WoW habe ich mich durch Addons gekämpft, die teils ziemlich komplex waren, WeakAuras zum Beispiel. In League of Legends habe ich Mechaniken, Rollen und Champions studiert und Jungle-Pfade, Builds und Tempo durchprobiert, bevor ich überhaupt „richtig“ gespielt habe.`,
    `Genau so fühlt sich Programmieren für mich an: ${hl("wie ein neues Spiel, das ich die nächsten Jahre komplett erkunden will.")} Ich will vor keiner Sprache Respekt haben müssen, sondern die Logik und das große Ganze verstehen, und dann einfache, effiziente Lösungen finden oder neue Ansätze ausprobieren. Deshalb arbeite ich mich gerade mit einem Skript der Uni Graz in C++ ein: Ich will verstehen, was mit Speicher und Pointern wirklich passiert. Das Ziel ist klar: Programmierer werden.`,
    `Der Weg zu meinem größten Projekt führte über einen Passwort-Cracker, eine Tamagotchi-App und ein Unity-Spiel, das ich nach zwei Wochen verworfen habe. Dann kam ${hl("YourBrand")}. Am Anfang stand ein „Das schaffst du nicht“ — und ich hatte den Mund ziemlich voll genommen. Also wollte ich zeigen, dass ich das auch einlösen kann. Nach langer Arbeit steht jetzt ein voll funktionsfähiger Prototyp.`,
    `Alles andere unter ${projectsLink("Projekte")} entsteht aus einem von zwei Gründen. Entweder brauche ich es selbst: TschoBBo, mein Bewerbungs-Bot, der Release Watcher, Userscripts. Oder ich will etwas lernen: der 3D-Renderer, diese Seite, die Java-Grundlagen. Überwiegend schreibe ich ${hl("TypeScript")}, weil ich damit den ganzen Stack in einer Sprache abdecke; die Grundlagen kommen aus Java.`,
  ],
  principles: [
    "„Geht nicht“ heißt meistens: noch nicht verstanden.",
    "Ist das Konzept durchdacht, ist die Implementierung der einfachere Teil.",
    "Einfache Lösungen sind robuster und für andere leichter nachvollziehbar.",
  ],
  work: [
    `${hl("Ich denke mich gern in Abläufe hinein.")} Bei YourBrand hieß das: Was will ein User, was ein Admin, was ein Owner? Wie soll es sich anfühlen, wie wird es intuitiv, welche Layouts braucht es auf welchem Gerät? Wer bekommt welche Rechte, wie gehe ich mit Sichtbarkeit und Nutzerschutz um, wie sieht ein Ticket-System für Admins aus? Und darüber: Wie bringt man Spaß hinein, wie gewinnt und hält man Nutzer, wie verdient man Geld?`,
    `Über tausend solcher Fragen musste ich mir stellen und beantworten, bevor das Produkt Form hatte. ${hl("Genau dieser Teil reizt mich am meisten.")}`,
    `Ich plane, bevor ich baue, setze Ideen dann früh um und teste sie. Hakt es, war der Plan nicht genau genug — dann strukturiere ich neu und setze wieder an, ${hl("bis es funktioniert")}. Die Umsetzung läuft heute oft über ${hl("Claude Code")} als Implementierungs-Agent: Konzept und Architektur kommen von mir, CC schreibt den Code.`,
    `Kreativität gehört für mich dazu. Früher wollte ich Modedesigner werden und habe Graffiti gemalt; heute steckt das in UI und Interaktion. Die Graffiti-Überschriften auf dieser Seite und die vielen Elemente, die man anfassen kann, kommen nicht von ungefähr.`,
    `An einem Projekt bleibe ich meist ${hl("zwei bis sieben Tage")} am Stück und wechsle dann, um ein Konzept in einem anderen Bereich auszuprobieren. So wächst der Werkzeugkasten ständig.`,
  ],
  end: `Ausgleich zum Coden und Lernen finde ich in der Natur und bei meiner Familie, allen voran bei ${hl("meinem Sohn")}.`,
  cv: [
    {
      heading: "Werdegang",
      items: [
        `${hl("Junior Developer")} — Full-Stack-Bootcamp · Talent Hub – IT Ibis Acam, Linz · Okt 2025 – Jun 2026`,
        `${hl("Sanierung Wohnhaus")} (Familienprojekt) · Linz-Ebelsberg · Jun 2023 – Okt 2025`,
        `${hl("Administrator")} · BBU GmbH, Linz · Jan 2022 – Jun 2023`,
        `${hl("Zivildiener")} · BBU GmbH, Linz · Mär 2021 – Dez 2021`,
        `${hl("Auslandsaufenthalt")} · Schwerpunkt Europa · Sep 2019 – Feb 2021`,
        `${hl("Sonnenschutztechniker")} · SUNSTAR, Leonding · Jul 2017 – Apr 2019`,
        `${hl("Bodenleger")} · Bodendesign Mittermayer, Linz · Sep 2012 – Mai 2017`,
      ],
    },
    {
      heading: "Ausbildung",
      items: [`${hl("Pflichtschule, Gymnasium")}`, `${hl("Full-Stack-Bootcamp")} — Zertifikat Junior Developer (2026)`],
    },
    {
      heading: "Skills",
      items: [
        `${hl("Backend und Daten")} — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker`,
        `${hl("Frontend")} — React, Next.js, Tailwind, Zustand, Canvas 2D`,
        `${hl("Werkzeuge und Automatisierung")} — Node.js, Python, Playwright, Ollama, Git`,
        `${hl("Grundlagen")} — Java, OOP, SQL, Datenstrukturen, 3D-Mathematik`,
      ],
    },
    {
      heading: "Sprachen",
      items: [`${hl("Deutsch")} — Muttersprache`, `${hl("Englisch")} — siehe Lebenslauf`],
    },
  ],
};

const en: AboutContent = {
  role: "Junior Software Developer",
  facts: ["Linz area · remote across DACH", "available now", "TypeScript full stack · self-taught"],
  story: [
    `${hl("I don't accept \"can't be done\".")} That runs through everything I start. When I pick up a new game, I take it apart first: in WoW I fought my way through add-ons, some of them fairly complex, WeakAuras for example. In League of Legends I studied mechanics, roles and champions and tried out jungle paths, builds and tempo before I even played "for real".`,
    `That's exactly how programming feels to me: ${hl("like a new game I want to explore fully over the next few years.")} I don't want to be intimidated by any language; I want to understand the logic and the bigger picture, then find simple, efficient solutions or try new approaches. That's why I'm currently working my way into C++ with a course script from the University of Graz: I want to understand what really happens with memory and pointers. The goal is clear: to become a programmer.`,
    `The road to my biggest project led through a password cracker, a Tamagotchi app and a Unity game I scrapped after two weeks. Then came ${hl("YourBrand")}. It started with a "you won't pull that off" — and I had talked pretty big. So I wanted to show I could back it up. After a long stretch of work, there's now a fully functional prototype.`,
    `Everything else under ${projectsLink("Projects")} comes from one of two reasons. Either I need it myself: TschoBBo, my job-application bot, the Release Watcher, userscripts. Or I want to learn something: the 3D renderer, this site, the Java fundamentals. I mostly write ${hl("TypeScript")}, because it covers the whole stack in one language; the fundamentals come from Java.`,
  ],
  principles: [
    "\"Can't be done\" usually means: not understood yet.",
    "Once the concept is thought through, implementation is the easier part.",
    "Simple solutions are more robust and easier for others to follow.",
  ],
  work: [
    `${hl("I like thinking my way into processes.")} With YourBrand that meant: what does a user want, what does an admin want, what does an owner want? How should it feel, how does it become intuitive, which layouts are needed on which device? Who gets which rights, how do I handle visibility and user protection, what does a ticket system for admins look like? And on top: how do you make it fun, how do you win and keep users, how do you make money?`,
    `I had to ask and answer well over a thousand questions like these before the product took shape. ${hl("That's the part that appeals to me most.")}`,
    `I plan before I build, then put ideas into practice early and test them. If something snags, the plan wasn't precise enough — so I restructure and go again, ${hl("until it works")}. These days the implementation often runs through ${hl("Claude Code")} as an implementation agent: concept and architecture come from me, CC writes the code.`,
    `Creativity is part of it for me. I used to want to be a fashion designer and painted graffiti; today that goes into UI and interaction. The graffiti headlines on this page and the many elements you can touch are no coincidence.`,
    `I usually stay with a project for ${hl("two to seven days")} straight, then switch to try a concept in another area. That way the toolbox keeps growing.`,
  ],
  end: `My balance to coding and learning is nature and my family, above all ${hl("my son")}.`,
  cv: [
    {
      heading: "Experience",
      items: [
        `${hl("Junior Developer")} — full-stack bootcamp · Talent Hub – IT Ibis Acam, Linz · Oct 2025 – Jun 2026`,
        `${hl("House renovation")} (family project) · Linz-Ebelsberg · Jun 2023 – Oct 2025`,
        `${hl("Administrator")} · BBU GmbH, Linz · Jan 2022 – Jun 2023`,
        `${hl("Civilian service")} · BBU GmbH, Linz · Mar 2021 – Dec 2021`,
        `${hl("Time abroad")} · mainly Europe · Sep 2019 – Feb 2021`,
        `${hl("Sun protection technician")} · SUNSTAR, Leonding · Jul 2017 – Apr 2019`,
        `${hl("Floor layer")} · Bodendesign Mittermayer, Linz · Sep 2012 – May 2017`,
      ],
    },
    {
      heading: "Education",
      items: [`${hl("Compulsory school, grammar school")}`, `${hl("Full-stack bootcamp")} — Junior Developer certificate (2026)`],
    },
    {
      heading: "Skills",
      items: [
        `${hl("Backend and data")} — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker`,
        `${hl("Frontend")} — React, Next.js, Tailwind, Zustand, Canvas 2D`,
        `${hl("Tools and automation")} — Node.js, Python, Playwright, Ollama, Git`,
        `${hl("Fundamentals")} — Java, OOP, SQL, data structures, 3D math`,
      ],
    },
    {
      heading: "Languages",
      items: [`${hl("German")} — native`, `${hl("English")} — see CV`],
    },
  ],
};

const ru: AboutContent = {
  role: "Junior-разработчик ПО",
  facts: ["Линц и окрестности · удалённо по DACH", "готов приступить сразу", "TypeScript full stack · самоучка"],
  story: [
    `${hl("«Невозможно» я не принимаю.")} Это проходит через всё, за что я берусь. Начиная новую игру, я сначала разбираю её на части: в WoW я пробивался через аддоны, порой довольно сложные, например WeakAuras. В League of Legends я изучал механики, роли и чемпионов, перепробовал маршруты в лесу, сборки и темп, прежде чем вообще начал играть «по-настоящему».`,
    `Именно так ощущается для меня программирование: ${hl("как новая игра, которую я хочу исследовать до конца в ближайшие годы.")} Я не хочу бояться ни одного языка — я хочу понимать логику и общую картину, а затем находить простые, эффективные решения или пробовать новые подходы. Поэтому сейчас я осваиваю C++ по учебному скрипту Грацского университета: хочу понять, что на самом деле происходит с памятью и указателями. Цель ясна: стать программистом.`,
    `Путь к моему крупнейшему проекту лежал через взломщик паролей, приложение-тамагочи и игру на Unity, которую я забросил через две недели. Потом появился ${hl("YourBrand")}. Всё началось с «у тебя не получится» — а я наобещал немало. Хотелось доказать, что слова подкреплены делом. После долгой работы теперь есть полностью рабочий прототип.`,
    `Всё остальное в разделе ${projectsLink("Проекты")} возникает по одной из двух причин. Либо это нужно мне самому: TschoBBo, мой бот для откликов, Release Watcher, юзерскрипты. Либо я хочу чему-то научиться: 3D-рендерер, этот сайт, основы Java. В основном я пишу на ${hl("TypeScript")}, потому что он покрывает весь стек одним языком; основы — из Java.`,
  ],
  principles: [
    "«Невозможно» чаще всего значит: ещё не понято.",
    "Если концепция продумана, реализация — более простая часть.",
    "Простые решения надёжнее, и другим в них легче разобраться.",
  ],
  work: [
    `${hl("Мне нравится вникать в процессы.")} В YourBrand это значило: чего хочет пользователь, чего администратор, чего владелец? Каким это должно ощущаться, как сделать интуитивно, какие макеты нужны на каком устройстве? Кто получает какие права, как обращаться с видимостью и защитой пользователей, как выглядит тикет-система для администраторов? А поверх этого: как добавить веселья, как привлечь и удержать пользователей, как зарабатывать?`,
    `Больше тысячи таких вопросов мне пришлось задать себе и ответить на них, прежде чем продукт обрёл форму. ${hl("Именно эта часть привлекает меня больше всего.")}`,
    `Я планирую, прежде чем строить, затем рано воплощаю идеи и тестирую их. Если что-то не идёт, значит план был недостаточно точным — тогда я перестраиваю его и пробую снова, ${hl("пока не заработает")}. Реализация сегодня часто идёт через ${hl("Claude Code")} как агента: концепция и архитектура — мои, CC пишет код.`,
    `Креативность для меня — часть работы. Раньше я хотел стать модельером и рисовал граффити; сегодня это уходит в UI и взаимодействие. Граффити-заголовки на этой странице и множество элементов, которые можно потрогать, — не случайность.`,
    `Над одним проектом я обычно работаю ${hl("от двух до семи дней")} подряд, а затем переключаюсь, чтобы опробовать концепцию в другой области. Так набор инструментов постоянно растёт.`,
  ],
  end: `Отдых от кода и учёбы для меня — природа и семья, и прежде всего ${hl("сын")}.`,
  cv: [
    {
      heading: "Опыт",
      items: [
        `${hl("Junior-разработчик")} — full-stack буткемп · Talent Hub – IT Ibis Acam, Линц · окт 2025 – июн 2026`,
        `${hl("Ремонт жилого дома")} (семейный проект) · Линц-Эбельсберг · июн 2023 – окт 2025`,
        `${hl("Администратор")} · BBU GmbH, Линц · янв 2022 – июн 2023`,
        `${hl("Альтернативная гражданская служба")} · BBU GmbH, Линц · мар 2021 – дек 2021`,
        `${hl("Жизнь за границей")} · в основном Европа · сен 2019 – фев 2021`,
        `${hl("Техник по солнцезащите")} · SUNSTAR, Леондинг · июл 2017 – апр 2019`,
        `${hl("Укладчик полов")} · Bodendesign Mittermayer, Линц · сен 2012 – май 2017`,
      ],
    },
    {
      heading: "Образование",
      items: [`${hl("Обязательная школа, гимназия")}`, `${hl("Full-stack буткемп")} — сертификат Junior Developer (2026)`],
    },
    {
      heading: "Навыки",
      items: [
        `${hl("Бэкенд и данные")} — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker`,
        `${hl("Фронтенд")} — React, Next.js, Tailwind, Zustand, Canvas 2D`,
        `${hl("Инструменты и автоматизация")} — Node.js, Python, Playwright, Ollama, Git`,
        `${hl("Основы")} — Java, ООП, SQL, структуры данных, 3D-математика`,
      ],
    },
    {
      heading: "Языки",
      items: [`${hl("Немецкий")} — родной`, `${hl("Английский")} — см. резюме`],
    },
  ],
};

const ja: AboutContent = {
  role: "ジュニア・ソフトウェア開発者",
  facts: ["リンツ周辺 · DACH圏でリモート可", "すぐに勤務可能", "TypeScriptフルスタック · 独学"],
  story: [
    `${hl("「できない」は受け入れません。")}これは私が始めることすべてに通じています。新しいゲームを始めるときは、まず分解します。WoWでは、WeakAurasのようなかなり複雑なアドオンと格闘しました。League of Legendsでは、メカニクス、ロール、チャンピオンを研究し、ジャングルのルート、ビルド、テンポを試してから、ようやく「本気で」プレイし始めました。`,
    `私にとってプログラミングはまさにそれです。${hl("これから何年もかけて隅々まで探索したい新しいゲームのようなもの。")}どの言語にも怖気づきたくありません。ロジックと全体像を理解し、シンプルで効率的な解決策や新しいアプローチを見つけたいのです。そのため今、グラーツ大学の講義資料でC++を学んでいます。メモリとポインタで実際に何が起きているのかを理解したいからです。目標ははっきりしています。プログラマーになることです。`,
    `最大のプロジェクトにたどり着くまでに、パスワードクラッカー、たまごっち風アプリ、そして2週間で断念したUnityゲームを作りました。そして生まれたのが${hl("YourBrand")}です。始まりは「お前には無理だ」という一言。私はかなり大きなことを言っていたので、それを実現できると示したかったのです。長い作業の末、今は完全に動作するプロトタイプがあります。`,
    `${projectsLink("プロジェクト")}にあるほかのものは、2つの理由のどちらかから生まれています。自分で必要だったもの：応募ボットのTschoBBo、Release Watcher、ユーザースクリプト。あるいは学びたかったもの：3Dレンダラー、このサイト、Javaの基礎。主に${hl("TypeScript")}を書いています。1つの言語でスタック全体をカバーできるからです。基礎はJavaから来ています。`,
  ],
  principles: [
    "「できない」はたいてい、まだ理解していないという意味だ。",
    "コンセプトが練られていれば、実装は簡単な部分になる。",
    "シンプルな解決策は壊れにくく、他の人にも理解しやすい。",
  ],
  work: [
    `${hl("処理の流れを深く考えるのが好きです。")}YourBrandでは、ユーザーは何を求め、管理者は何を、オーナーは何を求めるのか。どう感じられるべきか、どうすれば直感的になるか、どのデバイスにどのレイアウトが必要か。誰にどの権限を与え、可視性とユーザー保護をどう扱うか、管理者向けのチケットシステムはどうあるべきか。さらにその上で、どう楽しさを加え、ユーザーを集めて定着させ、どう収益を上げるか。`,
    `製品が形になるまでに、こうした問いを千以上も自分に投げかけ、答えを出す必要がありました。${hl("まさにこの部分に一番惹かれます。")}`,
    `作る前に計画し、アイデアは早めに形にしてテストします。行き詰まったら計画の精度が足りなかったということなので、構成を見直してもう一度取り組みます。${hl("動くまで")}。現在、実装には${hl("Claude Code")}を実装エージェントとしてよく使います。コンセプトとアーキテクチャは私が考え、CCがコードを書きます。`,
    `創造性も私にとって欠かせません。以前はファッションデザイナーを目指し、グラフィティを描いていました。今はそれがUIとインタラクションに生きています。このページの見出しがグラフィティ文字で、触れられる要素が多いのは偶然ではありません。`,
    `1つのプロジェクトには通常${hl("2〜7日")}続けて取り組み、その後、別の分野でコンセプトを試すために切り替えます。こうして道具箱は増え続けます。`,
  ],
  end: `コードと学習の合間の息抜きは、自然と家族、何より${hl("息子")}です。`,
  cv: [
    {
      heading: "経歴",
      items: [
        `${hl("ジュニア開発者")} — フルスタック・ブートキャンプ · Talent Hub – IT Ibis Acam、リンツ · 2025年10月 – 2026年6月`,
        `${hl("住宅の改修")}（家族のプロジェクト） · リンツ＝エーベルスベルク · 2023年6月 – 2025年10月`,
        `${hl("システム管理者")} · BBU GmbH、リンツ · 2022年1月 – 2023年6月`,
        `${hl("社会奉仕（兵役代替）")} · BBU GmbH、リンツ · 2021年3月 – 2021年12月`,
        `${hl("海外滞在")} · 主にヨーロッパ · 2019年9月 – 2021年2月`,
        `${hl("日よけ設備の技術者")} · SUNSTAR、レオンディング · 2017年7月 – 2019年4月`,
        `${hl("床職人")} · Bodendesign Mittermayer、リンツ · 2012年9月 – 2017年5月`,
      ],
    },
    {
      heading: "学歴",
      items: [`${hl("義務教育、ギムナジウム")}`, `${hl("フルスタック・ブートキャンプ")} — ジュニア開発者修了証（2026年）`],
    },
    {
      heading: "スキル",
      items: [
        `${hl("バックエンドとデータ")} — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker`,
        `${hl("フロントエンド")} — React, Next.js, Tailwind, Zustand, Canvas 2D`,
        `${hl("ツールと自動化")} — Node.js, Python, Playwright, Ollama, Git`,
        `${hl("基礎")} — Java, OOP, SQL, データ構造, 3D数学`,
      ],
    },
    {
      heading: "言語",
      items: [`${hl("ドイツ語")} — 母語`, `${hl("英語")} — 履歴書を参照`],
    },
  ],
};

const ar: AboutContent = {
  role: "مطوّر برمجيات مبتدئ",
  facts: ["منطقة لينتس · عن بُعد في منطقة DACH", "متاح فورًا", "TypeScript متكامل · تعلّم ذاتي"],
  story: [
    `${hl("لا أقبل عبارة «مستحيل».")} وهذا يسري على كل ما أبدأه. عندما أبدأ لعبة جديدة، أفككها أولًا: في WoW شققت طريقي عبر إضافات كان بعضها معقدًا جدًا، مثل WeakAuras. وفي League of Legends درست الآليات والأدوار والأبطال، وجرّبت مسارات الأدغال والبنايات والإيقاع قبل أن ألعب «بجدية» أصلًا.`,
    `وهكذا تمامًا أشعر بالبرمجة: ${hl("كلعبة جديدة أريد استكشافها بالكامل في السنوات القادمة.")} لا أريد أن أهاب أي لغة، بل أن أفهم المنطق والصورة الكاملة، ثم أجد حلولًا بسيطة وفعّالة أو أجرّب مقاربات جديدة. لهذا أتعلّم الآن C++ من مذكرة جامعة غراتس: أريد أن أفهم ما يحدث فعلًا مع الذاكرة والمؤشرات. والهدف واضح: أن أصبح مبرمجًا.`,
    `مرّ الطريق إلى أكبر مشاريعي بكاسر كلمات مرور، وتطبيق على طراز تاماغوتشي، ولعبة Unity تخلّيت عنها بعد أسبوعين. ثم جاء ${hl("YourBrand")}. بدأ الأمر بعبارة «لن تنجح في ذلك» — وكنت قد تكلّمت بثقة كبيرة. فأردت أن أثبت أنني قادر على الوفاء بكلامي. وبعد عمل طويل، هناك الآن نموذج أولي يعمل بالكامل.`,
    `كل ما عدا ذلك في ${projectsLink("المشاريع")} ينشأ لأحد سببين. إما أنني أحتاجه بنفسي: TschoBBo، بوت التقديم على الوظائف، وRelease Watcher، وسكربتات المستخدم. أو أنني أريد أن أتعلّم شيئًا: المُصيّر ثلاثي الأبعاد، وهذا الموقع، وأساسيات Java. أكتب غالبًا بـ${hl("TypeScript")} لأنها تغطي الحزمة كاملة بلغة واحدة؛ أما الأساسيات فمن Java.`,
  ],
  principles: [
    "«مستحيل» تعني غالبًا: لم أفهمه بعد.",
    "إذا كان المفهوم مدروسًا، يصبح التنفيذ الجزء الأسهل.",
    "الحلول البسيطة أمتن، وأسهل على الآخرين في الفهم.",
  ],
  work: [
    `${hl("أحب أن أتعمّق في فهم سير العمليات.")} في YourBrand كان ذلك يعني: ماذا يريد المستخدم، وماذا يريد المشرف، وماذا يريد المالك؟ كيف ينبغي أن يبدو الإحساس به، وكيف يصبح بديهيًا، وأي تخطيطات يحتاجها كل جهاز؟ من يحصل على أي صلاحيات، وكيف أتعامل مع الظهور وحماية المستخدمين، وكيف يبدو نظام التذاكر للمشرفين؟ وفوق ذلك: كيف تضيف المتعة، وكيف تجذب المستخدمين وتحتفظ بهم، وكيف تحقق الربح؟`,
    `كان عليّ أن أطرح أكثر من ألف سؤال كهذه وأجيب عنها قبل أن يتشكّل المنتج. ${hl("وهذا بالذات الجزء الذي يجذبني أكثر.")}`,
    `أخطط قبل أن أبني، ثم أنفّذ الأفكار مبكرًا وأختبرها. وإذا تعثّر شيء، فالخطة لم تكن دقيقة بما يكفي — فأعيد هيكلتها وأحاول من جديد، ${hl("حتى يعمل")}. ويجري التنفيذ اليوم غالبًا عبر ${hl("Claude Code")} كوكيل تنفيذ: المفهوم والبنية مني، وCC يكتب الشيفرة.`,
    `الإبداع جزء من ذلك بالنسبة لي. كنت أريد أن أصبح مصمم أزياء وكنت أرسم الغرافيتي؛ واليوم يذهب ذلك إلى الواجهة والتفاعل. العناوين بخط الغرافيتي في هذه الصفحة والعناصر الكثيرة القابلة للّمس ليست صدفة.`,
    `أعمل على المشروع الواحد عادة ${hl("من يومين إلى سبعة أيام")} متواصلة، ثم أنتقل لأجرّب مفهومًا في مجال آخر. وهكذا يكبر صندوق أدواتي باستمرار.`,
  ],
  end: `توازني مع البرمجة والتعلّم هو الطبيعة وعائلتي، وقبل كل شيء ${hl("ابني")}.`,
  cv: [
    {
      heading: "المسيرة",
      items: [
        `${hl("مطوّر مبتدئ")} — معسكر تدريبي متكامل · Talent Hub – IT Ibis Acam، لينتس · أكتوبر 2025 – يونيو 2026`,
        `${hl("ترميم منزل سكني")} (مشروع عائلي) · لينتس-إبلسبرغ · يونيو 2023 – أكتوبر 2025`,
        `${hl("مسؤول أنظمة")} · BBU GmbH، لينتس · يناير 2022 – يونيو 2023`,
        `${hl("خدمة مدنية")} · BBU GmbH، لينتس · مارس 2021 – ديسمبر 2021`,
        `${hl("إقامة في الخارج")} · أوروبا في الغالب · سبتمبر 2019 – فبراير 2021`,
        `${hl("فني أنظمة الحماية من الشمس")} · SUNSTAR، ليوندينغ · يوليو 2017 – أبريل 2019`,
        `${hl("مركّب أرضيات")} · Bodendesign Mittermayer، لينتس · سبتمبر 2012 – مايو 2017`,
      ],
    },
    {
      heading: "التعليم",
      items: [`${hl("المدرسة الإلزامية، المدرسة الثانوية")}`, `${hl("معسكر تدريبي متكامل")} — شهادة مطوّر مبتدئ (2026)`],
    },
    {
      heading: "المهارات",
      items: [
        `${hl("الواجهة الخلفية والبيانات")} — TypeScript, NestJS, PostgreSQL, PostGIS, WebSockets, Stripe, Docker`,
        `${hl("الواجهة الأمامية")} — React, Next.js, Tailwind, Zustand, Canvas 2D`,
        `${hl("الأدوات والأتمتة")} — Node.js, Python, Playwright, Ollama, Git`,
        `${hl("الأساسيات")} — Java, OOP, SQL, هياكل البيانات, رياضيات ثلاثية الأبعاد`,
      ],
    },
    {
      heading: "اللغات",
      items: [`${hl("الألمانية")} — اللغة الأم`, `${hl("الإنجليزية")} — انظر السيرة الذاتية`],
    },
  ],
};

export const ABOUT: AboutContent = pick({ de, en, ru, ja, ar });
