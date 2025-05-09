import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

/**
 * Konfiguracja Playwright dla testów end-to-end.
 * Wczytuje zmienne środowiskowe, definiuje katalogi testowe i raportów,
 * ustawienia równoległego uruchamiania testów, liczbę prób ponowienia,
 * konfigurację raportowania oraz globalne hooki setup i teardown.
 */

// Najpierw wczytaj domyślne zmienne z .env
dotenv.config();
// Następnie nadpisz zmienne z .env.test (jeśli istnieje) - dodajemy override: true
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

/**
 * Definiuje konfigurację Playwright.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./src/test/e2e", // Katalog zawierający pliki testów e2e
  outputDir: "./test-results", // Katalog do zapisywania wyników testów (raportów, zrzutów ekranu, nagrań wideo)
  fullyParallel: true, // Uruchamia testy w pełni równolegle w wielu workerach/procesach
  forbidOnly: !!process.env.CI, // Zabrania używania `.only` w testach w środowisku CI
  retries: process.env.CI ? 2 : 0, // Liczba prób ponownego uruchomienia nieudanych testów (w CI 2, lokalnie 0)
  workers: process.env.CI ? 1 : undefined, // Maksymalna liczba workerów/procesów do równoległego uruchamiania testów (w CI 1, lokalnie auto)
  reporter: [["html", { open: "never" }], ["list"]], // Konfiguracja raportów (generuje raport HTML i listę wyników w konsoli)
  use: {
    baseURL: "http://localhost:4321", // Bazowy URL dla wszystkich stron w testach (używany z `await page.goto('/')`)
    trace: "retain-on-failure", // Zbiera śledzenie testów i zachowuje je tylko w przypadku niepowodzenia testu
    screenshot: "only-on-failure", // Robi zrzuty ekranu tylko w przypadku niepowodzenia testu
    video: "retain-on-failure", // Nagrywa wideo testów i zachowuje je tylko w przypadku niepowodzenia testu
    testIdAttribute: "data-testid", // Atrybut używany do lokalizowania elementów na stronie (np. `data-testid="my-element"`)
  },
  projects: [
    {
      name: "chromium", // Nazwa projektu/przeglądarki
      use: { ...devices["Desktop Chrome"] }, // Używa konfiguracji dla przeglądarki Chromium na desktopie
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    {
      name: "webkit", // Nazwa projektu/przeglądarki
      use: { ...devices["Desktop Safari"] }, // Używa konfiguracji dla przeglądarki WebKit (Safari) na desktopie
    },
    // {
    //   name: "Mobile Chrome",
    //   use: { ...devices["Pixel 7"] },
    // },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 14"] },
    // },
  ],
  webServer: {
    command: "npm run preview -- --port 4321", // Komenda do uruchomienia serwera webowego przed testami
    port: 4321, // Port, na którym serwer webowy będzie nasłuchiwał
    reuseExistingServer: true, // Zawsze używaj istniejącego serwera, jeśli jest dostępny
    env: {
      // Pass Supabase and other required runtime env vars to the preview server
      // These are read from process.env, which gets them from GitHub secrets
      SUPABASE_URL: process.env.SUPABASE_URL ?? "", // Przekazuje URL Supabase do serwera webowego
      SUPABASE_KEY: process.env.SUPABASE_KEY ?? "", // Przekazuje klucz Supabase do serwera webowego
      // Note: SERVICE_ROLE_KEY is typically NOT needed by the frontend/preview server
      // Pass any other runtime variables your Astro app needs here
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "", // Przekazuje klucz API OpenRouter do serwera webowego
    }, // Zmienne środowiskowe przekazywane do procesu serwera webowego
  },
  // Global Setup: czyszczenie bazy przed testami
  globalSetup: "./src/test/e2e/global.setup.ts", // Ścieżka do pliku globalnego setupu (uruchamiany raz przed wszystkimi testami)
  // Global Teardown: czyszczenie bazy po testach
  globalTeardown: "./src/test/e2e/global.teardown.ts", // Ścieżka do pliku globalnego teardownu (uruchamiany raz po wszystkich testach)
});
