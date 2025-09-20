import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ExerciseDto {
  @ApiProperty({
    description: 'Exercise ID',
    example: 'exercise-1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Exercise name',
    example: 'Push-ups',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Number of sets',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  sets?: number;

  @ApiProperty({
    description: 'Number of reps',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  reps?: number;

  @ApiProperty({
    description: 'Exercise notes',
    example: 'Keep your back straight',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoutineDto {
  @ApiProperty({
    description: 'Routine name',
    example: 'Upper Body Workout',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Routine description',
    example:
      'A comprehensive upper body workout targeting chest, back, and arms',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Video URL for the routine',
    example: 'https://youtube.com/watch?v=example',
    required: false,
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  estimatedDuration?: number;

  @ApiProperty({
    description: 'List of exercises in the routine',
    type: [ExerciseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}
