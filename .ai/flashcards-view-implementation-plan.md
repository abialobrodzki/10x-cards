# Plan implementacji widoku zarządzania fiszkami

## 1. Przegląd

Widok zarządzania fiszkami umożliwia użytkownikom przeglądanie, tworzenie, edytowanie oraz usuwanie fiszek edukacyjnych. Jest to kluczowy element aplikacji 10x-cards, pozwalający na efektywne zarządzanie materiałami do nauki.

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką `/flashcards`.

## 3. Struktura komponentów

```
FlashcardsPage
├── FlashcardFilterBar
├── CreateFlashcardButton
├── FlashcardsList
│   ├── FlashcardItem
│   │   ├── EditButton (wywołuje FlashcardFormModal)
│   │   └── DeleteButton (wywołuje DeleteConfirmationDialog)
├── Pagination
├── FlashcardFormModal (renderowany warunkowo)
└── DeleteConfirmationDialog (renderowany warunkowo)
```

## 4. Szczegóły komponentów

### FlashcardsPage

- Opis komponentu: Główny komponent widoku zarządzania fiszkami, który zarządza całym stanem i logiką widoku.
- Główne elementy: Container, nagłówek strony, komponenty filtrów, lista fiszek, paginacja, modalne okna.
- Obsługiwane interakcje: Inicjalizacja ładowania fiszek, obsługa stanu modalnych okien.
- Obsługiwana walidacja: Sprawdzanie poprawności parametrów filtrowania i paginacji.
- Typy: FlashcardsPageViewModel, FlashcardFilters
- Propsy: brak (komponent najwyższego poziomu)

### FlashcardFilterBar

- Opis komponentu: Komponent umożliwiający filtrowanie i sortowanie listy fiszek.
- Główne elementy: Select do sortowania, select do filtrowania po źródle, input do filtrowania po tekście.
- Obsługiwane interakcje: Zmiana opcji sortowania, zmiana filtrów, resetowanie filtrów.
- Obsługiwana walidacja: Poprawność wartości filtrów.
- Typy: FlashcardFilters
- Propsy:
  - filters: FlashcardFilters
  - onFilterChange: (filters: Partial<FlashcardFilters>) => void

### CreateFlashcardButton

- Opis komponentu: Przycisk otwierający modal do tworzenia nowej fiszki.
- Główne elementy: Button z ikoną dodawania.
- Obsługiwane interakcje: Kliknięcie (otwarcie modala tworzenia).
- Obsługiwana walidacja: brak
- Typy: brak
- Propsy:
  - onClick: () => void

### FlashcardsList

- Opis komponentu: Lista wyświetlająca wszystkie fiszki użytkownika.
- Główne elementy: Container, lista elementów FlashcardItem.
- Obsługiwane interakcje: Renderowanie listy fiszek.
- Obsługiwana walidacja: brak
- Typy: FlashcardDto[]
- Propsy:
  - flashcards: FlashcardDto[]
  - onEdit: (id: number) => void
  - onDelete: (id: number) => void
  - isLoading: boolean

### FlashcardItem

- Opis komponentu: Pojedyncza fiszka wyświetlana na liście.
- Główne elementy: Card z przednią i tylną stroną fiszki, przyciski akcji.
- Obsługiwane interakcje: Kliknięcie przycisków edycji i usuwania.
- Obsługiwana walidacja: brak
- Typy: FlashcardDto
- Propsy:
  - flashcard: FlashcardDto
  - onEdit: () => void
  - onDelete: () => void

### FlashcardFormModal

- Opis komponentu: Modal z formularzem do tworzenia/edycji fiszki.
- Główne elementy: Modal, formularz z polami na przód i tył fiszki, przyciski akcji.
- Obsługiwane interakcje: Wypełnianie formularza, zapisywanie, anulowanie.
- Obsługiwana walidacja:
  - Przód fiszki: min. 3, max. 500 znaków
  - Tył fiszki: min. 3, max. 500 znaków
- Typy: FlashcardFormValues, CreateFlashcardDto lub UpdateFlashcardDto
- Propsy:
  - isOpen: boolean
  - onClose: () => void
  - flashcard?: FlashcardDto
  - onSubmit: (values: FlashcardFormValues) => Promise<void>
  - isSubmitting: boolean

### DeleteConfirmationDialog

- Opis komponentu: Dialog potwierdzający usunięcie fiszki.
- Główne elementy: Dialog, tekst potwierdzenia, przyciski akcji.
- Obsługiwane interakcje: Potwierdzenie lub anulowanie usunięcia.
- Obsługiwana walidacja: brak
- Typy: brak
- Propsy:
  - isOpen: boolean
  - onClose: () => void
  - onConfirm: () => Promise<void>
  - isDeleting: boolean
  - flashcardFront: string

### Pagination

- Opis komponentu: Komponent paginacji listy fiszek.
- Główne elementy: Przyciski nawigacji, wybór ilości elementów na stronę.
- Obsługiwane interakcje: Zmiana strony, zmiana ilości elementów na stronę.
- Obsługiwana walidacja: Poprawność numerów stron.
- Typy: PaginationParams
- Propsy:
  - currentPage: number
  - pageSize: number
  - totalItems: number
  - onPageChange: (page: number) => void
  - onPageSizeChange: (pageSize: number) => void

## 5. Typy

### Typy z API (istniejące)

```typescript
// Źródło fiszki
type FlashcardSourceType = "ai-full" | "ai-edited" | "manual";

// DTO fiszki z API
interface FlashcardDto {
  id: number;
  front: string;
  back: string;
  source: FlashcardSourceType;
  created_at: string;
  updated_at: string;
  generation_id?: number | null;
}

// Odpowiedź z listą fiszek
interface FlashcardListResponseDto {
  flashcards: FlashcardDto[];
  total: number;
}

// DTO do tworzenia fiszki
interface CreateFlashcardDto {
  front: string;
  back: string;
  source: FlashcardSourceType;
  generation_id?: number | null;
}

// DTO do aktualizacji fiszki
type UpdateFlashcardDto = Partial<CreateFlashcardDto>;

// Parametry filtrowania fiszek
interface FlashcardFilterParams {
  page?: number;
  page_size?: number;
  sort_by?: keyof FlashcardDto;
  generation_id?: number;
  source?: FlashcardSourceType;
}
```

### Nowe typy (do utworzenia)

```typescript
// Wartości formularza fiszki
interface FlashcardFormValues {
  front: string;
  back: string;
  source: FlashcardSourceType;
  generation_id?: number | null;
}

// Rozszerzone filtry dla UI
interface FlashcardFilters extends FlashcardFilterParams {
  sortOrder: "asc" | "desc";
  searchText?: string;
}

// ViewModel dla strony z fiszkami
interface FlashcardsPageViewModel {
  flashcards: FlashcardDto[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: FlashcardFilters;
  isCreating: boolean;
  editingFlashcardId: number | null;
  deletingFlashcardId: number | null;
}
```

## 6. Zarządzanie stanem

Dla efektywnego zarządzania stanem widoku rekomendujemy utworzenie customowego hooka:

```typescript
function useFlashcardsManager() {
  // Stan fiszek
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stan filtrów
  const [filters, setFilters] = useState<FlashcardFilters>({
    page: 1,
    page_size: 20,
    sort_by: "created_at",
    sortOrder: "desc",
  });

  // Stan UI modali
  const [isCreating, setIsCreating] = useState(false);
  const [editingFlashcardId, setEditingFlashcardId] = useState<number | null>(null);
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<number | null>(null);

  // Funkcje zarządzające stanem fiszek i wykonujące operacje API...

  return {
    flashcards,
    totalCount,
    isLoading,
    error,
    filters,
    isCreating,
    editingFlashcardId,
    deletingFlashcardId,
    setFilters,
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
  };
}
```

Hook zarządza całym stanem widoku, w tym:

- Pobieraniem, filtrowaniem i paginacją fiszek
- Tworzeniem, edycją i usuwaniem fiszek
- Zarządzaniem stanem modali i dialogów
- Obsługą błędów

## 7. Integracja API

### Pobieranie listy fiszek

```typescript
async function fetchFlashcards(filters: FlashcardFilters) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.page_size) params.append("page_size", filters.page_size.toString());
  if (filters.sort_by) params.append("sort_by", filters.sort_by.toString());
  if (filters.generation_id) params.append("generation_id", filters.generation_id.toString());
  if (filters.source) params.append("source", filters.source);

  try {
    const response = await fetch(`/api/flashcards?${params}`);
    if (!response.ok) throw new Error("Failed to fetch flashcards");
    return (await response.json()) as FlashcardListResponseDto;
  } catch (error) {
    throw new Error(`Error fetching flashcards: ${error}`);
  }
}
```

### Tworzenie fiszki

```typescript
async function createFlashcard(flashcard: CreateFlashcardDto) {
  try {
    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flashcard),
    });
    if (!response.ok) throw new Error("Failed to create flashcard");
    return (await response.json()) as FlashcardDto;
  } catch (error) {
    throw new Error(`Error creating flashcard: ${error}`);
  }
}
```

### Aktualizacja fiszki

```typescript
async function updateFlashcard(id: number, flashcard: UpdateFlashcardDto) {
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flashcard),
    });
    if (!response.ok) throw new Error("Failed to update flashcard");
    return (await response.json()) as FlashcardDto;
  } catch (error) {
    throw new Error(`Error updating flashcard: ${error}`);
  }
}
```

### Usuwanie fiszki

```typescript
async function deleteFlashcard(id: number) {
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete flashcard");
    return true;
  } catch (error) {
    throw new Error(`Error deleting flashcard: ${error}`);
  }
}
```

## 8. Interakcje użytkownika

1. **Przeglądanie listy fiszek**

   - Użytkownik wchodzi na stronę `/flashcards`
   - System wyświetla paginowaną listę fiszek
   - Użytkownik może przewijać strony za pomocą paginacji

2. **Filtrowanie i sortowanie**

   - Użytkownik wybiera opcje filtrowania/sortowania z FlashcardFilterBar
   - System aktualizuje listę fiszek zgodnie z wybranymi filtrami

3. **Tworzenie nowej fiszki**

   - Użytkownik klika przycisk "Dodaj fiszkę"
   - System wyświetla modal z pustym formularzem
   - Użytkownik wypełnia pola formularza i klika "Zapisz"
   - System tworzy nową fiszkę, zamyka modal i odświeża listę

4. **Edycja fiszki**

   - Użytkownik klika przycisk edycji przy fiszce
   - System wyświetla modal z wypełnionym formularzem
   - Użytkownik modyfikuje pola i klika "Zapisz"
   - System aktualizuje fiszkę, zamyka modal i odświeża listę

5. **Usuwanie fiszki**
   - Użytkownik klika przycisk usunięcia przy fiszce
   - System wyświetla dialog potwierdzenia
   - Użytkownik potwierdza usunięcie
   - System usuwa fiszkę i odświeża listę

## 9. Warunki i walidacja

### Walidacja formularza fiszki

- **Przód fiszki**:

  - Wymagane pole (nie może być puste)
  - Minimum 3 znaki
  - Maksimum 500 znaków
  - Walidacja w czasie rzeczywistym podczas wpisywania

- **Tył fiszki**:

  - Wymagane pole (nie może być puste)
  - Minimum 3 znaki
  - Maksimum 500 znaków
  - Walidacja w czasie rzeczywistym podczas wpisywania

- **Źródło**:
  - Domyślnie "manual" przy ręcznym tworzeniu
  - Zachowanie oryginalnej wartości przy edycji

### Walidacja parametrów filtrowania

- **Strona**:

  - Liczba całkowita dodatnia
  - Domyślnie 1

- **Elementy na stronę**:

  - Liczba całkowita dodatnia
  - Maksymalnie 100
  - Domyślnie 20

- **Sortowanie**:
  - Tylko dozwolone pola (created_at, updated_at, front, back)
  - Domyślnie created_at

## 10. Obsługa błędów

### Błędy podczas ładowania danych

- Wyświetlenie komunikatu o błędzie w miejscu listy
- Przycisk "Spróbuj ponownie" do ponownego załadowania

### Błędy podczas operacji na fiszkach

- Tworzenie: Wyświetlenie komunikatu o błędzie w modalu, zachowanie wartości formularza
- Edycja: Wyświetlenie komunikatu o błędzie w modalu, zachowanie wartości formularza
- Usuwanie: Wyświetlenie komunikatu o błędzie, możliwość ponownej próby

### Błędy autoryzacji

- Przekierowanie do strony logowania z komunikatem o wygaśnięciu sesji

### Błędy walidacji

- Wyświetlenie komunikatu błędu pod odpowiednim polem formularza
- Zablokowanie przycisku "Zapisz" do czasu poprawienia błędów

## 11. Kroki implementacji

1. **Przygotowanie podstawowej struktury**

   - Utworzenie pliku strony w `src/pages/flashcards.astro`
   - Stworzenie podstawowej struktury komponentów React w `src/components`

2. **Implementacja typów**

   - Utworzenie nowych typów wymienionych w sekcji "Typy"

3. **Implementacja hooka useFlashcardsManager**

   - Implementacja funkcji zarządzających stanem i operacjami API

4. **Implementacja komponentów UI**

   - Implementacja FlashcardsPage
   - Implementacja FlashcardFilterBar
   - Implementacja FlashcardsList i FlashcardItem
   - Implementacja komponentu Pagination

5. **Implementacja modali i dialogów**

   - Implementacja FlashcardFormModal
   - Implementacja DeleteConfirmationDialog

6. **Integracja z API**

   - Implementacja funkcji do komunikacji z endpointami API

7. **Walidacja i obsługa błędów**

   - Implementacja walidacji formularza
   - Implementacja obsługi błędów API

8. **Testowanie**

   - Testowanie wszystkich funkcjonalności
   - Testowanie walidacji i obsługi błędów
   - Testowanie responsywności i dostępności

9. **Optymalizacja wydajności**

   - Optymalizacja renderowania listy
   - Implementacja opóźnionego wyszukiwania (debouncing)

10. **Finalizacja**
    - Dodanie ostatecznych stylów
    - Refaktoryzacja kodu
    - Dokumentacja komponentów
