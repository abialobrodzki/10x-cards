# OpenRouter Service Implementation Plan

## 1. Opis usługi

OpenRouter Service to kompleksowe rozwiązanie umożliwiające integrację z API OpenRouter w celu uzupełnienia czatów opartych na modelach językowych (LLM). Usługa odpowiada za wysyłanie żądań do API, odbieranie odpowiedzi oraz przetwarzanie ich w celu generowania ustrukturyzowanych wyników.

### Kluczowe komponenty usługi OpenRouter

1. **Komponent budowania żądań (Request Builder)**

   - Cel: Kompozycja poprawnego payloadu dla API OpenRouter.
   - Funkcjonalność:
     - Łączy różne elementy żądania: systemowy komunikat, komunikat użytkownika, ustrukturyzowaną odpowiedź (response_format), nazwę modelu oraz parametry modelu.
   - Potencjalne wyzwania:
     1. Utrzymanie spójności formatu payloadu.
     2. Walidacja poprawności struktury response_format.
   - Proponowane rozwiązania:
     1. Zastosowanie standardu JSON Schema do walidacji payloadu.
     2. Ujednolicenie formatu wejściowego poprzez centralną metodę budującą payload.

2. **Klient API (API Client)**

   - Cel: Wysyłanie żądań HTTP do API OpenRouter i odbieranie odpowiedzi.
   - Funkcjonalność:
     - Obsługuje mechanizmy retry, timeout oraz autoryzację.
   - Potencjalne wyzwania:
     1. Niestabilność połączenia sieciowego.
     2. Błędy autoryzacji (np. nieprawidłowy klucz API).
   - Proponowane rozwiązania:
     1. Implementacja mechanizmu retry z exponential backoff.
     2. Szczegółowe logowanie błędów HTTP i powiadamianie o problemach z autoryzacją.

3. **Menadżer sesji czatu (Chat Manager)**

   - Cel: Zarządzanie historią komunikatów między użytkownikiem a systemem.
   - Funkcjonalność:
     - Aktualizuje historię czatu i synchronizuje stan komunikacji.
   - Potencjalne wyzwania:
     1. Synchronizacja stanu czatu między komponentami front-endu a logiką backendu.
   - Proponowane rozwiązania:
     1. Wykorzystanie mechanizmu zarządzania stanem (np. React Context lub dedykowany store) z możliwością skalowania.

4. **Parser odpowiedzi (Response Parser)**

   - Cel: Analiza, walidacja i transformacja surowej odpowiedzi z API do ustrukturyzowanego formatu.
   - Funkcjonalność:
     - Mapuje dane z API na ustalony format odpowiedzi oraz waliduje zgodność z JSON Schema.
   - Potencjalne wyzwania:
     1. Niezgodność struktury zwracanej odpowiedzi z oczekiwanym schematem.
   - Proponowane rozwiązania:
     1. Implementacja walidatora na podstawie JSON Schema oraz fallback logic w przypadku błędów.

5. **Moduł obsługi błędów (Error Handling Module)**
   - Cel: Centralizacja obsługi błędów i logowania wyjątków w usłudze.
   - Funkcjonalność:
     - Zbiera i loguje błędy, zarządza retry dla określonych scenariuszy oraz informuje użytkownika/administratora o krytycznych problemach.
   - Potencjalne wyzwania:
     1. Rozpoznanie i odróżnienie różnych typów błędów (walidacja, HTTP, timeout, systemowe).
   - Proponowane rozwiązania:
     1. Definicja dedykowanych typów błędów i implementacja centralnego modułu logowania.

## 2. Opis konstruktora

Konstruktor usługi przyjmuje następujące parametry konfiguracyjne:

- `apiEndpoint` oraz `apiKey` do komunikacji z API OpenRouter.
- Domyślne ustawienia modelu (nazwa, temperatura, `max_tokens` itp.).
- Globalne ustawienia sesji czatu (historia rozmów, timeout, retryCount).

Podczas inicjalizacji:

1. Inicjalizowany jest komponent budowania żądań, odpowiedzialny za składanie payloadu.
2. Tworzony jest klient API do komunikacji z OpenRouter.
3. Uruchamiany jest menadżer sesji czatu, który zarządza historią komunikacji.

## 3. Publiczne metody i pola

### Metody publiczne

1. `sendChatMessage(userMessage: string): Promise<ResponsePayload>`
   - Wysyła komunikat użytkownika do API, łącząc ustawienia: systemMessage, userMessage, responseFormat, modelName i modelParams.
2. `setSystemMessage(message: string): void`
   - Ustawia globalny komunikat systemowy (role: 'system').
3. `setUserMessage(message: string): void`
   - Ustawia domyślny komunikat użytkownika (role: 'user').
4. `setResponseFormat(schema: JSONSchema): void`
   - Konfiguruje format odpowiedzi (`response_format`) zgodnie z dostarczonym schematem JSON.
5. `setModel(name: string, parameters: ModelParameters): void`
   - Ustawia nazwę modelu i jego parametry (np. `temperature`, `top_p`, `frequency_penalty`, `presence_penalty`).

### Pola publiczne

1. `systemMessage: string`
2. `userMessage: string`
3. `responseFormat: ResponseFormat`
4. `modelName: string`
5. `modelParams: ModelParameters`
6. `chatHistory?: ChatMessage[]`

## 4. Prywatne metody i pola

### Metody

1. `buildRequestPayload(systemMessage: string, userMessage: string, responseFormat: ResponseFormat, modelName: string, modelParams: ModelParams): RequestPayload`
   - Komponuje strukturę żądania, wykorzystując:
     1. **Systemowy komunikat:**
        - Przykład: `{ "role": "system", "content": "Jesteś systemem wsparcia LLM." }`
     2. **Komunikat użytkownika:**
        - Przykład: `{ "role": "user", "content": "Proszę podaj odpowiedź w formacie JSON." }`
     3. **Ustrukturyzowaną odpowiedź (`responseFormat`):**
        - Przykład: `{ type: 'json_schema', json_schema: { name: 'ResponseSchema', strict: true, schema: { answer: 'string', confidence: 'number' } } }`
     4. **Nazwa modelu:**
        - Przykład: `gpt-4`
     5. **Parametry modelu:**
        - Przykład: `{ temperature: 0.7, max_tokens: 2048 }`
2. `parseResponse(rawResponse: any): ResponsePayload`
   - Przetwarza surową odpowiedź z API, mapując ją do ustrukturyzowanego formatu i walidując zgodność ze schematem.
3. `handleInternalError(error: Error): void`
   - Zarządza wewnętrznymi błędami poprzez logowanie oraz wywoływanie odpowiednich mechanizmów retry lub fallback.

### Pola

1. `requestTimeout` - Maksymalny czas oczekiwania na odpowiedź API.
2. `retryCount` - Liczba dozwolonych prób wysłania żądania w razie niepowodzenia.

## 5. Obsługa błędów

Usługa powinna obsługiwać następujące scenariusze błędów:

1. **Błąd walidacji żądania:**
   - Problem: Brak lub błędna struktura kluczowych pól (np. systemMessage, userMessage, responseFormat).
   - Rozwiązanie: Implementacja mechanizmu walidacji wejściowego z precyzyjnymi komunikatami o błędach.
2. **Błąd HTTP:**
   - Problem: Nieudana autoryzacja, błędny endpoint lub inne odpowiedzi HTTP poza zakresem 200.
   - Rozwiązanie: Mechanizm retry z exponential backoff oraz logowanie błędów HTTP.
3. **Błąd parsowania odpowiedzi:**
   - Problem: Odpowiedź niezgodna ze schematem `responseFormat`.
   - Rozwiązanie: Walidacja odpowiedzi przy użyciu JSON Schema i zwracanie szczegółowych komunikatów o błędzie.
4. **Timeout żądania:**
   - Problem: Przekroczenie określonego czasu oczekiwania na odpowiedź API.
   - Rozwiązanie: Ustawienie limitów czasowych i mechanizm ponownej próby.
5. **Inne błędy systemowe:**
   - Problem: Problemy sieciowe, nieoczekiwane wyjątki lub błędy serwera.
   - Rozwiązanie: Centralny moduł obsługi błędów z dedykowanymi typami wyjątków oraz logowaniem krytycznych problemów.

## 6. Kwestie bezpieczeństwa

1. **Przechowywanie kluczy API:**
   - Używanie zmiennych środowiskowych, aby klucze nie były zapisane bezpośrednio w kodzie.
2. **Walidacja i sanitizacja danych:**
   - Wszystkie dane wejściowe muszą być walidowane, aby zapobiec atakom typu injection.
3. **Komunikacja przez HTTPS:**
   - Wymuszanie bezpiecznej transmisji danych pomiędzy usługą a API OpenRouter.
4. **Logowanie bez ujawniania wrażliwych danych:**
   - Stosowanie mechanizmów logowania, które nie zapisują kluczowych informacji, takich jak klucze API.
5. **Ograniczenie uprawnień:**
   - Minimalizacja dostępu do krytycznych funkcji systemu, aby ograniczyć potencjalne wektory ataku.

## 7. Plan wdrożenia krok po kroku

1. **Konfiguracja środowiska:**
   - Ustawienie zmiennych środowiskowych (np. `API_ENDPOINT`, `API_KEY`, domyślne ustawienia modelu).
   - Instalacja zależności zgodnie z technologiami: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui.
2. **Implementacja modułu klienta API**
   - Utworzyć moduł (np. `src/lib/openrouter.ts`) dedykowany do komunikacji z API OpenRouter.
   - Zaimplementować funkcję `executeRequest()`, obsługującą żądania HTTP z retry i backoff.
   - Dodać metody: `setSystemMessage()`, `setUserMessage()`, `setResponseFormat()`, `setModel()`.
3. **Implementacja warstwy logiki czatu**
   - Utworzyć publiczny interfejs wysyłania wiadomości czatowych: `sendChatMessage()`.
   - Konsolidować konfigurację komunikatów i parametrów modelu w jednym miejscu.
   - Umożliwić dynamiczną modyfikację ustawień w trakcie sesji.
4. **Obsługa strukturalnych odpowiedzi API**
   - Zaimplementować metodę `buildRequestPayload()`, tworzącą ładunek z: systemMessage, userMessage, response_format, modelName i modelParams.
   - Zaimplementować walidację i parser odpowiedzi z API.
5. **Implementacja obsługi błędów i logowania**
   - Zaimplementować szczegółową obsługę wyjątków dla scenariuszy: błąd sieciowy, błąd autentykacji, niepoprawna struktura odpowiedzi.
   - Dodać mechanizmy logowania zgodne z zasadami bezpieczeństwa, bez ujawniania wrażliwych danych.
