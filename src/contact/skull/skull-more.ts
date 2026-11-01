// The button that appears once the splatter has settled: each press sends one
// more saw blade into the skull (skull-scene.ts, `moreHit`). After the last
// blade it asks whether you're sure; "yes" opens a small player in the bottom
// right corner of the page, nothing but the video. YouTube only loads there, so
// without an earlier consent (consent.ts) the question says what "yes" loads.
import { grantConsent, hasConsent } from "../../consent";
import { UI } from "../../i18n/ui";

const VIDEO = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&playsinline=1";

export function createSkullMore(stage: HTMLElement) {
  let hitsLeft: () => number = () => 0;
  let moreHit: () => void = () => {};
  let opened = false; // the player stays, and only opens once

  const button = document.createElement("button");
  button.type = "button";
  button.className = "skull-more";
  button.textContent = UI.skullMore;
  button.hidden = true;

  const dialog = document.createElement("div");
  dialog.className = "skull-sure";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-label", UI.skullSure);
  dialog.hidden = true;
  dialog.innerHTML = `
    <p class="skull-sure-title">${UI.skullSure}</p>
    <p class="skull-sure-note" hidden>${UI.skullSureConsent} <a href="#datenschutz">${UI.consentPrivacy}</a></p>
    <div class="skull-sure-actions">
      <button type="button" data-yes>${UI.skullYes}</button>
      <button type="button" data-no>${UI.skullNo}</button>
    </div>`;
  stage.append(button, dialog);

  const closeDialog = () => {
    dialog.hidden = true;
    button.hidden = false;
    button.focus();
  };

  button.addEventListener("click", () => {
    button.hidden = true;
    if (hitsLeft() > 0) {
      moreHit();
      return;
    }
    dialog.querySelector<HTMLElement>(".skull-sure-note")!.hidden = hasConsent("youtube");
    dialog.hidden = false;
    dialog.querySelector<HTMLButtonElement>("[data-yes]")!.focus();
  });

  dialog.querySelector("[data-no]")!.addEventListener("click", closeDialog);
  dialog.querySelector("a")!.addEventListener("click", closeDialog);
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDialog();
  });

  dialog.querySelector("[data-yes]")!.addEventListener("click", () => {
    grantConsent("youtube");
    dialog.hidden = true;
    opened = true;
    const frame = document.createElement("iframe");
    frame.className = "skull-player";
    frame.src = VIDEO;
    frame.title = "YouTube";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    document.body.append(frame);
  });

  return {
    connect(left: () => number, hit: () => void) {
      hitsLeft = left;
      moreHit = hit;
    },
    // The scene calls this when a hit has settled (true) or was scrolled back out.
    setSettled(settled: boolean) {
      if (!settled) dialog.hidden = true;
      button.hidden = !settled || opened || !dialog.hidden;
    },
  };
}
