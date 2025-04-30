import { defineConfig } from "vitest/config";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["src/test/e2e/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "astro.config.*", // Astro (mjs/cjs)
        ".astro/**/*", // build Astro
        "eslint.config.js", // ESLint
        "playwright.config.ts", // Playwright
        "vitest.config.ts", // Vitest
        "dist/**/*", // build output
        "public/**/*", // public assets
        "supabase/**/*", // supabase folder
        ".windsurfrules", // Windsurf AI rules
        ".cursor/**/*", // Cursor AI rules
        "src/layouts/**/*.astro", // Astro layouts
        "src/lib/index.ts", // główny bundler usług
        "src/types.ts", // wspólne typy
        "src/types/**/*.ts", // inne typy
        "src/pages/**/*.astro", // Astro strony
        "src/test/setup.ts", // plik setup Vitest
        "src/test/e2e/**/*", // e2e testy
        "src/test/mocks/**/*.ts", // mocki do testów
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "astro:middleware": fileURLToPath(new URL("./src/test/mocks/astro-middleware.ts", import.meta.url)),
    },
  },
});
