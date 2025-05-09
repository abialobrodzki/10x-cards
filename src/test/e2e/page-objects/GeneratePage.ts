import { type Page, type Locator } from "@playwright/test";
// import TextInputForm from "./components/TextInputForm"; // Assuming TextInputForm POM exists or will be created
// import FlashcardList from "./components/FlashcardList"; // Assuming FlashcardList POM exists or will be created

export class GeneratePage {
  readonly page: Page;
  readonly container: Locator;
  readonly textInputForm: Locator;
  readonly linkLlama: Locator;
  readonly generateButton: Locator;
  readonly generateSpinner: Locator;
  readonly generatingIndicator: Locator;
  readonly generationErrorNotification: Locator;
  readonly saveErrorNotification: Locator;
  readonly saveSuccessNotification: Locator;
  readonly flashcardListHeader: Locator;
  readonly flashcardList: Locator;
  readonly flashcardFlashcardModal: Locator;
  readonly flashcardFlashcardModalFrontInput: Locator;
  readonly flashcardFlashcardModalBackInput: Locator;
  readonly flashcardFlashcardModalSaveButton: Locator;
  readonly flashcardFlashcardModalFrontErrorMessage: Locator;
  readonly flashcardFlashcardModalBackErrorMessage: Locator;
  readonly flashCardFirstItemFront: Locator;
  readonly flashCardFirstItemBack: Locator;
  readonly flashCardSecondItemFront: Locator;
  readonly flashCardSecondItemBack: Locator;
  readonly flashCardThirdItemFront: Locator;
  readonly flashCardThirdItemBack: Locator;
  readonly flashCardFourthItemFront: Locator;
  readonly flashCardFourthItemBack: Locator;
  readonly flashCardFifthItemFront: Locator;
  readonly flashCardFifthItemBack: Locator;
  readonly flashCardSaveAllButton: Locator;
  readonly successAlert: Locator;
  readonly flashCardFirstItemConfirmButton: Locator;
  readonly flashCardFirstItemEditButton: Locator;
  readonly flashCardFirstItemRejectButton: Locator;
  readonly flashCardSecondItemConfirmButton: Locator;
  readonly flashCardSecondItemEditButton: Locator;
  readonly flashCardSecondItemRejectButton: Locator;
  readonly flashCardThirdItemConfirmButton: Locator;
  readonly flashCardThirdItemEditButton: Locator;
  readonly flashCardThirdItemRejectButton: Locator;
  readonly flashCardFourthItemConfirmButton: Locator;
  readonly flashCardFourthItemEditButton: Locator;
  readonly flashCardFourthItemRejectButton: Locator;
  readonly flashCardFifthItemConfirmButton: Locator;
  readonly flashCardFifthItemEditButton: Locator;
  readonly flashCardFifthItemRejectButton: Locator;
  readonly flashCardSaveSelectedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("generate-view-container");
    this.textInputForm = page.getByTestId("text-input-textarea");
    this.linkLlama = page.getByRole("link", { name: "Built with Llama" });
    this.generateButton = page.getByTestId("generate-button");
    this.generateSpinner = page.getByTestId("loading-spinner-container").locator("div").nth(1);
    this.generatingIndicator = page.getByTestId("generating-state-indicator");
    this.generationErrorNotification = page.getByTestId("generation-error-notification");
    this.saveErrorNotification = page.getByTestId("save-error-notification");
    this.saveSuccessNotification = page.getByTestId("save-success-notification");
    this.flashcardListHeader = page.getByTestId("flashcard-count-heading");
    this.flashcardList = page.getByTestId("flashcard-list-container");
    this.flashcardFlashcardModal = page.getByTestId("edit-flashcard-modal");
    this.flashcardFlashcardModalFrontInput = page.getByTestId("edit-flashcard-front-textarea");
    this.flashcardFlashcardModalBackInput = page.getByTestId("edit-flashcard-back-textarea");
    this.flashcardFlashcardModalSaveButton = page.getByTestId("save-edit-button");
    this.flashcardFlashcardModalFrontErrorMessage = page.getByTestId("front-error-message");
    this.flashcardFlashcardModalBackErrorMessage = page.getByTestId("back-error-message");
    this.flashCardFirstItemFront = page.getByTestId("flashcard-front-0");
    this.flashCardFirstItemBack = page.getByTestId("flashcard-back-0");
    this.flashCardFirstItemConfirmButton = page.getByTestId("flashcard-accept-button-0");
    this.flashCardFirstItemEditButton = page.getByTestId("flashcard-edit-button-0");
    this.flashCardFirstItemRejectButton = page.getByTestId("flashcard-reject-button-0");
    this.flashCardSecondItemFront = page.getByTestId("flashcard-front-1");
    this.flashCardSecondItemBack = page.getByTestId("flashcard-back-1");
    this.flashCardSecondItemConfirmButton = page.getByTestId("flashcard-accept-button-1");
    this.flashCardSecondItemEditButton = page.getByTestId("flashcard-edit-button-1");
    this.flashCardSecondItemRejectButton = page.getByTestId("flashcard-reject-button-1");
    this.flashCardThirdItemFront = page.getByTestId("flashcard-front-2");
    this.flashCardThirdItemBack = page.getByTestId("flashcard-back-2");
    this.flashCardThirdItemConfirmButton = page.getByTestId("flashcard-accept-button-2");
    this.flashCardThirdItemEditButton = page.getByTestId("flashcard-edit-button-2");
    this.flashCardThirdItemRejectButton = page.getByTestId("flashcard-reject-button-2");
    this.flashCardFourthItemFront = page.getByTestId("flashcard-front-3");
    this.flashCardFourthItemBack = page.getByTestId("flashcard-back-3");
    this.flashCardFourthItemConfirmButton = page.getByTestId("flashcard-accept-button-3");
    this.flashCardFourthItemEditButton = page.getByTestId("flashcard-edit-button-3");
    this.flashCardFourthItemRejectButton = page.getByTestId("flashcard-reject-button-3");
    this.flashCardFifthItemFront = page.getByTestId("flashcard-front-4");
    this.flashCardFifthItemBack = page.getByTestId("flashcard-back-4");
    this.flashCardFifthItemConfirmButton = page.getByTestId("flashcard-accept-button-4");
    this.flashCardFifthItemEditButton = page.getByTestId("flashcard-edit-button-4");
    this.flashCardFifthItemRejectButton = page.getByTestId("flashcard-reject-button-4");
    this.flashCardSaveAllButton = page.getByTestId("save-all-button");
    this.flashCardSaveSelectedButton = page.getByTestId("save-selected-button");

    this.successAlert = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/generate", { waitUntil: "networkidle" });
  }

  async generateFlashcards(text: string) {
    await this.textInputForm.click();
    await this.textInputForm.fill(text);
    await this.generateButton.click();
  }

  async saveAllFlashcards() {
    await this.flashCardSaveAllButton.click();
  }

  async saveSimpleFlashcards(front: string, back: string) {
    await this.flashCardFirstItemRejectButton.click();
    await this.flashCardSecondItemRejectButton.click();
    await this.flashCardThirdItemRejectButton.click();
    await this.flashCardFourthItemConfirmButton.click();
    await this.flashCardFifthItemEditButton.click();
    await this.flashcardFlashcardModalFrontInput.fill(front);
    await this.flashcardFlashcardModalBackInput.fill(back);
    await this.flashcardFlashcardModalSaveButton.click();
    await this.flashCardSaveSelectedButton.click();
  }
}
