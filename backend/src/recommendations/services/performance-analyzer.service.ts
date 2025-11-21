import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledWorkout } from '../../scheduled-workouts/entities/scheduled-workout.entity';
import { Routine } from '../../routines/entities/routine.entity';
import { PerformanceAnalysisDto } from '../dto/performance-analysis.dto';

/**
 * Performance Analyzer Service
 *
 * Analyzes user's workout history to identify:
 * - Performance patterns (estimatedDuration vs finalDuration)
 * - Strengths and weaknesses
 * - Trends (improving, declining, stable)
 * - Completion rates
 */
@Injectable()
export class PerformanceAnalyzerService {
  private readonly logger = new Logger(PerformanceAnalyzerService.name);

  constructor(
    @InjectRepository(ScheduledWorkout)
    private readonly scheduledWorkoutRepository: Repository<ScheduledWorkout>,
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
  ) {}

  /**
   * Analyze user's workout performance
   */
  async analyzePerformance(userId: string): Promise<PerformanceAnalysisDto> {
    this.logger.log(`Analyzing performance for user ${userId}`);

    // Fetch all scheduled workouts with routine data
    const workouts = await this.scheduledWorkoutRepository.find({
      where: { userId },
      relations: ['routine'],
      order: { date: 'DESC' },
    });

    if (workouts.length === 0) {
      this.logger.warn(`No workouts found for user ${userId}`);
      return this.getEmptyAnalysis();
    }

    // Filter completed workouts with both estimated and final duration
    const completedWorkouts = workouts.filter(
      (w) =>
        w.completed &&
        w.finalDuration !== null &&
        w.finalDuration !== undefined &&
        w.routine?.estimatedDuration !== null &&
        w.routine?.estimatedDuration !== undefined,
    );

    if (completedWorkouts.length === 0) {
      this.logger.warn(
        `No completed workouts with duration data for user ${userId}`,
      );
      return this.getEmptyAnalysis(workouts.length);
    }

    // Calculate average delta (negative = faster than estimated, positive = slower)
    const deltas = completedWorkouts.map((w) => {
      const estimated = (w.routine?.estimatedDuration || 0) * 60; // Convert minutes to seconds
      const final = w.finalDuration || 0;
      return final - estimated; // Positive = took longer, negative = finished faster
    });

    const averageDelta =
      deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;

    // Group by routine to analyze patterns
    const routineStats = new Map<
      string,
      {
        routineName: string;
        estimatedDuration: number;
        finalDurations: number[];
        completionCount: number;
      }
    >();

    completedWorkouts.forEach((w) => {
      if (!w.routine) return;

      const routineId = w.routine.id;
      const routineName = w.routine.name;
      const estimated = (w.routine.estimatedDuration || 0) * 60;

      if (!routineStats.has(routineId)) {
        routineStats.set(routineId, {
          routineName,
          estimatedDuration: estimated,
          finalDurations: [],
          completionCount: 0,
        });
      }

      const stats = routineStats.get(routineId)!;
      stats.finalDurations.push(w.finalDuration || 0);
      stats.completionCount++;
    });

    // Build workout history
    const workoutHistory = Array.from(routineStats.values()).map((stats) => {
      const averageFinalDuration =
        stats.finalDurations.reduce((sum, d) => sum + d, 0) /
        stats.finalDurations.length;
      const delta = averageFinalDuration - stats.estimatedDuration;

      return {
        routineName: stats.routineName,
        estimatedDuration: stats.estimatedDuration,
        averageFinalDuration,
        delta,
        completionCount: stats.completionCount,
      };
    });

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses(
      workoutHistory,
      averageDelta,
    );

    // Identify trends (compare recent vs older workouts)
    const trends = this.identifyTrends(completedWorkouts);

    // Calculate completion rate
    const completionRate = Math.round(
      (completedWorkouts.length / workouts.length) * 100,
    );

    const analysis: PerformanceAnalysisDto = {
      averageDelta: Math.round(averageDelta),
      totalWorkouts: workouts.length,
      completedWorkouts: completedWorkouts.length,
      completionRate,
      strengths,
      weaknesses,
      trends,
      workoutHistory,
    };

    this.logger.log(
      `Analysis complete: ${completedWorkouts.length} completed workouts, avg delta: ${Math.round(averageDelta)}s`,
    );

    return analysis;
  }

  /**
   * Identify user strengths and weaknesses based on performance
   */
  private identifyStrengthsAndWeaknesses(
    workoutHistory: Array<{
      routineName: string;
      estimatedDuration: number;
      averageFinalDuration: number;
      delta: number;
      completionCount: number;
    }>,
    averageDelta: number,
  ): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // If user consistently finishes faster than estimated
    if (averageDelta < -60) {
      // More than 1 minute faster on average
      strengths.push('Time efficiency');
      strengths.push('Pacing accuracy');
    }

    // If user consistently takes longer
    if (averageDelta > 120) {
      // More than 2 minutes slower on average
      weaknesses.push('Time management');
      weaknesses.push('Pacing estimation');
    }

    // Analyze completion rates
    const highCompletionRoutines = workoutHistory.filter(
      (w) => w.completionCount >= 3,
    );
    if (highCompletionRoutines.length >= 3) {
      strengths.push('Consistency');
      strengths.push('Routine adherence');
    }

    // Identify routine-specific patterns
    const cardioRoutines = workoutHistory.filter((w) =>
      w.routineName.toLowerCase().includes('cardio'),
    );
    const strengthRoutines = workoutHistory.filter(
      (w) =>
        w.routineName.toLowerCase().includes('strength') ||
        w.routineName.toLowerCase().includes('weight'),
    );

    if (cardioRoutines.length > 0) {
      const avgCardioDelta =
        cardioRoutines.reduce((sum, w) => sum + w.delta, 0) /
        cardioRoutines.length;
      if (avgCardioDelta < -30) {
        strengths.push('Cardio endurance');
      } else if (avgCardioDelta > 90) {
        weaknesses.push('Cardio pacing');
      }
    }

    if (strengthRoutines.length > 0) {
      const avgStrengthDelta =
        strengthRoutines.reduce((sum, w) => sum + w.delta, 0) /
        strengthRoutines.length;
      if (avgStrengthDelta < -30) {
        strengths.push('Strength training efficiency');
      } else if (avgStrengthDelta > 90) {
        weaknesses.push('Strength training pacing');
      }
    }

    // Default strengths/weaknesses if none identified
    if (strengths.length === 0) {
      strengths.push('Active participation');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('Performance tracking');
    }

    return { strengths, weaknesses };
  }

  /**
   * Identify performance trends (improving, declining, stable)
   */
  private identifyTrends(completedWorkouts: ScheduledWorkout[]): {
    improving?: boolean;
    declining?: boolean;
    stable?: boolean;
  } {
    if (completedWorkouts.length < 3) {
      return { stable: true };
    }

    // Sort by date (oldest first)
    const sorted = [...completedWorkouts].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Split into two halves
    const midpoint = Math.floor(sorted.length / 2);
    const older = sorted.slice(0, midpoint);
    const newer = sorted.slice(midpoint);

    // Calculate average delta for each half
    const olderDeltas = older
      .map((w) => {
        const estimated = (w.routine?.estimatedDuration || 0) * 60;
        const final = w.finalDuration || 0;
        return final - estimated;
      })
      .filter((d) => !isNaN(d));

    const newerDeltas = newer
      .map((w) => {
        const estimated = (w.routine?.estimatedDuration || 0) * 60;
        const final = w.finalDuration || 0;
        return final - estimated;
      })
      .filter((d) => !isNaN(d));

    if (olderDeltas.length === 0 || newerDeltas.length === 0) {
      return { stable: true };
    }

    const olderAvg =
      olderDeltas.reduce((sum, d) => sum + d, 0) / olderDeltas.length;
    const newerAvg =
      newerDeltas.reduce((sum, d) => sum + d, 0) / newerDeltas.length;

    // If newer average is significantly better (more negative or less positive)
    const improvement = olderAvg - newerAvg;

    if (improvement > 60) {
      // More than 1 minute improvement
      return { improving: true };
    } else if (improvement < -60) {
      // More than 1 minute decline
      return { declining: true };
    } else {
      return { stable: true };
    }
  }

  /**
   * Return empty analysis for users with no workout data
   */
  private getEmptyAnalysis(totalWorkouts = 0): PerformanceAnalysisDto {
    return {
      averageDelta: 0,
      totalWorkouts,
      completedWorkouts: 0,
      completionRate: 0,
      strengths: ['Getting started'],
      weaknesses: ['Build workout history'],
      trends: { stable: true },
      workoutHistory: [],
    };
  }
}
