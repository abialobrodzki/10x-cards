import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DeleteConfirmationDialog from "../../components/flashcards/DeleteConfirmationDialog";

describe("DeleteConfirmationDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    isDeleting: false,
    flashcardFront: "To jest bardzo długa treść fiszki, która na pewno przekroczy limit pięćdziesięciu znaków",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Resetujemy mock onConfirm do domyślnego zachowania (resolved Promise)
    mockOnConfirm.mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(<DeleteConfirmationDialog {...defaultProps} {...props} />);
  };

  it("should render the dialog with title, description, and truncated content when open", () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /czy na pewno chcesz usunąć tę fiszkę\?/i })).toBeInTheDocument();
    expect(screen.getByText(/zamierzasz usunąć fiszkę:/i)).toBeInTheDocument();

    // Poprawiona asercja dla skróconej treści:
    // Znajdujemy element <p> z opisem
    const descriptionElement = screen.getByText(/zamierzasz usunąć fiszkę:/i);
    // Znajdujemy w nim element <span>
    const spanElement = descriptionElement.querySelector("span.font-medium");
    // Sprawdzamy, czy textContent zawiera oczekiwany fragment (bez cudzysłowów i nadmiarowych spacji)
    expect(spanElement?.textContent).toContain("To jest bardzo długa treść fiszki, która na pewno ...");

    expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /usuń/i })).toBeInTheDocument();
  });

  // Shadcn AlertDialog zarządza renderowaniem bazując na `open`, więc nie musimy testować `isOpen: false` bezpośrednio,
  // chyba że chcemy upewnić się, że *nic* z dialogu nie jest renderowane.
  // Test Library zazwyczaj nie znajdzie elementów, jeśli nie są renderowane.

  it("should call onClose when the cancel button is clicked", () => {
    // Arrange
    renderComponent();
    const cancelButton = screen.getByRole("button", { name: /anuluj/i });

    // Act
    fireEvent.click(cancelButton);

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("should call onConfirm when the confirm button is clicked", async () => {
    // Arrange
    renderComponent();
    const confirmButton = screen.getByRole("button", { name: /usuń/i });

    // Act
    fireEvent.click(confirmButton);

    // Assert
    // Czekamy na zakończenie asynchronicznego wywołania w handleConfirm
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should handle error during onConfirm gracefully", async () => {
    // Arrange
    const errorMessage = "Failed to delete";
    mockOnConfirm.mockRejectedValue(new Error(errorMessage)); // Symulujemy błąd
    renderComponent();
    const confirmButton = screen.getByRole("button", { name: /usuń/i });

    // Act
    fireEvent.click(confirmButton);

    // Assert
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
    // Komponent łapie błąd i go nie rzuca dalej, więc nie ma crasha
    // Sprawdzamy, czy onClose nie zostało wywołane przypadkiem
    expect(mockOnClose).not.toHaveBeenCalled();
    // Przycisk powinien pozostać włączony po błędzie (chyba że logika stanu isDeleting jest inna)
    expect(confirmButton).toBeEnabled();
  });

  it("should display loading state and disable buttons when isDeleting is true", () => {
    // Arrange & Act
    renderComponent({ isDeleting: true });

    const confirmButton = screen.getByRole("button", { name: /usuwanie.../i });
    const cancelButton = screen.getByRole("button", { name: /anuluj/i });

    // Assert
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton.querySelector("svg.animate-spin")).toBeInTheDocument(); // Sprawdzamy ikonę ładowania
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
