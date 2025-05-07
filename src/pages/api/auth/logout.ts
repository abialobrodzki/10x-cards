/* eslint-disable no-console */
import type { APIContext } from "astro";

export const prerender = false;

/**
 * Tablica zawierająca nazwy ciasteczek związanych z uwierzytelnianiem Supabase,
 * które powinny zostać usunięte podczas wylogowywania.
 */
const AUTH_COOKIE_NAMES = ["sb-access-token", "sb-refresh-token", "supabase-auth-token"];

/**
 * Obsługuje żądania POST do endpointu `/api/auth/logout`.
 * Wylogowuje użytkownika z Supabase i usuwa związane z sesją ciasteczka.
 * W zależności od nagłówka 'Accept' zwraca odpowiedź JSON (dla wywołań AJAX/Fetch) lub przekierowuje
 * użytkownika do strony logowania.
 *
 * @param {APIContext} context - Kontekst API Astro.
 * @param {object} context.request - Obiekt żądania (używany do odczytu nagłówków i ciasteczek).
 * @param {object} context.cookies - Obiekt cookies do zarządzania ciasteczkami.
 * @param {function} context.redirect - Funkcja do przekierowywania na inny adres URL.
 * @param {object} context.locals - Obiekt locals, w którym middleware udostępnia instancję Supabase.
 * @returns {Promise<Response>} - Zwraca Promise resolvingujący do obiektu Response.
 *                                W przypadku sukcesu zwraca Response ze statusem 200 i obiektem JSON
 *                                (jeśli żądanie akceptuje JSON) lub przekierowanie do `/auth/login`.
 *                                W przypadku błędów Supabase lub innych błędów serwera zwraca Response ze statusem 500.
 * @dependencies
 * - Supabase Auth API: Używany do wylogowania użytkownika (`supabase.auth.signOut`).
 * - Middleware: Dostarcza zainicjowaną instancję Supabase w `context.locals.supabase`.
 * @throws {Error} - Może rzucić błąd w przypadku nieoczekiwanych błędów serwera.
 */
export async function POST(context: APIContext) {
  const { request, cookies, redirect, locals } = context;
  console.log("Rozpoczynam proces wylogowywania");

  try {
    // Use Supabase client from middleware
    const supabase = locals.supabase;

    // Wyloguj użytkownika w Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Błąd wylogowywania z Supabase:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Wystąpił błąd podczas wylogowywania",
        }),
        { status: 500 }
      );
    }

    // Dodatkowo wyczyść wszystkie ciasteczka Supabase
    console.log("Usuwam ciasteczka sesji");

    // Pobierz wszystkie ciasteczka
    const cookieHeader = request.headers.get("Cookie") || "";
    const sessionCookies = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.startsWith("sb-") || c.startsWith("supabase-"));

    // Usuń wszystkie ciasteczka Supabase
    sessionCookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0];
      console.log("Usuwam ciasteczko:", cookieName);
      cookies.delete(cookieName, { path: "/" });
    });

    // Dla pewności usuń też znane ciasteczka autoryzacji
    AUTH_COOKIE_NAMES.forEach((cookieName) => {
      cookies.delete(cookieName, { path: "/" });
    });

    console.log("Użytkownik wylogowany pomyślnie");

    // Sprawdź, czy to wywołanie z frontend - wtedy zwróć JSON
    const acceptHeader = request.headers.get("Accept") || "";
    if (acceptHeader.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Wylogowano pomyślnie",
          redirectUrl: "/auth/login",
        }),
        { status: 200 }
      );
    }

    // W przeciwnym razie przekieruj do strony logowania
    return redirect("/auth/login");
  } catch (error) {
    console.error("Niespodziewany błąd wylogowywania:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił nieoczekiwany błąd podczas wylogowywania",
      }),
      { status: 500 }
    );
  }
}
