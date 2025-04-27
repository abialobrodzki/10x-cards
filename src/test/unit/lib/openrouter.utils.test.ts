import { describe, it, expect } from "vitest";
import {
  createJsonSchema,
  truncateChatHistory,
  sanitizeInput,
  createSystemMessage,
  combineMessages,
} from "../../../lib/openrouter.utils";
import type { ChatMessage } from "../../../lib/openrouter.types";

describe("openrouter.utils", () => {
  describe("createJsonSchema", () => {
    it("should create a JSON schema object with default strictness", () => {
      const schema = { type: "object", properties: { name: { type: "string" } } };
      const result = createJsonSchema("Person", schema);
      expect(result).toEqual({
        type: "json_schema",
        json_schema: {
          name: "Person",
          strict: true,
          schema,
        },
      });
    });

    it("should create a JSON schema object with specified strictness", () => {
      const schema = { type: "array" };
      const result = createJsonSchema("List", schema, false);
      expect(result).toEqual({
        type: "json_schema",
        json_schema: {
          name: "List",
          strict: false,
          schema,
        },
      });
    });
  });

  describe("truncateChatHistory", () => {
    it("should return an empty array for empty messages", () => {
      expect(truncateChatHistory([])).toEqual([]);
    });

    it("should return all messages if within token limit", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ];
      expect(truncateChatHistory(messages, 100)).toEqual(messages);
    });

    it("should truncate messages to fit within token limit", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "This is a long message that should be truncated" }, // ~40 words * 4 tokens/word = 160 tokens
        { role: "assistant", content: "short reply" }, // ~2 words * 4 tokens/word = 8 tokens
        { role: "user", content: "another message" }, // ~2 words * 4 tokens/word = 8 tokens
      ];
      // With maxTokens = 20, should only keep the last message
      const result = truncateChatHistory(messages, 20);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ role: "assistant", content: "short reply" });
      expect(result[1]).toEqual({ role: "user", content: "another message" });
    });

    it("should handle case where first message exceeds limit", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "Extremely long message that will exceed any reasonable token limit easily" },
        { role: "assistant", content: "short reply" },
      ];
      // With maxTokens = 10, should return empty array
      expect(truncateChatHistory(messages, 10)).toEqual([{ role: "assistant", content: "short reply" }]);
    });

    it("should handle different estimatedTokensPerMessage", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "message one" }, // 2 words
        { role: "assistant", content: "message two" }, // 2 words
        { role: "user", content: "message three" }, // 2 words
      ];
      // With estimatedTokensPerMessage = 1 and maxTokens = 5, should keep last two messages (4 tokens)
      const result = truncateChatHistory(messages, 5, 1);
      expect(result.length).toBe(2);
      expect(result).toEqual([
        { role: "assistant", content: "message two" },
        { role: "user", content: "message three" },
      ]);
    });
  });

  describe("sanitizeInput", () => {
    it("should return the same string if no dangerous content", () => {
      const input = "Hello world";
      expect(sanitizeInput(input)).toBe(input);
    });

    it("should remove script tags", () => {
      const input = 'Hello <script>alert("xss")</script> world';
      expect(sanitizeInput(input)).toBe("Hello  world");
    });

    it("should remove javascript: protocol", () => {
      const input = 'Click <a href="javascript:alert(1)">here</a>';
      expect(sanitizeInput(input)).toBe('Click <a href="">here</a>');
    });

    it("should handle empty string", () => {
      expect(sanitizeInput("")).toBe("");
    });

    it("should handle null or undefined input", () => {
      // @ts-expect-error: Testing null/undefined input
      expect(sanitizeInput(null)).toBe(null);
      // @ts-expect-error: Testing null/undefined input
      expect(sanitizeInput(undefined)).toBe(undefined);
    });

    it("should trim whitespace", () => {
      const input = "  leading and trailing  ";
      expect(sanitizeInput(input)).toBe("leading and trailing");
    });
  });

  describe("createSystemMessage", () => {
    it('should return the correct message for "general" type', () => {
      expect(createSystemMessage("general")).toBe(
        "You are a helpful assistant providing accurate and concise information."
      );
    });

    it('should return the correct message for "json" type', () => {
      expect(createSystemMessage("json")).toBe(
        "You are a helpful assistant that always responds in valid JSON format. You keep your responses structured according to the schema provided."
      );
    });

    it('should return the correct message for "coding" type', () => {
      expect(createSystemMessage("coding")).toBe(
        "You are a coding assistant that provides clear, efficient, and well-documented code examples with explanations. You follow best practices and prioritize readability."
      );
    });

    it('should return the correct message for "creative" type', () => {
      expect(createSystemMessage("creative")).toBe(
        "You are a creative assistant that provides imaginative, original, and engaging content. You think outside the box and offer unique perspectives."
      );
    });

    it("should return the default message for unknown type", () => {
      // @ts-expect-error: Testing unknown type
      expect(createSystemMessage("unknown")).toBe("You are a helpful assistant.");
    });
  });

  describe("combineMessages", () => {
    it("should return a system message with empty content for empty messages array", () => {
      const result = combineMessages([]);
      expect(result).toEqual({ role: "system", content: "Previous conversation:" });
    });

    it("should combine a single message", () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
      const result = combineMessages(messages);
      expect(result).toEqual({ role: "system", content: "Previous conversation:user: Hello" });
    });

    it("should combine multiple messages", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "How can I help?" },
      ];
      const result = combineMessages(messages);
      expect(result).toEqual({
        role: "system",
        content: "Previous conversation:user: Hi\n\nassistant: How can I help?",
      });
    });

    it("should combine messages with a custom prefix", () => {
      const messages: ChatMessage[] = [{ role: "user", content: "Test" }];
      const result = combineMessages(messages, "History: ");
      expect(result).toEqual({ role: "system", content: "History: user: Test" });
    });
  });
});
