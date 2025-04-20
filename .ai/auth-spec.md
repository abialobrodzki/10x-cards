# Specyfikacja modułu autentykacji i rejestracji użytkowników

Dokument zawiera szczegółową architekturę frontendu, backendu oraz integrację z Supabase Auth na podstawie wymagań US-001, US-002 i US-009.

---

## 1. Architektura interfejsu użytkownika (UI)

### 1.1 Layouty i strony

- `src/layouts/auth.astro` (nowy)

  - Layout dedykowany stronom publicznym związanym z autentykacją (rejestracja, logowanie, odzyskiwanie hasła).
  - Zawiera wspólny header (logo, link do strony głównej), główny slot na formularze oraz minimalny footer.
  - Stylizacja z użyciem Tailwind CSS i komponentów Shadcn/ui.

- `src/layouts/main.astro` (istniejący)

  - Główny layout aplikacji po zalogowaniu.
  - Rozszerzyć o komponent nawigacji (`NavMenu`), który reaguje na stan zalogowania (pokazuje przycisk wylogowania oraz linki do "Fiszki" (`/flashcards`) i "Generowanie" (`/generate`)).

- Strony Astro:
  - `src/pages/auth/register.astro`
  - `src/pages/auth/login.astro`
  - `src/pages/auth/forgot-password.astro`
  - `src/pages/auth/reset-password/[token].astro`

Każda strona importuje swój Reactowy formularz i korzysta z layoutu `auth.astro`.

### 1.2 Komponenty React (client-side)

W katalogu `src/components/auth/` utworzyć:

- `SignUpForm.tsx`

  - Pola: `email`, `password`, `confirmPassword`.
  - Walidacja klient-side: email regex, password min. 8 znaków, potwierdzenie hasła.
  - Komunikaty błędów pod polami (użycie komponentów `Input` i `FormError` z Shadcn/ui).
  - Wywołuje API: `POST /api/auth/register`, obsługuje odpowiedź (ustawia sesję HTTP-only), przy sukcesie przekierowanie do `/generate`.

- `LoginForm.tsx`

  - Pola: `email`, `password`.
  - Walidacja: niepuste, email.
  - Wywołuje `POST /api/auth/login`, obsługa błędów 401/400, przy sukcesie redirect do `/generate`.

- `ForgotPasswordForm.tsx`

  - Pole: `email`.
  - Walidacja: email.
  - Wywołuje `POST /api/auth/forgot-password`, wyświetla komunikat o wysłanym mailu.

- `ResetPasswordForm.tsx`
  - Pola: `newPassword`, `confirmNewPassword`.
  - Token odczytany z query param (`[token]`).
  - Walidacja haseł i ich zgodności.
  - Wywołuje `POST /api/auth/reset-password`, przekazuje `{ token, newPassword }`, po sukcesie redirect do `/auth/login`.

### 1.3 Walidacja i scenariusze błędów

- Walidacja po stronie klienta z użyciem Zod + React Hook Form.
- Dodatkowa walidacja na serwerze dla kazdego endpointa (schema requestu).
- Komunikaty błędów:
  - "Nieprawidłowy adres email"
  - "Hasło musi mieć co najmniej 8 znaków"
  - "Hasła nie pasują"
  - "Email już zarejestrowany"
  - "Nieprawidłowe dane logowania"
  - "Link resetujący hasło jest nieprawidłowy lub wygasł"
  - Ogólny "Błąd serwera, spróbuj ponownie później"

### 1.4 Nawigacja i UX

- Po rejestracji i automatycznym zalogowaniu przekierowanie do widoku generowania fiszek (`/generate`).
- Linki w layoutach:
  - `auth.astro`: link do logowania/rejestracji -> przełączanie między formularzami.
  - `main.astro`: link Wyloguj (wywołuje `/api/auth/logout`).
- Blokada dostępu do stron `/app/*` dla niezalogowanych (middleware).

---

## 2. Logika backendowa

### 2.1 Endpoints API

W katalogu `src/pages/api/auth/`:

- `register.ts` (POST)
- `login.ts` (POST)
- `logout.ts` (POST)
- `forgot-password.ts` (POST)
- `reset-password.ts` (POST)

Każdy endpoint:

- Parsuje body i waliduje schemą Zod.
- Używa klienta Supabase dostępnego z `locals.supabase` (dodany przez middleware), np. `const { data, error } = await locals.supabase.auth.signUp(...)`.
- Ustawia lub usuwa ciasteczka HTTP-Only z sesją JWT (Astro.cookies).
- Zwraca JSON z polem `error` lub `data`.

### 2.2 Modele danych i DTO

- Korzystamy z domyślnego schematu Supabase Auth dla tabeli `auth.users`.
- Dodatkowa tabela `profiles` synchronizowana po `signUp` (funkcja edge trigger).
- Definiujemy interfejsy TypeScript w `src/types.ts`:
  - `RegisterRequest`, `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`.
  - `AuthResponse` ze statusem i ewentualnym komunikatem.

### 2.3 Walidacja i obsługa wyjątków

- Schemat wejścia Zod w dla kazdego endpointa.
- Wczesne zwracanie błędu przy nieprawidłowych danych (status 400).
- Błędy Supabase (np. email zajęty, niepoprawne dane) przekładamy na status 400/401.
- W przypadku nieoczekiwanych wyjątków zwracamy status 500 i logujemy szczegóły.

### 2.4 Middleware i SSR

- `src/middleware/index.ts`:
  - Czyta cookie `sb-access-token` i weryfikuje sesję przez supabase.auth.api.getUser.
  - Dla stron `/flashcards` i `/generate`: jeśli brak zalogowanego użytkownika, redirect do `/auth/login`.
  - Inne ścieżki pozostają bez zmian.
- Zarejestrować middleware w `astro.config.mjs`:
  ```js
  export default defineConfig({
    // ... existing config ...
    integrations: [],
    middlewares: ["src/middleware/index.ts"],
  });
  ```

---

## 3. System autentykacji (Supabase Auth)

### 3.1 Konfiguracja klienta

- `src/db/supabase.client.ts`:

  ```ts
  import { createClient } from "@supabase/supabase-js";
  import type { Database } from "../db/database.types";

  // Używamy zmiennych środowiskowych SUPABASE_URL i SUPABASE_KEY zgodnie z wytycznymi
  export const supabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);
  ```

### 3.2 Rejestracja i logowanie

- Frontendowy `SignUpForm` wywołuje API `register.ts`, otrzymuje odpowiedź ze statusem i po ustawieniu sesji HTTP-only redirect do `/generate`.
- Frontendowy `LoginForm` wywołuje API `login.ts`, otrzymuje sesję HTTP-only i redirect do `/generate`.

### 3.3 Wylogowanie

- Endpoint `logout.ts` wywołuje `supabase.auth.signOut()` i usuwa ciasteczko.
- Po wylogowaniu redirect do `/`.

### 3.4 Odzyskiwanie hasła

- `ForgotPasswordForm` wywołuje `supabase.auth.resetPasswordForEmail(email)`.
- Mail z linkiem `https://<YOUR_DOMAIN>/auth/reset-password?token=...`
- `ResetPasswordForm` wywołuje `supabase.auth.updateUser({ password: newPassword })`.

---

## 4. Zabezpieczenie zasobów i RLS

- W tabeli `flashcards` każda pozycja posiada kolumnę `user_id`.
- W Supabase włączyć Row-Level Security (RLS) z polityką: `auth.uid() = user_id`.
- Wszystkie endpointy API dla `flashcards` i akcji generowania fiszek wykorzystują sesyjne cookie i zwracają zasoby wyłącznie dla zalogowanego użytkownika.

Całość modułu autentykacji została zaprojektowana tak, aby integrować się z istniejącą strukturą Astro + React + Supabase, zapewniając bezpieczeństwo i przejrzystą separację warstw.
