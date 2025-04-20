/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
// Prefer service role key for server-side operations to avoid RLS/401 errors
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_KEY;
const defaultUserId = import.meta.env.DEFAULT_USER_ID;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

// Nazwy ciasteczek używane przez Supabase
const AUTH_COOKIE_NAMES = ["sb-access-token", "sb-refresh-token", "supabase-auth-token"];

// Poprawiona funkcja parsowania nagłówka Cookie
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];

  const cookies = cookieHeader.split(";").map((cookie) => {
    const [nameRaw, ...restRaw] = cookie.trim().split("=");
    const name = nameRaw.trim();
    const value = restRaw.join("=");
    return { name, value };
  });

  // Log tylko ciasteczek uwierzytelniania dla lepszej diagnostyki
  const authCookies = cookies.filter((c) => AUTH_COOKIE_NAMES.includes(c.name));
  console.log(
    "Ciasteczka uwierzytelniania:",
    authCookies.map((c) => c.name)
  );

  return cookies;
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const cookieHeader = context.headers.get("Cookie") || "";

  // Tworzymy klienta Supabase z prawidłowymi opcjami ciasteczek
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        const cookies = parseCookieHeader(cookieHeader);
        return cookies;
      },
      setAll(cookiesToSet) {
        console.log("Ustawianie ciasteczek sesji:", cookiesToSet.map((c) => c.name).join(", "));
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, {
            ...options,
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: "lax",
          });
        });
      },
    },
  });

  return supabase;
};

// Główny klient Supabase dla operacji serwerowych
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
});

export const DEFAULT_USER_ID = defaultUserId;
