import React, { useState, useEffect } from "react";
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
  // Add local cooldown state to prevent double-clicks
  const [cooldown, setCooldown] = useState(false);
  const COOLDOWN_PERIOD = 3000; // 3 seconds

  // Reset cooldown when isSaving changes from true to false
  useEffect(() => {
    if (!isSaving && cooldown) {
      const timer = setTimeout(() => setCooldown(false), COOLDOWN_PERIOD);
      return () => clearTimeout(timer);
    }
  }, [isSaving, cooldown]);

  const acceptedCount = flashcards.filter((f) => f.isAccepted).length;
  const totalCount = flashcards.length;

  const canSaveSelected = !isSaving && !cooldown && acceptedCount > 0 && generationId !== null;
  const canSaveAll = !isSaving && !cooldown && totalCount > 0 && generationId !== null;

  const handleSaveSelected = async () => {
    if (canSaveSelected) {
      setCooldown(true);
      await onSaveSelected();
    }
  };

  const handleSaveAll = async () => {
    if (canSaveAll) {
      setCooldown(true);
      await onSaveAll();
    }
  };

  return (
    <div className="sticky bottom-4 flex justify-center mt-8">
      <div className="bg-white border rounded-lg shadow-md p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{acceptedCount}</span> z <span className="font-medium">{totalCount}</span>{" "}
          fiszek zaakceptowanych
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveSelected}
            disabled={!canSaveSelected}
            className="whitespace-nowrap"
          >
            {isSaving ? "Zapisywanie..." : cooldown && !isSaving ? "Zapisano" : "Zapisz wybrane"}
          </Button>

          <Button onClick={handleSaveAll} disabled={!canSaveAll} className="whitespace-nowrap">
            {isSaving ? "Zapisywanie..." : cooldown && !isSaving ? "Zapisano" : "Zapisz wszystkie"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkSaveButton;
