import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { ForgotPasswordPage } from "../page-objects/ForgotPasswordPage";

test.describe.serial("Register Page", () => {
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
  });

  test("visibility of error validation text", async ({ page }) => {
    // Arrange
    const expectedUrl = "/auth/forgot-password";
    const forgotPasswordPage = new ForgotPasswordPage(page);

    // Act
    await forgotPasswordPage.sendResetLinkButton.click();

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(forgotPasswordPage.mailErrorText).toBeVisible();
  });

  test("go to login page", async ({ page }) => {
    // Arrange
    const expectedUrl = "/auth/login";
    const forgotPasswordPage = new ForgotPasswordPage(page);

    // Act
    await forgotPasswordPage.backToLoginLink.click();
    const loginPage = new LoginPage(page);

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test("allows resetting password with valid credentials", async ({ page }) => {
    // Arrange
    const email = process.env.TEST_USER_EMAIL_RESEND;
    const expectedUrl = "/auth/forgot-password";
    const forgotPasswordPage = new ForgotPasswordPage(page);

    // Act
    if (email === undefined) {
      throw new Error("TEST_USER_EMAIL environment variable is not set.");
    }
    await forgotPasswordPage.requestPasswordReset(email);

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(forgotPasswordPage.resetLinkSentMessage).toBeVisible();
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(forgotPasswordPage.sendResetLinkButton).toBeVisible();
    await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
  });
});
