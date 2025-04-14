import type { CreateFlashcardDto } from "../../types";

// Types for OpenRouter API
interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  max_tokens: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIGeneratedData {
  flashcards: Omit<CreateFlashcardDto, "generation_id">[];
  model: string;
}

/**
 * Generates flashcards using OpenRouter.ai API
 * @param text Text to generate flashcards from
 * @returns Generated flashcards and model info
 */
export async function generateFlashcardsWithAI(text: string): Promise<AIGeneratedData> {
  // Check if we should use the mock API for development/testing
  if (import.meta.env.USE_AI_MOCK === "true") {
    return generateMockFlashcards(text);
  }

  // Select the model to use
  const model = "anthropic/claude-3-haiku-20240307";

  // Create the system prompt
  const systemPrompt = `You are an AI assistant specialized in creating educational flashcards from text. Your task is to:
1. Analyze the provided text and identify key concepts, terms, facts, and relationships.
2. Create concise and effective flashcards with a clear front (question/concept) and back (answer/explanation).
3. Format your response as a valid JSON array of flashcard objects with "front" and "back" properties.
4. Create between 5-20 flashcards depending on the content density.
5. Ensure each flashcard focuses on a single concept for effective learning.
6. Aim for clarity, precision, and educational value.

Example response format:
[
  {
    "front": "What is photosynthesis?",
    "back": "The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water."
  },
  {
    "front": "What are the primary reactants in photosynthesis?",
    "back": "Carbon dioxide (CO2) and water (H2O)"
  }
]`;

  // Prepare the request to OpenRouter.ai
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  const requestData: OpenRouterRequest = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 4000,
  };

  try {
    // Call the OpenRouter.ai API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": import.meta.env.PUBLIC_SITE_URL || "https://localhost:4321",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    // Extract and parse the response content
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // The response should be a JSON array of flashcards
    const flashcards = extractFlashcardsFromResponse(content);

    return {
      flashcards,
      model: data.model,
    };
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extracts flashcards from AI response text
 * @param responseText Response text from AI
 * @returns Array of flashcard objects
 */
function extractFlashcardsFromResponse(responseText: string): Omit<CreateFlashcardDto, "generation_id">[] {
  try {
    // Try to parse the entire response as JSON
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate the structure of each flashcard
      if (Array.isArray(parsedData)) {
        return parsedData
          .filter(
            (card) =>
              typeof card === "object" &&
              card !== null &&
              typeof card.front === "string" &&
              typeof card.back === "string"
          )
          .map((card) => ({
            front: card.front.trim(),
            back: card.back.trim(),
            source: "ai-full" as const,
          }));
      }
    }

    throw new Error("Could not extract valid flashcards from AI response");
  } catch (error) {
    console.error("Error extracting flashcards from response:", error);
    throw new Error("Failed to parse AI-generated flashcards");
  }
}

/**
 * Generates mock flashcards for development/testing
 * @param text Text to generate flashcards from
 * @returns Mock flashcards and model info
 */
function generateMockFlashcards(text: string): AIGeneratedData {
  // Create 5 mock flashcards based on text length
  const wordCount = text.split(/\s+/).length;
  const mockFlashcards: Omit<CreateFlashcardDto, "generation_id">[] = [];

  for (let i = 1; i <= 5; i++) {
    mockFlashcards.push({
      front: `Mock Flashcard ${i} Front (from text with ${wordCount} words)`,
      back: `Mock Answer ${i} with details based on the provided content.`,
      source: "ai-full" as const,
    });
  }

  return {
    flashcards: mockFlashcards,
    model: "mock-model-for-development",
  };
}
