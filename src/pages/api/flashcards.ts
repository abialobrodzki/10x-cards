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

// Schema for validating flashcard update (allow partial updates)
const UpdateFlashcardDtoSchema = FlashcardSchema.partial();

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

  // Convert flashcardId to number
  const flashcardIdNum = parseInt(flashcardId ?? "", 10);
  if (!flashcardId || isNaN(flashcardIdNum)) {
    console.log("Missing or invalid flashcard ID");
    return new Response(JSON.stringify({ error: "Missing or invalid flashcard ID" }), { status: 400 });
  }

  // Get Supabase client from locals
  const supabase = locals.supabase;
  if (!supabase) {
    console.error("DELETE /api/flashcards: Supabase client not found in locals!");
    return new Response(JSON.stringify({ error: "Internal server configuration error" }), { status: 500 });
  }

  try {
    console.log("Deleting flashcard via service...");
    await deleteFlashcardService(supabase, userId, flashcardIdNum);
    console.log(`Flashcard ${flashcardId} deleted successfully`);
    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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

  // Convert flashcardId to number
  const flashcardIdNum = parseInt(flashcardId ?? "", 10);
  if (!flashcardId || isNaN(flashcardIdNum)) {
    console.log("Missing or invalid flashcard ID");
    return new Response(JSON.stringify({ error: "Missing or invalid flashcard ID" }), { status: 400 });
  }

  // Get Supabase client from locals
  const supabase = locals.supabase;
  if (!supabase) {
    console.error("PUT /api/flashcards: Supabase client not found in locals!");
    return new Response(JSON.stringify({ error: "Internal server configuration error" }), { status: 500 });
  }

  const body = await request.json();
  console.log(`Received data for PUT /flashcards/${flashcardId}: ${JSON.stringify(body)}`);

  // Walidacja pól przekazanych do aktualizacji
  const result = UpdateFlashcardDtoSchema.safeParse(body);

  if (!result.success) {
    console.log("Validation failed:", result.error.flatten());
    return new Response(JSON.stringify({ error: "Invalid data", details: result.error.flatten() }), {
      status: 400,
    });
  }

  try {
    console.log("Updating flashcard via service...");
    const updatedFlashcard = await updateFlashcardService(supabase, userId, flashcardIdNum, result.data);
    console.log(`Flashcard ${flashcardId} updated successfully`);
    return new Response(JSON.stringify(updatedFlashcard), { status: 200 });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
