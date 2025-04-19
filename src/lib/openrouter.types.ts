import { z } from "zod";

// Chat message types
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Model configuration
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Response format for structured outputs
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

// API request payload
export interface RequestPayload {
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// API response structure
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: ChatRole;
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Structured response payload
export interface ResponsePayload {
  message: string | Record<string, unknown>;
  model: string;
  id: string;
  raw: OpenRouterResponse;
}

// Flashcard Proposal DTO
export interface FlashcardProposalDto {
  front: string;
  back: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

// Configuration for OpenRouterService
export interface OpenRouterConfig {
  apiEndpoint?: string;
  apiKey: string;
  modelName?: string;
  modelParams?: ModelParameters;
  requestTimeout?: number;
  retryCount?: number;
  maxTokens?: number;
}

// Custom error types
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class NetworkError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthenticationError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ResponseFormatError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = "ResponseFormatError";
  }
}

// Zod validation schemas
export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const responseFormatSchema = z.object({
  type: z.literal("json_schema"),
  json_schema: z.object({
    name: z.string(),
    strict: z.boolean(),
    schema: z.record(z.unknown()),
  }),
});

export const requestPayloadSchema = z.object({
  messages: z.array(chatMessageSchema),
  response_format: responseFormatSchema.optional(),
  model: z.string(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  top_p: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
});

export const openRouterResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
      index: z.number(),
      finish_reason: z.string(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

// Zod validation schema for OpenRouterConfig
export const openRouterConfigSchema = z
  .object({
    apiEndpoint: z.string().url().optional(),
    apiKey: z.string().min(1, "API key is required"),
    modelName: z.string().optional(),
    modelParams: z
      .object({
        temperature: z.number().min(0).max(1).optional(),
        max_tokens: z.number().positive().optional(),
        top_p: z.number().min(0).max(1).optional(),
        frequency_penalty: z.number().min(-2).max(2).optional(),
        presence_penalty: z.number().min(-2).max(2).optional(),
      })
      .optional(),
    requestTimeout: z.number().positive().optional(),
    retryCount: z.number().nonnegative().optional(),
    maxTokens: z.number().positive().optional(),
  })
  .strict();

// Zod validation schema for FlashcardProposalDto
export const flashcardProposalDtoSchema = z
  .object({
    front: z.string().min(1, "Front text is required"),
    back: z.string().min(1, "Back text is required"),
    hint: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    tags: z.array(z.string()),
  })
  .strict();
