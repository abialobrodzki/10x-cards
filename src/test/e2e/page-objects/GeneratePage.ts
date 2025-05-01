import { type Page, type Locator } from "@playwright/test";
// import TextInputForm from "./components/TextInputForm"; // Assuming TextInputForm POM exists or will be created
// import FlashcardList from "./components/FlashcardList"; // Assuming FlashcardList POM exists or will be created

export class GeneratePage {
  readonly page: Page;
  readonly container: Locator;
  readonly textInputForm: Locator;
  readonly generateButton: Locator;
  readonly generateSpinner: Locator;
  readonly generatingIndicator: Locator;
  readonly generationErrorNotification: Locator;
  readonly saveErrorNotification: Locator;
  readonly saveSuccessNotification: Locator;
  readonly flashcardListHeader: Locator;
  readonly flashcardList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("generate-view-container");
    this.textInputForm = page.getByTestId("text-input-textarea");
    this.generateButton = page.getByTestId("generate-button");
    this.generateSpinner = page.getByTestId("loading-spinner-container").locator("div").nth(1);
    this.generatingIndicator = page.getByTestId("generating-state-indicator");
    this.generationErrorNotification = page.getByTestId("generation-error-notification");
    this.saveErrorNotification = page.getByTestId("save-error-notification");
    this.saveSuccessNotification = page.getByTestId("save-success-notification");
    this.flashcardListHeader = page.getByTestId("flashcard-count-heading");
    this.flashcardList = page.getByTestId("flashcard-list-container");
  }

  async goto() {
    await this.page.goto("/generate", { waitUntil: "networkidle" });
  }

  async generateFlashcards(text: string) {
    await this.textInputForm.fill(text);
    await this.generateButton.click();
  }

  // Add methods for interacting with the page, e.g., submitting text, saving flashcards
}
