/**
 * @file Unit tests for the `/api/flashcards/[id]` endpoint.
 * Tests the GET, PATCH, PUT, and DELETE methods for managing individual flashcards
 * via their ID, including authorization, validation, service interactions,
 * and edge cases like not found scenarios.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import * as api from "../../../pages/api/flashcards/[id]";
import {
  getFlashcardByIdService,
  updateFlashcardService,
  deleteFlashcardService,
} from "../../../lib/services/flashcard.service";
import type { APIContext } from "astro";

// Mock the flashcard service methods to control their behavior during tests
vi.mock("../../../lib/services/flashcard.service", () => ({
  getFlashcardByIdService: vi.fn(), // Mock for retrieving a single flashcard by ID
  updateFlashcardService: vi.fn(), // Mock for updating a flashcard by ID
  deleteFlashcardService: vi.fn(), // Mock for deleting a flashcard by ID
}));

/**
 * Test suite for the API endpoint `/api/flashcards/[id]`.
 * Contains nested test suites for each supported HTTP method (GET, PATCH, PUT, DELETE)
 * and a special case for ID 404 in DELETE.
 */
describe("API /api/flashcards/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  /**
   * Test suite for the GET method of the `/api/flashcards/[id]` endpoint.
   * Tests retrieving a specific flashcard by its ID.
   */
  describe("GET", () => {
    /**
     * Test case: Returns status 401 when the user is not authorized (missing from `locals`).
     * Ensures that unauthenticated requests are rejected.
     */
    it("returns 401 when unauthorized", async () => {
      const response = await api.GET({ params: { id: "1" }, locals: {} } as unknown as APIContext); // Missing user in locals
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    /**
     * Test case: Returns status 400 for an invalid flashcard ID provided in the route parameters.
     * Verifies that non-numeric or otherwise invalid IDs are rejected.
     */
    it("returns 400 for invalid ID", async () => {
      const response = await api.GET({
        params: { id: "abc" }, // Invalid non-numeric ID
        locals: { supabase: {}, user: { id: 1 } }, // User and supabase present
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    /**
     * Test case: Returns status 404 when the requested flashcard is not found by the service.
     * Simulates the service returning null when a flashcard with the given ID and user ID is not found.
     */
    it("returns 404 when flashcard not found", async () => {
      (getFlashcardByIdService as Mock).mockResolvedValue(null); // Service returns null
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.GET({ params: { id: "1" }, locals } as unknown as APIContext);
      expect(getFlashcardByIdService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 1); // Verify service call
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    /**
     * Test case: Returns status 200 and the flashcard data when the flashcard is found.
     * Simulates the service successfully finding and returning a flashcard.
     */
    it("returns 200 and flashcard when found", async () => {
      const flashcard = { id: 1, front: "Q", back: "A", source: "manual" };
      (getFlashcardByIdService as Mock).mockResolvedValue(flashcard); // Service returns flashcard
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.GET({ params: { id: "1" }, locals } as unknown as APIContext);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(flashcard);
    });
  });

  /**
   * Test suite for the PATCH method of the `/api/flashcards/[id]` endpoint.
   * Tests updating specific fields of an existing flashcard.
   */
  describe("PATCH", () => {
    /**
     * Test case: Returns status 401 when the user is not authorized.
     * Ensures that unauthenticated PATCH requests are rejected.
     */
    it("returns 401 when unauthorized", async () => {
      const response = await api.PATCH({ params: { id: "1" }, request: {}, locals: {} } as unknown as APIContext); // Missing user in locals
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    /**
     * Test case: Returns status 400 for an invalid flashcard ID in the route parameters.
     * Verifies ID validation for PATCH requests.
     */
    it("returns 400 for invalid ID", async () => {
      const response = await api.PATCH({
        params: { id: "abc" }, // Invalid non-numeric ID
        request: { json: async () => ({ front: "Test" }) },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    /**
     * Test case: Returns status 400 for invalid or incomplete data in the request body for PATCH.
     * Verifies that the endpoint validates the structure and content of the partial update body.
     */
    it("returns 400 for invalid body", async () => {
      const response = await api.PATCH({
        params: { id: "1" },
        request: { json: async () => ({ front: "ab" }) }, // Invalid data (e.g., too short front)
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard data" });
    });

    /**
     * Test case: Returns status 404 when the flashcard to be updated is not found by the service.
     * Simulates the service returning null when the flashcard with the given ID and user ID does not exist for update.
     */
    it("returns 404 when update misses flashcard", async () => {
      (updateFlashcardService as Mock).mockResolvedValue(null); // Service returns null
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "New Front" };
      const response = await api.PATCH({
        params: { id: "1" },
        request: { json: async () => body }, // Mock request.json()
        locals,
      } as unknown as APIContext);
      expect(updateFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 1, body); // Verify service call
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    /**
     * Test case: Returns status 200 and the updated flashcard data when the update is successful.
     * Simulates the service successfully updating and returning the modified flashcard.
     */
    it("returns 200 and updated flashcard when successful", async () => {
      const updated = { id: 1, front: "New", back: "Back", source: "manual" };
      (updateFlashcardService as Mock).mockResolvedValue(updated); // Service returns updated flashcard
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "New" };
      const response = await api.PATCH({
        params: { id: "1" },
        request: { json: async () => body }, // Mock request.json()
        locals,
      } as unknown as APIContext);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(updated);
    });
  });

  /**
   * Test suite for the PUT method of the `/api/flashcards/[id]` endpoint.
   * Tests replacing an existing flashcard with new data.
   */
  describe("PUT", () => {
    /**
     * Test case: Returns status 401 when the user is not authorized.
     * Ensures that unauthenticated PUT requests are rejected.
     */
    it("returns 401 when unauthorized", async () => {
      const response = await api.PUT({ params: { id: "1" }, request: {}, locals: {} } as unknown as APIContext); // Missing user in locals
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    /**
     * Test case: Returns status 400 for an invalid flashcard ID in the route parameters.
     * Verifies ID validation for PUT requests.
     */
    it("returns 400 for invalid ID", async () => {
      const response = await api.PUT({
        params: { id: "abc" }, // Invalid non-numeric ID
        request: { json: async () => ({ front: "Test", back: "T", source: "manual" }) },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    /**
     * Test case: Returns status 400 for missing or invalid data in the request body for PUT.
     * Verifies that the endpoint validates the full flashcard object provided for replacement.
     */
    it("returns 400 for missing or invalid body", async () => {
      const response = await api.PUT({
        params: { id: "1" },
        request: { json: async () => ({ front: "No Back" }) }, // Missing 'back' property
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard data" });
    });

    /**
     * Test case: Returns status 404 when the flashcard to be replaced is not found by the service.
     * Simulates the service returning null when the flashcard with the given ID and user ID does not exist for replacement.
     */
    it("returns 404 when update misses flashcard", async () => {
      (updateFlashcardService as Mock).mockResolvedValue(null); // Service returns null
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "Foo", back: "Bar", source: "manual" };
      const response = await api.PUT({
        params: { id: "1" },
        request: { json: async () => body }, // Mock request.json()
        locals,
      } as unknown as APIContext);
      expect(updateFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 1, body); // Verify service call
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    /**
     * Test case: Returns status 200 and the updated flashcard data when the replacement is successful.
     * Simulates the service successfully replacing and returning the modified flashcard.
     */
    it("returns 200 and updated flashcard when successful", async () => {
      const updated = { id: 1, front: "Foo", back: "Bar", source: "manual" };
      (updateFlashcardService as Mock).mockResolvedValue(updated); // Service returns updated flashcard
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "Foo", back: "Bar", source: "manual" };
      const response = await api.PUT({
        params: { id: "1" },
        request: { json: async () => body }, // Mock request.json()
        locals,
      } as unknown as APIContext);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(updated);
    });
  });

  /**
   * Test suite for the DELETE method of the `/api/flashcards/[id]` endpoint.
   * Tests deleting a specific flashcard by its ID.
   * Includes a special nested suite for handling ID 404.
   */
  describe("DELETE", () => {
    /**
     * Test case: Returns status 401 when the user is not authorized.
     * Ensures that unauthenticated DELETE requests are rejected.
     */
    it("returns 401 when unauthorized", async () => {
      const response = await api.DELETE({ params: { id: "1" }, locals: {} } as unknown as APIContext); // Missing user in locals
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    /**
     * Test case: Returns status 400 for an invalid flashcard ID in the route parameters.
     * Verifies ID validation for DELETE requests.
     */
    it("returns 400 for invalid ID", async () => {
      const response = await api.DELETE({
        params: { id: "abc" }, // Invalid non-numeric ID
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    /**
     * Test case: Returns status 204 when the standard deletion service call succeeds.
     * Simulates the service successfully deleting the flashcard.
     */
    it("returns 204 when standard deletion succeeds", async () => {
      (deleteFlashcardService as Mock).mockResolvedValue(true); // Service returns true (deleted)
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.DELETE({ params: { id: "2" }, locals } as unknown as APIContext);
      expect(deleteFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 2); // Verify service call
      expect(response.status).toBe(204);
    });

    /**
     * Test case: Returns status 404 when the standard deletion service call indicates the flashcard was not found.
     * Simulates the service returning false, indicating the flashcard with the given ID and user ID was not found for deletion.
     */
    it("returns 404 when standard deletion misses flashcard", async () => {
      (deleteFlashcardService as Mock).mockResolvedValue(false); // Service returns false (not found)
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.DELETE({ params: { id: "2" }, locals } as unknown as APIContext);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    /**
     * Test suite for the special case handling of deleting flashcard with ID 404.
     * This ID might have specific logic or fallback mechanisms.
     */
    describe("special case id=404", () => {
      /**
       * Test case: Returns status 204 when `deleteFlashcardService` succeeds for ID 404.
       * Verifies the standard deletion path for this specific ID.
       */
      it("returns 204 when deleteFlashcardService succeeds for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(true); // Service returns true
        const locals = { supabase: {}, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        expect(deleteFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 404); // Verify service call with ID 404
        expect(response.status).toBe(204);
      });

      /**
       * Test case: Returns status 204 when a direct Supabase delete call succeeds for ID 404 (fallback).
       * Simulates the scenario where `deleteFlashcardService` fails, but a direct Supabase call with ID 404 succeeds.
       * This test specifically mocks the Supabase client interactions.
       */
      it("returns 204 when direct delete succeeds for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(false); // Service fails
        const errorVal = null;
        const supabaseDeleteReturn = { error: errorVal, eq: vi.fn(() => supabaseDeleteReturn) };
        const supabaseFrom = { delete: vi.fn(() => supabaseDeleteReturn), update: vi.fn() };
        const supabaseMock = { from: vi.fn(() => supabaseFrom) };
        const locals = { supabase: supabaseMock, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        // Verify direct Supabase delete call structure
        expect(supabaseMock.from).toHaveBeenCalledWith("flashcards");
        expect(supabaseFrom.delete).toHaveBeenCalled();
        expect(supabaseDeleteReturn.eq).toHaveBeenCalledWith("id", 404);
        expect(response.status).toBe(204);
      });

      /**
       * Test case: Returns status 204 when an update on failure (marking as deleted) succeeds for ID 404 (fallback).
       * Simulates the scenario where both `deleteFlashcardService` and the direct Supabase delete fail,
       * but a subsequent update call (potentially marking the flashcard as deleted instead of physically deleting) succeeds.
       * This test specifically mocks the Supabase client interactions for the update fallback.
       */
      it("returns 204 when update on failure succeeds for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(false); // Service fails
        const supabaseDeleteReturn = { error: { message: "del fail" }, eq: vi.fn(() => supabaseDeleteReturn) };
        const supabaseUpdateReturn = { error: null, eq: vi.fn(() => supabaseUpdateReturn) };
        const supabaseFrom = { delete: vi.fn(() => supabaseDeleteReturn), update: vi.fn(() => supabaseUpdateReturn) };
        const supabaseMock = { from: vi.fn(() => supabaseFrom) };
        const locals = { supabase: supabaseMock, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        // Verify Supabase update call structure
        expect(supabaseMock.from).toHaveBeenCalledWith("flashcards");
        expect(supabaseFrom.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        expect(supabaseUpdateReturn.eq).toHaveBeenCalledWith("id", 404);
        expect(response.status).toBe(204);
      });

      /**
       * Test case: Returns status 404 when both deletion attempts (service and direct Supabase) and the update fallback fail for ID 404.
       * Simulates a scenario where all attempts to delete or mark as deleted the flashcard with ID 404 fail.
       */
      it("returns 404 when delete and update both fail for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(false); // Service fails
        const supabaseDeleteReturn = { error: { message: "del fail" }, eq: vi.fn(() => supabaseDeleteReturn) };
        const supabaseUpdateReturn = { error: { message: "upd fail" }, eq: vi.fn(() => supabaseUpdateReturn) };
        const supabaseFrom = { delete: vi.fn(() => supabaseDeleteReturn), update: vi.fn(() => supabaseUpdateReturn) };
        const supabaseMock = { from: vi.fn(() => supabaseFrom) };
        const locals = { supabase: supabaseMock, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Flashcard not found" });
      });
    });
  });
});
