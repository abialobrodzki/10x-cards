import { describe, test, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import * as aiService from "../../../lib/services/ai.service";
// Import the newly exported functions
import { detectLanguage, generateMockFlashcards } from "../../../lib/services/ai.service";
import type { AIServiceConfig } from "../../../lib/services/ai.service";
// Import FlashcardSourceType to use in mocks
import type { FlashcardSourceType } from "../../../types";
// Import the MSW server to control it
import { server } from "../../setup"; // Adjust path if needed

// Mock the logger
vi.mock("../../../lib/openrouter.logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ai.service", () => {
  // --- MSW Control for this test file ---
  // Stop MSW from intercepting requests in these specific unit tests
  beforeAll(() => {
    server.close(); // Close the server started in global setup
  });

  // Reset mocks between tests
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default successful fetch response for tests that need it
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: '[{"front":"Test","back":"Answer","hint":"Hint","difficulty":"medium","tags":["test"]}]',
              },
            },
          ],
          model: "test-model",
        }),
      text: () => Promise.resolve("Success response text"),
      status: 200,
      statusText: "OK",
      // Add a basic clone method required by MSW
      clone: () => ({ ...mockResponse, clone: () => ({ ...mockResponse }) }),
    };
    mockFetch.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Tests for detectLanguage ---
  describe("detectLanguage", () => {
    test("should detect Polish text with specific characters", () => {
      const polishText = "Przykładowy tekst z ą, ć, ę, ł, ń, ó, ś, ź, ż.";
      expect(detectLanguage(polishText)).toBe("pl");
    });

    test("should detect Polish text with common Polish words", () => {
      const polishText = "To jest przykład tekstu który zawiera częste polskie słowa oraz frazy.";
      expect(detectLanguage(polishText)).toBe("pl");
    });

    test("should detect English text with common English words", () => {
      const englishText = "This is a sample text containing common English words like the, is, and.";
      expect(detectLanguage(englishText)).toBe("en");
    });

    test("should default to English for ambiguous short text", () => {
      const shortText = "Test text";
      expect(detectLanguage(shortText)).toBe("en");
    });

    test("should default to English for text with mixed clues but more English", () => {
      const mixedText = "A mix of the Polish word 'jest' and English words like 'this' and 'that'.";
      expect(detectLanguage(mixedText)).toBe("en");
    });

    test("should detect Polish for text with mixed clues but more Polish", () => {
      const mixedText = "Mix słów 'the' oraz polskich jak 'więcej' i 'przykład'.";
      expect(detectLanguage(mixedText)).toBe("pl");
    });

    test("should handle empty string (defaults to English)", () => {
      expect(detectLanguage("")).toBe("en");
    });
  });

  // --- Tests for generateMockFlashcards ---
  describe("generateMockFlashcards", () => {
    test("should generate 5 mock flashcards with correct structure and content", () => {
      const inputText = "This is input text.";
      const result = generateMockFlashcards(inputText);
      // Use the same split logic as the function itself
      const wordCount = inputText.split(/\s+/).length;

      expect(result.flashcards).toHaveLength(5);
      expect(result.model).toBe("mock-model-for-development");
      result.flashcards.forEach((card, index) => {
        expect(card).toHaveProperty("front");
        expect(card).toHaveProperty("back");
        expect(card).toHaveProperty("source", "ai-full");
        expect(card.front).toBe(`Mock Flashcard ${index + 1} Front (from text with ${wordCount} words)`);
        expect(card.back).toBe(`Mock Answer ${index + 1} with details based on the provided content.`);
        // Ensure generation_id is NOT present
        expect(card).not.toHaveProperty("generation_id");
      });
    });
  });

  // --- Refactored Tests for generateFlashcardsWithAI (using config object approach) ---
  describe("generateFlashcardsWithAI", () => {
    // Default config for most tests
    const defaultConfig: AIServiceConfig = {
      useMock: false,
      apiKey: "fake-key",
      siteUrl: "http://test.com",
    };

    // Test the mock path explicitly
    test.skip("should return mock flashcards when useMock is true", async () => {
      // Create a new implementation where we fully mock the module
      const mockGeneratedData = {
        flashcards: [{ front: "Mock Front", back: "Mock Back", source: "ai-full" as FlashcardSourceType }],
        model: "mock-model-for-development",
      };

      // Use spyOn instead of direct reassignment
      const mockGenMockCards = vi.spyOn(aiService, "generateMockFlashcards").mockReturnValue(mockGeneratedData);

      // Arrange
      const sampleText = "Sample for mock";
      const mockConfig: AIServiceConfig = {
        ...defaultConfig,
        useMock: true,
      };

      try {
        // Act
        const result = await aiService.generateFlashcardsWithAI(sampleText, undefined, mockConfig);

        // Assert
        expect(mockGenMockCards).toHaveBeenCalledWith(sampleText);
        expect(result).toEqual(mockGeneratedData);
      } finally {
        // Restore spy
        mockGenMockCards.mockRestore();
      }
    });

    test("should throw error when API key is missing and mock is false", async () => {
      // Arrange
      const sampleText = "This is a sample text";
      const configWithoutKey: AIServiceConfig = {
        ...defaultConfig,
        apiKey: "",
      };

      // Act & Assert
      await expect(aiService.generateFlashcardsWithAI(sampleText, undefined, configWithoutKey)).rejects.toThrow(
        "OPENROUTER_API_KEY is not set"
      );
    });

    test.skip("should call detectLanguage when language is not provided", async () => {
      // Spy on detectLanguage instead of reassigning
      const detectLanguageSpy = vi.spyOn(aiService, "detectLanguage").mockReturnValue("pl");

      // Arrange
      const sampleText = "Tekst do detekcji";

      try {
        // Act
        await aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig);

        // Assert
        expect(detectLanguageSpy).toHaveBeenCalledWith(sampleText);
      } finally {
        // Restore spy
        detectLanguageSpy.mockRestore();
      }
    });

    test("should use provided language instead of detecting", async () => {
      // Arrange
      const sampleText = "Some text";
      const providedLanguage = "en";

      // Spy on detectLanguage to verify it's not called
      const detectLanguageSpy = vi.spyOn(aiService, "detectLanguage");

      try {
        // Act
        await aiService.generateFlashcardsWithAI(sampleText, providedLanguage, defaultConfig);

        // Assert
        expect(detectLanguageSpy).not.toHaveBeenCalled();
        // Check if fetch was called with the correct prompt for 'en'
        expect(mockFetch).toHaveBeenCalled();
        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.messages[0].content).toContain("Your task is to generate 5 flashcards");
        expect(requestBody.messages[0].content).toContain("must be in ENGLISH");
      } finally {
        // Restore spy
        detectLanguageSpy.mockRestore();
      }
    });

    test("should make correct API call with Polish prompt when language is 'pl'", async () => {
      // Arrange
      const sampleText = "Polski tekst";
      const language = "pl";

      // Act
      await aiService.generateFlashcardsWithAI(sampleText, language, defaultConfig);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer fake-key`,
            "HTTP-Referer": "http://test.com",
          },
          body:
            expect.stringContaining('"model":"meta-llama/llama-4-scout:free"') &&
            expect.stringContaining('"role":"system"') &&
            expect.stringContaining("języku POLSKIM") && // Check for Polish instruction
            expect.stringContaining('"role":"user"') &&
            expect.stringContaining(sampleText) &&
            expect.stringContaining('"type":"json_schema"'), // Check for response_format
        })
      );
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain("muszą być w języku POLSKIM");
      expect(requestBody.messages[1].content).toBe(sampleText);
    });

    test("should make correct API call with English prompt when language is 'en'", async () => {
      // Arrange
      const sampleText = "English text";
      const language = "en";

      // Act
      await aiService.generateFlashcardsWithAI(sampleText, language, defaultConfig);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer fake-key`,
            "HTTP-Referer": "http://test.com",
          },
          body:
            expect.stringContaining('"model":"meta-llama/llama-4-scout:free"') &&
            expect.stringContaining('"role":"system"') &&
            expect.stringContaining("must be in ENGLISH") && // Check for English instruction
            expect.stringContaining('"role":"user"') &&
            expect.stringContaining(sampleText) &&
            expect.stringContaining('"type":"json_schema"'),
        })
      );
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain("must be in ENGLISH");
      expect(requestBody.messages[1].content).toBe(sampleText);
    });

    test("should parse valid JSON array from API response", async () => {
      // Arrange
      const sampleText = "Text for valid JSON";
      const apiJsonResponse = [
        { front: "Q1", back: "A1", hint: "H1", difficulty: "easy", tags: ["t1"] },
        { front: "Q2", back: "A2", hint: "H2", difficulty: "medium", tags: ["t2"] },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(apiJsonResponse) } }],
            model: "parsed-model",
          }),
        text: () => Promise.resolve(JSON.stringify(apiJsonResponse)),
        status: 200,
        statusText: "OK",
      });

      // Act
      const result = await aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig);

      // Assert
      expect(result.flashcards).toHaveLength(2);
      expect(result.model).toBe("parsed-model");
      expect(result.flashcards[0]).toEqual({ front: "Q1", back: "A1", source: "ai-full" });
      expect(result.flashcards[1]).toEqual({ front: "Q2", back: "A2", source: "ai-full" });
    });

    test("should extract and parse JSON array even with surrounding text", async () => {
      // Arrange
      const sampleText = "Text for JSON extraction";
      const apiJsonResponse = [{ front: "ExtractQ", back: "ExtractA", hint: "H", difficulty: "hard", tags: [] }];
      const responseContent = `Here is the JSON you requested:\n\`\`\`json\n${JSON.stringify(apiJsonResponse)}\n\`\`\`\nLet me know if you need more.`;

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: responseContent } }], model: "extracted-model" }),
        text: () => Promise.resolve(responseContent),
        status: 200,
        statusText: "OK",
      });

      // Act
      const result = await aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig);

      // Assert
      expect(result.flashcards).toHaveLength(1);
      expect(result.model).toBe("extracted-model");
      expect(result.flashcards[0]).toEqual({ front: "ExtractQ", back: "ExtractA", source: "ai-full" });
    });

    test("should handle HTTP errors from the API", async () => {
      // Arrange
      const sampleText = "Text for HTTP error";
      const errorResponseText = "Invalid API Key provided.";
      mockFetch.mockResolvedValue({
        ok: false, // Simulate HTTP error
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(errorResponseText), // Mock text() for error reporting
        json: () => Promise.reject(new Error("Should not call json on error")), // Should not be called
      });

      // Act & Assert
      await expect(aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig)).rejects.toThrow(
        `HTTP error: 401 Unauthorized - ${errorResponseText}`
      );
    });

    test("should throw error for invalid JSON in API response content", async () => {
      // Arrange
      const sampleText = "Text for invalid JSON";
      const invalidJsonResponse = "This is not JSON, but looks like [ { invalid structure ";
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ choices: [{ message: { content: invalidJsonResponse } }], model: "invalid-json-model" }),
        text: () => Promise.resolve(invalidJsonResponse),
        status: 200,
        statusText: "OK",
      });

      // Act & Assert
      // The error message might vary depending on the exact parsing failure point
      await expect(aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig)).rejects.toThrow(
        /No JSON object found in response|Failed to parse JSON/
      );
    });

    test("should throw error when API response content is missing", async () => {
      // Arrange
      const sampleText = "Text for missing content";
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  /* no content */
                },
              },
            ],
            model: "missing-content-model",
          }),
        text: () => Promise.resolve("Response without content"),
        status: 200,
        statusText: "OK",
      });

      // Act & Assert
      await expect(aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig)).rejects.toThrow(
        "Brak zawartości w odpowiedzi AI"
      );
    });

    test("should throw error when choices array is missing or empty", async () => {
      // Arrange
      const sampleText = "Text for missing choices";
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [], model: "no-choices-model" }), // Empty choices
        text: () => Promise.resolve("Response with empty choices"),
        status: 200,
        statusText: "OK",
      });

      // Act & Assert
      await expect(aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig)).rejects.toThrow(
        "Brak zawartości w odpowiedzi AI"
      );
    });

    test("should handle fetch network errors", async () => {
      // Arrange
      const sampleText = "Text for network error";
      const networkError = new Error("Network connection failed");
      mockFetch.mockRejectedValue(networkError); // Simulate fetch throwing an error

      // Act & Assert
      await expect(aiService.generateFlashcardsWithAI(sampleText, undefined, defaultConfig)).rejects.toThrow(
        "Network connection failed"
      );
    });
  });
});
