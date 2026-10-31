// The link page on /saos#dev#: every site in one place. Loaded behind the
// password screen, but the repo is public: site URLs and repo names only,
// never passwords or access notes.
type Item = { name: string; url: string; note?: string; repo?: string };
type Group = { title: string; items: Item[] };

const GH = "https://github.com/Saos-EBB/";
const KEV = "https://kev-dev-gamma.vercel.app";
const CASUAL = "https://kevdev-casual.vercel.app";

const GROUPS: Group[] = [
  {
    title: "Online",
    items: [
      { name: "kev.dev", url: KEV, note: "Portfolio", repo: "kev.dev" },
      { name: "Omas Puppenstube", url: "https://omas-puppenstube.vercel.app", note: "Puppen-Shop, Vorschau" },
      { name: "Maschenwerk", url: "https://maschenwerk.vercel.app", note: "Häkel-Shop, Vorschau", repo: "shop00" },
      { name: "YourBrand", url: "https://your-brand-azure.vercel.app", note: "Community-Plattform", repo: "YourBrand" },
      { name: "kev.dev Casual", url: CASUAL, note: "Produktseiten", repo: "kevdev-casual" },
      { name: "kev.dev Engineering", url: "https://kevdev-engineering.vercel.app", note: "technische Präsentation", repo: "kevdev-engineering" },
      { name: "b2b-cv", url: "https://saos-repo.vercel.app", repo: "b2b-cv" },
      { name: "cv", url: "https://saosme-navy.vercel.app", note: "Lebenslauf", repo: "cv" },
    ],
  },
  {
    title: "Dev-Seiten",
    items: [
      { name: "Schädel", url: "#dev#skull" },
      { name: "Schädel: Testbank", url: "#dev#skull#ct" },
      { name: "Schädel: Säge", url: "#dev#skull#saw" },
      { name: "Horror", url: "#dev#horror" },
      { name: "Fatty", url: "#dev#fatty" },
    ],
  },
  {
    title: "Unterseiten",
    items: [
      { name: "kev.dev: YourBrand-Seite", url: `${KEV}/yourbrand/` },
      { name: "kev.dev: Impressum", url: `${KEV}/impressum.html` },
      { name: "kev.dev: Datenschutz", url: `${KEV}/datenschutz.html` },
      { name: "Casual-Demo: Halde", url: `${CASUAL}/demos/#halde` },
      { name: "Casual-Demo: Kern", url: `${CASUAL}/demos/#kern` },
      { name: "Casual-Demo: Zirbn", url: `${CASUAL}/demos/#zirbn` },
    ],
  },
  {
    title: "Nicht online, nur Repo",
    items: [
      { name: "YourBrand.0.1", url: `${GH}YourBrand.0.1`, note: "Neubau" },
      { name: "XXX", url: `${GH}XXX`, note: "Backend" },
      { name: "XXX-Frontend", url: `${GH}XXX-Frontend` },
      { name: "SAOS.ME", url: `${GH}SAOS.ME`, note: "altes Portfolio" },
      { name: "Saos.meRework", url: `${GH}Saos.meRework` },
      { name: "monorepo", url: `${GH}monorepo` },
    ],
  },
];

const STYLE = `
  html, body { margin: 0; background: #0b0b0d; }
  .links { max-width: 560px; margin: 0 auto; padding: 40px 16px 64px; font: 16px/1.4 system-ui, sans-serif; color: #e8e2d6; }
  .links h1 { margin: 0 0 32px; font-size: 20px; font-weight: 600; }
  .links h2 { margin: 32px 0 10px; font-size: 13px; font-weight: 500; color: #a8a297; }
  .links ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .links li { display: flex; border: 1px solid #3a3a40; border-radius: 8px; background: #16161a; }
  .links a { color: inherit; text-decoration: none; }
  .links a:hover { background: #22222a; }
  .links a:focus-visible { outline: 2px solid #e8e2d6; outline-offset: -2px; }
  .links .main { flex: 1; min-width: 0; padding: 12px 14px; border-radius: 7px; }
  .links .main small { display: block; font-size: 13px; color: #a8a297; }
  .links .repo { display: grid; place-items: center; padding: 0 14px; font-size: 13px; color: #a8a297; border-left: 1px solid #3a3a40; border-radius: 0 7px 7px 0; }
`;

const external = (url: string) => (url.startsWith("#") ? "" : ` target="_blank" rel="noopener"`);

function row({ name, url, note, repo }: Item) {
  return `<li>
    <a class="main" href="${url}"${external(url)}>${name}${note ? `<small>${note}</small>` : ""}</a>
    ${repo ? `<a class="repo" href="${GH}${repo}"${external(GH)}>Repo</a>` : ""}
  </li>`;
}

export function showLinks() {
  document.title = "saos#dev#";
  document.body.innerHTML = `<style>${STYLE}</style><main class="links">
    <h1>saos#dev#</h1>
    ${GROUPS.map((g) => `<h2>${g.title}</h2><ul>${g.items.map(row).join("")}</ul>`).join("")}
  </main>`;
}
