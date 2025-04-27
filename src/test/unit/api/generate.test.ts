import { describe, it, expect, beforeEach, vi } from "vitest";
// Mock the core generation service used by the API route
vi.mock("@/lib/services/generation.service", () => ({ generateFlashcards: vi.fn() }));

import { POST } from "@/pages/api/generations/generate";
import type { GenerateFlashcardsRequestDto, GenerationWithFlashcardsResponseDto, FlashcardSourceType } from "@/types";
import { generateFlashcards } from "@/lib/services/generation.service";
import type { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient from @supabase/supabase-js
import type { Database } from "@/db/database.types"; // Import Database type
// REMOVED: import type { APIRoute } from "astro"; // Import APIRoute

// Define a type for the locals object in our test context, compatible with APIRoute's locals
interface MockLocals {
  user: { [key: string]: unknown; id: string } | null; // Updated user type
  supabase: SupabaseClient<Database>; // Use the correct SupabaseClient type with Database
  // REMOVED: Add other potential locals properties if needed for other tests
  // [key: string]: any; // Allow arbitrary properties in locals
}

// REMOVED: Define a mock type for the APIContext passed to POST, including necessary properties
// interface MockAPIContext {
//   request: Request;
//   locals: MockLocals;
//   url: URL;
//   params: Record<string, string | undefined>;
//   site: URL | undefined;
//   clientAddress: string;
//   generator: string;
//   response: { headers: Headers; status?: number; statusText?: string };
//   redirect: (path: string, status?: number) => Response;
//   rewrite: (path: string | URL | Request) => Promise<Response>;
//   cookies: any; // Mock cookies object minimally or as needed
//   // Add other APIContext properties if the tests start using them
// }

describe("POST /api/generations/generate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when user is not logged in", async () => {
    // Arrange
    const body: GenerateFlashcardsRequestDto = { text: "a".repeat(1000) };
    const request = { json: () => Promise.resolve(body) } as Request;
    // Use null for user when not logged in, matching the updated type
    const locals: MockLocals = { user: null, supabase: {} as SupabaseClient<Database> }; // Use the defined type

    // Act
    // Use type assertion to treat the mock object as the correct APIContext type
    const context = { request, locals } as Parameters<typeof POST>[0];
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json).toEqual({ error: "Nie jesteś zalogowany. Zaloguj się, aby wygenerować fiszki." });
  });

  it("returns 400 when text is too short", async () => {
    // Arrange
    const body: GenerateFlashcardsRequestDto = { text: "a".repeat(999) };
    const request = { json: () => Promise.resolve(body) } as Request;
    const locals: MockLocals = { user: { id: "user-1" }, supabase: {} as SupabaseClient<Database> }; // Use the defined type

    // Act
    // Use type assertion to treat the mock object as the correct APIContext type
    const context = { request, locals } as Parameters<typeof POST>[0];
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json).toEqual({ error: "Tekst jest zbyt krótki. Minimum to 1000 znaków." });
  });

  it("returns 400 when text is too long", async () => {
    // Arrange
    const body: GenerateFlashcardsRequestDto = { text: "a".repeat(10001) };
    const request = { json: () => Promise.resolve(body) } as Request;
    const locals: MockLocals = { user: { id: "user-1" }, supabase: {} as SupabaseClient<Database> }; // Use the defined type

    // Act
    // Use type assertion to treat the mock object as the correct APIContext type
    const context = { request, locals } as Parameters<typeof POST>[0];
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json).toEqual({ error: "Tekst jest zbyt długi. Maksimum to 10000 znaków." });
  });

  it("calls generateFlashcards and returns 200 on success", async () => {
    // Arrange
    const flashcardsResponse: GenerationWithFlashcardsResponseDto = {
      generation: {
        id: 1,
        generated_count: 2,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        model: "test-model",
      },
      flashcards: [
        { front: "Q1", back: "A1", source: "ai-full" as FlashcardSourceType }, // Cast to FlashcardSourceType
        { front: "Q2", back: "A2", source: "ai-full" as FlashcardSourceType }, // Cast to FlashcardSourceType
      ],
    };
    vi.mocked(generateFlashcards).mockResolvedValueOnce(flashcardsResponse);
    const body: GenerateFlashcardsRequestDto = { text: "a".repeat(1000), language: "en" };
    const request = { json: () => Promise.resolve(body) } as Request;
    const locals: MockLocals = { user: { id: "user-1" }, supabase: {} as SupabaseClient<Database> }; // Use the defined type

    // Act
    // Use type assertion to treat the mock object as the correct APIContext type
    const context = { request, locals } as Parameters<typeof POST>[0];
    const response = await POST(context);

    // Assert
    expect(generateFlashcards).toHaveBeenCalledWith(locals.supabase, "user-1", body.text, "en");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json).toEqual(flashcardsResponse);
  });

  it("returns 500 when generateFlashcards throws an error", async () => {
    // Arrange
    vi.mocked(generateFlashcards).mockRejectedValueOnce(new Error("AI error"));
    const body: GenerateFlashcardsRequestDto = { text: "a".repeat(1000) };
    const request = { json: () => Promise.resolve(body) } as Request;
    const locals: MockLocals = { user: { id: "user-2" }, supabase: {} as SupabaseClient<Database> }; // Use the defined type

    // Act
    // Use type assertion to treat the mock object as the correct APIContext type
    const context = { request, locals } as Parameters<typeof POST>[0];
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json).toEqual({ error: "Failed to generate flashcards", details: "AI error" });
  });
});
