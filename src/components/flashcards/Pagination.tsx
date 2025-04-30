import { memo, useMemo } from "react";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaginationProps } from "./types";

const Pagination = ({ currentPage, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) => {
  // Obliczamy całkowitą liczbę stron
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Generujemy tablicę numerów stron do wyświetlenia
  const pageNumbers = useMemo(() => {
    // Dla małej liczby stron pokazujemy wszystkie
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Dla większej liczby stron pokazujemy: 1, ..., current-1, current, current+1, ..., totalPages
    const pages = [1];

    if (currentPage > 3) {
      pages.push(-1); // Ellipsis
    }

    // Strony wokół obecnej
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push(-2); // Ellipsis
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  // Obliczenie zakresu wyświetlanych elementów
  const firstItemIndex = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const lastItemIndex = Math.min(currentPage * pageSize, totalItems);
  const itemsCountDisplay = useMemo(() => {
    return `${firstItemIndex}-${lastItemIndex} z ${totalItems}`;
  }, [firstItemIndex, lastItemIndex, totalItems]);

  // Jeśli jest tylko jedna strona, nie pokazujemy paginacji
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Elementy na stronie:</span>
        <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="w-[70px]" data-testid="page-size-select-trigger">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent data-testid="page-size-select-content">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center">
        <span className="text-sm text-muted-foreground mr-4" data-testid="items-count-display">
          {itemsCountDisplay}
        </span>

        <PaginationRoot>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                data-testid="previous-page-button"
              />
            </PaginationItem>

            {pageNumbers.map((pageNumber, index) => {
              if (pageNumber < 0) {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(pageNumber);
                    }}
                    isActive={pageNumber === currentPage}
                    data-testid={`page-link-${pageNumber}`}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                data-testid="next-page-button"
              />
            </PaginationItem>
          </PaginationContent>
        </PaginationRoot>
      </div>
    </div>
  );
};

export default memo(Pagination);
