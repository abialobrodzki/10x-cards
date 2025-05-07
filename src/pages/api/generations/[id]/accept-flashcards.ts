/* eslint-disable no-console */
import type { APIRoute } from "astro";
import { z } from "zod";
import type { AcceptFlashcardsRequestDto, AcceptFlashcardsResponseDto, CreateFlashcardDto } from "../../../../types";
import { createFlashcardsService } from "../../../../lib/services/flashcard.service";

export const prerender = false;

/**
 * @module Generations API Endpoint - Accept Flashcards
 * @description Handles API requests for accepting and saving generated flashcards.
 */

/**
 * @typedef {object} AcceptFlashcardsRequestDto - Represents the structure of the request body for accepting flashcards.
 * @property {Array<object>} flashcards - An array of flashcard objects to be saved. Must contain at least one flashcard.
 * @property {string} flashcards[].front - The front text of the flashcard. Cannot be empty.
 * @property {string} flashcards[].back - The back text of the flashcard. Cannot be empty.
 * @property {"ai-full"|"ai-edited"|"manual"} flashcards[].source - The source of the flashcard.
 * @property {number|null} flashcards[].generation_id - The ID of the generation process, can be null.
 * @property {boolean} [isSaveAll] - Optional flag indicating whether to save all flashcards regardless of individual errors.
 */

/**
 * @typedef {object} AcceptFlashcardsResponseDto - Represents the structure of the successful response body.
 * @property {object} generation - Information about the generation process update.
 * @property {number} generation.id - The ID of the generation.
 * @property {number} generation.accepted_unedited_count - Count of accepted flashcards with 'ai-full' source.
 * @property {number} generation.accepted_edited_count - Count of accepted flashcards with 'ai-edited' source.
 * @property {string} generation.updated_at - ISO string of the update timestamp.
 * @property {FlashcardDto[]} flashcards - An array of the successfully created flashcard DTOs.
 */

/**
 * @typedef {object} ValidationErrorResponseDto - Represents the structure of a validation error response.
 * @property {string} error - A general error message.
 * @property {string} [details] - Optional details about the error.
 */

// Validation schema for request body
const flashcardSchema = z.object({
  front: z.string().min(1, "Pole przodu fiszki nie może być puste"),
  back: z.string().min(1, "Pole tyłu fiszki nie może być puste"),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.number().nullable(),
});

const requestSchema = z.object({
  flashcards: z.array(flashcardSchema).min(1, "Musisz podać przynajmniej jedną fiszkę"),
  isSaveAll: z.boolean().optional(),
});

// Cache to prevent double submissions within a short time window
const recentSubmissions = new Map<string, number>();
const CACHE_EXPIRY_MS = 10000; // 10 seconds

/**
 * Handles POST requests to accept and save generated flashcards for a specific generation ID.
 * Validates the generation ID from the path and the request body against `requestSchema`.
 * Includes a cache to prevent duplicate submissions within a short time frame.
 * Requires user authentication.
 *
 * @type {APIRoute}
 * @param {object} context - The Astro API context.
 * @param {object} context.request - The incoming request object. Expects a JSON body conforming to `AcceptFlashcardsRequestDto`.
 * @param {object} context.params - The parameters object containing the generation ID.
 * @param {string} context.params.id - The ID of the generation as a string.
 * @param {object} context.locals - The locals object containing `user` and `supabase`.
 * @param {object} context.locals.user - The authenticated user object, must have an `id`.
 * @param {object} context.locals.supabase - The Supabase client instance.
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 * Returns 200 OK with the accepted flashcards and updated generation info on success.
 * Returns 401 Unauthorized if the user is not logged in.
 * Returns 400 Bad Request if the generation ID or request body is invalid.
 * Returns 429 Too Many Requests if a potential duplicate submission is detected.
 * Returns 500 Internal Server Error on other errors.
 * @throws {Error} If an unexpected error occurs during processing (e.g., Supabase client not found).
 * @dependencies {@link createFlashcardsService}, Supabase client, Zod validation, `recentSubmissions` cache.
 * @remarks The endpoint expects the generation ID in the URL path.
 */
export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    console.log("Accept flashcards request received");
    console.log("API Request ID:", requestId);

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
    console.log("isSaveAll flag:", body.isSaveAll);

    // Check for recent identical submission
    const cacheKey = `${userId}-${generationId}-${body.flashcards.length}`;
    if (recentSubmissions.has(cacheKey)) {
      const timeSinceLastSubmission = Date.now() - (recentSubmissions.get(cacheKey) || 0);
      if (timeSinceLastSubmission < CACHE_EXPIRY_MS) {
        console.warn(`Potential duplicate submission detected (${timeSinceLastSubmission}ms since last request)`);
        console.warn("Cache key:", cacheKey);
        return new Response(
          JSON.stringify({
            warning: "Duplicate submission detected. Previous request is already being processed.",
            requestId: requestId,
          }),
          {
            status: 429, // Too Many Requests
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Mark this submission in the cache
    recentSubmissions.set(cacheKey, Date.now());

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

    // Try to save flashcards
    const flashcards: CreateFlashcardDto[] = body.flashcards.map((f) => {
      return {
        ...f,
        generation_id: generationId,
      };
    });

    console.log("Creating flashcards...");
    console.log("Using isSaveAll:", body.isSaveAll || false);

    // Save the flashcards
    const createdFlashcards = await createFlashcardsService(
      locals.supabase,
      userId,
      {
        flashcards,
      },
      body.isSaveAll || false
    );

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

    // After successful operation, remove from cache
    recentSubmissions.delete(cacheKey);

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
