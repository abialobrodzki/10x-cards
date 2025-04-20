import type { Database } from "./db/database.types";

// Base Types from Database Tables
export type FlashcardEntity = Database["public"]["Tables"]["flashcards"]["Row"];
export type GenerationEntity = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLogEntity = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// Allowed Flashcard Source Types
export type FlashcardSourceType = "ai-full" | "ai-edited" | "manual";

// ============= Flashcard DTOs =============

// Base Flashcard DTO without user_id (for responses)
export type FlashcardDto = Omit<FlashcardEntity, "user_id">;

// Flashcard Creation DTO
export interface CreateFlashcardDto {
  front: string;
  back: string;
  source: FlashcardSourceType;
  generation_id?: number | null;
}

// Multiple Flashcards Creation DTO
export interface CreateFlashcardsDto {
  flashcards: CreateFlashcardDto[];
}

// Flashcard Update DTO
export type UpdateFlashcardDto = Partial<CreateFlashcardDto>;

// Flashcard List Response DTO
export interface FlashcardListResponseDto {
  flashcards: FlashcardDto[];
  total: number;
}

// ============= Generation DTOs =============

// Generation Request DTO
export interface GenerateFlashcardsRequestDto {
  text: string;
  language?: string; // Optional language code (e.g. 'pl', 'en')
}

// Basic Generation Response DTO (subset of fields)
export type BasicGenerationDto = Pick<
  GenerationEntity,
  "id" | "generated_count" | "accepted_unedited_count" | "accepted_edited_count" | "created_at" | "updated_at" | "model"
>;

// Full Generation DTO without user_id (for responses)
export type GenerationDto = Omit<GenerationEntity, "user_id">;

// Generation with AI-generated Flashcards Response
export interface GenerationWithFlashcardsResponseDto {
  generation: BasicGenerationDto;
  flashcards: Omit<CreateFlashcardDto, "generation_id">[];
}

// Generation List Response DTO
export interface GenerationListResponseDto {
  generations: GenerationDto[];
  total: number;
}

// Generation Detail Response DTO
export interface GenerationDetailResponseDto {
  generation: GenerationDto;
  flashcards?: FlashcardDto[];
}

// ============= Accept Flashcards DTOs =============

// Accept Flashcards Request DTO
export interface AcceptFlashcardsRequestDto {
  flashcards: CreateFlashcardDto[];
}

// Generation Update after Accept DTO
export type GenerationUpdateDto = Pick<
  GenerationEntity,
  "id" | "accepted_unedited_count" | "accepted_edited_count" | "updated_at"
>;

// Accept Flashcards Response DTO
export interface AcceptFlashcardsResponseDto {
  generation: GenerationUpdateDto;
  flashcards: Pick<FlashcardDto, "id" | "front" | "back" | "source" | "created_at">[];
}

// ============= Generation Error Log DTOs =============

// Error Log DTO without user_id (for responses)
export type GenerationErrorLogDto = Omit<GenerationErrorLogEntity, "user_id">;

// Error Log List Response DTO
export interface GenerationErrorLogListResponseDto {
  logs: GenerationErrorLogDto[];
  total: number;
}

// ============= Study Session DTOs =============

// Flashcard with next_review date for study sessions
export type StudyFlashcardDto = Pick<FlashcardDto, "id" | "front" | "back" | "source"> & {
  next_review: string;
};

// Study Session Response DTO
export interface StudySessionResponseDto {
  flashcards: StudyFlashcardDto[];
}

// Flashcard Review Request DTO
export interface FlashcardReviewRequestDto {
  flashcard_id: number;
  quality: number; // 0-5 rating
}

// Flashcard Review Response DTO
export interface FlashcardReviewResponseDto {
  flashcard_id: number;
  next_review: string;
}

// ============= Pagination and Filtering =============

// Common pagination parameters
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Flashcard Filtering Parameters
export type FlashcardFilterParams = PaginationParams & {
  sort_by?: keyof FlashcardDto;
  sortOrder?: "asc" | "desc";
  generation_id?: number;
  source?: FlashcardSourceType;
  searchText?: string;
};

// Generation Filtering Parameters
export type GenerationFilterParams = PaginationParams & {
  sort_by?: keyof GenerationDto;
};

// Error Log Filtering Parameters
export type ErrorLogFilterParams = PaginationParams & {
  error_code?: string;
};

// Study Session Parameters
export interface StudySessionParams {
  limit?: number;
}

// ============= Error Response DTOs =============

// Standardowa odpowiedź błędu walidacji (400 Bad Request)
export interface ValidationErrorResponseDto {
  error: string;
}

// Standardowa odpowiedź błędu wewnętrznego (500 Internal Server Error)
export interface InternalErrorResponseDto {
  error: string;
  details?: string;
}

// Standardowa odpowiedź błędu typu "Not Found" (404 Not Found)
export interface NotFoundErrorResponseDto {
  error: string;
}

// Standardowa odpowiedź błędu autoryzacji (401 Unauthorized, 403 Forbidden)
export interface AuthErrorResponseDto {
  error: string;
}
