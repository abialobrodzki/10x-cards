"use client";

import React, { useState } from "react";
import { useGenerateFlashcardsView } from "./hooks/useGenerateFlashcardsView";
import TextInputForm from "./TextInputForm";
import LoadingIndicator from "./ui/LoadingIndicator";
import SkeletonLoader from "./ui/SkeletonLoader";
import ErrorNotification from "./ui/ErrorNotification";
import SuccessNotification from "./ui/SuccessNotification";
import FlashcardList from "./FlashcardList";
import EditFlashcardModal from "./EditFlashcardModal";
import BulkSaveButton from "./BulkSaveButton";
import type { FlashcardViewModel } from "../types/viewModels";

const GenerateView: React.FC = () => {
  const {
    generationState,
    flashcardsState,
    savingState,
    generateFlashcards,
    acceptFlashcard,
    editFlashcard,
    rejectFlashcard,
    saveSelectedFlashcards,
    saveAllFlashcards,
  } = useGenerateFlashcardsView();

  const [editingFlashcard, setEditingFlashcard] = useState<{
    index: number;
    flashcard: FlashcardViewModel;
  } | null>(null);

  const handleEditOpen = (index: number) => {
    setEditingFlashcard({
      index,
      flashcard: flashcardsState[index],
    });
  };

  const handleEditClose = () => {
    setEditingFlashcard(null);
  };

  const handleEditSave = (updatedData: { front: string; back: string }) => {
    if (editingFlashcard) {
      editFlashcard(editingFlashcard.index, updatedData);
      setEditingFlashcard(null);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="generate-view-container">
      <TextInputForm onSubmit={generateFlashcards} isGenerating={generationState.isGenerating} />

      {generationState.isGenerating && (
        <div className="mt-8" data-testid="generating-state-indicator">
          <LoadingIndicator isVisible={true} message="Trwa generowanie fiszek..." />
          <SkeletonLoader isVisible={true} count={5} className="mt-6" />
        </div>
      )}

      {generationState.generationError && (
        <ErrorNotification
          message={generationState.generationError}
          isVisible={true}
          type="error"
          data-testid="generation-error-notification"
        />
      )}

      {savingState.saveError && (
        <ErrorNotification
          message={savingState.saveError}
          isVisible={true}
          type="error"
          data-testid="save-error-notification"
        />
      )}

      {savingState.saveSuccess && savingState.saveSuccessMessage && (
        <SuccessNotification
          message={savingState.saveSuccessMessage}
          isVisible={true}
          autoHideDuration={5000}
          data-testid="save-success-notification"
        />
      )}

      {flashcardsState.length > 0 && !generationState.isGenerating && (
        <>
          <FlashcardList
            flashcards={flashcardsState}
            onAccept={acceptFlashcard}
            onEdit={handleEditOpen}
            onReject={rejectFlashcard}
            data-testid="flashcard-list"
          />

          <BulkSaveButton
            flashcards={flashcardsState}
            generationId={generationState.generationResult?.generation.id || null}
            isSaving={savingState.isSaving}
            onSaveAll={saveAllFlashcards}
            onSaveSelected={saveSelectedFlashcards}
          />
        </>
      )}

      {editingFlashcard && (
        <EditFlashcardModal
          isOpen={!!editingFlashcard}
          flashcard={editingFlashcard.flashcard}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default GenerateView;
