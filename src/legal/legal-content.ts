// Impressum and Datenschutzerklärung in all five page languages. German is
// the original and the legally binding version — the others carry a note
// saying so (UI.legalNote). Statute names, the authority and its address
// stay in their original German form in every language, so they remain
// unambiguous.
import { pick } from "../i18n";

export interface LegalText {
  title: string;
  html: string;
}

const MAIL = `<a href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a>`;
const DSB = `<a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">dsb.gv.at</a>`;

// Japanese has no spaces between words, but a source line break between two
// CJK characters still renders as one — joins those lines back up.
const joinCjk = (html: string) =>
  html.replace(/([^\x00-\x7F])\s*\n\s*(?=[^\x00-\x7F])/g, "$1");

export const IMPRESSUM: LegalText = pick<LegalText>({
  de: {
    title: "Impressum",
    html: `
      <h1 class="legal-title">Impressum</h1>

      <h2>Offenlegung nach § 25 Mediengesetz</h2>
      <p>
        <strong>Kevin Schaberl</strong><br />
        Ottensheim, Österreich<br />
        Unternehmensgegenstand: Softwareentwicklung
      </p>

      <h2>Kontakt</h2>
      <p>${MAIL}</p>

      <h2>Zweck dieser Website</h2>
      <p>
        Diese Seite stellt ausschließlich meine Person, mein Portfolio
        und meine eigenen Projekte dar. Es werden keine Waren oder
        Dienstleistungen angeboten und keine Entgelte in Aussicht
        gestellt.
      </p>
      <p class="legal-note">
        Für Websites, deren Inhalt sich auf die Darstellung des
        Medieninhabers beschränkt, genügen nach § 25 Abs 5 MedienG
        Name, Wohnort und Unternehmensgegenstand. Die Pflicht zur
        Angabe einer geografischen Anschrift nach § 5 ECG greift nur
        für Dienste, die in der Regel gegen Entgelt erbracht werden —
        das ist hier nicht der Fall.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Texte, Bilder und Code auf dieser Seite stammen von mir,
        soweit nicht anders gekennzeichnet.
      </p>
    `,
  },
  en: {
    title: "Legal notice",
    html: `
      <h1 class="legal-title">Legal notice</h1>

      <h2>Disclosure under § 25 Mediengesetz (Austrian Media Act)</h2>
      <p>
        <strong>Kevin Schaberl</strong><br />
        Ottensheim, Austria<br />
        Business purpose: software development
      </p>

      <h2>Contact</h2>
      <p>${MAIL}</p>

      <h2>Purpose of this website</h2>
      <p>
        This site presents only myself, my portfolio and my own
        projects. No goods or services are offered and no payment is
        held out.
      </p>
      <p class="legal-note">
        For websites whose content is limited to presenting the media
        owner, § 25 (5) MedienG requires only name, place of residence
        and business purpose. The obligation to state a geographic
        address under § 5 ECG (Austrian E-Commerce Act) applies only to
        services normally provided for remuneration — which is not the
        case here.
      </p>

      <h2>Copyright</h2>
      <p>
        Texts, images and code on this site are my own unless stated
        otherwise.
      </p>
    `,
  },
  ru: {
    title: "Выходные данные",
    html: `
      <h1 class="legal-title">Выходные данные</h1>

      <h2>Раскрытие информации согласно § 25 Mediengesetz (австрийский закон о СМИ)</h2>
      <p>
        <strong>Кевин Шаберль (Kevin Schaberl)</strong><br />
        Оттенсхайм, Австрия<br />
        Род деятельности: разработка программного обеспечения
      </p>

      <h2>Контакт</h2>
      <p>${MAIL}</p>

      <h2>Назначение сайта</h2>
      <p>
        Этот сайт представляет исключительно меня, моё портфолио и мои
        собственные проекты. Здесь не предлагаются товары или услуги и
        не обещается никакое вознаграждение.
      </p>
      <p class="legal-note">
        Для сайтов, содержание которых ограничивается представлением
        владельца, согласно § 25 абз. 5 MedienG достаточно указать имя,
        место жительства и род деятельности. Обязанность указывать
        географический адрес по § 5 ECG (австрийский закон об
        электронной коммерции) действует только для услуг, которые, как
        правило, оказываются за плату, — здесь это не так.
      </p>

      <h2>Авторское право</h2>
      <p>
        Тексты, изображения и код на этом сайте принадлежат мне, если не
        указано иное.
      </p>
    `,
  },
  ja: {
    title: "運営者情報",
    html: joinCjk(`
      <h1 class="legal-title">運営者情報</h1>

      <h2>メディア法（Mediengesetz）第25条に基づく開示</h2>
      <p>
        <strong>ケヴィン・シャーベル（Kevin Schaberl）</strong><br />
        オーストリア、オッテンスハイム<br />
        事業内容：ソフトウェア開発
      </p>

      <h2>連絡先</h2>
      <p>${MAIL}</p>

      <h2>本サイトの目的</h2>
      <p>
        本サイトは、私自身、私のポートフォリオ、および私自身のプロジェクトを
        紹介するためだけのものです。商品やサービスの提供、対価の提示は
        一切行っていません。
      </p>
      <p class="legal-note">
        運営者自身の紹介に限られるウェブサイトについては、MedienG 第25条
        第5項により、氏名・居住地・事業内容の記載で足ります。ECG（電子商取引法）
        第5条に基づく所在地住所の記載義務は、通常有償で提供されるサービスに
        のみ適用され、本サイトはこれに該当しません。
      </p>

      <h2>著作権</h2>
      <p>
        特に記載のない限り、本サイトの文章・画像・コードは私が作成したものです。
      </p>
    `),
  },
  ar: {
    title: "بيانات الناشر",
    html: `
      <h1 class="legal-title">بيانات الناشر</h1>

      <h2>الإفصاح وفقًا للمادة 25 من قانون الإعلام النمساوي (Mediengesetz)</h2>
      <p>
        <strong>كيفن شابرل (Kevin Schaberl)</strong><br />
        أوتنسهايم، النمسا<br />
        مجال النشاط: تطوير البرمجيات
      </p>

      <h2>التواصل</h2>
      <p>${MAIL}</p>

      <h2>الغرض من هذا الموقع</h2>
      <p>
        يعرض هذا الموقع شخصي ومحفظة أعمالي ومشاريعي الخاصة فقط. لا تُعرض
        فيه أي سلع أو خدمات، ولا يُوعد فيه بأي مقابل مادي.
      </p>
      <p class="legal-note">
        بالنسبة للمواقع التي يقتصر محتواها على التعريف بمالكها، يكفي وفقًا
        للمادة 25 الفقرة 5 من MedienG ذكر الاسم ومكان الإقامة ومجال النشاط.
        أما واجب ذكر عنوان جغرافي وفقًا للمادة 5 من ECG (قانون التجارة
        الإلكترونية النمساوي) فينطبق فقط على الخدمات التي تُقدَّم عادةً
        مقابل أجر — وهذا لا ينطبق هنا.
      </p>

      <h2>حقوق النشر</h2>
      <p>
        النصوص والصور والشيفرة البرمجية في هذا الموقع من إعدادي، ما لم
        يُذكر خلاف ذلك.
      </p>
    `,
  },
});

export const DATENSCHUTZ: LegalText = pick<LegalText>({
  de: {
    title: "Datenschutzerklärung",
    html: `
      <h1 class="legal-title">Datenschutzerklärung</h1>

      <h2>Verantwortlicher</h2>
      <p>
        Kevin Schaberl, Ottensheim, Österreich<br />
        ${MAIL}
      </p>

      <h2>Was diese Seite nicht tut</h2>
      <p>
        Keine Cookies. Keine Analyse- oder Trackingwerkzeuge.
        Schriftart, Bilder und Skripte liegen alle auf diesem Server.
        Beim bloßen Besuch dieser Seite geht keine Anfrage an einen
        anderen Anbieter außer dem Hoster selbst. Drei Funktionen laden
        Inhalte Dritter — aber erst, wenn Sie sie selbst anklicken und
        zustimmen (siehe „Musikplayer“, „Java-Programme im Browser“ und
        „Gesicht-Tool“).
      </p>
      <p>
        Im lokalen Speicher Ihres Browsers legt die Seite nur Ihre
        Einstellungen ab (Sprache, Hell/Dunkel-Modus), ob das Intro in
        dieser Sitzung schon lief, und — falls erteilt — Ihre
        Einwilligungen. Das bleibt auf Ihrem Gerät und wird nicht an mich
        übertragen.
      </p>

      <h2>Hosting und Serverprotokolle</h2>
      <p>
        Die Seite wird von <strong>Vercel Inc.</strong> ausgeliefert.
        Beim Aufruf verarbeitet Vercel technische Zugriffsdaten —
        darunter IP-Adresse, Zeitpunkt, angeforderte Adresse,
        Browserkennung — in Serverprotokollen. Das ist für den
        Betrieb der Seite unvermeidbar. Rechtsgrundlage ist das
        berechtigte Interesse an einer technisch sicheren
        Auslieferung, Art. 6 Abs. 1 lit. f DSGVO.
      </p>
      <p>
        <strong>Übermittlung in die USA:</strong> Vercel Inc. hat
        seinen Sitz in den Vereinigten Staaten. Es findet dadurch
        eine Übermittlung in ein Drittland statt. Vercel ist nach dem
        EU-US Data Privacy Framework zertifiziert; ergänzend gelten
        die Standardvertragsklauseln der EU-Kommission. Trotz dieser
        Grundlagen kann ein Zugriff US-amerikanischer Behörden nicht
        vollständig ausgeschlossen werden.
      </p>

      <h2>Musikplayer (YouTube)</h2>
      <p>
        Der Play-Button im Kopfbereich spielt eine YouTube-Playlist ab.
        Beim ersten Klick erscheint zunächst ein Hinweis; erst wenn Sie
        dort „Abspielen“ wählen, wird der Player von <strong>Google Ireland Limited</strong>
        (Gordon House, Barrow Street, Dublin 4, Irland) im erweiterten
        Datenschutzmodus (youtube-nocookie.com) geladen. Dabei erhält Google
        mindestens Ihre IP-Adresse und technische Browserdaten; während
        der Wiedergabe kann YouTube Daten auf Ihrem Gerät speichern
        (z. B. im lokalen Speicher). Daten können an Google LLC in die
        USA übermittelt werden; Google ist nach dem EU-US Data Privacy
        Framework zertifiziert. Rechtsgrundlage ist Ihre Einwilligung,
        die Sie mit „Abspielen“ erteilen (Art. 6 Abs. 1 lit. a DSGVO,
        § 165 Abs. 3 TKG 2021). Ihr Browser merkt sich diese Wahl
        (localStorage), damit der Hinweis nicht bei jedem Besuch
        erscheint; widerrufen können Sie sie jederzeit unten unter
        „Einwilligungen widerrufen“ oder durch Löschen der Website-Daten
        in Ihrem Browser. Ohne Einwilligung findet keine Verbindung
        statt. Mehr dazu:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>Java-Programme im Browser (CheerpJ)</h2>
      <p>
        Die Live-Demo „Grundlagen“ führt Java-Programme direkt im Browser
        aus. Dafür braucht es die Laufzeitumgebung CheerpJ von <strong>Leaning Technologies Ltd.</strong>
        (Vereinigtes Königreich). Die Demo zeigt zuerst einen Hinweis;
        erst wenn Sie dort „Starten“ wählen, wird CheerpJ geladen
        (cjrtnc.leaningtech.com). Dabei
        erhält der Anbieter Ihre IP-Adresse und technische Browserdaten;
        CheerpJ kann Dateien im Browser-Speicher (IndexedDB)
        zwischenspeichern. Für das Vereinigte Königreich besteht ein
        Angemessenheitsbeschluss der EU-Kommission. Rechtsgrundlage ist
        Ihre Einwilligung, die Sie mit „Starten“ erteilen (Art. 6 Abs. 1
        lit. a DSGVO, § 165 Abs. 3 TKG 2021). Ihr Browser merkt sich
        diese Wahl; widerrufen können Sie sie unten. Ohne Einwilligung
        wird nichts geladen.
      </p>

      <h2>Gesicht-Tool (FaceDots)</h2>
      <p>
        Im Projekt „FaceDots“ können Sie ein eigenes Foto in Punkte,
        ASCII oder ein Tuch verwandeln. Das Foto wird ausschließlich in
        Ihrem Browser verarbeitet und nirgends hochgeladen. Um den Kopf
        freizustellen, braucht das Tool ein KI-Modell von Google
        (MediaPipe, ca. 16 MB). Vor dem ersten eigenen Foto erscheint ein
        Hinweis; erst wenn Sie dort „Laden“ wählen, lädt Ihr Browser das
        Modell von Servern der <strong>Google LLC</strong> (USA,
        storage.googleapis.com). Dabei erhält Google Ihre IP-Adresse und
        technische Browserdaten, nicht aber Ihr Foto. Google ist nach dem
        EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist
        Ihre Einwilligung, die Sie mit „Laden“ erteilen (Art. 6 Abs. 1
        lit. a DSGVO). Ihr Browser merkt sich diese Wahl; widerrufen
        können Sie sie unten. Ohne Einwilligung wird nichts geladen —
        das vorbereitete Gesicht funktioniert auch so. Mehr dazu:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>Einwilligungen widerrufen</h2>
      <p>
        Hier sehen Sie, wozu Sie in diesem Browser eingewilligt haben,
        und können es mit Wirkung für die Zukunft widerrufen. Ist die
        Funktion auf dieser Seite schon geladen, wird die Seite dafür neu
        geladen.
      </p>
      <div class="legal-consents"></div>

      <h2>Kontaktaufnahme</h2>
      <p>
        Wenn Sie mir schreiben, verarbeite ich Ihre Angaben, um Ihre
        Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1
        lit. f DSGVO, bei Anbahnung eines Beschäftigungsverhältnisses
        Art. 6 Abs. 1 lit. b DSGVO. Ich lösche die Nachrichten,
        sobald sie nicht mehr gebraucht werden und keine
        Aufbewahrungspflicht entgegensteht.
      </p>

      <h2>Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung,
        Einschränkung der Verarbeitung, Datenübertragbarkeit und
        Widerspruch. Wenden Sie sich dafür an ${MAIL}.
      </p>
      <p>
        Außerdem können Sie sich bei der Aufsichtsbehörde
        beschweren:<br />
        <strong>Österreichische Datenschutzbehörde</strong>,
        Barichgasse 40–42, 1030 Wien, ${DSB}
      </p>
    `,
  },
  en: {
    title: "Privacy policy",
    html: `
      <h1 class="legal-title">Privacy policy</h1>

      <h2>Controller</h2>
      <p>
        Kevin Schaberl, Ottensheim, Austria<br />
        ${MAIL}
      </p>

      <h2>What this site does not do</h2>
      <p>
        No cookies. No analytics or tracking tools. Font, images and
        scripts are all served from this server. Merely visiting this
        site sends no request to any provider other than the host
        itself. Three features load third-party content — but only
        once you click them yourself and agree (see "Music player",
        "Java programs in the browser" and "Face tool").
      </p>
      <p>
        In your browser's local storage the site only keeps your
        settings (language, light/dark mode), whether the intro already
        ran in this session, and — if given — your consents. That stays
        on your device and is never sent to me.
      </p>

      <h2>Hosting and server logs</h2>
      <p>
        The site is delivered by <strong>Vercel Inc.</strong> When it
        is accessed, Vercel processes technical access data — including
        IP address, time, requested address and browser identifier — in
        server logs. This is unavoidable for running the site. The legal
        basis is the legitimate interest in technically secure delivery,
        Art. 6(1)(f) GDPR.
      </p>
      <p>
        <strong>Transfer to the USA:</strong> Vercel Inc. is based in
        the United States, so data is transferred to a third country.
        Vercel is certified under the EU-US Data Privacy Framework; the
        European Commission's standard contractual clauses apply in
        addition. Despite these safeguards, access by US authorities
        cannot be ruled out entirely.
      </p>

      <h2>Music player (YouTube)</h2>
      <p>
        The play button in the header plays a YouTube playlist. The first
        click only shows a notice; the player is loaded only once you
        choose "Play" there — from <strong>Google Ireland Limited</strong>
        (Gordon House, Barrow Street, Dublin 4, Ireland) in privacy-enhanced
        mode (youtube-nocookie.com). Google then receives at least your
        IP address and technical browser data; during playback YouTube
        may store data on your device (e.g. in local storage). Data may
        be transferred to Google LLC in the USA; Google is certified
        under the EU-US Data Privacy Framework. The legal basis is the
        consent you give with "Play" (Art. 6(1)(a) GDPR, § 165 (3) TKG
        2021). Your browser remembers this choice (localStorage) so the
        notice doesn't appear on every visit; you can withdraw it at any
        time under "Withdraw consent" below or by clearing this site's
        data in your browser. Without consent, no connection
        is made. More:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>Java programs in the browser (CheerpJ)</h2>
      <p>
        The "Grundlagen" live demo runs Java programs directly in the
        browser. This needs the CheerpJ runtime by
        <strong>Leaning Technologies Ltd.</strong> (United Kingdom). The
        demo first shows a notice; CheerpJ is loaded only once you choose
        "Start" there (cjrtnc.leaningtech.com). The provider then receives your
        IP address and technical browser data; CheerpJ may cache files in
        browser storage (IndexedDB). The European Commission has issued
        an adequacy decision for the United Kingdom. The legal basis is
        the consent you give with "Start" (Art. 6(1)(a) GDPR, § 165 (3)
        TKG 2021). Your browser remembers this choice; you can withdraw
        it below. Without consent, nothing is loaded.
      </p>

      <h2>Face tool (FaceDots)</h2>
      <p>
        In the "FaceDots" project you can turn a photo of your own into
        dots, ASCII or a cloth. The photo is processed only in your
        browser and never uploaded. To cut out the head, the tool needs
        an AI model by Google (MediaPipe, about 16 MB). Before your first
        own photo a notice appears; only when you choose "Load" there
        does your browser fetch the model from servers of
        <strong>Google LLC</strong> (USA, storage.googleapis.com). Google
        receives your IP address and technical browser data, but not
        your photo. Google is certified under the EU-US Data Privacy
        Framework. The legal basis is your consent, given with "Load"
        (Art. 6(1)(a) GDPR). Your browser remembers this choice; you can
        withdraw it below. Without consent, nothing is loaded — the
        prepared face works anyway. More:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>Withdraw consent</h2>
      <p>
        Here you can see what you have consented to in this browser and
        withdraw it with effect for the future. If the feature is already
        loaded on this page, the page reloads to stop it.
      </p>
      <div class="legal-consents"></div>

      <h2>Contacting me</h2>
      <p>
        If you write to me, I process your details in order to answer
        your enquiry. The legal basis is Art. 6(1)(f) GDPR, or
        Art. 6(1)(b) GDPR where it concerns a possible employment
        relationship. I delete messages as soon as they are no longer
        needed and no retention obligation applies.
      </p>

      <h2>Your rights</h2>
      <p>
        You have the right of access, rectification, erasure,
        restriction of processing, data portability and objection.
        To exercise them, contact ${MAIL}.
      </p>
      <p>
        You can also lodge a complaint with the supervisory
        authority:<br />
        <strong>Österreichische Datenschutzbehörde</strong> (Austrian
        Data Protection Authority), Barichgasse 40–42, 1030 Wien,
        ${DSB}
      </p>
    `,
  },
  ru: {
    title: "Политика конфиденциальности",
    html: `
      <h1 class="legal-title">Политика конфиденциальности</h1>

      <h2>Ответственное лицо</h2>
      <p>
        Кевин Шаберль (Kevin Schaberl), Оттенсхайм, Австрия<br />
        ${MAIL}
      </p>

      <h2>Чего этот сайт не делает</h2>
      <p>
        Никаких cookie. Никаких инструментов аналитики или отслеживания.
        Шрифт, изображения и скрипты находятся на этом сервере. При
        простом посещении сайта запросы не отправляются никакому другому
        поставщику, кроме самого хостинга. Три функции загружают контент
        третьих лиц — но только после того, как вы сами на них нажмёте и
        согласитесь (см. «Музыкальный плеер», «Java-программы в браузере»
        и «Инструмент лица»).
      </p>
      <p>
        В локальном хранилище браузера сайт хранит только ваши настройки
        (язык, светлая/тёмная тема), отметку о том, что интро в этом
        сеансе уже показано, и — если они даны — ваши согласия. Всё это
        остаётся на вашем устройстве и мне не передаётся.
      </p>

      <h2>Хостинг и серверные журналы</h2>
      <p>
        Сайт обслуживается компанией <strong>Vercel Inc.</strong> При
        обращении к нему Vercel обрабатывает технические данные доступа —
        в том числе IP-адрес, время, запрошенный адрес и идентификатор
        браузера — в серверных журналах. Это неизбежно для работы сайта.
        Правовое основание — законный интерес в технически безопасной
        доставке, ст. 6 п. 1 лит. f GDPR (DSGVO).
      </p>
      <p>
        <strong>Передача данных в США:</strong> Vercel Inc. находится
        в Соединённых Штатах, поэтому данные передаются в третью страну.
        Vercel сертифицирован по EU-US Data Privacy Framework;
        дополнительно применяются стандартные договорные условия
        Европейской комиссии. Несмотря на это, доступ американских
        органов власти нельзя полностью исключить.
      </p>

      <h2>Музыкальный плеер (YouTube)</h2>
      <p>
        Кнопка воспроизведения в шапке запускает плейлист YouTube. Первое
        нажатие лишь показывает уведомление; плеер загружается только
        после того, как вы выберете в нём «Воспроизвести», — плеер компании <strong>Google Ireland Limited</strong>
        (Gordon House, Barrow Street, Dublin 4, Ирландия) в режиме
        повышенной конфиденциальности (youtube-nocookie.com). При этом
        Google получает как минимум ваш IP-адрес и технические данные
        браузера; во время воспроизведения YouTube может сохранять данные
        на вашем устройстве (например, в локальном хранилище). Данные
        могут передаваться Google LLC в США; Google сертифицирован по
        EU-US Data Privacy Framework. Правовое основание — ваше согласие,
        которое вы даёте кнопкой «Воспроизвести» (ст. 6 п. 1 лит. a GDPR,
        § 165 абз. 3 TKG 2021). Браузер запоминает этот выбор
        (localStorage), чтобы уведомление не появлялось при каждом
        посещении; отозвать его можно в любой момент ниже в разделе
        «Отзыв согласия» или удалив данные этого сайта в браузере. Без согласия соединение не устанавливается. Подробнее:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>Java-программы в браузере (CheerpJ)</h2>
      <p>
        Live-демо «Grundlagen» выполняет Java-программы прямо в браузере.
        Для этого нужна среда выполнения CheerpJ компании
        <strong>Leaning Technologies Ltd.</strong> (Великобритания). Демо
        сначала показывает уведомление; CheerpJ загружается только после
        того, как вы выберете в нём «Запустить» (cjrtnc.leaningtech.com). При этом поставщик
        получает ваш IP-адрес и технические данные браузера; CheerpJ
        может кэшировать файлы в хранилище браузера (IndexedDB). Для
        Великобритании действует решение Европейской комиссии об
        адекватности защиты данных. Правовое основание — ваше согласие,
        которое вы даёте кнопкой «Запустить» (ст. 6 п. 1 лит. a GDPR,
        § 165 абз. 3 TKG 2021). Браузер запоминает этот выбор; отозвать
        его можно ниже. Без согласия ничего не загружается.
      </p>

      <h2>Инструмент лица (FaceDots)</h2>
      <p>
        В проекте «FaceDots» можно превратить собственное фото в точки,
        ASCII или ткань. Фото обрабатывается только в вашем браузере и
        никуда не загружается. Чтобы вырезать голову, инструменту нужна
        ИИ-модель от Google (MediaPipe, около 16 МБ). Перед первым
        собственным фото появляется уведомление; только после нажатия
        «Загрузить» браузер получает модель с серверов
        <strong>Google LLC</strong> (США, storage.googleapis.com). Google
        получает ваш IP-адрес и технические данные браузера, но не ваше
        фото. Google сертифицирована по EU-US Data Privacy Framework.
        Правовое основание — ваше согласие, данное кнопкой «Загрузить»
        (ст. 6 (1) (a) GDPR). Браузер запоминает этот выбор; отозвать его
        можно ниже. Без согласия ничего не загружается — подготовленное
        лицо работает и так. Подробнее:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>Отзыв согласия</h2>
      <p>
        Здесь видно, на что вы дали согласие в этом браузере, и его можно
        отозвать на будущее. Если функция на этой странице уже загружена,
        страница для этого перезагрузится.
      </p>
      <div class="legal-consents"></div>

      <h2>Обращение ко мне</h2>
      <p>
        Если вы мне пишете, я обрабатываю ваши данные, чтобы ответить на
        ваш запрос. Правовое основание — ст. 6 п. 1 лит. f GDPR, а при
        подготовке трудовых отношений — ст. 6 п. 1 лит. b GDPR. Я удаляю
        сообщения, как только они больше не нужны и нет обязанности их
        хранить.
      </p>

      <h2>Ваши права</h2>
      <p>
        Вы имеете право на доступ к данным, их исправление, удаление,
        ограничение обработки, переносимость данных и возражение. Для
        этого напишите на ${MAIL}.
      </p>
      <p>
        Кроме того, вы можете подать жалобу в надзорный орган:<br />
        <strong>Österreichische Datenschutzbehörde</strong> (Управление
        по защите данных Австрии), Barichgasse 40–42, 1030 Wien,
        ${DSB}
      </p>
    `,
  },
  ja: {
    title: "プライバシーポリシー",
    html: joinCjk(`
      <h1 class="legal-title">プライバシーポリシー</h1>

      <h2>管理者</h2>
      <p>
        ケヴィン・シャーベル（Kevin Schaberl）、オーストリア、オッテンスハイム<br />
        ${MAIL}
      </p>

      <h2>本サイトが行わないこと</h2>
      <p>
        Cookie は使用しません。アクセス解析やトラッキングのツールも使用しません。
        フォント、画像、スクリプトはすべてこのサーバー上にあります。本サイトを
        閲覧するだけでは、ホスティング事業者以外の事業者へリクエストが送られる
        ことはありません。第三者のコンテンツを読み込む機能が3つありますが、
        ご自身でクリックして同意した場合に限られます（「音楽プレーヤー」、
        「ブラウザ上の Java プログラム」、「顔ツール」を参照）。
      </p>
      <p>
        ブラウザのローカルストレージに保存するのは、設定（言語、ライト／
        ダークモード）、このセッションでイントロが再生済みかどうか、
        そして同意した場合はその同意だけです。これらはお使いの端末に
        とどまり、私に送信されることはありません。
      </p>

      <h2>ホスティングとサーバーログ</h2>
      <p>
        本サイトは <strong>Vercel Inc.</strong> によって配信されています。
        アクセス時、Vercel は IP アドレス、日時、リクエストされたアドレス、
        ブラウザ識別子などの技術的なアクセスデータをサーバーログで処理します。
        これはサイトの運営上避けられません。法的根拠は、技術的に安全な配信に
        関する正当な利益（GDPR〔DSGVO〕第6条第1項(f)）です。
      </p>
      <p>
        <strong>米国への移転：</strong>Vercel Inc. は米国に拠点を置いているため、
        第三国へのデータ移転が発生します。Vercel は EU-US Data Privacy
        Framework の認証を受けており、さらに欧州委員会の標準契約条項が適用
        されます。それでも、米国当局によるアクセスを完全に排除することは
        できません。
      </p>

      <h2>音楽プレーヤー（YouTube）</h2>
      <p>
        ヘッダーの再生ボタンで YouTube のプレイリストを再生します。最初の
        クリックではお知らせが表示されるだけで、そこで「再生」を選んだ場合に
        はじめて、<strong>Google Ireland Limited</strong>（Gordon House,
        Barrow Street, Dublin 4, Ireland）のプレーヤーがプライバシー強化
        モード（youtube-nocookie.com）で読み込まれます。その際、Google は
        少なくとも IP アドレスと技術的なブラウザ情報を受け取り、再生中は
        YouTube がお使いの端末にデータ（ローカルストレージなど）を保存する
        ことがあります。データは米国の Google LLC に移転される場合があり、
        Google は EU-US Data Privacy Framework の認証を受けています。
        法的根拠は、「再生」によって与えられる同意（GDPR 第6条第1項(a)、
        TKG 2021 第165条第3項）です。毎回お知らせが表示されないよう、
        ブラウザがこの選択を記憶します（localStorage）。同意は下記の
        「同意の撤回」から、またはブラウザで本サイトのデータを削除することで
        いつでも撤回できます。同意がない限り接続は行われません。
        詳細：
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>ブラウザ上の Java プログラム（CheerpJ）</h2>
      <p>
        ライブデモ「Grundlagen」は Java プログラムをブラウザ上で直接実行
        します。そのためには <strong>Leaning Technologies Ltd.</strong>
        （英国）の実行環境 CheerpJ が必要です。デモはまずお知らせを表示し、
        そこで「開始」を選んだ場合にのみ CheerpJ が読み込まれます
        （cjrtnc.leaningtech.com）。
        その際、提供者は IP アドレスと技術的なブラウザ情報を受け取り、
        CheerpJ はブラウザのストレージ（IndexedDB）にファイルをキャッシュする
        ことがあります。英国については欧州委員会の十分性認定があります。
        法的根拠は、「開始」によって与えられる同意（GDPR 第6条第1項(a)、
        TKG 2021 第165条第3項）です。ブラウザがこの選択を記憶し、下記から
        撤回できます。同意がない限り何も読み込まれません。
      </p>

      <h2>顔ツール（FaceDots）</h2>
      <p>
        「FaceDots」プロジェクトでは、ご自身の写真をドット、ASCII、布に
        変換できます。写真はブラウザ内でのみ処理され、どこにも
        アップロードされません。頭部を切り抜くために、ツールは Google の
        AI モデル（MediaPipe、約16 MB）を必要とします。最初に自分の写真を
        使う前にお知らせが表示され、「読み込む」を選んだ場合にのみ、
        ブラウザが <strong>Google LLC</strong>（米国、storage.googleapis.com）の
        サーバーからモデルを取得します。その際 Google は IP アドレスと
        ブラウザの技術情報を受け取りますが、写真は受け取りません。Google は
        EU-US Data Privacy Framework の認証を受けています。法的根拠は
        「読み込む」によるご同意です（GDPR 第6条1項a号）。ブラウザはこの
        選択を記憶し、下記で撤回できます。同意がなければ何も読み込まれ
        ません。用意された顔はそのままでも使えます。詳細：
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>同意の撤回</h2>
      <p>
        このブラウザで与えた同意を確認し、将来に向けて撤回できます。
        その機能がこのページですでに読み込まれている場合は、停止のため
        ページが再読み込みされます。
      </p>
      <div class="legal-consents"></div>

      <h2>お問い合わせ</h2>
      <p>
        ご連絡いただいた場合、お問い合わせに回答するためにその情報を処理します。
        法的根拠は GDPR 第6条第1項(f)、雇用関係の準備に関する場合は
        第6条第1項(b)です。メッセージは不要になり、保存義務がなくなった
        時点で削除します。
      </p>

      <h2>あなたの権利</h2>
      <p>
        あなたには、アクセス、訂正、削除、処理の制限、データポータビリティ、
        異議申し立ての権利があります。これらの権利の行使は ${MAIL} まで
        ご連絡ください。
      </p>
      <p>
        また、監督機関に苦情を申し立てることもできます：<br />
        <strong>Österreichische Datenschutzbehörde</strong>（オーストリア
        データ保護庁）、Barichgasse 40–42, 1030 Wien、${DSB}
      </p>
    `),
  },
  ar: {
    title: "سياسة الخصوصية",
    html: `
      <h1 class="legal-title">سياسة الخصوصية</h1>

      <h2>المسؤول عن المعالجة</h2>
      <p>
        كيفن شابرل (Kevin Schaberl)، أوتنسهايم، النمسا<br />
        ${MAIL}
      </p>

      <h2>ما لا يفعله هذا الموقع</h2>
      <p>
        لا ملفات تعريف ارتباط (Cookies). لا أدوات تحليل أو تتبّع. الخط
        والصور والبرامج النصية كلها موجودة على هذا الخادم. مجرد زيارة هذا
        الموقع لا يُرسل أي طلب إلى أي مزوّد آخر غير مزوّد الاستضافة نفسه.
        هناك ثلاث ميزات تحمّل محتوى من أطراف ثالثة — لكن فقط عندما تنقر
        عليها بنفسك وتوافق (انظر «مشغّل الموسيقى» و«برامج Java في المتصفح»
        و«أداة الوجه»).
      </p>
      <p>
        في التخزين المحلي لمتصفحك يحفظ الموقع فقط إعداداتك (اللغة، الوضع
        الفاتح/الداكن)، وما إذا كانت المقدّمة قد عُرضت في هذه الجلسة، و—إن
        منحتها—موافقاتك. يبقى ذلك على جهازك ولا يُرسل إليّ.
      </p>

      <h2>الاستضافة وسجلات الخادم</h2>
      <p>
        يُقدَّم الموقع عبر <strong>Vercel Inc.</strong> وعند الوصول إليه
        تعالج Vercel بيانات وصول تقنية — منها عنوان IP والوقت والعنوان
        المطلوب ومعرّف المتصفح — في سجلات الخادم. هذا أمر لا مفر منه لتشغيل
        الموقع. الأساس القانوني هو المصلحة المشروعة في تقديم آمن تقنيًا،
        المادة 6 الفقرة 1 البند (f) من اللائحة العامة لحماية البيانات
        (GDPR / DSGVO).
      </p>
      <p>
        <strong>النقل إلى الولايات المتحدة:</strong> يقع مقر Vercel Inc.
        في الولايات المتحدة، وبالتالي يتم نقل البيانات إلى دولة ثالثة.
        Vercel معتمدة وفق إطار خصوصية البيانات بين الاتحاد الأوروبي
        والولايات المتحدة (EU-US Data Privacy Framework)، وتُطبَّق إضافةً
        إلى ذلك البنود التعاقدية القياسية للمفوضية الأوروبية. ورغم ذلك لا
        يمكن استبعاد وصول السلطات الأمريكية بشكل كامل.
      </p>

      <h2>مشغّل الموسيقى (YouTube)</h2>
      <p>
        يشغّل زر التشغيل في رأس الصفحة قائمة تشغيل على YouTube. النقرة الأولى
        تعرض إشعارًا فقط؛ ولا يُحمَّل المشغّل إلا عندما تختار فيه «تشغيل» — من
        <strong>Google Ireland Limited</strong> (Gordon House, Barrow
        Street, Dublin 4، أيرلندا) في وضع الخصوصية المحسّن
        (youtube-nocookie.com). عندها تتلقى Google على الأقل عنوان IP
        الخاص بك وبيانات تقنية عن المتصفح، وقد يخزّن YouTube بيانات على
        جهازك أثناء التشغيل (مثلًا في التخزين المحلي). قد تُنقل البيانات إلى
        Google LLC في الولايات المتحدة؛ وGoogle معتمدة وفق إطار EU-US Data
        Privacy Framework. الأساس القانوني هو موافقتك التي تمنحها بزر «تشغيل»
        (المادة 6 الفقرة 1 البند (a) من GDPR، والمادة 165 الفقرة 3 من
        TKG 2021). يتذكّر متصفحك هذا الاختيار (localStorage) حتى لا يظهر
        الإشعار في كل زيارة؛ ويمكنك سحب الموافقة في أي وقت أدناه تحت
        «سحب الموافقة» أو بحذف بيانات هذا الموقع من متصفحك. بدون موافقة لا يتم أي اتصال. المزيد:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>برامج Java في المتصفح (CheerpJ)</h2>
      <p>
        يشغّل العرض الحي «Grundlagen» برامج Java مباشرة في المتصفح. ولهذا
        يلزم بيئة التشغيل CheerpJ من <strong>Leaning Technologies Ltd.</strong>
        (المملكة المتحدة). يعرض العرض أولًا إشعارًا، ولا يُحمَّل CheerpJ إلا
        عندما تختار فيه «تشغيل» (cjrtnc.leaningtech.com). عندها يتلقى المزوّد عنوان IP الخاص بك
        وبيانات تقنية عن المتصفح، وقد يخزّن CheerpJ ملفات مؤقتًا في تخزين
        المتصفح (IndexedDB). صدر بشأن المملكة المتحدة قرار كفاية من
        المفوضية الأوروبية. الأساس القانوني هو موافقتك التي تمنحها بزر «تشغيل»
        (المادة 6 الفقرة 1 البند (a) من GDPR، والمادة 165 الفقرة 3 من
        TKG 2021). يتذكّر متصفحك هذا الاختيار، ويمكنك سحبه أدناه. بدون
        موافقة لا يُحمَّل شيء.
      </p>

      <h2>أداة الوجه (FaceDots)</h2>
      <p>
        في مشروع «FaceDots» يمكنك تحويل صورة لك إلى نقاط أو ASCII أو قماش.
        تُعالَج الصورة في متصفحك فقط ولا تُرفع إلى أي مكان. لقصّ الرأس تحتاج
        الأداة إلى نموذج ذكاء اصطناعي من Google ‏(MediaPipe، حوالي 16
        ميغابايت). قبل أول صورة خاصة بك يظهر تنبيه؛ وفقط عندما تختار
        «تحميل» يجلب متصفحك النموذج من خوادم <strong>Google LLC</strong>
        (الولايات المتحدة، storage.googleapis.com). تحصل Google عندها على
        عنوان IP الخاص بك وبيانات تقنية عن المتصفح، لكن ليس على صورتك. Google
        معتمدة وفق إطار EU-US Data Privacy Framework. الأساس القانوني هو
        موافقتك التي تمنحها بزر «تحميل» (المادة 6 (1) (أ) من اللائحة العامة
        لحماية البيانات). يتذكّر متصفحك هذا الاختيار، ويمكنك سحبه أدناه. بدون
        موافقة لا يُحمَّل أي شيء — والوجه المُعدّ يعمل على أي حال. المزيد:
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
      </p>

      <h2>سحب الموافقة</h2>
      <p>
        هنا ترى ما وافقت عليه في هذا المتصفح، ويمكنك سحبه بأثر مستقبلي. إذا
        كانت الميزة محمّلة بالفعل في هذه الصفحة، تُعاد تحميل الصفحة لإيقافها.
      </p>
      <div class="legal-consents"></div>

      <h2>التواصل معي</h2>
      <p>
        إذا راسلتني، فإنني أعالج بياناتك للرد على استفسارك. الأساس القانوني
        هو المادة 6 الفقرة 1 البند (f) من GDPR، وفي حال التمهيد لعلاقة عمل
        المادة 6 الفقرة 1 البند (b). أحذف الرسائل بمجرد أن تنتفي الحاجة
        إليها ولا يوجد التزام بالاحتفاظ بها.
      </p>

      <h2>حقوقك</h2>
      <p>
        لك الحق في الاطلاع والتصحيح والحذف وتقييد المعالجة ونقل البيانات
        والاعتراض. لممارسة هذه الحقوق تواصل عبر ${MAIL}.
      </p>
      <p>
        كما يمكنك تقديم شكوى إلى السلطة الرقابية:<br />
        <strong>Österreichische Datenschutzbehörde</strong> (هيئة حماية
        البيانات النمساوية)، Barichgasse 40–42, 1030 Wien، ${DSB}
      </p>
    `,
  },
});
