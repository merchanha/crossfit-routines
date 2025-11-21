import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIProviderInterface,
  AICompletionOptions,
  AICompletionResponse,
  AIStructuredOptions,
  AIStructuredResponse,
} from '../interfaces';
import { AIProvider } from '../enums';

/**
 * OpenAI Service - Primary AI Provider
 *
 * Implements the AIProviderInterface using OpenAI's GPT models.
 * This is our primary provider with Gemini as fallback.
 *
 * Supports:
 * - GPT-4 Turbo (best quality, more expensive)
 * - GPT-3.5 Turbo (faster, cheaper)
 * - Structured JSON responses
 * - Token counting and cost estimation
 */
@Injectable()
export class OpenAIService extends AIProviderInterface {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI | null = null;
  private readonly defaultModel: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    super();

    // Get configuration from environment variables
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.defaultModel =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4-turbo-preview';

    // Initialize OpenAI client if API key is provided
    if (apiKey) {
      try {
        this.client = new OpenAI({
          apiKey,
        });
        this.isConfigured = true;
        this.logger.log(
          `✅ OpenAI service initialized with model: ${this.defaultModel}`,
        );
      } catch (error) {
        this.logger.error('❌ Failed to initialize OpenAI client:', error);
        this.isConfigured = false;
      }
    } else {
      this.logger.warn(
        '⚠️  OpenAI API key not configured. Service will not be available.',
      );
      this.isConfigured = false;
    }
  }

  /**
   * Returns the provider type
   */
  getProviderType(): AIProvider {
    return AIProvider.OPENAI;
  }

  /**
   * Check if OpenAI is available
   * Returns false if API key is missing or client failed to initialize
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured || !this.client) {
      return false;
    }

    // If client is initialized, consider it available
    // We'll handle quota/rate limit errors during actual requests
    return true;
  }

  /**
   * Generate a text completion
   *
   * Example usage:
   * ```typescript
   * const response = await openaiService.generateCompletion(
   *   "Explain the benefits of burpees",
   *   { temperature: 0.7, maxTokens: 200 }
   * );
   * console.log(response.content);
   * ```
   */
  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 1;
    const maxTokens = options?.maxTokens || 1000;

    this.logger.debug(`Generating completion with model: ${model}`);
    this.logger.debug(`Prompt length: ${prompt.length} characters`);

    try {
      // Build messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt if provided
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add user prompt
      messages.push({
        role: 'user',
        content: prompt,
      });

      // Make API call
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed =
        completion.usage?.total_tokens || this.estimateTokens(prompt + content);

      this.logger.log(
        `✅ Completion generated: ${tokensUsed} tokens, model: ${model}`,
      );

      return {
        content,
        provider: AIProvider.OPENAI,
        model,
        tokensUsed,
        finishReason: completion.choices[0]?.finish_reason || 'unknown',
      };
    } catch (error) {
      this.logger.error('❌ OpenAI completion failed:', error);
      throw error;
    }
  }

  /**
   * Generate structured output (JSON)
   *
   * This is the KEY method for our features!
   * We'll use this to generate workout routines and recommendations.
   *
   * Example usage:
   * ```typescript
   * const schema = {
   *   type: "object",
   *   properties: {
   *     name: { type: "string" },
   *     exercises: { type: "array", items: { type: "object" } }
   *   }
   * };
   *
   * const response = await openaiService.generateStructuredOutput(
   *   "Create a 30-minute cardio workout",
   *   schema
   * );
   * console.log(response.data); // Parsed JSON object
   * ```
   */
  async generateStructuredOutput<T = any>(
    prompt: string,
    schema: any,
    options?: AIStructuredOptions,
  ): Promise<AIStructuredResponse<T>> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7; // Lower temp for structured output
    const maxTokens = options?.maxTokens || 2000;

    this.logger.debug(`Generating structured output with model: ${model}`);

    try {
      // Build system prompt for JSON generation
      let systemPrompt = options?.systemPrompt || '';
      systemPrompt += `\n\nYou must respond with valid JSON that matches this schema:\n${JSON.stringify(schema, null, 2)}`;

      // Add examples if provided (few-shot learning)
      if (options?.examples && options.examples.length > 0) {
        systemPrompt += '\n\nExamples:\n';
        options.examples.forEach((example, index) => {
          systemPrompt += `\nExample ${index + 1}:\n${JSON.stringify(example, null, 2)}`;
        });
      }

      systemPrompt +=
        '\n\nRespond ONLY with the JSON object. No additional text or explanation.';

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Use JSON mode if available (GPT-4 and GPT-3.5-turbo support this)
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }, // Force JSON response
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Parse JSON
      let parsedData: T;
      try {
        parsedData = JSON.parse(rawContent);
      } catch (parseError) {
        this.logger.error('Failed to parse AI response as JSON:', rawContent);
        throw new Error('AI returned invalid JSON');
      }

      this.logger.log(
        `✅ Structured output generated: ${tokensUsed} tokens, model: ${model}`,
      );

      return {
        content: rawContent,
        data: parsedData,
        rawContent,
        provider: AIProvider.OPENAI,
        model,
        tokensUsed,
        finishReason: completion.choices[0]?.finish_reason || 'unknown',
      };
    } catch (error) {
      this.logger.error('❌ OpenAI structured output failed:', error);
      throw error;
    }
  }

  /**
   * Count tokens in a text string
   *
   * OpenAI uses tiktoken for accurate counting, but we'll use a simple estimation.
   * For production, consider integrating the tiktoken library.
   *
   * Rule of thumb: 1 token ≈ 4 characters (for English text)
   */
  async countTokens(text: string): Promise<number> {
    return this.estimateTokens(text);
  }

  /**
   * Simple token estimation
   * This is approximate - for precise counting, use tiktoken library
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    // This is conservative (overestimates slightly)
    return Math.ceil(text.length / 4);
  }
}
