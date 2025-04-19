import {
  requestPayloadSchema,
  openRouterResponseSchema,
  OpenRouterError,
  NetworkError,
  AuthenticationError,
  ResponseFormatError,
  openRouterConfigSchema,
  flashcardProposalDtoSchema,
} from "./openrouter.types";

import type {
  ChatMessage,
  ModelParameters,
  ResponseFormat,
  RequestPayload,
  ResponsePayload,
  OpenRouterResponse,
  OpenRouterConfig,
  FlashcardProposalDto,
} from "./openrouter.types";

import { logger } from "./openrouter.logger";
import { sanitizeInput, truncateChatHistory, createJsonSchema } from "./openrouter.utils";

interface CacheItem {
  response: ResponsePayload;
  timestamp: number;
}

export class OpenRouterService {
  // Public fields
  public systemMessage = "";
  public userMessage = "";
  public responseFormat?: ResponseFormat;
  public modelName: string;
  public modelParams: ModelParameters;
  public chatHistory: ChatMessage[] = [];

  // Private fields
  private apiEndpoint: string;
  private apiKey: string;
  private requestTimeout: number;
  private retryCount: number;
  private maxTokens: number;
  private responseCache = new Map<string, CacheItem>();
  private cacheExpiryTimeMs: number;

  /**
   * Constructor for OpenRouterService
   */
  constructor(config: OpenRouterConfig) {
    try {
      // Validate configuration with Zod
      const validatedConfig = openRouterConfigSchema.parse(config);

      this.apiEndpoint =
        validatedConfig.apiEndpoint ||
        import.meta.env.OPENROUTER_API_ENDPOINT ||
        "https://openrouter.ai/api/v1/chat/completions";

      this.apiKey = validatedConfig.apiKey;
      this.modelName = validatedConfig.modelName || import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4"; // Updated to use provider/model format

      this.modelParams = validatedConfig.modelParams || {
        temperature: 0.7,
        max_tokens: 2048,
      };

      this.requestTimeout = validatedConfig.requestTimeout || 60000; // 60 seconds
      this.retryCount = validatedConfig.retryCount || 3;
      this.maxTokens = validatedConfig.maxTokens || 8000;
      this.cacheExpiryTimeMs = 30 * 60 * 1000; // 30 minutes default cache expiry

      logger.info("OpenRouterService initialized", {
        endpoint: this.apiEndpoint,
        model: this.modelName,
      });
    } catch (error) {
      logger.error("Failed to initialize OpenRouterService", error);
      throw new OpenRouterError(`Configuration validation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sets the system message for the chat
   */
  public setSystemMessage(message: string): void {
    this.systemMessage = sanitizeInput(message);
  }

  /**
   * Sets the user message for the chat
   */
  public setUserMessage(message: string): void {
    this.userMessage = sanitizeInput(message);
  }

  /**
   * Sets the response format for the API request
   */
  public setResponseFormat(schema: ResponseFormat): void {
    this.responseFormat = schema;
  }

  /**
   * Sets the model name and parameters
   */
  public setModel(name: string, parameters: ModelParameters = {}): void {
    // Ensure model name is in the format "provider/model"
    if (name && !name.includes("/")) {
      name = `openai/${name}`;
    }
    this.modelName = name;
    this.modelParams = { ...this.modelParams, ...parameters };
  }

  /**
   * Configure cache settings
   */
  public setCacheConfig(expiryTimeMinutes: number): void {
    this.cacheExpiryTimeMs = expiryTimeMinutes * 60 * 1000;
    logger.debug(`Cache expiry time set to ${expiryTimeMinutes} minutes`);
  }

  /**
   * Clears the entire response cache
   */
  public clearCache(): void {
    this.responseCache.clear();
    logger.debug("Response cache cleared");
  }

  /**
   * Clears the chat history
   */
  public clearHistory(): void {
    this.chatHistory = [];
    logger.debug("Chat history cleared");
  }

  /**
   * Generate a cache key based on the request parameters
   */
  private generateCacheKey(messages: ChatMessage[], model: string, params: ModelParameters): string {
    const messagesJson = JSON.stringify(messages);
    const paramsJson = JSON.stringify(params);
    return `${messagesJson}_${model}_${paramsJson}`;
  }

  /**
   * Check if a cached response is still valid
   */
  private isCacheValid(cacheItem: CacheItem): boolean {
    const now = Date.now();
    return now - cacheItem.timestamp < this.cacheExpiryTimeMs;
  }

  /**
   * Specialized method to call OpenRouter API for flashcard generation
   */
  public async callAIService(sourceText: string): Promise<FlashcardProposalDto> {
    try {
      logger.debug("Generating flashcard proposal from source text", { textLength: sourceText.length });

      // Create a tailored system message for flashcard generation
      const flashcardSystemMessage =
        "Generate a flashcard based on the provided text. " +
        "Create a concise question for the front and a comprehensive answer for the back. " +
        "Include a helpful hint and appropriate difficulty rating. " +
        "Add relevant tags for categorization.";

      // Set up JSON schema for the response
      const responseFormat = createJsonSchema("FlashcardProposal", {
        front: { type: "string", description: "The question or prompt on the front of the flashcard" },
        back: { type: "string", description: "The answer on the back of the flashcard" },
        hint: { type: "string", description: "A helpful hint for the user" },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "The difficulty level of the flashcard",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorizing the flashcard",
        },
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(
        [
          { role: "system", content: flashcardSystemMessage },
          { role: "user", content: sourceText },
        ],
        this.modelName,
        this.modelParams
      );

      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        logger.info("Using cached flashcard proposal");
        // Explicitly cast and validate
        const flashcardData = cachedResponse.response.message as Record<string, unknown>;
        return flashcardProposalDtoSchema.parse(flashcardData);
      }

      // Build chat messages
      const chatMessages: ChatMessage[] = [
        { role: "system", content: flashcardSystemMessage },
        { role: "user", content: sourceText },
      ];

      // Build request payload
      const payload = this.buildRequestPayload(chatMessages, responseFormat, this.modelName, this.modelParams);

      // Execute the request
      const response = await this.executeRequest(payload);

      // Parse and validate response
      const parsedResponse = this.parseResponse(response);

      // Validate the response against FlashcardProposalDto schema
      const flashcardData = parsedResponse.message as Record<string, unknown>;
      const validatedFlashcard = flashcardProposalDtoSchema.parse(flashcardData);

      // Cache the response
      this.responseCache.set(cacheKey, {
        response: parsedResponse,
        timestamp: Date.now(),
      });

      return validatedFlashcard;
    } catch (error) {
      logger.error("Failed to generate flashcard proposal", error);
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(`Flashcard generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sends a chat message to the OpenRouter API
   */
  public async sendChatMessage(userMessage?: string): Promise<ResponsePayload> {
    try {
      // Use provided message or the stored one
      const message = userMessage ? sanitizeInput(userMessage) : this.userMessage;

      if (!message) {
        throw new OpenRouterError("User message is required");
      }

      // Build chat messages array
      const chatMessages: ChatMessage[] = [];

      // Add system message if exists
      if (this.systemMessage) {
        chatMessages.push({ role: "system", content: this.systemMessage });
      }

      // Add history messages, truncating if necessary to stay within token limits
      if (this.chatHistory.length > 0) {
        const truncatedHistory = truncateChatHistory(this.chatHistory, this.maxTokens);
        chatMessages.push(...truncatedHistory);
      }

      // Add current user message
      chatMessages.push({ role: "user", content: message });

      logger.debug("Sending chat message", { message });

      // Check cache first
      const cacheKey = this.generateCacheKey(chatMessages, this.modelName, this.modelParams);
      const cachedResponse = this.responseCache.get(cacheKey);

      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        logger.info("Using cached response");

        // Still update chat history
        this.chatHistory.push({ role: "user", content: message });

        if (cachedResponse.response.message) {
          this.chatHistory.push({
            role: "assistant",
            content:
              typeof cachedResponse.response.message === "string"
                ? cachedResponse.response.message
                : JSON.stringify(cachedResponse.response.message),
          });
        }

        return cachedResponse.response;
      }

      // Build request payload
      const payload = this.buildRequestPayload(chatMessages, this.responseFormat, this.modelName, this.modelParams);

      // Execute the request
      const response = await this.executeRequest(payload);

      // Parse and validate response
      const parsedResponse = this.parseResponse(response);

      // Cache the response
      this.responseCache.set(cacheKey, {
        response: parsedResponse,
        timestamp: Date.now(),
      });

      // Update chat history with user message and assistant response
      this.chatHistory.push({ role: "user", content: message });

      if (parsedResponse.message) {
        this.chatHistory.push({
          role: "assistant",
          content:
            typeof parsedResponse.message === "string"
              ? parsedResponse.message
              : JSON.stringify(parsedResponse.message),
        });
      }

      return parsedResponse;
    } catch (error) {
      this.handleInternalError(error as Error);
      throw error;
    }
  }

  /**
   * Builds the request payload for the OpenRouter API
   */
  private buildRequestPayload(
    messages: ChatMessage[],
    responseFormat?: ResponseFormat,
    modelName?: string,
    modelParams: ModelParameters = {}
  ): RequestPayload {
    // Create base payload
    const payload: RequestPayload = {
      messages,
      model: modelName || this.modelName,
      ...modelParams,
    };

    // Add response format if provided
    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    // Validate payload
    try {
      requestPayloadSchema.parse(payload);
    } catch (error) {
      logger.error("Invalid request payload", error);
      throw new OpenRouterError(`Invalid request payload: ${(error as Error).message}`);
    }

    return payload;
  }

  /**
   * Executes the API request with retry logic
   */
  private async executeRequest(payload: RequestPayload): Promise<OpenRouterResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        // Calculate backoff time with exponential increase
        if (attempt > 0) {
          const backoffTime = Math.min(2 ** attempt * 1000, 30000);
          logger.info(`Retrying request (attempt ${attempt + 1}/${this.retryCount + 1}) after ${backoffTime}ms`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        logger.debug("Sending request to OpenRouter API", {
          endpoint: this.apiEndpoint,
          model: payload.model,
        });

        const response = await fetch(this.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": import.meta.env.PUBLIC_SITE_URL || "https://10xcards.app",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle different HTTP error codes
          if (response.status === 401 || response.status === 403) {
            throw new AuthenticationError(`Authentication failed: ${response.statusText}`);
          } else if (response.status >= 500) {
            throw new NetworkError(`Server error: ${response.status} ${response.statusText}`);
          } else {
            throw new OpenRouterError(`HTTP error: ${response.status} ${response.statusText}`);
          }
        }

        const responseData = await response.json();

        // Validate response structure
        try {
          return openRouterResponseSchema.parse(responseData);
        } catch (error) {
          logger.error("Invalid API response structure", error);
          throw new ResponseFormatError(`Invalid API response structure: ${(error as Error).message}`);
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors
        if (error instanceof AuthenticationError) {
          logger.error("Authentication error", error);
          throw error;
        }

        // If it's the last attempt, throw the error
        if (attempt === this.retryCount) {
          throw lastError;
        }

        // Otherwise, continue to next attempt
        logger.warn(`Request attempt ${attempt + 1} failed`, error);
      }
    }

    // This should never happen due to the loop structure, but TypeScript requires it
    throw lastError || new Error("Unknown error occurred");
  }

  /**
   * Parses and validates the API response
   */
  private parseResponse(rawResponse: OpenRouterResponse): ResponsePayload {
    try {
      // Check if response has the expected structure
      if (
        !rawResponse ||
        !rawResponse.choices ||
        !Array.isArray(rawResponse.choices) ||
        rawResponse.choices.length === 0
      ) {
        throw new ResponseFormatError("Invalid response format: missing choices array");
      }

      const firstChoice = rawResponse.choices[0];

      if (!firstChoice.message || !firstChoice.message.content) {
        throw new ResponseFormatError("Invalid response format: missing message content");
      }

      // If response is expected to be JSON, try to parse it
      let content = firstChoice.message.content;

      if (this.responseFormat?.type === "json_schema") {
        try {
          // If content is already an object, use it as is
          if (typeof content === "object") {
            return {
              message: content,
              model: rawResponse.model,
              id: rawResponse.id,
              raw: rawResponse,
            };
          }

          // Try to parse JSON content
          content = JSON.parse(content);
        } catch (e) {
          logger.error("Failed to parse JSON response", e);
          throw new ResponseFormatError(`Failed to parse JSON response: ${(e as Error).message}`);
        }
      }

      logger.debug("Successfully parsed response", { model: rawResponse.model });

      return {
        message: content,
        model: rawResponse.model,
        id: rawResponse.id,
        raw: rawResponse,
      };
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new ResponseFormatError(`Failed to parse response: ${(error as Error).message}`);
    }
  }

  /**
   * Handles internal errors
   */
  private handleInternalError(error: Error): void {
    // Log the error through the logger service
    logger.error("OpenRouter service error", error);

    // Additional error handling logic can be added here
    // For example, metrics collection or alerting
  }
}
