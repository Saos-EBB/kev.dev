// /saos#dev#ballon: the balloon loader on its own while it's being worked on.
// saos.html has none of the site's CSS, so the font and the one token the
// loader reads come along here. A made-up load drives the pump.
import { mountBalloonLoader } from "./balloon-loader";

const STYLE = `
  @font-face { font-family: "Urban Sign"; src: url("/fonts/urban-sign.woff2") format("woff2"); font-display: swap; }
  :root { --font-mono: ui-monospace, monospace; --font-display: "Urban Sign", sans-serif; }
  html, body { margin: 0; height: 100%; background: #800020; }
  .balloon-again { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 12px 20px; font: 16px system-ui, sans-serif; color: #800020; background: #fff; border: 0; border-radius: 8px; cursor: pointer; }
`;

export function showBalloonLoader() {
  document.title = "saos#dev#ballon";
  document.body.innerHTML = `<style>${STYLE}</style>`;

  const play = () => {
    const overlay = document.createElement("div");
    document.body.appendChild(overlay);
    const { setProgress } = mountBalloonLoader(overlay, () => {
      overlay.remove();
      const again = document.createElement("button");
      again.className = "balloon-again";
      again.textContent = "Nochmal";
      again.onclick = () => {
        again.remove();
        play();
      };
      document.body.appendChild(again);
    });
    setProgress(0.5);
    setTimeout(() => setProgress(1), 600);
  };
  play();
}
