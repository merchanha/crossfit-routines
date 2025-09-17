import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({
    description: 'Total number of workouts completed',
    example: 25,
  })
  totalWorkouts: number;

  @ApiProperty({
    description: 'Current workout streak in days',
    example: 7,
  })
  currentStreak: number;

  @ApiProperty({
    description: 'Most frequently used exercise',
    example: 'Push-ups',
  })
  favoriteExercise: string;
}
