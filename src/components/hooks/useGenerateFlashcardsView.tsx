import { useState } from "react";
import type {
  FlashcardBaseData,
  FlashcardViewModel,
  GenerationViewModel,
  CreateFlashcardDto,
} from "../../types/viewModels";
import type { GenerationWithFlashcardsResponseDto } from "../../types";

export function useGenerateFlashcardsView() {
  // State for generation process
  const [generationState, setGenerationState] = useState<GenerationViewModel>({
    isGenerating: false,
    generationError: null,
    generationResult: null,
  });

  // State for flashcards
  const [flashcardsState, setFlashcardsState] = useState<FlashcardViewModel[]>([]);

  // State for saving process with proper typing for string | null values
  const [savingState, setSavingState] = useState({
    isSaving: false,
    saveError: null as string | null,
    canSave: false,
    canSaveAll: false,
    saveSuccess: false,
    saveSuccessMessage: null as string | null,
  });

  // Function to generate flashcards
  const generateFlashcards = async (text: string) => {
    try {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: true,
        generationError: null,
      }));

      const response = await fetch("/api/generations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas generowania fiszek");
      }

      const result: GenerationWithFlashcardsResponseDto = await response.json();

      // Mapping received flashcards to FlashcardViewModel
      const flashcards: FlashcardViewModel[] = result.flashcards.map((flashcard) => ({
        front: flashcard.front,
        back: flashcard.back,
        isAccepted: false,
        isEdited: false,
        isRejected: false,
        originalData: { front: flashcard.front, back: flashcard.back },
      }));

      setFlashcardsState(flashcards);
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: false,
        generationResult: result,
      }));

      // Update save state
      setSavingState((prev) => ({
        ...prev,
        canSaveAll: flashcards.length > 0,
        canSave: false,
        saveSuccess: false,
        saveSuccessMessage: null,
      }));
    } catch (error) {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: false,
        generationError: error instanceof Error ? error.message : "Nieznany błąd",
      }));
    }
  };

  // Functions for managing flashcards
  const acceptFlashcard = (index: number) => {
    setFlashcardsState((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isAccepted: true,
        isRejected: false,
      };
      return updated;
    });

    // Update save state
    updateSaveState();
  };

  const editFlashcard = (index: number, updatedData: FlashcardBaseData) => {
    setFlashcardsState((prev) => {
      const updated = [...prev];
      const original = updated[index].originalData || {
        front: updated[index].front,
        back: updated[index].back,
      };

      // Compare if data has actually changed
      const isEdited = original.front !== updatedData.front || original.back !== updatedData.back;

      updated[index] = {
        ...updated[index],
        ...updatedData,
        isEdited: isEdited,
        isAccepted: true, // Automatically accept edited flashcard
        isRejected: false,
      };

      return updated;
    });

    // Update save state
    updateSaveState();
  };

  const rejectFlashcard = (index: number) => {
    setFlashcardsState((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isAccepted: false,
        isRejected: true,
      };
      return updated;
    });

    // Update save state
    updateSaveState();
  };

  // Helper function to update save state
  const updateSaveState = () => {
    setSavingState((prev) => {
      // Check if there is at least one accepted flashcard
      const hasAccepted = flashcardsState.some((f) => f.isAccepted);

      return {
        ...prev,
        canSave: hasAccepted,
        canSaveAll: flashcardsState.length > 0,
        saveSuccess: false,
        saveSuccessMessage: null,
      };
    });
  };

  // Function to map FlashcardViewModel to CreateFlashcardDto
  const mapToCreateFlashcardDto = (flashcard: FlashcardViewModel, generationId: number): CreateFlashcardDto => {
    let source: "ai-full" | "ai-edited" = "ai-full";

    // If flashcard was edited, set source to ai-edited
    if (flashcard.isEdited) {
      source = "ai-edited";
    }

    return {
      front: flashcard.front,
      back: flashcard.back,
      source: source,
      generation_id: generationId,
    };
  };

  // Function to save selected flashcards
  const saveSelectedFlashcards = async () => {
    const generationId = generationState.generationResult?.generation.id;
    if (!generationId) {
      return;
    }

    try {
      setSavingState((prev) => ({
        ...prev,
        isSaving: true,
        saveError: null,
        saveSuccess: false,
        saveSuccessMessage: null,
      }));

      // Filter only accepted flashcards
      const acceptedFlashcards = flashcardsState.filter((f) => f.isAccepted);

      // Convert to format expected by API
      const flashcardsToSave = acceptedFlashcards.map((f) => mapToCreateFlashcardDto(f, generationId));

      const response = await fetch(`/api/generations/${generationId}/accept-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flashcards: flashcardsToSave }),
      });

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas zapisywania fiszek");
      }

      await response.json();

      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveSuccess: true,
        saveSuccessMessage: `Zapisano ${acceptedFlashcards.length} zaakceptowanych fiszek`,
      }));

      // Optional: redirect or other actions after successful save
    } catch (error) {
      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : "Nieznany błąd",
        saveSuccess: false,
        saveSuccessMessage: null,
      }));
    }
  };

  // Function to save all flashcards
  const saveAllFlashcards = async () => {
    const generationId = generationState.generationResult?.generation.id;
    if (!generationId) {
      return;
    }

    try {
      setSavingState((prev) => ({
        ...prev,
        isSaving: true,
        saveError: null,
        saveSuccess: false,
        saveSuccessMessage: null,
      }));

      // Automatically accept all flashcards before saving
      setFlashcardsState((prev) => prev.map((f) => ({ ...f, isAccepted: true })));

      // Convert to format expected by API
      const flashcardsToSave = flashcardsState.map((f) => mapToCreateFlashcardDto(f, generationId));

      const response = await fetch(`/api/generations/${generationId}/accept-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flashcards: flashcardsToSave }),
      });

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas zapisywania fiszek");
      }

      await response.json();

      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveSuccess: true,
        saveSuccessMessage: `Zapisano wszystkie ${flashcardsToSave.length} fiszki`,
      }));

      // Optional: redirect or other actions after successful save
    } catch (error) {
      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : "Nieznany błąd",
        saveSuccess: false,
        saveSuccessMessage: null,
      }));
    }
  };

  return {
    generationState,
    flashcardsState,
    savingState,
    generateFlashcards,
    acceptFlashcard,
    editFlashcard,
    rejectFlashcard,
    saveSelectedFlashcards,
    saveAllFlashcards,
  };
}
