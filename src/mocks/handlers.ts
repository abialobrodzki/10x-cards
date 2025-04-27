/* eslint-disable no-console */
import { http, HttpResponse } from "msw";

// Podstawowy handler dla zapomnianego hasła
// Możemy go nadpisać w testach za pomocą server.use()
export const handlers = [
  http.post("/api/auth/forgot-password", () => {
    // Domyślna odpowiedź sukcesu
    return HttpResponse.json({}, { status: 200 });
  }),

  // Handlers for /api/auth/reset-password
  http.post("/api/auth/reset-password", async ({ request }) => {
    try {
      const body = await request.json();

      // Ensure body is an object and has a token property
      if (typeof body !== "object" || body === null || typeof body.token !== "string") {
        console.error("[MSW Handler Error] Invalid request body:", body);
        return HttpResponse.json({ error: "Invalid request format" }, { status: 400 });
      }

      const token = body.token;
      console.log(`[MSW Handler] Received token: ${token}`); // Log received token

      // Specific token for testing server error
      if (token === "fail-token") {
        console.log("[MSW Handler] Responding with server error for fail-token");
        return HttpResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      // Specific token for testing redirect
      if (token === "redirect-token") {
        console.log("[MSW Handler] Responding with redirect for redirect-token");
        return HttpResponse.json({ redirect: true, redirectTo: "/custom-login-page" }, { status: 200 });
      }

      // Specific token for testing network error
      if (token === "network-error-token") {
        console.log("[MSW Handler] Responding with network error for network-error-token");
        // Simulate network error by returning an error response.
        // The component's catch block should handle this.
        return HttpResponse.error();
      }

      // Default successful response for any other valid token (like prop-token-123)
      console.log(`[MSW Handler] Responding with success for token: ${token}`);
      return HttpResponse.json({}, { status: 200 });
    } catch (e) {
      console.error("[MSW Handler Error] Error parsing request body:", e);
      return HttpResponse.json({ error: "Server error processing request" }, { status: 500 });
    }
  }),

  // Możesz tu dodać inne handlery dla innych endpointów API
];
