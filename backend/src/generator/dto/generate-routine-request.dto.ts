import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratorPreferencesDto {
  @ApiProperty({
    description: 'Difficulty level',
    example: 'intermediate',
    required: false,
  })
  @IsOptional()
  @IsString()
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @ApiProperty({
    description: 'Equipment availability',
    example: 'minimal',
    required: false,
  })
  @IsOptional()
  @IsString()
  equipment?: 'minimal' | 'full' | 'none';

  @ApiProperty({
    description: 'Workout focus area',
    example: 'cardio',
    required: false,
  })
  @IsOptional()
  @IsString()
  focus?: string;
}

export class GenerateRoutineRequestDto {
  @ApiProperty({
    description: 'Natural language description of the desired workout',
    example: 'A cardio-focused workout for two people lasting 40 minutes',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    description: "Whether to save the generated routine to the user's library",
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveToLibrary?: boolean;

  @ApiProperty({
    description: 'Additional preferences for routine generation',
    type: GeneratorPreferencesDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GeneratorPreferencesDto)
  preferences?: GeneratorPreferencesDto;
}
