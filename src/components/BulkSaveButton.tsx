import React from "react";
import { Button } from "./ui/button";
import type { FlashcardViewModel } from "../types/viewModels";

interface BulkSaveButtonProps {
  flashcards: FlashcardViewModel[];
  generationId: number | null;
  isSaving: boolean;
  onSaveAll: () => Promise<void>;
  onSaveSelected: () => Promise<void>;
}

const BulkSaveButton: React.FC<BulkSaveButtonProps> = ({
  flashcards,
  generationId,
  isSaving,
  onSaveAll,
  onSaveSelected,
}) => {
  const acceptedCount = flashcards.filter((f) => f.isAccepted).length;
  const totalCount = flashcards.length;

  const canSaveSelected = !isSaving && acceptedCount > 0 && generationId !== null;
  const canSaveAll = !isSaving && totalCount > 0 && generationId !== null;

  return (
    <div className="sticky bottom-4 flex justify-center mt-8 pt-4 border-t">
      <div className="bg-white border rounded-lg shadow-md p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{acceptedCount}</span> z <span className="font-medium">{totalCount}</span>{" "}
          fiszek zaakceptowanych
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onSaveSelected} disabled={!canSaveSelected} className="whitespace-nowrap">
            {isSaving ? "Zapisywanie..." : "Zapisz wybrane"}
          </Button>

          <Button onClick={onSaveAll} disabled={!canSaveAll} className="whitespace-nowrap">
            {isSaving ? "Zapisywanie..." : "Zapisz wszystkie"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkSaveButton;
