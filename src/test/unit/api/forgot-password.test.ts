/**
 * @file Unit tests for the `/api/auth/forgot-password` endpoint.
 * Tests the process of requesting a password reset link, including input validation,
 * interaction with Supabase, and error handling.
 */

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

/**
 * Funkcja pomocnicza do tworzenia mockowego obiektu `APIContext` dla testów Astro API routes.
 * Konfiguruje mockowe metody i właściwości (`request`, `cookies`, `site`, `generator`, `url`, `params`, `props`, `locals`, `redirect`)
 * w celu symulacji kontekstu żądania Astro API.
 * Umożliwia przekazanie mockowego klienta Supabase do `locals`.
 *
 * @param {Request} request Obiekt żądania (Request) do symulacji.
 * @param {Partial<SupabaseClient>} [mockSupabaseClient] Opcjonalny, częściowy mock klienta Supabase do umieszczenia w `locals.supabase`.
 * @returns {APIContext} Mockowy obiekt kontekstu Astro API.
 */
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

/**
 * Zestaw testów dla endpointu POST `/api/auth/forgot-password`.
 * Skupia się na weryfikacji logiki wysyłania linka resetującego hasło,
 * walidacji adresu email oraz obsłudze odpowiedzi z Supabase auth.
 */
describe("POST /api/auth/forgot-password", () => {
  // Zmienna na mock resetPasswordForEmail, resetowana w beforeEach
  let resetPasswordForEmailMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmailMock = vi.fn(); // Tworzymy nowy mock dla każdego testu
  });

  /**
   * Test case: Zwraca status 400, jeśli adres email w ciele żądania jest nieprawidłowy.
   * Weryfikuje, czy walidacja formatu email działa poprawnie przed próbą wysłania linka.
   */
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

  /**
   * Test case: Wywołuje metodę `resetPasswordForEmail` klienta Supabase i zwraca status 200 w przypadku sukcesu.
   * Weryfikuje, czy endpoint poprawnie komunikuje się z Supabase i odpowiada pozytywnie na pomyślne wysłanie linka (niezależnie czy email istnieje).
   */
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

  /**
   * Test case: Loguje błąd zwrócony przez Supabase, ale nadal zwraca status 200.
   * Zgodnie z polityką bezpieczeństwa (unikanie informowania, czy dany email istnieje w bazie),
   * endpoint powinien zawsze zwracać sukces, nawet jeśli Supabase zgłosi błąd (np. email nie znaleziono).
   */
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

  /**
   * Test case: Zwraca status 500 w przypadku nieoczekiwanego wyjątku podczas przetwarzania żądania.
   * Weryfikuje obsługę błędów wewnętrznych serwera i zwracanie generycznego komunikatu błędu.
   */
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

  /**
   * Test case: Zwraca status 500 w przypadku, gdy ciało żądania (request body) nie jest poprawnym JSON-em.
   * Weryfikuje obsługę błędów parsowania JSON i zwracanie generycznego komunikatu błędu serwera.
   */
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
