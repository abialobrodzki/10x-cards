import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/register";
import type { APIContext } from "astro";

const mockSignUp = vi.fn();

vi.mock("../../../db/supabase.client", () => {
  const mockCreateSupabaseServerInstance = vi.fn(() => ({
    auth: { signUp: mockSignUp },
  }));
  return { createSupabaseServerInstance: mockCreateSupabaseServerInstance };
});

// Add a typed interface for the register request body
interface RegisterRequestBody {
  email: string;
  password: string;
  confirmPassword: string;
}

// Helper to create a mock APIContext with request.json, headers, url, cookies, and redirect
const createMockAPIContext = (body: RegisterRequestBody): APIContext =>
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
  }) as unknown as APIContext;

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("returns 200 and success for registrations requiring email confirmation", async () => {
    const mockUser = { id: "user-id", email: "test@example.com" };
    mockSignUp.mockResolvedValue({ data: { user: mockUser, session: null }, error: null });

    const body = { email: mockUser.email, password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: mockUser.email,
      password: "password123",
      options: { emailRedirectTo: "http://localhost/auth/login" },
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.requiresEmailConfirmation).toBe(true);
    expect(json.message).toContain("Rejestracja zakończona pomyślnie");
  });

  it("calls redirect for registrations not requiring email confirmation", async () => {
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockSession = { token: "abc" };
    mockSignUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });

    const body = { email: mockUser.email, password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(context.redirect).toHaveBeenCalledWith("/generate");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/generate");
  });

  it("returns 400 and error message for supabase error containing email", async () => {
    const supabaseError = { message: "email already exists" };
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const body = { email: "test@example.com", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Email już zarejestrowany");
  });

  it("returns 400 and error message for supabase error containing password", async () => {
    const supabaseError = { message: "password too weak" };
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const body = { email: "test@example.com", password: "weakpass", confirmPassword: "weakpass" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Hasło nie spełnia wymagań bezpieczeństwa");
  });

  it("returns 400 and generic error message for other supabase errors", async () => {
    const supabaseError = { message: "some other error" };
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: supabaseError });

    const body = { email: "test@example.com", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body);

    const response = await POST(context);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Błąd podczas rejestracji");
  });

  it("returns 500 on unexpected exceptions", async () => {
    mockSignUp.mockImplementation(() => {
      throw new Error("Unexpected");
    });
    const body = { email: "test@example.com", password: "password123", confirmPassword: "password123" };
    const context = createMockAPIContext(body);

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const response = await POST(context);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Błąd serwera. Spróbuj ponownie później.");
    consoleErrorSpy.mockRestore();
  });
});
