/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: {
        id: string;
        [key: string]: unknown;
      } | null;
      // Cloudflare Pages runtime environment
      runtime: {
        env: {
          SUPABASE_URL: string;
          SUPABASE_KEY: string;
          OPENROUTER_API_KEY?: string;
          PAGES_URL?: string; // Cloudflare Pages dynamic URL
        };
        [key: string]: unknown;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
