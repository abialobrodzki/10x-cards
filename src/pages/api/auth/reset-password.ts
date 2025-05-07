/* eslint-disable no-console */
import { z } from "zod";
import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

// Schema dla walidacji danych włącznie z tokenem odzyskiwania
const resetPasswordSchema = z
  .object({
    token: z // Może to być token lub kod
      .string()
      .min(1, "Token lub kod resetu jest wymagany")
      .refine((val) => val.trim().length > 0, {
        message: "Token lub kod resetu nie może być pusty",
      }),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują",
    path: ["confirmPassword"],
  });

export async function POST(context: APIContext) {
  const { request } = context;
  try {
    // Log request URL and headers for debugging
    console.log("Reset password API - URL:", request.url);

    // Parsowanie body requestu
    const body = await request.json();
    console.log("Otrzymane dane:", {
      ...body,
      token: body.token ? `istnieje (${body.token.length} znaków)` : "brakuje lub pusty",
      password: body.password ? "istnieje" : "brakuje",
    });

    // Walidacja danych wejściowych
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Błąd walidacji:", validationResult.error.format());
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane",
          details: validationResult.error.format(),
          message: validationResult.error.errors[0]?.message || "Brak tokenu/kodu resetu lub nieprawidłowe hasło",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { token, password } = validationResult.data;
    const looksLikeCode = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
    console.log("Debug - Otrzymany identyfikator:", {
      value: token.substring(0, 10) + "...",
      length: token.length,
      looksLikeCode,
    });

    // Sprawdzenie formatu tokenu (UUID)
    if (!looksLikeCode) {
      console.error("Otrzymany token/kod nie ma formatu UUID. Przepływ nieobsługiwany.");
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format linku resetującego.",
          message: "Prosimy wygenerować nowy link resetujący hasło.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Inicjalizacja klienta Supabase
    // @ts-expect-error kontekst Astro przekazywany do klienta
    const supabase = createSupabaseServerInstance(context);
    console.log("Wykryto format kodu UUID. Próba wymiany kodu na sesję...");
    try {
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);

      if (exchangeError) {
        console.error("Błąd podczas wymiany kodu na sesję:", exchangeError);
        let errorMessage = "Nieprawidłowy lub wygasły kod resetujący.";
        if (exchangeError.message.includes("expired")) {
          errorMessage = "Kod resetujący wygasł. Proszę wygenerować nowy link.";
        } else if (exchangeError.message.includes("invalid")) {
          errorMessage = "Kod resetujący jest nieprawidłowy.";
        }
        return new Response(
          JSON.stringify({
            error: errorMessage,
            message: "Prosimy wygenerować nowy link resetujący hasło",
            details: exchangeError.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!sessionData?.session || !sessionData?.user) {
        console.error("Wymiana kodu na sesję nie zwróciła sesji lub użytkownika", sessionData);
        return new Response(
          JSON.stringify({
            error: "Nie udało się uzyskać sesji po wymianie kodu.",
            message: "Prosimy spróbować ponownie lub wygenerować nowy link.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("Kod pomyślnie wymieniony na sesję dla użytkownika:", sessionData.user.id);

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error("Błąd podczas aktualizacji hasła po wymianie kodu:", updateError);
        return new Response(
          JSON.stringify({
            error: "Nie udało się zaktualizować hasła.",
            message: "Wystąpił błąd podczas zapisywania nowego hasła.",
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("Hasło pomyślnie zaktualizowane dla użytkownika:", sessionData.user.id);
      return new Response(
        JSON.stringify({
          message: "Hasło zostało pomyślnie zmienione",
          success: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Nieoczekiwany błąd podczas procesu wymiany kodu i aktualizacji hasła:", error);
      return new Response(
        JSON.stringify({
          error: "Wystąpił nieoczekiwany błąd serwera.",
          message: "Prosimy spróbować ponownie później.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Błąd główny w endpointcie resetowania hasła:", error);
    return new Response(JSON.stringify({ error: "Błąd serwera. Spróbuj ponownie później." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
