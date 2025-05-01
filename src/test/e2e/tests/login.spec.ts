import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";

test.describe("Login Page", () => {
  let loginPage: LoginPage;
  let userEmail: string;
  let userPassword: string;

  test.beforeAll(() => {
    const emailFromEnv = process.env.TEST_USER_EMAIL;
    const passwordFromEnv = process.env.TEST_USER_PASSWORD;

    if (!emailFromEnv || !passwordFromEnv) {
      throw new Error(
        "Test environment variables TEST_USER_EMAIL or TEST_USER_PASSWORD are not set. Please check your .env.test file."
      );
    }
    // Assign to scope variables after check
    userEmail = emailFromEnv;
    userPassword = passwordFromEnv;
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("allows entering login credentials", async ({ page }) => {
    // Arrange
    const expectedUserEmail = userEmail;
    const expectedUrl = "/generate";
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(
      page.getByText(`Zalogowany: ${userEmail}`),
      `Expected user email "${expectedUserEmail}"`
    ).toBeVisible();
  });
});
