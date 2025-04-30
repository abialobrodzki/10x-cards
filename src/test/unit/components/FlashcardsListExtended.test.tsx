import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FlashcardsList from "../../../components/flashcards/FlashcardsList";

describe("FlashcardsList Extended Tests", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockFlashcards = [
    {
      id: 1,
      front: "Front 1",
      back: "Back 1",
      source: "manual",
      created_at: "2023-01-01T12:00:00Z",
      updated_at: "2023-01-01T12:00:00Z",
      generation_id: null,
    },
    {
      id: 2,
      front: "Front 2",
      back: "Back 2",
      source: "manual",
      created_at: "2023-01-02T12:00:00Z",
      updated_at: "2023-01-02T12:00:00Z",
      generation_id: null,
    },
    {
      id: 3,
      front: "Front 3",
      back: "Back 3",
      source: "ai",
      created_at: "2023-01-03T12:00:00Z",
      updated_at: "2023-01-03T12:00:00Z",
      generation_id: null,
    },
  ];

  // Zaawansowane testy dla paginacji, filtrowania i różnych stanów

  describe("Loading State", () => {
    it("displays skeletons in grid mode while loading", async () => {
      const { container } = render(
        <FlashcardsList flashcards={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} isLoading={true} viewMode="grid" />
      );

      // Wyświetlamy strukturę DOM aby zweryfikować faktyczne klasy
      screen.debug();

      // Szukamy elementów Skeleton - prawdopodobnie mają klasę .skeleton
      // W rzeczywistości potrzebujemy sprawdzić, czy są renderowane jakieś elementy zastępcze
      const skeletonContainers = container.querySelectorAll(".h-\\[250px\\]");
      expect(skeletonContainers.length).toBeGreaterThan(0);
    });

    it("displays skeletons in list mode while loading", async () => {
      const { container } = render(
        <FlashcardsList flashcards={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} isLoading={true} viewMode="list" />
      );

      screen.debug();

      // Szukamy elementów Skeleton - potrzebujemy użyć odpowiednich selektorów
      const skeletonElements = container.querySelectorAll(".h-\\[150px\\]");
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("displays EmptyFlashcardsList when no flashcards and not loading", async () => {
      render(
        <FlashcardsList flashcards={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} isLoading={false} viewMode="grid" />
      );

      screen.debug();

      // Sprawdzamy, czy wyświetla się nagłówek pustej listy
      await waitFor(
        () => {
          const emptyHeader = screen.getByText(/brak fiszek/i) || screen.getByText(/nie masz jeszcze żadnych fiszek/i);
          expect(emptyHeader).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("displays different message when no flashcards due to filtering", async () => {
      render(
        <FlashcardsList
          flashcards={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isLoading={false}
          viewMode="grid"
          hasFilters={true}
        />
      );

      screen.debug();

      // Sprawdzamy nagłówek gdy brak wyników filtrowania
      await waitFor(
        () => {
          const noResultsHeader = screen.getByText(/brak pasujących fiszek/i);
          expect(noResultsHeader).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("calls onEdit with -1 when create new flashcard button is clicked", async () => {
      render(
        <FlashcardsList flashcards={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} isLoading={false} viewMode="grid" />
      );

      screen.debug();

      // Znajdujemy przycisk tworzenia nowej fiszki i klikamy go
      await waitFor(
        () => {
          // Spróbujmy znaleźć przycisk na różne sposoby
          const createButton = screen.getByRole("button", { name: /utwórz/i }) || screen.getByText(/utwórz now/i);
          fireEvent.click(createButton);
        },
        { timeout: 3000 }
      );

      expect(mockOnEdit).toHaveBeenCalledWith(-1);
    });
  });

  describe("Grid View Mode", () => {
    it("renders flashcards in grid layout", async () => {
      const { container } = render(
        <FlashcardsList
          flashcards={mockFlashcards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isLoading={false}
          viewMode="grid"
        />
      );

      screen.debug();

      // Sprawdzamy, czy grid jest renderowany prawidłowo
      await waitFor(
        () => {
          const gridContainer = container.querySelector(".grid");
          expect(gridContainer).toBeInTheDocument();

          // Sprawdzamy, czy wszystkie fiszki są renderowane
          mockFlashcards.forEach((flashcard) => {
            const frontContent = screen.getByText(flashcard.front);
            expect(frontContent).toBeInTheDocument();
          });
        },
        { timeout: 3000 }
      );
    });

    it("calls onEdit with correct flashcard id when edit button is clicked", async () => {
      const { container } = render(
        <FlashcardsList
          flashcards={mockFlashcards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isLoading={false}
          viewMode="grid"
        />
      );

      screen.debug();

      // Wyszukujemy przyciski edycji
      await waitFor(
        async () => {
          // Próbujmy znaleźć przycisk edycji według różnych atrybutów
          const editButtons =
            (await screen.findAllByTitle(/edytuj/i)) ||
            (await screen.findAllByLabelText(/edytuj/i)) ||
            container.querySelectorAll("[aria-label*='edytuj' i]");

          // Klikamy pierwszy przycisk edycji
          if (editButtons.length > 0) {
            fireEvent.click(editButtons[0]);
          }
        },
        { timeout: 3000 }
      );

      expect(mockOnEdit).toHaveBeenCalledWith(mockFlashcards[0].id);
    });

    it("calls onDelete with correct flashcard id when delete button is clicked", async () => {
      const { container } = render(
        <FlashcardsList
          flashcards={mockFlashcards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isLoading={false}
          viewMode="grid"
        />
      );

      screen.debug();

      // Wyszukujemy przyciski usuwania
      await waitFor(
        async () => {
          // Próbujmy znaleźć przycisk usuwania według różnych atrybutów
          const deleteButtons =
            (await screen.findAllByTitle(/usuń/i)) ||
            (await screen.findAllByLabelText(/usuń/i)) ||
            container.querySelectorAll("[aria-label*='usuń' i]");

          // Klikamy drugi przycisk usuwania
          if (deleteButtons.length > 1) {
            fireEvent.click(deleteButtons[1]);
          }
        },
        { timeout: 3000 }
      );

      expect(mockOnDelete).toHaveBeenCalledWith(mockFlashcards[1].id);
    });
  });

  describe("List View Mode", () => {
    it("renders flashcards in list layout", async () => {
      const { container } = render(
        <FlashcardsList
          flashcards={mockFlashcards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isLoading={false}
          viewMode="list"
        />
      );

      screen.debug();

      // Sprawdzamy, czy lista jest renderowana prawidłowo
      await waitFor(
        () => {
          // Sprawdzamy, czy istnieje kontener listy
          const listContainer = container.querySelector(".space-y-4");
          expect(listContainer).toBeInTheDocument();

          // Sprawdzamy, czy wszystkie fiszki są renderowane
          mockFlashcards.forEach((flashcard) => {
            const frontContent = screen.getByText(flashcard.front);
            expect(frontContent).toBeInTheDocument();
          });
        },
        { timeout: 3000 }
      );
    });
  });
});
