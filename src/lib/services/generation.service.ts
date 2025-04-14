import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerationWithFlashcardsResponseDto, CreateFlashcardDto } from "../../types";
import { generateFlashcardsWithAI } from "./ai-mock.service";
import crypto from "crypto";

/**
 * Generates flashcards based on provided text using AI
 * @param supabase Supabase client instance
 * @param userId User ID for whom to generate flashcards
 * @param text Text to generate flashcards from
 * @returns Generated flashcards and generation metadata
 */
export async function generateFlashcards(
  supabase: SupabaseClient<Database>,
  userId: string,
  text: string
): Promise<GenerationWithFlashcardsResponseDto> {
  // 1. Create hash of the source text (using MD5 as requested)
  const sourceTextHash = crypto.createHash("md5").update(text).digest("hex");

  // 2. Create initial generation record
  const startTime = Date.now();

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
    console.error("Error creating generation record:", generationError);
    throw new Error("Failed to create generation record");
  }

  try {
    // 3. Generate flashcards using mock AI service
    const { flashcards, model } = await generateFlashcardsWithAI(text);
    const generationDuration = Date.now() - startTime;

    // 4. Update generation record with results
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
      console.error("Error updating generation record:", updateError);
      throw new Error("Failed to update generation record");
    }

    // 5. Return response with generation data and flashcards
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
      flashcards: flashcards.map((card: Omit<CreateFlashcardDto, "generation_id">) => ({
        front: card.front,
        back: card.back,
        source: "ai-full" as const,
      })),
    };
  } catch (error) {
    // Log the error for generation
    await supabase.from("generation_error_logs").insert({
      user_id: userId,
      generation_id: generation.id,
      model: "unknown", // Will be updated if known
      error_code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
      error_message: error instanceof Error ? error.message : String(error),
      source_text_hash: sourceTextHash,
      source_text_length: text.length,
    });

    throw error;
  }
}
