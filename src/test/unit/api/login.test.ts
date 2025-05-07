/**
 * @file Unit tests for the `/api/auth/login` endpoint.
 * Tests the user login process, including input validation, interaction with Supabase auth,
 * and handling of success and various error scenarios.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { POST } from "../../../pages/api/auth/login";
import type { APIContext, AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the Supabase client methods directly
const mockSignInWithPassword = vi.fn();
const mockGetUser = vi.fn();

// No longer need to mock the creator function
// vi.mock("../../../db/supabase.client", ...);

/**
 * Interfejs definiujący strukturę ciała żądania (request body) dla endpointu `/api/auth/login`.
 *
 * @property {string} [email] - Adres email użytkownika (opcjonalny w testach, ale wymagany przez endpoint).
 * @property {string} [password] - Hasło użytkownika (opcjonalne w testach, ale wymagane przez endpoint).
 */
interface LoginRequestBody {
  email?: string;
  password?: string;
}

/**
 * Funkcja pomocnicza do tworzenia mockowego obiektu `APIContext` dla testów Astro API routes.
 * Symuluje obiekt kontekstu przekazywany do funkcji endpointu przez Astro,
 * zawierający mockowe `request` (z mockowanym `json`), `cookies`, `locals` (z opcjonalnym mockiem klienta Supabase),
 * `url` oraz `redirect`.
 *
 * @param {LoginRequestBody} body Ciało żądania (request body) do zwrócenia przez `request.json()`.
 * @param {Partial<SupabaseClient>} [mockSupabaseClient] Opcjonalny, częściowy mock klienta Supabase do umieszczenia w `locals.supabase`. Domyślnie używa mocków `mockSignInWithPassword` i `mockGetUser`.
 * @returns {APIContext} Mockowy obiekt kontekstu Astro API.
 */
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

/**
 * Zestaw testów jednostkowych dla endpointu POST `/api/auth/login`.
 * Testuje poprawność procesu logowania użytkownika, w tym walidację danych,
 * integrację z Supabase auth oraz obsługę różnych scenariuszy odpowiedzi (sukces, błędy walidacji, błędy Supabase).
 */
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

  /**
   * Test case: Pomyślne logowanie z poprawnymi danymi uwierzytelniającymi.
   * Weryfikuje, czy endpoint wywołuje `signInWithPassword` w Supabase,
   * zwraca status 200, informację o sukcesie, URL przekierowania oraz dane użytkownika.
   */
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

  /**
   * Test case: Zwraca status 400 dla nieprawidłowego formatu adresu email w ciele żądania.
   * Weryfikuje, czy walidacja adresu email działa poprawnie przed próbą logowania w Supabase.
   */
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

  /**
   * Test case: Zwraca status 400, gdy w ciele żądania brakuje hasła.
   * Weryfikuje, czy endpoint odrzuca żądania z brakującym polem hasła.
   */
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

  /**
   * Test case: Zwraca status 400, gdy w ciele żądania brakuje adresu email.
   * Weryfikuje, czy endpoint odrzuca żądania z brakującym polem email.
   */
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

  /**
   * Test case: Zwraca status 401, gdy Supabase zgłasza błąd nieprawidłowych danych logowania (email lub hasło).
   * Weryfikuje, czy endpoint poprawnie interpretuje błąd autentykacji z Supabase.
   */
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

  /**
   * Test case: Zwraca status 401 dla innych błędów zgłoszonych przez `supabase.auth.signInWithPassword`.
   * Obecna implementacja endpointu traktuje wszystkie błędy z `signInWithPassword` jako nieprawidłowe dane logowania.
   */
  it("should return 401 for other Supabase signInWithPassword errors", async () => {
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

  /**
   * Test case: Zwraca status 500, jeśli `supabase.auth.signInWithPassword` zakończy się sukcesem,
   * ale nie zwróci obiektu sesji.
   * Wskazuje to na wewnętrzny problem po stronie Supabase lub błąd konfiguracji.
   */
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

  /**
   * Test case: Zwraca status 200 nawet jeśli `supabase.auth.getUser` zakończy się błędem po pomyślnym logowaniu.
   * Logowanie jest uznawane za udane, jeśli `signInWithPassword` zwróci sesję.
   * Błąd podczas pobierania pełnych danych użytkownika (`getUser`) nie powinien blokować procesu logowania.
   */
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
    expect(jsonResponse.user).toEqual({ id: mockUser.id, email: mockUser.email }); // User object is still returned from session
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: requestBody.email,
      password: requestBody.password,
    });
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
  });

  /**
   * Test case: Zwraca status 500 w przypadku nieoczekiwanych błędów podczas przetwarzania żądania (np. błąd parsowania JSON).
   * Weryfikuje obsługę błędów, które nie są bezpośrednio związane z logiką Supabase auth.
   */
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
    expect(jsonResponse.error).toBe("Błąd serwera. Spróbuj ponownie później.");
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});
