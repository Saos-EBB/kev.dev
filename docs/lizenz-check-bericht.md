# Lizenz- und Rechte-Check: alle Repos von Saos-EBB

Stand: 2026-10-06. Auftrag: `docs/handoff-lizenz-check.md`. Nur gelesen, nichts geändert.

**Wie geprüft:** alle 15 Repos geklont (Stand `main`). Geprüft wurden Dateien, `package.json`-Lizenzen und Abhängigkeiten. Dazu kam eine Mustersuche nach Geheimnissen und persönlichen Daten. Bei den öffentlichen Repos mit Code wurde auch die Git-Historie durchsucht: kev.dev, YourBrand, JoBBoT, ReleaseWatcher, AniScript, Renderder, pkemn, jeweils bis 1000 Commits, also komplett.

**Grenzen:**
- Bei den drei privaten Repos ist nur der aktuelle Stand geprüft, nicht die Historie.
- Bei YourBrand und JoBBoT sind die Abhängigkeiten nur nach Namen bewertet, nicht installiert und maschinell geprüft.
- Keine Rechtsberatung. Was sich nicht belegen ließ, steht als **unklar** drin.

---

## 1. Übersicht

| Repo | Sichtbar | Lizenz heute | Fremdes drin? | Risiko | Wichtigster Punkt |
|---|---|---|---|---|---|
| kev.dev | public | keine | ja | **hoch** | Wohnadresse, Telefonnummer und Geburtsdatum öffentlich (Repo + CV-PDF auf der Seite) |
| faceDots | public | keine | nein (MediaPipe nur als Abhängigkeit) | niedrig | nur Lizenz fehlt |
| YourBrand | public | `UNLICENSED` (package.json), keine Datei | ja, viel | **hoch** | urheberrechtlich geschützte Musik/Filmtöne, Fotos echter Personen, Meme-Sounds über reale Person |
| JoBBoT | public | keine | ja | **hoch** | `data/mail-log.md`: jede Bewerbung samt Namen und E-Mails von Recruitern |
| AniScript | public | keine | unklar | mittel | Herkunft des adaptierten Fremd-Scripts nicht genannt; Ziel ist eine Piraterie-Streamingseite |
| Renderder | public | `ISC` im package.json, keine Datei | ja | mittel | erste Version ist Tsodings MIT-Code ohne Lizenztext; 18 heruntergeladene Modelle ohne Herkunft |
| ReleaseWatcher | public | keine | wenig | niedrig | TMDB-Pflichthinweis fehlt; MIT-Skills ohne Lizenztext |
| pkemn | public | keine | Marken | niedrig | Pokémon-Namen (Nintendo-Marken), Disclaimer fehlt |
| RPN-Calculator | public | keine | nein | keins | — |
| -GAMES- | public | keine | nein | keins | — |
| Custom-Datastructures | public | keine | nein | keins | — |
| PersonalManagement | public | keine | nein | keins | — |
| jobbotMaiia | private | keine | ja (wie JoBBoT) | niedrig, solange privat | Kopie der Bewerbungs-Logs |
| monorepo | private | `UNLICENSED`/`ISC` gemischt | ja, viel | niedrig, solange privat | Archiv von allem inkl. Kursmaterial Dritter, darf nie public werden |
| b2b-cv | private | keine | ja, aber **dokumentiert** (`ASSETS.md`) | niedrig, solange privat | Vorbild für Asset-Dokumentation |

**Wichtig für alles Folgende:** Etwas nur im aktuellen Stand zu löschen, reicht bei öffentlichen Repos nicht. Die Dateien bleiben in der Git-Historie abrufbar. Es gibt dann drei Wege: die Historie umschreiben (`git filter-repo` plus Force-Push), das Repo privat stellen, oder es neu ohne Historie anlegen.

---

## 2. Pro Repo

### kev.dev (public)

**Lizenz heute:** keine. `package.json`: kein Feld.

**Persönliche Daten**, Risiko hoch:
- `scripts/build-cv.mjs:31-35`: Telefonnummer, **volle Wohnadresse**, Geburtsdatum. Liegt öffentlich im Repo und in der Historie.
- `public/cv/lebenslauf-kevin-schaberl-{dark,light}.pdf`: derselbe Inhalt, auf der Seite frei herunterladbar.
- „Linz-Ebelsberg“ im About-Text ist nur die Ortsangabe eines Projekts, unkritisch.

**Abhängigkeiten:** alles permissiv. MIT (Lenis, leo-profanity, React …), ISC, Apache-2.0 (MediaPipe), OFL-1.1 (JetBrains Mono). GSAP läuft unter der eigenen „Standard License“, die inzwischen kostenlos ist, auch kommerziell. Für eine Website unproblematisch.

**Fremde Dateien:**
- `public/fonts/koeeya-trial.ttf`: **Trial-Version** der Display-Schrift, aktuell **unklar**. Trial-Lizenzen erlauben oft nur Tests, keine Veröffentlichung. Die Satzzeichen tragen ein „pdt.“-Wasserzeichen. Lizenzbedingungen des Herstellers prüfen, sonst Vollversion kaufen oder Schrift ersetzen.
- `public/fonts/ui/*`: Space Grotesk, Source Serif 4, Courier Prime, JetBrains Mono, alle OFL-1.1 laut b2b-cv/ASSETS.md. OK.
- `public/face-dots/selfie_multiclass_256x256.tflite` plus MediaPipe-wasm: Apache-2.0. **Pflicht offen:** Ein Lizenz- bzw. NOTICE-Hinweis fehlt.
- `public/images/laser_gun.png`, `social-mail.png`, `social-phone.png`, `public/sounds/railgun.mp3`: laut b2b-cv/ASSETS.md CC0 nach deiner Angabe, Quelle nicht dokumentiert. `public/images/raygun.png` ist **unklar**, dazu gibt es keinen Eintrag.
- `src/projects/widgets/renderer-models/` (ducky, car, pochita30, craniumCut01): Herkunft offen. Die Lücken stehen schon in b2b-cv/ASSETS.md: Ducky und Car ganz ohne Quelle; Cranium wohl `sjpiper145/skull-ct-scan…`, CC0 nur aus der Erinnerung. Pochita ist eine Figur aus *Chainsaw Man* (Fan-Modell, Rechte der Figur bei Tatsuki Fujimoto/Shueisha). Für ein nicht-kommerzielles Portfolio ist das ein geringes Risiko, aber trotzdem Fremd-IP.
- `public/projects/yourbrand/*`: der Showcase ist ohne Discover-Screen eingebaut. In den Chat-Screens sind die Profilbilder aus den Testdaten nur als winzige Avatare zu sehen.
- `public/java/grundlagen.jar`, CheerpJ: Community License, kostenlos für persönliche Projekte mit Credit und nur vom offiziellen CDN. Beides ist erfüllt (steht in `docs/offen.md`).
- `yourbrand/`: Kopie der B2B-Seite aus b2b-cv. Deren Assets sind in b2b-cv/ASSETS.md dokumentiert.

**Inhaltlich heikel:** Die AniScript-Card nennt als Zielseite **aniworld.to**, eine nicht lizenzierte Streamingseite. Das wirkt auf einer Bewerbungsseite schlecht.

**Vorschlag:** keine Lizenz bzw. „All rights reserved“ (Portfolio, Design nicht freigeben). Dazu eine `NOTICE`- bzw. Credits-Datei für MediaPipe, Fonts, CheerpJ und die CC0-Assets.

### faceDots (public)

**Lizenz heute:** keine. Fremder Code: keiner. `@mediapipe/tasks-vision` ist nur als peerDependency eingetragen, das Modell wird nicht mitgeliefert. Persönliche Daten: keine.

**Vorschlag:** **MIT**, so war es schon geplant. Optional ein Satz in der README, dass das Modell unter Apache-2.0 von Google steht.

### YourBrand (public), Risiko hoch

**Lizenz heute:** `backend/package.json` sagt `"license": "UNLICENSED"`, eine LICENSE-Datei gibt es nicht. Faktisch heißt das: alle Rechte vorbehalten.

**Abhängigkeiten:** nach Namen alle permissiv (NestJS, TypeORM, pg, Stripe, socket.io, bullmq, Next, React …: MIT; sharp, aws-sdk: Apache-2.0). `sharp` bindet libvips ein (LGPL-3.0, dynamisch gelinkt), für Server-Einsatz unproblematisch.

**Fremde Medien**, das Hauptproblem:
- `frontend/public/sounds/`: *american-psycho.mp3*, *clockwork-orange.mp3* (97 MB), *reservoir-dogs.mp3*, *trainspotting.mp3*, *where_is_my_mind.mp3* (Pixies). Das sind Filmtonspuren und kommerzielle Musik, **urheberrechtlich geschützt**. Öffentlich verteilt ist das eine klare Urheberrechtsverletzung.
- `frontend/media/` und `frontend/public/ban-audio/`: Meme-Sounds, u. a. **drachenlord-sirene.mp3**. Drachenlord ist eine reale Person mit bekannter Belästigungsgeschichte. Dazu „when-do-me-and-you-have-a-sexy-intercourse.mp3“, John Cena, „Nani“. Das ist Urheberrecht plus Persönlichkeitsrecht, und für eine Bewerbung rufschädigend.
- `backend/demoAudio/`: u. a. *rihanna-work-warcraft-3-peon-remix…mp3* (Rihanna und Blizzard). Die übrigen `m*.mp3`/`f*.mp3` sind **unklar**.
- `backend/demoPfp/` (45 Bilder): Testprofile mit Fotos echter Personen und Promis (Ian McKellen als Gandalf, das Foto einer realen Frau, ein Diddy-Meme), dazu Manga/Anime (Berserk, One Piece). Das berührt das **Recht am eigenen Bild** und das Urheberrecht.
- `backend/src/database/seeds/cities.csv`: Städtedaten, Quelle **unklar**. Vermutlich GeoNames-basiert, dann wäre CC-BY-4.0 mit Namensnennung nötig.
- `frontend/public/images/raygun.png`, `laser_gun.png`, `social-*.png`: siehe kev.dev. `social-whatsapp.png` ist laut b2b-cv ein abgewandeltes Meta-Logo, hier aber noch drin.

**Geheimnisse:** keine echten. In der Historie stehen nur Platzhalter und `MINIO_ROOT_PASSWORD=minioadmin123`. Das ist ein Dev-Standardwert, er darf nirgends produktiv laufen.

**Vorschlag Lizenz:** hängt von deinem Plan ab. Willst du es selbst verwerten: keine Lizenz oder **AGPL-3.0**. Ist es nur ein Showcase: MIT ginge, dann darf aber jeder es kommerziell betreiben. **Vor jeder Lizenzfrage** müssen die Medien raus, aus dem Stand und aus der Historie, oder das Repo wird privat.

### JoBBoT (public), Risiko hoch

**Persönliche Daten Dritter:**
- `data/mail-log.md` (234 Zeilen) und `data/filter-log.md` (5045 Zeilen): deine komplette Bewerbungshistorie mit Firmen, Stellen und Daten. Dazu **Namen und persönliche E-Mail-Adressen einzelner Recruiter** (vorname.nachname@firma). Das sind personenbezogene Daten Dritter, öffentlich (DSGVO). Außerdem sieht jeder künftige Arbeitgeber, wo du dich sonst noch beworben hast.
- `test/fixtures/*`: echte Stellenanzeigen, teils mit Kontaktpersonen.

**Scraping:** `scrapers/linkedin.ts`. LinkedIns Nutzungsbedingungen verbieten Scraping ausdrücklich, und LinkedIn geht dagegen vor. Dazu karriere.at, jobs.at, devjobs.at, AMS. Deren AGB sind **unklar**, nur notiert.

**Geheimnisse:** keine. `GMAIL_APP_PASSWORD` steht nur als Platzhalter in Doku und `.env.example`.

**Abhängigkeiten:** imapflow (MIT), nodemailer (MIT-0).

**Vorschlag:** `data/*.md` und Fixtures mit Personennamen aus Stand **und Historie** entfernen, oder das Repo privat stellen. Lizenz danach: MIT ist möglich, wegen der Scraper eher **keine**.

### jobbotMaiia (private)

Eine Weiterentwicklung von JoBBoT (Installer, Setup-Assistent, StepStone-Scraper), mit denselben `data/*.md`-Logs. Solange privat, unkritisch. **Unklar:** Ist das für eine andere Person („Maiia“) gedacht? Dann dürfen ihre Daten nie hinein. Im Moment liegen keine drin, `profile/` ist leer.

### AniScript (public), Risiko mittel

**Lizenz heute:** keine.
- **Herkunft unklar:** Laut Portfolio-Card ist das Script „adaptiert und erweitert, nicht neu gebaut“. Die README dankt aber nur deiner eigenen Version „AniScript Lite 0.1.5 by Saos-EBB“. Wenn ein fremdes Original existiert, fehlt die Namensnennung. Steht das Original unter GPL, muss dein Repo GPL sein. **Du musst sagen, woher das Original stammt.**
- **Ziel:** aniworld.to und s.to sind nicht lizenzierte Streamingseiten. Das Script automatisiert Autoplay und Intro-Skip dort. Rechtlich trifft das eher die Seiten als dich, aber auf der Bewerbungsseite fällt es negativ auf.
- Die Joyn-, RTL+- und YouTube-Scripts verändern fremde Seiten im eigenen Browser. Das ist üblich, ein geringes Risiko.

**Vorschlag:** Herkunft klären. Danach MIT (wenn das Original es zulässt) oder privat stellen. Auf kev.dev die Zielseite nicht nennen.

### Renderder (public), Risiko mittel

**Lizenz heute:** `package.json` sagt `"license": "ISC"`, das ist ein npm-Default. Eine LICENSE-Datei fehlt. Der Widerspruch sollte aufgelöst werden.
- **Tsoding:** Die README sagt, „der erste Wurf war im Wesentlichen sein Code aus dem Video“. Tsodings `formula`-Repo steht unter **MIT** (© 2025 Alexey Kutepov). MIT verlangt, dass Copyright-Hinweis und Lizenztext mitgehen. Ein Credit in der README allein reicht formal nicht.
- **18 Modelle** in `.idea/html5canvasAnimations/modelle/` (beetle, car, cat, craniumCut01, „dick“, ducky, forMax01, katana, klo, pochita10/30/64, shark, skull, statue00, stoneman, teapot, totempole): aus heruntergeladenen OBJ- und STL-Dateien, ohne jede Herkunftsangabe. Typische Quellen wie Sketchfab oder Thingiverse verlangen oft CC-BY (Namensnennung) oder verbieten kommerzielle Nutzung. Pochita ist Fremd-IP. Was „dick.js“ darstellt, ist **unklar**: bitte prüfen, was das Modell ist, öffentlich mit dem Namen.
- Nebenbei: Die Modelle liegen im IDE-Ordner `.idea/`.

**Vorschlag:** MIT mit Tsodings Copyright-Hinweis im LICENSE. Die Modelle entweder mit Herkunft und Lizenz dokumentieren oder durch eigene bzw. CC0-Modelle ersetzen.

### ReleaseWatcher (public), Risiko niedrig

- Nutzt nur offizielle APIs: TMDB, AniList, MangaDex, TVDB. **TMDB verlangt** den Hinweis „This product uses the TMDB API but is not endorsed or certified by TMDB“ samt Logo-Regeln. Fehlt bisher.
- `.claude/skills/*` stammen aus `mattpocock/skills` (MIT, © Matt Pocock). Der Lizenztext fehlt bei den Kopien.
- Keine Geheimnisse, die API-Keys stehen nur in `.env.example`.

**Vorschlag:** MIT, TMDB-Hinweis in die README, Lizenzhinweis für die Skills.

### pkemn (public), Risiko niedrig

Ein Lernprojekt in Java. Es enthält 17 Pokémon mit Namen und Werten sowie 20 Attacken als CSV. Namen sind Marken von Nintendo, Game Freak und The Pokémon Company. Werte sind Fakten. Für ein nicht-kommerzielles Fan- und Lernprojekt ist das üblich.

**Vorschlag:** Disclaimer in die README („Fan-Projekt, nicht verbunden mit Nintendo/Game Freak; Pokémon ist eine Marke von …“). Lizenz: MIT für den eigenen Code.

### RPN-Calculator, -GAMES-, Custom-Datastructures, PersonalManagement (public)

Reiner eigener Java-Code aus dem Bootcamp, keine Assets, keine Daten. Keinerlei Risiko. **Vorschlag:** MIT, oder lassen wie es ist.

### monorepo (private)

Ein Archiv, das alle Projekte zusammenführt, einschließlich der YourBrand-Medien, des CV mit Adresse und von `learning/talenthub-it-challenges/` mit **Kursmaterial von TalentHub/ibis acam** (Aufgaben, Bilder, ein PDF). Dieses Material gehört dem Kursanbieter. **Darf nicht public werden.** Eine Lizenz braucht es nicht.

### b2b-cv (private)

Hat mit `ASSETS.md` bereits eine saubere Herkunftsliste, die als **Vorlage für alle anderen Repos** taugt. Offen laut eigener Liste: `SparklesTrippies.otf` (FFC-Lizenz unbelegt) sowie die Herkunft der Modelle Ducky, Car und Cranium. Das CV-PDF mit Adresse liegt drin. Privat ist das okay.

---

## 3. Pflichten, die schon jetzt gelten (unabhängig von deiner Lizenzwahl)

1. **kev.dev:** Lizenzhinweis für MediaPipe (Apache-2.0) mitliefern.
2. **Renderder:** Tsodings MIT-Hinweis mitliefern.
3. **ReleaseWatcher:** TMDB-Attribution; MIT-Hinweis für die mattpocock-Skills.
4. **kev.dev und YourBrand:** Herkunft und Lizenz der Fremd-Assets dokumentieren (nach dem Muster von b2b-cv/ASSETS.md).

---

## 4. Offene Entscheidungen für dich

1. **CV-Daten auf kev.dev:** Adresse, Telefon und Geburtsdatum aus `scripts/build-cv.mjs` und dem öffentlichen PDF entfernen, z. B. nur „Raum Linz“, ohne Telefon und Geburtsdatum? Und aus der Git-Historie tilgen (das heißt Force-Push auf `main`)?
2. **YourBrand-Medien:** Filmtöne, Musik, Meme-Sounds und Fotos echter Personen raus und durch eigene oder CC0-Dateien ersetzen? Dann mit Historie bereinigen. Oder das Repo privat stellen und nur den Showcase zeigen?
3. **YourBrand-Lizenz:** Willst du es selbst verwerten (dann keine Lizenz oder AGPL), oder ist es nur ein Showcase (MIT möglich)?
4. **JoBBoT:** Bewerbungs-Logs und Fixtures mit Personennamen aus Stand und Historie entfernen, oder das Repo privat stellen? Bleibt der LinkedIn-Scraper öffentlich?
5. **AniScript:** Woher stammt das Original (Autor, Link, Lizenz)? Soll aniworld.to auf kev.dev weiter genannt werden?
6. **Renderder:** Woher kommen die 18 Modelle? Was ist „dick.js“? Dokumentieren oder ersetzen?
7. **Koeeya Trial:** Lizenzbedingungen prüfen, Vollversion kaufen oder Schrift ersetzen?
8. **Lizenzen setzen:** faceDots → MIT (wie geplant). Kleine Java-Repos und pkemn → MIT? kev.dev → keine bzw. „All rights reserved“?
9. **jobbotMaiia:** Für wen ist es gedacht, und bleibt es privat?

---

## 5. Vorschlag für die Reihenfolge (Grundlage für den Plan)

1. **Sofort (Datenschutz):** CV-Daten auf kev.dev, Bewerbungs-Logs in JoBBoT. Beides betrifft dich bzw. Dritte direkt.
2. **Bald (Urheberrecht):** YourBrand-Medien raus oder Repo privat; AniScript-Herkunft klären.
3. **Dann (Pflichten):** MediaPipe-, Tsoding-, TMDB- und Skills-Hinweise; Asset-Listen für kev.dev und YourBrand.
4. **Zum Schluss (Lizenzen):** LICENSE-Dateien nach deinen Entscheidungen in Abschnitt 4 setzen.
