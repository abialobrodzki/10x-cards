import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { RegisterPage } from "../page-objects/RegisterPage";
import { ForgotPasswordPage } from "../page-objects/ForgotPasswordPage";
import { GeneratePage } from "../page-objects/GeneratePage";
import { FlashcardsPage } from "../page-objects/FlashcardsPage";

// Aby wygenerować bazowe zrzuty, najpierw uruchom test z flagą --update-snapshots
test.describe("Login Page", () => {
  let loginPage: LoginPage;
  let registerPage: RegisterPage;
  let forgotPasswordPage: ForgotPasswordPage;
  let generatePage: GeneratePage;
  let flashcardsPage: FlashcardsPage;

  test("takes a screenshot page: /auth/register", async ({ page }) => {
    // Arrange
    loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();

    // Assert
    await expect(page).toHaveScreenshot("login-page.png");
  });

  test("takes a screenshot page: /auth/login", async ({ page }) => {
    // Arrange
    registerPage = new RegisterPage(page);

    // Act
    await registerPage.goto();

    // Assert
    await expect(page).toHaveScreenshot("register-page.png");
  });

  test("takes a screenshot page: auth/forgot-password", async ({ page }) => {
    // Arrange
    forgotPasswordPage = new ForgotPasswordPage(page);

    // Act
    await forgotPasswordPage.goto();

    // Assert
    await expect(page).toHaveScreenshot("forgot-password-page.png");
  });

  test("takes a screenshot page: /generate", async ({ page }) => {
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
    await generatePage.goto();

    // Assert
    await expect(page).toHaveScreenshot("generate-page.png");
  });

  test("takes a screenshot page: /flashcards", async ({ page }) => {
    // Arrange
    loginPage = new LoginPage(page);
    flashcardsPage = new FlashcardsPage(page);
    const userEmail = process.env.TEST_USER_EMAIL;
    const userPassword = process.env.TEST_USER_PASSWORD;

    if (!userEmail || !userPassword) {
      throw new Error("TEST_USER_EMAIL or TEST_USER_PASSWORD is not set");
    }

    // Act
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);
    await flashcardsPage.goto();

    // Assert
    await expect(page).toHaveScreenshot("flashcards-page.png");
  });
});
