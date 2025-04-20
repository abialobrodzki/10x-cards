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

export const onRequest = defineMiddleware(async ({ locals, cookies, request, url, redirect }, next) => {
  // Sprawdzamy, czy ścieżka jest publiczna
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path + "/"));

  // Dla publicznych endpointów API pomijamy sprawdzenie uwierzytelniania
  if (url.pathname.startsWith("/api/auth/")) {
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
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Błąd podczas pobierania użytkownika:", error);
    }

    if (user) {
      // Ustaw informacje o użytkowniku w locals
      locals.user = {
        id: user.id,
        email: user.email,
      };
      console.log("Middleware - Użytkownik zalogowany:", user.email);
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
  return next();
});
