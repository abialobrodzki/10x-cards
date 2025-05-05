import React from "react";
import FlashcardItem from "./FlashcardItem";
import type { FlashcardViewModel } from "../types/viewModels";

interface FlashcardListProps {
  flashcards: FlashcardViewModel[];
  onAccept: (index: number) => void;
  onEdit: (index: number) => void;
  onReject: (index: number) => void;
}

const FlashcardList: React.FC<FlashcardListProps> = ({ flashcards, onAccept, onEdit, onReject }) => {
  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="flashcard-list-container">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
        <h2 className="text-xl font-semibold" data-testid="flashcard-count-heading">
          Wygenerowane fiszki ({flashcards.length})
        </h2>
        <p className="text-sm text-gray-500" data-testid="accepted-count">
          Zaakceptowane: {flashcards.filter((f) => f.isAccepted).length}
        </p>
      </div>

      <div className="space-y-4" data-testid="flashcard-items-container">
        {flashcards.map((flashcard, index) => (
          <FlashcardItem
            key={index}
            flashcard={flashcard}
            index={index}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
};

export default FlashcardList;
