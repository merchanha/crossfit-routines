import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIProviderFactory } from '../ai/services/ai-provider.factory';
import { YouTubeService } from './services/youtube.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { GenerateRoutineRequestDto } from './dto/generate-routine-request.dto';
import { GeneratedRoutineResponseDto } from './dto/generate-routine-response.dto';
import { RoutinesService } from '../routines/routines.service';
import { CreateRoutineDto } from '../routines/dto/create-routine.dto';
import { Routine } from '../routines/entities/routine.entity';
import { AIInteractionType } from '../ai/enums';
import { v4 as uuidv4 } from 'uuid';

// Interface for AI-generated routine structure
interface AIRoutineResponse {
  name: string;
  description: string;
  estimatedDuration: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    notes?: string;
  }>;
}

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);

  constructor(
    private readonly aiProviderFactory: AIProviderFactory,
    private readonly youtubeService: YouTubeService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly routinesService: RoutinesService,
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
  ) {}

  /**
   * Generates a complete workout routine from a natural language description.
   * @param userId The ID of the user requesting the generation
   * @param request The generation request with prompt and preferences
   * @returns A GeneratedRoutineResponseDto with the complete routine
   */
  async generateRoutine(
    userId: string,
    request: GenerateRoutineRequestDto,
  ): Promise<GeneratedRoutineResponseDto> {
    this.logger.log(
      `Generating routine for user ${userId}: "${request.prompt}"`,
    );

    try {
      // Step 1: Build the AI prompt
      const prompt = this.promptBuilderService.buildPrompt(
        request.prompt,
        request.preferences,
      );
      const schema = this.promptBuilderService.buildOutputSchema();

      // Step 2: Generate routine structure using AI
      this.logger.debug('Calling AI provider to generate routine structure');
      const aiResponse =
        await this.aiProviderFactory.generateStructuredOutput<AIRoutineResponse>(
          prompt,
          schema,
          {
            maxTokens: 4000, // Increased to prevent JSON truncation
            systemPrompt:
              'You are an expert CrossFit and functional fitness coach. Generate realistic, safe, and effective workout routines. You MUST respond with ONLY valid JSON matching the provided schema.',
          },
        );

      const routineData = aiResponse.data;

      // Step 3: Validate the generated routine
      this.validateGeneratedRoutine(routineData);

      // Step 4: Find relevant YouTube video
      const exerciseNames = routineData.exercises.map((ex) => ex.name);
      const videoUrl = await this.youtubeService.searchVideoForRoutine(
        routineData.name,
        exerciseNames,
      );

      // Step 5: Map to response DTO
      const response: GeneratedRoutineResponseDto = {
        id: uuidv4(), // Temporary ID before saving
        name: routineData.name,
        description: routineData.description,
        estimatedDuration: routineData.estimatedDuration,
        videoUrl: videoUrl || undefined,
        exercises: routineData.exercises.map((ex) => ({
          id: uuidv4(),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes,
        })),
        saved: false,
      };

      // Step 6: Save to library if requested
      if (request.saveToLibrary) {
        const savedRoutine = await this.saveGeneratedRoutine(userId, response);
        response.saved = true;
        response.routineId = savedRoutine.id;
        response.id = savedRoutine.id; // Update ID to actual saved ID
      }

      this.logger.log(
        `✅ Successfully generated routine: "${routineData.name}" (${routineData.exercises.length} exercises)`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to generate routine: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Saves a generated routine to the user's library.
   * @param userId The ID of the user
   * @param generatedRoutine The generated routine to save
   * @returns The saved routine
   */
  async saveGeneratedRoutine(
    userId: string,
    generatedRoutine: GeneratedRoutineResponseDto,
  ) {
    const createRoutineDto: CreateRoutineDto = {
      name: generatedRoutine.name,
      description: generatedRoutine.description,
      estimatedDuration: generatedRoutine.estimatedDuration,
      videoUrl: generatedRoutine.videoUrl,
      exercises: generatedRoutine.exercises,
    };

    const savedRoutine = await this.routinesService.create(
      createRoutineDto,
      userId,
    );

    // Mark as AI-generated after saving
    savedRoutine.aiGenerated = true;
    return this.routineRepository.save(savedRoutine);
  }

  /**
   * Validates a generated routine to ensure it meets quality standards.
   * @param routine The AI-generated routine data
   * @throws Error if validation fails
   */
  private validateGeneratedRoutine(routine: AIRoutineResponse): void {
    if (!routine.name || routine.name.trim().length === 0) {
      throw new Error('Generated routine must have a name');
    }

    if (!routine.description || routine.description.trim().length === 0) {
      throw new Error('Generated routine must have a description');
    }

    if (!routine.estimatedDuration || routine.estimatedDuration < 1) {
      throw new Error(
        'Generated routine must have a valid estimated duration (at least 1 minute)',
      );
    }

    if (!routine.exercises || routine.exercises.length < 4) {
      throw new Error('Generated routine must have at least 4 exercises');
    }

    if (routine.exercises.length > 8) {
      throw new Error('Generated routine must have at most 8 exercises');
    }

    // Validate each exercise
    for (const exercise of routine.exercises) {
      if (!exercise.name || exercise.name.trim().length === 0) {
        throw new Error('All exercises must have a name');
      }

      if (!exercise.sets || exercise.sets < 1) {
        throw new Error(`Exercise "${exercise.name}" must have at least 1 set`);
      }

      if (!exercise.reps || exercise.reps < 1) {
        throw new Error(`Exercise "${exercise.name}" must have at least 1 rep`);
      }
    }

    // Check for duplicate exercise names
    const exerciseNames = routine.exercises.map((ex) =>
      ex.name.toLowerCase().trim(),
    );
    const uniqueNames = new Set(exerciseNames);
    if (uniqueNames.size !== exerciseNames.length) {
      throw new Error('Generated routine contains duplicate exercise names');
    }
  }
}
