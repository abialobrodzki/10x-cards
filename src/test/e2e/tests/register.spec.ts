import { test, expect } from "@playwright/test";
import { RegisterPage } from "../page-objects/RegisterPage";
import { LoginPage } from "../page-objects/LoginPage";

test.describe.serial("Register Page", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test("visibility of error validation text", async ({ page }) => {
    // Arrange
    const expectedUrl = "/auth/register";
    const registerPage = new RegisterPage(page);

    // Act
    await registerPage.signupButton.click();

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(registerPage.mailErrorText).toBeVisible();
    await expect(registerPage.passwordErrorText).toBeVisible();
    await expect(registerPage.confirmPasswordErrorText).toBeVisible();
  });

  test("go to login page", async ({ page }) => {
    // Arrange
    const expectedUrl = "/auth/login";
    const registerPage = new RegisterPage(page);

    // Act
    await registerPage.loginLink.click();
    const loginPage = new LoginPage(page);

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test("allows registering with valid credentials", async ({ page }) => {
    // Arrange
    const email = `gerwalt777+${Date.now()}@gmail.com`;
    const password = "qwerty123";
    const confirmPassword = "qwerty123";
    const expectedUrl = "/auth/register";
    const registerPage = new RegisterPage(page);

    // Act
    await registerPage.signup(email, password, confirmPassword);

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(registerPage.registrationSuccessMessage).toBeVisible();
    await expect(registerPage.registrationSuccessMessageHeader).toBeVisible();
    await expect(registerPage.registrationSuccessMessageText).toBeVisible();
    await expect(registerPage.loginLinkAfterSignup).toBeVisible();
  });
});
