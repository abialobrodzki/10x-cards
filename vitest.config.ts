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
        "src/test/setup.ts",
        "src/test/e2e/**/*",
        "astro.config.*",
        "eslint.config.js",
        "playwright.config.ts",
        "vitest.config.ts",
        ".astro/**/*",
        "dist/**/*",
        "public/**/*",
        "src/types.ts",
        "src/types/**/*.ts",
        "src/pages/**/*.astro",
        "src/layouts/**/*.astro",
        "src/test/mocks/**/*.ts",
        "src/lib/index.ts",
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
