import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratorService } from './generator.service';
import { GeneratorController } from './generator.controller';
import { YouTubeService } from './services/youtube.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { AIModule } from '../ai/ai.module';
import { RoutinesModule } from '../routines/routines.module';
import { Routine } from '../routines/entities/routine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Routine]), // For direct repository access
    AIModule, // For AIProviderFactory
    RoutinesModule, // For RoutinesService
  ],
  controllers: [GeneratorController],
  providers: [GeneratorService, YouTubeService, PromptBuilderService],
  exports: [GeneratorService], // Export if other modules need to use it
})
export class GeneratorModule {}
