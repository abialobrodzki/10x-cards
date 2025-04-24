import { describe, test, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextInputForm from "../../components/TextInputForm";

describe("TextInputForm", () => {
  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;
  let onSubmit: ReturnType<typeof vi.fn>;

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
    await userEvent.type(textarea, "a".repeat(10));
    expect(screen.getByText(`Tekst jest zbyt krótki. Minimum to ${MIN_CHARS} znaków.`)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Generuj fiszki/i });
    expect(button).toBeDisabled();
  });

  test("enables submit when text length is within valid range and calls onSubmit", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const validText = "a".repeat(MIN_CHARS);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, validText);

    expect(screen.queryByText(/Tekst jest zbyt krótki/i)).toBeNull();
    expect(screen.getByText(`${MIN_CHARS} / ${MAX_CHARS} znaków`)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Generuj fiszki/i });
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith(validText);
  });

  test("does not call onSubmit when isGenerating is true", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={true} />);
    const validText = "a".repeat(MIN_CHARS);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    await userEvent.type(textarea, validText);

    const button = screen.getByRole("button", { name: /Generowanie\.{3}/i });
    expect(button).toBeDisabled();
    expect(textarea).toBeDisabled();

    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("clear button appears when there is input and clears the textarea", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    await userEvent.type(textarea, "some text here");
    const clearButton = screen.getByRole("button", { name: /Wyczyść tekst/i });
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(clearButton);
    expect(textarea).toHaveValue("");
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
  });

  test("shows error when text is too long", async () => {
    render(<TextInputForm onSubmit={onSubmit} isGenerating={false} />);
    const textarea = screen.getByLabelText(/Wprowadź tekst edukacyjny/i);
    const longText = "a".repeat(MAX_CHARS + 1);
    fireEvent.change(textarea, { target: { value: longText } });
    expect(screen.getByText(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
  });
});
