import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ScheduledWorkoutsService } from './scheduled-workouts.service';
import { CreateScheduledWorkoutDto } from './dto/create-scheduled-workout.dto';
import { UpdateScheduledWorkoutDto } from './dto/update-scheduled-workout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ScheduledWorkout } from './entities/scheduled-workout.entity';

@ApiTags('Scheduled Workouts')
@Controller('scheduled-workouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduledWorkoutsController {
  constructor(
    private readonly scheduledWorkoutsService: ScheduledWorkoutsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a new workout' })
  @ApiResponse({
    status: 201,
    description: 'Workout successfully scheduled',
    type: ScheduledWorkout,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or workout already scheduled',
  })
  @ApiResponse({
    status: 404,
    description: 'Routine not found',
  })
  async create(
    @Body() createScheduledWorkoutDto: CreateScheduledWorkoutDto,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout> {
    return this.scheduledWorkoutsService.create(
      createScheduledWorkoutDto,
      userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all scheduled workouts' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workouts retrieved successfully',
    type: [ScheduledWorkout],
  })
  async findAll(@UserId() userId: string): Promise<ScheduledWorkout[]> {
    return this.scheduledWorkoutsService.findAll(userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming workouts' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of workouts to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming workouts retrieved successfully',
    type: [ScheduledWorkout],
  })
  async getUpcoming(
    @Query('limit') limit: string,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout[]> {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.scheduledWorkoutsService.getUpcomingWorkouts(userId, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get workout statistics' })
  @ApiResponse({
    status: 200,
    description: 'Workout statistics retrieved successfully',
  })
  async getStats(@UserId() userId: string) {
    return this.scheduledWorkoutsService.getWorkoutStats(userId);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get workouts by specific date' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Workouts for date retrieved successfully',
    type: [ScheduledWorkout],
  })
  async findByDate(
    @Query('date') date: string,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout[]> {
    return this.scheduledWorkoutsService.findByDate(new Date(date), userId);
  }

  @Get('by-week')
  @ApiOperation({ summary: 'Get workouts by week' })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date of week in YYYY-MM-DD format',
  })
  @ApiResponse({
    status: 200,
    description: 'Workouts for week retrieved successfully',
    type: [ScheduledWorkout],
  })
  async findByWeek(
    @Query('startDate') startDate: string,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout[]> {
    return this.scheduledWorkoutsService.findByWeek(
      new Date(startDate),
      userId,
    );
  }

  @Get('by-date-range')
  @ApiOperation({ summary: 'Get workouts by date range' })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date in YYYY-MM-DD format',
  })
  @ApiQuery({ name: 'endDate', description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Workouts for date range retrieved successfully',
    type: [ScheduledWorkout],
  })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout[]> {
    return this.scheduledWorkoutsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scheduled workout by ID' })
  @ApiParam({ name: 'id', description: 'Scheduled workout ID' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workout retrieved successfully',
    type: ScheduledWorkout,
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled workout not found',
  })
  async findOne(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout> {
    return this.scheduledWorkoutsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update scheduled workout by ID' })
  @ApiParam({ name: 'id', description: 'Scheduled workout ID' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workout updated successfully',
    type: ScheduledWorkout,
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled workout not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateScheduledWorkoutDto: UpdateScheduledWorkoutDto,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout> {
    return this.scheduledWorkoutsService.update(
      id,
      updateScheduledWorkoutDto,
      userId,
    );
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark workout as completed' })
  @ApiParam({ name: 'id', description: 'Scheduled workout ID' })
  @ApiQuery({ name: 'notes', required: false, description: 'Completion notes' })
  @ApiQuery({
    name: 'finalDuration',
    required: false,
    description: 'Final workout duration in seconds',
  })
  @ApiResponse({
    status: 200,
    description: 'Workout marked as completed',
    type: ScheduledWorkout,
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled workout not found',
  })
  async markCompleted(
    @Param('id') id: string,
    @Query('notes') notes: string,
    @Query('finalDuration') finalDuration: number,
    @UserId() userId: string,
  ): Promise<ScheduledWorkout> {
    return this.scheduledWorkoutsService.markCompleted(
      id,
      userId,
      notes,
      finalDuration,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete scheduled workout by ID' })
  @ApiParam({ name: 'id', description: 'Scheduled workout ID' })
  @ApiResponse({
    status: 204,
    description: 'Scheduled workout deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled workout not found',
  })
  async remove(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<void> {
    return this.scheduledWorkoutsService.remove(id, userId);
  }
}
