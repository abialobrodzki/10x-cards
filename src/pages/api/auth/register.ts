import { z } from "zod";
import type { APIContext } from "astro";

export const prerender = false;

// Schema dla walidacji danych rejestracji
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

    // Compute dynamic redirect base URL
    const pagesUrl = locals.runtime?.env?.CF_PAGES_URL;
    const redirectBase = pagesUrl ? `https://${pagesUrl}` : new URL(request.url).origin;

    // Rejestracja użytkownika
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectBase}/auth/login`,
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
