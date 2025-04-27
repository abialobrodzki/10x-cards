import { logger } from "../openrouter.logger";
import type { CreateFlashcardDto } from "../../types";

// Types for OpenRouter API - removed unused interfaces
// interface OpenRouterRequest { /* ... */ }
// interface OpenRouterResponse { /* ... */ }

export interface AIGeneratedData {
  flashcards: Omit<CreateFlashcardDto, "generation_id">[];
  model: string;
}

export interface AIServiceConfig {
  useMock: boolean;
  apiKey: string;
  siteUrl: string;
}

/**
 * Wykrywa prawdopodobny język tekstu na podstawie prostych heurystyk
 * @param text Tekst do analizy
 * @returns Kod języka ('pl' dla polskiego, 'en' dla angielskiego, inne dla nieznanych)
 */
export function detectLanguage(text: string): string {
  // Próbka tekstu do analizy (pierwsze 500 znaków)
  const sample = text.substring(0, 500).toLowerCase();

  // Charakterystyczne polskie znaki
  const polishChars = ["ą", "ć", "ę", "ł", "ń", "ó", "ś", "ź", "ż"];
  const polishWords = ["jest", "nie", "to", "się", "oraz", "dla", "przez", "jako", "były"];

  // Charakterystyczne angielskie słowa
  const englishWords = ["the", "is", "are", "and", "for", "with", "this", "that", "have"];

  // Liczenie wystąpień
  let polishScore = 0;
  let englishScore = 0;

  // Sprawdź polskie znaki
  polishChars.forEach((char) => {
    if (sample.includes(char)) polishScore += 2;
  });

  // Sprawdź polskie słowa
  polishWords.forEach((word) => {
    if (sample.includes(" " + word + " ")) polishScore += 1;
  });

  // Sprawdź angielskie słowa
  englishWords.forEach((word) => {
    if (sample.includes(" " + word + " ")) englishScore += 1;
  });

  logger.debug(`Wykrywanie języka - wynik: polski=${polishScore}, angielski=${englishScore}`);

  // Decyzja na podstawie wyników
  if (polishScore > englishScore) return "pl";
  return "en";
}

/**
 * Generates flashcards using OpenRouter.ai API or mock based on config
 * @param text Text to generate flashcards from
 * @param language Optional language code ('pl', 'en') - auto-detected if not provided
 * @param config Optional service configuration (apiKey, useMock, siteUrl)
 */
export async function generateFlashcardsWithAI(
  text: string,
  language?: string,
  config?: AIServiceConfig
): Promise<AIGeneratedData> {
  // Default config from environment if not provided
  const effectiveConfig: AIServiceConfig = config || {
    useMock: import.meta.env.USE_AI_MOCK === "true",
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    siteUrl: import.meta.env.PUBLIC_SITE_URL || "https://10xcards.app",
  };

  // Use mock if specified
  if (effectiveConfig.useMock) {
    logger.debug("Using mock AI response based on config.");
    return generateMockFlashcards(text);
  }

  // Wykryj język, jeśli nie został podany
  const detectedLanguage = language || detectLanguage(text);
  logger.debug(`Używam języka: ${detectedLanguage}`);

  if (!effectiveConfig.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment");
  }

  try {
    logger.debug("Wysyłam zapytanie bezpośrednio do API OpenRouter");

    // Dostosuj instrukcję systemu w zależności od języka
    let systemInstruction = "";

    if (detectedLanguage === "pl") {
      systemInstruction =
        "Twoim zadaniem jest wygenerowanie 5 fiszek w formacie JSON. " +
        "Zwróć WYŁĄCZNIE tablicę JSON obiektów bez żadnego dodatkowego tekstu przed lub po. " +
        "Każdy obiekt musi zawierać pola: 'front' (pytanie), 'back' (odpowiedź), 'hint' (podpowiedź), " +
        "'difficulty' (jedna z wartości: 'easy', 'medium', 'hard') oraz 'tags' (tablica stringów). " +
        "Wygeneruj 5 różnych fiszek obejmujących różne aspekty tekstu. " +
        "NIE DODAWAJ żadnych wyjaśnień, znaczników markdown ani bloków kodu przed lub po tablicy JSON. " +
        "WAŻNE: Pytanie, odpowiedź i podpowiedź muszą być w języku POLSKIM.";
    } else {
      systemInstruction =
        "Your task is to generate 5 flashcards in VALID JSON format. " +
        "Always return ONLY a JSON ARRAY of flashcard objects with no extra text before or after. " +
        "Each object must include these fields: 'front' (question), 'back' (answer), 'hint' (helpful tip), " +
        "'difficulty' (one of: 'easy', 'medium', 'hard'), and 'tags' (array of strings). " +
        "Generate 5 different flashcards covering different aspects of the text. " +
        "DO NOT include any explanation text, markdown, or code blocks before or after the JSON array. " +
        "IMPORTANT: The question, answer, and hint must be in ENGLISH.";
    }

    // Przygotuj żądanie
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveConfig.apiKey}`,
        "HTTP-Referer": effectiveConfig.siteUrl,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout:free",
        messages: [
          {
            role: "system",
            content: systemInstruction,
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "FlashcardProposal",
            strict: true,
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: { type: "string", description: "The question or prompt on the front of the flashcard" },
                  back: { type: "string", description: "The answer on the back of the flashcard" },
                  hint: { type: "string", description: "A helpful hint for the user" },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                    description: "The difficulty level of the flashcard",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Tags for categorizing the flashcard",
                  },
                },
                required: ["front", "back", "difficulty", "tags"],
              },
            },
          },
        },
      }),
    });

    logger.debug("Status odpowiedzi oferowanego API:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("OpenRouter API error", { status: response.status, errorText });
      throw new Error(`HTTP error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug("Otrzymano odpowiedź:", JSON.stringify(data).substring(0, 100) + "...");

    // Wyciągnij zawartość odpowiedzi
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Brak zawartości w odpowiedzi AI");
    }

    // Parsuj JSON z odpowiedzi, jeśli jest string
    let flashcardData;
    if (typeof content === "string") {
      try {
        // Szukamy tablicy JSON
        const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
          logger.debug("Znaleziono potencjalny blok JSON w odpowiedzi");
          // Czyścimy potencjalnie problematyczne znaki
          let jsonString = jsonMatch[0];

          // Debugujemy znalezione dane
          logger.debug("Surowa treść JSON:", jsonString.substring(0, 50) + "...");

          // Próba parsowania
          try {
            flashcardData = JSON.parse(jsonString);
          } catch (innerError) {
            logger.error("Błąd podczas parsowania wyodrębnionego JSON:", innerError);

            // Próba uprzątnięcia JSON
            jsonString = jsonString
              .replace(/[^\x20-\x7E]/g, "")
              .replace(/\}\s*,\s*\]/g, "}]")
              .trim();

            logger.debug("Oczyszczona treść JSON:", jsonString.substring(0, 50) + "...");
            flashcardData = JSON.parse(jsonString);
          }
        } else {
          logger.error("Nie znaleziono bloku JSON w odpowiedzi:", content.substring(0, 100) + "...");
          throw new Error("No JSON object found in response");
        }
      } catch (e) {
        logger.error("Error parsing JSON from AI response:", e);
        logger.error("Odpowiedź zawierała:", content.substring(0, 200) + "...");
        throw new Error("Failed to parse JSON from AI response");
      }
    } else {
      // Zawartość już jest obiektem JSON
      flashcardData = content;
    }

    // Stwórz obiekty fiszek z tablicy
    const cards: Omit<CreateFlashcardDto, "generation_id">[] = [];

    // Sprawdź czy mamy tablicę fiszek
    if (Array.isArray(flashcardData)) {
      // Mapuj każdy element tablicy na fiszkę
      flashcardData.forEach((item) => {
        cards.push({
          front: item.front,
          back: item.back,
          source: "ai-full",
        });
      });
      logger.debug(`Wygenerowano ${cards.length} fiszek`);
    } else {
      // Jeśli nie jest tablicą, dodaj pojedynczą fiszkę
      cards.push({
        front: flashcardData.front,
        back: flashcardData.back,
        source: "ai-full",
      });
      logger.debug("Wygenerowano 1 fiszkę (nie tablicę)");
    }

    return {
      flashcards: cards,
      model: data.model || "meta-llama/llama-4-scout:free",
    };
  } catch (err) {
    logger.error("Szczegółowy błąd OpenRouter:", err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    // Re-throw to preserve message
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  }
}

/**
 * Generates mock flashcards for development/testing
 * @param text Text to generate flashcards from
 * @returns Mock flashcards and model info
 */
export function generateMockFlashcards(text: string): AIGeneratedData {
  const wordCount = text.split(/\s+/).length;
  const mockFlashcards: Omit<CreateFlashcardDto, "generation_id">[] = [];
  for (let i = 1; i <= 5; i++) {
    mockFlashcards.push({
      front: `Mock Flashcard ${i} Front (from text with ${wordCount} words)`,
      back: `Mock Answer ${i} with details based on the provided content.`,
      source: "ai-full" as const,
    });
  }
  return { flashcards: mockFlashcards, model: "mock-model-for-development" };
}
