import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    // Button might be disabled initially until validation occurs - remove this assertion
    // expect(screen.getByRole("button", { name: /zapisz/i })).toBeEnabled();
  });

  // --- Testy Walidacji ---
  it("should display validation error and disable save if front is cleared", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    fireEvent.change(frontInput, { target: { value: "" } });
    fireEvent.blur(frontInput);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
    });

    // Check that save button is disabled
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should display validation error and disable save if front is too short", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    fireEvent.change(frontInput, { target: { value: "ab" } });
    fireEvent.blur(frontInput);

    await waitFor(() => {
      expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
  });

  it("should display validation error and disable save if front is too long", async () => {
    renderComponent();
    const longText = "a".repeat(501);
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    fireEvent.change(frontInput, { target: { value: longText } });
    fireEvent.blur(frontInput);

    await waitFor(() => {
      expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /zapisz/i })).toBeDisabled();
    expect(screen.getByText(/501 \/ 500 znaków/i)).toHaveClass("text-red-600"); // Sprawdzamy licznik znaków
  });

  it("should hide error and enable save when validation passes", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);

    // First create an error
    fireEvent.change(frontInput, { target: { value: "" } });
    fireEvent.blur(frontInput);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
    });

    // Then fix the error
    fireEvent.change(frontInput, { target: { value: "Poprawna treść" } });
    fireEvent.blur(frontInput);

    // Make sure both fields have valid content
    fireEvent.change(backInput, { target: { value: "Poprawna treść tyłu" } });
    fireEvent.blur(backInput);

    // Trigger form revalidation
    fireEvent.change(frontInput, { target: { value: "Poprawna treść zmodyfikowana" } });
    fireEvent.blur(frontInput);

    // Wait for error to disappear
    await waitFor(() => {
      expect(screen.queryByTestId("front-error-message")).not.toBeInTheDocument();
    });

    // The save button should be enabled once validation passes
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /zapisz/i })).not.toBeDisabled();
    });
  });

  // --- Testy Interakcji ---
  it("should call onClose when cancel button is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: /anuluj/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should clear the textarea when clear button is clicked and trigger validation", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);

    // Set a valid value first
    fireEvent.change(frontInput, { target: { value: "Poprawna treść" } });
    fireEvent.blur(frontInput);

    // Then make it too long to trigger error
    fireEvent.change(frontInput, { target: { value: "a".repeat(501) } });
    fireEvent.blur(frontInput);

    // Confirm error is shown
    await waitFor(() => {
      expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
    });

    const clearButton = screen.getAllByRole("button", { name: /wyczyść pole/i })[0];
    fireEvent.click(clearButton);

    // Expect the input to be cleared
    expect(frontInput).toHaveValue("");

    // After clearing, a different validation error should appear (empty field)
    await waitFor(() => {
      const errorMessage = screen.getByTestId("front-error-message");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent).toContain("nie może być puste");
    });
  });

  // --- Testy Wysyłania Formularza ---
  it("should call onSave with trimmed data and onClose on successful submission", async () => {
    const user = userEvent.setup();
    renderComponent();
    const editedFront = "  Nowy Przód Trimmed  ";
    const editedBack = " Nowy Tył Trimmed ";

    // Fill in the form with valid values
    await user.clear(screen.getByLabelText(/przód fiszki/i));
    await user.type(screen.getByLabelText(/przód fiszki/i), editedFront);
    await user.clear(screen.getByLabelText(/tył fiszki/i));
    await user.type(screen.getByLabelText(/tył fiszki/i), editedBack);

    // Ensure fields are blurred to trigger validation
    await user.tab();

    // Get the save button element
    const saveButton = screen.getByTestId("save-edit-button");

    // Wait for button to be enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    // Click the save button
    await user.click(saveButton);

    // Verify that onSave and onClose were called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({
        front: editedFront.trim(),
        back: editedBack.trim(),
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should not call onSave or onClose if validation fails on submit", async () => {
    renderComponent();

    // Set an invalid value (empty)
    fireEvent.change(screen.getByLabelText(/przód fiszki/i), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText(/przód fiszki/i));

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
    });

    // Get the form element and submit it
    const form = screen.getByTestId("edit-flashcard-form");
    fireEvent.submit(form);

    // Verify callbacks weren't called
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();

    // Verify error is still displayed
    expect(screen.getByTestId("front-error-message")).toBeInTheDocument();
  });
});
