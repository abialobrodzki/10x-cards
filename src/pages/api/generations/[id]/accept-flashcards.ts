import type { APIRoute } from "astro";
import { z } from "zod";
import type { AcceptFlashcardsRequestDto, AcceptFlashcardsResponseDto } from "../../../../types";

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

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const generationId = parseInt(params.id as string, 10);

    if (isNaN(generationId)) {
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
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
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

    // Here would be the actual Supabase database operation to save flashcards
    // For now, we'll simulate this with a simple example

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
      flashcards: body.flashcards.map((f, index) => ({
        id: Date.now() + index, // Simulate unique IDs
        front: f.front,
        back: f.back,
        source: f.source,
        created_at: new Date().toISOString(),
      })),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Error is handled with a generic message

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas zapisywania fiszek",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
