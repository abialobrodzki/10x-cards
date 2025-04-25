import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ErrorNotification from "../../components/ui/ErrorNotification";

describe("ErrorNotification", () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    message: "Wystąpił błąd!",
    isVisible: true,
    onClose: mockOnClose,
    type: "error" as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<ErrorNotification {...defaultProps} {...props} />);
  };

  it("should not render when isVisible is false", () => {
    // Arrange & Act
    const { container } = renderComponent({ isVisible: false });

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("should render error icon, message, and close button by default", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
    // Sprawdzamy klasę tła dla typu 'error'
    expect(alert).toHaveClass("bg-red-50");
    // Sprawdzamy obecność przycisku zamknięcia
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    // Można by dodać dokładniejsze sprawdzanie ikony, np. przez data-testid
  });

  it("should render warning styles and icon when type is 'warning'", () => {
    // Arrange & Act
    renderComponent({ type: "warning" });

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-yellow-50");
    // Sprawdź czy ikona ostrzeżenia jest obecna (może wymagać data-testid)
  });

  it("should render info styles and icon when type is 'info'", () => {
    // Arrange & Act
    renderComponent({ type: "info" });

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-blue-50");
    // Sprawdź czy ikona info jest obecna (może wymagać data-testid)
  });

  it("should not render close button if onClose is not provided", () => {
    // Arrange & Act
    renderComponent({ onClose: undefined });

    // Assert
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
  });

  it("should call onClose when the close button is clicked", () => {
    // Arrange
    renderComponent();
    const closeButton = screen.getByRole("button", { name: /close/i });

    // Act
    fireEvent.click(closeButton);

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
