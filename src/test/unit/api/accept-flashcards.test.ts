import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { APIContext } from "astro";
import { POST } from "../../../pages/api/generations/[id]/accept-flashcards";
import { createFlashcardsService } from "../../../lib/services/flashcard.service";
import type { AcceptFlashcardsResponseDto } from "../../../types";

// Mock the service implementation
vi.mock("../../../lib/services/flashcard.service", () => ({
  createFlashcardsService: vi.fn(),
}));

describe("API /api/generations/[id]/accept-flashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    const context = {
      request: new Request("http://localhost", {}),
      params: { id: "1" },
      locals: {},
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "Nie jesteś zalogowany. Zaloguj się, aby zapisać fiszki.",
    });
  });

  it("returns 400 for invalid generation ID", async () => {
    const context = {
      request: new Request("http://localhost", {}),
      params: { id: "abc" },
      locals: { user: { id: 1 }, supabase: {} },
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Nieprawidłowy identyfikator generacji" });
  });

  it("returns 400 when flashcards array is empty", async () => {
    const body = { flashcards: [], isSaveAll: false };
    const context = {
      request: { json: async () => body },
      params: { id: "2" },
      locals: { user: { id: 1 }, supabase: {} },
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Musisz podać przynajmniej jedną fiszkę" });
  });

  it("returns 400 for validation error in flashcard element", async () => {
    const body = { flashcards: [{ front: "", back: "B", source: "manual", generation_id: null }] };
    const context = {
      request: { json: async () => body },
      params: { id: "3" },
      locals: { user: { id: 2 }, supabase: {} },
    } as unknown as APIContext;
    const res = await POST(context);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Pole przodu fiszki nie może być puste" });
  });

  it("creates flashcards and returns 200 with generated counts", async () => {
    const body = {
      flashcards: [
        { front: "A", back: "B", source: "ai-full", generation_id: null },
        { front: "C", back: "D", source: "ai-edited", generation_id: null },
      ],
      isSaveAll: true,
    };
    const created = [
      { id: 1, front: "A", back: "B", source: "ai-full", user_id: 2, generation_id: 10 },
      { id: 2, front: "C", back: "D", source: "ai-edited", user_id: 2, generation_id: 10 },
    ];
    (createFlashcardsService as Mock).mockResolvedValue(created);
    const context = {
      request: { json: async () => body },
      params: { id: "10" },
      locals: { user: { id: 2 }, supabase: {} },
    } as unknown as APIContext;

    const res = await POST(context);
    expect(createFlashcardsService).toHaveBeenCalledWith(
      context.locals.supabase,
      2,
      {
        flashcards: [
          { front: "A", back: "B", source: "ai-full", generation_id: 10 },
          { front: "C", back: "D", source: "ai-edited", generation_id: 10 },
        ],
      },
      true
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as AcceptFlashcardsResponseDto;
    expect(json.generation.id).toBe(10);
    expect(json.generation.accepted_unedited_count).toBe(1);
    expect(json.generation.accepted_edited_count).toBe(1);
    expect(json.flashcards).toEqual(created);
  });

  it("returns 429 on duplicate submission after error", async () => {
    const body = { flashcards: [{ front: "X", back: "Y", source: "manual", generation_id: null }], isSaveAll: false };
    // Simulate service failure on first call
    (createFlashcardsService as Mock).mockRejectedValue(new Error("service error"));
    const context = {
      request: { json: async () => body },
      params: { id: "5" },
      locals: { user: { id: 3 }, supabase: {} },
    } as unknown as APIContext;
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

  it("returns 500 when service throws error", async () => {
    const body = { flashcards: [{ front: "Z", back: "W", source: "manual", generation_id: null }], isSaveAll: false };
    (createFlashcardsService as Mock).mockRejectedValue(new Error("fail"));
    const context = {
      request: { json: async () => body },
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
