/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

async function globalTeardown() {
  // Wyświetl informację o rozpoczęciu czyszczenia
  console.log("Cleaning up generated flashcards...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("BŁĄD: SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY nie są ustawione w środowisku.");
    console.error("Sprawdź plik .env.test lub zmienne środowiskowe CI/CD.");
    return;
  }

  // Dodajemy ważne informacje diagnostyczne - pokaż kilka znaków klucza dla weryfikacji
  if (supabaseServiceRoleKey) {
    const keyLength = supabaseServiceRoleKey.length;
    const keyStart = supabaseServiceRoleKey.substring(0, 5);
    const keyEnd = supabaseServiceRoleKey.substring(keyLength - 5, keyLength);
    console.log(`Klucz service-role ma długość ${keyLength} znaków [${keyStart}...${keyEnd}]`);
  }

  try {
    // Utwórz klienta Supabase z uprawnieniami administratora (service role) i dokładną konfiguracją
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      },
    });

    console.log("Próba połączenia z bazą danych Supabase...");

    // Testuj połączenie
    try {
      const { error: testError } = await supabase.from("flashcards").select("count", { count: "exact", head: true });

      if (testError) {
        console.error("BŁĄD POŁĄCZENIA TESTOWEGO:", testError.message);
        console.error("Kod błędu:", testError.code);
        console.error("Szczegóły:", testError.details);
      } else {
        console.log("Pomyślnie połączono z bazą danych Supabase");
      }
    } catch (testErr) {
      console.error("Nieoczekiwany błąd podczas testu połączenia:", testErr);
    }

    // 1. Pobierz i wyświetl wszystkie identyfikatory fiszek przed usunięciem (dla diagnostyki)
    try {
      const { data: flashcardsList, error: listError } = await supabase
        .from("flashcards")
        .select("id, user_id, front")
        .limit(50);

      if (listError) {
        console.error("BŁĄD: Nie udało się pobrać listy fiszek:", listError.message);
        console.error("Kod błędu:", listError.code);
      } else {
        console.log(
          `Znaleziono ${flashcardsList?.length || 0} fiszek do usunięcia:`,
          flashcardsList?.map((f) => `ID: ${f.id}, User: ${f.user_id}, Front: ${f.front?.substring(0, 20)}...`)
        );
      }
    } catch (err) {
      console.error("Nieoczekiwany błąd podczas pobierania listy fiszek:", err);
    }

    // 2. Liczenie istniejących fiszek
    try {
      const { count: initialFlashcardsCount, error: countError } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true });

      if (countError) {
        console.error("BŁĄD: Nie udało się policzyć fiszek:", countError.message);
      } else {
        console.log(`Znaleziono ${initialFlashcardsCount ?? 0} fiszek do usunięcia.`);
      }

      // 3. Usuń wszystkie fiszki (bez filtrowania po ID, usuwamy wszystkie)
      const { error: flashcardsError } = await supabase.from("flashcards").delete().neq("id", 0); // Ten warunek zadziała dla każdego rekordu, ponieważ id nigdy nie jest 0

      if (flashcardsError) {
        console.error("BŁĄD: Nie udało się usunąć fiszek:", flashcardsError.message);
        console.error("Kod błędu:", flashcardsError.code);
      } else {
        console.log(`Usunięto ${initialFlashcardsCount ?? 0} fiszek.`);
      }
    } catch (err) {
      console.error("Nieoczekiwany błąd podczas usuwania fiszek:", err);
    }

    // 4. Sprawdź, czy usunięcie się powiodło
    try {
      const { count: afterDeleteCount, error: afterDeleteError } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true });

      if (afterDeleteError) {
        console.error("BŁĄD: Nie udało się zweryfikować usunięcia fiszek:", afterDeleteError.message);
      } else {
        console.log(`Po usunięciu pozostało ${afterDeleteCount ?? 0} fiszek.`);
        if (afterDeleteCount && afterDeleteCount > 0) {
          console.warn("UWAGA: Nie wszystkie fiszki zostały usunięte!");
        }
      }
    } catch (err) {
      console.error("Nieoczekiwany błąd podczas weryfikacji usunięcia fiszek:", err);
    }

    // 5. Usuń rekordy generacji
    try {
      const { count: initialGenerationsCount, error: genCountError } = await supabase
        .from("generations")
        .select("id", { count: "exact", head: true });

      if (genCountError) {
        console.error("BŁĄD: Nie udało się policzyć rekordów generacji:", genCountError.message);
      } else {
        console.log(`Znaleziono ${initialGenerationsCount ?? 0} rekordów generacji do usunięcia.`);
      }

      const { error: generationsError } = await supabase.from("generations").delete().neq("id", 0);

      if (generationsError) {
        console.error("BŁĄD: Nie udało się usunąć rekordów generacji:", generationsError.message);
      } else {
        console.log(`Usunięto ${initialGenerationsCount ?? 0} rekordów generacji.`);
      }
    } catch (err) {
      console.error("Nieoczekiwany błąd podczas usuwania rekordów generacji:", err);
    }
  } catch (error: unknown) {
    console.error("BŁĄD KRYTYCZNY podczas czyszczenia bazy danych:", (error as Error).message);
    console.error("Stack trace:", (error as Error).stack);
  }
}

export default globalTeardown;
