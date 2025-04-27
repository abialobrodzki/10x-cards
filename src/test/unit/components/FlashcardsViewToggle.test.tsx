import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardsViewToggle, { type ViewMode } from "../../../components/flashcards/FlashcardsViewToggle";

describe("FlashcardsViewToggle", () => {
  const mockOnViewChange = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks(); // Resetujemy mock przed każdym testem
  });

  const renderComponent = (currentView: ViewMode) => {
    return render(<FlashcardsViewToggle currentView={currentView} onViewChange={mockOnViewChange} />);
  };

  it("should render both buttons with icons and text", () => {
    // Arrange & Act
    renderComponent("grid");

    const gridButton = screen.getByRole("button", { name: /widok siatki/i });
    const listButton = screen.getByRole("button", { name: /widok listy/i });

    // Assert
    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();
    expect(screen.getByText("Siatka")).toBeInTheDocument();
    expect(screen.getByText("Lista")).toBeInTheDocument();
    // Sprawdzamy czy ikony są obecne (po klasie rodzica przycisku)
    expect(gridButton.querySelector("svg")).toBeInTheDocument();
    expect(listButton.querySelector("svg")).toBeInTheDocument();
  });

  it('should highlight the grid button when currentView is "grid"', () => {
    // Arrange & Act
    renderComponent("grid");

    const gridButton = screen.getByRole("button", { name: /widok siatki/i });
    const listButton = screen.getByRole("button", { name: /widok listy/i });

    // Assert
    // Sprawdzamy aria-pressed jako wskaźnik aktywnego stanu
    expect(gridButton).toHaveAttribute("aria-pressed", "true");
    expect(listButton).toHaveAttribute("aria-pressed", "false");
    // Można też sprawdzać klasy, ale aria-pressed jest bardziej semantyczne
    expect(gridButton).toHaveClass("bg-primary"); // Oczekujemy stylu aktywnego
    expect(listButton).not.toHaveClass("bg-primary");
  });

  it('should highlight the list button when currentView is "list"', () => {
    // Arrange & Act
    renderComponent("list");

    const gridButton = screen.getByRole("button", { name: /widok siatki/i });
    const listButton = screen.getByRole("button", { name: /widok listy/i });

    // Assert
    expect(gridButton).toHaveAttribute("aria-pressed", "false");
    expect(listButton).toHaveAttribute("aria-pressed", "true");
    expect(listButton).toHaveClass("bg-primary");
    expect(gridButton).not.toHaveClass("bg-primary");
  });

  it('should call onViewChange with "grid" when grid button is clicked', () => {
    // Arrange
    renderComponent("list"); // Zaczynamy z innym widokiem
    const gridButton = screen.getByRole("button", { name: /widok siatki/i });

    // Act
    fireEvent.click(gridButton);

    // Assert
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    expect(mockOnViewChange).toHaveBeenCalledWith("grid");
  });

  it('should call onViewChange with "list" when list button is clicked', () => {
    // Arrange
    renderComponent("grid"); // Zaczynamy z innym widokiem
    const listButton = screen.getByRole("button", { name: /widok listy/i });

    // Act
    fireEvent.click(listButton);

    // Assert
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    expect(mockOnViewChange).toHaveBeenCalledWith("list");
  });

  // Nowe, osobne testy:
  it("should call onViewChange with 'grid' when grid button is clicked (even if grid is active)", () => {
    // Arrange: Grid jest aktywny
    renderComponent("grid");
    const gridButton = screen.getByRole("button", { name: /widok siatki/i });

    // Act: Klikamy przycisk Grid
    fireEvent.click(gridButton);

    // Assert: Sprawdzamy, czy zostało wywołane z "grid"
    expect(mockOnViewChange).toHaveBeenCalledWith("grid");
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it("should call onViewChange with 'list' when list button is clicked (even if list is active)", () => {
    // Arrange: List jest aktywny
    renderComponent("list");
    const listButton = screen.getByRole("button", { name: /widok listy/i });

    // Act: Klikamy przycisk List
    fireEvent.click(listButton);

    // Assert: Sprawdzamy, czy zostało wywołane z "list"
    expect(mockOnViewChange).toHaveBeenCalledWith("list");
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });
});
