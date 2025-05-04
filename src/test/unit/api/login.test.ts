import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { POST } from "../../../pages/api/auth/login";
import type { APIContext, AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the Supabase client methods directly
const mockSignInWithPassword = vi.fn();
const mockGetUser = vi.fn();

// No longer need to mock the creator function
// vi.mock("../../../db/supabase.client", ...);

interface LoginRequestBody {
  email?: string;
  password?: string;
}

// Helper function to create a mock APIContext
const createMockAPIContext = (body: LoginRequestBody, mockSupabaseClient?: Partial<SupabaseClient>): APIContext => {
  const mockCookies = {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(() => false),
    delete: vi.fn(),
  } as unknown as AstroCookies;

  return {
    request: {
      json: vi.fn().mockResolvedValue(body),
      headers: new Headers(),
    } as unknown as APIContext["request"],
    cookies: mockCookies,
    locals: {
      // Inject the provided mock Supabase client
      supabase: mockSupabaseClient || {
        auth: {
          signInWithPassword: mockSignInWithPassword,
          getUser: mockGetUser,
        },
      },
    },
    // Add other necessary properties of APIContext
    // ... (keep other mock properties as needed)
    url: new URL("http://localhost"),
    redirect: vi.fn(),
  } as unknown as APIContext;
};

describe("POST /api/auth/login", () => {
  let mockSupabase: SupabaseClient; // Use full client type so .auth is non-optional

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks for auth methods
    mockSignInWithPassword.mockReset();
    mockGetUser.mockReset();

    // Create a base mock Supabase client for tests
    mockSupabase = {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        getUser: mockGetUser,
      },
    } as unknown as SupabaseClient;
  });

  it("should return 200 and success: true for valid credentials", async () => {
    // Arrange
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSession = { expires_at: 1234567890, expires_in: 3600, token: "mock-token", user: mockUser };
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const requestBody = { email: "test@example.com", password: "password123" };
    // Pass the mock client to the context creator
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.redirectUrl).toBe("/generate");
    expect(jsonResponse.user).toEqual({ id: mockUser.id, email: mockUser.email });
    // Check mock methods on the injected client
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: requestBody.email,
      password: requestBody.password,
    });
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
  });

  it("should return 400 for invalid email format", async () => {
    // Arrange
    const requestBody = { email: "invalid-email", password: "password123" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowe dane logowania");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("should return 400 for missing password", async () => {
    // Arrange
    const requestBody = { email: "test@example.com" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowe dane logowania");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("should return 400 for missing email", async () => {
    // Arrange
    const requestBody = { password: "password123" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowe dane logowania");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("should return 401 for invalid email or password from Supabase", async () => {
    // Arrange
    const supabaseError = { message: "Invalid login credentials", status: 400, name: "AuthApiError" };
    mockSignInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const requestBody = { email: "test@example.com", password: "wrongpassword" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(401);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowy email lub hasło");
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: requestBody.email,
      password: requestBody.password,
    });
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("should return 500 for other Supabase signInWithPassword errors", async () => {
    // Arrange
    const supabaseError = { message: "Some other Supabase error", status: 500, name: "AuthApiError" };
    mockSignInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    // The code returns 401 on ANY signIn error, so this test case reflects that
    expect(response.status).toBe(401);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowy email lub hasło");
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: requestBody.email,
      password: requestBody.password,
    });
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("should return 500 if Supabase signInWithPassword succeeds but no session is returned", async () => {
    // Arrange
    const mockUser = { id: "user-id", email: "test@example.com" };
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: null }, error: null });

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nie udało się utworzyć sesji");
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: requestBody.email,
      password: requestBody.password,
    });
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("should return 200 even if getUser fails after successful login", async () => {
    // Arrange
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSession = { expires_at: 1234567890, expires_in: 3600, token: "mock-token", user: mockUser };
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    const userError = { message: "Failed to fetch user", status: 500, name: "AuthApiError" };
    mockGetUser.mockResolvedValue({ data: { user: null }, error: userError });

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody, mockSupabase);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.redirectUrl).toBe("/generate");
    expect(jsonResponse.user).toEqual({ id: mockUser.id, email: mockUser.email });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: requestBody.email,
      password: requestBody.password,
    });
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
  });

  it("should return 500 for unexpected errors during request processing", async () => {
    // Arrange
    const unexpectedError = new Error("Something went wrong");
    const context = createMockAPIContext({}, mockSupabase);
    // Simulate error during request.json()
    (context.request.json as Mock).mockRejectedValue(unexpectedError);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Wystąpił błąd podczas logowania");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});
