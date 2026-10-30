// saos.html's only script: a hidden page that renders nothing unless the
// hash names a variant — obscurity, not protection, the hashes ship here.
// The variant is decided once, on load:
//   #dev#horror     the horror maze (src/horror/horror.ts)
//   #dev#skull      the CT-Schädel page (src/ct/page.ts)
//   #dev#skull#ct   test bench for its skull (src/ct/ct-test.ts)
//   #dev#skull#saw  the standalone skull + saw blade scene (src/skull/skull-saw.ts)
// Imported dynamically so only the chosen variant's code and CSS load —
// horror.css alone would otherwise lock body scrolling. The CT page keeps
// running when the hash changes (it scrolls without touching the URL
// anyway); everywhere else a new hash reloads so the gate is checked again.
// Every #dev page sits behind the password screen (src/dev-gate.ts).
import { devGate } from "./dev-gate";

const hash = location.hash;

const isSub = (sub: string) => hash.startsWith(`#dev#skull#${sub}`);

function route() {
  if (hash.startsWith("#dev#skull") && !isSub("saw") && !isSub("ct")) {
    void import("./ct/page");
  } else {
    window.addEventListener("hashchange", () => location.reload());
    if (hash.startsWith("#dev#horror")) void import("./horror/horror");
    else if (isSub("saw")) void import("./skull/skull-saw");
    else if (isSub("ct")) void import("./ct/ct-test");
  }
}

if (hash.startsWith("#dev")) void devGate().then(route);
else window.addEventListener("hashchange", () => location.reload()); // typed a #dev hash into the empty page
