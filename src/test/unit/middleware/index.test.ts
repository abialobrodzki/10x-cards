/**
 * @file Unit tests for the Astro middleware.
 * Tests the authentication and session handling logic implemented in the middleware.
 */

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

/**
 * Helper function to build a mock middleware context.
 * Creates a context object with mock `locals`, `cookies`, `request`, `url`, and `redirect` for testing.
 *
 * @param {string} path The URL path for the request.
 * @param {string} [cookieHeader=""] The value of the 'Cookie' header.
 * @param {import('vitest').Mock} [deleteSpy=vi.fn()] A mock function for `cookies.delete`.
 * @returns {OnRequestContext} The mock middleware context object.
 */
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

/**
 * Helper function to create a mock `next` function for middleware.
 * Returns a mock function that resolves with a default Response object.
 *
 * @returns {() => Promise<Response>} A mock `next` function.
 */
// Typed next function returning a Response promise
function createNext(): () => Promise<Response> {
  return vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
}

/**
 * Test suite for the `onRequest` middleware function.
 * Covers various scenarios including public paths, protected paths, session handling, and token refreshing.
 */
describe("Middleware onRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  /**
   * Test case: Skips authentication for known API authentication endpoints.
   * Ensures requests to `/api/auth/*` paths proceed without auth checks.
   */
  it("skips auth for API auth endpoints", async () => {
    const ctx = buildContext("/api/auth/login");
    const next = createNext();
    await onRequest(ctx, next);

    // ensure Supabase instance is set in locals
    expect(ctx.locals.supabase).toBe(mockSupabase);
    expect(next).toHaveBeenCalled();
    expect(ctx.redirect).not.toHaveBeenCalled();
  });

  /**
   * Test case: Allows access to public paths without requiring authentication.
   * Ensures requests to the root path `/` proceed without redirection.
   */
  it("allows public path without authentication", async () => {
    const ctx = buildContext("/");
    const next = createNext();
    await onRequest(ctx, next);

    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  /**
   * Test case: Sets the user in `locals` and proceeds for a valid session on a protected path.
   * Verifies that a user with a valid session can access protected resources.
   */
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

  /**
   * Test case: Redirects to the login page and clears cookies when `getSession` returns a 401 error.
   * Handles scenarios where the session is invalid or expired and the server responds with 401.
   */
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

  /**
   * Test case: Refreshes the session token when it's expiring soon and proceeds with the request.
   * Tests the middleware's ability to automatically refresh sessions to maintain user authentication.
   */
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

  /**
   * Test case: Redirects to the login page if refreshing the session fails.
   * Handles scenarios where the session refresh process encounters an error.
   */
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

  /**
   * Test case: Redirects to the login page if the session is missing on a protected path.
   * Ensures users without an active session are redirected when trying to access protected routes.
   */
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
