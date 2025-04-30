import { memo } from "react";
import { Grid } from "@/components/ui/grid";
import { Skeleton } from "@/components/ui/skeleton";
import FlashcardItem from "./FlashcardItem";
import FlashcardItemList from "./FlashcardItemList";
import EmptyFlashcardsList from "./EmptyFlashcardsList";
import type { FlashcardsListProps } from "./types";

const FlashcardsList = ({
  flashcards,
  onEdit,
  onDelete,
  isLoading,
  viewMode,
  hasFilters = false,
}: FlashcardsListProps) => {
  if (isLoading) {
    if (viewMode === "grid") {
      return (
        <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="loading-grid-skeleton">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="h-[250px]">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
        </Grid>
      );
    } else {
      return (
        <div className="space-y-4" data-testid="loading-list-skeleton">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} className="h-[150px] w-full" />
            ))}
        </div>
      );
    }
  }

  if (flashcards.length === 0) {
    return (
      <EmptyFlashcardsList
        hasFilters={hasFilters}
        onCreateNewClick={() => {
          // Wywoływanie funkcji otwierającej modal tworzenia
          // Zakładamy, że onEdit(-1) jest specjalnym przypadkiem do tworzenia
          onEdit(-1);
        }}
      />
    );
  }

  if (viewMode === "grid") {
    return (
      <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="flashcards-grid-view">
        {flashcards.map((flashcard) => (
          <FlashcardItem
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={() => onEdit(flashcard.id)}
            onDelete={() => onDelete(flashcard.id)}
          />
        ))}
      </Grid>
    );
  } else {
    return (
      <div className="space-y-4" data-testid="flashcards-list-view">
        {flashcards.map((flashcard) => (
          <FlashcardItemList
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={() => onEdit(flashcard.id)}
            onDelete={() => onDelete(flashcard.id)}
          />
        ))}
      </div>
    );
  }
};

export default memo(FlashcardsList);
