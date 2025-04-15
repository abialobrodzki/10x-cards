import type { FlashcardDto, FlashcardFilterParams, FlashcardSourceType } from "../../types";
import type { ViewMode } from "./FlashcardsViewToggle";

// Wartości formularza fiszki
export interface FlashcardFormValues {
  front: string;
  back: string;
  source: FlashcardSourceType;
  generation_id?: number | null;
}

// Rozszerzone filtry dla UI
export interface FlashcardFilters extends FlashcardFilterParams {
  sortOrder: "asc" | "desc";
  searchText?: string;
}

// ViewModel dla strony z fiszkami
export interface FlashcardsPageViewModel {
  flashcards: FlashcardDto[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: FlashcardFilters;
  isCreating: boolean;
  editingFlashcardId: number | null;
  deletingFlashcardId: number | null;
  viewMode: ViewMode;
}

// Parametry paginacji
export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

// Propsy dla FlashcardFilterBar
export interface FlashcardFilterBarProps {
  filters: FlashcardFilters;
  onFilterChange: (filters: Partial<FlashcardFilters>) => void;
}

// Propsy dla FlashcardsList
export interface FlashcardsListProps {
  flashcards: FlashcardDto[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
  viewMode: ViewMode;
  hasFilters?: boolean;
}

// Propsy dla FlashcardItem
export interface FlashcardItemProps {
  flashcard: FlashcardDto;
  onEdit: () => void;
  onDelete: () => void;
}

// Propsy dla CreateFlashcardButton
export interface CreateFlashcardButtonProps {
  onClick: () => void;
}

// Propsy dla FlashcardFormModal
export interface FlashcardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard?: FlashcardDto;
  onSubmit: (values: FlashcardFormValues) => Promise<void>;
  isSubmitting: boolean;
}

// Propsy dla DeleteConfirmationDialog
export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  flashcardFront: string;
}
