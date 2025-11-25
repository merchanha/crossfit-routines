import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseDto } from '../../routines/dto/create-routine.dto';

export class GeneratedRoutineResponseDto {
  @ApiProperty({
    description: 'Temporary ID for the generated routine (before saving)',
    example: 'temp-uuid-123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Name of the generated routine',
    example: 'Partner Cardio Blitz',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the generated routine',
    example: 'High-intensity cardio workout designed for two partners...',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 40,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({
    description: 'YouTube video URL for the routine',
    example: 'https://youtube.com/watch?v=example',
    required: false,
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({
    description: 'List of exercises in the generated routine',
    type: [ExerciseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];

  @ApiProperty({
    description: 'Whether the routine was saved to the library',
    example: false,
  })
  @IsOptional()
  saved?: boolean;

  @ApiProperty({
    description: 'ID of the saved routine (if saved)',
    example: 'uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  routineId?: string;
}
