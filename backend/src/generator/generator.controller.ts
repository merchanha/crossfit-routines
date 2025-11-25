import {
  Controller,
  Post,
  Body,
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
import { GeneratorService } from './generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { AIRateLimitGuard } from '../ai/guards/ai-rate-limit.guard';
import { AIInteractionType } from '../ai/enums';
import { GenerateRoutineRequestDto } from './dto';
import { GeneratedRoutineResponseDto } from './dto/generate-routine-response.dto';

@ApiTags('generator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Ensure user is authenticated
@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  /**
   * Generate a workout routine from natural language description.
   * Applies AI rate limiting.
   * @param userId The ID of the authenticated user
   * @param request The generation request
   * @returns A GeneratedRoutineResponseDto with the complete routine
   */
  @Post('generate')
  @UseGuards(AIRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a workout routine from natural language' })
  @ApiResponse({
    status: 200,
    description: 'Routine generated successfully',
    type: GeneratedRoutineResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests (AI rate limit exceeded)',
  })
  async generateRoutine(
    @UserId() userId: string,
    @Body() request: GenerateRoutineRequestDto,
  ): Promise<GeneratedRoutineResponseDto> {
    return this.generatorService.generateRoutine(userId, request);
  }
}
