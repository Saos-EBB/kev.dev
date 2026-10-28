// Grundlagen as an arcade cabinet: a line drawing like the desk and monitor
// in About, a screen showing the picked game's start screen, three game
// buttons and "insert coin". The coin opens the live demo (facet-overlay,
// the Grundlagen widget) and jumps to the picked game there; the widget
// still asks for CheerpJ consent itself before anything loads.

import "./arcade.css";
import { UI } from "../i18n/ui";
import { displayText, esc, indexLine, type ProjectCard } from "./project-cards";

// Start screens, built from what the programs really print.
const GAMES: { id: string; label: string; screen: string }[] = [
  {
    id: "pokemon",
    label: "Pokémon",
    screen: `POKÉMON · KAMPF

Charmander  Fire
   vs
Bulbasaur   Grass/Poison

1 Pound    2 Karate Chop
3 DoubleSlap

> _`,
  },
  {
    id: "mastermind",
    label: "Mastermind",
    screen: `MASTERMIND

Gib 4 Zahlen (1-6) ein.
+---+---+---+---+------+
| ? | ? | ? | ? |      |
+---+---+---+---+------+

> _`,
  },
  {
    id: "minesweeper",
    label: "Minesweeper",
    screen: `MINESWEEPER

   0  1  2  3  4  5  6
A [X][X] 1       [X][X]
B [X] 2  1     1 [X][X]
C  1  1        1  2 [X]
D           1 [X][X][X]

> _`,
  },
];

const LINES = `<svg class="arcade-lines" viewBox="0 0 360 640" aria-hidden="true">
  <path d="M40 20 H320 V110 L300 130 V350 L340 390 V610 H20 V390 L60 350 V130 L40 110 Z"/>
  <path d="M40 110 H320 M60 130 H300 M60 350 H300 M20 390 H340 M20 470 H340"/>
  <path d="M76 146 H284 V334 H76 Z"/>
  <path d="M150 540 H210 V580 H150 Z M162 552 H198"/>
  <path d="M40 610 V630 M320 610 V630"/>
</svg>`;

export function renderArcade(card: ProjectCard, index: number, total: number): string {
  const first = GAMES[GAMES.length - 1];
  return `
    <article class="arcade" data-card="${esc(card.id)}" style="--pc: ${card.accent}">
      <p class="pcard-index">${indexLine(card, index, total)}</p>
      <div class="arcade-cab">
        ${LINES}
        <div class="arcade-marquee">${displayText(card.title)}</div>
        <pre class="arcade-crt" aria-label="${esc(first.label)}">${esc(first.screen)}</pre>
        <div class="arcade-games" role="group" aria-label="${esc(UI.arcadeGames)}">
          ${GAMES.map((g) => `<button type="button" data-arcade-pick="${g.id}" aria-pressed="${g === first}">${g.label}</button>`).join("")}
        </div>
        <button type="button" class="arcade-coin" data-facet="live-demo" data-card="${esc(card.id)}" data-arcade-game="${first.id}">${esc(UI.arcadeCoin)}</button>
      </div>
      <p class="arcade-note">${esc(UI.arcadeNote)}</p>
    </article>`;
}

// Once the widget is in the overlay, click its tab for the picked game.
function selectInWidget(game: string) {
  const find = () => document.querySelector<HTMLElement>(`.facet-overlay:not([hidden]) .gwidget-tab[data-note="${game}"]`);
  const hit = find();
  if (hit) return hit.click();
  const obs = new MutationObserver(() => {
    const tab = find();
    if (tab) { obs.disconnect(); tab.click(); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 8000);
}

export function initArcade(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".arcade").forEach((arcade) => {
    const crt = arcade.querySelector<HTMLElement>(".arcade-crt")!;
    const coin = arcade.querySelector<HTMLElement>(".arcade-coin")!;
    arcade.addEventListener("click", (e) => {
      const pick = (e.target as HTMLElement).closest<HTMLElement>("[data-arcade-pick]");
      if (pick) {
        const game = GAMES.find((g) => g.id === pick.dataset.arcadePick)!;
        crt.textContent = game.screen;
        crt.setAttribute("aria-label", game.label);
        coin.dataset.arcadeGame = game.id;
        arcade.querySelectorAll("[data-arcade-pick]").forEach((b) => b.setAttribute("aria-pressed", String(b === pick)));
        return;
      }
      // the facet overlay opens on the same click (document listener)
      if ((e.target as HTMLElement).closest(".arcade-coin")) selectInWidget(coin.dataset.arcadeGame!);
    });
  });
}
