<user_journey_analysis>

1. Ścieżki użytkownika:

   - StronaGłówna → Logowanie → PanelUżytkownika
   - StronaGłówna → Rejestracja → PanelUżytkownika
   - StronaGłówna → Logowanie → OdzyskiwanieHasła → ResetHasła → StronaLogowania

2. Główne podróże i stany:

   - StronaGłówna: wybór akcji
   - Logowanie: formularz logowania
   - Rejestracja: formularz rejestracji
   - OdzyskiwanieHasła: formularz zapomnianego hasła
   - ResetHasła: ustawienie nowego hasła
   - PanelUżytkownika: dostęp do funkcji aplikacji

3. Punkty decyzyjne i ścieżki alternatywne:

   - Walidacja formularzy (sukces/błąd)
   - Weryfikacja tokena (poprawny/błędny)
   - Link 'Zapomniałem hasła' prowadzi do odzyskiwania

4. Cel każdego stanu:
   - StronaGłówna: start podróży
   - Logowanie: uwierzytelnienie użytkownika
   - Rejestracja: tworzenie nowego konta
   - OdzyskiwanieHasła: inicjacja resetu hasła
   - ResetHasła: przywrócenie dostępu po resetowaniu
   - PanelUżytkownika: kontynuacja pracy w aplikacji
     </user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2

[*] --> StronaGłówna
StronaGłówna --> Logowanie : Kliknij 'Zaloguj'
StronaGłówna --> Rejestracja : Kliknij 'Zarejestruj'

state "Logowanie" as Logowanie {
  [*] --> FormularzLogowania
  FormularzLogowania --> WalidacjaLog : Kliknij 'Zaloguj'
  WalidacjaLog --> Zweryfikowano <<choice>>
  Zweryfikowano --> PanelUżytkownika : Sukces
  Zweryfikowano --> FormularzLogowania : Błąd
}

state "Rejestracja" as Rejestracja {
  [*] --> FormularzRejestracji
  FormularzRejestracji --> WalidacjaReg : Kliknij 'Zarejestruj'
  WalidacjaReg --> Zarejestrowano <<choice>>
  Zarejestrowano --> PanelUżytkownika : Sukces
  Zarejestrowano --> FormularzRejestracji : Błąd
}

Logowanie --> OdzyskiwanieHasła : Kliknij 'Zapomniałem hasła'

state "Odzyskiwanie hasła" as OdzyskiwanieHasla {
  [*] --> FormularzHasla
  FormularzHasla --> WeryfikacjaEmail : Kliknij 'Wyślij'
  WeryfikacjaEmail --> EmailWysłany : Sukces
  WeryfikacjaEmail --> FormularzHasla : Błąd
}
note left of EmailWysłany
  Użytkownik otrzymuje link do resetu
end note

EmailWysłany --> ResetHasła : Kliknij link w mailu
state "Reset hasła" as ResetHasła {
  [*] --> FormularzResetu
  FormularzResetu --> WeryfikacjaNowegoHasla : Kliknij 'Zresetuj'
  WeryfikacjaNowegoHasla --> ResetUdany <<choice>>
  ResetUdany --> StronaLogowania : Sukces
  ResetUdany --> FormularzResetu : Błąd
}

PanelUżytkownika --> [*] : Wyloguj
```
