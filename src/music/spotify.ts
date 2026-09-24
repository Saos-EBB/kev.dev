import "./music.css";

// Header play button for the "beim Bauen" playlist. Nothing from Spotify
// is in the DOM until the first click: that click loads the embed iframe
// API, creates one controller and starts playback. After that the button
// just toggles play/pause on that same controller, so scrolling never
// restarts the music. Strangers without a Spotify login only get the
// ~30 s previews the embed allows; that is the deliberate simple path.

// Kevin fills this in: "spotify:playlist:<id>". Empty = button stays off.
const PLAYLIST_URI = "";

const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

interface EmbedController {
  play(): void;
  togglePlay(): void;
  addListener(
    event: "ready" | "playback_update",
    cb: (e: { data: { isPaused: boolean } }) => void,
  ): void;
}

interface IFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width: string; height: number },
    cb: (controller: EmbedController) => void,
  ): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

export function initSpotifyButton() {
  const button = document.querySelector<HTMLButtonElement>(".music-button");
  const panel = document.querySelector<HTMLElement>(".music-panel");
  const mount = document.querySelector<HTMLElement>(".music-mount");
  if (!button || !panel || !mount) return;

  if (!PLAYLIST_URI) {
    button.disabled = true;
    button.title = "[OFFEN: Playlist-URL fehlt]";
    return;
  }

  let controller: EmbedController | null = null;
  let loading = false;

  const setPlaying = (playing: boolean) => {
    button.classList.toggle("is-playing", playing);
    button.setAttribute("aria-label", playing ? "Musik pausieren" : "Musik abspielen");
    button.setAttribute("aria-pressed", String(playing));
  };

  function load() {
    loading = true;
    window.onSpotifyIframeApiReady = (api) => {
      api.createController(
        mount!,
        { uri: PLAYLIST_URI, width: "100%", height: 152 },
        (c) => {
          controller = c;
          panel!.hidden = false;
          c.addListener("playback_update", (e) => setPlaying(!e.data.isPaused));
          c.addListener("ready", () => c.play());
        },
      );
    };
    const script = document.createElement("script");
    script.src = API_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  button.addEventListener("click", () => {
    if (controller) controller.togglePlay();
    else if (!loading) load();
  });
}
