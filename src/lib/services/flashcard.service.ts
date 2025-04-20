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
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, created_at, updated_at, generation_id")
    .eq("user_id", userId)
    .eq("id", flashcardId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Record not found error from PostgREST
      return null;
    }

    console.error("Error fetching flashcard:", error);
    throw error;
  }

  return data as FlashcardDto;
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
  // Check if flashcard exists and belongs to user
  const exists = await supabase
    .from("flashcards")
    .select("id")
    .eq("user_id", userId)
    .eq("id", flashcardId)
    .maybeSingle();

  if (exists.error || !exists.data) {
    return false;
  }

  // Delete the flashcard
  const { error } = await supabase.from("flashcards").delete().eq("user_id", userId).eq("id", flashcardId);

  if (error) {
    console.error("Error deleting flashcard:", error);
    throw error;
  }

  return true;
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
 * @returns The created flashcards
 */
export async function createFlashcardsService(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardsData: CreateFlashcardsDto
): Promise<FlashcardDto[]> {
  // Add user_id to each flashcard
  const data = flashcardsData.flashcards.map((flashcard) => ({
    ...flashcard,
    user_id: userId,
  }));

  // Insert the flashcards
  const { data: createdFlashcards, error } = await supabase
    .from("flashcards")
    .insert(data)
    .select("id, front, back, source, created_at, updated_at, generation_id");

  if (error) {
    console.error("Error creating flashcards:", error);
    throw error;
  }

  return createdFlashcards as FlashcardDto[];
}
