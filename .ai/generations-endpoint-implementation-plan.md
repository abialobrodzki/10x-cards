# API Endpoint Implementation Plan: POST /generations/generate

## 1. Przegląd punktu końcowego
Endpoint `/generations/generate` umożliwia generowanie fiszek na podstawie dostarczonego tekstu. Użytkownik przekazuje tekst, który jest przetwarzany przez wybrany model AI w celu automatycznego wygenerowania fiszek. Endpoint tworzy nowy rekord generacji w bazie danych, wywołuje zewnętrzne API modelu językowego i zwraca listę wygenerowanych fiszek wraz z metadanymi generacji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/generations/generate`
- Parametry:
  - Wymagane: Brak parametrów URL
  - Opcjonalne: Brak parametrów URL
- Request Body:
  ```typescript
  {
    text: string; // Tekst o długości 1000-10000 znaków
  }
  ```

## 3. Wykorzystywane typy
```typescript
// Request DTO
import { GenerateFlashcardsRequestDto } from "../../types"; // Istniejący typ

// Response DTO
import { GenerationWithFlashcardsResponseDto } from "../../types"; // Istniejący typ

// Typy dla operacji bazodanowych
import type { SupabaseClient } from "../../db/supabase.client"; // Import typu klienta Supabase
import type { FlashcardEntity, GenerationEntity, GenerationErrorLogEntity } from "../../types";

// Command model dla OpenRouter.ai
interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  max_tokens: number;
}

// Response model dla OpenRouter.ai
interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```typescript
  {
    generation: {
      id: number;
      generated_count: number;
      accepted_unedited_count: number;
      accepted_edited_count: number;
      created_at: string; // timestamp
      updated_at: string; // timestamp
      model: string;
    };
    flashcards: {
      front: string;
      back: string;
      source: "ai-full";
    }[];
  }
  ```

- Błąd walidacji (400 Bad Request):
  ```typescript
  {
    error: string; // np. "Text must be between 1000 and 10000 characters"
  }
  ```

- Błąd wewnętrzny (500 Internal Server Error):
  ```typescript
  {
    error: string; // np. "Failed to generate flashcards"
    details?: string; // opcjonalne szczegóły błędu
  }
  ```

## 5. Przepływ danych
1. Walidacja żądania:
   - Sprawdzenie poprawności formatu żądania
   - Walidacja długości tekstu (1000-10000 znaków)

2. Utworzenie rekordu generacji w bazie danych:
   - Zapis nowego wpisu w tabeli `generations` z inicjalnymi wartościami:
     - user_id: ID zalogowanego użytkownika z kontekstu Astro
     - model: początkowo puste, zostanie zaktualizowane po wyborze modelu
     - generated_count, accepted_unedited_count, accepted_edited_count: 0
     - source_text_hash: hash przekazanego tekstu
     - source_text_length: długość przekazanego tekstu
     - generation_duration: początkowo 0, zostanie zaktualizowane po zakończeniu generacji

3. Komunikacja z OpenRouter.ai:
   - Wybór odpowiedniego modelu LLM
   - Konstrukcja promptu dla API z odpowiednimi instrukcjami do generacji fiszek
   - Wysłanie żądania do OpenRouter.ai
   - Pomiar czasu wykonania
   
   **Alternatywnie (wersja development/testowa):**
   - Wykorzystanie mocka zamiast faktycznego wywołania API
   - Przygotowanie predefiniowanych odpowiedzi dla celów testowych
   - Dodanie flagi środowiskowej (np. `USE_AI_MOCK=true`) do przełączania między rzeczywistym API a mockiem

4. Przetwarzanie odpowiedzi:
   - Parsowanie odpowiedzi z modelu AI i ekstrakcja fiszek
   - Aktualizacja rekordu generacji:
     - model: użyty model AI
     - generated_count: liczba wygenerowanych fiszek
     - generation_duration: zmierzony czas generacji

5. Zwrócenie odpowiedzi:
   - Konstrukcja DTO odpowiedzi z danymi generacji i fiszkami
   - Zwrócenie odpowiedzi do klienta

## 6. Względy bezpieczeństwa
1. Uwierzytelnianie:
   - Wykorzystanie Supabase Auth do weryfikacji uwierzytelnienia użytkownika
   - Implementacja middleware Astro do weryfikacji tokenu JWT
   - Weryfikacja statusu sesji użytkownika poprzez Supabase (`context.locals.supabase.auth.getSession()`)
   - Automatyczne odrzucanie nieuwierzytelnionych żądań z kodem 401
   - Dostęp do punktu końcowego tylko dla uwierzytelnionych użytkowników

2. Autoryzacja:
   - Korzystanie z Row Level Security (RLS) w Supabase
   - Zapisywanie user_id w rekordach, aby zapewnić, że użytkownicy mają dostęp tylko do swoich danych

3. Walidacja danych:
   - Walidacja długości tekstu (1000-10000 znaków)
   - Sanityzacja danych wejściowych przed wysłaniem do modelu AI
   - Walidacja wygenerowanych fiszek przed zwróceniem do klienta

4. Ochrona kluczy API:
   - Przechowywanie kluczy API do OpenRouter.ai w zmiennych środowiskowych
   - Nie ujawnianie kluczy API w odpowiedziach

5. Rate Limiting:
   - Implementacja limitów zapytań dla użytkowników, aby uniknąć nadużyć

## 7. Obsługa błędów
1. Błędy walidacji:
   - Kod 400 Bad Request: Tekst jest poza dozwolonym zakresem długości
   - Kod 400 Bad Request: Nieprawidłowy format żądania

2. Błędy uwierzytelniania:
   - Kod 401 Unauthorized: Użytkownik nie jest uwierzytelniony

3. Błędy komunikacji z AI:
   - Kod 500 Internal Server Error: Błąd podczas wywoływania API modelu AI
   - Logowanie błędu w tabeli `generation_error_logs` z:
     - user_id: ID użytkownika
     - model: próbowany model
     - error_code: kod błędu z API modelu AI
     - error_message: szczegółowy komunikat błędu
     - source_text_hash: hash przekazanego tekstu
     - source_text_length: długość przekazanego tekstu

4. Błędy bazy danych:
   - Kod 500 Internal Server Error: Błąd podczas zapisu do bazy danych

5. Timeout:
   - Kod 504 Gateway Timeout: Jeśli model AI nie odpowiada w rozsądnym czasie

## 8. Rozważania dotyczące wydajności
1. Potencjalne wąskie gardła:
   - Czas odpowiedzi modelu AI
   - Przetwarzanie dużych ilości tekstu

2. Optymalizacje:
   - Buforowanie wyników generacji dla podobnych tekstów (wykorzystanie source_text_hash)
   - Asynchroniczne przetwarzanie żądań
   - Timeout dla zapytań do modelu AI (30 sekund)
   - Optymalizacja promptu dla modelu AI w celu uzyskania lepszych wyników w krótszym czasie

## 9. Etapy wdrożenia
1. Utworzenie struktury katalogów i plików:
   ```
   src/lib/services/generation.service.ts    # Główna logika biznesowa
   src/lib/services/ai.service.ts            # Komunikacja z OpenRouter.ai
   src/lib/services/ai-mock.service.ts       # Mock serwisu AI dla celów rozwojowych/testowych
   src/pages/api/generations/generate.ts     # Endpoint POST
   ```

2. Implementacja uwierzytelniania Supabase:
   - Konfiguracja middleware Astro do obsługi sesji Supabase
   - Implementacja sprawdzania uwierzytelnienia w endpointach API
   - Testowanie różnych scenariuszy uwierzytelniania

3. Implementacja walidacji żądania:
   - Utworzenie schematu Zod do walidacji żądania
   - Implementacja walidacji długości tekstu

4. Implementacja komunikacji z modelem AI:
   - Utworzenie aiService do komunikacji z OpenRouter.ai
   - Implementacja wyboru modelu i konstrukcji promptu
   - Obsługa parsowania odpowiedzi modelu
   - Implementacja mocka serwisu AI z predefiniowanymi odpowiedziami
   - Dodanie mechanizmu przełączania między rzeczywistym API a mockiem

5. Implementacja operacji na bazie danych:
   - Utworzenie generationService do zarządzania rekordami generacji
   - Implementacja zapisu nowych rekordów generacji
   - Implementacja aktualizacji rekordów generacji

6. Implementacja obsługi błędów:
   - Utworzenie loggera błędów generacji
   - Implementacja zapisywania błędów do tabeli generation_error_logs

7. Implementacja endpoint'u API:
   - Utworzenie POST handlera w src/pages/api/generations/generate.ts
   - Integracja z services i middleware

8. Dokumentacja:
   - Aktualizacja dokumentacji API
   - Dodanie komentarzy do kodu
