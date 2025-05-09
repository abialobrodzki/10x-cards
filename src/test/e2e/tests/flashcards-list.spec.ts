import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/LoginPage";
import { FlashcardsPage } from "../page-objects/FlashcardsPage";
import { GeneratePage } from "../page-objects/GeneratePage";

test.describe.serial("Flashcards Page", () => {
  let loginPage: LoginPage;
  let flashcardsPage: FlashcardsPage;
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
    flashcardsPage = new FlashcardsPage(page);
    generatePage = new GeneratePage(page);
    await loginPage.goto();
    await loginPage.login(userEmail, userPassword);
    await expect(page).toHaveURL("/generate");
    await expect(generatePage.linkLlama).toBeVisible();
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

  test("error validation of manual creation of flashcards", async () => {
    // Arrange
    const expectedFrontErrorMessage = "Tekst jest za krótki. Minimum to 3 znaki.";
    const expectedBackErrorMessage = "Tekst jest za krótki. Minimum to 3 znaki.";

    // Act
    await flashcardsPage.goto();
    await flashcardsPage.createFlashcardButton.click();
    await flashcardsPage.flashcardFrontInput.fill(" ");
    await flashcardsPage.flashcardBackInput.fill(" ");
    await flashcardsPage.flashcardFrontInput.click();

    // Assert
    await expect(flashcardsPage.flashcardFlashcardModalFrontErrorMessage).toBeVisible();
    await expect(
      flashcardsPage.flashcardFlashcardModalFrontErrorMessage,
      `Expected front flashcard error message "${expectedFrontErrorMessage}"`
    ).toHaveText(expectedFrontErrorMessage);
    await expect(flashcardsPage.flashcardFlashcardModalBackErrorMessage).toBeVisible();
    await expect(
      flashcardsPage.flashcardFlashcardModalBackErrorMessage,
      `Expected back flashcard error message "${expectedBackErrorMessage}"`
    ).toHaveText(expectedBackErrorMessage);
    await expect(flashcardsPage.saveFlashcardButton).toBeDisabled();
  });

  test("error empty validation of manual creation of flashcards", async () => {
    // Arrange
    const expectedFrontErrorMessage = "Pole przodu fiszki nie może być puste";
    const expectedBackErrorMessage = "Pole tyłu fiszki nie może być puste";

    // Act
    await flashcardsPage.goto();
    await flashcardsPage.createFlashcardButton.click();
    await flashcardsPage.flashcardFrontInput.fill("");
    await flashcardsPage.flashcardBackInput.fill("");
    await flashcardsPage.flashcardFrontInput.click();

    // Assert
    await expect(flashcardsPage.flashcardFlashcardModalFrontErrorMessage).toBeVisible();
    await expect(
      flashcardsPage.flashcardFlashcardModalFrontErrorMessage,
      `Expected front flashcard error message "${expectedFrontErrorMessage}"`
    ).toHaveText(expectedFrontErrorMessage);
    await expect(flashcardsPage.flashcardFlashcardModalBackErrorMessage).toBeVisible();
    await expect(
      flashcardsPage.flashcardFlashcardModalBackErrorMessage,
      `Expected back flashcard error message "${expectedBackErrorMessage}"`
    ).toHaveText(expectedBackErrorMessage);
    await expect(flashcardsPage.saveFlashcardButton).toBeDisabled();
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
