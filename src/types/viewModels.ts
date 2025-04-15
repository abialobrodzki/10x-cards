import type { GenerationWithFlashcardsResponseDto, FlashcardSourceType } from "../types";

// Base flashcard data
export interface FlashcardBaseData {
  front: string;
  back: string;
}

// Flashcard view model with UI state
export interface FlashcardViewModel extends FlashcardBaseData {
  id?: number;
  isAccepted: boolean;
  isEdited: boolean;
  isRejected: boolean;
  originalData?: FlashcardBaseData; // Stores original data before editing
}

// Generation view model
export interface GenerationViewModel {
  isGenerating: boolean;
  generationError: string | null;
  generationResult: GenerationWithFlashcardsResponseDto | null;
}

// Form view model
export interface FormViewModel {
  text: string;
  textError: string | null;
  isValid: boolean;
  isSubmitting: boolean;
  charactersCount: number;
}

// Accepted flashcards view model
export interface AcceptedFlashcardsViewModel {
  flashcards: FlashcardViewModel[];
  canSave: boolean;
  canSaveAll: boolean;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  saveSuccessMessage: string | null;
}

// CreateFlashcardDto for API calls
export interface CreateFlashcardDto {
  front: string;
  back: string;
  source: FlashcardSourceType;
  generation_id: number | null;
}
