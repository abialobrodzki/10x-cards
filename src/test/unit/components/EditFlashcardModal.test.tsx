import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditFlashcardModal from "../../../components/EditFlashcardModal";
import type { FlashcardViewModel } from "../../../types/viewModels";

// ----- Mock funkcji onSave -----
const mockOnSave = vi.fn();

describe("EditFlashcardModal", () => {
  const mockOnClose = vi.fn();

  const mockFlashcard: FlashcardViewModel = {
    front: "Original Front",
    back: "Original Back",
    isAccepted: false,
    isEdited: false,
    isRejected: false,
    originalData: { front: "Original Front", back: "Original Back" },
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    flashcard: mockFlashcard,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<EditFlashcardModal {...defaultProps} {...props} />);
  };

  // --- Testy Renderowania i Stanu Początkowego ---
  it("should not render the dialog when isOpen is false", () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render dialog with title and populated form when open with flashcard", () => {
    renderComponent();
    expect(screen.getByRole("heading", { name: /edytuj fiszkę/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/przód fiszki/i)).toHaveValue(mockFlashcard.front);
    expect(screen.getByLabelText(/tył fiszki/i)).toHaveValue(mockFlashcard.back);
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeEnabled(); // Początkowo bez błędów
  });

  // --- Testy Walidacji ---
  it("should display validation error and disable save if front is cleared", async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "" } });
    expect(await screen.findByText(/pole przodu fiszki nie może być puste/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should display validation error and disable save if front is too short", async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "ab" } });
    expect(await screen.findByText(/tekst jest za krótki/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
  });

  it("should display validation error and disable save if front is too long", async () => {
    renderComponent();
    const longText = "a".repeat(501);
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: longText } });
    expect(await screen.findByText(/tekst jest zbyt długi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
    expect(screen.getByText(/501 \/ 500 znaków/i)).toHaveClass("text-red-600"); // Sprawdzamy licznik znaków
  });

  it("should hide error and enable save when validation passes", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    // Najpierw błąd
    fireEvent.change(frontInput, { target: { value: "" } });
    expect(await screen.findByText(/pole przodu fiszki nie może być puste/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
    // Poprawiamy
    fireEvent.change(frontInput, { target: { value: "Poprawna treść" } });
    expect(screen.queryByText(/pole przodu fiszki nie może być puste/i)).not.toBeInTheDocument();
    // Sprawdzamy czy przycisk jest włączony (zakładając, że 'back' jest nadal poprawny)
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeEnabled();
  });

  // --- Testy Interakcji ---
  it("should call onClose when cancel button is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: /anuluj/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should clear the textarea when clear button is clicked and hide previous error", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    // Ustawiamy błąd najpierw
    fireEvent.change(frontInput, { target: { value: "a".repeat(501) } });
    expect(await screen.findByText(/tekst jest zbyt długi/i)).toBeInTheDocument();
    expect(frontInput).toHaveValue("a".repeat(501));

    const clearButton = screen.getAllByRole("button", { name: /wyczyść pole/i })[0]; // Zakładamy pierwszy dla 'front'
    fireEvent.click(clearButton);

    expect(frontInput).toHaveValue("");
    // Sprawdzamy, czy poprzedni błąd zniknął
    expect(screen.queryByText(/tekst jest zbyt długi/i)).not.toBeInTheDocument();
    // Sprawdzamy, czy NIE pojawił się błąd "pole puste" (bo resetuje do null)
    expect(screen.queryByText(/pole przodu fiszki nie może być puste/i)).not.toBeInTheDocument();
    // Przycisk Zapisz powinien być wyłączony, bo pole jest puste (walidacja przy submit)
    // Ale testujemy stan *bezpośrednio* po kliknięciu, a walidacja jest on-change/on-submit
    // W komponencie przycisk jest disable={!!frontError || !!backError}
    // Ponieważ frontError jest resetowany do null, a backError nie był ustawiony,
    // przycisk powinien być WŁĄCZONY!
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeEnabled();
    // Dopiero próba wysłania pustego formularza wywołałaby błąd i wyłączyła przycisk (co testujemy gdzie indziej)
  });

  // --- Testy Wysyłania Formularza ---
  it("should call onSave with trimmed data and onClose on successful submission", () => {
    renderComponent();
    const editedFront = "  Nowy Przód Trimmed  ";
    const editedBack = " Nowy Tył Trimmed ";
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: editedFront } });
    fireEvent.change(screen.getByLabelText(/tył fiszki/i), { target: { value: editedBack } });

    // Upewniamy się, że przycisk jest włączony
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      front: editedFront.trim(),
      back: editedBack.trim(),
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should not call onSave or onClose if validation fails on submit", () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "" } }); // Wywołujemy błąd
    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(screen.getByText(/pole przodu fiszki nie może być puste/i)).toBeInTheDocument(); // Błąd powinien być widoczny
  });
});
