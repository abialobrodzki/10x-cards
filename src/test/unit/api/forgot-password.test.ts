// Usuwamy mockowanie na poziomie modułu
// import { vi } from "vitest";

// Mock Supabase client first, before any other imports
// vi.mock("../../../db/supabase.client", () => {
//   return {
//     createSupabaseServerInstance: vi.fn(() => ({
//       auth: { resetPasswordForEmail: vi.fn() },
//     })),
//   };
// });

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../pages/api/auth/forgot-password";
import type { APIContext } from "astro";
import type { SupabaseClient } from "../../../db/supabase.client"; // Import typu

// Usuwamy odniesienia do zamockowanego createSupabaseServerInstance
// const createSupabaseServerInstanceMock = vi.mocked(
//   (await import("../../../db/supabase.client")).createSupabaseServerInstance
// );
// const resetPasswordForEmailMock = vi.fn();

// Usuwamy beforeEach aktualizujące implementację mocka createSupabaseServerInstance
// beforeEach(() => {
//   // Use type assertion to bypass type checking for the mock
//
//   createSupabaseServerInstanceMock.mockImplementation(
//     () =>
//       ({
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         auth: { resetPasswordForEmail: resetPasswordForEmailMock } as any,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       }) as any
//   );
// });

// Create a mock APIContext factory - dostosowane do przekazywania mocka supabase
const createMockAPIContext = (
  request: Request,
  mockSupabaseClient?: Partial<SupabaseClient> // Opcjonalny mock klienta
): APIContext => {
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
      supabase: mockSupabaseClient, // Przekazujemy mock do locals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: {} as any,
    },
    redirect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};

describe("POST /api/auth/forgot-password", () => {
  // Zmienna na mock resetPasswordForEmail, resetowana w beforeEach
  let resetPasswordForEmailMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmailMock = vi.fn(); // Tworzymy nowy mock dla każdego testu
  });

  it("returns 400 if email is invalid", async () => {
    const invalidEmail = { email: "invalidEmail" };
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidEmail),
    });

    // Nie przekazujemy mocka supabase, bo walidacja powinna odrzucić request wcześniej
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

    const mockSupabase = {
      auth: { resetPasswordForEmail: resetPasswordForEmailMock },
    } as unknown as SupabaseClient;

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validEmail),
    });

    const mockContext = createMockAPIContext(request, mockSupabase); // Przekazujemy mock
    const response = await POST(mockContext);

    // Usuwamy asercję na createSupabaseServerInstanceMock
    // expect(createSupabaseServerInstanceMock).toHaveBeenCalledWith({
    //   headers: request.headers,
    //   cookies: mockContext.cookies,
    // });
    // Sprawdzamy wywołanie na mocku z locals
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(validEmail.email, {
      redirectTo: "http://localhost:4321/auth/reset-password",
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

    const mockSupabase = {
      auth: { resetPasswordForEmail: resetPasswordForEmailMock },
    } as unknown as SupabaseClient;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validEmail),
    });

    const response = await POST(createMockAPIContext(request, mockSupabase)); // Przekazujemy mock

    expect(resetPasswordForEmailMock).toHaveBeenCalled(); // Dodatkowa asercja
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
    // Zamiast mockować implementację createSupabaseServerInstance, mockujemy metodę na kliencie
    resetPasswordForEmailMock.mockImplementation(() => {
      throw errorInstance;
    });

    const mockSupabase = {
      auth: { resetPasswordForEmail: resetPasswordForEmailMock },
    } as unknown as SupabaseClient;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(createMockAPIContext(request, mockSupabase)); // Przekazujemy mock

    expect(resetPasswordForEmailMock).toHaveBeenCalled(); // Dodatkowa asercja
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
