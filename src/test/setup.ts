import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";

// Konfiguracja baseURL dla happy-dom
if (typeof window !== "undefined") {
  // Ustaw bazowy URL dla środowiska testowego
  window.location.href = "http://localhost:3000";
}

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Setup MSW server for API mocking
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
