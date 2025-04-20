/* eslint-disable no-console */
import { useReducer, useRef } from "react";
import type {
  FlashcardBaseData,
  FlashcardViewModel,
  GenerationViewModel,
  CreateFlashcardDto,
} from "../../types/viewModels";
import type { GenerationWithFlashcardsResponseDto } from "../../types";

// Define action types
type Action =
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; payload: GenerationWithFlashcardsResponseDto }
  | { type: "GENERATE_ERROR"; payload: string }
  | { type: "ACCEPT_FLASHCARD"; payload: number }
  | { type: "SELECT_FLASHCARD"; payload: number }
  | { type: "REJECT_FLASHCARD"; payload: number }
  | { type: "EDIT_FLASHCARD"; payload: { index: number; data: FlashcardBaseData } }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; payload: string }
  | { type: "SAVE_ERROR"; payload: string }
  | { type: "CLEAR_STATE" };

// Define state type
interface State {
  flashcards: FlashcardViewModel[];
  generation: {
    isGenerating: boolean;
    generationError: string | null;
    generationResult: GenerationViewModel["generationResult"];
  };
  saving: {
    isSaving: boolean;
    saveError: string | null;
    saveSuccess: boolean;
    saveSuccessMessage: string | null;
  };
  selectedFlashcardIndex: number;
}

// Initial state
const initialState: State = {
  flashcards: [],
  generation: {
    isGenerating: false,
    generationError: null,
    generationResult: null,
  },
  saving: {
    isSaving: false,
    saveError: null,
    saveSuccess: false,
    saveSuccessMessage: null,
  },
  selectedFlashcardIndex: -1,
};

// Reducer function
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GENERATE_START":
      return {
        ...state,
        generation: {
          ...state.generation,
          isGenerating: true,
          generationError: null,
        },
      };

    case "GENERATE_SUCCESS":
      return {
        ...state,
        flashcards: action.payload.flashcards.map((flashcard) => ({
          front: flashcard.front,
          back: flashcard.back,
          isAccepted: false,
          isEdited: false,
          isRejected: false,
          originalData: { front: flashcard.front, back: flashcard.back },
        })),
        generation: {
          isGenerating: false,
          generationError: null,
          generationResult: {
            generation: action.payload.generation,
            flashcards: action.payload.flashcards,
          },
        },
      };

    case "GENERATE_ERROR":
      return {
        ...state,
        generation: {
          ...state.generation,
          isGenerating: false,
          generationError: action.payload,
        },
      };

    case "ACCEPT_FLASHCARD": {
      const index = action.payload;
      const newFlashcards = [...state.flashcards];

      if (index >= 0 && index < newFlashcards.length) {
        console.log(`Reducer - ACCEPT_FLASHCARD for index ${index}`);
        console.log(
          `  Before: ${JSON.stringify({
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          })}`
        );

        // Jawnie ustawiamy wartości, aby upewnić się, że są zgodne z oczekiwaniami
        newFlashcards[index] = {
          ...newFlashcards[index],
          isAccepted: true, // ZAWSZE true dla zaakceptowanych
          isRejected: false, // ZAWSZE false dla zaakceptowanych
        };

        // Asercja dla pewności
        console.assert(newFlashcards[index].isAccepted === true, "isAccepted powinno być true");
        console.assert(newFlashcards[index].isRejected === false, "isRejected powinno być false");

        console.log(
          `  After: ${JSON.stringify({
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          })}`
        );
      } else {
        console.error(
          `Reducer - ACCEPT_FLASHCARD: Invalid index ${index}, valid range is 0-${state.flashcards.length - 1}`
        );
      }

      return {
        ...state,
        flashcards: newFlashcards,
      };
    }

    case "SELECT_FLASHCARD": {
      const index = action.payload;
      return {
        ...state,
        selectedFlashcardIndex: index,
      };
    }

    case "REJECT_FLASHCARD": {
      const index = action.payload;
      const newFlashcards = [...state.flashcards];

      if (index >= 0 && index < newFlashcards.length) {
        console.log(`Reducer - REJECT_FLASHCARD for index ${index}`);
        console.log(
          `  Before: ${JSON.stringify({
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          })}`
        );

        // Jawnie ustawiamy wartości, aby upewnić się, że są zgodne z oczekiwaniami
        newFlashcards[index] = {
          ...newFlashcards[index],
          isAccepted: false, // ZAWSZE false dla odrzuconych
          isRejected: true, // ZAWSZE true dla odrzuconych
        };

        // Asercja dla pewności
        console.assert(newFlashcards[index].isAccepted === false, "isAccepted powinno być false");
        console.assert(newFlashcards[index].isRejected === true, "isRejected powinno być true");

        console.log(
          `  After: ${JSON.stringify({
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          })}`
        );
      } else {
        console.error(
          `Reducer - REJECT_FLASHCARD: Invalid index ${index}, valid range is 0-${state.flashcards.length - 1}`
        );
      }

      return {
        ...state,
        flashcards: newFlashcards,
      };
    }

    case "EDIT_FLASHCARD": {
      const { index, data } = action.payload;
      const newFlashcards = [...state.flashcards];

      if (index >= 0 && index < newFlashcards.length) {
        const original = newFlashcards[index].originalData || {
          front: newFlashcards[index].front,
          back: newFlashcards[index].back,
        };

        const isEdited = original.front !== data.front || original.back !== data.back;

        // Save original data if this is the first edit
        const originalData = newFlashcards[index].originalData || {
          front: newFlashcards[index].front,
          back: newFlashcards[index].back,
        };

        newFlashcards[index] = {
          ...newFlashcards[index],
          ...data,
          isEdited,
          isAccepted: true, // Automatically accept edited flashcard
          isRejected: false,
          originalData: originalData, // Always preserve the original data
        };

        console.log(`Flashcard at index ${index} edited. Original:`, originalData, "New:", data);
      }

      return {
        ...state,
        flashcards: newFlashcards,
        selectedFlashcardIndex: index, // Also select the edited flashcard
      };
    }

    case "SAVE_START":
      return {
        ...state,
        saving: {
          ...state.saving,
          isSaving: true,
          saveError: null,
          saveSuccess: false,
          saveSuccessMessage: null,
        },
      };

    case "SAVE_SUCCESS":
      return {
        ...state,
        flashcards: [],
        saving: {
          isSaving: false,
          saveError: null,
          saveSuccess: true,
          saveSuccessMessage: action.payload,
        },
        generation: {
          ...state.generation,
          generationResult: null,
        },
        selectedFlashcardIndex: -1,
      };

    case "SAVE_ERROR":
      return {
        ...state,
        saving: {
          ...state.saving,
          isSaving: false,
          saveError: action.payload,
          saveSuccess: false,
        },
      };

    case "CLEAR_STATE":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

export function useGenerateFlashcardsView() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const savingInProgressRef = useRef(false);

  // Function to generate flashcards
  const generateFlashcards = async (text: string) => {
    try {
      dispatch({ type: "GENERATE_START" });

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

      const result = await response.json();
      dispatch({ type: "GENERATE_SUCCESS", payload: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      dispatch({ type: "GENERATE_ERROR", payload: errorMessage });
    }
  };

  // Functions for managing flashcards
  const acceptFlashcard = (index: number) => {
    console.log(`Accepting flashcard at index ${index}`);

    // Add detailed state check before change
    if (index >= 0 && index < state.flashcards.length) {
      const flashcard = state.flashcards[index];
      console.log(
        `Flashcard BEFORE accepting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
      );
    }

    dispatch({ type: "ACCEPT_FLASHCARD", payload: index });
    dispatch({ type: "SELECT_FLASHCARD", payload: index });

    // Verify state change immediately after dispatch
    setTimeout(() => {
      if (index >= 0 && index < state.flashcards.length) {
        const flashcard = state.flashcards[index];
        console.log(
          `Flashcard AFTER accepting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
        );
      }
    }, 50);
  };

  const editFlashcard = (index: number, updatedData: FlashcardBaseData) => {
    console.log(`Editing flashcard at index ${index}`, updatedData);
    dispatch({
      type: "EDIT_FLASHCARD",
      payload: { index, data: updatedData },
    });
    dispatch({ type: "SELECT_FLASHCARD", payload: index });
  };

  const rejectFlashcard = (index: number) => {
    console.log(`Rejecting flashcard at index ${index}`);

    // Add detailed state check before change
    if (index >= 0 && index < state.flashcards.length) {
      const flashcard = state.flashcards[index];
      console.log(
        `Flashcard BEFORE rejecting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
      );
    }

    dispatch({ type: "REJECT_FLASHCARD", payload: index });

    // Verify state change immediately after dispatch
    setTimeout(() => {
      if (index >= 0 && index < state.flashcards.length) {
        const flashcard = state.flashcards[index];
        console.log(
          `Flashcard AFTER rejecting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
        );
      }
    }, 50);
  };

  // Function to select a flashcard without accepting it
  const selectFlashcard = (index: number) => {
    console.log(`Selecting flashcard at index ${index} (without accepting)`);
    dispatch({ type: "SELECT_FLASHCARD", payload: index });
  };

  // Function to map FlashcardViewModel to CreateFlashcardDto
  const mapToCreateFlashcardDto = (flashcard: FlashcardViewModel, generationId: number): CreateFlashcardDto => {
    // Asercje bezpieczeństwa - weryfikujemy stan fiszki przed mapowaniem
    if (flashcard.isRejected) {
      console.error("CRITICAL ERROR: Próba mapowania odrzuconej fiszki!", flashcard);
      throw new Error("Próba mapowania odrzuconej fiszki. To nie powinno się zdarzyć.");
    }

    if (!flashcard.isAccepted) {
      console.warn("WARNING: Mapowanie fiszki, która nie jest jawnie zaakceptowana:", flashcard);

      // Dla saveAllFlashcards traktujemy wszystkie jako zaakceptowane
      console.log("Zakładam, że działa w trybie 'saveAllFlashcards' i kontynuuję...");
    }

    // Dokładne logowanie dla debugowania
    console.log(
      `Mapowanie fiszki: "${flashcard.front.substring(0, 30)}..." [` +
        `Accepted: ${flashcard.isAccepted}, ` +
        `Rejected: ${flashcard.isRejected}, ` +
        `Edited: ${flashcard.isEdited}]`
    );

    return {
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.isEdited ? "ai-edited" : "ai-full",
      generation_id: generationId,
    };
  };

  // Function to save selected (accepted) flashcards
  const saveSelectedFlashcards = async () => {
    if (savingInProgressRef.current || state.saving.isSaving) {
      console.warn("Save already in progress");
      return;
    }

    const generationId = state.generation.generationResult?.generation.id;
    if (!generationId) {
      console.error("No generation ID available");
      return;
    }

    // Sprawdź czy każda fiszka została oceniona (zaakceptowana LUB odrzucona)
    const unReviewedFlashcards = state.flashcards.filter((flashcard) => !flashcard.isAccepted && !flashcard.isRejected);

    if (unReviewedFlashcards.length > 0) {
      const errorMessage =
        "Wszystkie fiszki muszą zostać ocenione (zaakceptowane lub odrzucone) przed zapisaniem wybranych. " +
        `Liczba nieocenionych fiszek: ${unReviewedFlashcards.length}`;
      console.error(errorMessage);
      console.error("Nieocenione fiszki:", unReviewedFlashcards);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
      return;
    }

    // Pobierz TYLKO zaakceptowane fiszki
    const acceptedFlashcards = state.flashcards.filter((flashcard) => flashcard.isAccepted === true);

    console.log(`Znaleziono ${acceptedFlashcards.length} zaakceptowanych fiszek do zapisania`);
    console.log(
      "ACCEPTED flashcards:",
      JSON.stringify(
        acceptedFlashcards.map((f) => ({ front: f.front, isAccepted: f.isAccepted, isRejected: f.isRejected }))
      )
    );

    // Sprawdź zaodrzucone (dla weryfikacji)
    const rejectedFlashcards = state.flashcards.filter((flashcard) => flashcard.isRejected === true);
    console.log(`Znaleziono ${rejectedFlashcards.length} odrzuconych fiszek (NIE będą zapisane)`);
    console.log(
      "REJECTED flashcards:",
      JSON.stringify(
        rejectedFlashcards.map((f) => ({ front: f.front, isAccepted: f.isAccepted, isRejected: f.isRejected }))
      )
    );

    if (acceptedFlashcards.length === 0) {
      const errorMessage = "Brak zaakceptowanych fiszek do zapisania. Zaakceptuj co najmniej jedną fiszkę.";
      console.error(errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
      return;
    }

    savingInProgressRef.current = true;
    dispatch({ type: "SAVE_START" });

    try {
      // Przygotuj dane do API - tylko zaakceptowane fiszki
      const flashcardsToSave = acceptedFlashcards.map((f) => mapToCreateFlashcardDto(f, generationId));
      console.log("SAVING ONLY THESE FLASHCARDS:", JSON.stringify(flashcardsToSave));

      // Wyślij do API
      const response = await fetch(`/api/generations/${generationId}/accept-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flashcards: flashcardsToSave }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd podczas zapisywania: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Save response:", responseData);

      dispatch({
        type: "SAVE_SUCCESS",
        payload:
          acceptedFlashcards.length === 1
            ? "Zapisano jedną zaakceptowaną fiszkę"
            : `Zapisano ${acceptedFlashcards.length} zaakceptowanych fiszek`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      console.error("Save error:", errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
    } finally {
      savingInProgressRef.current = false;
    }
  };

  // Function to save all flashcards
  const saveAllFlashcards = async () => {
    if (savingInProgressRef.current || state.saving.isSaving) {
      console.warn("Save already in progress");
      return;
    }

    const generationId = state.generation.generationResult?.generation.id;
    if (!generationId) {
      console.error("No generation ID available");
      return;
    }

    // Check if there are any flashcards to save
    if (state.flashcards.length === 0) {
      const errorMessage = "Brak fiszek do zapisania.";
      console.error(errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
      return;
    }

    console.log(`[SAVE ALL] Zapisywanie wszystkich ${state.flashcards.length} fiszek, niezależnie od statusu`);
    console.log("[SAVE ALL] Status fiszek przed zapisaniem:");
    state.flashcards.forEach((f, i) => {
      console.log(`  [${i}] "${f.front.substring(0, 30)}..." - Accepted: ${f.isAccepted}, Rejected: ${f.isRejected}`);
    });

    savingInProgressRef.current = true;
    dispatch({ type: "SAVE_START" });

    try {
      // Kopiujemy fiszki i WYMUSZAMY status zaakceptowania dla wszystkich
      const allFlashcards = state.flashcards.map((f) => ({
        ...f,
        isAccepted: true, // WYMUSZAMY akceptację wszystkich
        isRejected: false, // Usuwamy status odrzucenia
      }));

      console.log("[SAVE ALL] Po wymuszeniu akceptacji wszystkich:");
      allFlashcards.forEach((f, i) => {
        console.log(`  [${i}] "${f.front.substring(0, 30)}..." - Accepted: ${f.isAccepted}, Rejected: ${f.isRejected}`);
      });

      // Mapujemy wszystkie jako zaakceptowane
      const flashcardsToSave = allFlashcards.map((f) => mapToCreateFlashcardDto(f, generationId));
      console.log(`[SAVE ALL] Wysyłanie ${flashcardsToSave.length} fiszek do API (wszystkie jako zaakceptowane)`);
      console.log("[SAVE ALL] Dane wysyłane do API:", JSON.stringify(flashcardsToSave));

      // Wyślij do API
      const response = await fetch(`/api/generations/${generationId}/accept-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: flashcardsToSave,
          isSaveAll: true, // Dodajemy flagę isSaveAll=true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd podczas zapisywania: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log("[SAVE ALL] Odpowiedź z API:", responseData);

      dispatch({
        type: "SAVE_SUCCESS",
        payload: `Zapisano wszystkie ${flashcardsToSave.length} fiszki`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      console.error("[SAVE ALL] Błąd:", errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
    } finally {
      savingInProgressRef.current = false;
    }
  };

  // Derived states
  const allFlashcardsReviewed = state.flashcards.every((flashcard) => flashcard.isAccepted || flashcard.isRejected);

  const acceptedFlashcardsCount = state.flashcards.filter((f) => f.isAccepted).length;
  const hasAcceptedFlashcards = acceptedFlashcardsCount > 0;

  // Save Selected - requires all flashcards reviewed and at least one accepted
  const canSave =
    !state.saving.isSaving &&
    allFlashcardsReviewed &&
    hasAcceptedFlashcards &&
    state.generation.generationResult !== null;

  // Save All - just requires flashcards to exist
  const canSaveAll =
    !state.saving.isSaving && state.flashcards.length > 0 && state.generation.generationResult !== null;

  // Helper properties for UI
  const isSingleSelectionMode = state.selectedFlashcardIndex >= 0;

  return {
    // State
    flashcardsState: state.flashcards,
    generationState: {
      isGenerating: state.generation.isGenerating,
      generationError: state.generation.generationError,
      generationResult: state.generation.generationResult,
    },
    savingState: {
      ...state.saving,
      canSave: canSave,
      canSaveAll: canSaveAll,
    },
    selectedFlashcardIndex: state.selectedFlashcardIndex,
    isSingleSelectionMode: isSingleSelectionMode,
    acceptedFlashcardsCount: acceptedFlashcardsCount,

    // Actions
    generateFlashcards,
    acceptFlashcard,
    editFlashcard,
    rejectFlashcard,
    selectFlashcard,
    saveSelectedFlashcards,
    saveAllFlashcards,
  };
}
