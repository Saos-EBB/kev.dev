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
  facts: ["Raum Linz · remote im DACH-Raum", "sofort verfügbar", "TypeScript-Fullstack · Bootcamp + viel Eigenregie"],
  story: [
    `Bevor ich Software gebaut habe, habe ich mit den Händen gebaut: fast sieben Jahre als Bodenleger und Sonnenschutztechniker, danach zwei Jahre Sanierung unseres Wohnhauses. Da lernt man schnell: ${hl("Ein Boden ist nur so gut wie sein Untergrund.")} Wer dort schlampt, sieht es später an jeder Fuge. Beim Programmieren ist es genauso, nur geht hier der Werkstoff nie aus.`,
    `Neue Dinge nehme ich zuerst auseinander. Bevor ich ein Spiel richtig spiele, kenne ich seine Mechaniken, egal ob WeakAuras in WoW oder Jungle-Routen in League of Legends. Mit Code mache ich dasselbe: Ich will keine Sprache als Blackbox benutzen, ich will sie verstehen.`,
    `Mein größtes Projekt ist YourBrand. Davor kamen ein Passwort-Cracker, eine Tamagotchi-App und ein Unity-Spiel, das ich nach zwei Wochen verworfen habe. Am Anfang stand ein „Das schaffst du nicht“ — und ich hatte den Mund ziemlich voll genommen. Zwei Monate später habe ich im Bootcamp den ersten Prototyp vorgestellt, ehrlich gesagt mit zu viel Umfang für die Zeit. Seitdem baue ich weiter: Inzwischen stecken rund 700 bis 800 Stunden drin, die APIs habe ich mit Postman gebaut und getestet, und im Lasttest hält das Backend ${hl("stabil 800 Requests pro Sekunde")}. Und das auf meinem Laptop, einem Ryzen 7 mit 8 Kernen und 32 GB, auf dem Lastgenerator, Datenbank und alle Instanzen gleichzeitig laufen. Auf einem echten Server dürfte deutlich mehr drin sein; gemessen habe ich das noch nicht. Das Ziel sind 1000.`,
    `Alles andere unter ${projectsLink("Projekte")} entsteht aus einem von zwei Gründen: Entweder brauche ich es selbst, oder ich will dabei etwas lernen. Überwiegend schreibe ich TypeScript, weil ich damit den ganzen Stack in einer Sprache abdecke.`,
  ],
  principles: [
    "„Geht nicht“ heißt meistens: noch nicht verstanden.",
    "Ist das Konzept durchdacht, ist die Implementierung der einfachere Teil.",
    "Wer nach mir kommt, soll meinen Code ohne mich verstehen.",
  ],
  work: [
    `Ich denke mich gern in Abläufe hinein. Bei YourBrand hieß das: Was will ein User, was ein Admin, was ein Owner? Wer bekommt welche Rechte, und wie schützt man Nutzer? Wie wird es auf jedem Gerät intuitiv? Und wie gewinnt und hält man Nutzer, wie verdient man Geld? Über tausend solcher Fragen standen am Anfang, bevor das Produkt Form hatte. ${hl("Genau dieser Teil reizt mich am meisten.")}`,
    `Nicht jede Frage macht Spaß. Allein für die DSGVO habe ich drei Tage lang Videos geschaut, bis ich einen Plan hatte, und danach einen eigenen Agent darauf abgerichtet, das Thema im Auge zu behalten. Irgendwann hat er mich massiv genervt. Genau dafür war er da.`,
    `Ich plane, bevor ich baue, setze Ideen dann früh um und teste sie. Hakt es, war der Plan nicht genau genug. Dann strukturiere ich neu und setze wieder an.`,
    `Die Umsetzung läuft heute oft über Claude Code. Konzept, Architektur und Specs schreibe ich so, dass ein Agent sie umsetzen kann, ich prüfe, was zurückkommt, und weiß, wann ich selbst an die Tastatur muss. Selbst coden mache ich trotzdem gern und oft.`,
    `Im Team bin ich anfangs eher zurückhaltend. Ich brauche etwas Zeit zum Auftauen und gehe selten als Erster auf Leute zu, bin aber komplett offen. Woher jemand kommt oder wie er aussieht, spielt für mich keine Rolle, zumindest versuche ich das. Ich hatte schon sehr unterschiedliche Chefs und bin mit allen klargekommen.`,
    `Als Administrator bei der BBU habe ich dafür gesorgt, dass alles geplant und geregelt war, und war viel unterwegs: In einem Jahr war ich 88-mal am Flughafen Wien-Schwechat, um Klienten an internationale Organisationen zu übergeben. Und wenn der Zug eine Tür verliert, wir zwei Stunden zu spät kommen und deshalb jemand meinen Klienten anfährt, stelle ich mich vor ihn. Ich bin ein Arbeitstier; remote, im Büro oder auf Reisen zu Meetings, das kenne ich alles schon.`,
    `Kreativität gehört für mich dazu. Früher wollte ich Modedesigner werden und habe Graffiti gemalt; heute steckt das in UI und Interaktion. Die Graffiti-Überschriften auf dieser Seite und die vielen Elemente, die man anfassen kann, kommen nicht von ungefähr.`,
    `Ich habe zwei Arten von Arbeitstagen. An Bugfix- und Clean-up-Tagen arbeite ich in die Breite: Mehrere Agents laufen parallel an verschiedenen Projekten, die Tasks sind klein, und beim Erledigen der ersten fallen immer ein paar neue an. An anderen Tagen arbeite ich in die Tiefe: Ich sitze vor einer einzigen Datei und gehe Codeblöcke und Variablennamen durch, ${hl("bis alles Sinn ergibt")}.`,
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
      items: [`${hl("Deutsch")} — Muttersprache`, `${hl("Englisch")} — C1`],
    },
  ],
};

const en: AboutContent = {
  role: "Junior Software Developer",
  facts: ["Linz area · remote across DACH", "available now", "TypeScript full stack · bootcamp + lots of self-study"],
  story: [
    `Before I built software, I built with my hands: almost seven years as a floor layer and sun-protection technician, then two years renovating our family house. You learn fast there: ${hl("a floor is only as good as what's underneath it.")} Cut corners and it shows in every joint later. Programming works the same way, except the material never runs out.`,
    `I take new things apart first. Before I really play a game, I know its mechanics, whether that's WeakAuras in WoW or jungle routes in League of Legends. I do the same with code: I don't want to use any language as a black box, I want to understand it.`,
    `My biggest project is YourBrand. Before it came a password cracker, a Tamagotchi app and a Unity game I scrapped after two weeks. It started with a "you won't pull that off" — and I had talked pretty big. Two months later I presented the first prototype at the bootcamp, honestly with too much scope for the time. I've kept building since: about 700 to 800 hours have gone into it, I built and tested the APIs with Postman, and under load testing the backend ${hl("holds a stable 800 requests per second")}. That's on my laptop, a Ryzen 7 with 8 cores and 32 GB, running the load generator, the database and every instance at once. A real server should manage considerably more; I haven't measured that yet. The goal is 1,000.`,
    `Everything else under ${projectsLink("Projects")} comes from one of two reasons: either I need it myself, or I want to learn something from it. I mostly write TypeScript, because it covers the whole stack in one language.`,
  ],
  principles: [
    "\"Can't be done\" usually means: not understood yet.",
    "Once the concept is thought through, implementation is the easier part.",
    "Whoever comes after me should understand my code without me.",
  ],
  work: [
    `I like thinking my way into processes. With YourBrand that meant: what does a user want, an admin, an owner? Who gets which rights, and how do you protect users? How does it become intuitive on every device? And how do you win and keep users, and make money? Well over a thousand questions like these came first, before the product took shape. ${hl("That's the part that appeals to me most.")}`,
    `Not every question is fun. GDPR alone took me three days of videos before I had a plan, and afterwards I trained my own agent to keep an eye on it. At some point it got massively on my nerves. That was its job.`,
    `I plan before I build, then put ideas into practice early and test them. If something snags, the plan wasn't precise enough, so I restructure and go again.`,
    `These days implementation often runs through Claude Code. I write the concept, the architecture and the specs so an agent can carry them out, I check what comes back, and I know when to take the keyboard myself. I still enjoy writing code myself, and I do it often.`,
    `In a team I'm fairly reserved at first. I need a little time to warm up and rarely go up to people first, but I'm completely open. Where someone comes from or what they look like doesn't matter to me, or at least I try not to let it. I've had very different bosses and got along with all of them.`,
    `As an administrator at BBU I made sure everything was planned and organised, and I was on the road a lot: in one year I was at Vienna Airport 88 times to hand clients over to international organisations. And when the train loses a door, we arrive two hours late and someone snaps at my client because of it, I stand up for him. I'm a workhorse; remote, in the office or travelling to meetings, I've done it all.`,
    `Creativity is part of it for me. I used to want to be a fashion designer and painted graffiti; today that goes into UI and interaction. The graffiti headlines on this page and the many elements you can touch are no coincidence.`,
    `I have two kinds of working days. On bug-fix and clean-up days I work wide: several agents run in parallel on different projects, the tasks are small, and finishing the first ones always turns up a few more. On other days I work deep: I sit in front of a single file and go through code blocks and variable names ${hl("until everything makes sense")}.`,
  ],
  end: `Away from the keyboard, my balance is nature and my family, above all ${hl("my son")}.`,
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
      items: [`${hl("German")} — native`, `${hl("English")} — C1`],
    },
  ],
};

const ru: AboutContent = {
  role: "Junior-разработчик ПО",
  facts: ["Линц и окрестности · удалённо по DACH", "готов приступить сразу", "TypeScript full stack · буткемп + много самостоятельной работы"],
  story: [
    `Прежде чем строить софт, я строил руками: почти семь лет укладчиком полов и техником по солнцезащите, потом два года ремонта нашего семейного дома. Там быстро понимаешь: ${hl("пол хорош ровно настолько, насколько хорошо основание.")} Схалтуришь — потом это видно в каждом шве. В программировании так же, только материал здесь никогда не заканчивается.`,
    `Новое я сначала разбираю на части. Прежде чем по-настоящему играть в игру, я знаю её механики, будь то WeakAuras в WoW или маршруты в лесу в League of Legends. С кодом то же самое: я не хочу пользоваться языком как чёрным ящиком, я хочу его понимать.`,
    `Мой крупнейший проект — YourBrand. До него были взломщик паролей, приложение-тамагочи и игра на Unity, которую я забросил через две недели. Всё началось с «у тебя не получится» — а я наобещал немало. Через два месяца я представил первый прототип на буткемпе, честно говоря, со слишком большим объёмом для такого срока. С тех пор я продолжаю строить: сейчас в проекте около 700–800 часов, API я строил и тестировал в Postman, а под нагрузочным тестом бэкенд ${hl("стабильно держит 800 запросов в секунду")}. И это на моём ноутбуке — Ryzen 7 с 8 ядрами и 32 ГБ, — где одновременно работают генератор нагрузки, база данных и все инстансы. На настоящем сервере должно быть заметно больше; это я ещё не измерял. Цель — 1000.`,
    `Всё остальное в разделе ${projectsLink("Проекты")} возникает по одной из двух причин: либо это нужно мне самому, либо я хочу на этом чему-то научиться. В основном я пишу на TypeScript, потому что он покрывает весь стек одним языком.`,
  ],
  principles: [
    "«Невозможно» чаще всего значит: ещё не понято.",
    "Если концепция продумана, реализация — более простая часть.",
    "Тот, кто придёт после меня, должен понять мой код без меня.",
  ],
  work: [
    `Мне нравится вникать в процессы. В YourBrand это значило: чего хочет пользователь, администратор, владелец? Кто получает какие права и как защитить пользователей? Как сделать всё интуитивным на любом устройстве? И как привлечь и удержать пользователей, как зарабатывать? Больше тысячи таких вопросов стояли в начале, прежде чем продукт обрёл форму. ${hl("Именно эта часть привлекает меня больше всего.")}`,
    `Не каждый вопрос в радость. Только на GDPR у меня ушло три дня видео, прежде чем появился план, а потом я натаскал собственного агента следить за этой темой. В какой-то момент он начал меня жутко раздражать. Для этого он и был нужен.`,
    `Я планирую, прежде чем строить, затем рано воплощаю идеи и тестирую их. Если что-то не идёт, значит, план был недостаточно точным, — тогда я перестраиваю его и пробую снова.`,
    `Реализация сегодня часто идёт через Claude Code. Концепцию, архитектуру и спецификации я пишу так, чтобы агент мог их выполнить, проверяю то, что возвращается, и знаю, когда пора сесть за клавиатуру самому. Писать код сам я всё равно люблю и делаю это часто.`,
    `В команде я поначалу скорее сдержан. Мне нужно время, чтобы оттаять, и я редко первым подхожу к людям, но я полностью открыт. Откуда человек и как он выглядит, для меня не важно, по крайней мере я стараюсь, чтобы было так. У меня были самые разные начальники, и я ладил со всеми.`,
    `Администратором в BBU я следил за тем, чтобы всё было спланировано и организовано, и много ездил: за один год я 88 раз был в венском аэропорту, чтобы передать клиентов международным организациям. А когда у поезда отваливается дверь, мы опаздываем на два часа и кто-то из-за этого срывается на моего клиента, я за него заступаюсь. Я трудоголик: удалённо, в офисе или в поездках на встречи — всё это мне знакомо.`,
    `Креативность для меня — часть работы. Раньше я хотел стать модельером и рисовал граффити; сегодня это уходит в UI и взаимодействие. Граффити-заголовки на этой странице и множество элементов, которые можно потрогать, — не случайность.`,
    `У меня два вида рабочих дней. В дни багфиксов и уборки кода я работаю вширь: несколько агентов параллельно работают над разными проектами, задачи небольшие, и пока закрываешь первые, всегда появляется ещё несколько. В другие дни я работаю вглубь: сижу над одним файлом и перебираю блоки кода и имена переменных, ${hl("пока всё не обретёт смысл")}.`,
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
      items: [`${hl("Немецкий")} — родной`, `${hl("Английский")} — C1`],
    },
  ],
};

const ja: AboutContent = {
  role: "ジュニア・ソフトウェア開発者",
  facts: ["リンツ周辺 · DACH圏でリモート可", "すぐに勤務可能", "TypeScriptフルスタック · ブートキャンプ＋独学"],
  story: [
    `ソフトウェアを作る前は、手でものを作っていました。床職人と日よけ設備の技術者としてほぼ7年、その後2年間は家族の家の改修です。そこではすぐに学びます。${hl("床の良し悪しは下地で決まる。")}手を抜けば、あとで継ぎ目のすべてに現れます。プログラミングも同じです。ただ、こちらは材料が尽きることがありません。`,
    `新しいものは、まず分解します。ゲームを本気でプレイする前に、そのメカニクスを把握します。WoWのWeakAurasでも、League of Legendsのジャングルルートでも。コードでも同じです。どの言語もブラックボックスとして使いたくはなく、理解したいのです。`,
    `最大のプロジェクトはYourBrandです。その前に、パスワードクラッカー、たまごっち風アプリ、そして2週間で断念したUnityゲームがありました。始まりは「お前には無理だ」という一言。私はかなり大きなことを言っていました。2か月後、ブートキャンプで最初のプロトタイプを発表しました。正直、その期間にしては範囲を広げすぎていました。それ以来ずっと作り続けていて、今では約700〜800時間を費やしています。APIはPostmanで構築・テストし、負荷テストではバックエンドが${hl("毎秒800リクエストを安定して処理")}しています。しかもそれは、8コア・32 GBのRyzen 7搭載ノートPC上で、負荷ジェネレーター、データベース、全インスタンスを同時に動かした結果です。本物のサーバーならかなり多く処理できるはずですが、まだ測定はしていません。目標は1000です。`,
    `${projectsLink("プロジェクト")}にあるほかのものは、2つの理由のどちらかから生まれています。自分で必要だったか、それを通して何かを学びたかったか。主にTypeScriptを書いています。1つの言語でスタック全体をカバーできるからです。`,
  ],
  principles: [
    "「できない」はたいてい、まだ理解していないという意味だ。",
    "コンセプトが練られていれば、実装は簡単な部分になる。",
    "私の後に来る人が、私なしでコードを理解できること。",
  ],
  work: [
    `処理の流れを深く考えるのが好きです。YourBrandでは、ユーザー、管理者、オーナーはそれぞれ何を求めるのか。誰にどの権限を与え、ユーザーをどう守るのか。どのデバイスでも直感的にするにはどうするか。そして、どうユーザーを集めて定着させ、どう収益を上げるか。製品が形になる前に、こうした問いが千以上ありました。${hl("まさにこの部分に一番惹かれます。")}`,
    `すべての問いが楽しいわけではありません。GDPRだけでも、計画が立つまでに3日間動画を見続け、その後はこのテーマを見張る専用のエージェントを仕込みました。そのうち、そいつにはかなりうんざりさせられました。それがまさに役目でした。`,
    `作る前に計画し、アイデアは早めに形にしてテストします。行き詰まったら計画の精度が足りなかったということなので、構成を見直してもう一度取り組みます。`,
    `現在、実装にはClaude Codeをよく使います。コンセプト、アーキテクチャ、仕様はエージェントが実行できる形で私が書き、返ってきたものを確認し、自分でキーボードに向かうべきときを見極めます。それでも自分でコードを書くのは好きで、よく書いています。`,
    `チームでは、最初はどちらかというと控えめです。打ち解けるまで少し時間がかかり、自分から人に話しかけることはあまりありませんが、心はまったく開いています。出身や見た目は私には関係ありません。少なくとも、そうあろうと努めています。これまでさまざまな上司のもとで働いてきましたが、誰ともうまくやってきました。`,
    `BBUで管理担当をしていたときは、すべてがきちんと計画・調整されているよう気を配り、外に出ることも多くありました。1年間でウィーン空港に88回通い、クライアントを国際機関に引き渡しました。列車のドアが外れて2時間遅れ、そのせいで誰かが私のクライアントに怒鳴ったときは、私が彼の前に立ちます。私は働き者です。リモートでも、オフィスでも、会議のための出張でも、すべて経験済みです。`,
    `創造性も私にとって欠かせません。以前はファッションデザイナーを目指し、グラフィティを描いていました。今はそれがUIとインタラクションに生きています。このページの見出しがグラフィティ文字で、触れられる要素が多いのは偶然ではありません。`,
    `私の仕事の日は2種類あります。バグ修正やクリーンアップの日は広く進めます。複数のエージェントが並行して別々のプロジェクトを進め、タスクは小さく、最初のいくつかを片づけるうちに必ず新しいものが出てきます。別の日は深く進めます。1つのファイルに向き合い、コードブロックや変数名を見直します。${hl("すべてが筋の通ったものになるまで")}。`,
  ],
  end: `コードと学習の合間の息抜きは、自然と家族、何より${hl("息子")}です。`,
  cv: [
    {
      heading: "経歴",
      items: [
        `${hl("ジュニア開発者")} — フルスタック・ブートキャンプ · Talent Hub – IT Ibis Acam、リンツ · 2025年10月 – 2026年6月`,
        `${hl("住宅の改修")}（家族のプロジェクト） · リンツ＝エーベルスベルク · 2023年6月 – 2025年10月`,
        `${hl("管理担当")} · BBU GmbH、リンツ · 2022年1月 – 2023年6月`,
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
      items: [`${hl("ドイツ語")} — 母語`, `${hl("英語")} — C1`],
    },
  ],
};


export const ABOUT: AboutContent = pick({ de, en, ru, ja });
