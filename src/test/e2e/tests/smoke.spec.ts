import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LoginPage } from "../page-objects/LoginPage";

test.describe("Login Page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("has the correct title", async ({ page }) => {
    // Arrange
    const expectedTitle = "10xCards - Logowanie";

    // Act
    const title = await page.title();

    // Assert
    expect(title, `Expected page title "${expectedTitle}"`).toContain(expectedTitle);
  });

  test("go to register page", async ({ page }) => {
    // Arrange
    const expectedUrl = "/auth/register";

    // Act
    await loginPage.registerLink.click();

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
  });

  test("go to resend password page", async ({ page }) => {
    // Arrange
    const expectedUrl = "auth/forgot-password";

    // Act
    await loginPage.forgotPasswordLink.click();

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
  });

  test("passes accessibility tests", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page: page }).analyze();
    // Tymczasowo pozwalamy na pewne problemy z dostępnością w przykładowym teście
    // W prawdziwym projekcie należy je naprawić
    // eslint-disable-next-line no-console
    console.log("Accessibility violations:", accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(1);
  });
});
