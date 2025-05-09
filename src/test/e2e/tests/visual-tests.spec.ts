import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { RegisterPage } from "../page-objects/RegisterPage";
import { ForgotPasswordPage } from "../page-objects/ForgotPasswordPage";
import { GeneratePage } from "../page-objects/GeneratePage";
import { FlashcardsPage } from "../page-objects/FlashcardsPage";

// Aby wygenerować bazowe zrzuty, najpierw uruchom test z flagą --update-snapshots
test.describe.serial("Visual tests @visual", () => {
  let loginPage: LoginPage;
  let registerPage: RegisterPage;
  let forgotPasswordPage: ForgotPasswordPage;
  let generatePage: GeneratePage;
  let flashcardsPage: FlashcardsPage;

  test("takes a screenshot page: /auth/register @visual", async ({ page }) => {
    // Arrange
    loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();

    // Assert
    await expect(loginPage.emailInput).toBeVisible();
    await expect(page).toHaveScreenshot("login-page.png");
  });

  test("takes a screenshot page: /auth/login @visual", async ({ page }) => {
    // Arrange
    registerPage = new RegisterPage(page);

    // Act
    await registerPage.goto();

    // Assert
    await expect(registerPage.emailInput).toBeVisible();
    await expect(page).toHaveScreenshot("register-page.png");
  });

  test("takes a screenshot page: auth/forgot-password @visual", async ({ page }) => {
    // Arrange
    forgotPasswordPage = new ForgotPasswordPage(page);

    // Act
    await forgotPasswordPage.goto();

    // Assert
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(page).toHaveScreenshot("forgot-password-page.png");
  });

  test("takes a screenshot page: /generate @visual", async ({ page }) => {
    // Arrange
    loginPage = new LoginPage(page);
    generatePage = new GeneratePage(page);
    const userEmail = process.env.TEST_USER_EMAIL;
    const userPassword = process.env.TEST_USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("TEST_USER_EMAIL or TEST_USER_PASSWORD is not set");
    }

    // Act
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);

    // Assert
    await expect(generatePage.textInputForm).toBeVisible();
    await expect(page).toHaveScreenshot("generate-page.png");
  });

  test("takes a screenshot page: /flashcards @visual", async ({ page }) => {
    // Arrange
    const emptySearch = "Wyszukiwanie nie istniejacej fiszki";
    loginPage = new LoginPage(page);
    generatePage = new GeneratePage(page);
    flashcardsPage = new FlashcardsPage(page);
    const userEmail = process.env.TEST_USER_EMAIL;
    const userPassword = process.env.TEST_USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("TEST_USER_EMAIL or TEST_USER_PASSWORD is not set");
    }

    // Act
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);
    await expect(generatePage.textInputForm).toBeVisible();
    await flashcardsPage.goto();
    await flashcardsPage.flashcardsSearchFilter.fill(emptySearch);
    await page.waitForLoadState("networkidle");

    // Assert
    await expect(flashcardsPage.flashcardsSearchFilterClearButton).toBeVisible();
    await expect(flashcardsPage.flashcardsListEmpty).toBeVisible();
    await expect(page).toHaveScreenshot("flashcards-page.png");
  });
});
