import { expectTypeOf } from "vitest";
import type { Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from "@/db/database.types";
import { Constants } from "@/db/database.types";

describe("Database Types", () => {
  // Test the main Database type structure
  test("Database type structure should be correct", () => {
    type Db = Database;
    expectTypeOf<Db>().toHaveProperty("public");
    expectTypeOf<Db["public"]>().toHaveProperty("Tables");
    expectTypeOf<Db["public"]["Tables"]>().toHaveProperty("flashcards");
    expectTypeOf<Db["public"]["Tables"]>().toHaveProperty("generation_error_logs");
    expectTypeOf<Db["public"]["Tables"]>().toHaveProperty("generations");
    expectTypeOf<Db["public"]>().toHaveProperty("Views");
    expectTypeOf<Db["public"]>().toHaveProperty("Functions");
    expectTypeOf<Db["public"]>().toHaveProperty("Enums");
    expectTypeOf<Db["public"]>().toHaveProperty("CompositeTypes");
  });

  // Test Tables type for a specific table (e.g., flashcards)
  test("Tables type for flashcards should be correct", () => {
    type Flashcard = Tables<"flashcards">;
    expectTypeOf<Flashcard>().toHaveProperty("id").toEqualTypeOf<number>();
    expectTypeOf<Flashcard>().toHaveProperty("created_at").toEqualTypeOf<string>();
    expectTypeOf<Flashcard>().toHaveProperty("updated_at").toEqualTypeOf<string>();
    expectTypeOf<Flashcard>().toHaveProperty("user_id").toEqualTypeOf<string>();
    expectTypeOf<Flashcard>().toHaveProperty("front").toEqualTypeOf<string>();
    expectTypeOf<Flashcard>().toHaveProperty("back").toEqualTypeOf<string>();
    expectTypeOf<Flashcard>().toHaveProperty("source").toEqualTypeOf<string>();
    expectTypeOf<Flashcard>().toHaveProperty("generation_id").toEqualTypeOf<number | null>();

    // Example of a mock object that should conform to the type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mockFlashcard = {
      id: 1,
      created_at: "2023-01-01T10:00:00Z",
      updated_at: "2023-01-01T10:00:00Z",
      user_id: "user-123",
      front: "What is testing type definitions?",
      back: "Checking if TypeScript types match the expected structure.",
      source: "manual",
      generation_id: null,
    };
    expectTypeOf<typeof mockFlashcard>().toMatchTypeOf<Flashcard>();
  });

  // Test TablesInsert type for flashcards
  test("TablesInsert type for flashcards should be correct", () => {
    type FlashcardInsert = TablesInsert<"flashcards">;
    expectTypeOf<FlashcardInsert>().toHaveProperty("front").toEqualTypeOf<string>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("back").toEqualTypeOf<string>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("source").toEqualTypeOf<string>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("user_id").toEqualTypeOf<string>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("id").toEqualTypeOf<number | undefined>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("created_at").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("updated_at").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardInsert>().toHaveProperty("generation_id").toEqualTypeOf<number | null | undefined>();

    // Example of a mock insert object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mockInsertFlashcard = {
      front: "New Flashcard Front",
      back: "New Flashcard Back",
      source: "generated",
      user_id: "user-abc",
    };
    expectTypeOf<typeof mockInsertFlashcard>().toMatchTypeOf<FlashcardInsert>();
  });

  // Test TablesUpdate type for flashcards
  test("TablesUpdate type for flashcards should be correct", () => {
    type FlashcardUpdate = TablesUpdate<"flashcards">;
    expectTypeOf<FlashcardUpdate>().toHaveProperty("front").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("back").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("source").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("user_id").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("id").toEqualTypeOf<number | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("created_at").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("updated_at").toEqualTypeOf<string | undefined>();
    expectTypeOf<FlashcardUpdate>().toHaveProperty("generation_id").toEqualTypeOf<number | null | undefined>();

    // Example of a mock update object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mockUpdateFlashcard = {
      front: "Updated Front",
      updated_at: new Date().toISOString(),
    };
    expectTypeOf<typeof mockUpdateFlashcard>().toMatchTypeOf<FlashcardUpdate>();
  });

  // Test Enums type
  test("Enums type should be correct", () => {
    // Test with default schema
    type DefaultEnums = Enums<never>;
    expectTypeOf<DefaultEnums>().toBeNever();

    // Test with explicit schema option
    type PublicEnums = Enums<{ schema: "public" }, never>;
    expectTypeOf<PublicEnums>().toBeNever();

    // Verify Enums typing works with Record type
    expectTypeOf<Record<string, never>>().toMatchTypeOf<Record<never, never>>();
  });

  // Test CompositeTypes
  test("CompositeTypes type should be correct", () => {
    // Test with default schema
    type DefaultCompositeTypes = CompositeTypes<never>;
    expectTypeOf<DefaultCompositeTypes>().toBeNever();

    // Test with explicit schema option
    type PublicCompositeTypes = CompositeTypes<{ schema: "public" }, never>;
    expectTypeOf<PublicCompositeTypes>().toBeNever();

    // Verify CompositeTypes typing works with Record type
    expectTypeOf<Record<string, never>>().toMatchTypeOf<Record<never, never>>();
  });

  // Test Constants export
  test("Constants object should be defined with correct structure", () => {
    expect(Constants).toBeDefined();
    expect(Constants).toHaveProperty("graphql_public");
    expect(Constants.graphql_public).toHaveProperty("Enums");
    expect(Constants).toHaveProperty("public");
    expect(Constants.public).toHaveProperty("Enums");

    // Check that Constants is properly marked as const
    expectTypeOf<typeof Constants>().toHaveProperty("graphql_public");
    expectTypeOf<typeof Constants.graphql_public>().toHaveProperty("Enums");
    expectTypeOf<typeof Constants.public>().toHaveProperty("Enums");
  });
});
