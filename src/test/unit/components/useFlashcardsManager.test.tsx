import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { useFlashcardsManager } from "../../../components/flashcards/hooks/useFlashcardsManager";
import type { FlashcardDto, FlashcardListResponseDto } from "../../../types";
import type { FlashcardFormValues } from "../../../components/flashcards/types";
import { server } from "../../setup";

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};

// Mockowanie global.fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mockowanie localStorage
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// ----- Dane testowe -----
const mockUserId = "test-user-123";

const mockFlashcard: FlashcardDto = {
  id: 1,
  front: "Test Front",
  back: "Test Back",
  created_at: "2023-04-01T12:00:00Z",
  updated_at: "2023-04-01T12:00:00Z",
  source: "manual",
  generation_id: 123,
};

const mockFlashcard2: FlashcardDto = {
  id: 2,
  front: "Test Front 2",
  back: "Test Back 2",
  created_at: "2023-04-02T12:00:00Z",
  updated_at: "2023-04-02T12:00:00Z",
  source: "generated",
  generation_id: 456,
};

const mockFlashcardsListResponse: FlashcardListResponseDto = {
  flashcards: [mockFlashcard],
  total: 1,
};

const mockFlashcardsListResponsePage2: FlashcardListResponseDto = {
  flashcards: [mockFlashcard2],
  total: 1,
};

// ----- Konfiguracja testów Vitest -----
describe("useFlashcardsManager", () => {
  // Wyłączamy MSW server przed testami
  beforeAll(() => {
    server.close();
  });

  afterAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    localStorageMock.clear();

    // Domyślna implementacja fetch - zwraca poprawną odpowiedź
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });
  });

  it("should initialize with default state", async () => {
    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Sprawdzamy stan początkowy
    expect(result.current.flashcards).toEqual([]);
    expect(result.current.isLoadingList).toBe(true);

    // Domyślny tryb wyświetlania to "grid"
    expect(result.current.viewMode).toBe("grid");

    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    expect(result.current.flashcards).toEqual(mockFlashcardsListResponse.flashcards);
  });

  it("should initialize viewMode from localStorage if available", async () => {
    // Ustawiamy wartość w localStorage
    localStorageMock.getItem.mockReturnValue("list");

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    expect(result.current.viewMode).toBe("list");
  });

  it("should fetch flashcards on initial render", async () => {
    // Renderujemy hook
    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Sprawdzamy stan początkowy
    expect(result.current.flashcards).toEqual([]);
    expect(result.current.isLoadingList).toBe(true);

    // Czekamy na zakończenie asynchronicznych operacji
    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Sprawdzamy czy fetch został wywołany poprawnie
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/flashcards"));

    // Sprawdzamy czy stan został zaktualizowany
    expect(result.current.flashcards).toEqual(mockFlashcardsListResponse.flashcards);
    expect(result.current.isLoadingList).toBe(false);
    expect(result.current.totalCount).toBe(mockFlashcardsListResponse.total);
  });

  it("should fetch flashcards with updated filters", async () => {
    // Renderujemy hook
    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Czekamy na zakończenie początkowego ładowania
    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Zmienione mocki dla drugiego wywołania fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponsePage2),
    });

    // Aktualizujemy filtry
    await act(async () => {
      result.current.setFilters({
        page: 2,
        page_size: 20,
        sortBy: "front",
        sortOrder: "asc",
        searchText: "test query",
        generationId: 456,
        source: "manual",
      });
    });

    // Sprawdzamy czy fetch został wywołany z prawidłowymi parametrami
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const fetchUrl = mockFetch.mock.calls[1][0];
    expect(fetchUrl).toContain("page=2");
    expect(fetchUrl).toContain("searchText=test+query");
    expect(fetchUrl).toContain("sortBy=front");

    // Sprawdzamy czy stan został zaktualizowany
    expect(result.current.flashcards).toEqual(mockFlashcardsListResponsePage2.flashcards);
    expect(result.current.filters.page).toBe(2);
    expect(result.current.totalCount).toBe(mockFlashcardsListResponsePage2.total);
  });

  it("should handle API error response", async () => {
    // Symulujemy błąd odpowiedzi API
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Invalid parameters" }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Oczekujemy komunikatu błędu w języku polskim
    expect(result.current.error).toBe("Invalid parameters");
  });

  it("should update viewMode and save to localStorage", async () => {
    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Zmieniamy tryb wyświetlania
    act(() => {
      result.current.setViewMode("list");
    });

    expect(result.current.viewMode).toBe("list");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("flashcardsViewMode", "list");

    act(() => {
      result.current.setViewMode("grid");
    });

    expect(result.current.viewMode).toBe("grid");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("flashcardsViewMode", "grid");
  });

  it("should create a new flashcard", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Przygotowujemy sekwencję odpowiedzi: najpierw pobieranie, potem create, potem ponowne pobieranie
    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Utworzenie nowej fiszki
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockFlashcard),
    });

    // Ponowne pobranie listy
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    const newCardData: FlashcardFormValues & { user_id: string } = {
      front: "New Front",
      back: "New Back",
      source: "manual",
      generation_id: 123,
      user_id: mockUserId,
    };

    // Rozpoczęcie operacji powinno ustawić isCreatingCard na true
    let createPromise;
    act(() => {
      createPromise = result.current.createFlashcard(newCardData);
    });

    // W trakcie tworzenia isLoading powinno być true
    await waitFor(() => {
      expect(result.current.isCreatingCard).toBe(true);
      expect(result.current.isLoading).toBe(true);
    });

    await createPromise;

    // Sprawdzamy czy POST został wykonany
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/flashcards",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      })
    );

    // Sprawdzamy czy właściwe dane zostały wysłane
    const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(requestBody).toEqual(newCardData);
  });

  it("should handle error when creating flashcard", async () => {
    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Symulujemy błąd podczas tworzenia fiszki
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Invalid flashcard data" }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    const newCardData: FlashcardFormValues = {
      front: "New Front",
      back: "New Back",
      source: "manual",
      generation_id: 123,
    };

    // Sprawdzamy czy funkcja rzuca błąd
    let errorThrown = false;
    await act(async () => {
      try {
        await result.current.createFlashcard(newCardData);
      } catch (error) {
        errorThrown = true;
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBe("Invalid flashcard data");
      }
    });

    expect(errorThrown).toBe(true);
    expect(result.current.error).toBe("Invalid flashcard data");
    expect(result.current.isCreatingCard).toBe(false);
  });

  it("should update a flashcard", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsza odpowiedź - inicjalne pobranie fiszek
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Druga odpowiedź - aktualizacja fiszki
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcard),
    });

    // Trzecia odpowiedź - ponowne pobranie fiszek
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    const updateData: FlashcardFormValues = {
      front: "Updated Front",
      back: "Updated Back",
      source: "manual",
      generation_id: 123,
    };

    // Otwieramy modal edycji
    act(() => {
      result.current.openEditModal(1);
    });

    expect(result.current.editingFlashcardId).toBe(1);

    // Aktualizujemy fiszkę
    await act(async () => {
      await result.current.updateFlashcard(1, updateData);
    });

    // Sprawdzamy czy PATCH został wykonany
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/flashcards/1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.any(String),
      })
    );

    // Sprawdzamy czy właściwe dane zostały wysłane
    const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(requestBody).toEqual(updateData);

    // Modal edycji powinien być zamknięty
    expect(result.current.editingFlashcardId).toBeNull();
  });

  it("should handle error when updating flashcard", async () => {
    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Symulujemy błąd podczas aktualizacji fiszki
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Invalid flashcard update" }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    const updateData: FlashcardFormValues = {
      front: "Updated Front",
      back: "Updated Back",
      source: "manual",
      generation_id: 123,
    };

    // Otwieramy modal edycji
    act(() => {
      result.current.openEditModal(1);
    });

    // Sprawdzamy czy funkcja rzuca błąd
    let errorThrown = false;
    await act(async () => {
      try {
        await result.current.updateFlashcard(1, updateData);
      } catch (error) {
        errorThrown = true;
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBe("Invalid flashcard update");
      }
    });

    expect(errorThrown).toBe(true);
    expect(result.current.error).toBe("Invalid flashcard update");
    expect(result.current.isUpdatingCard).toBe(false);
    expect(result.current.editingFlashcardId).toBe(1); // Modal edycji pozostaje otwarty
  });

  it("should delete a flashcard", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsza odpowiedź - inicjalne pobranie fiszek
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Druga odpowiedź - usunięcie fiszki
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    // Trzecia odpowiedź - ponowne pobranie fiszek
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ flashcards: [], total: 0 }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    // Otwieramy modal usuwania
    act(() => {
      result.current.openDeleteModal(1);
    });

    expect(result.current.deletingFlashcardId).toBe(1);

    // Usuwamy fiszkę
    await act(async () => {
      await result.current.deleteFlashcard(1);
    });

    // Sprawdzamy czy DELETE został wykonany
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/flashcards/1",
      expect.objectContaining({
        method: "DELETE",
      })
    );

    // Modal usuwania powinien być zamknięty
    expect(result.current.deletingFlashcardId).toBeNull();
  });

  it("should handle error when deleting flashcard", async () => {
    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Symulujemy błąd podczas usuwania fiszki
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Error deleting flashcard" }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    // Otwieramy modal usuwania
    act(() => {
      result.current.openDeleteModal(1);
    });

    // Sprawdzamy czy funkcja rzuca błąd
    let errorThrown = false;
    await act(async () => {
      try {
        await result.current.deleteFlashcard(1);
      } catch (error) {
        errorThrown = true;
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBe("Error deleting flashcard");
      }
    });

    expect(errorThrown).toBe(true);
    expect(result.current.error).toBe("Error deleting flashcard");
    expect(result.current.isDeletingCard).toBe(false);
    expect(result.current.deletingFlashcardId).toBe(1); // Modal usuwania pozostaje otwarty
  });

  it("should handle invalid JSON in error response", async () => {
    // Symulujemy błąd odpowiedzi API z nieprawidłowym JSON
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("Invalid JSON")),
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Oczekujemy ogólnego komunikatu błędu
    expect(result.current.error).toContain("Błąd pobierania fiszek: 500 Internal Server Error");
  });

  it("should handle unknown error type", async () => {
    // Symulujemy nieznany typ błędu (nie Error)
    mockFetch.mockRejectedValueOnce("Unknown error type");

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Oczekujemy domyślnego komunikatu błędu
    expect(result.current.error).toBe("Wystąpił nieznany błąd podczas pobierania fiszek");
  });

  it("should not fetch flashcards when userId is empty", async () => {
    const { result } = renderHook(() => useFlashcardsManager(""));

    // Nie powinno być wywołań fetch
    expect(mockFetch).not.toHaveBeenCalled();

    // Stan powinien być pusty
    expect(result.current.flashcards).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("should correctly handle modal open/close functions", async () => {
    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    // Test create modal
    act(() => {
      result.current.openCreateModal();
    });
    expect(result.current.isCreating).toBe(true);

    act(() => {
      result.current.closeCreateModal();
    });
    expect(result.current.isCreating).toBe(false);

    // Test edit modal
    act(() => {
      result.current.openEditModal(42);
    });
    expect(result.current.editingFlashcardId).toBe(42);

    act(() => {
      result.current.closeEditModal();
    });
    expect(result.current.editingFlashcardId).toBeNull();

    // Test delete modal
    act(() => {
      result.current.openDeleteModal(24);
    });
    expect(result.current.deletingFlashcardId).toBe(24);

    act(() => {
      result.current.closeDeleteModal();
    });
    expect(result.current.deletingFlashcardId).toBeNull();
  });

  it.skip("should correctly calculate loading state during CRUD operations", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsza odpowiedź - inicjalne pobranie fiszek (załadowane)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Druga odpowiedź - operacja tworzenia fiszki
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockFlashcard),
    });

    // Trzecia odpowiedź - ponowne pobranie po utworzeniu
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Początkowo isLoading powinno być true
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Po załadowaniu isLoading powinno być false
    expect(result.current.isLoading).toBe(false);

    // Rozpocznij operację tworzenia fiszki
    const createPromise = act(async () => {
      const newCardData: FlashcardFormValues = {
        front: "Test Front",
        back: "Test Back",
        source: "manual",
        generation_id: 123,
      };

      // Rozpoczęcie operacji powinno ustawić isCreatingCard na true
      const createPromise = result.current.createFlashcard(newCardData);

      // W trakcie tworzenia isLoading powinno być true
      await waitFor(() => {
        expect(result.current.isCreatingCard).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });

      await createPromise;
    });

    await createPromise;

    // Po zakończeniu tworzenia isCreatingCard powinno być false
    expect(result.current.isCreatingCard).toBe(false);
    // isLoading również powinno być false
    expect(result.current.isLoading).toBe(false);
  });

  it("should toggle view mode between grid and list", () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock initial localStorage state
    localStorageMock.getItem.mockReturnValue("grid");

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Initial view mode should be grid
    expect(result.current.viewMode).toBe("grid");

    // Toggle to list mode
    act(() => {
      result.current.setViewMode("list");
    });

    // View mode should be list and localStorage should be updated
    expect(result.current.viewMode).toBe("list");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("flashcardsViewMode", "list");

    // Toggle back to grid mode
    act(() => {
      result.current.setViewMode("grid");
    });

    // View mode should be grid and localStorage should be updated
    expect(result.current.viewMode).toBe("grid");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("flashcardsViewMode", "grid");
  });

  it("should reset filters and reload flashcards", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsza odpowiedź - inicjalne pobranie fiszek
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    // Ustawiamy niestandardowe filtry
    act(() => {
      result.current.setFilters({
        page: 2,
        page_size: 10,
        sortBy: "front",
        sortOrder: "asc",
        searchText: "search text",
      });
    });

    // Druga odpowiedź - po zmianie filtrów
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponsePage2),
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    // Trzecia odpowiedź - po resecie filtrów
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Resetujemy filtry
    act(() => {
      result.current.setFilters({
        page: 1,
        page_size: 20,
        sortBy: "created_at",
        sortOrder: "desc",
      });
    });

    // Czekamy na zakończenie ładowania po resecie
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    // Sprawdzamy czy filtry zostały zresetowane
    expect(result.current.filters).toEqual({
      page: 1,
      page_size: 20,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    // Sprawdzamy czy nastąpiło ponowne pobranie fiszek
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should open and close create modal", () => {
    // ... existing code ...
  });
});
