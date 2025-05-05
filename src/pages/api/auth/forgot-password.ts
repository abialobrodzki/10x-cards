import { z } from "zod";
import type { APIContext } from "astro";

export const prerender = false;

// Schema dla walidacji danych
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

export async function POST({ request, locals }: APIContext) {
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

    // Pobranie klienta Supabase z context.locals (utworzonego w middleware)
    const supabase = locals.supabase;

    // Sprawdzenie, czy klient Supabase istnieje (dodatkowe zabezpieczenie)
    if (!supabase) {
      // eslint-disable-next-line no-console
      console.error("API ForgotPassword - Błąd krytyczny: Brak instancji Supabase w locals!");
      return new Response(JSON.stringify({ error: "Błąd konfiguracji serwera." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Compute dynamic redirect base URL
    const pagesUrl = locals.runtime?.env?.CF_PAGES_URL;
    const redirectBase = pagesUrl ? `https://${pagesUrl}` : new URL(request.url).origin;

    // Żądanie resetowania hasła
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/auth/reset-password`,
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
