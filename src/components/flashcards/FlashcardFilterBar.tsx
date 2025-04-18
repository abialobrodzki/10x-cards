import { useState, useEffect, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react";
import type { FlashcardFilterBarProps } from "./types";
import type { FlashcardSourceType } from "@/types";
import { useDebounce } from "./hooks/useDebounce";

const DEBOUNCE_DELAY = 400; // ms

const FlashcardFilterBar = ({ filters, onFilterChange }: FlashcardFilterBarProps) => {
  const [searchText, setSearchText] = useState(filters.searchText || "");

  // Użyj customowego hooka do debounce
  const debouncedSearchText = useDebounce(searchText, DEBOUNCE_DELAY);

  // Aktualizacja filtrów przy zmianie wyszukiwanego tekstu
  useEffect(() => {
    if (debouncedSearchText !== filters.searchText) {
      onFilterChange({ searchText: debouncedSearchText });
    }
  }, [debouncedSearchText, filters.searchText, onFilterChange]);

  // Obsługa zmiany sortowania
  const handleSortChange = useCallback(
    (value: string) => {
      const [sort_by, sortOrder] = value.split(":");
      onFilterChange({
        sort_by: sort_by as "back" | "created_at" | "front" | "id" | "updated_at",
        sortOrder: sortOrder as "asc" | "desc",
      });
    },
    [onFilterChange]
  );

  // Obsługa zmiany filtra źródła
  const handleSourceChange = useCallback(
    (value: string) => {
      onFilterChange({
        source: value === "all" ? undefined : (value as FlashcardSourceType),
      });
    },
    [onFilterChange]
  );

  // Resetowanie wszystkich filtrów
  const resetFilters = useCallback(() => {
    setSearchText("");
    onFilterChange({
      searchText: "",
      source: undefined,
      sort_by: "created_at",
      sortOrder: "desc",
    });
  }, [onFilterChange]);

  // Sprawdzenie, czy są aktywne filtry
  const hasFilters =
    filters.searchText || filters.source || filters.sort_by !== "created_at" || filters.sortOrder !== "desc";

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
      <div className="relative">
        <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj fiszek..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-8 w-full sm:w-[250px]"
          aria-label="Szukaj fiszek"
        />
        {searchText && (
          <button
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchText("")}
            aria-label="Wyczyść wyszukiwanie"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={`${filters.sort_by}:${filters.sortOrder}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sortuj według" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at:desc">Najnowsze</SelectItem>
            <SelectItem value="created_at:asc">Najstarsze</SelectItem>
            <SelectItem value="front:asc">Przód (A-Z)</SelectItem>
            <SelectItem value="front:desc">Przód (Z-A)</SelectItem>
            <SelectItem value="back:asc">Tył (A-Z)</SelectItem>
            <SelectItem value="back:desc">Tył (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.source || "all"} onValueChange={handleSourceChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rodzaj fiszki" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="manual">Ręcznie utworzone</SelectItem>
            <SelectItem value="ai-full">AI (niezmienione)</SelectItem>
            <SelectItem value="ai-edited">AI (zmienione)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="outline" size="icon" onClick={resetFilters} title="Resetuj filtry">
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default memo(FlashcardFilterBar);
