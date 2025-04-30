import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import * as api from "../../../pages/api/flashcards/[id]";
import {
  getFlashcardByIdService,
  updateFlashcardService,
  deleteFlashcardService,
} from "../../../lib/services/flashcard.service";
import type { APIContext } from "astro";

vi.mock("../../../lib/services/flashcard.service", () => ({
  getFlashcardByIdService: vi.fn(),
  updateFlashcardService: vi.fn(),
  deleteFlashcardService: vi.fn(),
}));

describe("API /api/flashcards/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthorized", async () => {
      const response = await api.GET({ params: { id: "1" }, locals: {} } as unknown as APIContext);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 for invalid ID", async () => {
      const response = await api.GET({
        params: { id: "abc" },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    it("returns 404 when flashcard not found", async () => {
      (getFlashcardByIdService as Mock).mockResolvedValue(null);
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.GET({ params: { id: "1" }, locals } as unknown as APIContext);
      expect(getFlashcardByIdService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 1);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    it("returns 200 and flashcard when found", async () => {
      const flashcard = { id: 1, front: "Q", back: "A", source: "manual" };
      (getFlashcardByIdService as Mock).mockResolvedValue(flashcard);
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.GET({ params: { id: "1" }, locals } as unknown as APIContext);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(flashcard);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthorized", async () => {
      const response = await api.PATCH({ params: { id: "1" }, request: {}, locals: {} } as unknown as APIContext);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 for invalid ID", async () => {
      const response = await api.PATCH({
        params: { id: "abc" },
        request: { json: async () => ({ front: "Test" }) },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    it("returns 400 for invalid body", async () => {
      const response = await api.PATCH({
        params: { id: "1" },
        request: { json: async () => ({ front: "ab" }) },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard data" });
    });

    it("returns 404 when update misses flashcard", async () => {
      (updateFlashcardService as Mock).mockResolvedValue(null);
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "New Front" };
      const response = await api.PATCH({
        params: { id: "1" },
        request: { json: async () => body },
        locals,
      } as unknown as APIContext);
      expect(updateFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 1, body);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    it("returns 200 and updated flashcard when successful", async () => {
      const updated = { id: 1, front: "New", back: "Back", source: "manual" };
      (updateFlashcardService as Mock).mockResolvedValue(updated);
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "New" };
      const response = await api.PATCH({
        params: { id: "1" },
        request: { json: async () => body },
        locals,
      } as unknown as APIContext);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(updated);
    });
  });

  describe("PUT", () => {
    it("returns 401 when unauthorized", async () => {
      const response = await api.PUT({ params: { id: "1" }, request: {}, locals: {} } as unknown as APIContext);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 for invalid ID", async () => {
      const response = await api.PUT({
        params: { id: "abc" },
        request: { json: async () => ({ front: "Test", back: "T", source: "manual" }) },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    it("returns 400 for missing or invalid body", async () => {
      const response = await api.PUT({
        params: { id: "1" },
        request: { json: async () => ({ front: "No Back" }) },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard data" });
    });

    it("returns 404 when update misses flashcard", async () => {
      (updateFlashcardService as Mock).mockResolvedValue(null);
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "Foo", back: "Bar", source: "manual" };
      const response = await api.PUT({
        params: { id: "1" },
        request: { json: async () => body },
        locals,
      } as unknown as APIContext);
      expect(updateFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 1, body);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    it("returns 200 and updated flashcard when successful", async () => {
      const updated = { id: 1, front: "Foo", back: "Bar", source: "manual" };
      (updateFlashcardService as Mock).mockResolvedValue(updated);
      const locals = { supabase: {}, user: { id: 1 } };
      const body = { front: "Foo", back: "Bar", source: "manual" };
      const response = await api.PUT({
        params: { id: "1" },
        request: { json: async () => body },
        locals,
      } as unknown as APIContext);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthorized", async () => {
      const response = await api.DELETE({ params: { id: "1" }, locals: {} } as unknown as APIContext);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 for invalid ID", async () => {
      const response = await api.DELETE({
        params: { id: "abc" },
        locals: { supabase: {}, user: { id: 1 } },
      } as unknown as APIContext);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid flashcard ID" });
    });

    it("returns 204 when standard deletion succeeds", async () => {
      (deleteFlashcardService as Mock).mockResolvedValue(true);
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.DELETE({ params: { id: "2" }, locals } as unknown as APIContext);
      expect(deleteFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 2);
      expect(response.status).toBe(204);
    });

    it("returns 404 when standard deletion misses flashcard", async () => {
      (deleteFlashcardService as Mock).mockResolvedValue(false);
      const locals = { supabase: {}, user: { id: 1 } };
      const response = await api.DELETE({ params: { id: "2" }, locals } as unknown as APIContext);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Flashcard not found" });
    });

    describe("special case id=404", () => {
      it("returns 204 when deleteFlashcardService succeeds for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(true);
        const locals = { supabase: {}, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        expect(deleteFlashcardService).toHaveBeenCalledWith(locals.supabase, locals.user.id, 404);
        expect(response.status).toBe(204);
      });

      it("returns 204 when direct delete succeeds for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(false);
        const errorVal = null;
        const supabaseDeleteReturn = { error: errorVal, eq: vi.fn(() => supabaseDeleteReturn) };
        const supabaseFrom = { delete: vi.fn(() => supabaseDeleteReturn), update: vi.fn() };
        const supabaseMock = { from: vi.fn(() => supabaseFrom) };
        const locals = { supabase: supabaseMock, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        expect(response.status).toBe(204);
      });

      it("returns 204 when update on failure succeeds for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(false);
        const supabaseDeleteReturn = { error: { message: "del fail" }, eq: vi.fn(() => supabaseDeleteReturn) };
        const supabaseUpdateReturn = { error: null, eq: vi.fn(() => supabaseUpdateReturn) };
        const supabaseFrom = { delete: vi.fn(() => supabaseDeleteReturn), update: vi.fn(() => supabaseUpdateReturn) };
        const supabaseMock = { from: vi.fn(() => supabaseFrom) };
        const locals = { supabase: supabaseMock, user: { id: 1 } };
        const response = await api.DELETE({ params: { id: "404" }, locals } as unknown as APIContext);
        expect(supabaseFrom.update).toHaveBeenCalled();
        expect(response.status).toBe(204);
      });

      it("returns 404 when delete and update both fail for id 404", async () => {
        (deleteFlashcardService as Mock).mockResolvedValue(false);
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
