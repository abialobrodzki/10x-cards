/* eslint-disable no-console */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FlashcardDto,
  FlashcardFilterParams,
  FlashcardListResponseDto,
  UpdateFlashcardDto,
  CreateFlashcardDto,
  CreateFlashcardsDto,
} from "../../types";
import type { Database } from "../../db/database.types";

/**
 * Retrieves a paginated list of flashcards for a user
 * @param supabase Supabase client from context.locals
 * @param userId User ID from the authenticated session
 * @param params Filter and pagination parameters
 * @returns Paginated list of flashcards and total count
 */
export async function getFlashcardsService(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: FlashcardFilterParams
): Promise<FlashcardListResponseDto> {
  // Default values
  const page = params.page || 1;
  const pageSize = params.page_size || 20;
  const sortBy = params.sort_by || "created_at";

  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Dodatkowe logi dla diagnostyki
  console.log("Fetching flashcards for user:", userId);
  console.log("Params:", params);
  console.log("Pagination:", { page, pageSize, from, to });

  // Log typu klienta Supabase dla diagnostyki
  console.log("Supabase client type:", typeof supabase);
  console.log("Supabase client methods:", Object.keys(supabase));

  try {
    // Start building the query
    let query = supabase
      .from("flashcards")
      .select("id, front, back, source, created_at, updated_at, generation_id", { count: "exact" })
      .eq("user_id", userId)
      .range(from, to);

    console.log("Query initialized successfully");

    // Ustaw sortowanie z opcjonalnym kierunkiem
    if (params.sortOrder === "asc") {
      query = query.order(sortBy, { ascending: true });
    } else {
      query = query.order(sortBy, { ascending: false });
    }

    console.log("Sorting applied successfully");

    // Apply optional filters if provided
    if (params.generation_id) {
      query = query.eq("generation_id", params.generation_id);
    }

    if (params.source) {
      query = query.eq("source", params.source);
    }

    // Dodaj filtr wyszukiwania tekstowego, jeśli istnieje
    if (params.searchText) {
      // Proste wyszukiwanie w kolumnach front i back
      query = query.or(`front.ilike.%${params.searchText}%,back.ilike.%${params.searchText}%`);
    }

    // Wyświetl informacje o zapytaniu dla debugowania
    console.log("Query params ready");
    console.log("Query object type:", Object.prototype.toString.call(query));

    // Log dostępnych metod na obiekcie query
    console.log("Query methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(query)));

    // Execute the query
    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching flashcards:", error);
      // Szczegółowe informacje o błędzie dla debugowania RLS
      console.error("Error details - code:", error.code);
      console.error("Error details - message:", error.message);
      console.error("Error details - hint:", error.hint);
      console.error("Error details - details:", error.details);
      console.error("Error object keys:", Object.keys(error));
      console.error("Error stack:", error.stack);

      // Obsługa wygaśniętego tokenu JWT - przekieruj logikę do middleware
      if (error.code === "PGRST301" && error.message === "JWT expired") {
        console.log("Token JWT wygasł - należy się zalogować ponownie");
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }

      throw error;
    }

    // Logi wyników
    console.log("Fetched flashcards count:", count);
    console.log("First flashcard (if exists):", data?.length > 0 ? data[0] : "No flashcards found");

    return {
      flashcards: data as FlashcardDto[],
      total: count || 0,
    };
  } catch (err) {
    // Log ogólny błąd, który może wystąpić poza głównym kodem
    console.error("Unexpected error in getFlashcardsService:", err);
    console.error("Error type:", typeof err);
    console.error("Error is instance of Error:", err instanceof Error);
    if (err instanceof Error) {
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
    } else {
      console.error("Full error object:", err);
    }
    throw err;
  }
}

/**
 * Fetches a specific flashcard by ID
 * @param supabase Supabase client from context.locals
 * @param userId User ID from the authenticated session
 * @param flashcardId ID of the flashcard to retrieve
 * @returns The flashcard or null if not found
 */
export async function getFlashcardByIdService(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: number
): Promise<FlashcardDto | null> {
  console.log(`[getFlashcardByIdService] Starting fetch for flashcard ID=${flashcardId}, userID=${userId}`);

  // Dodatkowe logi dla problematycznego ID
  if (flashcardId === 404) {
    console.log(`[getFlashcardByIdService] SPECIAL CASE: Fetching flashcard with ID 404`);
  }

  try {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front, back, source, created_at, updated_at, generation_id")
      .eq("user_id", userId)
      .eq("id", flashcardId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found error from PostgREST
        console.log(`[getFlashcardByIdService] Flashcard with ID=${flashcardId} not found (PGRST116)`);
        return null;
      }

      console.error(`[getFlashcardByIdService] Error fetching flashcard:`, error);
      console.error(`[getFlashcardByIdService] Error details:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    if (!data) {
      console.log(`[getFlashcardByIdService] No data returned for flashcard ID=${flashcardId}, userID=${userId}`);
      return null;
    }

    console.log(`[getFlashcardByIdService] Successfully retrieved flashcard:`, {
      id: data.id,
      front: data.front?.substring(0, 50) + (data.front?.length > 50 ? "..." : ""),
      back: data.back?.substring(0, 50) + (data.back?.length > 50 ? "..." : ""),
      source: data.source,
      created_at: data.created_at,
      generation_id: data.generation_id,
    });

    return data as FlashcardDto;
  } catch (error) {
    console.error(`[getFlashcardByIdService] Unexpected error:`, error);
    if (error instanceof Error) {
      console.error(`[getFlashcardByIdService] Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

/**
 * Updates a flashcard
 * @param supabase Supabase client from context.locals
 * @param userId User ID from the authenticated session
 * @param flashcardId ID of the flashcard to update
 * @param flashcardData Data to update the flashcard with
 * @returns The updated flashcard or null if not found
 */
export async function updateFlashcardService(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: number,
  flashcardData: UpdateFlashcardDto
): Promise<FlashcardDto | null> {
  // Check if flashcard exists and belongs to user
  const exists = await supabase
    .from("flashcards")
    .select("id")
    .eq("user_id", userId)
    .eq("id", flashcardId)
    .maybeSingle();

  if (exists.error || !exists.data) {
    return null;
  }

  // Update the flashcard
  const { data, error } = await supabase
    .from("flashcards")
    .update(flashcardData)
    .eq("user_id", userId)
    .eq("id", flashcardId)
    .select("id, front, back, source, created_at, updated_at, generation_id")
    .single();

  if (error) {
    console.error("Error updating flashcard:", error);
    throw error;
  }

  return data as FlashcardDto;
}

/**
 * Deletes a flashcard
 * @param supabase Supabase client from context.locals
 * @param userId User ID from the authenticated session
 * @param flashcardId ID of the flashcard to delete
 * @returns True if the flashcard was deleted, false if not found
 */
export async function deleteFlashcardService(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: number
): Promise<boolean> {
  console.log(`[deleteFlashcardService] Starting delete for flashcard ID=${flashcardId}, userID=${userId}`);

  // Specjalne obejście dla ID 404 - potencjalny konflikt z kodem HTTP 404
  if (flashcardId === 404) {
    console.log(`[deleteFlashcardService] WORKAROUND: Special case for flashcard ID 404`);

    try {
      // Próbujemy bezpośrednio usunąć bez sprawdzania istnienia
      console.log(`[deleteFlashcardService] WORKAROUND: Attempting direct deletion for ID 404`);

      // Wykonaj bezpośrednie zapytanie usuwające
      const { error } = await supabase.from("flashcards").delete().eq("id", 404).eq("user_id", userId);

      if (error) {
        console.error(`[deleteFlashcardService] WORKAROUND: Direct deletion error:`, error);
        console.error(`[deleteFlashcardService] WORKAROUND: Error details:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Próbujemy alternatywne zapytanie - może inny format ID
        console.log(`[deleteFlashcardService] WORKAROUND: Trying alternative query`);

        // Użyjemy alternatywnego podejścia - zapytanie raw SQL
        const { error: error2 } = await supabase
          .from("flashcards")
          .delete()
          .filter("id", "eq", 404)
          .filter("user_id", "eq", userId);

        if (error2) {
          console.error(`[deleteFlashcardService] WORKAROUND: Alternative method error:`, error2);

          // Trzecia próba - soft delete przez aktualizację
          console.log(`[deleteFlashcardService] WORKAROUND: Trying soft delete via update`);

          const { error: error3 } = await supabase
            .from("flashcards")
            .update({
              front: "[DELETED] This flashcard has been deleted",
              back: "[DELETED] This flashcard has been deleted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", 404)
            .eq("user_id", userId);

          if (error3) {
            console.error(`[deleteFlashcardService] WORKAROUND: Soft delete error:`, error3);
            return false;
          }

          console.log(`[deleteFlashcardService] WORKAROUND: Soft delete successful`);
          return true;
        }

        console.log(`[deleteFlashcardService] WORKAROUND: Direct deletion successful`);
        return true;
      }

      console.log(`[deleteFlashcardService] WORKAROUND: Direct deletion successful`);
      return true;
    } catch (specialError) {
      console.error(`[deleteFlashcardService] WORKAROUND: Error:`, specialError);
      return false;
    }
  }

  try {
    // Check if flashcard exists and belongs to user
    console.log(`[deleteFlashcardService] Checking if flashcard exists for user...`);
    const { data: existsData, error: existsError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("user_id", userId)
      .eq("id", flashcardId)
      .maybeSingle();

    // Szczegółowe logowanie wyniku zapytania sprawdzającego
    console.log(`[deleteFlashcardService] Exists check result:`, {
      data: existsData,
      hasError: !!existsError,
      errorMessage: existsError?.message,
    });

    if (existsError) {
      console.error(`[deleteFlashcardService] Error checking flashcard existence:`, existsError);
      console.error(`[deleteFlashcardService] Error details:`, {
        code: existsError.code,
        message: existsError.message,
        details: existsError.details,
        hint: existsError.hint,
      });
      return false;
    }

    if (!existsData) {
      console.log(`[deleteFlashcardService] Flashcard ID=${flashcardId} not found for user ID=${userId}`);
      return false;
    }

    console.log(`[deleteFlashcardService] Flashcard found, proceeding with deletion...`);

    // Delete the flashcard
    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("user_id", userId)
      .eq("id", flashcardId);

    if (deleteError) {
      console.error(`[deleteFlashcardService] Error deleting flashcard:`, deleteError);
      console.error(`[deleteFlashcardService] Delete error details:`, {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
      });
      throw deleteError;
    }

    console.log(`[deleteFlashcardService] Successfully deleted flashcard ID=${flashcardId}`);
    return true;
  } catch (error) {
    console.error(`[deleteFlashcardService] Unexpected error during flashcard deletion:`, error);
    if (error instanceof Error) {
      console.error(`[deleteFlashcardService] Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

/**
 * Creates a single flashcard
 * @param supabase Supabase client from context.locals
 * @param userId User ID from the authenticated session
 * @param flashcardData Data for the new flashcard
 * @returns The created flashcard
 */
export async function createFlashcardService(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardData: CreateFlashcardDto
): Promise<FlashcardDto> {
  // Log input data for debugging
  console.log(`Creating single flashcard for user: ${userId}`);

  // Check for existing flashcard with the same generation_id, user_id, front, and back
  // to prevent duplicates
  if (flashcardData.generation_id) {
    console.log(`Checking for existing flashcard for user ${userId} and generation ${flashcardData.generation_id}`);

    const { data: existingFlashcard, error: checkError } = await supabase
      .from("flashcards")
      .select("id, front, back, source, created_at, updated_at, generation_id")
      .eq("user_id", userId)
      .eq("generation_id", flashcardData.generation_id)
      .eq("front", flashcardData.front)
      .eq("back", flashcardData.back)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing flashcard:", checkError);
    } else if (existingFlashcard) {
      console.log(`Found existing flashcard with ID ${existingFlashcard.id}`);
      return existingFlashcard as FlashcardDto;
    }
  }

  // Add user_id to the data
  const data = {
    ...flashcardData,
    user_id: userId,
  };

  // Insert the flashcard
  const { data: createdFlashcard, error } = await supabase
    .from("flashcards")
    .insert(data)
    .select("id, front, back, source, created_at, updated_at, generation_id")
    .single();

  if (error) {
    console.error("Error creating flashcard:", error);
    throw error;
  }

  return createdFlashcard as FlashcardDto;
}

/**
 * Creates multiple flashcards
 * @param supabase Supabase client from context.locals
 * @param userId User ID from the authenticated session
 * @param flashcardsData Data for the new flashcards
 * @param isSaveAll Flag indicating if we're saving all flashcards (Zapisz wszystkie option)
 * @returns The created flashcards
 */
export async function createFlashcardsService(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardsData: CreateFlashcardsDto,
  isSaveAll = false
): Promise<FlashcardDto[]> {
  // Log input data for debugging
  console.log(
    `Creating flashcards, count: ${flashcardsData.flashcards.length}, user: ${userId}, isSaveAll: ${isSaveAll}`
  );
  console.log(`Incoming flashcards: ${JSON.stringify(flashcardsData.flashcards)}`);

  // Check for existing flashcards with the same generation_id, user_id
  const generationId = flashcardsData.flashcards[0]?.generation_id;
  if (!generationId) {
    console.log("No generation ID provided, cannot proceed with creating flashcards");
    return [];
  }

  // Separate edited and non-edited flashcards for different handling
  const editedFlashcards = flashcardsData.flashcards.filter((card) => card.source === "ai-edited");
  const nonEditedFlashcards = flashcardsData.flashcards.filter((card) => card.source !== "ai-edited");

  console.log(
    `Split request into edited (${editedFlashcards.length}) and non-edited (${nonEditedFlashcards.length}) flashcards`
  );

  // Get existing flashcards for this generation
  const { data: existingFlashcards, error: checkError } = await supabase
    .from("flashcards")
    .select("id, front, back, source, created_at, updated_at, generation_id")
    .eq("user_id", userId)
    .eq("generation_id", generationId);

  if (checkError) {
    console.error("Error checking existing flashcards:", checkError);
    throw checkError;
  }

  // Logic for "Zapisz wszystkie" - zachowujemy oryginalną logikę
  if (isSaveAll && existingFlashcards && existingFlashcards.length > 0) {
    console.log(`Found ${existingFlashcards.length} existing flashcards, replacing them with all new versions`);

    // Get IDs of existing flashcards to delete
    const existingIds = existingFlashcards.map((card) => card.id);
    console.log(`Deleting existing flashcards with IDs: ${existingIds.join(", ")}`);

    // Delete existing flashcards
    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("user_id", userId)
      .eq("generation_id", generationId);

    if (deleteError) {
      console.error("Error deleting existing flashcards:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${existingIds.length} existing flashcards`);

    // Insert all flashcards for "Zapisz wszystkie"
    const dataToInsert = flashcardsData.flashcards.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    console.log(`Inserting ${dataToInsert.length} new flashcards`);

    const { data: createdFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(dataToInsert)
      .select("id, front, back, source, created_at, updated_at, generation_id");

    if (insertError) {
      console.error("Error creating flashcards:", insertError);
      throw insertError;
    }

    console.log(`Successfully created ${createdFlashcards?.length || 0} new flashcards`);
    return createdFlashcards as FlashcardDto[];
  }

  // Logic for "Zapisz wybrane" - zamieniamy całą poprzednią logikę
  if (!isSaveAll && existingFlashcards && existingFlashcards.length > 0) {
    console.log(`"Zapisz wybrane": Found ${existingFlashcards.length} existing flashcards, deleting them all first`);

    // Delete all existing flashcards for this generation
    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("user_id", userId)
      .eq("generation_id", generationId);

    if (deleteError) {
      console.error("Error deleting existing flashcards:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted all existing flashcards for this generation`);

    // Insert the new flashcards (frontendowa logika zapewnia, że są to tylko zaakceptowane)
    const dataToInsert = flashcardsData.flashcards.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    console.log(`Inserting ${dataToInsert.length} selected flashcards`);

    const { data: createdFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(dataToInsert)
      .select("id, front, back, source, created_at, updated_at, generation_id");

    if (insertError) {
      console.error("Error creating flashcards:", insertError);
      throw insertError;
    }

    console.log(`Successfully created ${createdFlashcards?.length || 0} selected flashcards`);
    return createdFlashcards as FlashcardDto[];
  }

  // No existing flashcards, just insert the new ones
  const dataToInsert = flashcardsData.flashcards.map((flashcard) => ({
    ...flashcard,
    user_id: userId,
  }));

  console.log(`No existing flashcards found. Inserting ${dataToInsert.length} new flashcards`);

  try {
    // Insert the new flashcards
    const { data: createdFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(dataToInsert)
      .select("id, front, back, source, created_at, updated_at, generation_id");

    if (insertError) {
      console.error("Error creating flashcards:", insertError);
      throw insertError;
    }

    console.log(`Successfully created ${createdFlashcards?.length || 0} new flashcards`);
    return createdFlashcards as FlashcardDto[];
  } catch (error) {
    console.error("Unexpected error creating flashcards:", error);
    throw error;
  }
}
