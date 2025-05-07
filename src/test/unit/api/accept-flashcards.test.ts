/**
 * @file Unit tests for the `/api/generations/[id]/accept-flashcards` endpoint.
 * Tests the functionality of accepting and saving generated flashcards,
 * including input validation, authorization checks, interaction with the service,
 * and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { APIContext } from "astro";
import { POST } from "../../../pages/api/generations/[id]/accept-flashcards";
import { createFlashcardsService } from "../../../lib/services/flashcard.service";
import type { AcceptFlashcardsResponseDto } from "../../../types";

// Mock the service implementation to control its behavior during tests
vi.mock("../../../lib/services/flashcard.service", () => ({
  createFlashcardsService: vi.fn(),
}));

/**
 * Test suite for the API endpoint `POST /api/generations/[id]/accept-flashcards`.
 * Contains tests for authorization, input validation, successful flashcard creation,
 * and various error scenarios.
 */
describe("API /api/generations/[id]/accept-flashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test to ensure test isolation
  });

  /**
   * Test case: Returns status 401 when the user is not authorized (missing from `locals`).
   * Verifies that unauthenticated requests are rejected.
   */
  it("returns 401 when unauthorized", async () => {
    const context = {
      request: new Request("http://localhost", {}), // Mock request object
      params: { id: "1" }, // Mock route parameter
      locals: {}, // Missing user in locals
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "Nie jesteś zalogowany. Zaloguj się, aby zapisać fiszki.",
    });
  });

  /**
   * Test case: Returns status 400 for an invalid generation ID provided in the route parameters.
   * Verifies that non-numeric or otherwise invalid IDs are rejected.
   */
  it("returns 400 for invalid generation ID", async () => {
    const context = {
      request: new Request("http://localhost", {}), // Mock request object
      params: { id: "abc" }, // Invalid non-numeric ID
      locals: { user: { id: 1 }, supabase: {} }, // User and supabase present
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Nieprawidłowy identyfikator generacji" });
  });

  /**
   * Test case: Returns status 400 when the `flashcards` array in the request body is empty.
   * Ensures that the endpoint requires at least one flashcard to be provided for saving.
   */
  it("returns 400 when flashcards array is empty", async () => {
    const body = { flashcards: [], isSaveAll: false }; // Empty flashcards array
    const context = {
      request: { json: async () => body }, // Mock request.json()
      params: { id: "2" },
      locals: { user: { id: 1 }, supabase: {} },
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Musisz podać przynajmniej jedną fiszkę" });
  });

  /**
   * Test case: Returns status 400 for validation errors within individual flashcard elements in the array.
   * Verifies that the endpoint validates the structure and content of each flashcard object.
   */
  it("returns 400 for validation error in flashcard element", async () => {
    const body = { flashcards: [{ front: "", back: "B", source: "manual", generation_id: null }] }; // Invalid flashcard (empty front)
    const context = {
      request: { json: async () => body }, // Mock request.json()
      params: { id: "3" },
      locals: { user: { id: 2 }, supabase: {} },
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Pole przodu fiszki nie może być puste" });
  });

  /**
   * Test case: Successfully creates flashcards using the service and returns status 200 with updated generation counts.
   * Simulates a successful call to `createFlashcardsService` and verifies the response structure and content.
   */
  it("creates flashcards and returns 200 with generated counts", async () => {
    const body = {
      flashcards: [
        { front: "A", back: "B", source: "ai-full", generation_id: null }, // Unedited AI card
        { front: "C", back: "D", source: "ai-edited", generation_id: null }, // Edited AI card
      ],
      isSaveAll: true,
    };
    const created = [
      { id: 1, front: "A", back: "B", source: "ai-full", user_id: 2, generation_id: 10 },
      { id: 2, front: "C", back: "D", source: "ai-edited", user_id: 2, generation_id: 10 },
    ];
    // Mock the service to return the created flashcards
    (createFlashcardsService as Mock).mockResolvedValue(created);
    const context = {
      request: { json: async () => body }, // Mock request.json()
      params: { id: "10" }, // Valid generation ID
      locals: { user: { id: 2 }, supabase: {} }, // User and supabase present
    } as unknown as APIContext;

    const res = await POST(context);
    // Verify the service was called with the correct parameters
    expect(createFlashcardsService).toHaveBeenCalledWith(
      context.locals.supabase,
      2, // User ID
      {
        flashcards: [
          { front: "A", back: "B", source: "ai-full", generation_id: 10 },
          { front: "C", back: "D", source: "ai-edited", generation_id: 10 },
        ], // Flashcards with generation ID added
      },
      true // isSaveAll flag
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as AcceptFlashcardsResponseDto;
    // Verify the response includes correct generation details and created flashcards
    expect(json.generation.id).toBe(10);
    expect(json.generation.accepted_unedited_count).toBe(1);
    expect(json.generation.accepted_edited_count).toBe(1);
    expect(json.flashcards).toEqual(created);
  });

  /**
   * Test case: Returns status 429 on duplicate submission after a previous error.
   * Simulates a scenario where a service error occurs on the first attempt,
   * and a subsequent attempt with the same parameters within a short time frame
   * is rate-limited.
   */
  it("returns 429 on duplicate submission after error", async () => {
    const body = { flashcards: [{ front: "X", back: "Y", source: "manual", generation_id: null }], isSaveAll: false };
    // Simulate service failure on first call
    (createFlashcardsService as Mock).mockRejectedValue(new Error("service error"));
    const context = {
      request: { json: async () => body }, // Mock request.json()
      params: { id: "5" },
      locals: { user: { id: 3 }, supabase: {} },
    } as unknown as APIContext;
    // First attempt - should fail with 500
    const res1 = await POST(context);
    expect(res1.status).toBe(500);
    // On error, cache key remains; second call should be rate limited
    const res2 = await POST(context);
    expect(res2.status).toBe(429);
    const dupJson = await res2.json();
    expect(dupJson).toHaveProperty("warning");
    expect(dupJson).toHaveProperty("requestId");
    // Service called only on first attempt
    expect(createFlashcardsService).toHaveBeenCalledTimes(1);
  });

  /**
   * Test case: Returns status 500 when the service throws an unexpected error.
   * Handles scenarios where the underlying `createFlashcardsService` throws an exception.
   */
  it("returns 500 when service throws error", async () => {
    const body = { flashcards: [{ front: "Z", back: "W", source: "manual", generation_id: null }], isSaveAll: false };
    // Simulate service throwing an error
    (createFlashcardsService as Mock).mockRejectedValue(new Error("fail"));
    const context = {
      request: { json: async () => body }, // Mock request.json()
      params: { id: "7" },
      locals: { user: { id: 4 }, supabase: {} },
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(500);
    const errJson = await res.json();
    expect(errJson.error).toBe("Wystąpił błąd podczas zapisywania fiszek");
    expect(errJson.details).toBe("fail");
  });
});
