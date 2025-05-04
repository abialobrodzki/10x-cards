import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { APIContext } from "astro";

// Mock the Supabase client and default user ID to avoid missing environment variables
vi.mock("../../../db/supabase.client", () => ({
  DEFAULT_USER_ID: "default-user-id",
  supabaseClient: {},
}));

// Mock the flashcard service module
vi.mock("../../../lib/services/flashcard.service", () => ({
  getFlashcardsService: vi.fn(),
  createFlashcardService: vi.fn(),
  createFlashcardsService: vi.fn(),
}));
import { getFlashcardsService, createFlashcardService } from "../../../lib/services/flashcard.service";
import { GET, POST } from "../../../pages/api/flashcards";

describe("Flashcards API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/flashcards", () => {
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

    it("returns 500 when Supabase client is missing", async () => {
      const mockResponse = { flashcards: [], total: 0 };
      (getFlashcardsService as Mock).mockResolvedValue(mockResponse);

      const request = new Request("http://localhost/api/flashcards");
      const locals = { user: { id: "user-456" } };

      const response = await GET({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Internal server configuration error" });
      expect(getFlashcardsService).not.toHaveBeenCalled();
    });

    it("returns 401 when user is missing", async () => {
      const mockResponse = { flashcards: [{ id: 2, front: "X", back: "Y" }], total: 1 };
      (getFlashcardsService as Mock).mockResolvedValue(mockResponse);

      const request = new Request("http://localhost/api/flashcards");
      const locals = { supabase: { client: true } };

      const response = await GET({ request, locals } as unknown as APIContext);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
      expect(getFlashcardsService).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid query parameters", async () => {
      const request = new Request("http://localhost/api/flashcards?page=0");
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

  describe("POST /api/flashcards", () => {
    it("creates a single flashcard and returns 201", async () => {
      const newFlashcard = { front: "Hello", back: "World", source: "manual" } as const;
      const serviceResponse = { id: 1, ...newFlashcard };
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
        expect.objectContaining({ ...newFlashcard, user_id: "user-10" })
      );
    });

    it("returns 400 for invalid single flashcard data", async () => {
      const invalidFlashcard = { front: "Hi", back: "W", source: "manual" };
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

    it("returns 400 for invalid multiple flashcards data", async () => {
      const dto = { flashcards: [] };
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

    it("returns 400 when flashcards property is not an array", async () => {
      const dto = { flashcards: "not-an-array" };
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
  });
});
