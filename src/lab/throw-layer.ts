import { UI } from "../i18n/ui";
import { startThrows } from "./throws";
import { setMuted, unlock } from "./sound";

// The thrown objects' layer (throws.ts) for the skull variant
// (/saos#dev#skull, src/ct/page.ts): fixed over the whole viewport, so a
// throw is always in view wherever the page is scrolled. Sound unlocks on
// the visitor's first click/tap/key (browsers allow audio only after a
// gesture); the fixed mute button at the bottom right turns it off, and
// the choice is remembered.
const THROWS_MUTED_KEY = "saos-throws-muted";

export function startThrowLayer() {
  let muted = false;
  try {
    muted = localStorage.getItem(THROWS_MUTED_KEY) === "1";
  } catch {
    // storage blocked: just start unmuted
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "throws-mute";
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path class="throws-mute-on" d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path class="throws-mute-off" d="m23 9-6 6M17 9l6 6" />
    </svg>`;
  const render = () => {
    btn.setAttribute("aria-pressed", String(muted));
    btn.setAttribute("aria-label", muted ? UI.throwsUnmute : UI.throwsMute);
    btn.title = btn.getAttribute("aria-label")!;
    setMuted(muted);
  };
  btn.addEventListener("click", () => {
    muted = !muted;
    try {
      localStorage.setItem(THROWS_MUTED_KEY, muted ? "1" : "0");
    } catch {
      // not remembered, still applied for this visit
    }
    render();
  });
  render();

  const layer = document.createElement("div");
  layer.className = "ml-scene";
  layer.setAttribute("aria-hidden", "true");
  layer.style.setProperty("--throws-z", "160");
  document.body.append(layer, btn);
  startThrows(layer, 3);

  const onFirstGesture = () => {
    unlock().then(render);
    window.removeEventListener("pointerdown", onFirstGesture);
    window.removeEventListener("keydown", onFirstGesture);
  };
  window.addEventListener("pointerdown", onFirstGesture);
  window.addEventListener("keydown", onFirstGesture);
}
