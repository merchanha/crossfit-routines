import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AIProviderFactory } from '../services/ai-provider.factory';
import { RateLimiterService } from '../services/rate-limiter.service';
import { CacheService } from '../services/cache.service';
import { AIRateLimitGuard } from '../guards/ai-rate-limit.guard';
import { SkipAIRateLimit } from '../decorators/skip-ai-rate-limit.decorator';

/**
 * AI Test Controller
 *
 * Endpoints for testing AI infrastructure components.
 * These are temporary endpoints for Phase 1 testing.
 *
 * **Important**: Remove or secure these endpoints before production!
 */
@ApiTags('AI Testing')
@Controller('ai/test')
export class AITestController {
  constructor(
    private readonly aiProviderFactory: AIProviderFactory,
    private readonly rateLimiterService: RateLimiterService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Test 1: Check provider availability
   *
   * Tests which AI providers are configured and available.
   * No authentication required.
   *
   * @returns Status of each provider
   */
  @Public()
  @Get('providers/status')
  @ApiOperation({ summary: 'Check AI provider availability' })
  async checkProviders() {
    const status = await this.aiProviderFactory.getProvidersStatus();

    return {
      message: 'AI Provider Status',
      providers: status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test 2: Simple text completion
   *
   * Tests basic AI completion without rate limiting.
   * Requires authentication.
   *
   * @param userId - User ID from JWT
   * @returns AI-generated response
   */
  @UseGuards(JwtAuthGuard)
  @SkipAIRateLimit()
  @Post('completion/simple')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test simple text completion' })
  async testSimpleCompletion(
    @UserId() userId: string,
    @Body('prompt')
    prompt: string = 'Explain the benefits of burpees in 2 sentences',
  ) {
    const startTime = Date.now();

    try {
      const response = await this.aiProviderFactory.generateCompletion(prompt, {
        temperature: 0.7,
        maxTokens: 200,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        response: {
          content: response.content,
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
        },
        performance: {
          durationMs: duration,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test 3: Structured JSON output
   *
   * Tests AI structured output (the key method for our features).
   * No rate limiting.
   *
   * @param userId - User ID from JWT
   * @returns AI-generated JSON
   */
  @UseGuards(JwtAuthGuard)
  @SkipAIRateLimit()
  @Post('completion/structured')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test structured JSON output' })
  async testStructuredOutput(@UserId() userId: string) {
    const startTime = Date.now();

    const prompt = 'Create a simple 3-exercise workout routine';

    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        estimatedDuration: { type: 'number' },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sets: { type: 'number' },
              reps: { type: 'number' },
              notes: { type: 'string' },
            },
          },
        },
      },
    };

    try {
      const response = await this.aiProviderFactory.generateStructuredOutput(
        prompt,
        schema,
        {
          temperature: 0.8,
          maxTokens: 500,
        },
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        response: {
          data: response.data,
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
        },
        performance: {
          durationMs: duration,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test 4: Rate limiting
   *
   * Tests rate limiting enforcement.
   * Make 4 requests in a row - the 4th should fail.
   *
   * @param userId - User ID from JWT
   * @returns Rate limit status
   */
  @UseGuards(JwtAuthGuard, AIRateLimitGuard)
  @Post('rate-limit/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test rate limiting (3 requests allowed)' })
  async testRateLimit(@UserId() userId: string) {
    // This endpoint has rate limiting enabled
    // The guard will handle enforcement

    const rateLimitCheck = await this.rateLimiterService.checkRateLimit(userId);

    // Record this as a test interaction
    await this.rateLimiterService.recordInteraction(userId, {
      interactionType: 'generation' as any,
      prompt: 'Rate limit test',
      aiProvider: 'openai' as any,
      status: 'success' as any,
      tokensUsed: 0,
    });

    return {
      message: 'Rate limit test - this request was allowed',
      rateLimit: rateLimitCheck,
      tip: 'Make 4 requests in a row. The 4th should return 429 error.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test 5: Check user's rate limit status
   *
   * Shows current rate limit status without consuming a request.
   *
   * @param userId - User ID from JWT
   * @returns Current rate limit info
   */
  @UseGuards(JwtAuthGuard)
  @Get('rate-limit/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check current rate limit status' })
  async getRateLimitStatus(@UserId() userId: string) {
    const rateLimitCheck = await this.rateLimiterService.checkRateLimit(userId);
    const usageStats = await this.rateLimiterService.getUserUsageStats(
      userId,
      7,
    );

    return {
      currentStatus: rateLimitCheck,
      last7Days: usageStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test 6: Cache functionality
   *
   * Make the same request twice to test caching.
   * Second request should be instant.
   *
   * @param userId - User ID from JWT
   * @returns Cached vs fresh response timing
   */
  @UseGuards(JwtAuthGuard)
  @SkipAIRateLimit()
  @Post('cache/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test caching (make request twice)' })
  async testCache(@UserId() userId: string) {
    const cacheKey = `test-${userId}`;

    // Check if cached
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return {
        message: 'Response served from cache ⚡',
        cached: true,
        data: cached,
        tip: 'This was instant! Make a different request to test fresh generation.',
        timestamp: new Date().toISOString(),
      };
    }

    // Generate fresh response
    const startTime = Date.now();

    try {
      const response = await this.aiProviderFactory.generateCompletion(
        'List 3 benefits of functional fitness',
        {
          temperature: 0.7,
          maxTokens: 150,
        },
      );

      const duration = Date.now() - startTime;

      // Cache the response
      await this.cacheService.set(cacheKey, response, {}, 300); // 5 min TTL

      return {
        message: 'Fresh response generated and cached',
        cached: false,
        response: {
          content: response.content,
          provider: response.provider,
          tokensUsed: response.tokensUsed,
        },
        performance: {
          durationMs: duration,
        },
        tip: 'Make the same request again within 5 minutes to see cache in action!',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test 7: Clear cache
   *
   * Clears all AI caches.
   *
   * @returns Success message
   */
  @UseGuards(JwtAuthGuard)
  @Post('cache/clear')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all AI caches' })
  async clearCache() {
    await this.cacheService.clear();

    return {
      message: 'All AI caches cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test 8: Reset user's rate limit
   *
   * Admin function to reset a user's rate limit.
   * Useful for testing.
   *
   * @param userId - User ID from JWT
   * @returns Success message
   */
  @UseGuards(JwtAuthGuard)
  @Post('rate-limit/reset')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset rate limit for current user' })
  async resetRateLimit(@UserId() userId: string) {
    await this.rateLimiterService.resetUserLimit(userId);

    return {
      message: 'Rate limit reset successfully',
      tip: 'You can now make 3 more AI requests',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test 9: Fallback testing
   *
   * Instructions for testing provider fallback.
   *
   * @returns Instructions
   */
  @Public()
  @Get('fallback/instructions')
  @ApiOperation({ summary: 'How to test provider fallback' })
  async fallbackInstructions() {
    return {
      message: 'How to test AI provider fallback',
      steps: [
        '1. Set AI_PROVIDER=openai in your .env',
        '2. Temporarily set OPENAI_API_KEY to an invalid key',
        '3. Restart the backend',
        '4. Make a request to /ai/test/completion/simple',
        '5. It should automatically fallback to Gemini',
        '6. Check the response.provider field - should be "gemini"',
        '7. Restore your valid OpenAI key and restart',
      ],
      notes: [
        'Fallback happens automatically and transparently',
        'Check backend logs to see fallback warnings',
        "If both providers fail, you'll get an error",
      ],
    };
  }
}
