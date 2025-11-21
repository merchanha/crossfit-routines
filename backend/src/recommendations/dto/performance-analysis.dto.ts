import { ApiProperty } from '@nestjs/swagger';

export class PerformanceAnalysisDto {
  @ApiProperty({
    description:
      'Average difference between estimated and final duration (in seconds)',
    example: -120,
  })
  averageDelta: number;

  @ApiProperty({
    description: 'Total number of scheduled workouts',
    example: 25,
  })
  totalWorkouts: number;

  @ApiProperty({
    description: 'Number of completed workouts',
    example: 18,
  })
  completedWorkouts: number;

  @ApiProperty({
    description: 'Completion rate percentage',
    example: 72,
  })
  completionRate: number;

  @ApiProperty({
    description: 'User strengths identified from workout history',
    example: ['Cardio endurance', 'Consistency'],
    type: [String],
  })
  strengths: string[];

  @ApiProperty({
    description: 'Areas for improvement identified',
    example: ['Time management', 'Strength training'],
    type: [String],
  })
  weaknesses: string[];

  @ApiProperty({
    description: 'Performance trends',
    example: { improving: true, declining: false, stable: false },
  })
  trends: {
    improving?: boolean;
    declining?: boolean;
    stable?: boolean;
  };

  @ApiProperty({
    description: 'Workout history summary',
    example: [
      {
        routineName: 'Morning Cardio',
        estimatedDuration: 1800,
        averageFinalDuration: 1950,
        delta: 150,
        completionCount: 5,
      },
    ],
    type: [Object],
  })
  workoutHistory: Array<{
    routineName: string;
    estimatedDuration: number;
    averageFinalDuration: number;
    delta: number;
    completionCount: number;
  }>;
}
