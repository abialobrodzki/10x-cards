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
  // ... existing code ...
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

    // Sprawdzam ciasteczka sesji (tylko do logowania, nie do podejmowania decyzji)
    const cookieHeader = request.headers.get("Cookie") || "";
    const sessionCookies = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter((c) => AUTH_COOKIE_NAMES.some((name) => c.startsWith(name + "=")));

    console.log("Middleware - Ciasteczka sesji (tylko info):", sessionCookies);

    // Próba odświeżenia sesji
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.log("Błąd pobierania sesji:", sessionError);
        // If getSession returns 401, clear cookies and redirect
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
            // Jeśli odświeżenie się nie powiedzie, usuń ciasteczka i przekieruj
            if (!isPublicPath) {
              console.log("Odświeżenie sesji nie powiodło się, usuwam ciasteczka i przekierowuję");
              cookies.delete("sb-access-token", { path: "/" });
              cookies.delete("sb-refresh-token", { path: "/" });
              return redirect("/auth/login");
            }
          }
        }
      } else if (!sessionData.session && !isPublicPath) {
        // Sesja nie istnieje, a ścieżka wymaga uwierzytelnienia
        console.log("Brak aktywnej sesji (getSession), przekierowuję do logowania");
        return redirect("/auth/login");
      }
    } catch (refreshErr) {
      console.error("Błąd podczas odświeżania sesji:", refreshErr);
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
      // ... (obsługa błędów getUser, może wymagać dostosowania)
      if (error.status === 401 && !isPublicPath) {
        console.log("Błąd autoryzacji (401) getUser, przekierowuję do logowania");
        // ... (usuwanie ciasteczek) ...
        return redirect("/auth/login");
      }
    }

    console.log("Middleware - Użytkownik (po getUser):", user ? `zalogowany (${user.email})` : "niezalogowany");

    if (user) {
      // Ustaw informacje o użytkowniku w locals
      locals.user = {
        id: user.id,
        email: user.email,
      };
      console.log("Middleware - Ustawiono użytkownika w locals:", locals.user.id);
    } else if (!isPublicPath) {
      // Użytkownik nie istnieje (getUser zwrócił null) a ścieżka nie jest publiczna
      console.log("Middleware - Przekierowanie na /auth/login (brak użytkownika po getUser)");
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
