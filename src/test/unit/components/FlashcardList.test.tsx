import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FlashcardList from "../../../components/FlashcardList"; // Corrected path based on project structure
import type { FlashcardViewModel } from "../../../types/viewModels"; // Changed import to FlashcardViewModel

// Mock data based on scenarios in README.md and FlashcardViewModel structure
const mockFlashcards: FlashcardViewModel[] = [
  {
    id: 1,
    front: "Q1",
    back: "A1",
    isAccepted: false,
    isEdited: false,
    isRejected: false,
  },
  {
    id: 2,
    front: "Q2",
    back: "A2",
    isAccepted: false,
    isEdited: false,
    isRejected: false,
  },
  {
    id: 3,
    front: "Q3",
    back: "A3",
    isAccepted: false,
    isEdited: false,
    isRejected: false,
  },
];

const generateLargeMockFlashcards = (count: number): FlashcardViewModel[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    front: `Q${i + 1}`,
    back: `A${i + 1}`,
    isAccepted: false,
    isEdited: false,
    isRejected: false,
  }));
};

describe("FlashcardList Component", () => {
  // Test case 1: items = [] → displays empty state
  it("should display an empty state when no items are provided", () => {
    // Arrange
    const handleAccept = vi.fn();
    const handleEdit = vi.fn();
    const handleReject = vi.fn();
    const { container } = render(
      <FlashcardList flashcards={[]} onAccept={handleAccept} onEdit={handleEdit} onReject={handleReject} />
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  // Test case 2: items > 0 → renders the correct number of elements
  it("should render the correct number of flashcard items", () => {
    // Arrange
    const handleAccept = vi.fn();
    const handleEdit = vi.fn();
    const handleReject = vi.fn();
    render(
      <FlashcardList flashcards={mockFlashcards} onAccept={handleAccept} onEdit={handleEdit} onReject={handleReject} />
    );

    // Act
    // Assuming each item renders its front text, look for them
    const itemElements = screen.getAllByText(/Q\d/); // Find elements containing Q1, Q2, etc. (using front text)

    // Assert
    expect(itemElements.length).toBe(mockFlashcards.length);
  });

  // Test case 3: clicking an item → calls the handler with the correct index
  it("should call onAccept with the correct index when accept action is triggered", () => {
    // Arrange
    const handleAccept = vi.fn();
    const handleEdit = vi.fn();
    const handleReject = vi.fn();
    const targetIndex = 1; // Target the second item

    render(
      <FlashcardList flashcards={mockFlashcards} onAccept={handleAccept} onEdit={handleEdit} onReject={handleReject} />
    );

    // Act
    // Find the accept buttons and click the one at the target index
    const acceptButtons = screen.getAllByTitle("Akceptuj");
    fireEvent.click(acceptButtons[targetIndex]);

    // Assert
    expect(handleAccept).toHaveBeenCalledTimes(1);
    expect(handleAccept).toHaveBeenCalledWith(targetIndex);
  });

  // Test case 4: Boundary condition – large number of items (>50)
  it("should render correctly with a large number of items", () => {
    // Arrange
    const handleAccept = vi.fn();
    const handleEdit = vi.fn();
    const handleReject = vi.fn();
    const largeItemList = generateLargeMockFlashcards(55);

    render(
      <FlashcardList flashcards={largeItemList} onAccept={handleAccept} onEdit={handleEdit} onReject={handleReject} />
    );

    // Act
    const itemElements = screen.getAllByText(/Q\d+/); // Match Q followed by one or more digits (using front text)

    // Assert
    expect(itemElements.length).toBe(largeItemList.length);
    // Optional: Check for a specific item to ensure it's rendered
    expect(screen.getByText("Q55")).toBeInTheDocument();
  });

  // Test case 5: Testing edit functionality
  it("should call onEdit with the correct index when edit action is triggered", () => {
    // Arrange
    const handleAccept = vi.fn();
    const handleEdit = vi.fn();
    const handleReject = vi.fn();
    const targetIndex = 0;

    render(
      <FlashcardList flashcards={mockFlashcards} onAccept={handleAccept} onEdit={handleEdit} onReject={handleReject} />
    );

    // Act
    // Find the edit buttons and click the one at the target index
    const editButtons = screen.getAllByTitle("Edytuj");
    fireEvent.click(editButtons[targetIndex]);

    // Assert
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(targetIndex);
  });

  // Test case 6: Testing reject functionality
  it("should call onReject with the correct index when reject action is triggered", () => {
    // Arrange
    const handleAccept = vi.fn();
    const handleEdit = vi.fn();
    const handleReject = vi.fn();
    const targetIndex = 2;

    render(
      <FlashcardList flashcards={mockFlashcards} onAccept={handleAccept} onEdit={handleEdit} onReject={handleReject} />
    );

    // Act
    // Find the reject buttons and click the one at the target index
    const rejectButtons = screen.getAllByTitle("Odrzuć");
    fireEvent.click(rejectButtons[targetIndex]);

    // Assert
    expect(handleReject).toHaveBeenCalledTimes(1);
    expect(handleReject).toHaveBeenCalledWith(targetIndex);
  });
});
