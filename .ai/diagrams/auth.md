<authentication_analysis>

1. Przepływy autentykacji:

- Rejestracja (signUp) – US-001
- Logowanie (signIn) – US-002
- Wylogowanie (signOut)
- Zapomniane hasło (resetPasswordForEmail) – US-?
- Reset hasła (updateUser) z tokenem

2. Aktorzy i interakcje:

- Browser wysyła żądania do AstroAPI (endpointy /api/auth/)
- AstroAPI korzysta z Middleware do weryfikacji tokenów
- Middleware komunikuje się z Supabase Auth
- Supabase Auth zwraca dane sesji lub błędy

3. Weryfikacja i odświeżanie tokenów:

- Middleware sprawdza accessToken z cookie
- Przy wygasłym tokenie wywołuje refreshSession()
- Nowe tokeny zapisuje w cookies

4. Opis kroków:

- signUp: email+hasło → SupabaseAuth → sesja
- signIn: email+hasło → SupabaseAuth → sesja
- refreshSession: refreshToken → SupabaseAuth → nowe sesje
- getUser: accessToken → SupabaseAuth → dane użytkownika
- signOut: usuwa sesję w SupabaseAuth i czyści cookie
  </authentication_analysis>

<mermaid_diagram>

```mermaid
sequenceDiagram
autonumber
participant Browser
participant AstroAPI
participant Middleware
participant SupabaseAuth

Browser->>AstroAPI: POST /api/auth/register
activate AstroAPI
AstroAPI->>SupabaseAuth: signUp()
activate SupabaseAuth
SupabaseAuth-->>AstroAPI: session tokens
deactivate SupabaseAuth
AstroAPI-->>Browser: Set-Cookie, 200 OK
deactivate AstroAPI

alt Rejestracja udana
  Browser->>AstroAPI: GET /generate
  activate AstroAPI
  AstroAPI->>Middleware: weryfikacja accessToken
  activate Middleware
  Middleware->>SupabaseAuth: getUser()
  activate SupabaseAuth
  SupabaseAuth-->>Middleware: user data
  deactivate SupabaseAuth
  Middleware-->>AstroAPI: locals.supabase
  deactivate Middleware
  AstroAPI-->>Browser: 200 OK + dane
  deactivate AstroAPI
else Rejestracja nieudana
  Browser-->>Browser: Wyświetl błąd
end

par Odświeżanie sesji przy wygasłym tokenie
  Browser->>AstroAPI: żądanie z wygasłym accessToken
  activate AstroAPI
  AstroAPI->>Middleware: sprawdź token
  activate Middleware
  Middleware->>SupabaseAuth: refreshSession()
  activate SupabaseAuth
  SupabaseAuth-->>Middleware: nowe tokeny
  deactivate SupabaseAuth
  Middleware-->>Browser: Set-Cookie (odświeżone)
  deactivate Middleware
  deactivate AstroAPI
end

Browser->>AstroAPI: POST /api/auth/logout
activate AstroAPI
AstroAPI->>SupabaseAuth: signOut()
activate SupabaseAuth
SupabaseAuth-->>AstroAPI: success
deactivate SupabaseAuth
AstroAPI-->>Browser: Clear-Cookie, 200 OK
deactivate AstroAPI
```

</mermaid_diagram>
