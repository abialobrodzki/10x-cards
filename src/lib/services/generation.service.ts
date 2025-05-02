/* eslint-disable no-console */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerationWithProposedFlashcardsDto } from "../../types";
import { generateFlashcardsWithAI } from "./ai.service";
import crypto from "crypto";

function stringifyError(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const errorObj = err as Record<string, unknown>;
    return Object.keys(errorObj)
      .map((key) => key + ": " + errorObj[key])
      .join(", ");
  }
  return String(err);
}

/**
 * Generates flashcards based on provided text using AI
 * @param supabase Supabase client instance
 * @param userId User ID for whom to generate flashcards
 * @param text Text to generate flashcards from
 * @param language Optional language code (e.g. 'pl', 'en')
 * @returns Generated flashcards and generation metadata
 */
export async function generateFlashcards(
  supabase: SupabaseClient<Database>,
  userId: string,
  text: string,
  language?: string
): Promise<GenerationWithProposedFlashcardsDto> {
  //   console.log("Starting flashcards generation...");

  // 1. Create hash of the source text (using MD5 as requested)
  const sourceTextHash = crypto.createHash("md5").update(text).digest("hex");
  //   console.log("Generated hash:", sourceTextHash);

  // 2. Create initial generation record
  const startTime = Date.now();
  //   console.log("Creating initial generation record...");

  let generation: Database["public"]["Tables"]["generations"]["Row"] | null = null;
  let generationError: unknown = null;

  try {
    const result = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        generated_count: 0,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
        source_text_hash: sourceTextHash,
        source_text_length: text.length,
        generation_duration: 0,
        model: "", // Will be updated after AI generation
      })
      .select()
      .single();

    generation = result.data;
    generationError = result.error;
  } catch (err) {
    generationError = err;
  }

  // Obsługa wygasłego tokenu JWT
  if (
    generationError &&
    typeof generationError === "object" &&
    generationError !== null &&
    "code" in generationError &&
    "message" in generationError &&
    generationError.code === "PGRST301" &&
    generationError.message === "JWT expired"
  ) {
    console.log("Token JWT wygasł - należy się zalogować ponownie");
    throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  } else if (generationError) {
    throw new Error("Failed to create generation record: " + stringifyError(generationError));
  }

  try {
    // 3. Generate flashcards using AI service
    // console.log("Generating flashcards with AI...");
    const { flashcards, model } = await generateFlashcardsWithAI(text, language);
    const generationDuration = Date.now() - startTime;
    // console.log("Flashcards generated:", flashcards);

    // 4. Update generation record with results
    // console.log("Updating generation record...");
    let updatedGeneration: Database["public"]["Tables"]["generations"]["Row"] | null = null;
    let updateError: unknown = null;

    try {
      const updateResult = await supabase
        .from("generations")
        .update({
          generated_count: flashcards.length,
          model,
          generation_duration: generationDuration,
        })
        .eq("id", generation?.id || 0)
        .select()
        .single();

      updatedGeneration = updateResult.data;
      updateError = updateResult.error;
    } catch (err) {
      updateError = err;
    }

    // Obsługa wygasłego tokenu JWT dla aktualizacji
    if (
      updateError &&
      typeof updateError === "object" &&
      updateError !== null &&
      "code" in updateError &&
      "message" in updateError &&
      updateError.code === "PGRST301" &&
      updateError.message === "JWT expired"
    ) {
      console.log("Token JWT wygasł podczas aktualizacji - należy się zalogować ponownie");
      throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    } else if (updateError) {
      throw new Error("Failed to update generation record: " + stringifyError(updateError));
    }

    // 5. Insert generated flashcards into flashcards table
    if (!updatedGeneration) {
      throw new Error("Failed to update generation record: generation data is null");
    }

    return {
      generation: {
        id: updatedGeneration.id,
        generated_count: flashcards.length,
        accepted_unedited_count: updatedGeneration.accepted_unedited_count,
        accepted_edited_count: updatedGeneration.accepted_edited_count,
        created_at: updatedGeneration.created_at,
        updated_at: updatedGeneration.updated_at,
        model: updatedGeneration.model,
      },
      flashcards: flashcards.map((card) => ({
        ...card,
        user_id: userId,
      })),
    };
  } catch (error) {
    // Log the error for generation - użyj klienta serwisowego w razie potrzeby
    try {
      await supabase.from("generation_error_logs").insert({
        user_id: userId,
        model: "unknown",
        error_code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
        error_message: error instanceof Error ? error.message : stringifyError(error),
        source_text_hash: sourceTextHash,
        source_text_length: text.length,
      });
    } catch (logError: unknown) {
      // Jeśli wystąpił błąd podczas logowania - prawdopodobnie wygasł token
      console.error("Błąd podczas zapisywania logu błędu:", logError);
      // Nie rzucamy tego błędu dalej, nie jest to krytyczne
    }

    throw new Error(error instanceof Error ? error.message : stringifyError(error));
  }
}
