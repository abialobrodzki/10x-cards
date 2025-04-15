# Plan implementacji widoku Generowanie fiszek

## 1. Przegląd

Widok Generowanie fiszek umożliwia użytkownikowi wprowadzenie tekstu edukacyjnego (1000 - 10000 znaków) i poprzez API wykorzystanie AI do automatycznego wygenerowania propozycji fiszek. Użytkownik może przeglądać, akceptować, edytować lub odrzucać poszczególne propozycje fiszek, a następnie zapisać wybrane lub wszystkie do swojego zestawu.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/generate`.

**Uwaga:** Uwierzytelnianie i autoryzacja zostaną zaimplementowane w późniejszym etapie developmentu. Na potrzeby MVP, widok będzie dostępny bez konieczności logowania.

## 3. Struktura komponentów

```
GenerateView
│
├── TextInputForm
│   ├── TextArea
│   └── GenerateButton
│
├── LoadingIndicator
│
├── SkeletonLoader
│
├── ErrorNotification
│
├── SuccessNotification
│
├── FlashcardList
│   ├── FlashcardItem 1
│   │   ├── AcceptButton
│   │   ├── EditButton
│   │   └── RejectButton
│   │
│   ├── FlashcardItem 2
│   │   ├── ...
│   │
│   └── ...
│
├── EditFlashcardModal
│
└── BulkSaveButton
    ├── SaveAllButton
    └── SaveSelectedButton
```

## 4. Szczegóły komponentów

### GenerateView

- **Opis komponentu**: Główny komponent widoku, który łączy wszystkie pozostałe komponenty i zarządza przepływem danych oraz stanem całego procesu generowania fiszek.
- **Główne elementy**: Kontener zawierający TextInputForm, LoadingIndicator, SkeletonLoader, ErrorNotification, SuccessNotification, FlashcardList i BulkSaveButton. Zarządza stanem globalnym i komunikacją między komponentami.
- **Obsługiwane interakcje**: Koordynacja przepływu danych między komponentami, obsługa generowania fiszek i zapisywania wybranych fiszek.
- **Obsługiwana walidacja**: Delegacja walidacji do komponentów potomnych.
- **Typy**: Wykorzystuje GenerationViewModel i AcceptedFlashcardsViewModel.
- **Propsy**: Brak (komponent najwyższego poziomu).

### TextInputForm

- **Opis komponentu**: Formularz zawierający pole tekstowe do wprowadzania treści edukacyjnej oraz przycisk do generowania fiszek.
- **Główne elementy**: TextArea (pole tekstowe), GenerateButton (przycisk), komunikaty walidacyjne.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, walidacja tekstu podczas wpisywania, kliknięcie przycisku generowania.
- **Obsługiwana walidacja**:
  - Długość tekstu musi mieścić się w przedziale 1000-10000 znaków
  - Wyświetlanie licznika znaków
  - Dynamiczne komunikaty błędów (za krótki/za długi tekst)
- **Typy**: Wykorzystuje FormViewModel i GenerateFlashcardsRequestDto.
- **Propsy**:
  ```tsx
  interface TextInputFormProps {
    onSubmit: (text: string) => Promise<void>;
    isGenerating: boolean;
  }
  ```

### LoadingIndicator

- **Opis komponentu**: Komponent wyświetlający wskaźnik ładowania podczas generowania fiszek.
- **Główne elementy**: Animowany spinner lub pasek postępu.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak specjalnych typów.
- **Propsy**:
  ```tsx
  interface LoadingIndicatorProps {
    isVisible: boolean;
    message?: string;
  }
  ```

### SkeletonLoader

- **Opis komponentu**: Komponent wizualizujący ładowanie danych w formie szkieletu (skeleton) imitującego strukturę fiszek.
- **Główne elementy**: Szablon UI (skeleton) imitujący strukturę kart, które będą wyświetlone po załadowaniu danych.
- **Obsługiwane interakcje**: Brak interakcji użytkownika.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: Stateless component.
- **Propsy**:
  ```tsx
  interface SkeletonLoaderProps {
    isVisible: boolean;
    count?: number; // liczba placeholder'ów do wyświetlenia
    className?: string; // opcjonalne parametry stylizacyjne
  }
  ```

### ErrorNotification

- **Opis komponentu**: Komponent wyświetlający komunikaty o błędach, np. błędy API lub walidacji formularza.
- **Główne elementy**: Komunikat tekstowy, ikona błędu, opcjonalnie przycisk zamknięcia.
- **Obsługiwane interakcje**: Opcjonalnie możliwość zamknięcia powiadomienia.
- **Obsługiwana walidacja**: Przekazany komunikat nie powinien być pusty.
- **Typy**: String (wiadomość błędu).
- **Propsy**:
  ```tsx
  interface ErrorNotificationProps {
    message: string;
    type?: "error" | "warning" | "info"; // typ błędu
    isVisible: boolean;
    onClose?: () => void; // opcjonalna funkcja do zamykania powiadomienia
  }
  ```

### SuccessNotification

- **Opis komponentu**: Komponent wyświetlający komunikaty o sukcesie operacji, np. po zapisaniu fiszek.
- **Główne elementy**: Komunikat tekstowy, ikona sukcesu, opcjonalnie przycisk zamknięcia.
- **Obsługiwane interakcje**: Opcjonalnie możliwość zamknięcia powiadomienia, automatyczne zamknięcie po określonym czasie.
- **Obsługiwana walidacja**: Przekazany komunikat nie powinien być pusty.
- **Typy**: String (wiadomość sukcesu).
- **Propsy**:
  ```tsx
  interface SuccessNotificationProps {
    message: string;
    isVisible: boolean;
    autoHideDuration?: number; // czas w ms, po którym powiadomienie zostanie automatycznie ukryte
    onClose?: () => void; // opcjonalna funkcja do zamykania powiadomienia
  }
  ```

### FlashcardList

- **Opis komponentu**: Lista wyświetlająca wygenerowane propozycje fiszek.
- **Główne elementy**: Nagłówek listy, kontener z elementami FlashcardItem.
- **Obsługiwane interakcje**: Delegacja interakcji do komponentów FlashcardItem.
- **Obsługiwana walidacja**: Sprawdzanie czy lista zawiera elementy.
- **Typy**: Wykorzystuje tablicę FlashcardViewModel.
- **Propsy**:
  ```tsx
  interface FlashcardListProps {
    flashcards: FlashcardViewModel[];
    onAccept: (index: number) => void;
    onEdit: (index: number) => void;
    onReject: (index: number) => void;
  }
  ```

### FlashcardItem

- **Opis komponentu**: Komponent reprezentujący pojedynczą fiszkę z opcjami interakcji.
- **Główne elementy**: Pola wyświetlające front i tył fiszki, przyciski akcji (akceptuj, edytuj, odrzuć).
- **Obsługiwane interakcje**: Kliknięcia przycisków akcji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Wykorzystuje FlashcardViewModel.
- **Propsy**:
  ```tsx
  interface FlashcardItemProps {
    flashcard: FlashcardViewModel;
    index: number;
    onAccept: (index: number) => void;
    onEdit: (index: number) => void;
    onReject: (index: number) => void;
  }
  ```

### EditFlashcardModal

- **Opis komponentu**: Modal umożliwiający edycję treści fiszki.
- **Główne elementy**: Formularz z polami dla frontu i tyłu fiszki, przyciski zapisu i anulowania.
- **Obsługiwane interakcje**: Edycja tekstu, zapisanie zmian, anulowanie edycji.
- **Obsługiwana walidacja**:
  - Pola nie mogą być puste
  - Maksymalna długość pól
- **Typy**: Wykorzystuje FlashcardBaseData.
- **Propsy**:
  ```tsx
  interface EditFlashcardModalProps {
    isOpen: boolean;
    flashcard: FlashcardViewModel | null;
    onClose: () => void;
    onSave: (updatedFlashcard: FlashcardBaseData) => void;
  }
  ```

### BulkSaveButton

- **Opis komponentu**: Komponent zawierający przyciski umożliwiające zbiorczy zapis wszystkich wygenerowanych fiszek lub tylko tych, które zostały zaakceptowane.
- **Główne elementy**: Dwa przyciski - "Zapisz wszystkie" oraz "Zapisz wybrane".
- **Obsługiwane interakcje**: Kliknięcie przycisku "Zapisz wszystkie" lub "Zapisz wybrane", które wywołują odpowiednie funkcje wysyłające żądanie do API.
- **Obsługiwana walidacja**:
  - Przycisk "Zapisz wszystkie" jest aktywny tylko gdy istnieją wygenerowane fiszki
  - Przycisk "Zapisz wybrane" jest aktywny tylko gdy istnieje przynajmniej jedna zaakceptowana fiszka
- **Typy**: Wykorzystuje AcceptFlashcardsRequestDto.
- **Propsy**:
  ```tsx
  interface BulkSaveButtonProps {
    flashcards: FlashcardViewModel[];
    generationId: number | null;
    isSaving: boolean;
    onSaveAll: () => Promise<void>;
    onSaveSelected: () => Promise<void>;
  }
  ```

## 5. Typy

### FlashcardBaseData

```typescript
interface FlashcardBaseData {
  front: string;
  back: string;
}
```

### FlashcardViewModel

```typescript
interface FlashcardViewModel extends FlashcardBaseData {
  id?: number;
  isAccepted: boolean;
  isEdited: boolean;
  isRejected: boolean;
  originalData?: FlashcardBaseData; // Przechowuje oryginalne dane przed edycją
}
```

### GenerationViewModel

```typescript
interface GenerationViewModel {
  isGenerating: boolean;
  generationError: string | null;
  generationResult: GenerationWithFlashcardsResponseDto | null;
}
```

### FormViewModel

```typescript
interface FormViewModel {
  text: string;
  textError: string | null;
  isValid: boolean;
  isSubmitting: boolean;
  charactersCount: number;
}
```

### AcceptedFlashcardsViewModel

```typescript
interface AcceptedFlashcardsViewModel {
  flashcards: FlashcardViewModel[];
  canSave: boolean;
  canSaveAll: boolean;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  saveSuccessMessage: string | null;
}
```

### FlashcardMapperService

```typescript
// Funkcja do konwersji FlashcardViewModel na CreateFlashcardDto
function mapToCreateFlashcardDto(flashcard: FlashcardViewModel, generationId: number): CreateFlashcardDto {
  let source: FlashcardSourceType = "ai-full";

  // Jeśli fiszka została edytowana, ustawia źródło na ai-edited
  if (flashcard.isEdited) {
    source = "ai-edited";
  }

  return {
    front: flashcard.front,
    back: flashcard.back,
    source: source,
    generation_id: generationId,
  };
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem opierać się będzie na hookach Reacta - useState i useReducer. Ze względu na złożoność stanu, zostanie utworzony niestandardowy hook `useGenerateFlashcardsView`, który będzie zarządzał całym procesem generowania i zarządzania fiszkami.

### useGenerateFlashcardsView

```typescript
function useGenerateFlashcardsView() {
  // Stan generowania
  const [generationState, setGenerationState] = useState<GenerationViewModel>({
    isGenerating: false,
    generationError: null,
    generationResult: null,
  });

  // Stan fiszek
  const [flashcardsState, setFlashcardsState] = useState<FlashcardViewModel[]>([]);

  // Stan zapisywania
  const [savingState, setSavingState] = useState({
    isSaving: false,
    saveError: null,
    canSave: false,
    canSaveAll: false,
    saveSuccess: false,
    saveSuccessMessage: null,
  });

  // Funkcja do generowania fiszek
  const generateFlashcards = async (text: string) => {
    try {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: true,
        generationError: null,
      }));

      const response = await fetch("/api/generations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas generowania fiszek");
      }

      const result = await response.json();

      // Mapowanie otrzymanych fiszek na FlashcardViewModel
      const flashcards: FlashcardViewModel[] = result.flashcards.map((flashcard: any) => ({
        ...flashcard,
        isAccepted: false,
        isEdited: false,
        isRejected: false,
        originalData: { front: flashcard.front, back: flashcard.back },
      }));

      setFlashcardsState(flashcards);
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: false,
        generationResult: result,
      }));

      // Aktualizacja możliwości zapisu
      setSavingState((prev) => ({
        ...prev,
        canSaveAll: flashcards.length > 0,
        canSave: false,
      }));
    } catch (error) {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: false,
        generationError: error instanceof Error ? error.message : "Nieznany błąd",
      }));
    }
  };

  // Funkcje zarządzające fiszkami
  const acceptFlashcard = (index: number) => {
    setFlashcardsState((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isAccepted: true,
        isRejected: false,
      };
      return updated;
    });

    // Aktualizacja możliwości zapisu
    updateSaveState();
  };

  const editFlashcard = (index: number, updatedData: FlashcardBaseData) => {
    setFlashcardsState((prev) => {
      const updated = [...prev];
      const original = updated[index].originalData || {
        front: updated[index].front,
        back: updated[index].back,
      };

      // Porównanie czy dane zostały faktycznie zmienione
      const isEdited = original.front !== updatedData.front || original.back !== updatedData.back;

      updated[index] = {
        ...updated[index],
        ...updatedData,
        isEdited: isEdited,
        isAccepted: true, // Automatycznie akceptujemy edytowaną fiszkę
        isRejected: false,
      };

      return updated;
    });

    // Aktualizacja możliwości zapisu
    updateSaveState();
  };

  const rejectFlashcard = (index: number) => {
    setFlashcardsState((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isAccepted: false,
        isRejected: true,
      };
      return updated;
    });

    // Aktualizacja możliwości zapisu
    updateSaveState();
  };

  // Pomocnicza funkcja do aktualizacji stanu zapisywania
  const updateSaveState = () => {
    setSavingState((prev) => {
      // Sprawdzenie czy istnieje przynajmniej jedna zaakceptowana fiszka
      const hasAccepted = flashcardsState.some((f) => f.isAccepted);

      return {
        ...prev,
        canSave: hasAccepted,
        canSaveAll: flashcardsState.length > 0,
        saveSuccess: false,
        saveSuccessMessage: null,
      };
    });
  };

  // Funkcja do zapisywania zaakceptowanych fiszek
  const saveSelectedFlashcards = async () => {
    if (!generationState.generationResult?.generation.id) {
      return;
    }

    try {
      setSavingState((prev) => ({
        ...prev,
        isSaving: true,
        saveError: null,
        saveSuccess: false,
        saveSuccessMessage: null,
      }));

      // Filtracja tylko zaakceptowanych fiszek
      const acceptedFlashcards = flashcardsState.filter((f) => f.isAccepted);

      // Konwersja do formatu oczekiwanego przez API
      const flashcardsToSave = acceptedFlashcards.map((f) =>
        mapToCreateFlashcardDto(f, generationState.generationResult!.generation.id!)
      );

      const response = await fetch(
        `/api/generations/${generationState.generationResult.generation.id}/accept-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ flashcards: flashcardsToSave }),
        }
      );

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas zapisywania fiszek");
      }

      const result = await response.json();

      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveSuccess: true,
        saveSuccessMessage: `Zapisano ${acceptedFlashcards.length} zaakceptowanych fiszek`,
      }));

      // Opcjonalnie: przekierowanie lub inne działania po pomyślnym zapisie
    } catch (error) {
      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : "Nieznany błąd",
        saveSuccess: false,
        saveSuccessMessage: null,
      }));
    }
  };

  // Funkcja do zapisywania wszystkich fiszek
  const saveAllFlashcards = async () => {
    if (!generationState.generationResult?.generation.id) {
      return;
    }

    try {
      setSavingState((prev) => ({
        ...prev,
        isSaving: true,
        saveError: null,
        saveSuccess: false,
        saveSuccessMessage: null,
      }));

      // Automatycznie akceptujemy wszystkie fiszki przed zapisem
      setFlashcardsState((prev) => prev.map((f) => ({ ...f, isAccepted: true })));

      // Konwersja do formatu oczekiwanego przez API
      const flashcardsToSave = flashcardsState.map((f) =>
        mapToCreateFlashcardDto(f, generationState.generationResult!.generation.id!)
      );

      const response = await fetch(
        `/api/generations/${generationState.generationResult.generation.id}/accept-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ flashcards: flashcardsToSave }),
        }
      );

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas zapisywania fiszek");
      }

      const result = await response.json();

      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveSuccess: true,
        saveSuccessMessage: `Zapisano wszystkie ${flashcardsToSave.length} fiszki`,
      }));

      // Opcjonalnie: przekierowanie lub inne działania po pomyślnym zapisie
    } catch (error) {
      setSavingState((prev) => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : "Nieznany błąd",
        saveSuccess: false,
        saveSuccessMessage: null,
      }));
    }
  };

  return {
    generationState,
    flashcardsState,
    savingState,
    generateFlashcards,
    acceptFlashcard,
    editFlashcard,
    rejectFlashcard,
    saveSelectedFlashcards,
    saveAllFlashcards,
  };
}
```

## 7. Integracja API

### Generowanie fiszek

- **Endpoint**: POST /generations/generate
- **Żądanie**:
  ```typescript
  GenerateFlashcardsRequestDto {
    text: string; // tekst o długości 1000-10000 znaków
  }
  ```
- **Odpowiedź**:
  ```typescript
  GenerationWithFlashcardsResponseDto {
    generation: {
      id: number;
      generated_count: number;
      accepted_unedited_count: number;
      accepted_edited_count: number;
      created_at: string;
      updated_at: string;
      model: string;
    },
    flashcards: [
      {
        front: string;
        back: string;
        source: "ai-full";
      }
    ]
  }
  ```
- **Obsługa błędów**: 400 Bad Request (nieprawidłowa długość tekstu), 500 Internal Server Error

### Zapisywanie fiszek (zaakceptowanych lub wszystkich)

- **Endpoint**: POST /generations/{id}/accept-flashcards
- **Żądanie**:
  ```typescript
  AcceptFlashcardsRequestDto {
    flashcards: [
      {
        front: string;
        back: string;
        source: "ai-full" | "ai-edited";
        generation_id: number;
      }
    ]
  }
  ```
- **Odpowiedź**:
  ```typescript
  AcceptFlashcardsResponseDto {
    generation: {
      id: number;
      accepted_unedited_count: number;
      accepted_edited_count: number;
      updated_at: string;
    },
    flashcards: [
      {
        id: number;
        front: string;
        back: string;
        source: string;
        created_at: string;
      }
    ]
  }
  ```
- **Obsługa błędów**: 400 Bad Request, 404 Not Found, 500 Internal Server Error

## 8. Interakcje użytkownika

1. **Wprowadzanie tekstu**:

   - Użytkownik wpisuje tekst w pole formularza
   - System waliduje długość tekstu na bieżąco
   - Wyświetlany jest licznik znaków i komunikaty o błędach (jeśli występują)

2. **Generowanie fiszek**:

   - Użytkownik klika przycisk "Generuj fiszki"
   - System waliduje długość tekstu przed wysłaniem
   - Wyświetlany jest wskaźnik ładowania (LoadingIndicator) oraz szkielet przyszłych fiszek (SkeletonLoader)
   - W przypadku błędu wyświetlany jest komunikat błędu (ErrorNotification)
   - Po zakończeniu generowania wyświetlana jest lista propozycji fiszek

3. **Zarządzanie fiszkami**:

   - Użytkownik może akceptować fiszki (przycisk "Akceptuj")
   - Użytkownik może odrzucać fiszki (przycisk "Odrzuć")
   - Użytkownik może edytować fiszki (przycisk "Edytuj")
   - Po kliknięciu "Edytuj" otwiera się modal z formularzem edycji
   - W modalu edycji użytkownik może zmienić front i tył fiszki oraz zapisać zmiany
   - System automatycznie oznacza edytowaną fiszkę jako zaakceptowaną i zmienioną

4. **Zapisywanie fiszek**:
   - Użytkownik ma dwie opcje zapisu:
     - "Zapisz wszystkie" - zapisuje wszystkie wygenerowane fiszki
     - "Zapisz wybrane" - zapisuje tylko zaakceptowane fiszki
   - System weryfikuje czy są fiszki do zapisania
   - Wyświetlany jest wskaźnik ładowania podczas zapisywania
   - W przypadku błędu wyświetlany jest komunikat błędu (ErrorNotification)
   - Po pomyślnym zapisie wyświetlany jest komunikat sukcesu (SuccessNotification) z informacją o liczbie zapisanych fiszek

## 9. Warunki i walidacja

### Walidacja tekstu wejściowego

- **Warunek**: Tekst musi mieć między 1000 a 10000 znaków
- **Komponenty**: TextInputForm
- **Wpływ na interfejs**: Przycisk generowania jest nieaktywny dopóki tekst nie spełnia wymogów długości
- **Komunikaty**: "Tekst jest zbyt krótki. Minimum to 1000 znaków." lub "Tekst jest zbyt długi. Maksimum to 10000 znaków."

### Walidacja edycji fiszki

- **Warunek**: Pola frontu i tyłu fiszki nie mogą być puste
- **Komponenty**: EditFlashcardModal
- **Wpływ na interfejs**: Przycisk zapisywania zmian jest nieaktywny, gdy którekolwiek z pól jest puste
- **Komunikaty**: "Pole nie może być puste"

### Walidacja zapisywania zaakceptowanych fiszek

- **Warunek**: Musi być przynajmniej jedna zaakceptowana fiszka
- **Komponenty**: BulkSaveButton (przycisk "Zapisz wybrane")
- **Wpływ na interfejs**: Przycisk "Zapisz wybrane" jest nieaktywny, gdy nie ma zaakceptowanych fiszek
- **Komunikaty**: "Brak zaakceptowanych fiszek do zapisania"

### Walidacja zapisywania wszystkich fiszek

- **Warunek**: Musi istnieć przynajmniej jedna wygenerowana fiszka
- **Komponenty**: BulkSaveButton (przycisk "Zapisz wszystkie")
- **Wpływ na interfejs**: Przycisk "Zapisz wszystkie" jest nieaktywny, gdy nie ma wygenerowanych fiszek
- **Komunikaty**: "Brak fiszek do zapisania"

## 10. Obsługa błędów i komunikaty sukcesu

### Błędy podczas generowania fiszek

- **Scenariusz**: Błąd API podczas generowania (500 Internal Server Error)
- **Obsługa**: Wyświetlenie komunikatu o błędzie (ErrorNotification), możliwość ponownej próby
- **Komunikat**: "Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie później."

### Błędy podczas zapisywania fiszek

- **Scenariusz**: Błąd API podczas zapisywania fiszek
- **Obsługa**: Wyświetlenie komunikatu o błędzie (ErrorNotification), możliwość ponownej próby
- **Komunikat**: "Wystąpił błąd podczas zapisywania fiszek. Spróbuj ponownie później."

### Błędy walidacji

- **Scenariusz**: Próba generowania z tekstem o nieprawidłowej długości (400 Bad Request)
- **Obsługa**: Walidacja po stronie klienta przed wysłaniem, dodatkowa walidacja odpowiedzi z serwera
- **Komunikat**: "Tekst musi mieć między 1000 a 10000 znaków."

### Timeout połączenia

- **Scenariusz**: Zbyt długi czas generowania fiszek
- **Obsługa**: Wyświetlenie komunikatu o przekroczeniu czasu (ErrorNotification), możliwość ponownej próby
- **Komunikat**: "Upłynął limit czasu na wygenerowanie fiszek. Spróbuj ponownie."

### Komunikaty sukcesu

- **Scenariusz**: Pomyślne zapisanie wybranych fiszek
- **Obsługa**: Wyświetlenie komunikatu sukcesu (SuccessNotification) z automatycznym ukryciem po 5 sekundach
- **Komunikat**: "Zapisano X zaakceptowanych fiszek."

- **Scenariusz**: Pomyślne zapisanie wszystkich fiszek
- **Obsługa**: Wyświetlenie komunikatu sukcesu (SuccessNotification) z automatycznym ukryciem po 5 sekundach
- **Komunikat**: "Zapisano wszystkie X fiszki."

## 11. Kroki implementacji

1. **Konfiguracja projektu i routing**

   - Utworzenie pliku widoku w `src/pages/generate.astro`
   - Konfiguracja routingu

2. **Implementacja podstawowej struktury widoku**

   - Utworzenie komponentu głównego GenerateView
   - Implementacja podstawowego układu (layout)

3. **Implementacja komponentów pomocniczych**

   - Implementacja komponentu LoadingIndicator
   - Implementacja komponentu SkeletonLoader dla wyświetlania podczas ładowania
   - Implementacja komponentu ErrorNotification dla spójnego wyświetlania błędów
   - Implementacja komponentu SuccessNotification dla komunikatów o sukcesie

4. **Implementacja zarządzania stanem**

   - Implementacja hooka useGenerateFlashcardsView
   - Definicja modeli widoku oraz funkcji mapującej

5. **Implementacja komponentu TextInputForm**

   - Utworzenie formularza z polem tekstowym
   - Implementacja walidacji długości tekstu
   - Integracja z ErrorNotification dla wyświetlania błędów walidacji

6. **Implementacja integracji z API generowania fiszek**

   - Implementacja funkcji generowania fiszek
   - Obsługa wskaźnika ładowania (LoadingIndicator oraz SkeletonLoader)
   - Obsługa błędów API z wykorzystaniem ErrorNotification

7. **Implementacja komponentu FlashcardList i FlashcardItem**

   - Utworzenie listy do wyświetlania wygenerowanych fiszek
   - Implementacja funkcji zarządzania fiszkami (akceptacja, odrzucenie)

8. **Implementacja komponentu EditFlashcardModal**

   - Utworzenie formularza edycji fiszki
   - Implementacja walidacji
   - Dodanie logiki śledzenia zmian w stosunku do oryginalnej wersji

9. **Implementacja komponentu BulkSaveButton**

   - Utworzenie funkcji zapisywania zaakceptowanych i wszystkich fiszek
   - Implementacja walidacji dla obu przypadków
   - Implementacja dynamicznego ustawiania source na podstawie stanu edycji
   - Integracja z SuccessNotification dla wyświetlania komunikatów o sukcesie

10. **Integracja wszystkich komponentów**

    - Połączenie komponentów w spójny widok
    - Testy integracyjne

11. **Stylizacja**

    - Implementacja styli z wykorzystaniem Tailwind
    - Dostosowanie komponentów z biblioteki Shadcn/ui

12. **Testy i optymalizacja**

    - Testowanie scenariuszy użytkownika
    - Optymalizacja wydajności
    - Sprawdzenie dostępności - skupienie się na semantycznym HTML i ograniczenie użycia ARIA tylko do niezbędnych przypadków

13. **Finalizacja i dokumentacja**
    - Aktualizacja dokumentacji
    - Przegląd kodu
    - Wdrożenie
