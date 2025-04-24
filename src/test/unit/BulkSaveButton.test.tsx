import { render, screen, fireEvent, act } from "@testing-library/react";
import BulkSaveButton from "../../components/BulkSaveButton";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock FlashcardViewModel for testing purposes
interface FlashcardViewModel {
  id: number;
  front: string;
  back: string;
  isAccepted: boolean;
  isEdited: boolean;
  isRejected: boolean;
  createdAt?: Date;
}

// Add this constant since it's not exported from the component
const COOLDOWN_PERIOD = 3000; // 3 seconds cooldown

describe("BulkSaveButton", () => {
  const mockFlashcards: FlashcardViewModel[] = [
    {
      id: 1,
      front: "front",
      back: "back",
      isAccepted: true,
      isEdited: false,
      isRejected: false,
    },
    {
      id: 2,
      front: "front2",
      back: "back2",
      isAccepted: false,
      isEdited: false,
      isRejected: false,
    },
  ];

  const mockOnSaveAll = vi.fn();
  const mockOnSaveSelected = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows correct count of accepted flashcards", () => {
    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={1}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onSaveSelected={mockOnSaveSelected}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("disables buttons when isSaving=true", () => {
    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={1}
        isSaving={true}
        onSaveAll={mockOnSaveAll}
        onSaveSelected={mockOnSaveSelected}
      />
    );

    // Use getAllByText since there are multiple buttons with the same text
    const savingButtons = screen.getAllByText("Zapisywanie...");
    expect(savingButtons[0]).toBeDisabled();
    expect(savingButtons[1]).toBeDisabled();
  });

  it("enters cooldown state after clicking save selected", async () => {
    vi.useFakeTimers();

    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={1}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onSaveSelected={mockOnSaveSelected}
      />
    );

    const saveSelectedButton = screen.getByText("Zapisz wybrane");
    fireEvent.click(saveSelectedButton);

    expect(mockOnSaveSelected).toHaveBeenCalledTimes(1);

    // Use getAllByText since there are multiple buttons with the same text
    const savedButtons = screen.getAllByText("Zapisano");
    expect(savedButtons[0]).toBeInTheDocument();
    expect(savedButtons[0]).toBeDisabled();
  });

  it("resets cooldown after COOLDOWN_PERIOD and re-enables button", () => {
    vi.useFakeTimers();

    render(
      <BulkSaveButton
        flashcards={mockFlashcards}
        generationId={1}
        isSaving={false}
        onSaveAll={mockOnSaveAll}
        onSaveSelected={mockOnSaveSelected}
      />
    );

    const saveSelectedButton = screen.getByText("Zapisz wybrane");
    fireEvent.click(saveSelectedButton);

    // Use getAllByText to handle multiple buttons
    const savedButtons = screen.getAllByText("Zapisano");
    expect(savedButtons[0]).toBeDisabled();

    // Fast-forward the timer to complete the cooldown
    act(() => {
      vi.advanceTimersByTime(COOLDOWN_PERIOD);
    });

    // Verify the button is re-enabled
    expect(screen.getByText("Zapisz wybrane")).toBeInTheDocument();
    expect(screen.getByText("Zapisz wybrane")).not.toBeDisabled();
  });
});
