/**
 * @file Unit tests for the `/api/flashcards` endpoint.
 * Tests the GET and POST methods of the flashcards API endpoint.
 * Covers scenarios for retrieving flashcards with different parameters
 * and creating single or multiple flashcards.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { APIContext } from "astro";

// Mock the Supabase client and default user ID to avoid missing environment variables
vi.mock("../../../db/supabase.client", () => ({
  DEFAULT_USER_ID: "default-user-id", // Mock DEFAULT_USER_ID for environments where it might be used
  supabaseClient: {}, // Provide a basic mock for supabaseClient
}));

// Mock the flashcard service module to control service behavior in tests
vi.mock("../../../lib/services/flashcard.service", () => ({
  getFlashcardsService: vi.fn(), // Mock the function for retrieving flashcards
  createFlashcardService: vi.fn(), // Mock the function for creating a single flashcard
  createFlashcardsService: vi.fn(), // Mock the function for creating multiple flashcards (Note: This mock is not actually used in the endpoint logic tested here, but is kept for completeness relative to the service module)
}));

import { getFlashcardsService, createFlashcardService } from "../../../lib/services/flashcard.service";
import { GET, POST } from "../../../pages/api/flashcards";

/**
 * Test suite for the Flashcards API endpoint (`/api/flashcards`).
 * Contains nested test suites for the GET and POST handlers.
 */
describe("Flashcards API", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test to ensure isolation
  });

  /**
   * Test suite for the GET handler of the `/api/flashcards` endpoint.
   * Focuses on retrieving flashcards with various valid and invalid query parameters.
   */
  describe("GET /api/flashcards", () => {
    /**
     * Test case: Returns status 200 and flashcards data when valid query parameters are provided.
     * Verifies that the endpoint correctly parses parameters and calls the service with them.
     */
    it("returns 200 and flashcards when params are valid", async () => {
      const mockResponse = { flashcards: [{ id: 1, front: "Q", back: "A" }], total: 1 };
      (getFlashcardsService as Mock).mockResolvedValue(mockResponse);

      const url =
        "http://localhost/api/flashcards?page=2&page_size=5&sortBy=front&sortOrder=desc&generationId=10&source=ai-full&searchText=test";
      const request = new Request(url);
      const locals = { supabase: { client: true }, user: { id: "user-123" } };

      const response = await GET({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(mockResponse);
      expect(getFlashcardsService).toHaveBeenCalledWith(
        locals.supabase,
        "user-123",
        expect.objectContaining({
          page: 2,
          page_size: 5,
          sortBy: "front",
          sortOrder: "desc",
          generationId: 10,
          source: "ai-full",
          searchText: "test",
        })
      );
    });

    /**
     * Test case: Returns status 500 when the Supabase client is missing from `locals`.
     * Ensures that a configuration error (missing client) is handled appropriately.
     */
    it("returns 500 when Supabase client is missing", async () => {
      const mockResponse = { flashcards: [], total: 0 };
      (getFlashcardsService as Mock).mockResolvedValue(mockResponse);

      const request = new Request("http://localhost/api/flashcards");
      const locals = { user: { id: "user-456" } }; // Missing supabase client in locals

      const response = await GET({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Internal server configuration error" });
      expect(getFlashcardsService).not.toHaveBeenCalled(); // Service should not be called without client
    });

    /**
     * Test case: Returns status 401 when the user object is missing from `locals`.
     * Verifies that unauthenticated requests to this endpoint are rejected.
     */
    it("returns 401 when user is missing", async () => {
      const mockResponse = { flashcards: [{ id: 2, front: "X", back: "Y" }], total: 1 };
      (getFlashcardsService as Mock).mockResolvedValue(mockResponse);

      const request = new Request("http://localhost/api/flashcards");
      const locals = { supabase: { client: true } }; // Missing user in locals

      const response = await GET({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
      expect(getFlashcardsService).not.toHaveBeenCalled(); // Service should not be called without user
    });

    /**
     * Test case: Returns status 400 for invalid query parameters (e.g., page number <= 0).
     * Tests the validation of incoming query parameters.
     */
    it("returns 400 for invalid query parameters", async () => {
      const request = new Request("http://localhost/api/flashcards?page=0"); // Invalid page
      const locals = { supabase: {}, user: { id: "user-789" } };

      const response = await GET({ request, locals } as unknown as APIContext);
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
  });

  /**
   * Test suite for the POST handler of the `/api/flashcards` endpoint.
   * Focuses on creating single or multiple flashcards.
   */
  describe("POST /api/flashcards", () => {
    /**
     * Test case: Successfully creates a single flashcard and returns status 201.
     * Verifies that the endpoint handles a single flashcard object in the body
     * and calls the service to create it for the authenticated user.
     */
    it("creates a single flashcard and returns 201", async () => {
      const newFlashcard = { front: "Hello", back: "World", source: "manual" } as const;
      const serviceResponse = { id: 1, ...newFlashcard, user_id: "user-10" }; // Simulate service response with user_id and id
      (createFlashcardService as Mock).mockResolvedValue(serviceResponse);

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFlashcard),
      });
      const locals = { supabase: { client: true }, user: { id: "user-10" } };

      const response = await POST({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual(serviceResponse);
      expect(createFlashcardService).toHaveBeenCalledWith(
        locals.supabase,
        "user-10",
        expect.objectContaining({ ...newFlashcard, user_id: "user-10" }) // Ensure user_id is added before passing to service
      );
    });

    /**
     * Test case: Returns status 400 for invalid single flashcard data in the request body.
     * Tests the validation for creating a single flashcard.
     */
    it("returns 400 for invalid single flashcard data", async () => {
      const invalidFlashcard = { front: "Hi", back: "W", source: "manual" }; // Invalid data (e.g., too short)
      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidFlashcard),
      });
      const locals = { supabase: {}, user: { id: "user-11" } };

      const response = await POST({ request, locals } as unknown as APIContext);
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
     * Test case: Successfully creates multiple flashcards and returns status 201.
     * Verifies that the endpoint handles an array of flashcard objects in the body
     * and calls the service for each flashcard with the correct user ID.
     */
    it("creates multiple flashcards and returns 201", async () => {
      const flashcards = [
        { front: "Foo", back: "Bar", source: "manual" },
        { front: "Baz", back: "Qux", source: "ai-full", generation_id: null },
      ];
      const dto = { flashcards };
      (createFlashcardService as Mock)
        .mockResolvedValueOnce({ id: 1, ...flashcards[0], user_id: "user-12" })
        .mockResolvedValueOnce({ id: 2, ...flashcards[1], user_id: "user-12" });

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const locals = { supabase: {}, user: { id: "user-12" } };

      const response = await POST({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual([
        { id: 1, ...flashcards[0], user_id: "user-12" },
        { id: 2, ...flashcards[1], user_id: "user-12" },
      ]);
      expect(createFlashcardService).toHaveBeenCalledTimes(2);
      expect(createFlashcardService).toHaveBeenCalledWith(
        locals.supabase,
        "user-12",
        expect.objectContaining({ ...flashcards[0], user_id: "user-12" })
      );
      expect(createFlashcardService).toHaveBeenCalledWith(
        locals.supabase,
        "user-12",
        expect.objectContaining({ ...flashcards[1], user_id: "user-12" })
      );
    });

    /**
     * Test case: Returns status 400 for invalid multiple flashcards data (e.g., empty array).
     * Tests the validation when an array of flashcards is provided but is invalid.
     */
    it("returns 400 for invalid multiple flashcards data", async () => {
      const dto = { flashcards: [] }; // Empty array is considered invalid in the endpoint logic
      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const locals = { supabase: {}, user: { id: "user-13" } };

      const response = await POST({ request, locals } as unknown as APIContext);
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
     * Test case: Returns status 400 when the 'flashcards' property in the body is not an array.
     * Verifies that the endpoint expects an array for batch creation.
     */
    it("returns 400 when flashcards property is not an array", async () => {
      const dto = { flashcards: "not-an-array" }; // flashcards is not an array
      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      const locals = { supabase: {}, user: { id: "user-14" } };

      const response = await POST({ request, locals } as unknown as APIContext);
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
     * Test case: Returns status 400 if the request body contains neither a single flashcard object nor a 'flashcards' array.
     * Tests that the endpoint requires one of the expected body formats.
     */
    it("returns 400 if body has neither single flashcard nor flashcards array", async () => {
      const invalidBody = { someOtherProperty: "value" }; // Neither a flashcard nor { flashcards: [...] }
      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidBody),
      });
      const locals = { supabase: {}, user: { id: "user-15" } };

      const response = await POST({ request, locals } as unknown as APIContext);
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
     * Test case: Returns status 500 when a service error occurs during flashcard creation.
     * Tests error handling when the underlying service fails (e.g., database error).
     */
    it("returns 500 on service error", async () => {
      const newFlashcard = { front: "Error", back: "Test", source: "manual" };
      (createFlashcardService as Mock).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFlashcard),
      });
      const locals = { supabase: {}, user: { id: "user-16" } };

      const response = await POST({ request, locals } as unknown as APIContext);
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
