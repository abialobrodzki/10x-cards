import { useReducer, useRef } from "react";
import { logger } from "../../lib/openrouter.logger"; // Importuj logger
import type {
  FlashcardBaseData,
  FlashcardViewModel,
  GenerationViewModel,
  CreateFlashcardDto,
} from "../../types/viewModels";
import type { GenerationWithFlashcardsResponseDto } from "../../types";

/**
 * Defines the possible actions that can be dispatched to the reducer.
 */
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

/**
 * Defines the shape of the state managed by the useGenerateFlashcardsView hook.
 */
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

/**
 * The initial state for the useGenerateFlashcardsView hook.
 */
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

/**
 * Reducer function to handle state updates based on dispatched actions.
 * @param state The current state.
 * @param action The dispatched action.
 * @returns The new state.
 */
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
        logger.debug(`Reducer - ACCEPT_FLASHCARD for index ${index}`, {
          before: {
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          },
        });

        // Jawnie ustawiamy wartości, aby upewnić się, że są zgodne z oczekiwaniami
        newFlashcards[index] = {
          ...newFlashcards[index],
          isAccepted: true, // ZAWSZE true dla zaakceptowanych
          isRejected: false, // ZAWSZE false dla zaakceptowanych
        };

        // Asercja dla pewności - zamieniona na logowanie ostrzeżenia w razie niespełnienia
        if (newFlashcards[index].isAccepted !== true) {
          logger.warn(`Reducer ACCEPT_FLASHCARD - Assertion failed: isAccepted should be true`, newFlashcards[index]);
        }
        if (newFlashcards[index].isRejected !== false) {
          logger.warn(`Reducer ACCEPT_FLASHCARD - Assertion failed: isRejected should be false`, newFlashcards[index]);
        }

        logger.debug(`Reducer - ACCEPT_FLASHCARD processed for index ${index}`, {
          after: {
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          },
        });
      } else {
        logger.error(
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
        logger.debug(`Reducer - REJECT_FLASHCARD for index ${index}`, {
          before: {
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          },
        });

        // Jawnie ustawiamy wartości, aby upewnić się, że są zgodne z oczekiwaniami
        newFlashcards[index] = {
          ...newFlashcards[index],
          isAccepted: false, // ZAWSZE false dla odrzuconych
          isRejected: true, // ZAWSZE true dla odrzuconych
        };

        // Asercja dla pewności - zamieniona na logowanie ostrzeżenia w razie niespełnienia
        if (newFlashcards[index].isAccepted !== false) {
          logger.warn(`Reducer REJECT_FLASHCARD - Assertion failed: isAccepted should be false`, newFlashcards[index]);
        }
        if (newFlashcards[index].isRejected !== true) {
          logger.warn(`Reducer REJECT_FLASHCARD - Assertion failed: isRejected should be true`, newFlashcards[index]);
        }

        logger.debug(`Reducer - REJECT_FLASHCARD processed for index ${index}`, {
          after: {
            front: newFlashcards[index].front.substring(0, 30) + "...",
            isAccepted: newFlashcards[index].isAccepted,
            isRejected: newFlashcards[index].isRejected,
          },
        });
      } else {
        logger.error(
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

        logger.debug(`Reducer - EDIT_FLASHCARD processed for index ${index}`, { originalData, newData: data });
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

/**
 * A React hook for managing the state and logic related to generating, accepting, rejecting, editing, and saving flashcards.
 * It provides the necessary state variables and functions to interact with the flashcard generation process.
 * @returns An object containing the current generation, flashcards, and saving states, as well as functions to trigger actions.
 */
export function useGenerateFlashcardsView() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const savingInProgressRef = useRef(false);

  /**
   * Initiates the flashcard generation process.
   * Dispatches 'GENERATE_START', calls the API, and dispatches 'GENERATE_SUCCESS' or 'GENERATE_ERROR'.
   * @param text The input text based on which flashcards should be generated.
   */
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

  /**
   * Marks a flashcard as accepted.
   * Dispatches 'ACCEPT_FLASHCARD' action.
   * @param index The index of the flashcard in the flashcards list.
   */
  const acceptFlashcard = (index: number) => {
    logger.debug(`Accepting flashcard at index ${index}`);

    // Add detailed state check before change
    if (index >= 0 && index < state.flashcards.length) {
      const flashcard = state.flashcards[index];
      logger.debug(
        `Flashcard BEFORE accepting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
      );
    }

    dispatch({ type: "ACCEPT_FLASHCARD", payload: index });
    dispatch({ type: "SELECT_FLASHCARD", payload: index });

    // Verify state change immediately after dispatch
    setTimeout(() => {
      if (index >= 0 && index < state.flashcards.length) {
        const flashcard = state.flashcards[index];
        logger.debug(
          `Flashcard AFTER accepting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
        );
      }
    }, 50);
  };

  /**
   * Updates an existing flashcard with new data.
   * Dispatches 'EDIT_FLASHCARD' action.
   * @param index The index of the flashcard to edit.
   * @param updatedData An object containing the updated front and back text.
   */
  const editFlashcard = (index: number, updatedData: FlashcardBaseData) => {
    logger.debug(`Editing flashcard at index ${index}`, updatedData);
    dispatch({
      type: "EDIT_FLASHCARD",
      payload: { index, data: updatedData },
    });
    dispatch({ type: "SELECT_FLASHCARD", payload: index });
  };

  /**
   * Marks a flashcard as rejected.
   * Dispatches 'REJECT_FLASHCARD' action.
   * @param index The index of the flashcard in the flashcards list.
   */
  const rejectFlashcard = (index: number) => {
    logger.debug(`Rejecting flashcard at index ${index}`);

    // Add detailed state check before change
    if (index >= 0 && index < state.flashcards.length) {
      const flashcard = state.flashcards[index];
      logger.debug(
        `Flashcard BEFORE rejecting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
      );
    }

    dispatch({ type: "REJECT_FLASHCARD", payload: index });

    // Verify state change immediately after dispatch
    setTimeout(() => {
      if (index >= 0 && index < state.flashcards.length) {
        const flashcard = state.flashcards[index];
        logger.debug(
          `Flashcard AFTER rejecting: "${flashcard.front}" [Accepted: ${flashcard.isAccepted}, Rejected: ${flashcard.isRejected}]`
        );
      }
    }, 50);
  };

  /**
   * Selects a flashcard.
   * Dispatches 'SELECT_FLASHCARD' action.
   * @param index The index of the flashcard to select.
   */
  const selectFlashcard = (index: number) => {
    logger.debug(`Selecting flashcard at index ${index} (without accepting)`);
    dispatch({ type: "SELECT_FLASHCARD", payload: index });
  };

  /**
   * Maps a FlashcardViewModel to a CreateFlashcardDto for saving.
   * @param flashcard The flashcard view model.
   * @param generationId The ID of the generation the flashcard belongs to.
   * @returns The flashcard data in CreateFlashcardDto format.
   */
  const mapToCreateFlashcardDto = (flashcard: FlashcardViewModel, generationId: number): CreateFlashcardDto => {
    // Asercje bezpieczeństwa - weryfikujemy stan fiszki przed mapowaniem
    if (flashcard.isRejected) {
      logger.error("CRITICAL ERROR: Próba mapowania odrzuconej fiszki!", flashcard);
      throw new Error("Próba mapowania odrzuconej fiszki. To nie powinno się zdarzyć.");
    }

    if (!flashcard.isAccepted) {
      logger.warn("WARNING: Mapowanie fiszki, która nie jest jawnie zaakceptowana:", flashcard);

      // Dla saveAllFlashcards traktujemy wszystkie jako zaakceptowane
      logger.debug("Zakładam, że działa w trybie 'saveAllFlashcards' i kontynuuję...");
    }

    // Dokładne logowanie dla debugowania
    logger.debug(
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

  /**
   * Saves the currently selected flashcards.
   * Filters for accepted and edited flashcards, maps them to DTOs, and calls the save API.
   * Dispatches 'SAVE_START', 'SAVE_SUCCESS', or 'SAVE_ERROR'.
   */
  const saveSelectedFlashcards = async () => {
    if (savingInProgressRef.current || state.saving.isSaving) {
      logger.warn("Save already in progress");
      return;
    }

    const generationId = state.generation.generationResult?.generation.id;
    if (!generationId) {
      logger.error("No generation ID available");
      return;
    }

    // Sprawdź czy każda fiszka została oceniona (zaakceptowana LUB odrzucona)
    const unReviewedFlashcards = state.flashcards.filter((flashcard) => !flashcard.isAccepted && !flashcard.isRejected);

    if (unReviewedFlashcards.length > 0) {
      const errorMessage =
        "Wszystkie fiszki muszą zostać ocenione (zaakceptowane lub odrzucone) przed zapisaniem wybranych. " +
        `Liczba nieocenionych fiszek: ${unReviewedFlashcards.length}`;
      logger.error(errorMessage);
      logger.error("Nieocenione fiszki:", unReviewedFlashcards);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
      return;
    }

    // Pobierz TYLKO zaakceptowane fiszki
    const acceptedFlashcards = state.flashcards.filter((flashcard) => flashcard.isAccepted === true);

    logger.debug(`Znaleziono ${acceptedFlashcards.length} zaakceptowanych fiszek do zapisania`);
    logger.debug(
      "ACCEPTED flashcards:",
      JSON.stringify(
        acceptedFlashcards.map((f) => ({ front: f.front, isAccepted: f.isAccepted, isRejected: f.isRejected }))
      )
    );

    // Sprawdź zaodrzucone (dla weryfikacji)
    const rejectedFlashcards = state.flashcards.filter((flashcard) => flashcard.isRejected === true);
    logger.debug(`Znaleziono ${rejectedFlashcards.length} odrzuconych fiszek (NIE będą zapisane)`);
    logger.debug(
      "REJECTED flashcards:",
      JSON.stringify(
        rejectedFlashcards.map((f) => ({ front: f.front, isAccepted: f.isAccepted, isRejected: f.isRejected }))
      )
    );

    if (acceptedFlashcards.length === 0) {
      const errorMessage = "Brak zaakceptowanych fiszek do zapisania. Zaakceptuj co najmniej jedną fiszkę.";
      logger.error(errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
      return;
    }

    savingInProgressRef.current = true;
    dispatch({ type: "SAVE_START" });

    try {
      // Przygotuj dane do API - tylko zaakceptowane fiszki
      const flashcardsToSave = acceptedFlashcards.map((f) => mapToCreateFlashcardDto(f, generationId));
      logger.debug("SAVING ONLY THESE FLASHCARDS:", JSON.stringify(flashcardsToSave));

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
      logger.debug("Save response:", responseData);

      dispatch({
        type: "SAVE_SUCCESS",
        payload:
          acceptedFlashcards.length === 1
            ? "Zapisano jedną zaakceptowaną fiszkę"
            : `Zapisano ${acceptedFlashcards.length} zaakceptowanych fiszek`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      logger.error("Save error:", errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
    } finally {
      savingInProgressRef.current = false;
    }
  };

  /**
   * Saves all generated flashcards that are not rejected.
   * Filters for accepted and edited flashcards, maps them to DTOs, and calls the save API.
   * Dispatches 'SAVE_START', 'SAVE_SUCCESS', or 'SAVE_ERROR'.
   */
  const saveAllFlashcards = async () => {
    if (savingInProgressRef.current || state.saving.isSaving) {
      logger.warn("Save already in progress");
      return;
    }

    const generationId = state.generation.generationResult?.generation.id;
    if (!generationId) {
      logger.error("No generation ID available");
      return;
    }

    // Check if there are any flashcards to save
    if (state.flashcards.length === 0) {
      const errorMessage = "Brak fiszek do zapisania.";
      logger.error(errorMessage);
      dispatch({ type: "SAVE_ERROR", payload: errorMessage });
      return;
    }

    logger.debug(`[SAVE ALL] Zapisywanie wszystkich ${state.flashcards.length} fiszek, niezależnie od statusu`);
    logger.debug("[SAVE ALL] Status fiszek przed zapisaniem:");
    state.flashcards.forEach((f, i) => {
      logger.debug(`  [${i}] "${f.front.substring(0, 30)}..." - Accepted: ${f.isAccepted}, Rejected: ${f.isRejected}`);
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

      logger.debug("[SAVE ALL] Po wymuszeniu akceptacji wszystkich:");
      allFlashcards.forEach((f, i) => {
        logger.debug(
          `  [${i}] "${f.front.substring(0, 30)}..." - Accepted: ${f.isAccepted}, Rejected: ${f.isRejected}`
        );
      });

      // Mapujemy wszystkie jako zaakceptowane
      const flashcardsToSave = allFlashcards.map((f) => mapToCreateFlashcardDto(f, generationId));
      logger.debug(`[SAVE ALL] Wysyłanie ${flashcardsToSave.length} fiszek do API (wszystkie jako zaakceptowane)`);
      logger.debug("[SAVE ALL] Dane wysyłane do API:", JSON.stringify(flashcardsToSave));

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
      logger.debug("[SAVE ALL] Odpowiedź z API:", responseData);

      dispatch({
        type: "SAVE_SUCCESS",
        payload: `Zapisano wszystkie ${flashcardsToSave.length} fiszki`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      logger.error("[SAVE ALL] Błąd:", errorMessage);
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
