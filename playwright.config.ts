import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Najpierw wczytaj domyślne zmienne z .env
dotenv.config();
// Następnie nadpisz zmienne z .env.test (jeśli istnieje) - dodajemy override: true
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

export default defineConfig({
  testDir: "./src/test/e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    testIdAttribute: "data-testid",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
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
    command: "npm run preview -- --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    env: {
      // Pass Supabase and other required runtime env vars to the preview server
      // These are read from process.env, which gets them from GitHub secrets
      SUPABASE_URL: process.env.SUPABASE_URL ?? "",
      SUPABASE_KEY: process.env.SUPABASE_KEY ?? "",
      // Note: SERVICE_ROLE_KEY is typically NOT needed by the frontend/preview server
      // Pass any other runtime variables your Astro app needs here
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
    },
  },
  // Global Setup: czyszczenie bazy przed testami
  globalSetup: "./src/test/e2e/global.setup.ts",
  // Global Teardown: czyszczenie bazy po testach
  globalTeardown: "./src/test/e2e/global.teardown.ts",
});
