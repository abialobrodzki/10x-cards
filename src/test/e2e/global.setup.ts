/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

async function globalSetup() {
  // Wyświetl informację o rozpoczęciu zestawu testów E2E
  console.log("Global Setup: Rozpoczynam zestaw testów E2E...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn(
      "OSTRZEŻENIE: SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY nie są ustawione. Testy mogą nie działać poprawnie z bazą danych."
    );
  } else {
    // Dodajemy informacje diagnostyczne o używanej konfiguracji Supabase dla testów
    console.log(`Global Setup: Używany Supabase URL: ${supabaseUrl}`);
    const keyLength = supabaseServiceRoleKey.length;
    const keyStart = supabaseServiceRoleKey.substring(0, 5);
    const keyEnd = supabaseServiceRoleKey.substring(keyLength - 5, keyLength);
    console.log(`Global Setup: Klucz service-role ma długość ${keyLength} znaków [${keyStart}...${keyEnd}]`);

    // Opcjonalnie: można tu dodać szybki test połączenia, ale bez czyszczenia
    try {
      const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { apikey: supabaseServiceRoleKey, Authorization: `Bearer ${supabaseServiceRoleKey}` } },
      });
      const { error } = await supabase.from("flashcards").select("id", { count: "exact", head: true });
      if (error) {
        console.error("Global Setup: Błąd połączenia z Supabase:", error.message);
      } else {
        console.log("Global Setup: Połączenie z Supabase nawiązane pomyślnie.");
      }
    } catch (e) {
      console.error("Global Setup: Nieoczekiwany błąd podczas testu połączenia z Supabase:", e);
    }
  }

  console.log("Global Setup: Zakończono konfigurację początkową.");
}

export default globalSetup;
