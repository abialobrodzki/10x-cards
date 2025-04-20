/* eslint-disable no-console */
import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsRequestDto } from "../../../types";
import { generateFlashcards } from "../../../lib/services/generation.service";

export const prerender = false;

// Validation schema for the request
const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(1000, "Tekst jest zbyt krótki. Minimum to 1000 znaków.")
    .max(10000, "Tekst jest zbyt długi. Maksimum to 10000 znaków."),
  language: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log("Received generation request");

    // Sprawdź, czy użytkownik jest zalogowany
    if (!locals.user?.id) {
      console.log("Unauthorized access attempt - user not logged in");
      return new Response(
        JSON.stringify({
          error: "Nie jesteś zalogowany. Zaloguj się, aby wygenerować fiszki.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;
    console.log("Using user ID:", userId);

    // Diagnostyka klienta Supabase
    console.log("Supabase client from locals:", !!locals.supabase);
    console.log("Supabase auth available:", !!locals.supabase?.auth);

    // Validate the request body
    const body = (await request.json()) as GenerateFlashcardsRequestDto;
    console.log("Request body text length:", body.text?.length || 0);

    const result = generateFlashcardsSchema.safeParse(body);
    console.log("Validation result:", result.success ? "Passed" : "Failed");

    if (!result.success) {
      console.log("Validation failed:", result.error.errors[0].message);
      return new Response(
        JSON.stringify({
          error: result.error.errors[0].message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process the generation request
    console.log("Starting flashcards generation with user ID:", userId);
    const response = await generateFlashcards(locals.supabase, userId, result.data.text, result.data.language);
    console.log("Generation completed, cards count:", response.flashcards?.length || 0);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate endpoint:", error);

    // Diagnostyka błędu
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return new Response(
      JSON.stringify({
        error: "Failed to generate flashcards",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
