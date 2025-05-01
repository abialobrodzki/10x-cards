/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const defaultUserId = import.meta.env.DEFAULT_USER_ID;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

// Nazwy ciasteczek używane przez Supabase
const AUTH_COOKIE_NAMES = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "sb-127-auth-token"];

// Funkcja do dekodowania tokenu JWT
export function decodeJWT(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Błąd dekodowania JWT:", e);
    return null;
  }
}

// Funkcja do wyodrębnienia tokenu JWT z formatu base64
export function extractTokenFromBase64Format(base64Value: string): string | undefined {
  try {
    if (base64Value && base64Value.startsWith("base64-")) {
      const tokenData = base64Value.substring(7); // Usunięcie prefiksu "base64-"
      const decodedData = JSON.parse(atob(tokenData));
      return decodedData.access_token || undefined;
    }
    return undefined;
  } catch (e) {
    console.error("Błąd wyodrębniania tokenu z formatu base64:", e);
    return undefined;
  }
}

// Poprawiona funkcja parsowania nagłówka Cookie
export function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
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
  // Parse cookies from the incoming request
  const cookieHeader = context.headers.get("Cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);

  // Najpierw sprawdź bezpośrednio token dostępu
  let accessToken = cookies.find((c) => c.name === "sb-access-token")?.value;

  // Jeśli nie ma standardowego tokenu, sprawdź, czy nie ma tokenu w formacie base64
  if (!accessToken) {
    const base64TokenCookie = cookies.find((c) => c.name === "sb-127-auth-token");
    if (base64TokenCookie) {
      accessToken = extractTokenFromBase64Format(base64TokenCookie.value);
      console.log("Wyodrębniono token JWT z formatu base64:", accessToken ? "Tak" : "Nie");
    }
  }

  console.log("Znaleziony token dostępu:", accessToken ? "Tak" : "Nie");

  // Analizuj token JWT, aby uzyskać informacje o użytkowniku
  if (accessToken) {
    const tokenData = decodeJWT(accessToken);
    if (tokenData) {
      console.log("Token należy do użytkownika:", tokenData.email);
      console.log("ID użytkownika z tokenu:", tokenData.sub);
    }
  }

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
    cookieOptions,
    cookies: {
      getAll() {
        return cookies;
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]): void {
        console.log("Ustawianie ciasteczek sesji:", cookiesToSet.map((cookie) => cookie.name).join(", "));
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

// Funkcja pomocnicza do pobrania ID użytkownika z tokenu JWT
export const getUserIdFromToken = (accessToken: string | undefined): string | null => {
  if (!accessToken) return null;
  const decoded = decodeJWT(accessToken);
  return decoded?.sub || null;
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
