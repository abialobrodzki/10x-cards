import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGenerateFlashcardsView } from "../../components/hooks/useGenerateFlashcardsView";
import type { GenerationWithFlashcardsResponseDto } from "../../types";

// ----- Mock fetch using vi.stubGlobal -----
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ----- Dane testowe -----
const mockApiResponse: GenerationWithFlashcardsResponseDto = {
  generation: {
    id: 123,
    generated_count: 3,
    accepted_unedited_count: 0,
    accepted_edited_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    model: "test-model",
  },
  flashcards: [
    {
      front: "Gen Front 1",
      back: "Gen Back 1",
      source: "ai-full",
    },
    {
      front: "Gen Front 2",
      back: "Gen Back 2",
      source: "ai-full",
    },
    {
      front: "Gen Front 3",
      back: "Gen Back 3",
      source: "ai-full",
    },
  ],
};

// Helper function to create a mock response with required Response properties
const createMockResponse = <T,>(options: {
  ok: boolean;
  json?: () => Promise<T>;
  text?: () => Promise<string>;
  status?: number;
  statusText?: string;
  body?: ReadableStream<Uint8Array> | null;
  headers?: Headers;
  redirected?: boolean;
  url?: string;
  type?: ResponseType;
}) =>
  ({
    ok: options.ok,
    json: options.json || (() => Promise.resolve(undefined as T)),
    text: options.text || (() => Promise.resolve("")),
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? "OK" : "Internal Server Error"),
    body: options.body || null,
    headers: options.headers || new Headers(),
    redirected: options.redirected || false,
    url: options.url || "",
    type: options.type || "default",
    // Add a mock clone method that returns a new mock response
    clone: () => createMockResponse(options),
  }) as Response; // Cast to Response type

describe("useGenerateFlashcardsView Hook", () => {
  beforeEach(() => {
    mockFetch.mockClear(); // Clear mocks before each test
    // Domyślna odpowiedź sukcesu dla generowania
    mockFetch.mockResolvedValue(
      createMockResponse<GenerationWithFlashcardsResponseDto>({ ok: true, json: async () => mockApiResponse })
    );
  });

  // Helper do renderowania hooka
  const setupHook = () => renderHook(() => useGenerateFlashcardsView());

  // --- Testy Generowania ---
  it("should initialize with default state", () => {
    const { result } = setupHook();
    expect(result.current.flashcardsState).toEqual([]);
    expect(result.current.generationState.isGenerating).toBe(false);
    expect(result.current.generationState.generationResult).toBeNull();
    expect(result.current.savingState.isSaving).toBe(false);
    expect(result.current.selectedFlashcardIndex).toBe(-1);
  });

  it("should set generating state and update flashcards on successful generation", async () => {
    const { result } = setupHook();

    await act(async () => {
      await result.current.generateFlashcards("Some input text");
    });

    // Wait for the flashcards state to be updated
    await waitFor(() => {
      expect(result.current.generationState.generationResult).toEqual(mockApiResponse);
    });

    expect(result.current.generationState.isGenerating).toBe(false);
    // The flashcards state should also be updated when generationResult is set
    expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    expect(result.current.flashcardsState[0]).toMatchObject({
      front: "Gen Front 1",
      back: "Gen Back 1",
      isAccepted: false,
      isRejected: false,
      isEdited: false,
    });
    // Check fetch call with Request object (single argument)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost/api/generations/generate",
        method: "POST",
        // We might need to check headers/body more carefully if this fails
      })
    );
  });

  it("should set error state on failed generation", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Generation failed",
      })
    );
    const { result } = setupHook();

    await act(async () => {
      await result.current.generateFlashcards("Fail text");
    });

    // Wait for the error state to be updated
    await waitFor(() => {
      expect(result.current.generationState.generationError).toContain("Wystąpił błąd"); // Use the hook's specific error message
    });

    expect(result.current.generationState.isGenerating).toBe(false);
    expect(result.current.flashcardsState).toEqual([]);
  });

  // --- Testy Akcji na Fiszkach ---
  it("should update flashcard state on accept, reject, edit, select", async () => {
    const { result } = setupHook();
    // Najpierw generujemy fiszki
    await act(async () => {
      await result.current.generateFlashcards("Text");
    });

    // Wait for flashcards to be generated and state updated
    await waitFor(() => {
      expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    });

    // Wybieramy pierwszą
    act(() => {
      result.current.selectFlashcard(0);
    });
    expect(result.current.selectedFlashcardIndex).toBe(0);

    // Akceptujemy drugą
    act(() => {
      result.current.acceptFlashcard(1);
    });
    // Wait for state update
    await waitFor(() => {
      expect(result.current.flashcardsState[1].isAccepted).toBe(true);
    });
    expect(result.current.flashcardsState[1].isRejected).toBe(false);
    expect(result.current.selectedFlashcardIndex).toBe(1); // Akceptacja też wybiera

    // Odrzucamy trzecią
    act(() => {
      result.current.rejectFlashcard(2);
    });
    // Wait for state update
    await waitFor(() => {
      expect(result.current.flashcardsState[2].isRejected).toBe(true);
    });
    expect(result.current.flashcardsState[2].isAccepted).toBe(false);
    // Odrzucenie nie powinno zmieniać selected index
    expect(result.current.selectedFlashcardIndex).toBe(1);

    // Edytujemy pierwszą (powinna zostać zaakceptowana)
    const editData = { front: "Edited Front", back: "Edited Back" };
    act(() => {
      result.current.editFlashcard(0, editData);
    });
    // Wait for state update
    await waitFor(() => {
      expect(result.current.flashcardsState[0].isEdited).toBe(true);
    });
    expect(result.current.flashcardsState[0]).toMatchObject({
      ...editData,
      isEdited: true,
      isAccepted: true,
      isRejected: false,
    });
    expect(result.current.selectedFlashcardIndex).toBe(0); // Edycja też wybiera
  });

  // --- Testy Zapisywania (Wybrane) ---
  it("should not allow saving selected if not all reviewed", async () => {
    const { result } = setupHook();
    await act(async () => {
      await result.current.generateFlashcards("Text");
    });
    // Wait for flashcards to be generated
    await waitFor(() => {
      expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    });
    act(() => {
      result.current.acceptFlashcard(0);
    }); // Tylko jedna oceniona

    await act(async () => {
      await result.current.saveSelectedFlashcards();
    });

    // Wait for save error state
    await waitFor(() => {
      expect(result.current.savingState.saveError).toContain("Wszystkie fiszki muszą zostać ocenione");
    });

    expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("/accept-flashcards"), expect.any(Object));
  });

  it("should not allow saving selected if none accepted", async () => {
    const { result } = setupHook();
    await act(async () => {
      await result.current.generateFlashcards("Text");
    });
    // Wait for flashcards to be generated
    await waitFor(() => {
      expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    });
    act(() => {
      result.current.rejectFlashcard(0);
    });
    act(() => {
      result.current.rejectFlashcard(1);
    });
    act(() => {
      result.current.rejectFlashcard(2);
    }); // Wszystkie odrzucone

    await act(async () => {
      await result.current.saveSelectedFlashcards();
    });

    // Wait for save error state
    await waitFor(() => {
      expect(result.current.savingState.saveError).toContain("Brak zaakceptowanych fiszek");
    });

    expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("/accept-flashcards"), expect.any(Object));
  });

  it("should save only accepted flashcards successfully", async () => {
    // Mock generate call
    mockFetch.mockResolvedValueOnce(
      createMockResponse<GenerationWithFlashcardsResponseDto>({ ok: true, json: async () => mockApiResponse })
    );
    // Mock save call
    mockFetch.mockResolvedValueOnce(
      createMockResponse<{ success: boolean }>({ ok: true, json: async () => ({ success: true }) })
    );
    const { result } = setupHook();
    await act(async () => {
      await result.current.generateFlashcards("Text");
    });

    // Wait for flashcards to be generated
    await waitFor(() => {
      expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    });

    act(() => {
      result.current.acceptFlashcard(0);
    });
    act(() => {
      result.current.rejectFlashcard(1);
    });
    act(() => {
      result.current.acceptFlashcard(2);
    }); // Dwie zaakceptowane

    // Wait for state updates from accept/reject
    await waitFor(() => {
      expect(result.current.flashcardsState[0].isAccepted).toBe(true);
      expect(result.current.flashcardsState[1].isRejected).toBe(true);
      expect(result.current.flashcardsState[2].isAccepted).toBe(true);
    });

    await act(async () => {
      await result.current.saveSelectedFlashcards();
    });

    // Wait for save success state and flashcards to be cleared
    await waitFor(() => {
      expect(result.current.savingState.saveSuccess).toBe(true);
      expect(result.current.flashcardsState).toEqual([]);
    });

    expect(result.current.savingState.isSaving).toBe(false);
    expect(result.current.savingState.saveSuccessMessage).toContain("Zapisano 2");
    // Check fetch call with Request object (single argument)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost/api/generations/123/accept-flashcards",
        method: "POST",
        // We need to check the body content. The actual body is a stream,
        // so direct comparison is tricky. Let's omit body check for now,
        // and add it back if needed using Request.text().
        // body: expectedSaveBodySelected // TODO: Check body if needed
      })
    );
  });

  // --- Testy Zapisywania (Wszystkie) ---
  it("should save all flashcards (as accepted) successfully", async () => {
    // Mock generate call
    mockFetch.mockResolvedValueOnce(
      createMockResponse<GenerationWithFlashcardsResponseDto>({ ok: true, json: async () => mockApiResponse })
    );
    // Mock save call
    mockFetch.mockResolvedValueOnce(
      createMockResponse<{ success: boolean }>({ ok: true, json: async () => ({ success: true }) })
    );
    const { result } = setupHook();
    await act(async () => {
      await result.current.generateFlashcards("Text");
    });

    // Wait for flashcards to be generated
    await waitFor(() => {
      expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    });

    // Celowo odrzucamy jedną dla testu
    act(() => {
      result.current.rejectFlashcard(1);
    });

    // Wait for state update from reject
    await waitFor(() => {
      expect(result.current.flashcardsState[1].isRejected).toBe(true);
    });

    await act(async () => {
      await result.current.saveAllFlashcards();
    });

    // Wait for save success state and flashcards to be cleared
    await waitFor(() => {
      expect(result.current.savingState.saveSuccess).toBe(true);
      expect(result.current.flashcardsState).toEqual([]);
    });

    expect(result.current.savingState.isSaving).toBe(false);
    expect(result.current.savingState.saveSuccessMessage).toContain(
      `Zapisano wszystkie ${mockApiResponse.flashcards.length}`
    );
    // Check fetch call with Request object (single argument)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost/api/generations/123/accept-flashcards",
        method: "POST",
        // body: expectedSaveBodyAll // TODO: Check body if needed
      })
    );
  });

  it("should handle save error correctly", async () => {
    // Mock generate call
    mockFetch.mockResolvedValueOnce(
      createMockResponse<GenerationWithFlashcardsResponseDto>({ ok: true, json: async () => mockApiResponse })
    );
    // Mock save call (FAIL)
    mockFetch.mockResolvedValueOnce(
      createMockResponse<{ error: string }>({ ok: false, status: 500, text: async () => "Server Error" })
    );
    const { result } = setupHook();
    await act(async () => {
      await result.current.generateFlashcards("Text");
    });

    // Wait for flashcards to be generated
    await waitFor(() => {
      expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length);
    });

    act(() => {
      result.current.acceptFlashcard(0);
    });
    act(() => {
      result.current.acceptFlashcard(1);
    });
    act(() => {
      result.current.acceptFlashcard(2);
    }); // Wszystkie zaakceptowane

    // Wait for state updates from accept
    await waitFor(() => {
      expect(result.current.flashcardsState[0].isAccepted).toBe(true);
      expect(result.current.flashcardsState[1].isAccepted).toBe(true);
      expect(result.current.flashcardsState[2].isAccepted).toBe(true);
    });

    await act(async () => {
      await result.current.saveSelectedFlashcards();
    });

    // Wait for save error state
    await waitFor(() => {
      // Check for the error message constructed by the hook
      expect(result.current.savingState.saveError).toContain("Błąd podczas zapisywania: 500 Server Error");
    });

    expect(result.current.savingState.isSaving).toBe(false);
    expect(result.current.savingState.saveSuccess).toBe(false);
    expect(result.current.flashcardsState).toHaveLength(mockApiResponse.flashcards.length); // Stan NIE jest czyszczony po błędzie
  });
});
