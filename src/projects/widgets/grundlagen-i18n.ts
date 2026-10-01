// Texts of the nine Bootcamp programs in the other languages. German stays
// in grundlagen.ts (NOTES); this file is deliberately free of the Java
// sources, so the card's pinboard (project-visuals.ts) can import the
// labels without pulling them in. The programs' own console output stays
// German — they are the originals.

import { LANG, type Lang } from "../../i18n";

interface NoteText {
  label: string;
  intro?: string;
  concepts?: string[];
  bullets?: string[];
}

// Pinboard order = NOTES order in grundlagen.ts.
export const NOTE_IDS = [
  "gameoflife", "pokemon", "mastermind", "rpn", "personal", "bibliothek", "minesweeper", "zahlenraten", "chiffre",
] as const;

const DE_LABELS: Record<string, string> = {
  gameoflife: "Game of Life",
  pokemon: "Pokémon",
  mastermind: "Mastermind",
  rpn: "RPN-Rechner",
  personal: "Personalverwaltung",
  bibliothek: "Bibliothek",
  minesweeper: "Minesweeper",
  zahlenraten: "Zahlenraten",
  chiffre: "Chiffre",
};

const T: Partial<Record<Lang, Record<string, NoteText>>> = {
  en: {
    gameoflife: {
      label: "Game of Life",
      intro: "Conway's Game of Life as a console program: cells live, die or are born depending on their neighbours. I wanted to understand how to model a grid and let behaviour emerge from simple rules.",
      concepts: ["2D arrays", "Neighbour counting", "Cycle detection"],
      bullets: ["Grid and neighbour-counting logic built from scratch", "Step-by-step simulation with cycle detection — stops by itself when a pattern repeats"],
    },
    pokemon: {
      label: "Pokémon",
      intro: "A small battle system in the style of Pokémon. The data on Pokémon, attacks and type strengths is read from files and the damage is calculated from it. This is where I practised class hierarchies.",
      concepts: ["Inheritance", "Class hierarchy", "Battle loop", "Reading files"],
      bullets: ["Class hierarchy for Pokémon and attacks", "Turn-based battle loop with text output"],
    },
    mastermind: {
      label: "Mastermind",
      intro: "The code-breaking game Mastermind in the console: you type a combination, the program rates it.",
      concepts: ["Console input", "Game logic"],
    },
    rpn: {
      label: "RPN Calculator",
      intro: "A calculator for reverse Polish notation (operands first, then the operator). I built the data structures behind it, list and stack, myself instead of using ready-made ones.",
      concepts: ["Linked list", "Stack", "Evaluating expressions"],
      bullets: ["Self-implemented singly linked list", "Stack built on top of it, used to evaluate the expressions"],
    },
    personal: {
      label: "Staff Management",
      intro: "A small management tool for locations and the people in them. The focus was on clean class design, enums and catching wrong input. It has no main, so there's no terminal.",
      concepts: ["Enum", "Overloaded methods", "Error handling"],
      bullets: ["Create administrations (locations) and store people with address, gender (enum) and date of birth in them", "Overloaded create methods depending on the amount of data; a wrong date format is caught"],
    },
    bibliothek: {
      label: "Library",
      intro: "A mini library in the console: authors, their books and quotes, searchable via a menu. This was about choosing the right collections.",
      concepts: ["HashMap", "HashSet", "Console menu"],
      bullets: ["Authors and their books in a HashMap of HashSets, plus quotes per title", "Menu: list authors, view a bibliography, quote for a title, find the author of a title, add your own authors"],
    },
    minesweeper: {
      label: "Minesweeper",
      intro: "Minesweeper with a twist: you guess where there's no mine, and depending on the field's value a larger area is revealed.",
      concepts: ["2D arrays", "Coordinate input", "Revealing fields"],
      bullets: ["10×10 field, input by coordinate (e.g. A3): you guess where there's no mine", "Depending on the field's value, 1×1, 3×3 or 5×5 around it is revealed"],
    },
    zahlenraten: {
      label: "Number Guessing",
      intro: "A number-guessing duel between robot and human. The robot doesn't guess randomly but narrows down the range systematically with every hint.",
      concepts: ["Range search", "Narrowing intervals"],
      bullets: ["Robot vs. human: take turns guessing a number from 0 to 100", "The robot always takes the middle of the remaining numbers and rules out whole ranges based on the hints (\"almost there\", \"fairly close\" …)"],
    },
    chiffre: {
      label: "Cipher",
      intro: "A Vigenère-style cipher in Java: text is shifted with a password and then decrypted right away as a check.",
      concepts: ["Strings", "Modulo shift", "Encryption/decryption"],
      bullets: ["Polyalphabetic encryption: each letter is shifted by the matching letter of the password, which repeats", "Input is cleaned up (umlauts → AE/OE/UE, ß → SS, only A–Z); the result is decrypted again right away"],
    },
  },
  ru: {
    gameoflife: {
      label: "Игра «Жизнь»",
      intro: "«Жизнь» Конвея как консольная программа: клетки живут, умирают или рождаются в зависимости от соседей. Хотел понять, как моделировать сетку и как из простых правил возникает поведение.",
      concepts: ["Двумерные массивы", "Подсчёт соседей", "Обнаружение циклов"],
      bullets: ["Логика сетки и подсчёта соседей написана с нуля", "Пошаговая симуляция с обнаружением циклов — останавливается сама, когда узор повторяется"],
    },
    pokemon: {
      label: "Покемон",
      intro: "Небольшая боевая система в стиле Pokémon. Данные о покемонах, атаках и силе типов читаются из файлов, по ним считается урон. Здесь я тренировал иерархии классов.",
      concepts: ["Наследование", "Иерархия классов", "Боевой цикл", "Чтение файлов"],
      bullets: ["Иерархия классов для покемонов и атак", "Пошаговый боевой цикл с текстовым выводом"],
    },
    mastermind: {
      label: "Мастермайнд",
      intro: "Игра на отгадывание кода Mastermind в консоли: вводишь комбинацию, программа её оценивает.",
      concepts: ["Консольный ввод", "Игровая логика"],
    },
    rpn: {
      label: "Калькулятор ОПН",
      intro: "Калькулятор для обратной польской нотации (сначала операнды, потом оператор). Структуры данных за ним, список и стек, я написал сам, а не взял готовые.",
      concepts: ["Связный список", "Стек", "Вычисление выражений"],
      bullets: ["Самостоятельно реализованный односвязный список", "На нём построен стек, которым вычисляются выражения"],
    },
    personal: {
      label: "Учёт персонала",
      intro: "Небольшая система учёта филиалов и людей в них. Упор был на чистый дизайн классов, перечисления и перехват неверного ввода. Метода main нет, поэтому терминала тоже нет.",
      concepts: ["Enum", "Перегруженные методы", "Обработка ошибок"],
      bullets: ["Создавать управления (филиалы) и хранить в них людей с адресом, полом (enum) и датой рождения", "Перегруженные методы create в зависимости от объёма данных; неверный формат даты перехватывается"],
    },
    bibliothek: {
      label: "Библиотека",
      intro: "Мини-библиотека в консоли: авторы, их книги и цитаты, поиск через меню. Здесь главным был выбор подходящих коллекций.",
      concepts: ["HashMap", "HashSet", "Консольное меню"],
      bullets: ["Авторы и их книги в HashMap с HashSet, плюс цитаты для каждого названия", "Меню: список авторов, библиография, цитата к названию, поиск автора по названию, добавление своих авторов"],
    },
    minesweeper: {
      label: "Сапёр",
      intro: "Сапёр с изюминкой: угадываешь, где мины нет, и в зависимости от значения поля открывается область побольше.",
      concepts: ["Двумерные массивы", "Ввод координат", "Открытие полей"],
      bullets: ["Поле 10×10, ввод по координате (например, A3): угадываешь, где нет мины", "В зависимости от значения поля открывается 1×1, 3×3 или 5×5 вокруг него"],
    },
    zahlenraten: {
      label: "Угадай число",
      intro: "Дуэль «угадай число» между роботом и человеком. Робот угадывает не наугад, а с каждой подсказкой систематически сужает диапазон.",
      concepts: ["Поиск по диапазону", "Сужение интервалов"],
      bullets: ["Робот против человека: по очереди угадывают число от 0 до 100", "Робот каждый раз берёт середину оставшихся чисел и по подсказкам («почти», «довольно близко» …) отбрасывает целые диапазоны"],
    },
    chiffre: {
      label: "Шифр",
      intro: "Шифр в духе Виженера на Java: текст сдвигается по паролю и для проверки сразу же расшифровывается.",
      concepts: ["Строки", "Сдвиг по модулю", "Шифрование/расшифровка"],
      bullets: ["Полиалфавитное шифрование: каждая буква сдвигается на соответствующую букву пароля, пароль повторяется", "Ввод очищается (умлауты → AE/OE/UE, ß → SS, только A–Z); результат сразу расшифровывается обратно"],
    },
  },
  ja: {
    gameoflife: {
      label: "ライフゲーム",
      intro: "コンウェイのライフゲームをコンソールで：セルは隣接するセルに応じて生き、死に、生まれる。グリッドのモデル化と、単純なルールから振る舞いが生まれる仕組みを理解したかった。",
      concepts: ["2次元配列", "近傍のカウント", "周期の検出"],
      bullets: ["グリッドと近傍カウントのロジックをゼロから実装", "周期検出つきのステップ実行 — パターンが繰り返すと自動で停止"],
    },
    pokemon: {
      label: "ポケモン",
      intro: "ポケモン風の小さなバトルシステム。ポケモン、技、タイプ相性のデータをファイルから読み込み、ダメージを計算する。ここでクラス階層を練習した。",
      concepts: ["継承", "クラス階層", "バトルループ", "ファイル読み込み"],
      bullets: ["ポケモンと技のクラス階層", "テキスト出力つきのターン制バトルループ"],
    },
    mastermind: {
      label: "マスターマインド",
      intro: "コンソールで遊ぶ暗号当てゲーム「マスターマインド」：組み合わせを入力すると、プログラムが評価する。",
      concepts: ["コンソール入力", "ゲームロジック"],
    },
    rpn: {
      label: "逆ポーランド電卓",
      intro: "逆ポーランド記法（先にオペランド、次に演算子）の電卓。裏側のデータ構造、リストとスタックは、既製品ではなく自分で作った。",
      concepts: ["連結リスト", "スタック", "式の評価"],
      bullets: ["自作の単方向連結リスト", "その上にスタックを作り、式の評価に使用"],
    },
    personal: {
      label: "人事管理",
      intro: "拠点とそこにいる人を管理する小さなツール。きれいなクラス設計、列挙型、誤入力の処理に重点を置いた。mainがないのでターミナルはない。",
      concepts: ["列挙型", "メソッドのオーバーロード", "エラー処理"],
      bullets: ["管理単位（拠点）を作り、住所・性別（列挙型）・生年月日つきで人を登録", "データ量に応じたcreateメソッドのオーバーロード、誤った日付形式も処理"],
    },
    bibliothek: {
      label: "図書館",
      intro: "コンソールのミニ図書館：著者、その本と引用をメニューから検索できる。適切なコレクションを選ぶことがテーマだった。",
      concepts: ["HashMap", "HashSet", "コンソールメニュー"],
      bullets: ["著者とその本をHashSetを持つHashMapで管理、タイトルごとの引用も", "メニュー：著者一覧、著作リスト、タイトルの引用、タイトルから著者を検索、著者を追加"],
    },
    minesweeper: {
      label: "マインスイーパー",
      intro: "ひねりを加えたマインスイーパー：地雷がない場所を当てると、マスの値に応じて広い範囲が開く。",
      concepts: ["2次元配列", "座標入力", "マスを開く"],
      bullets: ["10×10のフィールド、座標で入力（例：A3）、地雷がない場所を当てる", "マスの値に応じて周囲1×1、3×3、5×5が開く"],
    },
    zahlenraten: {
      label: "数当て",
      intro: "ロボットと人間の数当て対決。ロボットはでたらめに当てるのではなく、ヒントのたびに範囲を体系的に絞り込む。",
      concepts: ["範囲探索", "区間の絞り込み"],
      bullets: ["ロボット対人間：0〜100の数を交互に当てる", "ロボットは残った候補の真ん中を選び、ヒント（「惜しい」「かなり近い」…）で範囲ごと除外"],
    },
    chiffre: {
      label: "暗号",
      intro: "Javaで作ったヴィジュネル風の暗号：パスワードで文字をずらし、確認のためすぐに復号する。",
      concepts: ["文字列", "剰余によるシフト", "暗号化/復号"],
      bullets: ["多表式暗号：各文字をパスワードの対応する文字だけずらし、パスワードは繰り返す", "入力を整形（ウムラウト → AE/OE/UE、ß → SS、A–Zのみ）、結果はすぐ復号"],
    },
  },
  ar: {
    gameoflife: {
      label: "لعبة الحياة",
      intro: "لعبة الحياة لكونواي كبرنامج طرفية: الخلايا تعيش أو تموت أو تولد بحسب جيرانها. أردت أن أفهم كيف تُنمذج شبكة وكيف ينشأ سلوك من قواعد بسيطة.",
      concepts: ["مصفوفات ثنائية الأبعاد", "عدّ الجيران", "كشف الدورات"],
      bullets: ["منطق الشبكة وعدّ الجيران مبني من الصفر", "محاكاة خطوة بخطوة مع كشف الدورات — تتوقف وحدها عندما يتكرر نمط"],
    },
    pokemon: {
      label: "بوكيمون",
      intro: "نظام قتال صغير بأسلوب بوكيمون. تُقرأ بيانات البوكيمون والهجمات وقوة الأنواع من ملفات ويُحسب الضرر منها. هنا تدرّبت على تسلسلات الأصناف.",
      concepts: ["الوراثة", "تسلسل الأصناف", "حلقة القتال", "قراءة الملفات"],
      bullets: ["تسلسل أصناف للبوكيمون والهجمات", "حلقة قتال بالأدوار مع مخرجات نصية"],
    },
    mastermind: {
      label: "ماستر مايند",
      intro: "لعبة تخمين الرموز ماستر مايند في الطرفية: تكتب تركيبة، ويقيّمها البرنامج.",
      concepts: ["إدخال الطرفية", "منطق اللعبة"],
    },
    rpn: {
      label: "حاسبة RPN",
      intro: "حاسبة للترميز البولندي العكسي (المعاملات أولًا، ثم العامل). بنيت هياكل البيانات خلفها، القائمة والمكدّس، بنفسي بدل استخدام جاهزة.",
      concepts: ["قائمة مترابطة", "مكدّس", "تقييم التعابير"],
      bullets: ["قائمة مترابطة أحادية من تنفيذي", "مكدّس مبني فوقها، يُستخدم لتقييم التعابير"],
    },
    personal: {
      label: "إدارة الموظفين",
      intro: "أداة صغيرة لإدارة الفروع والأشخاص فيها. كان التركيز على تصميم أصناف نظيف والتعدادات واعتراض المدخلات الخاطئة. لا يوجد main، لذلك لا توجد طرفية.",
      concepts: ["Enum", "دوال محمّلة", "معالجة الأخطاء"],
      bullets: ["إنشاء إدارات (فروع) وتخزين أشخاص فيها مع العنوان والجنس (Enum) وتاريخ الميلاد", "دوال create محمّلة بحسب كمية البيانات؛ ويُعترض تنسيق التاريخ الخاطئ"],
    },
    bibliothek: {
      label: "المكتبة",
      intro: "مكتبة مصغّرة في الطرفية: مؤلفون وكتبهم واقتباسات، قابلة للبحث عبر قائمة. كان الهدف اختيار المجموعات المناسبة.",
      concepts: ["HashMap", "HashSet", "قائمة الطرفية"],
      bullets: ["المؤلفون وكتبهم في HashMap من HashSets، مع اقتباسات لكل عنوان", "القائمة: عرض المؤلفين، الببليوغرافيا، اقتباس لعنوان، إيجاد مؤلف عنوان، إضافة مؤلفين"],
    },
    minesweeper: {
      label: "كاسحة الألغام",
      intro: "كاسحة ألغام بلمسة مختلفة: تخمّن أين لا يوجد لغم، وبحسب قيمة الخانة تنكشف مساحة أكبر.",
      concepts: ["مصفوفات ثنائية الأبعاد", "إدخال الإحداثيات", "كشف الخانات"],
      bullets: ["حقل 10×10، الإدخال بالإحداثيات (مثل A3): تخمّن أين لا يوجد لغم", "بحسب قيمة الخانة ينكشف 1×1 أو 3×3 أو 5×5 حولها"],
    },
    zahlenraten: {
      label: "تخمين الرقم",
      intro: "مبارزة تخمين أرقام بين روبوت وإنسان. الروبوت لا يخمّن عشوائيًا، بل يضيّق النطاق بانتظام مع كل تلميح.",
      concepts: ["البحث في نطاق", "تضييق الفترات"],
      bullets: ["روبوت ضد إنسان: تخمين رقم من 0 إلى 100 بالتناوب", "يأخذ الروبوت دائمًا منتصف الأرقام المتبقية ويستبعد نطاقات كاملة بناءً على التلميحات («قريب جدًا»، «قريب نسبيًا» …)"],
    },
    chiffre: {
      label: "التشفير",
      intro: "تشفير على طريقة فيجنير بلغة Java: يُزاح النص بكلمة مرور ثم يُفكّ تشفيره مباشرة للتحقق.",
      concepts: ["السلاسل النصية", "الإزاحة بالباقي", "التشفير/فكّ التشفير"],
      bullets: ["تشفير متعدد الأبجديات: كل حرف يُزاح بالحرف المقابل من كلمة المرور، وكلمة المرور تتكرر", "يُنظَّف الإدخال (الأحرف المعلّمة → AE/OE/UE، ß → SS، فقط A–Z)؛ ويُفكّ تشفير النتيجة مباشرة"],
    },
  },
};

export function noteLabel(id: string): string {
  return T[LANG]?.[id]?.label ?? DE_LABELS[id] ?? id;
}

// A note from grundlagen.ts with the current language's texts laid over it.
export function localizeNote<N extends { id: string; label: string; intro?: string; concepts?: string[]; bullets?: string[] }>(
  note: N,
): N {
  const t = T[LANG]?.[note.id];
  if (!t) return note;
  return {
    ...note,
    label: t.label,
    intro: t.intro ?? note.intro,
    concepts: t.concepts ?? note.concepts,
    bullets: t.bullets ?? note.bullets,
  };
}
