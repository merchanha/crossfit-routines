import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduledWorkoutDto {
  @ApiProperty({
    description: 'Routine ID to schedule',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  routineId: string;

  @ApiProperty({
    description: 'Date for the scheduled workout',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Notes for the scheduled workout',
    example: 'Focus on form today',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
