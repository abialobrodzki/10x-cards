import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { logger } from "../openrouter.logger";
import type {
  FlashcardDto,
  FlashcardFilterParams,
  FlashcardListResponseDto,
  UpdateFlashcardDto,
  CreateFlashcardDto,
  CreateFlashcardsDto,
} from "../../types";
import type { Database } from "../../db/database.types";

// Stałe dla tabeli i kolumn
const FLASHCARDS_TABLE = "flashcards";
const DEFAULT_FLASHCARD_SELECT = "id, front, back, source, created_at, updated_at, generation_id";

/**
 * Sprawdza i loguje błąd zwrócony przez Supabase.
 * @param error Obiekt błędu PostgrestError lub null.
 * @param context String opisujący operację, podczas której wystąpił błąd.
 * @returns True, jeśli wystąpił błąd, w przeciwnym razie false.
 */
function checkAndLogSupabaseError(error: PostgrestError | null, context: string): boolean {
  if (error) {
    logger.error(`Supabase error during ${context}:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return true;
  }
  return false;
}

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
  const sortBy = params.sortBy || "created_at";
  const sortOrder = params.sortOrder || "desc";

  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Dodatkowe logi dla diagnostyki
  logger.debug("FLASHCARD SERVICE - Otrzymane parametry:", params);
  logger.debug("FLASHCARD SERVICE - Używam zoptymalizowanych parametrów:", {
    pagination: { page, pageSize, from, to },
    sorting: { sortBy, sortOrder },
    filters: {
      generationId: params.generationId || params.generation_id,
      source: params.source,
      searchText: params.searchText,
    },
  });

  try {
    // Budowanie zapytania
    const query = buildFlashcardListQuery(supabase, userId, params);

    // Wykonujemy zapytanie
    logger.debug("FLASHCARD SERVICE - Executing query");
    const { data, count, error } = await query;

    if (checkAndLogSupabaseError(error, "fetching flashcards list")) {
      throw error;
    }

    // Logi wyników
    logger.debug("FLASHCARD SERVICE - Fetched flashcards count:", { count });

    return {
      flashcards: data as FlashcardDto[],
      total: count || 0,
    };
  } catch (err) {
    // Log ogólny błąd, który może wystąpić poza głównym kodem
    logger.error("Unexpected error in getFlashcardsService", err);
    if (err instanceof Error) {
      logger.error("Error details", { name: err.name, message: err.message });
    } else {
      logger.error("Non-Error object thrown", { errorObject: err });
    }
    throw err;
  }
}

/**
 * Buduje zapytanie Supabase do pobrania listy fiszek na podstawie parametrów.
 * @param supabase Klient Supabase.
 * @param userId ID użytkownika.
 * @param params Parametry filtrowania i paginacji.
 * @returns Obiekt zapytania Supabase gotowy do wykonania.
 */
function buildFlashcardListQuery(supabase: SupabaseClient<Database>, userId: string, params: FlashcardFilterParams) {
  // Default values
  const page = params.page || 1;
  const pageSize = params.page_size || 20;
  const sortBy = params.sortBy || "created_at";
  const sortOrder = params.sortOrder || "desc";

  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Logowanie parametrów
  logger.debug("Building flashcard list query with params:", {
    pagination: { page, pageSize, from, to },
    sorting: { sortBy, sortOrder },
    filters: {
      generationId: params.generationId || params.generation_id,
      source: params.source,
      searchText: params.searchText,
    },
    userId,
  });

  // Inicjalizacja zapytania bazowego
  let query = initializeQuery(supabase, userId, from, to);

  // Dodajemy filtry
  query = applyFilters(query, params);

  // Dodajemy sortowanie
  query = applySorting(query, sortBy, sortOrder);

  return query;
}

/**
 * Inicjalizuje podstawowe zapytanie
 */
function initializeQuery(supabase: SupabaseClient<Database>, userId: string, from: number, to: number) {
  return supabase
    .from(FLASHCARDS_TABLE)
    .select(DEFAULT_FLASHCARD_SELECT, { count: "exact" })
    .eq("user_id", userId)
    .range(from, to);
}

/**
 * Stosuje filtry do zapytania
 */
function applyFilters(
  query: ReturnType<typeof initializeQuery>,
  params: FlashcardFilterParams
): ReturnType<typeof initializeQuery> {
  // Filtr generacji (używamy camelCase lub snake_case jako fallback)
  const generationId = params.generationId || params.generation_id;
  if (generationId) {
    query = query.eq("generation_id", generationId);
    logger.debug("FLASHCARD SERVICE - Added generation_id filter", { generationId });
  }

  // Filtr źródła
  if (params.source) {
    query = query.eq("source", params.source);
    logger.debug("FLASHCARD SERVICE - Added source filter", { source: params.source });
  }

  // Filtr wyszukiwania tekstowego
  if (params.searchText && params.searchText.trim() !== "") {
    const searchPattern = `%${params.searchText.trim()}%`;
    query = query.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
    logger.debug("FLASHCARD SERVICE - Added search filter", { searchPattern });
  }

  return query;
}

/**
 * Stosuje sortowanie do zapytania
 */
function applySorting(
  query: ReturnType<typeof initializeQuery>,
  sortBy: string,
  sortOrder: "asc" | "desc"
): ReturnType<typeof initializeQuery> {
  const ascending = sortOrder === "asc";
  logger.debug(`FLASHCARD SERVICE - Applying sorting`, { sortBy, sortOrder, ascending });
  return query.order(sortBy, { ascending });
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
  logger.debug(`[getFlashcardByIdService] Starting fetch for flashcard ID=${flashcardId}, userID=${userId}`);

  // Dodatkowe logi dla problematycznego ID
  if (flashcardId === 404) {
    logger.debug(`[getFlashcardByIdService] SPECIAL CASE: Fetching flashcard with ID 404`);
  }

  try {
    const { data, error } = await supabase
      .from(FLASHCARDS_TABLE)
      .select(DEFAULT_FLASHCARD_SELECT)
      .eq("user_id", userId)
      .eq("id", flashcardId)
      .single();

    // Sprawdź, czy wystąpił błąd podczas pobierania
    if (error) {
      // Specjalna obsługa błędu "Not Found" (PGRST116)
      if (error.code === "PGRST116") {
        logger.debug(`[getFlashcardByIdService] Flashcard with ID=${flashcardId} not found (PGRST116)`);
        return null;
      }

      // Dla wszystkich innych błędów Supabase: zaloguj i rzuć dalej
      checkAndLogSupabaseError(error, `fetching flashcard by ID ${flashcardId}`);
      throw error;
    }

    if (!data) {
      logger.debug(`[getFlashcardByIdService] No data returned for flashcard ID=${flashcardId}, userID=${userId}`);
      return null;
    }

    logger.debug(`[getFlashcardByIdService] Successfully retrieved flashcard:`, {
      id: data.id,
      front: data.front?.substring(0, 50) + (data.front?.length > 50 ? "..." : ""),
      back: data.back?.substring(0, 50) + (data.back?.length > 50 ? "..." : ""),
      source: data.source,
      created_at: data.created_at,
      generation_id: data.generation_id,
    });

    return data as FlashcardDto;
  } catch (error) {
    logger.error(`[getFlashcardByIdService] Unexpected error:`, error);
    if (error instanceof Error) {
      logger.error(`[getFlashcardByIdService] Error details:`, {
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
    .from(FLASHCARDS_TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("id", flashcardId)
    .maybeSingle();

  if (checkAndLogSupabaseError(exists.error, `checking existence for update (ID: ${flashcardId})`) || !exists.data) {
    return null;
  }

  // Update the flashcard
  const { data, error } = await supabase
    .from(FLASHCARDS_TABLE)
    .update(flashcardData)
    .eq("user_id", userId)
    .eq("id", flashcardId)
    .select(DEFAULT_FLASHCARD_SELECT)
    .single();

  if (checkAndLogSupabaseError(error, `updating flashcard (ID: ${flashcardId})`)) {
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
  logger.debug(`[deleteFlashcardService] Starting delete for flashcard ID=${flashcardId}, userID=${userId}`);

  // Specjalne obejście dla ID 404 - potencjalny konflikt z kodem HTTP 404
  if (flashcardId === 404) {
    logger.debug(`[deleteFlashcardService] WORKAROUND: Special case for flashcard ID 404`);

    try {
      // Próbujemy bezpośrednio usunąć bez sprawdzania istnienia
      logger.debug(`[deleteFlashcardService] WORKAROUND: Attempting direct deletion for ID 404`);

      // Wykonaj bezpośrednie zapytanie usuwające
      const { error } = await supabase.from(FLASHCARDS_TABLE).delete().eq("id", 404).eq("user_id", userId);

      if (checkAndLogSupabaseError(error, `direct deletion workaround (ID: 404)`)) {
        // Próbujemy alternatywne zapytanie - może inny format ID
        logger.debug(`[deleteFlashcardService] WORKAROUND: Trying alternative query`);

        // Użyjemy alternatywnego podejścia - zapytanie raw SQL
        const { error: error2 } = await supabase
          .from(FLASHCARDS_TABLE)
          .delete()
          .filter("id", "eq", 404)
          .filter("user_id", "eq", userId);

        if (checkAndLogSupabaseError(error2, `alternative deletion workaround (ID: 404)`)) {
          // Trzecia próba - soft delete przez aktualizację
          logger.debug(`[deleteFlashcardService] WORKAROUND: Trying soft delete via update`);

          const { error: error3 } = await supabase
            .from(FLASHCARDS_TABLE)
            .update({
              front: "[DELETED] This flashcard has been deleted",
              back: "[DELETED] This flashcard has been deleted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", 404)
            .eq("user_id", userId);

          if (checkAndLogSupabaseError(error3, `soft delete workaround (ID: 404)`)) {
            return false;
          }

          logger.debug(`[deleteFlashcardService] WORKAROUND: Soft delete successful`);
          return true;
        }

        logger.debug(`[deleteFlashcardService] WORKAROUND: Direct deletion successful`);
        return true;
      }

      logger.debug(`[deleteFlashcardService] WORKAROUND: Direct deletion successful`);
      return true;
    } catch (specialError) {
      logger.error(`[deleteFlashcardService] WORKAROUND: Error:`, specialError);
      return false;
    }
  }

  try {
    // Check if flashcard exists and belongs to user
    logger.debug(`[deleteFlashcardService] Checking if flashcard exists for user...`);
    const { data: existsData, error: existsError } = await supabase
      .from(FLASHCARDS_TABLE)
      .select("id")
      .eq("user_id", userId)
      .eq("id", flashcardId)
      .maybeSingle();

    // Szczegółowe logowanie wyniku zapytania sprawdzającego
    logger.debug(`[deleteFlashcardService] Exists check result:`, {
      data: existsData,
      hasError: !!existsError,
      errorMessage: existsError?.message,
    });

    if (checkAndLogSupabaseError(existsError, `checking existence for delete (ID: ${flashcardId})`)) {
      return false;
    }

    if (!existsData) {
      logger.debug(`[deleteFlashcardService] Flashcard ID=${flashcardId} not found for user ID=${userId}`);
      return false;
    }

    logger.debug(`[deleteFlashcardService] Flashcard found, proceeding with deletion...`);

    // Delete the flashcard
    const { error: deleteError } = await supabase
      .from(FLASHCARDS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("id", flashcardId);

    if (checkAndLogSupabaseError(deleteError, `deleting flashcard (ID: ${flashcardId})`)) {
      throw deleteError;
    }

    logger.debug(`[deleteFlashcardService] Successfully deleted flashcard ID=${flashcardId}`);
    return true;
  } catch (error) {
    logger.error(`[deleteFlashcardService] Unexpected error during flashcard deletion:`, error);
    if (error instanceof Error) {
      logger.error(`[deleteFlashcardService] Error details:`, {
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
  logger.debug(`Creating single flashcard for user: ${userId}`);

  // Check for existing flashcard with the same generation_id, user_id, front, and back
  // to prevent duplicates
  if (flashcardData.generation_id) {
    logger.debug(`Checking for existing flashcard for user ${userId} and generation ${flashcardData.generation_id}`);

    const { data: existingFlashcard, error: checkError } = await supabase
      .from(FLASHCARDS_TABLE)
      .select(DEFAULT_FLASHCARD_SELECT)
      .eq("user_id", userId)
      .eq("generation_id", flashcardData.generation_id)
      .eq("front", flashcardData.front)
      .eq("back", flashcardData.back)
      .maybeSingle();

    if (
      checkAndLogSupabaseError(
        checkError,
        `checking existing flashcard before create (gen: ${flashcardData.generation_id})`
      )
    ) {
      throw checkError;
    }

    if (existingFlashcard) {
      logger.debug(`Found existing flashcard with ID ${existingFlashcard.id}`);
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
    .from(FLASHCARDS_TABLE)
    .insert(data)
    .select(DEFAULT_FLASHCARD_SELECT)
    .single();

  if (checkAndLogSupabaseError(error, "creating single flashcard")) {
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
  logger.debug(
    `Creating flashcards, count: ${flashcardsData.flashcards.length}, user: ${userId}, isSaveAll: ${isSaveAll}`
  );
  logger.debug(`Incoming flashcards: ${JSON.stringify(flashcardsData.flashcards)}`);

  // Check for existing flashcards with the same generation_id, user_id
  const generationId = flashcardsData.flashcards[0]?.generation_id;
  if (!generationId) {
    logger.debug("No generation ID provided, cannot proceed with creating flashcards");
    return [];
  }

  // Separate edited and non-edited flashcards for different handling
  const editedFlashcards = flashcardsData.flashcards.filter((card) => card.source === "ai-edited");
  const nonEditedFlashcards = flashcardsData.flashcards.filter((card) => card.source !== "ai-edited");

  logger.debug(
    `Split request into edited (${editedFlashcards.length}) and non-edited (${nonEditedFlashcards.length}) flashcards`
  );

  // Get existing flashcards for this generation
  const { data: existingFlashcards, error: checkError } = await supabase
    .from(FLASHCARDS_TABLE)
    .select(DEFAULT_FLASHCARD_SELECT)
    .eq("user_id", userId)
    .eq("generation_id", generationId);

  if (
    checkAndLogSupabaseError(checkError, `checking existing flashcards before create multiple (gen: ${generationId})`)
  ) {
    throw checkError;
  }

  // Logic for "Zapisz wszystkie" - zachowujemy oryginalną logikę
  if (isSaveAll && existingFlashcards && existingFlashcards.length > 0) {
    logger.debug(`Found ${existingFlashcards.length} existing flashcards, replacing them with all new versions`);

    // Get IDs of existing flashcards to delete
    const existingIds = existingFlashcards.map((card) => card.id);
    logger.debug(`Deleting existing flashcards with IDs: ${existingIds.join(", ")}`);

    // Delete existing flashcards
    const { error: deleteError } = await supabase
      .from(FLASHCARDS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("generation_id", generationId);

    if (checkAndLogSupabaseError(deleteError, `deleting existing flashcards for save all (gen: ${generationId})`)) {
      throw deleteError;
    }

    logger.debug(`Successfully deleted ${existingIds.length} existing flashcards`);

    // Insert all flashcards for "Zapisz wszystkie"
    const dataToInsert = flashcardsData.flashcards.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    logger.debug(`Inserting ${dataToInsert.length} new flashcards`);

    const { data: createdFlashcards, error: insertError } = await supabase
      .from(FLASHCARDS_TABLE)
      .insert(dataToInsert)
      .select(DEFAULT_FLASHCARD_SELECT);

    if (checkAndLogSupabaseError(insertError, `inserting flashcards for save all (gen: ${generationId})`)) {
      throw insertError;
    }

    logger.debug(`Successfully created ${createdFlashcards?.length || 0} new flashcards`);
    return createdFlashcards as FlashcardDto[];
  }

  // Logic for "Zapisz wybrane" - zamieniamy całą poprzednią logikę
  if (!isSaveAll && existingFlashcards && existingFlashcards.length > 0) {
    logger.debug(`"Zapisz wybrane": Found ${existingFlashcards.length} existing flashcards, deleting them all first`);

    // Delete all existing flashcards for this generation
    const { error: deleteError } = await supabase
      .from(FLASHCARDS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("generation_id", generationId);

    if (
      checkAndLogSupabaseError(deleteError, `deleting existing flashcards for save selected (gen: ${generationId})`)
    ) {
      throw deleteError;
    }

    logger.debug(`Successfully deleted all existing flashcards for this generation`);

    // Insert the new flashcards (frontendowa logika zapewnia, że są to tylko zaakceptowane)
    const dataToInsert = flashcardsData.flashcards.map((flashcard) => ({
      ...flashcard,
      user_id: userId,
    }));

    logger.debug(`Inserting ${dataToInsert.length} selected flashcards`);

    const { data: createdFlashcards, error: insertError } = await supabase
      .from(FLASHCARDS_TABLE)
      .insert(dataToInsert)
      .select(DEFAULT_FLASHCARD_SELECT);

    if (checkAndLogSupabaseError(insertError, `inserting flashcards for save selected (gen: ${generationId})`)) {
      throw insertError;
    }

    logger.debug(`Successfully created ${createdFlashcards?.length || 0} selected flashcards`);
    return createdFlashcards as FlashcardDto[];
  }

  // No existing flashcards, just insert the new ones
  const dataToInsert = flashcardsData.flashcards.map((flashcard) => ({
    ...flashcard,
    user_id: userId,
  }));

  logger.debug(`No existing flashcards found. Inserting ${dataToInsert.length} new flashcards`);

  try {
    // Insert the new flashcards
    const { data: createdFlashcards, error: insertError } = await supabase
      .from(FLASHCARDS_TABLE)
      .insert(dataToInsert)
      .select(DEFAULT_FLASHCARD_SELECT);

    if (checkAndLogSupabaseError(insertError, `inserting new flashcards (no existing, gen: ${generationId})`)) {
      throw insertError;
    }

    logger.debug(`Successfully created ${createdFlashcards?.length || 0} new flashcards`);
    return createdFlashcards as FlashcardDto[];
  } catch (error) {
    logger.error("Unexpected error creating flashcards:", error);
    throw error;
  }
}
