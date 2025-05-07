/**
 * @file Unit tests for the `/api/auth/register` endpoint.
 * Tests the registration process including validation, successful registration,
 * and error handling for various scenarios like invalid input and Supabase errors.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/register";
import type { APIContext } from "astro";
import type { SupabaseClient } from "../../../db/supabase.client";

/**
 * Interfejs definiujący strukturę ciała żądania (request body) dla endpointu `/api/auth/register`.
 *
 * @property {string} email - Adres email użytkownika.
 * @property {string} password - Hasło użytkownika (min. 8 znaków).
 * @property {string} confirmPassword - Potwierdzenie hasła, musi pasować do `password`.
 */
// Add a typed interface for the register request body
interface RegisterRequestBody {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Funkcja pomocnicza do tworzenia mockowego obiektu `APIContext` dla testów Astro API routes.
 * Konfiguruje mockowe metody i właściwości (`request.json`, `headers`, `url`, `cookies`, `redirect`, `locals.supabase`)
 * w celu symulacji kontekstu żądania Astro API.
 *
 * @param {RegisterRequestBody} body Ciało żądania (request body) do zwrócenia przez `request.json()`.
 * @param {Partial<SupabaseClient>} [mockSupabaseClient] Częściowy mock klienta Supabase do umieszczenia w `locals.supabase`.
 * @returns {APIContext} Mockowy obiekt kontekstu Astro API.
 */
// Helper to create a mock APIContext with request.json, headers, url, cookies, redirect, and locals.supabase
const createMockAPIContext = (body: RegisterRequestBody, mockSupabaseClient?: Partial<SupabaseClient>): APIContext =>
  ({
    request: {
      json: vi.fn().mockResolvedValue(body),
      headers: new Headers(),
      url: "http://localhost/api/auth/register",
    } as unknown as APIContext["request"],
    cookies: {} as unknown as APIContext["cookies"],
    redirect: vi.fn(
      (url: string) => new Response(null, { status: 302, headers: { Location: url } })
    ) as unknown as APIContext["redirect"],
    locals: {
      supabase: mockSupabaseClient,
    },
  }) as unknown as APIContext;

/**
 * Zestaw testów dla endpointu POST `/api/auth/register`.
 * Skupia się na weryfikacji logiki rejestracji użytkownika, walidacji danych
 * wejściowych oraz obsłudze odpowiedzi z Supabase auth.
 */
describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test case: Zwraca status 400 dla nieprawidłowego formatu adresu email.
   * Weryfikuje, czy endpoint poprawnie odrzuca żądania z błędnym adresem email.
   */
  it("returns 400 for invalid email format", async () => {
    const body = { email: "invalid-email", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json.error).toBe("Nieprawidłowe dane");
    expect(json.details).toHaveProperty("email");
    expect(json.details.email._errors[0]).toBe("Nieprawidłowy adres email");
  });

  /**
   * Test case: Zwraca status 400 dla hasła krótszego niż wymagane 8 znaków.
   * Weryfikuje, czy walidacja długości hasła działa poprawnie.
   */
  it("returns 400 for password too short", async () => {
    const body = { email: "test@example.com", password: "short", confirmPassword: "short" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Nieprawidłowe dane");
    expect(json.details).toHaveProperty("password");
    expect(json.details.password._errors[0]).toBe("Hasło musi mieć co najmniej 8 znaków");
  });

  /**
   * Test case: Zwraca status 400, gdy hasła w polach 'password' i 'confirmPassword' nie pasują do siebie.
   * Weryfikuje, czy endpoint poprawnie sprawdza zgodność haseł.
   */
  it("returns 400 when passwords do not match", async () => {
    const body = { email: "test@example.com", password: "password123", confirmPassword: "different" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Nieprawidłowe dane");
    expect(json.details).toHaveProperty("confirmPassword");
    expect(json.details.confirmPassword._errors[0]).toBe("Hasła nie pasują");
  });

  /**
   * Test case: Zwraca status 200 i informację o sukcesie dla rejestracji wymagającej potwierdzenia email.
   * Symuluje odpowiedź Supabase wskazującą na konieczność weryfikacji email przed zalogowaniem.
   */
  it("returns 200 and success for registrations requiring email confirmation", async () => {
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSignUp = vi.fn().mockResolvedValue({ data: { user: mockUser, session: null }, error: null });
    const mockSupabase = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient;

    const body = { email: mockUser.email, password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body, mockSupabase);

    const response = await POST(context);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: mockUser.email,
      password: "password123",
      options: {
        emailRedirectTo: "http://localhost:4321/auth/login",
      },
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.requiresEmailConfirmation).toBe(true);
    expect(json.message).toContain("Rejestracja zakończona pomyślnie");
  });

  /**
   * Test case: Wywołuje przekierowanie dla rejestracji, która nie wymaga potwierdzenia email (np. po weryfikacji).
   * Symuluje odpowiedź Supabase zawierającą sesję i weryfikuje, czy następuje przekierowanie na stronę generowania fiszek.
   */
  it("calls redirect for registrations not requiring email confirmation", async () => {
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSession = { token: "abc" };
    const mockSignUp = vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    const mockSupabase = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient;

    const body = { email: mockUser.email, password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body, mockSupabase);

    const response = await POST(context);
    expect(mockSignUp).toHaveBeenCalled();
    expect(context.redirect).toHaveBeenCalledWith("/generate");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/generate");
  });

  /**
   * Test case: Zwraca status 400 i odpowiedni komunikat błędu, gdy Supabase zwraca błąd związany z istniejącym adresem email.
   * Weryfikuje obsługę błędu duplikacji email.
   */
  it("returns 400 and error message for supabase error containing email", async () => {
    const supabaseError = { message: "email already exists" };
    const mockSignUp = vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });
    const mockSupabase = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient;

    const body = { email: "test@example.com", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body, mockSupabase);

    const response = await POST(context);
    expect(mockSignUp).toHaveBeenCalled();
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Email już zarejestrowany");
  });

  /**
   * Test case: Zwraca status 400 i odpowiedni komunikat błędu, gdy Supabase zwraca błąd związany ze zbyt słabym hasłem.
   * Weryfikuje obsługę błędu słabego hasła zwróconego przez Supabase.
   */
  it("returns 400 and error message for supabase error containing password", async () => {
    const supabaseError = { message: "password too weak" };
    const mockSignUp = vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });
    const mockSupabase = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient;

    const body = { email: "test@example.com", password: "weakpass", confirmPassword: "weakpass" };
    const context = createMockAPIContext(body, mockSupabase);

    const response = await POST(context);
    expect(mockSignUp).toHaveBeenCalled();
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Hasło nie spełnia wymagań bezpieczeństwa");
  });

  /**
   * Test case: Zwraca status 400 i generyczny komunikat błędu dla innych błędów zwróconych przez Supabase.
   * Zapewnia, że nieznane błędy z Supabase są obsługiwane w sposób bezpieczny dla użytkownika.
   */
  it("returns 400 and generic error message for other supabase errors", async () => {
    const supabaseError = { message: "some other error" };
    const mockSignUp = vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });
    const mockSupabase = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient;

    const body = { email: "test@example.com", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body, mockSupabase);

    const response = await POST(context);
    expect(mockSignUp).toHaveBeenCalled();
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Błąd podczas rejestracji");
  });

  /**
   * Test case: Zwraca status 500 i komunikat błędu serwera w przypadku nieoczekiwanego wyjątku podczas przetwarzania żądania.
   * Weryfikuje obsługę błędów wewnętrznych serwera.
   */
  it("returns 500 on unexpected exceptions", async () => {
    const mockSignUp = vi.fn().mockImplementation(() => {
      throw new Error("Unexpected");
    });
    const mockSupabase = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient;

    const body = { email: "test@example.com", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body, mockSupabase);

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const response = await POST(context);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Błąd serwera. Spróbuj ponownie później.");
    consoleErrorSpy.mockRestore();
  });
});
