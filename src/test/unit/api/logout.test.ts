import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/logout";
import type { APIContext, AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the Supabase client methods directly
const mockSignOut = vi.fn();

// Mock the cookie functions
// const mockCookiesSet = vi.fn(); // Moved inside vi.hoisted
// const mockCookiesDelete = vi.fn(); // Moved inside vi.hoisted
// const mockCookiesHas = vi.fn(() => false); // Moved inside vi.hoisted

// Hoist mocks for cookie functions if needed by Supabase logic
// Define and return mocks inside the hoisted factory
const { mockCookiesSet, mockCookiesDelete, mockCookiesHas } = vi.hoisted(() => {
  const mockSet = vi.fn();
  const mockDelete = vi.fn();
  const mockHas = vi.fn(() => false);
  return {
    mockCookiesSet: mockSet,
    mockCookiesDelete: mockDelete,
    mockCookiesHas: mockHas,
  };
});

// No longer need to mock the creator function
// vi.mock("../../../db/supabase.client", () => ({
//   createSupabaseServerInstance: vi.fn(),
// }));

// Helper function to create a mock APIContext
const createMockAPIContext = (
  headers: Headers = new Headers(),
  mockSupabaseClient?: Partial<SupabaseClient> // Accept optional mock client
): APIContext => {
  const mockCookies = {
    get: vi.fn(),
    set: mockCookiesSet, // Use the hoisted mock
    has: mockCookiesHas, // Use the hoisted mock
    delete: mockCookiesDelete, // Use the hoisted mock
    getSetCookieString: vi.fn(() => ""), // Add missing method if needed
    serialize: vi.fn((name, value) => `${name}=${value}`), // Add missing method if needed
  } as unknown as AstroCookies; // Still need type assertion for simplicity

  return {
    request: {
      json: vi.fn().mockResolvedValue({}), // POST shouldn't need request body
      headers: headers,
      method: "POST",
      url: "http://localhost/api/auth/logout",
      // Add other necessary Request properties if needed
      text: vi.fn().mockResolvedValue(""),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      blob: vi.fn().mockResolvedValue(new Blob()),
      formData: vi.fn().mockResolvedValue(new FormData()),
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      cache: "default",
      credentials: "omit",
      integrity: "",
      keepalive: false,
      mode: "cors",
      redirect: "follow",
      referrer: "",
      referrerPolicy: "no-referrer",
      signal: new AbortController().signal,
    } as unknown as APIContext["request"],
    cookies: mockCookies,
    locals: {
      // Inject the provided mock Supabase client
      supabase: mockSupabaseClient || {
        auth: { signOut: mockSignOut },
      },
    },
    url: new URL("http://localhost/api/auth/logout"),
    redirect: vi.fn((path: string) => new Response(null, { status: 302, headers: { Location: path } })),
    // Add other necessary properties of APIContext, mocking them as needed
    site: undefined,
    generator: "Astro vX.Y.Z",
    params: {},
    props: {},
    clientAddress: "127.0.0.1",
    // Add stubs for potentially missing properties/methods
    response: {
      headers: new Headers(),
      status: 200,
      statusText: "OK",
      body: undefined,
    },
    addCookie: vi.fn(), // Add missing method
    // Add potentially missing methods if Astro updates require them
    // Example: getSession: vi.fn(),
  } as unknown as APIContext; // Cast via unknown to satisfy TS when mocking complex types
};

describe("POST /api/auth/logout", () => {
  let mockSupabase: SupabaseClient; // Use full type so .auth is non-nullable

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockReset();
    mockCookiesSet.mockReset();
    mockCookiesDelete.mockReset();
    mockCookiesHas.mockReset();

    // Create a base mock Supabase client for tests
    mockSupabase = {
      auth: { signOut: mockSignOut },
    } as unknown as SupabaseClient;
    // Mock the (now removed) create function call just to clear potential previous mocks
    // if they existed from older test versions, though it's not called anymore.
    // (vi.mocked(createSupabaseServerInstance) as Mock).mockClear();
  });

  it("should successfully log out and redirect to login", async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null });
    // Pass the mock client to the context creator
    const context = createMockAPIContext(new Headers(), mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    // The endpoint itself doesn't call createSupabaseServerInstance anymore
    // expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    expect(context.redirect).toHaveBeenCalledWith("/auth/login");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/auth/login");
  });

  it("should successfully log out and return JSON response if Accept header is application/json", async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null });
    const headers = new Headers({ Accept: "application/json" });
    const context = createMockAPIContext(headers, mockSupabase);

    // Act
    const response = await POST(context);
    const jsonResponse = await response.json();

    // Assert
    // expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    expect(context.redirect).not.toHaveBeenCalled(); // Should not redirect
    expect(response.status).toBe(200);
    expect(jsonResponse).toEqual({ success: true, message: "Wylogowano pomyślnie", redirectUrl: "/auth/login" });
  });

  it("should return a 500 JSON response if supabase.auth.signOut returns an error", async () => {
    // Arrange
    const signOutError = { message: "Sign out failed", status: 500, name: "AuthApiError" };
    mockSignOut.mockResolvedValue({ error: signOutError });
    const headers = new Headers({ Accept: "application/json" }); // Assume JSON for error response check
    const context = createMockAPIContext(headers, mockSupabase);

    // Act
    const response = await POST(context);
    const jsonResponse = await response.json();

    // Assert
    // expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(mockCookiesDelete).not.toHaveBeenCalled(); // Cookies should not be deleted on Supabase error
    expect(context.redirect).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(jsonResponse).toEqual({ success: false, error: "Wystąpił błąd podczas wylogowywania" });
  });

  it("should successfully log out and redirect even if no session cookies are present in header", async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null });
    const context = createMockAPIContext(new Headers(), mockSupabase); // No cookies by default

    // Act
    const response = await POST(context);

    // Assert
    // expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    // Cookies delete should still be called for known auth cookies
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    expect(context.redirect).toHaveBeenCalledWith("/auth/login");
    expect(response.status).toBe(302);
  });

  it("should return a 500 JSON response for unexpected errors", async () => {
    // Arrange
    const unexpectedError = new Error("Something went wrong internally");
    // Simulate error *after* getting the Supabase client from locals
    // by making the signOut call itself throw an error not originating from Supabase
    mockSignOut.mockRejectedValue(unexpectedError);

    const headers = new Headers({ Accept: "application/json" });
    const context = createMockAPIContext(headers, mockSupabase);

    // Act
    const response = await POST(context);
    const jsonResponse = await response.json();

    // Assert
    // createSupabaseServerInstance is not called by the endpoint
    // expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1); // signOut was called, but threw
    expect(mockCookiesDelete).not.toHaveBeenCalled();
    expect(context.redirect).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(jsonResponse).toEqual({ success: false, error: "Wystąpił nieoczekiwany błąd podczas wylogowywania" });
  });

  it("should redirect even if signOut fails (non-JSON request)", async () => {
    // Arrange
    const signOutError = { message: "Sign out failed", status: 500, name: "AuthApiError" };
    mockSignOut.mockResolvedValue({ error: signOutError });
    const context = createMockAPIContext(new Headers(), mockSupabase); // Normal HTML request

    // Act
    const response = await POST(context);

    // Assert
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    // Cookies should ideally still be cleared on logout attempt, even if Supabase fails
    expect(mockCookiesDelete).not.toHaveBeenCalled();
    // The redirect should still happen as a fallback
    expect(context.redirect).not.toHaveBeenCalled();
    expect(response.status).toBe(500); // Expecting 500 status on failure
  });
});
