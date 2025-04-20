import { memo, useMemo } from "react";
import FlashcardFilterBar from "./FlashcardFilterBar";
import FlashcardsList from "./FlashcardsList";
import CreateFlashcardButton from "./CreateFlashcardButton";
import Pagination from "./Pagination";
import FlashcardFormModal from "./FlashcardFormModal";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import FlashcardsViewToggle from "./FlashcardsViewToggle";
import FlashcardExportButton from "./FlashcardExportButton";
import { useFlashcardsManager } from "./hooks/useFlashcardsManager";

interface FlashcardsPageProps {
  userId: string;
}

const FlashcardsPage = memo(({ userId }: FlashcardsPageProps) => {
  const {
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
    setFilters,
    setViewMode,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    fetchFlashcards,
  } = useFlashcardsManager(userId);

  // Znajdujemy edytowaną fiszkę (jeśli istnieje)
  const editingFlashcard =
    editingFlashcardId !== null ? flashcards.find((f) => f.id === editingFlashcardId) : undefined;

  // Znajdujemy usuwaną fiszkę (jeśli istnieje)
  const deletingFlashcard =
    deletingFlashcardId !== null ? flashcards.find((f) => f.id === deletingFlashcardId) : undefined;

  // Sprawdzamy, czy są aktywne filtry
  const hasFilters = useMemo(() => {
    return !!(filters.searchText || filters.source || filters.sort_by !== "created_at" || filters.sortOrder !== "desc");
  }, [filters]);

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ ...filters, page_size: pageSize, page: 1 });
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  // Funkcja obsługująca kliknięcia na edycję lub specjalne akcje
  const handleEditOrAction = (id: number) => {
    if (id === -1) {
      // Specjalny przypadek: otwórz modal tworzenia
      openCreateModal();
    } else {
      // Standardowy przypadek: otwórz modal edycji
      openEditModal(id);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Zarządzanie fiszkami</h1>
        <div className="flex items-center gap-2">
          <FlashcardExportButton flashcards={flashcards} isDisabled={isLoading} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <FlashcardFilterBar filters={filters} onFilterChange={handleFilterChange} />
        <div className="flex items-center gap-3">
          <FlashcardsViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <CreateFlashcardButton onClick={openCreateModal} />
        </div>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={() => fetchFlashcards(filters)}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <>
          <FlashcardsList
            flashcards={flashcards}
            onEdit={handleEditOrAction}
            onDelete={openDeleteModal}
            isLoading={isLoadingList}
            viewMode={viewMode}
            hasFilters={hasFilters}
          />

          {flashcards.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={filters.page || 1}
                pageSize={filters.page_size || 20}
                totalItems={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </>
      )}

      {/* Modal tworzenia/edycji fiszki */}
      <FlashcardFormModal
        isOpen={isCreating || editingFlashcardId !== null}
        onClose={editingFlashcardId !== null ? closeEditModal : closeCreateModal}
        flashcard={editingFlashcard}
        onSubmit={
          editingFlashcardId !== null ? (values) => updateFlashcard(editingFlashcardId, values) : createFlashcard
        }
        isSubmitting={isCreatingCard || isUpdatingCard}
      />

      {/* Dialog potwierdzenia usunięcia */}
      <DeleteConfirmationDialog
        isOpen={deletingFlashcardId !== null}
        onClose={closeDeleteModal}
        onConfirm={() => {
          return deletingFlashcardId !== null ? deleteFlashcard(deletingFlashcardId) : Promise.resolve();
        }}
        isDeleting={isDeletingCard}
        flashcardFront={deletingFlashcard?.front || ""}
      />
    </div>
  );
});

FlashcardsPage.displayName = "FlashcardsPage";

export default FlashcardsPage;
