# Komponenty widoku generowania fiszek

Ten katalog zawiera komponenty używane w widoku generowania fiszek z tekstu edukacyjnego przy pomocy AI.

## Struktura komponentów

```
GenerateView (główny komponent widoku)
│
├── TextInputForm (formularz wprowadzania tekstu)
│
├── LoadingIndicator (wskaźnik ładowania)
│
├── SkeletonLoader (placeholder podczas ładowania)
│
├── ErrorNotification (komunikaty o błędach)
│
├── SuccessNotification (komunikaty o sukcesie)
│
├── FlashcardList (lista wygenerowanych fiszek)
│   └── FlashcardItem (pojedyncza fiszka)
│
├── EditFlashcardModal (modal edycji fiszki)
│
└── BulkSaveButton (przyciski zapisu fiszek)
```

## Komponenty UI

Wszystkie podstawowe komponenty UI pochodzą z biblioteki Shadcn/ui i znajdują się w `src/components/ui`.

## Typy i modele

Typy wykorzystywane przez komponenty widoku generowania fiszek znajdują się w `src/types/viewModels.ts`.

## Zarządzanie stanem

Stan aplikacji jest zarządzany przez custom hook `useGenerateFlashcardsView` znajdujący się w `src/components/hooks/useGenerateFlashcardsView.tsx`.

## Endpointy API

Widok korzysta z następujących endpointów API:

- `POST /api/generations/generate` - Generowanie fiszek z tekstu
- `POST /api/generations/:id/accept-flashcards` - Zapisywanie zaakceptowanych fiszek

## Przepływ danych

1. Użytkownik wprowadza tekst edukacyjny w komponencie `TextInputForm`
2. Po kliknięciu "Generuj fiszki" wysyłane jest żądanie do API
3. Podczas generowania wyświetlany jest `LoadingIndicator` i `SkeletonLoader`
4. Po wygenerowaniu fiszek wyświetlana jest lista w komponencie `FlashcardList`
5. Użytkownik może akceptować, edytować lub odrzucać poszczególne fiszki
6. Po zakończeniu użytkownik może zapisać wszystkie lub tylko zaakceptowane fiszki
7. Wyniki zapisywania są wyświetlane w komunikacie sukcesu lub błędu

## Wykorzystanie

Komponent `GenerateView` jest używany na stronie `/generate` i nie wymaga przekazania żadnych propsów:

```tsx
// W pliku src/pages/generate.astro
import GenerateView from "../components/GenerateView";

// ...

<GenerateView client:load />;
```
