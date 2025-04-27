import { vi } from "vitest";
import type { Mock } from "vitest";
// Import the function and the mock directly from the mocked module
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { POST } from "../../../pages/api/auth/logout";
import type { APIContext } from "astro";

// Use vi.hoisted to define mocks that need to be available to the test suite and vi.mock factory
const { mockSignOut, mockSupabaseClient } = vi.hoisted(() => {
  const mockSignOut = vi.fn();
  const mockSupabaseClient = {
    auth: {
      signOut: mockSignOut,
    },
    // Add any other properties/methods of SupabaseClient that are accessed in the POST function
    // For this test, auth and signOut seem sufficient.
  };
  return {
    mockSignOut,
    mockSupabaseClient,
  };
});

// Mock the module where createSupabaseServerInstance comes from
vi.mock("../../../db/supabase.client", () => {
  // Return an object that mirrors the module's exports, with mocks where needed.
  const createSupabaseServerInstance = vi.fn(() => mockSupabaseClient);
  return {
    createSupabaseServerInstance,
    mockSignOut,
  };
});

// Mock dependencies that are not part of the module being mocked above
const mockCookiesDelete = vi.fn();
const mockRedirect = vi.fn();

// Mock APIContext structure with only necessary properties for the test
const createMockAPIContext = (options: { cookieHeader?: string; acceptHeader?: string }) => ({
  request: {
    headers: {
      get: vi.fn((name: string) => {
        if (name === "Cookie") return options.cookieHeader ?? null;
        if (name === "Accept") return options.acceptHeader ?? null;
        return null;
      }),
    },
  },
  cookies: {
    delete: mockCookiesDelete,
    get: vi.fn().mockReturnValue(undefined), // Added for createSupabaseServerInstance type compatibility
    has: vi.fn().mockReturnValue(false), // Added for createSupabaseServerInstance type compatibility
    set: vi.fn(), // Added for createSupabaseServerInstance type compatibility
    all: vi.fn().mockReturnValue([]), // Added for createSupabaseServerInstance type compatibility
  },
  redirect: mockRedirect,
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Reset the default mock implementation for mockSignOut defined in the hoisted scope
    mockSignOut.mockResolvedValue({ error: null });

    // The mock implementation for createSupabaseServerInstance is set in vi.mock using hoisted mocks,
    // so no need to set it again here unless specific test cases require a different mock client.
    // If you needed to change the returned mock client for a specific test, you would do it here.
    // e.g., (createSupabaseServerInstance as ReturnType<typeof vi.fn>).mockImplementationOnce(() => differentMockClient);
  });

  // Test case 1: Successful logout with redirect
  it("should successfully log out and redirect to login", async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null });
    const context = createMockAPIContext({
      cookieHeader: "sb-access-token=token1; sb-refresh-token=token2; other-cookie=value",
      acceptHeader: "text/html", // Expect redirect
    });

    // Act
    const response = await POST(context as unknown as APIContext); // Cast via unknown to APIContext

    // Assert
    // We cannot directly check if createSupabaseServerInstance was called if it's not a vi.fn() itself.
    // However, the test logic relies on mockSignOut being called, which is part of the object returned by it.
    // Let's keep the assertion for now, but be aware it might not pass if createSupabaseServerInstance isn't a spy.
    expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    // Access mockSignOut directly as it is in the test file's scope via vi.hoisted
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    // Ensure known auth cookies are also deleted
    expect(mockCookiesDelete).toHaveBeenCalledWith("supabase-auth-token", { path: "/" });
    expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
    expect(response).toBeUndefined(); // redirect doesn't return a Response
  });

  // Test case 2: Successful logout with JSON response
  it("should successfully log out and return JSON response if Accept header is application/json", async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null });
    const context = createMockAPIContext({
      cookieHeader: "sb-access-token=token1; sb-refresh-token=token2",
      acceptHeader: "application/json", // Expect JSON response
    });

    // Act
    const response = await POST(context as unknown as APIContext);
    const body = await response.json();

    // Assert
    expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("supabase-auth-token", { path: "/" });
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: "Wylogowano pomyślnie",
      redirectUrl: "/auth/login",
    });
  });

  // Test case 3: Error during Supabase sign out
  it("should return a 500 JSON response if supabase.auth.signOut returns an error", async () => {
    // Arrange
    const supabaseError = new Error("Sign out failed");
    mockSignOut.mockResolvedValue({ error: supabaseError });
    const context = createMockAPIContext({ acceptHeader: "application/json" }); // Can be any Accept header, testing error path

    // Act
    const response = await POST(context as unknown as APIContext);
    const body = await response.json();

    // Assert
    expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockCookiesDelete).not.toHaveBeenCalled(); // Cookies should not be deleted on Supabase error
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: "Wystąpił błąd podczas wylogowywania",
    });
    // Optional: Check console.error was called if you want to test logging
    // expect(console.error).toHaveBeenCalledWith("Błąd wylogowywania z Supabase:", supabaseError);
  });

  // Test case 4: No session cookies in Cookie header
  it("should successfully log out and redirect even if no session cookies are present in header", async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null });
    const context = createMockAPIContext({
      cookieHeader: "other-cookie=value1; another-one=value2", // No sb- or supabase- cookies
      acceptHeader: "text/html",
    });

    // Act
    const response = await POST(context as unknown as APIContext);

    // Assert
    expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    // Cookies delete should still be called for known auth cookies
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-access-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
    expect(mockCookiesDelete).toHaveBeenCalledWith("supabase-auth-token", { path: "/" });
    // It should not call delete for cookies not starting with sb- or supabase-
    expect(mockCookiesDelete).not.toHaveBeenCalledWith("other-cookie", expect.anything());
    expect(mockCookiesDelete).not.toHaveBeenCalledWith("another-one", expect.anything());

    expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
    expect(response).toBeUndefined();
  });

  // Test case 5: Unexpected error during execution
  it("should return a 500 JSON response for unexpected errors", async () => {
    // Arrange
    const unexpectedError = new Error("Something went wrong");
    // Override the mockImplementation for this specific test case to simulate error at Supabase instance creation
    (createSupabaseServerInstance as Mock).mockImplementationOnce(() => {
      throw unexpectedError;
    });
    const context = createMockAPIContext({});

    // Act
    const response = await POST(context as unknown as APIContext);
    const body = await response.json();

    // Assert
    expect(createSupabaseServerInstance).toHaveBeenCalledTimes(1);
    // Since createSupabaseServerInstance throws, signOut should not be called
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockCookiesDelete).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: "Wystąpił nieoczekiwany błąd podczas wylogowywania",
    });
    // Optional: Check console.error was called
    // expect(console.error).toHaveBeenCalledWith("Niespodziewany błąd wylogowywania:", unexpectedError);
  });
});
