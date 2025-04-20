/* eslint-disable no-console */
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Ścieżki publiczne - dostępne dla niezalogowanych użytkowników
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
];

// Nazwy ciasteczek używane przez Supabase
const AUTH_COOKIE_NAMES = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "sb-127-auth-token"];

export const onRequest = defineMiddleware(async ({ locals, cookies, request, url, redirect }, next) => {
  console.log("Middleware - URL:", url.pathname);

  // Sprawdzamy, czy ścieżka jest publiczna
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path + "/"));
  console.log("Middleware - Ścieżka publiczna:", isPublicPath);

  // Dla publicznych endpointów API pomijamy sprawdzenie uwierzytelniania
  if (url.pathname.startsWith("/api/auth/")) {
    console.log("Middleware - Endpoint API auth, pomijam sprawdzanie uwierzytelniania");
    // Dodaj klienta Supabase do locals dla API
    locals.supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });
    return next();
  }

  // Inicjalizacja klienta Supabase z obsługą ciasteczek
  const supabase = createSupabaseServerInstance({
    headers: request.headers,
    cookies,
  });

  // Dodaj klienta Supabase do locals
  locals.supabase = supabase;

  try {
    // Sprawdź czy użytkownik jest zalogowany
    console.log("Middleware - Sprawdzam sesję użytkownika");

    // Sprawdzam ciasteczka sesji
    const cookieHeader = request.headers.get("Cookie") || "";
    const sessionCookies = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter((c) => AUTH_COOKIE_NAMES.some((name) => c.startsWith(name + "=")));

    console.log("Middleware - Ciasteczka sesji:", sessionCookies);

    // Pobierz token JWT bezpośrednio z ciasteczek
    const authCookieExists = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .some((c) => AUTH_COOKIE_NAMES.some((name) => c.startsWith(name + "=")));

    // Dodatkowa diagnoza tokenu
    if (authCookieExists) {
      console.log("Token JWT lub ciasteczko sesji jest dostępne");
    } else {
      console.log("UWAGA: Brak ciasteczek sesji!");
      // Sprawdźmy wszystkie ciasteczka
      console.log("Wszystkie ciasteczka:", cookieHeader);

      // Jeśli nie ma tokenu, a ścieżka nie jest publiczna - przekieruj do logowania
      if (!isPublicPath) {
        console.log("Middleware - Przekierowanie na /auth/login (brak ciasteczek sesji)");
        return redirect("/auth/login");
      }
    }

    // Próba odświeżenia sesji
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.log("Błąd pobierania sesji:", sessionError);

        // Jeśli błąd dotyczy autoryzacji i nie jest to ścieżka publiczna, wyloguj użytkownika
        if (sessionError.status === 401 && !isPublicPath) {
          console.log("Błąd autoryzacji (401), przekierowuję do strony logowania");

          // Usuń wszystkie ciasteczka Supabase
          sessionCookies.forEach((cookie) => {
            const cookieName = cookie.split("=")[0];
            cookies.delete(cookieName, { path: "/" });
          });

          return redirect("/auth/login");
        }
      } else if (sessionData.session) {
        console.log(
          "Sesja ważna do:",
          sessionData.session.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : "nieznana"
        );

        // Proaktywne odświeżanie - jeśli token wygasa za mniej niż 10 minut, odśwież go
        if (sessionData.session.expires_at) {
          const expiresAt = sessionData.session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - now;

          if (timeLeft < 600) {
            // 10 minut
            console.log("Token wygasa za", timeLeft, "sekund - próba odświeżenia");
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.error("Błąd odświeżania tokenu:", refreshError);

              // Jeśli nie można odświeżyć i nie jesteśmy na ścieżce publicznej, przekieruj do logowania
              if (!isPublicPath) {
                console.log("Nie można odświeżyć tokenu - przekierowuję do logowania");

                // Usuń wszystkie ciasteczka Supabase
                sessionCookies.forEach((cookie) => {
                  const cookieName = cookie.split("=")[0];
                  cookies.delete(cookieName, { path: "/" });
                });

                return redirect("/auth/login");
              }
            } else if (refreshData.session && refreshData.session.expires_at) {
              console.log("Token odświeżony, ważny do:", new Date(refreshData.session.expires_at * 1000).toISOString());
            }
          }
        }
      } else if (!sessionData.session && !isPublicPath) {
        // Sesja nie istnieje, a ścieżka wymaga uwierzytelnienia
        console.log("Brak aktywnej sesji, przekierowuję do logowania");
        return redirect("/auth/login");
      }
    } catch (refreshErr) {
      console.error("Błąd podczas odświeżania sesji:", refreshErr);

      // W przypadku błędu odświeżania, jeśli strona wymaga uwierzytelnienia, przekieruj do logowania
      if (!isPublicPath) {
        return redirect("/auth/login");
      }
    }

    // Pobierz ID użytkownika z tokenu JWT
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Middleware - Błąd podczas pobierania użytkownika:", error);

      // Jeśli błąd dotyczy sesji/autoryzacji i nie jesteśmy na ścieżce publicznej
      if (error.status === 401 && !isPublicPath) {
        console.log("Błąd autoryzacji (401), przekierowuję do strony logowania");

        // Usuń wszystkie ciasteczka Supabase
        sessionCookies.forEach((cookie) => {
          const cookieName = cookie.split("=")[0];
          cookies.delete(cookieName, { path: "/" });
        });

        return redirect("/auth/login");
      }
    }

    console.log("Middleware - Użytkownik:", user ? `zalogowany (${user.email})` : "niezalogowany");

    if (user) {
      // Ustaw informacje o użytkowniku w locals
      locals.user = {
        id: user.id,
        email: user.email,
      };
      console.log("Middleware - Ustawiono użytkownika w locals:", locals.user.id);
    } else if (!isPublicPath) {
      // Przekieruj na stronę logowania, jeśli ścieżka nie jest publiczna
      console.log("Middleware - Przekierowanie na /auth/login (brak użytkownika)");
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
