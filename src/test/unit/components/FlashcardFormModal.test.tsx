import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardFormModal from "../../../components/flashcards/FlashcardFormModal";
import type { FlashcardDto } from "../../../types";

// ----- Mock funkcji onSubmit -----
const mockOnSubmit = vi.fn();

describe("FlashcardFormModal", () => {
  const mockOnClose = vi.fn();

  const mockFlashcardToEdit: FlashcardDto = {
    id: 1,
    front: "Initial Front",
    back: "Initial Back",
    source: "manual",
    generation_id: null,
    created_at: "",
    updated_at: "",
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    flashcard: undefined,
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Domyślnie onSubmit rozwiązuje się pomyślnie
    mockOnSubmit.mockResolvedValue(undefined);
  });

  const renderComponent = (props = {}) => {
    return render(<FlashcardFormModal {...defaultProps} {...props} />);
  };

  // --- Testy Renderowania i Stanu Początkowego ---
  it("should not render the dialog when isOpen is false", () => {
    renderComponent({ isOpen: false });
    // Szukamy po roli dialog, zakładając, że Shadcn ją dodaje
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render create mode title and empty form when flashcard prop is null", () => {
    renderComponent({ flashcard: null });
    expect(screen.getByRole("heading", { name: /utwórz nową fiszkę/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/przód fiszki/i)).toHaveValue("");
    expect(screen.getByLabelText(/tył fiszki/i)).toHaveValue("");
  });

  it("should render edit mode title and populate form when flashcard prop is provided", () => {
    renderComponent({ flashcard: mockFlashcardToEdit });
    expect(screen.getByRole("heading", { name: /edytuj fiszkę/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/przód fiszki/i)).toHaveValue(mockFlashcardToEdit.front);
    expect(screen.getByLabelText(/tył fiszki/i)).toHaveValue(mockFlashcardToEdit.back);
  });

  // --- Testy Walidacji --- (na przykładzie pola 'front')
  it("should display validation error if front is empty", async () => {
    renderComponent({ flashcard: undefined });
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "  " } }); // Puste znaki
    fireEvent.blur(screen.getByLabelText(/przód fiszki/i)); // Wywołanie walidacji onBlur
    // Lub klikamy zapisz, jeśli mode jest onSubmit
    // fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));
    expect(await screen.findByText(/tekst jest za krótki/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should display validation error if front is too short", async () => {
    renderComponent({ flashcard: null });
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "ab" } });
    fireEvent.blur(screen.getByLabelText(/przód fiszki/i));
    expect(await screen.findByText(/tekst jest za krótki/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should display validation error if front is too long", async () => {
    renderComponent({ flashcard: null });
    const longText = "a".repeat(501);
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: longText } });
    fireEvent.blur(screen.getByLabelText(/przód fiszki/i));
    expect(await screen.findByText(/tekst jest zbyt długi/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // --- Testy Interakcji ---
  it("should call onClose when cancel button is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: /anuluj/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Testowanie zamknięcia przez onOpenChange (np. kliknięcie overlay) jest trudniejsze
  // i zależy od implementacji Dialog z Shadcn.

  it("should clear the textarea when clear button is clicked", () => {
    renderComponent({ flashcard: mockFlashcardToEdit });
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    expect(frontInput).toHaveValue(mockFlashcardToEdit.front);
    // Znajdujemy przycisk czyszczenia (może wymagać dokładniejszego selektora)
    const clearButton = screen.getAllByRole("button", { name: /wyczyść pole/i })[0]; // Zakładamy pierwszy dla 'front'
    fireEvent.click(clearButton);
    expect(frontInput).toHaveValue("");
  });

  // --- Testy Wysyłania Formularza ---
  it("should call onSubmit with form data on successful submission (create mode)", async () => {
    renderComponent({ flashcard: null });
    const frontText = "Nowy Przód";
    const backText = "Nowy Tył";
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: frontText } });
    fireEvent.change(screen.getByLabelText(/tył fiszki/i), { target: { value: backText } });
    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        front: frontText,
        back: backText,
        source: "manual", // Domyślne dla tworzenia
        generation_id: null,
      });
    });
    // Sprawdź reset formularza po sukcesie w trybie tworzenia
    expect(screen.getByLabelText(/przód fiszki/i)).toHaveValue("");
  });

  it("should call onSubmit with form data on successful submission (edit mode)", async () => {
    renderComponent({ flashcard: mockFlashcardToEdit });
    const editedFront = "Zmieniony Przód";
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: editedFront } });
    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        front: editedFront,
        back: mockFlashcardToEdit.back, // Tył pozostał bez zmian
        source: mockFlashcardToEdit.source,
        generation_id: mockFlashcardToEdit.generation_id,
      });
    });
    // Sprawdź BRAK resetu formularza po sukcesie w trybie edycji
    expect(screen.getByLabelText(/przód fiszki/i)).toHaveValue(editedFront);
  });

  it("should display loading state when isSubmitting is true", () => {
    renderComponent({ isSubmitting: true });
    const saveButton = screen.getByRole("button", { name: /zapisywanie.../i });
    expect(saveButton).toBeDisabled();
    expect(saveButton.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /anuluj/i })).toBeDisabled();
  });

  it("should display error message if onSubmit throws an error", async () => {
    const errorMessage = "Błąd serwera!";
    mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));
    renderComponent({ flashcard: null });
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "Poprawny przód" } });
    fireEvent.change(screen.getByLabelText(/tył fiszki/i), { target: { value: "Poprawny tył" } });
    fireEvent.click(screen.getByRole("button", { name: /zapisz/i }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    // Sprawdź czy komunikat błędu jest w alercie
    expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
  });
});
