/* eslint-disable no-console */
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance, type CloudflareAPIContext } from "../db/supabase.client";

/**
 * Tablica zawierająca ścieżki publiczne, które są dostępne dla użytkowników niezalogowanych.
 * Żądania do tych ścieżek nie podlegają sprawdzaniu sesji uwierzytelnienia.
 */
const PUBLIC_PATHS = [
  // Strony uwierzytelniania
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  // Endpointy API uwierzytelniania
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  // Strona główna
  "/",
  // ... existing code ...
];

/**
 * Globalny middleware Astro do obsługi uwierzytelniania i autoryzacji przy użyciu Supabase.
 * Sprawdza sesję użytkownika, odświeża tokeny jeśli jest to konieczne i ustawia instancję Supabase
 * oraz dane użytkownika w `context.locals`. Chroni prywatne ścieżki, przekierowując
 * niezalogowanych użytkowników do strony logowania.
 *
 * @param {object} context - Obiekt kontekstu Astro zawierający informacje o żądaniu i środowisku.
 * @param {object} context.locals - Obiekt locals do przechowywania danych w trakcie przetwarzania żądania.
 * @param {object} context.cookies - Obiekt cookies do zarządzania ciasteczkami.
 * @param {URL} context.url - Obiekt URL reprezentujący adres żądania.
 * @param {function} context.redirect - Funkcja do przekierowywania na inny adres URL.
 * @param {function} next - Funkcja pozwalająca na przejście do następnego middleware lub obsługi routingu.
 * @returns {Response} - Zwraca obiekt Response, który może być wynikiem dalszego przetwarzania
 *                     przez `next()` lub przekierowaniem/błędem zwróconym przez middleware.
 * @throws {Response} - Może zwrócić Response z błędem serwera (status 500) w przypadku
 *                      krytycznego błędu inicjalizacji Supabase.
 * @dependencies
 * - `createSupabaseServerInstance`: Funkcja do tworzenia instancji klienta Supabase po stronie serwera.
 * - Supabase Auth API: Wykorzystuje `supabase.auth.getSession()`, `supabase.auth.refreshSession()`,
 *                      `supabase.auth.getUser()` do zarządzania sesją i użytkownikiem.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, redirect } = context;
  console.log("Middleware - URL:", url.pathname);

  // Sprawdzamy, czy ścieżka jest publiczna
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path + "/"));
  console.log("Middleware - Ścieżka publiczna:", isPublicPath);

  // Inicjalizacja klienta Supabase - zawsze na początku, przekazując pełen kontekst
  try {
    locals.supabase = createSupabaseServerInstance(context as CloudflareAPIContext);
  } catch (error) {
    console.error("Middleware - BŁĄD KRYTYCZNY podczas tworzenia instancji Supabase:", error);
    // W przypadku krytycznego błędu konfiguracji, zwróć błąd serwera
    return new Response("Internal Server Error: Supabase configuration failed", { status: 500 });
  }

  // Pobierz utworzoną instancję dla dalszych operacji
  const supabase = locals.supabase;

  // Dla publicznych endpointów API auth pomijamy dalsze sprawdzanie uwierzytelniania
  if (url.pathname.startsWith("/api/auth/")) {
    console.log("Middleware - Endpoint API auth, pomijam sprawdzanie uwierzytelniania");
    return next(); // Przejdź dalej bez sprawdzania sesji
  }

  try {
    // Sprawdź czy użytkownik jest zalogowany
    console.log("Middleware - Sprawdzam sesję użytkownika");

    // Próba odświeżenia sesji
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log("Błąd pobierania sesji:", sessionError);
      if (sessionError.status === 401 && !isPublicPath) {
        console.log("Błąd autoryzacji (401) getSession, usuwam ciasteczka i przekierowuję do logowania");
        cookies.delete("sb-access-token", { path: "/" });
        cookies.delete("sb-refresh-token", { path: "/" });
        return redirect("/auth/login");
      }
    } else if (sessionData.session) {
      console.log(
        "Sesja ważna do:",
        sessionData.session.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : "nieznana"
      );
      // Logika odświeżania tokenu jeśli sesja wkrótce wygaśnie (np. mniej niż 5 minut)
      const expiryTime = sessionData.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const refreshThreshold = 300; // 5 minut w sekundach

      if (expiryTime && expiryTime < now + refreshThreshold) {
        console.log("Sesja wkrótce wygaśnie, próbuję odświeżyć");
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Błąd podczas odświeżania sesji:", refreshError);
          if (!isPublicPath) {
            console.log("Odświeżenie sesji nie powiodło się, usuwam ciasteczka i przekierowuję");
            cookies.delete("sb-access-token", { path: "/" });
            cookies.delete("sb-refresh-token", { path: "/" });
            return redirect("/auth/login");
          }
        }
      }

      // Sesja jest (lub została odświeżona), pobierz dane użytkownika
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError) {
        console.error("Middleware - Błąd podczas pobierania użytkownika (mimo sesji?):", getUserError);
        if (!isPublicPath) {
          console.log("Błąd getUser lub brak użytkownika, usuwam ciasteczka i przekierowuję do logowania");
          cookies.delete("sb-access-token", { path: "/" });
          cookies.delete("sb-refresh-token", { path: "/" });
          return redirect("/auth/login");
        }
      }

      if (user) {
        // Ustaw informacje o użytkowniku w locals
        locals.user = {
          id: user.id,
          email: user.email,
        };
        console.log("Middleware - Ustawiono użytkownika w locals:", locals.user.id);
      } else if (!isPublicPath) {
        // Sesja nie istnieje (getSession zwróciła null), a ścieżka wymaga uwierzytelnienia
        console.log("Brak aktywnej sesji (getSession), przekierowuję do logowania");
        return redirect("/auth/login");
      }
    } else if (!isPublicPath) {
      // Jeśli doszliśmy tutaj, a locals.user nie jest ustawiony (bo getSession lub getUser zawiodło)
      // i ścieżka jest chroniona, wykonajmy ostateczne przekierowanie.
      console.log("Middleware - Przekierowanie na /auth/login (brak użytkownika w locals dla chronionej ścieżki)");
      return redirect("/auth/login");
    }
  } catch (err) {
    console.error("Middleware - Błąd uwierzytelniania:", err);
    // W przypadku błędu, jeśli nie jesteśmy na publicznej ścieżce, przekieruj do logowania
    if (!isPublicPath) {
      return redirect("/auth/login");
    }
  }

  // Kontynuuj obsługę żądania
  const response = await next();
  console.log("Middleware - Zakończono przetwarzanie żądania:", url.pathname);
  return response;
});
