# API Endpoint Implementation Plan: Flashcards

## GET /flashcards

### 1. Przegląd punktu końcowego

Endpoint GET /flashcards umożliwia pobranie paginowanej listy fiszek użytkownika. Wspiera parametry sortowania, filtrowania oraz paginacji, zwracając tylko fiszki należące do zalogowanego użytkownika.

### 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/flashcards`
- **Parametry:**
  - **Opcjonalne:**
    - `page` (number) - numer strony wyników
    - `page_size` (number) - ilość wyników na stronę
    - `sort_by` (string) - pole do sortowania (np. created_at)
    - `generation_id` (number) - filtrowanie po ID generacji
    - `source` (string) - filtrowanie po źródle (ai-full, ai-edited, manual)

### 3. Wykorzystywane typy

- **Z src/types.ts:**
  - `FlashcardDto` - reprezentacja fiszki w odpowiedzi
  - `FlashcardListResponseDto` - struktura całej odpowiedzi
  - `FlashcardFilterParams` - parametry filtrowania
  - `PaginationParams` - parametry paginacji
  - `ValidationErrorResponseDto` - struktura błędu walidacji
  - `AuthErrorResponseDto` - struktura błędu autoryzacji
  - `InternalErrorResponseDto` - struktura błędu wewnętrznego

### 4. Szczegóły odpowiedzi

- **Struktura odpowiedzi:**
  ```json
  {
    "flashcards": [
      {
        "id": 1,
        "front": "string",
        "back": "string",
        "source": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "generation_id": "number"
      }
    ],
    "total": number
  }
  ```
- **Kody statusu:**
  - 200 OK - Pomyślne pobranie danych
  - 400 Bad Request - Nieprawidłowe parametry
  - 401 Unauthorized - Brak autoryzacji
  - 500 Internal Server Error - Błąd po stronie serwera

### 5. Przepływ danych

1. Walidacja parametrów zapytania przy użyciu Zod
2. Pobranie ID użytkownika z kontekstu Astro
3. Budowa zapytania Supabase z uwzględnieniem filtrów i parametrów paginacji
4. Wykonanie zapytania do bazy danych z Supabase
5. Przekształcenie wyników do odpowiedniego formatu DTO
6. Zwrócenie odpowiedzi z danymi i całkowitą liczbą wyników

### 6. Względy bezpieczeństwa

- Wykorzystanie mechanizmu Row Level Security (RLS) w Supabase do zapewnienia, że użytkownik może zobaczyć tylko swoje fiszki
- Weryfikacja autoryzacji przy pomocy Astro middleware
- Zabezpieczenie przed atakami SQL Injection przez użycie parametryzowanych zapytań Supabase
- Walidacja i sanityzacja parametrów zapytania
- Unikanie ujawniania szczegółów technicznych w komunikatach błędów

### 7. Obsługa błędów

- **Nieprawidłowe parametry:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Brak autoryzacji:** Zwrócenie AuthErrorResponseDto z kodem 401
- **Błąd bazy danych:** Logowanie błędu, zwrócenie InternalErrorResponseDto z kodem 500
- Obsługa błędów od początku funkcji, zgodnie z wytycznymi clean code
- Korzystanie z wczesnych zwrotów dla warunków błędu

### 8. Rozważania dotyczące wydajności

- Wykorzystanie indeksów w tabeli flashcards (user_id, created_at, generation_id)
- Implementacja paginacji dla ograniczenia ilości zwracanych danych
- Dodanie limitu liczby wyników na stronę (domyślnie i maksymalnie)
- Selekcja tylko niezbędnych kolumn w zapytaniu
- Rozważenie użycia cache'owania dla często używanych filtrów

### 9. Przykładowa implementacja

```typescript
// Implementacja w /src/pages/api/flashcards.ts

import { z } from "zod";
import type { APIContext } from "astro";
import {
  type FlashcardFilterParams,
  type FlashcardListResponseDto,
  type ValidationErrorResponseDto,
} from "../../types";
import { getFlashcardsService } from "../../lib/services/flashcard.service";

export const prerender = false;

// Schemat walidacji parametrów
const QueryParamsSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  page_size: z.coerce.number().positive().max(100).optional().default(20),
  sort_by: z.enum(["created_at", "updated_at", "front", "back"]).optional().default("created_at"),
  generation_id: z.coerce.number().positive().optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
});

export async function GET({ request, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametrów
    const url = new URL(request.url);
    const queryParamsResult = QueryParamsSchema.safeParse(Object.fromEntries(url.searchParams));

    if (!queryParamsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid query parameters",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobieranie danych
    const params: FlashcardFilterParams = queryParamsResult.data;
    const response = await getFlashcardsService(locals.supabase, locals.user.id, params);

    // Zwracanie odpowiedzi
    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

## GET /flashcards/{id}

### 1. Przegląd punktu końcowego

Endpoint GET /flashcards/{id} umożliwia pobranie szczegółów konkretnej fiszki na podstawie jej identyfikatora. Zwraca szczegółowe dane fiszki należącej do zalogowanego użytkownika.

### 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/flashcards/{id}`
- **Parametry URL:**
  - **Wymagane:**
    - `id` (number) - identyfikator fiszki

### 3. Wykorzystywane typy

- **Z src/types.ts:**
  - `FlashcardDto` - reprezentacja fiszki w odpowiedzi
  - `NotFoundErrorResponseDto` - struktura błędu "nie znaleziono"
  - `AuthErrorResponseDto` - struktura błędu autoryzacji
  - `InternalErrorResponseDto` - struktura błędu wewnętrznego

### 4. Szczegóły odpowiedzi

- **Struktura odpowiedzi:**
  ```json
  {
    "id": 1,
    "front": "string",
    "back": "string",
    "source": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "generation_id": "number"
  }
  ```
- **Kody statusu:**
  - 200 OK - Pomyślne pobranie danych
  - 401 Unauthorized - Brak autoryzacji
  - 404 Not Found - Fiszka nie istnieje
  - 500 Internal Server Error - Błąd po stronie serwera

### 5. Przepływ danych

1. Pobranie ID fiszki z parametrów URL
2. Pobranie ID użytkownika z kontekstu Astro
3. Walidacja ID fiszki
4. Wykonanie zapytania do bazy danych Supabase
5. Sprawdzenie czy fiszka istnieje i należy do zalogowanego użytkownika
6. Przekształcenie wyniku do odpowiedniego formatu DTO
7. Zwrócenie odpowiedzi z danymi

### 6. Względy bezpieczeństwa

- Wykorzystanie mechanizmu Row Level Security (RLS) w Supabase
- Weryfikacja autoryzacji przy pomocy Astro middleware
- Sprawdzenie czy użytkownik ma dostęp do żądanej fiszki
- Unikanie ujawniania szczegółów technicznych w komunikatach błędów

### 7. Obsługa błędów

- **Nieprawidłowe ID:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Fiszka nie istnieje:** Zwrócenie NotFoundErrorResponseDto z kodem 404
- **Brak autoryzacji:** Zwrócenie AuthErrorResponseDto z kodem 401
- **Błąd bazy danych:** Logowanie błędu, zwrócenie InternalErrorResponseDto z kodem 500

### 8. Przykładowa implementacja

```typescript
// Implementacja w /src/pages/api/flashcards/[id].ts

import { z } from "zod";
import type { APIContext } from "astro";
import type { FlashcardDto, NotFoundErrorResponseDto, ValidationErrorResponseDto } from "../../../types";
import { getFlashcardByIdService } from "../../../lib/services/flashcard.service";

export const prerender = false;

// Schemat walidacji parametrów
const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

export async function GET({ params, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametrów
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobieranie danych
    const flashcard = await getFlashcardByIdService(locals.supabase, locals.user.id, paramsResult.data.id);

    if (!flashcard) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwracanie odpowiedzi
    return new Response(JSON.stringify(flashcard), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error fetching flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

## POST /flashcards

### 1. Przegląd punktu końcowego

Endpoint POST /flashcards umożliwia tworzenie jednej lub wielu fiszek. Może być używany zarówno do ręcznego tworzenia fiszek, jak i dodawania fiszek wygenerowanych przez AI (zarówno bez zmian, jak i po edycji).

### 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/flashcards`
- **Nagłówki:**
  - `Content-Type: application/json`
- **Struktura ciała żądania:**
  - **Wariant 1 (pojedyncza fiszka):**
    ```json
    {
      "front": "string",
      "back": "string",
      "source": "string",
      "generation_id": "number (opcjonalnie)"
    }
    ```
  - **Wariant 2 (wiele fiszek):**
    ```json
    {
      "flashcards": [
        {
          "front": "string",
          "back": "string",
          "source": "string",
          "generation_id": "number (opcjonalnie)"
        }
      ]
    }
    ```

### 3. Wykorzystywane typy

- **Z src/types.ts:**
  - `CreateFlashcardDto` - model dla pojedynczej fiszki do utworzenia
  - `CreateFlashcardsDto` - model dla wielu fiszek do utworzenia
  - `FlashcardDto` - reprezentacja fiszki w odpowiedzi
  - `ValidationErrorResponseDto` - struktura błędu walidacji
  - `AuthErrorResponseDto` - struktura błędu autoryzacji
  - `InternalErrorResponseDto` - struktura błędu wewnętrznego

### 4. Szczegóły odpowiedzi

- **Wariant 1 (pojedyncza fiszka):**
  ```json
  {
    "id": 1,
    "front": "string",
    "back": "string",
    "source": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "generation_id": "number"
  }
  ```
- **Wariant 2 (wiele fiszek):**
  ```json
  [
    {
      "id": 1,
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "generation_id": "number"
    }
  ]
  ```
- **Kody statusu:**
  - 201 Created - Pomyślne utworzenie fiszek
  - 400 Bad Request - Nieprawidłowe dane
  - 401 Unauthorized - Brak autoryzacji
  - 500 Internal Server Error - Błąd po stronie serwera

### 5. Przepływ danych

1. Walidacja ciała żądania przy użyciu Zod
2. Pobranie ID użytkownika z kontekstu Astro
3. Wykrycie czy żądanie dotyczy pojedynczej fiszki czy wielu fiszek
4. Przygotowanie danych do zapisu z dodaniem user_id
5. Wykonanie zapytania INSERT do bazy danych Supabase
6. Przekształcenie wyników do odpowiedniego formatu DTO
7. Zwrócenie odpowiedzi z danymi utworzonych fiszek

### 6. Względy bezpieczeństwa

- Weryfikacja autoryzacji przy pomocy Astro middleware
- Dokładna walidacja danych wejściowych (długość pól front/back, dozwolone wartości pola source)
- Zabezpieczenie przed atakami SQL Injection przez użycie parametryzowanych zapytań Supabase
- Walidacja, że generation_id (jeśli podany) istnieje i należy do danego użytkownika

### 7. Obsługa błędów

- **Nieprawidłowe dane:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Brak autoryzacji:** Zwrócenie AuthErrorResponseDto z kodem 401
- **Nieistniejący generation_id:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Błąd bazy danych:** Logowanie błędu, zwrócenie InternalErrorResponseDto z kodem 500

### 8. Przykładowa implementacja

```typescript
// Implementacja w /src/pages/api/flashcards.ts

import { z } from "zod";
import type { APIContext } from "astro";
import type { CreateFlashcardDto, CreateFlashcardsDto, ValidationErrorResponseDto } from "../../types";
import { createFlashcardService, createFlashcardsService } from "../../lib/services/flashcard.service";

export const prerender = false;

// Schemat walidacji dla pojedynczej fiszki
const FlashcardSchema = z.object({
  front: z.string().min(3).max(500),
  back: z.string().min(3).max(500),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.number().positive().optional(),
});

// Schemat walidacji dla wielu fiszek
const FlashcardsSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1),
});

export async function POST({ request, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parsowanie ciała żądania
    const body = await request.json();

    // Sprawdzenie czy to jest pojedyncza fiszka czy tablica fiszek
    let response;

    if (Array.isArray(body.flashcards)) {
      // Walidacja wielu fiszek
      const validationResult = FlashcardsSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ValidationErrorResponseDto = {
          error: "Invalid flashcards data",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Tworzenie wielu fiszek
      const flashcardsDto: CreateFlashcardsDto = validationResult.data;
      response = await createFlashcardsService(locals.supabase, locals.user.id, flashcardsDto);
    } else {
      // Walidacja pojedynczej fiszki
      const validationResult = FlashcardSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ValidationErrorResponseDto = {
          error: "Invalid flashcard data",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Tworzenie pojedynczej fiszki
      const flashcardDto: CreateFlashcardDto = validationResult.data;
      response = await createFlashcardService(locals.supabase, locals.user.id, flashcardDto);
    }

    // Zwracanie odpowiedzi
    return new Response(JSON.stringify(response), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error creating flashcards:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

## PUT/PATCH /flashcards/{id}

### 1. Przegląd punktu końcowego

Endpoint PUT/PATCH /flashcards/{id} umożliwia aktualizację istniejącej fiszki. PUT zastępuje całą fiszkę nowymi danymi, podczas gdy PATCH umożliwia częściową aktualizację tylko wybranych pól.

### 2. Szczegóły żądania

- **Metoda HTTP:** PUT lub PATCH
- **Struktura URL:** `/flashcards/{id}`
- **Parametry URL:**
  - **Wymagane:**
    - `id` (number) - identyfikator fiszki
- **Nagłówki:**
  - `Content-Type: application/json`
- **Struktura ciała żądania:**
  - **PUT:**
    ```json
    {
      "front": "string",
      "back": "string",
      "source": "string"
    }
    ```
  - **PATCH:**
    ```json
    {
      "front": "string" // Opcjonalne pole
      // Dowolne kombinacje pól front, back, source
    }
    ```

### 3. Wykorzystywane typy

- **Z src/types.ts:**
  - `UpdateFlashcardDto` - model dla aktualizacji fiszki
  - `FlashcardDto` - reprezentacja fiszki w odpowiedzi
  - `ValidationErrorResponseDto` - struktura błędu walidacji
  - `NotFoundErrorResponseDto` - struktura błędu "nie znaleziono"
  - `AuthErrorResponseDto` - struktura błędu autoryzacji
  - `InternalErrorResponseDto` - struktura błędu wewnętrznego

### 4. Szczegóły odpowiedzi

- **Struktura odpowiedzi:**
  ```json
  {
    "id": 1,
    "front": "string",
    "back": "string",
    "source": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "generation_id": "number"
  }
  ```
- **Kody statusu:**
  - 200 OK - Pomyślna aktualizacja
  - 400 Bad Request - Nieprawidłowe dane
  - 401 Unauthorized - Brak autoryzacji
  - 404 Not Found - Fiszka nie istnieje
  - 500 Internal Server Error - Błąd po stronie serwera

### 5. Przepływ danych

1. Pobranie ID fiszki z parametrów URL
2. Walidacja ciała żądania przy użyciu Zod
3. Pobranie ID użytkownika z kontekstu Astro
4. Sprawdzenie czy fiszka istnieje i należy do zalogowanego użytkownika
5. Przygotowanie danych do aktualizacji
6. Wykonanie zapytania UPDATE do bazy danych Supabase
7. Przekształcenie wyniku do odpowiedniego formatu DTO
8. Zwrócenie odpowiedzi z danymi zaktualizowanej fiszki

### 6. Względy bezpieczeństwa

- Weryfikacja autoryzacji przy pomocy Astro middleware
- Sprawdzenie czy użytkownik ma dostęp do aktualizowanej fiszki
- Dokładna walidacja danych wejściowych
- Zabezpieczenie przed atakami SQL Injection przez użycie parametryzowanych zapytań Supabase

### 7. Obsługa błędów

- **Nieprawidłowe ID:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Nieprawidłowe dane:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Fiszka nie istnieje:** Zwrócenie NotFoundErrorResponseDto z kodem 404
- **Brak autoryzacji:** Zwrócenie AuthErrorResponseDto z kodem 401
- **Błąd bazy danych:** Logowanie błędu, zwrócenie InternalErrorResponseDto z kodem 500

### 8. Przykładowa implementacja

```typescript
// Implementacja w /src/pages/api/flashcards/[id].ts

import { z } from "zod";
import type { APIContext } from "astro";
import type {
  UpdateFlashcardDto,
  FlashcardDto,
  ValidationErrorResponseDto,
  NotFoundErrorResponseDto,
} from "../../../types";
import { updateFlashcardService } from "../../../lib/services/flashcard.service";

export const prerender = false;

// Schemat walidacji parametrów
const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

// Schemat walidacji dla PATCH (wszystkie pola opcjonalne)
const PatchFlashcardSchema = z.object({
  front: z.string().min(3).max(500).optional(),
  back: z.string().min(3).max(500).optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
});

// Schemat walidacji dla PUT (wszystkie pola wymagane)
const PutFlashcardSchema = z.object({
  front: z.string().min(3).max(500),
  back: z.string().min(3).max(500),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
});

export async function PATCH({ params, request, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametrów
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parsowanie ciała żądania
    const body = await request.json();

    // Walidacja ciała żądania
    const validationResult = PatchFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard data",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Aktualizacja fiszki
    const flashcardDto: UpdateFlashcardDto = validationResult.data;
    const updatedFlashcard = await updateFlashcardService(
      locals.supabase,
      locals.user.id,
      paramsResult.data.id,
      flashcardDto
    );

    if (!updatedFlashcard) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwracanie odpowiedzi
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT({ params, request, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametrów
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parsowanie ciała żądania
    const body = await request.json();

    // Walidacja ciała żądania (surowsza dla PUT)
    const validationResult = PutFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard data",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Aktualizacja fiszki
    const flashcardDto: UpdateFlashcardDto = validationResult.data;
    const updatedFlashcard = await updateFlashcardService(
      locals.supabase,
      locals.user.id,
      paramsResult.data.id,
      flashcardDto
    );

    if (!updatedFlashcard) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwracanie odpowiedzi
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

## DELETE /flashcards/{id}

### 1. Przegląd punktu końcowego

Endpoint DELETE /flashcards/{id} umożliwia usunięcie konkretnej fiszki na podstawie jej identyfikatora. Usuwa fiszkę należącą do zalogowanego użytkownika.

### 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/flashcards/{id}`
- **Parametry URL:**
  - **Wymagane:**
    - `id` (number) - identyfikator fiszki

### 3. Wykorzystywane typy

- **Z src/types.ts:**
  - `ValidationErrorResponseDto` - struktura błędu walidacji
  - `NotFoundErrorResponseDto` - struktura błędu "nie znaleziono"
  - `AuthErrorResponseDto` - struktura błędu autoryzacji
  - `InternalErrorResponseDto` - struktura błędu wewnętrznego

### 4. Szczegóły odpowiedzi

- **Ciało odpowiedzi:** brak (pusta odpowiedź)
- **Kody statusu:**
  - 204 No Content - Pomyślne usunięcie fiszki
  - 400 Bad Request - Nieprawidłowe ID
  - 401 Unauthorized - Brak autoryzacji
  - 404 Not Found - Fiszka nie istnieje
  - 500 Internal Server Error - Błąd po stronie serwera

### 5. Przepływ danych

1. Pobranie ID fiszki z parametrów URL
2. Pobranie ID użytkownika z kontekstu Astro
3. Walidacja ID fiszki
4. Sprawdzenie czy fiszka istnieje i należy do zalogowanego użytkownika
5. Wykonanie zapytania DELETE do bazy danych Supabase
6. Zwrócenie odpowiedzi potwierdzającej usunięcie

### 6. Względy bezpieczeństwa

- Weryfikacja autoryzacji przy pomocy Astro middleware
- Sprawdzenie czy użytkownik ma dostęp do usuwanej fiszki
- Zabezpieczenie przed atakami SQL Injection przez użycie parametryzowanych zapytań Supabase

### 7. Obsługa błędów

- **Nieprawidłowe ID:** Zwrócenie ValidationErrorResponseDto z kodem 400
- **Fiszka nie istnieje:** Zwrócenie NotFoundErrorResponseDto z kodem 404
- **Brak autoryzacji:** Zwrócenie AuthErrorResponseDto z kodem 401
- **Błąd bazy danych:** Logowanie błędu, zwrócenie InternalErrorResponseDto z kodem 500

### 8. Przykładowa implementacja

```typescript
// Implementacja w /src/pages/api/flashcards/[id].ts

import { z } from "zod";
import type { APIContext } from "astro";
import type { ValidationErrorResponseDto, NotFoundErrorResponseDto } from "../../../types";
import { deleteFlashcardService } from "../../../lib/services/flashcard.service";

export const prerender = false;

// Schemat walidacji parametrów
const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

export async function DELETE({ params, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametrów
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Usuwanie fiszki
    const deleted = await deleteFlashcardService(locals.supabase, locals.user.id, paramsResult.data.id);

    if (!deleted) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwracanie odpowiedzi
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```
