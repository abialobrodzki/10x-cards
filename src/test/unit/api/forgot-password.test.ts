import { vi } from "vitest";

// Mock Supabase client first, before any other imports
vi.mock("../../../db/supabase.client", () => {
  return {
    createSupabaseServerInstance: vi.fn(() => ({
      auth: { resetPasswordForEmail: vi.fn() },
    })),
  };
});

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/forgot-password";
import type { APIContext } from "astro";

// Get reference to the mocked functions after import
const createSupabaseServerInstanceMock = vi.mocked(
  (await import("../../../db/supabase.client")).createSupabaseServerInstance
);
const resetPasswordForEmailMock = vi.fn();

// Update the mock implementation
beforeEach(() => {
  // Use type assertion to bypass type checking for the mock

  createSupabaseServerInstanceMock.mockImplementation(
    () =>
      ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auth: { resetPasswordForEmail: resetPasswordForEmailMock } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
  );
});

// Create a mock APIContext factory
const createMockAPIContext = (request: Request): APIContext => {
  return {
    request,

    cookies: {
      get: vi.fn(),
      has: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      entries: vi.fn().mockReturnValue([]),
      getAll: vi.fn().mockReturnValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    site: new URL("http://localhost"),
    generator: "test",
    url: new URL(request.url),
    params: {},
    props: {},
    locals: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: {} as any,
    },
    redirect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmailMock.mockReset();
  });

  it("returns 400 if email is invalid", async () => {
    const invalidEmail = { email: "invalidEmail" };
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidEmail),
    });

    const response = await POST(createMockAPIContext(request));

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = await response.json();
    expect(json).toMatchInlineSnapshot(`
      {
        "error": "Nieprawidłowy adres email",
      }
    `);
  });

  it("calls supabase.resetPasswordForEmail and returns 200 on success", async () => {
    const validEmail = { email: "test@example.com" };
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validEmail),
    });

    const mockContext = createMockAPIContext(request);
    const response = await POST(mockContext);

    expect(createSupabaseServerInstanceMock).toHaveBeenCalledWith({
      headers: request.headers,
      cookies: mockContext.cookies,
    });
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(validEmail.email, {
      redirectTo: "http://localhost/auth/reset-password",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const json = await response.json();
    expect(json).toMatchInlineSnapshot(`
      {
        "message": "Link do resetowania hasła został wysłany, jeśli podany adres email istnieje w naszej bazie",
      }
    `);
  });

  it("logs error but still returns 200 if supabase returns error", async () => {
    const validEmail = { email: "test@example.com" };
    const supabaseError = { message: "Some error" };
    resetPasswordForEmailMock.mockResolvedValue({ error: supabaseError });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validEmail),
    });

    const response = await POST(createMockAPIContext(request));

    expect(consoleErrorSpy).toHaveBeenCalledWith("Błąd podczas wysyłania linka resetującego:", supabaseError);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchInlineSnapshot(`
      {
        "message": "Link do resetowania hasła został wysłany, jeśli podany adres email istnieje w naszej bazie",
      }
    `);

    consoleErrorSpy.mockRestore();
  });

  it("returns 500 on unexpected exception", async () => {
    const errorInstance = new Error("Unexpected");
    createSupabaseServerInstanceMock.mockImplementation(() => {
      throw errorInstance;
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(createMockAPIContext(request));

    expect(consoleErrorSpy).toHaveBeenCalledWith("Błąd podczas obsługi resetowania hasła:", errorInstance);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toMatchInlineSnapshot(`
      {
        "error": "Błąd serwera. Spróbuj ponownie później.",
      }
    `);

    consoleErrorSpy.mockRestore();
  });

  it("returns 500 on invalid JSON body", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const invalidJsonBody = "{ not valid json";
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: invalidJsonBody,
    });

    const response = await POST(createMockAPIContext(request));

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toMatchInlineSnapshot(`
      {
        "error": "Błąd serwera. Spróbuj ponownie później.",
      }
    `);

    consoleErrorSpy.mockRestore();
  });
});
