import "./music.css";
import { createDancer } from "./dancer";

// Header play button for the "beim Bauen" playlist. Nothing from YouTube
// is in the DOM until the first click: that click loads the IFrame API,
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
    dancerLink.setAttribute("aria-label", "Aktuellen Song auf YouTube öffnen");
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
    button.setAttribute("aria-label", value ? "Musik pausieren" : "Musik abspielen");
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

  button.addEventListener("click", () => {
    if (player) {
      if (playing) player.pauseVideo();
      else player.playVideo();
    } else if (!loading) load();
  });
}
