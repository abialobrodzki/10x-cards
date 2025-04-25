import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardItem from "../../components/flashcards/FlashcardItem";
import type { FlashcardDto } from "../../types";

// Mock formatDate, ponieważ nie chcemy testować jego implementacji tutaj
vi.mock("../../components/flashcards/utils/formatDate", () => ({
  formatDate: vi.fn((dateString) => new Date(dateString).toLocaleDateString()),
}));

const mockFlashcard: FlashcardDto = {
  id: 1,
  front: "Test Front Content",
  back: "Test Back Content",
  created_at: "2023-10-27T10:00:00Z",
  updated_at: "2023-10-27T10:00:00Z",
  source: "manual",
  generation_id: null,
};

const mockFlashcardLong: FlashcardDto = {
  id: 2,
  front:
    "This is a very long front content that should definitely exceed the maximum visible length limit set in the component, requiring truncation and an expand button.".repeat(
      3
    ),
  back: "This is a very long back content, also designed to be truncated and demonstrate the expand/collapse functionality effectively.".repeat(
    3
  ),
  created_at: "2023-10-28T11:00:00Z",
  updated_at: "2023-10-28T11:00:00Z",
  source: "ai-full",
  generation_id: null,
};

describe("FlashcardItem", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof FlashcardItem>> = {}) => {
    return render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} {...props} />);
  };

  it("should render front content, date, badge, and action buttons initially", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByText("Test Front Content")).toBeInTheDocument();
    expect(screen.getByText(new Date(mockFlashcard.created_at).toLocaleDateString())).toBeInTheDocument(); // Sprawdzamy sformatowaną datę
    expect(screen.getByText(/ręcznie utworzona/i)).toBeInTheDocument(); // Sprawdzamy odznakę
    expect(screen.getByTitle(/edytuj fiszkę/i)).toBeInTheDocument();
    expect(screen.getByTitle(/usuń fiszkę/i)).toBeInTheDocument();
    expect(screen.getByTitle(/obróć fiszkę/i)).toBeInTheDocument();
  });

  it("should flip to the back when content area is clicked", () => {
    // Arrange
    renderComponent();
    const flipArea = screen.getByLabelText(/obróć fiszkę/i);

    // Act
    fireEvent.click(flipArea);

    // Assert
    // Używamy `waitFor` lub sprawdzamy zmiany klas/stylów, ale łatwiej sprawdzić zawartość
    // W tym komponencie zawartość jest zawsze w DOM, zmienia się tylko opacity/transform
    // Możemy sprawdzić, że tekst tyłu jest teraz widoczny (lub ma style wskazujące na widoczność)
    // Prostsze podejście: sprawdzić, czy tekst tyłu *istnieje* (choć był tam od początku, tylko niewidoczny)
    // BARDZIEJ NIEZAWODNE: Sprawdzić, czy przycisk ma aria-pressed="true"
    expect(flipArea).toHaveAttribute("aria-pressed", "true");
    // Dodatkowo można by sprawdzić, czy tekst tyłu jest teraz *bardziej* widoczny niż przód (trudniejsze)
  });

  it("should flip to the back when flip button is clicked", () => {
    // Arrange
    renderComponent();
    const flipButton = screen.getByTitle(/obróć fiszkę/i);
    const flipArea = screen.getByLabelText(/obróć fiszkę/i);

    // Act
    fireEvent.click(flipButton);

    // Assert
    expect(flipArea).toHaveAttribute("aria-pressed", "true");
  });

  it("should call onEdit when edit button is clicked", () => {
    // Arrange
    renderComponent();
    const editButton = screen.getByTitle(/edytuj fiszkę/i);

    // Act
    fireEvent.click(editButton);

    // Assert
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should call onDelete when delete button is clicked", () => {
    // Arrange
    renderComponent();
    const deleteButton = screen.getByTitle(/usuń fiszkę/i);

    // Act
    fireEvent.click(deleteButton);

    // Assert
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it("should truncate long front content and show expand button", () => {
    // Arrange & Act
    renderComponent({ flashcard: mockFlashcardLong });
    const frontHeading = screen.getByText(/przód:/i);
    const frontContainer = frontHeading.closest("div");
    expect(frontContainer).toBeInTheDocument();
    if (!frontContainer) throw new Error("Front container not found in test");

    // Assert
    // Find the p element next to the h3 heading within the container
    const frontHeadingElement = within(frontContainer).getByRole("heading", { level: 3, name: /przód:/i });
    const frontTextElement = frontHeadingElement.nextElementSibling;
    expect(frontTextElement).toBeInTheDocument();
    expect(frontTextElement?.tagName).toBe("P"); // Ensure it's the paragraph

    expect(frontTextElement?.textContent).toContain("...");
  });

  it("should expand and collapse long front content when expand/collapse button is clicked", () => {
    // Arrange
    renderComponent({ flashcard: mockFlashcardLong });
    const frontHeading = screen.getByText(/przód:/i);
    const frontContainer = frontHeading.closest("div");
    expect(frontContainer).toBeInTheDocument();
    if (!frontContainer) throw new Error("Front container not found in test");

    const expandButton = within(frontContainer).getByRole("button", { name: /rozwiń/i });
    // Find the p element next to the h3 heading within the container
    const frontHeadingElement = within(frontContainer).getByRole("heading", { level: 3, name: /przód:/i });
    const frontTextElement = frontHeadingElement.nextElementSibling;
    expect(frontTextElement).toBeInTheDocument();
    expect(frontTextElement?.tagName).toBe("P"); // Ensure it's the paragraph

    // Assert initial state (truncated)
    expect(frontTextElement?.textContent).toContain("...");

    // Act: Expand
    fireEvent.click(expandButton);

    // Assert: Expanded
    expect(frontTextElement?.textContent).not.toContain("...");
    expect(frontTextElement?.textContent).toBe(mockFlashcardLong.front);
    // Find collapse button within the front container
    const collapseButton = within(frontContainer).getByRole("button", { name: /zwiń/i });
    expect(collapseButton).toBeInTheDocument();

    // Act: Collapse
    fireEvent.click(collapseButton);

    // Assert: Collapsed
    expect(frontTextElement?.textContent).toContain("...");
    // Find expand button within the front container
    expect(within(frontContainer).getByRole("button", { name: /rozwiń/i })).toBeInTheDocument();
  });

  it("should show expand button for long back content when flipped", () => {
    // Arrange
    renderComponent({ flashcard: mockFlashcardLong });
    const flipArea = screen.getByLabelText(/obróć fiszkę/i);

    // Act: Flip to back
    fireEvent.click(flipArea);

    // Assert: Back is truncated and expand button is visible
    const backHeading = screen.getByText(/tył:/i);
    const backContainer = backHeading.closest("div");
    expect(backContainer).toBeInTheDocument();
    if (!backContainer) throw new Error("Back container not found in test");

    // Check for expand button within the back container
    expect(within(backContainer).getByRole("button", { name: /rozwiń/i })).toBeInTheDocument();
    // Check back text truncation within the back container
    // Find the p element next to the h3 heading within the container
    const backHeadingElement = within(backContainer).getByRole("heading", { level: 3, name: /tył:/i });
    const backTextElement = backHeadingElement.nextElementSibling;
    expect(backTextElement).toBeInTheDocument();
    expect(backTextElement?.tagName).toBe("P"); // Ensure it's the paragraph

    expect(backTextElement?.textContent).toContain("...");
  });
});
