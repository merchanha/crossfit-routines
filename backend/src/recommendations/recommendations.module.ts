import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { Recommendation } from './entities/recommendation.entity';
import { RecommendationItem } from './entities/recommendation-item.entity';
import { PerformanceAnalyzerService } from './services/performance-analyzer.service';
import { RecommendationBuilderService } from './services/recommendation-builder.service';
import { ScheduledWorkout } from '../scheduled-workouts/entities/scheduled-workout.entity';
import { Routine } from '../routines/entities/routine.entity';
import { AIModule } from '../ai/ai.module';
import { RoutinesModule } from '../routines/routines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recommendation,
      RecommendationItem,
      ScheduledWorkout,
      Routine,
    ]),
    AIModule, // For AIProviderFactory
    RoutinesModule, // For RoutinesService
  ],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    PerformanceAnalyzerService,
    RecommendationBuilderService,
  ],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
