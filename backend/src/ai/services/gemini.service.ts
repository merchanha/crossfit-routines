import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
} from '@google/generative-ai';
import {
  AIProviderInterface,
  AICompletionOptions,
  AICompletionResponse,
  AIStructuredOptions,
  AIStructuredResponse,
} from '../interfaces';
import { AIProvider } from '../enums';

/**
 * Gemini Service - Fallback AI Provider
 *
 * Implements the AIProviderInterface using Google's Gemini models.
 * This is our fallback provider when OpenAI is unavailable or fails.
 *
 * Supports:
 * - Gemini Pro (comparable to GPT-3.5, cheaper than OpenAI)
 * - Structured JSON responses
 * - Free tier: 60 requests/minute
 */
@Injectable()
export class GeminiService extends AIProviderInterface {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private readonly defaultModel: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    super();

    // Get configuration from environment variables
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.defaultModel =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';

    // Initialize Gemini client if API key is provided
    if (apiKey) {
      try {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({
          model: this.defaultModel,
        });
        this.isConfigured = true;
        this.logger.log(
          `✅ Gemini service initialized with model: ${this.defaultModel}`,
        );
      } catch (error) {
        this.logger.error('❌ Failed to initialize Gemini client:', error);
        this.isConfigured = false;
      }
    } else {
      this.logger.warn(
        '⚠️  Gemini API key not configured. Service will not be available.',
      );
      this.isConfigured = false;
    }
  }

  /**
   * Returns the provider type
   */
  getProviderType(): AIProvider {
    return AIProvider.GEMINI;
  }

  /**
   * Check if Gemini is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured || !this.model) {
      return false;
    }

    // If client and model are initialized, consider it available
    // We'll handle errors during actual requests
    return true;
  }

  /**
   * Generate a text completion
   *
   * Example usage:
   * ```typescript
   * const response = await geminiService.generateCompletion(
   *   "Explain the benefits of burpees",
   *   { temperature: 0.7 }
   * );
   * console.log(response.content);
   * ```
   */
  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse> {
    if (!this.model) {
      throw new Error('Gemini client not initialized');
    }

    const temperature = options?.temperature ?? 1;
    const maxTokens = options?.maxTokens || 1000;

    this.logger.debug(`Generating completion with Gemini`);
    this.logger.debug(`Prompt length: ${prompt.length} characters`);

    try {
      // Build the generation config
      const generationConfig: GenerationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      // Combine system prompt and user prompt if system prompt provided
      let fullPrompt = prompt;
      if (options?.systemPrompt) {
        fullPrompt = `${options.systemPrompt}\n\nUser: ${prompt}`;
      }

      // Generate content
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = result.response;
      const content = response.text();

      // Gemini doesn't provide token counts directly, so we estimate
      const tokensUsed = this.estimateTokens(fullPrompt + content);

      this.logger.log(
        `✅ Completion generated with Gemini: ~${tokensUsed} tokens`,
      );

      return {
        content,
        provider: AIProvider.GEMINI,
        model: this.defaultModel,
        tokensUsed,
        finishReason: 'stop', // Gemini doesn't provide this, assume 'stop'
      };
    } catch (error) {
      this.logger.error('❌ Gemini completion failed:', error);
      throw error;
    }
  }

  /**
   * Generate structured output (JSON)
   *
   * Gemini doesn't have a built-in JSON mode like OpenAI,
   * so we use careful prompting to get valid JSON responses.
   *
   * Example usage:
   * ```typescript
   * const schema = {
   *   type: "object",
   *   properties: {
   *     name: { type: "string" },
   *     exercises: { type: "array" }
   *   }
   * };
   *
   * const response = await geminiService.generateStructuredOutput(
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
    if (!this.model) {
      throw new Error('Gemini client not initialized');
    }

    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || 2000;

    this.logger.debug(`Generating structured output with Gemini`);

    try {
      // Build system prompt for JSON generation
      let systemPrompt = options?.systemPrompt || '';
      systemPrompt += `\n\nYou are a helpful assistant that ONLY responds with valid JSON.`;
      systemPrompt += `\n\nThe JSON must match this exact schema:\n${JSON.stringify(schema, null, 2)}`;

      // Add examples if provided (few-shot learning)
      if (options?.examples && options.examples.length > 0) {
        systemPrompt += '\n\nHere are examples of correct responses:\n';
        options.examples.forEach((example, index) => {
          systemPrompt += `\nExample ${index + 1}:\n${JSON.stringify(example, null, 2)}`;
        });
      }

      systemPrompt += '\n\nIMPORTANT RULES:';
      systemPrompt += '\n1. Respond ONLY with the JSON object';
      systemPrompt += '\n2. Do NOT include any text before or after the JSON';
      systemPrompt += '\n3. Do NOT use markdown code blocks (no ```json)';
      systemPrompt += '\n4. Ensure all JSON is valid and properly formatted';
      systemPrompt += '\n5. Match the schema exactly';

      const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

      // Generate content
      const generationConfig: GenerationConfig = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      let rawContent = result.response.text();

      // Gemini sometimes wraps JSON in markdown code blocks, clean it up
      rawContent = this.cleanJsonResponse(rawContent);

      const tokensUsed = this.estimateTokens(fullPrompt + rawContent);

      // Parse JSON
      let parsedData: T;
      try {
        parsedData = JSON.parse(rawContent);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse Gemini response as JSON:',
          rawContent,
        );

        // Try to extract JSON from the response
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
            rawContent = jsonMatch[0];
          } catch {
            throw new Error('Gemini returned invalid JSON');
          }
        } else {
          throw new Error('Gemini returned invalid JSON');
        }
      }

      this.logger.log(
        `✅ Structured output generated with Gemini: ~${tokensUsed} tokens`,
      );

      return {
        content: rawContent,
        data: parsedData,
        rawContent,
        provider: AIProvider.GEMINI,
        model: this.defaultModel,
        tokensUsed,
        finishReason: 'stop',
      };
    } catch (error) {
      this.logger.error('❌ Gemini structured output failed:', error);
      throw error;
    }
  }

  /**
   * Count tokens in a text string
   */
  async countTokens(text: string): Promise<number> {
    return this.estimateTokens(text);
  }

  /**
   * Simple token estimation
   * Same as OpenAI: 1 token ≈ 4 characters
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Clean JSON response from Gemini
   * Removes markdown code blocks and extra whitespace
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.trim();

    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\s*```$/, '');
    }

    return cleaned.trim();
  }
}
