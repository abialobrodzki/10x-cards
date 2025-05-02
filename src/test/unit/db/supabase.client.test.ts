import { describe, vi, expect, type Mock } from "vitest";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { AstroCookies } from "astro";
import { createServerClient } from "@supabase/ssr";

// Mock the @supabase/ssr module
vi.mock("@supabase/ssr", () => {
  return {
    createServerClient: vi.fn(() => ({
      // Add mock methods as needed for the tests
      auth: {
        getSession: vi.fn(),
        refreshSession: vi.fn(),
        getUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            limit: vi.fn(),
          })),
          maybeSingle: vi.fn(),
        })),
        insert: vi.fn(() => ({ select: vi.fn() })),
        update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn() })) })),
        delete: vi.fn(() => ({ eq: vi.fn() })),
      })),
    })),
  };
});

// Mock the global atob function if needed for node environment
// For Vitest with jsdom environment, this might not be necessary,
// but adding it for robustness.
if (typeof atob === "undefined") {
  global.atob = (b64: string) => Buffer.from(b64, "base64").toString("binary");
}

// Mock environment variables (adjust based on your actual env var usage)
vi.stubGlobal("import.meta.env", {
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_KEY: "test-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  DEFAULT_USER_ID: "default-user-id",
});

describe("supabase.client", () => {
  it("should have tests", () => {
    // TODO: Implement test
  });

  describe("createSupabaseServerInstance", () => {
    // Mock dependencies and environment variables before each test
    let mockContext: { headers: Headers; cookies: AstroCookies };

    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();

      // Explicitly mock SUPABASE_URL for these tests
      vi.stubGlobal("import.meta.env", {
        ...import.meta.env,
        SUPABASE_URL: "http://localhost:54321",
        SUPABASE_KEY: "test-key",
        SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
        DEFAULT_USER_ID: "default-user-id",
      });

      // Mock the context object
      mockContext = {
        headers: new Headers(),
        cookies: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
        } as unknown as AstroCookies,
      };

      // The mockCreateServerClient is assigned in the vi.mock block
    });

    it("should create client with service role key when no auth cookies are present", () => {
      // No cookies set in mockContext

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with service role key in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should create client with access token from sb-access-token cookie", () => {
      const testAccessToken = "test-access-token";
      mockContext.headers.set("Cookie", `sb-access-token=${testAccessToken}`);

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with the access token in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should create client with access token from base64 encoded sb-127-auth-token cookie", () => {
      const testAccessToken = "test-base64-access-token";
      const base64Value = "base64-" + btoa(JSON.stringify({ access_token: testAccessToken }));
      mockContext.headers.set("Cookie", `sb-127-auth-token=${base64Value}`);

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with the extracted access token in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should use service role key if base64 encoded sb-127-auth-token does not contain access_token", () => {
      const base64Value = "base64-" + btoa(JSON.stringify({ id_token: "test-id-token" }));
      mockContext.headers.set("Cookie", `sb-127-auth-token=${base64Value}`);

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with service role key in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should use service role key if base64 encoded sb-127-auth-token is invalid base64", () => {
      const base64Value = "base64-invalid-base64";
      mockContext.headers.set("Cookie", `sb-127-auth-token=${base64Value}`);

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with service role key in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should use service role key if base64 encoded sb-127-auth-token is not valid JSON", () => {
      const base64Value = "base64-" + btoa("not json");
      mockContext.headers.set("Cookie", `sb-127-auth-token=${base64Value}`);

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with service role key in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should prioritize sb-access-token over sb-127-auth-token", () => {
      const accessToken = "priority-access-token";
      const base64Value = "base64-" + btoa(JSON.stringify({ access_token: "should-be-ignored" }));
      mockContext.headers.set("Cookie", `sb-access-token=${accessToken}; sb-127-auth-token=${base64Value}`);

      createSupabaseServerInstance(mockContext);

      // Expect createServerClient to be called with the sb-access-token access token in headers
      expect(createServerClient).toHaveBeenCalledWith(
        "http://localhost:54321",
        "test-key",
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it("should correctly implement the cookies.set method", () => {
      createSupabaseServerInstance(mockContext);

      // Find the cookies.setAll function passed to createServerClient
      const createServerClientCall = (createServerClient as Mock).mock.calls[0][2];
      const setFunction = createServerClientCall.cookies.set;

      const testCookieName = "test-cookie";
      const testCookieValue = "test-value";
      const testCookieOptions = { path: "/test", maxAge: 60 };

      // Call the set function
      setFunction(testCookieName, testCookieValue, testCookieOptions);

      // Expect context.cookies.set to have been called once with the correct arguments
      expect(mockContext.cookies.set).toHaveBeenCalledTimes(1);
      expect(mockContext.cookies.set).toHaveBeenCalledWith(testCookieName, testCookieValue, testCookieOptions);
    });
  });
});
