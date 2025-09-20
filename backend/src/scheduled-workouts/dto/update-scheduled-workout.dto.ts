import { PartialType } from '@nestjs/swagger';
import { CreateScheduledWorkoutDto } from './create-scheduled-workout.dto';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateScheduledWorkoutDto extends PartialType(
  CreateScheduledWorkoutDto,
) {
  @ApiProperty({
    description: 'Whether the workout is completed',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty({
    description: 'Final duration of the workout in seconds',
    example: 1800,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalDuration?: number;
}
