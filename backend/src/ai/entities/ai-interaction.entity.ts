import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AIProvider, AIInteractionType, AIRequestStatus } from '../enums';

/**
 * AI Interaction Entity
 *
 * Tracks all AI API requests for:
 * - Analytics and monitoring
 * - Cost tracking (tokens used)
 * - Debugging failed requests
 * - Rate limiting enforcement
 * - Audit trail
 *
 * **Use Cases**:
 * 1. Check how many requests a user has made today (rate limiting)
 * 2. Calculate total token usage and costs
 * 3. Debug why an AI request failed
 * 4. Analyze which providers are used most
 * 5. Monitor system health (success rate, response times)
 */
@Entity('ai_interactions')
@Index(['userId', 'createdAt']) // Fast queries for user's recent interactions
@Index(['interactionType', 'createdAt']) // Fast queries by type
export class AIInteraction extends BaseEntity {
  /**
   * User who made the request
   */
  @Column()
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Type of AI interaction
   * - 'recommendation': Generating workout recommendations
   * - 'generation': Creating a new routine from description
   * - 'chat': Future feature for conversational AI
   */
  @Column({
    type: 'varchar',
    length: 50,
  })
  interactionType: AIInteractionType;

  /**
   * The user's input prompt
   *
   * Examples:
   * - "Generate recommendations based on my workout history"
   * - "Create a 30-minute cardio workout for 2 people"
   */
  @Column('text')
  prompt: string;

  /**
   * The AI's response
   * Stored as JSONB for flexibility
   *
   * For structured outputs, this contains the complete JSON response
   * For completions, this contains the text response
   */
  @Column('jsonb', { nullable: true })
  response: any;

  /**
   * Which AI provider was used
   * - 'openai': OpenAI (GPT-4, GPT-3.5)
   * - 'gemini': Google Gemini
   */
  @Column({
    type: 'varchar',
    length: 20,
  })
  aiProvider: AIProvider;

  /**
   * Request status
   * - 'success': Request succeeded
   * - 'failed': Request failed
   * - 'fallback_used': Primary failed, fallback succeeded
   * - 'rate_limited': User exceeded quota
   * - 'cached': Response served from cache
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: AIRequestStatus.SUCCESS,
  })
  status: AIRequestStatus;

  /**
   * Total tokens consumed by this request
   * Used for cost tracking and analytics
   *
   * Approximate costs (as of 2025):
   * - GPT-4 Turbo: ~$0.03 per 1K tokens
   * - GPT-3.5 Turbo: ~$0.003 per 1K tokens
   * - Gemini Pro: Free tier available
   */
  @Column({ default: 0 })
  tokensUsed: number;

  /**
   * Response time in milliseconds
   * Used for performance monitoring
   */
  @Column({ nullable: true })
  responseTimeMs: number;

  /**
   * Error message if request failed
   * Useful for debugging
   */
  @Column('text', { nullable: true })
  errorMessage: string;

  /**
   * Additional metadata
   * Stored as JSONB for flexibility
   *
   * Can include:
   * - Model used (gpt-4-turbo-preview, gemini-pro)
   * - Temperature and other parameters
   * - Whether fallback was used
   * - Custom tags or categories
   */
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;
}
