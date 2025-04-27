import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EmptyFlashcardsList from "../../../components/flashcards/EmptyFlashcardsList";

describe("EmptyFlashcardsList", () => {
  const mockOnCreateNewClick = vi.fn();

  const defaultProps = {
    hasFilters: false,
    onCreateNewClick: mockOnCreateNewClick,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<EmptyFlashcardsList {...defaultProps} {...props} />);
  };

  it("should render default message and create button when no filters are applied", () => {
    // Arrange & Act
    renderComponent({ hasFilters: false });

    // Assert
    expect(screen.getByRole("heading", { name: /brak fiszek/i })).toBeInTheDocument();
    expect(screen.getByText(/wygląda na to, że nie masz jeszcze żadnych fiszek/i)).toBeInTheDocument();
    const createButton = screen.getByRole("button", { name: /utwórz pierwszą fiszkę/i });
    expect(createButton).toBeInTheDocument();
    expect(screen.getByTestId("search-x-icon")).toBeInTheDocument(); // Dodajmy data-testid do ikony dla łatwiejszej selekcji
  });

  it("should render filtered message and no create button when filters are applied", () => {
    // Arrange & Act
    renderComponent({ hasFilters: true });

    // Assert
    expect(screen.getByRole("heading", { name: /brak pasujących fiszek/i })).toBeInTheDocument();
    expect(screen.getByText(/nie znaleziono żadnych fiszek spełniających kryteria wyszukiwania/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /utwórz pierwszą fiszkę/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("search-x-icon")).toBeInTheDocument(); // Ikona powinna być nadal widoczna
  });

  it("should call onCreateNewClick when create button is clicked (and no filters)", () => {
    // Arrange
    renderComponent({ hasFilters: false });
    const createButton = screen.getByRole("button", { name: /utwórz pierwszą fiszkę/i });

    // Act
    fireEvent.click(createButton);

    // Assert
    expect(mockOnCreateNewClick).toHaveBeenCalledTimes(1);
  });
});
