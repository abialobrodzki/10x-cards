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
    await expect(generatePage.linkLlama).toBeVisible();
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

  test("visible link to the Llama terms", async () => {
    // Arrange

    // Act

    // Assert
    await expect(generatePage.linkLlama).toBeVisible();
  });

  test("allows generation of a new flashcards", async () => {
    // Arrange
    const expectedHeaderText = "Wygenerowane fiszki (5)";
    const randomText = generateRandomText(1100, 9900);

    // Act
    await generatePage.generateFlashcards(randomText);

    // Assert
    await expect(generatePage.generateSpinner).toBeVisible();
    await expect(generatePage.flashcardList).toBeVisible({ timeout: 25000 });
    await expect(
      generatePage.flashcardListHeader.getByText(expectedHeaderText),
      `Expected front flashcard "${expectedHeaderText}"`
    ).toBeVisible();
    await expect(generatePage.flashCardFirstItemFront).toBeVisible();
    await expect(generatePage.flashCardFirstItemBack).toBeVisible();
    await expect(generatePage.flashCardSecondItemFront).toBeVisible();
    await expect(generatePage.flashCardSecondItemBack).toBeVisible();
    await expect(generatePage.flashCardThirdItemFront).toBeVisible();
    await expect(generatePage.flashCardThirdItemBack).toBeVisible();
    await expect(generatePage.flashCardFourthItemFront).toBeVisible();
    await expect(generatePage.flashCardFourthItemBack).toBeVisible();
    await expect(generatePage.flashCardFifthItemFront).toBeVisible();
    await expect(generatePage.flashCardFifthItemBack).toBeVisible();
  });

  test("save all of a new flashcards", async () => {
    // Arrange
    const expectedPopupText = "Zapisano wszystkie 5 fiszki";
    const randomText = generateRandomText(1100, 10000);

    // Act
    await generatePage.generateButton.isDisabled();
    await generatePage.generateFlashcards(randomText);
    await expect(generatePage.flashcardList).toBeVisible({ timeout: 20000 });
    await generatePage.saveAllFlashcards();

    // Assert
    await expect(generatePage.successAlert).toBeVisible();
    await expect(generatePage.successAlert, `Expected front flashcard "${expectedPopupText}"`).toHaveText(
      expectedPopupText
    );
  });

  test("save simple and editable flashcards", async () => {
    // Arrange
    const expectedPopupText = "Zapisano 2 zaakceptowanych fiszek";
    const randomText = generateRandomText(1100, 9900);
    const front = generateRandomText(4, 90);
    const back = generateRandomText(4, 90);

    // Act
    await generatePage.generateFlashcards(randomText);
    await expect(generatePage.flashcardList).toBeVisible({ timeout: 20000 });
    await generatePage.saveSimpleFlashcards(front, back);

    // Assert
    await expect(generatePage.successAlert).toBeVisible();
    await expect(generatePage.successAlert, `Expected front flashcard "${expectedPopupText}"`).toHaveText(
      expectedPopupText
    );
  });

  test("error validation of editable flashcards", async () => {
    // Arrange
    const expectedFrontErrorMessage = "Tekst jest za krótki. Minimum to 3 znaki.";
    const expectedBackErrorMessage = "Tekst jest za krótki. Minimum to 3 znaki.";
    const randomText = generateRandomText(1100, 9900);

    // Act
    await generatePage.generateFlashcards(randomText);
    await expect(generatePage.flashcardList).toBeVisible({ timeout: 20000 });
    await generatePage.flashCardFifthItemEditButton.click();
    await generatePage.flashcardFlashcardModalFrontInput.fill(" ");
    await generatePage.flashcardFlashcardModalBackInput.fill(" ");
    await generatePage.flashcardFlashcardModalFrontInput.click();

    // Assert
    await expect(generatePage.flashcardFlashcardModalFrontErrorMessage).toBeVisible();
    await expect(
      generatePage.flashcardFlashcardModalFrontErrorMessage,
      `Expected front flashcard error message "${expectedFrontErrorMessage}"`
    ).toHaveText(expectedFrontErrorMessage);
    await expect(generatePage.flashcardFlashcardModalBackErrorMessage).toBeVisible();
    await expect(
      generatePage.flashcardFlashcardModalBackErrorMessage,
      `Expected back flashcard error message "${expectedBackErrorMessage}"`
    ).toHaveText(expectedBackErrorMessage);
    await expect(generatePage.flashcardFlashcardModalSaveButton).toBeDisabled();
  });

  test("error empty validation of editable flashcards", async () => {
    // Arrange
    const expectedFrontErrorMessage = "Pole przodu fiszki nie może być puste.";
    const expectedBackErrorMessage = "Pole tyłu fiszki nie może być puste.";
    const randomText = generateRandomText(1100, 9900);

    // Act
    await generatePage.generateFlashcards(randomText);
    await expect(generatePage.flashcardList).toBeVisible({ timeout: 20000 });
    await generatePage.flashCardFifthItemEditButton.click();
    await generatePage.flashcardFlashcardModalFrontInput.clear();
    await generatePage.flashcardFlashcardModalBackInput.clear();
    await generatePage.flashcardFlashcardModalFrontInput.click();

    // Assert
    await expect(generatePage.flashcardFlashcardModalFrontErrorMessage).toBeVisible();
    await expect(
      generatePage.flashcardFlashcardModalFrontErrorMessage,
      `Expected front flashcard error message "${expectedFrontErrorMessage}"`
    ).toHaveText(expectedFrontErrorMessage);
    await expect(generatePage.flashcardFlashcardModalBackErrorMessage).toBeVisible();
    await expect(
      generatePage.flashcardFlashcardModalBackErrorMessage,
      `Expected back flashcard error message "${expectedBackErrorMessage}"`
    ).toHaveText(expectedBackErrorMessage);
    await expect(generatePage.flashcardFlashcardModalSaveButton).toBeDisabled();
  });
});
