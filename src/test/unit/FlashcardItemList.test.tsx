import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardItemList from "../../components/flashcards/FlashcardItemList";
import type { FlashcardDto } from "../../types";

// Mock formatDate
vi.mock("../../components/flashcards/utils/formatDate", () => ({
  formatDate: vi.fn((dateString) => new Date(dateString).toLocaleDateString()),
}));

const mockFlashcard: FlashcardDto = {
  id: 1,
  front: "Test Front Content (List)",
  back: "Test Back Content (List)",
  created_at: "2023-10-27T10:00:00Z",
  updated_at: "2023-10-27T10:00:00Z",
  source: "manual",
  generation_id: null,
};

const mockFlashcardLong: FlashcardDto = {
  id: 2,
  front:
    "This is a very long front content for the list item view that should definitely exceed the maximum visible length limit set in the component, requiring truncation and an expand button.".repeat(
      3
    ),
  back: "This is a very long back content for the list item view, also designed to be truncated and demonstrate the expand/collapse functionality effectively.".repeat(
    3
  ),
  created_at: "2023-10-28T11:00:00Z",
  updated_at: "2023-10-28T11:00:00Z",
  source: "ai-full",
  generation_id: null,
};

describe("FlashcardItemList (Single Item List View)", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof FlashcardItemList>> = {}) => {
    return render(
      <FlashcardItemList flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} {...props} />
    );
  };

  it("should render front and back content, date, badge, and action buttons", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByText("Test Front Content (List)")).toBeInTheDocument();
    expect(screen.getByText("Test Back Content (List)")).toBeInTheDocument();
    expect(screen.getByText(new Date(mockFlashcard.created_at).toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(/ręcznie utworzona/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edytuj/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /usuń/i })).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", () => {
    // Arrange
    renderComponent();
    const editButton = screen.getByRole("button", { name: /edytuj/i });

    // Act
    fireEvent.click(editButton);

    // Assert
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should call onDelete when delete button is clicked", () => {
    // Arrange
    renderComponent();
    const deleteButton = screen.getByRole("button", { name: /usuń/i });

    // Act
    fireEvent.click(deleteButton);

    // Assert
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it("should truncate long front and back content and show expand buttons", () => {
    // Arrange & Act
    renderComponent({ flashcard: mockFlashcardLong });

    // Assert Front
    const frontContent = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "p" && content.includes(mockFlashcardLong.front.substring(0, 30));
    });

    const frontTextContent = frontContent.textContent || "";
    expect(frontTextContent).toContain("...");
    expect(frontTextContent.length).toBeLessThan(mockFlashcardLong.front.length);
    expect(screen.getAllByRole("button", { name: /rozwiń/i })).toHaveLength(2); // One for front, one for back

    // Assert Back
    const backContent = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "p" && content.includes(mockFlashcardLong.back.substring(0, 30));
    });

    const backTextContent = backContent.textContent || "";
    expect(backTextContent).toContain("...");
    expect(backTextContent.length).toBeLessThan(mockFlashcardLong.back.length);
  });

  it("should expand and collapse long content when expand/collapse button is clicked", () => {
    // Arrange
    renderComponent({ flashcard: mockFlashcardLong });
    const expandButtons = screen.getAllByRole("button", { name: /rozwiń/i });
    const frontExpandButton = expandButtons[0]; // Assume first is for front

    const frontContent = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "p" && content.includes(mockFlashcardLong.front.substring(0, 30));
    });

    const backContent = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "p" && content.includes(mockFlashcardLong.back.substring(0, 30));
    });

    // Assert initial state (truncated)
    const frontTextInitial = frontContent.textContent || "";
    const backTextInitial = backContent.textContent || "";
    expect(frontTextInitial).toContain("...");
    expect(backTextInitial).toContain("...");

    // Act: Expand (clicking button associated with front)
    fireEvent.click(frontExpandButton);

    // Assert: Both Expanded (expand state is shared)
    const frontTextExpanded = frontContent.textContent || "";
    const backTextExpanded = backContent.textContent || "";
    expect(frontTextExpanded).not.toContain("...");
    expect(frontTextExpanded).toBe(mockFlashcardLong.front);
    expect(backTextExpanded).not.toContain("...");
    expect(backTextExpanded).toBe(mockFlashcardLong.back);

    const collapseButtons = screen.getAllByRole("button", { name: /zwiń/i });
    expect(collapseButtons).toHaveLength(2);

    // Act: Collapse
    fireEvent.click(collapseButtons[0]); // Click collapse button (doesn't matter which one)

    // Assert: Both Collapsed
    const frontTextCollapsed = frontContent.textContent || "";
    const backTextCollapsed = backContent.textContent || "";
    expect(frontTextCollapsed).toContain("...");
    expect(backTextCollapsed).toContain("...");

    expect(screen.getAllByRole("button", { name: /rozwiń/i })).toHaveLength(2);
  });
});
