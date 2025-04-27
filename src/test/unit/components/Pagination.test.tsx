import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Pagination from "../../../components/flashcards/Pagination";

describe("Pagination Component", () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();

  const defaultProps = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 100, // Domyślnie 10 stron
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<Pagination {...defaultProps} {...props} />);
  };

  it("should not render if totalPages is 1 or less", () => {
    // Arrange & Act
    renderComponent({ totalItems: 5 }); // Mniej niż pageSize
    // Assert
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("should render pagination controls when totalPages > 1", () => {
    // Arrange & Act
    renderComponent(); // 10 stron

    // Assert
    expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to previous page/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to next page/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
    expect(screen.getByText(/1-10 z 100/i)).toBeInTheDocument(); // Zakres elementów
    expect(screen.getByText(/elementy na stronie:/i)).toBeInTheDocument(); // Select pageSize
  });

  it("should disable previous button on the first page", () => {
    // Arrange & Act
    renderComponent({ currentPage: 1 });
    const prevButton = screen.getByRole("link", { name: /go to previous page/i });

    // Assert
    expect(prevButton).toHaveClass("opacity-50");
    // Sprawdzenie, czy kliknięcie nie wywołuje callbacku
    fireEvent.click(prevButton);
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it("should disable next button on the last page", () => {
    // Arrange & Act
    renderComponent({ currentPage: 10, totalItems: 100, pageSize: 10 }); // Ostatnia strona
    const nextButton = screen.getByRole("link", { name: /go to next page/i });

    // Assert
    expect(nextButton).toHaveClass("opacity-50");
    // Sprawdzenie, czy kliknięcie nie wywołuje callbacku
    fireEvent.click(nextButton);
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it("should highlight the current page number", () => {
    // Arrange & Act
    renderComponent({ currentPage: 3 });
    const page3Button = screen.getByRole("link", { name: "3" });

    // Assert
    // Shadcn dodaje atrybut data-active="true" lub specyficzną klasę
    // Sprawdzamy, czy przycisk ma atrybut wskazujący na aktywność (zależy od implementacji UI lib)
    expect(page3Button).toHaveAttribute("data-active", "true");
    expect(page3Button).toBeInTheDocument();
    // Można by dodać bardziej szczegółową asercję, jeśli znamy dokładną klasę/atrybut aktywnej strony w Shadcn
  });

  it("should call onPageChange with the correct page number when a page link is clicked", () => {
    // Arrange
    renderComponent({ currentPage: 3 });
    // Click page 4 instead of 5, as 5 might be hidden by ellipsis
    const page4Button = screen.getByRole("link", { name: "4" });

    // Act
    fireEvent.click(page4Button);

    // Assert
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it("should call onPageChange with the previous page number when previous button is clicked", () => {
    // Arrange
    renderComponent({ currentPage: 5 });
    const prevButton = screen.getByRole("link", { name: /go to previous page/i });

    // Act
    fireEvent.click(prevButton);

    // Assert
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it("should call onPageChange with the next page number when next button is clicked", () => {
    // Arrange
    renderComponent({ currentPage: 5 });
    const nextButton = screen.getByRole("link", { name: /go to next page/i });

    // Act
    fireEvent.click(nextButton);

    // Assert
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(6);
  });

  it("should render ellipsis when there are many pages", () => {
    // Arrange & Act
    const { container } = renderComponent({ currentPage: 5, totalItems: 200, pageSize: 10 }); // 20 stron

    // Assert
    // Query using querySelectorAll for the data-slot attribute
    const ellipsisElements = container.querySelectorAll('[data-slot="pagination-ellipsis"]');
    expect(ellipsisElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should not render ellipsis when there are few pages", () => {
    // Arrange & Act
    const { container } = renderComponent({ currentPage: 3, totalItems: 50, pageSize: 10 }); // 5 stron

    // Assert
    const ellipsisElement = container.querySelector('[data-slot="pagination-ellipsis"]');
    expect(ellipsisElement).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "4" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "5" })).toBeInTheDocument();
  });

  // Test dla onPageSizeChange wymaga interakcji z komponentem Select Shadcn
  // Może to być bardziej skomplikowane i wymagać `userEvent` lub specyficznych selektorów
  // it("should call onPageSizeChange when page size is selected", async () => {
  //   renderComponent();
  //   const selectTrigger = screen.getByRole('combobox'); // Może wymagać dokładniejszego selektora
  //   fireEvent.mouseDown(selectTrigger);
  //   const option20 = await screen.findByRole('option', { name: '20' });
  //   fireEvent.click(option20);
  //   expect(mockOnPageSizeChange).toHaveBeenCalledTimes(1);
  //   expect(mockOnPageSizeChange).toHaveBeenCalledWith(20);
  // });
});
