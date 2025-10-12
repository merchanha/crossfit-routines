import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../services/rate-limiter.service';
import { AIInteractionType } from '../enums';

/**
 * Metadata key for skipping rate limit
 */
export const SKIP_AI_RATE_LIMIT_KEY = 'skipAIRateLimit';

/**
 * AI Rate Limit Guard
 *
 * A NestJS Guard that enforces AI usage quotas.
 * Apply this to routes that make AI requests.
 *
 * **Usage**:
 * ```typescript
 * @UseGuards(JwtAuthGuard, AIRateLimitGuard) // Must come after auth guard
 * @Post('recommendations/generate')
 * async generateRecommendations(@UserId() userId: string) {
 *   // This will only execute if rate limit check passes
 * }
 *
 * // To skip rate limiting on specific endpoints:
 * @SkipAIRateLimit()
 * @Get('test')
 * async testEndpoint() {
 *   // Rate limit not enforced
 * }
 * ```
 *
 * **Error Response**:
 * If rate limit is exceeded, returns 429 Too Many Requests:
 * ```json
 * {
 *   "statusCode": 429,
 *   "message": "Rate limit exceeded. You have used 3/3 requests. Limit resets at 2025-10-07T15:30:00Z",
 *   "error": "Too Many Requests",
 *   "rateLimit": {
 *     "limit": 3,
 *     "remaining": 0,
 *     "resetAt": "2025-10-07T15:30:00Z"
 *   }
 * }
 * ```
 */
@Injectable()
export class AIRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimiterService: RateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting should be skipped for this route
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_AI_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    // Get request and user
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;

    if (!userId) {
      throw new HttpException(
        'User ID not found in request',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check rate limit
    const rateLimitCheck = await this.rateLimiterService.checkRateLimit(userId);

    // Add rate limit info to response headers
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', rateLimitCheck.limit.toString());
    response.header(
      'X-RateLimit-Remaining',
      rateLimitCheck.remaining.toString(),
    );
    response.header('X-RateLimit-Reset', rateLimitCheck.resetAt.toISOString());

    if (!rateLimitCheck.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. You have used ${rateLimitCheck.limit}/${rateLimitCheck.limit} AI requests. Limit resets at ${rateLimitCheck.resetAt.toISOString()}`,
          error: 'Too Many Requests',
          rateLimit: {
            limit: rateLimitCheck.limit,
            remaining: rateLimitCheck.remaining,
            resetAt: rateLimitCheck.resetAt.toISOString(),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
