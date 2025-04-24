/* eslint-disable no-console */
import { test } from "@playwright/test";

test("sprawdź dokładny tytuł strony logowania", async ({ page }) => {
  await page.goto("/auth/login");

  // Pobierz i wyświetl dokładny tytuł strony
  const pageTitle = await page.title();
  console.log("Dokładny tytuł strony:", pageTitle);

  // Sprawdź treść HTML tytułu
  const titleHTML = await page.evaluate(() => document.title);
  console.log("Tytuł z HTML:", titleHTML);

  // Sprawdź całą zawartość tagu <head>
  const headContent = await page.evaluate(() => document.head.innerHTML);
  console.log("Zawartość <head>:", headContent);
});
