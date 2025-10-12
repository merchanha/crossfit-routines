import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInteraction } from '../entities';
import { AIInteractionType } from '../enums';

/**
 * AI Rate Limiter Service
 *
 * Enforces usage quotas to prevent abuse and control costs.
 *
 * **Current Limits** (configurable via environment):
 * - 3 requests per day per user (AI_RATE_LIMIT_REQUESTS_PER_DAY)
 * - Can be customized per interaction type
 *
 * **How it works**:
 * 1. Query ai_interactions table for user's requests in last 24 hours
 * 2. Compare against configured limit
 * 3. Return whether user can make another request
 *
 * **Future Enhancements**:
 * - User tiers (free: 3/day, premium: unlimited)
 * - Different limits per feature (recommendations vs generation)
 * - Token-based limits (total tokens per day)
 * - Sliding window vs fixed window
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly requestsPerDay: number;
  private readonly enableRateLimiting: boolean;

  constructor(
    @InjectRepository(AIInteraction)
    private readonly aiInteractionRepository: Repository<AIInteraction>,
    private readonly configService: ConfigService,
  ) {
    this.requestsPerDay =
      this.configService.get<number>('AI_RATE_LIMIT_REQUESTS_PER_DAY') || 3;

    this.enableRateLimiting =
      this.configService.get<string>('AI_ENABLE_RATE_LIMITING') !== 'false'; // Default: true

    this.logger.log(
      `🚦 Rate limiter initialized - ${this.requestsPerDay} requests/day, enabled: ${this.enableRateLimiting}`,
    );
  }

  /**
   * Check if user can make an AI request
   *
   * @param userId - User ID to check
   * @param interactionType - Type of request (optional, for future per-type limits)
   * @returns Object with allowed status and remaining requests
   */
  async checkRateLimit(
    userId: string,
    interactionType?: AIInteractionType,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: Date;
  }> {
    // If rate limiting is disabled, always allow
    if (!this.enableRateLimiting) {
      return {
        allowed: true,
        remaining: 999,
        limit: 999,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    // Calculate 24 hours ago
    const since = new Date();
    since.setHours(since.getHours() - 24);

    // Count user's requests in last 24 hours
    const query = this.aiInteractionRepository
      .createQueryBuilder('interaction')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.createdAt >= :since', { since })
      .andWhere('interaction.deletedAt IS NULL');

    // Optionally filter by interaction type
    if (interactionType) {
      query.andWhere('interaction.interactionType = :type', {
        type: interactionType,
      });
    }

    const count = await query.getCount();

    // Calculate reset time (24 hours from oldest request)
    const oldestRequest = await this.aiInteractionRepository.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const resetAt = oldestRequest
      ? new Date(oldestRequest.createdAt.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const remaining = Math.max(0, this.requestsPerDay - count);
    const allowed = count < this.requestsPerDay;

    if (!allowed) {
      this.logger.warn(
        `🚫 Rate limit exceeded for user ${userId}: ${count}/${this.requestsPerDay}`,
      );
    } else {
      this.logger.debug(
        `✅ Rate limit check passed for user ${userId}: ${count}/${this.requestsPerDay} (${remaining} remaining)`,
      );
    }

    return {
      allowed,
      remaining,
      limit: this.requestsPerDay,
      resetAt,
    };
  }

  /**
   * Record an AI interaction (for rate limiting tracking)
   *
   * This is called after a successful AI request to update the counter.
   *
   * @param userId - User ID
   * @param interaction - AI interaction to record
   */
  async recordInteraction(
    userId: string,
    interaction: Partial<AIInteraction>,
  ): Promise<AIInteraction> {
    const aiInteraction = this.aiInteractionRepository.create({
      userId,
      ...interaction,
    });

    return this.aiInteractionRepository.save(aiInteraction);
  }

  /**
   * Get user's AI usage statistics
   *
   * Useful for showing users their usage on a dashboard
   *
   * @param userId - User ID
   * @param days - Number of days to look back (default: 30)
   * @returns Usage statistics
   */
  async getUserUsageStats(
    userId: string,
    days: number = 30,
  ): Promise<{
    totalRequests: number;
    totalTokens: number;
    byType: Record<AIInteractionType, number>;
    byProvider: Record<string, number>;
    successRate: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const interactions = await this.aiInteractionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const recent = interactions.filter((i) => new Date(i.createdAt) >= since);

    // Calculate statistics
    const totalRequests = recent.length;
    const totalTokens = recent.reduce((sum, i) => sum + (i.tokensUsed || 0), 0);

    const byType: any = {};
    const byProvider: any = {};

    recent.forEach((interaction) => {
      byType[interaction.interactionType] =
        (byType[interaction.interactionType] || 0) + 1;
      byProvider[interaction.aiProvider] =
        (byProvider[interaction.aiProvider] || 0) + 1;
    });

    const successCount = recent.filter((i) => i.status === 'success').length;
    const successRate =
      totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;

    return {
      totalRequests,
      totalTokens,
      byType,
      byProvider,
      successRate,
    };
  }

  /**
   * Reset rate limit for a user (admin function)
   *
   * @param userId - User ID to reset
   */
  async resetUserLimit(userId: string): Promise<void> {
    // Soft delete all interactions from last 24 hours
    const since = new Date();
    since.setHours(since.getHours() - 24);

    await this.aiInteractionRepository
      .createQueryBuilder()
      .softDelete()
      .where('userId = :userId', { userId })
      .andWhere('createdAt >= :since', { since })
      .execute();

    this.logger.log(`✅ Rate limit reset for user ${userId}`);
  }
}
