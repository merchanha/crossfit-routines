import { AIProvider } from '../enums';

/**
 * Options for AI completion requests
 */
export interface AICompletionOptions {
  temperature?: number; // Creativity level (0-2, default: 1)
  maxTokens?: number; // Maximum response length
  model?: string; // Specific model to use
  systemPrompt?: string; // System instructions
}

/**
 * Response from AI completion
 */
export interface AICompletionResponse {
  content: string; // The generated text
  provider: AIProvider; // Which provider was used
  model: string; // Which model was used
  tokensUsed: number; // Total tokens consumed
  finishReason: string; // Why generation stopped (e.g., 'stop', 'length')
}

/**
 * Options for structured output requests
 * Used when we need JSON responses that match a specific schema
 */
export interface AIStructuredOptions extends AICompletionOptions {
  schema?: any; // JSON schema for response validation
  examples?: any[]; // Few-shot learning examples
}

/**
 * Response from structured AI request
 */
export interface AIStructuredResponse<T = any> extends AICompletionResponse {
  data: T; // Parsed JSON data matching the schema
  rawContent: string; // Original JSON string
}

/**
 * Abstract interface that all AI providers must implement
 *
 * This ensures OpenAI and Gemini services are interchangeable
 * and can be swapped via the Factory pattern.
 */
export abstract class AIProviderInterface {
  /**
   * Get the provider type
   */
  abstract getProviderType(): AIProvider;

  /**
   * Check if the provider is properly configured and available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Generate a text completion from a prompt
   *
   * Use this for open-ended text generation like:
   * - Generating workout descriptions
   * - Creating coaching tips
   * - Explaining exercise techniques
   *
   * @param prompt - The user's input prompt
   * @param options - Configuration options (temperature, maxTokens, etc.)
   * @returns The AI-generated response
   */
  abstract generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse>;

  /**
   * Generate structured output (JSON) from a prompt
   *
   * Use this when you need the AI to return data in a specific format:
   * - Generating workout routines with exercises array
   * - Creating recommendations with specific fields
   * - Parsing user input into structured data
   *
   * @param prompt - The user's input prompt
   * @param schema - JSON schema defining the expected structure
   * @param options - Configuration options
   * @returns Parsed and validated JSON data
   */
  abstract generateStructuredOutput<T = any>(
    prompt: string,
    schema: any,
    options?: AIStructuredOptions,
  ): Promise<AIStructuredResponse<T>>;

  /**
   * Count tokens in a text string
   *
   * Useful for:
   * - Estimating costs before making requests
   * - Ensuring prompts don't exceed limits
   * - Analytics and monitoring
   *
   * @param text - The text to count tokens for
   * @returns Number of tokens
   */
  abstract countTokens(text: string): Promise<number>;
}
