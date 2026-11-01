// The button that appears once the splatter has settled: each press sends one
// more saw blade into the skull (skull-scene.ts, `moreHit`). After the last
// blade it asks whether you're sure; "yes" opens a small player in the bottom
// right corner of the page, nothing but the video; the moment the song really
// plays, the last blade goes in.
import { UI } from "../../i18n/ui";

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const VIDEO = `${YT_ORIGIN}/embed/dQw4w9WgXcQ?autoplay=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
const YT_PLAYING = 1;

export function createSkullMore(stage: HTMLElement) {
  let hitsLeft: () => number = () => 0; // blades still to come by button
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
    dialog.hidden = false;
    dialog.querySelector<HTMLButtonElement>("[data-yes]")!.focus();
  });

  dialog.querySelector("[data-no]")!.addEventListener("click", closeDialog);
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDialog();
  });

  dialog.querySelector("[data-yes]")!.addEventListener("click", () => {
    dialog.hidden = true;
    opened = true;
    const frame = document.createElement("iframe");
    frame.className = "skull-player";
    frame.src = VIDEO;
    frame.title = "YouTube";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    document.body.append(frame);
    // The embed's own messages say when it plays (no IFrame API needed):
    // announce that we're listening, then wait for the playing state.
    const talk = (msg: object) => frame.contentWindow?.postMessage(JSON.stringify(msg), YT_ORIGIN);
    frame.addEventListener("load", () => {
      talk({ event: "listening", id: 1, channel: "widget" });
      talk({ event: "command", func: "addEventListener", args: ["onStateChange"], id: 1, channel: "widget" });
    });
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frame.contentWindow || typeof e.data !== "string") return;
      let data: { event?: string; info?: number | { playerState?: number } };
      try { data = JSON.parse(e.data); } catch { return; }
      const state = typeof data.info === "object" ? data.info?.playerState : data.event === "onStateChange" ? data.info : undefined;
      if (state !== YT_PLAYING) return;
      window.removeEventListener("message", onMessage);
      moreHit();
    };
    window.addEventListener("message", onMessage);
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
