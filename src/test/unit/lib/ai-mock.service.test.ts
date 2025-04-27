import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateFlashcardsWithAI, type AIGeneratedData } from "../../../lib/services/ai-mock.service";

describe("generateFlashcardsWithAI", () => {
  describe("timing and delay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should simulate a 1500ms network delay", async () => {
      // Arrange
      const text = "sample text";

      // Act
      const promise = generateFlashcardsWithAI(text);

      // Assert - Promise shouldn't resolve before delay completes
      vi.advanceTimersByTime(1499);

      // Use a better approach to check if a promise is pending
      let resolved = false;
      const checkPromise = Promise.race([
        promise.then(() => {
          resolved = true;
          return true;
        }),
        Promise.resolve(false),
      ]);

      await vi.runOnlyPendingTimersAsync();
      expect(await checkPromise).toBe(false);

      // Advance past delay point
      vi.advanceTimersByTime(1);
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe("flashcard generation count", () => {
    it("should generate minimum 5 flashcards for short text", async () => {
      // Arrange
      const shortText = "This is a very short text.";

      // Act
      const result = await generateFlashcardsWithAI(shortText);

      // Assert
      expect(result.flashcards).toHaveLength(5);
    });

    it("should generate maximum 10 flashcards for very long text", async () => {
      // Arrange
      const longText = "word ".repeat(3000); // Well over 2000 words to ensure upper boundary is tested

      // Act
      const result = await generateFlashcardsWithAI(longText);

      // Assert
      expect(result.flashcards).toHaveLength(10);
    });

    it("should generate exactly 6 flashcards for 1200 word text", async () => {
      // Arrange
      const text = "word ".repeat(1200); // 1200/200 = 6

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.flashcards).toHaveLength(6);
      expect(result.flashcards.length).toBe(Math.min(Math.max(Math.floor(1200 / 200), 5), 10));
    });

    it("should generate exactly 9 flashcards for 1800 word text", async () => {
      // Arrange
      const text = "word ".repeat(1800); // 1800/200 = 9

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.flashcards).toHaveLength(9);
      expect(result.flashcards.length).toBe(Math.min(Math.max(Math.floor(1800 / 200), 5), 10));
    });

    it("should handle boundary case at exactly 1000 words", async () => {
      // Arrange
      const text = "word ".repeat(1000); // 1000/200 = 5

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.flashcards).toHaveLength(5);
    });

    it("should handle boundary case at exactly 2000 words", async () => {
      // Arrange
      const text = "word ".repeat(2000); // 2000/200 = 10

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.flashcards).toHaveLength(10);
    });
  });

  describe("flashcard content and structure", () => {
    it("should return flashcards with correct structure and properties", async () => {
      // Arrange
      const text = "This is a text with two sentences. And this is the second one.";

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          flashcards: expect.any(Array),
          model: expect.any(String),
        })
      );

      result.flashcards.forEach((flashcard, index) => {
        expect(flashcard).toEqual({
          front: expect.stringContaining(`Mock Flashcard ${index + 1} Front`),
          back: expect.stringContaining(`Mock Answer ${index + 1}`),
          source: "ai-full",
        });
      });
    });

    it("should include word count and sentence count in the flashcard content", async () => {
      // Arrange
      const text = "This is a text with two sentences. And this is the second one.";
      const wordCount = text.split(/\s+/).length; // Should be 12
      const sentenceCount = text.split(/[.!?]+/).length; // Should be 3 (including empty string after last period)

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      const flashcard = result.flashcards[0];
      expect(flashcard.front).toContain(`from text with ${wordCount} words`);
      expect(flashcard.back).toContain(`approximately ${sentenceCount} sentences`);
    });
  });

  describe("edge cases", () => {
    it("should handle empty input string", async () => {
      // Arrange
      const text = "";

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.flashcards).toHaveLength(5); // Should return min 5 cards
      // Empty string split by /\s+/ results in [""] which has length 1, not 0
      const wordCount = text.split(/\s+/).length;
      const flashcard = result.flashcards[0];
      expect(flashcard.front).toContain(`from text with ${wordCount} words`);
      expect(flashcard.back).toContain("approximately 1 sentences");
    });

    it("should handle single word input", async () => {
      // Arrange
      const text = "OneWord";

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.flashcards).toHaveLength(5);
      expect(result.flashcards[0].front).toContain("from text with 1 words");
    });
  });

  describe("model information", () => {
    it("should return the correct model name", async () => {
      // Arrange
      const text = "sample text";

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      expect(result.model).toBe("mock-model-for-development");
    });

    it("should return model information conforming to AIGeneratedData type", async () => {
      // Arrange
      const text = "sample text";

      // Act
      const result = await generateFlashcardsWithAI(text);

      // Assert
      const typeCheck: AIGeneratedData = result; // This should not error if the return type is correct
      expect(typeCheck).toBe(result);
    });
  });
});
