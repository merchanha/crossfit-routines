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
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { WorkoutNote } from './entities/note.entity';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workout note' })
  @ApiResponse({
    status: 201,
    description: 'Note successfully created',
    type: WorkoutNote,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Routine not found',
  })
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @UserId() userId: string,
  ): Promise<WorkoutNote> {
    return this.notesService.create(createNoteDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user notes' })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: [WorkoutNote],
  })
  async findAll(@UserId() userId: string): Promise<WorkoutNote[]> {
    return this.notesService.findAll(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search notes by content' })
  @ApiQuery({ name: 'q', description: 'Search term' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [WorkoutNote],
  })
  async searchNotes(
    @Query('q') searchTerm: string,
    @UserId() userId: string,
  ): Promise<WorkoutNote[]> {
    return this.notesService.searchNotes(userId, searchTerm);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent notes' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of notes to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent notes retrieved successfully',
    type: [WorkoutNote],
  })
  async getRecent(
    @Query('limit') limit: string,
    @UserId() userId: string,
  ): Promise<WorkoutNote[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.notesService.getRecentNotes(userId, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get note statistics' })
  @ApiResponse({
    status: 200,
    description: 'Note statistics retrieved successfully',
  })
  async getStats(@UserId() userId: string) {
    return this.notesService.getNoteStats(userId);
  }

  @Get('by-routine/:routineId')
  @ApiOperation({ summary: 'Get notes by routine' })
  @ApiParam({ name: 'routineId', description: 'Routine ID' })
  @ApiResponse({
    status: 200,
    description: 'Notes for routine retrieved successfully',
    type: [WorkoutNote],
  })
  @ApiResponse({
    status: 404,
    description: 'Routine not found',
  })
  async findByRoutine(
    @Param('routineId') routineId: string,
    @UserId() userId: string,
  ): Promise<WorkoutNote[]> {
    return this.notesService.findByRoutine(routineId, userId);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get notes by specific date' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Notes for date retrieved successfully',
    type: [WorkoutNote],
  })
  async findByDate(
    @Query('date') date: string,
    @UserId() userId: string,
  ): Promise<WorkoutNote[]> {
    return this.notesService.findByDate(new Date(date), userId);
  }

  @Get('by-date-range')
  @ApiOperation({ summary: 'Get notes by date range' })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date in YYYY-MM-DD format',
  })
  @ApiQuery({ name: 'endDate', description: 'End date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Notes for date range retrieved successfully',
    type: [WorkoutNote],
  })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @UserId() userId: string,
  ): Promise<WorkoutNote[]> {
    return this.notesService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({
    status: 200,
    description: 'Note retrieved successfully',
    type: WorkoutNote,
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async findOne(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<WorkoutNote> {
    return this.notesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({
    status: 200,
    description: 'Note updated successfully',
    type: WorkoutNote,
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @UserId() userId: string,
  ): Promise<WorkoutNote> {
    return this.notesService.update(id, updateNoteDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({
    status: 204,
    description: 'Note deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  async remove(
    @Param('id') id: string,
    @UserId() userId: string,
  ): Promise<void> {
    return this.notesService.remove(id, userId);
  }
}
