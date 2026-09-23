import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Impressum/Datenschutz are separate static pages (full reload, no
// client-side router in this project), so they need their own entries —
// Vite only builds index.html by default.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: root("index.html"),
        impressum: root("impressum.html"),
        datenschutz: root("datenschutz.html"),
      },
    },
  },
});
