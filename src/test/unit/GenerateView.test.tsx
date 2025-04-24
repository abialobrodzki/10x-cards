import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GenerateView from "../../components/GenerateView";
import { useGenerateFlashcardsView } from "../../components/hooks/useGenerateFlashcardsView";
import type { FlashcardViewModel, GenerationViewModel } from "../../types/viewModels";
import type { BasicGenerationDto, CreateFlashcardDto } from "../../types";

// Mock the custom hook with correct relative path
vi.mock("../../components/hooks/useGenerateFlashcardsView");

// Define mock types for props
interface MockGenerateFormData {
  count: number;
  topics: string;
}
interface MockTextInputFormProps {
  onSubmit: (data: MockGenerateFormData) => void;
  isGenerating: boolean;
}
interface MockLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}
interface MockSkeletonLoaderProps {
  isVisible: boolean;
  count?: number;
  className?: string;
}
interface MockErrorNotificationProps {
  message: string | null;
  isVisible: boolean;
  type?: string;
}
interface MockSuccessNotificationProps {
  message: string | null;
  isVisible: boolean;
  autoHideDuration?: number;
}
interface MockFlashcardListProps {
  flashcards: FlashcardViewModel[];
  onAccept: (index: number) => void;
  onEdit: (index: number) => void;
  onReject: (index: number) => void;
}
interface MockEditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardViewModel;
  onClose: () => void;
  onSave: (data: { front: string; back: string }) => void;
}
interface MockBulkSaveButtonProps {
  isSaving: boolean;
  onSaveAll: () => void;
  onSaveSelected: () => void;
  flashcards: FlashcardViewModel[];
  generationId: number | null;
}

// Mock child components with correct relative paths
vi.mock("../../components/TextInputForm", () => ({
  default: ({ onSubmit, isGenerating }: MockTextInputFormProps) => (
    <form
      data-testid="text-input-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ count: 5, topics: "Test Topics" });
      }}
    >
      <label htmlFor="count">Number of Cards</label>
      <input id="count" type="number" defaultValue={5} />
      <label htmlFor="topics">Topics</label>
      <textarea id="topics">Test Topics</textarea>
      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate"}
      </button>
    </form>
  ),
}));
vi.mock("../../components/ui/LoadingIndicator", () => ({
  default: ({ isVisible }: MockLoadingIndicatorProps) =>
    isVisible ? <div data-testid="loading-indicator">Loading...</div> : null,
}));
vi.mock("../../components/ui/SkeletonLoader", () => ({
  default: ({ isVisible }: MockSkeletonLoaderProps) =>
    isVisible ? <div data-testid="skeleton-loader">Skeleton</div> : null,
}));
vi.mock("../../components/ui/ErrorNotification", () => ({
  default: ({ message, isVisible }: MockErrorNotificationProps) =>
    isVisible ? <div data-testid="error-notification">{message}</div> : null,
}));
vi.mock("../../components/ui/SuccessNotification", () => ({
  default: ({ message, isVisible }: MockSuccessNotificationProps) =>
    isVisible ? <div data-testid="success-notification">{message}</div> : null,
}));
vi.mock("../../components/FlashcardList", () => ({
  default: ({ flashcards, onAccept, onEdit, onReject }: MockFlashcardListProps) => (
    <div data-testid="flashcard-list">
      {flashcards.map((fc: FlashcardViewModel, index: number) => (
        <div key={index} data-testid={`flashcard-${index}`}>
          <span>{fc.front}</span>
          <button onClick={() => onAccept(index)}>Accept</button>
          <button onClick={() => onEdit(index)}>Edit</button>
          <button onClick={() => onReject(index)}>Reject</button>
        </div>
      ))}
    </div>
  ),
}));
vi.mock("../../components/EditFlashcardModal", () => ({
  default: ({ isOpen, flashcard, onClose, onSave }: MockEditFlashcardModalProps) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <input data-testid="edit-front" defaultValue={flashcard.front} />
        <input data-testid="edit-back" defaultValue={flashcard.back} />
        <button onClick={() => onSave({ front: "Updated Front", back: "Updated Back" })}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
vi.mock("../../components/BulkSaveButton", () => ({
  default: ({ isSaving, onSaveAll, onSaveSelected }: MockBulkSaveButtonProps) => (
    <div data-testid="bulk-save-button">
      <button onClick={onSaveAll} disabled={isSaving}>
        Save All
      </button>
      <button onClick={onSaveSelected} disabled={isSaving}>
        Save Selected
      </button>
      {isSaving && <span>Saving...</span>}
    </div>
  ),
}));

// Define the return type based on the actual hook
type UseGenerateFlashcardsViewReturn = ReturnType<typeof useGenerateFlashcardsView>;

describe("GenerateView Component", () => {
  // Mock functions from the hook
  const mockGenerateFlashcards = vi.fn();
  const mockAcceptFlashcard = vi.fn();
  const mockEditFlashcard = vi.fn();
  const mockRejectFlashcard = vi.fn();
  const mockSaveSelectedFlashcards = vi.fn();
  const mockSaveAllFlashcards = vi.fn();
  const mockSelectFlashcard = vi.fn();

  // Provide default values matching the hook's return type
  const defaultHookValues: UseGenerateFlashcardsViewReturn = {
    generationState: { isGenerating: false, generationError: null, generationResult: null },
    flashcardsState: [],
    savingState: {
      isSaving: false,
      saveError: null,
      saveSuccess: false,
      saveSuccessMessage: null,
      canSave: false,
      canSaveAll: false,
    },
    generateFlashcards: mockGenerateFlashcards,
    acceptFlashcard: mockAcceptFlashcard,
    editFlashcard: mockEditFlashcard,
    rejectFlashcard: mockRejectFlashcard,
    saveSelectedFlashcards: mockSaveSelectedFlashcards,
    saveAllFlashcards: mockSaveAllFlashcards,
    selectedFlashcardIndex: -1,
    isSingleSelectionMode: false,
    acceptedFlashcardsCount: 0,
    selectFlashcard: mockSelectFlashcard,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(defaultHookValues);
  });

  it("renders the TextInputForm initially", () => {
    render(<GenerateView />);
    expect(screen.getByTestId("text-input-form")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
    expect(screen.queryByTestId("flashcard-list")).not.toBeInTheDocument();
  });

  it("calls generateFlashcards when the form is submitted", () => {
    render(<GenerateView />);
    const form = screen.getByTestId("text-input-form");
    fireEvent.submit(form);
    expect(mockGenerateFlashcards).toHaveBeenCalledTimes(1);
    expect(mockGenerateFlashcards).toHaveBeenCalledWith({ count: 5, topics: "Test Topics" });
  });

  it("shows loading indicator and skeleton when generating", () => {
    const generatingHookValues: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      generationState: { ...defaultHookValues.generationState, isGenerating: true },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(generatingHookValues);
    render(<GenerateView />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-loader")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
  });

  it("shows error notification when generation fails", () => {
    const errorMessage = "Failed to generate flashcards";
    const errorHookValues: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      generationState: { ...defaultHookValues.generationState, generationError: errorMessage },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(errorHookValues);
    render(<GenerateView />);
    const errorNotification = screen.getByTestId("error-notification");
    expect(errorNotification).toBeInTheDocument();
    expect(errorNotification).toHaveTextContent(errorMessage);
  });

  it("renders FlashcardList and BulkSaveButton when flashcards are generated", () => {
    const flashcards: FlashcardViewModel[] = [
      {
        front: "Q1",
        back: "A1",
        isAccepted: false,
        isEdited: false,
        isRejected: false,
        originalData: { front: "Q1", back: "A1" },
      },
      {
        front: "Q2",
        back: "A2",
        isAccepted: false,
        isEdited: false,
        isRejected: false,
        originalData: { front: "Q2", back: "A2" },
      },
    ];
    const mockGenerationDto: BasicGenerationDto = {
      id: 123,
      generated_count: 2,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      model: "test-model",
    };
    const mockFlashcardsDto: Omit<CreateFlashcardDto, "generation_id">[] = [
      { front: "Q1", back: "A1", source: "ai-full" },
      { front: "Q2", back: "A2", source: "ai-full" },
    ];
    const generationResultForState: GenerationViewModel["generationResult"] = {
      generation: mockGenerationDto,
      flashcards: mockFlashcardsDto,
    };
    const generatedHookValues: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: flashcards,
      generationState: { ...defaultHookValues.generationState, generationResult: generationResultForState },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(generatedHookValues);
    render(<GenerateView />);

    const flashcardListContainer = screen.getByTestId("flashcard-list");
    expect(flashcardListContainer).toBeInTheDocument();
    expect(within(flashcardListContainer).getAllByTestId(/flashcard-/)).toHaveLength(2);
    expect(screen.getByTestId("bulk-save-button")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
  });

  const singleFlashcard: FlashcardViewModel[] = [
    {
      front: "Q1",
      back: "A1",
      isAccepted: false,
      isEdited: false,
      isRejected: false,
      originalData: { front: "Q1", back: "A1" },
    },
  ];

  it("calls acceptFlashcard when accept button is clicked", () => {
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const acceptButton = screen.getByRole("button", { name: /accept/i });
    fireEvent.click(acceptButton);
    expect(mockAcceptFlashcard).toHaveBeenCalledTimes(1);
    expect(mockAcceptFlashcard).toHaveBeenCalledWith(0);
  });

  it("calls rejectFlashcard when reject button is clicked", () => {
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const rejectButton = screen.getByRole("button", { name: /reject/i });
    fireEvent.click(rejectButton);
    expect(mockRejectFlashcard).toHaveBeenCalledTimes(1);
    expect(mockRejectFlashcard).toHaveBeenCalledWith(0);
  });

  it("opens EditFlashcardModal when edit button is clicked", () => {
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
    expect(screen.getByTestId("edit-front")).toHaveValue("Q1");
    expect(screen.getByTestId("edit-back")).toHaveValue("A1");
  });

  it("calls editFlashcard and closes modal when save is clicked in modal", () => {
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    const modal = screen.getByTestId("edit-modal");
    expect(modal).toBeInTheDocument();
    const saveButtonInModal = within(modal).getByRole("button", { name: /save/i });

    fireEvent.click(saveButtonInModal);
    expect(mockEditFlashcard).toHaveBeenCalledTimes(1);
    expect(mockEditFlashcard).toHaveBeenCalledWith(0, { front: "Updated Front", back: "Updated Back" });
    expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
  });

  it("closes EditFlashcardModal when close button is clicked", () => {
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockEditFlashcard).not.toHaveBeenCalled();
    expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
  });

  const minimalGenerationResult: GenerationViewModel["generationResult"] = {
    generation: { id: 1 } as BasicGenerationDto,
    flashcards: [],
  };

  it("calls saveAllFlashcards when Save All button is clicked", () => {
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
      generationState: { ...defaultHookValues.generationState, generationResult: minimalGenerationResult },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const saveAllButton = screen.getByRole("button", { name: /save all/i });
    fireEvent.click(saveAllButton);
    expect(mockSaveAllFlashcards).toHaveBeenCalledTimes(1);
  });

  it("calls saveSelectedFlashcards when Save Selected button is clicked", () => {
    const acceptedFlashcard: FlashcardViewModel[] = [{ ...singleFlashcard[0], isAccepted: true }];
    const hookValuesWithCard: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: acceptedFlashcard,
      generationState: { ...defaultHookValues.generationState, generationResult: minimalGenerationResult },
      savingState: { ...defaultHookValues.savingState, canSave: true },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(hookValuesWithCard);
    render(<GenerateView />);
    const saveSelectedButton = screen.getByRole("button", { name: /save selected/i });
    fireEvent.click(saveSelectedButton);
    expect(mockSaveSelectedFlashcards).toHaveBeenCalledTimes(1);
  });

  it("shows saving indicator and disables save buttons when saving", () => {
    const savingHookValues: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
      savingState: { ...defaultHookValues.savingState, isSaving: true },
      generationState: { ...defaultHookValues.generationState, generationResult: minimalGenerationResult },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(savingHookValues);
    render(<GenerateView />);
    const saveAllButton = screen.getByRole("button", { name: /save all/i });
    const saveSelectedButton = screen.getByRole("button", { name: /save selected/i });
    expect(saveAllButton).toBeDisabled();
    expect(saveSelectedButton).toBeDisabled();
    expect(screen.getByText(/saving.../i)).toBeInTheDocument();
  });

  it("shows error notification when saving fails", () => {
    const errorMessage = "Failed to save flashcards";
    const errorHookValues: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: singleFlashcard,
      savingState: { ...defaultHookValues.savingState, saveError: errorMessage },
      generationState: { ...defaultHookValues.generationState, generationResult: minimalGenerationResult },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(errorHookValues);
    render(<GenerateView />);
    const errorNotification = screen.getByTestId("error-notification");
    expect(errorNotification).toBeInTheDocument();
    expect(errorNotification).toHaveTextContent(errorMessage);
  });

  it("shows success notification when saving succeeds", () => {
    const successMessage = "Flashcards saved successfully!";
    const successHookValues: UseGenerateFlashcardsViewReturn = {
      ...defaultHookValues,
      flashcardsState: [],
      savingState: { ...defaultHookValues.savingState, saveSuccess: true, saveSuccessMessage: successMessage },
    };
    vi.mocked(useGenerateFlashcardsView).mockReturnValue(successHookValues);
    render(<GenerateView />);
    const successNotification = screen.getByTestId("success-notification");
    expect(successNotification).toBeInTheDocument();
    expect(successNotification).toHaveTextContent(successMessage);
  });
});
