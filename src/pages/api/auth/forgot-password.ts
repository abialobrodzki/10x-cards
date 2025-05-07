import { z } from "zod";
import type { APIContext } from "astro";

export const prerender = false;

/**
 * Schemat Zod do walidacji danych wejściowych dla żądania resetowania hasła (tylko email).
 * Wymaga adresu email (prawidłowy format).
 */
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

/**
 * Obsługuje żądania POST do endpointu `/api/auth/forgot-password`.
 * Waliduje adres email, a następnie wysyła link do resetowania hasła na podany email
 * za pomocą Supabase. Zawsze zwraca odpowiedź z sukcesem (status 200) dla celów bezpieczeństwa,
 * niezależnie od tego, czy email istnieje w bazie, aby uniknąć enumeracji użytkowników.
 *
 * @param {APIContext} context - Kontekst API Astro.
 * @param {object} context.request - Obiekt żądania zawierający adres email w ciele (JSON).
 * @param {object} context.locals - Obiekt locals, w którym middleware udostępnia instancję Supabase.
 * @returns {Promise<Response>} - Zwraca Promise resolvingujący do obiektu Response ze statusem 200
 *                                informującym o wysłaniu linku (jeśli email istnieje).
 *                                W przypadku nieprawidłowych danych wejściowych zwraca Response ze statusem 400.
 *                                W przypadku innych błędów serwera zwraca Response ze statusem 500.
 * @dependencies
 * - Zod: Używany do walidacji danych wejściowych (`forgotPasswordSchema`).
 * - Supabase Auth API: Używany do wysyłania linka resetującego hasło (`supabase.auth.resetPasswordForEmail`).
 * - Middleware: Dostarcza zainicjowaną instancję Supabase w `context.locals.supabase`.
 * @throws {Error} - Może rzucić błąd, jeśli parsowanie JSON lub inne operacje zawiodą przed obsługą Supabase.
 */
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

    // Compute dynamic origin for redirect (handle localhost default port 4321)
    const urlObj = new URL(request.url);
    const origin =
      urlObj.hostname === "localhost" && !urlObj.port ? `${urlObj.protocol}//${urlObj.hostname}:4321` : urlObj.origin;

    // Żądanie resetowania hasła
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
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
