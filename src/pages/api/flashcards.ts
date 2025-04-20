/* eslint-disable no-console */
import { z } from "zod";
import type { APIContext } from "astro";
import type {
  FlashcardFilterParams,
  ValidationErrorResponseDto,
  CreateFlashcardDto,
  CreateFlashcardsDto,
} from "../../types";
import {
  getFlashcardsService,
  createFlashcardService,
  createFlashcardsService,
} from "../../lib/services/flashcard.service";
import { DEFAULT_USER_ID, supabaseClient } from "../../db/supabase.client";

export const prerender = false;

// Schema for validating query parameters
const QueryParamsSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  page_size: z.coerce.number().positive().max(100).optional().default(20),
  sort_by: z.enum(["created_at", "updated_at", "front", "back"]).optional().default("created_at"),
  generation_id: z.coerce.number().positive().optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
});

// Schema for validating single flashcard creation
const FlashcardSchema = z.object({
  front: z.string().min(3).max(500),
  back: z.string().min(3).max(500),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.union([z.number().positive(), z.null()]).optional(),
});

// Schema for validating multiple flashcards creation
const FlashcardsSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1),
});

export async function GET({ request, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase) {
      console.warn("Brak locals.supabase - używam supabaseClient jako fallback");
      locals.supabase = supabaseClient;
    }
    const userId = locals.user?.id || DEFAULT_USER_ID;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParamsResult = QueryParamsSchema.safeParse(Object.fromEntries(url.searchParams));

    if (!queryParamsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid query parameters",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get flashcards using the service
    const params: FlashcardFilterParams = queryParamsResult.data;
    const response = await getFlashcardsService(locals.supabase, userId, params);

    // Return successful response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST({ request, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase) {
      console.warn("Brak locals.supabase - używam supabaseClient jako fallback");
      locals.supabase = supabaseClient;
    }
    const userId = locals.user?.id || DEFAULT_USER_ID;

    // Parse request body
    const body = await request.json();
    console.log("Otrzymano dane do POST /flashcards:", JSON.stringify(body));

    // Check if it's a single flashcard or multiple flashcards
    let response;

    if (body.flashcards && Array.isArray(body.flashcards)) {
      // Jest tablica fiszek - waliduj jako multiple flashcards
      console.log("Przetwarzam tablicę fiszek:", body.flashcards.length);
      const validationResult = FlashcardsSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ValidationErrorResponseDto = {
          error: "Invalid flashcards data",
        };
        console.error("Błąd walidacji tablicy fiszek:", validationResult.error);
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create multiple flashcards
      const flashcardsDto: CreateFlashcardsDto = validationResult.data;
      response = await createFlashcardsService(locals.supabase, userId, flashcardsDto);
    } else {
      // Pojedyncza fiszka - waliduj jako single flashcard
      console.log("Przetwarzam pojedynczą fiszkę");
      const validationResult = FlashcardSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ValidationErrorResponseDto = {
          error: "Invalid flashcard data",
        };
        console.error("Błąd walidacji pojedynczej fiszki:", validationResult.error);
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create single flashcard
      const flashcardDto: CreateFlashcardDto = validationResult.data;
      console.log("Tworzę fiszkę:", JSON.stringify(flashcardDto));
      response = await createFlashcardService(locals.supabase, userId, flashcardDto);
    }

    // Return successful response
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating flashcards:", error);

    // Więcej szczegółów o błędzie
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
