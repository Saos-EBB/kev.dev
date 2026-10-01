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
    `Mit 15 habe ich meinen Fernseher zerlegt, ohne die geringste Ahnung davon zu haben — und wieder zum Laufen gebracht. Das ist ungefähr das Muster geblieben: ${hl("Ich habe noch nie akzeptiert, dass etwas nicht geht.")} Es gibt immer eine Lösung, man muss nur lange genug suchen. Vorher wollte ich übrigens Modedesigner werden und habe Wände bemalt — dass die Überschriften auf dieser Seite in Graffiti-Lettern stehen und sich fast alles anfassen lässt, ist also kein Zufall.`,
    `Beruflich ging es trotzdem anders los. Mit 15 habe ich angefangen zu arbeiten: Böden verlegen, später Sonnenschutz montieren, dazwischen eine Weile Vertrieb. Handwerk, das ich bis heute nicht schlechtrede, aber es sah jeden Tag gleich aus. Nebenher habe ich WoW gespielt und Gold gehandelt; ${hl("die Wirtschaft in dem Spiel zu durchschauen")} hat mir irgendwann mehr Spaß gemacht als das Spiel selbst.`,
    `Mit 26 kam der Zivildienst, in der Geschäftsstelle Linz einer Bundesagentur. Die haben mich danach direkt übernommen — die Stelle, auf der ich dann saß, gab es vorher nicht, sie ist um mich herum entstanden. Ich war dort Administrator und habe alles an IT übernommen, was ohne Admin-Rechte ging. Dabei habe ich etwas gesehen, das ich vorher nicht für möglich gehalten hätte: Leute, die seit zwanzig Jahren im Büro sitzen und Text mit der Maus markieren, um ihn per Rechtsklick zu kopieren. Nicht aus Dummheit — es hat ihnen nur nie jemand gezeigt, und die meisten wollen es auch nicht wissen. ${hl("Ich wollte es wissen.")}`,
    `Über eine Schnupperwoche als Sysadmin bin ich dann zum Programmieren gekommen. Eine Woche, in der ich Aufgaben lösen musste — danach war es vorbei. ${hl("Mein Kopf hat gebrannt")}, ich saß bis in die Nacht mit Stift und Block da und habe mir Lösungen für Aufgaben überlegt, die längst abgegeben waren. Bis ich etwas daraus machen konnte, dauerte es allerdings: Dazwischen lagen anderthalb Jahre, in denen ich das Haus meiner Urgroßeltern in Linz-Ebelsberg renoviert habe, damit es in der Familie bleibt.`,
    `Dann habe ich meine Freundin kennengelernt, und kurz darauf war klar, dass wir einen Sohn bekommen. Das war der Punkt, an dem aus „irgendwann“ ein Datum wurde. Im Oktober 2025 habe ich das Bootcamp angefangen und im Juni 2026 abgeschlossen — acht Monate, acht Stunden am Tag lernen und schreiben. Was ich dort mitgenommen habe, sind weniger die Frameworks als die Denkweise: wie man ein Problem so lange auseinandernimmt, bis es lösbar wird. ${hl("Und das Zutrauen, dass ich genau das kann.")}`,
    `Alles, was unter ${projectsLink("Projekte")} steht, ist seitdem entstanden — in rund zehn Monaten ab meiner ersten Zeile Code. Am meisten reizt mich dabei der ganze Weg: planen, die Datenbank entwerfen, das Backend bauen, das Frontend nachziehen, testen, und so lange verbessern, bis es sich richtig anfühlt. Überwiegend ${hl("TypeScript")}, weil ich damit den gesamten Stack in einer Sprache baue; darunter liegt Java, von dort kommen die Grundlagen. Und weil mich interessiert, wie Dinge funktionieren, steht dort einiges, das ich selbst gebaut habe, statt eine Bibliothek zu nehmen: eine eigene verkettete Liste, eine eigene 3D-Projektion, ein Renderer, der irgendwann CT-Datensätze verdauen konnte. Die Reihenfolge ist meistens dieselbe: etwas nervt mich oder interessiert mich — dann baue ich es.`,
  ],
  principles: [
    "Wenn das Konzept durchdacht ist, ist das Implementieren der entspannte Teil.",
    "Einfache Lösungen brechen weniger leicht — und jeder nach mir versteht sie.",
    "Fertig ist nicht, wenn es läuft — fertig ist, wenn es sich richtig anfühlt.",
  ],
  work: [
    `${hl("Ich denke, bevor ich baue.")} Planung war schon als Bodenleger das A und O — Rapport-Muster für verwinkelte Gänge, die durchlaufen mussten — und als Systemadministrator erst recht: Termine, Ausfallpläne, Behörden, alles unter Zeitdruck.`,
    `Beim Code ist es dieselbe Denkweise, nur neues Werkzeug: Ist das Konzept durchdacht, ist das Implementieren der ${hl("entspannte Teil")}.`,
    `Ich setze Ideen direkt um und teste sie; hakt es, ist das für mich das Signal, dass der Plan noch nicht scharf genug war — dann gehe ich einen Schritt zurück, strukturiere neu und setze wieder an, ${hl("bis es sitzt")}.`,
    `Die Umsetzung läuft heute oft über ${hl("Claude Code")} als Implementierungs-Agent — Konzept und Architektur kommen von mir, CC schreibt den Code. Gleiche Schleife, nur schneller.`,
    `Nebenbei geht's oft weniger ums Bauen als ums Verstehen: Videos schauen, Architektur und Design studieren, sehen, wie andere ihre Sachen lösen. An einem Projekt bleibe ich meist ${hl("zwei bis sieben Tage")}, dann wechsle ich zum nächsten — nicht weil es fertig ist, sondern weil ich eine Idee oder ein Konzept in einem anderen Bereich ausprobieren will.`,
  ],
  end: `Wenn ich nicht am Bildschirm sitze, dreht sich mein Alltag um ${hl("meinen Sohn")} — als Vater will ich möglichst viel Zeit mit ihm haben und trotzdem alles unter einen Hut bekommen: managen, lernen, was bauen.`,
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
    `At 15 I took my TV apart without the faintest idea what I was doing — and got it working again. That has more or less stayed the pattern: ${hl("I have never accepted that something can't be done.")} There's always a solution, you just have to look long enough. Before that, by the way, I wanted to be a fashion designer and painted walls — so it's no coincidence that the headlines on this page are in graffiti lettering and almost everything here can be touched.`,
    `Work started out differently, though. I began working at 15: laying floors, later installing sun protection, with a stretch in sales in between. Craft I still won't talk down, but every day looked the same. On the side I played WoW and traded gold; at some point ${hl("figuring out the game's economy")} was more fun than the game itself.`,
    `At 26 came my civilian service, at the Linz office of a federal agency. They hired me right afterwards — the position I then held didn't exist before; it grew around me. I was the administrator there and took on everything IT that could be done without admin rights. And I saw something I wouldn't have thought possible: people who had sat in an office for twenty years selecting text with the mouse to copy it via right-click. Not out of stupidity — nobody had ever shown them, and most didn't want to know. ${hl("I wanted to know.")}`,
    `A trial week as a sysadmin is how I got into programming. One week of solving tasks — and that was it. ${hl("My head was on fire")}; I sat up into the night with pen and paper, working out solutions to tasks that had long been handed in. It took a while before I could make something of it, though: in between came a year and a half of renovating my great-grandparents' house in Linz-Ebelsberg so it would stay in the family.`,
    `Then I met my girlfriend, and soon it was clear we were having a son. That was the point where "someday" became a date. I started the bootcamp in October 2025 and finished in June 2026 — eight months, eight hours a day of learning and writing code. What I took away is less the frameworks than the way of thinking: taking a problem apart until it becomes solvable. ${hl("And the confidence that I can do exactly that.")}`,
    `Everything under ${projectsLink("Projects")} has been built since then — in about ten months from my first line of code. What draws me most is the whole path: planning, designing the database, building the backend, following up with the frontend, testing, and improving until it feels right. Mostly ${hl("TypeScript")}, because it lets me build the whole stack in one language; underneath sits Java, where the fundamentals come from. And because I want to know how things work, there's a fair bit I built myself instead of reaching for a library: my own linked list, my own 3D projection, a renderer that eventually could digest CT datasets. The order is usually the same: something annoys or interests me — so I build it.`,
  ],
  principles: [
    "Once the concept is thought through, implementing it is the relaxed part.",
    "Simple solutions break less easily — and everyone after me understands them.",
    "Done isn't when it runs — done is when it feels right.",
  ],
  work: [
    `${hl("I think before I build.")} Planning was everything even as a floor layer — repeat patterns for winding corridors that had to run through — and even more so as a sysadmin: deadlines, fallback plans, authorities, all under time pressure.`,
    `With code it's the same mindset, just a new tool: once the concept is thought through, implementing it is the ${hl("relaxed part")}.`,
    `I put ideas into practice right away and test them; if something snags, that's my signal the plan wasn't sharp enough yet — so I take a step back, restructure and go again, ${hl("until it fits")}.`,
    `These days the implementation often runs through ${hl("Claude Code")} as an implementation agent — concept and architecture come from me, CC writes the code. Same loop, just faster.`,
    `On the side it's often less about building than about understanding: watching videos, studying architecture and design, seeing how others solve their things. I usually stay with a project for ${hl("two to seven days")}, then move on to the next — not because it's finished, but because I want to try an idea or concept in another area.`,
  ],
  end: `When I'm not at the screen, my everyday life revolves around ${hl("my son")} — as a father I want as much time with him as possible and still fit everything in: managing, learning, building something.`,
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
    `В 15 лет я разобрал свой телевизор, не имея ни малейшего понятия, что делаю, — и снова заставил его работать. Примерно так всё и осталось: ${hl("я никогда не соглашался с тем, что что-то невозможно.")} Решение есть всегда, нужно только достаточно долго искать. Кстати, до этого я хотел стать модельером и расписывал стены — так что заголовки на этой странице написаны граффити-буквами, а почти всё здесь можно потрогать, не случайно.`,
    `Профессионально всё началось иначе. Работать я начал в 15: укладывал полы, потом монтировал солнцезащитные системы, между этим какое-то время работал в продажах. Ремесло, которое я до сих пор не принижаю, но каждый день был похож на предыдущий. Параллельно я играл в WoW и торговал золотом; в какой-то момент ${hl("разбираться в экономике игры")} стало интереснее, чем сама игра.`,
    `В 26 лет я проходил альтернативную гражданскую службу в линцском отделении федерального агентства. Сразу после этого меня взяли на работу — должности, которую я занял, раньше не было, она сложилась вокруг меня. Я был там администратором и взял на себя всё в IT, что можно было делать без прав администратора. И увидел то, во что раньше не поверил бы: люди, которые двадцать лет сидят в офисе, выделяют текст мышью, чтобы скопировать его через правый клик. Не от глупости — просто никто им не показал, а большинство и не хочет знать. ${hl("А я хотел знать.")}`,
    `К программированию я пришёл через пробную неделю сисадмином. Неделя, в которую нужно было решать задачи, — и всё, я пропал. ${hl("Голова горела")}: я до ночи сидел с ручкой и блокнотом и придумывал решения задач, которые давно были сданы. Но прошло время, прежде чем я смог что-то из этого сделать: между этим были полтора года, когда я ремонтировал дом своих прадедушки и прабабушки в Линц-Эбельсберге, чтобы он остался в семье.`,
    `Потом я познакомился со своей девушкой, и вскоре стало ясно, что у нас будет сын. В этот момент «когда-нибудь» превратилось в дату. В октябре 2025 года я начал буткемп и в июне 2026 закончил — восемь месяцев, по восемь часов в день учёбы и кода. Вынес я оттуда не столько фреймворки, сколько образ мышления: разбирать проблему, пока она не станет решаемой. ${hl("И уверенность, что я умею именно это.")}`,
    `Всё, что есть в разделе ${projectsLink("Проекты")}, появилось с тех пор — примерно за десять месяцев с моей первой строчки кода. Больше всего меня привлекает весь путь: спланировать, спроектировать базу данных, построить бэкенд, подтянуть фронтенд, протестировать и улучшать, пока не станет правильно. В основном ${hl("TypeScript")}, потому что на нём я строю весь стек на одном языке; под ним — Java, оттуда основы. И поскольку мне интересно, как всё устроено, там немало того, что я сделал сам, вместо того чтобы взять библиотеку: свой связный список, своя 3D-проекция, рендерер, который в итоге смог переварить данные КТ. Порядок обычно один и тот же: что-то раздражает или интересует — и я это строю.`,
  ],
  principles: [
    "Когда концепция продумана, реализация — это спокойная часть.",
    "Простые решения ломаются реже — и их понимает каждый после меня.",
    "Готово не тогда, когда работает, а когда ощущается правильно.",
  ],
  work: [
    `${hl("Я думаю, прежде чем строить.")} Планирование было главным уже при укладке полов — раппорт для извилистых коридоров, который должен был идти без разрывов, — а у сисадмина тем более: сроки, планы на случай сбоев, ведомства, всё в условиях нехватки времени.`,
    `С кодом то же мышление, только новый инструмент: если концепция продумана, реализация — это ${hl("спокойная часть")}.`,
    `Я сразу воплощаю идеи и тестирую их; если что-то застревает, для меня это сигнал, что план был недостаточно чётким, — тогда я делаю шаг назад, перестраиваю и пробую снова, ${hl("пока не сядет")}.`,
    `Сегодня реализация часто идёт через ${hl("Claude Code")} как агента-исполнителя — концепция и архитектура мои, CC пишет код. Тот же цикл, только быстрее.`,
    `Помимо этого часто важнее не строить, а понимать: смотреть видео, изучать архитектуру и дизайн, видеть, как другие решают свои задачи. Над одним проектом я обычно сижу ${hl("от двух до семи дней")}, потом перехожу к следующему — не потому что он готов, а потому что хочу попробовать идею или концепцию в другой области.`,
  ],
  end: `Когда я не за экраном, моя жизнь вращается вокруг ${hl("сына")} — как отец я хочу проводить с ним как можно больше времени и при этом всё успевать: организовывать, учиться, что-то строить.`,
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
    `15歳のとき、何の知識もないままテレビを分解し、また動くようにしました。それ以来、だいたい同じパターンです。${hl("「できない」を受け入れたことは一度もありません。")}解決策は必ずある、探し続ければいい。ちなみにその前はファッションデザイナーになりたくて、壁に絵を描いていました。このページの見出しがグラフィティ風の文字で、ほとんどすべてに触れられるのは偶然ではありません。`,
    `それでも仕事は別の形で始まりました。15歳で働き始め、床を張り、のちに日よけを取り付け、その間に営業も少し。今でも見下すつもりのない手仕事ですが、毎日が同じに見えました。その傍らでWoWをプレイしてゴールドを取引し、いつの間にか${hl("ゲーム内の経済を読み解くこと")}のほうがゲームそのものより楽しくなっていました。`,
    `26歳で、ある連邦機関のリンツ事務所で兵役代替の社会奉仕をしました。その後すぐに採用され、私が就いたポストはそれまで存在せず、私に合わせて生まれたものでした。そこで管理者として、管理者権限なしでできるIT業務をすべて引き受けました。そして想像もしなかった光景を目にしました。20年オフィスにいる人が、マウスで文字を選択して右クリックでコピーしている。愚かだからではなく、誰も教えなかったし、多くの人は知りたいとも思っていない。${hl("でも私は知りたかった。")}`,
    `システム管理者の体験週間をきっかけに、プログラミングにたどり着きました。課題を解く一週間で、すっかりはまりました。${hl("頭が燃えていました。")}夜中までペンとノートを手に、とっくに提出済みの課題の解き方を考えていました。ただ、それを形にできるまでには時間がかかりました。その間の一年半、曾祖父母の家を家族に残すため、リンツ＝エーベルスベルクで改修していたのです。`,
    `その後、彼女と出会い、まもなく息子が生まれることがわかりました。そこで「いつか」が日付になりました。2025年10月にブートキャンプを始め、2026年6月に修了。8か月間、毎日8時間学び、書きました。そこで得たのはフレームワークよりも考え方です。解けるようになるまで問題を分解すること。${hl("そして、自分にはそれができるという自信。")}`,
    `${projectsLink("プロジェクト")}にあるものはすべて、それ以来、最初の一行から約10か月で作りました。いちばん惹かれるのは全体の道のりです。計画し、データベースを設計し、バックエンドを作り、フロントエンドを追い、テストし、しっくりくるまで改善する。主に${hl("TypeScript")}で、1つの言語でスタック全体を作れるからです。その下にはJava、基礎はそこから来ています。仕組みを知りたいので、ライブラリに頼らず自作したものも多くあります。自作の連結リスト、自作の3D投影、そしていずれCTデータまで扱えるようになったレンダラー。順番はだいたい同じです。何かが気になる、あるいは興味を引く。だから作るのです。`,
  ],
  principles: [
    "コンセプトが練られていれば、実装は気楽な部分だ。",
    "シンプルな解決策は壊れにくい。そして後に続く誰もが理解できる。",
    "完成とは動いたときではなく、しっくりきたときだ。",
  ],
  work: [
    `${hl("作る前に考えます。")}床職人の頃から計画がすべてでした。入り組んだ廊下でも途切れずに続くリピート柄。システム管理者ではなおさらで、期限、障害対策、官公庁、すべて時間に追われていました。`,
    `コードでも考え方は同じで、道具が変わっただけです。コンセプトが練られていれば、実装は${hl("気楽な部分")}です。`,
    `アイデアはすぐ形にしてテストします。つまずいたら、計画がまだ甘かったというサイン。一歩下がって組み立て直し、${hl("しっくりくるまで")}やり直します。`,
    `今は実装の多くを、実装エージェントとしての${hl("Claude Code")}に任せています。コンセプトと設計は私、コードはCCが書く。同じループで、ただ速いだけです。`,
    `その傍らで、作ることより理解することが中心になることも多いです。動画を見て、アーキテクチャやデザインを学び、他の人がどう解決しているかを見る。1つのプロジェクトには普通${hl("2〜7日")}取り組み、それから次へ移ります。完成したからではなく、別の分野でアイデアやコンセプトを試したいからです。`,
  ],
  end: `画面の前にいないとき、私の毎日は${hl("息子")}を中心に回っています。父親として、できるだけ一緒に過ごしながら、管理し、学び、何かを作ることも両立させたいと思っています。`,
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
    `في الخامسة عشرة فككت جهاز التلفاز دون أدنى فكرة عمّا أفعل — ثم أعدته للعمل. وبقي هذا هو النمط تقريبًا: ${hl("لم أقبل يومًا بأن شيئًا ما مستحيل.")} هناك دائمًا حل، يكفي أن تبحث طويلًا بما يكفي. وبالمناسبة، قبل ذلك أردت أن أصبح مصمم أزياء وكنت أرسم على الجدران — لذلك ليس من قبيل الصدفة أن العناوين في هذه الصفحة مكتوبة بحروف الغرافيتي وأن كل شيء تقريبًا هنا يمكن لمسه.`,
    `ومع ذلك بدأ العمل بشكل مختلف. بدأت العمل في الخامسة عشرة: تركيب الأرضيات، ثم تركيب أنظمة الحماية من الشمس، وبينهما فترة في المبيعات. حِرفة لا أقلّل من شأنها حتى اليوم، لكن كل يوم كان يشبه الآخر. وإلى جانب ذلك كنت ألعب WoW وأتاجر بالذهب؛ وفي وقت ما صار ${hl("فهم اقتصاد اللعبة")} ممتعًا أكثر من اللعبة نفسها.`,
    `في السادسة والعشرين أدّيت الخدمة المدنية في مكتب لينتس التابع لوكالة اتحادية. وظّفوني مباشرة بعدها — المنصب الذي شغلته لم يكن موجودًا من قبل، بل نشأ حولي. كنت المسؤول عن الأنظمة هناك وتولّيت كل ما يتعلق بتقنية المعلومات مما يمكن فعله دون صلاحيات المسؤول. ورأيت شيئًا لم أكن أظنه ممكنًا: أشخاص يجلسون في المكتب منذ عشرين عامًا ويحدّدون النص بالفأرة لنسخه بالنقر الأيمن. ليس عن غباء — لم يُريهم أحد ذلك قط، ومعظمهم لا يريد أن يعرف. ${hl("أما أنا فأردت أن أعرف.")}`,
    `ثم وصلت إلى البرمجة عبر أسبوع تجريبي كمسؤول أنظمة. أسبوع كان عليّ فيه حل مهام — وانتهى الأمر. ${hl("كان رأسي مشتعلًا")}، جلست حتى الليل بالقلم والدفتر أفكر في حلول لمهام سُلّمت منذ زمن. لكن الأمر استغرق وقتًا قبل أن أصنع منه شيئًا: فبينهما عام ونصف رمّمت فيه بيت أجداد أجدادي في لينتس-إبلسبرغ كي يبقى في العائلة.`,
    `ثم تعرّفت على صديقتي، وبعد فترة قصيرة صار واضحًا أننا سنُرزق بابن. كانت تلك اللحظة التي تحوّل فيها «يومًا ما» إلى تاريخ. بدأت المعسكر التدريبي في أكتوبر 2025 وأنهيته في يونيو 2026 — ثمانية أشهر، ثماني ساعات يوميًا من التعلّم والكتابة. ما خرجت به أقل من الأطر البرمجية وأكثر طريقة تفكير: تفكيك المشكلة حتى تصبح قابلة للحل. ${hl("والثقة بأنني أستطيع ذلك تحديدًا.")}`,
    `كل ما تجده تحت ${projectsLink("المشاريع")} نشأ منذ ذلك الحين — في نحو عشرة أشهر منذ أول سطر كود كتبته. أكثر ما يجذبني هو الطريق كاملًا: التخطيط، تصميم قاعدة البيانات، بناء الواجهة الخلفية، اللحاق بالواجهة الأمامية، الاختبار، والتحسين حتى يبدو صحيحًا. في الغالب ${hl("TypeScript")}، لأنني أبني بها المكدّس كله بلغة واحدة؛ وتحتها Java، ومنها تأتي الأساسيات. ولأنني أريد أن أفهم كيف تعمل الأشياء، ستجد هناك الكثير مما بنيته بنفسي بدل استخدام مكتبة: قائمة مترابطة خاصة بي، إسقاط ثلاثي الأبعاد خاص بي، ومُصيِّر صار في النهاية قادرًا على معالجة بيانات الأشعة المقطعية. والترتيب غالبًا هو نفسه: شيء يزعجني أو يثير اهتمامي — فأبنيه.`,
  ],
  principles: [
    "حين يكون المفهوم مدروسًا، يصبح التنفيذ هو الجزء المريح.",
    "الحلول البسيطة أقل عرضة للكسر — ويفهمها كل من يأتي بعدي.",
    "الانتهاء ليس حين يعمل الشيء — بل حين يبدو صحيحًا.",
  ],
  work: [
    `${hl("أفكر قبل أن أبني.")} كان التخطيط أساس كل شيء منذ عملي في تركيب الأرضيات — أنماط متكررة لممرات متعرجة كان يجب أن تستمر دون انقطاع — وأكثر من ذلك كمسؤول أنظمة: مواعيد، خطط للطوارئ، جهات رسمية، وكل ذلك تحت ضغط الوقت.`,
    `مع الكود هي نفس طريقة التفكير، فقط بأداة جديدة: حين يكون المفهوم مدروسًا، يصبح التنفيذ هو ${hl("الجزء المريح")}.`,
    `أنفّذ الأفكار مباشرة وأختبرها؛ وإن تعثّر شيء، فهذه إشارتي إلى أن الخطة لم تكن دقيقة بما يكفي — فأتراجع خطوة، وأعيد الهيكلة، وأبدأ من جديد ${hl("حتى يستقر")}.`,
    `اليوم يتم التنفيذ غالبًا عبر ${hl("Claude Code")} كوكيل تنفيذ — المفهوم والبنية مني، وCC يكتب الكود. نفس الحلقة، فقط أسرع.`,
    `وإلى جانب ذلك، يتعلّق الأمر غالبًا بالفهم أكثر من البناء: مشاهدة الفيديوهات، دراسة البنية والتصميم، ورؤية كيف يحلّ الآخرون مشكلاتهم. أبقى مع المشروع عادةً ${hl("من يومين إلى سبعة أيام")}، ثم أنتقل إلى التالي — ليس لأنه انتهى، بل لأنني أريد تجربة فكرة أو مفهوم في مجال آخر.`,
  ],
  end: `حين لا أكون أمام الشاشة، تدور حياتي اليومية حول ${hl("ابني")} — كأب أريد أن أقضي معه أكبر قدر ممكن من الوقت، وأن أوفّق في الوقت نفسه بين كل شيء: التنظيم والتعلّم وبناء شيء ما.`,
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
