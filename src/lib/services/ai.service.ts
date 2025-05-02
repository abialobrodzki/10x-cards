import { logger } from "../openrouter.logger";
import type { CreateFlashcardDto } from "../../types";

// Types for OpenRouter API - removed unused interfaces
// interface OpenRouterRequest { /* ... */ }
// interface OpenRouterResponse { /* ... */ }

// Typ opisujący podstawowe dane fiszki zwrócone przez AI
export type AIBaseFlashcard = Pick<CreateFlashcardDto, "front" | "back" | "source">;

export interface AIGeneratedData {
  flashcards: AIBaseFlashcard[];
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
 * Tworzy instrukcję systemową dla AI na podstawie języka.
 * @param language Kod języka ('pl', 'en')
 * @returns Instrukcja systemowa dla modelu AI
 */
function buildSystemPrompt(language: string): string {
  if (language === "pl") {
    return (
      "Twoim zadaniem jest wygenerowanie 5 fiszek w formacie JSON. " +
      "Zwróć WYŁĄCZNIE tablicę JSON obiektów bez żadnego dodatkowego tekstu przed lub po. " +
      "Każdy obiekt musi zawierać pola: 'front' (pytanie), 'back' (odpowiedź), 'hint' (podpowiedź), " +
      "'difficulty' (jedna z wartości: 'easy', 'medium', 'hard') oraz 'tags' (tablica stringów). " +
      "Wygeneruj 5 różnych fiszek obejmujących różne aspekty tekstu. " +
      "NIE DODAWAJ żadnych wyjaśnień, znaczników markdown ani bloków kodu przed lub po tablicy JSON. " +
      "WAŻNE: Pytanie, odpowiedź i podpowiedź muszą być w języku POLSKIM."
    );
  } else {
    return (
      "Your task is to generate 5 flashcards in VALID JSON format. " +
      "Always return ONLY a JSON ARRAY of flashcard objects with no extra text before or after. " +
      "Each object must include these fields: 'front' (question), 'back' (answer), 'hint' (helpful tip), " +
      "'difficulty' (one of: 'easy', 'medium', 'hard'), and 'tags' (array of strings). " +
      "Generate 5 different flashcards covering different aspects of the text. " +
      "DO NOT include any explanation text, markdown, or code blocks before or after the JSON array. " +
      "IMPORTANT: The question, answer, and hint must be in ENGLISH."
    );
  }
}

/**
 * Parsuje i czyści odpowiedź JSON od AI, próbując wyodrębnić tablicę fiszek.
 * @param content Zawartość odpowiedzi od AI (może być stringiem lub już obiektem)
 * @returns Sparsowane dane fiszek (oczekiwana tablica)
 * @throws Błąd, jeśli parsowanie się nie powiedzie lub nie znaleziono danych
 */
function parseAndCleanAiJsonResponse(content: unknown): unknown {
  if (!content) {
    throw new Error("Brak zawartości w odpowiedzi AI do sparsowania");
  }

  let flashcardData;

  if (typeof content === "string") {
    logger.debug("Odpowiedź AI jest stringiem, próba parsowania JSON.");
    try {
      // Szukamy tablicy JSON ([...]) lub obiektu JSON ({...}) w stringu
      const jsonMatch = content.match(/(\[\s*\{[\s\S]*?\}\s*\]|\{\s*["\w]+\s*:[\s\S]*?\s*\})/);
      if (jsonMatch && jsonMatch[0]) {
        logger.debug("Znaleziono potencjalny blok JSON w odpowiedzi stringowej");
        let jsonString = jsonMatch[0];

        // Debugujemy znalezione dane
        logger.debug("Surowa treść JSON:", jsonString.substring(0, 150) + "...");

        // Próba parsowania
        try {
          flashcardData = JSON.parse(jsonString);
          logger.debug("Pomyślnie sparsowano wyodrębniony JSON.");
        } catch (innerError) {
          logger.warn("Błąd podczas pierwszej próby parsowania wyodrębnionego JSON, próba oczyszczenia:", innerError);

          // Próba uprzątnięcia JSON (usuwanie znaków kontrolnych, naprawa przecinka na końcu)
          jsonString = jsonString
            .replace(/[^\x20-\x7E]/g, "") // Usuń znaki non-printable ASCII
            .replace(/\}\s*,\s*(?=\])/g, "}") // Usuń przecinek przed zamykającym nawiasem kwadratowym
            .trim();

          logger.debug("Oczyszczona treść JSON przed drugą próbą parsowania:", jsonString.substring(0, 150) + "...");
          flashcardData = JSON.parse(jsonString); // Druga próba parsowania
          logger.debug("Pomyślnie sparsowano JSON po oczyszczeniu.");
        }
      } else {
        logger.error(
          "Nie znaleziono wzorca JSON (tablicy/obiektu) w odpowiedzi stringowej:",
          content.substring(0, 200) + "..."
        );
        throw new Error("No JSON array or object found in AI string response");
      }
    } catch (e) {
      logger.error("Ostateczny błąd parsowania JSON z odpowiedzi AI (string):", e);
      logger.error("Odpowiedź zawierała:", content.substring(0, 300) + "...");
      throw new Error("Failed to parse JSON from AI string response after cleaning attempts");
    }
  } else if (typeof content === "object") {
    // Zawartość już jest obiektem JSON
    logger.debug("Odpowiedź AI jest już obiektem, zwracam bezpośrednio.");
    flashcardData = content;
  } else {
    logger.error("Nieoczekiwany typ zawartości odpowiedzi AI:", typeof content);
    throw new Error(`Unexpected content type from AI: ${typeof content}`);
  }

  // Zwracamy sparsowane dane - oczekujemy, że to będzie tablica lub obiekt
  return flashcardData;
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
    const systemInstruction = buildSystemPrompt(detectedLanguage);

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

    // Parsuj JSON z odpowiedzi
    const flashcardData = parseAndCleanAiJsonResponse(content);

    // Stwórz obiekty fiszek z tablicy
    const cards: AIBaseFlashcard[] = [];

    // Sprawdź czy mamy tablicę fiszek
    if (Array.isArray(flashcardData)) {
      // Mapuj każdy element tablicy na fiszkę
      flashcardData.forEach((item: unknown) => {
        // Upewnij się, że item jest obiektem i ma wymagane pola przed dodaniem
        if (
          item &&
          typeof item === "object" &&
          "front" in item &&
          typeof item.front === "string" &&
          "back" in item &&
          typeof item.back === "string"
        ) {
          cards.push({
            front: item.front,
            back: item.back,
            source: "ai-full", // Source jest stały dla AI
          });
        } else {
          logger.warn("Pominięto nieprawidłowy obiekt fiszki z odpowiedzi AI:", item);
        }
      });
      logger.debug(`Pomyślnie zmapowano ${cards.length} fiszek z odpowiedzi AI.`);
    } else if (
      flashcardData &&
      typeof flashcardData === "object" &&
      "front" in flashcardData &&
      typeof flashcardData.front === "string" &&
      "back" in flashcardData &&
      typeof flashcardData.back === "string"
    ) {
      // Jeśli nie jest tablicą, ale poprawnym pojedynczym obiektem, dodaj go
      cards.push({
        front: flashcardData.front,
        back: flashcardData.back,
        source: "ai-full",
      });
      logger.debug("Wygenerowano 1 fiszkę (odpowiedź AI nie była tablicą).");
    } else {
      logger.error("Sparsowane dane z AI nie są tablicą ani poprawnym obiektem fiszki:", flashcardData);
      throw new Error("Parsed AI response is not an array or a valid flashcard object.");
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
  const mockFlashcards: AIBaseFlashcard[] = [];
  for (let i = 1; i <= 5; i++) {
    mockFlashcards.push({
      front: `Mock Flashcard ${i} Front (from text with ${wordCount} words)`,
      back: `Mock Answer ${i} with details based on the provided content.`,
      source: "ai-full" as const,
    });
  }
  return { flashcards: mockFlashcards, model: "mock-model-for-development" };
}
