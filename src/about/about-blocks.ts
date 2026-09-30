// About overlay blocks (A1–A5). Facts (A1) / story (A2) / stance (A3) /
// way of working (A4) / taste (A5). Copy is verbatim from the handoff;
// anything Kevin still has to decide is shown as a visible [OFFEN: …].

import "./about-blocks.css";

// Kevin drops his CV PDF into public/cv/ under this name.
const CV_HREF = "/cv/lebenslauf.pdf";

const PRINCIPLES = [
  "Wenn das Konzept durchdacht ist, ist das Implementieren der entspannte Teil.",
  "Einfache Lösungen brechen weniger leicht — und jeder nach mir versteht sie.",
  "Fertig ist nicht, wenn es l\u00e4uft \u2014 fertig ist, wenn es sich richtig anf\u00fchlt.",
];

// A2 "Der Weg hierher" \u2014 verbatim from Kevin, first person, minimally smoothed.
const STORY = [
  'Mit 15 habe ich meinen Fernseher zerlegt, ohne die geringste Ahnung davon zu haben \u2014 und wieder zum Laufen gebracht. Das ist ungef\u00e4hr das Muster geblieben: <span class="about-highlight">Ich habe noch nie akzeptiert, dass etwas nicht geht.</span> Es gibt immer eine L\u00f6sung, man muss nur lange genug suchen. Vorher wollte ich \u00fcbrigens Modedesigner werden und habe W\u00e4nde bemalt \u2014 dass das Logo auf dieser Seite durch 37 Schriften l\u00e4uft, von denen f\u00fcnf meine eigene Handschrift sind, ist also kein Zufall.',
  'Beruflich ging es trotzdem anders los. Mit 15 habe ich angefangen zu arbeiten: B\u00f6den verlegen, sp\u00e4ter Sonnenschutz montieren, dazwischen eine Weile Vertrieb. Handwerk, das ich bis heute nicht schlechtrede, aber es sah jeden Tag gleich aus. Nebenher habe ich WoW gespielt und Gold gehandelt; <span class="about-highlight">die Wirtschaft in dem Spiel zu durchschauen</span> hat mir irgendwann mehr Spa\u00df gemacht als das Spiel selbst.',
  'Mit 26 kam der Zivildienst, in der Gesch\u00e4ftsstelle Linz einer Bundesagentur. Die haben mich danach direkt \u00fcbernommen \u2014 die Stelle, auf der ich dann sa\u00df, gab es vorher nicht, sie ist um mich herum entstanden. Ich war dort Administrator und habe alles an IT \u00fcbernommen, was ohne Admin-Rechte ging. Dabei habe ich etwas gesehen, das ich vorher nicht f\u00fcr m\u00f6glich gehalten h\u00e4tte: Leute, die seit zwanzig Jahren im B\u00fcro sitzen und Text mit der Maus markieren, um ihn per Rechtsklick zu kopieren. Nicht aus Dummheit \u2014 es hat ihnen nur nie jemand gezeigt, und die meisten wollen es auch nicht wissen. <span class="about-highlight">Ich wollte es wissen.</span>',
  '\u00dcber eine Schnupperwoche als Sysadmin bin ich dann zum Programmieren gekommen. Eine Woche, in der ich Aufgaben l\u00f6sen musste \u2014 danach war es vorbei. <span class="about-highlight">Mein Kopf hat gebrannt</span>, ich sa\u00df bis in die Nacht mit Stift und Block da und habe mir L\u00f6sungen f\u00fcr Aufgaben \u00fcberlegt, die l\u00e4ngst abgegeben waren. Bis ich etwas daraus machen konnte, dauerte es allerdings: Dazwischen lagen anderthalb Jahre, in denen ich das Haus meiner Urgro\u00dfeltern in Linz-Ebelsberg renoviert habe, damit es in der Familie bleibt.',
  'Dann habe ich meine Freundin kennengelernt, und kurz darauf war klar, dass wir einen Sohn bekommen. Das war der Punkt, an dem aus \u201eirgendwann\u201c ein Datum wurde. Im Oktober 2025 habe ich das Bootcamp angefangen und im Juni 2026 abgeschlossen \u2014 acht Monate, acht Stunden am Tag lernen und schreiben. Was ich dort mitgenommen habe, sind weniger die Frameworks als die Denkweise: wie man ein Problem so lange auseinandernimmt, bis es l\u00f6sbar wird. <span class="about-highlight">Und das Zutrauen, dass ich genau das kann.</span>',
  'Alles, was unter <a class="about-inline-link" href="#projects">Projekte</a> steht, ist seitdem entstanden \u2014 in rund zehn Monaten ab meiner ersten Zeile Code. Am meisten reizt mich dabei der ganze Weg: planen, die Datenbank entwerfen, das Backend bauen, das Frontend nachziehen, testen, und so lange verbessern, bis es sich richtig anf\u00fchlt. \u00dcberwiegend <span class="about-highlight">TypeScript</span>, weil ich damit den gesamten Stack in einer Sprache baue; darunter liegt Java, von dort kommen die Grundlagen. Und weil mich interessiert, wie Dinge funktionieren, steht dort einiges, das ich selbst gebaut habe, statt eine Bibliothek zu nehmen: eine eigene verkettete Liste, eine eigene 3D-Projektion, ein Renderer, der irgendwann CT-Datens\u00e4tze verdauen konnte. Die Reihenfolge ist meistens dieselbe: etwas nervt mich oder interessiert mich \u2014 dann baue ich es.',
];

// A1–A4: shown before the CV facts.
export function renderAboutBlocks(): string {
  return `
    <section class="about-block about-card" aria-label="Kurzprofil">
      <h2 class="about-card-name">Kevin Schaberl</h2>
      <p class="about-card-role">Junior Software Developer</p>
      <p>Raum Linz · remote im DACH-Raum</p>
      <p>sofort verfügbar</p>
      <p>TypeScript-Fullstack · Autodidakt</p>
      <a class="about-button" href="${CV_HREF}" download>Lebenslauf ↓</a>
    </section>

    <section class="about-block" aria-labelledby="about-story">
      <h3 class="about-heading" id="about-story">Der Weg hierher</h3>
      ${STORY.map((p) => `<p>${p}</p>`).join("")}
    </section>

    <section class="about-block" aria-label="Grundsätze">
      ${PRINCIPLES.map((q) => `<blockquote class="about-quote">${q}</blockquote>`).join("")}
    </section>

    <section class="about-block" aria-labelledby="about-work">
      <h3 class="about-heading" id="about-work">Wie ich arbeite</h3>
      <p><span class="about-highlight">Ich denke, bevor ich baue.</span> Planung war schon als Bodenleger das A und O — Rapport-Muster für verwinkelte Gänge, die durchlaufen mussten — und als Systemadministrator erst recht: Termine, Ausfallpläne, Behörden, alles unter Zeitdruck.</p>
      <p>Beim Code ist es dieselbe Denkweise, nur neues Werkzeug: Ist das Konzept durchdacht, ist das Implementieren der <span class="about-highlight">entspannte Teil</span>.</p>
      <p>Ich setze Ideen direkt um und teste sie; hakt es, ist das für mich das Signal, dass der Plan noch nicht scharf genug war — dann gehe ich einen Schritt zurück, strukturiere neu und setze wieder an, <span class="about-highlight">bis es sitzt</span>.</p>
      <p>Die Umsetzung läuft heute oft über <span class="about-highlight">Claude Code</span> als Implementierungs-Agent — Konzept und Architektur kommen von mir, CC schreibt den Code. Gleiche Schleife, nur schneller.</p>
      <p>Nebenbei geht's oft weniger ums Bauen als ums Verstehen: Videos schauen, Architektur und Design studieren, sehen, wie andere ihre Sachen lösen. An einem Projekt bleibe ich meist <span class="about-highlight">zwei bis sieben Tage</span>, dann wechsle ich zum nächsten — nicht weil es fertig ist, sondern weil ich eine Idee oder ein Konzept in einem anderen Bereich ausprobieren will.</p>
    </section>
  `;
}

// A5: soft footer, after the CV facts.
export function renderAboutFooter(): string {
  return `
    <section class="about-block about-footer" aria-label="Zum Schluss">
      <p>Wenn ich nicht am Bildschirm sitze, dreht sich mein Alltag um <span class="about-highlight">meinen Sohn</span> — als Vater will ich möglichst viel Zeit mit ihm haben und trotzdem alles unter einen Hut bekommen: managen, lernen, was bauen.</p>
      <div class="about-cta">
        <a class="about-button" href="#projects">Projekte</a>
        <a class="about-button" href="${CV_HREF}" download>Lebenslauf ↓</a>
      </div>
    </section>
  `;
}
