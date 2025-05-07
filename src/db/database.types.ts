/**
 * Ten plik zawiera definicje typów dla bazy danych Supabase,
 * generowane automatycznie na podstawie schematu bazy danych.
 * Używaj tych typów, aby zapewnić bezpieczeństwo typów podczas
 * interakcji z bazą danych Supabase w aplikacji.
 *
 * Zawiera definicje dla tabel, widoków, funkcji i enumów,
 * a także pomocnicze typy do łatwiejszego dostępu do danych.
 */

/**
 * Typ pomocniczy reprezentujący dowolną wartość JSON.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Główny typ reprezentujący schemat bazy danych Supabase.
 * Zawiera definicje dla różnych schematów (np. 'public', 'graphql_public')
 * oraz ich zawartości (tabele, widoki, funkcje, enumy, typy złożone).
 */
export interface Database {
  /**
   * Schemat 'graphql_public' dla funkcji GraphQL.
   */
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    /**
     * Dostępne funkcje GraphQL.
     */
    Functions: {
      /**
       * Główna funkcja GraphQL.
       */
      graphql: {
        /**
         * Argumenty funkcji GraphQL.
         */
        Args: {
          /** Nazwa operacji GraphQL (opcjonalna). */
          operationName?: string;
          /** Zapytanie GraphQL (opcjonalne). */
          query?: string;
          /** Zmienne do zapytania GraphQL (opcjonalne). */
          variables?: Json;
          /** Rozszerzenia do zapytania GraphQL (opcjonalne). */
          extensions?: Json;
        };
        /**
         * Zwracana wartość funkcji GraphQL (dowolny JSON).
         */
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  /**
   * Główny schemat 'public' zawierający tabele, widoki, funkcje i enumy aplikacji.
   */
  public: {
    /**
     * Definicje tabel w schemacie 'public'.
     */
    Tables: {
      /**
       * Tabela przechowująca fiszki (flashcards).
       */
      flashcards: {
        /**
         * Typ reprezentujący wiersz w tabeli 'flashcards'.
         */
        Row: {
          /** Treść tylnej strony fiszki. */
          back: string;
          /** Sygnatura czasowa utworzenia rekordu. */
          created_at: string;
          /** Treść przedniej strony fiszki. */
          front: string;
          /** ID generacji, z której pochodzi fiszka (może być null). */
          generation_id: number | null;
          /** Unikalne ID fiszki. */
          id: number;
          /** Źródło treści fiszki (np. URL, nazwa pliku). */
          source: string;
          /** Sygnatura czasowa ostatniej aktualizacji rekordu. */
          updated_at: string;
          /** ID użytkownika, do którego należy fiszka. */
          user_id: string;
        };
        /**
         * Typ reprezentujący dane do wstawienia do tabeli 'flashcards'.
         * Pola z `?` są opcjonalne podczas wstawiania (np. generowane przez bazę danych).
         */
        Insert: {
          /** Treść tylnej strony fiszki. */
          back: string;
          /** Sygnatura czasowa utworzenia rekordu (opcjonalna, domyślnie NOW()). */
          created_at?: string;
          /** Treść przedniej strony fiszki. */
          front: string;
          /** ID generacji, z której pochodzi fiszka (opcjonalne, może być null). */
          generation_id?: number | null;
          /** Unikalne ID fiszki (opcjonalne, domyślnie generowane sekwencją). */
          id?: number;
          /** Źródło treści fiszki (np. URL, nazwa pliku). */
          source: string;
          /** Sygnatura czasowa ostatniej aktualizacji rekordu (opcjonalna, domyślnie NOW()). */
          updated_at?: string;
          /** ID użytkownika, do którego należy fiszka. */
          user_id: string;
        };
        /**
         * Typ reprezentujący dane do aktualizacji w tabeli 'flashcards'.
         * Wszystkie pola są opcjonalne podczas aktualizacji.
         */
        Update: {
          /** Treść tylnej strony fiszki (opcjonalne). */
          back?: string;
          /** Sygnatura czasowa utworzenia rekordu (opcjonalne). */
          created_at?: string;
          /** Treść przedniej strony fiszki (opcjonalne). */
          front?: string;
          /** ID generacji, z której pochodzi fiszka (opcjonalne, może być null). */
          generation_id?: number | null;
          /** Unikalne ID fiszki (opcjonalne). */
          id?: number;
          /** Źródło treści fiszki (np. URL, nazwa pliku) (opcjonalne). */
          source?: string;
          /** Sygnatura czasowa ostatniej aktualizacji rekordu (opcjonalne). */
          updated_at?: string;
          /** ID użytkownika, do którego należy fiszka (opcjonalne). */
          user_id?: string;
        };
        /**
         * Definicje relacji (kluczy obcych) dla tabeli 'flashcards'.
         */
        Relationships: [
          {
            foreignKeyName: "flashcards_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "generations";
            referencedColumns: ["id"];
          },
        ];
      };
      /**
       * Tabela przechowująca logi błędów generowania fiszek.
       */
      generation_error_logs: {
        /**
         * Typ reprezentujący wiersz w tabeli 'generation_error_logs'.
         */
        Row: {
          /** Sygnatura czasowa utworzenia rekordu. */
          created_at: string;
          /** Kod błędu. */
          error_code: string;
          /** Komunikat błędu. */
          error_message: string;
          /** Unikalne ID logu błędu. */
          id: number;
          /** Model użyty do generowania (np. nazwa modelu AI). */
          model: string;
          /** Hash tekstu źródłowego, z którego próbowano generować fiszki. */
          source_text_hash: string;
          /** Długość tekstu źródłowego. */
          source_text_length: number;
          /** ID użytkownika, który próbował wygenerować fiszki. */
          user_id: string;
        };
        /**
         * Typ reprezentujący dane do wstawienia do tabeli 'generation_error_logs'.
         * Pola z `?` są opcjonalne podczas wstawiania.
         */
        Insert: {
          /** Sygnatura czasowa utworzenia rekordu (opcjonalna, domyślnie NOW()). */
          created_at?: string;
          /** Kod błędu. */
          error_code: string;
          /** Komunikat błędu. */
          error_message: string;
          /** Unikalne ID logu błędu (opcjonalne, domyślnie generowane sekwencją). */
          id?: number;
          /** Model użyty do generowania. */
          model: string;
          /** Hash tekstu źródłowego. */
          source_text_hash: string;
          /** Długość tekstu źródłowego. */
          source_text_length: number;
          /** ID użytkownika. */
          user_id: string;
        };
        /**
         * Typ reprezentujący dane do aktualizacji w tabeli 'generation_error_logs'.
         * Wszystkie pola są opcjonalne podczas aktualizacji.
         */
        Update: {
          /** Sygnatura czasowa utworzenia rekordu (opcjonalne). */
          created_at?: string;
          /** Kod błędu (opcjonalne). */
          error_code?: string;
          /** Komunikat błędu (opcjonalne). */
          error_message?: string;
          /** Unikalne ID logu błędu (opcjonalne). */
          id?: number;
          /** Model użyty do generowania (opcjonalne). */
          model?: string;
          /** Hash tekstu źródłowego (opcjonalne). */
          source_text_hash?: string;
          /** Długość tekstu źródłowego (opcjonalne). */
          source_text_length?: number;
          /** ID użytkownika (opcjonalne). */
          user_id?: string;
        };
        /**
         * Definicje relacji dla tabeli 'generation_error_logs' (brak zdefiniowanych).
         */
        Relationships: [];
      };
      /**
       * Tabela przechowująca informacje o procesach generowania fiszek.
       */
      generations: {
        /**
         * Typ reprezentujący wiersz w tabeli 'generations'.
         */
        Row: {
          /** Liczba zaakceptowanych i edytowanych fiszek w ramach tej generacji. */
          accepted_edited_count: number;
          /** Liczba zaakceptowanych i nieedytowanych fiszek w ramach tej generacji. */
          accepted_unedited_count: number;
          /** Sygnatura czasowa utworzenia rekordu. */
          created_at: string;
          /** Całkowita liczba wygenerowanych fiszek w ramach tej generacji. */
          generated_count: number;
          /** Czas trwania procesu generowania w milisekundach. */
          generation_duration: number;
          /** Unikalne ID generacji. */
          id: number;
          /** Model użyty do generowania. */
          model: string;
          /** Hash tekstu źródłowego użytego do generowania. */
          source_text_hash: string;
          /** Długość tekstu źródłowego. */
          source_text_length: number;
          /** Sygnatura czasowa ostatniej aktualizacji rekordu. */
          updated_at: string;
          /** ID użytkownika, który zainicjował generowanie. */
          user_id: string;
        };
        /**
         * Typ reprezentujący dane do wstawienia do tabeli 'generations'.
         * Pola z `?` są opcjonalne podczas wstawiania.
         */
        Insert: {
          /** Liczba zaakceptowanych i edytowanych fiszek w ramach tej generacji. */
          accepted_edited_count: number;
          /** Liczba zaakceptowanych i nieedytowanych fiszek w ramach tej generacji. */
          accepted_unedited_count: number;
          /** Sygnatura czasowa utworzenia rekordu (opcjonalna, domyślnie NOW()). */
          created_at?: string;
          /** Całkowita liczba wygenerowanych fiszek w ramach tej generacji. */
          generated_count: number;
          /** Czas trwania procesu generowania w milisekundach. */
          generation_duration: number;
          /** Unikalne ID generacji (opcjonalne, domyślnie generowane sekwencją). */
          id?: number;
          /** Model użyty do generowania. */
          model: string;
          /** Hash tekstu źródłowego. */
          source_text_hash: string;
          /** Długość tekstu źródłowego. */
          source_text_length: number;
          /** Sygnatura czasowa ostatniej aktualizacji rekordu (opcjonalna, domyślnie NOW()). */
          updated_at?: string;
          /** ID użytkownika. */
          user_id: string;
        };
        /**
         * Typ reprezentujący dane do aktualizacji w tabeli 'generations'.
         * Wszystkie pola są opcjonalne podczas aktualizacji.
         */
        Update: {
          /** Liczba zaakceptowanych i edytowanych fiszek w ramach tej generacji (opcjonalne). */
          accepted_edited_count?: number;
          /** Liczba zaakceptowanych i nieedytowanych fiszek w ramach tej generacji (opcjonalne). */
          accepted_unedited_count?: number;
          /** Sygnatura czasowa utworzenia rekordu (opcjonalne). */
          created_at?: string;
          /** Całkowita liczba wygenerowanych fiszek (opcjonalne). */
          generated_count?: number;
          /** Czas trwania procesu generowania (opcjonalne). */
          generation_duration?: number;
          /** Unikalne ID generacji (opcjonalne). */
          id?: number;
          /** Model użyty do generowania (opcjonalne). */
          model?: string;
          /** Hash tekstu źródłowego (opcjonalne). */
          source_text_hash?: string;
          /** Długość tekstu źródłowego (opcjonalne). */
          source_text_length?: number;
          /** Sygnatura czasowa ostatniej aktualizacji rekordu (opcjonalne). */
          updated_at?: string;
          /** ID użytkownika (opcjonalne). */
          user_id?: string;
        };
        /**
         * Definicje relacji dla tabeli 'generations' (brak zdefiniowanych).
         */
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

/**
 * Typ pomocniczy reprezentujący domyślny schemat bazy danych (publiczny).
 */
type DefaultSchema = Database[Extract<keyof Database, "public">];

/**
 * Typ pomocniczy do łatwego dostępu do typów wierszy dla tabel lub widoków.
 *
 * @template DefaultSchemaTableNameOrOptions - Nazwa tabeli/widoku w domyślnym schemacie (publicznym) lub obiekt z opcją schematu.
 * @template TableName - Nazwa tabeli/widoku, jeśli podano opcję schematu.
 * @returns Typ reprezentujący wiersz danej tabeli lub widoku.
 */
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

/**
 * Typ pomocniczy do łatwego dostępu do typów danych do wstawienia (Insert) dla tabel.
 *
 * @template DefaultSchemaTableNameOrOptions - Nazwa tabeli w domyślnym schemacie (publicznym) lub obiekt z opcją schematu.
 * @template TableName - Nazwa tabeli, jeśli podano opcję schematu.
 * @returns Typ reprezentujący dane do wstawienia do danej tabeli.
 */
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

/**
 * Typ pomocniczy do łatwego dostępu do typów danych do aktualizacji (Update) dla tabel.
 *
 * @template DefaultSchemaTableNameOrOptions - Nazwa tabeli w domyślnym schemacie (publicznym) lub obiekt z opcją schematu.
 * @template TableName - Nazwa tabeli, jeśli podano opcję schematu.
 * @returns Typ reprezentujący dane do aktualizacji w danej tabeli.
 */
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

/**
 * Typ pomocniczy do łatwego dostępu do typów enumów.
 *
 * @template DefaultSchemaEnumNameOrOptions - Nazwa enuma w domyślnym schemacie (publicznym) lub obiekt z opcją schematu.
 * @template EnumName - Nazwa enuma, jeśli podano opcję schematu.
 * @returns Typ reprezentujący dany enum.
 */
export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

/**
 * Typ pomocniczy do łatwego dostępu do typów złożonych (Composite Types).
 *
 * @template PublicCompositeTypeNameOrOptions - Nazwa typu złożonego w domyślnym schemacie (publicznym) lub obiekt z opcją schematu.
 * @template CompositeTypeName - Nazwa typu złożonego, jeśli podano opcję schematu.
 * @returns Typ reprezentujący dany typ złożony.
 */
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

/**
 * Obiekt zawierający stałe związane ze schematem bazy danych (np. definicje enumów).
 */
export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
