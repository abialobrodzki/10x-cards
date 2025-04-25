import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateFlashcardButton from "../../components/flashcards/CreateFlashcardButton";

describe("CreateFlashcardButton", () => {
  it("should render the button with icon and text", () => {
    // Arrange
    const handleClick = vi.fn();
    render(<CreateFlashcardButton onClick={handleClick} />);

    // Act
    const button = screen.getByRole("button", { name: /dodaj fiszkę/i });
    const icon = button.querySelector("svg"); // Sprawdzamy obecność SVG (ikony)

    // Assert
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Dodaj fiszkę")).toBeInTheDocument();
    expect(icon).toBeInTheDocument(); // Upewniamy się, że ikona jest renderowana
  });

  it("should call the onClick handler when clicked", () => {
    // Arrange
    const handleClick = vi.fn(); // Używamy vi.fn() do stworzenia mocka funkcji
    render(<CreateFlashcardButton onClick={handleClick} />);
    const button = screen.getByRole("button", { name: /dodaj fiszkę/i });

    // Act
    fireEvent.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1); // Sprawdzamy, czy mock został wywołany
  });
});
