import { describe, test, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextInputForm from "../../../components/TextInputForm";

describe("TextInputForm", () => {
  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;
  let onSubmit: ReturnType<typeof vi.fn>;
  const user = userEvent.setup();

  beforeEach(() => {
    onSubmit = vi.fn().mockResolvedValue(undefined);
  });

  test("renders textarea and submit button disabled by default", () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    expect(textarea).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Generuj fiszki/i });
    expect(button).toBeDisabled();
  });

  test("shows error when text is too short and keeps submit disabled", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    await user.type(textarea, "a".repeat(10));
    await user.tab(); // Focus out to trigger validation

    // Wait for error to appear
    await waitFor(() => {
      const errorElement = screen.getByTestId("text-input-error-message");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toContain(`Tekst jest zbyt krótki`);
    });

    const button = screen.getByRole("button", { name: /Generuj fiszki/i });
    expect(button).toBeDisabled();
  });

  test("enables submit when text length is within valid range and calls onSubmit", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const validText = "a".repeat(MIN_CHARS);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i) as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, validText);
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByTestId("text-input-error-message")).not.toBeInTheDocument();
    });
    expect(await screen.findByText(`${MIN_CHARS} / ${MAX_CHARS} znaków`)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Generuj fiszki/i });
    await waitFor(() => expect(button).toBeEnabled());

    await user.click(button);
    expect(onSubmit).toHaveBeenCalledWith(validText);
  });

  test("does not call onSubmit when isGenerating is true", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={true} />);
    const validText = "a".repeat(MIN_CHARS);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    await user.type(textarea, validText);

    const button = screen.getByRole("button", { name: /Generowanie\.{3}/i });
    expect(button).toBeDisabled();
    expect(textarea).toBeDisabled();

    if (!button.hasAttribute("disabled")) {
      await user.click(button);
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("clear button appears when there is input and clears the textarea, then shows validation error", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i) as HTMLTextAreaElement;
    await user.type(textarea, "some text here");
    await user.tab();
    const clearButton = screen.getByRole("button", { name: /Wyczyść tekst/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(textarea.value).toBe("");

    // After clearing, validation should show "too short" error
    await waitFor(() => {
      const errorElement = screen.getByTestId("text-input-error-message");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toContain(`Tekst jest zbyt krótki`);
    });

    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
  });

  test("shows error when text is too long", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    const longText = "a".repeat(MAX_CHARS + 1);
    fireEvent.change(textarea, { target: { value: longText } });
    fireEvent.blur(textarea); // Explicitly blur to trigger validation

    // Check for too long error message
    await waitFor(() => {
      const errorElement = screen.getByTestId("text-input-error-message");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toContain(`Tekst jest zbyt długi`);
    });

    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
  });
});
