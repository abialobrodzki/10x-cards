/* eslint-disable no-console */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { APIContext } from "astro";
import type { Database } from "./database.types";

// Rozszerzony typ APIContext dla środowiska Cloudflare Pages z dostępem do .env
interface CloudflareAPIContext extends APIContext {
  env: {
    // Definiujemy strukturę env, która powinna być dostępna w Cloudflare Pages
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    DEFAULT_USER_ID?: string;
    // Dodaj tutaj inne zmienne środowiskowe, jeśli są potrzebne i dostępne w .env
  };
}

// Re-eksportuj typ SupabaseClient dla spójności
export type { SupabaseClient };

const defaultUserId = import.meta.env.DEFAULT_USER_ID;

export const createSupabaseServerInstance = (context: CloudflareAPIContext) => {
  let supabaseUrl: string | undefined;
  let supabaseKey: string | undefined;
  let sourceDescription = "unknown";

  // Primary check: context.env (standard for Astro adapters like Cloudflare Pages)
  if (context.env && typeof context.env.SUPABASE_URL === "string" && typeof context.env.SUPABASE_KEY === "string") {
    sourceDescription = "context.env";
    console.log(`createSupabaseServerInstance: Attempting to use ${sourceDescription}`);
    supabaseUrl = context.env.SUPABASE_URL;
    supabaseKey = context.env.SUPABASE_KEY;
  } else if (
    // Fallback: Cloudflare Runtime Environment Variables via locals.runtime.env
    context.locals &&
    "runtime" in context.locals &&
    context.locals.runtime &&
    "env" in context.locals.runtime &&
    context.locals.runtime.env
  ) {
    sourceDescription = "context.locals.runtime.env";
    console.log(`createSupabaseServerInstance: Attempting to use ${sourceDescription}`);
    const runtimeEnv = context.locals.runtime.env;
    supabaseUrl = runtimeEnv.SUPABASE_URL;
    supabaseKey = runtimeEnv.SUPABASE_KEY;
  } else {
    // Log why the primary check failed
    console.log(`createSupabaseServerInstance: context.locals.runtime.env not found or empty.`);
    if (context.locals && "runtime" in context.locals && context.locals.runtime) {
      console.log(
        "createSupabaseServerInstance: context.locals.runtime exists, logging its keys:",
        Object.keys(context.locals.runtime)
      );
    } else {
      console.log("createSupabaseServerInstance: context.locals or context.locals.runtime is undefined.");
    }

    if (import.meta.env.DEV) {
      // Fallback 2: import.meta.env (dev fallback)
      sourceDescription = "import.meta.env (dev fallback)";
      console.log(`createSupabaseServerInstance: Attempting to use ${sourceDescription}`);
      supabaseUrl = import.meta.env.SUPABASE_URL;
      supabaseKey = import.meta.env.SUPABASE_KEY;
    } else {
      // In production/deployment, if runtime.env wasn't found, we should fail.
      sourceDescription = "production environment (runtime.env expected but not found)";
      console.error(`createSupabaseServerInstance: Failed to find runtime env variables in non-DEV environment.`);
      // Explicitly set to undefined to trigger errors below
      supabaseUrl = undefined;
      supabaseKey = undefined;
    }
  }

  console.log(
    `createSupabaseServerInstance: Trying to get URL from ${sourceDescription}: ${supabaseUrl ? "FOUND" : "NOT FOUND"}`
  );
  console.log(
    `createSupabaseServerInstance: Trying to get Key from ${sourceDescription}: ${supabaseKey ? "FOUND" : "NOT FOUND"}`
  );

  if (!supabaseUrl) {
    console.error(
      `BŁĄD KRYTYCZNY: Brak adresu URL Supabase (SUPABASE_URL) w zmiennych środowiskowych ${sourceDescription}!`
    );
    throw new Error("Brak konfiguracji adresu URL Supabase.");
  }
  if (!supabaseKey) {
    console.error(
      `BŁAD KRYTYCZNY: Brak klucza Supabase (SUPABASE_KEY) w zmiennych środowiskowych ${sourceDescription}!`
    );
    throw new Error("Brak konfiguracji klucza Supabase.");
  }

  console.log("createSupabaseServerInstance: Creating Supabase client...");

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
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

/**
 * UWAGA: To ID nie powinno być używane w normalnym przepływie aplikacji.
 * Aplikacja powinna polegać wyłącznie na zalogowanych użytkownikach.
 * Użycie tego ID jest dopuszczalne tylko w testach lub środowisku deweloperskim.
 * @deprecated Nie używaj w endpointach API - zamiast tego zwracaj 401 Unauthorized gdy użytkownik nie jest zalogowany.
 */
export const DEFAULT_USER_ID = defaultUserId;
