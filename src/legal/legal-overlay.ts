// Impressum/Datenschutz used to be separate full-page-reload routes. That
// meant every visit killed and rebuilt the whole page: the YouTube player
// included, so music cut out and had to reload from scratch (a ~2s gap),
// and the header's dancer icon had to fake a "resume" that occasionally
// glitched into a visible wake-up/collapse blip. Living as hidden overlay
// panels on the one-pager instead means the JS/player context never gets
// destroyed in the first place — switching to Impressum is just toggling
// visibility, nothing else on the page (music, theme, scroll position)
// is touched.
//
// Routing is a plain URL hash (#impressum / #datenschutz): opening one
// sets location.hash (a normal <a href="#impressum"> already does this on
// its own), closing clears it. That keeps deep links and back/forward
// working without pulling in a router.
import type Lenis from "lenis";
import { UI } from "../i18n/ui";
import { LANG, RTL } from "../i18n";

interface LegalRoute {
  hash: string;
  title: string;
  html: string;
}

const ROUTES: LegalRoute[] = [
  {
    hash: "impressum",
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
      <p><a href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a></p>

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
  {
    hash: "datenschutz",
    title: "Datenschutzerklärung",
    html: `
      <h1 class="legal-title">Datenschutzerklärung</h1>

      <h2>Verantwortlicher</h2>
      <p>
        Kevin Schaberl, Ottensheim, Österreich<br />
        <a href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a>
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
        Widerspruch. Wenden Sie sich dafür an
        <a href="mailto:kevin.schaberl.work@gmail.com">kevin.schaberl.work@gmail.com</a>.
      </p>
      <p>
        Außerdem können Sie sich bei der Aufsichtsbehörde
        beschweren:<br />
        <strong>Österreichische Datenschutzbehörde</strong>,
        Barichgasse 40–42, 1030 Wien,
        <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">dsb.gv.at</a>
      </p>
    `,
  },
];

export function initLegalOverlay(lenis: Lenis) {
  const panels = new Map<string, HTMLElement>();

  for (const route of ROUTES) {
    const panel = document.createElement("div");
    panel.className = "legal-overlay";
    panel.dataset.route = route.hash;
    panel.innerHTML = `
      <main class="legal-main">
        <article class="legal">
          ${UI.legalNote ? `<p class="legal-lang-note" lang="${LANG}">${UI.legalNote}</p>` : ""}
          <div lang="de" dir="ltr">${route.html}</div>
          <a class="legal-back" href="#">${RTL ? "&rarr;" : "&larr;"} ${UI.legalBack}</a>
        </article>
      </main>
    `;
    document.body.appendChild(panel);
    panels.set(route.hash, panel);

    // preventDefault so the empty-fragment href never triggers the
    // browser's native "no target → scroll to top of document" fallback
    // — that would silently reset the main page's scroll position out
    // from under Lenis. replaceState instead of leaving the old hash
    // around also means the back button, on close, goes to wherever the
    // visitor actually was before opening this panel.
    panel.querySelector<HTMLAnchorElement>(".legal-back")?.addEventListener("click", (e) => {
      e.preventDefault();
      history.replaceState(null, "", location.pathname + location.search);
      render();
    });
  }

  const siteTitle = document.title;
  let isOpen = false;
  let wasStoppedBeforeOpen = false;

  function currentRoute(): string | null {
    const hash = location.hash.replace(/^#/, "");
    return panels.has(hash) ? hash : null;
  }

  function render() {
    const active = currentRoute();

    if (active && !isOpen) {
      // Closed → open: remember whether Lenis was already stopped for an
      // unrelated reason (e.g. the intro loader) so closing doesn't
      // resume scrolling that wasn't ours to resume.
      wasStoppedBeforeOpen = lenis.isStopped;
      lenis.stop();
    } else if (!active && isOpen) {
      if (!wasStoppedBeforeOpen) lenis.start();
    }
    isOpen = Boolean(active);

    document.documentElement.classList.toggle("legal-open", isOpen);
    document.title = active ? `${ROUTES.find((r) => r.hash === active)!.title} — Kevin Schaberl` : siteTitle;

    for (const [hash, panel] of panels) {
      const isActive = hash === active;
      panel.classList.toggle("is-open", isActive);
      if (isActive) panel.scrollTop = 0;
    }
  }

  window.addEventListener("hashchange", render);
  render();
}
