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
        testMobile: root("testMobile.html"), // same app as index.html, reachable at /testMobile for on-device checks
        clothGrid: root("cloth-grid.html"), // standalone cloth-grid experiment, /cloth-grid
        cloth: root("cloth.html"), // elevator room + cloth-grid overlay, /cloth
      },
    },
  },
});
