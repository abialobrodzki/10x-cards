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
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    testIdAttribute: "data-testid",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  // Global Setup: czyszczenie bazy przed testami
  globalSetup: "./tests/global.setup.ts",
  // Global Teardown: czyszczenie bazy po testach
  globalTeardown: "./tests/global.teardown.ts",
});
