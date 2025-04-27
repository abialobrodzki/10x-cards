/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "../../../pages/api/flashcards";
import * as flashcardService from "../../../lib/services/flashcard.service";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";

describe("Flashcards API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET handler", () => {
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

    it("should use snake_case parameters and fallback supabaseClient and DEFAULT_USER_ID", async () => {
      // Arrange
      const fakeResult = { flashcards: [], total: 0 };
      vi.spyOn(flashcardService, "getFlashcardsService").mockResolvedValue(fakeResult as any);
      const url = "http://localhost/api/flashcards?sort_by=updated_at&sort_order=asc&generation_id=15";
      const request = { url } as unknown as Request;
      const locals = {} as any;
      // Act
      const response = await GET({ request, locals } as any);
      // Assert
      expect(flashcardService.getFlashcardsService).toHaveBeenCalledWith(supabaseClient, DEFAULT_USER_ID, {
        page: 1,
        page_size: 20,
        sort_by: "updated_at",
        sort_order: "asc",
        generation_id: 15,
        sortBy: "updated_at",
        sortOrder: "asc",
        generationId: 15,
      });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(fakeResult);
    });

    it("should return 400 on invalid query parameters", async () => {
      // Arrange
      const url = "http://localhost/api/flashcards?page=0&page_size=200";
      const request = { url } as unknown as Request;
      const locals = { supabase: {} as unknown } as any;
      // Act
      const response = await GET({ request, locals } as any);
      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(`
        {
          "error": "Invalid query parameters",
        }
      `);
    });

    it("should return 500 on service error", async () => {
      // Arrange
      vi.spyOn(flashcardService, "getFlashcardsService").mockRejectedValue(new Error("fail"));
      const url = "http://localhost/api/flashcards";
      const request = { url } as unknown as Request;
      const locals = {} as any;
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

  describe("POST handler", () => {
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
      expect(flashcardService.createFlashcardService).toHaveBeenCalledWith(locals.supabase, "u1", body);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual(fakeCard);
    });

    it("should create multiple flashcards", async () => {
      // Arrange
      const cardsDto = [{ front: "Abc", back: "Def", source: "ai-edited", generation_id: null }];
      const fakeResult = [{ id: 1, ...cardsDto[0] }];
      vi.spyOn(flashcardService, "createFlashcardsService").mockResolvedValue(fakeResult as any);
      const body = { flashcards: cardsDto };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown, user: { id: "u2" } } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert
      expect(flashcardService.createFlashcardsService).toHaveBeenCalledWith(locals.supabase, "u2", body);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual(fakeResult);
    });

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
      expect(json).toMatchInlineSnapshot(`
        {
          "error": "Invalid flashcard data",
        }
      `);
    });

    it("should return 400 on invalid multiple flashcards", async () => {
      // Arrange
      const body = { flashcards: [] };
      const request = { json: async () => body } as unknown as Request;
      const locals = { supabase: {} as unknown } as any;
      // Act
      const response = await POST({ request, locals } as any);
      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toMatchInlineSnapshot(`
        {
          "error": "Invalid flashcards data",
        }
      `);
    });

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
