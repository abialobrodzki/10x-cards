/**
 * Example usage of the OpenRouter service
 *
 * This file demonstrates how to use the OpenRouter service to communicate with AI models.
 */
import { OpenRouterService } from "./openrouter.service";
import type { ResponseFormat } from "./openrouter.types";

/* eslint-disable no-console */

/**
 * Basic usage example with a simple text request
 */
async function basicExample(): Promise<void> {
  // Initialize the service with your API key
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    modelName: "gpt-3.5-turbo", // or any other model supported by OpenRouter
  });

  // Set a system message
  service.setSystemMessage("You are a helpful assistant that provides concise answers.");

  // Send a message and get a response
  try {
    const response = await service.sendChatMessage("What is the capital of France?");
    console.log("Response:", response.message);
  } catch (error) {
    console.error("Error in basic example:", error);
  }
}

/**
 * Advanced usage example with structured responses
 */
async function structuredResponseExample(): Promise<void> {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    modelName: "gpt-4",
    modelParams: {
      temperature: 0.2, // Lower temperature for more deterministic responses
      max_tokens: 500,
    },
  });

  // Define a JSON schema for structured response
  const responseFormat: ResponseFormat = {
    type: "json_schema",
    json_schema: {
      name: "CapitalInfo",
      strict: true,
      schema: {
        capital: {
          type: "string",
          description: "The capital city name",
        },
        country: {
          type: "string",
          description: "The country name",
        },
        population: {
          type: "number",
          description: "Approximate population of the capital",
        },
        landmarks: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Famous landmarks in the capital",
        },
      },
    },
  };

  // Set system message and response format
  service.setSystemMessage("You provide accurate information about capital cities in a structured format.");
  service.setResponseFormat(responseFormat);

  // Send a message expecting a structured response
  try {
    const response = await service.sendChatMessage("Tell me about Paris");

    // The response.message should be a structured object
    const capitalInfo = response.message as Record<string, unknown>;

    console.log("Capital:", capitalInfo.capital);
    console.log("Country:", capitalInfo.country);
    console.log("Population:", capitalInfo.population);
    console.log("Landmarks:", capitalInfo.landmarks);
  } catch (error) {
    console.error("Error in structured response example:", error);
  }
}

/**
 * Chat history example showing a conversation flow
 */
async function chatConversationExample(): Promise<void> {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  service.setSystemMessage("You are a travel advisor helping a customer plan their vacation.");

  try {
    // First message
    let response = await service.sendChatMessage("I'm planning a trip to Japan for two weeks. What should I know?");
    console.log("Assistant:", response.message);

    // Follow-up message (will include previous context)
    response = await service.sendChatMessage("What's the best time of year to visit?");
    console.log("Assistant:", response.message);

    // Another follow-up
    response = await service.sendChatMessage("What about transportation between cities?");
    console.log("Assistant:", response.message);

    // Chat history is automatically maintained by the service
    console.log("Chat history length:", service.chatHistory.length);
  } catch (error) {
    console.error("Error in conversation example:", error);
  }
}

// Run examples
export async function runExamples(): Promise<void> {
  console.log("Running basic example...");
  await basicExample();

  console.log("\nRunning structured response example...");
  await structuredResponseExample();

  console.log("\nRunning chat conversation example...");
  await chatConversationExample();
}

// This can be called from a page or component
// runExamples().catch(console.error);
