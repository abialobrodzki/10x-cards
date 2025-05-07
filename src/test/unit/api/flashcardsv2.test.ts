/**
 * @file Unit tests for the `/api/flashcards` endpoint (v2).
 * Tests the GET and POST methods of the flashcards API endpoint, covering various scenarios
 * including retrieving flashcards with filters and creating single or multiple flashcards.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "../../../pages/api/flashcards";
import * as flashcardService from "../../../lib/services/flashcard.service";

/**
 * Test suite for the Flashcards API endpoint (`/api/flashcards`).
 * Contains nested test suites for GET and POST handlers.
 */
describe("Flashcards API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test suite for the GET handler of the `/api/flashcards` endpoint.
   * Tests the logic for retrieving flashcards with different query parameters.
   */
  describe("GET handler", () => {
    /**
     * Test case: Should return status 200 and flashcards data on valid query parameters.
     * Verifies that the endpoint correctly calls the service with parsed query parameters
     * and returns the service's response with a 200 status.
     */
    it("should return 200 and flashcards on valid parameters", async () => {
      // Arrange
      const fakeResult = { flashcards: [{ id: 1, front: "Q", back: "A" }], total: 1 };
      vi.spyOn(flashcardService, "getFlashcardsService").mockResolvedValue(fakeResult as any);
      const url =
        "http://localhost/api/flashcards?page=2&page_size=5&sortBy=front&sortOrder=desc&generationId=10&source=ai-full&searchText=hello";
      const request = { url } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "user123" } } as any;
      // Act
      const response = await GET({ request, locals } as any);
      // Assert
      expect(flashcardService.getFlashcardsService).toHaveBeenCalledWith(locals.supabase, "user123", {
        page: 2,
        page_size: 5,
        sortBy: "front",
        sortOrder: "desc",
        generationId: 10,
        source: "ai-full",
        searchText: "hello",
      });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(fakeResult);
    });

    /**
     * Test case: Should return status 401 when the user is missing from `locals`.
     * Ensures that access is denied if authentication information is not present.
     */
    it("should return 401 when user is missing (no fallback)", async () => {
      // Spy on service to ensure it's not called
      const spyGet = vi.spyOn(flashcardService, "getFlashcardsService");
      // Arrange: missing locals.user
      const url = "http://localhost/api/flashcards?sort_by=updated_at&sort_order=asc&generation_id=15";
      const request = { url } as any;
      const locals = {} as any;
      // Act
      const response = await GET({ request, locals } as any);
      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
      expect(spyGet).not.toHaveBeenCalled();
    });

    /**
     * Test case: Should return status 400 on invalid query parameters when the user is present.
     * Verifies that the endpoint performs validation on query parameters.
     */
    it("should return 400 on invalid query parameters when user is present", async () => {
      // Arrange: valid user present
      const url = "http://localhost/api/flashcards?page=0&page_size=200";
      const request = { url } as any;
      const locals = { supabase: {} as unknown, user: { id: "user-999" } } as any;
      // Act
      const response = await GET({ request, locals } as any);
      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(
        `
        {
          "error": "Invalid query parameters",
        }
      `
      );
    });

    /**
     * Test case: Should return status 500 on a service error when the user is present.
     * Tests error handling when the underlying service fails.
     */
    it("should return 500 on service error when user is present", async () => {
      // Arrange: valid user present
      vi.spyOn(flashcardService, "getFlashcardsService").mockRejectedValue(new Error("fail"));
      const url = "http://localhost/api/flashcards";
      const request = { url } as any;
      const locals = { supabase: {} as unknown, user: { id: "user-123" } } as any;
      // Act
      const response = await GET({ request, locals } as any);
      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(`
        {
          "error": "Internal server error",
        }
      `);
    });
  });

  /**
   * Test suite for the POST handler of the `/api/flashcards` endpoint.
   * Tests the logic for creating single or multiple flashcards.
   */
  describe("POST handler", () => {
    /**
     * Test case: Should successfully create a single flashcard.
     * Verifies that the endpoint correctly processes a single flashcard object in the request body
     * and calls the service to create it.
     */
    it("should create a single flashcard", async () => {
      // Arrange
      const fakeCard = { id: 2, front: "Hello", back: "World", source: "manual", generation_id: null };
      vi.spyOn(flashcardService, "createFlashcardService").mockResolvedValue(fakeCard as any);
      const body = { front: "Hello", back: "World", source: "manual", generation_id: null };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "u1" } } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert
      expect(flashcardService.createFlashcardService).toHaveBeenCalledWith(
        locals.supabase,
        "u1",
        expect.objectContaining({ ...body, user_id: "u1" })
      );
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual(fakeCard);
    });

    /**
     * Test case: Should successfully create multiple flashcards.
     * Verifies that the endpoint correctly processes an array of flashcard objects
     * in the request body and calls the service to create them.
     */
    it("should create multiple flashcards", async () => {
      // Arrange
      const cardsDto = [{ front: "Abc", back: "Def", source: "ai-edited", generation_id: null }];
      const fakeCreated = { id: 1, ...cardsDto[0], user_id: "u2" };
      const spyCreate = vi.spyOn(flashcardService, "createFlashcardService").mockResolvedValueOnce(fakeCreated as any);
      const body = { flashcards: cardsDto };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "u2" } } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert single creation called
      expect(spyCreate).toHaveBeenCalledWith(
        locals.supabase,
        "u2",
        expect.objectContaining({ ...cardsDto[0], user_id: "u2" })
      );
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual([fakeCreated]);
    });

    /**
     * Test case: Should return status 400 on invalid single flashcard data in the request body.
     * Verifies input validation for a single flashcard creation.
     */
    it("should return 400 on invalid single flashcard", async () => {
      // Arrange
      const body = { front: "ab", back: "c", source: "manual" };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "u3" } } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(
        `
        {
          "error": "Invalid flashcard data",
        }
      `
      );
    });

    /**
     * Test case: Should return status 400 on invalid multiple flashcards data (e.g., empty array).
     * Verifies input validation for multiple flashcards creation.
     */
    it("should return 400 on invalid multiple flashcards", async () => {
      // Arrange
      const body = { flashcards: [] };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "u3" } } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(
        `
        {
          "error": "Invalid flashcards data",
        }
      `
      );
    });

    /**
     * Test case: Should return status 500 on a service error during flashcard creation.
     * Tests error handling when the underlying service fails during creation.
     */
    it("should return 500 on service error", async () => {
      // Arrange
      vi.spyOn(flashcardService, "createFlashcardService").mockRejectedValue(new Error("oops"));
      const body = { front: "Aaa", back: "Bbb", source: "manual" };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "u4" } } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(`
        {
          "error": "Internal server error",
        }
      `);
    });
  });
});
