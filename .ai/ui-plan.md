# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Architektura UI projektu 10x-cards opiera się na przejrzystej strukturze widoków, dzięki czemu użytkownicy mogą efektywnie korzystać z aplikacji. Główne widoki aplikacji obejmują ekran autoryzacji (logowanie/rejestracja), główny widok generowania fiszek, widok zarządzania fiszkami (lista z możliwością edycji i usuwania), panel sesji nauki (powtórek) oraz panel użytkownika (profil, historia generacji). Nawigacja odbywa się za pomocą topbara opartego na komponentach Shadcn/ui. Projekt korzysta z responsywnego designu Tailwind, gotowych komponentów Shadcn/ui oraz React. UI spełnia wytyczne dostępności WCAG AA.

## 2. Lista widoków

### Widok autoryzacji

- **Nazwa widoku**: Autoryzacja
- **Ścieżka widoku**: `/login` oraz `/register`
- **Główny cel**: Umożliwienie użytkownikom logowania i rejestracji, dostarczenie walidacji formularzy i komunikatów o błędach inline.
- **Kluczowe informacje**: Formularz z polem email i hasłem , komunikaty błędów uwierzytelniania.
- **Kluczowe komponenty widoku**:
  - Formularz logowania
  - Formularz rejestracji
  - Komponenty wejść (Input, Button)
  - Komponent wyświetlający komunikaty błędów
- **UX, dostępność i względy bezpieczeństwa**: Użycie etykiet ARIA tam, gdzie semantyczny HTML nie wystarcza; responsywność formularzy; jasne komunikaty o błędach; zabezpieczenia danych użytkowników.

### Widok generowania fiszek

- **Nazwa widoku**: Generowanie fiszek
- **Ścieżka widoku**: `/generate`
- **Główny cel**: Pozwolenie użytkownikowi na wprowadzenie tekstu oraz generowanie fiszek przez AI. Umożliwia akceptację, edycję lub odrzucenie poszczególnych propozycji.
- **Kluczowe informacje**: Pole tekstowe do wprowadzania treści, lista wygenerowanych fiszek, opcje "Zapisz wszystkie" lub "Zapisz wybrane", możliwość jednostkowej edycji fiszek.
- **Kluczowe komponenty widoku**:
  - Formularz tekstowy (textarea)
  - Lista propozycji fiszek
  - Modal do edycji fiszek
  - Przyciski interakcji (akceptacja, odrzucenie, zapis)
- **UX, dostępność i względy bezpieczeństwa**: Przejrzysty i intuicyjny interfejs; walidacja długości tekstu (1000-10000) z odpowiednimi komunikatami; responsywność; inline error messaging.

### Widok zarządzania fiszkami (lista fiszek)

- **Nazwa widoku**: Zarządzanie fiszkami
- **Ścieżka widoku**: `/flashcards` lub w ramach głównego widoku z modalami
- **Główny cel**: Wyświetlanie wszystkich utworzonych fiszek z możliwością edycji i usuwania.
- **Kluczowe informacje**: Lista fiszek, przyciski edycji i usuwania, modal edycji.
- **Kluczowe komponenty widoku**:
  - Lista fiszek
  - Modal edycji
  - Przycisk usunięcia, potwierdzenia operacji
- **UX, dostępność i względy bezpieczeństwa**: Intuicyjne operacje edycyjne; potwierdzenia usunięcia; czytelna prezentacja danych oraz dostępność poprzez odpowiednią strukturę HTML i etykiety ARIA(jezeli konieczne).

### Panel sesji nauki

- **Nazwa widoku**: Sesja nauki
- **Ścieżka widoku**: `/study-session`
- **Główny cel**: Dostarczenie fiszek do nauki w oparciu o algorytm spaced repetition oraz umożliwienie użytkownikowi ocenienia nauki.
- **Kluczowe informacje**: Aktualna fiszka, przycisk pokazania odpowiedzi, oceny jakości nauki (skalowane od 0 do 5), informacja o kolejnym terminie powtórek.
- **Kluczowe komponenty widoku**:
  - Karta fiszki z przyciskiem odsłonięcia odpowiedzi
  - System oceny (przyciski lub slider)
  - Informacje o kolejnej sesji
- **UX, dostępność i względy bezpieczeństwa**: Interaktywny i angażujący design; responsywność; czytelne komunikaty; zachowanie dostępności przy użyciu etykiet ARIA(jezeli konieczne).

### Panel użytkownika

- **Nazwa widoku**: Panel użytkownika
- **Ścieżka widoku**: `/profile`
- **Główny cel**: Zarządzanie profilem użytkownika, przegląd historii generacji fiszek i ustawień konta.
- **Kluczowe informacje**: Dane profilu, historia generacji, ustawienia (np. powiadomienia, dane osobowe).
- **Kluczowe komponenty widoku**:
  - Formularz aktualizacji profilu
  - Lista historii generacji
  - Komponenty wyświetlające dane statystyczne
- **UX, dostępność i względy bezpieczeństwa**: Intuicyjna edycja danych; ochrona danych osobowych; responsywność; użycie etykiet i poprawne semantyczne oznakowanie.

## 3. Mapa podróży użytkownika

1. Użytkownik wchodzi na stronę autoryzacji:
   - Rejestracja lub logowanie za pomocą formularza.
2. Po zalogowaniu użytkownik trafia na widok generowania fiszek:
   - Wprowadza wymagany tekst do pola formularza.
   - Otrzymuje wygenerowane fiszki z API (inline feedback komunikatów błędów, walidacja).
   - Dokonuje akceptacji, edycji lub odrzucenia poszczególnych propozycji.
3. Użytkownik może otworzyć modal w celu edycji wybranej fiszki lub usunięcia jej z listy.
4. Opcjonalnie użytkownik nawiguję do panelu sesji nauki:
   - Uczy się, ocenia, a system aktualizuje harmonogram powtórek.
5. Panel użytkownika umożliwia przegląd i edycję profilu oraz historię generacji fiszek.
6. Nawigacja między widokami odbywa się przez topbar dostępny na wszystkich stronach.

## 4. Układ i struktura nawigacji

- **Topbar**: Kluczowy element nawigacyjny, widoczny na każdej stronie.
  - Zawiera linki do: Generowanie fiszek, Zarządzanie fiszkami, Sesja nauki, Panel użytkownika.
  - Dodatkowo link do wylogowania.
  - Projektowany z komponentów shadcn/ui, responsywny i zgodny z wytycznymi WCAG AA.
- **Menu kontekstowe**: Wykorzystywane dla operacji specyficznych dla danego widoku (np. edycja, usuwanie).
- **Breadcrumbs**: Opcjonalnie, dla łatwiejszej orientacji użytkownika w aplikacji.
- **Responsywność**: Menu przekształca się w hamburger menu na urządzeniach mobilnych.

## 5. Kluczowe komponenty

- **Formularz autoryzacji**: Input, Button, walidacja, komunikaty błędów inline.
- **Pole tekstowe generowania fiszek**: Textarea z walidacją (1000-10000 znaków), zaawansowana obsługa błędów.
- **Lista fiszek**: Komponent wyświetlający fiszki jako karty z opcjami akceptacji, edycji i usuwania.
- **Modal edycji**: Okienko modalne umożliwiające edycję wybranej fiszki z zapisem zmian.
- **Topbar nawigacyjny**: Komponent z użyciem shadcn/ui, zapewniający intuicyjną nawigację i responsywność.
- **Komponenty sesji nauki**: Interaktywna karta fiszki z przyciskiem odsłonięcia odpowiedzi i systemem oceny.
- **Informacyjne komponenty komunikatów błędów**: Wyświetlanie błędów inline przy formularzach lub listach, z wykorzystaniem roli alert i ARIA(tam, gdzie semantyczny HTML nie wystarcza).
