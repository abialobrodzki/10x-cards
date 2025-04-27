import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { useFlashcardsManager } from "../../components/flashcards/hooks/useFlashcardsManager";
import type { FlashcardDto, FlashcardListResponseDto } from "../../types";
import type { FlashcardFormValues } from "../../components/flashcards/types";
import { server } from "../setup";

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

    const newCardData: FlashcardFormValues = {
      front: "New Front",
      back: "New Back",
      source: "manual",
      generation_id: 123,
    };

    // Wywołanie funkcji createFlashcard
    await act(async () => {
      await result.current.createFlashcard(newCardData);
    });

    // Sprawdzamy czy request został wykonany z poprawnymi danymi - 2-gie wywołanie fetch
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/flashcards"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      })
    );

    // Sprawdzamy body requestu
    const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(requestBody).toEqual(newCardData);
  });

  it("should handle create flashcard error", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Błąd przy tworzeniu
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Validation error" }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    const newCardData: FlashcardFormValues = {
      front: "Fail Front",
      back: "Fail Back",
      source: "manual",
    };

    // Sprawdzamy czy funkcja rzuca wyjątek
    let error;
    await act(async () => {
      try {
        await result.current.createFlashcard(newCardData);
      } catch (e) {
        error = e;
      }
    });

    // Sprawdzamy czy wystąpił błąd
    expect(error).toBeDefined();
  });

  it("should update an existing flashcard", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Aktualizacja fiszki
    const updatedFlashcard = { ...mockFlashcard, front: "Updated Front" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedFlashcard),
    });

    // Ponowne pobranie listy
    const updatedListResponse = {
      flashcards: [updatedFlashcard],
      total: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedListResponse),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    const updateData: FlashcardFormValues = {
      front: "Updated Front",
      back: "Test Back",
      source: "manual",
      generation_id: 123,
    };

    // Wywołanie funkcji updateFlashcard
    await act(async () => {
      await result.current.updateFlashcard(1, updateData);
    });

    // Sprawdzamy czy request został wykonany z poprawnymi danymi - 2-gie wywołanie fetch
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/flashcards/1"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      })
    );

    // Sprawdzamy body requestu
    const requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(requestBody).toEqual(updateData);
  });

  it("should delete a flashcard", async () => {
    // Reset mocka przed testem
    mockFetch.mockReset();

    // Pierwsze pobieranie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFlashcardsListResponse),
    });

    // Usunięcie fiszki
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    // Ponowne pobranie listy
    const emptyListResponse = { flashcards: [], total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(emptyListResponse),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));
    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    // Wywołanie funkcji deleteFlashcard
    await act(async () => {
      await result.current.deleteFlashcard(1);
    });

    // Sprawdzamy czy request został wykonany z poprawnymi danymi - 2-gie wywołanie fetch
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/flashcards/1"),
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("should handle API errors", async () => {
    // Symulujemy błąd podczas pierwszego ładowania
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Server error" }),
    });

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Czekamy na zakończenie asynchronicznych operacji
    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Stan błędu powinien zostać zaktualizowany z polskim komunikatem
    expect(result.current.error).toBe("Błąd pobierania fiszek: 500 undefined");
    expect(result.current.flashcards).toEqual([]);
  });

  it("should handle network errors", async () => {
    // Symulujemy błąd sieci
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFlashcardsManager(mockUserId));

    // Czekamy na zakończenie asynchronicznych operacji
    await waitFor(() => {
      expect(result.current.isLoadingList).toBe(false);
    });

    // Stan błędu powinien zostać zaktualizowany z polskim komunikatem
    expect(result.current.error).toBe("Network error");
    expect(result.current.flashcards).toEqual([]);
  });
});
