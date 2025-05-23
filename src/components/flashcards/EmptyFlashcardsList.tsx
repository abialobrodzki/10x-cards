import { memo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchX } from "lucide-react";

interface EmptyFlashcardsListProps {
  hasFilters: boolean;
  onCreateNewClick: () => void;
}

const EmptyFlashcardsList = ({ hasFilters, onCreateNewClick }: EmptyFlashcardsListProps) => {
  return (
    <div
      className="text-center py-16 border rounded-lg bg-card flex flex-col items-center"
      data-testid="empty-flashcards-list"
    >
      <div className="mb-4 p-4 bg-muted rounded-full">
        <div data-testid="search-x-icon">
          <SearchX className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>

      <h3 className="font-medium text-xl mb-2" data-testid="empty-list-heading">
        {hasFilters ? "Brak pasujących fiszek" : "Brak fiszek"}
      </h3>

      <p className="text-muted-foreground max-w-md mb-6" data-testid="empty-list-message">
        {hasFilters
          ? "Nie znaleziono żadnych fiszek spełniających kryteria wyszukiwania. Spróbuj zmodyfikować filtry."
          : "Wygląda na to, że nie masz jeszcze żadnych fiszek. Zacznij od utworzenia pierwszej fiszki."}
      </p>

      {!hasFilters && (
        <Button
          onClick={onCreateNewClick}
          className="flex items-center gap-2"
          data-testid="create-first-flashcard-button"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Utwórz pierwszą fiszkę</span>
        </Button>
      )}
    </div>
  );
};

export default memo(EmptyFlashcardsList);
