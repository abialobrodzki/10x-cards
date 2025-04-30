import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardsPage from "../../../components/flashcards/FlashcardsPage";
import * as FlashcardsManagerModule from "../../../components/flashcards/hooks/useFlashcardsManager";
import type { FlashcardDto } from "../../../types";
import userEvent from "@testing-library/user-event";
import React from "react";

// Polyfill Radix UI Select pointer events in JSDOM
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!HTMLElement.prototype.releasePointerCapture) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.releasePointerCapture = () => {};
}
if (!HTMLElement.prototype.setPointerCapture) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.setPointerCapture = () => {};
}

// Definiujemy typ dla sortBy
type SortByField = "id" | "front" | "back" | "created_at" | "updated_at" | "source" | "generation_id";

// Definiujemy typ ViewMode
type ViewMode = "grid" | "list";

// Mock dla hooka useFlashcardsManager
vi.mock("../../../components/flashcards/hooks/useFlashcardsManager", () => ({
  useFlashcardsManager: vi.fn(),
}));

// Mock Pagination to stub page change and page size change buttons
vi.mock("../../../components/flashcards/Pagination", () => ({
  __esModule: true,
  default: ({
    onPageChange,
    onPageSizeChange,
  }: {
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
  }) => (
    <>
      <button onClick={() => onPageChange(2)}>Change_Page</button>
      <button onClick={() => onPageSizeChange(20)}>Change_Page_Size</button>
    </>
  ),
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

  // Tests for pagination page change
  it("should handle pagination page change", async () => {
    const initialFilters = {
      ...defaultHookState.filters,
      page: 1,
      page_size: 1,
    };
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      filters: initialFilters,
      totalCount: 3,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    // Use stubbed button to change page
    const changePageButton = screen.getByText("Change_Page");
    await userEvent.click(changePageButton);
    expect(mockSetFilters).toHaveBeenCalledWith({ ...initialFilters, page: 2 });
  });

  // Tests for pagination page size change
  it("should handle pagination page size change", async () => {
    const initialFilters = {
      ...defaultHookState.filters,
      page: 1,
      page_size: 10,
    };
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      filters: initialFilters,
      totalCount: 20,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    // Use stubbed button to change page size
    const changePageSizeButton = screen.getByText("Change_Page_Size");
    await userEvent.click(changePageSizeButton);
    expect(mockSetFilters).toHaveBeenCalledWith({ ...initialFilters, page_size: 20, page: 1 });
  });

  // Test opening create modal via handler
  it("should open create modal via handler", async () => {
    render(<FlashcardsPage userId={mockUserId} />);
    const createButton = screen.getByText("Dodaj fiszkę");
    await userEvent.click(createButton);
    expect(mockOpenCreateModal).toHaveBeenCalled();
  });

  // Test opening edit modal via handler
  it("should open edit modal via handler", async () => {
    render(<FlashcardsPage userId={mockUserId} />);
    const editButtons = screen.getAllByTitle("Edytuj fiszkę");
    await userEvent.click(editButtons[0]);
    expect(mockOpenEditModal).toHaveBeenCalledWith(mockFlashcards[0].id);
  });

  // Test pagination not rendered when list is empty
  it("should not render pagination when flashcards list is empty", () => {
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      flashcards: [],
      totalCount: 0,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument();
  });

  // Test retry button in error state
  it("should retry fetch when retry button clicked", async () => {
    const errorMessage = "Test error";
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      error: errorMessage,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    const retryButton = screen.getByText("Spróbuj ponownie");
    await userEvent.click(retryButton);
    expect(mockFetchFlashcards).toHaveBeenCalledWith(defaultHookState.filters);
  });

  // Test FlashcardFormModal in create mode
  it("should render FlashcardFormModal in create mode", () => {
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      isCreating: true,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    expect(screen.getByText("Utwórz nową fiszkę")).toBeInTheDocument();
  });

  // Test FlashcardFormModal in edit mode
  it("should render FlashcardFormModal in edit mode", () => {
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      editingFlashcardId: mockFlashcards[0].id,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    expect(screen.getByText("Edytuj fiszkę")).toBeInTheDocument();
  });

  // Test DeleteConfirmationDialog rendering
  it("should render DeleteConfirmationDialog when deletingFlashcardId is set", () => {
    vi.mocked(FlashcardsManagerModule.useFlashcardsManager).mockReturnValue({
      ...defaultHookState,
      deletingFlashcardId: mockFlashcards[1].id,
    });
    render(<FlashcardsPage userId={mockUserId} />);
    expect(screen.getByText("Czy na pewno chcesz usunąć tę fiszkę?")).toBeInTheDocument();
  });
});
