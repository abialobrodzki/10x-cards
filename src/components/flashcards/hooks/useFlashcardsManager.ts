/* eslint-disable no-console */
import { useState, useEffect, useCallback } from "react";
import type { FlashcardDto, FlashcardListResponseDto, CreateFlashcardDto, UpdateFlashcardDto } from "../../../types";
import type { FlashcardFilters, FlashcardFormValues } from "../types";
import type { ViewMode } from "../FlashcardsViewToggle";

export function useFlashcardsManager(userId: string) {
  // Stan fiszek
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Stany ładowania dla poszczególnych operacji
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);

  // Stan filtrów
  const [filters, setFilters] = useState<FlashcardFilters>({
    page: 1,
    page_size: 20,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Stan UI modali
  const [isCreating, setIsCreating] = useState(false);
  const [editingFlashcardId, setEditingFlashcardId] = useState<number | null>(null);
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<number | null>(null);

  // Stan trybu widoku
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Check if window exists (to prevent error in server-side rendering)
    if (typeof window !== "undefined") {
      // Pobieramy zapisany stan z localStorage, jeśli istnieje
      const savedViewMode = localStorage.getItem("flashcardsViewMode");
      return savedViewMode === "list" || savedViewMode === "grid" ? savedViewMode : "grid"; // domyślnie grid
    }
    return "grid"; // default for server-side rendering
  });

  // Zapisujemy zmianę trybu widoku do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flashcardsViewMode", viewMode);
    }
  }, [viewMode]);

  // Pobieranie fiszek
  const fetchFlashcards = useCallback(async (currentFilters: FlashcardFilters) => {
    setIsLoadingList(true);
    setError(null);
    console.log("fetchFlashcards - rozpoczynam pobieranie z filtrami:", currentFilters);

    try {
      const params = new URLSearchParams();

      // Dodaj parametry paginacji
      if (currentFilters.page) params.append("page", currentFilters.page.toString());
      if (currentFilters.page_size) params.append("page_size", currentFilters.page_size.toString());

      // Dodaj parametry sortowania - używamy camelCase
      if (currentFilters.sortBy) {
        params.append("sortBy", currentFilters.sortBy.toString());
        params.append("sortOrder", currentFilters.sortOrder || "desc");
        console.log(`Dodaję sortowanie: sortBy=${currentFilters.sortBy}, sortOrder=${currentFilters.sortOrder}`);
      }

      // Dodaj pozostałe filtry
      if (currentFilters.generationId) {
        params.append("generationId", currentFilters.generationId.toString());
        console.log(`Dodaję filtr generationId: ${currentFilters.generationId}`);
      }

      if (currentFilters.source) {
        params.append("source", currentFilters.source);
        console.log(`Dodaję filtr source: ${currentFilters.source}`);
      }

      // Dodaj wyszukiwanie tekstowe
      if (currentFilters.searchText && currentFilters.searchText.trim() !== "") {
        params.append("searchText", currentFilters.searchText.trim());
        console.log(`Dodaję filtr wyszukiwania tekstu: "${currentFilters.searchText.trim()}"`);
      }

      const url = `/api/flashcards?${params}`;
      console.log("URL zapytania API:", url);
      console.log("Wszystkie parametry:", Object.fromEntries(params.entries()));

      const response = await fetch(url);
      console.log("Status odpowiedzi API:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("fetchFlashcards - niepoprawna odpowiedź:", errorData);
        throw new Error(errorData.error || `Błąd pobierania fiszek: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as FlashcardListResponseDto;
      console.log("Pobrano fiszki:", data.flashcards.length, "z", data.total);

      setFlashcards(data.flashcards);
      setTotalCount(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd podczas pobierania fiszek";
      console.error("fetchFlashcards - wystąpił błąd:", errorMessage, err);
      setError(errorMessage);
      setFlashcards([]);
      setTotalCount(0);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Efekt pobierający fiszki przy zmianie filtrów lub użytkownika
  useEffect(() => {
    if (userId) {
      fetchFlashcards(filters);
    }
  }, [fetchFlashcards, filters, userId]);

  // Tworzenie fiszki
  const createFlashcard = async (flashcard: FlashcardFormValues) => {
    setIsCreatingCard(true);
    setError(null);

    try {
      const newFlashcard: CreateFlashcardDto = {
        user_id: userId,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        generation_id: flashcard.generation_id,
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFlashcard),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd tworzenia fiszki: ${response.status} ${response.statusText}`);
      }

      // Pobieramy zaktualizowane fiszki
      await fetchFlashcards(filters);

      // Zamykamy modal tworzenia
      closeCreateModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd podczas tworzenia fiszki";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreatingCard(false);
    }
  };

  // Aktualizacja fiszki
  const updateFlashcard = async (id: number, flashcard: FlashcardFormValues) => {
    setIsUpdatingCard(true);
    setError(null);

    try {
      const updatedFlashcard: UpdateFlashcardDto = {
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        generation_id: flashcard.generation_id,
      };

      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFlashcard),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd aktualizacji fiszki: ${response.status} ${response.statusText}`);
      }

      // Pobieramy zaktualizowane fiszki
      await fetchFlashcards(filters);

      // Zamykamy modal edycji
      closeEditModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd podczas aktualizacji fiszki";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUpdatingCard(false);
    }
  };

  // Usuwanie fiszki
  const deleteFlashcard = async (id: number) => {
    setIsDeletingCard(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd usuwania fiszki: ${response.status} ${response.statusText}`);
      }

      // Pobieramy zaktualizowane fiszki
      await fetchFlashcards(filters);

      // Zamykamy dialog usuwania
      closeDeleteModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd podczas usuwania fiszki";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeletingCard(false);
    }
  };

  // Funkcje zarządzające modalnymi oknami
  const openCreateModal = () => setIsCreating(true);
  const closeCreateModal = () => setIsCreating(false);

  const openEditModal = (id: number) => setEditingFlashcardId(id);
  const closeEditModal = () => setEditingFlashcardId(null);

  const openDeleteModal = (id: number) => setDeletingFlashcardId(id);
  const closeDeleteModal = () => setDeletingFlashcardId(null);

  // Obliczamy ogólny stan ładowania bezpośrednio
  const isLoading = isLoadingList || isCreatingCard || isUpdatingCard || isDeletingCard;

  return {
    // Stan
    flashcards,
    totalCount,
    isLoading,
    isLoadingList,
    isCreatingCard,
    isUpdatingCard,
    isDeletingCard,
    error,
    filters,
    isCreating,
    editingFlashcardId,
    deletingFlashcardId,
    viewMode,

    // Funkcje zarządzające stanem
    setFilters,
    setViewMode,

    // Funkcje zarządzające modalnymi oknami
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,

    // Operacje API
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    fetchFlashcards,
  };
}
