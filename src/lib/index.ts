/**
 * OpenRouter API integration
 *
 * This module provides a comprehensive integration with OpenRouter API for
 * communicating with various large language models.
 */

// Export main service
export { OpenRouterService } from "./openrouter.service";

// Export types
export type {
  ChatMessage,
  ModelParameters,
  ResponseFormat,
  RequestPayload,
  ResponsePayload,
  OpenRouterResponse,
  OpenRouterConfig,
  FlashcardProposalDto,
} from "./openrouter.types";

// Export schemas
export { openRouterConfigSchema, flashcardProposalDtoSchema } from "./openrouter.types";

// Export error classes
export { OpenRouterError, NetworkError, AuthenticationError, ResponseFormatError } from "./openrouter.types";

// Export utility functions
export {
  createJsonSchema,
  truncateChatHistory,
  sanitizeInput,
  createSystemMessage,
  combineMessages,
} from "./openrouter.utils";

// Export logger
export { logger, LogLevel } from "./openrouter.logger";
