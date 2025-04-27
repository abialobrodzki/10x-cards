import { vi } from "vitest";

// Mock the Supabase client module
vi.mock("../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/reset-password";
import type { APIContext } from "astro";

// Import the real factory and grab its mock
import { createSupabaseServerInstance } from "../../../db/supabase.client";
const createSupabaseServerInstanceMock = vi.mocked(createSupabaseServerInstance);
// Determine the instance type for casting
type SupabaseServerInstance = ReturnType<typeof createSupabaseServerInstance>;

// Define the request body shape for type safety
interface ResetPasswordRequestBody {
  token: string;
  password: string;
  confirmPassword: string;
}
type PartialResetPasswordRequest = Partial<ResetPasswordRequestBody>;

// Helper to build a fake APIContext for the POST handler
const createMockAPIContext = (body: PartialResetPasswordRequest): APIContext =>
  ({
    request: {
      json: vi.fn().mockResolvedValue(body),
      headers: new Headers(),
      url: "http://localhost/api/auth/reset-password",
    } as unknown as APIContext["request"],
    cookies: {} as unknown as APIContext["cookies"],
  }) as unknown as APIContext;

describe("POST /api/auth/reset-password", () => {
  const exchangeCodeForSessionMock = vi.fn();
  const updateUserMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a minimal Supabase stub and cast it to the real instance type
    const supabaseStub = {
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
        updateUser: updateUserMock,
      },
    };
    createSupabaseServerInstanceMock.mockImplementation(
      (): SupabaseServerInstance =>
        // cast stub to SupabaseServerInstance via unknown to satisfy TS
        supabaseStub as unknown as SupabaseServerInstance
    );
  });

  describe("validation errors", () => {
    it("returns 400 when token is missing", async () => {
      const context = createMockAPIContext({ password: "pass1234", confirmPassword: "pass1234" });
      const res = await POST(context);
      expect(res.status).toBe(400);
      expect(res.headers.get("Content-Type")).toBe("application/json");
      const json = await res.json();
      expect(json.error).toBe("Nieprawidłowe dane");
      expect(json.details).toHaveProperty("token");
      expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    });

    it("returns 400 when password is too short", async () => {
      const context = createMockAPIContext({ token: "abc", password: "short", confirmPassword: "short" });
      const res = await POST(context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.details.password._errors[0]).toBe("Hasło musi mieć co najmniej 8 znaków");
    });

    it("returns 400 when confirmPassword is missing", async () => {
      const context = createMockAPIContext({ token: "abc", password: "password123" });
      const res = await POST(context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.details).toHaveProperty("confirmPassword");
    });

    it("returns 400 when passwords do not match", async () => {
      const context = createMockAPIContext({ token: "abc", password: "password123", confirmPassword: "wrong" });
      const res = await POST(context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.details.confirmPassword._errors[0]).toBe("Hasła nie pasują");
    });
  });

  it("returns 400 for non-UUID token format", async () => {
    const context = createMockAPIContext({
      token: "not-uuid",
      password: "password123",
      confirmPassword: "password123",
    });
    const res = await POST(context);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Nieprawidłowy format linku resetującego.");
    expect(json.message).toBe("Prosimy wygenerować nowy link resetujący hasło.");
  });

  describe("Supabase exchange/update flow", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";

    it("handles expired-code error from Supabase", async () => {
      exchangeCodeForSessionMock.mockResolvedValue({ data: null, error: { message: "token expired" } });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(exchangeCodeForSessionMock).toHaveBeenCalledWith(validUuid);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Kod resetujący wygasł. Proszę wygenerować nowy link.");
      expect(json.details).toBe("token expired");
    });

    it("handles invalid-code error from Supabase", async () => {
      exchangeCodeForSessionMock.mockResolvedValue({ data: null, error: { message: "invalid code" } });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Kod resetujący jest nieprawidłowy.");
    });

    it("handles generic exchange error", async () => {
      exchangeCodeForSessionMock.mockResolvedValue({ data: null, error: { message: "oops" } });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Nieprawidłowy lub wygasły kod resetujący.");
    });

    it("returns 500 when no session or user returned", async () => {
      exchangeCodeForSessionMock.mockResolvedValue({ data: { session: null, user: null }, error: null });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Nie udało się uzyskać sesji po wymianie kodu.");
    });

    it("returns 500 on updateUser error", async () => {
      exchangeCodeForSessionMock.mockResolvedValue({ data: { session: {}, user: { id: "u1" } }, error: null });
      updateUserMock.mockResolvedValue({ error: { message: "update failed" } });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(updateUserMock).toHaveBeenCalledWith({ password: "password123" });
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Nie udało się zaktualizować hasła.");
    });

    it("returns 200 on successful password reset", async () => {
      exchangeCodeForSessionMock.mockResolvedValue({ data: { session: {}, user: { id: "u1" } }, error: null });
      updateUserMock.mockResolvedValue({ error: null });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Hasło zostało pomyślnie zmienione");
    });

    it("handles unexpected exceptions inside exchange/update", async () => {
      exchangeCodeForSessionMock.mockImplementation(() => {
        throw new Error("boom");
      });
      const context = createMockAPIContext({
        token: validUuid,
        password: "password123",
        confirmPassword: "password123",
      });
      const res = await POST(context);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Wystąpił nieoczekiwany błąd serwera.");
    });
  });

  it("returns 500 on invalid JSON body", async () => {
    const context = createMockAPIContext({});
    (context.request.json as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("bad json"));
    const res = await POST(context);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Błąd serwera. Spróbuj ponownie później.");
  });
});
