import { type Page, type Locator } from "@playwright/test";

export class FlashcardsPage {
  readonly page: Page;
  readonly container: Locator;
  readonly heading: Locator;
  readonly errorMessageContainer: Locator;
  readonly retryButton: Locator;
  readonly flashcardsList: Locator;
  readonly flashcardsListEmpty: Locator;
  readonly flashcardsSearchFilter: Locator;
  readonly flashcardsSearchFilterClearButton: Locator;
  readonly flashcardModal: Locator;
  readonly flashcardDeleteModal: Locator;
  readonly flashcardDeleteButton: Locator;
  readonly paginationContainer: Locator;
  readonly createFlashcardButton: Locator;
  readonly flashcardFrontInput: Locator;
  readonly flashcardBackInput: Locator;
  readonly saveFlashcardButton: Locator;
  readonly cancelFlashcardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("flashcards-page-container");
    this.heading = page.getByTestId("page-heading");
    this.errorMessageContainer = page.getByTestId("error-message-container");
    this.retryButton = page.getByTestId("retry-button");
    this.flashcardsList = page.getByTestId("flashcards-grid-view");
    this.flashcardsListEmpty = page.getByTestId("empty-flashcards-list");
    this.flashcardsSearchFilter = page.getByTestId("search-input");
    this.flashcardsSearchFilterClearButton = page.getByTestId("reset-filters-button");
    this.flashcardModal = page.getByTestId("flashcard-form-modal");
    this.flashcardDeleteModal = page.getByTestId("delete-confirmation-dialog");
    this.flashcardDeleteButton = page.getByTestId("confirm-delete-button");
    this.paginationContainer = page.getByTestId("pagination-container");
    this.createFlashcardButton = page.getByTestId("create-flashcard-button");
    this.flashcardFrontInput = page.getByTestId("front-textarea");
    this.flashcardBackInput = page.getByTestId("back-textarea");
    this.saveFlashcardButton = page.getByTestId("save-button");
    this.cancelFlashcardButton = page.getByTestId("cancel-button");
  }

  getFlashcardDeleteButton(flashcardId: number): Locator {
    return this.page.getByTestId(`flashcard-delete-button-${flashcardId}`);
  }

  async goto() {
    await this.page.goto("/flashcards", { waitUntil: "networkidle" });
  }

  async addFlashcard(front: string, back: string) {
    await this.createFlashcardButton.click();
    await this.flashcardFrontInput.fill(front);
    await this.flashcardBackInput.fill(back);
    await this.saveFlashcardButton.click();
  }

  async deleteFlashcard(flashcardId: number) {
    const deleteButton = this.getFlashcardDeleteButton(flashcardId);
    await deleteButton.click();
    await this.flashcardDeleteButton.click();
  }
}
