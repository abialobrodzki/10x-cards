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
  supabase: SupabaseClient,
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

  // Start building the query
  let query = supabase
    .from("flashcards")
    .select("id, front, back, source, created_at, updated_at, generation_id", { count: "exact" })
    .eq("user_id", userId)
    .range(from, to)
    .order(sortBy, { ascending: false });

  // Apply optional filters if provided
  if (params.generation_id) {
    query = query.eq("generation_id", params.generation_id);
  }

  if (params.source) {
    query = query.eq("source", params.source);
  }

  // Execute the query
  const { data, count, error } = await query;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching flashcards:", error);
    throw error;
  }

  return {
    flashcards: data as FlashcardDto[],
    total: count || 0,
  };
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error("Error creating flashcards:", error);
    throw error;
  }

  return createdFlashcards as FlashcardDto[];
}
