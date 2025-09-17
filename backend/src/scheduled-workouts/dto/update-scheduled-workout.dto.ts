import { PartialType } from '@nestjs/swagger';
import { CreateScheduledWorkoutDto } from './create-scheduled-workout.dto';
import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
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
}
