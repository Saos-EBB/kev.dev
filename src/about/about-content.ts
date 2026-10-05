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
    `Mit 15 habe ich ohne Vorkenntnisse meinen Fernseher zerlegt und wieder zum Laufen gebracht. Die Herangehensweise ist geblieben: ${hl("Wenn etwas nicht funktioniert, suche ich, bis ich die Ursache finde.")} Davor wollte ich Modedesigner werden und habe Graffiti gemalt — daher die Graffiti-Überschriften auf dieser Seite und die vielen Elemente, die man anfassen kann.`,
    `Beruflich habe ich mit 15 im Handwerk angefangen: Böden verlegen, später Sonnenschutz montieren, zwischendurch Vertrieb. Solide Arbeit, aber wenig Abwechslung. In der Freizeit habe ich WoW gespielt und Gold gehandelt; ${hl("die Wirtschaft im Spiel zu analysieren")} war irgendwann interessanter als das Spiel selbst.`,
    `Mit 26 habe ich Zivildienst in der Linzer Geschäftsstelle einer Bundesagentur gemacht und wurde danach übernommen — auf eine Stelle, die es vorher nicht gab. Als Administrator habe ich dort die IT-Aufgaben erledigt, die ohne Admin-Rechte möglich waren. Dabei ist mir aufgefallen, wie viele Leute seit Jahren am Computer arbeiten, ohne die Grundlagen zu kennen, meist weil es ihnen nie jemand gezeigt hat. ${hl("Mich hat interessiert, wie die Systeme dahinter funktionieren.")}`,
    `Zum Programmieren bin ich über eine Schnupperwoche als Sysadmin gekommen. Die Aufgaben dort haben mich nicht mehr losgelassen: ${hl("Ich habe abends noch an Lösungen gearbeitet")}, als längst abgegeben war. Bevor ich daran anknüpfen konnte, kamen anderthalb Jahre Renovierung am Haus meiner Urgroßeltern in Linz-Ebelsberg.`,
    `Als klar war, dass mein Sohn unterwegs ist, habe ich den Wechsel fix eingeplant. Von Oktober 2025 bis Juni 2026 habe ich ein Full-Stack-Bootcamp gemacht, acht Monate Vollzeit. Wichtiger als die einzelnen Frameworks war die Methode: ${hl("ein Problem so lange zerlegen, bis es lösbar ist.")}`,
    `Alles unter ${projectsLink("Projekte")} ist in den rund zehn Monaten seit meiner ersten Zeile Code entstanden. Mich interessiert der ganze Ablauf: Planung, Datenbankmodell, Backend, Frontend, Tests, Überarbeitung. Ich arbeite überwiegend mit ${hl("TypeScript")}, weil ich damit den gesamten Stack in einer Sprache abdecke; die Grundlagen kommen aus Java. Einiges habe ich bewusst selbst gebaut statt eine Bibliothek zu nehmen, um zu verstehen, wie es funktioniert: eine verkettete Liste, eine 3D-Projektion, einen Renderer, der CT-Datensätze darstellen kann. Meist beginnt ein Projekt damit, dass mich etwas stört oder interessiert.`,
  ],
  principles: [
    "Ist das Konzept durchdacht, ist die Implementierung der einfachere Teil.",
    "Einfache Lösungen sind robuster und für andere leichter nachvollziehbar.",
    "Fertig ist es nicht, wenn es läuft, sondern wenn es sauber gelöst ist.",
  ],
  work: [
    `${hl("Ich plane, bevor ich baue.")} Das war schon als Bodenleger nötig — Rapportmuster, die durch verwinkelte Gänge durchlaufen mussten — und als Systemadministrator erst recht: Termine, Ausfallpläne, Abstimmung mit Behörden, alles unter Zeitdruck.`,
    `Beim Programmieren gilt dasselbe: Ist das Konzept durchdacht, ist die Implementierung der ${hl("einfachere Teil")}.`,
    `Ich setze Ideen früh um und teste sie. Hakt es, war der Plan noch nicht genau genug — dann strukturiere ich neu und setze wieder an, ${hl("bis es funktioniert")}.`,
    `Für die Umsetzung nutze ich heute oft ${hl("Claude Code")} als Implementierungs-Agent: Konzept und Architektur kommen von mir, CC schreibt den Code. Derselbe Ablauf, nur schneller.`,
    `Ein Teil der Zeit geht ins Lernen statt ins Bauen: Architektur und Design studieren, schauen, wie andere Probleme lösen. An einem Projekt arbeite ich meist ${hl("zwei bis sieben Tage")} am Stück und wechsle dann, um ein Konzept in einem anderen Bereich auszuprobieren.`,
  ],
  end: `Abseits vom Bildschirm verbringe ich möglichst viel Zeit mit ${hl("meinem Sohn")} und organisiere den Alltag so, dass daneben Lernen und Bauen Platz haben.`,
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
    `At 15 I took my TV apart with no prior knowledge and got it working again. The approach has stuck: ${hl("When something doesn't work, I dig until I find the cause.")} Before that I wanted to be a fashion designer and painted graffiti — hence the graffiti headlines on this page and the many elements you can touch.`,
    `Professionally I started out in a trade at 15: laying floors, later installing sun protection, with some time in sales in between. Solid work, but not much variety. In my spare time I played WoW and traded gold; at some point ${hl("analysing the in-game economy")} became more interesting than the game itself.`,
    `At 26 I did my civilian service at the Linz office of a federal agency and was hired afterwards — into a position that hadn't existed before. As administrator I handled the IT tasks that were possible without admin rights. I noticed how many people had worked at a computer for years without knowing the basics, mostly because nobody had ever shown them. ${hl("I wanted to understand how the systems behind it work.")}`,
    `I got into programming through a trial week as a sysadmin. The tasks there stayed with me: ${hl("I kept working on solutions in the evenings")}, long after they had been handed in. Before I could pick that up, there were a year and a half of renovating my great-grandparents' house in Linz-Ebelsberg.`,
    `Once it was clear my son was on the way, I scheduled the switch for real. From October 2025 to June 2026 I did a full-stack bootcamp, eight months full time. More important than the individual frameworks was the method: ${hl("breaking a problem down until it becomes solvable.")}`,
    `Everything under ${projectsLink("Projects")} was built in the roughly ten months since my first line of code. I'm interested in the whole process: planning, data model, backend, frontend, tests, revision. I work mostly in ${hl("TypeScript")}, because it covers the whole stack in one language; the fundamentals come from Java. Some things I deliberately built myself instead of using a library, to understand how they work: a linked list, a 3D projection, a renderer that can display CT datasets. A project usually starts with something that bothers or interests me.`,
  ],
  principles: [
    "Once the concept is thought through, implementation is the easier part.",
    "Simple solutions are more robust and easier for others to follow.",
    "It isn't done when it runs, but when it's solved cleanly.",
  ],
  work: [
    `${hl("I plan before I build.")} That was necessary even as a floor layer — repeat patterns that had to run through winding corridors — and even more so as a sysadmin: deadlines, fallback plans, coordination with authorities, all under time pressure.`,
    `Programming works the same way: once the concept is thought through, implementation is the ${hl("easier part")}.`,
    `I put ideas into practice early and test them. If something snags, the plan wasn't precise enough — so I restructure and go again, ${hl("until it works")}.`,
    `These days I often use ${hl("Claude Code")} as an implementation agent: concept and architecture come from me, CC writes the code. Same process, just faster.`,
    `Part of my time goes into learning rather than building: studying architecture and design, looking at how others solve problems. I usually work on a project for ${hl("two to seven days")} straight, then switch to try a concept in another area.`,
  ],
  end: `Away from the screen I spend as much time as possible with ${hl("my son")} and organise my days so there's still room for learning and building.`,
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
    `В 15 лет я без всякой подготовки разобрал свой телевизор и снова заставил его работать. Подход остался прежним: ${hl("если что-то не работает, я ищу, пока не найду причину.")} До этого я хотел стать модельером и рисовал граффити — отсюда граффити-заголовки на этой странице и множество элементов, которые можно потрогать.`,
    `Профессионально я начал в 15 лет с ремесла: укладывал полы, позже монтировал солнцезащиту, между делом работал в продажах. Надёжная работа, но мало разнообразия. В свободное время я играл в WoW и торговал золотом; в какой-то момент ${hl("анализировать игровую экономику")} стало интереснее самой игры.`,
    `В 26 лет я проходил альтернативную гражданскую службу в линцском отделении федерального агентства, и после неё меня взяли на работу — на должность, которой раньше не было. Как администратор я выполнял ИТ-задачи, возможные без прав администратора. Я заметил, как много людей годами работают за компьютером, не зная основ, — чаще всего потому, что им никто не показал. ${hl("Мне было интересно, как устроены системы за этим.")}`,
    `К программированию я пришёл через пробную неделю в роли сисадмина. Задачи оттуда меня не отпускали: ${hl("я продолжал работать над решениями по вечерам")}, когда всё давно было сдано. Прежде чем я смог к этому вернуться, полтора года ушли на ремонт дома моих прадедушки и прабабушки в Линц-Эбельсберге.`,
    `Когда стало ясно, что у нас будет сын, я твёрдо запланировал переход. С октября 2025 по июнь 2026 года я прошёл full-stack-буткемп, восемь месяцев на полный день. Важнее отдельных фреймворков был метод: ${hl("разбирать проблему, пока она не станет решаемой.")}`,
    `Всё в разделе ${projectsLink("Проекты")} создано примерно за десять месяцев с моей первой строки кода. Меня интересует весь процесс: планирование, модель данных, бэкенд, фронтенд, тесты, доработка. Я работаю в основном на ${hl("TypeScript")}, потому что он покрывает весь стек одним языком; основы — из Java. Кое-что я намеренно написал сам вместо готовой библиотеки, чтобы понять, как это работает: связный список, 3D-проекцию, рендерер, который умеет отображать КТ-данные. Обычно проект начинается с того, что меня что-то раздражает или интересует.`,
  ],
  principles: [
    "Если концепция продумана, реализация — более простая часть.",
    "Простые решения надёжнее, и другим в них легче разобраться.",
    "Готово не тогда, когда работает, а когда решено чисто.",
  ],
  work: [
    `${hl("Я планирую, прежде чем строить.")} Это было нужно уже при укладке полов — раппорт, который должен был проходить через извилистые коридоры, — а сисадмину тем более: сроки, планы на случай сбоев, согласование с ведомствами, всё в условиях нехватки времени.`,
    `В программировании то же самое: если концепция продумана, реализация — ${hl("более простая часть")}.`,
    `Я рано воплощаю идеи и тестирую их. Если что-то не идёт, значит план был недостаточно точным — тогда я перестраиваю его и пробую снова, ${hl("пока не заработает")}.`,
    `Сегодня для реализации я часто использую ${hl("Claude Code")} как агента: концепция и архитектура — мои, CC пишет код. Тот же процесс, только быстрее.`,
    `Часть времени уходит не на создание, а на обучение: изучать архитектуру и дизайн, смотреть, как другие решают задачи. Над одним проектом я обычно работаю ${hl("от двух до семи дней")} подряд, а затем переключаюсь, чтобы опробовать концепцию в другой области.`,
  ],
  end: `Вне экрана я провожу как можно больше времени с ${hl("сыном")} и организую день так, чтобы рядом оставалось место для учёбы и разработки.`,
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
    `15歳のとき、予備知識なしでテレビを分解し、再び動くようにしました。そのやり方は今も変わりません。${hl("うまくいかないことがあれば、原因が見つかるまで調べます。")}その前はファッションデザイナーを目指し、グラフィティを描いていました。このページの見出しがグラフィティ文字で、触れられる要素が多いのはそのためです。`,
    `仕事は15歳で職人として始めました。床張り、のちに日よけの取り付け、その間に営業も少し。堅実な仕事でしたが、変化はあまりありませんでした。余暇にはWoWをプレイしてゴールドを取引しており、いつしか${hl("ゲーム内経済の分析")}のほうがゲームそのものより面白くなっていました。`,
    `26歳のとき、ある連邦機関のリンツ事務所で兵役代替の民間奉仕をし、その後、以前は存在しなかったポジションで採用されました。管理者として、管理者権限なしでできるIT業務を担当しました。何年もパソコンで仕事をしているのに基本を知らない人が多いことに気づきました。たいていは誰も教えてこなかったからです。${hl("その裏でシステムがどう動いているのかに興味を持ちました。")}`,
    `プログラミングを始めたきっかけは、システム管理者としての体験週間でした。そこでの課題が頭から離れず、${hl("提出が終わった後も夜に解法を考え続けていました")}。ただ、それを続ける前に、リンツ＝エーベルスベルクにある曽祖父母の家の改修に1年半を費やしました。`,
    `息子が生まれることが分かったとき、転職を具体的に計画しました。2025年10月から2026年6月まで、フルタイムで8か月間のフルスタック・ブートキャンプを受講しました。個々のフレームワークより大事だったのは方法です。${hl("解けるようになるまで問題を分解すること。")}`,
    `${projectsLink("プロジェクト")}にあるものはすべて、最初の1行を書いてから約10か月の間に作ったものです。関心があるのはプロセス全体です。計画、データモデル、バックエンド、フロントエンド、テスト、改善。主に${hl("TypeScript")}を使っています。1つの言語でスタック全体をカバーできるからです。基礎はJavaから来ています。仕組みを理解するために、ライブラリを使わず意図的に自作したものもあります。連結リスト、3D投影、CTデータを表示できるレンダラーなどです。プロジェクトはたいてい、何かが気になったり興味を持ったりすることから始まります。`,
  ],
  principles: [
    "コンセプトが練られていれば、実装は簡単な部分になる。",
    "シンプルな解決策は壊れにくく、他の人にも理解しやすい。",
    "動いたら完成ではない。きれいに解決できたら完成だ。",
  ],
  work: [
    `${hl("作る前に計画します。")}床張り職人のときから必要でした。入り組んだ廊下を通してつながるリピート柄など。システム管理者ではなおさらで、期限、障害時の計画、官公庁との調整を、すべて時間に追われながら行っていました。`,
    `プログラミングも同じです。コンセプトが練られていれば、実装は${hl("簡単な部分")}になります。`,
    `アイデアは早めに形にしてテストします。行き詰まったら計画の精度が足りなかったということなので、構成を見直してもう一度取り組みます。${hl("動くまで")}。`,
    `現在、実装には${hl("Claude Code")}を実装エージェントとしてよく使います。コンセプトとアーキテクチャは私が考え、CCがコードを書きます。同じプロセスを、より速く。`,
    `時間の一部は、作ることより学ぶことに使っています。アーキテクチャやデザインを研究し、他の人の解決方法を見ること。1つのプロジェクトには通常${hl("2〜7日")}続けて取り組み、その後、別の分野でコンセプトを試すために切り替えます。`,
  ],
  end: `画面から離れているときは、できるだけ${hl("息子")}と過ごし、学ぶことと作ることの時間も確保できるよう日々を組み立てています。`,
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
    `في سن الخامسة عشرة فككت جهاز التلفاز دون أي معرفة مسبقة وأعدته إلى العمل. وبقي الأسلوب نفسه: ${hl("عندما لا يعمل شيء ما، أبحث حتى أجد السبب.")} قبل ذلك أردت أن أصبح مصمم أزياء وكنت أرسم الغرافيتي — ولهذا جاءت العناوين في هذه الصفحة بخط الغرافيتي، وكثير من العناصر قابلة للّمس.`,
    `بدأت العمل المهني في الخامسة عشرة في الحِرف: تركيب الأرضيات، ثم تركيب أنظمة الحماية من الشمس، وفترة في المبيعات بينهما. عمل متين، لكن بقليل من التنوّع. في وقت الفراغ كنت ألعب WoW وأتاجر بالذهب؛ ومع الوقت أصبح ${hl("تحليل اقتصاد اللعبة")} أكثر إثارة من اللعبة نفسها.`,
    `في السادسة والعشرين أدّيت الخدمة المدنية في مكتب لينتس التابع لوكالة اتحادية، ثم عُيّنت بعدها في وظيفة لم تكن موجودة من قبل. بصفتي مسؤول أنظمة، توليت مهام تقنية المعلومات الممكنة دون صلاحيات المسؤول. ولاحظت كم من الناس يعملون على الحاسوب منذ سنوات دون معرفة الأساسيات، غالبًا لأن أحدًا لم يُرِهم ذلك. ${hl("أردت أن أفهم كيف تعمل الأنظمة من الداخل.")}`,
    `دخلت عالم البرمجة عبر أسبوع تجريبي كمسؤول أنظمة. لم تفارقني المهام هناك: ${hl("واصلت العمل على الحلول في المساء")}، بعد تسليمها بوقت طويل. وقبل أن أتمكن من متابعة ذلك، قضيت عامًا ونصفًا في ترميم بيت أجدادي الأكبر في لينتس-إيبلسبرغ.`,
    `عندما اتضح أن ابني في الطريق، خططت للتحوّل بشكل فعلي. من أكتوبر 2025 حتى يونيو 2026 أتممت معسكرًا تدريبيًا في تطوير Full-Stack، ثمانية أشهر بدوام كامل. والأهم من أُطر العمل بعينها كان المنهج: ${hl("تفكيك المشكلة حتى تصبح قابلة للحل.")}`,
    `كل ما في ${projectsLink("المشاريع")} أُنجز خلال نحو عشرة أشهر منذ أول سطر برمجي كتبته. يهمّني المسار كله: التخطيط، ونموذج البيانات، والواجهة الخلفية، والواجهة الأمامية، والاختبار، والتحسين. أعمل غالبًا بـ${hl("TypeScript")} لأنها تغطي الحزمة كاملة بلغة واحدة؛ أما الأساسيات فمن Java. وبعض الأشياء بنيتها بنفسي عمدًا بدل استخدام مكتبة، لأفهم كيف تعمل: قائمة مترابطة، وإسقاط ثلاثي الأبعاد، ومُصيّر يستطيع عرض بيانات التصوير المقطعي. وغالبًا يبدأ المشروع بشيء يزعجني أو يثير اهتمامي.`,
  ],
  principles: [
    "إذا كان المفهوم مدروسًا، يصبح التنفيذ الجزء الأسهل.",
    "الحلول البسيطة أمتن، وأسهل على الآخرين في الفهم.",
    "لا يكتمل العمل حين يشتغل، بل حين يُحَلّ بشكل نظيف.",
  ],
  work: [
    `${hl("أخطط قبل أن أبني.")} كان ذلك ضروريًا منذ عملي في تركيب الأرضيات — أنماط متكررة يجب أن تمتد عبر ممرات متعرجة — وأكثر من ذلك كمسؤول أنظمة: مواعيد، وخطط طوارئ، وتنسيق مع الجهات الرسمية، وكل ذلك تحت ضغط الوقت.`,
    `البرمجة تسير بالطريقة نفسها: إذا كان المفهوم مدروسًا، يصبح التنفيذ ${hl("الجزء الأسهل")}.`,
    `أنفّذ الأفكار مبكرًا وأختبرها. وإذا تعثّر شيء، فالخطة لم تكن دقيقة بما يكفي — فأعيد هيكلتها وأحاول من جديد، ${hl("حتى يعمل")}.`,
    `أستخدم اليوم غالبًا ${hl("Claude Code")} كوكيل تنفيذ: المفهوم والبنية مني، وCC يكتب الشيفرة. العملية نفسها، لكن أسرع.`,
    `جزء من وقتي يذهب إلى التعلّم بدل البناء: دراسة البنية والتصميم، ومتابعة كيف يحلّ الآخرون المشكلات. أعمل على المشروع الواحد عادة ${hl("من يومين إلى سبعة أيام")} متواصلة، ثم أنتقل لأجرّب مفهومًا في مجال آخر.`,
  ],
  end: `بعيدًا عن الشاشة أقضي أكبر وقت ممكن مع ${hl("ابني")}، وأنظّم يومي بحيث يبقى مكان للتعلّم والبناء.`,
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
