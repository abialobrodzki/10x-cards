/**
 * @file Konfiguracja globalnego środowiska testowego dla Vitest.
 * Zawiera konfigurację MSW (Mock Service Worker) oraz globalne mocki dla przeglądarkowych API.
 */

import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
// Importuj skonfigurowany serwer z handlerami
import { server } from "../mocks/server"; // Poprawiona ścieżka

/**
 * Sekcja globalnych mocków.
 * Mockuje przeglądarkowe API, które mogą nie być dostępne w środowisku jsdom.
 */
// ----- Global Mocks -----
// Zamiast spyOn, sprawdźmy czy metody istnieją i dodajmy mocki, jeśli nie (dla jsdom)
// if (typeof global.URL !== 'undefined') {
//     vi.spyOn(global.URL, 'createObjectURL').mockImplementation(() => "blob:mockurl/global123");
//     vi.spyOn(global.URL, 'revokeObjectURL').mockImplementation(() => {});
// }
// else {
//     // Fallback, jeśli URL nie istnieje
//     vi.stubGlobal("URL", {
//         createObjectURL: vi.fn(() => "blob:mockurl/global123"),
//         revokeObjectURL: vi.fn(),
//     });
// }

/**
 * Mockuje metody `createObjectURL` i `revokeObjectURL` globalnego obiektu `URL`,
 * jeśli nie są one dostępne w środowisku jsdom.
 * Zapewnia spójne zachowanie podczas testów obejmujących operacje na plikach/blobach.
 */
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

/**
 * Mockuje metodę `history.pushState` obiektu `window`.
 * Zapobiega błędom nawigacji w środowisku jsdom podczas testów komponentów React korzystających z historii przeglądarki.
 */
// Replace direct navigation with history.pushState to avoid jsdom navigation errors
if (typeof window !== "undefined") {
  // Stub history.pushState to prevent jsdom navigation errors
  window.history.pushState = vi.fn();
}

/**
 * Funkcja uruchamiana po każdym teście.
 * Wykonuje czyszczenie po testach komponentów React (`cleanup`) oraz resetuje handlery MSW i mocki Vitest.
 */
afterEach(() => {
  cleanup();
  // Reset MSW handlers first
  server.resetHandlers();
  // Then restore vi mocks
  vi.restoreAllMocks();
});

// Setup MSW server for API mocking
// export const server = setupServer(); // Usuwamy to, bo importujemy skonfigurowany serwer

/**
 * Funkcja uruchamiana przed wszystkimi testami.
 * Uruchamia serwer MSW i konfiguruje go tak, aby ostrzegał o nieobsłużonych żądaniach.
 */
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

/**
 * Funkcja uruchamiana po wszystkich testach.
 * Zamyka serwer MSW.
 */
afterAll(() => server.close());

/**
 * Konfiguruje fałszywe zmienne środowiskowe dla Supabase na potrzeby testów.
 * Zapewnia dostęp do wymaganych kluczy i URL w środowisku testowym bez odwoływania się do rzeczywistych danych.
 */
// Setup fake environment variables for Supabase
const env = import.meta.env as unknown as Record<string, string>;
env.SUPABASE_URL = "http://localhost";
env.SUPABASE_KEY = "test-key";
env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
env.DEFAULT_USER_ID = "default-user-id";

export { server };
