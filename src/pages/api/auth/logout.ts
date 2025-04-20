import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export async function POST({ request, cookies, redirect }: APIContext) {
  try {
    // Utworzenie klienta Supabase dla tego requestu
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Wylogowanie użytkownika
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: "Błąd podczas wylogowania" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Przekierowanie po pomyślnym wylogowaniu - na stronę logowania
    return redirect("/auth/login");
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Błąd podczas wylogowania:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera. Spróbuj ponownie później." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
