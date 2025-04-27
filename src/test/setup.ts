import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
// Importuj skonfigurowany serwer z handlerami
import { server } from "../mocks/server"; // Poprawiona ścieżka

// ----- Global Mocks -----
// Zamiast spyOn, sprawdźmy czy metody istnieją i dodajmy mocki, jeśli nie (dla jsdom)
// if (typeof global.URL !== 'undefined') {
//     vi.spyOn(global.URL, 'createObjectURL').mockImplementation(() => "blob:mockurl/global123");
//     vi.spyOn(global.URL, 'revokeObjectURL').mockImplementation(() => {});
// } else {
//     // Fallback, jeśli URL nie istnieje
//     vi.stubGlobal("URL", {
//         createObjectURL: vi.fn(() => "blob:mockurl/global123"),
//         revokeObjectURL: vi.fn(),
//     });
// }

// W jsdom, createObjectURL i revokeObjectURL mogą nie istnieć
if (typeof global.URL !== "undefined") {
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = vi.fn(() => "blob:mockurl/jsdom123");
  }
  if (!global.URL.revokeObjectURL) {
    global.URL.revokeObjectURL = vi.fn();
  }
} else {
  // Fallback, jeśli global.URL w ogóle nie istnieje
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mockurl/stub123"),
    revokeObjectURL: vi.fn(),
  });
}
// ------------------------

// Replace direct navigation with history.pushState to avoid jsdom navigation errors
if (typeof window !== "undefined") {
  // Stub history.pushState to prevent jsdom navigation errors
  window.history.pushState = vi.fn();
}

// Clean up after each test
afterEach(() => {
  cleanup();
  // Reset MSW handlers first
  server.resetHandlers();
  // Then restore vi mocks
  vi.restoreAllMocks();
});

// Setup MSW server for API mocking
// export const server = setupServer(); // Usuwamy to, bo importujemy skonfigurowany serwer

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterAll(() => server.close());

export { server };
