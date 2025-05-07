import { defineConfig } from "vitest/config";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";

/**
 * Konfiguracja Vitest dla projektu.
 * Definiuje globalne ustawienia testów, środowisko, pliki setup, ścieżki testów,
 * wykluczenia oraz konfigurację pokrycia kodu.
 */
export default defineConfig({
  plugins: [react()], // Używa wtyczki @astrojs/react do obsługi komponentów React w testach
  test: {
    globals: true, // Udostępnia globalnie API Vitest (np. describe, it, expect)
    environment: "jsdom", // Ustawia środowisko testowe na jsdom (symulacja przeglądarki)
    environmentOptions: {
      jsdom: {
        url: "http://localhost", // Ustawia URL dla środowiska jsdom
      },
    },
    setupFiles: ["./src/test/setup.ts"], // Określa pliki do uruchomienia przed testami (konfiguracja MSW, globalne mocki)
    include: ["src/**/*.{test,spec}.{ts,tsx}"], // Wzorce plików do uwzględnienia w testach jednostkowych/integracyjnych
    exclude: ["src/test/e2e/**/*"], // Wzorce plików do wykluczenia (testy e2e są uruchamiane osobno przez Playwright)
    testTimeout: 10000, // Maksymalny czas wykonania pojedynczego testu (ms)
    hookTimeout: 5000, // Maksymalny czas wykonania hooków (beforeAll, afterAll, beforeEach, afterEach) (ms)
    coverage: {
      provider: "v8", // Silnik do generowania raportu pokrycia kodu
      reporter: ["text", "json", "html"], // Formaty raportu pokrycia kodu
      exclude: [
        "node_modules/",
        "astro.config.*", // Pliki konfiguracyjne Astro
        ".astro/**/*", // Katalog build Astro
        "eslint.config.js", // Plik konfiguracyjny ESLint
        "playwright.config.ts", // Plik konfiguracyjny Playwright
        "playwright-report/**/*", // Katalog z raportami Playwright
        "vitest.config.ts", // Plik konfiguracyjny Vitest
        "dist/**/*", // Katalog z buildem produkcyjnym
        "public/**/*", // Katalog z publicznymi zasobami
        "supabase/**/*", // Katalog związany z Supabase
        ".windsurfrules", // Pliki reguł Windsurf AI
        ".cursor/**/*", // Pliki reguł Cursor AI
        "src/layouts/**/*.astro", // Layouty Astro
        "src/lib/index.ts", // Główny plik eksportujący biblioteki (często nie wymaga pokrycia)
        "src/types.ts", // Pliki z typami TypeScript
        "src/types/**/*.ts", // Inne pliki z typami TypeScript
        "src/pages/**/*.astro", // Strony Astro
        "src/test/setup.ts", // Plik setup Vitest (konfiguracja środowiska testowego)
        "src/test/e2e/**/*", // Testy e2e (wykluczone z pokrycia testów jednostkowych)
        "src/test/mocks/**/*.ts", // Pliki z mockami (często nie wymagają pokrycia)
      ], // Wzorce plików do wykluczenia z raportu pokrycia kodu
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // Alias dla katalogu src
      "astro:middleware": fileURLToPath(new URL("./src/test/mocks/astro-middleware.ts", import.meta.url)), // Mock dla middleware Astro w środowisku testowym
    },
  },
});
