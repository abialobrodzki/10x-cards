/* eslint-disable no-console */
import type { APIRoute } from "astro";
import { z } from "zod";
import type { AcceptFlashcardsRequestDto, AcceptFlashcardsResponseDto } from "../../../../types";
import { createFlashcardsService } from "../../../../lib/services/flashcard.service";

export const prerender = false;

// Validation schema for request body
const flashcardSchema = z.object({
  front: z.string().min(1, "Pole przodu fiszki nie może być puste"),
  back: z.string().min(1, "Pole tyłu fiszki nie może być puste"),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.number().nullable(),
});

const requestSchema = z.object({
  flashcards: z.array(flashcardSchema).min(1, "Musisz podać przynajmniej jedną fiszkę"),
});

export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    console.log("Accept flashcards request received");

    // Sprawdź, czy użytkownik jest zalogowany
    if (!locals.user?.id) {
      console.log("Unauthorized access attempt - user not logged in");
      return new Response(
        JSON.stringify({
          error: "Nie jesteś zalogowany. Zaloguj się, aby zapisać fiszki.",
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

    const generationId = parseInt(params.id as string, 10);
    console.log("Generation ID:", generationId);

    if (isNaN(generationId)) {
      console.log("Invalid generation ID");
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator generacji",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as AcceptFlashcardsRequestDto;
    console.log("Request body flashcards count:", body.flashcards?.length || 0);

    const validationResult = requestSchema.safeParse(body);
    console.log("Validation result:", validationResult.success ? "Passed" : "Failed");

    if (!validationResult.success) {
      console.log("Validation error:", validationResult.error.issues[0].message);
      return new Response(
        JSON.stringify({
          error: validationResult.error.issues[0].message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Przygotuj fiszki do zapisania z określonym generation_id
    const flashcardsToSave = body.flashcards.map((f) => ({
      ...f,
      generation_id: generationId,
    }));

    console.log("Saving flashcards to database...");
    // Zapisz fiszki przy użyciu serwisu
    const createdFlashcards = await createFlashcardsService(locals.supabase, userId, { flashcards: flashcardsToSave });
    console.log("Flashcards saved successfully, count:", createdFlashcards.length);

    // Count edited and non-edited flashcards
    const aiFullCount = body.flashcards.filter((f) => f.source === "ai-full").length;
    const aiEditedCount = body.flashcards.filter((f) => f.source === "ai-edited").length;

    // Prepare response
    const response: AcceptFlashcardsResponseDto = {
      generation: {
        id: generationId,
        accepted_unedited_count: aiFullCount,
        accepted_edited_count: aiEditedCount,
        updated_at: new Date().toISOString(),
      },
      flashcards: createdFlashcards,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in accept-flashcards endpoint:", error);

    // Diagnostyka błędu
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas zapisywania fiszek",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
