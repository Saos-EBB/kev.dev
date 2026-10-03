import "./music.css";
import { createDancer } from "./dancer";
import { UI } from "../i18n/ui";

// Header play button for the "beim Bauen" playlist. Nothing from YouTube
// is in the DOM until the visitor agrees (see the consent notice below):
// that loads the IFrame API,
// creates one player and starts playback. After that the button just
// toggles play/pause on that same player, so scrolling never restarts the
// music. The video is kept off-screen: only the play button and a
// decorative dancer show. The IFrame API exposes no audio data, so the
// dancer is a CSS-only random dance (dancer.ts) while the player plays.
//
// Impressum/Datenschutz live as overlay panels on this same page (see
// legal-overlay.ts) rather than separate routes, so this player is never
// torn down when switching to them — no cross-page resume logic needed.

// Kevin fills this in: the playlist id (the `list=` value). Empty = button stays off.
const PLAYLIST_ID = "PLZO2GLmkfiMg";

const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

const API_SRC = "https://www.youtube.com/iframe_api";

// Consent before anything from YouTube loads: the first click on play opens
// a short notice (what loads, from whom, link to the privacy policy) with
// "Play" / "Cancel". Only "Play" loads the player. The choice is remembered
// in this browser, so later visits play straight away; clearing the site's
// data withdraws it. The privacy policy (legal-content.ts) describes this.
const CONSENT_KEY = "kev-yt-consent";

function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function storeConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // storage blocked — the notice just shows again next visit
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  nextVideo(): void;
  getVideoData(): { video_id?: string };
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTApi {
  Player: new (
    el: HTMLElement,
    options: {
      host: string;
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (e: YTPlayerEvent) => void;
        onStateChange: (e: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function initYoutubeButton() {
  const button = document.querySelector<HTMLButtonElement>(".music-button");
  const mount = document.querySelector<HTMLElement>(".music-mount");
  const dancerLink = document.querySelector<HTMLAnchorElement>(".dancer-link");
  const dancer = createDancer(document.querySelector<SVGElement>(".dancer"));
  if (!button || !mount) return;

  if (!PLAYLIST_ID) {
    button.disabled = true;
    button.title = "[OFFEN: Playlist-ID fehlt]";
    return;
  }

  // The dancer links to the playlist, or to the current song once one plays.
  if (dancerLink) dancerLink.href = PLAYLIST_URL;
  const updateDancerLink = () => {
    const id = player?.getVideoData().video_id;
    if (!dancerLink || !id) return;
    dancerLink.href = `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST_ID}`;
    dancerLink.setAttribute("aria-label", UI.songOpen);
  };

  let player: YTPlayer | null = null;
  let playing = false;
  let loading = false;

  const setPlaying = (value: boolean) => {
    playing = value;
    if (value) dancer.start();
    else dancer.stop();
    button.classList.toggle("is-playing", value);
    button.parentElement?.classList.toggle("is-playing", value);
    button.setAttribute("aria-label", value ? UI.musicPause : UI.musicPlay);
    button.setAttribute("aria-pressed", String(value));
  };

  function load() {
    loading = true;
    window.onYouTubeIframeAPIReady = () => {
      const YT = window.YT!;
      const target = document.createElement("div");
      mount!.appendChild(target);
      new YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        width: "200",
        height: "200",
        playerVars: { listType: "playlist", list: PLAYLIST_ID, playsinline: 1 },
        events: {
          onReady: (e) => {
            player = e.target;
            player.playVideo();
          },
          onStateChange: (e) => {
            setPlaying(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING);
            updateDancerLink();
          },
        },
      });
    };
    const script = document.createElement("script");
    script.src = API_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  const consent = createConsent(button, () => {
    storeConsent();
    if (!loading) load();
  });

  button.addEventListener("click", () => {
    if (player) {
      if (playing) player.pauseVideo();
      else player.playVideo();
    } else if (loading) {
      return;
    } else if (hasConsent()) {
      load();
    } else {
      consent.toggle();
    }
  });
}

// The notice under the play button. Fixed-positioned and clamped to the
// viewport, so it never runs off a phone screen; while open the header
// stays put (.yt-consent-open, music.css), like the language menu.
function createConsent(button: HTMLButtonElement, onAccept: () => void) {
  const box = document.createElement("div");
  box.className = "yt-consent";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "YouTube");
  box.hidden = true;
  box.innerHTML = `
    <p>${UI.ytConsentText} <a href="#datenschutz">${UI.ytConsentPrivacy}</a></p>
    <div class="yt-consent-actions">
      <button type="button" class="yt-consent-play">${UI.ytConsentPlay}</button>
      <button type="button" class="yt-consent-cancel">${UI.ytConsentCancel}</button>
    </div>
  `;
  document.body.appendChild(box);
  button.setAttribute("aria-haspopup", "dialog");

  const isOpen = () => !box.hidden;
  const place = () => {
    const r = button.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(300, window.innerWidth - margin * 2);
    box.style.width = `${width}px`;
    box.style.top = `${r.bottom + 10}px`;
    const left = r.left + r.width / 2 - width / 2;
    box.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - width - margin))}px`;
  };
  const setOpen = (open: boolean) => {
    box.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("yt-consent-open", open);
    if (open) {
      place();
      box.querySelector<HTMLButtonElement>(".yt-consent-play")!.focus();
    }
  };

  box.querySelector(".yt-consent-play")!.addEventListener("click", () => {
    setOpen(false);
    onAccept();
  });
  box.querySelector(".yt-consent-cancel")!.addEventListener("click", () => {
    setOpen(false);
    button.focus();
  });
  // The privacy link opens the overlay (hash route); close the notice.
  box.querySelector("a")!.addEventListener("click", () => setOpen(false));

  // A click outside only closes the notice (capture phase, swallowed) — same
  // rule as the language menu, so it never also opens what sits under it.
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as Node;
      if (!isOpen() || box.contains(t) || button.contains(t)) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });
  window.addEventListener("resize", () => isOpen() && place());

  return { toggle: () => setOpen(!isOpen()) };
}
