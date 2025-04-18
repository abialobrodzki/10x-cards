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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Wygenerowane fiszki ({flashcards.length})</h2>
        <p className="text-sm text-gray-500">Zaakceptowane: {flashcards.filter((f) => f.isAccepted).length}</p>
      </div>

      <div className="space-y-4">
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
