import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { FlashcardsPage } from "../page-objects/FlashcardsPage";

test.describe("Flashcards Page", () => {
  let loginPage: LoginPage;
  let flashcardsPage: FlashcardsPage;
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
    flashcardsPage = new FlashcardsPage(page);
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);
    await expect(page).toHaveURL("/generate");
  });

  test("successfully navigates to the flashcards page", async ({ page }) => {
    // Arrange
    const expectedUrl = "/flashcards";

    // Act
    await flashcardsPage.goto();

    // Assert
    await expect(page, `Expected page URL "${expectedUrl}"`).toHaveURL(expectedUrl);
    await expect(flashcardsPage.container).toBeVisible();
  });

  test("allows manual creation of a new flashcard", async () => {
    // Arrange
    const timestamp = new Date().getTime();
    const frontText = `Test Front ${timestamp}`;
    const backText = "Test Back";

    // Act
    await flashcardsPage.goto();
    await flashcardsPage.addFlashcard(frontText, backText);

    // Assert
    await expect(flashcardsPage.flashcardModal).toBeHidden();
    await expect(flashcardsPage.flashcardsList).toBeVisible();
    await expect(
      flashcardsPage.flashcardsList.getByText(frontText),
      `Expected front flashcard "${frontText}"`
    ).toBeVisible();
  });

  test("allows delete of a flashcard", async () => {
    // Arrange
    const timestamp = new Date().getTime();
    const frontText = `Test Front to Delete ${timestamp}`;
    const backText = "Test Back to Delete";

    // Create a flashcard to delete
    await flashcardsPage.goto();
    await flashcardsPage.addFlashcard(frontText, backText);
    // Wait for the new flashcard to be visible before attempting to delete
    const flashcardToDelete = flashcardsPage.flashcardsList.getByText(frontText).first();
    await expect(flashcardToDelete).toBeVisible();

    const dataTestId = await flashcardToDelete.getAttribute("data-testid");
    const flashcardIdString = dataTestId?.split("-").pop();
    const flashcardId = flashcardIdString ? parseInt(flashcardIdString, 10) : null;

    // Act
    if (flashcardId !== null) {
      await flashcardsPage.deleteFlashcard(flashcardId);
    } else {
      // eslint-disable-next-line no-console
      console.error("Flashcard ID is null, cannot delete flashcard.");
    }

    // Assert
    await expect(flashcardsPage.flashcardsList.getByText(frontText)).toBeHidden();
  });
});
