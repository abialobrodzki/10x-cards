import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import * as generationService from "../../../lib/services/generation.service";
import * as aiService from "../../../lib/services/ai.service";
import * as flashcardService from "../../../lib/services/flashcard.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import type { CreateFlashcardDto, FlashcardDto, FlashcardSourceType } from "../../../types";

// Mock dependent services
vi.mock("../../../lib/services/ai.service", () => ({
  generateFlashcardsWithAI: vi.fn(),
}));

vi.mock("../../../lib/services/flashcard.service", () => ({
  createFlashcardsService: vi.fn(),
}));

// Mock crypto properly with default export
vi.mock("crypto", () => {
  // Create createHash function to be exposed both as a property and as part of default export
  const createHashFn = vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => "mocked-hash"),
    })),
  }));

  // Return both the named export and the default export
  return {
    createHash: createHashFn,
    default: {
      createHash: createHashFn,
    },
  };
});

// Define a mock type that matches the shape of our usage
type MockSupabaseClient = {
  from: Mock;
  insert: Mock;
  update: Mock;
  eq: Mock;
  select: Mock;
  single: Mock;
  mockReturnThis: () => MockSupabaseClient;
  mockResolvedValue: (value: Record<string, unknown>) => MockSupabaseClient;
  mockResolvedValueOnce: (value: Record<string, unknown>) => MockSupabaseClient;
} & SupabaseClient<Database>;

describe("generation.service", () => {
  // Create mock Supabase client with typed structure
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    mockReturnThis: function () {
      return this;
    },
    mockResolvedValue: function (value: Record<string, unknown>) {
      (this as Record<string, Mock>).single.mockResolvedValue(value);
      return this;
    },
    mockResolvedValueOnce: function (value: Record<string, unknown>) {
      (this as Record<string, Mock>).single.mockResolvedValueOnce(value);
      return this;
    },
  } as unknown as MockSupabaseClient;

  const mockUserId = "user-123";
  const mockText = "Sample text for generating flashcards";
  const mockLanguage = "en";

  // Mock data for testing
  const mockGenerationRecord = {
    id: 1,
    user_id: mockUserId,
    generated_count: 0,
    accepted_unedited_count: 0,
    accepted_edited_count: 0,
    source_text_hash: "mocked-hash",
    source_text_length: mockText.length,
    generation_duration: 0,
    model: "",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  };

  const mockUpdatedGenerationRecord = {
    ...mockGenerationRecord,
    generated_count: 3,
    model: "test-model",
    generation_duration: 1000,
  };

  const mockGeneratedFlashcards: Omit<CreateFlashcardDto, "generation_id">[] = [
    { front: "Question 1", back: "Answer 1", source: "ai-full" as FlashcardSourceType },
    { front: "Question 2", back: "Answer 2", source: "ai-full" as FlashcardSourceType },
    { front: "Question 3", back: "Answer 3", source: "ai-full" as FlashcardSourceType },
  ];

  const mockInsertedFlashcards: FlashcardDto[] = [
    {
      id: 1,
      front: "Question 1",
      back: "Answer 1",
      source: "ai-full" as FlashcardSourceType,
      generation_id: 1,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      front: "Question 2",
      back: "Answer 2",
      source: "ai-full" as FlashcardSourceType,
      generation_id: 1,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 3,
      front: "Question 3",
      back: "Answer 3",
      source: "ai-full" as FlashcardSourceType,
      generation_id: 1,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ];

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementations
    mockSupabase.from.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockResolvedValue({ data: mockGenerationRecord, error: null });

    // Mock AI service response
    vi.mocked(aiService.generateFlashcardsWithAI).mockResolvedValue({
      flashcards: mockGeneratedFlashcards,
      model: "test-model",
    });

    // Mock flashcard service response
    vi.mocked(flashcardService.createFlashcardsService).mockResolvedValue(mockInsertedFlashcards);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateFlashcards", () => {
    test("should successfully generate flashcards", async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGenerationRecord, error: null }) // First call - create generation
        .mockResolvedValueOnce({ data: mockUpdatedGenerationRecord, error: null }); // Second call - update generation

      // Act
      const result = await generationService.generateFlashcards(mockSupabase, mockUserId, mockText, mockLanguage);

      // Assert
      // Verify generation record was created
      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          generated_count: 0,
          accepted_unedited_count: 0,
          accepted_edited_count: 0,
          source_text_hash: "mocked-hash",
          source_text_length: mockText.length,
          generation_duration: 0,
          model: "",
        })
      );

      // Verify AI service was called
      expect(aiService.generateFlashcardsWithAI).toHaveBeenCalledWith(mockText, mockLanguage);

      // Verify generation record was updated
      expect(mockSupabase.update).toHaveBeenCalledWith({
        generated_count: mockGeneratedFlashcards.length,
        model: "test-model",
        generation_duration: expect.any(Number),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", mockGenerationRecord.id);

      // Verify flashcards were created
      expect(flashcardService.createFlashcardsService).toHaveBeenCalledWith(mockSupabase, mockUserId, {
        flashcards: mockGeneratedFlashcards.map((card) => ({
          ...card,
          generation_id: mockUpdatedGenerationRecord.id,
        })),
      });

      // Verify result structure
      expect(result).toEqual({
        generation: {
          id: mockUpdatedGenerationRecord.id,
          generated_count: mockUpdatedGenerationRecord.generated_count,
          accepted_unedited_count: mockUpdatedGenerationRecord.accepted_unedited_count,
          accepted_edited_count: mockUpdatedGenerationRecord.accepted_edited_count,
          created_at: mockUpdatedGenerationRecord.created_at,
          updated_at: mockUpdatedGenerationRecord.updated_at,
          model: mockUpdatedGenerationRecord.model,
        },
        flashcards: mockGeneratedFlashcards,
      });
    });

    test("should throw error when creation of generation record fails", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "DB error" },
      });

      // Act & Assert
      await expect(generationService.generateFlashcards(mockSupabase, mockUserId, mockText)).rejects.toThrow(
        "Failed to create generation record"
      );
    });

    test("should throw session expired error when JWT token expired during creation", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST301",
          message: "JWT expired",
        },
      });

      // Act & Assert
      await expect(generationService.generateFlashcards(mockSupabase, mockUserId, mockText)).rejects.toThrow(
        "Sesja wygasła. Zaloguj się ponownie."
      );
    });

    test("should throw error when updating generation record fails", async () => {
      // Arrange
      // First call (create) succeeds
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGenerationRecord, error: null })
        // Second call (update) fails
        .mockResolvedValueOnce({ data: null, error: { message: "Update failed" } });

      // Mock AI service to succeed
      vi.mocked(aiService.generateFlashcardsWithAI).mockResolvedValue({
        flashcards: mockGeneratedFlashcards,
        model: "test-model",
      });

      // Act & Assert
      await expect(generationService.generateFlashcards(mockSupabase, mockUserId, mockText)).rejects.toThrow(
        "Failed to update generation record"
      );
    });

    test("should throw session expired error when JWT token expired during update", async () => {
      // Arrange
      // First call (create) succeeds
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGenerationRecord, error: null })
        // Second call (update) fails with JWT expired
        .mockResolvedValueOnce({
          data: null,
          error: {
            code: "PGRST301",
            message: "JWT expired",
          },
        });

      // Act & Assert
      await expect(generationService.generateFlashcards(mockSupabase, mockUserId, mockText)).rejects.toThrow(
        "Sesja wygasła. Zaloguj się ponownie."
      );
    });

    test("should throw error when AI service fails", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({ data: mockGenerationRecord, error: null });

      // Mock AI service to fail
      vi.mocked(aiService.generateFlashcardsWithAI).mockRejectedValue(new Error("AI service error"));

      // Mock error logging
      mockSupabase.insert.mockReturnThis();

      // Act & Assert
      await expect(generationService.generateFlashcards(mockSupabase, mockUserId, mockText)).rejects.toThrow(
        "AI service error"
      );

      // Verify error was logged
      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
    });

    test("should handle error during flashcard creation", async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGenerationRecord, error: null })
        .mockResolvedValueOnce({ data: mockUpdatedGenerationRecord, error: null });

      // Mock flashcard service to fail
      vi.mocked(flashcardService.createFlashcardsService).mockRejectedValue(new Error("Flashcard creation failed"));

      // Act & Assert
      await expect(generationService.generateFlashcards(mockSupabase, mockUserId, mockText)).rejects.toThrow(
        "Flashcard creation failed"
      );

      // Verify error was logged
      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
    });

    test("should use the correct hash for source text", async () => {
      // Act
      await generationService.generateFlashcards(mockSupabase, mockUserId, mockText);

      // Assert
      // Get the mocked implementation of crypto
      const mockedCrypto = await import("crypto");
      // Check that createHash was called with "md5"
      expect(mockedCrypto.default.createHash).toHaveBeenCalledWith("md5");
    });

    test("should handle undefined language parameter", async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGenerationRecord, error: null })
        .mockResolvedValueOnce({ data: mockUpdatedGenerationRecord, error: null });

      // Act
      await generationService.generateFlashcards(mockSupabase, mockUserId, mockText);

      // Assert
      // Verify AI service was called without language parameter
      expect(aiService.generateFlashcardsWithAI).toHaveBeenCalledWith(mockText, undefined);
    });
  });
});
