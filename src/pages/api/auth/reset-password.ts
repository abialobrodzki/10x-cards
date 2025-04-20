import { z } from "zod";
import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

// Schema dla walidacji danych
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują",
    path: ["confirmPassword"],
  });

export async function POST({ request, cookies }: APIContext) {
  try {
    // Parsowanie body requestu
    const body = await request.json();

    // Walidacja danych wejściowych
    const validationResult = resetPasswordSchema.safeParse(body);

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

    const { password } = validationResult.data;

    // Utworzenie klienta Supabase dla tego requestu
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Aktualizacja hasła
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      // Obsługa błędów
      let errorMessage = "Błąd podczas resetowania hasła";
      const statusCode = 400;

      if (error.message.includes("token")) {
        errorMessage = "Link resetujący hasło jest nieprawidłowy lub wygasł";
      } else if (error.message.includes("password")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pomyślna zmiana hasła
    return new Response(
      JSON.stringify({
        message: "Hasło zostało pomyślnie zmienione",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    /* eslint-disable no-console */
    console.error("Błąd podczas resetowania hasła:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera. Spróbuj ponownie później." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
