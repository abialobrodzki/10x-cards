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
  generation_id: z.number().positive().optional(),
});

// Schema for validating multiple flashcards creation
const FlashcardsSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1),
});

export async function GET({ request, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    const response = await getFlashcardsService(locals.supabase, locals.user.id, params);

    // Return successful response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
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
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();

    // Check if it's a single flashcard or multiple flashcards
    let response;

    if (Array.isArray(body.flashcards)) {
      // Validate multiple flashcards
      const validationResult = FlashcardsSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ValidationErrorResponseDto = {
          error: "Invalid flashcards data",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create multiple flashcards
      const flashcardsDto: CreateFlashcardsDto = validationResult.data;
      response = await createFlashcardsService(locals.supabase, locals.user.id, flashcardsDto);
    } else {
      // Validate single flashcard
      const validationResult = FlashcardSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ValidationErrorResponseDto = {
          error: "Invalid flashcard data",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create single flashcard
      const flashcardDto: CreateFlashcardDto = validationResult.data;
      response = await createFlashcardService(locals.supabase, locals.user.id, flashcardDto);
    }

    // Return successful response
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating flashcards:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
