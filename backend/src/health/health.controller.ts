import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Check if application is ready' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Check if application is alive' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('detailed')
  @Public()
  @ApiOperation({ summary: 'Get detailed health information' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information retrieved successfully',
  })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}
