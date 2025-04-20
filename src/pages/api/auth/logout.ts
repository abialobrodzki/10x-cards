/* eslint-disable no-console */
import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

// Nazwy ciasteczek używane przez Supabase
const AUTH_COOKIE_NAMES = ["sb-access-token", "sb-refresh-token", "supabase-auth-token"];

export async function POST({ request, cookies, redirect }: APIContext) {
  console.log("Rozpoczynam proces wylogowywania");

  try {
    // Utworzenie klienta Supabase dla tego requestu
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

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
