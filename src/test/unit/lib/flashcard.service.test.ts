import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import * as flashcardService from "../../../lib/services/flashcard.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import type {
  FlashcardDto,
  FlashcardFilterParams,
  CreateFlashcardDto,
  UpdateFlashcardDto,
  FlashcardSourceType,
} from "../../../types";

// Define a more flexible mock type
interface MockQueryBuilder {
  select: Mock;
  eq: Mock;
  or: Mock;
  range: Mock;
  order: Mock;
  delete: Mock;
  insert: Mock;
  update: Mock;
  filter: Mock;
  maybeSingle: Mock;
  single: Mock;
  then: Mock; // Add then for promise-like behavior
}

type MockSupabaseClient = {
  // Correct way: Define the function signature within Mock's single generic argument
  from: Mock<(table: string) => MockQueryBuilder>;
} & SupabaseClient<Database>; // Extend the actual type for better type safety

describe("flashcard.service", () => {
  // Create a more robust mock Supabase client
  let mockQueryBuilder: MockQueryBuilder;
  let mockSupabase: MockSupabaseClient;

  const mockUserId = "user-123";

  // Sample flashcard data for testing
  const mockFlashcards: FlashcardDto[] = [
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
      source: "ai-edited" as FlashcardSourceType,
      generation_id: 1,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 3,
      front: "Question 3",
      back: "Answer 3",
      source: "manual" as FlashcardSourceType,
      generation_id: null,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ];

  // Mock filter params
  const mockFilterParams: FlashcardFilterParams = {
    page: 1,
    page_size: 20,
    sortBy: "created_at",
    sortOrder: "desc",
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();

    // Create a fresh mock query builder for each test
    mockQueryBuilder = {
      select: vi.fn(() => mockQueryBuilder),
      eq: vi.fn(() => mockQueryBuilder),
      or: vi.fn(() => mockQueryBuilder),
      range: vi.fn(() => mockQueryBuilder),
      order: vi.fn(() => mockQueryBuilder),
      delete: vi.fn(() => mockQueryBuilder),
      insert: vi.fn(() => mockQueryBuilder),
      update: vi.fn(() => mockQueryBuilder),
      filter: vi.fn(() => mockQueryBuilder),
      maybeSingle: vi.fn(() => mockQueryBuilder),
      single: vi.fn(() => mockQueryBuilder),
      // Mock the 'then' method to resolve promises
      then: vi.fn((resolve) => resolve({ data: null, error: null, count: null })),
    };

    // Create mock Supabase client that returns the query builder
    mockSupabase = {
      from: vi.fn(() => mockQueryBuilder),
    } as unknown as MockSupabaseClient;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getFlashcardsService", () => {
    test("should retrieve paginated flashcards with default parameters", async () => {
      // Arrange
      // Mock the final promise resolution for the query chain
      mockQueryBuilder.then.mockImplementationOnce((resolve) =>
        resolve({
          data: mockFlashcards,
          count: mockFlashcards.length,
          error: null,
        })
      );

      // Act
      const result = await flashcardService.getFlashcardsService(mockSupabase, mockUserId, mockFilterParams);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, front, back, source, created_at, updated_at, generation_id",
        { count: "exact" }
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 19); // (page-1)*pageSize to from+(pageSize-1)
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });

      expect(result).toEqual({
        flashcards: mockFlashcards,
        total: mockFlashcards.length,
      });
    });

    test("should apply generation_id filter when provided", async () => {
      // Arrange
      const paramsWithGenerationId: FlashcardFilterParams = {
        ...mockFilterParams,
        generationId: 1,
      };
      const filteredData = mockFlashcards.filter((f) => f.generation_id === 1);
      mockQueryBuilder.then.mockImplementationOnce((resolve) =>
        resolve({ data: filteredData, count: filteredData.length, error: null })
      );

      // Act
      const result = await flashcardService.getFlashcardsService(mockSupabase, mockUserId, paramsWithGenerationId);

      // Assert
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("generation_id", 1);
      expect(result.flashcards.length).toBe(filteredData.length);
      expect(result.total).toBe(filteredData.length);
    });

    test("should apply source filter when provided", async () => {
      // Arrange
      const paramsWithSource: FlashcardFilterParams = {
        ...mockFilterParams,
        source: "manual" as FlashcardSourceType,
      };
      const filteredData = mockFlashcards.filter((f) => f.source === "manual");
      mockQueryBuilder.then.mockImplementationOnce((resolve) =>
        resolve({ data: filteredData, count: filteredData.length, error: null })
      );

      // Act
      const result = await flashcardService.getFlashcardsService(mockSupabase, mockUserId, paramsWithSource);

      // Assert
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("source", "manual");
      expect(result.flashcards.length).toBe(filteredData.length);
      expect(result.total).toBe(filteredData.length);
    });

    test("should apply text search filter when provided", async () => {
      // Arrange
      const paramsWithSearch: FlashcardFilterParams = {
        ...mockFilterParams,
        searchText: "Question",
      };
      mockQueryBuilder.then.mockImplementationOnce((resolve) =>
        resolve({
          data: mockFlashcards,
          count: mockFlashcards.length,
          error: null,
        })
      );

      // Act
      await flashcardService.getFlashcardsService(mockSupabase, mockUserId, paramsWithSearch);

      // Assert
      expect(mockQueryBuilder.or).toHaveBeenCalledWith("front.ilike.%Question%,back.ilike.%Question%");
    });

    test("should handle database errors", async () => {
      // Arrange
      mockQueryBuilder.then.mockImplementationOnce((resolve) =>
        resolve({ data: null, count: null, error: { message: "Database error" } })
      );

      // Act & Assert
      await expect(flashcardService.getFlashcardsService(mockSupabase, mockUserId, mockFilterParams)).rejects.toEqual({
        message: "Database error",
      });
    });
  });

  describe("getFlashcardByIdService", () => {
    test("should retrieve a flashcard by ID", async () => {
      // Arrange
      const mockFlashcard = mockFlashcards[0];
      mockQueryBuilder.single.mockResolvedValue({ data: mockFlashcard, error: null });

      // Act
      const result = await flashcardService.getFlashcardByIdService(mockSupabase, mockUserId, mockFlashcard.id);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, front, back, source, created_at, updated_at, generation_id"
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", mockFlashcard.id);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockFlashcard);
    });

    test("should return null when flashcard not found", async () => {
      // Arrange
      const nonExistentId = 999;
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } });

      // Act
      const result = await flashcardService.getFlashcardByIdService(mockSupabase, mockUserId, nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    test("should throw error for database errors other than not found", async () => {
      // Arrange
      const mockError = { code: "OTHER_ERROR", message: "Database error" };
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(flashcardService.getFlashcardByIdService(mockSupabase, mockUserId, 1)).rejects.toEqual(mockError);
    });
  });

  describe("updateFlashcardService", () => {
    test("should update a flashcard successfully", async () => {
      // Arrange
      const flashcardId = 1;
      const updateData: UpdateFlashcardDto = {
        front: "Updated Question",
        back: "Updated Answer",
      };

      const updatedFlashcard = {
        ...mockFlashcards[0],
        ...updateData,
      };

      // Mock existing flashcard check
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: flashcardId },
        error: null,
      });

      // Mock update operation
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      // Act
      const result = await flashcardService.updateFlashcardService(mockSupabase, mockUserId, flashcardId, updateData);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      // First call for exists check
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", flashcardId);
      expect(mockQueryBuilder.maybeSingle).toHaveBeenCalledTimes(1);

      // Second call for update
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", flashcardId);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, front, back, source, created_at, updated_at, generation_id"
      );
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedFlashcard);
    });

    test("should return null when flashcard to update doesn't exist", async () => {
      // Arrange
      const nonExistentId = 999;
      const updateData: UpdateFlashcardDto = {
        front: "Updated Question",
        back: "Updated Answer",
      };

      // Mock existing flashcard check - not found
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      // Act
      const result = await flashcardService.updateFlashcardService(mockSupabase, mockUserId, nonExistentId, updateData);

      // Assert
      expect(result).toBeNull();
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });

    test("should throw error when update operation fails", async () => {
      // Arrange
      const flashcardId = 1;
      const updateData: UpdateFlashcardDto = {
        front: "Updated Question",
        back: "Updated Answer",
      };

      // Mock existing flashcard check
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: flashcardId },
        error: null,
      });

      // Mock update operation - fails
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Update error" },
      });

      // Act & Assert
      await expect(
        flashcardService.updateFlashcardService(mockSupabase, mockUserId, flashcardId, updateData)
      ).rejects.toEqual({ message: "Update error" });
    });
  });

  describe("deleteFlashcardService", () => {
    test("should delete a flashcard successfully", async () => {
      // Arrange
      const flashcardId = 1;

      // Mock existing flashcard check
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: flashcardId },
        error: null,
      });

      // Mock delete operation
      // For delete, the promise resolves directly from the builder
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: null }));

      // Act
      const result = await flashcardService.deleteFlashcardService(mockSupabase, mockUserId, flashcardId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      // First call for exists check
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", flashcardId);
      expect(mockQueryBuilder.maybeSingle).toHaveBeenCalledTimes(1);

      // Second call for delete
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", flashcardId);
      expect(result).toBe(true);
    });

    test("should return false when flashcard to delete doesn't exist", async () => {
      // Arrange
      const nonExistentId = 999;

      // Mock existing flashcard check - not found
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      // Act
      const result = await flashcardService.deleteFlashcardService(mockSupabase, mockUserId, nonExistentId);

      // Assert
      expect(result).toBe(false);
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled();
    });

    test("should handle special case for ID 404", async () => {
      // Arrange
      const specialId = 404;

      // Mock direct deletion for special case
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: null }));

      // Act
      const result = await flashcardService.deleteFlashcardService(mockSupabase, mockUserId, specialId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", 404); // Check the specific call
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId); // Check the other call
      expect(result).toBe(true);
    });

    test("should attempt alternative deletion methods for ID 404 when initial delete fails", async () => {
      // Arrange
      const specialId = 404;

      // Mock first attempt - fails
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: { message: "Delete error" } }));
      // Mock second attempt with filter - succeeds
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: null }));

      // Act
      const result = await flashcardService.deleteFlashcardService(mockSupabase, mockUserId, specialId);

      // Assert
      expect(mockQueryBuilder.filter).toHaveBeenCalledWith("id", "eq", 404);
      expect(mockQueryBuilder.filter).toHaveBeenCalledWith("user_id", "eq", mockUserId);
      expect(result).toBe(true);
    });

    test("should throw error when delete operation fails", async () => {
      // Arrange
      const flashcardId = 1;
      const mockError = { message: "Delete error" };

      // Mock existing flashcard check
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: flashcardId },
        error: null,
      });

      // Mock delete operation - fails
      mockQueryBuilder.then.mockImplementationOnce((resolve, reject) => reject(mockError));

      // Act & Assert
      await expect(flashcardService.deleteFlashcardService(mockSupabase, mockUserId, flashcardId)).rejects.toEqual(
        mockError
      );
    });
  });

  describe("createFlashcardService", () => {
    test("should create a flashcard successfully", async () => {
      // Arrange
      const newFlashcard: CreateFlashcardDto = {
        front: "New Question",
        back: "New Answer",
        source: "manual" as FlashcardSourceType,
        generation_id: null,
      };

      const createdFlashcard: FlashcardDto = {
        id: 4,
        front: newFlashcard.front,
        back: newFlashcard.back,
        source: newFlashcard.source,
        generation_id: newFlashcard.generation_id ?? null,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      };

      // Mock check for duplicates - not found (if generation_id is null, maybeSingle won't be called)
      // mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      // Mock insert operation
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: createdFlashcard,
        error: null,
      });

      // Act
      const result = await flashcardService.createFlashcardService(mockSupabase, mockUserId, newFlashcard);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        ...newFlashcard,
        user_id: mockUserId,
      });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, front, back, source, created_at, updated_at, generation_id"
      );
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdFlashcard);
    });

    test("should return existing flashcard if duplicate is found", async () => {
      // Arrange
      const flashcardData: CreateFlashcardDto = {
        front: "Existing Question",
        back: "Existing Answer",
        source: "ai-full" as FlashcardSourceType,
        generation_id: 1,
      };

      const existingFlashcard: FlashcardDto = {
        id: 1,
        front: flashcardData.front,
        back: flashcardData.back,
        source: flashcardData.source,
        generation_id: flashcardData.generation_id ?? null,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      };

      // Mock check for duplicates - found
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Act
      const result = await flashcardService.createFlashcardService(mockSupabase, mockUserId, flashcardData);

      // Assert
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, front, back, source, created_at, updated_at, generation_id"
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("generation_id", flashcardData.generation_id);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("front", flashcardData.front);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("back", flashcardData.back);
      expect(mockQueryBuilder.maybeSingle).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
      expect(result).toEqual(existingFlashcard);
    });

    test("should throw error when insert operation fails", async () => {
      // Arrange
      const newFlashcard: CreateFlashcardDto = {
        front: "New Question",
        back: "New Answer",
        source: "manual" as FlashcardSourceType,
        generation_id: null,
      };

      // Mock check for duplicates - not found (if generation_id is null, maybeSingle won't be called)

      // Mock insert operation - fails
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert error" },
      });

      // Act & Assert
      await expect(flashcardService.createFlashcardService(mockSupabase, mockUserId, newFlashcard)).rejects.toEqual({
        message: "Insert error",
      });
    });
  });

  describe("createFlashcardsService", () => {
    test("should create multiple flashcards successfully", async () => {
      // Arrange
      const newFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question 1",
          back: "New Answer 1",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 2,
        },
        {
          front: "New Question 2",
          back: "New Answer 2",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 2,
        },
      ];

      const createdFlashcards: FlashcardDto[] = newFlashcards.map((card, index) => ({
        id: 10 + index,
        front: card.front,
        back: card.back,
        source: card.source,
        generation_id: card.generation_id ?? null,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }));

      // Mock check for existing flashcards - not found
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: [], error: null }));

      // Mock insert operation
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: createdFlashcards, error: null }));

      // Act
      const result = await flashcardService.createFlashcardsService(mockSupabase, mockUserId, {
        flashcards: newFlashcards,
      });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "id, front, back, source, created_at, updated_at, generation_id"
      ); // Called for both check and final select
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("generation_id", 2);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        newFlashcards.map((card) => ({ ...card, user_id: mockUserId }))
      );
      expect(result).toEqual(createdFlashcards);
    });

    test("should replace existing flashcards when isSaveAll is true", async () => {
      // Arrange
      const newFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question 1",
          back: "New Answer 1",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
        },
        {
          front: "New Question 2",
          back: "New Answer 2",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
        },
      ];

      const existingFlashcards: FlashcardDto[] = [
        {
          id: 1,
          front: "Old Question",
          back: "Old Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      const createdFlashcards: FlashcardDto[] = newFlashcards.map((card, index) => ({
        id: 10 + index,
        front: card.front,
        back: card.back,
        source: card.source,
        generation_id: card.generation_id ?? null,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }));

      // Mock check for existing flashcards - found
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: existingFlashcards, error: null }));

      // Mock delete operation
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: null }));

      // Mock insert operation
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: createdFlashcards, error: null }));

      // Act
      const result = await flashcardService.createFlashcardsService(
        mockSupabase,
        mockUserId,
        { flashcards: newFlashcards },
        true // isSaveAll = true
      );

      // Assert
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        newFlashcards.map((card) => ({ ...card, user_id: mockUserId }))
      );
      expect(result).toEqual(createdFlashcards);
    });

    test("should delete existing and insert selected flashcards when isSaveAll is false", async () => {
      // Arrange
      const selectedFlashcards: CreateFlashcardDto[] = [
        {
          front: "Selected Question",
          back: "Selected Answer",
          source: "ai-edited" as FlashcardSourceType,
          generation_id: 1,
        },
      ];

      const existingFlashcards: FlashcardDto[] = [
        {
          id: 1,
          front: "Old Question",
          back: "Old Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];

      const createdFlashcards: FlashcardDto[] = selectedFlashcards.map((card, index) => ({
        id: 10 + index,
        front: card.front,
        back: card.back,
        source: card.source,
        generation_id: card.generation_id ?? null,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      }));

      // Mock check for existing flashcards - found
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: existingFlashcards, error: null }));

      // Mock delete operation
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: null }));

      // Mock insert operation
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: createdFlashcards, error: null }));

      // Act
      const result = await flashcardService.createFlashcardsService(
        mockSupabase,
        mockUserId,
        { flashcards: selectedFlashcards },
        false // isSaveAll = false
      );

      // Assert
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        selectedFlashcards.map((card) => ({ ...card, user_id: mockUserId }))
      );
      expect(result).toEqual(createdFlashcards);
    });

    test("should return empty array when generation_id is missing", async () => {
      // Arrange
      const invalidFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question",
          back: "New Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: null, // Missing generation_id
        },
      ];

      // Act
      const result = await flashcardService.createFlashcardsService(mockSupabase, mockUserId, {
        flashcards: invalidFlashcards,
      });

      // Assert
      expect(result).toEqual([]);
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    test("should throw error when database check operations fail", async () => {
      // Arrange
      const newFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question",
          back: "New Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 2,
        },
      ];
      const mockError = { message: "Database error" };

      // Mock check for existing flashcards - fails
      mockQueryBuilder.then.mockImplementationOnce((resolve, reject) => reject(mockError));

      // Act & Assert
      await expect(
        flashcardService.createFlashcardsService(mockSupabase, mockUserId, { flashcards: newFlashcards })
      ).rejects.toEqual(mockError);
    });

    test("should throw error when database insert operation fails", async () => {
      // Arrange
      const newFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question",
          back: "New Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 2,
        },
      ];
      const mockError = { message: "Insert Database error" };

      // Mock check for existing flashcards - succeeds
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: [], error: null }));

      // Mock insert operation - fails
      mockQueryBuilder.then.mockImplementationOnce((resolve, reject) => reject(mockError));

      // Act & Assert
      await expect(
        flashcardService.createFlashcardsService(mockSupabase, mockUserId, { flashcards: newFlashcards })
      ).rejects.toEqual(mockError);
    });

    test("should throw error when database delete operation fails in isSaveAll=true", async () => {
      // Arrange
      const newFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question",
          back: "New Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
        },
      ];
      const existingFlashcards: FlashcardDto[] = [
        {
          id: 1,
          front: "Old Question",
          back: "Old Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];
      const mockError = { message: "Delete Database error" };

      // Mock check for existing flashcards - found
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: existingFlashcards, error: null }));

      // Mock delete operation - fails
      mockQueryBuilder.then.mockImplementationOnce((resolve, reject) => reject(mockError));

      // Act & Assert
      await expect(
        flashcardService.createFlashcardsService(mockSupabase, mockUserId, { flashcards: newFlashcards }, true)
      ).rejects.toEqual(mockError);
    });

    test("should throw error when database insert operation fails in isSaveAll=true", async () => {
      // Arrange
      const newFlashcards: CreateFlashcardDto[] = [
        {
          front: "New Question",
          back: "New Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
        },
      ];
      const existingFlashcards: FlashcardDto[] = [
        {
          id: 1,
          front: "Old Question",
          back: "Old Answer",
          source: "ai-full" as FlashcardSourceType,
          generation_id: 1,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
      ];
      const mockError = { message: "Insert Database error" };

      // Mock check for existing flashcards - found
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ data: existingFlashcards, error: null }));

      // Mock delete operation - succeeds
      mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve({ error: null }));

      // Mock insert operation - fails
      mockQueryBuilder.then.mockImplementationOnce((resolve, reject) => reject(mockError));

      // Act & Assert
      await expect(
        flashcardService.createFlashcardsService(mockSupabase, mockUserId, { flashcards: newFlashcards }, true)
      ).rejects.toEqual(mockError);
    });
  });
});
