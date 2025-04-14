import type { CreateFlashcardDto } from "../../types";

export interface AIGeneratedData {
  flashcards: Omit<CreateFlashcardDto, "generation_id">[];
  model: string;
}

/**
 * Generates mock flashcards for development/testing
 * @param text Text to generate flashcards from
 * @returns Generated flashcards and model info
 */
export async function generateFlashcardsWithAI(text: string): Promise<AIGeneratedData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Create mock flashcards based on text length
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length;

  // Generate between 5-10 flashcards based on text length
  const cardCount = Math.min(Math.max(Math.floor(wordCount / 200), 5), 10);
  const mockFlashcards: Omit<CreateFlashcardDto, "generation_id">[] = [];

  for (let i = 1; i <= cardCount; i++) {
    mockFlashcards.push({
      front: `Mock Flashcard ${i} Front (from text with ${wordCount} words)`,
      back: `Mock Answer ${i} with details based on the provided content that has approximately ${sentenceCount} sentences.`,
      source: "ai-full" as const,
    });
  }

  return {
    flashcards: mockFlashcards,
    model: "mock-model-for-development",
  };
}
