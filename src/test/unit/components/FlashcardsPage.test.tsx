import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardsPage from "../../../components/flashcards/FlashcardsPage";
import * as FlashcardsManagerModule from "../../../components/flashcards/hooks/useFlashcardsManager";
import type { FlashcardDto } from "../../../types";

// Definiujemy typ dla sortBy
type SortByField = "id" | "front" | "back" | "created_at" | "updated_at" | "source" | "generation_id";

// Definiujemy typ ViewMode
type ViewMode = "grid" | "list";

// Mock dla hooka useFlashcardsManager
vi.mock("../../../components/flashcards/hooks/useFlashcardsManager", () => ({
  useFlashcardsManager: vi.fn(),
}));

describe("FlashcardsPage", () => {
  // Przygotowanie mocków dla funkcji
  const mockFetchFlashcards = vi.fn();
  const mockSetFilters = vi.fn();
  const mockSetViewMode = vi.fn();
  const mockOpenCreateModal = vi.fn();
  const mockCreateFlashcard = vi.fn();
  const mockOpenEditModal = vi.fn();
  const mockUpdateFlashcard = vi.fn();
  const mockOpenDeleteModal = vi.fn();
  const mockDeleteFlashcard = vi.fn();

  const mockUserId = "test-user-id";

  // Przygotowanie mocków dla danych
  const mockFlashcards: FlashcardDto[] = [
    {
      id: 1,
      front: "Test Front 1",
      back: "Test Back 1",
      source: "manual",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      generation_id: null,
    },
    {
      id: 2,
      front: "Test Front 2",
      back: "Test Back 2",
      source: "ai-full",
      created_at: "2023-01-02T00:00:00Z",
      updated_at: "2023-01-02T00:00:00Z",
      generation_id: 1,
    },
  ];

  // Definiujemy domyślny stan zwracany przez hook
  const defaultHookState = {
    flashcards: mockFlashcards,
    totalCount: mockFlashcards.length,
    isLoading: false,
    isLoadingList: false,
    isCreatingCard: false,
    isUpdatingCard: false,
    isDeletingCard: false,
    error: null as string | null,
    filters: {
      page: 1,
      page_size: 10,
      sortBy: "created_at" as SortByField,
      sortOrder: "desc" as "desc" | "asc",
      searchText: "",
      source: undefined,
    },
    fetchFlashcards: mockFetchFlashcards,
    setFilters: mockSetFilters,
    setViewMode: mockSetViewMode,
    openCreateModal: mockOpenCreateModal,
    closeCreateModal: vi.fn(),
    createFlashcard: mockCreateFlashcard,
    handleCreateCard: vi.fn(),
    openEditModal: mockOpenEditModal,
    closeEditModal: vi.fn(),
    updateFlashcard: mockUpdateFlashcard,
    handleUpdateCard: vi.fn(),
    openDeleteModal: mockOpenDeleteModal,
    closeDeleteModal: vi.fn(),
    deleteFlashcard: mockDeleteFlashcard,
    handleDeleteCard: vi.fn(),
    resetError: vi.fn(),
    viewMode: "grid" as ViewMode,
    isCreating: false,
    editingFlashcardId: null,
    deletingFlashcardId: null,
    selectedCard: null,
  };

  // Konfiguracja mocka przed każdym testem
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue(defaultHookState);
  });

  it("should render the page title", () => {
    render(<FlashcardsPage userId={mockUserId} />);
    expect(screen.getByText("Zarządzanie fiszkami")).toBeInTheDocument();
  });

  it("should render flashcards with content", () => {
    render(<FlashcardsPage userId={mockUserId} />);

    // Sprawdzamy czy zawartość fiszek jest widoczna
    expect(screen.getByText("Test Front 1")).toBeInTheDocument();
    expect(screen.getByText("Test Back 1")).toBeInTheDocument();
    expect(screen.getByText("Test Front 2")).toBeInTheDocument();
    expect(screen.getByText("Test Back 2")).toBeInTheDocument();
  });

  it("should show skeleton loaders when loading", () => {
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      isLoadingList: true,
    });

    render(<FlashcardsPage userId={mockUserId} />);

    // Sprawdzenie, czy wyświetlają się elementy ładowania
    const skeletons = document.querySelectorAll(".h-full.w-full");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should show an error message when there is an error", () => {
    const errorMessage = "Test error message";
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      error: errorMessage,
    });

    render(<FlashcardsPage userId={mockUserId} />);

    // Sprawdzenie, czy wyświetla się komunikat błędu
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
