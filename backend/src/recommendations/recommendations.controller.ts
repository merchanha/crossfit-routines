import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { AIRateLimitGuard } from '../ai/guards/ai-rate-limit.guard';
import { RecommendationsService } from './recommendations.service';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

@ApiTags('recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @UseGuards(AIRateLimitGuard) // Apply rate limiting
  @ApiOperation({
    summary: 'Get personalized workout recommendations',
    description:
      'Returns AI-powered recommendations based on user workout history and performance analysis. Uses rate limiting (3 requests/day).',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
    type: RecommendationResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded (3 requests/day)',
  })
  async getRecommendations(
    @UserId() userId: string,
    @Query('refresh') refresh?: string,
  ): Promise<RecommendationResponseDto> {
    const forceRefresh = refresh === 'true';
    return this.recommendationsService.getRecommendations(userId, forceRefresh);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Dismiss a recommendation',
    description: 'Marks a recommendation as dismissed',
  })
  @ApiResponse({
    status: 204,
    description: 'Recommendation dismissed successfully',
  })
  async dismissRecommendation(
    @Param('id') recommendationId: string,
    @UserId() userId: string,
  ): Promise<void> {
    return this.recommendationsService.dismissRecommendation(
      recommendationId,
      userId,
    );
  }
}
