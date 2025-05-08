import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditFlashcardModal from "../../../components/EditFlashcardModal";
import type { FlashcardViewModel } from "../../../types/viewModels";

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

  it("should render with initial flashcard data when open", async () => {
    renderComponent();
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /edytuj fiszkę/i })).toBeInTheDocument();
    expect(await screen.findByDisplayValue(mockFlashcard.front)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(mockFlashcard.back)).toBeInTheDocument();
    expect(await screen.findByText(`${mockFlashcard.front.length} / 500 znaków`)).toBeInTheDocument();
    expect(await screen.findByText(`${mockFlashcard.back.length} / 500 znaków`)).toBeInTheDocument();
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

    expect(frontInput).toHaveValue("");
    expect(backInput).toHaveValue("");

    await user.click(saveButton);

    expect(await screen.findByText("Pole przodu fiszki nie może być puste.")).toBeInTheDocument();
    expect(await screen.findByText("Pole tyłu fiszki nie może być puste.")).toBeInTheDocument();

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
    await user.type(frontInput, "a");
    await user.tab();

    await user.clear(backInput);
    await user.type(backInput, "b");
    await user.tab();

    // Now we expect exactly two error messages with this text
    const shortTextErrors = await screen.findAllByText("Tekst jest za krótki. Minimum to 3 znaki.");
    expect(shortTextErrors).toHaveLength(2);

    expect(saveButton).toBeDisabled();

    await user.click(saveButton);

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
    const longText = "a".repeat(501);

    await user.clear(frontInput);
    await user.type(frontInput, longText);
    await user.tab();

    await user.clear(backInput);
    await user.type(backInput, longText);
    await user.tab();

    const longTextErrors = await screen.findAllByText("Tekst jest zbyt długi. Maksimum to 500 znaków.");
    expect(longTextErrors.length).toBeGreaterThanOrEqual(1);

    expect(frontInput).toHaveAttribute("aria-invalid", "true");
    expect(backInput).toHaveAttribute("aria-invalid", "true");
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should clear validation errors when input becomes valid", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i) as HTMLTextAreaElement;
    const backInput = screen.getByLabelText(/tył fiszki/i) as HTMLTextAreaElement;
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    await user.clear(frontInput);
    await user.type(frontInput, "a");
    await user.tab();
    expect(await screen.findByText("Tekst jest za krótki. Minimum to 3 znaki.")).toBeInTheDocument();
    expect(frontInput).toHaveAttribute("aria-invalid", "true");
    expect(saveButton).toBeDisabled();

    await user.clear(frontInput);
    await user.type(frontInput, "Valid Front Text");
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByText("Tekst jest za krótki. Minimum to 3 znaki.")).not.toBeInTheDocument();
    });
    expect(frontInput).toHaveAttribute("aria-invalid", "false");

    if (backInput.value.length >= 3 && backInput.value.length <= 500) {
      expect(saveButton).not.toBeDisabled();
    } else {
      await user.clear(backInput);
      await user.type(backInput, "Valid Back Text");
      await user.tab();
      await waitFor(() => expect(saveButton).not.toBeDisabled());
    }
  });

  // --- Interaction Tests ---

  it("should update front and back state on input change and update char count", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);

    await user.clear(frontInput);
    await user.type(frontInput, "New Front Text");
    await user.tab();
    expect(frontInput).toHaveValue("New Front Text");
    expect(await screen.findByText("14 / 500 znaków")).toBeInTheDocument();

    await user.clear(backInput);
    await user.type(backInput, "New Back Text");
    await user.tab();
    expect(backInput).toHaveValue("New Back Text");
    expect(await screen.findByText("13 / 500 znaków")).toBeInTheDocument();
  });

  it("should call onSave with trimmed data and onClose when form is submitted with valid data", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);
    const backInput = screen.getByLabelText(/tył fiszki/i);
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    await user.clear(frontInput);
    await user.type(frontInput, "  Valid Front  ");
    await user.tab();

    await user.clear(backInput);
    await user.type(backInput, "  Valid Back   ");
    await user.tab();

    await waitFor(() => expect(saveButton).not.toBeDisabled());

    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      front: "Valid Front",
      back: "Valid Back",
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should clear the input field and error when the clear button is clicked", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i) as HTMLTextAreaElement;
    const frontInputContainer = frontInput.closest("div.relative")?.parentElement;

    await user.clear(frontInput);
    await user.type(frontInput, "a");
    await user.tab();
    expect(await screen.findByText("Tekst jest za krótki. Minimum to 3 znaki.")).toBeInTheDocument();

    if (frontInputContainer) {
      const clearFrontButton = within(frontInputContainer).getByRole("button", { name: /wyczyść pole/i });
      await user.click(clearFrontButton);
    } else {
      throw new Error("Could not find parent container for the clear button of frontInput");
    }

    expect(frontInput.value).toBe("");
    expect(await screen.findByText("Pole przodu fiszki nie może być puste.")).toBeInTheDocument();
    expect(frontInput).toHaveAttribute("aria-invalid", "true");
  });

  it("should update character count correctly", async () => {
    renderComponent();
    const frontInput = screen.getByLabelText(/przód fiszki/i);

    expect(screen.getByText(`${mockFlashcard.front.length} / 500 znaków`)).toBeInTheDocument();

    await user.type(frontInput, " More text");
    const newLength = mockFlashcard.front.length + 10;
    expect(screen.getByText(`${newLength} / 500 znaków`)).toBeInTheDocument();

    await user.clear(frontInput);
    expect(screen.getByText("0 / 500 znaków")).toBeInTheDocument();
  });

  it("should apply error styles when validation fails", async () => {
    renderComponent();
    const frontInput = screen.getByTestId("edit-flashcard-front-textarea");
    const backInput = screen.getByTestId("edit-flashcard-back-textarea");
    const saveButton = screen.getByRole("button", { name: /zapisz/i });

    expect(frontInput).not.toHaveClass(/border-destructive/);
    expect(backInput).not.toHaveClass(/border-destructive/);

    await user.clear(frontInput);
    await user.click(saveButton);

    await waitFor(() => {
      expect(frontInput).toHaveClass(/border-destructive/);
      expect(frontInput).toHaveAttribute("aria-invalid", "true");
    });

    await user.type(frontInput, "Valid input now");

    await waitFor(() => {
      expect(frontInput).not.toHaveClass(/border-destructive/);
      expect(frontInput).toHaveAttribute("aria-invalid", "false");
    });
  });
});
