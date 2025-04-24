# Plan Testów dla Aplikacji 10xCards

## 1. Wprowadzenie i cele testowania

### 1.1 Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji `10xCards`. Aplikacja ma na celu umożliwienie użytkownikom generowania fiszek (flashcards) na podstawie wprowadzonego tekstu oraz zarządzanie nimi. Aplikacja wykorzystuje nowoczesny stos technologiczny oparty na Astro, React, TypeScript, Tailwind CSS, Shadcn/ui oraz Supabase jako backend.

### 1.2 Cele testowania

Główne cele testowania aplikacji `10xCards` to:

*   **Weryfikacja funkcjonalności:** Sprawdzenie, czy wszystkie funkcje aplikacji działają zgodnie z wymaganiami (generowanie fiszek, edycja, usuwanie, logowanie, wylogowywanie).
*   **Ocena użyteczności:** Zapewnienie, że interfejs użytkownika jest intuicyjny, responsywny i łatwy w obsłudze na różnych urządzeniach i przeglądarkach.
*   **Wykrywanie błędów:** Identyfikacja i raportowanie defektów, błędów oraz problemów związanych z wydajnością, bezpieczeństwem i stabilnością aplikacji.
*   **Zapewnienie jakości:** Potwierdzenie, że aplikacja spełnia wysokie standardy jakościowe przed wdrożeniem produkcyjnym.
*   **Weryfikacja integracji:** Sprawdzenie poprawnej komunikacji między frontendem (Astro/React) a backendem (Supabase, API zewnętrzne jak OpenRouter).
*   **Ocena bezpieczeństwa:** Weryfikacja mechanizmów uwierzytelniania i autoryzacji oraz ochrony danych użytkowników.
*   **Zapewnienie dostępności:** Weryfikacja zgodności z wytycznymi dostępności WCAG, umożliwiając korzystanie z aplikacji osobom z niepełnosprawnościami.

## 2. Zakres testów

### 2.1 Funkcjonalności objęte testami

*   **Uwierzytelnianie i Autoryzacja:**
    *   Logowanie użytkownika (Supabase Auth).
    *   Wylogowywanie użytkownika.
    *   Ochrona tras wymagających zalogowania.
*   **Generowanie Fiszek:**
    *   Formularz wprowadzania tekstu.
    *   Interakcja z API OpenRouter w celu generowania fiszek.
    *   Wyświetlanie wygenerowanych fiszek.
    *   Obsługa błędów podczas generowania.
    *   Walidacja danych wejściowych.
*   **Zarządzanie Fiszami:**
    *   Wyświetlanie listy fiszek użytkownika.
    *   Edycja treści fiszki (pytanie, odpowiedź).
    *   Zapisywanie zmian w bazie danych (Supabase).
    *   Usuwanie pojedynczej fiszki.
    *   Zbiorcze zapisywanie nowo wygenerowanych fiszek.
    *   Obsługa błędów podczas operacji CRUD.
*   **Interfejs Użytkownika (UI):**
    *   Responsywność layoutu na różnych rozdzielczościach (desktop, tablet, mobile).
    *   Poprawność wyświetlania komponentów Shadcn/ui.
    *   Spójność wizualna i stylistyczna (Tailwind CSS).
    *   Interaktywność elementów (przyciski, formularze, modale).
    *   Dostępność (accessibility) dla osób z niepełnosprawnościami.
*   **API:**
    *   Testowanie endpointów API (`/api/flashcards`, `/api/generations`).
    *   Walidacja żądań i odpowiedzi.
    *   Obsługa błędów po stronie serwera.
    *   Autoryzacja dostępu do endpointów.
*   **Integracja z Supabase:**
    *   Poprawność operacji CRUD na bazie danych.
    *   Obsługa RLS (Row Level Security).
    *   Zarządzanie sesjami użytkowników.
*   **Wydajność:**
    *   Czas ładowania stron.
    *   Czas odpowiedzi API.
    *   Optymalizacja zapytań do bazy danych.
    *   Pomiary Web Vitals (CLS, LCP, FID, INP).
*   **Middleware (`src/middleware/index.ts`):**
    *   Poprawność działania logiki (np. przekierowania, modyfikacje żądań/odpowiedzi).
    *   Obsługa autoryzacji i ochrony tras.

### 2.2 Funkcjonalności wyłączone z testów

*   Testy penetracyjne (wymagają specjalistycznych narzędzi i wiedzy).
*   Szczegółowe testy samego API OpenRouter (zakładamy, że dostawca zapewnia jakość usługi).
*   Testy infrastruktury Supabase (zakładamy, że dostawca zapewnia niezawodność platformy).

## 3. Typy testów do przeprowadzenia

*   **Testy jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania izolowanych fragmentów kodu (funkcje pomocnicze w `src/lib`, logika komponentów React, funkcje API).
    *   **Narzędzia:** Vitest (z interfejsem Vitest UI dla lepszego debugowania), ts-jest dla lepszej integracji z TypeScript.
    *   **Zakres:** Funkcje w `src/lib/utils.ts`, `src/lib/openrouter.utils.ts`, logika komponentów React (np. walidacja formularzy w `TextInputForm.tsx`, logika `EditFlashcardModal.tsx`), helpery w endpointach API.
*   **Testy integracyjne (Integration Tests):**
    *   **Cel:** Sprawdzenie poprawności współpracy pomiędzy różnymi modułami aplikacji (np. komponent React <-> API, API <-> Baza danych, API <-> OpenRouter API).
    *   **Narzędzia:** Vitest, Supertest (dla API), React Testing Library (dla komponentów React), @testing-library/astro (dla komponentów Astro), MSW (Mock Service Worker) dla mockowania API.
    *   **Zakres:** Przepływ danych między formularzem generowania a API, zapis fiszek do Supabase przez API, pobieranie i wyświetlanie fiszek w komponencie `FlashcardList.tsx`, **testowanie logiki middleware (`src/middleware/index.ts`), w tym przekierowań i ochrony tras**.
*   **Testy End-to-End (E2E Tests):**
    *   **Cel:** Symulacja rzeczywistych scenariuszy użytkowania aplikacji przez użytkownika w przeglądarce.
    *   **Narzędzia:** Playwright (preferowany ze względu na lepszą obsługę przeglądarek, wsparcie dla testów mobilnych i wyższą wydajność).
    *   **Zakres:** Pełny przepływ od logowania, przez generowanie fiszek, edycję, zapis, aż do wylogowania.
*   **Testy interfejsu użytkownika (UI Tests):**
    *   **Cel:** Weryfikacja wizualnej poprawności i responsywności interfejsu. Mogą być częścią testów E2E lub realizowane osobno.
    *   **Narzędzia:** Playwright dla E2E, @storybook/astro dla izolowanych komponentów, playwright-visual-comparisons (lżejsza alternatywa dla Percy/Chromatic) dla testów wizualnej regresji.
    *   **Zakres:** Komponenty UI, responsywność, spójność wizualna.
*   **Testy dostępności (Accessibility Tests):**
    *   **Cel:** Weryfikacja zgodności aplikacji z wytycznymi dostępności WCAG.
    *   **Narzędzia:** axe-core (integracja z Playwright i/lub Storybook), pa11y.
    *   **Zakres:** Wszystkie widoki i komponenty interaktywne.
*   **Testy API (API Tests):**
    *   **Cel:** Bezpośrednie testowanie endpointów API pod kątem poprawności odpowiedzi, obsługi błędów i walidacji.
    *   **Narzędzia:** Supertest, MSW (Mock Service Worker), Postman/Insomnia (manualne).
    *   **Zakres:** Testowanie wszystkich endpointów w `src/pages/api` (GET, POST, PUT, DELETE).
*   **Testy bazy danych (Database Tests):**
    *   **Cel:** Weryfikacja poprawności operacji na bazie danych i integracji z Supabase.
    *   **Narzędzia:** supabase-js-mock, dedykowane środowisko testowe Supabase.
    *   **Zakres:** Wszystkie operacje CRUD, zapytania, polityki bezpieczeństwa RLS.
*   **Testy manualne (Manual Testing):**
    *   **Cel:** Eksploracyjne testowanie aplikacji w celu wykrycia nieprzewidzianych błędów i oceny użyteczności.
    *   **Narzędzia:** Przeglądarka internetowa, narzędzia deweloperskie przeglądarki.
    *   **Zakres:** Cała aplikacja, ze szczególnym uwzględnieniem krytycznych ścieżek użytkownika i nowo dodanych funkcjonalności.
*   **Testy kompatybilności (Compatibility Testing):**
    *   **Cel:** Sprawdzenie działania aplikacji na różnych przeglądarkach (Chrome, Firefox, Safari, Edge) i systemach operacyjnych (Windows, macOS, Linux).
    *   **Narzędzia:** Playwright (umożliwia testy na wielu przeglądarkach), BrowserStack (opcjonalnie).
*   **Testy wydajności (Performance Testing):**
    *   **Cel:** Ocena szybkości ładowania stron i odpowiedzi API pod obciążeniem (opcjonalnie, w zależności od wymagań).
    *   **Narzędzia:** Web Vitals API, Lighthouse, WebPageTest, k6 (dla API).

## 4. Scenariusze testowe dla kluczowych funkcjonalności

*(Przykładowe scenariusze, lista powinna być rozbudowana)*

| Funkcjonalność             | Scenariusz                                                                                                | Oczekiwany Rezultat                                                                                                | Typ Testu       | Priorytet |
| :------------------------- | :-------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :-------------- | :-------- |
| **Logowanie**              | Użytkownik podaje poprawne dane logowania.                                                                | Użytkownik zostaje zalogowany i przekierowany na stronę główną aplikacji (lub pulpit).                              | E2E, Manualny   | Krytyczny |
| **Logowanie**              | Użytkownik podaje niepoprawne hasło.                                                                      | Wyświetlany jest komunikat błędu o niepoprawnych danych logowania. Użytkownik nie zostaje zalogowany.               | E2E, Manualny   | Krytyczny |
| **Generowanie Fiszek**   | Użytkownik wprowadza poprawny tekst i klika "Generuj".                                                    | Wyświetlany jest wskaźnik ładowania. Po chwili pojawiają się wygenerowane fiszki.                                    | E2E, Integracyjny, Manualny | Wysoki    |
| **Generowanie Fiszek**   | Użytkownik wprowadza pusty tekst i klika "Generuj".                                                        | Wyświetlany jest komunikat błędu walidacji informujący o konieczności wprowadzenia tekstu. Generowanie nie rozpoczyna się. | E2E, Manualny   | Wysoki    |
| **Generowanie Fiszek**   | Występuje błąd podczas komunikacji z API OpenRouter.                                                      | Wyświetlany jest stosowny komunikat błędu dla użytkownika. Aplikacja pozostaje stabilna.                              | Integracyjny, Manualny | Średni    |
| **Zapisywanie Fiszek**   | Użytkownik klika "Zapisz zbiorczo" po wygenerowaniu fiszek.                                                 | Fiszki zostają zapisane w bazie danych. Wyświetlany jest komunikat potwierdzający zapis.                             | E2E, Integracyjny, Manualny | Wysoki    |
| **Edycja Fiszki**        | Użytkownik edytuje treść fiszki i zapisuje zmiany.                                                          | Zmiany są widoczne na liście fiszek i zapisane w bazie danych.                                                    | E2E, Integracyjny, Manualny | Wysoki    |
| **Usuwanie Fiszki**      | Użytkownik usuwa fiszkę.                                                                                    | Fiszka znika z listy i zostaje usunięta z bazy danych.                                                             | E2E, Integracyjny, Manualny | Wysoki    |
| **Responsywność UI**     | Użytkownik otwiera aplikację na urządzeniu mobilnym.                                                         | Interfejs jest poprawnie wyświetlany, elementy są czytelne i łatwe do interakcji.                                | UI, Manualny    | Wysoki    |
| **Dostępność UI**        | Testowanie z czytnikiem ekranu (np. NVDA, VoiceOver).                                                       | Wszystkie funkcje aplikacji są dostępne i obsługiwalne przy użyciu czytnika ekranu.                                | Dostępność, Manualny | Wysoki |
| **Ochrona trasy**        | Niezalogowany użytkownik próbuje uzyskać dostęp do strony `/flashcards`.                                     | Użytkownik jest przekierowywany na stronę logowania.                                                              | E2E, Manualny   | Krytyczny |
| **Middleware: Autoryzacja** | Niezalogowany użytkownik próbuje uzyskać dostęp do chronionego endpointu API.                            | API zwraca błąd autoryzacji (np. 401 Unauthorized). Middleware poprawnie blokuje dostęp.                           | Integracyjny    | Krytyczny |
| **Wylogowanie**          | Zalogowany użytkownik klika przycisk "Wyloguj".                                                             | Użytkownik zostaje wylogowany i przekierowany na stronę główną lub logowania.                                      | E2E, Manualny   | Krytyczny |
| **Wydajność**            | Mierzenie Web Vitals podczas korzystania z aplikacji.                                                       | Metryki Web Vitals (LCP, CLS, FID, INP) mieszczą się w zalecanych granicach.                                       | Wydajność      | Średni    |

## 5. Środowisko testowe

*   **Środowisko deweloperskie (lokalne):** Do uruchamiania testów jednostkowych i integracyjnych podczas rozwoju.
*   **Środowisko stagingowe:** Oddzielna instancja aplikacji i bazy danych (Supabase project), możliwie najbardziej zbliżona do środowiska produkcyjnego. Służy do przeprowadzania testów E2E, manualnych i akceptacyjnych przed wdrożeniem na produkcję.
*   **Środowisko produkcyjne:** Ograniczone testy dymne (smoke tests) po każdym wdrożeniu w celu weryfikacji kluczowych funkcjonalności.
*   **Strategia mockowania:** Należy zdefiniować spójną strategię mockowania zależności zewnętrznych (Supabase API, OpenRouter API) na potrzeby testów jednostkowych i integracyjnych. Wykorzystanie MSW (Mock Service Worker) do mockowania API oraz supabase-js-mock do mockowania interakcji z bazą danych.

## 6. Narzędzia do testowania

*   **Framework do testów jednostkowych/integracyjnych:** `Vitest` (ze wsparciem Vitest UI dla lepszego debugowania testów).
*   **Integracja TypeScript:** `ts-jest` lub `ts-node` dla lepszej obsługi typów w testach.
*   **Biblioteka do testowania komponentów React:** `React Testing Library` (dobrze integruje się z Vitest).
*   **Biblioteka do testowania komponentów Astro:** `@testing-library/astro` (specjalizowana do testowania komponentów Astro).
*   **Narzędzie do mockowania API:** `MSW (Mock Service Worker)` (do mockowania zewnętrznych API i endpointów).
*   **Narzędzie do testowania bazy danych:** `supabase-js-mock` (do mockowania interakcji z Supabase).
*   **Framework do testów E2E:** `Playwright` (preferowany ze względu na lepszą obsługę przeglądarek, wsparcie dla testów mobilnych i wyższą wydajność).
*   **Narzędzie do izolowanego rozwoju i testowania UI:** `@storybook/astro` (specjalizowana wersja Storybooka dla ekosystemu Astro).
*   **Narzędzia do testów wizualnej regresji:** `playwright-visual-comparisons` lub `jest-image-snapshot` (lżejsze alternatywy dla Percy/Chromatic).
*   **Narzędzia do testów dostępności:** `axe-core` (integracja z Playwright i/lub Storybook), `pa11y`.
*   **Narzędzie do testowania API (automatyczne):** `Supertest` (w ramach Vitest).
*   **Narzędzie do testowania API (manualne):** `Postman`, `Insomnia`.
*   **Narzędzie do testowania wydajności frontendu:** `Web Vitals API`, `Lighthouse` (wbudowane w Chrome DevTools), `WebPageTest`.
*   **Narzędzie do testowania wydajności API (obciążeniowe):** `k6`.
*   **System kontroli wersji:** `Git`.
*   **Platforma CI/CD:** `GitHub Actions` (do automatyzacji uruchamiania testów).
*   **Narzędzie do zarządzania zadaniami/błędami:** `GitHub Issues` lub dedykowany system (np. Jira).

**(Uwaga: Kluczowe jest dodanie wybranych zależności deweloperskich (`devDependencies`) związanych z testowaniem do pliku `package.json` oraz ich konfiguracja w projekcie).**

## 7. Harmonogram testów

*   **Testy jednostkowe i integracyjne:** Przeprowadzane ciągle przez deweloperów podczas implementacji nowych funkcji i poprawek błędów. Uruchamiane automatycznie przed każdym commitem (husky pre-commit hook) oraz w pipeline CI/CD.
*   **Testy API:** Rozwijane równolegle z implementacją endpointów. Uruchamiane w pipeline CI/CD.
*   **Testy E2E:** Rozwijane dla kluczowych przepływów użytkownika. Uruchamiane automatycznie w pipeline CI/CD na środowisku stagingowym przed każdym wdrożeniem na produkcję.
*   **Testy dostępności:** Uruchamiane automatycznie jako część pipeline CI/CD oraz regularnie weryfikowane manualnie.
*   **Testy manualne/eksploracyjne:** Przeprowadzane na środowisku stagingowym przed wydaniem nowej wersji aplikacji (np. raz na sprint/cykl wydawniczy).
*   **Testy regresji:** Wykonywane przed każdym wydaniem, obejmujące uruchomienie pełnego zestawu testów automatycznych (jednostkowych, integracyjnych, E2E) oraz kluczowych scenariuszy manualnych.
*   **Testy akceptacyjne użytkownika (UAT):** Opcjonalnie, przeprowadzane przez interesariuszy lub Product Ownera na środowisku stagingowym przed zatwierdzeniem wydania.

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wejścia (rozpoczęcia testów)

*   Kod źródłowy został zintegrowany i zbudowany bez błędów.
*   Aplikacja została wdrożona na odpowiednim środowisku testowym (staging).
*   Dokumentacja wymagań (jeśli istnieje) jest dostępna.
*   Środowisko testowe jest stabilne i skonfigurowane.

### 8.2 Kryteria wyjścia (zakończenia testów)

*   Wszystkie zaplanowane testy (automatyczne i manualne) zostały wykonane.
*   Osiągnięto zdefiniowany i uzgodniony w zespole poziom pokrycia kodu testami (np. dla testów jednostkowych/integracyjnych - konkretny cel % do ustalenia).
*   Wszystkie krytyczne i wysokie błędy zostały naprawione i zweryfikowane.
*   Testy dostępności wykazują zgodność z wytycznymi WCAG (przynajmniej AA).
*   Metryki Web Vitals mieszczą się w zalecanych granicach.
*   Liczba pozostałych błędów o niższym priorytecie jest akceptowalna (zgodnie z decyzją zespołu/Product Ownera).
*   Raport z testów został przygotowany i zaakceptowany.

## 9. Role i odpowiedzialności w procesie testowania

*   **Deweloperzy:**
    *   Pisanie i utrzymanie testów jednostkowych i integracyjnych.
    *   Naprawianie błędów wykrytych podczas wszystkich faz testowania.
    *   Uczestnictwo w przeglądach kodu testów.
    *   Wsparcie w konfiguracji środowisk testowych.
*   **Inżynier QA / Tester (jeśli dedykowany):**
    *   Projektowanie i implementacja testów E2E i API.
    *   Wykonywanie testów manualnych i eksploracyjnych.
    *   Zarządzanie procesem raportowania błędów.
    *   Tworzenie i utrzymanie planu testów oraz scenariuszy testowych.
    *   Monitorowanie jakości i przygotowywanie raportów z testów.
    *   Konfiguracja i utrzymanie narzędzi do automatyzacji testów.
    *   Przeprowadzanie testów dostępności i wydajności.
*   **Product Owner / Interesariusze:**
    *   Definiowanie kryteriów akceptacji funkcjonalności.
    *   Udział w testach akceptacyjnych użytkownika (UAT).
    *   Podejmowanie decyzji o wydaniu aplikacji na podstawie wyników testów.

*(W przypadku braku dedykowanego testera, obowiązki QA mogą być rozdzielone między deweloperów lub wykonywane przez jednego z nich).*

## 10. Procedury raportowania błędów

*   **Narzędzie:** GitHub Issues lub dedykowany system (np. Jira).
*   **Proces zgłaszania:**
    1.  Weryfikacja, czy błąd nie został już zgłoszony.
    2.  Stworzenie nowego zgłoszenia (issue) z jasnym, zwięzłym tytułem.
    3.  Szczegółowy opis błędu, w tym:
        *   Kroki do reprodukcji (dokładne i ponumerowane).
        *   Obserwowane zachowanie.
        *   Oczekiwane zachowanie.
        *   Środowisko testowe (przeglądarka, system operacyjny, wersja aplikacji).
        *   Zrzuty ekranu lub nagrania wideo (jeśli to możliwe).
        *   Logi z konsoli przeglądarki lub serwera.
        *   Priorytet błędu (np. Krytyczny, Wysoki, Średni, Niski).
    4.  Przypisanie odpowiednich etykiet (np. `bug`, `ui`, `backend`, `prio:high`, `accessibility`).
*   **Cykl życia błędu:**
    *   **Nowy:** Zgłoszony błąd, oczekuje na weryfikację.
    *   **Potwierdzony/Otwarty:** Błąd został zweryfikowany i zaakceptowany do naprawy.
    *   **W toku:** Deweloper pracuje nad naprawą błędu.
    *   **Do weryfikacji:** Błąd został naprawiony i czeka na weryfikację przez testera/zgłaszającego.
    *   **Zamknięty:** Błąd został pomyślnie zweryfikowany jako naprawiony.
    *   **Odrzucony:** Zgłoszenie nie jest błędem lub jest duplikatem.
*   **Priorytetyzacja błędów:** Odbywa się we współpracy zespołu deweloperskiego, QA i Product Ownera, biorąc pod uwagę wpływ błędu na funkcjonalność, użytkownika i biznes.
