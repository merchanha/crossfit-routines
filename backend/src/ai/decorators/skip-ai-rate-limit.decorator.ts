import { SetMetadata } from '@nestjs/common';
import { SKIP_AI_RATE_LIMIT_KEY } from '../guards/ai-rate-limit.guard';

/**
 * Decorator to skip AI rate limiting on specific endpoints
 *
 * Use this for endpoints that don't consume AI resources
 * or for testing purposes.
 *
 * **Example**:
 * ```typescript
 * @SkipAIRateLimit()
 * @Get('test')
 * async testEndpoint() {
 *   return { message: 'This endpoint is not rate limited' };
 * }
 * ```
 */
export const SkipAIRateLimit = () => SetMetadata(SKIP_AI_RATE_LIMIT_KEY, true);
