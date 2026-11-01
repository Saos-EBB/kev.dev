// saos.html's only script: a hidden page that renders nothing unless the
// hash names a variant — obscurity, not protection, the hashes ship here.
// The variant is decided once, on load:
//   #dev#horror     the horror maze (src/horror/horror.ts)
//   #dev#fatty      slap Fatty (src/fatty/fatty.ts)
//   #dev#ballon     the balloon loader, not on the site for now (src/intro/balloon-page.ts)
//   #dev# (or #dev) links to all of the above and to every other site (src/saos-links.ts)
// Imported dynamically so only the chosen variant's code and CSS load —
// horror.css alone would otherwise lock body scrolling. A new hash reloads so
// the gate is checked again.
// Every #dev page sits behind the password screen (src/dev-gate.ts).
import { devGate } from "./dev-gate";

const hash = location.hash;

function route() {
  window.addEventListener("hashchange", () => location.reload());
  if (hash.startsWith("#dev#horror")) void import("./horror/horror");
  else if (hash.startsWith("#dev#fatty")) void import("./fatty/fatty");
  else if (hash.startsWith("#dev#ballon")) void import("./intro/balloon-page").then((m) => m.showBalloonLoader());
  else if (hash === "#dev#" || hash === "#dev") void import("./saos-links").then((m) => m.showLinks());
}

if (hash.startsWith("#dev")) void devGate().then(route);
else window.addEventListener("hashchange", () => location.reload()); // typed a #dev hash into the empty page
