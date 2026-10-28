// TschoBBo's flows, checked against the public repo (github.com/Saos-EBB/JoBBoT,
// main at 29c0f80). Only what is visible there goes in, nothing from the private
// working repo. Code excerpts are generated verbatim into tschobbo-code.ts;
// numbers in the texts come from the repo's own code comments.

import type { EngProject } from "../types";
import { CODE } from "./tschobbo-code";

export const tschobbo: EngProject = {
  id: "tschobbo",
  title: "TschoBBo",
  accent: "var(--note-5)",
  repoUrl: "https://github.com/Saos-EBB/JoBBoT",
  commit: "29c0f80",
  code: CODE,
  lead: {
    de: "Mein Bewerbungs-Bot: holt Inserate von fünf Portalen, filtert sie, schreibt mit einem lokalen Sprachmodell das Anschreiben und legt es als Gmail-Entwurf ab. Abgeschickt wird immer von mir.",
    en: "My job-application bot: pulls listings from five portals, filters them, writes the cover letter with a local language model and files it as a Gmail draft. I always send it myself.",
    ru: "Мой бот для откликов: собирает вакансии с пяти порталов, фильтрует их, пишет сопроводительное письмо локальной языковой моделью и кладёт его черновиком в Gmail. Отправляю всегда я сам.",
    ja: "私の応募ボット。5つのサイトから求人を集めて絞り込み、ローカルの言語モデルで応募文を書き、Gmailの下書きに入れます。送信するのは必ず私自身です。",
  },
  layers: [
    { id: "sources", color: "var(--note-3)", label: { de: "Quellen", en: "Sources", ru: "Источники", ja: "ソース" } },
    { id: "pipeline", color: "var(--note-5)", label: { de: "Pipeline", en: "Pipeline", ru: "Конвейер", ja: "パイプライン" } },
    { id: "ai", color: "var(--note-6)", label: { de: "KI, lokal", en: "AI, local", ru: "ИИ, локально", ja: "AI（ローカル）" } },
    { id: "storage", color: "var(--note-8)", label: { de: "Speicher", en: "Storage", ru: "Хранилище", ja: "ストレージ" } },
    { id: "mail", color: "var(--note-1)", label: { de: "Post", en: "Mail", ru: "Почта", ja: "メール" } },
  ],
  nodes: [
    { id: "adapters", layer: "sources", label: { de: "Fünf Portal-Adapter" } },
    { id: "scheduler", layer: "sources", label: { de: "Scheduler" } },
    { id: "offline", layer: "sources", label: { de: "Offline-Check" } },

    { id: "hash", layer: "pipeline", label: { de: "Job-ID aus Hash" } },
    { id: "dedup", layer: "pipeline", label: { de: "Dedup + Archiv" } },
    { id: "gates", layer: "pipeline", label: { de: "Titel-Gate" } },
    { id: "regex", layer: "pipeline", label: { de: "Regex-Filter" } },
    { id: "verdict", layer: "pipeline", label: { de: "Urteil → fit" } },
    { id: "writer", layer: "pipeline", label: { de: "Anschreiben" } },
    { id: "versand", layer: "pipeline", label: { de: "Versand" } },
    { id: "sync", layer: "pipeline", label: { de: "Gmail-Sync" } },

    { id: "jev", layer: "ai", label: { de: "JEV (Nimble 9B)" } },
    { id: "provider", layer: "ai", label: { de: "LlmProvider" } },
    { id: "llama", layer: "ai", label: { de: "llama-server" } },
    { id: "replykind", layer: "ai", label: { de: "Antwort-Art" } },

    { id: "store", layer: "storage", label: { de: "JsonStore" } },
    { id: "id8", layer: "storage", label: { de: "Brief über id8" } },
    { id: "status", layer: "storage", label: { de: "Job-Status" } },

    { id: "transport", layer: "mail", label: { de: "Transport-Seam" } },
    { id: "gmail", layer: "mail", label: { de: "Gmail IMAP/SMTP" } },
    { id: "match", layer: "mail", label: { de: "Mail-Zuordnung" } },
  ],
  flows: [
    {
      id: "scrape",
      title: { de: "Scrapen: fünf Portale, kein Job doppelt" },
      steps: [
        {
          node: "adapters",
          title: { de: "Ein Interface für jedes Portal" },
          plain: { de: "karriere.at, devjobs.at, LinkedIn, AMS und jobs.at liefern alle dieselbe Form. Ein neues Portal ist ein neuer Baustein, sonst ändert sich nichts." },
          dev: {
            de: "Jeder Adapter implementiert ScraperAdapter: kind 'fetch' oder 'browser' (Playwright), ein querySchema für die Einstellungsseite und scrape(), das ScrapedJob[] zurückgibt. Ohne Schema kompiliert ein Adapter gar nicht.",
          },
          code: "scrape-adapter",
          files: ["scrapers/karriere-at.ts", "scrapers/devjobs-at.ts", "scrapers/linkedin.ts", "scrapers/ams.ts", "scrapers/jobs-at.ts", "config/sources.json"],
          why: { de: "Die Einstellungsseite baut ihr Formular aus dem Schema, und lib/query-schema.ts prüft die Datei dagegen. Eine falsche Suche fällt an der Grenze auf." },
        },
        {
          node: "scheduler",
          title: { de: "Parallel, aber nie zwei Browser" },
          plain: { de: "Mehrere Portale laufen gleichzeitig, aber nie zwei echte Browser auf einmal, die sich um den Rechner streiten." },
          dev: {
            de: "Ein Scheduler statt zwei Semaphoren: tryAcquire prüft Gesamt-Limit und Browser-Limit atomar und belegt nur, wenn beide Platz haben. release weckt alle Wartenden, durch kommt nur, wer jetzt beide Limits erfüllt. Promise.allSettled: ein kaputter Adapter stoppt die anderen nicht.",
          },
          code: "scrape-scheduler",
          files: ["lib/scrape-runner.ts"],
          why: { de: "Mit zwei getrennten Semaphoren hielt ein Browser-Adapter seinen Browser-Slot, hing in der Gesamt-Queue fest und blockierte den zweiten Browser-Adapter, im Live-Lauf teils minutenlang." },
        },
        {
          node: "hash",
          title: { de: "Dieselbe Stelle, dieselbe ID" },
          plain: { de: "Dieselbe Stelle taucht oft auf mehreren Portalen auf. Aus Titel und Firma entsteht eine feste Kennung, so erkennt der Bot sie wieder." },
          dev: {
            de: "SHA-256 über das JSON-Paar aus normalisiertem Titel und Firma, gekürzt auf 16 Hex-Zeichen. Vorher fliegen Gender-Marker (m/w/d), :in-Endungen, Rechtsformen (GmbH & Co KG …) und jede Interpunktion raus.",
          },
          code: "scrape-hash",
          files: ["lib/hash.ts", "lib/duplicates.ts"],
          why: { de: "Echter Fall: karriere.at hatte „Technical Support Engineer (m/w/d) – 1st Level“, jobs.at dasselbe ohne Gedankenstrich. Nur Leerzeichen zu glätten ergab zwei IDs." },
        },
        {
          node: "dedup",
          title: { de: "Speichern erst nach allen Quellen" },
          plain: { de: "Erst wenn alle Portale fertig sind, wird gespeichert, eine Stelle nach der anderen. Was schon da ist, wird übersprungen." },
          dev: {
            de: "Ein einziges storage.list() baut eine Map aller bekannten IDs, statt pro Treffer exists() zu fragen. Neue Jobs gehen sofort in die Map, damit dieselbe Stelle von einer zweiten Quelle im selben Lauf nicht noch einmal als neu zählt. Ein archivierter Job, der wieder auftaucht, bekommt seinen Status zurück.",
          },
          code: "scrape-dedup",
          files: ["lib/scrape-runner.ts"],
          why: { de: "exists() liest intern vier Ordner. Bei ~250 Treffern waren das ~1000 readdir-Aufrufe pro Lauf, und parallel gespeichert hätte es Write-Races gegeben." },
        },
        {
          node: "offline",
          title: { de: "Offline nur mit Beweis" },
          plain: { de: "Ist ein Inserat weg, merkt der Bot das beim nächsten Lauf. Aber nur, wenn er es sicher weiß: im Zweifel bleibt die Stelle stehen." },
          dev: {
            de: "Zwei Stufen: „im Lauf nicht gefunden“ wählt Kandidaten aus, ein Einzelabruf der URL bestätigt. Nur 404/410 oder ein nachgemessener Marker heißt offline, 429, 403, 5xx und Timeout sind „unbekannt“. Höchstens 25 Prüfungen pro Lauf, 1 s Pause dazwischen, älteste zuerst.",
          },
          code: "scrape-offline",
          files: ["lib/offline-check.ts", "lib/scrape-runner.ts"],
          why: { de: "devjobs.at antwortete beim Nachmessen schon auf den ersten Request mit 429. Als offline gelesen, hätte jeder Lauf reihenweise lebende Jobs archiviert." },
        },
        {
          node: "status",
          title: { de: "Archiv ohne Gedächtnis" },
          plain: { de: "Weggeräumt werden nur Stellen, in denen noch keine Arbeit steckt. Taucht eine wieder auf, kommt sie genau dorthin zurück, wo sie war." },
          dev: {
            de: "ARCHIVIERBAR sind nur 'new' und 'triaged'. Ab 'generated' steckt ein Anschreiben drin, die Bewerbung läuft. Der Weg zurück braucht kein gespeichertes previousStatus: hat der Job ein fit, war er triaged, sonst new.",
          },
          code: "scrape-archive",
          files: ["scrapers/interface.ts"],
        },
      ],
    },
    {
      id: "filter",
      title: { de: "Filter: Regeln zuerst, dann JEV" },
      steps: [
        {
          node: "gates",
          title: { de: "Senior im Titel? Gar nicht erst fragen" },
          plain: { de: "Steht schon im Titel, dass die Stelle nichts für mich ist, wird keine KI gefragt. Das spart pro Stelle Minuten." },
          dev: {
            de: "decide() läuft vor jeder Strategie: checkTitle wirft Seniorität aus dem Titel raus, isLehre wird einmal berechnet. Danach übernimmt die Strategie aus config/settings.json, regex oder nimble, mit derselben Decision-Form.",
          },
          code: "filter-title",
          files: ["lib/title-filter.ts", "lib/filter-decide.ts"],
        },
        {
          node: "regex",
          title: { de: "Regex-Modus: schnell und offline" },
          plain: { de: "Ohne KI: Verlangt der Text zu viele Jahre Erfahrung, fliegt die Stelle raus. Steht „Junior“ drin, passt sie. Der Rest landet bei mir zum Ansehen." },
          dev: {
            de: "Erfahrungsjahre, Junior-Signale und Ausschluss-Phrasen inklusive Negationen kommen aus config/experience-rules.json. Eine IT-Rolle erkennt Regex nicht sauber, darum lehnt dieser Modus dafür nichts ab, sondern sortiert neutral nach 'uncertain'.",
          },
          code: "filter-regex",
          files: ["lib/experience-regex.ts", "config/experience-rules.json"],
        },
        {
          node: "jev",
          title: { de: "JEV: ein Feld, ein Buchstabe" },
          plain: { de: "Im KI-Modus liest ein kleines Modell die Anzeige und beantwortet zwei Fragen: Ist das ein Job, den ich will? Wird ausdrücklich viel Erfahrung verlangt?" },
          dev: {
            de: "Bespoke Nimble 9B als Klassifizierer, kein Chat-Modell: pro Aufruf genau ein Feld, Antwort ein Buchstabe. wanted_job bekommt Titel und die ersten 400 Zeichen, die Erfahrungsfrage nur Sätze mit Erfahrung und Menge. Gibt es keinen solchen Satz, gibt es auch keinen Aufruf.",
          },
          code: "filter-wanted",
          files: ["lib/filter-nimble.ts", "config/settings.json"],
          why: { de: "Auf CPU/iGPU kostet die Prompt-Verarbeitung die ganze Zeit. Jeder Satz, der nicht ins Prompt muss, spart Sekunden." },
        },
        {
          node: "llama",
          title: { de: "Fester Präfix im Cache" },
          plain: { de: "Der lange, immer gleiche Anfang der Frage wird einmal gerechnet und dann wiederverwendet." },
          dev: {
            de: "Schema und System sind für jedes Feld wortgleich. Der primer schickt den Präfix einmal pro Lauf allein, llama-server legt dort einen Kontext-Checkpoint an. Danach rechnet jede Frage nur noch ihren Kontext, ~140 statt ~430 Tokens. askField versucht es zweimal, dann null.",
          },
          code: "filter-ask",
          files: ["lib/nimble-client.ts", "config/llama-models.ini"],
          why: { de: "Ein eigenes Schema pro Feld wich schon beim Feldnamen ab und warf den Cache bei jedem Wechsel weg." },
        },
        {
          node: "verdict",
          title: { de: "Aus Antworten wird ein Urteil" },
          plain: { de: "Aus den Antworten wird eins von drei Urteilen: passt, unsicher oder raus. Antwortet die KI nicht, ist das „unsicher“, nie „raus“." },
          dev: {
            de: "mapJudgment: it_rolle nein oder Erfahrung ≥3 Jahre → filtered_out. Junior-Signal ohne Unsicherheit → matched, alles andere uncertain. Support-Rollen werden nie wegen Erfahrung aussortiert, höchstens offstack.",
          },
          code: "filter-map",
          files: ["lib/filter-judgment.ts"],
        },
        {
          node: "store",
          title: { de: "Neu urteilen, nicht zurückspulen" },
          plain: { de: "Das Urteil wird gespeichert. Eine Stelle, für die schon ein Anschreiben existiert, bleibt dabei, wo sie ist." },
          dev: {
            de: "fit wird immer neu gesetzt, der Status nur, solange er 'new' oder 'triaged' ist, und zwar am aktuellen Diskstand, nicht am Objekt aus der Liste. JsonStore sortiert getriagte Jobs in Ordner nach fit: matched, offstack, brutal.",
          },
          code: "filter-store",
          files: ["lib/filter.ts", "storage/json-store.ts"],
          why: { de: "Vorher setzte jeder Re-Triage-Lauf den Status bedingungslos auf triaged. 21 versendete Bewerbungen und 33 Jobs mit fertigem Anschreiben standen danach wieder im Jobs-Ordner." },
        },
      ],
    },
    {
      id: "letter",
      title: { de: "Anschreiben lokal mit Gemma 4" },
      steps: [
        {
          node: "provider",
          title: { de: "Eine Schnittstelle für jedes Backend" },
          plain: { de: "Der Bot weiß nicht, welches Programm die KI ausführt. Ein Wechsel des Backends ändert nur eine Stelle." },
          dev: {
            de: "LlmProvider: resolveModels, chat, ensureReady, check. chat() wirft bei Netzwerkfehler und nicht-2xx, Retry bleibt beim Aufrufer. Früher lief alles über Ollama, der Wechsel auf llama.cpp blieb in lib/llm/.",
          },
          code: "letter-provider",
          files: ["lib/llm/index.ts", "lib/llm/openai-compat.ts"],
        },
        {
          node: "llama",
          title: { de: "Server bei Bedarf starten" },
          plain: { de: "Läuft das Modell noch nicht, startet der Bot es selbst und wartet. Nur auf meinem eigenen Rechner, nie bei einem fremden Server." },
          dev: {
            de: "ensureLocalServer probt /health. Nur für localhost wird scripts/llama-server.sh losgelöst gestartet, dann alle 500 ms geprüft, Timeout 30 s, mit klarer Meldung und Log-Pfad statt „fetch failed“.",
          },
          code: "letter-ready",
          files: ["lib/llm/llamacpp.ts", "scripts/llama-server.sh"],
        },
        {
          node: "llama",
          title: { de: "Router-Modus, ein Modell im RAM" },
          plain: { de: "Ein einziger KI-Server, der je nach Aufgabe das passende Modell lädt, aber nie zwei große gleichzeitig." },
          dev: {
            de: "llama-server im Router-Modus: Der Modellname ist der Preset-Name aus config/llama-models.ini (gemma4-26b auf Vulkan, gemma4-26b-cpu), --models-max 1. think wird zu enable_thinking im Chat-Template.",
          },
          code: "letter-router",
          files: ["config/llama-models.ini"],
          why: { de: "Ohne enable_thinking: false denkt ein Reasoning-Modell erst minutenlang versteckt, bevor das erste Wort kommt." },
        },
        {
          node: "writer",
          title: { de: "Drei Versuche, lange Timeouts" },
          plain: { de: "Ein Anschreiben dauert Minuten. Klappt es nicht, versucht der Bot es noch zweimal, und der Stopp-Knopf wirkt jederzeit." },
          dev: {
            de: "Bis zu 2 Regenerierungen mit Timeouts 600 s, 600 s, 1000 s. stream: true, damit Header früh kommen. Timeout und Stopp-Klick sind zwei AbortController, gebündelt mit AbortSignal.any().",
          },
          code: "letter-retry",
          files: ["lib/anschreiben.ts", "lib/anschreiben-runner.ts"],
          why: { de: "Ohne Streaming riss undicis headersTimeout bei großen Modellen ab, bevor der erste Token da war." },
        },
        {
          node: "id8",
          title: { de: "Den Brief über die ID finden" },
          plain: { de: "Ein Fehler hat fast die Hälfte der Anschreiben unsichtbar gemacht. Seitdem findet der Bot jede Datei über eine feste Kennung statt über ihren Namen." },
          dev: {
            de: "Gesucht wird nur über das Suffix _<id8>.md, der lesbare Teil des Namens ist Dekoration. Neue Dateien tragen kein Datum mehr. anschreibenZiel räumt eine Datei mit altem Namen beim Schreiben weg.",
          },
          code: "letter-id8",
          files: ["lib/anschreiben-datei.ts", "docs/adr/0001-anschreiben-storage.md"],
          why: { de: "Re-Scrape und Duplikat-Merge ändern das Datum im Dateinamen. Am 2026-09-04 waren 46 von 101 Briefen für ihren eigenen Job unsichtbar." },
        },
        {
          node: "status",
          title: { de: "Nur den Status patchen" },
          plain: { de: "Ist der Brief fertig, wird die Stelle auf „Anschreiben fertig“ gesetzt, ohne eine Änderung zu überschreiben, die ich in der Zwischenzeit gemacht habe." },
          dev: {
            de: "storage.update merged nur { status: 'generated' } auf den aktuellen Diskstand, statt das ganze, minutenalte Job-Objekt zurückzuschreiben.",
          },
          code: "letter-status",
          files: ["storage/json-store.ts"],
          why: { de: "Die Generierung dauert 3–4 Minuten. In der Zeit kann ich im Browser am selben Job das fit ändern." },
        },
      ],
    },
    {
      id: "send",
      title: { de: "Versand: Entwurf oder Senden, nie doppelt" },
      steps: [
        {
          node: "versand",
          title: { de: "Eine Sperre pro Job" },
          plain: { de: "Ein Doppelklick schickt keine zweite Bewerbung raus. Der zweite Klick bekommt sofort eine Fehlermeldung." },
          dev: {
            de: "versende() hält ein prozessweites Set aus <jobId>/<art>. Ein zweiter Aufruf, egal ob Doppelklick, zweiter Tab oder Retry, wirft sofort. Prozessweit reicht, der Server ist ein einzelner lokaler Prozess.",
          },
          code: "send-lock",
          files: ["lib/versand.ts", "scripts/routes/gmail.ts"],
          why: { de: "Der Status wird erst nach dem Zustellen gesetzt. Ohne Sperre sähen beide Aufrufe noch „freigegeben“." },
        },
        {
          node: "store",
          title: { de: "Status frisch lesen" },
          plain: { de: "Vor dem Senden schaut der Bot nach, ob die Bewerbung nicht schon raus ist." },
          dev: {
            de: "Bei Bewerbung + Senden wird der Job neu aus dem Storage gelesen. Steht er auf 'gesendet', wird abgebrochen, auch wenn der Request ein älteres Objekt mitbrachte.",
          },
          code: "send-fresh",
          files: ["lib/versand.ts"],
        },
        {
          node: "transport",
          title: { de: "Zwei Adapter, eine Auswahl" },
          plain: { de: "Es gibt einen Probemodus, der nichts verschickt. Welcher Weg gilt, wird an genau einer Stelle entschieden." },
          dev: {
            de: "MailTransport mit entwurf() und sende(). trockenTransport schreibt nur eine Zeile ins Terminal, gmailTransport stellt zu. standardTransport() wählt nach MAIL_DRY_RUN, CC und Anhang legt der Aufrufer bei.",
          },
          code: "send-seam",
          files: ["mail/transport.ts", "lib/versand.ts"],
          why: { de: "Vorher steckte der Trockenlauf als if mitten im Transport. Er war weder für sich testbar, noch sah man, dass es zwei Wege gibt." },
        },
        {
          node: "gmail",
          title: { de: "Entwurf per IMAP, Senden per SMTP" },
          plain: { de: "Normalerweise landet die Bewerbung als Entwurf in meinem Gmail. Ich lese sie dort und schicke sie selbst ab." },
          dev: {
            de: "entwurf() hängt die fertige Nachricht per imapflow an [Gmail]/Drafts mit dem \\Draft-Flag. sende() geht über nodemailer mit Gmail-SMTP. Jede Aktion landet im Mail-Log.",
          },
          code: "send-gmail",
          files: ["mail/gmail.ts"],
        },
        {
          node: "versand",
          title: { de: "Erst zustellen, dann weiterdrehen" },
          plain: { de: "Erst wenn die Mail wirklich raus ist, ändert sich der Status. Schlägt der Versand fehl, bleibt alles, wie es war." },
          dev: {
            de: "transport.sende/entwurf zuerst, danach storage.update mit dem statusPatch, dann logMailAction. Ein Fehler beim Zustellen kommt beim Aufrufer an, und der Job bleibt unverändert.",
          },
          code: "send-patch",
        },
        {
          node: "status",
          title: { de: "Postausgang oder gesendet" },
          plain: { de: "Ein Entwurf heißt „Postausgang“, abgeschickt heißt „gesendet“ mit Datum. Eine Nachfass-Mail ändert den Status nicht." },
          dev: {
            de: "Bewerbung + Entwurf → 'postausgang' ohne sentAt. Bewerbung + Senden → 'gesendet' und sentAt. Ein Nachfass verlängert nur followUps. sentAt wird hier gesetzt, nicht aus updatedAt abgeleitet.",
          },
          code: "send-status",
          files: ["lib/followup.ts"],
          why: { de: "updatedAt ändert sich bei jedem späteren Update, etwa wenn eine Antwort eintrifft. Als Sendedatum wäre es danach falsch." },
        },
      ],
    },
    {
      id: "sync",
      title: { de: "Gmail-Sync: nur lesen, Lücken füllen" },
      steps: [
        {
          node: "gmail",
          title: { de: "Postfach nur lesend öffnen" },
          plain: { de: "Der Bot schaut in mein Postfach, wann ich mich wo beworben habe und wer geantwortet hat. Er ändert dort nichts, nicht einmal „gelesen“." },
          dev: {
            de: "Gesendet-Ordner und INBOX werden mit mailboxOpen(…, { readOnly: true }) geöffnet. Der Gesendet-Ordner kommt sprachunabhängig über SPECIAL-USE \\Sent. Labels über X-GM-EXT-1, ohne die Erweiterung zählt keine Mail als Bewerbung.",
          },
          code: "sync-readonly",
          files: ["mail/gmail.ts", "lib/gmail-sync.ts"],
          why: { de: "readOnly ist Absicht und keine Optimierung: Der Sync darf nichts senden, löschen, verschieben oder markieren." },
        },
        {
          node: "match",
          title: { de: "Zuordnen ohne Message-ID" },
          plain: { de: "Welche Mail zu welcher Stelle gehört, errät der Bot über Adresse und Betreff. Ist es nicht eindeutig, trägt er lieber nichts ein." },
          dev: {
            de: "Exakte Empfängeradresse zuerst, der Betreff nur als Tiebreaker, wenn mehrere Jobs dieselbe Firmenadresse haben. Kein Scoring. Nur Jobs ohne sentAt kommen infrage.",
          },
          code: "sync-match",
          files: ["lib/mail-match.ts"],
          why: { de: "Die Message-ID wurde beim ursprünglichen Senden nie gespeichert. Ein falsches sentAt wäre schlimmer als keines." },
        },
        {
          node: "sync",
          title: { de: "Entwurf in Gmail abgeschickt" },
          plain: { de: "Schicke ich einen Entwurf direkt in Gmail ab, merkt der Bot das und setzt die Stelle auf „gesendet“." },
          dev: {
            de: "Die einzige Statusänderung des Syncs: Ein Job in 'postausgang' ohne sentAt, dessen Mail nach scrapedAt im Gesendet-Ordner auftaucht, wird 'gesendet' mit dem Datum der Mail. Dafür zählen auch Mails ohne Bewerbungs-Label.",
          },
          code: "sync-postausgang",
          files: ["lib/gmail-sync.ts"],
        },
        {
          node: "sync",
          title: { de: "Lücken füllen, nie überschreiben" },
          plain: { de: "Antworten werden nachgetragen, aber nur, wo noch nichts steht." },
          dev: {
            de: "replyReceivedAt wird nur gesetzt, wenn es fehlt. Die Jobliste wird nach dem Sent-Scan neu geladen, damit frisch gesetzte sentAt sofort für die Antwort-Zuordnung zählen.",
          },
          code: "sync-gaps",
          files: ["lib/gmail-sync.ts"],
        },
        {
          node: "replykind",
          title: { de: "Absage, Zusage oder Portal" },
          plain: { de: "Die KI liest jede Antwort und ordnet sie ein: Absage, Einladung, „bitte übers Portal bewerben“ oder nur eine Eingangsbestätigung." },
          dev: {
            de: "Ein JEV-Aufruf pro Mail, sechs Wahlmöglichkeiten A–F. Kontext ist Betreff plus Text ohne die zitierte eigene Mail, höchstens 1500 Zeichen. Urteile werden pro Mail gecacht. Ist das Modell nicht erreichbar, bleibt die Art leer und der nächste Sync versucht es neu.",
          },
          code: "sync-jev",
          files: ["lib/reply-kind-jev.ts", "lib/reply-kind.ts"],
          why: { de: "replyKind darf nur aufsteigen: Kommt nach der Eingangsbestätigung die Absage, gilt die Absage." },
        },
      ],
    },
  ],
};
