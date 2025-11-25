/**
 * Enum for AI Provider Types
 *
 * Defines which AI service to use for requests.
 * - OPENAI: Primary provider (GPT-4, GPT-3.5-turbo)
 * - GEMINI: Fallback provider (Gemini Pro)
 */
export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

/**
 * Enum for AI Interaction Types
 *
 * Tracks what kind of AI operation was performed.
 * Used for analytics and debugging.
 */
export enum AIInteractionType {
  RECOMMENDATION = 'recommendation',
  ROUTINE_GENERATION = 'routine_generation',
  GENERATION = 'generation',
  CHAT = 'chat', // For future chat features
}

/**
 * Enum for AI Request Status
 *
 * Tracks the outcome of AI requests.
 */
export enum AIRequestStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  FALLBACK_USED = 'fallback_used', // When primary fails and fallback succeeds
  RATE_LIMITED = 'rate_limited',
  CACHED = 'cached', // Response served from cache
}
