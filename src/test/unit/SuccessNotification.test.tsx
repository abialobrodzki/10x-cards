import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SuccessNotification from "../../components/ui/SuccessNotification";

describe("SuccessNotification", () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    message: "Operacja zakończona sukcesem!",
    isVisible: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers(); // Używamy fake timers do kontroli setTimeout
  });

  afterEach(() => {
    vi.useRealTimers(); // Przywracamy prawdziwe timery
  });

  const renderComponent = (props = {}) => {
    return render(<SuccessNotification {...defaultProps} {...props} />);
  };

  it("should not render when isVisible is false", () => {
    // Arrange & Act
    const { container } = renderComponent({ isVisible: false });

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("should render the success icon, message, and close button when visible", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
    // Sprawdzamy ikonę (po strukturze lub dodając data-testid)
    expect(
      screen.getByRole("alert").querySelector('svg[fill="currentColor"] path[fill-rule="evenodd"]')
    ).toBeInTheDocument(); // Szukamy ikony ptaszka
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
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

  it("should call onClose after autoHideDuration if provided", () => {
    // Arrange
    const duration = 5000;
    renderComponent({ autoHideDuration: duration });

    // Assert: Nie wywołane od razu
    expect(mockOnClose).not.toHaveBeenCalled();

    // Act: Przyspieszamy czas o duration
    vi.advanceTimersByTime(duration);

    // Assert: Wywołane po czasie
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should not call onClose automatically if autoHideDuration is 0 or not provided", () => {
    // Arrange
    renderComponent({ autoHideDuration: 0 });

    // Act: Przyspieszamy czas (dowolnie długo)
    vi.advanceTimersByTime(10000);

    // Assert: Nie powinno być wywołane
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should not call onClose automatically if onClose is not provided, even with duration", () => {
    // Arrange
    renderComponent({ autoHideDuration: 5000, onClose: undefined });

    // Act: Przyspieszamy czas
    vi.advanceTimersByTime(5000);

    // Assert: Nie powinno być wywołane, bo nie ma funkcji onClose
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should clear the timer on unmount", () => {
    // Arrange
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { unmount } = renderComponent({ autoHideDuration: 5000 });

    // Act
    unmount();

    // Assert
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
