import { describe, it, expect, beforeEach, vi } from "vitest";
import { onRequest } from "@/middleware/index";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Astro middleware import so tests can resolve defineMiddleware
vi.mock("astro:middleware", () => ({ defineMiddleware: (fn: unknown) => fn }));

// Define middleware context type based on onRequest signature
type OnRequestContext = Parameters<typeof onRequest>[0];

// Mock Supabase auth methods
const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const mockGetUser = vi.fn();
const mockSupabase = {
  auth: { getSession: mockGetSession, refreshSession: mockRefreshSession, getUser: mockGetUser },
} as unknown as SupabaseClient;

// Mock the factory that creates the Supabase server instance
vi.mock("@/db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(() => mockSupabase),
}));

// Helper to build the middleware context
function buildContext(path: string, cookieHeader = "", deleteSpy = vi.fn()): OnRequestContext {
  const context = {
    locals: {} as OnRequestContext["locals"],
    cookies: { delete: deleteSpy },
    request: new Request(`http://localhost${path}`, {
      headers: new Headers({ Cookie: cookieHeader }),
    }),
    url: new URL(`http://localhost${path}`),
    redirect: vi.fn((location: string) => new Response(null, { status: 302, headers: { Location: location } })),
  };
  return context as unknown as OnRequestContext;
}

// Typed next function returning a Response promise
function createNext(): () => Promise<Response> {
  return vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
}

describe("Middleware onRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("skips auth for API auth endpoints", async () => {
    const ctx = buildContext("/api/auth/login");
    const next = createNext();
    await onRequest(ctx, next);

    // ensure Supabase instance is set in locals
    expect(ctx.locals.supabase).toBe(mockSupabase);
    expect(next).toHaveBeenCalled();
    expect(ctx.redirect).not.toHaveBeenCalled();
  });

  it("allows public path without authentication", async () => {
    const ctx = buildContext("/");
    const next = createNext();
    await onRequest(ctx, next);

    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("sets locals.user and continues for valid session on protected path", async () => {
    const user = { id: "u1", email: "user@example.com" };
    const future = Math.floor(Date.now() / 1000) + 3600;
    mockGetSession.mockResolvedValue({ data: { session: { expires_at: future } }, error: null });
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    const ctx = buildContext("/protected", "sb-access-token=test-token");
    const next = createNext();
    await onRequest(ctx, next);

    expect(ctx.locals.user).toEqual({ id: "u1", email: "user@example.com" });
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("redirects and clears cookies when getSession returns 401", async () => {
    mockGetSession.mockResolvedValue({ data: null, error: { status: 401 } });
    const deleteSpy = vi.fn();
    const ctx = buildContext("/protected", "sb-access-token=tok;other=1", deleteSpy);
    const next = createNext();

    await onRequest(ctx, next);

    expect(ctx.redirect).toHaveBeenCalledWith("/auth/login");
    expect(deleteSpy).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(next).not.toHaveBeenCalled();
  });

  it("refreshes token when expiring soon and continues", async () => {
    const soon = Math.floor(Date.now() / 1000) + 100;
    mockGetSession.mockResolvedValue({ data: { session: { expires_at: soon } }, error: null });
    const newExpiry = Math.floor(Date.now() / 1000) + 3600;
    mockRefreshSession.mockResolvedValue({ data: { session: { expires_at: newExpiry } }, error: null });
    // After refresh, a valid user should be retrieved
    const refreshedUser = { id: "u1", email: "user@example.com" };
    mockGetUser.mockResolvedValue({ data: { user: refreshedUser }, error: null });

    const ctx = buildContext("/protected", "sb-access-token=token");
    const next = createNext();
    await onRequest(ctx, next);

    // ensure session was refreshed and user is set
    expect(mockRefreshSession).toHaveBeenCalled();
    expect(ctx.locals.user).toEqual(refreshedUser);
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("redirects if refreshSession fails", async () => {
    const soon = Math.floor(Date.now() / 1000) + 100;
    mockGetSession.mockResolvedValue({ data: { session: { expires_at: soon } }, error: null });
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: { status: 401 } });
    const deleteSpy = vi.fn();
    const ctx = buildContext("/protected", "sb-access-token=token", deleteSpy);
    const next = createNext();

    await onRequest(ctx, next);

    expect(ctx.redirect).toHaveBeenCalledWith("/auth/login");
    expect(deleteSpy).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(next).not.toHaveBeenCalled();
  });

  it("redirects if session missing on protected path", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    const deleteSpy = vi.fn();
    const ctx = buildContext("/protected", "", deleteSpy);
    const next = createNext();

    await onRequest(ctx, next);

    expect(ctx.redirect).toHaveBeenCalledWith("/auth/login");
    expect(next).not.toHaveBeenCalled();
  });
});
