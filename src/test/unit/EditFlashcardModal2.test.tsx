import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditFlashcardModal from "../../components/EditFlashcardModal";
import type { FlashcardViewModel } from "../../types/viewModels";

// Mock Shadcn UI components to avoid actual rendering complexity
/* eslint-disable react/prop-types */
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type = "button",
    "aria-label": ariaLabel,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label"?: string }) => (
    <button onClick={onClick} disabled={disabled} type={type} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}));
vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({
    value,
    onChange,
    id,
    placeholder,
    className,
    "aria-invalid": ariaInvalid,
    ...props
  }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { "aria-invalid"?: boolean }) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      aria-invalid={ariaInvalid}
      data-testid={id} // Add data-testid for easier selection
      {...props}
    />
  ),
}));
vi.mock("@/components/ui/label", () => ({
  Label: ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));
/* eslint-enable react/prop-types */

const mockFlashcard: FlashcardViewModel = {
  id: 1,
  front: "Initial Front",
  back: "Initial Back",
  isAccepted: false,
  isEdited: false,
  isRejected: false,
};

describe("EditFlashcardModal", () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnSave: ReturnType<typeof vi.fn>;
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset mocks before each test
    mockOnClose = vi.fn();
    mockOnSave = vi.fn();
    // Reset mocks for Shadcn components if they track calls internally
    vi.clearAllMocks();
  });

  const renderComponent = (isOpen = true, flashcard: FlashcardViewModel | null = mockFlashcard) => {
    return render(
      <EditFlashcardModal isOpen={isOpen} flashcard={flashcard} onClose={mockOnClose} onSave={mockOnSave} />
    );
  };

  it("should not render when isOpen is false", () => {
    renderComponent(false);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("should render with initial flashcard data when open", () => {
    renderComponent();
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /edytuj fiszkę/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/przód fiszki/i)).toHaveValue(mockFlashcard.front);
    expect(screen.getByLabelText(/tył fiszki/i)).toHaveValue(mockFlashcard.back);
    expect(screen.getByText(`${mockFlashcard.front.length} / 500 znaków`)).toBeInTheDocument();
    expect(screen.getByText(`${mockFlashcard.back.length} / 500 znaków`)).toBeInTheDocument();
  });

  it("should call onClose when the cancel button is clicked", async () => {
    renderComponent();
    const cancelButton = screen.getByRole("button", { name: /anuluj/i });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // --- Validation Tests ---

  it("should show validation errors and prevent save for empty fields", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    await user.clear(frontInput);
    await user.clear(backInput);
    await user.click(saveButton);

    expect(await screen.findByText("Pole przodu fiszki nie może być puste")).toBeInTheDocument();
    expect(await screen.findByText("Pole tyłu fiszki nie może być puste")).toBeInTheDocument();
    expect(frontInput).toHaveAttribute("aria-invalid", "true");
    expect(backInput).toHaveAttribute("aria-invalid", "true");
    expect(saveButton).toBeDisabled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should show validation errors and prevent save for too short fields", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    await user.clear(frontInput);
    await user.type(frontInput, "ab"); // Less than MIN_CHARS (3)
    await user.clear(backInput);
    await user.type(backInput, "cd"); // Less than MIN_CHARS (3)

    // Trigger validation by trying to save or by checking error message after typing
    await user.click(saveButton); // Attempt saving to trigger full validation

    // Check for *both* error messages
    const shortTextErrors = await screen.findAllByText(/tekst jest za krótki\. minimum to 3 znaki\./i);
    expect(shortTextErrors).toHaveLength(2);

    expect(frontInput).toHaveAttribute("aria-invalid", "true");
    expect(backInput).toHaveAttribute("aria-invalid", "true");
    expect(saveButton).toBeDisabled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should show validation errors and prevent save for too long fields", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);
    const saveButton = screen.getByRole("button", { name: /zapisz/i });
    const longText = "a".repeat(501); // More than MAX_CHARS (500)

    await user.clear(frontInput);
    await user.type(frontInput, longText);
    await user.clear(backInput);
    await user.type(backInput, longText);

    // Error messages appear dynamically on change in the component
    // Check for *both* error messages
    const longTextErrors = await screen.findAllByText(/tekst jest zbyt długi\. maksimum to 500 znaków\./i);
    expect(longTextErrors).toHaveLength(2);

    expect(frontInput).toHaveAttribute("aria-invalid", "true");
    expect(backInput).toHaveAttribute("aria-invalid", "true");
    expect(saveButton).toBeDisabled();

    // Also check if save is prevented on click
    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should clear validation errors when input becomes valid", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    // Make it invalid (too short)
    await user.clear(frontInput);
    await user.type(frontInput, "ab");
    expect(await screen.findByText(/tekst jest za krótki\. minimum to 3 znaki\./i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Make it valid
    await user.type(frontInput, "cdefg"); // Now valid length
    expect(screen.queryByText(/tekst jest za krótki\. minimum to 3 znaki\./i)).not.toBeInTheDocument();
    // Assuming back is still valid from initial state
    expect(saveButton).not.toBeDisabled();
    expect(frontInput).toHaveAttribute("aria-invalid", "false");
  });

  // --- Interaction Tests ---

  it("should update front and back state on input change and update char count", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);

    await user.clear(frontInput);
    await user.type(frontInput, "New Front Text");
    expect(frontInput).toHaveValue("New Front Text");
    expect(screen.getByText("14 / 500 znaków")).toBeInTheDocument(); // Check front char count

    await user.clear(backInput);
    await user.type(backInput, "New Back Text");
    expect(backInput).toHaveValue("New Back Text");
    expect(screen.getByText("13 / 500 znaków")).toBeInTheDocument(); // Check back char count
  });

  it("should call onSave with trimmed data and onClose when form is submitted with valid data", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    await user.clear(frontInput);
    await user.type(frontInput, "  Valid Front  ");
    await user.clear(backInput);
    await user.type(backInput, "  Valid Back   ");

    expect(saveButton).not.toBeDisabled(); // Ensure button is enabled

    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      front: "Valid Front", // Check if trimmed
      back: "Valid Back", // Check if trimmed
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should clear the input field when the clear button is clicked", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i) as HTMLTextAreaElement;
    const backInput = screen.getByLabelText(/tył fiszki/i) as HTMLTextAreaElement;

    expect(frontInput.value).toBe(mockFlashcard.front);

    // Find the clear button relative to the front input
    const frontInputContainer = frontInput.closest("div.relative")?.parentElement;
    expect(frontInputContainer).toBeInTheDocument(); // Ensure container is found
    if (frontInputContainer) {
      const frontClearButton = within(frontInputContainer).getByLabelText(/wyczyść pole/i);
      await user.click(frontClearButton);
    }

    // Wait for update
    await waitFor(() => {
      expect(frontInput.value).toBe("");
    });
    expect(screen.getByText("0 / 500 znaków")).toBeInTheDocument(); // Check front char count reset
    expect(screen.queryByText("Pole przodu fiszki nie może być puste")).not.toBeInTheDocument(); // Error should be nullified

    // Test back clear button
    expect(backInput.value).toBe(mockFlashcard.back); // Check initial value *before* clicking clear

    // Find the clear button relative to the back input
    const backInputContainer = backInput.closest("div.relative")?.parentElement;
    expect(backInputContainer).toBeInTheDocument(); // Ensure container is found
    if (backInputContainer) {
      const backClearButton = within(backInputContainer).getByLabelText(/wyczyść pole/i);
      await user.click(backClearButton); // Click the back clear button
    }

    // Wait for the back input value to be updated asynchronously
    await waitFor(() => {
      expect(backInput.value).toBe("");
    });

    // Need to check back char count reset as well
    // This might require adjusting the query if both counts become "0 / 500"
    const zeroCounts = screen.getAllByText("0 / 500 znaków");
    expect(zeroCounts.length).toBe(2); // Check both counts are zero
  });

  it("should update character count correctly", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);

    // Initial count check
    expect(screen.getByText(`${mockFlashcard.front.length} / 500 znaków`)).toBeInTheDocument();

    // Type more characters
    await user.type(frontInput, " More text");
    const newLength = mockFlashcard.front.length + 10; // " More text"
    expect(screen.getByText(`${newLength} / 500 znaków`)).toBeInTheDocument();

    // Clear input
    await user.clear(frontInput);
    expect(screen.getByText("0 / 500 znaków")).toBeInTheDocument();
  });

  it("should apply error styles when validation fails", async () => {
    renderComponent();
    const frontInput = screen.getByTestId("front"); // Use data-testid added in mock
    const backInput = screen.getByTestId("back"); // Use data-testid added in mock
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    // Initially no error styles
    expect(frontInput).not.toHaveClass(/border-destructive/);
    expect(backInput).not.toHaveClass(/border-destructive/);

    // Trigger validation error (empty field)
    await user.clear(frontInput);
    await user.click(saveButton); // Click save to trigger validation check

    // Check for error styles after validation fails
    await waitFor(() => {
      expect(frontInput).toHaveClass(/border-destructive/);
      expect(frontInput).toHaveAttribute("aria-invalid", "true");
    });

    // Fix the error
    await user.type(frontInput, "Valid input now");

    // Check error styles are removed
    await waitFor(() => {
      expect(frontInput).not.toHaveClass(/border-destructive/);
      expect(frontInput).toHaveAttribute("aria-invalid", "false");
    });
  });
});
