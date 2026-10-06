import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Impressum/Datenschutz are separate static pages (full reload, no
// client-side router in this project), so they need their own entries —
// Vite only builds index.html by default.
export default defineConfig({
  // Tailwind only matters for the YourBrand sub-app (yourbrand/), whose
  // stylesheet is the only one importing it.
  plugins: [tailwindcss()],
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
        main: root("index.html"),
        impressum: root("impressum.html"),
        datenschutz: root("datenschutz.html"),
        yourbrand: root("yourbrand/index.html"),
        // Unlinked playground (/test) for trying ideas before they go on the page.
        test: root("test.html"),
      },
    },
  },
});
