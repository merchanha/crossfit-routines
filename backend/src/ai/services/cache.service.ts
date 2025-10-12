import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * AI Cache Service
 *
 * Caches AI responses to reduce costs and improve performance.
 *
 * **Benefits**:
 * - Saves money (avoid repeated API calls for same prompts)
 * - Faster responses (serve from cache instantly)
 * - Reduces load on AI providers
 *
 * **How it works**:
 * 1. Generate cache key from prompt + options
 * 2. Check if response exists in cache
 * 3. If yes, return cached response
 * 4. If no, make AI request and cache result
 *
 * **Cache Strategy**:
 * - TTL: 24 hours (configurable)
 * - Key format: `ai:prompt_hash:options_hash`
 * - Prompt normalization (trim, lowercase for matching)
 *
 * **Future Enhancements**:
 * - Redis for distributed caching
 * - Semantic similarity matching (cache similar prompts)
 * - Per-user vs shared cache
 * - Cache warming (pre-cache popular requests)
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly enableCaching: boolean;
  private readonly cacheTTL: number; // Time to live in seconds

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.enableCaching =
      this.configService.get<string>('AI_ENABLE_CACHING') !== 'false'; // Default: true

    this.cacheTTL =
      this.configService.get<number>('AI_CACHE_TTL') || 24 * 60 * 60; // Default: 24 hours

    this.logger.log(
      `💾 AI Cache service initialized - enabled: ${this.enableCaching}, TTL: ${this.cacheTTL}s (${this.cacheTTL / 3600}h)`,
    );
  }

  /**
   * Get cached AI response
   *
   * @param prompt - The user's prompt
   * @param options - Additional options used in the request
   * @returns Cached response or null
   */
  async get<T = any>(prompt: string, options?: any): Promise<T | null> {
    if (!this.enableCaching) {
      return null;
    }

    const cacheKey = this.generateCacheKey(prompt, options);

    try {
      const cached = await this.cacheManager.get<T>(cacheKey);

      if (cached) {
        this.logger.debug(`✅ Cache HIT for key: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`❌ Cache MISS for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Set AI response in cache
   *
   * @param prompt - The user's prompt
   * @param response - The AI response to cache
   * @param options - Additional options used in the request
   * @param ttl - Optional custom TTL (in seconds)
   */
  async set<T = any>(
    prompt: string,
    response: T,
    options?: any,
    ttl?: number,
  ): Promise<void> {
    if (!this.enableCaching) {
      return;
    }

    const cacheKey = this.generateCacheKey(prompt, options);
    const cacheTTL = ttl || this.cacheTTL;

    try {
      // cache-manager v7 uses milliseconds for TTL
      await this.cacheManager.set(cacheKey, response, cacheTTL * 1000);
      this.logger.debug(
        `✅ Cached response for key: ${cacheKey} (TTL: ${cacheTTL}s)`,
      );
    } catch (error) {
      this.logger.error(`Error setting cache: ${error.message}`);
    }
  }

  /**
   * Delete cached response
   *
   * @param prompt - The user's prompt
   * @param options - Additional options used in the request
   */
  async delete(prompt: string, options?: any): Promise<void> {
    const cacheKey = this.generateCacheKey(prompt, options);

    try {
      await this.cacheManager.del(cacheKey);
      this.logger.debug(`✅ Deleted cache for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error deleting from cache: ${error.message}`);
    }
  }

  /**
   * Clear all AI caches
   *
   * Use with caution - this clears ALL cached responses
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.log(`✅ All AI caches cleared`);
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   *
   * Note: This is a simple implementation. For production,
   * use Redis with proper monitoring.
   *
   * @returns Basic cache stats
   */
  async getStats(): Promise<{
    enabled: boolean;
    ttl: number;
  }> {
    return {
      enabled: this.enableCaching,
      ttl: this.cacheTTL,
    };
  }

  /**
   * Generate a cache key from prompt and options
   *
   * **Strategy**:
   * 1. Normalize prompt (trim, lowercase for case-insensitive matching)
   * 2. Hash prompt and options for consistent key length
   * 3. Prefix with 'ai:' for namespacing
   *
   * @param prompt - The user's prompt
   * @param options - Additional options
   * @returns Cache key
   */
  private generateCacheKey(prompt: string, options?: any): string {
    // Normalize prompt (trim whitespace, lowercase)
    const normalizedPrompt = prompt.trim().toLowerCase();

    // Create hash of prompt
    const promptHash = this.hashString(normalizedPrompt);

    // If no options, just use prompt hash
    if (!options || Object.keys(options).length === 0) {
      return `ai:${promptHash}`;
    }

    // Create hash of options (sorted for consistency)
    const sortedOptions = this.sortObject(options);
    const optionsHash = this.hashString(JSON.stringify(sortedOptions));

    return `ai:${promptHash}:${optionsHash}`;
  }

  /**
   * Hash a string using SHA-256
   *
   * @param str - String to hash
   * @returns Hex hash
   */
  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16); // Use first 16 chars
  }

  /**
   * Sort object keys recursively for consistent hashing
   *
   * @param obj - Object to sort
   * @returns Sorted object
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObject(item));
    }

    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortObject(obj[key]);
      });

    return sorted;
  }
}
