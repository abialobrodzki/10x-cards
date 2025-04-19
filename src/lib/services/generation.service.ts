import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerationWithFlashcardsResponseDto, CreateFlashcardDto } from "../../types";
import { generateFlashcardsWithAI } from "./ai.service";
import { createFlashcardsService } from "./flashcard.service";
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
): Promise<GenerationWithFlashcardsResponseDto> {
  //   console.log("Starting flashcards generation...");

  // 1. Create hash of the source text (using MD5 as requested)
  const sourceTextHash = crypto.createHash("md5").update(text).digest("hex");
  //   console.log("Generated hash:", sourceTextHash);

  // 2. Create initial generation record
  const startTime = Date.now();
  //   console.log("Creating initial generation record...");

  const { data: generation, error: generationError } = await supabase
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

  if (generationError) {
    // console.error("Error creating generation record:", generationError);
    throw new Error("Failed to create generation record: " + stringifyError(generationError));
  }

  //   console.log("Generation record created:", generation);

  try {
    // 3. Generate flashcards using AI service
    // console.log("Generating flashcards with AI...");
    const { flashcards, model } = await generateFlashcardsWithAI(text, language);
    const generationDuration = Date.now() - startTime;
    // console.log("Flashcards generated:", flashcards);

    // 4. Update generation record with results
    // console.log("Updating generation record...");
    const { data: updatedGeneration, error: updateError } = await supabase
      .from("generations")
      .update({
        generated_count: flashcards.length,
        model,
        generation_duration: generationDuration,
      })
      .eq("id", generation.id)
      .select()
      .single();

    if (updateError) {
      // console.error("Error updating generation record:", updateError);
      throw new Error("Failed to update generation record: " + stringifyError(updateError));
    }

    //   console.log("Generation record updated:", updatedGeneration);

    // 5. Insert generated flashcards into flashcards table
    const cardsToInsert: CreateFlashcardDto[] = flashcards.map((card: Omit<CreateFlashcardDto, "generation_id">) => ({
      front: card.front,
      back: card.back,
      source: "ai-full" as const,
      generation_id: updatedGeneration.id,
    }));
    const insertedFlashcards = await createFlashcardsService(supabase, userId, { flashcards: cardsToInsert });

    const mappedFlashcards: Omit<CreateFlashcardDto, "generation_id">[] = insertedFlashcards.map((card) => ({
      front: card.front,
      back: card.back,
      source: "ai-full" as const,
    }));

    return {
      generation: {
        id: updatedGeneration.id,
        generated_count: updatedGeneration.generated_count,
        accepted_unedited_count: updatedGeneration.accepted_unedited_count,
        accepted_edited_count: updatedGeneration.accepted_edited_count,
        created_at: updatedGeneration.created_at,
        updated_at: updatedGeneration.updated_at,
        model: updatedGeneration.model,
      },
      flashcards: mappedFlashcards,
    };
  } catch (error) {
    // Log the error for generation
    await supabase.from("generation_error_logs").insert({
      user_id: userId,
      model: "unknown",
      error_code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      error_message: error instanceof Error ? error.message : stringifyError(error),
      source_text_hash: sourceTextHash,
      source_text_length: text.length,
    });

    throw new Error(error instanceof Error ? error.message : stringifyError(error));
  }
}
