import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Recommendation,
  RecommendationStatus,
} from './entities/recommendation.entity';
import {
  RecommendationItem,
  RecommendationItemType,
} from './entities/recommendation-item.entity';
import { PerformanceAnalyzerService } from './services/performance-analyzer.service';
import { RecommendationBuilderService } from './services/recommendation-builder.service';
import { RoutinesService } from '../routines/routines.service';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

/**
 * Recommendations Service
 *
 * Main service that orchestrates:
 * 1. Performance analysis
 * 2. AI-powered recommendation generation
 * 3. Storing recommendations in database
 * 4. Retrieving recommendations for users
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(RecommendationItem)
    private readonly recommendationItemRepository: Repository<RecommendationItem>,
    private readonly performanceAnalyzer: PerformanceAnalyzerService,
    private readonly recommendationBuilder: RecommendationBuilderService,
    private readonly routinesService: RoutinesService,
  ) {}

  /**
   * Get or generate recommendations for a user
   */
  async getRecommendations(
    userId: string,
    forceRefresh = false,
  ): Promise<RecommendationResponseDto> {
    this.logger.log(`Getting recommendations for user ${userId}`);

    // Check for existing valid recommendation
    if (!forceRefresh) {
      const existing = await this.findValidRecommendation(userId);
      if (existing) {
        this.logger.log(`Returning existing recommendation ${existing.id}`);
        return this.mapToResponseDto(existing);
      }
    }

    // Generate new recommendations
    this.logger.log('Generating new recommendations');
    return this.generateRecommendations(userId);
  }

  /**
   * Generate new recommendations for a user
   */
  private async generateRecommendations(
    userId: string,
  ): Promise<RecommendationResponseDto> {
    // Step 1: Analyze performance
    const performanceAnalysis =
      await this.performanceAnalyzer.analyzePerformance(userId);

    // Step 2: Get user's existing routines
    const existingRoutines = await this.routinesService.findAll(userId);

    // Step 3: Generate AI recommendations
    const aiRecommendations =
      await this.recommendationBuilder.generateRecommendations(
        performanceAnalysis,
        existingRoutines,
      );

    // Step 4: Create recommendation entity
    const recommendation = this.recommendationRepository.create({
      userId,
      performanceAnalysis: {
        averageDelta: performanceAnalysis.averageDelta,
        totalWorkouts: performanceAnalysis.totalWorkouts,
        completedWorkouts: performanceAnalysis.completedWorkouts,
        strengths: performanceAnalysis.strengths,
        weaknesses: performanceAnalysis.weaknesses,
        trends: performanceAnalysis.trends,
      },
      status: RecommendationStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const savedRecommendation =
      await this.recommendationRepository.save(recommendation);

    // Step 5: Create recommendation items
    const items: RecommendationItem[] = [];

    // Add existing routine recommendations
    for (const rec of aiRecommendations.existingRoutines) {
      const routine = existingRoutines.find((r) => r.id === rec.routineId);
      if (routine) {
        const item = this.recommendationItemRepository.create({
          recommendationId: savedRecommendation.id,
          routineId: rec.routineId,
          itemType: RecommendationItemType.EXISTING,
          reasoning: rec.reasoning,
          priority: rec.priority,
        });
        items.push(item);
      }
    }

    // Add new AI-generated routine recommendations
    for (const rec of aiRecommendations.newRoutines) {
      const item = this.recommendationItemRepository.create({
        recommendationId: savedRecommendation.id,
        itemType: RecommendationItemType.AI_GENERATED,
        reasoning: rec.reasoning,
        priority: rec.priority,
        routineData: {
          name: rec.name,
          description: rec.description,
          estimatedDuration: rec.estimatedDuration,
          exercises: rec.exercises,
        },
      });
      items.push(item);
    }

    // Save all items
    await this.recommendationItemRepository.save(items);

    // Mark as viewed
    savedRecommendation.status = RecommendationStatus.VIEWED;
    await this.recommendationRepository.save(savedRecommendation);

    this.logger.log(
      `Generated ${items.length} recommendations for user ${userId}`,
    );

    // Return with relations loaded
    const fullRecommendation = await this.recommendationRepository.findOne({
      where: { id: savedRecommendation.id },
      relations: ['items', 'items.routine'],
    });

    if (!fullRecommendation) {
      throw new Error('Failed to retrieve saved recommendation');
    }

    return this.mapToResponseDto(fullRecommendation, performanceAnalysis);
  }

  /**
   * Find a valid (non-expired) recommendation for a user
   */
  private async findValidRecommendation(
    userId: string,
  ): Promise<Recommendation | null> {
    const now = new Date();

    // Find non-expired recommendations
    const recommendation = await this.recommendationRepository
      .createQueryBuilder('recommendation')
      .where('recommendation.userId = :userId', { userId })
      .andWhere('recommendation.status = :status', {
        status: RecommendationStatus.VIEWED,
      })
      .andWhere(
        '(recommendation.expiresAt IS NULL OR recommendation.expiresAt > :now)',
        { now },
      )
      .leftJoinAndSelect('recommendation.items', 'items')
      .leftJoinAndSelect('items.routine', 'routine')
      .orderBy('recommendation.createdAt', 'DESC')
      .getOne();

    return recommendation;
  }

  /**
   * Map recommendation entity to response DTO
   */
  private mapToResponseDto(
    recommendation: Recommendation,
    performanceAnalysis?: any,
  ): RecommendationResponseDto {
    return {
      id: recommendation.id,
      performanceAnalysis: performanceAnalysis || {
        averageDelta: recommendation.performanceAnalysis?.averageDelta || 0,
        totalWorkouts: recommendation.performanceAnalysis?.totalWorkouts || 0,
        completedWorkouts:
          recommendation.performanceAnalysis?.completedWorkouts || 0,
        completionRate: 0,
        strengths: recommendation.performanceAnalysis?.strengths || [],
        weaknesses: recommendation.performanceAnalysis?.weaknesses || [],
        trends: recommendation.performanceAnalysis?.trends || {},
        workoutHistory: [],
      },
      items: recommendation.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        routineId: item.routineId,
        reasoning: item.reasoning,
        priority: item.priority,
        routine: item.routine
          ? {
              id: item.routine.id,
              name: item.routine.name,
              description: item.routine.description,
              estimatedDuration: item.routine.estimatedDuration,
              exercises: item.routine.exercises,
              videoUrl: item.routine.videoUrl,
            }
          : undefined,
        routineData: item.routineData,
      })),
      status: recommendation.status,
      expiresAt: recommendation.expiresAt,
      createdAt: recommendation.createdAt,
    };
  }

  /**
   * Mark recommendation as dismissed
   */
  async dismissRecommendation(
    recommendationId: string,
    userId: string,
  ): Promise<void> {
    const recommendation = await this.recommendationRepository.findOne({
      where: { id: recommendationId, userId },
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    recommendation.status = RecommendationStatus.DISMISSED;
    await this.recommendationRepository.save(recommendation);
  }
}
