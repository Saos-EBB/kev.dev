// saos.html's only script: a hidden page that renders nothing unless the
// hash names a variant — obscurity, not protection, the hashes ship here.
// The variant is decided once, on load:
//   #dev#horror     the horror maze (src/horror/horror.ts)
//   #dev#skull#saw  the standalone skull + saw blade scene (src/skull/skull-saw.ts)
//   #dev#skull      the whole main page with the skull contact + its throw
//                   set (src/main.ts with html.skull-site, see src/skull-site/)
// Imported dynamically so only the chosen variant's code and CSS load —
// horror.css alone would otherwise lock body scrolling on the skull page.
// The skull page uses hash anchors itself (#about, #contact, #eng/…), so it
// keeps running when the hash changes; everywhere else a new hash reloads
// so the gate is checked again.
const hash = location.hash;

if (hash.startsWith("#dev#skull") && !hash.startsWith("#dev#skull#saw")) {
  document.documentElement.classList.add("skull-site");
  document.title = "Kevin Schaberl";
  void import("./main");
} else {
  window.addEventListener("hashchange", () => location.reload());
  if (hash.startsWith("#dev#horror")) void import("./horror/horror");
  else if (hash.startsWith("#dev#skull#saw")) void import("./skull/skull-saw");
}
