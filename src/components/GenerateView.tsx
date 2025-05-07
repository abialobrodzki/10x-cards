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

/**
 * Component responsible for the view and UI of flashcard generation.
 * It orchestrates the user input, generation process, display of results, and saving of flashcards.
 */
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

  /**
   * State variable to manage the flashcard being edited.
   * Contains the index and the flashcard data if a flashcard is being edited, otherwise null.
   */
  const [editingFlashcard, setEditingFlashcard] = useState<{
    index: number;
    flashcard: FlashcardViewModel;
  } | null>(null);

  /**
   * Handler function to open the edit modal for a specific flashcard.
   * @param index The index of the flashcard in the flashcardsState array.
   */
  const handleEditOpen = (index: number) => {
    setEditingFlashcard({
      index,
      flashcard: flashcardsState[index],
    });
  };

  /**
   * Handler function to close the edit modal.
   */
  const handleEditClose = () => {
    setEditingFlashcard(null);
  };

  /**
   * Handler function to save the updated flashcard data.
   * It updates the flashcard via the editFlashcard hook function and closes the modal.
   * @param updatedData An object containing the updated front and back text of the flashcard.
   */
  const handleEditSave = (updatedData: { front: string; back: string }) => {
    if (editingFlashcard) {
      editFlashcard(editingFlashcard.index, updatedData);
      setEditingFlashcard(null);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="generate-view-container">
      {/*
        Props:
        - onSubmit: Function to call when the form is submitted with the text input.
        - isGenerating: Boolean indicating if flashcards are currently being generated.
      */}
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
          {/*
            Props:
            - flashcards: Array of FlashcardViewModel to display.
            - onAccept: Function to call when a flashcard is accepted.
            - onEdit: Function to call when a flashcard is requested to be edited.
            - onReject: Function to call when a flashcard is rejected.
          */}
          <FlashcardList
            flashcards={flashcardsState}
            onAccept={acceptFlashcard}
            onEdit={handleEditOpen}
            onReject={rejectFlashcard}
            data-testid="flashcard-list"
          />

          {/*
            Props:
            - flashcards: Array of FlashcardViewModel to be potentially saved.
            - generationId: The ID of the generation process, used for saving.
            - isSaving: Boolean indicating if flashcards are currently being saved in bulk.
            - onSaveAll: Function to call to save all flashcards.
            - onSaveSelected: Function to call to save only selected flashcards.
          */}
          <BulkSaveButton
            flashcards={flashcardsState}
            generationId={generationState.generationResult?.generation.id || null}
            isSaving={savingState.isSaving}
            onSaveAll={saveAllFlashcards}
            onSaveSelected={saveSelectedFlashcards}
          />
        </>
      )}

      {/*
          Props:
          - isOpen: Boolean indicating if the modal is open.
          - flashcard: The FlashcardViewModel being edited.
          - onClose: Function to call when the modal is closed.
          - onSave: Function to call when the edited flashcard is saved.
      */}
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
