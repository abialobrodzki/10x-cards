import { z } from "zod";
import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

// Schema dla walidacji danych
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

export async function POST({ request, cookies }: APIContext) {
  try {
    // Parsowanie body requestu
    const body = await request.json();

    // Walidacja danych wejściowych
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy adres email",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email } = validationResult.data;

    // Utworzenie klienta Supabase dla tego requestu
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Żądanie resetowania hasła
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    if (error) {
      /* eslint-disable no-console */
      console.error("Błąd podczas wysyłania linka resetującego:", error);
      // W celach bezpieczeństwa nie informujemy, czy email istnieje w bazie
      // ale logujemy błąd po stronie serwera
    }

    // Zawsze zwracamy sukces, nawet jeśli email nie istnieje (względy bezpieczeństwa)
    return new Response(
      JSON.stringify({
        message: "Link do resetowania hasła został wysłany, jeśli podany adres email istnieje w naszej bazie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Błąd podczas obsługi resetowania hasła:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera. Spróbuj ponownie później." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
