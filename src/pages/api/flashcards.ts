/* eslint-disable no-console */
import { z } from "zod";
import type { APIContext } from "astro";
import type { FlashcardFilterParams, ValidationErrorResponseDto, CreateFlashcardDto, FlashcardDto } from "../../types";
import {
  getFlashcardsService,
  createFlashcardService,
  deleteFlashcardService,
  updateFlashcardService,
} from "../../lib/services/flashcard.service";

export const prerender = false;

/**
 * @module Flashcards API Endpoint
 * @description Handles API requests for managing user flashcards.
 */

/**
 * @typedef {object} QueryParamsSchema
 * @description Schema for validating query parameters for fetching flashcards.
 * @property {number} [page=1] - The page number for pagination. Must be positive.
 * @property {number} [page_size=20] - The number of items per page. Must be positive and at most 100.
 * @property {"created_at"|"updated_at"|"front"|"back"} [sortBy] - Field to sort the results by (camelCase).
 * @property {"asc"|"desc"} [sortOrder] - Sort order (ascending or descending) (camelCase).
 * @property {number} [generationId] - Filter flashcards by generation ID (camelCase). Must be positive.
 * @property {"created_at"|"updated_at"|"front"|"back"} [sort_by] - Field to sort the results by (snake_case, for compatibility).
 * @property {"asc"|"desc"} [sort_order] - Sort order (ascending or descending) (snake_case, for compatibility).
 * @property {number} [generation_id] - Filter flashcards by generation ID (snake_case, for compatibility). Must be positive.
 * @property {"ai-full"|"ai-edited"|"manual"} [source] - Filter flashcards by source type.
 * @property {string} [searchText] - Text to search within flashcard front and back.
 */
// Schema for validating query parameters
const QueryParamsSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  page_size: z.coerce.number().positive().max(100).optional().default(20),

  // Parametry w camelCase (preferowane)
  sortBy: z.enum(["created_at", "updated_at", "front", "back"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  generationId: z.coerce.number().positive().optional(),

  // Parametry w snake_case (dla kompatybilności)
  sort_by: z.enum(["created_at", "updated_at", "front", "back"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  generation_id: z.coerce.number().positive().optional(),

  // Inne parametry
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  searchText: z.string().optional(),
});

/**
 * @typedef {object} FlashcardSchema
 * @description Schema for validating a single flashcard object during creation.
 * @property {string} front - The front text of the flashcard. Minimum 3, maximum 500 characters.
 * @property {string} back - The back text of the flashcard. Minimum 3, maximum 500 characters.
 * @property {"ai-full"|"ai-edited"|"manual"} source - The source of the flashcard.
 * @property {number|null} [generation_id] - The ID of the generation process that created this flashcard, if applicable. Must be positive or null.
 */
// Schema for validating single flashcard creation
const FlashcardSchema = z.object({
  front: z.string().min(3).max(500),
  back: z.string().min(3).max(500),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.union([z.number().positive(), z.null()]).optional(),
});

/**
 * @typedef {object} FlashcardsSchema
 * @description Schema for validating an array of flashcard objects during batch creation.
 * @property {FlashcardSchema[]} flashcards - An array of flashcard objects. Must contain at least one flashcard.
 */
// Schema for validating multiple flashcards creation
const FlashcardsSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1),
});

/**
 * @typedef {object} UpdateFlashcardDtoSchema
 * @description Schema for validating flashcard data during update operations. Allows partial updates.
 * @property {string} [front] - The front text of the flashcard. Minimum 3, maximum 500 characters.
 * @property {string} [back] - The back text of the flashcard. Minimum 3, maximum 500 characters.
 * @property {"ai-full"|"ai-edited"|"manual"} [source] - The source of the flashcard.
 * @property {number|null} [generation_id] - The ID of the generation process that created this flashcard, if applicable. Must be positive or null.
 */
// Schema for validating flashcard update (allow partial updates)
const UpdateFlashcardDtoSchema = FlashcardSchema.partial();

/**
 * Handles GET requests to fetch flashcards for the authenticated user.
 * Parses and validates query parameters for filtering, pagination, and sorting.
 *
 * @param {APIContext} context - The Astro API context.
 * @param {object} context.request - The incoming request object.
 * @param {object} context.locals - The locals object containing `user` and `supabase`.
 * @param {object} context.locals.user - The authenticated user object.
 * @param {object} context.locals.supabase - The Supabase client instance.
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 * Returns 200 OK with an array of flashcards and total count on success.
 * Returns 401 Unauthorized if the user is not logged in.
 * Returns 400 Bad Request if query parameters are invalid.
 * Returns 500 Internal Server Error on other errors.
 * @throws {Error} If an unexpected error occurs during processing.
 * @dependencies {@link getFlashcardsService}, Supabase client, Zod validation.
 */
export async function GET({ request, locals }: APIContext) {
  try {
    console.log("\n----- ROZPOCZYNAM OBSŁUGĘ ŻĄDANIA GET /api/flashcards -----");

    // Check authorization
    const user = locals.user;
    if (!user) {
      console.log("Unauthorized access attempt - user not logged in");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = user.id;
    console.log("User ID:", userId);

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      console.error("GET /api/flashcards: Supabase client not found in locals!");
      return new Response(JSON.stringify({ error: "Internal server configuration error" }), { status: 500 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    console.log("URL żądania:", url.toString());
    console.log("Surowe parametry zapytania:", Object.fromEntries(url.searchParams.entries()));

    // Sprawdzamy czy parametry searchText i sortOrder są obecne
    console.log("searchText parameter:", url.searchParams.get("searchText"));
    console.log("sortBy parameter:", url.searchParams.get("sortBy") || url.searchParams.get("sort_by"));
    console.log("sortOrder parameter:", url.searchParams.get("sortOrder") || url.searchParams.get("sort_order"));

    const queryParamsResult = QueryParamsSchema.safeParse(Object.fromEntries(url.searchParams));

    if (queryParamsResult.success) {
      console.log("Przetworzone parametry po walidacji:", queryParamsResult.data);
    } else {
      console.error("Błąd walidacji parametrów:", queryParamsResult.error.format());
    }

    if (!queryParamsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid query parameters",
      };
      console.error("Validation error details:", JSON.stringify(queryParamsResult.error.format()));
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get flashcards using the service - normalizacja do camelCase
    const params: FlashcardFilterParams = {
      ...queryParamsResult.data,
      // Preferujemy wersje camelCase, ale używamy snake_case jako fallback
      sortBy: queryParamsResult.data.sortBy || queryParamsResult.data.sort_by,
      sortOrder: queryParamsResult.data.sortOrder || queryParamsResult.data.sort_order,
      generationId: queryParamsResult.data.generationId || queryParamsResult.data.generation_id,
    };

    console.log("Parametry przekazywane do serwisu:", JSON.stringify(params, null, 2));

    const response = await getFlashcardsService(supabase, userId, params);
    console.log(`Zwracam ${response.flashcards.length} fiszek (z ${response.total})`);
    console.log("----- KOŃCZĘ OBSŁUGĘ ŻĄDANIA GET /api/flashcards -----\n");

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

/**
 * Handles POST requests to create new flashcards for the authenticated user.
 * Supports creating a single flashcard or a batch of flashcards.
 *
 * @param {APIContext} context - The Astro API context.
 * @param {object} context.request - The incoming request object. Expects a JSON body.
 * @param {object} context.locals - The locals object containing `user` and `supabase`.
 * @param {object} context.locals.user - The authenticated user object.
 * @param {object} context.locals.supabase - The Supabase client instance.
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 * Returns 201 Created with the created flashcard(s) on success.
 * Returns 401 Unauthorized if the user is not logged in.
 * Returns 400 Bad Request if the request body is invalid.
 * Returns 500 Internal Server Error on other errors.
 * @throws {Error} If an unexpected error occurs during processing.
 * @dependencies {@link createFlashcardService}, Supabase client, Zod validation.
 * @remarks The request body can be either a single FlashcardSchema object or an object with a `flashcards` property containing an array of FlashcardSchema objects.
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Check authorization
    const user = locals.user;
    if (!user) {
      console.log("Unauthorized access attempt - user not logged in");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = user.id;

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      console.error("POST /api/flashcards: Supabase client not found in locals!");
      return new Response(JSON.stringify({ error: "Internal server configuration error" }), { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    console.log("Otrzymano dane do POST /flashcards:", JSON.stringify(body));

    // Check if it's a single flashcard or multiple flashcards
    let response;

    const createdFlashcards: FlashcardDto[] = []; // Tablica na wyniki

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
      const flashcardsToCreate = validationResult.data.flashcards;

      // Iteruj i twórz każdą fiszkę osobno
      for (const flashcardData of flashcardsToCreate) {
        const flashcardDto: CreateFlashcardDto = {
          ...flashcardData,
          user_id: userId, // Dodaj user_id
        };
        try {
          const created = await createFlashcardService(supabase, userId, flashcardDto);
          createdFlashcards.push(created);
        } catch (singleError) {
          console.error(`Error creating flashcard ${JSON.stringify(flashcardData)}:`, singleError);
          // Można zdecydować, czy kontynuować, czy przerwać i zwrócić błąd
          // Na razie kontynuujemy, ale można dodać logikę zwracania częściowego sukcesu lub błędu
        }
      }
      response = createdFlashcards; // Zwróć tablicę utworzonych fiszek
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
      const flashcardData = validationResult.data;
      const flashcardDto: CreateFlashcardDto = {
        ...flashcardData,
        user_id: userId, // Dodaj user_id
      };
      console.log("Tworzę fiszkę:", JSON.stringify(flashcardDto));
      response = await createFlashcardService(supabase, userId, flashcardDto);
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

/**
 * Handles DELETE requests to delete a flashcard by its ID for the authenticated user.
 *
 * @param {APIContext} context - The Astro API context.
 * @param {object} context.params - The parameters object containing the flashcard ID.
 * @param {string} context.params.id - The ID of the flashcard to delete, as a string.
 * @param {object} context.locals - The locals object containing `user` and `supabase`.
 * @param {object} context.locals.user - The authenticated user object.
 * @param {object} context.locals.supabase - The Supabase client instance.
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 * Returns 200 OK on successful deletion.
 * Returns 401 Unauthorized if the user is not logged in.
 * Returns 400 Bad Request if the ID is invalid.
 * Returns 404 Not Found if the flashcard does not exist or does not belong to the user.
 * Returns 500 Internal Server Error on other errors.
 * @throws {Error} If an unexpected error occurs during processing.
 * @dependencies {@link deleteFlashcardService}, Supabase client.
 */
export async function DELETE({ params, locals }: APIContext) {
  console.log(`DELETE /flashcards/${params.id} request received`);
  const user = locals.user;
  if (!user) {
    console.log("Unauthorized access attempt - user not logged in");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const userId = user.id;
  const flashcardId = params.id;
  console.log(`Using user ID: ${userId}, attempting to delete flashcard ID: ${flashcardId}`);

  // Get Supabase client from locals
  const supabase = locals.supabase;
  if (!supabase) {
    console.error("DELETE /api/flashcards: Supabase client not found in locals!");
    return new Response(JSON.stringify({ error: "Internal server configuration error" }), { status: 500 });
  }

  // Convert flashcardId to number
  const flashcardIdNum = parseInt(flashcardId ?? "", 10);

  // Validate flashcardIdNum
  if (isNaN(flashcardIdNum) || flashcardIdNum <= 0) {
    console.error(`Invalid flashcard ID received: ${flashcardId}`);
    return new Response(JSON.stringify({ error: "Invalid flashcard ID" }), { status: 400 });
  }

  try {
    const success = await deleteFlashcardService(supabase, userId, flashcardIdNum);

    if (success) {
      console.log(`Flashcard ${flashcardIdNum} deleted successfully`);
      return new Response(null, { status: 200 }); // 200 OK with no body for successful deletion
    } else {
      console.log(`Flashcard ${flashcardIdNum} not found or not owned by user ${userId}`);
      return new Response(JSON.stringify({ error: "Flashcard not found or unauthorized" }), { status: 404 });
    }
  } catch (error) {
    console.error(`Error deleting flashcard ${flashcardIdNum}:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

/**
 * Handles PUT requests to update a flashcard by its ID for the authenticated user.
 * Allows partial updates of flashcard fields.
 *
 * @param {APIContext} context - The Astro API context.
 * @param {object} context.params - The parameters object containing the flashcard ID.
 * @param {string} context.params.id - The ID of the flashcard to update, as a string.
 * @param {object} context.request - The incoming request object. Expects a JSON body containing partial flashcard data.
 * @param {object} context.locals - The locals object containing `user` and `supabase`.
 * @param {object} context.locals.user - The authenticated user object.
 * @param {object} context.locals.supabase - The Supabase client instance.
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 * Returns 200 OK with the updated flashcard data on success.
 * Returns 401 Unauthorized if the user is not logged in.
 * Returns 400 Bad Request if the ID or request body is invalid.
 * Returns 404 Not Found if the flashcard does not exist or does not belong to the user.
 * Returns 500 Internal Server Error on other errors.
 * @throws {Error} If an unexpected error occurs during processing.
 * @dependencies {@link updateFlashcardService}, Supabase client, Zod validation (UpdateFlashcardDtoSchema).
 */
export async function PUT({ params, request, locals }: APIContext) {
  console.log(`PUT /flashcards/${params.id} request received`);
  const user = locals.user;
  if (!user) {
    console.log("Unauthorized access attempt - user not logged in");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const userId = user.id;
  const flashcardId = params.id;
  console.log(`Using user ID: ${userId}, attempting to update flashcard ID: ${flashcardId}`);

  // Get Supabase client from locals
  const supabase = locals.supabase;
  if (!supabase) {
    console.error("PUT /api/flashcards: Supabase client not found in locals!");
    return new Response(JSON.stringify({ error: "Internal server configuration error" }), { status: 500 });
  }

  // Convert flashcardId to number
  const flashcardIdNum = parseInt(flashcardId ?? "", 10);

  // Validate flashcardIdNum
  if (isNaN(flashcardIdNum) || flashcardIdNum <= 0) {
    console.error(`Invalid flashcard ID received: ${flashcardId}`);
    return new Response(JSON.stringify({ error: "Invalid flashcard ID" }), { status: 400 });
  }

  try {
    // Parse and validate request body (partial update)
    const body = await request.json();
    console.log("Otrzymano dane do PUT /flashcards:", JSON.stringify(body));

    const validationResult = UpdateFlashcardDtoSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard update data",
      };
      console.error("Błąd walidacji danych aktualizacji fiszki:", validationResult.error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData = validationResult.data;

    // Update flashcard using the service
    const updatedFlashcard = await updateFlashcardService(supabase, userId, flashcardIdNum, updateData);

    if (updatedFlashcard) {
      console.log(`Flashcard ${flashcardIdNum} updated successfully`);
      return new Response(JSON.stringify(updatedFlashcard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.log(`Flashcard ${flashcardIdNum} not found or not owned by user ${userId}`);
      return new Response(JSON.stringify({ error: "Flashcard not found or unauthorized" }), { status: 404 });
    }
  } catch (error) {
    console.error(`Error updating flashcard ${flashcardIdNum}:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
