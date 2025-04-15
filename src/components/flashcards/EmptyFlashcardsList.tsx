import { memo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchX } from "lucide-react";

interface EmptyFlashcardsListProps {
  hasFilters: boolean;
  onCreateNewClick: () => void;
}

const EmptyFlashcardsList = ({ hasFilters, onCreateNewClick }: EmptyFlashcardsListProps) => {
  return (
    <div className="text-center py-16 border rounded-lg bg-card flex flex-col items-center">
      <div className="mb-4 p-4 bg-muted rounded-full">
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 className="font-medium text-xl mb-2">{hasFilters ? "Brak pasujących fiszek" : "Brak fiszek"}</h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {hasFilters
          ? "Nie znaleziono żadnych fiszek spełniających kryteria wyszukiwania. Spróbuj zmodyfikować filtry."
          : "Wygląda na to, że nie masz jeszcze żadnych fiszek. Zacznij od utworzenia pierwszej fiszki."}
      </p>

      {!hasFilters && (
        <Button onClick={onCreateNewClick} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>Utwórz pierwszą fiszkę</span>
        </Button>
      )}
    </div>
  );
};

export default memo(EmptyFlashcardsList);
