// @ts-check
import { defineConfig } from "astro/config";
import process from "node:process";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// Funkcje tworzące adapter dla czytelności i uniknięcia błędów lintowania
const nodeAdapter = () =>
  node({
    mode: "standalone",
    // Port jest ustawiany przez zmienną środowiskową PORT, nie przez konfigurację adaptera
  });
const cloudflareAdapter = () => cloudflare();

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: parseInt(process.env.PORT || "3000", 10) },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [
        "msw/node",
        "src/mocks",
        "@radix-ui/react-dialog",
        "@radix-ui/react-form",
        "@radix-ui/react-button",
        "@radix-ui/react-slot",
      ],
    },
  },
  // Używamy adaptera Node w środowisku testowym CI, a Cloudflare w produkcji
  adapter: process.env.CI_TESTING ? nodeAdapter() : cloudflareAdapter(),
  experimental: {
    session: true,
  },
});
