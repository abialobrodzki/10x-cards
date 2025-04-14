import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsRequestDto } from "../../../types";
import { generateFlashcards } from "../../../lib/services/generation.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

// Validation schema for the request
const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(1000, "Text must be between 1000 and 10000 characters")
    .max(10000, "Text must be between 1000 and 10000 characters"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // No authentication needed for now, using DEFAULT_USER_ID
    const userId = DEFAULT_USER_ID;

    // Validate the request body
    const body = (await request.json()) as GenerateFlashcardsRequestDto;
    const result = generateFlashcardsSchema.safeParse(body);

    if (!result.success) {
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
    const response = await generateFlashcards(locals.supabase, userId, result.data.text);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Error logging removed to fix linting issue

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
