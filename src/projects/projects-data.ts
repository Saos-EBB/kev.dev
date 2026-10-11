// The project cards. Copy is taken verbatim from the handoff — do
// not reword. Order follows the groups (see ProjectGroup): the three big
// ones (YourBrand, Jobbot, kev.dev), then the tools, then what was built
// along the way to learn something for a project. `open` entries are unresolved questions that stay
// visible on the card until Kevin answers them. `layout` picks the card's
// own arrangement and signature visual (project-visuals.ts), `accent` its
// color — every project looks like itself, on the same grid.

import type { ProjectCard } from "./project-cards";
import { localizeCard } from "./projects-i18n";

const cards: ProjectCard[] = [
  {
    id: "yourbrand",
    group: "big",
    layout: "blueprint",
    kind: "White-Label-SaaS",
    // YourBrand's own brand pink (its default tenant's primary color).
    accent: "#FF5FC8",
    learnGoal:
      "Wollte lernen, wie man Software modular baut und ein echtes Produkt mit Businesslogik auf die Beine stellt.",
    title: "YourBrand",
    claim:
      "Beweist Architektur-Denken — modulares White-Label-SaaS, echt multi-tenant, jeder Layer bewusst entworfen.",
    points: ["White-Label-SaaS für Matching & Community — vom Schachklub bis zur Partnerbörse", "Multi-tenant umgesetzt: eigene Datenbank pro Mandant, Marke & Module aus einer Config", "Solo gebaut — Prototyp in rund zwei Monaten, dazu eine Mandanten-Console"],
    what: "Mein erster Versuch, echte Software zu bauen: ein modulares White-Label-SaaS für Matching und sozialen Kontakt. Der Kern ist neutral gebaut — dieselbe Plattform trägt einen Schachklub, eine Theatergruppe, eine Partnerbörse oder jede andere Community, die Menschen zusammenbringen will. Multi-tenant umgesetzt: Jeder Mandant läuft aus demselben Image mit eigener Datenbank, eigenem Speicher-Bucket und eigenem Redis-Bereich, bringt seine eigene Marke mit und bekommt nur die Module, die er bucht — ein neuer Mandant ist eine Config-Datei und ein Befehl. Verwaltet wird das über eine Mandanten-Console: alle Mandanten mit Kennzahlen und Verlauf im Überblick, Config-Editor mit Prüfung und Diff, Farb-Editor mit Kontrastcheck, Logo-Upload. Als konkrete Ausbaustufe eine barrierefreie Plattform: Leichte Sprache, Kontrast- und Schriftgrößen-Optionen, intuitives Design, per i18n auf jede Sprache erweiterbar (aktuell Deutsch).",
    tags: [
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Row-Level Security",
      "PostGIS",
      "WebSockets",
      "Stripe",
      "Docker",
    ],
    meta: "Solo · April–Juni 2026: ca. 450 h, selbst gewähltes Abschlussprojekt · seitdem ca. 200–300 h mehr — Loadtests & Dashboard ~60–90 h, Multi-Tenant & Mandanten-Console ~35–55 h — und es läuft weiter",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/Saos-EBB/WhiteLabel-SaaS---Comunity-Plattform-",
      },
      { label: "Live-Demo auf Anfrage (hoste ich gern)" },
    ],
    decisions: [
      "Silo-Multitenancy statt geteilter Datenbank: eigene DB, eigener Bucket und eigener Redis-Prefix pro Mandant — DSGVO-Daten physisch getrennt, keine Query musste umgebaut werden",
      "Eine tenant.json pro Mandant als einzige Quelle: Marke, Theme, Sprachen, Tier und Module — beim Start validiert, Module zu-/abschaltbar, Abrechnung nach gebuchtem Umfang",
      "Steckbare Module: Jedes Feature ist ein eigenes NestJS-Modul hinter einem Schalter in der tenant.json — abgeschaltete werden gar nicht erst geladen. Neues Feature heißt: Modul bauen, in der Registry eintragen, beim Mandanten anschalten; der Kern bleibt unberührt. So entsteht gerade der Shop: Essen, Merch, Lizenz-Keys und Freischalt-Codes — auffällige Bestellungen halten an, bis ein Mensch entscheidet",
      "Mandanten-Console statt Handarbeit: Übersicht und Kennzahlen aller Mandanten, Editor mit Diff und Auto-Commit, 19 Farb-Tokens mit WCAG-Kontrastprüfung, Logo-Upload mit erzeugtem Favicon",
      "Row-Level Security als Grundzustand: Schutz „von unten“, Sichtbarkeit steuert jede Person selbst",
      "PostGIS für Entfernungsberechnung direkt auf DB-Ebene — leichter als im Backend",
      "Barrierefreiheit von Anfang an (Leichte Sprache, Kontrast, Schriftgröße, i18n-ready)",
      "Moderation, die trägt: Melde-System, Sofort-Sperren/Entsperren, alles mit Notizen",
      "DSGVO-konform durchgezogen (Kopfweh ohne Ende)",
      "Bewusst nicht alles gebaut, was ginge: manche Mechaniken aus ethischen Gründen zurückgehalten",
      "Architektur, Datenmodell und Businesslogik von mir. Die APIs habe ich selbst gebaut, weil sie mich interessiert haben — den Rest der Umsetzung mit CC als Implementierungs-Agent.",
    ],
    // Desktop ER card: the core's layers (UI.vizLayers order, top to
    // bottom) and every module, from the YourBrand repo's READMEs.
    layers: [
      {
        about: "Hier habe ich Ideen ausprobiert, statt auf Nummer sicher zu gehen — die Regeln, die aus einer Community-Plattform ein Produkt machen.",
        points: [
          "Matching: Swipe-Deck nach gemeinsamen Interessen und Entfernung gewichtet, gegenseitiges Like → Match plus Unterhaltung",
          "Moderation: ab 10 verschiedenen Meldungen sperrt das System selbst, Bans mit Dauer, Strike und Mail",
          "Profanity-Filter auf Bio, Status, Nickname und Chat — die Wortliste wächst zur Laufzeit",
          "Rollen user · admin · org · owner — genau ein Owner, von der Datenbank erzwungen",
          "Module reden über interne Events (EventEmitter2) statt sich direkt aufzurufen",
        ],
      },
      {
        about: "Die APIs habe ich selbst gebaut, weil sie mich interessiert haben — Postman war dabei Gold.",
        points: [
          "REST unter /api/v1, je Feature ein NestJS-Modul: Auth, Profil, Chat, Matching, Moderation, Admin, DSGVO …",
          "Socket.io auf demselben Port: jede Person in ihrem eigenen Raum — Nachrichten, Tippen, Gelesen und Bans in Echtzeit",
          "Stripe Embedded Checkout mit Webhooks; ein täglicher Cron erinnert 3 Tage vor Abo-Ende",
          "Schweres läuft im Worker (BullMQ): Bilder auf WebP verkleinern, DSGVO-PDF bauen und mailen",
          "Abgeschaltetes Modul → 404, noch vor dem Login-Check",
        ],
      },
      {
        about: "Schutz von unten: Was die Datenbank nicht herausgibt, kann keine API verraten.",
        points: [
          "Row-Level Security als Grundzustand; Bio, Stadt, Alter & Co. schaltet jede Person einzeln sichtbar",
          "E-Mail AES-256-verschlüsselt, gefunden über einen SHA-256-Hash — kein Klartext in der DB",
          "JWT 15 Minuten, Refresh-Token 30 Tage mit Einmal-Rotation im HttpOnly-Cookie",
          "bcrypt (Kosten 12) im eigenen Thread-Pool — im Loadtest rund 3× mehr Logins",
          "Rate-Limits in Redis (global 100/min, Login 5/min) — halten über mehrere Instanzen",
          "Geschützte Personen tauchen schon auf DB-Ebene in keiner Suche auf",
        ],
      },
      {
        about: "Zwei Wochen DB-Brainstorm, bevor die erste Zeile Backend stand.",
        points: [
          "PostgreSQL 16 + PostGIS 3.4: Umkreissuche per ST_DWithin direkt in der Datenbank",
          "Städte-Autocomplete aus GeoNames-Daten, auf Europa erweitert",
          "Schema als nummerierte SQL-Migrationen — jede Mandanten-DB zieht sie beim Start nach",
          "Eine eigene Datenbank pro Mandant: DSGVO-Daten physisch getrennt",
          "Soft-Deletes: ein Konto ist 30 Tage reaktivierbar; DSGVO-Auskunft als PDF (Art. 15)",
        ],
      },
    ],
    // Same numbers as `meta` and `origin` above.
    hoursChart: [
      ["Prototyp, April–Juni", 450, 450],
      ["seitdem, gesamt", 200, 300],
      ["davon Loadtests & Dashboard", 60, 90],
      ["davon Multi-Tenant & Console", 35, 55],
    ],
    timelineChart: [
      ["DB-Entwurf & Backend", 0, 0],
      ["Frontend", 1, 2],
      ["Docker & Seed-Generator", 3, 3],
      ["Loadtests & Dashboard", 3, 4],
      ["Skalierung: Redis, Storage, Queue", 5, 5],
      ["Multi-Tenant & Console", 6, 6],
      ["Shop-Modul — gerade", 6, 6],
    ],
    moduleInfo: {
      chat: {
        about: "Kontaktanfragen, Unterhaltungen und Nachrichten in Echtzeit.",
        points: [
          "Erst die Anfrage, dann der Chat — niemand schreibt ungefragt",
          "Tippt gerade und Gelesen live per WebSocket",
          "Jede Nachricht läuft durch den Profanity-Filter",
          "Bleibt immer geladen, weil das Gateway auch Benachrichtigungen und Bans zustellt — abgeschaltet sind nur Routen und Chat-Events",
        ],
      },
      matching: {
        about: "Kennenlernen per Swipe.",
        points: [
          "Das Deck sortiert nach gemeinsamen Interessen und Entfernung",
          "Gegenseitiges Like → Match, und die Unterhaltung ist gleich angelegt",
          "Liste aller Matches; gemeinsame Interessen sind markiert",
          "Ab Premium, braucht Chat",
        ],
      },
      payments: {
        about: "Abos über Stripe.",
        points: [
          "Embedded Checkout — bezahlt wird, ohne die Seite zu verlassen",
          "Monat, Jahr oder Lifetime; die Preise stellt der Owner selbst ein",
          "Webhooks für Zahlung, Fehlschlag und Kündigung",
          "Erinnerung 3 Tage vor Ablauf, danach läuft das Abo sauber aus",
        ],
      },
      hidden: {
        about: "Die Spielwiese im Dark Mode — Engagement und Monetarisierung.",
        points: [
          "Beef-Battles: öffentliche Duelle von 15 Minuten bis 48 Stunden, das Publikum stimmt ab",
          "Echtzeit-Spiele: Schere-Stein-Papier, TicTacToe, Mastermind, Reaktion",
          "Coin-Wirtschaft mit Stripe-Paketen, Zähne sammeln, Abzeichen mit Ablaufdatum",
          "Wer kneift, geht 24 Stunden ins Exil",
          "Zugang über wechselnde Film-Passwörter",
        ],
      },
      board: {
        about: "Das Schwarze Brett für den Kiez.",
        points: [
          "Aushänge: Suche, Biete, Verschenke, Treffen",
          "Sichtbar für die Straße (150 m), 500 m, 1 km, den Kiez (3 km) oder alle",
          "„Zettel abreißen“ schickt eine Kontaktanfrage",
          "Laufen nach 14 Tagen ab; öffentlich nur mit Zustimmung und nie für geschützte Personen",
          "Braucht Chat",
        ],
      },
      caretaker: {
        about: "Ein Konto betreut wenige andere, wie ein Eltern-Konto.",
        points: [
          "Die betreute Person stimmt zu und kann Rechte ändern oder die Betreuung beenden",
          "Rechte: Nachrichten mitlesen, Schutz einstellen",
          "Bei geschützten Personen wartet ein neuer Kontakt auf die Freigabe",
        ],
      },
      orgs: {
        about: "Ein Träger mit seinem Team.",
        points: [
          "Betreuungen gehören zur Organisation — alle auf einen Blick",
          "Anlegen dürfen nur Plattform-Admin und Owner",
          "Braucht Betreuung",
        ],
      },
      shop: {
        about: "Das Modul, an dem ich gerade baue — der Test, ob der Kern hält, was er verspricht.",
        points: [
          "Essen (abholen oder liefern), Merch, Lizenz-Keys und Freischalt-Codes — bis ~1000 Artikel mit Filtern",
          "Stripe reserviert nur; Auffälliges (Doppelbuchung, hoher Betrag, Radar-Risiko) hält das System an, ein Mensch entscheidet mit Begründung",
          "Erst mit der Annahme: abbuchen, ausliefern, Rechnung nach § 14 UStG per Mail",
          "Braucht Bezahlung und eine USt-IdNr. oder Steuernummer im Mandanten",
        ],
      },
    },
    challenge:
      "Die eigentliche Herausforderung war der Umfang: kompletter Fullstack solo in zwei Monaten. Die Basis — DB, Security, API — ist sauber und bewusst gebaut. Der Business-Logic-Layer darüber ist der experimentelle Teil: hier habe ich Ideen ausprobiert, statt auf Nummer sicher zu gehen — und dabei am meisten gelernt.",
    origin:
      "April: 2 Wochen DB-Brainstorm (Row-Level Security, PostGIS), dann das Backend (Postman war Gold beim API-Bauen) → Mai/Juni: Frontend obendrauf, Layouts und Verhalten durchgespielt, bis es saß → Juli: alles in Docker, Seed-Generator für Fake-User → Ende Juli/August: Loadtests mit eigenem Live-Dashboard, drei Modi (Login-Kapazität, Nutzer-Mix, Endpoint-Raten) → September: Skalierungs-Umbau — Redis, Object Storage, Job-Queue mit Worker, bcrypt im eigenen Thread-Pool; Hosting über ngrok, Vercel und Railway ausprobiert und wieder verworfen → Oktober: Multi-Tenant mit eigener DB, eigenem Bucket und Redis pro Mandant, Mandanten-Console, neue Module (Schwarzes Brett, Betreuung, Organisationen) → gerade: das Shop-Modul.",
    // Screens from the YourBrand repo: one codebase, five tenants, each in
    // its own accordion section (facet-overlay.ts).
    tenantsIntro:
      "YourBrand ist kein fertiges Produkt, sondern ein Kern, aus dem viele werden können. Die fünf Mandanten unten laufen alle aus demselben Code und demselben Image — was sie unterscheidet, steht nur in ihrer tenant.json: Marke, Farben, Schrift, Navigation, Sprachen, Paket und Module. Vom Studenten-Dating über das Schwarze Brett im Kiez bis zur barrierearmen Plattform fürs betreute Wohnen. Verwaltet werden alle über die Mandanten-Console: Übersicht mit Kennzahlen und Verlauf, Config-Editor mit Prüfung und Diff, Farb-Editor mit Kontrastcheck, Logo-Upload — ein neuer Mandant ist eine Config-Datei und ein Befehl.",
    tenants: [
      {
        name: "YourBrand",
        color: "#FF5FC8",
        kind: "Die neutrale Basis",
        about:
          "Die Grundausstattung, von der jeder Mandant ausgeht: dunkles Candy-Theme in Pink, Lila und Hellblau, Sidebar-Navigation, alle neun Sprachen inklusive Leichter Sprache und Leetspeak. Zeigt die Plattform im vollen Paket — Entdecken mit Umkreissuche, Matching per Swipe, Chat, Benachrichtigungen und das Admin-Dashboard mit Moderation und Kennzahlen.",
        tier: "Premium",
        modules: ["chat", "matching", "payments", "hidden"],
        video: { src: "/projects/yourbrand/yourbrand/clickthrough.mp4", poster: "/projects/yourbrand/yourbrand/clickthrough-poster.webp", alt: "Einmal durch YourBrand geklickt" },
        screenshots: [
          { src: "/projects/yourbrand/yourbrand/00-login.webp", mobile: "/projects/yourbrand/yourbrand/mobile/00-login.webp", alt: "Login" },
          { src: "/projects/yourbrand/yourbrand/01-dashboard.webp", mobile: "/projects/yourbrand/yourbrand/mobile/01-dashboard.webp", alt: "Dashboard — Moderation, Plattform-Kennzahlen und Mitgliederwachstum für Owner und Admins" },
          { src: "/projects/yourbrand/yourbrand/02-discover.webp", mobile: "/projects/yourbrand/yourbrand/mobile/02-discover.webp", alt: "Entdecken — Filter nach Stadt, Umkreis, Alter und Online-Status" },
          { src: "/projects/yourbrand/yourbrand/03-matches.webp", mobile: "/projects/yourbrand/yourbrand/mobile/03-matches.webp", alt: "Matching per Swipe, gemeinsame Interessen markiert" },
          { src: "/projects/yourbrand/yourbrand/04-chat.webp", mobile: "/projects/yourbrand/yourbrand/mobile/04-chat.webp", alt: "Chat-Übersicht" },
          { src: "/projects/yourbrand/yourbrand/05-chat-conversation.webp", mobile: "/projects/yourbrand/yourbrand/mobile/05-chat-conversation.webp", alt: "Chat" },
          { src: "/projects/yourbrand/yourbrand/06-notifications.webp", mobile: "/projects/yourbrand/yourbrand/mobile/06-notifications.webp", alt: "Benachrichtigungen" },
          { src: "/projects/yourbrand/yourbrand/07-profile.webp", mobile: "/projects/yourbrand/yourbrand/mobile/07-profile.webp", alt: "Profil — Interessen und rote Flaggen" },
          { src: "/projects/yourbrand/yourbrand/08-settings.webp", mobile: "/projects/yourbrand/yourbrand/mobile/08-settings.webp", alt: "Einstellungen — Design & Barrierefreiheit, Sichtbarkeit, Konto, Sicherheit" },
        ],
      },
      {
        name: "Campus Match",
        color: "#F0568C",
        kind: "Dating & Freundschaften an der Uni",
        about:
          "Eine Kennenlern-App für Studierende: Leiste oben statt Sidebar, dunkles Pink und Flieder, Bricolage Grotesque und DM Sans. Gebucht ist Premium — Entdecken und Matching per Swipe sind dabei, die Hidden Zone ist bewusst abgeschaltet. Sprachen: Deutsch und Englisch, für internationale Studierende.",
        tier: "Premium",
        modules: ["chat", "matching", "payments"],
        video: { src: "/projects/yourbrand/campus-match/clickthrough.mp4", poster: "/projects/yourbrand/campus-match/clickthrough-poster.webp", alt: "Einmal durch Campus Match geklickt" },
        screenshots: [
          { src: "/projects/yourbrand/campus-match/00-login.webp", mobile: "/projects/yourbrand/campus-match/mobile/00-login.webp", alt: "Login" },
          { src: "/projects/yourbrand/campus-match/01-dashboard.webp", mobile: "/projects/yourbrand/campus-match/mobile/01-dashboard.webp", alt: "Dashboard mit Kennzahlen" },
          { src: "/projects/yourbrand/campus-match/02-discover.webp", mobile: "/projects/yourbrand/campus-match/mobile/02-discover.webp", alt: "Entdecken" },
          { src: "/projects/yourbrand/campus-match/03-matches.webp", mobile: "/projects/yourbrand/campus-match/mobile/03-matches.webp", alt: "Matching per Swipe" },
          { src: "/projects/yourbrand/campus-match/04-chat.webp", mobile: "/projects/yourbrand/campus-match/mobile/04-chat.webp", alt: "Chat-Übersicht" },
          { src: "/projects/yourbrand/campus-match/05-chat-conversation.webp", mobile: "/projects/yourbrand/campus-match/mobile/05-chat-conversation.webp", alt: "Chat in Pink und Flieder" },
          { src: "/projects/yourbrand/campus-match/06-profile.webp", mobile: "/projects/yourbrand/campus-match/mobile/06-profile.webp", alt: "Profil" },
          { src: "/projects/yourbrand/campus-match/07-settings.webp", mobile: "/projects/yourbrand/campus-match/mobile/07-settings.webp", alt: "Einstellungen" },
        ],
      },
      {
        name: "KiezConnect",
        color: "#F0743F",
        kind: "Schwarzes Brett für die Nachbarschaft",
        about:
          "Ein Nachbarschaftsnetz für einen Kiez-Verein: hell, Ziegelrot, Archivo, Aushänge mit Abreißzetteln wie am echten Brett. Das kleinste Paket plus das Modul Schwarzes Brett: Suche, Biete, Verschenke, Treffen — sichtbar für die Straße, 500 m, 1 km, den Kiez oder alle. „Zettel abreißen“ schickt eine Kontaktanfrage, Aushänge laufen nach 14 Tagen ab, öffentliche stehen schon auf der Login-Seite. Kein Matching — hier geht's um Hilfe, nicht ums Daten. Sprachen: Deutsch, Englisch, Leichte Sprache.",
        tier: "Core",
        modules: ["chat", "payments", "board"],
        video: { src: "/projects/yourbrand/kiez/clickthrough.mp4", poster: "/projects/yourbrand/kiez/clickthrough-poster.webp", alt: "Einmal durch KiezConnect geklickt" },
        screenshots: [
          { src: "/projects/yourbrand/kiez/00-login.webp", mobile: "/projects/yourbrand/kiez/mobile/00-login.webp", alt: "Login — öffentliche Aushänge schon vor der Anmeldung" },
          { src: "/projects/yourbrand/kiez/01-dashboard.webp", mobile: "/projects/yourbrand/kiez/mobile/01-dashboard.webp", alt: "Dashboard — Aushänge aus der Nähe" },
          { src: "/projects/yourbrand/kiez/02-board.webp", mobile: "/projects/yourbrand/kiez/mobile/02-board.webp", alt: "Brett — nach Umkreis und Art filtern" },
          { src: "/projects/yourbrand/kiez/03-board-notice.webp", mobile: "/projects/yourbrand/kiez/mobile/03-board-notice.webp", alt: "Aushang — Zettel abreißen und schreiben" },
          { src: "/projects/yourbrand/kiez/04-board-new.webp", mobile: "/projects/yourbrand/kiez/mobile/04-board-new.webp", alt: "Neuer Aushang — wer ihn sieht, bestimmt der Umkreis" },
          { src: "/projects/yourbrand/kiez/05-requests.webp", mobile: "/projects/yourbrand/kiez/mobile/05-requests.webp", alt: "Kontaktanfragen" },
          { src: "/projects/yourbrand/kiez/06-chat.webp", mobile: "/projects/yourbrand/kiez/mobile/06-chat.webp", alt: "Chat-Übersicht" },
          { src: "/projects/yourbrand/kiez/07-chat-conversation.webp", mobile: "/projects/yourbrand/kiez/mobile/07-chat-conversation.webp", alt: "Chat" },
          { src: "/projects/yourbrand/kiez/08-profile.webp", mobile: "/projects/yourbrand/kiez/mobile/08-profile.webp", alt: "Profil" },
        ],
      },
      {
        name: "Miteinander",
        color: "#8DB4FF",
        kind: "Barrierearm, für betreutes Wohnen",
        about:
          "Für einen Träger im ambulant betreuten Wohnen: Leichte Sprache als Standard, Atkinson Hyperlegible in 18 px, breite Sidebar mit großen Feldern, Vorlesen, fertige Antworten im Chat und ein Hilfe-Knopf, der immer sichtbar ist. Paket Connect ohne Bezahlung, dazu Betreuung und Organisation: Ein Konto betreut wenige andere, die betreute Person stimmt zu und kann Rechte ändern oder die Betreuung beenden; bei geschützten Personen wartet ein neuer Kontakt auf die Freigabe. Der Träger sieht sein Team und alle Betreuungen auf einen Blick.",
        tier: "Connect",
        modules: ["chat", "caretaker", "orgs"],
        video: { src: "/projects/yourbrand/miteinander/clickthrough.mp4", poster: "/projects/yourbrand/miteinander/clickthrough-poster.webp", alt: "Einmal durch Miteinander geklickt" },
        screenshots: [
          { src: "/projects/yourbrand/miteinander/00-login.webp", mobile: "/projects/yourbrand/miteinander/mobile/00-login.webp", alt: "Login in Leichter Sprache" },
          { src: "/projects/yourbrand/miteinander/01-dashboard.webp", mobile: "/projects/yourbrand/miteinander/mobile/01-dashboard.webp", alt: "Start — „Meine Leute“ und Kennzahlen" },
          { src: "/projects/yourbrand/miteinander/02-care.webp", mobile: "/projects/yourbrand/miteinander/mobile/02-care.webp", alt: "Betreuung — wen ich betreue, Freigaben, Schutz" },
          { src: "/projects/yourbrand/miteinander/03-org.webp", mobile: "/projects/yourbrand/miteinander/mobile/03-org.webp", alt: "Organisation — betreute Personen, Rechte, Team" },
          { src: "/projects/yourbrand/miteinander/04-requests.webp", mobile: "/projects/yourbrand/miteinander/mobile/04-requests.webp", alt: "Kontaktanfragen" },
          { src: "/projects/yourbrand/miteinander/05-chat.webp", mobile: "/projects/yourbrand/miteinander/mobile/05-chat.webp", alt: "Nachrichten" },
          { src: "/projects/yourbrand/miteinander/06-chat-conversation.webp", alt: "Chat mit Vorlesen und fertigen Antworten" },
          { src: "/projects/yourbrand/miteinander/07-settings.webp", mobile: "/projects/yourbrand/miteinander/mobile/07-settings.webp", alt: "Einstellungen" },
        ],
      },
      {
        name: "Underground",
        color: "#FFC400",
        kind: "Gaming-Crew mit Hidden Zone",
        about:
          "Eine Community für eine Gaming-Crew: dunkel, Signalgelb, Big Shoulders und Barlow, die Navigation als Linienplan mit eigenen Menünamen (Leitstand, Durchsagen, Stellwerk). Volles Premium inklusive Hidden Zone mit öffentlichen Beef-Duellen, Münzen und Bestenliste. Sprachen: Deutsch, Englisch und Leetspeak.",
        tier: "Premium",
        modules: ["chat", "matching", "payments", "hidden"],
        video: { src: "/projects/yourbrand/underground/clickthrough.mp4", poster: "/projects/yourbrand/underground/clickthrough-poster.webp", alt: "Einmal durch Underground geklickt" },
        screenshots: [
          { src: "/projects/yourbrand/underground/00-login.webp", mobile: "/projects/yourbrand/underground/mobile/00-login.webp", alt: "Login" },
          { src: "/projects/yourbrand/underground/01-dashboard.webp", mobile: "/projects/yourbrand/underground/mobile/01-dashboard.webp", alt: "Leitstand — das Dashboard am Linienplan" },
          { src: "/projects/yourbrand/underground/03-discover.webp", mobile: "/projects/yourbrand/underground/mobile/03-discover.webp", alt: "Crew — Entdecken unter eigenem Namen" },
          { src: "/projects/yourbrand/underground/04-notifications.webp", mobile: "/projects/yourbrand/underground/mobile/04-notifications.webp", alt: "Durchsagen — Beef-Ergebnisse aus der Hidden Zone" },
          { src: "/projects/yourbrand/underground/05-chat.webp", mobile: "/projects/yourbrand/underground/mobile/05-chat.webp", alt: "Chat-Übersicht" },
          { src: "/projects/yourbrand/underground/06-chat-conversation.webp", mobile: "/projects/yourbrand/underground/mobile/06-chat-conversation.webp", alt: "Chat" },
          { src: "/projects/yourbrand/underground/07-profile.webp", mobile: "/projects/yourbrand/underground/mobile/07-profile.webp", alt: "Profil" },
        ],
      },
    ],
    facets: ["live-demo", "screens", "b2b"],
  },
  {
    id: "tschobbo",
    group: "big",
    layout: "inbox",
    kind: "Bewerbungs-Bot",
    accent: "var(--note-5)",
    learnGoal:
      "Keine Lust auf repetitive Bewerbungssuche — und dabei Scraping, LLM und Regex lernen.",
    title: "TschoBBo",
    claim:
      "Beweist Urteilsvermögen — lokale Sprachmodelle statt Cloud, Versand bewusst manuell.",
    points: ["Scrapt österreichische Jobbörsen, filtert per Regex", "Schreibt Anschreiben lokal mit llama.cpp und Gemma 4 — keine Cloud", "Versand bleibt bewusst manuell"],
    what: "Mein persönliches Bewerbungs-Tool. Scrapt österreichische Jobbörsen, speichert die Stellen und generiert deutsche Anschreiben lokal per llama.cpp mit Gemma 4. Jobseiten absuchen ist repetitiv — das übernimmt der Bot, die Entscheidung bleibt bei mir. Mit dabei: Tschobbo, ein lila Slime-Blob mit Sonnenbrille und endlosen Armen, der beim Scrapen sichtbar für dich arbeitet. Der Gedanke dahinter — Software, die sich lebendig anfühlt und an die man sich bindet. Nervt er, ist er mit einem Klick weg. Die Pipeline: Scrape → Filter → Anschreiben → Review → Gmail-Entwurf; per Knopf läuft die ganze Kette bis zum Entwurf automatisch, abgeschickt wird immer von mir. Ein Gmail-Sync sortiert Gesendetes und Absagen ein, ein Kalender zeigt den Verlauf, und fürs AMS druckt er einen Bewerbungsnachweis.",
    tags: ["TypeScript", "Node.js", "Playwright", "llama.cpp", "Regex"],
    meta: "Solo · aus Eigeninteresse gebaut · Sessions von 20 Min bis 4 h",
    links: [
      { label: "GitHub (public)", href: "https://github.com/Saos-EBB/jobsuche-apply-bot" },
      { label: "läuft lokal — Screenshots in den Details" },
    ],
    decisions: [
      "Lokal statt Cloud: llama.cpp auf der eigenen Maschine — meine Daten bleiben hier",
      "Modell nach Messung gewählt: von Ollama/Mistral auf llama.cpp mit Gemma 4 26B (MoE) — gleicher Prompt, gleiche Jobs: Anschreiben rund viermal schneller, weniger Floskeln, keine erfundenen Behauptungen mehr",
      "Versand bleibt manuell: der Bot generiert, feuert aber nie selbst eine Bewerbung ab",
      "Filter über Regex, nicht LLM: was ein Regex in Sekunden macht, muss kein Sprachmodell langsam erledigen — LLM nur noch fürs Anschreiben",
      "Mail-Client-UI (Gmail/Proton als Referenz) für maximale Übersicht",
      "Fünf Portale hinter einem Scraper-Interface: karriere.at, devjobs.at, LinkedIn, AMS, jobs.at — Playwright nur dort, wo eine Seite ohne Browser nichts hergibt (AMS, devjobs.at)",
      "Eigene JSON-Ablage statt Datenbank: ein Job = eine Datei, das Anschreiben als .md daneben, geschrieben über Temp-Datei + rename — nie halb geschriebene Daten",
      "Das Modell hinter einer Schnittstelle (LlmProvider): llama.cpp oder OpenAI-kompatibel, Modelle als Presets — Wechsel ohne Codeänderung",
      "Rund 575 Tests mit node:test gegen Temp-Verzeichnisse und einen lokalen Mock-Server — laufen ohne Netz und ohne Modell",
    ],
    // The architecture as code on the desktop card: the pipeline (stage,
    // file, the job status it leaves behind) and an excerpt of the real
    // types from the JoBBoT repo.
    arch: {
      steps: [
        ["scrape", "scrapers/*.ts", "'new'"],
        ["filter", "lib/filter-runner.ts", "'triaged' · fit"],
        ["anschreiben", "lib/anschreiben.ts", "'generated'"],
        ["review", "ui/", "'freigegeben'"],
        ["gmail", "mail/gmail.ts", "'postausgang' → 'gesendet'"],
      ],
      code: [
        "type JobStatus =",
        "  | 'new' | 'triaged' | 'generated'",
        "  | 'freigegeben' | 'postausgang' | 'gesendet'",
        "  | 'geloescht' | 'fehler' | 'offline';",
        "type Fit = 'matched' | 'offstack' | 'brutal';",
        "",
        "// storage/json-store.ts — one job, one file; temp file + rename",
        "interface Storage {",
        "  save(job: Job): Promise<void>;",
        "  updateStatus(id: string, status: JobStatus): Promise<Job>;",
        "  getBrief(job: { id: string }): Promise<string | null>;",
        "}",
        "",
        "// lib/llm/types.ts — llama.cpp or OpenAI-compatible",
        "interface LlmProvider {",
        "  chat(req: ChatRequest): Promise<string>;",
        "  ensureReady(host?: string): Promise<void>;",
        "}",
        "",
        "// test/ — ~575 tests, node:test, temp dirs + mock server",
      ].join("\n"),
    },
    // Desktop card: the mails behind each folder, from the JoBBoT README.
    mailbox: {
      what: [
        ["Die Pipeline", "Scrape → Filter → Anschreiben → Review → Gmail-Entwurf. Jeder Schritt startet aus der Seitenleiste, läuft im Hintergrund weiter und zeigt seinen Fortschritt, auch wenn man währenddessen woanders klickt. Am Ende kommt eine Kurzbilanz wie „14 neu, 6 dedup“, und die Liste lädt neu."],
        ["Fünf Portale, eine Suche", "karriere.at, devjobs.at, LinkedIn, AMS und jobs.at. Suchbegriffe pro Portal stehen auf einer Einstellungsseite im Browser; jedes Portal beschreibt seine Felder selbst, und dieselbe Prüfung läuft im Formular, im Server und im Scraper. Ein Umkreisfilter wirkt danach auf alle fünf."],
        ["Urteil statt Liste", "Der Regex-Filter sortiert jede Stelle in Match, Offstack oder Brutal. Das Urteil lässt sich in der UI überschreiben, mehrere Jobs auf einmal verschieben, bewerten oder löschen. Duplikate quer über die Portale werden gefunden und zusammengeführt — ein schon geschriebenes Anschreiben wandert mit."],
        ["Nachfassen und Kalender", "Nach drei Tagen ohne Antwort ist eine Bewerbung fällig zum Nachfassen — im selben Gmail-Thread, damit die Antwort wieder zum Job findet. Der Kalender zeigt pro Tag, was rausging, wann nachgehakt wurde und wann Antworten kamen."],
        ["Offline-Archiv", "Beim Scrapen prüft der Bot, ob gespeicherte Inserate noch online sind. Erst wenn ein Einzelabruf es bestätigt, wandert ein Job ins Archiv — taucht er wieder auf, holt ihn derselbe Lauf zurück. Jobs mit eigener Arbeit drin (Anschreiben, Versand) fasst er nie an."],
      ],
      why: [
        ["Repetitiv ist Bot-Arbeit", "Jeden Tag dieselben Portale, dieselben Filter, dieselben Floskeln. Das Suchen, Sortieren und den ersten Entwurf macht der Bot — lesen, entscheiden und abschicken bleibt bei mir."],
        ["Meine Daten bleiben hier", "Lebenslauf, Profil und jede Bewerbung bleiben auf meiner Maschine. Das Sprachmodell läuft lokal, es gibt keine Cloud-Kosten und niemanden, der mitliest."],
        ["Software, die lebt", "Tschobbo greift mit seinen vielen Armen gleichzeitig Inserate, filtert, tippt und sortiert ein. Die Pipeline soll sich nicht wie totes Skript-Output anfühlen, sondern als hätte man jemanden, der für einen arbeitet."],
        ["Lernen am echten Problem", "Scraping mit und ohne Browser, Prompts für ein lokales Modell, Regex für die Filter — jedes davon mit echtem Nutzen statt als Übungsaufgabe."],
      ],
      learned: [
        ["Messen statt raten", "Fünf lokale Modelle auf denselben Testjobs verglichen (guter Fit, falscher Stack, großer Mismatch): eines erfand Skills, die nicht im Profil stehen, eines lief immer in den Timeout, bei einem stieg der RAM ohne Ende. Später derselbe Vergleich für den Wechsel auf llama.cpp mit Gemma 4 — rund viermal schneller."],
        ["Die Pipeline läuft nur vorwärts", "Ein Neu-Filtern hat einmal jeden Job auf Anfang gesetzt — 21 versendete Bewerbungen und 33 fertige Anschreiben standen plötzlich wieder als neu da. Per Skript aus Anschreiben-Dateien und Mail-Log wiederhergestellt; seitdem fällt ein Neu-Filtern nur noch das Urteil."],
        ["Heuristik ehrlich halten", "Der Gmail-Sync ordnet alte Mails über Empfänger und Betreff zu, weil die Message-ID nie gespeichert wurde. Darum: nur lesen, nie überschreiben, und bei Mehrdeutigkeit lieber gar nichts setzen."],
        ["Lieber zu spät archivieren", "karriere.at antwortet auf ein abgelaufenes Inserat mit 200 statt 404. Ein still archivierter lebender Job ist ein verpasster Job — also zählen nur nachgemessene Offline-Signale, und Rate-Limits oder Timeouts lassen den Job in Ruhe."],
      ],
      origin: [
        ["Erst karriere.at", "Der erste Scraper, weil die Seite am leichtesten war. Alles lief im Terminal: npm run scrape, filter, anschreiben."],
        ["Dann AMS und devjobs", "Zwei Portale, die ohne echten Browser nichts hergeben — dort kam Playwright dazu. Mit LinkedIn und jobs.at wurden es fünf hinter einem gemeinsamen Interface."],
        ["UI und Maskottchen", "Als Freunde Potenzial gesehen haben: eine React-Oberfläche im Look eines Mail-Clients, auf einem nackten node:http-Server ohne Framework, und Tschobbo dazu."],
        ["Ein anderes Modell", "Erst Ollama mit Mistral Small, nach einem Vergleich auf denselben Jobs llama.cpp mit Gemma 4 26B — schneller, weniger Floskeln, nichts mehr erfunden."],
        ["Nebenbei: Release Watcher", "Aus derselben Scraping-Logik ein kleines CLI-Tool, das Manga-Seiten auf neue Kapitel prüft. Gleiche Idee, kleiner Rahmen."],
      ],
    },
    challenge:
      "Ich habe viel zu lange am LLM-Filter herumprobiert, obwohl klar war, dass er für eine Aufgabe zu langsam ist, die ein Regex in Sekunden löst. Die Lehre habe ich mitgenommen: das Sprachmodell nur dort einsetzen, wo es wirklich etwas bringt — beim Anschreiben, nicht beim Filtern.",
    origin:
      "Angefangen als reiner Scraper (karriere.at zuerst, weil am leichtesten), dann AMS und devjobs dazu. Erst alles CLI; UI und Maskottchen kamen später, nachdem Freunde Potenzial gesehen haben. Aus derselben Logik ist nebenbei ein kleines CLI-Tool entstanden — Release Watcher, das Manga-Seiten auf neue Kapitel prüft, weil ich zu oft gespoilert wurde. Gleiche Idee, kleiner Rahmen.",
    // UI screenshots: the real JoBBoT UI, fed offline with the real
    // postings from its own test fixtures (parsers + regex filter, no
    // scraping, no LLM — so no cover letters in them).
    screenshots: [
      { src: "/projects/jobbot/inbox.jpg", alt: "Posteingang: gefilterte Stellen nach Fit (Match/Offstack), Inserat geöffnet" },
      { src: "/projects/jobbot/aussortiert.jpg", alt: "Aussortiert: was der Regex-Filter rausgeworfen hat" },
      { src: "/projects/jobbot/suche.jpg", alt: "Einstellungsseite „Suche“: Portale und Suchbegriffe im Browser bearbeiten" },
      { src: "/projects/jobbot/scrape.jpg", alt: "Scrape: Quellen wählen und den Lauf starten" },
    ],
    mascot: { src: "/projects/jobbot.jpeg", alt: "Tschobbo, der lila Slime-Blob mit Sonnenbrille" },
    facets: ["screens"],
  },
  {
    id: "kevdev",
    group: "big",
    layout: "storyboard",
    kind: "Dieses Portfolio",
    accent: "var(--note-9)",
    learnGoal:
      "Ein Portfolio, das man erlebt statt liest — und in dem jedes Element einen Grund hat.",
    title: "kev.dev",
    claim: "Beweist Gestaltungs-Denken — jede Animation erzählt etwas, nichts ist Deko.",
    points: ["Portfolio zum Erleben — jedes Element hat einen Grund", "Vanilla TypeScript, GSAP, eigene Tuch-Physik auf Canvas", "Eigene Lite-Variante fürs Handy"],
    what: "Viele Portfolio-Seiten angesehen, dann jedes Element mit einem Sinn gebaut: Das Tuch im Hero ist so groß, dass man es anfassen muss. About ist ein Aufzug, an dem mein Leben vorbeizieht. Die Projekte liegen wie auf einer Werkbank, jedes mit Why und Learned. Kontakt kommt mit einem Übergang, und wer klickt, findet ein verstecktes Wow. Impressum und Datenschutz liegen als Overlay auf dem One-Pager, damit die Musik ohne Schnitt weiterläuft.",
    tags: ["TypeScript", "Vite", "GSAP / ScrollTrigger", "Lenis", "Canvas 2D", "CheerpJ"],
    meta: "Solo · der sechste Anlauf auf eine eigene Seite · kev.dev selbst seit 18. September 2026: ca. 190–310 h · mit allen Vorläufern (drei noch vor Git, dann SAOS.ME, b2b-cv, cv) und dem 3D-Renderer rund 550–800 h · Claude Code als Implementierungs-Agent erst seit dem YourBrand-Frontend, mal mehr, mal weniger — und es läuft weiter",
    origin:
      "Davor: drei Anläufe, noch bevor ich Git benutzt habe (ca. 45 h) → März: SAOS.ME, der erste mit Git — SaoS-Animation, Raygun-Button, Onepager auf GitHub Pages → Juni bis September: b2b-cv, die White-Label-Verkaufsseite für YourBrand (React + Tailwind), die heute als B2B-Seite in der YourBrand-Karte weiterlebt → August: der 3D-Renderer, Wireframe ohne Bibliothek → 15. September: cv, ein schneller Onepager mit Werdegang und der 3D-Engine als Modul → 18. September: kev.dev, der sechste Anlauf — erst Aufzug und SAOS-Bodenrelief, dann Projektkarten mit Live-Demos, das Kontakt-Finale mit Raygun, die Handy-Version, About neu, FaceDots fürs Porträt und vier Sprachen.",
    parts: [
      {
        does: "Eine Feder-Simulation auf Canvas. Name und Untertitel werden als Textur aufgemalt und mitverzerrt — mit Verlauf, Glow und Shine wie die Überschriften.",
        files: ["hero/cloth.ts", "hero/name-typewriter.ts", "hero/hero-names.ts"],
        reuse: "Das Tuch nimmt jede Canvas-Textur (setTextTexture) — Name, Logo oder ein Foto.",
      },
      {
        does: "Eine gepinnte Fahrt durch einen Schacht aus CSS-3D-Wänden; am Ende der Zoom in den Monitor, dessen Gitter nahtlos zum Projekte-Grid wird.",
        files: ["about/elevator.ts", "scroll/transition.ts", "viewport.ts"],
        reuse: "Das Muster für jede Pin-Szene: eine eigene, gescrubbte Timeline, gemessen an der 100vh-Sonde statt an innerHeight.",
      },
      {
        does: "Karten aus Daten: ein Objekt pro Projekt, Layout und Visual pro Karte; Live-Demos laden erst beim ersten Öffnen (CheerpJ, 3D-Renderer, FaceDots).",
        files: ["projects/projects-data.ts", "projects/project-cards.ts", "projects/project-visuals.ts", "projects/widgets/"],
        reuse: "Ein neues Projekt ist ein Eintrag in projects-data.ts — Desktop-Karte, Handy-Liste und Sheet kommen mit.",
      },
      {
        does: "Die Buchstaben fallen scroll-gesteuert ein; dreimal klicken zerbricht alles in echte Physik, dann kommt die Raygun.",
        files: ["contact/contact.ts", "contact/contact-physics.ts", "raygun/raygun.ts"],
        reuse: "Die Raygun ist ein eigenständiger Button (mountRaygunButton) in zwei Varianten, fixed oder inline — an jede Seite steckbar.",
      },
      {
        does: "Impressum und Datenschutz als Overlay über der Seite — Musik, Theme und Scrollposition bleiben; die alten Adressen leiten dorthin um.",
        files: ["legal/legal-content.ts", "legal/legal-overlay.ts", "impressum.html"],
        reuse: "Ein Overlay für jeden rechtlichen Text: der Inhalt steht in legal-content.ts, die Seite drumherum bleibt stehen.",
      },
      {
        name: "Sprachen",
        line: "Vier Sprachen, ohne Library.",
        does: "Hält jeden Text der Seite in vier Sprachen. Die Sprache steht einmal beim Laden fest — gespeicherte Wahl, sonst Browsersprache, sonst Englisch —, weil die Szenen ihren Text beim Start messen; umschalten speichert und lädt neu. Russisch und Japanisch sind KI-übersetzt und sagen das.",
        files: ["i18n/index.ts", "i18n/ui.ts", "i18n/switcher.ts", "i18n/i18n.css", "projects/projects-i18n.ts", "about/about-content.ts", "legal/legal-content.ts", "projects/widgets/grundlagen-i18n.ts"],
        reuse: "pick() mit Deutsch als Fallback und der Typ aus dem deutschen Original (type Ui = typeof de) — passt ohne Abhängigkeit in jedes TypeScript-Projekt.",
        pros: [
          "Typsicher: fehlt einer Sprache ein Schlüssel, meldet es der Compiler",
          "Keine Library, nichts lädt zur Laufzeit nach — die Texte sind TypeScript und landen im Build",
          "Funktionen statt Platzhalter: Mehrzahl und Satzbau frei pro Sprache",
          "Fehlt eine Übersetzung, springt Deutsch ein",
        ],
        cons: [
          "Alle Sprachen stecken im Bundle, auch die, die niemand liest",
          "Sprachwechsel heißt neu laden, weil die Szenen beim Start messen",
          "Projekttexte hängen an der Position: eine Zeile umsortiert, und die Übersetzung landet beim falschen Eintrag",
          "Übersetzen heißt Code anfassen — ohne Repo kann niemand mithelfen",
          "Die Texte liegen verteilt in mehreren Dateien",
        ],
      },
    ],
    links: [{ label: "GitHub (public)", href: "https://github.com/Saos-EBB/kev.dev" }],
    decisions: [
      "Vanilla TypeScript + Vite, kein Framework — die Seite ist Animation, nicht State",
      "Tuch als eigene Verlet-Physik auf Canvas, der Name wird als Textur mitverzerrt",
      "Aufzug aus CSS-3D-Wänden, Zoom in den Monitor als Übergang ins Projekte-Grid",
      "Ein durchgehendes Grid als roter Faden von About bis Kontakt",
      "Impressum/Datenschutz als Overlay statt eigener Seite — die Musik läuft weiter",
      "Eigene Lite-Variante fürs Handy statt Kompromisse für beide",
    ],
    challenge:
      "Mobile ist eine eigene Welt: Was am Desktop flüssig lief, ruckelte am Handy. Messen statt raten — die Aufzugswände waren Layer so hoch wie die ganze Section. Am Ende eine eigene Lite-Variante statt Kompromisse für beide.",
    facets: ["self"],
    open: [
      "Texte in Kevins Worten nachschärfen",
    ],
  },
  {
    id: "aniscript",
    group: "tools",
    layout: "editor",
    kind: "Userscript",
    accent: "var(--note-1)",
    learnGoal: "Userscripts und DOM-Manipulation lernen — und herausfinden, ob ich ein großes fremdes Script schlanker und verständlicher neu bauen kann.",
    title: "AniScript",
    claim: "Ein Userscript für den eigenen Gebrauch — von Grund auf neu geschrieben, schlank und durchkommentiert.",
    points: [
      "Komplett neu geschrieben: ~800 statt ~5000 Zeilen",
      "Autoplay, Intro-Skip, Auto-nächste-Folge, Skip-Hotkeys, Fortschritt",
      "Jede Debug-Erkenntnis als Kommentar direkt im Code",
    ],
    what: "Angefangen hat es mit einem fremden Script von rund 5000 Zeilen, das ich adaptiert und erweitert habe. Als Brave von Manifest V2 auf V3 umgestiegen ist, habe ich es komplett neu geschrieben: rund 800 Zeilen ohne externe Libraries, kein Code aus der Adaption mehr drin, dafür massig Kommentare. Jede Stunde Debugging steht als Erklärung im Code. Features: Autoplay, Intro-Skip, Auto-nächste-Folge, Skip-Hotkeys, Fortschritt pro Folge, Theater-Modus. Im selben Repo liegen Schwester-Scripts für Joyn, RTL+ und YouTube.",
    tags: ["JavaScript", "Tampermonkey/Userscript", "DOM"],
    features: ["Autoplay", "Intro-Skip", "Auto-nächste-Folge", "Skip-Hotkeys X/C/V/B", "Fortschritt pro Folge", "Theater-Modus"],
    meta: "Solo · für den eigenen Gebrauch · laufend gepflegt",
    links: [{ label: "GitHub (public)", href: "https://github.com/Saos-EBB/AniScript" }, { label: "kein Live-Widget (Userscript)" }],
    decisions: [
      "Neu geschrieben, als Brave von Manifest V2 auf V3 umstieg — statt 5000 fremde Zeilen weiter zu flicken, die ich nicht mehr sauber verstehen und warten konnte",
      "Kommentare als Gedächtnis: jede Debug-Erkenntnis steht im Code, damit sie keiner zweimal lösen muss",
      "Theater-Modus per CSS statt echtem Vollbild — überlebt jeden Folgenwechsel im iframe",
    ],
    challenge:
      "Lange ein Render-Bug mit Darstellungsfehlern — Ursache war nicht das Script, sondern der Userscript-Manager unter Braves Umstieg von Manifest V2 auf V3. Der Wechsel von Violentmonkey zu ScriptCat hat's behoben, das mit MV3 sauber zurechtkam.",
  },
  {
    id: "releasewatcher",
    group: "tools",
    layout: "terminal",
    kind: "CLI + Web-UI",
    accent: "var(--note-7)",
    learnGoal: "Wissen, wann was Neues rauskommt, ohne fünf Seiten abzuklappern — und dabei lernen, mehrere fremde APIs hinter eine gemeinsame Schnittstelle zu bringen.",
    title: "ReleaseWatcher",
    claim: "Ein Release-Radar für Serien, Anime und Manga — vier APIs, eine Watchlist.",
    points: [
      "Neue Folgen und Kapitel aus TMDB, AniList, MangaDex und TVDB — mit Link pro Release",
      "CLI und Web-UI mit Suche, Kalender und „Check new“-Button",
      "Angefangen als Puppeteer-Scraper, neu gebaut auf Bun + SQLite über offizielle APIs",
    ],
    what: "Ich schaue Serien, Anime und Manga quer über mehrere Plattformen und wollte nicht mehr selbst nachsehen, wo es was Neues gibt. Angefangen hat es im April als kleines Node-Script, das mit Puppeteer Manga-Seiten abgegrast hat. Im September habe ich es durch einen richtigen Media-Tracker ersetzt: Bun und SQLite, Quellen nur noch über offizielle APIs (TMDB, AniList, MangaDex, TVDB), jede als Adapter hinter derselben Schnittstelle. „check-new“ fragt alle Titel der Watchlist ab und listet, was neu erschienen ist, samt Link. Dazu manuelles Progress-Tracking und eine Web-UI mit Suche, Kalender-Ansicht und „Check new“-Button.",
    tags: ["TypeScript", "Bun", "SQLite", "REST-APIs"],
    meta: "Solo · April 2026 als Scraper, September 2026 neu gebaut · für den eigenen Gebrauch",
    links: [{ label: "GitHub (public)", href: "https://github.com/Saos-EBB/ReleaseWatcher" }, { label: "kein Live-Widget (braucht API-Keys)" }],
    decisions: [
      "APIs statt Scraping: offizielle Schnittstellen statt Seiten auslesen, die sich jederzeit ändern können",
      "Eine Quellen-Schnittstelle, vier Adapter — „check-new“ fragt jede Quelle gleich ab, eine neue Quelle ist ein neuer Adapter",
      "Ersetzt statt daneben weitergeführt: das alte Scraper-Script ist raus, ein Projekt pro Repo",
      "Tests überspringen sich selbst, wenn ein API-Key fehlt oder eine Quelle gerade nicht erreichbar ist",
      "MangaDex mit festem 250-ms-Delay pro Request — keine Bursts über viele Titel",
    ],
    challenge:
      "Vier APIs, vier Eigenheiten: TVDB braucht einen Login-Token, MangaDex ein Rate-Limit, AniList liefert für Manga keine Release-Termine, TMDB trennt Serien und Filme. Die Arbeit war, das alles hinter einer schmalen gemeinsamen Schnittstelle zu verstecken.",
    open: [
      "Texte in Kevins Worten nachschärfen",
    ],
  },
  {
    id: "oskalizer",
    group: "tools",
    layout: "keys",
    kind: "Tastatur-Spielplatz",
    accent: "var(--note-8)",
    learnGoal: "Mein Sohn will an meine Tastatur, sobald ich daran sitze — also habe ich ihm etwas gebaut, bei dem er hämmern kann, ohne dass etwas kaputtgeht, und trotzdem etwas passiert.",
    title: "Oskalizer",
    claim: "Ein Tastatur-Spielplatz für meinen Sohn — der mit ihm mitwächst.",
    points: [
      "Tastatur und Maus werden exklusiv übernommen: er hämmert, das System bleibt unangetastet",
      "Erst bunte Kleckse, jetzt Buchstaben mit Tier und Stimme: „A wie Affe“",
      "Modus Tippen: er schreibt, Enter liest es ihm vor",
    ],
    what: "Der Oskalizer übernimmt eine externe Tastatur und die Maus exklusiv, zeigt alles im Vollbild und lässt das System in Ruhe — beenden geht nur, wenn man Esc fünf Sekunden hält. Die Modi sind mit meinem Sohn gewachsen. Am Anfang war jeder Tastendruck einfach ein bunter Klecks auf dunklem Grund, in drei Stilen (Tinte, Kugeln, Schleim), ohne Zusammenhang zwischen Taste und Bild. Als er älter wurde, kam der Modus Tiere: Jede Taste zeigt groß ihr Zeichen, A bis Z mit einem Tier dazu, eine Stimme sagt „A wie Affe“ und macht den Tierlaut, Ziffern werden vorgelesen. Mit Strg+Umschalt+D wechselt man in den Modus Tippen: Die Buchstaben bleiben als Text stehen, die Leertaste macht Wortabstände, und Enter liest ihm vor, was er geschrieben hat.",
    tags: ["Python", "pygame", "evdev", "Piper TTS"],
    meta: "Solo · September 2026 begonnen, Oktober 2026 umgebaut · für meinen Sohn",
    links: [{ label: "GitHub (privat)" }, { label: "kein Live-Widget (läuft lokal unter Linux)" }],
    decisions: [
      "Tastatur und Maus exklusiv gegrabbt (evdev) — kein Tastendruck erreicht das System, Beenden nur mit fünf Sekunden Esc",
      "Mitgewachsen statt ergänzt: die Kleckse sind raus, als Buchstaben und Tiere spannender wurden",
      "Stimme „Thorsten“ über Piper, lokal und offline; fehlt sie, springt espeak-ng ein",
      "Eigene Tierbilder und Tierlaute einfach als Datei ablegen (a.png, a.ogg) — ohne Code anzufassen",
      "Jeder neue Tastendruck bricht Bild und Ton des vorigen ab — beim Hämmern bleibt nichts hängen",
    ],
    challenge:
      "Gehämmert wird schneller, als eine Stimme sprechen kann. Die Sprache wird pro Taste in einem eigenen Thread berechnet, jeder Auftrag bekommt eine Nummer, und was veraltet ist, wird verworfen — sonst hinkt der Ton dem Kind hinterher.",
    open: [
      "Texte in Kevins Worten nachschärfen",
    ],
  },
  {
    id: "renderer",
    group: "along",
    layout: "viewport",
    kind: "3D ohne Bibliothek",
    accent: "var(--note-3)",
    learnGoal: "Wollte wissen, wie weit man einen simplen 2D-Canvas treiben kann.",
    title: "3D-Wireframe-Renderer",
    claim:
      "Beweist Tiefe — von einer Formel aus einem YouTube-Short bis zum Schädel-CT: OBJ, STL und DICOM auf einem simplen 2D-Canvas, ohne Grafik-Bibliothek.",
    points: ["3D auf einem simplen 2D-Canvas, ohne Grafik-Bibliothek", "Projektion, Rotation und Tiefenschattierung selbst gerechnet", "Lädt OBJ, STL und DICOM — bis zum Schädel-CT"],
    what: "Angefangen mit einer Formel aus einem YouTube-Short (Tsodings „magic formula“): Die Idee, dass ich auf einem simplen 2D-HTML-Canvas komplettes 3D rendern kann, fand ich so spannend, dass ich die Grenzen ausreizen wollte. Projektion, Rotation und Tiefenschattierung selbst gerechnet, ohne Grafik-Bibliothek — dazu zum ersten Mal OBJ- und STL-Dateien eingelesen.",
    tags: ["JavaScript", "Canvas 2D", "3D-Mathematik", "OBJ/STL/DICOM"],
    meta: "Solo · aus Eigeninteresse · ca. 2 Wochen bis zum Ziel",
    links: [
      { label: "GitHub", href: "https://github.com/Saos-EBB/Renderder" },
      { label: "Live direkt im Widget" },
    ],
    decisions: [
      "2D-Canvas statt WebGL/Three.js — bewusst der harte Weg, um zu verstehen, wie 3D wirklich entsteht",
      "Projektion, Rotation, Tiefenschattierung selbst gerechnet",
      "OBJ-, STL- und DICOM-Einlesen selbst gebaut, um echte Modelle und Volumendaten zu laden",
      "Erste Versuche selbst getippt, danach mit CC als Implementierungs-Agent immer weiter ausgereizt — bis zum Schädel-CT. Architektur und Entscheidungen von mir.",
    ],
    challenge:
      "Es war durchgehend Neuland — Projektion, Rotation, das Einlesen von OBJ und STL, überall Probleme, die ich mir vorher nie gestellt hatte. Der Reiz war der Aufstieg: vom simplen Wireframe bis dahin, ein komplettes Schädel-CT aus DICOM-Daten auf einem 2D-Canvas zu rendern.",
    widget: {
      label: "3D-Modelle, mit der Maus drehbar",
      mount: (el, card) => import("./widgets/renderer").then((m) => m.mount(el, card)),
    },
    facets: ["live-demo"],
    open: [
      "Baldur's-Gate-Modelle fehlen im Widget — welche zwei? (duoOG ist 41 MB und nicht im Renderer-Repo)",
      "Ist craniumCut01 das Schädel-CT aus DICOM? Modell-Reihenfolge bestätigen",
    ],
  },
  {
    id: "grundlagen",
    group: "along",
    layout: "pinboard",
    kind: "Bootcamp · Java",
    accent: "var(--note-6)",
    learnGoal: "Die Basics — von Hand, im Bootcamp gelernt (Java, OOP, SQL, Datenstrukturen).",
    title: "Grundlagen",
    claim: "Die Handwerks-Grundlagen — alles von Hand getippt, im Bootcamp gelernt.",
    points: ["Bootcamp-Basics: Java, OOP, SQL, Datenstrukturen", "Alles von Hand getippt", "Die Programme laufen direkt im Browser"],
    widget: {
      label: "Bootcamp-Projekte, direkt im Browser ausführbar",
      mount: (el, card) => import("./widgets/grundlagen").then((m) => m.mount(el, card)),
    },
    facets: ["live-demo"],
    open: [
      "Info-Texte zu Mastermind, Personalverwaltung und Bibliothek",
      "Bibliothek-Quelle fehlt; Personalverwaltung hat kein main (kein Terminal)",
    ],
  },
  {
    id: "facedots",
    group: "along",
    layout: "portrait",
    kind: "Tool · Foto zu Punkten",
    accent: "var(--note-4)",
    learnGoal:
      "Wollte wissen, wie man Bilderkennung direkt im Browser laufen lässt — ohne Server, ohne dass ein Foto irgendwohin geht.",
    title: "FaceDots",
    claim: "Ein kleines Tool: Foto rein, Kopf freistellen, als Punkte, ASCII oder Tuch wieder raus — alles im Browser.",
    points: [
      "Foto rein: ein Bildmodell stellt den Kopf frei, lokal im Browser",
      "Raus als Punkte, ASCII oder auf dem Tuch aus dem Hero",
      "Eigenes Modul — als eigenes Repo auslagerbar",
    ],
    what: "Ein Foto geht durch ein Segmentierungsmodell, das für jeden Pixel schätzt, ob er Haare, Haut, Kleidung oder Hintergrund ist. Übrig bleibt der Kopf, eingefärbt im Verlauf dieser Seite. Daraus werden Punkte: ein Raster über das Bild, jeder Punkt so groß, wie die Stelle hell ist, jeder an einer Feder — wisch durch, sie weichen aus und federn zurück. Oder als ASCII, oder aufs Tuch aus dem Hero. Das Gesicht hier bin ich.",
    tags: ["TypeScript", "Canvas 2D", "MediaPipe", "WebAssembly", "Partikel-Physik"],
    meta: "Solo · eigenes Modul (packages/face-dots), als eigenes Repo auslagerbar",
    links: [
      { label: "GitHub (public)", href: "https://github.com/Saos-EBB/faceDots" },
      { label: "Live direkt im Tool" },
    ],
    decisions: [
      "Das Foto bleibt im Browser, kein Upload. Nur das Modell (~16 MB) kommt von Google — erst nach Einwilligung, wie beim Musikplayer",
      "Punkte statt 3D-Modell: ein Gesichts-Mesh aus Fotos blieb eine glatte Maske, die Punkte zeigen das echte Bild",
      "Feder pro Punkt, Farben in 16 Gruppen gezeichnet — läuft am Handy flüssig und steht still, sobald alles liegt",
      "Als eigenständiges Modul gebaut, ohne Abhängigkeit zur Seite",
    ],
    challenge:
      "Drei Varianten ausprobiert: Gesicht aufs Tuch, als 3D-Drahtgitter aus mehreren Fotos, als Punkte. Das Tuch verzerrt Gesichter schnell ins Gruselige, das 3D-Modell kennt nur die Gesichtsfläche ohne Cap und Haare. Die Punkte haben gewonnen.",
    origin:
      "Idee für ein interaktives Porträt auf dieser Seite → Testseiten für Tuch, 3D-Modell und Punkte → das Freistellen erst offline, dann direkt im Browser → als Modul ausgelagert → Modell von Google, nur mit Einwilligung.",
    widget: {
      label: "Foto → Punkte, ASCII oder Tuch",
      mount: (el, card) => import("./widgets/face-tool").then((m) => m.mount(el, card)),
    },
    facets: ["live-demo"],
  },
];

// In the visitor's language (projects-i18n.ts).
export const projectCards: ProjectCard[] = cards.map(localizeCard);
