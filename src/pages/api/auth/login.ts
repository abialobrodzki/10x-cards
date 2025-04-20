/* eslint-disable no-console */
import { z } from "zod";
import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

// Schema dla walidacji danych logowania
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export async function POST({ request, cookies }: APIContext) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.safeParse(body);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nieprawidłowe dane logowania",
        }),
        { status: 400 }
      );
    }

    // Utworzenie klienta Supabase dla tego requestu
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Próba zalogowania użytkownika
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.data.email,
      password: validatedData.data.password,
    });

    if (error) {
      console.error("Błąd logowania:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nieprawidłowy email lub hasło",
        }),
        { status: 401 }
      );
    }

    // Sprawdzamy, czy mamy sesję
    if (data.session) {
      console.log("Utworzono sesję użytkownika:", data.user?.email);

      // Sprawdzmy, czy po zalogowaniu możemy pobrać użytkownika
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("Błąd pobierania użytkownika po logowaniu:", userError);
      } else {
        console.log("Pomyślnie pobrano dane użytkownika:", userData.user?.email);
      }

      // Zwracamy sukces z URL do przekierowania
      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: "/generate",
          message: "Zalogowano pomyślnie",
          user: {
            id: data.user?.id,
            email: data.user?.email,
          },
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Nie udało się utworzyć sesji",
      }),
      { status: 500 }
    );
  } catch (error) {
    console.error("Błąd logowania:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd podczas logowania",
      }),
      { status: 500 }
    );
  }
}
