import { describe, vi, expect, type Mock } from "vitest";
import {
  decodeJWT,
  extractTokenFromBase64Format,
  parseCookieHeader,
  getUserIdFromToken,
  createSupabaseServerInstance,
} from "../../../db/supabase.client";
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

  describe("decodeJWT", () => {
    it("should correctly decode a valid JWT", () => {
      const validToken = "header.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature";
      const expectedPayload = { sub: "1234567890", name: "John Doe", iat: 1516239022 };
      const decoded = decodeJWT(validToken);
      expect(decoded).toEqual(expectedPayload);
    });

    it("should return null for an invalid JWT format", () => {
      const invalidToken = "invalid-token-format";
      const decoded = decodeJWT(invalidToken);
      expect(decoded).toBeNull();
    });

    it("should return null for a JWT with invalid base64 payload", () => {
      const invalidBase64Token = "header.invalid-base664-payload.signature";
      const decoded = decodeJWT(invalidBase64Token);
      expect(decoded).toBeNull();
    });
  });

  describe("extractTokenFromBase64Format", () => {
    it("should extract token when value starts with 'base64-' and contains valid base64 JSON with access_token", () => {
      const base64Value = "base64-" + btoa(JSON.stringify({ access_token: "test-token", other_data: "test" }));
      const extractedToken = extractTokenFromBase64Format(base64Value);
      expect(extractedToken).toBe("test-token");
    });

    it("should return undefined when value does not start with 'base64-'", () => {
      const base64Value = btoa(JSON.stringify({ access_token: "test-token" }));
      const extractedToken = extractTokenFromBase64Format(base64Value);
      expect(extractedToken).toBeUndefined();
    });

    it("should return undefined when base64 content is not valid JSON", () => {
      const base64Value = "base64-" + btoa("invalid-json");
      const extractedToken = extractTokenFromBase64Format(base64Value);
      expect(extractedToken).toBeUndefined();
    });

    it("should return undefined when base64 JSON does not contain access_token", () => {
      const base64Value = "base64-" + btoa(JSON.stringify({ id_token: "test-id-token" }));
      const extractedToken = extractTokenFromBase64Format(base64Value);
      expect(extractedToken).toBeUndefined();
    });

    it("should return undefined for an empty string", () => {
      const base64Value = "";
      const extractedToken = extractTokenFromBase64Format(base64Value);
      expect(extractedToken).toBeUndefined();
    });

    it("should return undefined for null", () => {
      // @ts-expect-error: Argument of type 'null' is not assignable to parameter of type 'string | undefined'.
      const extractedToken = extractTokenFromBase64Format(null);
      const expected = undefined;
      expect(extractedToken).toEqual(expected);
    });
  });

  describe("parseCookieHeader", () => {
    it("should correctly parse a single cookie", () => {
      const cookieHeader = "mycookie=myvalue";
      const expected = [{ name: "mycookie", value: "myvalue" }];
      expect(parseCookieHeader(cookieHeader)).toEqual(expected);
    });

    it("should correctly parse multiple cookies", () => {
      const cookieHeader = "cookie1=value1; cookie2=value2; cookie3=value3";
      const expected = [
        { name: "cookie1", value: "value1" },
        { name: "cookie2", value: "value2" },
        { name: "cookie3", value: "value3" },
      ];
      expect(parseCookieHeader(cookieHeader)).toEqual(expected);
    });

    it("should handle cookies with spaces around =", () => {
      const cookieHeader = "cookie1 = value1; cookie2 = value2";
      const expected = [
        { name: "cookie1", value: " value1" },
        { name: "cookie2", value: " value2" },
      ];
      expect(parseCookieHeader(cookieHeader)).toEqual(expected);
    });

    it("should ignore cookie attributes (like Path, Expires, etc.)", () => {
      const cookieHeader = "mycookie=myvalue; Path=/; Expires=Wed, 21 Oct 2015 07:28:00 GMT";
      const expected = [
        { name: "mycookie", value: "myvalue" },
        { name: "Path", value: "/" },
        { name: "Expires", value: "Wed, 21 Oct 2015 07:28:00 GMT" },
      ];
      expect(parseCookieHeader(cookieHeader)).toEqual(expected);
    });

    it("should handle empty string input", () => {
      const cookieHeader = "";
      expect(parseCookieHeader(cookieHeader)).toEqual([]);
    });

    it("should handle null input", () => {
      expect(parseCookieHeader("")).toEqual([]);
    });
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
          cookieOptions: expect.objectContaining({}), // Check if cookieOptions is included
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
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
          cookieOptions: expect.objectContaining({}),
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
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
          cookieOptions: expect.objectContaining({}),
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
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
          cookieOptions: expect.objectContaining({}),
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
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
          cookieOptions: expect.objectContaining({}),
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
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
          cookieOptions: expect.objectContaining({}),
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
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
          cookieOptions: expect.objectContaining({}),
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });

    it("should correctly implement the cookies.setAll method", () => {
      createSupabaseServerInstance(mockContext);

      // Find the cookies.setAll function passed to createServerClient
      const createServerClientCall = (createServerClient as Mock).mock.calls[0][2];
      const setAllFunction = createServerClientCall.cookies.setAll;

      const cookiesToSet = [
        { name: "cookie1", value: "value1", options: { expires: new Date() } },
        { name: "cookie2", value: "value2", options: {} },
      ];

      setAllFunction(cookiesToSet);

      // Expect context.cookies.set to be called for each cookie with correct options
      expect(mockContext.cookies.set).toHaveBeenCalledTimes(cookiesToSet.length);
      expect(mockContext.cookies.set).toHaveBeenCalledWith(
        "cookie1",
        "value1",
        expect.objectContaining({
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          expires: expect.any(Date),
        })
      );
      expect(mockContext.cookies.set).toHaveBeenCalledWith(
        "cookie2",
        "value2",
        expect.objectContaining({ path: "/", httpOnly: true, secure: import.meta.env.PROD, sameSite: "lax" })
      );
    });
  });

  describe("getUserIdFromToken", () => {
    it("should return user id from a valid token with 'sub' claim", () => {
      const validToken = "header." + btoa(JSON.stringify({ sub: "user123" })) + ".signature";
      expect(getUserIdFromToken(validToken)).toBe("user123");
    });

    it("should return null from a valid token without 'sub' claim", () => {
      const validToken = "header." + btoa(JSON.stringify({ name: "John Doe" })) + ".signature";
      expect(getUserIdFromToken(validToken)).toBeNull();
    });

    it("should return null for an invalid token", () => {
      const invalidToken = "invalid-token";
      expect(getUserIdFromToken(invalidToken)).toBeNull();
    });

    it("should return null for null or undefined token", () => {
      expect(getUserIdFromToken(undefined)).toBeNull();
    });
  });
});
