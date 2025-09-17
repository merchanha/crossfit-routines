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
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { Routine } from './entities/routine.entity';

@ApiTags('Routines')
@Controller('routines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new routine' })
  @ApiResponse({
    status: 201,
    description: 'Routine successfully created',
    type: Routine,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async create(
    @Body() createRoutineDto: CreateRoutineDto,
    @UserId() userId: string,
  ): Promise<Routine> {
    return this.routinesService.create(createRoutineDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user routines' })
  @ApiResponse({
    status: 200,
    description: 'Routines retrieved successfully',
    type: [Routine],
  })
  async findAll(@UserId() userId: string): Promise<Routine[]> {
    return this.routinesService.findAll(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search routines by name or description' })
  @ApiQuery({ name: 'q', description: 'Search term' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [Routine],
  })
  async searchRoutines(
    @Query('q') searchTerm: string,
    @UserId() userId: string,
  ): Promise<Routine[]> {
    return this.routinesService.searchRoutines(userId, searchTerm);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get routine statistics' })
  @ApiResponse({
    status: 200,
    description: 'Routine statistics retrieved successfully',
  })
  async getStats(@UserId() userId: string) {
    return this.routinesService.getRoutineStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get routine by ID' })
  @ApiParam({ name: 'id', description: 'Routine ID' })
  @ApiResponse({
    status: 200,
    description: 'Routine retrieved successfully',
    type: Routine,
  })
  @ApiResponse({
    status: 404,
    description: 'Routine not found',
  })
  async findOne(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<Routine> {
    return this.routinesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update routine by ID' })
  @ApiParam({ name: 'id', description: 'Routine ID' })
  @ApiResponse({
    status: 200,
    description: 'Routine updated successfully',
    type: Routine,
  })
  @ApiResponse({
    status: 404,
    description: 'Routine not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
    @UserId() userId: string,
  ): Promise<Routine> {
    return this.routinesService.update(id, updateRoutineDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete routine by ID' })
  @ApiParam({ name: 'id', description: 'Routine ID' })
  @ApiResponse({
    status: 204,
    description: 'Routine deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Routine not found',
  })
  async remove(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<void> {
    return this.routinesService.remove(id, userId);
  }
}
