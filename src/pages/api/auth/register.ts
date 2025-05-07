import { z } from "zod";
import type { APIContext } from "astro";

export const prerender = false;

/**
 * Schemat Zod do walidacji danych wejściowych dla żądania rejestracji.
 * Wymaga adresu email (prawidłowy format), hasła (min. 8 znaków) oraz potwierdzenia hasła.
 * Schemat zawiera również walidację sprawdzającą, czy hasło i potwierdzenie hasła są identyczne.
 */
const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy adres email"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują",
    path: ["confirmPassword"],
  });

/**
 * Obsługuje żądania POST do endpointu `/api/auth/register`.
 * Waliduje dane rejestracji (email, hasło, potwierdzenie hasła) przy użyciu `registerSchema`,
 * próbuje zarejestrować nowego użytkownika za pomocą Supabase i zwraca odpowiedź z sukcesem lub błędem.
 * W przypadku pomyślnej rejestracji (z potwierdzeniem email) zwraca status 200 informujący o potrzebie weryfikacji.
 * W przypadku pomyślnej rejestracji (bez potwierdzenia email) przekierowuje do `/generate`.
 *
 * @param {APIContext} context - Kontekst API Astro.
 * @param {object} context.request - Obiekt żądania zawierający dane rejestracji w ciele (JSON).
 * @param {function} context.redirect - Funkcja do przekierowywania na inny adres URL.
 * @param {object} context.locals - Obiekt locals, w którym middleware udostępnia instancję Supabase.
 * @returns {Promise<Response>} - Zwraca Promise resolvingujący do obiektu Response.
 *                                W przypadku sukcesu zwraca Response ze statusem 200 (wymagana weryfikacja email)
 *                                lub przekierowanie (bez wymaganej weryfikacji email).
 *                                W przypadku nieprawidłowych danych wejściowych zwraca Response ze statusem 400.
 *                                W przypadku błędu rejestracji Supabase zwraca Response ze statusem 400.
 *                                W przypadku innych błędów serwera zwraca Response ze statusem 500.
 * @dependencies
 * - Zod: Używany do walidacji danych wejściowych (`registerSchema`).
 * - Supabase Auth API: Używany do rejestracji użytkownika (`supabase.auth.signUp`).
 * - Middleware: Dostarcza zainicjowaną instancję Supabase w `context.locals.supabase`.
 * @throws {Error} - Może rzucić błąd, jeśli parsowanie JSON lub inne operacje zawiodą przed obsługą Supabase.
 */
export async function POST({ request, redirect, locals }: APIContext) {
  try {
    // Parsowanie body requestu
    const body = await request.json();

    // Walidacja danych wejściowych
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane",
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Pobranie klienta Supabase z context.locals (utworzonego w middleware)
    const supabase = locals.supabase;

    // Sprawdzenie, czy klient Supabase istnieje (dodatkowe zabezpieczenie)
    if (!supabase) {
      // eslint-disable-next-line no-console
      console.error("API Register - Błąd krytyczny: Brak instancji Supabase w locals!");
      return new Response(JSON.stringify({ error: "Błąd konfiguracji serwera." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Compute actual origin for redirect links, adding default port 4321 for localhost
    const urlObj = new URL(request.url);
    const origin =
      urlObj.hostname === "localhost" && !urlObj.port ? `${urlObj.protocol}//${urlObj.hostname}:4321` : urlObj.origin;

    // Rejestracja użytkownika
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/login`,
      },
    });

    if (error) {
      // Obsługa błędów rejestracji
      let errorMessage = "Błąd podczas rejestracji";
      const statusCode = 400;

      if (error.message.includes("email")) {
        errorMessage = "Email już zarejestrowany";
      } else if (error.message.includes("password")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pomyślna rejestracja - informujemy o potrzebie weryfikacji emaila
    // W zależności od konfiguracji Supabase, może być potrzebna weryfikacja emaila
    const needsEmailConfirmation = !data.session;

    if (needsEmailConfirmation) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Rejestracja zakończona pomyślnie. Sprawdź swoją skrzynkę email, aby zweryfikować konto.",
          requiresEmailConfirmation: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Jeśli weryfikacja nie jest wymagana, przekieruj do /generate
      return redirect("/generate");
    }
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Błąd podczas rejestracji:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera. Spróbuj ponownie później." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
