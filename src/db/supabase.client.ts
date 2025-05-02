/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const defaultUserId = import.meta.env.DEFAULT_USER_ID;

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  // Determine Supabase URL and keys from runtime import.meta.env stubbed by Vitest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtimeEnv = (globalThis as any)["import.meta.env"] as Record<string, string> | undefined;
  const url = runtimeEnv?.SUPABASE_URL ?? supabaseUrl;
  // Zawsze używaj publicznego klucza anon z SUPABASE_KEY
  const anonKey = runtimeEnv?.SUPABASE_KEY ?? import.meta.env.SUPABASE_KEY;

  if (!anonKey) {
    console.error("BŁĄD KRYTYCZNY: Brak klucza anonimowego Supabase (SUPABASE_KEY)!");
    throw new Error("Brak konfiguracji klucza anonimowego Supabase.");
  }

  // Create Supabase client with runtime URL and the guaranteed anon key
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, options);
      },
      remove(key, options) {
        context.cookies.delete(key, options);
      },
    },
  });

  return supabase;
};

// Główny klient Supabase dla operacji serwerowych
export const supabaseClient = createClient<Database>(supabaseUrl, import.meta.env.SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  global: {
    headers: {
      apikey: import.meta.env.SUPABASE_KEY,
      Authorization: `Bearer ${import.meta.env.SUPABASE_KEY}`,
    },
  },
});

/**
 * UWAGA: To ID nie powinno być używane w normalnym przepływie aplikacji.
 * Aplikacja powinna polegać wyłącznie na zalogowanych użytkownikach.
 * Użycie tego ID jest dopuszczalne tylko w testach lub środowisku deweloperskim.
 * @deprecated Nie używaj w endpointach API - zamiast tego zwracaj 401 Unauthorized gdy użytkownik nie jest zalogowany.
 */
export const DEFAULT_USER_ID = defaultUserId;
