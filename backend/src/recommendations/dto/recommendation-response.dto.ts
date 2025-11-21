import { ApiProperty } from '@nestjs/swagger';
import { PerformanceAnalysisDto } from './performance-analysis.dto';

export class RecommendationItemDto {
  @ApiProperty({ description: 'Recommendation item ID' })
  id: string;

  @ApiProperty({
    description: 'Type of recommendation',
    enum: ['existing', 'ai_generated'],
  })
  itemType: 'existing' | 'ai_generated';

  @ApiProperty({
    description: 'Routine ID (if existing routine)',
    nullable: true,
  })
  routineId?: string;

  @ApiProperty({
    description: 'Reasoning for this recommendation',
    nullable: true,
  })
  reasoning?: string;

  @ApiProperty({ description: 'Priority score (higher = more important)' })
  priority: number;

  @ApiProperty({
    description: 'Routine data (for existing routines)',
    nullable: true,
  })
  routine?: {
    id: string;
    name: string;
    description: string;
    estimatedDuration?: number;
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: number;
      notes?: string;
    }>;
    videoUrl?: string;
  };

  @ApiProperty({
    description: 'AI-generated routine data (if not saved yet)',
    nullable: true,
  })
  routineData?: {
    name: string;
    description: string;
    estimatedDuration?: number;
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: number;
      notes?: string;
    }>;
    videoUrl?: string;
  };
}

export class RecommendationResponseDto {
  @ApiProperty({ description: 'Recommendation ID' })
  id: string;

  @ApiProperty({
    description: 'Performance analysis data',
    type: PerformanceAnalysisDto,
  })
  performanceAnalysis: PerformanceAnalysisDto;

  @ApiProperty({
    description: 'List of recommended routines',
    type: [RecommendationItemDto],
  })
  items: RecommendationItemDto[];

  @ApiProperty({ description: 'Recommendation status' })
  status: string;

  @ApiProperty({ description: 'When this recommendation expires' })
  expiresAt?: Date;

  @ApiProperty({ description: 'When this recommendation was created' })
  createdAt: Date;
}
