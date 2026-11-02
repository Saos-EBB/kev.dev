import { defineConfig, type Connect } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { fetchContributions } from "./api/_contributions";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const siteRoutes: Connect.NextHandleFunction = (req, res, next) => {
  const path = (req.url ?? "/").split(/[?#]/)[0];
  if (path === "/" || path === "/agressiveIntro") {
    res.statusCode = 302;
    res.setHeader("location", "/adhdActivated");
    res.end();
    return;
  }
  if (/^\/adhdActivated\/.+/.test(path)) req.url = "/adhdActivated.html";
  next();
};

// Impressum/Datenschutz are separate static pages (full reload, no
// client-side router in this project), so they need their own entries —
// Vite only builds index.html by default.
export default defineConfig({
  // Tailwind only matters for the YourBrand sub-app (yourbrand/), whose
  // stylesheet is the only one importing it.
  plugins: [
    tailwindcss(),
    // The same routes as vercel.json, for `npm run dev` and `npm run preview`.
    {
      name: "site-routes",
      configureServer: (server) => { server.middlewares.use(siteRoutes); },
      configurePreviewServer: (server) => { server.middlewares.use(siteRoutes); },
    },
    // `npm run dev` has no Vercel functions — serve /api/contributions
    // from the same code the Vercel route uses (api/contributions.ts).
    {
      name: "dev-api-contributions",
      configureServer(server) {
        server.middlewares.use("/api/contributions", async (_req, res) => {
          const data = await fetchContributions().catch(() => null);
          res.statusCode = data ? 200 : 502;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(data));
        });
      },
    },
  ],
  resolve: {
    // b2b-cv's import paths ("@/lib/..."), pointing at the copied sources.
    alias: { "@": root("yourbrand/src") },
  },
  oxc: {
    jsx: { runtime: "automatic" },
  },
  build: {
    rollupOptions: {
      // React's "use client" markers (b2b-cv sources, lucide-react) mean
      // nothing outside Next.js — dropping them is expected.
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
      input: {
        lessAdhd: root("lessAdhd.html"),
        links: root("links.html"),
        ctLook: root("ct-look.html"),
        adhdActivated: root("adhdActivated.html"),
        impressum: root("impressum.html"),
        datenschutz: root("datenschutz.html"),
        yourbrand: root("yourbrand/index.html"),
        saos: root("saos.html"),
      },
      // saos.html's skull variant imports src/main.ts too, so main's
      // modules are shared between two entries. By default Rolldown then
      // parks its runtime helpers in the yourbrand entry chunk and main
      // imports them from there — which boots the YourBrand React app on
      // the main page (React error #299). "strict" keeps entry chunks to
      // their own exports, so shared helpers get a chunk of their own.
      preserveEntrySignatures: "strict",
    },
  },
});
