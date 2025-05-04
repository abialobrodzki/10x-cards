/* eslint-disable no-console */
import { createServerClient } from "@supabase/ssr";
import type { APIContext } from "astro";
import type { Database } from "./database.types";

const defaultUserId = import.meta.env.DEFAULT_USER_ID;

export const createSupabaseServerInstance = (context: APIContext) => {
  let supabaseUrl: string | undefined;
  let supabaseKey: string | undefined;
  let sourceDescription = "unknown";

  // Primary check: Cloudflare Runtime Environment Variables
  if (context.locals.runtime?.env) {
    sourceDescription = "context.locals.runtime.env";
    console.log(`createSupabaseServerInstance: Attempting to use ${sourceDescription}`);
    // Log the actual content to be sure (this log will only show in wrangler dev or if deployed with logs)
    // console.log(JSON.stringify(context.locals.runtime.env, null, 2));
    supabaseUrl = context.locals.runtime.env.SUPABASE_URL;
    supabaseKey = context.locals.runtime.env.SUPABASE_KEY;
  } else {
    // Log why the primary check failed
    console.log(`createSupabaseServerInstance: context.locals.runtime.env not found or empty.`);
    if (context.locals.runtime) {
      console.log(
        "createSupabaseServerInstance: context.locals.runtime exists, logging its keys:",
        Object.keys(context.locals.runtime)
      );
    } else {
      console.log("createSupabaseServerInstance: context.locals.runtime does not exist.");
    }

    // Fallback ONLY for local development (import.meta.env.DEV is true)
    if (import.meta.env.DEV) {
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
      `BŁĄD KRYTYCZNY: Brak klucza Supabase (SUPABASE_KEY) w zmiennych środowiskowych ${sourceDescription}!`
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
