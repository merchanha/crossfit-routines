import { Injectable, Logger } from '@nestjs/common';
import { AIProviderFactory } from '../../ai/services/ai-provider.factory';
import { PerformanceAnalysisDto } from '../dto/performance-analysis.dto';
import { Routine } from '../../routines/entities/routine.entity';
import { RecommendationItemType } from '../entities/recommendation-item.entity';

export interface AIRecommendationResponse {
  existingRoutines: Array<{
    routineId: string;
    reasoning: string;
    priority: number;
  }>;
  newRoutines: Array<{
    name: string;
    description: string;
    estimatedDuration: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      notes?: string;
    }>;
    reasoning: string;
    priority: number;
  }>;
}

/**
 * Recommendation Builder Service
 *
 * Uses AI to generate personalized recommendations based on:
 * - Performance analysis
 * - User's existing routines
 * - Identified strengths and weaknesses
 */
@Injectable()
export class RecommendationBuilderService {
  private readonly logger = new Logger(RecommendationBuilderService.name);

  constructor(private readonly aiProviderFactory: AIProviderFactory) {}

  /**
   * Generate AI-powered recommendations
   */
  async generateRecommendations(
    performanceAnalysis: PerformanceAnalysisDto,
    existingRoutines: Routine[],
  ): Promise<AIRecommendationResponse> {
    this.logger.log('Generating AI recommendations');

    // Build prompt for AI
    const prompt = this.buildRecommendationPrompt(
      performanceAnalysis,
      existingRoutines,
    );

    try {
      // Use structured output to get JSON response
      const schema = {
        type: 'object',
        properties: {
          existingRoutines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                routineId: { type: 'string' },
                reasoning: { type: 'string' },
                priority: { type: 'number' },
              },
              required: ['routineId', 'reasoning', 'priority'],
            },
          },
          newRoutines: {
            type: 'array',
            items: {
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
                    required: ['name', 'sets', 'reps'],
                  },
                },
                reasoning: { type: 'string' },
                priority: { type: 'number' },
              },
              required: [
                'name',
                'description',
                'estimatedDuration',
                'exercises',
                'reasoning',
                'priority',
              ],
            },
          },
        },
        required: ['existingRoutines', 'newRoutines'],
      };

      const response =
        await this.aiProviderFactory.generateStructuredOutput<AIRecommendationResponse>(
          prompt,
          schema,
          {
            model: 'gpt-3.5-turbo', // Use cheaper model for recommendations
          },
        );

      this.logger.log(
        `AI generated ${response.data.existingRoutines.length} existing and ${response.data.newRoutines.length} new recommendations`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to generate AI recommendations', error);
      // Fallback to rule-based recommendations
      return this.generateFallbackRecommendations(
        performanceAnalysis,
        existingRoutines,
      );
    }
  }

  /**
   * Build the prompt for AI recommendation generation
   */
  private buildRecommendationPrompt(
    performanceAnalysis: PerformanceAnalysisDto,
    existingRoutines: Routine[],
  ): string {
    const routinesSummary = existingRoutines
      .map(
        (r) =>
          `- ${r.name}: ${r.description} (${r.estimatedDuration || 'N/A'} min, ${r.exercises.length} exercises)`,
      )
      .join('\n');

    return `You are a CrossFit coach analyzing a user's workout performance and providing personalized recommendations.

## User Performance Analysis:
- Total Workouts: ${performanceAnalysis.totalWorkouts}
- Completed Workouts: ${performanceAnalysis.completedWorkouts}
- Completion Rate: ${performanceAnalysis.completionRate}%
- Average Time Delta: ${performanceAnalysis.averageDelta} seconds (negative = faster than estimated, positive = slower)

## Strengths:
${performanceAnalysis.strengths.map((s) => `- ${s}`).join('\n')}

## Areas for Improvement:
${performanceAnalysis.weaknesses.map((w) => `- ${w}`).join('\n')}

## Performance Trends:
${performanceAnalysis.trends.improving ? '- Improving over time' : ''}
${performanceAnalysis.trends.declining ? '- Declining performance' : ''}
${performanceAnalysis.trends.stable ? '- Stable performance' : ''}

## User's Existing Routines:
${routinesSummary || 'No existing routines'}

## Task:
Based on this analysis, provide personalized recommendations:

1. **Existing Routines** (3-5 recommendations):
   - Select routines from the user's library that match their current level and address their weaknesses
   - Provide reasoning for each recommendation
   - Priority: 1-10 (10 = highest priority)

2. **New Routines** (2-3 recommendations):
   - Generate new CrossFit routines that address the user's weaknesses
   - Each routine should have:
     - Name (descriptive, motivating)
     - Description (what it targets)
     - Estimated duration in minutes
     - 4-6 exercises with sets, reps, and optional notes
   - Provide reasoning for each recommendation
   - Priority: 1-10 (10 = highest priority)

Focus on:
- Addressing weaknesses (e.g., if time management is weak, suggest shorter, focused routines)
- Building on strengths (e.g., if cardio is strong, suggest more challenging cardio routines)
- Progressive difficulty (if improving, suggest slightly harder routines)
- Variety (mix of cardio, strength, HIIT, etc.)

Return your response as JSON matching the specified schema.`;
  }

  /**
   * Fallback rule-based recommendations if AI fails
   */
  private generateFallbackRecommendations(
    performanceAnalysis: PerformanceAnalysisDto,
    existingRoutines: Routine[],
  ): AIRecommendationResponse {
    this.logger.log('Using fallback rule-based recommendations');

    const existingRoutineRecs = existingRoutines
      .slice(0, 3)
      .map((r, index) => ({
        routineId: r.id,
        reasoning: `This routine matches your current fitness level and can help you build consistency.`,
        priority: 8 - index,
      }));

    const newRoutines: AIRecommendationResponse['newRoutines'] = [];

    // Generate a routine based on weaknesses
    if (performanceAnalysis.weaknesses.some((w) => w.includes('Time'))) {
      newRoutines.push({
        name: 'Quick 20-Minute HIIT',
        description:
          'A fast-paced workout designed to improve time efficiency and pacing.',
        estimatedDuration: 20,
        exercises: [
          { name: 'Burpees', sets: 3, reps: 10 },
          { name: 'Mountain Climbers', sets: 3, reps: 20 },
          { name: 'Jump Squats', sets: 3, reps: 15 },
          {
            name: 'Plank Hold',
            sets: 3,
            reps: 30,
            notes: 'Hold for 30 seconds',
          },
        ],
        reasoning:
          'This shorter routine will help you improve time management and pacing accuracy.',
        priority: 9,
      });
    }

    if (performanceAnalysis.weaknesses.some((w) => w.includes('Cardio'))) {
      newRoutines.push({
        name: 'Cardio Endurance Builder',
        description:
          'A cardio-focused routine to improve endurance and pacing.',
        estimatedDuration: 30,
        exercises: [
          {
            name: 'Running',
            sets: 1,
            reps: 1,
            notes: '20 minutes steady pace',
          },
          { name: 'Jump Rope', sets: 3, reps: 100 },
          { name: 'High Knees', sets: 3, reps: 30 },
        ],
        reasoning:
          'This routine targets your cardio weaknesses and helps build endurance.',
        priority: 8,
      });
    }

    return {
      existingRoutines: existingRoutineRecs,
      newRoutines,
    };
  }
}
