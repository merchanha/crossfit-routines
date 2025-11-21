import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  OpenAIService,
  GeminiService,
  AIProviderFactory,
  RateLimiterService,
  CacheService,
} from './services';
import { AIInteraction } from './entities';
import { AIRateLimitGuard } from './guards';
import { AITestController } from './controllers/ai-test.controller';

/**
 * AI Module
 *
 * Central module for all AI-related functionality.
 *
 * **What it provides**:
 * - AI Provider services (OpenAI, Gemini)
 * - AI Provider Factory (with automatic fallback)
 * - Rate Limiting service and guard
 * - Cache service for cost optimization
 *
 * **Usage in other modules**:
 * ```typescript
 * @Module({
 *   imports: [AIModule],
 *   // ...
 * })
 * export class RecommendationsModule {
 *   constructor(
 *     private readonly aiProviderFactory: AIProviderFactory,
 *     private readonly rateLimiterService: RateLimiterService,
 *   ) {}
 * }
 * ```
 *
 * **@Global decorator**:
 * Makes this module globally available so other modules
 * don't need to import it explicitly.
 */
@Global()
@Module({
  imports: [
    // TypeORM for AIInteraction entity
    TypeOrmModule.forFeature([AIInteraction]),

    // Cache module for AI response caching
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('AI_CACHE_TTL') || 24 * 60 * 60, // 24 hours
        max: configService.get<number>('AI_CACHE_MAX_ITEMS') || 100, // Max items in cache
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // AI Provider implementations
    OpenAIService,
    GeminiService,

    // Factory for provider selection
    AIProviderFactory,

    // Rate limiting
    RateLimiterService,
    AIRateLimitGuard,

    // Caching
    CacheService,
  ],
  controllers: [
    AITestController, // Test endpoints for Phase 1
  ],
  exports: [
    // Export these services so other modules can use them
    OpenAIService,
    GeminiService,
    AIProviderFactory,
    RateLimiterService,
    AIRateLimitGuard,
    CacheService,
  ],
})
export class AIModule {}
