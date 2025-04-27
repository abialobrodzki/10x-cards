import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardFormModal from "../../components/flashcards/FlashcardFormModal"; // Adjusted import path
// import type { Flashcard } from "@/db/types"; // Usuwam problematyczny import
import React from "react"; // Import React

// Definiuję typ Flashcard bezpośrednio w pliku testu
interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  source: string;
  created_at: string;
  updated_at: string;
  generation_id: number | null;
  user_id: string;
}

// Mock Shadcn UI components used internally if they cause issues,
// otherwise Testing Library should handle them.
// Example: vi.mock('@/components/ui/dialog', () => ({ Dialog: ({ children }) => <div>{children}</div>, ... }))

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  flashcard: undefined,
  onSubmit: mockOnSubmit,
  isSubmitting: false,
};

const editingProps = {
  ...defaultProps,
  flashcard: {
    id: 1,
    deck_id: 1,
    front: "Edit Front",
    back: "Edit Back",
    source: "manual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    generation_id: null,
    user_id: "user-123",
  } as Flashcard,
};

describe("FlashcardFormModal", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  // Rendering Tests
  it("renders correctly in create mode", () => {
    render(<FlashcardFormModal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Utwórz nową fiszkę" })).toBeInTheDocument();
    expect(screen.getByLabelText("Przód fiszki")).toHaveValue("");
    expect(screen.getByLabelText("Tył fiszki")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Zapisz" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anuluj" })).toBeInTheDocument();
  });

  it("renders correctly in edit mode with initial values", () => {
    render(<FlashcardFormModal {...editingProps} />);
    expect(screen.getByRole("heading", { name: "Edytuj fiszkę" })).toBeInTheDocument();
    expect(screen.getByLabelText("Przód fiszki")).toHaveValue(editingProps.flashcard.front);
    expect(screen.getByLabelText("Tył fiszki")).toHaveValue(editingProps.flashcard.back);
  });

  // Validation Tests
  it("shows required validation errors when fields are empty and submit is attempted", async () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: "Zapisz" });

    fireEvent.click(submitButton); // Trigger validation by submitting

    // Use findByText for async error messages
    expect(await screen.findByText("Pole przodu fiszki nie może być puste")).toBeInTheDocument();
    expect(await screen.findByText("Pole tyłu fiszki nie może być puste")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows min length validation errors on submit", async () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const backInput = screen.getByLabelText("Tył fiszki");
    const submitButton = screen.getByRole("button", { name: "Zapisz" });

    fireEvent.change(frontInput, { target: { value: "ab" } });
    fireEvent.change(backInput, { target: { value: "cd" } });
    fireEvent.click(submitButton); // Trigger validation by submitting

    // Verify both messages appear
    const errorMessages = await screen.findAllByText("Tekst jest za krótki. Minimum to 3 znaki.");
    expect(errorMessages.length).toBeGreaterThanOrEqual(2);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows max length validation errors on submit", async () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const backInput = screen.getByLabelText("Tył fiszki");
    const submitButton = screen.getByRole("button", { name: "Zapisz" });
    const longText = "a".repeat(501);

    fireEvent.change(frontInput, { target: { value: longText } });
    fireEvent.change(backInput, { target: { value: longText } });
    fireEvent.click(submitButton); // Trigger validation by submitting

    // Verify both messages appear
    const errorMessages = await screen.findAllByText("Tekst jest zbyt długi. Maksimum to 500 znaków.");
    expect(errorMessages.length).toBeGreaterThanOrEqual(2);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // Submission Tests
  it("calls onSubmit with correct values when form is valid (create mode)", async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined); // Mock successful submission
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const backInput = screen.getByLabelText("Tył fiszki");
    const submitButton = screen.getByRole("button", { name: "Zapisz" });

    fireEvent.change(frontInput, { target: { value: "Valid Front" } });
    fireEvent.change(backInput, { target: { value: "Valid Back" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        front: "Valid Front",
        back: "Valid Back",
        source: "manual", // Default source
        generation_id: null,
      });
    });

    // Check if form is reset after successful submission in create mode
    await waitFor(() => {
      expect(frontInput).toHaveValue("");
      expect(backInput).toHaveValue("");
    });
  });

  it("calls onSubmit with correct values when form is valid (edit mode)", async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined); // Mock successful submission
    render(<FlashcardFormModal {...editingProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const backInput = screen.getByLabelText("Tył fiszki");
    const submitButton = screen.getByRole("button", { name: "Zapisz" });

    const updatedFront = "Updated Front";
    const updatedBack = "Updated Back";

    fireEvent.change(frontInput, { target: { value: updatedFront } });
    fireEvent.change(backInput, { target: { value: updatedBack } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        front: updatedFront,
        back: updatedBack,
        source: editingProps.flashcard.source, // Source from edited flashcard
        generation_id: editingProps.flashcard.generation_id,
      });
    });

    // Form should NOT reset in edit mode
    await waitFor(() => {
      expect(frontInput).toHaveValue(updatedFront);
      expect(backInput).toHaveValue(updatedBack);
    });
  });

  it("displays loading state when isSubmitting is true", () => {
    render(<FlashcardFormModal {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: /Zapisywanie.../i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anuluj" })).toBeDisabled();
    expect(screen.getByText("Zapisywanie...")).toBeInTheDocument(); // Check for loading text
    expect(screen.getByRole("button", { name: /Zapisywanie.../i }).querySelector(".animate-spin")).toBeInTheDocument(); // Check for spinner
  });

  it("displays submission error message", async () => {
    const errorMessage = "Failed to save flashcard.";
    mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const backInput = screen.getByLabelText("Tył fiszki");
    const submitButton = screen.getByRole("button", { name: "Zapisz" });

    fireEvent.change(frontInput, { target: { value: "Valid Front" } });
    fireEvent.change(backInput, { target: { value: "Valid Back" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  // Closing Test
  it("calls onClose when Cancel button is clicked", () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: "Anuluj" });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Clear Button Test
  it("clears the front input when its clear button is clicked", () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    fireEvent.change(frontInput, { target: { value: "Some Text" } });
    expect(frontInput).toHaveValue("Some Text");

    // Find the clear button using its accessible name
    // Note: getByRole might find multiple if back input also has text initially or simultaneously
    const clearButton = screen.getByRole("button", { name: "Wyczyść pole" }); // Assumes only one is visible initially

    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);

    expect(frontInput).toHaveValue("");
  });

  // Updated: Use getAllByRole to find clear buttons when both inputs have text
  it("clears the back input when its clear button is clicked", () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const backInput = screen.getByLabelText("Tył fiszki");

    // Give both inputs text so both clear buttons render
    fireEvent.change(frontInput, { target: { value: "Front Text" } });
    fireEvent.change(backInput, { target: { value: "Some Other Text" } });
    expect(backInput).toHaveValue("Some Other Text");

    // Find all clear buttons
    const clearButtons = screen.getAllByRole("button", { name: "Wyczyść pole" });
    expect(clearButtons.length).toBe(2);

    // Assume the second button corresponds to the second input (back)
    const backClearButton = clearButtons[1];

    expect(backClearButton).toBeInTheDocument();
    fireEvent.click(backClearButton);

    expect(backInput).toHaveValue("");
    expect(frontInput).toHaveValue("Front Text"); // Ensure front wasn't cleared
  });

  // Character Count Test
  it("displays character count for front input", () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód fiszki");
    const text = "Test front";
    fireEvent.change(frontInput, { target: { value: text } });
    expect(screen.getByText(`${text.length}/500 znaków`, { selector: "span" })).toBeInTheDocument();
  });

  it("displays character count for back input", () => {
    render(<FlashcardFormModal {...defaultProps} />);
    const backInput = screen.getByLabelText("Tył fiszki");
    const text = "Test back longer";
    fireEvent.change(backInput, { target: { value: text } });
    expect(screen.getByText(`${text.length}/500 znaków`, { selector: "span" })).toBeInTheDocument();
  });
});

// Helper to set up RTL with Vitest's JSDOM environment if needed
// Ensure you have jsdom configured in your vitest.config.ts or package.json
// Example vitest.config.ts:
// /// <reference types="vitest" />
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// export default defineConfig({
//   plugins: [react()],
//   test: {
//     globals: true,
//     environment: 'jsdom',
//     setupFiles: './src/setupTests.ts', // Optional setup file
//     css: true, // If you need CSS parsing
//   },
//   resolve: {
//     alias: {
//       '@': '/src', // Match your project's alias setup
//     },
//   },
// })

// You might need a setup file (e.g., src/setupTests.ts) with:
// import '@testing-library/jest-dom/vitest'; // Extends Vitest's expect with jest-dom matchers
