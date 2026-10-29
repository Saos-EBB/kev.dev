// Motion Lab (hidden page, saosebb43/index.html; only mounts when the URL
// hash is #isking — obscurity, not protection: the hash ships in this
// file). A playground for the thrown objects (throws.ts, also on the main
// page) with a sound toggle, plus flat cards that use the same vanish
// dissolve.
import "../style.css";
import "../reading.css";
import "./motion-lab.css";
import "@fontsource-variable/jetbrains-mono";
import { gsap } from "gsap";
import { startThrows } from "./throws";
import * as sound from "./sound";

const MARKUP = `
  <div class="ml-scene js-scene"></div>
  <header class="ml-head">
    <h1 class="ml-title">Motion Lab</h1>
    <p class="ml-hint">Something gets thrown at you every 5–15 s. Grab it and let go — it dissolves. Click a card to vanish it.</p>
    <button class="ml-sound js-sound" type="button" aria-pressed="false">Sound: off</button>
  </header>
  <section class="ml-cards">
    <article class="ml-card js-vanish"><h2>Why?</h2><p>Hairline box, see-through, grid underneath.</p></article>
    <article class="ml-card js-vanish"><h2>Learned!</h2><p>Sprite mask, stepped, no tween.</p></article>
    <article class="ml-card js-vanish"><h2>Code</h2><p>Click again once it is back.</p></article>
  </section>`;

// Without the hash the page stays an empty body; changing the hash
// reloads so the gate is checked again.
window.addEventListener("hashchange", () => location.reload());
if (location.hash === "#isking") mount();

function mount() {
  document.body.classList.add("ml");
  document.body.innerHTML = MARKUP;

  startThrows(document.querySelector<HTMLElement>(".js-scene")!);

  // ---- Sound toggle ---------------------------------------------------

  const soundBtn = document.querySelector<HTMLButtonElement>(".js-sound")!;
  let soundOn = false;
  soundBtn.addEventListener("click", async () => {
    soundOn = !soundOn;
    if (soundOn) await sound.unlock();
    sound.setMuted(!soundOn);
    soundBtn.textContent = `Sound: ${soundOn ? "on" : "off"}`;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
  });

  // ---- Vanish on flat UI ---------------------------------------------

  document.querySelectorAll<HTMLElement>(".js-vanish").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("is-vanishing")) return;
      card.classList.add("is-vanishing");
      card.addEventListener(
        "animationend",
        () => {
          card.classList.replace("is-vanishing", "is-gone");
          gsap.delayedCall(1, () => card.classList.remove("is-gone"));
        },
        { once: true },
      );
    });
  });
}
