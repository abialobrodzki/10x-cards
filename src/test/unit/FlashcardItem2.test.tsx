import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardItem from "../../components/FlashcardItem";
import type { FlashcardViewModel } from "../../types/viewModels";

// Mock data
const mockFlashcardBase: FlashcardViewModel = {
  id: 1,
  front: "Test Front",
  back: "Test Back",
  isAccepted: false,
  isRejected: false,
  isEdited: false,
};

const mockOnAccept = vi.fn();
const mockOnEdit = vi.fn();
const mockOnReject = vi.fn();
const mockIndex = 0;

describe("FlashcardItem", () => {
  // Helper function to render the component with specific props
  const renderComponent = (flashcardProps: Partial<FlashcardViewModel> = {}) => {
    const flashcard = { ...mockFlashcardBase, ...flashcardProps };
    return render(
      <FlashcardItem
        flashcard={flashcard}
        index={mockIndex}
        onAccept={mockOnAccept}
        onEdit={mockOnEdit}
        onReject={mockOnReject}
      />
    );
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render front and back content", () => {
    renderComponent();
    expect(screen.getByText("Test Front")).toBeInTheDocument();
    expect(screen.getByText("Test Back")).toBeInTheDocument();
  });

  it("should display 'Oczekująca' badge for a pending flashcard", () => {
    renderComponent();
    expect(screen.getByText("Oczekująca")).toBeInTheDocument();
  });

  it("should display 'Zaakceptowana' badge for an accepted flashcard", () => {
    renderComponent({ isAccepted: true });
    expect(screen.getByText("Zaakceptowana")).toBeInTheDocument();
  });

  it("should display 'Zaakceptowana (edytowana)' badge for an accepted and edited flashcard", () => {
    renderComponent({ isAccepted: true, isEdited: true });
    expect(screen.getByText(/Zaakceptowana \(edytowana\)/)).toBeInTheDocument();
  });

  it("should display 'Odrzucona' badge for a rejected flashcard", () => {
    renderComponent({ isRejected: true });
    expect(screen.getByText("Odrzucona")).toBeInTheDocument();
  });

  it("should call onAccept with the correct index when Accept button is clicked", () => {
    renderComponent();
    const acceptButton = screen.getByTitle("Akceptuj");
    fireEvent.click(acceptButton);
    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).toHaveBeenCalledWith(mockIndex);
  });

  it("should disable Accept button when flashcard is accepted", () => {
    renderComponent({ isAccepted: true });
    const acceptButton = screen.getByTitle("Akceptuj");
    expect(acceptButton).toBeDisabled();
  });

  it("should have specific styling for Accept button when flashcard is accepted", () => {
    renderComponent({ isAccepted: true });
    const acceptButton = screen.getByTitle("Akceptuj");
    expect(acceptButton).toHaveClass("bg-green-100");
    expect(acceptButton).toHaveClass("text-green-700");
  });

  it("should call onEdit with the correct index when Edit button is clicked", () => {
    renderComponent();
    const editButton = screen.getByTitle("Edytuj");
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockIndex);
  });

  it("should call onReject with the correct index when Reject button is clicked", () => {
    renderComponent();
    const rejectButton = screen.getByTitle("Odrzuć");
    fireEvent.click(rejectButton);
    expect(mockOnReject).toHaveBeenCalledTimes(1);
    expect(mockOnReject).toHaveBeenCalledWith(mockIndex);
  });

  it("should disable Reject button when flashcard is rejected", () => {
    renderComponent({ isRejected: true });
    const rejectButton = screen.getByTitle("Odrzuć");
    expect(rejectButton).toBeDisabled();
  });

  it("should have specific styling for Reject button when flashcard is rejected", () => {
    renderComponent({ isRejected: true });
    const rejectButton = screen.getByTitle("Odrzuć");
    expect(rejectButton).toHaveClass("bg-red-100");
    expect(rejectButton).toHaveClass("text-red-700");
  });

  it("should render card with correct border and background for accepted state", () => {
    const { container } = renderComponent({ isAccepted: true });
    // Find the Card element (likely the first child or specific structure)
    // This might need adjustment based on the exact DOM structure after rendering
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass("border-green-200");
    expect(cardElement).toHaveClass("bg-green-50");
  });

  it("should render card with correct border and background for rejected state", () => {
    const { container } = renderComponent({ isRejected: true });
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass("border-red-200");
    expect(cardElement).toHaveClass("bg-red-50");
  });

  it("should render card with default border for pending state", () => {
    const { container } = renderComponent();
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass("border-gray-200");
    // Check it DOES NOT have the other state classes
    expect(cardElement).not.toHaveClass("border-green-200");
    expect(cardElement).not.toHaveClass("bg-green-50");
    expect(cardElement).not.toHaveClass("border-red-200");
    expect(cardElement).not.toHaveClass("bg-red-50");
  });
});
