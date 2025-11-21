import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIProviderInterface,
  AICompletionOptions,
  AICompletionResponse,
  AIStructuredOptions,
  AIStructuredResponse,
} from '../interfaces';
import { AIProvider } from '../enums';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';

/**
 * AI Provider Factory
 *
 * This is the orchestrator that manages multiple AI providers with automatic fallback.
 *
 * **How it works**:
 * 1. Configuration determines primary provider (default: OpenAI)
 * 2. When a request is made, it tries the primary provider first
 * 3. If primary fails, automatically fallback to secondary provider (Gemini)
 * 4. Logs which provider was used for monitoring
 *
 * **Benefits**:
 * - High availability (if one provider is down, use the other)
 * - Cost optimization (can switch to cheaper provider based on config)
 * - Provider agnostic (calling code doesn't know which provider is used)
 *
 * **Usage**:
 * ```typescript
 * // Get the appropriate provider
 * const provider = await this.aiProviderFactory.getProvider();
 *
 * // Or use the factory methods directly (with automatic fallback)
 * const response = await this.aiProviderFactory.generateCompletion("prompt");
 * ```
 */
@Injectable()
export class AIProviderFactory {
  private readonly logger = new Logger(AIProviderFactory.name);
  private readonly primaryProvider: AIProvider;
  private readonly enableFallback: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
    private readonly geminiService: GeminiService,
  ) {
    // Read configuration
    this.primaryProvider =
      (this.configService.get<string>('AI_PROVIDER') as AIProvider) ||
      AIProvider.OPENAI;

    this.enableFallback =
      this.configService.get<string>('AI_ENABLE_FALLBACK') !== 'false'; // Default: true

    this.logger.log(
      `🤖 AI Provider Factory initialized - Primary: ${this.primaryProvider}, Fallback: ${this.enableFallback ? 'enabled' : 'disabled'}`,
    );
  }

  /**
   * Get the appropriate AI provider
   *
   * This method returns an available provider based on configuration.
   * It checks availability and falls back if needed.
   *
   * @param preferredProvider - Optional: Explicitly request a specific provider
   * @returns AIProviderInterface instance
   * @throws Error if no providers are available
   */
  async getProvider(
    preferredProvider?: AIProvider,
  ): Promise<AIProviderInterface> {
    const targetProvider = preferredProvider || this.primaryProvider;

    // Try to get the target provider
    const provider = this.getProviderInstance(targetProvider);

    // Check if it's available
    const isAvailable = await provider.isAvailable();

    if (isAvailable) {
      this.logger.debug(`Using ${targetProvider} provider`);
      return provider;
    }

    // Primary provider not available, try fallback
    if (this.enableFallback && !preferredProvider) {
      this.logger.warn(
        `⚠️  ${targetProvider} not available, attempting fallback...`,
      );

      const fallbackProvider =
        targetProvider === AIProvider.OPENAI
          ? AIProvider.GEMINI
          : AIProvider.OPENAI;

      const fallback = this.getProviderInstance(fallbackProvider);
      const fallbackAvailable = await fallback.isAvailable();

      if (fallbackAvailable) {
        this.logger.warn(`✅ Using fallback provider: ${fallbackProvider}`);
        return fallback;
      }
    }

    // No providers available
    throw new Error(
      `No AI providers available. Please check your API keys and configuration.`,
    );
  }

  /**
   * Generate a completion with automatic fallback
   *
   * This is a convenience method that handles provider selection
   * and fallback logic automatically.
   *
   * @param prompt - The user's input
   * @param options - Generation options
   * @returns AI completion response with provider info
   */
  async generateCompletion(
    prompt: string,
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse> {
    const startTime = Date.now();

    try {
      // Try primary provider
      const provider = await this.getProvider();
      const response = await provider.generateCompletion(prompt, options);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Completion generated in ${duration}ms using ${response.provider}`,
      );

      return response;
    } catch (error) {
      // If primary fails and we haven't tried fallback yet, try it now
      if (this.enableFallback) {
        this.logger.warn(
          `Primary provider failed, trying fallback: ${error.message}`,
        );

        try {
          const fallbackProvider =
            this.primaryProvider === AIProvider.OPENAI
              ? AIProvider.GEMINI
              : AIProvider.OPENAI;

          const provider = this.getProviderInstance(fallbackProvider);
          const response = await provider.generateCompletion(prompt, options);

          const duration = Date.now() - startTime;
          this.logger.warn(
            `✅ Completion generated with fallback in ${duration}ms using ${response.provider}`,
          );

          return response;
        } catch (fallbackError) {
          this.logger.error(
            `❌ Both primary and fallback providers failed`,
            fallbackError,
          );
          throw new Error('All AI providers failed. Please try again later.');
        }
      }

      throw error;
    }
  }

  /**
   * Generate structured output with automatic fallback
   *
   * This is the KEY method for generating workouts and recommendations!
   * It handles provider selection and fallback automatically.
   *
   * @param prompt - The user's input
   * @param schema - JSON schema for the response
   * @param options - Generation options
   * @returns Parsed JSON response with provider info
   */
  async generateStructuredOutput<T = any>(
    prompt: string,
    schema: any,
    options?: AIStructuredOptions,
  ): Promise<AIStructuredResponse<T>> {
    const startTime = Date.now();

    try {
      // Try primary provider
      const provider = await this.getProvider();
      const response = await provider.generateStructuredOutput<T>(
        prompt,
        schema,
        options,
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Structured output generated in ${duration}ms using ${response.provider}`,
      );

      return response;
    } catch (error) {
      // If primary fails and we haven't tried fallback yet, try it now
      if (this.enableFallback) {
        this.logger.warn(
          `Primary provider failed, trying fallback: ${error.message}`,
        );

        try {
          const fallbackProvider =
            this.primaryProvider === AIProvider.OPENAI
              ? AIProvider.GEMINI
              : AIProvider.OPENAI;

          const provider = this.getProviderInstance(fallbackProvider);
          const response = await provider.generateStructuredOutput<T>(
            prompt,
            schema,
            options,
          );

          const duration = Date.now() - startTime;
          this.logger.warn(
            `✅ Structured output generated with fallback in ${duration}ms using ${response.provider}`,
          );

          return response;
        } catch (fallbackError) {
          this.logger.error(
            `❌ Both primary and fallback providers failed`,
            fallbackError,
          );
          throw new Error('All AI providers failed. Please try again later.');
        }
      }

      throw error;
    }
  }

  /**
   * Get a specific provider instance
   *
   * @param provider - The provider type to get
   * @returns AIProviderInterface instance
   */
  private getProviderInstance(provider: AIProvider): AIProviderInterface {
    switch (provider) {
      case AIProvider.OPENAI:
        return this.openaiService;
      case AIProvider.GEMINI:
        return this.geminiService;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  /**
   * Get status of all providers
   *
   * Useful for health checks and monitoring dashboards
   *
   * @returns Status of each provider
   */
  async getProvidersStatus(): Promise<
    Record<AIProvider, { available: boolean; isPrimary: boolean }>
  > {
    const [openaiAvailable, geminiAvailable] = await Promise.all([
      this.openaiService.isAvailable(),
      this.geminiService.isAvailable(),
    ]);

    return {
      [AIProvider.OPENAI]: {
        available: openaiAvailable,
        isPrimary: this.primaryProvider === AIProvider.OPENAI,
      },
      [AIProvider.GEMINI]: {
        available: geminiAvailable,
        isPrimary: this.primaryProvider === AIProvider.GEMINI,
      },
    };
  }
}
