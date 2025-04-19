/**
 * Utility functions for working with OpenRouter service
 */
import type { ChatMessage, ResponseFormat } from "./openrouter.types";
import { logger } from "./openrouter.logger";

/**
 * Creates a response format schema for structured JSON outputs
 */
export function createJsonSchema(name: string, schema: Record<string, unknown>, strict = true): ResponseFormat {
  return {
    type: "json_schema",
    json_schema: {
      name,
      strict,
      schema,
    },
  };
}

/**
 * Utility to extract a chat history up to a specified number of tokens
 * to prevent token limit issues while maintaining context
 */
export function truncateChatHistory(
  messages: ChatMessage[],
  maxTokens = 4000,
  estimatedTokensPerMessage = 4
): ChatMessage[] {
  if (!messages.length) return [];

  // Simple token estimation - 4 tokens per word on average
  const estimateTokens = (text: string): number => {
    return text.split(/\s+/).length * estimatedTokensPerMessage;
  };

  const result: ChatMessage[] = [];
  let tokenCount = 0;

  // Process messages from newest (end) to oldest (beginning)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = estimateTokens(message.content);

    // If adding this message would exceed the limit, stop
    if (tokenCount + messageTokens > maxTokens) {
      break;
    }

    // Add message to the beginning (to maintain chronological order)
    result.unshift(message);
    tokenCount += messageTokens;
  }

  logger.debug(`Truncated chat history: ${messages.length} -> ${result.length} messages`);
  return result;
}

/**
 * Sanitizes user input for security
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;

  // Basic sanitization - remove potential script tags and dangerous patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .trim();
}

/**
 * Creates a system message for specific use cases
 */
export function createSystemMessage(type: "general" | "json" | "coding" | "creative"): string {
  switch (type) {
    case "general":
      return "You are a helpful assistant providing accurate and concise information.";
    case "json":
      return "You are a helpful assistant that always responds in valid JSON format. You keep your responses structured according to the schema provided.";
    case "coding":
      return "You are a coding assistant that provides clear, efficient, and well-documented code examples with explanations. You follow best practices and prioritize readability.";
    case "creative":
      return "You are a creative assistant that provides imaginative, original, and engaging content. You think outside the box and offer unique perspectives.";
    default:
      return "You are a helpful assistant.";
  }
}

/**
 * Combines multiple chat messages into a single context message
 * Useful for summarizing a conversation or creating a compact history
 */
export function combineMessages(messages: ChatMessage[], prefix = "Previous conversation: "): ChatMessage {
  const combinedContent = messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n\n");

  return {
    role: "system",
    content: `${prefix}${combinedContent}`,
  };
}
