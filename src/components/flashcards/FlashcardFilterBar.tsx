/* eslint-disable no-console */
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
    // Dodaję logi diagnostyczne
    console.log("Search text changed:", {
      debouncedSearchText,
      currentFilterSearchText: filters.searchText,
    });

    if (debouncedSearchText !== filters.searchText) {
      console.log("Updating search text filter:", debouncedSearchText);
      onFilterChange({ searchText: debouncedSearchText || "" });
    }
  }, [debouncedSearchText, filters.searchText, onFilterChange]);

  // Obsługa zmiany sortowania
  const handleSortChange = useCallback(
    (value: string) => {
      const [sortField, order] = value.split(":");
      if (!sortField || !order) return;
      onFilterChange({
        sortBy: sortField as "back" | "created_at" | "front" | "id" | "updated_at",
        sortOrder: order as "asc" | "desc",
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
      sortBy: "created_at",
      sortOrder: "desc",
    });
  }, [onFilterChange]);

  // Sprawdzenie, czy są aktywne filtry
  const hasFilters =
    filters.searchText || filters.source || filters.sortBy !== "created_at" || filters.sortOrder !== "desc";

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
          data-testid="search-input"
        />
        {searchText && (
          <button
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchText("")}
            aria-label="Wyczyść wyszukiwanie"
            data-testid="clear-search-button"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={`${filters.sortBy}:${filters.sortOrder}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]" data-testid="sort-select-trigger">
            <SelectValue placeholder="Sortuj według" />
          </SelectTrigger>
          <SelectContent data-testid="sort-select-content">
            <SelectItem value="created_at:desc">Najnowsze</SelectItem>
            <SelectItem value="created_at:asc">Najstarsze</SelectItem>
            <SelectItem value="front:asc">Przód (A-Z)</SelectItem>
            <SelectItem value="front:desc">Przód (Z-A)</SelectItem>
            <SelectItem value="back:asc">Tył (A-Z)</SelectItem>
            <SelectItem value="back:desc">Tył (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.source || "all"} onValueChange={handleSourceChange}>
          <SelectTrigger className="w-[180px]" data-testid="source-select-trigger">
            <SelectValue placeholder="Rodzaj fiszki" />
          </SelectTrigger>
          <SelectContent data-testid="source-select-content">
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="manual">Ręcznie utworzone</SelectItem>
            <SelectItem value="ai-full">AI (niezmienione)</SelectItem>
            <SelectItem value="ai-edited">AI (zmienione)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={resetFilters}
            title="Resetuj filtry"
            data-testid="reset-filters-button"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default memo(FlashcardFilterBar);
