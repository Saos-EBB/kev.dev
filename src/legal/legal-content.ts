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
        Keine Cookies. Keine Analyse- oder Trackingwerkzeuge. Keine
        Einbindung von Ressourcen Dritter — Schriftart, Bilder und
        Skripte liegen alle auf diesem Server. Beim Besuch dieser
        Seite geht keine Anfrage an einen anderen Anbieter außer dem
        Hoster selbst.
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
        No cookies. No analytics or tracking tools. No third-party
        resources — font, images and scripts are all served from this
        server. Visiting this site sends no request to any provider
        other than the host itself.
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
        Никаких ресурсов третьих лиц — шрифт, изображения и скрипты
        находятся на этом сервере. При посещении сайта запросы не
        отправляются никакому другому поставщику, кроме самого хостинга.
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
        第三者のリソースも読み込みません — フォント、画像、スクリプトはすべて
        このサーバー上にあります。本サイトを閲覧しても、ホスティング事業者以外の
        事業者へリクエストが送られることはありません。
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
        لا ملفات تعريف ارتباط (Cookies). لا أدوات تحليل أو تتبّع. لا موارد
        من أطراف ثالثة — الخط والصور والبرامج النصية كلها موجودة على هذا
        الخادم. عند زيارة هذا الموقع لا يُرسل أي طلب إلى أي مزوّد آخر غير
        مزوّد الاستضافة نفسه.
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
