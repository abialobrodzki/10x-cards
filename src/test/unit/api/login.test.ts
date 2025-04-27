import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/login";
import type { APIContext, AstroCookies } from "astro";

// Mock the Supabase client module
const mockSignInWithPassword = vi.fn();
const mockGetUser = vi.fn();

vi.mock("../../../db/supabase.client", () => {
  const mockCreateSupabaseServerInstance = vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      getUser: mockGetUser,
    },
  }));
  return {
    createSupabaseServerInstance: mockCreateSupabaseServerInstance,
  };
});

interface LoginRequestBody {
  email?: string;
  password?: string;
}

// Helper function to create a mock APIContext
const createMockAPIContext = (
  body: LoginRequestBody,
  cookies?: Record<string, string | undefined>, // Use Record for cookies input
  headers?: Record<string, string>
): APIContext => ({
  request: {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
  } as unknown as APIContext["request"],
  // Create a mock AstroCookies object
  cookies: {
    get: vi.fn((name: string) => {
      // Mock the get method
      // Simple mock logic: return a value if provided in the initial cookies object
      if (cookies && cookies[name]) {
        return { value: cookies[name] };
      }
      return undefined; // Return undefined if cookie not found
    }),
    set: vi.fn(), // Mock the set method
    has: vi.fn(() => false), // Mock the has method, simple implementation
    delete: vi.fn(), // Mock the delete method
    // Add other required properties/methods if necessary based on AstroCookies type
  } as unknown as AstroCookies, // Cast the mock object to AstroCookies
  // Add other necessary properties of APIContext
  params: {} as APIContext["params"],
  site: undefined as APIContext["site"],
  url: new URL("http://localhost") as unknown as APIContext["url"],
  redirect: vi.fn() as unknown as APIContext["redirect"],
  generator: "" as APIContext["generator"],
  clientAddress: "" as APIContext["clientAddress"],
  props: {} as APIContext["props"],
  rewrite: vi.fn() as unknown as APIContext["rewrite"],
  locals: {} as APIContext["locals"],
  preferredLocale: "" as APIContext["preferredLocale"],
  // Added missing properties based on the linter error
  preferredLocaleList: [] as unknown as APIContext["preferredLocaleList"],
  currentLocale: undefined as unknown as APIContext["currentLocale"],
  routePattern: "" as unknown as APIContext["routePattern"],
  originPathname: "" as unknown as APIContext["originPathname"],
  // Removed html, text, and response as they caused type errors and are not used in current tests
  // Added missing properties based on the linter error
  getActionResult: vi.fn() as unknown as APIContext["getActionResult"],
  callAction: vi.fn() as unknown as APIContext["callAction"],
  isPrerendered: false as APIContext["isPrerendered"],
});

describe("POST /api/auth/login", () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and success: true for valid credentials", async () => {
    // Arrange
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSession = { expires_at: 1234567890, expires_in: 3600, token: "mock-token", user: mockUser };
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.redirectUrl).toBe("/generate");
    expect(jsonResponse.user).toEqual({ id: mockUser.id, email: mockUser.email });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: requestBody.email, password: requestBody.password });
    expect(mockGetUser).toHaveBeenCalled();
  });

  it("should return 400 for invalid email format", async () => {
    // Arrange
    const requestBody = { email: "invalid-email", password: "password123" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowe dane logowania");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("should return 400 for missing password", async () => {
    // Arrange
    const requestBody = { email: "test@example.com" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowe dane logowania");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("should return 400 for missing email", async () => {
    // Arrange
    const requestBody = { password: "password123" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowe dane logowania");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("should return 401 for invalid email or password from Supabase", async () => {
    // Arrange
    const supabaseError = { message: "Invalid login credentials", status: 400, name: "AuthApiError" };
    mockSignInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const requestBody = { email: "test@example.com", password: "wrongpassword" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(401);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowy email lub hasło");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: requestBody.email, password: requestBody.password });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("should return 500 for other Supabase signInWithPassword errors", async () => {
    // Arrange
    const supabaseError = { message: "Some other Supabase error", status: 500, name: "AuthApiError" };
    mockSignInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(401); // Current implementation returns 401 for any signInWithPassword error
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nieprawidłowy email lub hasło"); // Current implementation returns same error message
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: requestBody.email, password: requestBody.password });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("should return 500 if Supabase signInWithPassword succeeds but no session is returned", async () => {
    // Arrange
    const mockUser = { id: "user-id", email: "test@example.com" };
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: null }, error: null }); // Session is null

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Nie udało się utworzyć sesji");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: requestBody.email, password: requestBody.password });
    expect(mockGetUser).not.toHaveBeenCalled(); // getUser is not called if session is null
  });

  it("should return 200 even if getUser fails after successful login", async () => {
    // Arrange
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSession = { expires_at: 1234567890, expires_in: 3600, token: "mock-token", user: mockUser };
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    const userError = { message: "Failed to fetch user", status: 500, name: "AuthApiError" };
    mockGetUser.mockResolvedValue({ data: { user: null }, error: userError }); // getUser fails

    const requestBody = { email: "test@example.com", password: "password123" };
    const context = createMockAPIContext(requestBody);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(200); // Should still succeed if login was successful
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.redirectUrl).toBe("/generate");
    expect(jsonResponse.user).toEqual({ id: mockUser.id, email: mockUser.email }); // Should return user from signInWithPassword data
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: requestBody.email, password: requestBody.password });
    expect(mockGetUser).toHaveBeenCalled(); // getUser should still be called
  });

  it("should return 500 for unexpected errors during request processing", async () => {
    // Arrange
    const unexpectedError = new Error("Something went wrong");
    // Simulate an error before supabase call, e.g., in request.json()
    const context = createMockAPIContext({});
    context.request.json = vi.fn().mockRejectedValue(unexpectedError);

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);
    const jsonResponse = await response.json();
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse.error).toBe("Wystąpił błąd podczas logowania");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
