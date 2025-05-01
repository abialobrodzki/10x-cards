import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { GeneratePage } from "../page-objects/GeneratePage";

// Funkcja generująca losowy tekst o długości z zakresu [min, max]
function generateRandomText(minLength: number, maxLength: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

test.describe("Generate Page", () => {
  let loginPage: LoginPage;
  let generatePage: GeneratePage;
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
    generatePage = new GeneratePage(page);
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);
    await expect(page).toHaveURL("/generate");
  });

  test("successfully navigates to the generate page", async ({ page }) => {
    // Arrange
    const expectedUrl = "/generate";

    // Act
    await generatePage.goto();

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(generatePage.container).toBeVisible();
    await expect(generatePage.textInputForm).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();
    await expect(generatePage.generateButton).toBeDisabled();
  });

  test("allows generation of a new flashcards", async () => {
    // Arrange
    const expectedHeaderText = "Wygenerowane fiszki (5)";
    const randomText = generateRandomText(1000, 10000);

    // Act
    await generatePage.goto();
    await generatePage.generateFlashcards(randomText);

    // Assert
    await expect(generatePage.generateSpinner).toBeVisible();
    await expect(generatePage.flashcardList).toBeVisible({ timeout: 10000 });
    await expect(
      generatePage.flashcardListHeader.getByText(expectedHeaderText),
      `Expected front flashcard "${expectedHeaderText}"`
    ).toBeVisible();
  });
});
